import { ReactNode } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface ProtectedRouteProps {
  children: ReactNode;
  componentName?: string;
}

/**
 * Обёртка для защищённых маршрутов с ErrorBoundary
 */
export const ProtectedRoute = ({ children, componentName }: ProtectedRouteProps) => {
  return (
    <ErrorBoundary componentName={componentName || "ProtectedRoute"}>
      {children}
    </ErrorBoundary>
  );
};