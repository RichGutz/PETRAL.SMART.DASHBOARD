import React, { useMemo, useState } from "react"
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, Search } from "lucide-react"

import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Input } from "../ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"

interface DataTableProps {
  data: any // Hierarchical data from backend
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})

  // 1. Flatten Data
  const flatData = useMemo(() => {
    if (!data || !data.aggregated_data) return []

    const result: any[] = []

    Object.entries(data.aggregated_data).forEach(([client, routes]: any) => {
      Object.entries(routes).forEach(([route, vessels]: any) => {
        Object.entries(vessels).forEach(([vessel, months]: any) => {
          const row: any = { client, route, vessel, id: `${client}-${route}-${vessel}` }
          Object.entries(months).forEach(([month, metrics]: any) => {
            row[`${month}_net_income`] = metrics.net_income
            row[`${month}_bunker`] = metrics.total_bunker_costs
            row[`${month}_voyage_result`] = metrics.voyage_result
            row[`${month}_pcm`] = metrics.pcm_projected
          })
          result.push(row)
        })
      })
    })

    return result
  }, [data])

  // 2. Generate Columns Dynamically
  const columns = useMemo<ColumnDef<any>[]>(() => {
    if (!data || !data.aggregated_data) return []

    let months: string[] = []
    try {
      const firstClient = Object.values(data.aggregated_data)[0] as any
      const firstRoute = Object.values(firstClient)[0] as any
      const firstVessel = Object.values(firstRoute)[0] as any
      months = Object.keys(firstVessel)
    } catch (e) {
      months = []
    }

    const cols: ColumnDef<any>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              (table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")) as any
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "client",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Cliente
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="lowercase font-medium">{row.getValue("client")}</div>,
      },
      {
        accessorKey: "route",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Ruta
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div>{row.getValue("route")}</div>,
      },
      {
        accessorKey: "vessel",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Buque
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <div className="capitalize">{row.getValue("vessel")}</div>,
      },
    ]

    months.forEach((month) => {
      cols.push({
        id: `${month}_group`,
        header: month,
        columns: [
          {
            accessorKey: `${month}_net_income`,
            header: () => <div className="text-right">Ingresos</div>,
            cell: ({ row }: any) => {
              const val = row.getValue(`${month}_net_income`)
              const amount = parseFloat((val as any) || "0")
              if (!val) return <div className="text-right font-medium">-</div>
              const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0
              }).format(amount)
              return <div className="text-right font-medium">{formatted}</div>
            },
          },
          {
            accessorKey: `${month}_voyage_result`,
            header: () => <div className="text-right">Voyage Result</div>,
            cell: ({ row }: any) => {
              const val = row.getValue(`${month}_voyage_result`)
              if (!val) return <div className="text-right font-medium">-</div>
              const amount = parseFloat((val as any) || "0")
              const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0
              }).format(amount)
              const colorClass = amount < 0 ? "text-red-600" : "text-teal-600"
              return <div className={`text-right font-bold ${colorClass}`}>{formatted}</div>
            },
          },
        ]
      } as any)
    })

    return cols
  }, [data])

  const table = useReactTable({
    data: flatData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Filtrar por buque..."
            value={(table.getColumn("vessel")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("vessel")?.setFilterValue(event.target.value)
            }
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          {/* @ts-ignore */}
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columnas <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-slate-50/50 transition-colors"
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
                  colSpan={columns.length}
                  className="h-24 text-center text-slate-500"
                >
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-slate-500">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} fila(s) seleccionadas.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
