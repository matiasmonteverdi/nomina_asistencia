// ============================================
// RENDERERS - Renderización de vistas
// ============================================

import * as UI from './ui-componentes.js';
import * as Utils from './utils.js';
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
            todayAttendance.filter(r => r.action.type === 'ENTRADA').map(r => r.employeeId)
        ).size;

        const lateToday = todayAttendance.filter(r =>
            r.action.type === 'ENTRADA' &&
            Utils.TimeCalculator.isLate(r.timestamp, settings.workStartTime, settings.lateToleranceMinutes)
        ).length;

        const absentToday = employees.length - presentToday;

        document.getElementById('quickPresentToday').textContent = presentToday;
        document.getElementById('quickAbsentToday').textContent = absentToday;
        document.getElementById('quickLateToday').textContent = lateToday;
        document.getElementById('quickTotalEmployees').textContent = employees.length;
    }

    renderAttendanceStats() {
        const employees = this.services.employee.getAll();
        const container = document.getElementById('attendanceStatsContainer');

        if (!container) return;

        if (employees.length === 0) {
            container.innerHTML = UI.UIComponents.createEmptyState(
                'Aún no hay empleados',
                'Agrega empleados para ver las estadísticas de asistencia.',
                'fas fa-users'
            );
            return;
        }

        const employeeStats = employees.map(emp => {
            const totalHours = this.services.attendance.getTotalHoursWorked(emp.id);
            const totalAbsences = this.services.absence.getTotalDaysOff(emp.id);
            const totalLateChecks = this.services.attendance.getTotalLateChecks(emp.id);

            const hoursFormatted = Utils.TimeCalculator.formatDuration(totalHours);

            return `
                <tr>
                    <td>
                        <i class="fas fa-user-circle me-2"></i> ${emp.name}
                        <small class="text-muted d-block">${emp.position}</small>
                    </td>
                    <td><span class="badge bg-primary">${hoursFormatted}</span></td>
                    <td><span class="badge bg-warning">${totalLateChecks}</span></td>
                    <td><span class="badge bg-danger">${totalAbsences} días</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-info view-employee-detail" data-id="${emp.id}">
                            <i class="fas fa-search"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = UI.UIComponents.createTable(
            ['Empleado', 'Horas Totales', 'Tardanzas', 'Ausencias', 'Detalle'],
            employeeStats,
            'No hay registros de asistencia detallados'
        );

        // Asumiendo que el controlador de empleados manejará la vista de detalle
        container.querySelectorAll('.view-employee-detail').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const employeeId = parseInt(e.currentTarget.dataset.id);
                // Aquí se llamaría al controlador para abrir el modal o sección de detalle
                // this.eventHandlers.onViewEmployeeDetail(employeeId); 
                UI.NotificationManager.show(`Mostrando detalle del empleado ${employeeId}`, 'info');
            });
        });
    }
}

export class EmployeeRenderer {
    constructor(services, fullRenderCallback) {
        this.services = services;
        this.fullRenderCallback = fullRenderCallback;
    }

    renderList() {
        const employees = this.services.employee.getAll();
        const container = document.getElementById('employeeListContainer');

        if (!container) return;

        if (employees.length === 0) {
            container.innerHTML = UI.UIComponents.createEmptyState(
                'No hay empleados registrados',
                'Utiliza el botón "Nuevo Empleado" para comenzar.',
                'fas fa-user-plus'
            );
            return;
        }

        const cards = employees.map(emp => {
            const statusClass = emp.status === 'activo' ? 'status-active bg-success' : 'status-offline bg-secondary';
            const icon = emp.status === 'activo' ? '🟢' : '⚫';
            const statusText = emp.status === 'activo' ? 'Activo' : 'Inactivo';

            return `
                <div class="col-sm-6 col-lg-4 col-xl-3 mb-4">
                    <div class="card employee-card shadow-sm" data-id="${emp.id}" 
                         data-bs-toggle="modal" data-bs-target="#editEmployeeModal">
                        <div class="card-body text-center">
                            <div class="employee-status ${statusClass}"></div>
                            <i class="fas fa-user-circle fa-3x text-primary mb-2"></i>
                            <h5 class="card-title">${emp.name}</h5>
                            <p class="card-text text-muted mb-1">${emp.position}</p>
                            <p class="card-text small mb-1">${emp.department}</p>
                            <p class="card-text small">
                                <span class="badge ${emp.status === 'activo' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}">
                                    ${icon} ${statusText}
                                </span>
                            </p>
                            <div class="mt-3">
                                <button class="btn btn-sm btn-outline-primary edit-employee-btn" data-id="${emp.id}">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-employee-btn" data-id="${emp.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="row">${cards}</div>`;

        // Añadir listeners para el modal de edición
        container.querySelectorAll('.edit-employee-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que se dispare el modal del card
                const id = parseInt(e.currentTarget.dataset.id);
                this.populateEditModal(id);
                const modal = UI.UIComponents.getModal('editEmployeeModal');
                if (modal) modal.show();
            });
        });

        // Añadir listeners para eliminar
        container.querySelectorAll('.delete-employee-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que se dispare el modal del card
                const id = parseInt(e.currentTarget.dataset.id);
                // Llamar al controlador para confirmar y eliminar
                this.services.employee.delete(id);
                this.fullRenderCallback();
            });
        });
    }

    populateEditModal(id) {
        const employee = this.services.employee.getById(id);
        if (!employee) return;

        document.getElementById('editEmployeeId').value = employee.id;
        document.getElementById('editEmployeeName').value = employee.name;
        document.getElementById('editEmployeePosition').value = employee.position;
        document.getElementById('editEmployeeDepartment').value = employee.department;
        document.getElementById('editEmployeeEmail').value = employee.email;
        document.getElementById('editEmployeePhone').value = employee.phone;
        document.getElementById('editEmployeeStartDate').value = employee.startDate;
        document.getElementById('editEmployeeSalary').value = employee.salary;
        document.getElementById('editEmployeeContractType').value = employee.contractType;
        document.getElementById('editEmployeeStatus').value = employee.status;
    }
}

export class AttendanceRenderer {
    constructor(services) {
        this.services = services;
    }

    renderTodayTable() {
        const records = this.services.attendance.getTodayRecords();
        const container = document.getElementById('attendanceTodayTable');

        if (!container) return;

        if (records.length === 0) {
            container.innerHTML = UI.UIComponents.createEmptyState(
                'No hay registros de hoy',
                'El primer empleado debe marcar su entrada.',
                'fas fa-clock'
            );
            return;
        }

        const rows = records.map(r => `
            <tr>
                <td>${r.employeeName}</td>
                <td><span class="badge bg-${r.action.class}">${r.action.label}</span></td>
                <td>${Utils.DateUtils.formatTime(r.timestamp)}</td>
                <td>${r.notes || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger delete-attendance-record" data-id="${r.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = UI.UIComponents.createTable(
            ['Empleado', 'Acción', 'Hora', 'Notas', ''],
            rows,
            'No hay registros de hoy'
        );

        container.querySelectorAll('.delete-attendance-record').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const recordId = parseInt(e.currentTarget.dataset.id);
                // Aquí se llamaría al controlador para eliminar
                // this.eventHandlers.onDeleteRecord(recordId);
                UI.NotificationManager.show(`Eliminar registro ${recordId}`, 'info');
            });
        });
    }
}

export class AbsenceRenderer {
    constructor(services, fullRenderCallback) {
        this.services = services;
        this.fullRenderCallback = fullRenderCallback;
    }

    renderList() {
        const absences = this.services.absence.getAll();
        const container = document.getElementById('absenceListContainer');

        if (!container) return;

        if (absences.length === 0) {
            container.innerHTML = UI.UIComponents.createEmptyState(
                'No hay ausencias registradas',
                'Agrega una nueva ausencia para un empleado.',
                'fas fa-calendar-times'
            );
            return;
        }

        const rows = absences.map(a => {
            const typeInfo = ABSENCE_TYPES[a.type] || { icon: '❓', label: a.type };
            const days = Utils.TimeCalculator.getDaysBetweenDates(a.startDate, a.endDate);
            const statusClass = a.type === 'ENFERMEDAD' ? 'bg-danger' : 'bg-info';

            return `
                <tr>
                    <td>${a.employeeName}</td>
                    <td>${Utils.DateUtils.formatDate(a.startDate)}</td>
                    <td>${Utils.DateUtils.formatDate(a.endDate)}</td>
                    <td><span class="badge ${statusClass}">${typeInfo.icon} ${typeInfo.label}</span></td>
                    <td>${days} día(s)</td>
                    <td>${a.notes || 'N/A'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger delete-absence-record" data-id="${a.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = UI.UIComponents.createTable(
            ['Empleado', 'Desde', 'Hasta', 'Tipo', 'Días', 'Notas', ''],
            rows,
            'No hay ausencias registradas'
        );

        container.querySelectorAll('.delete-absence-record').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const recordId = parseInt(e.currentTarget.dataset.id);
                // Aquí se llamaría al controlador para eliminar
                this.services.absence.deleteRecord(recordId);
                this.fullRenderCallback();
            });
        });
    }
}

export class ShiftRenderer {
    constructor(services, fullRenderCallback) {
        this.services = services;
        this.fullRenderCallback = fullRenderCallback;
    }

    renderTable() {
        const employees = this.services.employee.getAll();
        const container = document.getElementById('shiftTableContainer');
        const shifts = this.services.shift.getAll();

        if (!container) return;

        if (employees.length === 0) {
            container.innerHTML = UI.UIComponents.createEmptyState(
                'Sin empleados',
                'Agrega un empleado para gestionar sus turnos.',
                'fas fa-user-clock'
            );
            return;
        }

        const headerRow = ['Empleado', ...DAYS_OF_WEEK, 'Acción'];

        const rows = employees.map(emp => {
            const shiftCells = DAYS_OF_WEEK.map(day => {
                const shift = shifts[emp.id]?.[day];
                const shiftText = shift ? `${shift.startTime} - ${shift.endTime}` : 'No Asignado';
                return `<td class="shift-cell">${shiftText}</td>`;
            }).join('');

            return `
                <tr>
                    <td><i class="fas fa-user me-2"></i> ${emp.name}</td>
                    ${shiftCells}
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-shift-btn" data-id="${emp.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = UI.UIComponents.createTable(
            headerRow,
            rows,
            'No hay turnos asignados'
        );

        // Añadir listeners para editar
        container.querySelectorAll('.edit-shift-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                // Asumiendo que hay un modal para editar turnos
                // this.populateEditModal(id);
                // const modal = UI.UIComponents.getModal('editShiftModal');
                // if (modal) modal.show();
                UI.NotificationManager.show(`Función para editar turno del empleado ${id}`, 'info');
            });
        });
    }
}

export class PayrollRenderer {
    constructor(services, fullRenderCallback) {
        this.services = services;
        this.fullRenderCallback = fullRenderCallback;
    }

    renderHistory(filters = {}) {
        const payments = this.services.payroll.getHistory(filters);
        const container = document.getElementById('payrollHistoryTable');

        if (!container) return;

        if (payments.length === 0) {
            container.innerHTML = UI.UIComponents.createEmptyState(
                'No hay nóminas calculadas',
                'Calcula la nómina para un empleado usando el formulario de arriba.',
                'fas fa-calculator'
            );
            return;
        }

        const rows = payments.map(p => `
            <tr>
                <td>${p.employeeName}</td>
                <td>${Utils.DateUtils.getMonthName(new Date(p.year, p.month - 1))} ${p.year}</td>
                <td>${p.hours}h</td>
                <td>${Utils.NumberUtils.formatCurrency(p.grossSalary)}</td>
                <td>${Utils.NumberUtils.formatCurrency(p.taxes)}</td>
                <td><span class="badge bg-success">${Utils.NumberUtils.formatCurrency(p.netSalary)}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-info view-payroll-detail" data-id="${p.id}">
                        <i class="fas fa-search"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = UI.UIComponents.createTable(
            ['Empleado', 'Periodo', 'Horas', 'Salario Bruto', 'Impuestos', 'Salario Neto', 'Detalle'],
            rows,
            'No hay registros de nómina'
        );

        container.querySelectorAll('.view-payroll-detail').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                // Abrir modal de detalle
                UI.NotificationManager.show(`Mostrando detalle de nómina ${id}`, 'info');
            });
        });
    }

    renderBonusList() {
        const bonuses = this.services.payroll.getAllBonuses();
        const container = document.getElementById('bonusListContainer');

        if (!container) return;

        const rows = Object.entries(bonuses).flatMap(([employeeName, list]) =>
            list.map(b => `
                <tr>
                    <td>${employeeName}</td>
                    <td>${Utils.DateUtils.formatDate(b.date)}</td>
                    <td><span class="badge bg-success">${Utils.NumberUtils.formatCurrency(b.amount)}</span></td>
                    <td>${b.reason || 'N/A'}</td>
                </tr>
            `)
        ).join('');

        container.innerHTML = UI.UIComponents.createTable(
            ['Empleado', 'Fecha', 'Monto', 'Razón'],
            rows,
            'No hay bonos registrados'
        );
    }

    renderDeductionList() {
        const deductions = this.services.payroll.getAllDeductions();
        const container = document.getElementById('deductionListContainer');

        if (!container) return;

        const rows = Object.entries(deductions).flatMap(([employeeName, list]) =>
            list.map(d => `
                <tr>
                    <td>${employeeName}</td>
                    <td>${Utils.DateUtils.formatDate(d.date)}</td>
                    <td><span class="badge bg-danger">${Utils.NumberUtils.formatCurrency(d.amount)}</span></td>
                    <td>${d.reason || 'N/A'}</td>
                </tr>
            `)
        ).join('');

        container.innerHTML = UI.UIComponents.createTable(
            ['Empleado', 'Fecha', 'Monto', 'Razón'],
            rows,
            'No hay deducciones registradas'
        );
    }
}

export class DepartmentRenderer {
    constructor(services, eventHandlers) {
        this.services = services;
        this.eventHandlers = eventHandlers;
    }

    renderList() {
        const departments = this.services.department.getAll();
        const container = document.getElementById('departmentListContainer');

        if (!container) return;

        if (departments.length === 0) {
            container.innerHTML = UI.UIComponents.createEmptyState(
                'No hay departamentos',
                'Agrega el primer departamento de tu empresa.',
                'fas fa-building'
            );
            return;
        }

        const rows = departments.map(dep => `
            <tr>
                <td>${dep.name}</td>
                <td>
                    <button class="btn btn-sm btn-outline-danger delete-department" data-id="${dep.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = UI.UIComponents.createTable(
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
            if (select) {
                // Guarda la primera opción (e.g., "Seleccionar...")
                const firstOption = select.querySelector('option[value=""]')?.outerHTML || '';

                // Limpia y re-añade la primera opción y las nuevas opciones
                select.innerHTML = firstOption + options;
            }
        });
    }
}

export class SettingsRenderer {
    constructor(services, fullRenderCallback) {
        this.services = services;
        this.fullRenderCallback = fullRenderCallback;
    }

    renderForm() {
        const settings = this.services.stateManager.getSettings();
        const form = document.getElementById('settingsForm');
        if (!form) return;

        // Populate fields
        document.getElementById('settingsCompanyName').value = settings.companyName;
        document.getElementById('settingsWorkStart').value = settings.workStartTime;
        document.getElementById('settingsWorkEnd').value = settings.workEndTime;
        document.getElementById('settingsLateTolerance').value = settings.lateToleranceMinutes;
        document.getElementById('settingsHourlyRate').value = settings.baseHourlyRate;
        document.getElementById('settingsTaxPercentage').value = settings.taxPercentage;
        document.getElementById('settingsOvertimeBonus').value = settings.overtimeBonus;
        document.getElementById('settingsOvertimeThreshold').value = settings.overtimeThreshold;

        // Radio buttons
        const radio = document.querySelector(`input[name="settingsOvertimeApproval"][value="${settings.overtimeApproval}"]`);
        if (radio) radio.checked = true;

        // Add event listeners for immediate updates (debounce is in controller)
        form.querySelectorAll('input, select').forEach(element => {
            element.removeEventListener('change', this.services.settings.controller.debouncedSave); // Elimina antes de agregar
            element.addEventListener('change', this.services.settings.controller.debouncedSave);
            element.removeEventListener('input', this.services.settings.controller.debouncedSave);
            element.addEventListener('input', this.services.settings.controller.debouncedSave);
        });
    }
}