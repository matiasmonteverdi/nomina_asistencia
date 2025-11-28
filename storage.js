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
        this.subscribers = new Set();
        this.migrateState();
    }

    loadState() {
        const savedState = {
            employees: StorageService.get(STORAGE_KEYS.EMPLOYEES, []),
            attendance: StorageService.get(STORAGE_KEYS.ATTENDANCE, []),
            absences: StorageService.get(STORAGE_KEYS.ABSENCES, []),
            shifts: StorageService.get(STORAGE_KEYS.SHIFTS, {}),
            payroll: StorageService.get(STORAGE_KEYS.PAYROLL, []),
            bonuses: StorageService.get(STORAGE_KEYS.BONUSES, {}),
            deductions: StorageService.get(STORAGE_KEYS.DEDUCTIONS, {}),
            departments: StorageService.get(STORAGE_KEYS.DEPARTMENTS, []),
            version: StorageService.get('version', '1.0') // Para la migración
        };
        return savedState;
    }

    loadSettings() {
        const savedSettings = StorageService.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
        return { ...DEFAULT_SETTINGS, ...savedSettings };
    }

    migrateState() {
        // Ejemplo de migración: si la versión es antigua, aplicar lógica de migración.
        if (this.state.version !== CONFIG.STORAGE_VERSION) {
            console.log(`Migrando datos de la versión ${this.state.version} a ${CONFIG.STORAGE_VERSION}...`);
            // Lógica de migración aquí (ej: añadir nuevos campos por defecto a objetos existentes)

            // Actualizar la versión
            this.state.version = CONFIG.STORAGE_VERSION;
            StorageService.set('version', CONFIG.STORAGE_VERSION);
            this.notify();
        }
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        // Notificar inmediatamente para el renderizado inicial
        callback(this.state);
    }

    unsubscribe(callback) {
        this.subscribers.delete(callback);
    }

    notify() {
        this.subscribers.forEach(callback => callback(this.state, this.settings));
    }

    updateState(newState) {
        // Actualiza el estado en memoria y guarda en localStorage
        Object.keys(newState).forEach(key => {
            this.state[key] = newState[key];
            StorageService.set(key, this.state[key]);
        });
        this.notify();
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        StorageService.set(STORAGE_KEYS.SETTINGS, this.settings);
        this.notify(); // Notifica para que los renderers que dependen de settings se actualicen
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
                this.settings = { ...DEFAULT_SETTINGS, ...data.settings };
            }

            Object.keys(this.state).forEach(key => {
                // Excluir la clave de versión al guardar
                if (key !== 'version') {
                    StorageService.set(key, this.state[key]);
                }
            });
            StorageService.set(STORAGE_KEYS.SETTINGS, this.settings);
            StorageService.set('version', CONFIG.STORAGE_VERSION);

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