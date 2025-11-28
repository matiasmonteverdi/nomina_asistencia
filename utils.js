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

    static getMonthNames() {
        return Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleString('es-ES', { month: 'long' }));
    }

    static getMonthYear(date) {
        return new Date(date).toLocaleString('es-ES', {
            month: 'long',
            year: 'numeric'
        });
    }

    static combineDateTime(dateStr, timeStr) {
        // Combina una fecha 'YYYY-MM-DD' y una hora 'HH:MM'
        return new Date(`${dateStr}T${timeStr}:00`).toISOString();
    }
}

export class TimeCalculator {
    static getMinutes(timestamp) {
        return new Date(timestamp).getHours() * 60 + new Date(timestamp).getMinutes();
    }

    static timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Calcula la duración en milisegundos entre dos timestamps.
     */
    static getDuration(start, end) {
        return new Date(end).getTime() - new Date(start).getTime();
    }

    /**
     * Formatea una duración en milisegundos a 'Hh Mmin'
     */
    static formatDuration(ms) {
        if (ms < 0) return '0h 0min';
        const totalMinutes = Math.floor(ms / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}min`;
    }

    /**
     * Calcula las horas totales trabajadas a partir de los registros.
     */
    static calculateTotalWorkHours(records) {
        let totalMs = 0;
        let entryTime = null;
        let breakStart = null;

        const sortedRecords = records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        for (const record of sortedRecords) {
            const timestamp = new Date(record.timestamp).getTime();

            if (record.action.type === 'ENTRADA') {
                entryTime = timestamp;
            } else if (record.action.type === 'BREAK_START') {
                breakStart = timestamp;
                if (entryTime) {
                    // Acumula tiempo trabajado antes del break
                    totalMs += (breakStart - entryTime);
                    entryTime = null; // El break invalida la entrada
                }
            } else if (record.action.type === 'BREAK_END') {
                breakStart = null;
                entryTime = timestamp; // El fin del break es una nueva entrada efectiva
            } else if (record.action.type === 'SALIDA') {
                if (entryTime) {
                    totalMs += (timestamp - entryTime);
                }
                entryTime = null;
                breakStart = null;
            }
        }

        // Retorna las horas en una unidad estándar, por ejemplo, horas
        return totalMs / (1000 * 60 * 60);
    }

    /**
     * Determina si una hora de entrada es tarde.
     */
    static isLate(timestamp, workStartTime, toleranceMinutes) {
        const checkInTime = TimeCalculator.getMinutes(timestamp);
        const startTime = TimeCalculator.timeToMinutes(workStartTime);

        return checkInTime > (startTime + toleranceMinutes);
    }

    /**
     * Calcula los días naturales entre dos fechas (incluyendo la fecha de inicio).
     */
    static getDaysBetweenDates(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1; // +1 para incluir el día de inicio
    }

    /**
     * Calcula las horas trabajadas en un mes específico. (Simplificado)
     */
    static calculateMonthlyWorkHours(attendanceRecords, employeeId, month, year) {
        const monthRecords = attendanceRecords.filter(rec => {
            const date = new Date(rec.timestamp);
            return rec.employeeId === employeeId &&
                date.getMonth() + 1 == month &&
                date.getFullYear() == year;
        });

        // En una app real, esta función sería mucho más compleja para gestionar turnos, breaks, etc.
        // Aquí simulamos que el cálculo getTotalHoursWorked puede manejar un subconjunto de registros.
        return TimeCalculator.calculateTotalWorkHours(monthRecords);
    }
}

export class Validator {
    static required(value, fieldName) {
        if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '') || (typeof value === 'number' && isNaN(value))) {
            throw new Error(`El campo **${fieldName}** es obligatorio.`);
        }
    }

    static email(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            throw new Error('El formato del correo electrónico es inválido.');
        }
    }

    static number(value, fieldName) {
        if (isNaN(value) || value === null) {
            throw new Error(`El campo **${fieldName}** debe ser un número.`);
        }
        if (value < 0) {
            throw new Error(`El campo **${fieldName}** no puede ser negativo.`);
        }
    }

    static dateRange(startDateStr, endDateStr) {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (startDate.getTime() > endDate.getTime()) {
            throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio.');
        }
    }
}

export class FileUtils {
    static exportJson(data, filename) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static importJson(file) {
        return new Promise((resolve, reject) => {
            if (file.type !== 'application/json') {
                return reject(new Error('Tipo de archivo no válido. Debe ser un archivo JSON.'));
            }

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
        // Formato simple de moneda (ej. 1,500.00)
        return amount.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }

    static sumArray(arr) {
        return arr.reduce((sum, val) => sum + val, 0);
    }
}