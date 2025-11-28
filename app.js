// ============================================
// APP.JS - Main application entry point
// ============================================

import { StateManager } from './storage.js';
import * as Services from './services.js';
import * as Controllers from './controllers.js';
import * as Renderers from './renderers.js';
import { ClockManager, ThemeManager, SelectPopulator } from './ui-componentes.js'; // Ruta corregida
import { CONFIG, DAYS_OF_WEEK, CONTRACT_TYPES } from './config.js';
import { DOMUtils } from './utils.js'; // Importar DOMUtils para debounce

class App {
    constructor() {
        this.stateManager = new StateManager();
        this.initServices();
        this.initRenderers();
        this.initControllers();
        this.initUI();
        this.setupEventListeners();
        this.fullRender();

        // Carga el estado de la aplicación desde la URL si existe (para simular deep links)
        this.handleUrlState();
    }

    initServices() {
        this.services = {
            employee: new Services.EmployeeService(this.stateManager),
            attendance: new Services.AttendanceService(this.stateManager),
            absence: new Services.AbsenceService(this.stateManager),
            shift: new Services.ShiftService(this.stateManager),
            payroll: new Services.PayrollService(this.stateManager),
            department: new Services.DepartmentService(this.stateManager),
            settings: new Services.SettingsService(this.stateManager),
            stateManager: this.stateManager // Expone stateManager para acceso directo
        };
    }

    initRenderers() {
        // Pasa los servicios y la aplicación para interactuar
        const eventHandlers = {
            onEditEmployee: (id) => this.controllers.employee.openEditModal(id),
            onDeleteEmployee: (id) => this.controllers.employee.handleDelete(id),
            onDeleteAbsence: (id) => this.controllers.absence.handleDelete(id),
            onUpdateShift: (employee, day, shift) => this.controllers.shift.handleUpdate(employee, day, shift),
            onDeleteDepartment: (id) => this.controllers.department.handleDelete(id),
            onSettingChange: (key, value) => this.controllers.settings.handleUpdate(key, value)
        };

        this.renderers = {
            dashboard: new Renderers.DashboardRenderer(this.services),
            employee: new Renderers.EmployeeRenderer(this.services, eventHandlers),
            attendance: new Renderers.AttendanceRenderer(this.services),
            absence: new Renderers.AbsenceRenderer(this.services, eventHandlers),
            shift: new Renderers.ShiftRenderer(this.services, eventHandlers),
            payroll: new Renderers.PayrollRenderer(this.services),
            department: new Renderers.DepartmentRenderer(this.services, eventHandlers),
            settings: new Renderers.SettingsRenderer(this.services, eventHandlers)
        };
    }

    initControllers() {
        this.controllers = {
            employee: new Controllers.EmployeeController(this.services, this.renderers.employee),
            attendance: new Controllers.AttendanceController(this.services),
            absence: new Controllers.AbsenceController(this.services),
            shift: new Controllers.ShiftController(this.services),
            payroll: new Controllers.PayrollController(this.services),
            department: new Controllers.DepartmentController(this.services),
            settings: new Controllers.SettingsController(this.services, this.renderers.settings)
        };
    }

    initUI() {
        ThemeManager.initialize();
        ClockManager.start();
        this.populateStaticSelects();
    }

    populateStaticSelects() {
        SelectPopulator.populateOptions('employeeContractType', CONTRACT_TYPES);
    }

    setupEventListeners() {
        // State changes
        this.stateManager.subscribe(() => this.fullRender());

        // Helper function to safely add event listener
        const safeAddListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.warn(`Element with id '${id}' not found in DOM`);
            }
        };

        // Forms
        safeAddListener('employeeForm', 'submit', (e) => this.controllers.employee.handleAdd(e));
        safeAddListener('editEmployeeForm', 'submit', (e) => this.controllers.employee.handleEdit(e));
        safeAddListener('attendanceForm', 'submit', (e) => this.controllers.attendance.handleRecord(e));
        safeAddListener('absenceForm', 'submit', (e) => this.controllers.absence.handleAdd(e));
        safeAddListener('payrollForm', 'submit', (e) => this.controllers.payroll.handleCalculate(e));
        safeAddListener('bonusForm', 'submit', (e) => this.controllers.payroll.handleAddBonus(e));
        safeAddListener('deductionForm', 'submit', (e) => this.controllers.payroll.handleAddDeduction(e));
        safeAddListener('departmentForm', 'submit', (e) => this.controllers.department.handleAdd(e));

        // Buttons & Filters
        safeAddListener('themeToggle', 'click', () => ThemeManager.toggle());
        safeAddListener('autoFillSchedule', 'click', () => this.controllers.shift.handleAutoFill());
        safeAddListener('autoCalculateHours', 'click', () => this.controllers.payroll.handleAutoCalculateHours());
        safeAddListener('exportData', 'click', () => this.controllers.employee.handleExport());
        safeAddListener('backupData', 'click', () => this.controllers.employee.handleExport());
        safeAddListener('restoreData', 'click', () => this.controllers.employee.handleImport());
        safeAddListener('clearAllData', 'click', () => this.controllers.employee.handleClearAllData());

        // Payroll Filters
        const payrollFilters = ['payrollMonthFilter', 'payrollYearFilter', 'payrollEmployeeFilter'];
        payrollFilters.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this.renderers.payroll.renderHistory(this.getPayrollFilters()));
        });
        const clearPayrollFiltersBtn = document.getElementById('clearPayrollFilters');
        if (clearPayrollFiltersBtn) {
            clearPayrollFiltersBtn.addEventListener('click', () => {
                payrollFilters.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
                this.renderers.payroll.renderHistory();
            });
        }

        // Settings change listener (usando DOMUtils.debounce si está disponible)
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('input', (e) => {
                const { id, value } = e.target;
                if (id.startsWith('settings')) {
                    const key = id.replace('settings', '').toLowerCase();

                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                        const debouncedUpdate = DOMUtils.debounce(() => {
                            this.controllers.settings.handleUpdate(key, value);
                        }, CONFIG.DEBOUNCE_DELAY);

                        // Ejecutar la función debounced
                        debouncedUpdate();
                    } else {
                        // Para selects/radios/checkboxes, actualizar inmediatamente
                        this.controllers.settings.handleUpdate(key, value);
                    }
                }
            });
        }
    }

    getPayrollFilters() {
        return {
            month: document.getElementById('payrollMonthFilter')?.value,
            year: document.getElementById('payrollYearFilter')?.value,
            employeeId: document.getElementById('payrollEmployeeFilter')?.value
        };
    }

    handleUrlState() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const tabElement = document.querySelector(`.nav-link[href="#${hash}"]`);
            if (tabElement) {
                new bootstrap.Tab(tabElement).show();
            }
        }
    }

    fullRender() {
        const employees = this.services.employee.getAll();
        const activeEmployees = this.services.employee.getActive();
        const settings = this.services.stateManager.getSettings();

        // Populate selects that depend on employees
        const employeeSelects = ['employeeSelect', 'absenceEmployee', 'payrollEmployee', 'bonusEmployee', 'deductionEmployee', 'payrollEmployeeFilter', 'reportEmployee'];
        SelectPopulator.populateEmployeeSelects(activeEmployees, employeeSelects);

        // Populate selects that depend on settings
        SelectPopulator.populateTimeSelects(['settingsWorkStart', 'settingsWorkEnd'], settings.workStartTime, settings.workEndTime);

        // Render all components
        this.renderers.dashboard.renderQuickStats();
        this.renderers.dashboard.renderAttendanceStats();
        this.renderers.employee.renderList();
        this.renderers.attendance.renderTodayTable();
        this.renderers.absence.renderList();
        this.renderers.shift.renderTable();
        this.renderers.payroll.renderHistory(this.getPayrollFilters());
        this.renderers.payroll.renderBonusList();
        this.renderers.payroll.renderDeductionList();
        this.renderers.department.renderList();
        this.renderers.department.renderSelectOptions();
        this.renderers.settings.renderForm();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => new App());