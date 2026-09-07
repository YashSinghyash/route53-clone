'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@cloudscape-design/components/modal';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';

interface DeleteConfirmModalProps {
  visible: boolean;
  targetName: string;
  targetId: string;
  resourceType?: string;
  onDismiss: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteConfirmModal({
  visible,
  targetName,
  targetId,
  resourceType = 'hosted zone',
  onDismiss,
  onConfirm,
}: DeleteConfirmModalProps) {
  const [confirmInput, setConfirmInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setConfirmInput('');
    setError(null);
  }, [visible, targetId]);

  const isMatched = confirmInput.trim() === targetName.trim();

  const handleDelete = async () => {
    if (!isMatched) return;
    setError(null);
    setIsDeleting(true);
    try {
      await onConfirm();
      onDismiss();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || `Failed to delete ${resourceType}.`);
      } else {
        setError(`Failed to delete ${resourceType}.`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header={`Delete ${resourceType}`}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!isMatched || isDeleting}
              loading={isDeleting}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box variant="span">
          Permanently delete the {resourceType} <strong>{targetName}</strong>? This action cannot be undone.
        </Box>

        <FormField
          label={`To confirm deletion, type "${targetName}" in the field below.`}
        >
          <Input
            value={confirmInput}
            onChange={({ detail }) => setConfirmInput(detail.value)}
            placeholder={targetName}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}
