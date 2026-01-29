
import { z } from 'zod';
import { 
  insertUserSchema, insertStudentSchema, insertTeacherSchema, insertClassSchema,
  insertAttendanceSchema, insertMarkSchema, insertFeeSchema,
  users, students, teachers, classes, attendance, marks, fees, subjects, timetable,
  insertSubjectSchema, insertTimetableSchema
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// Login Schema
export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: loginSchema,
      responses: {
        200: z.object({
          token: z.string(),
          user: z.custom<typeof users.$inferSelect>(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  users: {
    create: {
      method: 'POST' as const,
      path: '/api/users',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  students: {
    list: {
      method: 'GET' as const,
      path: '/api/students',
      input: z.object({ classId: z.coerce.number().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof students.$inferSelect & { user: typeof users.$inferSelect, class: typeof classes.$inferSelect | null }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/students/:id',
      responses: {
        200: z.custom<typeof students.$inferSelect & { user: typeof users.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/students',
      input: insertStudentSchema.extend({
        user: insertUserSchema.omit({ role: true }).extend({ password: z.string().optional() }), // Password optional if auto-generated
      }),
      responses: {
        201: z.custom<typeof students.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    approve: {
      method: 'POST' as const,
      path: '/api/students/:id/approve',
      input: z.object({ status: z.enum(['approved', 'rejected']) }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  teachers: {
    list: {
      method: 'GET' as const,
      path: '/api/teachers',
      responses: {
        200: z.array(z.custom<typeof teachers.$inferSelect & { user: typeof users.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/teachers',
      input: insertTeacherSchema.extend({
        user: insertUserSchema.omit({ role: true }),
      }),
      responses: {
        201: z.custom<typeof teachers.$inferSelect>(),
      },
    },
  },
  classes: {
    list: {
      method: 'GET' as const,
      path: '/api/classes',
      responses: {
        200: z.array(z.custom<typeof classes.$inferSelect & { classTeacher: typeof teachers.$inferSelect | null }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/classes',
      input: insertClassSchema,
      responses: {
        201: z.custom<typeof classes.$inferSelect>(),
      },
    },
  },
  attendance: {
    mark: {
      method: 'POST' as const,
      path: '/api/attendance',
      input: z.array(insertAttendanceSchema),
      responses: {
        201: z.object({ message: z.string(), count: z.number() }),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/attendance',
      input: z.object({ 
        date: z.string().optional(),
        classId: z.coerce.number().optional(),
        studentId: z.coerce.number().optional()
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof attendance.$inferSelect>()),
      },
    },
  },
  fees: {
    list: {
      method: 'GET' as const,
      path: '/api/fees',
      input: z.object({ studentId: z.coerce.number().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof fees.$inferSelect>()),
      },
    },
  },
  stats: {
    admin: {
      method: 'GET' as const,
      path: '/api/stats/admin',
      responses: {
        200: z.object({
          totalStudents: z.number(),
          totalTeachers: z.number(),
          totalClasses: z.number(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
