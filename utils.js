// ============================================
// UTILS - Funciones de utilidad
// ============================================

export class DateUtils {
    static formatTime(date) {
        return new Date(date).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString('es-ES');
    }

    static formatDateTime(date) {
        return new Date(date).toLocaleString('es-ES');
    }

    static getCurrentDateTime() {
        const now = new Date();
        return now.toLocaleString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    static isToday(date) {
        const today = new Date();
        const compareDate = new Date(date);
        return today.toDateString() === compareDate.toDateString();
    }

    static getMonthName(date) {
        return new Date(date).toLocaleString('es-ES', { month: 'long' });
    }

    static getMonthYear(date) {
        return new Date(date).toLocaleString('es-ES', { 
            month: 'long', 
            year: 'numeric' 
        });
    }

    static calculateDaysBetween(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }
}

export class TimeCalculator {
    static calculateHours(startTime, endTime) {
        const ms = new Date(endTime) - new Date(startTime);
        return (ms / (1000 * 60 * 60)).toFixed(2);
    }

    static isLate(timestamp, workStartTime, toleranceMinutes = 15) {
        const time = new Date(timestamp);
        const [hours, minutes] = workStartTime.split(':').map(Number);
        const threshold = new Date(time);
        threshold.setHours(hours, minutes + toleranceMinutes, 0, 0);
        return time > threshold;
    }

    static calculateWorkHours(attendanceRecords) {
        let totalHours = 0;
        let entry = null;
        let breakStart = null;
        let breakTime = 0;

        const sortedRecords = [...attendanceRecords].sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

        sortedRecords.forEach(record => {
            switch(record.action) {
                case 'entrada':
                    entry = new Date(record.timestamp);
                    break;
                case 'salida':
                    if (entry) {
                        const hours = parseFloat(
                            this.calculateHours(entry, record.timestamp)
                        );
                        totalHours += hours - (breakTime / 60);
                        entry = null;
                        breakTime = 0;
                    }
                    break;
                case 'break_start':
                    breakStart = new Date(record.timestamp);
                    break;
                case 'break_end':
                    if (breakStart) {
                        breakTime += (new Date(record.timestamp) - breakStart) / (1000 * 60);
                        breakStart = null;
                    }
                    break;
            }
        });

        return totalHours.toFixed(2);
    }
}

export class Validator {
    static required(value, fieldName = 'Campo') {
        if (value === null || 
            value === undefined || 
            (typeof value === 'string' && value.trim() === '')) {
            throw new Error(`${fieldName} es requerido`);
        }
        return true;
    }

    static number(value, fieldName = 'Campo') {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) {
            throw new Error(
                `${fieldName} debe ser un número válido mayor o igual a 0`
            );
        }
        return num;
    }

    static date(value, fieldName = 'Fecha') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new Error(`${fieldName} no es válida`);
        }
        return date;
    }

    static email(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
            throw new Error('Email no es válido');
        }
        return true;
    }

    static time(value, fieldName = 'Hora') {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (value && !timeRegex.test(value)) {
            throw new Error(`${fieldName} no es válida (formato HH:MM)`);
        }
        return true;
    }

    static dateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
        return true;
    }
}

export class FileUtils {
    static downloadJSON(data, filename) {
        const blob = new Blob(
            [JSON.stringify(data, null, 2)], 
            { type: 'application/json' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static readJSONFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error('Archivo JSON inválido'));
                }
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsText(file);
        });
    }
}

export class DOMUtils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static scrollToElement(selector, behavior = 'smooth') {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior });
        }
    }

    static clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }
}

export class NumberUtils {
    static formatCurrency(amount, decimals = 2) {
        return amount.toFixed(decimals);
    }

    static sumArray(arr) {
        return arr.reduce((sum, val) => sum + val, 0);
    }

    static average(arr) {
        if (arr.length === 0) return 0;
        return this.sumArray(arr) / arr.length;
    }
}