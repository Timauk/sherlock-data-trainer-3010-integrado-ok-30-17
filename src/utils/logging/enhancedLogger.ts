import { systemLogger } from './systemLogger';

type LogType = 'action' | 'prediction' | 'performance' | 'system' | 'lunar' | 'player' | 'checkpoint' | 'learning' | 'model' | 'error';

interface LogConfig {
  removeMatches?: boolean;
  formatMessage?: boolean;
}

class EnhancedLogger {
  private static instance: EnhancedLogger;
  
  private constructor() {}
  
  static getInstance(): EnhancedLogger {
    if (!EnhancedLogger.instance) {
      EnhancedLogger.instance = new EnhancedLogger();
    }
    return EnhancedLogger.instance;
  }

  log(type: LogType, message: string, details?: any, config: LogConfig = {}) {
    // Remove matches object se configurado
    if (config.removeMatches && details?.matches) {
      delete details.matches;
    }

    // Se não houver mais detalhes além de matches, não inclua details
    if (Object.keys(details || {}).length === 0) {
      details = undefined;
    }

    systemLogger.log(type, message, details);
  }

  clearLogs() {
    systemLogger.clearLogs();
  }
}

export const enhancedLogger = EnhancedLogger.getInstance();