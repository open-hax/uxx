/**
 * Toast Component
 *
 * Implements the toast.edn contract.
 * Non-blocking notification toasts with auto-dismiss and action support.
 */
import { type ReactNode } from 'react';
export type ToastType = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
export interface ToastAction {
    label: string;
    onClick: () => void;
}
export interface ToastData {
    id: string;
    type?: ToastType;
    title?: string;
    message: string;
    duration?: number;
    dismissible?: boolean;
    action?: ToastAction;
    icon?: ReactNode;
}
export interface ToastProps extends ToastData {
    onDismiss: (id: string) => void;
}
export interface ToastContainerProps {
    position?: ToastPosition;
    children?: ReactNode;
}
interface ToastContextValue {
    toasts: ToastData[];
    addToast: (toast: Omit<ToastData, 'id'>) => string;
    dismissToast: (id: string) => void;
    updateToast: (id: string, updates: Partial<ToastData>) => void;
}
/**
 * Individual toast notification.
 */
declare function ToastItem({ id, type, title, message, duration, dismissible, action, icon, onDismiss, }: ToastProps): import("react/jsx-runtime").JSX.Element;
/**
 * Toast container that manages multiple toasts.
 */
export declare function ToastContainer({ position, children }: ToastContainerProps): import("react").ReactPortal;
/**
 * Toast provider for managing toast state.
 */
export declare function ToastProvider({ children, position, }: {
    children: ReactNode;
    position?: ToastPosition;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Hook for toast management.
 */
export declare function useToast(): ToastContextValue;
export declare const Toast: typeof ToastItem;
export default Toast;
//# sourceMappingURL=Toast.d.ts.map