import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertUserSchema, insertArPaymentSchema, insertArAutoBillRuleSchema } from "@shared/schema";
import { hasPermission, hasModuleAccess, canManageRole, type Role, type Module, type Permission } from "@shared/rbac";
import jwt from "jsonwebtoken";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const JWT_SECRET = process.env.SESSION_SECRET || "super_secret_jwt_key_123";

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePassword(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const buf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(hashed, "hex"), buf);
}

function generateTemporaryPassword() {
  return randomBytes(4).toString("hex");
}

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    (req as any).user = user;
    next();
  });
};

// Role-based authorization middleware
const requirePermission = (module: Module, permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Map legacy 'admin' role to 'main_admin'
    const role = (user.role === 'admin' ? 'main_admin' : user.role) as Role;

    if (!hasPermission(role, module, permission)) {
      return res.status(403).json({
        error: "Forbidden",
        message: `Requires ${permission} permission on ${module}`
      });
    }
    next();
  };
};

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || (user.role !== 'admin' && user.role !== 'main_admin')) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

const requireFinanceAccess = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const role = (user.role === 'admin' ? 'main_admin' : user.role) as Role;

  if (!hasModuleAccess(role, 'fees') && !hasModuleAccess(role, 'financial_engine')) {
    return res.status(403).json({ error: "Finance access required" });
  }
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // --- Auth ---
  app.post(api.auth.login.path, async (req, res) => {
    const { username, password } = req.body;
    // support login via username (ID) or email
    const user = await storage.getUserByIdentifier(username);

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Role-based token generation
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user });
  });

  // Google Login Structure (Placeholder for frontend sync)
  app.post("/api/auth/google", async (req, res) => {
    const { googleId, email, name, avatarUrl } = req.body;

    let user = await storage.getUserByGoogleId(googleId);

    if (!user) {
      // If no user linked to Google, check by email
      user = await storage.getUserByIdentifier(email);

      if (user) {
        // Link existing account to Google
        // Logic to update user with googleId and avatarUrl would go here
      } else {
        // Create new user or return error depending on institution policy
        return res.status(404).json({ message: "No institutional account linked to this Google ID" });
      }
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user });
  });

  // NEW: Change Password Route
  app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.id;
    const user = await storage.getUser(userId);

    if (!user) return res.sendStatus(404);

    // Verify old password
    if (!(await comparePassword(currentPassword, user.password))) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Hash and save new password
    const hashedPassword = await hashPassword(newPassword);
    await storage.updateUserPassword(userId, hashedPassword);

    res.json({ message: "Password updated successfully" });
  });

  app.get(api.auth.me.path, authenticateToken, async (req, res) => {
    const userId = (req as any).user.id;
    const user = await storage.getUser(userId);
    if (!user) return res.sendStatus(404);
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // --- Users ---
  // --- Users ---
  // Generic user creation (e.g. for Principals, Accountants who don't have separate profile tables yet)
  // Protected: Only Main Admin should create administrative staff
  app.post(api.users.create.path, authenticateToken, requireAdmin, async (req, res) => {
    try {
      const input = insertUserSchema.parse(req.body);
      const creatorRole = (req as any).user.role;

      // Strict Role Creation Rules
      if (input.role === 'main_admin' && creatorRole !== 'main_admin') {
        return res.status(403).json({ message: "Only Main Admin can create other Admins" });
      }

      if (input.role === 'principal' && creatorRole !== 'main_admin') {
        return res.status(403).json({ message: "Only Main Admin can create Principals" });
      }

      // Principals aren't supposed to use this route for teachers/students usually, 
      // but if they do, block creating higher roles
      if (['accountant'].includes(input.role) && creatorRole !== 'main_admin') {
        return res.status(403).json({ message: "Only Main Admin can create Accountants" });
      }

      input.password = await hashPassword(input.password);
      const user = await storage.createUser(input);
      res.status(201).json(user);
    } catch (e: any) {
      if (e.message?.includes("already exists")) {
        return res.status(409).json({ message: "Username already exists" });
      }
      res.status(400).json({ message: "Validation error" });
    }
  });

  // --- Students ---
  app.get(api.students.list.path, authenticateToken, async (req, res) => {
    const classId = req.query.classId ? Number(req.query.classId) : undefined;
    const status = req.query.status as any;
    const students = await storage.getStudents(classId, status);
    res.json(students);
  });

  app.post(api.students.approve.path, authenticateToken, async (req, res) => {
    const userRole = (req as any).user.role;
    const allowedRoles = ['admin', 'main_admin', 'principal'];
    if (!allowedRoles.includes(userRole)) return res.sendStatus(403);
    const { status } = req.body;
    await storage.updateStudentStatus(Number((req.params.id as string)), status);
    res.json({ message: `Student ${status}` });
  });

  app.post(api.students.create.path, authenticateToken, async (req, res) => {
    // RBAC: Accountant can create students (and Principal/Admin)
    const userRole = (req as any).user.role;
    // Map legacy 'admin' to 'main_admin' for check
    const normalizedRole = userRole === 'admin' ? 'main_admin' : userRole;

    const allowedRoles = ['main_admin', 'principal', 'accountant'];
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(403).json({ message: "Insufficient permissions to create students" });
    }
    try {
      const { user: userData, ...studentDetails } = req.body;

      // Check for existing username
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const tempPassword = generateTemporaryPassword();
      const hashedPassword = await hashPassword(tempPassword);

      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
        role: 'student',
        mustChangePassword: true
      });

      const newStudent = await storage.createStudent({
        ...studentDetails,
        userId: newUser.id
      });

      res.status(201).json({
        ...newStudent,
        user: newUser,
        generatedPassword: tempPassword
      });
    } catch (e: any) {
      console.error("Student creation error:", e);
      res.status(400).json({ message: e.message || "Failed to create student" });
    }
  });

  app.get(api.students.get.path, authenticateToken, async (req, res) => {
    const student = await storage.getStudent(Number((req.params.id as string)));
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  });

  // --- Teachers ---
  app.get(api.teachers.list.path, authenticateToken, async (req, res) => {
    const teachers = await storage.getTeachers();
    res.json(teachers);
  });

  app.post(api.teachers.create.path, authenticateToken, async (req, res) => {
    // RBAC: Principal and Admin can create teachers (but NOT Accountant)
    const userRole = (req as any).user.role;
    const normalizedRole = userRole === 'admin' ? 'main_admin' : userRole;

    const allowedRoles = ['main_admin', 'principal'];
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(403).json({ message: "Only Principal and Admin can create teachers" });
    }
    try {
      const { user: userData, ...teacherDetails } = req.body;

      // Check for existing username
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const tempPassword = generateTemporaryPassword();
      const hashedPassword = await hashPassword(tempPassword);

      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
        role: 'teacher',
        mustChangePassword: true
      });

      const newTeacher = await storage.createTeacher({
        ...teacherDetails,
        userId: newUser.id
      });

      res.status(201).json({
        ...newTeacher,
        user: newUser,
        generatedPassword: tempPassword
      });
    } catch (e: any) {
      console.error("Teacher creation error:", e);
      res.status(400).json({ message: e.message || "Failed to create teacher" });
    }
  });

  // --- Classes ---
  app.get(api.classes.list.path, authenticateToken, async (req, res) => {
    const classes = await storage.getClasses();
    res.json(classes);
  });

  app.post(api.classes.create.path, authenticateToken, async (req, res) => {
    try {
      const cls = await storage.createClass(req.body);
      res.status(201).json(cls);
    } catch (e) {
      res.status(400).json({ message: "Error creating class" });
    }
  });

  // --- Attendance ---
  app.get(api.attendance.list.path, authenticateToken, async (req, res) => {
    const classId = req.query.classId ? Number(req.query.classId) : undefined;
    const date = req.query.date as string | undefined;
    const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
    const records = await storage.getAttendance(classId, date, studentId);
    res.json(records);
  });

  app.post(api.attendance.mark.path, authenticateToken, async (req, res) => {
    try {
      const records = req.body;
      await storage.markAttendance(records);
      res.status(201).json({ message: "Attendance marked", count: records.length });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Error marking attendance" });
    }
  });

  // --- Fees ---
  app.get(api.fees.list.path, authenticateToken, async (req, res) => {
    const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
    const feesList = await storage.getFees(studentId);
    res.json(feesList);
  });

  app.post(api.fees.create.path, authenticateToken, async (req, res) => {
    try {
      const fee = await storage.createFee(req.body);
      res.status(201).json(fee);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Error creating fee" });
    }
  });

  app.patch(api.fees.update.path, authenticateToken, async (req, res) => {
    try {
      const id = Number((req.params.id as string));
      const { status } = req.body;
      const updated = await storage.updateFeeStatus(id, status);
      if (!updated) {
        return res.status(404).json({ message: "Fee not found" });
      }
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Error updating fee" });
    }
  });

  app.get(api.fees.stats.path, authenticateToken, async (req, res) => {
    const stats = await storage.getFeeStats();
    res.json(stats);
  });

  // --- Exams ---
  app.get(api.exams.list.path, authenticateToken, async (req, res) => {
    const classId = req.query.classId ? Number(req.query.classId) : undefined;
    const examsList = await storage.getExams(classId);
    res.json(examsList);
  });

  app.post(api.exams.create.path, authenticateToken, async (req, res) => {
    try {
      const exam = await storage.createExam(req.body);
      res.status(201).json(exam);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Error creating exam" });
    }
  });

  // --- Marks ---
  app.get(api.marks.list.path, authenticateToken, async (req, res) => {
    const examId = req.query.examId ? Number(req.query.examId) : undefined;
    const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
    const marksList = await storage.getMarks(examId, studentId);
    res.json(marksList);
  });

  app.post(api.marks.create.path, authenticateToken, async (req, res) => {
    try {
      const mark = await storage.createMark(req.body);
      res.status(201).json(mark);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Error creating mark" });
    }
  });

  app.patch(api.marks.update.path, authenticateToken, async (req, res) => {
    try {
      const id = Number((req.params.id as string));
      const { score } = req.body;
      const updated = await storage.updateMark(id, score);
      if (!updated) {
        return res.status(404).json({ message: "Mark not found" });
      }
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Error updating mark" });
    }
  });

  // --- Timetable ---
  app.get(api.timetable.list.path, authenticateToken, async (req, res) => {
    const classId = req.query.classId ? Number(req.query.classId) : undefined;
    const slots = await storage.getTimetable(classId);
    res.json(slots);
  });

  app.post(api.timetable.create.path, authenticateToken, async (req, res) => {
    try {
      const slot = await storage.createTimetableSlot(req.body);
      res.status(201).json(slot);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Error creating timetable slot" });
    }
  });

  app.delete(api.timetable.delete.path, authenticateToken, async (req, res) => {
    try {
      const id = Number((req.params.id as string));
      await storage.deleteTimetableSlot(id);
      res.json({ message: "Deleted" });
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Error deleting slot" });
    }
  });

  // --- Academic Periods ---
  app.get("/api/academic-periods", authenticateToken, async (req, res) => {
    const periods = await storage.getAcademicPeriods();
    res.json(periods);
  });

  app.post("/api/academic-periods", authenticateToken, async (req, res) => {
    if ((req as any).user.role !== 'admin') return res.sendStatus(403);
    try {
      const period = await storage.createAcademicPeriod(req.body);
      res.status(201).json(period);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Error creating Academic Period" });
    }
  });

  app.patch("/api/academic-periods/:id/toggle", authenticateToken, async (req, res) => {
    if ((req as any).user.role !== 'admin') return res.sendStatus(403);
    try {
      const id = Number((req.params.id as string));
      const { isActive } = req.body;
      await storage.toggleAcademicPeriod(id, isActive);
      res.json({ message: "Updated successfully" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // --- Course History ---
  app.get("/api/students/:id/course-history", authenticateToken, async (req, res) => {
    const studentId = Number((req.params.id as string));
    const history = await storage.getStudentCourseHistory(studentId);
    res.json(history);
  });

  // ========================================
  // FINANCIAL ENGINE ROUTES
  // ========================================

  // Student Accounts
  app.get("/api/students/:id/account", authenticateToken, async (req, res) => {
    const studentId = Number((req.params.id as string));
    let account = await storage.getStudentAccount(studentId);
    if (!account) {
      // Auto-create account if doesn't exist
      account = await storage.createStudentAccount({ studentId, currentBalance: 0 });
    }
    res.json(account);
  });

  app.patch("/api/students/:id/account/hold", authenticateToken, async (req, res) => {
    if ((req as any).user.role !== 'admin') return res.sendStatus(403);
    const studentId = Number((req.params.id as string));
    const { hasHold } = req.body;
    await storage.setFinancialHold(studentId, hasHold);
    res.json({ message: "Hold status updated" });
  });

  // Fee Structures
  app.get("/api/fee-structures", authenticateToken, async (req, res) => {
    const periodId = req.query.academicPeriodId ? Number(req.query.academicPeriodId) : undefined;
    const structures = await storage.getFeeStructures(periodId);
    res.json(structures);
  });

  app.post("/api/fee-structures", authenticateToken, async (req, res) => {
    if ((req as any).user.role !== 'admin') return res.sendStatus(403);
    try {
      const structure = await storage.createFeeStructure(req.body);
      res.status(201).json(structure);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Enrollment History
  app.get("/api/students/:id/enrollments", authenticateToken, async (req, res) => {
    const studentId = Number((req.params.id as string));
    const enrollments = await storage.getEnrollmentHistory(studentId);
    res.json(enrollments);
  });

  app.post("/api/enrollments", authenticateToken, async (req, res) => {
    try {
      const enrollment = await storage.createEnrollment(req.body);
      res.status(201).json(enrollment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/enrollments/:id/status", authenticateToken, async (req, res) => {
    const id = Number((req.params.id as string));
    const { status } = req.body;
    await storage.updateEnrollmentStatus(id, status);
    res.json({ message: "Enrollment status updated, recalculation flagged" });
  });

  // Financial Transactions
  app.get("/api/accounts/:id/transactions", authenticateToken, async (req, res) => {
    const accountId = Number((req.params.id as string));
    const transactions = await storage.getFinancialTransactions(accountId);
    res.json(transactions);
  });

  app.post("/api/transactions", authenticateToken, async (req, res) => {
    try {
      const tx = await storage.createFinancialTransaction(req.body);
      // Update account balance
      const account = await storage.getStudentAccount(req.body.studentId);
      if (account) {
        const adjustment = tx.transactionType === 'credit' ? -tx.amount : tx.amount;
        await storage.updateStudentBalance(account.id, account.currentBalance + adjustment);
      }
      res.status(201).json(tx);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Financial Aid Awards
  app.get("/api/students/:id/aid", authenticateToken, async (req, res) => {
    const studentId = Number((req.params.id as string));
    const awards = await storage.getFinancialAidAwards(studentId);
    res.json(awards);
  });

  app.post("/api/aid-awards", authenticateToken, async (req, res) => {
    if ((req as any).user.role !== 'admin') return res.sendStatus(403);
    try {
      const award = await storage.createFinancialAidAward(req.body);
      res.status(201).json(award);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/aid-awards/:id/status", authenticateToken, async (req, res) => {
    if ((req as any).user.role !== 'admin') return res.sendStatus(403);
    const id = Number((req.params.id as string));
    const { status } = req.body;
    await storage.updateAidStatus(id, status);
    res.json({ message: "Aid status updated" });
  });

  // Bill Calculation Engine
  app.get("/api/students/:id/bill", authenticateToken, async (req, res) => {
    const studentId = Number((req.params.id as string));
    const bill = await storage.calculateStudentBill(studentId);
    res.json(bill);
  });

  // ========================================
  // ADVANCED FINANCE MODULE ROUTES
  // ========================================

  // --- Income Management ---
  // RBAC: Accountant/Admin can read/write.
  app.get("/api/finance/income", authenticateToken, requireFinanceAccess, async (req, res) => {
    const periodId = req.query.periodId ? Number(req.query.periodId) : undefined;
    const type = req.query.type as string;
    const incomes = await storage.getFinIncomes(periodId, type);
    res.json(incomes);
  });

  app.post("/api/finance/income", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      // Ensure user has specific write permission
      if (!hasPermission((req as any).user.role, 'financial_engine', 'write')) {
        return res.status(403).json({ message: "Write access required" });
      }
      const income = await storage.createFinIncome(req.body);
      res.status(201).json(income);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Error creating income record" });
    }
  });

  // --- Expense Management ---
  app.get("/api/finance/expenses", authenticateToken, requireFinanceAccess, async (req, res) => {
    const periodId = req.query.periodId ? Number(req.query.periodId) : undefined;
    const category = req.query.category as string;
    const expenses = await storage.getFinExpenses(periodId, category);
    res.json(expenses);
  });

  app.post("/api/finance/expenses", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      if (!hasPermission((req as any).user.role, 'financial_engine', 'write')) {
        return res.status(403).json({ message: "Write access required" });
      }
      const expense = await storage.createFinExpense(req.body);
      res.status(201).json(expense);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // --- Asset Management ---
  app.get("/api/finance/assets", authenticateToken, requireFinanceAccess, async (req, res) => {
    const type = req.query.type as string; // fixed, current
    const assets = await storage.getFinAssets(type);
    res.json(assets);
  });

  app.post("/api/finance/assets", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      if (!hasPermission((req as any).user.role, 'financial_engine', 'write')) {
        return res.status(403).json({ message: "Write access required" });
      }
      const asset = await storage.createFinAsset(req.body);
      res.status(201).json(asset);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // --- Budgeting ---
  app.get("/api/finance/budgets", authenticateToken, requireFinanceAccess, async (req, res) => {
    const periodId = req.query.periodId ? Number(req.query.periodId) : undefined;
    const budgets = await storage.getFinBudgets(periodId);
    res.json(budgets);
  });

  app.post("/api/finance/budgets", authenticateToken, requireFinanceAccess, async (req, res) => {
    // Only Admin/Accountant with APPROVE permission can typically set budgets
    try {
      if (!hasPermission((req as any).user.role, 'financial_engine', 'approve')) {
        return res.status(403).json({ message: "Approval/Budgeting permissions required" });
      }
      const budget = await storage.createFinBudget(req.body);
      res.status(201).json(budget);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // --- Compliance ---
  app.get("/api/finance/compliance", authenticateToken, requireFinanceAccess, async (req, res) => {
    const items = await storage.getFinComplianceItems();
    res.json(items);
  });

  app.post("/api/finance/compliance", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const item = await storage.createFinCompliance(req.body);
      res.status(201).json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // --- Student Ledger (Advanced Finance) ---
  app.get("/api/finance/student-ledger/:studentId", authenticateToken, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId as string);
      if (isNaN(studentId)) return res.status(400).json({ message: "Invalid student ID" });

      // 1. Get Student Details (to find linked User ID)
      const student = await storage.getStudent(studentId);
      if (!student) return res.status(404).json({ message: "Student not found" });

      // 2. Get Fees (Charges/Debits) - Linked by studentId
      const fees = await storage.getStudentFees(studentId);

      // 3. Get Payments (Credits) - Linked by payerId (User ID)
      // Note: We only count incomes where sourceType is 'fee' to avoid mixing donations etc.
      let payments: any[] = [];
      if (student.userId) {
        payments = await storage.getFinIncomes(undefined, 'fee', student.userId);
      }

      // 4. Transform to Ledger Entries
      const ledger = [
        ...fees.map(f => ({
          id: `F-${f.id}`,
          date: f.dueDate, // Use due date as transaction date for fee
          description: f.description || "Tuition Fee",
          type: 'debit', // Money owed BY student
          amount: f.amount,
          status: f.status
        })),
        ...payments.map(p => ({
          id: `P-${p.id}`,
          date: p.date,
          description: p.description,
          type: 'credit', // Money paid BY student
          amount: p.amount,
          status: p.status
        }))
      ];

      // 5. Sort by Date (Ascending)
      ledger.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // 6. Calculate Running Balance
      let balance = 0;
      const ledgerWithBalance = ledger.map(entry => {
        if (entry.type === 'debit') balance -= entry.amount; // Owes money (Negative Balance usually means owed in accounting, but let's say Positive = Owed)
        // Let's stick to: Positive Balance = Student OWES money.
        // Debit (Fee) = Increase Balance
        // Credit (Payment) = Decrease Balance

        // Revision:
        // Debit (Charge) -> +Amount
        // Credit (Payment) -> -Amount

        return entry;
        // logic applied below
      });

      // Recalculate strictly
      balance = 0; // Amount Owed
      const finalLedger = ledger.map(entry => {
        if (entry.type === 'debit') {
          balance += entry.amount;
        } else {
          balance -= entry.amount;
        }
        return { ...entry, balance };
      });

      res.json({
        student,
        summary: {
          totalBilled: fees.reduce((sum, f) => sum + f.amount, 0),
          totalPaid: payments.reduce((sum, p) => sum + p.amount, 0),
          outstandingBalance: balance
        },
        ledger: finalLedger
      });

    } catch (e: any) {
      console.error("Ledger Error:", e);
      res.status(500).json({ message: "Failed to generate ledger" });
    }
  });

  // --- Stats ---
  app.get(api.stats.admin.path, authenticateToken, async (req, res) => {
    const stats = await storage.getAdminStats();
    res.json(stats);
  });

  // ========================================
  // LMS ROUTES
  // ========================================

  // --- Categories ---
  app.get("/api/lms/categories", authenticateToken, async (req, res) => {
    const cats = await storage.getCourseCategories();
    res.json(cats);
  });

  app.post("/api/lms/categories", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const cat = await storage.createCourseCategory(req.body);
      res.status(201).json(cat);
    } catch (e: any) {
      res.status(400).json({ message: "Error creating category" });
    }
  });

  // GL/AR/AP/Payroll API Routes - Add these before LMS routes in server/routes.ts

  // ========================================
  // GENERAL LEDGER (GL) API ROUTES
  // ========================================

  // Chart of Accounts
  app.get("/api/gl/chart-of-accounts", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const accounts = await storage.getChartOfAccounts(isActive);
      res.json(accounts);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/gl/chart-of-accounts", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const account = await storage.createChartOfAccount(req.body);
      res.status(201).json(account);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.put("/api/gl/chart-of-accounts/:id", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const account = await storage.updateChartOfAccount(Number((req.params.id as string)), req.body);
      res.json(account);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Funds
  app.get("/api/gl/funds", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const funds = await storage.getGlFunds(isActive);
      res.json(funds);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/gl/funds", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const fund = await storage.createGlFund(req.body);
      res.status(201).json(fund);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Fiscal Periods
  app.get("/api/gl/fiscal-periods", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const year = req.query.year ? Number(req.query.year) : undefined;
      const periods = await storage.getFiscalPeriods(year);
      res.json(periods);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/gl/fiscal-periods/current", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const period = await storage.getCurrentFiscalPeriod();
      res.json(period || null);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/gl/fiscal-periods", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const period = await storage.createFiscalPeriod(req.body);
      res.status(201).json(period);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/gl/fiscal-periods/:id/close", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      await storage.closeFiscalPeriod(Number((req.params.id as string)), (req as any).user.id);
      res.json({ message: "Fiscal period closed successfully" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // Journal Entries
  app.get("/api/gl/journal-entries", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const periodId = req.query.periodId ? Number(req.query.periodId) : undefined;
      const status = req.query.status as string | undefined;
      const entries = await storage.getJournalEntries(periodId, status);
      res.json(entries);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/gl/journal-entries/:id", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const entry = await storage.getJournalEntry(Number((req.params.id as string)));
      if (!entry) return res.status(404).json({ message: "Journal entry not found" });
      res.json(entry);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/gl/journal-entries", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const { entry, transactions } = req.body;
      const journalEntry = await storage.createJournalEntry({
        ...entry,
        createdBy: (req as any).user.id
      }, transactions);
      res.status(201).json(journalEntry);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/gl/journal-entries/:id/post", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      await storage.postJournalEntry(Number((req.params.id as string)), (req as any).user.id);
      res.json({ message: "Journal entry posted successfully" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/gl/journal-entries/:id/reverse", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const { reason } = req.body;
      const reversingEntry = await storage.reverseJournalEntry(Number((req.params.id as string)), (req as any).user.id, reason);
      res.json(reversingEntry);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // GL Reports
  app.get("/api/gl/reports/trial-balance", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const periodId = Number(req.query.periodId);
      if (!periodId) return res.status(400).json({ message: "periodId is required" });
      const trialBalance = await storage.getTrialBalance(periodId);
      res.json(trialBalance);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/gl/reports/balance-sheet", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const asOfDate = req.query.asOfDate as string || new Date().toISOString().split('T')[0];
      const balanceSheet = await storage.getBalanceSheet(asOfDate);
      res.json(balanceSheet);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/gl/reports/income-statement", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      const incomeStatement = await storage.getIncomeStatement(startDate, endDate);
      res.json(incomeStatement);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ========================================
  // GL RECONCILIATION ROUTES
  // ========================================

  app.get("/api/gl/reconciliations", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const accountId = req.query.accountId ? Number(req.query.accountId) : undefined;
      const status = req.query.status as string | undefined;
      const reconciliations = await storage.getReconciliations(accountId, status);
      res.json(reconciliations);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/gl/reconciliations/:id", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const id = parseInt((req.params.id as string));
      const reconciliation = await storage.getReconciliation(id);
      res.json(reconciliation);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/gl/reconciliations", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const data = { ...req.body, reconciledBy: (req as any).user!.id };
      const reconciliation = await storage.createReconciliation(data);
      res.status(201).json(reconciliation);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/gl/reconciliations/:id", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const id = parseInt((req.params.id as string));
      const reconciliation = await storage.updateReconciliation(id, req.body);
      res.json(reconciliation);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/gl/reconciliations/:id/complete", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const id = parseInt((req.params.id as string));
      const reconciliation = await storage.completeReconciliation(id, (req as any).user!.id);
      res.json(reconciliation);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/gl/reconciliations/:id/summary", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const id = parseInt((req.params.id as string));
      const summary = await storage.getReconciliationSummary(id);
      res.json(summary);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/gl/reconciliations/:reconId/items/:txnId/toggle", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const reconciliationId = parseInt((req.params.reconId as string));
      const transactionId = parseInt((req.params.txnId as string));
      const { isCleared } = req.body;
      const item = await storage.markTransactionCleared(reconciliationId, transactionId, isCleared);
      res.json(item);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/gl/accounts/:accountId/uncleared", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const asOfDate = req.query.asOfDate as string || new Date().toISOString().split('T')[0];
      const transactions = await storage.getUnclearedTransactions(accountId, asOfDate);
      res.json(transactions);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });


  // ========================================
  // ACCOUNTS RECEIVABLE (AR) API ROUTES
  // ========================================

  app.get("/api/ar/bills", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
      const status = req.query.status as string | undefined;
      const bills = await storage.getStudentBills(studentId, status);
      res.json(bills);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/ar/bills/:id", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const bill = await storage.getStudentBill(Number((req.params.id as string)));
      if (!bill) return res.status(404).json({ message: "Bill not found" });
      res.json(bill);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ar/bills", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const { bill, lineItems } = req.body;
      const newBill = await storage.createStudentBill({
        ...bill,
        createdBy: (req as any).user.id
      }, lineItems);
      res.status(201).json(newBill);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/ar/bills/:id/post-to-gl", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      await storage.postStudentBillToGL(Number((req.params.id as string)));
      res.json({ message: "Bill posted to GL successfully" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // AR Refunds
  app.get("/api/ar/refunds", authenticateToken, requireFinanceAccess, async (req, res) => {
    const status = req.query.status as string | undefined;
    const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
    try {
      const refunds = await storage.getRefundRequests(status, studentId);
      res.json(refunds);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ar/refunds", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const refund = await storage.createRefundRequest(req.body);
      res.status(201).json(refund);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/ar/refunds/:id/approve", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const refund = await storage.approveRefund(Number((req.params.id as string)), (req as any).user.id);
      res.json(refund);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/ar/refunds/:id/reject", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const { reason } = req.body;
      const refund = await storage.rejectRefund(Number((req.params.id as string)), (req as any).user.id, reason);
      res.json(refund);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/ar/refunds/:id/process", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const { checkNumber } = req.body;
      const refund = await storage.processRefund(Number((req.params.id as string)), checkNumber);
      res.json(refund);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/ar/refunds/:id/post-to-gl", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      await storage.postRefundToGL(Number((req.params.id as string)));
      res.json({ message: "Refund posted to GL successfully" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // AR Auto-Billing Routes
  app.get("/api/ar/billing-rules", authenticateToken, requireFinanceAccess, async (req, res) => {
    const periodId = req.query.periodId ? parseInt(req.query.periodId as string) : undefined;
    const rules = await storage.getAutoBillRules(periodId);
    res.json(rules);
  });

  app.post("/api/ar/billing-rules", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const data = insertArAutoBillRuleSchema.parse(req.body);
      const rule = await storage.createAutoBillRule(data);
      res.status(201).json(rule);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/ar/generate-bill/:studentId", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      if (!req.body.enrollmentId) return res.status(400).send("Missing enrollmentId");

      const bills = await storage.generateBillsFromEnrollment(studentId, req.body.enrollmentId);
      res.json(bills);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // AP Expense Reports
  app.post("/api/ap/expense-reports", authenticateToken, async (req, res) => {
    try {
      const { items, ...reportData } = req.body;
      // Basic validation could be added here or via Zod
      const report = {
        ...reportData,
        employeeId: (req as any).user!.id,
        status: 'draft',
        reportNumber: `EXP-${Date.now()}`
      };

      const newReport = await storage.createExpenseReport(report, items);
      res.status(201).json(newReport);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/ap/expense-reports", authenticateToken, async (req, res) => {
    try {
      // If not finance admin, only show own reports
      // For now, let's assume everyone can see their own, and finance can see all (logic in storage or here)
      const userId = (req as any).user?.role === 'finance_admin' ? undefined : (req as any).user!.id;
      const status = req.query.status as string | undefined;

      const reports = await storage.getExpenseReports(userId, status);
      res.json(reports);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ap/expense-reports/:id/submit", authenticateToken, async (req, res) => {
    try {
      await storage.submitExpenseReport(parseInt((req.params.id as string)));
      res.sendStatus(200);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/ap/expense-reports/:id/approve", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      await storage.approveExpenseReport(parseInt((req.params.id as string)), (req as any).user!.id);
      res.sendStatus(200);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/ap/expense-reports/:id/reject", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      await storage.rejectExpenseReport(parseInt((req.params.id as string)), (req as any).user!.id, req.body.reason || "Rejected");
      res.sendStatus(200);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/ap/expense-reports/:id/post-gl", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      await storage.postExpenseReportToGL(parseInt((req.params.id as string)));
      res.sendStatus(200);
    } catch (e: any) {
      res.status(400).send(e.message);
    }
  });

  // AP 1099 Reporting Routes
  app.get("/api/ap/1099/records", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const taxYear = req.query.taxYear ? parseInt(req.query.taxYear as string) : new Date().getFullYear();
      const records = await storage.get1099Records(taxYear);
      res.json(records);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ap/1099/generate", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const taxYear = req.body.taxYear || new Date().getFullYear();
      const records = await storage.generate1099Records(taxYear);
      res.status(201).json(records);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });


  // AP Purchase Orders
  app.get("/api/ap/purchase-orders", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const vendorId = req.query.vendorId ? parseInt(req.query.vendorId as string) : undefined;
      const status = req.query.status as string | undefined;
      const pos = await storage.getPurchaseOrders(vendorId, status);
      res.json(pos);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ap/purchase-orders", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const { items, ...poData } = req.body;
      const po = {
        ...poData,
        createdBy: (req as any).user!.id,
        status: 'open',
        poNumber: `PO-${Date.now()}` // Simple generation
      };
      const newPO = await storage.createPurchaseOrder(po, items);
      res.status(201).json(newPO);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/ap/purchase-orders/:id/receive", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      // items: [{ id: number, receivedQuantity: number }]
      await storage.receivePO(parseInt((req.params.id as string)), req.body.items);
      res.sendStatus(200);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/ap/purchase-orders/:id/match", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const result = await storage.matchInvoiceToPO(req.body.invoiceId, parseInt((req.params.id as string)));
      res.json({ matched: result });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // AR Dunning
  app.get("/api/ar/dunning/overdue-bills", authenticateToken, requireFinanceAccess, async (req, res) => {
    const daysOverdue = req.query.daysOverdue ? Number(req.query.daysOverdue) : undefined;
    try {
      const bills = await storage.getOverdueBills(daysOverdue);
      res.json(bills);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ar/dunning/send-notice", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const { studentId, billId, level } = req.body;
      const notice = await storage.sendDunningNotice(studentId, billId, level);
      res.json(notice);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/ar/dunning/history", authenticateToken, requireFinanceAccess, async (req, res) => {
    const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
    const billId = req.query.billId ? Number(req.query.billId) : undefined;
    try {
      const history = await storage.getDunningHistory(studentId, billId);
      res.json(history);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/ar/payments", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const studentId = req.query.studentId ? Number(req.query.studentId) : undefined;
      const payments = await storage.getArPayments(studentId);
      res.json(payments);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ar/payments", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const { payment, allocations } = req.body;
      const newPayment = await storage.createArPayment({
        ...payment,
        createdBy: (req as any).user.id
      }, allocations);
      res.status(201).json(newPayment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/ar/payments/:id/post-to-gl", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      await storage.postArPaymentToGL(Number((req.params.id as string)));
      res.json({ message: "Payment posted to GL successfully" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/ar/reports/aging", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const aging = await storage.getAgingReport();
      res.json(aging);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ========================================
  // ACCOUNTS PAYABLE (AP) API ROUTES
  // ========================================

  app.get("/api/ap/vendors", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const vendors = await storage.getApVendors(isActive);
      res.json(vendors);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ap/vendors", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const vendor = await storage.createApVendor(req.body);
      res.status(201).json(vendor);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/ap/invoices", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const vendorId = req.query.vendorId ? Number(req.query.vendorId) : undefined;
      const status = req.query.status as string | undefined;
      const invoices = await storage.getApInvoices(vendorId, status);
      res.json(invoices);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/ap/invoices", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const { invoice, lineItems } = req.body;
      const newInvoice = await storage.createApInvoice({
        ...invoice,
        createdBy: (req as any).user.id
      }, lineItems);
      res.status(201).json(newInvoice);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/ap/invoices/:id/approve", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      await storage.approveApInvoice(Number((req.params.id as string)), (req as any).user.id);
      res.json({ message: "Invoice approved successfully" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/ap/invoices/:id/post-to-gl", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      await storage.postApInvoiceToGL(Number((req.params.id as string)));
      res.json({ message: "Invoice posted to GL successfully" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/ap/payments", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const payment = await storage.createApPayment({
        ...req.body,
        createdBy: (req as any).user.id
      });
      res.status(201).json(payment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/ap/payments/:id/post-to-gl", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      await storage.postApPaymentToGL(Number((req.params.id as string)));
      res.json({ message: "Payment posted to GL successfully" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // ========================================
  // PAYROLL API ROUTES
  // ========================================

  app.get("/api/payroll/runs", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const runs = await storage.getPayrollRuns(status);
      res.json(runs);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/payroll/runs", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      const { run, details } = req.body;
      const payrollRun = await storage.createPayrollRun({
        ...run,
        processedBy: (req as any).user.id
      }, details);
      res.status(201).json(payrollRun);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/payroll/runs/:id/post-to-gl", authenticateToken, requireFinanceAccess, async (req, res) => {
    try {
      await storage.postPayrollToGL(Number((req.params.id as string)));
      res.json({ message: "Payroll posted to GL successfully" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });
  // --- Courses ---
  app.get("/api/lms/courses", authenticateToken, async (req, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  });

  app.get("/api/lms/courses/:id", authenticateToken, async (req, res) => {
    const course = await storage.getCourse(Number((req.params.id as string)));
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  });

  app.post("/api/lms/courses", authenticateToken, async (req, res) => {
    // Admin or Principal
    if ((req as any).user.role !== 'admin' && (req as any).user.role !== 'principal') {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const course = await storage.createCourse(req.body);
      res.status(201).json(course);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Error creating course" });
    }
  });

  // --- Sections ---
  app.get("/api/lms/courses/:courseId/sections", authenticateToken, async (req, res) => {
    const sections = await storage.getCourseSections(Number(req.params.courseId));
    res.json(sections);
  });

  app.post("/api/lms/sections", authenticateToken, async (req, res) => {
    // Teacher or higher
    const role = (req as any).user.role;
    if (role === 'student' || role === 'parent') return res.status(403).json({ message: "Forbidden" });

    try {
      const section = await storage.createCourseSection(req.body);
      res.status(201).json(section);
    } catch (e: any) {
      res.status(400).json({ message: "Error creating section" });
    }
  });

  // --- Modules ---
  app.get("/api/lms/sections/:sectionId/modules", authenticateToken, async (req, res) => {
    const modules = await storage.getCourseModules(Number(req.params.sectionId));
    res.json(modules);
  });

  app.post("/api/lms/modules", authenticateToken, async (req, res) => {
    // Teacher or higher
    const role = (req as any).user.role;
    if (role === 'student' || role === 'parent') return res.status(403).json({ message: "Forbidden" });

    try {
      const module = await storage.createCourseModule(req.body);
      res.status(201).json(module);
    } catch (e: any) {
      res.status(400).json({ message: "Error creating module" });
    }
  });

  // --- Activities ---
  // Assignments
  app.post("/api/lms/assignments", authenticateToken, async (req, res) => {
    if ((req as any).user.role === 'student') return res.status(403).json({ message: "Forbidden" });
    const assign = await storage.createLmsAssignment(req.body);
    res.status(201).json(assign);
  });

  app.get("/api/lms/assignments/:id", authenticateToken, async (req, res) => {
    const assign = await storage.getLmsAssignment(Number((req.params.id as string)));
    if (!assign) return res.status(404).json({ message: "Not found" });
    res.json(assign);
  });

  // Submissions
  app.post("/api/lms/submissions", authenticateToken, async (req, res) => {
    const sub = await storage.createLmsSubmission(req.body);
    res.status(201).json(sub);
  });

  app.get("/api/lms/assignments/:id/submissions", authenticateToken, async (req, res) => {
    // Only teacher/admin
    const role = (req as any).user.role;
    if (role === 'student' || role === 'parent') return res.status(403).json({ message: "Forbidden" });

    const subs = await storage.getLmsSubmissions(Number((req.params.id as string)));
    res.json(subs);
  });

  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const adminUser = await storage.getUserByUsername("admin");
  if (!adminUser) {
    console.log("Seeding database...");
    const adminPass = await hashPassword("admin123");
    await storage.createUser({
      name: "Super Admin",
      username: "admin",
      password: adminPass,
      role: "admin"
    });
    console.log("Seeding complete.");
  }
}