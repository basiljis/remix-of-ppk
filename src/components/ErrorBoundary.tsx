import React, { Component, ErrorInfo, ReactNode } from "react";
import { errorLogger } from "@/services/errorLogger";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Обновляем состояние, чтобы при следующем рендере показать запасной UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Перехвачена ошибка:", error);
    console.error("[ErrorBoundary] Информация об ошибке:", errorInfo);

    // Автоматически перезагружаем страницу при ошибке загрузки chunk (lazy import failed)
    const isChunkError = 
      error.message?.includes("Importing a module script failed") ||
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Loading CSS chunk");

    if (isChunkError) {
      console.warn("[ErrorBoundary] Обнаружена ошибка загрузки модуля — перезагружаем страницу...");
      // Задержка чтобы не войти в бесконечный цикл
      const reloadKey = "chunk_reload_attempt";
      const lastAttempt = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      if (!lastAttempt || now - Number(lastAttempt) > 10000) {
        sessionStorage.setItem(reloadKey, String(now));
        window.location.reload();
        return;
      } else {
        console.error("[ErrorBoundary] Перезагрузка уже выполнялась, показываем ошибку");
      }
    }

    // Сохраняем информацию об ошибке в состояние
    this.setState({
      error,
      errorInfo,
    });

    // Логируем ошибку через errorLogger
    errorLogger.logComponentError(
      error,
      this.props.componentName || "Unknown Component",
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      }
    );

    // Вызываем пользовательский обработчик, если он был передан
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    console.log("[ErrorBoundary] Сброс состояния ошибки");
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    console.log("[ErrorBoundary] Переход на главную страницу");
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Если передан пользовательский fallback UI, используем его
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Иначе показываем дефолтный UI с информацией об ошибке
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <CardTitle>Произошла ошибка</CardTitle>
                  <CardDescription>
                    Что-то пошло не так при работе приложения
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Краткое описание ошибки */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Сообщение об ошибке:</h3>
                <div className="bg-muted p-3 rounded-md">
                  <code className="text-sm text-destructive">
                    {this.state.error?.message || "Неизвестная ошибка"}
                  </code>
                </div>
              </div>

              {/* Детали для разработчиков (в режиме разработки) */}
              {process.env.NODE_ENV === "development" && this.state.errorInfo && (
                <details className="space-y-2">
                  <summary className="cursor-pointer font-semibold text-sm hover:text-primary">
                    Техническая информация (для разработчиков)
                  </summary>
                  <div className="mt-2 bg-muted p-3 rounded-md overflow-auto max-h-64">
                    <pre className="text-xs font-mono">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              {/* Информация для пользователя */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-md">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Что делать?</strong>
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>• Попробуйте обновить страницу</li>
                  <li>• Если ошибка повторяется, вернитесь на главную</li>
                  <li>• Информация об ошибке автоматически отправлена администраторам</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button onClick={this.handleReset} variant="default" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Попробовать снова
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                На главную
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    // Если ошибки нет, рендерим children как обычно
    return this.props.children;
  }
}

// Экспорт обёртки для удобства использования с функциональными компонентами
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || "Component"})`;

  return WrappedComponent;
};