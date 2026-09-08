'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Table from '@cloudscape-design/components/table';
import Header from '@cloudscape-design/components/header';
import TextFilter from '@cloudscape-design/components/text-filter';
import Pagination from '@cloudscape-design/components/pagination';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import ButtonDropdown from '@cloudscape-design/components/button-dropdown';
import Box from '@cloudscape-design/components/box';
import LinkComponent from '@cloudscape-design/components/link';
import ConsoleLayout from '@/components/ConsoleLayout';
import HostedZoneModal from '@/components/HostedZoneModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { HostedZone, PaginatedResponse, apiFetch } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';
import { useKeyboardShortcuts } from '@/context/KeyboardShortcutsContext';
import { useAuth } from '@/context/AuthContext';

export default function HostedZonesPage() {
  const router = useRouter();
  const { isReadOnly } = useAuth();
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedItems, setSelectedItems] = useState<HostedZone[]>([]);
  
  // Filtering & Pagination
  const [filterText, setFilterText] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Modals state
  const [editingZone, setEditingZone] = useState<HostedZone | null>(null);
  const [deletingZone, setDeletingZone] = useState<HostedZone | null>(null);

  const { addNotification } = useNotification();

  const selectedZone = selectedItems[0] || null;

  useKeyboardShortcuts({
    onCreate: () => {
      if (!isReadOnly) router.push('/hosted-zones/create');
    },
    onEdit: () => {
      if (!isReadOnly && selectedZone) {
        setEditingZone(selectedZone);
      }
    },
    onDelete: () => {
      if (!isReadOnly && selectedZone) {
        setDeletingZone(selectedZone);
      }
    },
    onEscape: () => {
      if (editingZone) {
        setEditingZone(null);
        return true;
      }
      if (deletingZone) {
        setDeletingZone(null);
        return true;
      }
      if (filterText) {
        setFilterText('');
        return true;
      }
      return false;
    },
  });

  const fetchZones = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      if (filterText) {
        params.append('search', filterText);
      }
      const data = await apiFetch<PaginatedResponse<HostedZone>>(`/api/hosted-zones?${params.toString()}`);
      setZones(data.items);
      setTotalCount(data.count);
    } catch (err: unknown) {
      if (err instanceof Error) {
        addNotification({
          type: 'error',
          content: err.message || 'Failed to fetch hosted zones.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterText, addNotification]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleEditSuccess = (zone: HostedZone) => {
    setEditingZone(null);
    setSelectedItems([]);
    addNotification({
      type: 'success',
      content: `Successfully updated hosted zone ${zone.name}.`,
    });
    fetchZones();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingZone) return;
    const targetName = deletingZone.name;
    await apiFetch(`/api/hosted-zones/${deletingZone.id}`, {
      method: 'DELETE',
    });
    setSelectedItems([]);
    setDeletingZone(null);
    addNotification({
      type: 'success',
      content: `Successfully deleted hosted zone ${targetName}.`,
    });
    fetchZones();
  };

  const handleExport = async (zone: HostedZone, format: 'json' | 'bind') => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/hosted-zones/${zone.id}/export?format=${format}`, {
        headers,
      });
      if (!res.ok) {
        throw new Error(`Export failed with status ${res.status}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'bind' ? `${zone.name}.zone` : `${zone.name}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addNotification({
        type: 'success',
        content: `Successfully exported ${zone.name} as ${format.toUpperCase()}.`,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        addNotification({
          type: 'error',
          content: err.message || 'Failed to export zone.',
        });
      }
    }
  };

  const pagesCount = Math.ceil(totalCount / pageSize) || 1;

  return (
    <ConsoleLayout
      breadcrumbs={[
        { text: 'Route 53', href: '/hosted-zones' },
        { text: 'Hosted zones', href: '/hosted-zones' },
      ]}
    >
      <SpaceBetween size="l">
        <Table
          columnDefinitions={[
            {
              id: 'name',
              header: 'Hosted zone name',
              cell: (item) => (
                <LinkComponent
                  href={`/hosted-zones/${item.id}/records`}
                  onFollow={(e) => {
                    e.preventDefault();
                    router.push(`/hosted-zones/${item.id}/records`);
                  }}
                >
                  {item.name}
                </LinkComponent>
              ),
              sortingField: 'name',
              isRowHeader: true,
            },
            {
              id: 'type',
              header: 'Type',
              cell: (item) => (item.private_zone ? 'Private hosted zone' : 'Public hosted zone'),
            },
            {
              id: 'created_by',
              header: 'Created by',
              cell: (item) => item.caller_reference || 'Console',
            },
            {
              id: 'record_count',
              header: 'Record count',
              cell: (item) => item.record_count,
            },
            {
              id: 'comment',
              header: 'Description',
              cell: (item) => item.comment || '-',
            },
            {
              id: 'id',
              header: 'Hosted zone ID',
              cell: (item) => item.id,
            },
          ]}
          items={zones}
          loading={isLoading}
          loadingText="Loading hosted zones..."
          selectionType="single"
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
          trackBy="id"
          header={
            <Header
              variant="h1"
              counter={`(${totalCount})`}
              description={
                <span>
                  Automatic mode is the current search behavior optimized for best filter results.{' '}
                  <LinkComponent variant="primary" href="#">To change modes go to settings.</LinkComponent>
                </span>
              }
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    iconName="refresh"
                    onClick={fetchZones}
                    ariaLabel="Refresh hosted zones"
                  />
                  <Button
                    disabled={!selectedZone}
                    disabledReason={!selectedZone ? 'Select a hosted zone to view details.' : undefined}
                    onClick={() => selectedZone && router.push(`/hosted-zones/${selectedZone.id}/records`)}
                  >
                    View details
                  </Button>
                  <ButtonDropdown
                    disabled={!selectedZone}
                    disabledReason={!selectedZone ? 'Select a hosted zone to export.' : undefined}
                    items={[
                      { id: 'json', text: 'Export as JSON' },
                      { id: 'bind', text: 'Export as BIND zone file' },
                    ]}
                    onItemClick={({ detail }) => {
                      if (selectedZone) {
                        handleExport(selectedZone, detail.id as 'json' | 'bind');
                      }
                    }}
                  >
                    Export
                  </ButtonDropdown>
                  <Button
                    disabled={isReadOnly || !selectedZone}
                    disabledReason={isReadOnly ? 'Requires Admin permissions.' : !selectedZone ? 'Select a hosted zone to edit.' : undefined}
                    onClick={() => setEditingZone(selectedZone)}
                  >
                    Edit
                  </Button>
                  <Button
                    disabled={isReadOnly || !selectedZone}
                    disabledReason={isReadOnly ? 'Requires Admin permissions.' : !selectedZone ? 'Select a hosted zone to delete.' : undefined}
                    onClick={() => setDeletingZone(selectedZone)}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="primary"
                    disabled={isReadOnly}
                    disabledReason={isReadOnly ? 'Requires Admin permissions.' : undefined}
                    onClick={() => router.push('/hosted-zones/create')}
                  >
                    Create hosted zone
                  </Button>
                </SpaceBetween>
              }
            >
              Hosted zones
            </Header>
          }
          filter={
            <TextFilter
              filteringText={filterText}
              filteringPlaceholder="Filter records by property or value"
              onChange={({ detail }) => {
                setFilterText(detail.filteringText);
                setCurrentPage(1);
              }}
            />
          }
          pagination={
            <Pagination
              currentPageIndex={currentPage}
              pagesCount={pagesCount}
              onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
            />
          }
          preferences={
            <Button iconName="settings" variant="icon" ariaLabel="Preferences" />
          }
          empty={
            <Box textAlign="center" color="inherit">
              <SpaceBetween size="m">
                <b>No hosted zones</b>
                <Box variant="p" color="inherit">
                  There are no hosted zones created for this account.
                </Box>
                <Button
                  variant="primary"
                  disabled={isReadOnly}
                  disabledReason={isReadOnly ? 'Requires Admin permissions.' : undefined}
                  onClick={() => router.push('/hosted-zones/create')}
                >
                  Create hosted zone
                </Button>
              </SpaceBetween>
            </Box>
          }
        />
      </SpaceBetween>

      {/* Edit Modal (Edit mode only) */}
      {editingZone && (
        <HostedZoneModal
          visible={!!editingZone}
          zone={editingZone}
          onDismiss={() => setEditingZone(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingZone && (
        <DeleteConfirmModal
          visible={!!deletingZone}
          targetName={deletingZone.name}
          targetId={deletingZone.id}
          resourceType="hosted zone"
          onDismiss={() => setDeletingZone(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </ConsoleLayout>
  );
}
