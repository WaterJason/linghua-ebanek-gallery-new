"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "@/components/ui/use-toast"
import { 
  SearchIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  AlertCircleIcon,
  EyeIcon
} from "lucide-react"
import { SimplePagination } from "@/components/ui/simple-pagination"
import { getWorkflowInstances } from "@/lib/actions/workflow-actions"
import { format } from "date-fns"

// 工作流实例类型
interface WorkflowInstance {
  id: string
  workflowId: number
  workflow: {
    id: number
    name: string
    entityType: string
  }
  entityId: string
  entityType: string
  status: "pending" | "approved" | "rejected" | "canceled"
  initiatedBy: string
  initiatorName?: string
  currentStepNumber: number
  notes?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  approvals: WorkflowApproval[]
}

// 工作流审批类型
interface WorkflowApproval {
  id: string
  workflowInstanceId: string
  workflowStepId: number
  workflowStep: {
    id: number
    name: string
    stepNumber: number
  }
  approverId: string
  approverName?: string
  status: "pending" | "approved" | "rejected"
  comments?: string
  actionDate?: Date
  createdAt: Date
  updatedAt: Date
}

// 获取状态标签
const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 gap-1">
          <ClockIcon className="h-3.5 w-3.5" />
          <span>审批中</span>
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircleIcon className="h-3.5 w-3.5" />
          <span>已通过</span>
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircleIcon className="h-3.5 w-3.5" />
          <span>已拒绝</span>
        </Badge>
      );
    case "canceled":
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertCircleIcon className="h-3.5 w-3.5" />
          <span>已取消</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status}
        </Badge>
      );
  }
};

interface WorkflowInstanceListProps {
  workflowId: number
}

export function WorkflowInstanceList({ workflowId }: WorkflowInstanceListProps) {
  const router = useRouter()
  const [instances, setInstances] = useState<WorkflowInstance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10

  // 加载工作流实例
  useEffect(() => {
    const loadInstances = async () => {
      setIsLoading(true)
      try {
        // 从服务器获取工作流实例
        const data = await getWorkflowInstances(undefined, undefined, workflowId.toString())
        setInstances(data)
        setTotalPages(Math.ceil(data.length / pageSize))
      } catch (error) {
        console.error("Error loading workflow instances:", error)
        toast({
          title: "加载失败",
          description: "无法加载工作流实例，请稍后再试",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadInstances()
  }, [workflowId])

  // 查看工作流实例详情
  const handleViewInstance = (instance: WorkflowInstance) => {
    router.push(`/workflows/instances/${instance.id}`)
  }

  // 工作流实例表格列定义
  const columns: ColumnDef<WorkflowInstance>[] = [
    {
      accessorKey: "id",
      header: "实例ID",
      cell: ({ row }) => (
        <div className="font-mono text-xs truncate max-w-[100px]">
          {row.original.id}
        </div>
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
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => (
        <div className="text-center">
          {getStatusBadge(row.original.status)}
        </div>
      ),
    },
    {
      accessorKey: "currentStepNumber",
      header: "当前步骤",
      cell: ({ row }) => {
        const instance = row.original
        if (instance.status !== "pending") {
          return <div className="text-center">-</div>
        }
        
        const currentStep = instance.approvals.find(
          approval => approval.workflowStep.stepNumber === instance.currentStepNumber
        )
        
        return (
          <div className="text-center">
            {currentStep ? currentStep.workflowStep.name : `步骤 ${instance.currentStepNumber}`}
          </div>
        )
      },
    },
    {
      accessorKey: "initiatorName",
      header: "发起人",
      cell: ({ row }) => (
        <div>
          {row.original.initiatorName || row.original.initiatedBy}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "发起时间",
      cell: ({ row }) => (
        <div>
          {format(new Date(row.original.createdAt), "yyyy-MM-dd HH:mm")}
        </div>
      ),
    },
    {
      accessorKey: "completedAt",
      header: "完成时间",
      cell: ({ row }) => (
        <div>
          {row.original.completedAt 
            ? format(new Date(row.original.completedAt), "yyyy-MM-dd HH:mm")
            : "-"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewInstance(row.original)}
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          查看
        </Button>
      ),
    },
  ]

  // 分页显示的实例
  const paginatedInstances = instances.slice((page - 1) * pageSize, page * pageSize)

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable
          columns={columns}
          data={paginatedInstances}
          isLoading={isLoading}
          noResultsMessage="暂无工作流实例"
        />

        {totalPages > 1 && (
          <div className="mt-4 p-4 border-t">
            <SimplePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
