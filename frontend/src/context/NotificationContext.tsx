import React, { createContext, useContext, useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  X 
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  type: 'incident' | 'security' | 'cicd' | 'alert';
  severity: 'critical' | 'warning' | 'info' | 'healthy';
  title: string;
  summary: string;
  time: string;
  link: string;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  addNotification: (item: NotificationItem) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string, durationMs?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(item => item.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    showToast('info', 'All notifications acknowledged and cleared.');
  };

  const addNotification = (item: NotificationItem) => {
    setNotifications(prev => [item, ...prev]);
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string, durationMs = 3500) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, durationMs);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      dismissNotification,
      clearAllNotifications,
      addNotification,
      showToast
    }}>
      {children}

      <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 max-w-sm w-[90vw] pointer-events-none">
        {toasts.map(toast => {
          let bgClass = 'bg-slate-700 text-white border-slate-600';
          let Icon = Info;

          if (toast.type === 'success') {
            bgClass = 'bg-emerald-600 text-white border-emerald-500';
            Icon = CheckCircle2;
          } else if (toast.type === 'error') {
            bgClass = 'bg-rose-600 text-white border-rose-500';
            Icon = XCircle;
          } else if (toast.type === 'warning') {
            bgClass = 'bg-amber-500 text-slate-950 border-amber-400 font-semibold';
            Icon = AlertTriangle;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-md shadow-xl border text-xs leading-relaxed animate-in slide-in-from-bottom duration-150 ${bgClass}`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 opacity-80 hover:opacity-100 transition-opacity rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
