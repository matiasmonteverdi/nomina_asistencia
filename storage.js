// ============================================
// STORAGE SERVICE - Gestión de localStorage
// ============================================

import { STORAGE_KEYS, CONFIG, DEFAULT_SETTINGS } from './config.js';

export class StorageService {
    static get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error loading ${key}:`, error);
            return defaultValue;
        }
    }

    static set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
            return false;
        }
    }

    static remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing ${key}:`, error);
            return false;
        }
    }

    static clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }
}

// ============================================
// STATE MANAGER - Gestión centralizada del estado
// ============================================

export class StateManager {
    constructor() {
        this.state = this.loadState();
        this.settings = this.loadSettings();
        this.listeners = [];
    }

    loadState() {
        return {
            employees: StorageService.get(STORAGE_KEYS.EMPLOYEES, []),
            attendance: StorageService.get(STORAGE_KEYS.ATTENDANCE, []),
            absences: StorageService.get(STORAGE_KEYS.ABSENCES, []),
            shifts: StorageService.get(STORAGE_KEYS.SHIFTS, {}),
            payroll: StorageService.get(STORAGE_KEYS.PAYROLL, []),
            bonuses: StorageService.get(STORAGE_KEYS.BONUSES, {}),
            version: CONFIG.STORAGE_VERSION,
            departments: StorageService.get(STORAGE_KEYS.DEPARTMENTS, [
                { id: 1, name: 'Administración' },
                { id: 2, name: 'Ventas' },
                { id: 3, name: 'Producción' },
                { id: 4, name: 'IT' },
                { id: 5, name: 'RRHH' },
                { id: 6, name: 'Finanzas' },
                { id: 7, name: 'Marketing' }
            ])
        };
    }

    loadSettings() {
        return StorageService.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => {
            try {
                listener(this.state);
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }

    updateState(updates) {
        this.state = { ...this.state, ...updates };
        Object.keys(updates).forEach(key => {
            StorageService.set(key, updates[key]);
        });
        this.notify();
    }

    saveSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        StorageService.set(STORAGE_KEYS.SETTINGS, this.settings);
    }

    getState() {
        return this.state;
    }

    getSettings() {
        return this.settings;
    }

    exportData() {
        return {
            ...this.state,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
    }

    importData(data) {
        try {
            this.state = {
                employees: data.employees || [],
                attendance: data.attendance || [],
                absences: data.absences || [],
                shifts: data.shifts || {},
                payroll: data.payroll || [],
                bonuses: data.bonuses || {},
                deductions: data.deductions || {},
                departments: data.departments || [],
                version: CONFIG.STORAGE_VERSION
            };

            if (data.settings) {
                this.settings = data.settings;
            }

            Object.keys(this.state).forEach(key => {
                StorageService.set(key, this.state[key]);
            });
            StorageService.set(STORAGE_KEYS.SETTINGS, this.settings);
            
            this.notify();
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    clearAllData() {
        StorageService.clear();
        this.state = this.loadState();
        this.settings = this.loadSettings();
        this.notify();
    }
}