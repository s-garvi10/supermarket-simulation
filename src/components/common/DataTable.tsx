import React from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getKey: (row: T) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns, rows, getKey, emptyMessage = 'No records found.', onRowClick
}: DataTableProps<T>) {
  const cellStyle = (align?: string): React.CSSProperties => ({
    padding: '12px 16px',
    textAlign: (align as React.CSSProperties['textAlign']) || 'left',
    fontSize: 13,
    color: 'var(--ink)',
    borderBottom: '1px solid var(--border)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)' }} role="table">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                scope="col"
                style={{
                  ...cellStyle(col.align),
                  fontSize: 11,
                  color: 'var(--ink-muted)',
                  fontWeight: 500,
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: 'transparent',
                  padding: '10px 16px',
                  textAlign: (col.align as React.CSSProperties['textAlign']) || 'left',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ ...cellStyle(), color: 'var(--ink-muted)', textAlign: 'center', padding: '32px 16px' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map(row => (
              <tr
                key={getKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                onMouseEnter={onRowClick ? e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg)'; } : undefined}
                onMouseLeave={onRowClick ? e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; } : undefined}
              >
                {columns.map(col => (
                  <td key={col.key} style={cellStyle(col.align)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
