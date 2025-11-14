// ============================================
// EVENT CONTROLLERS - Controladores de eventos
// ============================================

import { Validator, DateUtils, TimeCalculator, FileUtils } from './utils.js';
import { NotificationManager, FormHandler } from './ui-components.js';

export class EmployeeController {
    constructor(services, renderer) {
        this.services = services;
        this.renderer = renderer;
    }

    async handleAdd(e) {
        e.preventDefault();
        
        try {
            const employeeData = {
                name: document.getElementById('employeeName').value.trim(),
                position: document.getElementById('employeePosition').value.trim(),
                department: document.getElementById('employeeDepartment').value,
                email: document.getElementById('employeeEmail').value.trim(),
                phone: document.getElementById('employeePhone').value.trim(),
                startDate: document.getElementById('employeeStartDate').value,
                salary: parseFloat(document.getElementById('employeeSalary').value) || 0,
                contractType: document.getElementById('employeeContractType').value
            };

            Validator.required(employeeData.name, 'Nombre');
            Validator.required(employeeData.position, 'Puesto');
            Validator.required(employeeData.department, 'Departamento');

            if (employeeData.email) {
                Validator.email(employeeData.email);
            }

            this.services.employee.add(employeeData);
            NotificationManager.show(`✅ Empleado ${employeeData.name} agregado correctamente`);

            const modal = bootstrap.Modal.getInstance(document.getElementById('employeeModal'));
            if (modal) modal.hide();
            
            FormHandler.clearForm('employeeForm');
        } catch (error) {
            NotificationManager.show(error.message, 'error');
        }
    }

    async handleEdit(e) {
        e.preventDefault();
        
        try {
            const employeeId = parseInt(document.getElementById('editEmployeeId').value);
            const updates = {
                name: document.getElementById('editEmployeeName').value.trim(),
                position: document.getElementById('editEmployeePosition').value.trim(),
                department: document.getElementById('editEmployeeDepartment').value,
                email: document.getElementById('editEmployeeEmail').value.trim(),
                status: document.getElementById('editEmployeeStatus').value
            };

            Validator.required(updates.name, 'Nombre');
            Validator.required(updates.position, 'Puesto');

            this.services.employee.update(employeeId, updates);
            NotificationManager.show('✅ Empleado actualizado correctamente');

            const modal = bootstrap.Modal.getInstance(document.getElementById('editEmployeeModal'));
            if (modal) modal.hide();
        } catch (error) {
            NotificationManager.show(error.message, 'error');
        }
    }

    openEditModal(employeeId) {
        const employee = this.services.employee.getById(employeeId);
        if (!employee) return;

        FormHandler.setFormData('editEmployeeModal', {
            editEmployeeId: employee.id,
            editEmployeeName: employee.name,
            editEmployeePosition: employee.position,
            editEmployeeDepartment: employee.department,
            editEmployeeEmail: employee.email || '',
            editEmployeeStatus: employee.status || 'activo'
        });

        new bootstrap.Modal(document.getElementById('editEmployeeModal')).show();
    }

    handleDelete(employeeId) {
        const employee = this.services.employee.getById(employeeId);
        if (!employee) return;

        NotificationManager.confirm(
            `¿Estás seguro de eliminar a ${employee.name}?`,
            () => {
                this.services.employee.delete(employeeId);
                NotificationManager.show(`✅ Empleado ${employee.name} eliminado correctamente`);
            }
        );
    }
}

export class AttendanceController {
    constructor(services) {
        this.services = services;
    }

    handleRecord(e) {
        e.preventDefault();
        try {
            const employeeId = parseInt(document.getElementById('employeeSelect').value);
            const employee = this.services.employee.getById(employeeId);
            if (!employee) throw new Error('Empleado no válido');

            const recordData = {
                employeeId: employee.id,
                employeeName: employee.name,
                action: document.getElementById('actionSelect').value,
                timestamp: document.getElementById('manualTime').value
                    ? new Date(new Date().toDateString() + ' ' + document.getElementById('manualTime').value)
                    : new Date(),
                notes: document.getElementById('attendanceNotes').value.trim()
            };

            this.services.attendance.addRecord(recordData);
            NotificationManager.show('✅ Registro de asistencia guardado.');
            FormHandler.clearForm('attendanceForm');
        } catch (error) {
            NotificationManager.show(error.message, 'error');
        }
    }
}

export class AbsenceController {
    constructor(services) {
        this.services = services;
    }

    handleAdd(e) {
        e.preventDefault();
        try {
            const employeeId = parseInt(document.getElementById('absenceEmployee').value);
            const employee = this.services.employee.getById(employeeId);
            if (!employee) throw new Error('Empleado no válido');

            const absenceData = {
                employeeId: employee.id,
                employeeName: employee.name,
                dateStart: document.getElementById('absenceDateStart').value,
                dateEnd: document.getElementById('absenceDateEnd').value,
                type: document.getElementById('absenceType').value,
                reason: document.getElementById('absenceReason').value.trim()
            };

            Validator.required(absenceData.dateStart, 'Fecha de inicio');
            Validator.required(absenceData.dateEnd, 'Fecha de fin');
            Validator.dateRange(absenceData.dateStart, absenceData.dateEnd);

            absenceData.days = DateUtils.calculateDaysBetween(absenceData.dateStart, absenceData.dateEnd);

            this.services.absence.add(absenceData);
            NotificationManager.show('✅ Ausencia registrada correctamente.');
            FormHandler.clearForm('absenceForm');
        } catch (error) {
            NotificationManager.show(error.message, 'error');
        }
    }

    handleDelete(id) {
        NotificationManager.confirm('¿Seguro que quieres eliminar esta ausencia?', () => {
            this.services.absence.delete(id);
            NotificationManager.show('✅ Ausencia eliminada.');
        });
    }
}

export class ShiftController {
    constructor(services) {
        this.services = services;
    }

    handleUpdate(employee, day, shift) {
        this.services.shift.update(employee, day, shift);
        NotificationManager.show(`Turno de ${employee} para el ${day} actualizado.`, 'info');
    }

    handleAutoFill() {
        const activeEmployees = this.services.employee.getActive();
        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        this.services.shift.autoFillStandard(activeEmployees, days);
        NotificationManager.show('✅ Horarios rellenados con el turno estándar.');
    }
}

export class PayrollController {
    constructor(services) {
        this.services = services;
    }

    handleCalculate(e) {
        e.preventDefault();
        try {
            const employeeId = parseInt(document.getElementById('payrollEmployee').value);
            const employee = this.services.employee.getById(employeeId);
            if (!employee) throw new Error('Empleado no válido');

            const paymentData = {
                employeeId: employee.id,
                employeeName: employee.name,
                period: document.getElementById('payrollPeriod').value,
                month: DateUtils.getMonthYear(new Date()),
                hours: parseFloat(document.getElementById('hoursWorked').value),
                hourlyRate: parseFloat(document.getElementById('hourlyRate').value)
            };

            Validator.number(paymentData.hours, 'Horas trabajadas');
            Validator.number(paymentData.hourlyRate, 'Tarifa por hora');

            const result = this.services.payroll.calculatePayment(paymentData);
            const finalPayment = { ...paymentData, ...result };

            this.services.payroll.addPayment(finalPayment);
            this.services.payroll.clearBonus(employee.name);
            this.services.payroll.clearDeduction(employee.name);

            NotificationManager.show('✅ Nómina calculada y guardada.');
            document.getElementById('payrollResult').innerHTML = UIComponents.createPayrollReceipt(finalPayment);

        } catch (error) {
            NotificationManager.show(error.message, 'error');
        }
    }

    handleAutoCalculateHours() {
        const employeeId = parseInt(document.getElementById('payrollEmployee').value);
        if (!employeeId) {
            NotificationManager.show('Por favor, selecciona un empleado primero.', 'warning');
            return;
        }

        const now = new Date();
        const hours = this.services.attendance.calculateHoursForEmployee(employeeId, now.getMonth(), now.getFullYear());
        document.getElementById('hoursWorked').value = hours;
        NotificationManager.show(`Horas calculadas para el mes: ${hours}`, 'info');
    }

    handleAddBonus(e) {
        e.preventDefault();
        try {
            const employeeId = parseInt(document.getElementById('bonusEmployee').value);
            const employee = this.services.employee.getById(employeeId);
            if (!employee) throw new Error('Empleado no válido');

            const amount = parseFloat(document.getElementById('bonusAmount').value);
            const reason = document.getElementById('bonusReason').value.trim();

            Validator.number(amount, 'Monto de la bonificación');

            this.services.payroll.addBonus(employee.name, amount, reason);
            NotificationManager.show('✅ Bonificación agregada.');
            FormHandler.clearForm('bonusForm');
        } catch (error) {
            NotificationManager.show(error.message, 'error');
        }
    }

    handleAddDeduction(e) {
        e.preventDefault();
        try {
            const employeeId = parseInt(document.getElementById('deductionEmployee').value);
            const employee = this.services.employee.getById(employeeId);
            if (!employee) throw new Error('Empleado no válido');

            const amount = parseFloat(document.getElementById('deductionAmount').value);
            const reason = document.getElementById('deductionReason').value.trim();

            Validator.number(amount, 'Monto de la deducción');

            this.services.payroll.addDeduction(employee.name, amount, reason);
            NotificationManager.show('✅ Deducción agregada.');
            FormHandler.clearForm('deductionForm');
        } catch (error) {
            NotificationManager.show(error.message, 'error');
        }
    }
}

export class DepartmentController {
    constructor(services) {
        this.services = services;
    }

    handleAdd(e) {
        e.preventDefault();
        try {
            const departmentName = document.getElementById('departmentName').value.trim();
            Validator.required(departmentName, 'Nombre del departamento');

            this.services.department.add({ name: departmentName });
            NotificationManager.show(`✅ Departamento ${departmentName} agregado correctamente`);
            FormHandler.clearForm('departmentForm');
        } catch (error) {
            NotificationManager.show(error.message, 'error');
        }
    }

    handleDelete(id) {
        const department = this.services.department.getById(id);
        if (!department) return;

        NotificationManager.confirm(
            `¿Estás seguro de eliminar el departamento ${department.name}?`,
            () => {
                this.services.department.delete(id);
                NotificationManager.show(`✅ Departamento ${department.name} eliminado correctamente`);
            }
        );
    }
}
