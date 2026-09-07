'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@cloudscape-design/components/modal';
import Form from '@cloudscape-design/components/form';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Textarea from '@cloudscape-design/components/textarea';
import RadioGroup from '@cloudscape-design/components/radio-group';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import { HostedZone, apiFetch } from '@/lib/api';

interface HostedZoneModalProps {
  visible: boolean;
  zone: HostedZone | null;
  onDismiss: () => void;
  onSuccess: (zone: HostedZone) => void;
}

export default function HostedZoneModal({
  visible,
  zone,
  onDismiss,
  onSuccess,
}: HostedZoneModalProps) {
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (zone) {
      setComment(zone.comment || '');
    }
    setError(null);
  }, [zone, visible]);

  if (!zone) return null;

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const updated = await apiFetch<HostedZone>(`/api/hosted-zones/${zone.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          comment: comment.trim(),
          private_zone: zone.private_zone,
        }),
      });
      onSuccess(updated);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to update hosted zone.');
      } else {
        setError('Failed to update hosted zone.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header={`Edit hosted zone ${zone.name}`}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
              Save changes
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form>
        <SpaceBetween size="m">
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <FormField
            label="Domain name"
            description="The name of the domain for which Route 53 routes traffic."
          >
            <Input value={zone.name} disabled />
          </FormField>

          <FormField
            label="Description"
            description="Optional comment about the hosted zone."
          >
            <Textarea
              value={comment}
              onChange={({ detail }) => setComment(detail.value)}
              placeholder="Enter a description"
              rows={3}
            />
          </FormField>

          <FormField
            label="Type"
            description="Hosted zone type is immutable."
          >
            <RadioGroup
              value={zone.private_zone ? 'private' : 'public'}
              items={[
                {
                  value: 'public',
                  label: 'Public hosted zone',
                  description: 'Routes traffic on the internet.',
                  disabled: true,
                },
                {
                  value: 'private',
                  label: 'Private hosted zone',
                  description: 'Routes traffic within an Amazon VPC.',
                  disabled: true,
                },
              ]}
            />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}
