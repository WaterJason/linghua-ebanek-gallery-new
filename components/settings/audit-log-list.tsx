"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "@/components/ui/use-toast"
import {
  SearchIcon,
  FileIcon,
  UserIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  XIcon,
  DownloadIcon,
  UploadIcon,
  LogInIcon,
  LogOutIcon,
  RefreshCwIcon
} from "lucide-react"
import { SimplePagination } from "@/components/ui/simple-pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { AuditLogFilter } from "@/components/settings/audit-log-filter"
import { AuditLogDetail } from "@/components/settings/audit-log-detail"
import { getAuditLogs, getEntityAuditLogs } from "@/lib/actions/audit-actions"
import { useSearchParams } from "next/navigation"

// 审计日志类型
interface AuditLog {
  id: number
  userId: string | null
  userName?: string
  action: string
  entityType: string
  entityId: string
  oldValues: string | null
  newValues: string | null
  ipAddress: string | null
  userAgent: string | null
  timestamp: Date
  details: string | null
}

// 审计日志查询参数
interface AuditLogQueryParams {
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// 获取操作图标
const getActionIcon = (action: string) => {
  switch (action) {
    case "create":
      return <PlusIcon className="h-4 w-4 text-green-500" />;
    case "update":
      return <PencilIcon className="h-4 w-4 text-blue-500" />;
    case "delete":
      return <TrashIcon className="h-4 w-4 text-red-500" />;
    case "view":
      return <EyeIcon className="h-4 w-4 text-gray-500" />;
    case "export":
      return <DownloadIcon className="h-4 w-4 text-purple-500" />;
    case "import":
      return <UploadIcon className="h-4 w-4 text-orange-500" />;
    case "login":
      return <LogInIcon className="h-4 w-4 text-green-500" />;
    case "logout":
      return <LogOutIcon className="h-4 w-4 text-gray-500" />;
    case "approve":
      return <CheckIcon className="h-4 w-4 text-green-500" />;
    case "reject":
      return <XIcon className="h-4 w-4 text-red-500" />;
    default:
      return <FileIcon className="h-4 w-4 text-gray-500" />;
  }
};

// 获取实体类型标签
const getEntityTypeLabel = (entityType: string) => {
  switch (entityType) {
    case "product":
      return "产品";
    case "order":
      return "订单";
    case "customer":
      return "客户";
    case "supplier":
      return "供应商";
    case "inventory":
      return "库存";
    case "user":
      return "用户";
    case "system":
      return "系统";
    default:
      return entityType;
  }
};

// 获取操作标签
const getActionLabel = (action: string) => {
  switch (action) {
    case "create":
      return "创建";
    case "update":
      return "更新";
    case "delete":
      return "删除";
    case "view":
      return "查看";
    case "export":
      return "导出";
    case "import":
      return "导入";
    case "login":
      return "登录";
    case "logout":
      return "登出";
    case "approve":
      return "审批";
    case "reject":
      return "拒绝";
    default:
      return action;
  }
};

export function AuditLogList() {
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // 过滤条件
  const [filters, setFilters] = useState({
    action: "",
    entityType: searchParams.get("entityType") || "",
    entityId: searchParams.get("entityId") || "",
    userId: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
  });

  // 加载审计日志
  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      // 构建查询参数
      const queryParams: AuditLogQueryParams = {
        limit: 50,
      };

      if (filters.action) {
        queryParams.action = filters.action;
      }

      if (filters.entityType) {
        queryParams.entityType = filters.entityType;
      }

      if (filters.entityId) {
        queryParams.entityId = filters.entityId;
      }

      if (filters.userId) {
        queryParams.userId = filters.userId;
      }

      if (filters.startDate) {
        queryParams.startDate = format(filters.startDate, "yyyy-MM-dd");
      }

      if (filters.endDate) {
        queryParams.endDate = format(filters.endDate, "yyyy-MM-dd");
      }

      // 获取审计日志
      const result = await getAuditLogs(queryParams);

      setLogs(result.auditLogs);
      setFilteredLogs(result.auditLogs);
      setTotalCount(result.total);
      setTotalPages(Math.ceil(result.total / 10));
    } catch (error) {
      console.error("Error loading audit logs:", error);
      toast({
        title: "加载失败",
        description: "无法加载审计日志，请稍后再试",
        variant: "destructive",
      });
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 重置过滤器
  const resetFilters = () => {
    setFilters({
      action: "",
      entityType: "",
      entityId: "",
      userId: "",
      startDate: null,
      endDate: null,
    });
  };

  // 当过滤条件变化时重新加载数据
  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  // 查看日志详情
  const handleViewLogDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetailDialog(true);
  };

  // 表格列定义
  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "timestamp",
      header: "时间",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          {format(new Date(row.original.timestamp), "yyyy-MM-dd HH:mm:ss")}
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: "操作",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          {getActionIcon(row.original.action)}
          <span>{getActionLabel(row.original.action)}</span>
        </div>
      ),
    },
    {
      accessorKey: "entityType",
      header: "实体类型",
      cell: ({ row }) => (
        <Badge variant="outline">
          {getEntityTypeLabel(row.original.entityType)}
        </Badge>
      ),
    },
    {
      accessorKey: "entityId",
      header: "实体ID",
      cell: ({ row }) => (
        <div className="font-mono text-xs truncate max-w-[100px]">
          {row.original.entityId}
        </div>
      ),
    },
    {
      accessorKey: "userName",
      header: "操作人",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <UserIcon className="h-4 w-4 text-gray-500" />
          <span>{row.original.userName || "系统"}</span>
        </div>
      ),
    },
    {
      accessorKey: "details",
      header: "详情",
      cell: ({ row }) => (
        <div className="truncate max-w-[200px]">
          {row.original.details || "-"}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleViewLogDetail(row.original)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  // 分页显示的日志
  const paginatedLogs = filteredLogs.slice((page - 1) * 10, page * 10);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>审计日志</CardTitle>
              <CardDescription>查看系统操作日志和审计记录</CardDescription>
            </div>
            <Badge variant="outline">
              共 {totalCount} 条记录
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <AuditLogFilter
                filters={filters}
                setFilters={setFilters}
                resetFilters={resetFilters}
              />
              <Button variant="outline" onClick={loadAuditLogs}>
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                刷新
              </Button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={paginatedLogs}
            isLoading={isLoading}
            noResultsMessage="暂无审计日志"
          />

          {totalPages > 1 && (
            <div className="mt-4">
              <SimplePagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 审计日志详情对话框 */}
      {selectedLog && (
        <AuditLogDetail
          log={selectedLog}
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
        />
      )}
    </>
  )
}
