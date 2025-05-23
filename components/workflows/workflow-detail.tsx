"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { 
  PlusIcon, 
  CheckIcon, 
  XIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  Trash2Icon,
  Settings2Icon,
  ListIcon,
  ClipboardListIcon
} from "lucide-react"
import { getWorkflow, deleteWorkflow } from "@/lib/actions/workflow-actions"
import { WorkflowStepList } from "@/components/workflows/workflow-step-list"
import { WorkflowInstanceList } from "@/components/workflows/workflow-instance-list"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

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

interface WorkflowDetailProps {
  workflow: Workflow
}

export function WorkflowDetail({ workflow: initialWorkflow }: WorkflowDetailProps) {
  const router = useRouter()
  const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("steps")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // 刷新工作流
  const refreshWorkflow = async () => {
    setIsLoading(true)
    try {
      const refreshedWorkflow = await getWorkflow(workflow.id)
      setWorkflow(refreshedWorkflow)
    } catch (error) {
      console.error("Error refreshing workflow:", error)
      toast({
        title: "刷新失败",
        description: "无法刷新工作流，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 删除工作流
  const handleDeleteWorkflow = async () => {
    setIsLoading(true)
    try {
      await deleteWorkflow(workflow.id)
      toast({
        title: "删除成功",
        description: "工作流已成功删除",
      })
      router.push("/workflows")
    } catch (error) {
      console.error("Error deleting workflow:", error)
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "无法删除工作流，请稍后再试",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle>{workflow.name}</CardTitle>
                <Badge variant={workflow.isActive ? "success" : "secondary"}>
                  {workflow.isActive ? "已启用" : "已禁用"}
                </Badge>
              </div>
              <CardDescription>
                代码: {workflow.code} | 实体类型: {getEntityTypeLabel(workflow.entityType)}
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={refreshWorkflow} disabled={isLoading}>
                刷新
              </Button>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isLoading}>
                <Trash2Icon className="h-4 w-4 mr-2" />
                删除
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {workflow.description && (
            <div className="mb-6 p-4 bg-muted rounded-md">
              <h3 className="text-sm font-medium mb-2">描述</h3>
              <p className="text-sm text-muted-foreground">{workflow.description}</p>
            </div>
          )}
          
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">创建时间</div>
              <div className="text-sm">
                {new Date(workflow.createdAt).toLocaleString("zh-CN")}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">更新时间</div>
              <div className="text-sm">
                {new Date(workflow.updatedAt).toLocaleString("zh-CN")}
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="steps" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="steps" className="flex items-center">
                <Settings2Icon className="h-4 w-4 mr-2" />
                工作流步骤
              </TabsTrigger>
              <TabsTrigger value="instances" className="flex items-center">
                <ClipboardListIcon className="h-4 w-4 mr-2" />
                工作流实例
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="steps" className="mt-6">
              <WorkflowStepList 
                workflow={workflow} 
                onWorkflowUpdated={(updatedWorkflow) => {
                  setWorkflow(updatedWorkflow)
                }}
              />
            </TabsContent>
            
            <TabsContent value="instances" className="mt-6">
              <WorkflowInstanceList workflowId={workflow.id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除此工作流吗？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可逆。删除工作流将同时删除所有相关的步骤，但不会删除已完成的工作流实例。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteWorkflow()
              }}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
