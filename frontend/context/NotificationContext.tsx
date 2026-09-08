'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  useEffect(() => {
    setNotifications([]);
  }, [pathname]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'onDismiss'>) => {
    setNotifications((prev) => {
      const getContentKey = (content: React.ReactNode): string => {
        if (typeof content === 'string') return content;
        if (typeof content === 'number') return String(content);
        return '';
      };

      const newKey = getContentKey(notification.content);

      // Check if a notification with matching content is already active
      const existingIndex = prev.findIndex((item) => {
        const itemKey = getContentKey(item.content);
        return newKey && itemKey ? itemKey === newKey : false;
      });

      if (existingIndex !== -1) {
        // Notification already active: re-key with a new ID to trigger a visual pulse/flash without creating a duplicate stack
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newFlashId = `notif-${Math.random().toString(36).substring(2, 9)}`;

        updated[existingIndex] = {
          ...existing,
          ...notification,
          id: newFlashId,
          dismissible: true,
          onDismiss: () => removeNotification(newFlashId),
        };
        return updated;
      }

      // Enforce FIFO cap of maximum 5 items (remove oldest item first if at capacity)
      const MAX_NOTIFICATIONS = 5;
      const baseList = prev.length >= MAX_NOTIFICATIONS ? prev.slice(prev.length - (MAX_NOTIFICATIONS - 1)) : prev;

      const id = `notif-${Math.random().toString(36).substring(2, 9)}`;
      const newItem: NotificationItem = {
        ...notification,
        id,
        dismissible: true,
        onDismiss: () => removeNotification(id),
      };
      return [...baseList, newItem];
    });
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
