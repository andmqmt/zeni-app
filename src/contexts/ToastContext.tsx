'use client';

import { createContext, useContext, ReactNode } from 'react';
import toast, { Toaster } from 'react-hot-toast';

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const success = (message: string) => {
    toast.success(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: 'var(--toast-success-bg)',
        color: 'var(--toast-success-text)',
        border: '1px solid var(--toast-success-border)',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      iconTheme: {
        primary: 'var(--toast-success-icon)',
        secondary: 'white',
      },
    });
  };

  const error = (message: string) => {
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: 'var(--toast-error-bg)',
        color: 'var(--toast-error-text)',
        border: '1px solid var(--toast-error-border)',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      iconTheme: {
        primary: 'var(--toast-error-icon)',
        secondary: 'white',
      },
    });
  };

  const warning = (message: string) => {
    toast(message, {
      duration: 4500,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: 'var(--toast-warning-bg)',
        color: 'var(--toast-warning-text)',
        border: '1px solid var(--toast-warning-border)',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    });
  };

  const info = (message: string) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: 'var(--toast-info-bg)',
        color: 'var(--toast-info-text)',
        border: '1px solid var(--toast-info-border)',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    });
  };

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}
      <Toaster 
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerStyle={{
          top: 80,
        }}
        toastOptions={{
          className: '',
          duration: 4000,
          style: {
            maxWidth: '500px',
          },
        }}
      />
    </ToastContext.Provider>
  );
}
