"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SmartTooltip } from "@/components/ui/tooltip"
import { SmartGuide, useSmartGuide } from "@/components/ui/smart-guide"
import { PlusIcon, UsersIcon, BarChart3Icon, FileTextIcon, DownloadIcon, UploadIcon, HelpCircle } from "lucide-react"
import { EmployeeList } from "@/components/employee-list"
import { AddEmployeeDialog } from "@/components/add-employee-dialog"
import { ModernPageContainer } from "@/components/modern-page-container"
import { useContextualHelp } from "@/hooks/use-contextual-help"
import { useSmartOperation } from "@/hooks/use-feedback"
import { UndoRedoControls } from "@/components/ui/undo-redo-controls"
import { AnimatedButton } from "@/components/ui/micro-animations"
import { useEnhancedOperations } from "@/lib/enhanced-operations-integration"
import Link from "next/link"

export function DesktopEmployeesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("list")

  // 智能引导系统
  const { isOpen: isGuideOpen, currentGuide, startGuide, closeGuide } = useSmartGuide()

  // 上下文帮助系统
  const { activeHelp, hideHelp, handlePageChange } = useContextualHelp('admin')

  // 智能操作系统
  const {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    submitForm,
    deleteData,
    canUndo,
    canRedo,
    undo,
    redo
  } = useSmartOperation()

  // 增强操作系统
  const { executeOperation, executeFormOperation, executeBatchOperation } = useEnhancedOperations()

  const handleAddEmployee = () => {
    setIsAddDialogOpen(true)
  }

  const handleEmployeeAdded = async (newEmployee) => {
    try {
      await executeOperation(
        async () => {
          setIsAddDialogOpen(false)
          return newEmployee
        },
        {
          playSound: true,
          soundType: 'success',
          feedbackMessage: `员工 ${newEmployee.name} 已成功添加到系统中`,
          enableUndo: true,
          undoTags: ['create', 'employee'],
          undoPriority: 5
        }
      )
      // 刷新列表会自动通过EmployeeList组件完成
    } catch (error) {
      // 错误已由增强操作系统处理
    }
  }

  // 处理数据导出
  const handleExportData = async () => {
    try {
      await executeOperation(
        async () => {
          // 这里应该调用实际的导出API
          await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟导出过程
          return { exported: true, count: 25 }
        },
        {
          playSound: true,
          soundType: 'success',
          showProgress: true,
          progressTitle: '导出员工数据',
          feedbackMessage: '员工数据已成功导出到Excel文件',
          enableUndo: false // 导出操作不需要撤销
        }
      )
    } catch (error) {
      // 错误已由增强操作系统处理
    }
  }

  // 处理数据导入
  const handleImportData = async () => {
    try {
      await executeOperation(
        async () => {
          // 这里应该调用实际的导入API
          await new Promise(resolve => setTimeout(resolve, 3000)) // 模拟导入过程
          return { imported: true, count: 15 }
        },
        {
          playSound: true,
          soundType: 'success',
          showProgress: true,
          progressTitle: '导入员工数据',
          feedbackMessage: '员工数据已成功导入，共导入 15 条记录',
          enableUndo: true,
          undoTags: ['import', 'employee'],
          undoPriority: 7
        }
      )
    } catch (error) {
      // 错误已由增强操作系统处理
    }
  }

  // 启动员工管理引导
  const startEmployeeGuide = () => {
    const guideSteps = [
      {
        id: 'welcome',
        title: '欢迎使用员工管理',
        content: '在这里您可以管理所有员工信息，包括基本信息、绩效统计和薪资管理。',
        target: '[data-guide-main]'
      },
      {
        id: 'add-employee',
        title: '添加新员工',
        content: '点击"添加员工"按钮可以录入新员工的基本信息，包括姓名、职位、联系方式等。',
        target: '[data-guide-add-btn]',
        action: {
          text: '试试添加员工',
          onClick: handleAddEmployee
        }
      },
      {
        id: 'employee-tabs',
        title: '功能标签页',
        content: '通过不同的标签页可以查看员工列表、绩效统计和薪资管理。每个标签页都有专门的功能。',
        target: '[data-guide-tabs]'
      },
      {
        id: 'export-import',
        title: '数据导入导出',
        content: '支持批量导入员工数据和导出员工信息，方便数据管理和备份。',
        target: '[data-guide-export]'
      }
    ]
    startGuide(guideSteps)
  }

  // 页面加载时处理
  useEffect(() => {
    handlePageChange('/employees')
  }, []) // 移除 handlePageChange 依赖，避免无限循环

  return (
    <TooltipProvider>
      <ModernPageContainer
        title="员工管理"
        description="管理员工信息、绩效统计和薪资计算"
        breadcrumbs={[
          { label: "首页", href: "/" },
          { label: "员工管理" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            {/* 撤销重做控制 */}
            <UndoRedoControls compact showHistory={false} />

            <SmartTooltip
              content="查看员工管理操作指南，了解如何高效管理员工信息"
              type="help"
              title="操作指南"
            >
              <AnimatedButton
                variant="outline"
                size="sm"
                onClick={startEmployeeGuide}
                className="flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                操作指南
              </AnimatedButton>
            </SmartTooltip>
            <SmartTooltip
              content="添加新员工到系统中，包括基本信息、职位和联系方式"
              type="info"
              title="添加员工"
            >
              <AnimatedButton
                onClick={handleAddEmployee}
                className="flex items-center gap-2"
                data-guide-add-btn
              >
                <PlusIcon className="h-4 w-4" />
                添加员工
              </AnimatedButton>
            </SmartTooltip>
          </div>
        }
      >
        <div data-guide-main>

        <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3" data-guide-tabs>
            <TabsTrigger value="list" className="flex items-center gap-2" title="查看和管理所有员工的基本信息">
              <UsersIcon className="h-4 w-4" />
              员工列表
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2" title="查看员工工作表现和绩效数据统计">
              <BarChart3Icon className="h-4 w-4" />
              绩效统计
            </TabsTrigger>
            <TabsTrigger value="salary" className="flex items-center gap-2" title="管理员工薪资计算和发放记录">
              <FileTextIcon className="h-4 w-4" />
              薪资管理
            </TabsTrigger>
          </TabsList>

        <TabsContent value="list" className="space-y-6">
          <div className="card-modern">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">员工列表</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">管理所有员工信息</p>
                </div>
                <div className="flex gap-2" data-guide-export>
                  <AnimatedButton
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    title="导出员工数据到Excel文件"
                    onClick={handleExportData}
                  >
                    <DownloadIcon className="h-4 w-4" />
                    导出
                  </AnimatedButton>
                  <AnimatedButton
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    title="从Excel文件批量导入员工信息"
                    onClick={handleImportData}
                  >
                    <UploadIcon className="h-4 w-4" />
                    导入
                  </AnimatedButton>
                </div>
              </div>
            </div>
            <div className="p-6">
              <EmployeeList onAddEmployee={handleAddEmployee} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="card-modern p-6">
            <div className="text-center py-12">
              <BarChart3Icon className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                员工绩效统计
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                查看员工工作表现和绩效数据
              </p>
              <div className="text-sm text-muted-foreground">
                员工绩效统计功能正在开发中...
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="salary" className="space-y-6">
          <div className="card-modern">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">员工薪资管理</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">计算和管理员工薪资</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/salary" className="flex items-center gap-2">
                    <FileTextIcon className="h-4 w-4" />
                    薪资管理
                  </Link>
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-modern card-hover p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 dark:bg-blue-900/30 dark:text-blue-400">
                      <FileTextIcon className="w-5 h-5" />
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">薪资计算</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    根据员工工作记录自动计算薪资
                  </p>
                  <Button variant="link" className="p-0 h-auto justify-start" asChild>
                    <Link href="/salary">查看薪资记录 →</Link>
                  </Button>
                </div>

                <div className="card-modern card-hover p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mr-3 dark:bg-green-900/30 dark:text-green-400">
                      <DownloadIcon className="w-5 h-5" />
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">薪资单生成</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    生成员工薪资单并导出
                  </p>
                  <Button variant="link" className="p-0 h-auto justify-start" asChild>
                    <Link href="/salary">生成薪资单 →</Link>
                  </Button>
                </div>

                <div className="card-modern card-hover p-6">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mr-3 dark:bg-purple-900/30 dark:text-purple-400">
                      <UsersIcon className="w-5 h-5" />
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">薪资规则设置</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    配置薪资计算规则和参数
                  </p>
                  <Button variant="link" className="p-0 h-auto justify-start" asChild>
                    <Link href="/settings">设置薪资规则 →</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        </Tabs>
        </div>

        {/* 智能引导组件 */}
        <SmartGuide
          steps={currentGuide}
          isOpen={isGuideOpen}
          onClose={closeGuide}
          title="员工管理操作指南"
        />

        {/* 上下文帮助显示 */}
        {activeHelp && (
          <div className="fixed bottom-4 right-4 z-50">
            <Card className="w-80 shadow-lg border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-blue-900">
                    💡 {activeHelp.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={hideHelp}
                    className="h-6 w-6 p-0 text-blue-600"
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-blue-800">{activeHelp.content}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <AddEmployeeDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onEmployeeAdded={handleEmployeeAdded}
        />
      </ModernPageContainer>
    </TooltipProvider>
  )
}
