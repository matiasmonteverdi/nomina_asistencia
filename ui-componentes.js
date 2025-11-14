// ============================================
// UI COMPONENTS - Componentes de interfaz
// ============================================

import { DateUtils, TimeCalculator } from './utils.js';
import { ATTENDANCE_ACTIONS, ABSENCE_TYPES } from './config.js';

export class NotificationManager {
    static show(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const bgClass = {
            success: 'bg-success',
            error: 'bg-danger',
            warning: 'bg-warning',
            info: 'bg-info'
        }[type] || 'bg-success';

        toast.className = `toast align-items-center text-white ${bgClass} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${icons[type]} me-2"></i> ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        container.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => toast.remove());
    }

    static confirm(message, onConfirm) {
        if (confirm(message)) {
            onConfirm();
        }
    }
}

export class UIComponents {
    static createEmptyState(message, icon = 'fa-inbox') {
        return `
            <div class="empty-state text-center py-5">
                <i class="fas ${icon} fa-4x text-muted mb-3"></i>
                <p class="text-muted">${message}</p>
            </div>
        `;
    }

    static createTable(headers, rows, emptyMessage, tableClass = 'table-hover') {
        if (!rows || rows.length === 0) {
            return this.createEmptyState(emptyMessage);
        }

        return `
            <div class="table-responsive">
                <table class="table ${tableClass}">
                    <thead>
                        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${rows.map(row => `<tr>${row}</tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    static createBadge(text, type) {
        return `<span class="badge bg-${type}">${text}</span>`;
    }

    static createStatusBadge(action) {
        const config = ATTENDANCE_ACTIONS[action.toUpperCase()] || ATTENDANCE_ACTIONS.ENTRADA;
        return `<span class="badge bg-${config.class}">${config.icon} ${config.label}</span>`;
    }

    static createEmployeeCard(employee) {
        const status = employee.status === 'activo' ? 'status-active' : 'status-offline';
        return `
            <div class="col-md-4 mb-3">
                <div class="card employee-card h-100">
                    <div class="employee-status ${status}"></div>
                    <div class="card-body">
                        <h6 class="card-title">
                            <i class="fas fa-user-circle text-primary me-2"></i>${employee.name}
                        </h6>
                        <p class="card-text mb-1">
                            <small class="text-muted"><i class="fas fa-briefcase me-1"></i> ${employee.position}</small>
                        </p>
                        <p class="card-text mb-2">
                            <small class="text-muted"><i class="fas fa-building me-1"></i> ${employee.department}</small>
                        </p>
                        ${employee.email ? `<p class="card-text mb-1"><small><i class="fas fa-envelope me-1"></i> ${employee.email}</small></p>` : ''}
                        <div class="mt-3">
                            <button class="btn btn-sm btn-outline-primary edit-employee" data-id="${employee.id}">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-employee" data-id="${employee.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static createKPI(label, value, icon, gradient) {
        return `
            <div class="col-md-3 mb-3">
                <div class="stat-card ${gradient}">
                    <div class="stat-label"><i class="fas ${icon} me-2"></i>${label}</div>
                    <div class="stat-value">${value}</div>
                </div>
            </div>
        `;
    }

    static createPayrollReceipt(payment) {
        return `
            <div class="card mt-4 border-success">
                <div class="card-header bg-success text-white">
                    <h6 class="mb-0"><i class="fas fa-file-invoice-dollar me-2"></i> Recibo de Nómina Generado</h6>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <p class="mb-2"><strong>Empleado:</strong> ${payment.employeeName}</p>
                            <p class="mb-2"><strong>Período:</strong> ${payment.period} - ${payment.month}</p>
                            <p class="mb-2"><strong>Horas:</strong> ${payment.hours}</p>
                            <p class="mb-2"><strong>Tarifa/hora:</strong> $${payment.hourlyRate.toFixed(2)}</p>
                        </div>
                        <div class="col-md-6">
                            <p class="mb-2"><strong>Salario base:</strong> $${payment.baseSalary.toFixed(2)}</p>
                            <p class="mb-2 text-success"><strong>Bonificaciones:</strong> +$${payment.bonuses.toFixed(2)}</p>
                            <p class="mb-2 text-danger"><strong>Deducciones:</strong> -$${payment.deductions.toFixed(2)}</p>
                            <p class="mb-2 text-danger"><strong>Impuestos:</strong> -$${payment.taxes.toFixed(2)}</p>
                        </div>
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-md-6">
                            <h5>Salario Bruto: <span class="text-primary">$${payment.grossSalary.toFixed(2)}</span></h5>
                        </div>
                        <div class="col-md-6 text-end">
                            <h5>Salario Neto: <span class="text-success">$${payment.netSalary.toFixed(2)}</span></h5>
                        </div>
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-outline-primary" onclick="window.print()">
                            <i class="fas fa-print me-1"></i> Imprimir Recibo
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

export class FormHandler {
    static getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return null;

        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    static clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }

    static setFormData(formId, data) {
        Object.entries(data).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.value = value;
            }
        });
    }
}

export class SelectPopulator {
    static populateEmployeeSelects(employees, selectIds) {
        const options = employees.map(e =>
            `<option value="${e.id}">${e.name} - ${e.position}</option>`
        ).join('');

        selectIds.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                const currentValue = select.value;
                const isFilter = id.includes('Filter') || id.includes('report');
                const defaultOption = isFilter
                    ? '<option value="">Todos los empleados</option>'
                    : '<option value="">Seleccionar empleado...</option>';
                
                select.innerHTML = defaultOption + options;
                if (currentValue) select.value = currentValue;
            }
        });
    }

    static populateOptions(selectId, options, defaultText = 'Seleccionar...') {
        const select = document.getElementById(selectId);
        if (!select) return;

        const optionsHTML = options.map(opt => {
            if (typeof opt === 'string') {
                return `<option value="${opt}">${opt}</option>`;
            } else if (opt.id && opt.name) {
                return `<option value="${opt.id}">${opt.name}</option>`;
            }
            return `<option value="${opt.value}">${opt.label}</option>`;
        }).join('');

        select.innerHTML = `<option value="">${defaultText}</option>${optionsHTML}`;
    }
}

export class ThemeManager {
    static initialize() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }

    static setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const icon = theme === 'light' ? 'fa-moon' : 'fa-sun';
        const themeToggle = document.querySelector('#themeToggle i');
        if (themeToggle) {
            themeToggle.className = `fas ${icon}`;
        }
    }

    static toggle() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
}

export class ClockManager {
    static start() {
        const updateClock = () => {
            const clockElement = document.getElementById('currentDateTime');
            if (clockElement) {
                clockElement.textContent = DateUtils.getCurrentDateTime();
            }
        };

        updateClock();
        setInterval(updateClock, 1000);
    }
}