import { storage } from "../server/storage";
import { db } from "../server/db";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function run() {
  console.log("🔧 Starting Database Repair...");

  // 1. Repair Teacher
  let teacherUser = await storage.getUserByUsername("teacher");
  if (!teacherUser) {
    console.log("Creating missing Teacher account...");
    const hashedPassword = await hashPassword("teacher123");
    teacherUser = await storage.createUser({
      name: "John Teacher",
      username: "teacher",
      password: hashedPassword,
      role: "teacher"
    });
    
    // Create the Teacher Profile
    await storage.createTeacher({
      userId: teacherUser.id,
      department: "Science",
      phone: "123-456-7890"
    });
    console.log("✅ Teacher created (User: teacher / Pass: teacher123)");
  } else {
    console.log("ℹ️ Teacher account already exists.");
  }

  // 2. Repair Class (Required for Student)
  const classes = await storage.getClasses();
  let classA = classes.find(c => c.name === "10A");
  if (!classA) {
    console.log("Creating missing Class 10A...");
    const teacher = await storage.getTeacherByUserId(teacherUser.id);
    if (teacher) {
        classA = await storage.createClass({
            name: "10A",
            grade: "10",
            section: "A",
            classTeacherId: teacher.id
        });
        console.log("✅ Class 10A created");
    }
  }

  // 3. Repair Student
  let studentUser = await storage.getUserByUsername("student");
  if (!studentUser) {
    console.log("Creating missing Student account...");
    const hashedPassword = await hashPassword("student123");
    studentUser = await storage.createUser({
      name: "Jane Student",
      username: "student",
      password: hashedPassword,
      role: "student"
    });
    
    if (classA) {
        await storage.createStudent({
            userId: studentUser.id,
            admissionNo: "ADM001",
            classId: classA.id,
            dob: "2010-01-01",
            status: "approved",
            phone: "555-0199",
            gender: "female",
            address: "123 School Lane"
        });
        console.log("✅ Student created (User: student / Pass: student123)");
    }
  } else {
      console.log("ℹ️ Student account already exists.");
  }

  console.log("\n🎉 Database repair complete! You can now log in.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Error running fix:", err);
  process.exit(1);
});