const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor(level = 'INFO') {
    this.level = logLevels[level] || logLevels.INFO;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    
    return `[${timestamp}] ${level}: ${message} ${metaString}`;
  }

  error(message, meta = {}) {
    if (this.level >= logLevels.ERROR) {
      console.error(this.formatMessage('ERROR', message, meta));
      this.writeToLogFile('ERROR', message, meta);
    }
  }

  warn(message, meta = {}) {
    if (this.level >= logLevels.WARN) {
      console.warn(this.formatMessage('WARN', message, meta));
      this.writeToLogFile('WARN', message, meta);
    }
  }

  info(message, meta = {}) {
    if (this.level >= logLevels.INFO) {
      console.log(this.formatMessage('INFO', message, meta));
      this.writeToLogFile('INFO', message, meta);
    }
  }

  debug(message, meta = {}) {
    if (this.level >= logLevels.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message, meta));
      this.writeToLogFile('DEBUG', message, meta);
    }
  }

  async writeToLogFile(level, message, meta) {
    // In production, you might want to write to a file or external logging service
    // For now, we'll just log to console
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        meta,
        service: 'veritrace-api'
      };
      
      // You could implement file writing here or send to external service
      // await fs.appendFile('logs/app.log', JSON.stringify(logEntry) + '\n');
      
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Request logging middleware helper
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    };

    if (res.statusCode >= 400) {
      this.warn('HTTP Request Error', logData);
    } else {
      this.info('HTTP Request', logData);
    }
  }

  // Database operation logging
  logDatabaseOperation(operation, table, duration, success = true) {
    const logData = {
      operation,
      table,
      duration: `${duration}ms`,
      success
    };

    if (success) {
      this.debug('Database Operation', logData);
    } else {
      this.error('Database Operation Failed', logData);
    }
  }

  // Authentication logging
  logAuth(event, userId = null, email = null, success = true) {
    const logData = {
      event,
      userId,
      email,
      success,
      timestamp: new Date().toISOString()
    };

    if (event === 'LOGIN') {
      if (success) {
        this.info('User Login Successful', logData);
      } else {
        this.warn('User Login Failed', logData);
      }
    } else if (event === 'LOGOUT') {
      this.info('User Logout', logData);
    } else if (event === 'REGISTER') {
      this.info('User Registration', logData);
    }
  }

  // Provenance query logging
  logProvenanceQuery(serialNumber, queryType, duration, resultCount) {
    const logData = {
      serialNumber,
      queryType,
      duration: `${duration}ms`,
      resultCount
    };

    this.info('Provenance Query', logData);
  }

  // Business event logging
  logBusinessEvent(eventType, entityId, entityType, details = {}) {
    const logData = {
      eventType,
      entityId,
      entityType,
      details,
      timestamp: new Date().toISOString()
    };

    this.info('Business Event', logData);
  }

  // System health logging
  logHealthCheck(service, status, responseTime = null, error = null) {
    const logData = {
      service,
      status,
      responseTime: responseTime ? `${responseTime}ms` : null,
      error,
      timestamp: new Date().toISOString()
    };

    if (status === 'healthy') {
      this.debug('Health Check', logData);
    } else {
      this.error('Health Check Failed', logData);
    }
  }
}

// Create singleton instance
const logger = new Logger(process.env.LOG_LEVEL || 'INFO');

export default logger;
