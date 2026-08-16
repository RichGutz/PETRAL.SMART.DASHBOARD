export interface TelemetryLogEntry {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR';
    message: string;
    url: string;
    user?: string;
    stack?: string;
    extra?: any;
}

type TelemetryListener = (logs: TelemetryLogEntry[]) => void;

class TelemetryLoggerService {
    private logs: TelemetryLogEntry[] = [];
    private listeners: Set<TelemetryListener> = new Set();

    constructor() {
        this.initGlobalHandlers();
    }

    private initGlobalHandlers() {
        if (typeof window === 'undefined') return;

        // Catch uncaught JS errors
        window.addEventListener('error', (event) => {
            this.log('ERROR', event.message || 'Excepción JS sin capturar', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        // Catch unhandled Promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            const reason = event.reason;
            const message = typeof reason === 'string' ? reason : (reason?.message || 'Promesa rechazada sin capturar');
            this.log('ERROR', `[UnhandledRejection] ${message}`, {
                stack: reason?.stack || (typeof reason === 'object' ? JSON.stringify(reason) : String(reason))
            });
        });
    }

    public subscribe(listener: TelemetryListener) {
        this.listeners.add(listener);
        listener([...this.logs]);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notifyListeners() {
        const copy = [...this.logs];
        this.listeners.forEach(fn => fn(copy));
    }

    public log(level: 'INFO' | 'WARN' | 'ERROR', message: string, extra?: any) {
        const userObj = localStorage.getItem('petral_user');
        let userName = 'Anonimo';
        if (userObj) {
            try {
                userName = JSON.parse(userObj).full_name || 'Usuario';
            } catch (e) {}
        }

        const entry: TelemetryLogEntry = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toLocaleTimeString(),
            level,
            message,
            url: typeof window !== 'undefined' ? window.location.href : '',
            user: userName,
            stack: extra?.stack || '',
            extra
        };

        this.logs.unshift(entry);
        if (this.logs.length > 200) {
            this.logs.pop();
        }

        this.notifyListeners();
        this.sendToBackend(entry);
    }

    private async sendToBackend(entry: TelemetryLogEntry) {
        try {
            const endpoint = `https://forecast.geeksoft.tech/api/v1/forecast/telemetry-log`;
            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            });
        } catch (e) {
            console.warn("[TelemetryLogger] No se pudo transmitir log a VPS:", e);
        }
    }

    public getLogs(): TelemetryLogEntry[] {
        return [...this.logs];
    }

    public clearLogs() {
        this.logs = [];
        this.notifyListeners();
    }
}

export const TelemetryLogger = new TelemetryLoggerService();
