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
  onSuccess: (zone: HostedZone, isEdit: boolean) => void;
}

export default function HostedZoneModal({
  visible,
  zone,
  onDismiss,
  onSuccess,
}: HostedZoneModalProps) {
  const isEdit = !!zone;
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [zoneType, setZoneType] = useState<'public' | 'private'>('public');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (zone) {
      setName(zone.name);
      setComment(zone.comment || '');
      setZoneType(zone.private_zone ? 'private' : 'public');
    } else {
      setName('');
      setComment('');
      setZoneType('public');
    }
    setError(null);
  }, [zone, visible]);

  const handleSubmit = async () => {
    if (!isEdit && !name.trim()) {
      setError('Domain name is required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (isEdit && zone) {
        const updated = await apiFetch<HostedZone>(`/api/hosted-zones/${zone.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            comment: comment.trim(),
            private_zone: zoneType === 'private',
          }),
        });
        onSuccess(updated, true);
      } else {
        const created = await apiFetch<HostedZone>('/api/hosted-zones', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            comment: comment.trim(),
            private_zone: zoneType === 'private',
          }),
        });
        onSuccess(created, false);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to save hosted zone.');
      } else {
        setError('Failed to save hosted zone.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header={isEdit ? `Edit hosted zone ${zone?.name}` : 'Create hosted zone'}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
              {isEdit ? 'Save changes' : 'Create hosted zone'}
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
            description="The name of the domain for which you want Route 53 to route traffic. For example: example.com."
          >
            <Input
              value={name}
              onChange={({ detail }) => setName(detail.value)}
              placeholder="example.com"
              disabled={isEdit}
            />
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
            description="Specify whether you want to route traffic on the internet or in an Amazon VPC."
          >
            <RadioGroup
              value={zoneType}
              onChange={({ detail }) => setZoneType(detail.value as 'public' | 'private')}
              items={[
                {
                  value: 'public',
                  label: 'Public hosted zone',
                  description: 'Routes traffic on the internet.',
                  disabled: isEdit,
                },
                {
                  value: 'private',
                  label: 'Private hosted zone',
                  description: 'Routes traffic within an Amazon VPC.',
                  disabled: isEdit,
                },
              ]}
            />
          </FormField>
        </SpaceBetween>
      </Form>
    </Modal>
  );
}
