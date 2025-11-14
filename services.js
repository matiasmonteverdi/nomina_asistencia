// ============================================
// BUSINESS SERVICES - Lógica de negocio
// ============================================

import { Employee, AttendanceRecord, Absence, PayrollPayment, Bonus, Deduction, Department } from './models.js';
import { TimeCalculator, DateUtils } from './utils.js';

export class EmployeeService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    add(employeeData) {
        const employee = new Employee(employeeData);
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
        return this.stateManager.state.employees.filter(
            emp => emp.status === 'activo'
        );
    }
}

export class AttendanceService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    addRecord(recordData) {
        const record = new AttendanceRecord(recordData);
        const attendance = [...this.stateManager.state.attendance, record];
        this.stateManager.updateState({ attendance });
        return record;
    }

    getEmployeeRecordsToday(employeeId) {
        const today = new Date().toDateString();
        return this.stateManager.state.attendance.filter(record =>
            record.employeeId === employeeId &&
            new Date(record.timestamp).toDateString() === today
        );
    }

    getTodayRecords() {
        return this.stateManager.state.attendance.filter(record =>
            DateUtils.isToday(record.timestamp)
        );
    }

    getRecordsByDateRange(startDate, endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        
        return this.stateManager.state.attendance.filter(record => {
            const recordDate = new Date(record.timestamp).getTime();
            return recordDate >= start && recordDate <= end;
        });
    }

    calculateHoursForEmployee(employeeId, month, year) {
        const records = this.stateManager.state.attendance.filter(record => {
            const recordDate = new Date(record.timestamp);
            return record.employeeId === employeeId &&
                recordDate.getMonth() === month &&
                recordDate.getFullYear() === year;
        });

        const dayGroups = this.groupRecordsByDay(records);
        let totalHours = 0;

        Object.values(dayGroups).forEach(dayRecords => {
            const hours = parseFloat(TimeCalculator.calculateWorkHours(dayRecords));
            totalHours += hours;
        });

        return totalHours;
    }

    groupRecordsByDay(records) {
        const groups = {};
        records.forEach(record => {
            const day = new Date(record.timestamp).toDateString();
            if (!groups[day]) groups[day] = [];
            groups[day].push(record);
        });
        return groups;
    }

    isLateEntry(record, settings) {
        if (record.action !== 'entrada') return false;
        return TimeCalculator.isLate(
            record.timestamp,
            settings.workStartTime,
            settings.lateToleranceMinutes
        );
    }
}

export class AbsenceService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    add(absenceData) {
        const absence = new Absence(absenceData);
        const absences = [...this.stateManager.state.absences, absence];
        this.stateManager.updateState({ absences });
        return absence;
    }

    delete(id) {
        const absences = this.stateManager.state.absences.filter(
            abs => abs.id !== id
        );
        this.stateManager.updateState({ absences });
    }

    getByMonth(month, year) {
        return this.stateManager.state.absences.filter(absence => {
            const absDate = new Date(absence.dateStart);
            return absDate.getMonth() === month && 
                absDate.getFullYear() === year;
        });
    }

    getRecent(limit = 10) {
        return [...this.stateManager.state.absences]
            .reverse()
            .slice(0, limit);
    }
}

export class ShiftService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    update(employeeName, day, shift) {
        const shifts = { ...this.stateManager.state.shifts };
        if (!shifts[employeeName]) shifts[employeeName] = {};
        shifts[employeeName][day] = shift;
        this.stateManager.updateState({ shifts });
    }

    getEmployeeShifts(employeeName) {
        return this.stateManager.state.shifts[employeeName] || {};
    }

    autoFillStandard(employees, days, standardShift = '09:00-18:00') {
        const shifts = { ...this.stateManager.state.shifts };
        
        employees.forEach(emp => {
            if (!shifts[emp.name]) shifts[emp.name] = {};
            days.forEach(day => {
                shifts[emp.name][day] = standardShift;
            });
        });

        this.stateManager.updateState({ shifts });
    }
}

export class PayrollService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    calculatePayment(paymentData) {
        const { hours, hourlyRate, employeeName } = paymentData;
        const settings = this.stateManager.settings;

        const baseSalary = hours * hourlyRate;
        const overtimeBonus = hours > settings.overtimeThreshold 
            ? settings.overtimeBonus 
            : 0;
        
        const bonusTotal = this.getTotalBonus(employeeName) + overtimeBonus;
        const deductionTotal = this.getTotalDeduction(employeeName);
        
        const grossSalary = baseSalary + bonusTotal;
        const taxes = grossSalary * (settings.taxPercentage / 100);
        const netSalary = grossSalary - taxes - deductionTotal;

        return {
            baseSalary,
            bonuses: bonusTotal,
            deductions: deductionTotal,
            taxes,
            grossSalary,
            netSalary
        };
    }

    addPayment(paymentData) {
        const payment = new PayrollPayment(paymentData);
        const payroll = [...this.stateManager.state.payroll, payment];
        this.stateManager.updateState({ payroll });
        return payment;
    }

    getPaymentHistory(filters = {}) {
        let payroll = [...this.stateManager.state.payroll];

        if (filters.month) {
            payroll = payroll.filter(p => 
                p.month.toLowerCase().includes(filters.month.toLowerCase())
            );
        }

        if (filters.year) {
            payroll = payroll.filter(p => {
                const [, year] = p.month.split(' de ');
                return year === filters.year;
            });
        }

        if (filters.employeeId) {
            payroll = payroll.filter(p => 
                p.employeeId === parseInt(filters.employeeId)
            );
        }

        return payroll;
    }

    addBonus(employeeName, amount, reason = '') {
        const bonuses = { ...this.stateManager.state.bonuses };
        if (!bonuses[employeeName]) bonuses[employeeName] = [];
        bonuses[employeeName].push(new Bonus(amount, reason));
        this.stateManager.updateState({ bonuses });
    }

    getTotalBonus(employeeName) {
        const employeeBonuses = this.stateManager.state.bonuses[employeeName] || [];
        return employeeBonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
    }

    clearBonus(employeeName) {
        const bonuses = { ...this.stateManager.state.bonuses };
        delete bonuses[employeeName];
        this.stateManager.updateState({ bonuses });
    }

    addDeduction(employeeName, amount, reason = '') {
        const deductions = { ...this.stateManager.state.deductions };
        if (!deductions[employeeName]) deductions[employeeName] = [];
        deductions[employeeName].push(new Deduction(amount, reason));
        this.stateManager.updateState({ deductions });
    }

    getTotalDeduction(employeeName) {
        const employeeDeductions = this.stateManager.state.deductions[employeeName] || [];
        return employeeDeductions.reduce((sum, ded) => sum + ded.amount, 0);
    }

    clearDeduction(employeeName) {
        const deductions = { ...this.stateManager.state.deductions };
        delete deductions[employeeName];
        this.stateManager.updateState({ deductions });
    };
}

export class DepartmentService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    add(departmentData) {
        const department = new Department(departmentData);
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
            dep => dep.id === parseInt(id)
        );
    }

    getAll() {
        return this.stateManager.state.departments;
    }
}