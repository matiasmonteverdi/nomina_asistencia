// ============================================
// DATA MODELS - Modelos de negocio
// ============================================

export class Employee {
    constructor(data) {
        this.id = data.id || Date.now();
        this.name = data.name;
        this.position = data.position;
        this.department = data.department;
        this.email = data.email || '';
        this.phone = data.phone || '';
        this.startDate = data.startDate || '';
        this.salary = data.salary || 0;
        this.contractType = data.contractType || 'tiempo_completo';
        this.status = data.status || 'activo';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || null;
    }

    toJSON() {
        return { ...this };
    }
}

export class AttendanceRecord {
    constructor(data) {
        this.id = data.id || Date.now();
        this.employeeId = data.employeeId;
        this.employeeName = data.employeeName;
        this.action = data.action;
        this.timestamp = data.timestamp || new Date().toISOString();
        this.notes = data.notes || '';
    }

    toJSON() {
        return { ...this };
    }
}

export class Absence {
    constructor(data) {
        this.id = data.id || Date.now();
        this.employeeId = data.employeeId;
        this.employeeName = data.employeeName;
        this.dateStart = data.dateStart;
        this.dateEnd = data.dateEnd;
        this.days = data.days;
        this.type = data.type;
        this.reason = data.reason || '';
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    toJSON() {
        return { ...this };
    }
}

export class PayrollPayment {
    constructor(data) {
        this.id = data.id || Date.now();
        this.employeeId = data.employeeId;
        this.employeeName = data.employeeName;
        this.period = data.period;
        this.month = data.month;
        this.hours = data.hours;
        this.hourlyRate = data.hourlyRate;
        this.baseSalary = data.baseSalary;
        this.bonuses = data.bonuses;
        this.deductions = data.deductions;
        this.taxes = data.taxes;
        this.grossSalary = data.grossSalary;
        this.netSalary = data.netSalary;
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    toJSON() {
        return { ...this };
    }
}

export class Bonus {
    constructor(amount, reason = '') {
        this.amount = amount;
        this.reason = reason;
    toJSON() {
        return { ...this };
    }
}

export class Department {
    constructor(data) {
        this.id = data.id || Date.now();
        this.name = data.name;
    }

    toJSON() {
        return { ...this };
    }
}


export class Deduction {
    constructor(amount, reason = '') {
        this.amount = amount;
        this.reason = reason;
        this.date = new Date().toISOString();
    }

    toJSON() {
        return { ...this };
    }
}