import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { TableColumn } from '../../types';

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  keyField?: keyof T | ((row: T) => string);
  searchPlaceholder?: string;
  searchable?: boolean;
  pageSizeDefault?: number;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
  emptyTitle?: string;
  emptySubtitle?: string;
  onAddClick?: () => void;
  addLabel?: string;
  toolbarExtra?: React.ReactNode;
  rowBorderAccent?: (row: T) => string | undefined;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyField = 'id',
  searchPlaceholder = 'Search records...',
  searchable = true,
  pageSizeDefault = 10,
  onRowClick,
  actions,
  emptyTitle = 'No records found',
  emptySubtitle = 'Try modifying your search or add a new record.',
  onAddClick,
  addLabel = 'Add Record',
  toolbarExtra,
  rowBorderAccent
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeDefault);

  // 1. Search Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter(row => {
      return Object.values(row).some(val => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm]);

  // 2. Sorting
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // 3. Pagination
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (colId: string) => {
    if (sortColumn === colId) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
      }
    } else {
      setSortColumn(colId);
      setSortDirection('asc');
    }
  };

  const getKey = (row: T, idx: number): string => {
    if (typeof keyField === 'function') return keyField(row);
    if (row[keyField]) return String(row[keyField]);
    return `row-${idx}`;
  };

  return (
    <div className="card table-container-card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Table Toolbar */}
      {(searchable || toolbarExtra) && (
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border-subtle)',
          backgroundColor: 'var(--color-bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {searchable && (
            <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="form-input"
                style={{ paddingLeft: '32px', fontSize: '13px', padding: '6px 12px 6px 32px' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            {toolbarExtra}
          </div>
        </div>
      )}

      {/* Table Data */}
      <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 310px)', minHeight: '260px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--color-bg-subtle)' }}>
            <tr style={{ borderBottom: '1px solid var(--color-border-default)' }}>
              {columns.map((col, i) => {
                const colKey = col.id || (typeof col.accessor === 'string' ? col.accessor : `col-${i}`);
                const isSortable = col.sortable !== false && typeof col.accessor === 'string';

                return (
                  <th
                    key={colKey}
                    onClick={() => isSortable && handleSort(colKey)}
                    style={{
                      padding: '10px 14px',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      fontSize: '11px',
                      letterSpacing: '0.04em',
                      width: col.width,
                      textAlign: col.align || 'left',
                      cursor: isSortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      whiteSpace: 'nowrap'
                    }}
                    className={col.className}
                  >
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start'
                    }}>
                      <span>{col.header}</span>
                      {isSortable && (
                        <span style={{ color: sortColumn === colKey ? 'var(--color-brand-primary)' : 'var(--color-text-disabled)' }}>
                          {sortColumn === colKey ? (
                            sortDirection === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                          ) : (
                            <ChevronsUpDown size={12} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              {actions && (
                <th style={{
                  padding: '10px 14px',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  fontSize: '11px',
                  letterSpacing: '0.04em',
                  width: '100px',
                  textAlign: 'right'
                }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => {
                const accent = rowBorderAccent ? rowBorderAccent(row) : undefined;

                return (
                  <tr
                    key={getKey(row, rowIdx)}
                    onClick={() => onRowClick && onRowClick(row)}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      borderLeft: accent ? `4px solid ${accent}` : '4px solid transparent',
                      cursor: onRowClick ? 'pointer' : 'default',
                      backgroundColor: rowIdx % 2 === 0 ? 'var(--color-bg-surface)' : 'rgba(248, 250, 252, 0.6)',
                      transition: 'background-color 0.1s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = rowIdx % 2 === 0 ? 'var(--color-bg-surface)' : 'rgba(248, 250, 252, 0.6)'}
                  >
                    {columns.map((col, colIdx) => {
                      const cellKey = col.id || (typeof col.accessor === 'string' ? col.accessor : `cell-${colIdx}`);
                      let cellContent: React.ReactNode = null;

                      if (col.render) {
                        cellContent = col.render(row);
                      } else if (col.accessor) {
                        cellContent = row[col.accessor];
                      }

                      return (
                        <td
                          key={cellKey}
                          style={{
                            padding: '10px 14px',
                            color: 'var(--color-text-primary)',
                            textAlign: col.align || 'left',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                    {actions && (
                      <td
                        style={{
                          padding: '8px 14px',
                          textAlign: 'right',
                          whiteSpace: 'nowrap'
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                      <Inbox size={22} />
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{emptyTitle}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', maxWidth: '360px' }}>{emptySubtitle}</div>
                    {onAddClick && (
                      <button
                        onClick={onAddClick}
                        className="btn btn-primary btn-sm"
                        style={{ marginTop: '16px' }}
                      >
                        + {addLabel}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--color-border-subtle)',
        backgroundColor: 'var(--color-bg-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--color-text-secondary)',
        marginTop: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>
            Showing <strong>{totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, totalItems)}</strong> of <strong>{totalItems}</strong> entries
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="form-select"
              style={{ width: '60px', padding: '2px 4px', fontSize: '12px' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            className="btn btn-secondary btn-sm btn-icon-only"
            title="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>
          <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages}
            className="btn btn-secondary btn-sm btn-icon-only"
            title="Next Page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
