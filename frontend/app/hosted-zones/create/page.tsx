'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Form from '@cloudscape-design/components/form';
import Container from '@cloudscape-design/components/container';
import Header from '@cloudscape-design/components/header';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Textarea from '@cloudscape-design/components/textarea';
import Tiles from '@cloudscape-design/components/tiles';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import LinkComponent from '@cloudscape-design/components/link';
import ConsoleLayout from '@/components/ConsoleLayout';
import { HostedZone, apiFetch } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';

export default function CreateHostedZonePage() {
  const router = useRouter();
  const { addNotification } = useNotification();

  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [zoneType, setZoneType] = useState<'public' | 'private'>('public');

  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setNameError('Domain name is required.');
      return;
    }

    setError(null);
    setNameError(null);
    setIsSubmitting(true);

    try {
      const created = await apiFetch<HostedZone>('/api/hosted-zones', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          comment: comment.trim(),
          private_zone: zoneType === 'private',
        }),
      });

      addNotification({
        type: 'success',
        content: `Successfully created hosted zone ${created.name}.`,
      });
      router.push('/hosted-zones');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to create hosted zone.');
      } else {
        setError('Failed to create hosted zone.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConsoleLayout
      contentType="form"
      breadcrumbs={[
        { text: 'Route 53', href: '/hosted-zones' },
        { text: 'Hosted zones', href: '/hosted-zones' },
        { text: 'Create hosted zone', href: '/hosted-zones/create' },
      ]}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <Form
          actions={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  onClick={() => router.push('/hosted-zones')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  loading={isSubmitting}
                  onClick={() => handleSubmit()}
                >
                  Create hosted zone
                </Button>
              </SpaceBetween>
            </Box>
          }
          header={
            <Header
              variant="h1"
              info={<LinkComponent variant="info" href="#" external>Info</LinkComponent>}
            >
              Create hosted zone
            </Header>
          }
        >
          <SpaceBetween size="l">
            {error && (
              <Alert type="error" dismissible onDismiss={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Section 1: Hosted zone configuration */}
            <Container
              header={
                <Header
                  variant="h2"
                  description="A hosted zone is a container that holds information about how you want to route traffic for a domain, such as example.com, and its subdomains."
                >
                  Hosted zone configuration
                </Header>
              }
            >
              <SpaceBetween size="l">
                <FormField
                  label={
                    <span>
                      Domain name{' '}
                      <LinkComponent variant="info" href="#" external>
                        Info
                      </LinkComponent>
                    </span>
                  }
                  description="This is the name of the domain that you want to route traffic for."
                  errorText={nameError}
                  constraintText="Valid characters: a-z, 0-9, ! &quot; # $ % &amp; ' ( ) * + , - / : ; &lt; = &gt; ? @ [ \ ] ^ _ ` { | } . ~"
                >
                  <Input
                    value={name}
                    onChange={({ detail }) => {
                      setName(detail.value);
                      if (nameError) setNameError(null);
                    }}
                    placeholder="example.com"
                    invalid={!!nameError}
                  />
                </FormField>

                <FormField
                  label={
                    <span>
                      Description - optional{' '}
                      <LinkComponent variant="info" href="#" external>
                        Info
                      </LinkComponent>
                    </span>
                  }
                  description="This value lets you distinguish hosted zones that have the same name."
                  constraintText={`The description can have up to 256 characters. ${comment.length}/256`}
                >
                  <Textarea
                    value={comment}
                    onChange={({ detail }) => {
                      if (detail.value.length <= 256) {
                        setComment(detail.value);
                      }
                    }}
                    placeholder="The hosted zone is used for..."
                    rows={4}
                  />
                </FormField>

                <FormField
                  label={
                    <span>
                      Type{' '}
                      <LinkComponent variant="info" href="#" external>
                        Info
                      </LinkComponent>
                    </span>
                  }
                  description="The type indicates whether you want to route traffic on the internet or in an Amazon VPC."
                >
                  <Tiles
                    value={zoneType}
                    onChange={({ detail }) => setZoneType(detail.value as 'public' | 'private')}
                    items={[
                      {
                        value: 'public',
                        label: 'Public hosted zone',
                        description: 'A public hosted zone determines how traffic is routed on the internet.',
                      },
                      {
                        value: 'private',
                        label: 'Private hosted zone',
                        description: 'A private hosted zone determines how traffic is routed within an Amazon VPC.',
                      },
                    ]}
                  />
                </FormField>
              </SpaceBetween>
            </Container>

            {/* Section 2: Tags */}
            <Container
              header={
                <Header
                  variant="h2"
                  info={<LinkComponent variant="info" href="#" external>Info</LinkComponent>}
                  description="Apply tags to hosted zones to help organize and identify them."
                >
                  Tags
                </Header>
              }
            >
              <SpaceBetween size="m">
                <Box color="inherit">No tags associated with the resource.</Box>
                <div>
                  <Button disabled={isSubmitting}>Add tag</Button>
                </div>
                <Box variant="small" color="text-body-secondary">
                  You can add up to 50 more tags.
                </Box>
              </SpaceBetween>
            </Container>
          </SpaceBetween>
        </Form>
      </form>
    </ConsoleLayout>
  );
}
