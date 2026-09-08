'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@cloudscape-design/components/modal';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import { useAuth } from '@/context/AuthContext';

export default function ReadOnlyModal() {
  const { isReadOnly, logout } = useAuth();
  const [visible, setVisible] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (isReadOnly && typeof window !== 'undefined') {
      const shown = sessionStorage.getItem('read_only_modal_shown');
      if (!shown) {
        setVisible(true);
      }
    }
  }, [isReadOnly]);

  if (!isReadOnly || !visible) {
    return null;
  }

  const handleContinue = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('read_only_modal_shown', 'true');
    }
    setVisible(false);
  };

  const handleSwitchToAdmin = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('read_only_modal_shown');
    }
    logout();
    router.push('/login?autofill=admin');
  };

  return (
    <Modal
      visible={visible}
      onDismiss={handleContinue}
      header="Read-only access"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="normal" onClick={handleSwitchToAdmin}>
              Switch to Admin
            </Button>
            <Button variant="primary" onClick={handleContinue}>
              Continue as ReadOnly
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Box variant="p">
        You&apos;re signed in as a ReadOnly user. You can view all hosted zones and DNS records, but creating, editing, deleting, and importing are disabled. Switch to the Admin demo account for full access.
      </Box>
    </Modal>
  );
}
