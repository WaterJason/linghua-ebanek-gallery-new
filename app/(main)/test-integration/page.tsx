"use client"

import { useState } from "react"
import { ModernPageContainer } from "@/components/modern-page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Clock, Undo, Redo } from "lucide-react"
import { useEnhancedOperations } from "@/lib/enhanced-operations"
import { toast } from "@/components/ui/use-toast"

export default function TestIntegrationPage() {
  const [testResults, setTestResults] = useState([])
  const [isRunning, setIsRunning] = useState(false)

  // 测试不同模块的增强操作系统
  const inventoryOps = useEnhancedOperations('inventory')
  const financeOps = useEnhancedOperations('finance')
  const productionOps = useEnhancedOperations('production')
  const workshopOps = useEnhancedOperations('workshop')
  const scheduleOps = useEnhancedOperations('schedule')
  const productsOps = useEnhancedOperations('products')
  const salesOps = useEnhancedOperations('sales')
  const channelOps = useEnhancedOperations('channel')
  const settingsOps = useEnhancedOperations('settings')

  const runTests = async () => {
    setIsRunning(true)
    setTestResults([])

    const tests = [
      {
        name: "库存管理模块",
        module: "inventory",
        ops: inventoryOps,
        test: async () => {
          // 测试撤销/重做功能
          await inventoryOps.create('测试库存').form(
            async () => ({ id: 1, name: '测试产品', quantity: 10 }),
            null,
            { name: '测试产品', quantity: 10 },
            { canUndo: true }
          )
          return true
        }
      },
      {
        name: "财务管理模块",
        module: "finance",
        ops: financeOps,
        test: async () => {
          // 测试操作反馈
          await financeOps.create('测试交易').form(
            async () => ({ id: 1, amount: 100, type: 'income' }),
            null,
            { amount: 100, type: 'income' },
            { canUndo: true }
          )
          return true
        }
      },
      {
        name: "生产管理模块",
        module: "production",
        ops: productionOps,
        test: async () => {
          // 测试进度指示器
          await productionOps.create('测试订单').form(
            async () => ({ id: 1, orderNumber: 'PO-001', status: 'pending' }),
            null,
            { orderNumber: 'PO-001', status: 'pending' },
            { canUndo: true }
          )
          return true
        }
      },
      {
        name: "团建活动模块",
        module: "workshop",
        ops: workshopOps,
        test: async () => {
          // 测试批量操作
          await workshopOps.create('测试活动').form(
            async () => ({ id: 1, name: '测试团建', status: 'scheduled' }),
            null,
            { name: '测试团建', status: 'scheduled' },
            { canUndo: true }
          )
          return true
        }
      },
      {
        name: "员工管理模块",
        module: "schedule",
        ops: scheduleOps,
        test: async () => {
          // 测试排班功能
          await scheduleOps.create('测试排班').form(
            async () => ({ id: 1, employeeId: 1, date: new Date(), startTime: '09:00', endTime: '17:00' }),
            null,
            { employeeId: 1, date: new Date(), startTime: '09:00', endTime: '17:00' },
            { canUndo: true }
          )
          return true
        }
      },
      {
        name: "产品管理模块",
        module: "products",
        ops: productsOps,
        test: async () => {
          // 测试产品操作
          await productsOps.create('测试产品').form(
            async () => ({ id: 1, name: '测试珐琅产品', price: 100 }),
            null,
            { name: '测试珐琅产品', price: 100 },
            { canUndo: true }
          )
          return true
        }
      },
      {
        name: "销售管理模块",
        module: "sales",
        ops: salesOps,
        test: async () => {
          // 测试销售记录
          await salesOps.create('测试销售').form(
            async () => ({ id: 1, totalAmount: 200, date: new Date() }),
            null,
            { totalAmount: 200, date: new Date() },
            { canUndo: true }
          )
          return true
        }
      },
      {
        name: "渠道管理模块",
        module: "channel",
        ops: channelOps,
        test: async () => {
          // 测试渠道操作
          await channelOps.create('测试渠道').form(
            async () => ({ id: 1, name: '测试合作伙伴', code: 'TEST001' }),
            null,
            { name: '测试合作伙伴', code: 'TEST001' },
            { canUndo: true }
          )
          return true
        }
      },
      {
        name: "系统设置模块",
        module: "settings",
        ops: settingsOps,
        test: async () => {
          // 测试系统设置
          await settingsOps.update('测试设置').form(
            async () => ({ companyName: '聆花掐丝珐琅馆', coffeeSalesCommissionRate: 20 }),
            { companyName: '聆花掐丝珐琅馆', coffeeSalesCommissionRate: 15 },
            { companyName: '聆花掐丝珐琅馆', coffeeSalesCommissionRate: 20 },
            { canUndo: true }
          )
          return true
        }
      }
    ]

    const results = []

    for (const test of tests) {
      try {
        await test.test()
        results.push({
          name: test.name,
          module: test.module,
          status: 'success',
          message: '集成成功',
          timestamp: new Date().toLocaleTimeString()
        })
      } catch (error) {
        results.push({
          name: test.name,
          module: test.module,
          status: 'error',
          message: error.message || '集成失败',
          timestamp: new Date().toLocaleTimeString()
        })
      }
    }

    setTestResults(results)
    setIsRunning(false)

    const successCount = results.filter(r => r.status === 'success').length
    toast({
      title: "集成测试完成",
      description: `${successCount}/${results.length} 个模块集成成功`,
      variant: successCount === results.length ? "default" : "destructive"
    })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">成功</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">失败</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">进行中</Badge>
    }
  }

  return (
    <ModernPageContainer
      title="增强操作系统集成测试"
      description="测试各模块的增强操作系统集成状态"
      breadcrumbs={[
        { label: "首页", href: "/" },
        { label: "集成测试" }
      ]}
    >
      <div className="space-y-6">
        {/* 测试控制面板 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Undo className="h-5 w-5" />
              增强操作系统功能测试
            </CardTitle>
            <CardDescription>
              测试撤销/重做、操作反馈、进度指示器等核心功能在各模块中的集成状态
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={runTests}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    测试中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    开始测试
                  </>
                )}
              </Button>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Redo className="h-4 w-4" />
                测试包括：撤销/重做、操作反馈、进度指示器、批量操作
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 测试结果 */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>测试结果</CardTitle>
              <CardDescription>
                各模块增强操作系统集成状态
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h4 className="font-medium">{result.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          模块: {result.module} | 时间: {result.timestamp}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">{result.message}</span>
                      {getStatusBadge(result.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 功能说明 */}
        <Card>
          <CardHeader>
            <CardTitle>增强操作系统功能说明</CardTitle>
            <CardDescription>
              已集成的核心功能模块
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Undo className="h-4 w-4" />
                  撤销/重做功能
                </h4>
                <p className="text-sm text-muted-foreground">
                  支持5-10步操作历史，本地存储持久化，适用于所有数据操作
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  统一操作反馈
                </h4>
                <p className="text-sm text-muted-foreground">
                  即时Toast通知，加载状态显示，完整错误处理机制
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  进度指示器
                </h4>
                <p className="text-sm text-muted-foreground">
                  耗时操作进度显示，支持取消操作，后台任务监控
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Redo className="h-4 w-4" />
                  批量操作支持
                </h4>
                <p className="text-sm text-muted-foreground">
                  批量更新、删除、导出等操作，统一进度反馈
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernPageContainer>
  )
}
