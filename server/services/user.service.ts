import { db } from "../db";
import { users, type User, type InsertUser } from "@shared/schema";
import { eq, or } from "drizzle-orm";

/**
 * Removes sensitive information (password) from the user object.
 */
export function sanitizeUser(user: User): User {
    const safe = { ...user };
    delete (safe as any).password;
    return safe;
}

export class UserService {
    async getUser(id: number): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user ? sanitizeUser(user) : undefined;
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user ? sanitizeUser(user) : undefined;
    }

    async getUserByIdentifier(identifier: string): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(
            or(
                eq(users.email, identifier),
                eq(users.username, identifier)
            )
        );
        return user ? sanitizeUser(user) : undefined;
    }

    async getUserByGoogleId(googleId: string): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
        return user ? sanitizeUser(user) : undefined;
    }

    async createUser(user: InsertUser): Promise<User> {
        const [newUser] = await db.insert(users).values(user).returning();
        return newUser; // Ideally we verify if we need to return sanitized or raw here. internal usually needs raw, external needs sanitized. logic kept as is but sanitizedUser is available.
    }

    async updateUserPassword(id: number, password: string): Promise<void> {
        await db.update(users)
            .set({ password, mustChangePassword: false })
            .where(eq(users.id, id));
    }
}
