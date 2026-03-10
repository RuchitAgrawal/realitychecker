import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastProps {
    toasts: ToastMessage[];
    onRemove: (id: string) => void;
}

const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
};

export const Toast = ({ toasts, onRemove }: ToastProps) => {
    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
};

const ToastItem = ({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) => {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), 3000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    return (
        <div
            className={`toast toast-${toast.type}`}
            onClick={() => onRemove(toast.id)}
            style={{ cursor: 'pointer' }}
        >
            <span style={{
                width: '1.5rem',
                height: '1.5rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                flexShrink: 0,
                background: toast.type === 'success' ? 'rgba(16,185,129,0.3)'
                    : toast.type === 'error' ? 'rgba(239,68,68,0.3)'
                    : 'rgba(99,102,241,0.3)',
            }}>
                {icons[toast.type]}
            </span>
            <span>{toast.message}</span>
        </div>
    );
};

/* Hook to manage toasts */
export function useToast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, type, message }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return { toasts, addToast, removeToast };
}

export default Toast;
