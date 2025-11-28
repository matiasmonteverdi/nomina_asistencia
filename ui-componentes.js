// ============================================
// UI COMPONENTS - Componentes de interfaz
// ============================================

import * as Utils from './utils.js';
import { ATTENDANCE_ACTIONS, ABSENCE_TYPES } from './config.js';

export class NotificationManager {
    static show(message, type = 'success', duration = 4000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

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
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        toast.setAttribute('data-bs-delay', duration);

        // Sanitize message slightly for innerHTML safety
        const sanitizedMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${icons[type]} me-2"></i> ${sanitizedMessage}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        container.appendChild(toast);

        const bootstrapToast = new bootstrap.Toast(toast, { delay: duration });
        bootstrapToast.show();

        // Eliminar el toast del DOM después de que se oculte
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    static confirm(message, onConfirm, onCancel = () => { }) {
        // En un entorno de aplicación real se usaría un modal de Bootstrap.
        // Aquí usamos la función nativa para la simplicidad.
        if (window.confirm(message)) {
            onConfirm();
        } else {
            onCancel();
        }
    }
}

export class UIComponents {
    static getModal(id) {
        const modalElement = document.getElementById(id);
        return modalElement ? bootstrap.Modal.getOrCreateInstance(modalElement) : null;
    }

    static createTable(headers, rows, emptyMessage = 'No hay datos para mostrar') {
        if (rows.length === 0) {
            return UIComponents.createEmptyState(
                emptyMessage,
                '',
                'fas fa-box-open'
            );
        }

        const headerRow = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        const bodyRows = rows.join('');

        return `
            <div class="table-responsive shadow-sm">
                <table class="table table-hover table-striped">
                    <thead>
                        ${headerRow}
                    </thead>
                    <tbody>
                        ${bodyRows}
                    </tbody>
                </table>
            </div>
        `;
    }

    static createEmptyState(title, description, iconClass = 'fas fa-info-circle') {
        return `
            <div class="card p-4 my-4 empty-state">
                <i class="${iconClass} fa-4x text-muted mb-3"></i>
                <h5 class="card-title text-muted">${title}</h5>
                <p class="card-text text-muted">${description}</p>
            </div>
        `;
    }
}

export class FormHandler {
    static clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }
}

export class SelectPopulator {
    /** Popula un select HTML con opciones simples (value y label) */
    static populateOptions(selectId, options, defaultText = 'Seleccionar...') {
        const select = document.getElementById(selectId);
        if (!select) return;

        const optionsArray = Array.isArray(options) ? options : Object.entries(options);

        const optionsHTML = optionsArray.map(opt => {
            if (Array.isArray(opt)) {
                // Es un par [key, value] de un objeto mapeado (ej. CONFIG.CONTRACT_TYPES)
                const [key, value] = opt;
                if (typeof value === 'object' && value.label) {
                    // Si el valor es un objeto con label (ej. ABSENCE_TYPES)
                    return `<option value="${key}">${value.label}</option>`;
                }
                return `<option value="${key}">${value}</option>`;
            } else if (typeof opt === 'string' || typeof opt === 'number') {
                // Es una lista de strings/números
                return `<option value="${opt}">${opt}</option>`;
            } else if (opt.id && opt.name) {
                // Es un objeto con id y name (ej. Department)
                return `<option value="${opt.id}">${opt.name}</option>`;
            } else if (opt.value && opt.label) {
                // Es un objeto con value y label
                return `<option value="${opt.value}">${opt.label}</option>`;
            }
            return '';
        }).join('');

        // Preserva la opción por defecto si el select ya tiene una, o crea una nueva.
        let defaultOption = select.querySelector('option[value=""]') || `<option value="">${defaultText}</option>`;
        if (typeof defaultOption === 'object') {
            defaultOption = defaultOption.outerHTML;
        }

        select.innerHTML = defaultOption + optionsHTML;
    }

    /** Popula selects con opciones de empleados activos */
    static populateEmployeeSelects(employees, selectIds) {
        selectIds.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                const optionsHTML = employees.map(emp =>
                    `<option value="${emp.id}">${emp.name}</option>`
                ).join('');

                const defaultOption = select.querySelector('option[value=""]');
                select.innerHTML = '';
                if (defaultOption) select.appendChild(defaultOption);
                select.innerHTML += optionsHTML;
            }
        });
    }

    /** Popula selects con horas de un rango (usado en configuración) */
    static populateTimeSelects(selectIds, start, end) {
        // Asegura que los valores sean en formato HH:MM
        const startHour = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);
        const times = [];

        for (let h = startHour; h <= endHour; h++) {
            const hourString = h.toString().padStart(2, '0');
            // Incluye medias horas para mayor flexibilidad
            times.push(`${hourString}:00`);
            if (h < endHour) { // No agregar :30 después de la hora final
                times.push(`${hourString}:30`);
            }
        }

        selectIds.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                const optionsHTML = times.map(time => `<option value="${time}">${time}</option>`).join('');
                const currentValue = select.value;

                const defaultOption = select.querySelector('option[value=""]');
                select.innerHTML = '';
                if (defaultOption) select.appendChild(defaultOption);
                select.innerHTML += optionsHTML;

                // Restablecer el valor si es válido
                if (select.options.length > 1 && (!currentValue || !times.includes(currentValue))) {
                    select.value = select.options[1].value;
                } else if (currentValue) {
                    select.value = currentValue;
                }
            }
        });
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
                clockElement.textContent = Utils.DateUtils.getCurrentDateTime();
            }
        };

        // Renderiza inmediatamente y luego actualiza cada segundo
        updateClock();
        setInterval(updateClock, 1000);
    }
}