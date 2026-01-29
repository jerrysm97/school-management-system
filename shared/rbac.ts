// Role-Based Access Control (RBAC) System
// Based on hierarchical role structure with inherited permissions

export type Role = 'main_admin' | 'principal' | 'accountant' | 'teacher' | 'student' | 'parent';

// Role Hierarchy (Level 0 = highest)
export const ROLE_HIERARCHY: Record<Role, number> = {
    main_admin: 0,
    principal: 1,
    accountant: 2,
    teacher: 2,
    student: 3,
    parent: 4,
};

// Module permissions
export type Module =
    | 'dashboard'
    | 'users'
    | 'students'
    | 'teachers'
    | 'classes'
    | 'attendance'
    | 'timetable'
    | 'exams'
    | 'fees'
    | 'financial_engine'
    | 'settings'
    | 'reports'
    | 'system_config'
    | 'audit_logs';

export type Permission = 'read' | 'write' | 'delete' | 'approve' | 'admin';

// Role Permissions Matrix
export const ROLE_PERMISSIONS: Record<Role, Partial<Record<Module, Permission[]>>> = {
    main_admin: {
        dashboard: ['read', 'write', 'delete', 'approve', 'admin'],
        users: ['read', 'write', 'delete', 'approve', 'admin'],
        students: ['read', 'write', 'delete', 'approve', 'admin'],
        teachers: ['read', 'write', 'delete', 'approve', 'admin'],
        classes: ['read', 'write', 'delete', 'approve', 'admin'],
        attendance: ['read', 'write', 'delete', 'approve', 'admin'],
        timetable: ['read', 'write', 'delete', 'approve', 'admin'],
        exams: ['read', 'write', 'delete', 'approve', 'admin'],
        fees: ['read', 'write', 'delete', 'approve', 'admin'],
        financial_engine: ['read', 'write', 'delete', 'approve', 'admin'],
        settings: ['read', 'write', 'delete', 'approve', 'admin'],
        reports: ['read', 'write', 'delete', 'approve', 'admin'],
        system_config: ['read', 'write', 'delete', 'approve', 'admin'],
        audit_logs: ['read', 'write', 'delete', 'approve', 'admin'],
    },
    principal: {
        dashboard: ['read', 'write'],
        users: ['read', 'write'],
        students: ['read', 'write', 'approve'],
        teachers: ['read', 'write', 'approve'],
        classes: ['read', 'write', 'approve'],
        attendance: ['read', 'approve'],
        timetable: ['read', 'write', 'approve'],
        exams: ['read', 'approve'],
        fees: ['read'],
        financial_engine: ['read'],
        settings: ['read'],
        reports: ['read', 'write'],
        audit_logs: ['read'],
    },
    accountant: {
        dashboard: ['read'],
        students: ['read', 'write'],
        fees: ['read', 'write', 'delete', 'approve'],
        financial_engine: ['read', 'write', 'delete', 'approve'],
        reports: ['read', 'write'],
    },
    teacher: {
        dashboard: ['read'],
        students: ['read'],
        classes: ['read'],
        attendance: ['read', 'write'],
        timetable: ['read'],
        exams: ['read', 'write'],
    },
    student: {
        dashboard: ['read'],
        attendance: ['read'],
        timetable: ['read'],
        exams: ['read'],
        fees: ['read'],
    },
    parent: {
        dashboard: ['read'],
        students: ['read'],
        attendance: ['read'],
        fees: ['read'],
    },
};

// Role metadata for UI display
export const ROLE_METADATA: Record<Role, {
    label: string;
    description: string;
    level: number;
    color: string;
}> = {
    main_admin: {
        label: 'Main Administrator',
        description: 'Full system-wide access to all modules. Root level with no restrictions.',
        level: 0,
        color: 'red',
    },
    principal: {
        label: 'Principal',
        description: 'Institutional oversight with access to dashboards, reports, and approvals.',
        level: 1,
        color: 'purple',
    },
    accountant: {
        label: 'Accountant',
        description: 'Financial modules including billing, payroll, and aid processing.',
        level: 2,
        color: 'green',
    },
    teacher: {
        label: 'Teacher',
        description: 'Academic modules including gradebook, attendance, and class management.',
        level: 2,
        color: 'blue',
    },
    student: {
        label: 'Student',
        description: 'Self-service portal for personal records, enrollment, and campus services.',
        level: 3,
        color: 'cyan',
    },
    parent: {
        label: 'Parent/Guardian',
        description: 'Read-only access to student information and fees.',
        level: 4,
        color: 'gray',
    },
};

// Permission check functions
export function hasPermission(role: Role, module: Module, permission: Permission): boolean {
    const rolePerms = ROLE_PERMISSIONS[role];
    if (!rolePerms) return false;

    const modulePerms = rolePerms[module];
    if (!modulePerms) return false;

    return modulePerms.includes(permission);
}

export function hasModuleAccess(role: Role, module: Module): boolean {
    const rolePerms = ROLE_PERMISSIONS[role];
    if (!rolePerms) return false;
    return !!rolePerms[module];
}

export function canManageRole(managerRole: Role, targetRole: Role): boolean {
    return ROLE_HIERARCHY[managerRole] < ROLE_HIERARCHY[targetRole];
}

export function getAccessibleModules(role: Role): Module[] {
    const perms = ROLE_PERMISSIONS[role];
    if (!perms) return [];
    return Object.keys(perms) as Module[];
}

// AI-Enhanced Self-Check Functions (stubs for future implementation)
export function checkRoleCompleteness(role: Role): { missing: string[], warnings: string[] } {
    const expectedModules: Module[] = ['dashboard'];
    const perms = ROLE_PERMISSIONS[role];
    const missing: string[] = [];
    const warnings: string[] = [];

    for (const mod of expectedModules) {
        if (!perms[mod]) {
            missing.push(`Role ${role} lacks access to ${mod}`);
        }
    }

    return { missing, warnings };
}

export function detectAnomalousAccess(role: Role, module: Module, action: string): boolean {
    // Placeholder for ML-based anomaly detection
    // Would integrate with TensorFlow/Isolation Forest in production
    return false;
}
