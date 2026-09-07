'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Table from '@cloudscape-design/components/table';
import Header from '@cloudscape-design/components/header';
import TextFilter from '@cloudscape-design/components/text-filter';
import Select, { SelectProps } from '@cloudscape-design/components/select';
import Pagination from '@cloudscape-design/components/pagination';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Box from '@cloudscape-design/components/box';
import Grid from '@cloudscape-design/components/grid';
import ConsoleLayout from '@/components/ConsoleLayout';
import RecordModal from '@/components/RecordModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { DnsRecord, HostedZone, PaginatedResponse, apiFetch } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';

const TYPE_FILTER_OPTIONS: SelectProps.Option[] = [
  { label: 'All record types', value: '' },
  { label: 'A', value: 'A' },
  { label: 'AAAA', value: 'AAAA' },
  { label: 'CNAME', value: 'CNAME' },
  { label: 'TXT', value: 'TXT' },
  { label: 'MX', value: 'MX' },
  { label: 'NS', value: 'NS' },
  { label: 'PTR', value: 'PTR' },
  { label: 'SRV', value: 'SRV' },
  { label: 'CAA', value: 'CAA' },
];

export default function ZoneRecordsPage() {
  const params = useParams();
  const zoneId = params?.id as string;

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedItems, setSelectedItems] = useState<DnsRecord[]>([]);

  // Filtering & Pagination
  const [filterText, setFilterText] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<SelectProps.Option>(TYPE_FILTER_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<DnsRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<DnsRecord | null>(null);

  const { addNotification } = useNotification();

  const fetchZone = useCallback(async () => {
    if (!zoneId) return;
    try {
      const data = await apiFetch<HostedZone>(`/api/hosted-zones/${zoneId}`);
      setZone(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        addNotification({
          type: 'error',
          content: err.message || 'Failed to fetch hosted zone details.',
        });
      }
    }
  }, [zoneId, addNotification]);

  const fetchRecords = useCallback(async () => {
    if (!zoneId) return;
    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      if (filterText) {
        searchParams.append('search', filterText);
      }
      if (selectedTypeFilter.value) {
        searchParams.append('type', selectedTypeFilter.value);
      }
      const data = await apiFetch<PaginatedResponse<DnsRecord>>(
        `/api/hosted-zones/${zoneId}/records?${searchParams.toString()}`
      );
      setRecords(data.items);
      setTotalCount(data.count);
    } catch (err: unknown) {
      if (err instanceof Error) {
        addNotification({
          type: 'error',
          content: err.message || 'Failed to fetch DNS records.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [zoneId, currentPage, filterText, selectedTypeFilter, addNotification]);

  useEffect(() => {
    fetchZone();
  }, [fetchZone]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleRecordSuccess = (rec: DnsRecord, isEdit: boolean) => {
    setIsCreateModalOpen(false);
    setEditingRecord(null);
    setSelectedItems([]);
    addNotification({
      type: 'success',
      content: isEdit
        ? `Successfully updated DNS record ${rec.name}.`
        : `Successfully created DNS record ${rec.name}.`,
    });
    fetchRecords();
    fetchZone();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRecord) return;
    const targetName = deletingRecord.name;
    await apiFetch(`/api/records/${deletingRecord.id}`, {
      method: 'DELETE',
    });
    setSelectedItems([]);
    setDeletingRecord(null);
    addNotification({
      type: 'success',
      content: `Successfully deleted DNS record ${targetName}.`,
    });
    fetchRecords();
    fetchZone();
  };

  const selectedRecord = selectedItems[0] || null;

  const pagesCount = Math.ceil(totalCount / pageSize) || 1;

  return (
    <ConsoleLayout
      breadcrumbs={[
        { text: 'Route 53', href: '/hosted-zones' },
        { text: 'Hosted zones', href: '/hosted-zones' },
        { text: zone ? zone.name : 'Records', href: `/hosted-zones/${zoneId}/records` },
      ]}
    >
      <SpaceBetween size="l">
        <Table
          columnDefinitions={[
            {
              id: 'name',
              header: 'Record name',
              cell: (item) => item.name,
              sortingField: 'name',
              isRowHeader: true,
            },
            {
              id: 'type',
              header: 'Type',
              cell: (item) => item.type,
            },
            {
              id: 'routing_policy',
              header: 'Routing policy',
              cell: () => 'Simple',
            },
            {
              id: 'ttl',
              header: 'TTL (Seconds)',
              cell: (item) => item.ttl,
            },
            {
              id: 'value',
              header: 'Value / Route traffic to',
              cell: (item) => item.value,
            },
          ]}
          items={records}
          loading={isLoading}
          loadingText="Loading DNS records..."
          selectionType="single"
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
          trackBy="id"
          header={
            <Header
              variant="h1"
              counter={`(${totalCount})`}
              description={zone ? `Hosted zone ID: ${zone.id} | ${zone.private_zone ? 'Private' : 'Public'} hosted zone` : undefined}
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    disabled={!selectedRecord}
                    onClick={() => setEditingRecord(selectedRecord)}
                  >
                    Edit record
                  </Button>
                  <Button
                    disabled={!selectedRecord}
                    onClick={() => setDeletingRecord(selectedRecord)}
                  >
                    Delete record
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!zone}
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    Create record
                  </Button>
                </SpaceBetween>
              }
            >
              Records for {zone ? zone.name : 'Hosted zone'}
            </Header>
          }
          filter={
            <Grid gridDefinition={[{ colspan: 8 }, { colspan: 4 }]}>
              <TextFilter
                filteringText={filterText}
                filteringPlaceholder="Find records by name"
                onChange={({ detail }) => {
                  setFilterText(detail.filteringText);
                  setCurrentPage(1);
                }}
              />
              <Select
                selectedOption={selectedTypeFilter}
                onChange={({ detail }) => {
                  setSelectedTypeFilter(detail.selectedOption);
                  setCurrentPage(1);
                }}
                options={TYPE_FILTER_OPTIONS}
              />
            </Grid>
          }
          pagination={
            <Pagination
              currentPageIndex={currentPage}
              pagesCount={pagesCount}
              onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
            />
          }
          empty={
            <Box textAlign="center" color="inherit">
              <SpaceBetween size="m">
                <b>No DNS records found.</b>
                <Box variant="p" color="inherit">
                  Create a record to route traffic for your domain.
                </Box>
                {zone && (
                  <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                    Create record
                  </Button>
                )}
              </SpaceBetween>
            </Box>
          }
        />
      </SpaceBetween>

      {/* Create / Edit Record Modal */}
      {zone && (isCreateModalOpen || editingRecord) && (
        <RecordModal
          visible={isCreateModalOpen || !!editingRecord}
          zone={zone}
          record={editingRecord}
          onDismiss={() => {
            setIsCreateModalOpen(false);
            setEditingRecord(null);
          }}
          onSuccess={handleRecordSuccess}
        />
      )}

      {/* Delete Record Confirmation Modal */}
      {deletingRecord && (
        <DeleteConfirmModal
          visible={!!deletingRecord}
          targetName={deletingRecord.name}
          targetId={deletingRecord.id}
          resourceType="DNS record"
          onDismiss={() => setDeletingRecord(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </ConsoleLayout>
  );
}
