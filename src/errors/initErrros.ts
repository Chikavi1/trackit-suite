interface ErrorTrackerConfig {
  projectId: string;         // ID único del cliente
  captureConsole?: boolean;  // Si también captura console.error/warn
  release?: string;          // Versión de la app del cliente
  environment?: 'prod' | 'staging' | 'dev';
}

export class initErrors {
  private config: ErrorTrackerConfig;
  private originalConsoleError = console.error;
  private originalConsoleWarn = console.warn;

  constructor(config: ErrorTrackerConfig) {
    if (!config.projectId) {
      throw new Error('initErrors: projectId y endpoint son requeridos');
    }

    this.config = {
      captureConsole: true,
      environment: 'prod',
      ...config,
    };

    this.initGlobalErrorHandlers();

    if (this.config.captureConsole) {
      this.hookConsole();
    }

    console.log('[initErrors] Error tracker inicializado para', this.config.projectId);
  }

  /** 🧠 Captura errores globales */
  private initGlobalErrorHandlers() {
    // Errores JS no capturados
    window.addEventListener('error', (event) => {
      this.report({
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        type: 'window.error',
      });
    });

    // Errores en promesas no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      this.report({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        type: 'unhandledrejection',
      });
    });
  }

  /** 🧩 Intercepta console.error y console.warn */
  private hookConsole() {
    console.error = (...args: any[]) => {
      this.report({
        message: args.map(String).join(' '),
        type: 'console.error',
      });
      this.originalConsoleError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      this.report({
        message: args.map(String).join(' '),
        type: 'console.warn',
      });
      this.originalConsoleWarn.apply(console, args);
    };
  }

  /** 📬 Envía reporte al servidor */
  private async report(data: {
    message: string;
    source?: string;
    line?: number;
    column?: number;
    stack?: string;
    type: string;
  }) {
    const payload = {
      business_id: this.config.projectId,
      release: this.config.release,
      environment: this.config.environment,
      url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ...data,
    };

    console.log('enviando reporte al backend')

    try {
      await fetch('https://trackit-suite-back.onrender.com/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      this.originalConsoleError('[initErrors] Falló el envío del error:', err);
    }
  }

  /** 📦 Reportar manualmente un error custom */
  public captureException(error: any, context?: Record<string, any>) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    this.report({
      message,
      stack,
      type: 'manual',
      ...context,
    });
  }
}
