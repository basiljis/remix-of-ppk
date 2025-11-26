import { supabase } from "@/integrations/supabase/client";

type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

interface ErrorLogData {
  errorType: string;
  errorMessage: string;
  errorStack?: string;
  componentName?: string;
  route?: string;
  severity?: ErrorSeverity;
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private isEnabled = true;
  private maxRetries = 2;
  private retryDelay = 1000; // 1 second

  /**
   * Отключить логирование ошибок (например, в тестовом режиме)
   */
  disable() {
    this.isEnabled = false;
    console.log('[ErrorLogger] Логирование отключено');
  }

  /**
   * Включить логирование ошибок
   */
  enable() {
    this.isEnabled = true;
    console.log('[ErrorLogger] Логирование включено');
  }

  /**
   * Логировать ошибку
   */
  async logError({
    errorType,
    errorMessage,
    errorStack,
    componentName,
    route = window.location.pathname,
    severity = 'error',
    metadata = {},
  }: ErrorLogData): Promise<void> {
    if (!this.isEnabled) {
      console.log('[ErrorLogger] Логирование отключено, пропуск ошибки');
      return;
    }

    // Локальное логирование в консоль
    const consoleMethod = severity === 'critical' || severity === 'error' ? 'error' : 
                         severity === 'warning' ? 'warn' : 'log';
    
    console[consoleMethod](`[ErrorLogger] ${severity.toUpperCase()}:`, {
      type: errorType,
      message: errorMessage,
      component: componentName,
      route,
      stack: errorStack,
      metadata
    });

    // Отправка на сервер с повторными попытками
    await this.sendToServer({
      errorType,
      errorMessage,
      errorStack,
      componentName,
      route,
      severity,
      metadata,
    }, 0);
  }

  /**
   * Отправить лог на сервер с повторными попытками
   */
  private async sendToServer(data: ErrorLogData & { route: string }, attempt: number): Promise<void> {
    try {
      const { data: functionData, error } = await supabase.functions.invoke('log-error', {
        body: {
          error_type: data.errorType,
          error_message: data.errorMessage,
          error_stack: data.errorStack,
          component_name: data.componentName,
          route: data.route,
          severity: data.severity,
          metadata: data.metadata,
        },
      });

      if (error) {
        throw error;
      }

      console.log('[ErrorLogger] Лог успешно отправлен на сервер:', functionData);
    } catch (error) {
      console.error(`[ErrorLogger] Ошибка отправки лога (попытка ${attempt + 1}/${this.maxRetries + 1}):`, error);

      // Повторная попытка, если не достигли лимита
      if (attempt < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
        await this.sendToServer(data, attempt + 1);
      } else {
        console.error('[ErrorLogger] Не удалось отправить лог после всех попыток');
      }
    }
  }

  /**
   * Логировать ошибку React компонента
   */
  logComponentError(
    error: Error,
    componentName: string,
    metadata?: Record<string, any>
  ) {
    return this.logError({
      errorType: 'React Error',
      errorMessage: error.message,
      errorStack: error.stack,
      componentName,
      severity: 'error',
      metadata: {
        ...metadata,
        errorName: error.name,
      },
    });
  }

  /**
   * Логировать критическую ошибку
   */
  logCritical(
    errorType: string,
    errorMessage: string,
    metadata?: Record<string, any>
  ) {
    return this.logError({
      errorType,
      errorMessage,
      severity: 'critical',
      metadata,
    });
  }

  /**
   * Логировать предупреждение
   */
  logWarning(
    errorType: string,
    errorMessage: string,
    metadata?: Record<string, any>
  ) {
    return this.logError({
      errorType,
      errorMessage,
      severity: 'warning',
      metadata,
    });
  }

  /**
   * Логировать информационное сообщение
   */
  logInfo(
    errorType: string,
    errorMessage: string,
    metadata?: Record<string, any>
  ) {
    return this.logError({
      errorType,
      errorMessage,
      severity: 'info',
      metadata,
    });
  }
}

// Экспортируем синглтон
export const errorLogger = new ErrorLogger();

// Установка глобального обработчика необработанных ошибок
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorLogger.logError({
      errorType: 'Uncaught Error',
      errorMessage: event.message,
      errorStack: event.error?.stack,
      componentName: 'Global',
      severity: 'error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Обработчик необработанных промисов
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.logError({
      errorType: 'Unhandled Promise Rejection',
      errorMessage: event.reason?.message || String(event.reason),
      errorStack: event.reason?.stack,
      componentName: 'Global',
      severity: 'error',
      metadata: {
        reason: event.reason,
      },
    });
  });
}