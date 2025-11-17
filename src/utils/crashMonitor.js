// 📊 CRASH MONITOR - Comprehensive error tracking and debugging
// Captures crashes, errors, and system events for post-crash analysis

class CrashMonitor {
  constructor() {
    this.startTime = Date.now();
    this.events = [];
    this.maxEvents = 100; // Keep last 100 events
    this.memoryCheckInterval = null; // Track interval for cleanup
    this.setupErrorHandlers();
    this.log('MONITOR_INIT', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }

  log(event, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      data,
      sessionTime: Date.now() - this.startTime,
      memoryUsage: this.getMemoryInfo(),
      url: window.location.pathname
    };
    
    this.events.push(entry);
    console.log(`📊 [CRASH-MONITOR] ${event}:`, data);
    
    // Keep only last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    
    // Save to sessionStorage for post-crash analysis
    this.saveToStorage();
  }

  setupErrorHandlers() {
    // Global JavaScript errors
    window.addEventListener('error', (event) => {
      this.log('GLOBAL_ERROR', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        severity: 'critical'
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.log('UNHANDLED_REJECTION', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack,
        severity: 'critical'
      });
    });

    // Page visibility changes (app backgrounding)
    document.addEventListener('visibilitychange', () => {
      this.log('VISIBILITY_CHANGE', {
        state: document.visibilityState,
        hidden: document.hidden
      });
    });

    // Page unload (app closing)
    window.addEventListener('beforeunload', () => {
      this.log('APP_CLOSING', {
        sessionDuration: Date.now() - this.startTime
      });
      // Cleanup intervals before page unload
      this.destroy();
    });

    // Memory warnings (if available)
    if ('memory' in performance) {
      this.memoryCheckInterval = setInterval(() => {
        const memory = performance.memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          this.log('MEMORY_WARNING', {
            used: Math.round(memory.usedJSHeapSize / 1048576),
            limit: Math.round(memory.jsHeapSizeLimit / 1048576),
            severity: 'warning'
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  getMemoryInfo() {
    if ('memory' in performance) {
      const memory = performance.memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      };
    }
    return null;
  }

  saveToStorage() {
    try {
      sessionStorage.setItem('elora-crash-log', JSON.stringify({
        events: this.events,
        sessionStart: this.startTime,
        lastUpdate: Date.now()
      }));
    } catch (e) {
      console.warn('Failed to save crash log to sessionStorage');
    }
  }

  getReport() {
    return {
      sessionDuration: Date.now() - this.startTime,
      eventCount: this.events.length,
      events: this.events,
      systemInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        memory: this.getMemoryInfo()
      }
    };
  }

  // Export crash log for debugging
  exportLog() {
    const report = this.getReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elora-crash-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.log('LOG_EXPORTED', { filename: a.download });
  }

  // Get previous crash log (from last session)
  getPreviousCrashLog() {
    try {
      const stored = sessionStorage.getItem('elora-crash-log');
      if (stored) {
        const data = JSON.parse(stored);
        // Check if it's from a previous session (older than 1 minute)
        if (Date.now() - data.lastUpdate > 60000) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Failed to load previous crash log');
    }
    return null;
  }

  // Clear stored crash logs
  clearLogs() {
    sessionStorage.removeItem('elora-crash-log');
    this.events = [];
    this.log('LOGS_CLEARED');
  }

  // Cleanup method to prevent memory leaks
  destroy() {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
      this.log('MONITOR_DESTROYED', { 
        sessionDuration: Date.now() - this.startTime 
      });
    }
  }

  // Track specific IndexedDB operations
  trackIndexedDB(operation, chatId, result = null, error = null) {
    this.log('INDEXEDDB_OPERATION', {
      operation, // 'save', 'load', 'delete', etc.
      chatId,
      result: result ? 'success' : 'failed',
      error: error?.message,
      stack: error?.stack
    });
  }

  // Track chat operations
  trackChatOperation(operation, details = {}) {
    this.log('CHAT_OPERATION', {
      operation, // 'new_chat', 'switch_chat', 'send_message', etc.
      ...details
    });
  }

  // Track PWA lifecycle events
  trackPWAEvent(event, details = {}) {
    this.log('PWA_EVENT', {
      event, // 'install', 'standalone_mode', 'background', etc.
      ...details
    });
  }
}

// Create singleton instance
export const crashMonitor = new CrashMonitor();

// Development helpers
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.crashMonitor = crashMonitor;
  console.log('🐛 Development mode: crashMonitor available globally');
  console.log('📋 Commands: crashMonitor.exportLog(), crashMonitor.getReport(), crashMonitor.clearLogs()');
}

// Check for previous crash on startup
const previousCrash = crashMonitor.getPreviousCrashLog();
if (previousCrash) {
  console.warn('⚠️ Previous session may have crashed. Events:', previousCrash.events.length);
  crashMonitor.log('PREVIOUS_CRASH_DETECTED', {
    previousEvents: previousCrash.events.length,
    sessionDuration: previousCrash.lastUpdate - previousCrash.sessionStart
  });
}

export default crashMonitor;