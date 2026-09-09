import React from 'react'
import { Skeleton } from './Skeleton'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  width?: string
  className?: string
  hidden?: boolean // hide on mobile
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyState?: React.ReactNode
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
}

export function Table<T>({
  columns,
  data,
  loading = false,
  emptyState,
  rowKey,
  onRowClick,
}: TableProps<T>) {
  const visibleColumns = columns.filter(c => !c.hidden)

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-sand">
              {visibleColumns.map(col => (
                <th
                  key={col.key}
                  className="text-left text-[11.5px] font-semibold text-slate pb-3 pr-4 first:pl-0"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-sand">
                {visibleColumns.map(col => (
                  <td key={col.key} className="py-4 pr-4 first:pl-0">
                    <Skeleton height={14} className={col.width ?? 'w-full'} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!loading && data.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="w-full border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-sand">
            {visibleColumns.map(col => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                className="text-left text-[11.5px] font-semibold text-slate pb-3 pr-4 first:pl-0 uppercase tracking-wide"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={[
                'border-b border-sand last:border-0 group',
                onRowClick ? 'cursor-pointer hover:bg-ivory/60 transition-colors' : '',
              ].join(' ')}
            >
              {visibleColumns.map(col => (
                <td
                  key={col.key}
                  className={[
                    'py-3.5 pr-4 first:pl-0 text-[13.5px]',
                    col.className ?? '',
                  ].join(' ')}
                >
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
