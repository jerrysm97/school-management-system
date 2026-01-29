import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertUserSchema } from "@shared/schema";
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
    const user = await storage.getUserByUsername(username);

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Temporary Fix: Allow pending accounts to login for testing purposes
    // In production, you might want to uncomment the check below or show a specific UI message.
    /*
    if (user.status === 'pending') {
       return res.status(403).json({ message: "Account pending. Please contact administrator." });
    }
    */

    const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '24h' });

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
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
    await storage.updateStudentStatus(Number(req.params.id), status);
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
    const student = await storage.getStudent(Number(req.params.id));
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
      const id = Number(req.params.id);
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
      const id = Number(req.params.id);
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
      const id = Number(req.params.id);
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
      const id = Number(req.params.id);
      const { isActive } = req.body;
      await storage.toggleAcademicPeriod(id, isActive);
      res.json({ message: "Updated successfully" });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // --- Course History ---
  app.get("/api/students/:id/course-history", authenticateToken, async (req, res) => {
    const studentId = Number(req.params.id);
    const history = await storage.getStudentCourseHistory(studentId);
    res.json(history);
  });

  // ========================================
  // FINANCIAL ENGINE ROUTES
  // ========================================

  // Student Accounts
  app.get("/api/students/:id/account", authenticateToken, async (req, res) => {
    const studentId = Number(req.params.id);
    let account = await storage.getStudentAccount(studentId);
    if (!account) {
      // Auto-create account if doesn't exist
      account = await storage.createStudentAccount({ studentId, currentBalance: 0 });
    }
    res.json(account);
  });

  app.patch("/api/students/:id/account/hold", authenticateToken, async (req, res) => {
    if ((req as any).user.role !== 'admin') return res.sendStatus(403);
    const studentId = Number(req.params.id);
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
    const studentId = Number(req.params.id);
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
    const id = Number(req.params.id);
    const { status } = req.body;
    await storage.updateEnrollmentStatus(id, status);
    res.json({ message: "Enrollment status updated, recalculation flagged" });
  });

  // Financial Transactions
  app.get("/api/accounts/:id/transactions", authenticateToken, async (req, res) => {
    const accountId = Number(req.params.id);
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
    const studentId = Number(req.params.id);
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
    const id = Number(req.params.id);
    const { status } = req.body;
    await storage.updateAidStatus(id, status);
    res.json({ message: "Aid status updated" });
  });

  // Bill Calculation Engine
  app.get("/api/students/:id/bill", authenticateToken, async (req, res) => {
    const studentId = Number(req.params.id);
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
      const studentId = parseInt(req.params.studentId);
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

  // --- Courses ---
  app.get("/api/lms/courses", authenticateToken, async (req, res) => {
    const courses = await storage.getCourses();
    res.json(courses);
  });

  app.get("/api/lms/courses/:id", authenticateToken, async (req, res) => {
    const course = await storage.getCourse(Number(req.params.id));
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
    const assign = await storage.getLmsAssignment(Number(req.params.id));
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

    const subs = await storage.getLmsSubmissions(Number(req.params.id));
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