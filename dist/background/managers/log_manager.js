export class LogManager {
    constructor() {
        this.logs = [];
        this.MAX_LOGS = 5000; // Increased capacity for detailed debugging
        this.STORAGE_KEY = 'gemini_nexus_logs';
        this.init();
    }

    async init() {
        try {
            const result = await chrome.storage.local.get(this.STORAGE_KEY);
            if (result[this.STORAGE_KEY]) {
                this.logs = result[this.STORAGE_KEY];
            }
            // Avoid adding 'initialized' log here to prevent noise on every wake-up if not needed
        } catch (error) {
            console.error('Failed to load logs', error);
        }
    }

    add(entry) {
        if (!entry.timestamp) entry.timestamp = Date.now();

        this.logs.push(entry);

        // Prune if too large
        if (this.logs.length > this.MAX_LOGS) {
            this.logs = this.logs.slice(-this.MAX_LOGS);
        }

        this._save();
    }

    _save() {
        // We rely on chrome.storage.local's efficiency
        chrome.storage.local.set({ [this.STORAGE_KEY]: this.logs }).catch(() => {});
    }

    getLogs() {
        return this.logs;
    }

    clear() {
        this.logs = [];
        this._save();
        this.add({
            level: 'INFO',
            context: 'Background',
            message: 'Logs cleared',
            timestamp: Date.now(),
        });
    }
}

// --- Console Interception Helper ---

function safeStringify(valueToStringify) {
    const cache = new Set();
    return JSON.stringify(valueToStringify, (key, value) => {
        if (isSensitiveKey(key)) return '[REDACTED]';
        if (typeof value === 'object' && value !== null) {
            if (cache.has(value)) return '[Circular]';
            cache.add(value);
        }
        return typeof value === 'string' ? redactSecrets(value) : value;
    });
}

function isSensitiveKey(key) {
    return /^(authorization|cookie|set-cookie|x-api-key|api[-_]?key|access[-_]?token|refresh[-_]?token|id[-_]?token|token|secret|password)$/i.test(
        String(key || '')
    );
}

function redactSecrets(text) {
    return String(text || '')
        .replace(/\b(Bearer\s+)[^\s,"']+/gi, '$1[REDACTED]')
        .replace(
            /([?&](?:key|api_key|access_token|refresh_token|token|secret|password)=)[^&#\s]+/gi,
            '$1[REDACTED]'
        )
        .replace(
            /\b((?:api[-_]?key|access[-_]?token|refresh[-_]?token|id[-_]?token|authorization|cookie|secret|password)\s*[:=]\s*)[^\s,"'{}]+/gi,
            '$1[REDACTED]'
        );
}

function formatConsoleArgs(args) {
    return args
        .map((arg) => {
            if (arg instanceof Error) {
                return `[Error: ${arg.message}]\n${arg.stack}`;
            }
            if (typeof arg === 'object') {
                try {
                    return safeStringify(arg);
                } catch {
                    return '[Object]';
                }
            }
            return redactSecrets(arg);
        })
        .join(' ');
}

export function setupConsoleInterception(logManager) {
    const originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
        debug: console.debug,
    };

    ['log', 'info', 'warn', 'error', 'debug'].forEach((level) => {
        console[level] = (...args) => {
            originalConsole[level](...args); // Keep original behavior in DevTools

            // Map console level to LogManager level
            let mgrLevel = 'INFO';
            if (level === 'warn') mgrLevel = 'WARN';
            if (level === 'error') mgrLevel = 'ERROR';
            if (level === 'debug') mgrLevel = 'DEBUG';

            // Filter out overly verbose logs if needed, but for now capture everything
            logManager.add({
                level: mgrLevel,
                context: 'System',
                message: formatConsoleArgs(args),
                timestamp: Date.now(),
            });
        };
    });
}
