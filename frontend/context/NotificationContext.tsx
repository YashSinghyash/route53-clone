'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { FlashbarProps } from '@cloudscape-design/components';

interface NotificationItem extends FlashbarProps.MessageDefinition {
  id: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id' | 'onDismiss'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'onDismiss'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newItem: NotificationItem = {
      ...notification,
      id,
      dismissible: true,
      onDismiss: () => removeNotification(id),
    };
    setNotifications((prev) => [...prev, newItem]);
  }, [removeNotification]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
