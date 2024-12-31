class SystemLogger {
  constructor() {
    this.logs = [];
  }

  log(type, message, details = null) {
    const logEntry = {
      timestamp: new Date(),
      type,
      message,
      details
    };

    this.logs.push(logEntry);
    this.dispatchLogEvent(logEntry);
    console.log(`[${type}] ${message}`, details || '');
  }

  getLogs() {
    return [...this.logs];
  }

  dispatchLogEvent(logEntry) {
    const event = new CustomEvent('systemLog', { detail: logEntry });
    window.dispatchEvent(event);
  }

  clearLogs() {
    this.logs = [];
  }
}

export const systemLogger = new SystemLogger();