
// ============================================
// APP.JS - Main application entry point
// ============================================

import { StateManager } from './storage.js';
import {
    EmployeeService,
    AttendanceService,
    AbsenceService,
    ShiftService,
    PayrollService,
    DepartmentService
} from './services.js';
import {
    EmployeeController,
    AttendanceController,
    AbsenceController,
    ShiftController,
    PayrollController,
    DepartmentController
} from './controllers.js';
import {
    DashboardRenderer,
    EmployeeRenderer,
    AttendanceRenderer,
    AbsenceRenderer,
    ShiftRenderer,
    PayrollRenderer,
    DepartmentRenderer
} from './renderers.js';
import { ClockManager, ThemeManager } from './ui-componentes.js';
import { SelectPopulator } from './ui-componentes.js';
import { CONTRACT_TYPES, DAYS_OF_WEEK } from './config.js';

class App {
    constructor() {
        this.stateManager = new StateManager();
        this.initServices();
        this.initRenderers();
        this.initControllers();
        this.initUI();
        this.setupEventListeners();
        this.fullRender();
    }

    initServices() {
        this.services = {
            employee: new EmployeeService(this.stateManager),
            attendance: new AttendanceService(this.stateManager),
            absence: new AbsenceService(this.stateManager),
            shift: new ShiftService(this.stateManager),
            payroll: new PayrollService(this.stateManager),
            department: new DepartmentService(this.stateManager),
            stateManager: this.stateManager
        };
    }

    initRenderers() {
        const eventHandlers = {
            onEditEmployee: (id) => this.controllers.employee.openEditModal(id),
            onDeleteEmployee: (id) => this.controllers.employee.handleDelete(id),
            onDeleteAbsence: (id) => this.controllers.absence.handleDelete(id),
            onUpdateShift: (employee, day, shift) => this.controllers.shift.handleUpdate(employee, day, shift),
            onDeleteDepartment: (id) => this.controllers.department.handleDelete(id)
        };

        this.renderers = {
            dashboard: new DashboardRenderer(this.services),
            employee: new EmployeeRenderer(this.services, eventHandlers),
            attendance: new AttendanceRenderer(this.services),
            absence: new AbsenceRenderer(this.services, eventHandlers),
            shift: new ShiftRenderer(this.services, eventHandlers),
            payroll: new PayrollRenderer(this.services),
            department: new DepartmentRenderer(this.services, eventHandlers)
        };
    }

    initControllers() {
        this.controllers = {
            employee: new EmployeeController(this.services, this.renderers.employee),
            attendance: new AttendanceController(this.services),
            absence: new AbsenceController(this.services),
            shift: new ShiftController(this.services),
            payroll: new PayrollController(this.services),
            department: new DepartmentController(this.services)
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

        // Forms
        document.getElementById('employeeForm').addEventListener('submit', (e) => this.controllers.employee.handleAdd(e));
        document.getElementById('editEmployeeForm').addEventListener('submit', (e) => this.controllers.employee.handleEdit(e));
        document.getElementById('attendanceForm').addEventListener('submit', (e) => this.controllers.attendance.handleRecord(e));
        document.getElementById('absenceForm').addEventListener('submit', (e) => this.controllers.absence.handleAdd(e));
        document.getElementById('payrollForm').addEventListener('submit', (e) => this.controllers.payroll.handleCalculate(e));
        document.getElementById('bonusForm').addEventListener('submit', (e) => this.controllers.payroll.handleAddBonus(e));
        document.getElementById('deductionForm').addEventListener('submit', (e) => this.controllers.payroll.handleAddDeduction(e));
        document.getElementById('departmentForm').addEventListener('submit', (e) => this.controllers.department.handleAdd(e));

        // Buttons & Filters
        document.getElementById('themeToggle').addEventListener('click', () => ThemeManager.toggle());
        document.getElementById('autoFillSchedule').addEventListener('click', () => this.controllers.shift.handleAutoFill());
        document.getElementById('autoCalculateHours').addEventListener('click', () => this.controllers.payroll.handleAutoCalculateHours());
        document.getElementById('exportData').addEventListener('click', () => this.controllers.employee.handleExport());
        document.getElementById('backupData').addEventListener('click', () => this.controllers.employee.handleExport());
        document.getElementById('restoreData').addEventListener('click', () => this.controllers.employee.handleImport());
        document.getElementById('clearAllData').addEventListener('click', () => this.controllers.employee.handleClearAllData());

        // Payroll Filters
        const payrollFilters = ['payrollMonthFilter', 'payrollYearFilter', 'payrollEmployeeFilter'];
        payrollFilters.forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.renderers.payroll.renderHistory(this.getPayrollFilters()));
        });
        document.getElementById('clearPayrollFilters').addEventListener('click', () => {
            payrollFilters.forEach(id => document.getElementById(id).value = '');
            this.renderers.payroll.renderHistory();
        });
    }

    getPayrollFilters() {
        return {
            month: document.getElementById('payrollMonthFilter').value,
            year: document.getElementById('payrollYearFilter').value,
            employeeId: document.getElementById('payrollEmployeeFilter').value
        };
    }

    fullRender() {
        const employees = this.services.employee.getAll();
        const activeEmployees = this.services.employee.getActive();

        // Populate selects that depend on employees
        const employeeSelects = ['employeeSelect', 'absenceEmployee', 'payrollEmployee', 'bonusEmployee', 'deductionEmployee', 'payrollEmployeeFilter', 'reportEmployee'];
        SelectPopulator.populateEmployeeSelects(activeEmployees, employeeSelects);

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
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => new App());
