import React, { useEffect } from 'react';
import { ToastMessage, ToastType } from '../types';
import { CloseIcon } from './icons';

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, 3000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    const bgColors: Record<ToastType, string> = {
        success: 'bg-primary',
        error: 'bg-red-600',
        info: 'bg-blue-600',
    };

    return (
        <div className={`${bgColors[toast.type]} text-white p-4 rounded-lg shadow-lg flex items-center justify-between min-w-[300px] animate-fade-in-up`}>
            <span>{toast.message}</span>
            <button onClick={() => onRemove(toast.id)} className="ml-4 hover:opacity-75">
                <CloseIcon className="h-4 w-4" />
            </button>
        </div>
    );
};

interface ToastContainerProps {
    toasts: ToastMessage[];
    removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
};

export default ToastContainer;