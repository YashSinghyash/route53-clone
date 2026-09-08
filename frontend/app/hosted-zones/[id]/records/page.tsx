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
import Modal from '@cloudscape-design/components/modal';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Alert from '@cloudscape-design/components/alert';
import FileUpload from '@cloudscape-design/components/file-upload';
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

  // Bulk Delete Modal state
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState<boolean>(false);
  const [bulkConfirmText, setBulkConfirmText] = useState<string>('');
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  // Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importFiles, setImportFiles] = useState<File[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);

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

  const handleBulkDeleteConfirm = async () => {
    if (bulkConfirmText !== 'DELETE' || selectedItems.length < 2) return;
    setIsBulkDeleting(true);
    try {
      const recordIds = selectedItems.map((r) => r.id);
      const res = await apiFetch<{ deleted_count: number }>('/api/records/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ record_ids: recordIds }),
      });
      addNotification({
        type: 'success',
        content: `Successfully deleted ${res.deleted_count ?? recordIds.length} DNS records.`,
      });
      setSelectedItems([]);
      setIsBulkDeleteModalOpen(false);
      setBulkConfirmText('');
      fetchRecords();
      fetchZone();
    } catch (err: unknown) {
      if (err instanceof Error) {
        addNotification({
          type: 'error',
          content: err.message || 'Failed to bulk delete records.',
        });
      }
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleImportSubmit = async () => {
    if (importFiles.length === 0 || !zoneId) return;
    setIsImporting(true);
    setImportError(null);
    try {
      const file = importFiles[0];
      const formData = new FormData();
      formData.append('file', file);

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/hosted-zones/${zoneId}/import`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        let msg = `Import failed with status ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson.detail) {
            msg = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
          }
        } catch {}
        throw new Error(msg);
      }

      const data: { imported_count: number; skipped: Array<{ line: string; reason: string }> } = await res.json();

      setIsImportModalOpen(false);
      setImportFiles([]);

      addNotification({
        type: 'success',
        content: (
          <div>
            <div>Imported {data.imported_count} record(s) into {zone?.name || 'hosted zone'}.</div>
            {data.skipped && data.skipped.length > 0 && (
              <details style={{ marginTop: '8px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                  {data.skipped.length} line(s) skipped (click to view details)
                </summary>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', fontSize: '12px' }}>
                  {data.skipped.map((s, idx) => (
                    <li key={idx}>
                      <code>{s.line}</code> — {s.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ),
      });

      fetchRecords();
      fetchZone();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setImportError(err.message || 'Failed to import zone file.');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const isSingleSelected = selectedItems.length === 1;
  const selectedRecord = isSingleSelected ? selectedItems[0] : null;

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
          selectionType="multi"
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
                  {selectedItems.length >= 2 && (
                    <Button
                      onClick={() => setIsBulkDeleteModalOpen(true)}
                    >
                      Delete selected ({selectedItems.length})
                    </Button>
                  )}
                  <Button
                    disabled={!isSingleSelected}
                    onClick={() => setEditingRecord(selectedRecord)}
                  >
                    Edit record
                  </Button>
                  <Button
                    disabled={!isSingleSelected}
                    onClick={() => setDeletingRecord(selectedRecord)}
                  >
                    Delete record
                  </Button>
                  <Button
                    disabled={!zone}
                    onClick={() => setIsImportModalOpen(true)}
                  >
                    Import records
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

      {/* Delete Single Record Confirmation Modal */}
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

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <Modal
          visible={isBulkDeleteModalOpen}
          onDismiss={() => {
            setIsBulkDeleteModalOpen(false);
            setBulkConfirmText('');
          }}
          header={`Delete ${selectedItems.length} selected records`}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  onClick={() => {
                    setIsBulkDeleteModalOpen(false);
                    setBulkConfirmText('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={bulkConfirmText !== 'DELETE' || isBulkDeleting}
                  loading={isBulkDeleting}
                  onClick={handleBulkDeleteConfirm}
                >
                  Confirm bulk delete
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="m">
            <Box variant="p">
              Are you sure you want to permanently delete <b>{selectedItems.length}</b> records? This action cannot be undone.
            </Box>
            <Alert type="warning">
              To confirm deletion, type <b>DELETE</b> in the box below.
            </Alert>
            <FormField label={`Type DELETE to confirm removing ${selectedItems.length} records`}>
              <Input
                value={bulkConfirmText}
                onChange={({ detail }) => setBulkConfirmText(detail.value)}
                placeholder="DELETE"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      )}

      {/* Import Records Modal */}
      {isImportModalOpen && (
        <Modal
          visible={isImportModalOpen}
          onDismiss={() => {
            setIsImportModalOpen(false);
            setImportFiles([]);
            setImportError(null);
          }}
          header={`Import records into ${zone ? zone.name : 'hosted zone'}`}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="link"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportFiles([]);
                    setImportError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  disabled={importFiles.length === 0 || isImporting}
                  loading={isImporting}
                  onClick={handleImportSubmit}
                >
                  Import records
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="m">
            <Box variant="p">
              Upload a BIND zone file (<code>.zone</code> or <code>.txt</code>) to import DNS records into <b>{zone?.name}</b>.
            </Box>
            {importError && (
              <Alert type="error" dismissible onDismiss={() => setImportError(null)}>
                {importError}
              </Alert>
            )}
            <FormField label="Zone file">
              <FileUpload
                onChange={({ detail }) => setImportFiles(detail.value)}
                value={importFiles}
                accept=".zone,.txt"
                constraintText="Accepts .zone or .txt BIND zone files."
                showFileLastModified
                showFileSize
                i18nStrings={{
                  uploadButtonText: (e) => (e ? 'Choose files' : 'Choose file'),
                  dropzoneText: (e) => (e ? 'Drop files to upload' : 'Drop file to upload'),
                  removeFileAriaLabel: (e) => `Remove file ${e + 1}`,
                  limitShowFewer: 'Show fewer files',
                  limitShowMore: 'Show more files',
                }}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      )}
    </ConsoleLayout>
  );
}

