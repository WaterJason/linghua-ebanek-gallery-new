"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { 
  PlusIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  Trash2Icon,
  EditIcon,
  UserIcon,
  UserCogIcon,
  UserCheckIcon,
  UsersIcon
} from "lucide-react"
import { 
  moveWorkflowStepUp, 
  moveWorkflowStepDown, 
  deleteWorkflowStep 
} from "@/lib/actions/workflow-actions"
import { WorkflowStepDialog } from "@/components/workflows/workflow-step-dialog"
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
  approverName?: string
  isRequired: boolean
  createdAt: Date
  updatedAt: Date
}

// 获取审批人类型标签
const getApproverTypeLabel = (approverType: string) => {
  switch (approverType) {
    case "user":
      return "指定用户";
    case "role":
      return "指定角色";
    case "department":
      return "指定部门";
    case "initiator_manager":
      return "发起人上级";
    case "dynamic":
      return "动态指定";
    default:
      return approverType;
  }
};

// 获取审批人类型图标
const getApproverTypeIcon = (approverType: string) => {
  switch (approverType) {
    case "user":
      return <UserIcon className="h-4 w-4" />;
    case "role":
      return <UserCogIcon className="h-4 w-4" />;
    case "department":
      return <UsersIcon className="h-4 w-4" />;
    case "initiator_manager":
      return <UserCheckIcon className="h-4 w-4" />;
    case "dynamic":
      return <UserCogIcon className="h-4 w-4" />;
    default:
      return <UserIcon className="h-4 w-4" />;
  }
};

interface WorkflowStepListProps {
  workflow: Workflow
  onWorkflowUpdated: (workflow: Workflow) => void
}

export function WorkflowStepList({ workflow, onWorkflowUpdated }: WorkflowStepListProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [stepToDelete, setStepToDelete] = useState<WorkflowStep | null>(null)
  
  // 打开新建步骤对话框
  const handleAddStep = () => {
    setSelectedStep(null)
    setShowDialog(true)
  }
  
  // 打开编辑步骤对话框
  const handleEditStep = (step: WorkflowStep) => {
    setSelectedStep(step)
    setShowDialog(true)
  }
  
  // 打开删除步骤对话框
  const handleDeleteStepClick = (step: WorkflowStep) => {
    setStepToDelete(step)
    setShowDeleteDialog(true)
  }
  
  // 删除步骤
  const handleDeleteStep = async () => {
    if (!stepToDelete) return
    
    setIsLoading(true)
    try {
      const updatedWorkflow = await deleteWorkflowStep(stepToDelete.id)
      onWorkflowUpdated(updatedWorkflow)
      toast({
        title: "删除成功",
        description: "工作流步骤已成功删除",
      })
    } catch (error) {
      console.error("Error deleting workflow step:", error)
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "无法删除工作流步骤，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setShowDeleteDialog(false)
      setStepToDelete(null)
    }
  }
  
  // 上移步骤
  const handleMoveStepUp = async (step: WorkflowStep) => {
    setIsLoading(true)
    try {
      const updatedWorkflow = await moveWorkflowStepUp(step.id)
      onWorkflowUpdated(updatedWorkflow)
      toast({
        title: "移动成功",
        description: "工作流步骤已成功上移",
      })
    } catch (error) {
      console.error("Error moving workflow step up:", error)
      toast({
        title: "移动失败",
        description: error instanceof Error ? error.message : "无法上移工作流步骤，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // 下移步骤
  const handleMoveStepDown = async (step: WorkflowStep) => {
    setIsLoading(true)
    try {
      const updatedWorkflow = await moveWorkflowStepDown(step.id)
      onWorkflowUpdated(updatedWorkflow)
      toast({
        title: "移动成功",
        description: "工作流步骤已成功下移",
      })
    } catch (error) {
      console.error("Error moving workflow step down:", error)
      toast({
        title: "移动失败",
        description: error instanceof Error ? error.message : "无法下移工作流步骤，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">工作流步骤</h3>
          <Button onClick={handleAddStep} disabled={isLoading}>
            <PlusIcon className="h-4 w-4 mr-2" />
            添加步骤
          </Button>
        </div>
        
        {workflow.steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
            <div className="text-muted-foreground mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 opacity-50">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M12 18v-6" />
                <path d="M8 18v-1" />
                <path d="M16 18v-3" />
              </svg>
              <p>此工作流还没有步骤</p>
            </div>
            <Button onClick={handleAddStep} variant="outline">
              <PlusIcon className="h-4 w-4 mr-2" />
              添加第一个步骤
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {workflow.steps
              .sort((a, b) => a.stepNumber - b.stepNumber)
              .map((step, index) => (
                <Card key={step.id} className="relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                          {step.stepNumber}
                        </Badge>
                        <CardTitle className="text-base">{step.name}</CardTitle>
                        {step.isRequired ? (
                          <Badge variant="default">必须</Badge>
                        ) : (
                          <Badge variant="outline">可选</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveStepUp(step)}
                          disabled={index === 0 || isLoading}
                        >
                          <ArrowUpIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveStepDown(step)}
                          disabled={index === workflow.steps.length - 1 || isLoading}
                        >
                          <ArrowDownIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditStep(step)}
                          disabled={isLoading}
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteStepClick(step)}
                          disabled={isLoading}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {step.description && (
                      <CardDescription>{step.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div className="text-muted-foreground">审批人类型</div>
                        <div className="flex items-center space-x-1">
                          {getApproverTypeIcon(step.approverType)}
                          <span>{getApproverTypeLabel(step.approverType)}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">审批人</div>
                        <div>
                          {step.approverName || step.approverId || "未指定"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
      
      {/* 工作流步骤对话框 */}
      <WorkflowStepDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        workflowId={workflow.id}
        step={selectedStep}
        onSuccess={(updatedWorkflow) => {
          onWorkflowUpdated(updatedWorkflow)
        }}
      />
      
      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除此步骤吗？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可逆。删除步骤可能会影响现有的工作流实例。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteStep()
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
