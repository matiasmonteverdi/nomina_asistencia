// ============================================
// BUSINESS SERVICES - Lógica de negocio
// ============================================

import * as Models from './models.js';
import * as Utils from './utils.js';

export class EmployeeService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    add(employeeData) {
        const employee = new Models.Employee(employeeData);
        const employees = [...this.stateManager.state.employees, employee];
        this.stateManager.updateState({ employees });
        return employee;
    }

    update(id, updates) {
        const employees = this.stateManager.state.employees.map(emp =>
            emp.id === id
                ? { ...emp, ...updates, updatedAt: new Date().toISOString() }
                : emp
        );
        this.stateManager.updateState({ employees });
    }

    delete(id) {
        const employees = this.stateManager.state.employees.filter(
            emp => emp.id !== id
        );
        this.stateManager.updateState({ employees });
    }

    getById(id) {
        return this.stateManager.state.employees.find(
            emp => emp.id === parseInt(id)
        );
    }

    getAll() {
        return this.stateManager.state.employees;
    }

    getActive() {
        return this.stateManager.state.employees.filter(emp => emp.status === 'activo');
    }
}

export class AttendanceService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    addRecord(employeeId, employeeName, action, timestamp, notes) {
        const record = new Models.AttendanceRecord({
            employeeId,
            employeeName,
            action,
            timestamp,
            notes
        });
        const attendance = [...this.stateManager.state.attendance, record];
        this.stateManager.updateState({ attendance });
        return record;
    }

    deleteRecord(id) {
        const attendance = this.stateManager.state.attendance.filter(
            rec => rec.id !== id
        );
        this.stateManager.updateState({ attendance });
    }

    clearEmployeeRecords(employeeId) {
        const attendance = this.stateManager.state.attendance.filter(
            rec => rec.employeeId !== employeeId
        );
        this.stateManager.updateState({ attendance });
    }

    getTodayRecords() {
        return this.stateManager.state.attendance.filter(rec =>
            Utils.DateUtils.isToday(rec.timestamp)
        );
    }

    getEmployeeRecords(employeeId) {
        return this.stateManager.state.attendance.filter(
            rec => rec.employeeId === employeeId
        );
    }

    getLastAction(employeeId) {
        const records = this.getEmployeeRecords(employeeId);
        // Ordena por timestamp descendente para obtener el más reciente
        const sortedRecords = records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return sortedRecords.length > 0 ? sortedRecords[0] : null;
    }

    getSuggestedAction(employeeId, settings) {
        const lastRecord = this.getLastAction(employeeId);

        // Asumiendo que ATTENDANCE_ACTIONS está en el config o se pasa
        const ACTIONS = settings.ATTENDANCE_ACTIONS;

        if (!lastRecord || lastRecord.action.type === 'SALIDA' || lastRecord.action.type === 'BREAK_END') {
            return ACTIONS.ENTRADA;
        } else if (lastRecord.action.type === 'ENTRADA') {
            return ACTIONS.SALIDA; // O BREAK_START si la hora lo permite
        } else if (lastRecord.action.type === 'BREAK_START') {
            return ACTIONS.BREAK_END;
        }
        return ACTIONS.ENTRADA;
    }

    getTotalHoursWorked(employeeId) {
        const records = this.getEmployeeRecords(employeeId);
        return Utils.TimeCalculator.calculateTotalWorkHours(records);
    }

    getTotalLateChecks(employeeId) {
        const settings = this.stateManager.getSettings();
        const records = this.getEmployeeRecords(employeeId);

        return records.filter(r =>
            r.action.type === 'ENTRADA' &&
            Utils.TimeCalculator.isLate(r.timestamp, settings.workStartTime, settings.lateToleranceMinutes)
        ).length;
    }
}

export class AbsenceService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    addRecord(absenceData) {
        const absence = new Models.Absence(absenceData);
        const absences = [...this.stateManager.state.absences, absence];
        this.stateManager.updateState({ absences });
        return absence;
    }

    deleteRecord(id) {
        const absences = this.stateManager.state.absences.filter(
            abs => abs.id !== id
        );
        this.stateManager.updateState({ absences });
    }

    clearEmployeeRecords(employeeId) {
        const absences = this.stateManager.state.absences.filter(
            abs => abs.employeeId !== employeeId
        );
        this.stateManager.updateState({ absences });
    }

    getAll() {
        return this.stateManager.state.absences;
    }

    getTotalDaysOff(employeeId) {
        return this.stateManager.state.absences
            .filter(abs => abs.employeeId === employeeId)
            .reduce((totalDays, abs) => {
                const days = Utils.TimeCalculator.getDaysBetweenDates(abs.startDate, abs.endDate);
                return totalDays + days;
            }, 0);
    }
}

export class ShiftService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    updateShift(employeeId, employeeName, day, startTime, endTime) {
        const shifts = { ...this.stateManager.state.shifts };

        if (!shifts[employeeId]) {
            shifts[employeeId] = {};
        }

        shifts[employeeId][day] = new Models.Shift({
            employeeId,
            employeeName,
            day,
            startTime,
            endTime
        });

        this.stateManager.updateState({ shifts });
    }

    getAll() {
        return this.stateManager.state.shifts;
    }

    getEmployeeShifts(employeeId) {
        return this.stateManager.state.shifts[employeeId] || {};
    }
}

export class PayrollService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    calculatePayroll(employeeId, month, year) {
        const settings = this.stateManager.getSettings();
        const employee = this.stateManager.state.employees.find(emp => emp.id === employeeId);

        if (!employee) {
            throw new Error('Empleado no encontrado.');
        }

        const period = `${month}-${year}`;

        // 1. Horas trabajadas en el periodo
        const totalHours = Utils.TimeCalculator.calculateMonthlyWorkHours(
            this.stateManager.state.attendance,
            employeeId,
            month,
            year
        );

        // 2. Salario base y tasa
        const hourlyRate = settings.baseHourlyRate;
        const baseSalary = totalHours * hourlyRate;

        // 3. Bonificaciones y Deducciones (por nombre de empleado)
        const employeeBonuses = this.getEmployeeBonuses(employee.name);
        const employeeDeductions = this.getEmployeeDeductions(employee.name);
        const totalBonuses = Utils.NumberUtils.sumArray(employeeBonuses.map(b => b.amount));
        const totalDeductions = Utils.NumberUtils.sumArray(employeeDeductions.map(d => d.amount));

        // 4. Salario Bruto
        const grossSalary = baseSalary + totalBonuses;

        // 5. Impuestos (ejemplo simple)
        const taxes = grossSalary * (settings.taxPercentage / 100);

        // 6. Salario Neto
        const netSalary = grossSalary - taxes - totalDeductions;

        const paymentData = {
            employeeId,
            employeeName: employee.name,
            period,
            month,
            year,
            hours: totalHours,
            hourlyRate,
            baseSalary,
            bonuses: totalBonuses,
            deductions: totalDeductions,
            taxes,
            grossSalary,
            netSalary
        };

        const payrollRecord = new Models.PayrollPayment(paymentData);
        const payroll = [...this.stateManager.state.payroll, payrollRecord];
        this.stateManager.updateState({ payroll });

        // Limpiar bonos y deducciones temporales después de la nómina
        this.clearBonus(employee.name);
        this.clearDeduction(employee.name);

        return payrollRecord;
    }

    getHistory(filters) {
        let history = this.stateManager.state.payroll;

        if (filters.month) {
            history = history.filter(p => p.month == filters.month);
        }
        if (filters.year) {
            history = history.filter(p => p.year == filters.year);
        }
        if (filters.employeeId) {
            history = history.filter(p => p.employeeId == filters.employeeId);
        }
        return history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    clearEmployeePayroll(employeeId) {
        const payroll = this.stateManager.state.payroll.filter(
            p => p.employeeId !== employeeId
        );
        this.stateManager.updateState({ payroll });
    }

    // --- Bonificaciones ---
    addBonus(employeeName, amount, reason) {
        const bonus = new Models.Bonus(amount, reason);
        const bonuses = { ...this.stateManager.state.bonuses };

        if (!bonuses[employeeName]) {
            bonuses[employeeName] = [];
        }
        bonuses[employeeName].push(bonus);
        this.stateManager.updateState({ bonuses });
    }

    getAllBonuses() {
        return this.stateManager.state.bonuses;
    }

    getEmployeeBonuses(employeeName) {
        return this.stateManager.state.bonuses[employeeName] || [];
    }

    clearBonus(employeeName) {
        const bonuses = { ...this.stateManager.state.bonuses };
        delete bonuses[employeeName];
        this.stateManager.updateState({ bonuses });
    }

    // --- Deducciones ---
    addDeduction(employeeName, amount, reason) {
        const deduction = new Models.Deduction(amount, reason);
        const deductions = { ...this.stateManager.state.deductions };

        if (!deductions[employeeName]) {
            deductions[employeeName] = [];
        }
        deductions[employeeName].push(deduction);
        this.stateManager.updateState({ deductions });
    }

    getAllDeductions() {
        return this.stateManager.state.deductions;
    }

    getEmployeeDeductions(employeeName) {
        const employeeDeductions = this.stateManager.state.deductions[employeeName] || [];
        return employeeDeductions;
    }

    clearDeduction(employeeName) {
        const deductions = { ...this.stateManager.state.deductions };
        delete deductions[employeeName];
        this.stateManager.updateState({ deductions });
    }
}

export class DepartmentService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    add(departmentData) {
        const department = new Models.Department(departmentData);
        const departments = [...this.stateManager.state.departments, department];
        this.stateManager.updateState({ departments });
        return department;
    }

    update(id, updates) {
        const departments = this.stateManager.state.departments.map(dep =>
            dep.id === id
                ? { ...dep, ...updates, updatedAt: new Date().toISOString() }
                : dep
        );
        this.stateManager.updateState({ departments });
    }

    delete(id) {
        const departments = this.stateManager.state.departments.filter(
            dep => dep.id !== id
        );
        this.stateManager.updateState({ departments });
    }

    getById(id) {
        return this.stateManager.state.departments.find(
            dep => dep.id === id
        );
    }

    getAll() {
        return this.stateManager.state.departments;
    }
}

export class SettingsService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    get() {
        return this.stateManager.getSettings();
    }

    update(updates) {
        this.stateManager.updateSettings(updates);
    }
}