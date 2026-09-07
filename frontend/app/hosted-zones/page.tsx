'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Table from '@cloudscape-design/components/table';
import Header from '@cloudscape-design/components/header';
import TextFilter from '@cloudscape-design/components/text-filter';
import Pagination from '@cloudscape-design/components/pagination';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Box from '@cloudscape-design/components/box';
import LinkComponent from '@cloudscape-design/components/link';
import ConsoleLayout from '@/components/ConsoleLayout';
import HostedZoneModal from '@/components/HostedZoneModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { HostedZone, PaginatedResponse, apiFetch } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';

export default function HostedZonesPage() {
  const router = useRouter();
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedItems, setSelectedItems] = useState<HostedZone[]>([]);
  
  // Filtering & Pagination
  const [filterText, setFilterText] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingZone, setEditingZone] = useState<HostedZone | null>(null);
  const [deletingZone, setDeletingZone] = useState<HostedZone | null>(null);

  const { addNotification } = useNotification();

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

  const handleCreateSuccess = (zone: HostedZone, isEdit: boolean) => {
    setIsCreateModalOpen(false);
    setEditingZone(null);
    setSelectedItems([]);
    addNotification({
      type: 'success',
      content: isEdit
        ? `Successfully updated hosted zone ${zone.name}.`
        : `Successfully created hosted zone ${zone.name}.`,
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

  const selectedZone = selectedItems[0] || null;
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
                    onClick={() => selectedZone && router.push(`/hosted-zones/${selectedZone.id}/records`)}
                  >
                    View details
                  </Button>
                  <Button
                    disabled={!selectedZone}
                    onClick={() => setEditingZone(selectedZone)}
                  >
                    Edit
                  </Button>
                  <Button
                    disabled={!selectedZone}
                    onClick={() => setDeletingZone(selectedZone)}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setIsCreateModalOpen(true)}
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
                <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                  Create hosted zone
                </Button>
              </SpaceBetween>
            </Box>
          }
        />
      </SpaceBetween>

      {/* Create / Edit Modal */}
      {(isCreateModalOpen || editingZone) && (
        <HostedZoneModal
          visible={isCreateModalOpen || !!editingZone}
          zone={editingZone}
          onDismiss={() => {
            setIsCreateModalOpen(false);
            setEditingZone(null);
          }}
          onSuccess={handleCreateSuccess}
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
