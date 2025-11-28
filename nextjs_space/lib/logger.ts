// Logging utility for monitoring data fetching and caching
// Logs are visible in Vercel deployment logs and local console

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    category: string;
    ticker?: string;
    message: string;
    data?: any;
}

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development';
    private isVerbose = process.env.VERBOSE_LOGGING === 'true';

    private formatLog(entry: LogEntry): string {
        const parts = [
            `[${entry.timestamp}]`,
            `[${entry.level}]`,
            `[${entry.category}]`,
        ];

        if (entry.ticker) {
            parts.push(`[${entry.ticker}]`);
        }

        parts.push(entry.message);

        return parts.join(' ');
    }

    private shouldLog(level: LogLevel): boolean {
        if (this.isDevelopment) return true;
        if (this.isVerbose) return true;
        return level === LogLevel.WARN || level === LogLevel.ERROR;
    }

    private log(level: LogLevel, category: string, message: string, ticker?: string, data?: any) {
        if (!this.shouldLog(level)) return;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            category,
            ticker,
            message,
            data
        };

        const formattedMessage = this.formatLog(entry);

        switch (level) {
            case LogLevel.ERROR:
                console.error(formattedMessage, data || '');
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage, data || '');
                break;
            case LogLevel.INFO:
                console.info(formattedMessage, data || '');
                break;
            case LogLevel.DEBUG:
                console.log(formattedMessage, data || '');
                break;
        }
    }

    debug(category: string, message: string, ticker?: string, data?: any) {
        this.log(LogLevel.DEBUG, category, message, ticker, data);
    }

    info(category: string, message: string, ticker?: string, data?: any) {
        this.log(LogLevel.INFO, category, message, ticker, data);
    }

    warn(category: string, message: string, ticker?: string, data?: any) {
        this.log(LogLevel.WARN, category, message, ticker, data);
    }

    error(category: string, message: string, ticker?: string, data?: any) {
        this.log(LogLevel.ERROR, category, message, ticker, data);
    }

    // Specific logging methods for common scenarios
    cacheHit(category: string, ticker: string, ageMs: number) {
        this.debug(category, `Cache HIT (age: ${Math.round(ageMs / 1000)}s)`, ticker);
    }

    cacheMiss(category: string, ticker: string) {
        this.debug(category, 'Cache MISS - fetching fresh data', ticker);
    }

    apiCall(category: string, ticker: string, url: string) {
        this.info(category, `API call: ${url.substring(0, 100)}...`, ticker);
    }

    apiSuccess(category: string, ticker: string, itemCount?: number) {
        const msg = itemCount !== undefined
            ? `API success - received ${itemCount} items`
            : 'API success';
        this.info(category, msg, ticker);
    }

    apiError(category: string, ticker: string, error: any) {
        this.error(category, `API error: ${error.message || error}`, ticker, error);
    }

    dataProcessed(category: string, ticker: string, summary: any) {
        this.debug(category, 'Data processed', ticker, summary);
    }
}

export const logger = new Logger();
