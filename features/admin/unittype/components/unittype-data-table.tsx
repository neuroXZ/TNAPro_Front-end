import { Table as TanStackTable, flexRender } from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UnitType } from "./columns"
import { useTranslations } from "next-intl"

interface UnitTypeDataTableProps {
  table: TanStackTable<UnitType>
  columnsLength: number
  onRowClick?: (unitType: UnitType) => void
}

export function UnitTypeDataTable({ table, columnsLength, onRowClick }: UnitTypeDataTableProps) {
  const t = useTranslations('AdminUnitTypePage')
  const tc = useTranslations('Common')

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader >
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => onRowClick?.(row.original)}
                className="cursor-pointer"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columnsLength}
                className="h-24 text-center"
              >
                {tc('noResultsFound', { entity: t('entityNamePlural') })}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
