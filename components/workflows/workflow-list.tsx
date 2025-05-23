"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "@/components/ui/use-toast"
import { PlusIcon, SearchIcon, CheckIcon, XIcon, Settings2Icon } from "lucide-react"
import Link from "next/link"
import { getWorkflows } from "@/lib/actions/workflow-actions"
import { WorkflowDialog } from "@/components/workflows/workflow-dialog"

// 工作流类型
interface Workflow {
  id: number
  code: string
  name: string
  description?: string
  entityType: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  steps: WorkflowStep[]
}

// 工作流步骤类型
interface WorkflowStep {
  id: number
  workflowId: number
  name: string
  description?: string
  stepNumber: number
  approverType: string
  approverId?: string
  isRequired: boolean
  createdAt: Date
  updatedAt: Date
}

// 获取实体类型标签
const getEntityTypeLabel = (entityType: string) => {
  switch (entityType) {
    case "product":
      return "产品";
    case "order":
      return "订单";
    case "purchase":
      return "采购";
    case "expense":
      return "费用";
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

export function WorkflowList() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)

  // 加载工作流
  useEffect(() => {
    const loadWorkflows = async () => {
      setIsLoading(true)
      try {
        // 从服务器获取工作流
        const data = await getWorkflows()
        setWorkflows(data)
        setFilteredWorkflows(data)
      } catch (error) {
        console.error("Error loading workflows:", error)
        toast({
          title: "加载失败",
          description: "无法加载工作流，请稍后再试",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkflows()
  }, [])

  // 搜索过滤
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredWorkflows(workflows)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = workflows.filter(
      (workflow) =>
        workflow.code.toLowerCase().includes(query) ||
        workflow.name.toLowerCase().includes(query) ||
        (workflow.description && workflow.description.toLowerCase().includes(query)) ||
        workflow.entityType.toLowerCase().includes(query)
    )
    setFilteredWorkflows(filtered)
  }, [searchQuery, workflows])

  // 打开新建工作流对话框
  const handleAddWorkflow = () => {
    setSelectedWorkflow(null)
    setShowDialog(true)
  }

  // 打开编辑工作流对话框
  const handleEditWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setShowDialog(true)
  }

  // 查看工作流详情
  const handleViewWorkflow = (workflow: Workflow) => {
    router.push(`/workflows/${workflow.id}`)
  }

  // 工作流表格列定义
  const columns: ColumnDef<Workflow>[] = [
    {
      accessorKey: "code",
      header: "代码",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.code}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "名称",
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
      accessorKey: "steps",
      header: "步骤数",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.steps.length}
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "状态",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.isActive ? (
            <Badge variant="success" className="gap-1">
              <CheckIcon className="h-3.5 w-3.5" />
              <span>启用</span>
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <XIcon className="h-3.5 w-3.5" />
              <span>禁用</span>
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "更新时间",
      cell: ({ row }) => (
        <div>
          {new Date(row.original.updatedAt).toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      ),
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewWorkflow(row.original)}
          >
            查看
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditWorkflow(row.original)}
          >
            编辑
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>工作流列表</CardTitle>
              <CardDescription>管理系统中使用的工作流和审批流程</CardDescription>
            </div>
            <Button onClick={handleAddWorkflow}>
              <PlusIcon className="h-4 w-4 mr-2" />
              新建工作流
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索工作流..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredWorkflows}
            isLoading={isLoading}
            noResultsMessage="暂无工作流"
          />
        </CardContent>
      </Card>

      {/* 工作流对话框 */}
      <WorkflowDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        workflow={selectedWorkflow}
        onSuccess={(newWorkflow) => {
          if (selectedWorkflow) {
            // 更新工作流
            setWorkflows(
              workflows.map((wf) =>
                wf.id === newWorkflow.id ? newWorkflow : wf
              )
            )
          } else {
            // 添加新工作流
            setWorkflows([...workflows, newWorkflow])
          }
        }}
      />
    </>
  )
}
