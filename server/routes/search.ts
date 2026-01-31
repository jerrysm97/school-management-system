import { Request, Response } from 'express';
import { db } from '../db';
import { users, students, classes, payments } from '@shared/schema';
import { sql, or, ilike } from 'drizzle-orm';

export async function searchGlobal(req: Request, res: Response) {
    try {
        const { q } = req.query;

        if (!q || typeof q !== 'string' || q.length < 2) {
            return res.json([]);
        }

        const searchTerm = `%${q}%`;
        const results: any[] = [];

        // Search students
        const studentResults = await db
            .select({
                id: students.id,
                name: users.name,
                admissionNo: students.admissionNo,
                status: students.status,
            })
            .from(students)
            .innerJoin(users, sql`${students.userId} = ${users.id}`)
            .where(
                or(
                    ilike(users.name, searchTerm),
                    ilike(students.admissionNo, searchTerm)
                )
            )
            .limit(10);

        results.push(...studentResults.map(s => ({
            type: 'student',
            id: s.id,
            title: s.name,
            subtitle: `${s.admissionNo} • ${s.status}`,
            url: `/students/${s.id}`,
        })));

        // Search teachers
        const teacherResults = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
            })
            .from(users)
            .where(
                sql`${users.role} = 'teacher' AND ${ilike(users.name, searchTerm)}`
            )
            .limit(10);

        results.push(...teacherResults.map(t => ({
            type: 'teacher',
            id: t.id,
            title: t.name,
            subtitle: t.email || '',
            url: `/teachers/${t.id}`,
        })));

        // Search classes
        const classResults = await db
            .select({
                id: classes.id,
                name: classes.name,
                section: classes.section,
                grade: classes.grade,
            })
            .from(classes)
            .where(
                or(
                    ilike(classes.name, searchTerm),
                    ilike(classes.section, searchTerm),
                    ilike(classes.grade, searchTerm)
                )
            )
            .limit(10);

        results.push(...classResults.map(c => ({
            type: 'class',
            id: c.id,
            title: `${c.name} - Section ${c.section}`,
            subtitle: `Grade ${c.grade}`,
            url: `/classes/${c.id}`,
        })));

        // Search payments (by reference number)
        const paymentResults = await db
            .select({
                id: payments.id,
                referenceNumber: payments.referenceNumber,
                amount: payments.amount,
                paymentMethod: payments.paymentMethod,
            })
            .from(payments)
            .where(ilike(payments.referenceNumber, searchTerm))
            .limit(10);

        results.push(...paymentResults.map(p => ({
            type: 'payment',
            id: p.id,
            title: p.referenceNumber,
            subtitle: `$${(p.amount / 100).toFixed(2)} • ${p.paymentMethod}`,
            url: `/finance/payments/${p.id}`,
        })));

        // Sort by relevance (exact matches first)
        results.sort((a, b) => {
            const aExact = a.title.toLowerCase() === q.toLowerCase();
            const bExact = b.title.toLowerCase() === q.toLowerCase();
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            return 0;
        });

        res.json(results.slice(0, 50));
    } catch (error: any) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
}
