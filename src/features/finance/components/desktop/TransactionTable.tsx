"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Input } from "@/src/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import { formatCurrency } from "@/src/lib/utils";
import { Transaction, TransactionSort, TransactionPagination } from '../../hooks/useTransactionData';

interface TransactionTableProps {
  transactions: Transaction[];
  total: number;
  isLoading?: boolean;
  error?: string | null;
  sort?: TransactionSort;
  pagination?: TransactionPagination;
  onCreateTransaction?: () => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transaction: Transaction) => void;
  onFilter?: () => void;
  onSort?: (sort: TransactionSort) => void;
  onPagination?: (pagination: TransactionPagination) => void;
  onRowClick?: (transaction: Transaction) => void;
}

/**
 * 桌面端交易表格组件
 */
export default function TransactionTable({
  transactions,
  total,
  isLoading = false,
  error = null,
  sort = { field: 'transactionDate', direction: 'desc' },
  pagination = { page: 1, pageSize: 20 },
  onCreateTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onFilter,
  onSort,
  onPagination,
  onRowClick,
}: TransactionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: sort.field, desc: sort.direction === 'desc' }
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // 处理排序变化
  const handleSortingChange = (updatedSorting: SortingState) => {
    setSorting(updatedSorting);
    if (updatedSorting.length > 0 && onSort) {
      const { id, desc } = updatedSorting[0];
      onSort({
        field: id,
        direction: desc ? 'desc' : 'asc'
      });
    }
  };

  // 处理分页变化
  const handlePaginationChange = (updatedPagination: any) => {
    if (onPagination) {
      onPagination({
        page: updatedPagination.pageIndex + 1,
        pageSize: updatedPagination.pageSize
      });
    }
  };

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: "transactionDate",
      header: ({ column }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            日期
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const date = row.getValue("transactionDate");
        return date ? format(new Date(date as string), 'yyyy-MM-dd', { locale: zhCN }) : '-';
      },
    },
    {
      accessorKey: "type",
      header: "类型",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <Badge variant={
            type === 'income' ? "success" :
            type === 'expense' ? "destructive" :
            "default"
          }>
            {type === 'income' ? '收入' :
             type === 'expense' ? '支出' :
             type === 'transfer' ? '转账' : type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "category.name",
      header: "分类",
      cell: ({ row }) => {
        const category = row.original.category;
        return category?.name || '-';
      },
    },
    {
      accessorKey: "account.name",
      header: "账户",
      cell: ({ row }) => {
        const account = row.original.account;
        return account?.name || '-';
      },
    },
    {
      accessorKey: "counterparty",
      header: "交易对象",
      cell: ({ row }) => row.getValue("counterparty") || "-",
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            金额
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const type = row.getValue("type") as string;

        return (
          <div className={`text-right font-medium ${
            type === 'income' ? 'text-green-600' :
            type === 'expense' ? 'text-red-600' :
            'text-blue-600'
          }`}>
            {type === 'expense' ? '-' : type === 'income' ? '+' : ''}
            {formatCurrency(amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "notes",
      header: "备注",
      cell: ({ row }) => {
        const notes = row.getValue("notes") as string;
        return notes ? (
          <div className="max-w-[200px] truncate" title={notes}>
            {notes}
          </div>
        ) : "-";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEditTransaction && onEditTransaction(transaction)}>
                编辑交易
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDeleteTransaction && onDeleteTransaction(transaction)}
              >
                删除交易
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: transactions,
    columns,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: handlePaginationChange,
    manualPagination: true,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.pageSize,
      },
    },
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-destructive">
        <p>{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="搜索交易..."
            value={(table.getColumn("counterparty")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("counterparty")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          {onFilter && (
            <Button variant="outline" onClick={onFilter}>
              <Filter className="mr-2 h-4 w-4" />
              筛选
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                显示列 <ChevronDown className="ml-2 h-4 w-4" />
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
                      {column.id === "transactionDate" ? "日期" :
                       column.id === "type" ? "类型" :
                       column.id === "category.name" ? "分类" :
                       column.id === "account.name" ? "账户" :
                       column.id === "counterparty" ? "交易对象" :
                       column.id === "amount" ? "金额" :
                       column.id === "notes" ? "备注" :
                       column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {onCreateTransaction && (
          <Button onClick={onCreateTransaction}>
            <Plus className="mr-2 h-4 w-4" /> 添加交易
          </Button>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
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
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  加载中...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick && onRowClick(row.original)}
                  className={onRowClick ? "cursor-pointer hover:bg-muted" : ""}
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
                  className="h-24 text-center"
                >
                  暂无交易数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          共 {total} 条记录
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <>，已选择 {table.getFilteredSelectedRowModel().rows.length} 项</>
          )}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
}