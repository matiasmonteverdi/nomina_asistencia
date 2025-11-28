// ============================================
// CONFIGURATION - Constantes del sistema
// ============================================

export const CONFIG = {
    LATE_THRESHOLD_MINUTES: 15,
    DEFAULT_WORK_START: '09:00',
    DEFAULT_WORK_END: '18:00',
    DEFAULT_HOURLY_RATE: 1500,
    TAX_RATE: 0.13,
    OVERTIME_BONUS: 5000,
    OVERTIME_THRESHOLD: 160,
    STORAGE_VERSION: '2.0',
    TOAST_DURATION: 4000,
    DEBOUNCE_DELAY: 300
};

export const STORAGE_KEYS = {
    EMPLOYEES: 'employees',
    ATTENDANCE: 'attendance',
    ABSENCES: 'absences',
    SHIFTS: 'shifts',
    PAYROLL: 'payroll',
    BONUSES: 'bonuses',
    DEDUCTIONS: 'deductions',
    SETTINGS: 'settings',
    THEME: 'theme',
    DEPARTMENTS: 'departments'
};

export const DEFAULT_SETTINGS = {
    companyName: 'Mi Empresa S.A.',
    workStartTime: CONFIG.DEFAULT_WORK_START,
    workEndTime: CONFIG.DEFAULT_WORK_END,
    lateToleranceMinutes: CONFIG.LATE_THRESHOLD_MINUTES,
    baseHourlyRate: CONFIG.DEFAULT_HOURLY_RATE,
    taxPercentage: CONFIG.TAX_RATE * 100,
    overtimeBonus: CONFIG.OVERTIME_BONUS,
    overtimeThreshold: CONFIG.OVERTIME_THRESHOLD,
    overtimeApproval: 'no'
};

export const ABSENCE_TYPES = {
    VACACIONES: { icon: '🏖️', label: 'Vacaciones' },
    ENFERMEDAD: { icon: '🤒', label: 'Enfermedad' },
    PERSONAL: { icon: '👤', label: 'Personal' },
    PERMISO: { icon: '📄', label: 'Permiso con goce' },
    SIN_GOCE: { icon: '⚠️', label: 'Permiso sin goce' }
};

export const ATTENDANCE_ACTIONS = {
    ENTRADA: { icon: '🟢', label: 'Entrada', class: 'success' },
    SALIDA: { icon: '🔴', label: 'Salida', class: 'danger' },
    BREAK_START: { icon: '☕', label: 'Break', class: 'warning' },
    BREAK_END: { icon: '🔄', label: 'Fin Break', class: 'info' }
};

export const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const MONTHS = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export const CONTRACT_TYPES = [
    { value: 'tiempo_completo', label: 'Tiempo Completo' },
    { value: 'medio_tiempo', label: 'Medio Tiempo' },
    { value: 'temporal', label: 'Temporal' },
    { value: 'freelance', label: 'Freelance' }
];