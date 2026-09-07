'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@cloudscape-design/components/modal';
import Form from '@cloudscape-design/components/form';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Textarea from '@cloudscape-design/components/textarea';
import Select, { SelectProps } from '@cloudscape-design/components/select';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import Grid from '@cloudscape-design/components/grid';
import { DnsRecord, HostedZone, apiFetch } from '@/lib/api';

interface RecordModalProps {
  visible: boolean;
  zone: HostedZone;
  record: DnsRecord | null;
  onDismiss: () => void;
  onSuccess: (record: DnsRecord, isEdit: boolean) => void;
}

const RECORD_TYPES: SelectProps.Option[] = [
  { label: 'A - Routes traffic to an IPv4 address', value: 'A' },
  { label: 'AAAA - Routes traffic to an IPv6 address', value: 'AAAA' },
  { label: 'CNAME - Routes traffic to another domain name', value: 'CNAME' },
  { label: 'TXT - Stores text-based information', value: 'TXT' },
  { label: 'MX - Specifies mail servers', value: 'MX' },
  { label: 'NS - Specifies name servers', value: 'NS' },
  { label: 'PTR - Maps an IP address to a domain name', value: 'PTR' },
  { label: 'SRV - Specifies location of services', value: 'SRV' },
  { label: 'CAA - Specifies CAs allowed to issue certificates', value: 'CAA' },
];

const CAA_TAGS: SelectProps.Option[] = [
  { label: 'issue (Explicitly authorizes a single CA)', value: 'issue' },
  { label: 'issuewild (Explicitly authorizes wildcard certificates)', value: 'issuewild' },
  { label: 'iodef (Specifies URL for reporting policy violations)', value: 'iodef' },
];

export default function RecordModal({
  visible,
  zone,
  record,
  onDismiss,
  onSuccess,
}: RecordModalProps) {
  const isEdit = !!record;

  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<SelectProps.Option>(RECORD_TYPES[0]);
  const [ttl, setTtl] = useState('300');

  // Generic value (for A, AAAA, CNAME, TXT, NS, PTR)
  const [genericValue, setGenericValue] = useState('');

  // MX fields
  const [mxPriority, setMxPriority] = useState('10');
  const [mxServer, setMxServer] = useState('');

  // SRV fields
  const [srvPriority, setSrvPriority] = useState('10');
  const [srvWeight, setSrvWeight] = useState('60');
  const [srvPort, setSrvPort] = useState('5060');
  const [srvTarget, setSrvTarget] = useState('');

  // CAA fields
  const [caaFlags, setCaaFlags] = useState('0');
  const [caaTag, setCaaTag] = useState<SelectProps.Option>(CAA_TAGS[0]);
  const [caaValue, setCaaValue] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (record) {
      setName(record.name);
      const foundType = RECORD_TYPES.find((t) => t.value === record.type) || {
        label: record.type,
        value: record.type,
      };
      setSelectedType(foundType);
      setTtl(record.ttl ? record.ttl.toString() : '300');

      const val = record.value || '';
      if (record.type === 'MX') {
        const parts = val.trim().split(/\s+/);
        setMxPriority(parts[0] || '10');
        setMxServer(parts.slice(1).join(' '));
      } else if (record.type === 'SRV') {
        const parts = val.trim().split(/\s+/);
        setSrvPriority(parts[0] || '10');
        setSrvWeight(parts[1] || '60');
        setSrvPort(parts[2] || '5060');
        setSrvTarget(parts.slice(3).join(' '));
      } else if (record.type === 'CAA') {
        const parts = val.trim().split(/\s+/);
        setCaaFlags(parts[0] || '0');
        const tagValue = parts[1] || 'issue';
        const foundTag = CAA_TAGS.find((t) => t.value === tagValue) || {
          label: tagValue,
          value: tagValue,
        };
        setCaaTag(foundTag);
        let cleanVal = parts.slice(2).join(' ');
        if (cleanVal.startsWith('"') && cleanVal.endsWith('"')) {
          cleanVal = cleanVal.slice(1, -1);
        }
        setCaaValue(cleanVal);
      } else {
        setGenericValue(val);
      }
    } else {
      setName('');
      setSelectedType(RECORD_TYPES[0]);
      setTtl('300');
      setGenericValue('');
      setMxPriority('10');
      setMxServer('');
      setSrvPriority('10');
      setSrvWeight('60');
      setSrvPort('5060');
      setSrvTarget('');
      setCaaFlags('0');
      setCaaTag(CAA_TAGS[0]);
      setCaaValue('');
    }
    setError(null);
    setFieldErrors({});
  }, [record, visible]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const currentType = selectedType.value;

    if (!ttl || isNaN(Number(ttl)) || Number(ttl) < 0) {
      errors.ttl = 'TTL must be a non-negative number';
    }

    if (currentType === 'MX') {
      if (!mxPriority.trim()) {
        errors.mxPriority = 'Priority is required';
      } else if (isNaN(Number(mxPriority)) || !/^\d+$/.test(mxPriority.trim())) {
        errors.mxPriority = 'Priority must be a number';
      }
      if (!mxServer.trim()) {
        errors.mxServer = 'Mail server is required';
      }
    } else if (currentType === 'SRV') {
      if (!srvPriority.trim()) {
        errors.srvPriority = 'Priority is required';
      } else if (isNaN(Number(srvPriority)) || !/^\d+$/.test(srvPriority.trim())) {
        errors.srvPriority = 'Priority must be a number';
      }

      if (!srvWeight.trim()) {
        errors.srvWeight = 'Weight is required';
      } else if (isNaN(Number(srvWeight)) || !/^\d+$/.test(srvWeight.trim())) {
        errors.srvWeight = 'Weight must be a number';
      }

      if (!srvPort.trim()) {
        errors.srvPort = 'Port is required';
      } else if (
        isNaN(Number(srvPort)) ||
        !/^\d+$/.test(srvPort.trim()) ||
        Number(srvPort) < 1 ||
        Number(srvPort) > 65535
      ) {
        errors.srvPort = 'Port must be a number between 1 and 65535';
      }

      if (!srvTarget.trim()) {
        errors.srvTarget = 'Target domain is required';
      }
    } else if (currentType === 'CAA') {
      if (!caaFlags.trim()) {
        errors.caaFlags = 'Flags is required';
      } else if (isNaN(Number(caaFlags)) || !/^\d+$/.test(caaFlags.trim())) {
        errors.caaFlags = 'Flags must be a number';
      }
      if (!caaValue.trim()) {
        errors.caaValue = 'Value is required';
      }
    } else {
      if (!genericValue.trim()) {
        errors.genericValue = 'Value is required';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const constructValue = (): string => {
    const currentType = selectedType.value;
    if (currentType === 'MX') {
      return `${mxPriority.trim()} ${mxServer.trim()}`;
    }
    if (currentType === 'SRV') {
      return `${srvPriority.trim()} ${srvWeight.trim()} ${srvPort.trim()} ${srvTarget.trim()}`;
    }
    if (currentType === 'CAA') {
      return `${caaFlags.trim()} ${caaTag.value?.trim()} ${caaValue.trim()}`;
    }
    return genericValue.trim();
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const recordType = selectedType.value || 'A';
    const computedValue = constructValue();

    setError(null);
    setIsSubmitting(true);

    try {
      if (isEdit && record) {
        const updated = await apiFetch<DnsRecord>(`/api/records/${record.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            value: computedValue,
            ttl: parseInt(ttl, 10) || 300,
          }),
        });
        onSuccess(updated, true);
      } else {
        const created = await apiFetch<DnsRecord>(`/api/hosted-zones/${zone.id}/records`, {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim() || zone.name,
            type: recordType,
            value: computedValue,
            ttl: parseInt(ttl, 10) || 300,
          }),
        });
        onSuccess(created, false);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to save DNS record.');
      } else {
        setError('Failed to save DNS record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFieldError = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldName];
        return copy;
      });
    }
  };

  const renderValueFields = () => {
    const recType = selectedType.value;

    switch (recType) {
      case 'A':
        return (
          <FormField
            label="Value"
            description="The IPv4 address to route traffic to. Example: 192.0.2.1"
            errorText={fieldErrors.genericValue}
          >
            <Input
              value={genericValue}
              invalid={!!fieldErrors.genericValue}
              onChange={({ detail }) => {
                setGenericValue(detail.value);
                clearFieldError('genericValue');
              }}
              placeholder="192.0.2.1"
            />
          </FormField>
        );
      case 'AAAA':
        return (
          <FormField
            label="Value"
            description="The IPv6 address to route traffic to. Example: 2001:0db8:85a3:0000:0000:8a2e:0370:7334"
            errorText={fieldErrors.genericValue}
          >
            <Input
              value={genericValue}
              invalid={!!fieldErrors.genericValue}
              onChange={({ detail }) => {
                setGenericValue(detail.value);
                clearFieldError('genericValue');
              }}
              placeholder="2001:db8::1"
            />
          </FormField>
        );
      case 'CNAME':
      case 'NS':
      case 'PTR':
        return (
          <FormField
            label="Value"
            description={`The domain name to route traffic to for ${recType} record.`}
            errorText={fieldErrors.genericValue}
          >
            <Input
              value={genericValue}
              invalid={!!fieldErrors.genericValue}
              onChange={({ detail }) => {
                setGenericValue(detail.value);
                clearFieldError('genericValue');
              }}
              placeholder="example.com"
            />
          </FormField>
        );
      case 'TXT':
        return (
          <FormField
            label="Value"
            description="The text value to store in the DNS record."
            errorText={fieldErrors.genericValue}
          >
            <Textarea
              value={genericValue}
              invalid={!!fieldErrors.genericValue}
              onChange={({ detail }) => {
                setGenericValue(detail.value);
                clearFieldError('genericValue');
              }}
              placeholder='v=spf1 include:_spf.google.com ~all'
              rows={3}
            />
          </FormField>
        );
      case 'MX':
        return (
          <Grid gridDefinition={[{ colspan: 4 }, { colspan: 8 }]}>
            <FormField
              label="Priority"
              description="Lower number = higher priority"
              errorText={fieldErrors.mxPriority}
            >
              <Input
                type="number"
                value={mxPriority}
                invalid={!!fieldErrors.mxPriority}
                onChange={({ detail }) => {
                  setMxPriority(detail.value);
                  clearFieldError('mxPriority');
                }}
                placeholder="10"
              />
            </FormField>
            <FormField
              label="Mail server"
              description="Domain name of the mail server"
              errorText={fieldErrors.mxServer}
            >
              <Input
                value={mxServer}
                invalid={!!fieldErrors.mxServer}
                onChange={({ detail }) => {
                  setMxServer(detail.value);
                  clearFieldError('mxServer');
                }}
                placeholder="mail.example.com"
              />
            </FormField>
          </Grid>
        );
      case 'SRV':
        return (
          <Grid gridDefinition={[{ colspan: 3 }, { colspan: 3 }, { colspan: 3 }, { colspan: 3 }]}>
            <FormField
              label="Priority"
              errorText={fieldErrors.srvPriority}
            >
              <Input
                type="number"
                value={srvPriority}
                invalid={!!fieldErrors.srvPriority}
                onChange={({ detail }) => {
                  setSrvPriority(detail.value);
                  clearFieldError('srvPriority');
                }}
                placeholder="10"
              />
            </FormField>
            <FormField
              label="Weight"
              errorText={fieldErrors.srvWeight}
            >
              <Input
                type="number"
                value={srvWeight}
                invalid={!!fieldErrors.srvWeight}
                onChange={({ detail }) => {
                  setSrvWeight(detail.value);
                  clearFieldError('srvWeight');
                }}
                placeholder="60"
              />
            </FormField>
            <FormField
              label="Port"
              errorText={fieldErrors.srvPort}
            >
              <Input
                type="number"
                value={srvPort}
                invalid={!!fieldErrors.srvPort}
                onChange={({ detail }) => {
                  setSrvPort(detail.value);
                  clearFieldError('srvPort');
                }}
                placeholder="5060"
              />
            </FormField>
            <FormField
              label="Target"
              errorText={fieldErrors.srvTarget}
            >
              <Input
                value={srvTarget}
                invalid={!!fieldErrors.srvTarget}
                onChange={({ detail }) => {
                  setSrvTarget(detail.value);
                  clearFieldError('srvTarget');
                }}
                placeholder="target.example.com"
              />
            </FormField>
          </Grid>
        );
      case 'CAA':
        return (
          <Grid gridDefinition={[{ colspan: 3 }, { colspan: 4 }, { colspan: 5 }]}>
            <FormField
              label="Flags"
              description="0 (non-critical) or 128"
              errorText={fieldErrors.caaFlags}
            >
              <Input
                type="number"
                value={caaFlags}
                invalid={!!fieldErrors.caaFlags}
                onChange={({ detail }) => {
                  setCaaFlags(detail.value);
                  clearFieldError('caaFlags');
                }}
                placeholder="0"
              />
            </FormField>
            <FormField label="Tag" description="Property tag">
              <Select
                selectedOption={caaTag}
                onChange={({ detail }) => setCaaTag(detail.selectedOption)}
                options={CAA_TAGS}
              />
            </FormField>
            <FormField
              label="Value"
              description="Domain name of CA (e.g. letsencrypt.org)"
              errorText={fieldErrors.caaValue}
            >
              <Input
                value={caaValue}
                invalid={!!fieldErrors.caaValue}
                onChange={({ detail }) => {
                  setCaaValue(detail.value);
                  clearFieldError('caaValue');
                }}
                placeholder="letsencrypt.org"
              />
            </FormField>
          </Grid>
        );
      default:
        return (
          <FormField
            label="Value"
            errorText={fieldErrors.genericValue}
          >
            <Input
              value={genericValue}
              invalid={!!fieldErrors.genericValue}
              onChange={({ detail }) => {
                setGenericValue(detail.value);
                clearFieldError('genericValue');
              }}
            />
          </FormField>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header={isEdit ? `Edit record ${record?.name}` : 'Create record'}
      size="large"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
              {isEdit ? 'Save changes' : 'Create record'}
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <Form>
        <SpaceBetween size="l">
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid gridDefinition={[{ colspan: 6 }, { colspan: 6 }]}>
            <FormField
              label="Record name"
              description={`Enter name (e.g., www or sub). Domain appended: .${zone.name}`}
            >
              <Input
                value={name}
                onChange={({ detail }) => setName(detail.value)}
                placeholder={zone.name}
                disabled={isEdit}
              />
            </FormField>

            <FormField label="Record type">
              <Select
                selectedOption={selectedType}
                onChange={({ detail }) => {
                  setSelectedType(detail.selectedOption);
                  setFieldErrors({});
                }}
                options={RECORD_TYPES}
                disabled={isEdit}
              />
            </FormField>
          </Grid>

          <FormField
            label="TTL (Seconds)"
            description="Time to live: duration DNS resolvers cache this record."
            errorText={fieldErrors.ttl}
          >
            <Input
              type="number"
              value={ttl}
              invalid={!!fieldErrors.ttl}
              onChange={({ detail }) => {
                setTtl(detail.value);
                clearFieldError('ttl');
              }}
              placeholder="300"
            />
          </FormField>

          {renderValueFields()}
        </SpaceBetween>
      </Form>
    </Modal>
  );
}
