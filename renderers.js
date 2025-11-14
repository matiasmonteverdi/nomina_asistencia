// ============================================
// RENDERERS - Renderización de vistas
// ============================================

import { UIComponents } from './ui-components.js';
import { DateUtils, TimeCalculator, NumberUtils } from './utils.js';
import { ABSENCE_TYPES, DAYS_OF_WEEK } from './config.js';

export class DashboardRenderer {
    constructor(services) {
        this.services = services;
    }

    renderQuickStats() {
        const employees = this.services.employee.getAll();
        const todayAttendance = this.services.attendance.getTodayRecords();
        const settings = this.services.stateManager.getSettings();

        const presentToday = new Set(
            todayAttendance.filter(r => r.action === 'entrada').map(r => r.employeeId)
        ).size;

        const lateToday = todayAttendance.filter(r =>
            r.action === 'entrada' &&
            TimeCalculator.isLate(r.timestamp, settings.workStartTime, settings.lateToleranceMinutes)
        ).length;

        const absentToday = employees.length - presentToday;

        document.getElementById('quickPresentToday').textContent = presentToday;
        document.getElementById('quickAbsentToday').textContent = absentToday;
        document.getElementById('quickLateToday').textContent = lateToday;
        document.getElementById('quickTotalEmployees').textContent = employees.length;
    }

    renderAttendanceStats() {
        const employees = this.services.employee.getAll();
        const todayAttendance = this.services.attendance.getTodayRecords();
        const settings = this.services.stateManager.getSettings();

        const presentToday = new Set(
            todayAttendance.filter(r => r.action === 'entrada').map(r => r.employeeId)
        ).size;

        const lateToday = todayAttendance.filter(r =>
            r.action === 'entrada' &&
            TimeCalculator.isLate(r.timestamp, settings.workStartTime, settings.lateToleranceMinutes)
        ).length;

        // Calculate average hours
        const completedShifts = {};
        todayAttendance.forEach(r => {
            if (!completedShifts[r.employeeId]) completedShifts[r.employeeId] = [];
            completedShifts[r.employeeId].push(r);
        });

        let totalHours = 0;
        let shiftsCompleted = 0;
        
        Object.values(completedShifts).forEach(records => {
            const hasEntry = records.some(r => r.action === 'entrada');
            const hasExit = records.some(r => r.action === 'salida');
            if (hasEntry && hasExit) {
                totalHours += parseFloat(TimeCalculator.calculateWorkHours(records));
                shiftsCompleted++;
            }
        });

        const avgHours = shiftsCompleted > 0 
            ? (totalHours / shiftsCompleted).toFixed(1) 
            : 0;

        // Count absences this month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const absencesThisMonth = this.services.absence.getByMonth(currentMonth, currentYear).length;

        document.getElementById('statPresentToday').textContent = presentToday;
        document.getElementById('statLateToday').textContent = lateToday;
        document.getElementById('statAvgHours').textContent = avgHours + 'h';
        document.getElementById('statAbsences').textContent = absencesThisMonth;
    }
}

export class EmployeeRenderer {
    constructor(services, eventHandlers) {
        this.services = services;
        this.eventHandlers = eventHandlers;
    }

    renderList() {
        const container = document.getElementById('employeeList');
        const employees = this.services.employee.getAll();

        if (employees.length === 0) {
            container.innerHTML = UIComponents.createEmptyState(
                'No hay empleados registrados. Comienza agregando tu primer empleado.',
                'fa-users'
            );
            return;
        }

        container.innerHTML = '<div class="row">' +
            employees.map(emp => UIComponents.createEmployeeCard(emp)).join('') +
            '</div>';

        // Add event listeners
        container.querySelectorAll('.edit-employee').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const empId = parseInt(e.currentTarget.dataset.id);
                this.eventHandlers.onEditEmployee(empId);
            });
        });

        container.querySelectorAll('.delete-employee').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const empId = parseInt(e.currentTarget.dataset.id);
                this.eventHandlers.onDeleteEmployee(empId);
            });
        });
    }
}

export class AttendanceRenderer {
    constructor(services) {
        this.services = services;
    }

    renderTodayTable() {
        const tbody = document.getElementById('todayRecords');
        const employees = this.services.employee.getAll();
        const todayAttendance = this.services.attendance.getTodayRecords();

        if (employees.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="fas fa-users fa-3x mb-3 d-block"></i>
                        No hay empleados registrados
                    </td>
                </tr>
            `;
            return;
        }

        const rows = employees.map(emp => {
            const empRecords = todayAttendance.filter(r => r.employeeId === emp.id);
            const entrada = empRecords.find(r => r.action === 'entrada');
            const salida = empRecords.find(r => r.action === 'salida');
            const breakRecords = empRecords.filter(r => r.action.includes('break'));

            const hours = entrada && salida 
                ? TimeCalculator.calculateWorkHours(empRecords) 
                : '-';
            
            const status = entrada && !salida 
                ? 'Presente' 
                : entrada && salida 
                    ? 'Completado' 
                    : 'Ausente';
            
            const statusClass = entrada && !salida 
                ? 'success' 
                : entrada && salida 
                    ? 'info' 
                    : 'secondary';

            return `
                <td><strong>${emp.name}</strong><br><small class="text-muted">${emp.position}</small></td>
                <td class="time-badge">${entrada ? DateUtils.formatTime(entrada.timestamp) : '-'}</td>
                <td class="time-badge">${salida ? DateUtils.formatTime(salida.timestamp) : '-'}</td>
                <td><small>${breakRecords.length > 0 ? breakRecords.length / 2 + ' breaks' : '-'}</small></td>
                <td><strong>${hours}h</strong></td>
                <td><span class="badge bg-${statusClass}">${status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-details" data-emp-id="${emp.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
        });

        tbody.innerHTML = rows.map(row => `<tr>${row}</tr>`).join('');
    }
}

export class AbsenceRenderer {
    constructor(services, eventHandlers) {
        this.services = services;
        this.eventHandlers = eventHandlers;
    }

    renderList() {
        const container = document.getElementById('absenceList');
        const absences = this.services.absence.getRecent(10);

        if (absences.length === 0) {
            container.innerHTML = UIComponents.createEmptyState(
                'No hay ausencias registradas',
                'fa-calendar-check'
            );
            return;
        }

        const rows = absences.map(absence => {
            const typeConfig = ABSENCE_TYPES[absence.type.toUpperCase()] || ABSENCE_TYPES.VACACIONES;
            return `
                <td>${absence.employeeName}</td>
                <td>${DateUtils.formatDate(absence.dateStart)}</td>
                <td>${DateUtils.formatDate(absence.dateEnd)}</td>
                <td>${absence.days} día(s)</td>
                <td>${typeConfig.icon} ${absence.type}</td>
                <td><small>${absence.reason || '-'}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-danger delete-absence" data-id="${absence.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        });

        container.innerHTML = UIComponents.createTable(
            ['Empleado', 'Inicio', 'Fin', 'Días', 'Tipo', 'Motivo', 'Acción'],
            rows,
            'No hay ausencias'
        );

        // Add delete listeners
        container.querySelectorAll('.delete-absence').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const absId = parseInt(e.currentTarget.dataset.id);
                this.eventHandlers.onDeleteAbsence(absId);
            });
        });
    }
}

export class ShiftRenderer {
    constructor(services, eventHandlers) {
        this.services = services;
        this.eventHandlers = eventHandlers;
    }

    renderTable() {
        const container = document.getElementById('shiftsTable');
        const employees = this.services.employee.getActive();
        const state = this.services.stateManager.getState();
        const shifts = state.shifts;

        if (employees.length === 0) {
            container.innerHTML = UIComponents.createEmptyState(
                'Agrega empleados para gestionar turnos',
                'fa-calendar-week'
            );
            return;
        }

        const rows = employees.map(emp => {
            if (!shifts[emp.name]) {
                shifts[emp.name] = {};
                DAYS_OF_WEEK.forEach(day => shifts[emp.name][day] = '');
            }

            const cells = DAYS_OF_WEEK.map(day => {
                const shift = shifts[emp.name][day] || '';
                return `<td contenteditable="true" class="shift-cell" data-employee="${emp.name}" data-day="${day}">${shift}</td>`;
            }).join('');

            return `<td><strong>${emp.name}</strong></td>${cells}`;
        });

        container.innerHTML = UIComponents.createTable(
            ['Empleado', ...DAYS_OF_WEEK],
            rows,
            'No hay turnos'
        );

        // Add edit listeners
        container.querySelectorAll('.shift-cell').forEach(cell => {
            cell.addEventListener('blur', (e) => {
                const employee = e.target.dataset.employee;
                const day = e.target.dataset.day;
                const shift = e.target.textContent.trim();
                this.eventHandlers.onUpdateShift(employee, day, shift);
            });
        });
    }
}

export class PayrollRenderer {
    constructor(services) {
        this.services = services;
    }

    renderHistory(filters = {}) {
        const container = document.getElementById('payrollHistory');
        const payroll = this.services.payroll.getPaymentHistory(filters);

        if (payroll.length === 0) {
            container.innerHTML = UIComponents.createEmptyState(
                'No hay pagos registrados',
                'fa-file-invoice-dollar'
            );
            return;
        }

        const rows = payroll.reverse().map(payment => `
            <td>${payment.employeeName}</td>
            <td>${payment.month}</td>
            <td>${payment.period}</td>
            <td>${payment.hours}h</td>
            <td>$${payment.grossSalary.toFixed(2)}</td>
            <td class="text-danger">-$${payment.taxes.toFixed(2)}</td>
            <td class="text-success"><strong>$${payment.netSalary.toFixed(2)}</strong></td>
        `);

        container.innerHTML = UIComponents.createTable(
            ['Empleado', 'Período', 'Tipo', 'Horas', 'Bruto', 'Impuestos', 'Neto'],
            rows,
            'No hay pagos que coincidan'
        );
    }

    renderReceipt(payment) {
        const container = document.getElementById('payrollResult');
        container.innerHTML = UIComponents.createPayrollReceipt(payment);
    }

    renderBonusList() {
        const container = document.getElementById('bonusList');
        const state = this.services.stateManager.getState();
        const bonuses = state.bonuses;

        if (Object.keys(bonuses).length === 0) {
            container.innerHTML = '<p class="text-muted">No hay bonos pendientes</p>';
            return;
        }

        const html = Object.entries(bonuses).map(([employee, bonusList]) => {
            const total = NumberUtils.sumArray(bonusList.map(b => b.amount));
            return `
                <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                    <div>
                        <strong>${employee}</strong>
                        <br>
                        <small class="text-muted">${bonusList.map(b => b.reason || 'Sin concepto').join(', ')}</small>
                    </div>
                    <span class="badge bg-info">$${total.toFixed(2)}</span>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    renderDeductionList() {
        const container = document.getElementById('deductionList');
        const state = this.services.stateManager.getState();
        const deductions = state.deductions;

        if (Object.keys(deductions).length === 0) {
            container.innerHTML = '<p class="text-muted">No hay deducciones pendientes</p>';
            return;
        }

        const html = Object.entries(deductions).map(([employee, deductionList]) => {
            const total = NumberUtils.sumArray(deductionList.map(d => d.amount));
            return `
                <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                    <div>
                        <strong>${employee}</strong>
                        <br>
                        <small class="text-muted">${deductionList.map(d => d.reason || 'Sin concepto').join(', ')}</small>
                    </div>
                    <span class="badge bg-warning">$${total.toFixed(2)}</span>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }
}

export class DepartmentRenderer {
    constructor(services, eventHandlers) {
        this.services = services;
        this.eventHandlers = eventHandlers;
    }

    renderList() {
        const container = document.getElementById('departmentList');
        const departments = this.services.department.getAll();

        if (departments.length === 0) {
            container.innerHTML = UIComponents.createEmptyState(
                'No hay departamentos registrados',
                'fa-building'
            );
            return;
        }

        const rows = departments.map(dep => `
            <td>${dep.name}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger delete-department" data-id="${dep.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `);

        container.innerHTML = UIComponents.createTable(
            ['Nombre', 'Acciones'],
            rows,
            'No hay departamentos'
        );

        container.querySelectorAll('.delete-department').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const depId = parseInt(e.currentTarget.dataset.id);
                this.eventHandlers.onDeleteDepartment(depId);
            });
        });
    }

    renderSelectOptions() {
        const selects = [
            document.getElementById('employeeDepartment'),
            document.getElementById('editEmployeeDepartment')
        ];

        const departments = this.services.department.getAll();
        const options = departments.map(dep => 
            `<option value="${dep.name}">${dep.name}</option>`
        ).join('');

        selects.forEach(select => {
            if(select) {
                const firstOption = select.querySelector('option[value=""]');
                select.innerHTML = '';
                if (firstOption) select.appendChild(firstOption);
                select.innerHTML += options;
            }
        });
    }
}