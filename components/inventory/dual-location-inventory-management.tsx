'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, Search, Truck, Package, CheckCircle, XCircle, Clock, AlertTriangle, 
  ArrowRight, MapPin, Factory, Building, Zap, TrendingUp, DollarSign 
} from 'lucide-react'
import { toast } from 'sonner'

interface InventoryTransfer {
  id: number
  transferNumber: string
  productionOrderId?: number
  sourceWarehouse: { id: number; name: string; location?: string }
  targetWarehouse: { id: number; name: string; location?: string }
  product: { id: number; name: string }
  quantity: number
  actualQuantity?: number
  transferType: string
  status: string
  qualityStatus: string
  requestedDate: string
  shippedDate?: string
  deliveredDate?: string
  requester: { id: number; name: string }
  notes?: string
  trackingNumber?: string
  shippingCost?: number
}

interface AutomationRule {
  id: number
  name: string
  description?: string
  triggerEvent: string
  sourceStage?: string
  targetStage?: string
  transferType: string
  isActive: boolean
  sourceWarehouse?: { name: string }
  targetWarehouse?: { name: string }
  executions: Array<{
    id: number
    status: string
    executedAt: string
    productionOrder?: { product: { name: string } }
  }>
}

const statusConfig = {
  PENDING: { label: '待处理', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  APPROVED: { label: '已审批', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  SHIPPED: { label: '已发货', color: 'bg-purple-100 text-purple-800', icon: Truck },
  IN_TRANSIT: { label: '运输中', color: 'bg-indigo-100 text-indigo-800', icon: Package },
  DELIVERED: { label: '已送达', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  RECEIVED: { label: '已接收', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  COMPLETED: { label: '已完成', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  CANCELLED: { label: '已取消', color: 'bg-red-100 text-red-800', icon: XCircle },
  EXCEPTION: { label: '异常', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle }
}

const transferTypeConfig = {
  MATERIAL_TO_PRODUCTION: { 
    label: '原料发往生产', 
    color: 'bg-blue-100 text-blue-800',
    description: '广州→广西：底胎调配到生产基地',
    icon: Factory
  },
  SEMI_PRODUCT_RETURN: { 
    label: '半成品返回', 
    color: 'bg-green-100 text-green-800',
    description: '广西→广州：半成品返回精加工',
    icon: ArrowRight
  },
  FINISHED_PRODUCT: { 
    label: '成品转移', 
    color: 'bg-purple-100 text-purple-800',
    description: '精加工完成后成品入库',
    icon: Package
  },
  QUALITY_TRANSFER: { 
    label: '质检转移', 
    color: 'bg-yellow-100 text-yellow-800',
    description: '质量检验相关转移',
    icon: CheckCircle
  },
  EMERGENCY_TRANSFER: { 
    label: '紧急调拨', 
    color: 'bg-red-100 text-red-800',
    description: '紧急情况下的库存调拨',
    icon: AlertTriangle
  }
}

export default function DualLocationInventoryManagement() {
  const [activeTab, setActiveTab] = useState('transfers')
  const [transfers, setTransfers] = useState<InventoryTransfer[]>([])
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showRuleDialog, setShowRuleDialog] = useState(false)

  // 统计数据
  const [stats, setStats] = useState({
    totalTransfers: 0,
    pendingTransfers: 0,
    completedTransfers: 0,
    automationRate: 0,
    avgProcessingTime: 0,
    totalShippingCost: 0
  })

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      
      if (activeTab === 'transfers') {
        const response = await fetch('/api/inventory/transfers')
        if (response.ok) {
          const data = await response.json()
          setTransfers(data.data || [])
          
          // 计算统计数据
          const total = data.data.length
          const pending = data.data.filter((t: any) => t.status === 'PENDING').length
          const completed = data.data.filter((t: any) => t.status === 'COMPLETED').length
          const totalCost = data.data.reduce((sum: number, t: any) => sum + (t.shippingCost || 0), 0)
          
          setStats(prev => ({
            ...prev,
            totalTransfers: total,
            pendingTransfers: pending,
            completedTransfers: completed,
            totalShippingCost: totalCost
          }))
        }
      } else if (activeTab === 'automation') {
        const response = await fetch('/api/inventory/automation-rules')
        if (response.ok) {
          const data = await response.json()
          setAutomationRules(data.data || [])
          
          // 计算自动化率
          const totalRules = data.data.length
          const activeRules = data.data.filter((r: any) => r.isActive).length
          const automationRate = totalRules > 0 ? (activeRules / totalRules) * 100 : 0
          
          setStats(prev => ({
            ...prev,
            automationRate
          }))
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return <Badge variant="secondary">{status}</Badge>
    
    const Icon = config.icon
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getTransferTypeBadge = (type: string) => {
    const config = transferTypeConfig[type as keyof typeof transferTypeConfig]
    if (!config) return <Badge variant="outline">{type}</Badge>
    
    const Icon = config.icon
    return (
      <div className="flex items-center space-x-2">
        <Badge className={config.color}>
          <Icon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
      </div>
    )
  }

  const renderTransferFlow = (transfer: InventoryTransfer) => {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className="flex items-center space-x-1">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="font-medium">{transfer.sourceWarehouse.name}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <div className="flex items-center space-x-1">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="font-medium">{transfer.targetWarehouse.name}</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">双地点库存自动化管理</h1>
          <p className="text-gray-600">聆花珐琅工艺品生产流程库存管理与成本核算</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总转移次数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTransfers}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待处理转移</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingTransfers}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">自动化率</p>
                <p className="text-2xl font-bold text-gray-900">{stats.automationRate.toFixed(1)}%</p>
              </div>
              <Zap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">物流成本</p>
                <p className="text-2xl font-bold text-gray-900">¥{stats.totalShippingCost.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transfers">库存转移</TabsTrigger>
          <TabsTrigger value="automation">自动化规则</TabsTrigger>
          <TabsTrigger value="flow">生产流程</TabsTrigger>
          <TabsTrigger value="analytics">成本分析</TabsTrigger>
        </TabsList>

        {/* 库存转移标签页 */}
        <TabsContent value="transfers" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>库存转移记录</CardTitle>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  新建转移
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>转移单号</TableHead>
                    <TableHead>转移类型</TableHead>
                    <TableHead>产品</TableHead>
                    <TableHead>转移路径</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>申请时间</TableHead>
                    <TableHead>物流费用</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">
                        {transfer.transferNumber}
                      </TableCell>
                      <TableCell>
                        {getTransferTypeBadge(transfer.transferType)}
                      </TableCell>
                      <TableCell>{transfer.product.name}</TableCell>
                      <TableCell>
                        {renderTransferFlow(transfer)}
                      </TableCell>
                      <TableCell>
                        {transfer.actualQuantity || transfer.quantity}
                        {transfer.actualQuantity && transfer.actualQuantity !== transfer.quantity && (
                          <span className="text-gray-500 ml-1">
                            (原{transfer.quantity})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transfer.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(transfer.requestedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {transfer.shippingCost ? `¥${transfer.shippingCost.toFixed(2)}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {transfers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  暂无转移记录
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 自动化规则标签页 */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>自动化规则</CardTitle>
                <Button onClick={() => setShowRuleDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  新建规则
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>规则名称</TableHead>
                    <TableHead>触发事件</TableHead>
                    <TableHead>转移类型</TableHead>
                    <TableHead>转移路径</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>最近执行</TableHead>
                    <TableHead>执行次数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {automationRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">
                        {rule.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {rule.triggerEvent}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getTransferTypeBadge(rule.transferType)}
                      </TableCell>
                      <TableCell>
                        {rule.sourceWarehouse && rule.targetWarehouse && (
                          <div className="flex items-center space-x-2 text-sm">
                            <span>{rule.sourceWarehouse.name}</span>
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                            <span>{rule.targetWarehouse.name}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {rule.isActive ? '启用' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rule.executions.length > 0 ? 
                          new Date(rule.executions[0].executedAt).toLocaleDateString() : 
                          '-'
                        }
                      </TableCell>
                      <TableCell>
                        {rule.executions.length}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {automationRules.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  暂无自动化规则
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 生产流程标签页 */}
        <TabsContent value="flow" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>双地点生产流程</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* 广州阶段 */}
                <div className="border rounded-lg p-6 bg-blue-50">
                  <div className="flex items-center space-x-2 mb-4">
                    <Building className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900">广州总部</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-900 mb-2">1. 销售订单</h4>
                      <p className="text-sm text-gray-600">接收客户订单，确定产品需求</p>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-900 mb-2">2. 生产计划</h4>
                      <p className="text-sm text-gray-600">制定生产计划，安排生产基地</p>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-900 mb-2">3. 底胎准备</h4>
                      <p className="text-sm text-gray-600">准备底胎材料，检查库存</p>
                    </div>
                  </div>
                </div>

                {/* 物流阶段 */}
                <div className="flex justify-center">
                  <div className="border rounded-lg p-4 bg-purple-50">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-900">物流发送：广州 → 广西</span>
                    </div>
                    <p className="text-sm text-purple-700 mt-1">底胎调配到广西生产基地</p>
                  </div>
                </div>

                {/* 广西阶段 */}
                <div className="border rounded-lg p-6 bg-green-50">
                  <div className="flex items-center space-x-2 mb-4">
                    <Factory className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900">广西生产基地</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-900 mb-2">4. 原料入库</h4>
                      <p className="text-sm text-gray-600">接收底胎，确认数量和质量</p>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-900 mb-2">5. 工艺制作</h4>
                      <p className="text-sm text-gray-600">掐丝珐琅工艺制作，形成半成品</p>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-900 mb-2">6. 质量检验</h4>
                      <p className="text-sm text-gray-600">半成品质量检验，确保工艺标准</p>
                    </div>
                  </div>
                </div>

                {/* 返回物流 */}
                <div className="flex justify-center">
                  <div className="border rounded-lg p-4 bg-purple-50">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-900">物流返回：广西 → 广州</span>
                    </div>
                    <p className="text-sm text-purple-700 mt-1">半成品返回广州精加工</p>
                  </div>
                </div>

                {/* 广州后处理 */}
                <div className="border rounded-lg p-6 bg-orange-50">
                  <div className="flex items-center space-x-2 mb-4">
                    <Building className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-orange-900">广州后处理</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-900 mb-2">7. 点蓝工艺</h4>
                      <p className="text-sm text-gray-600">按件计费的点蓝精加工工序</p>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-900 mb-2">8. 配饰装裱</h4>
                      <p className="text-sm text-gray-600">按件计费的配饰和装裱工序</p>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <h4 className="font-medium text-gray-900 mb-2">9. 成品入库</h4>
                      <p className="text-sm text-gray-600">成品质检后入库，准备销售</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 成本分析标签页 */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>成本构成分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="font-medium">直接材料成本</span>
                    <span className="text-blue-600 font-bold">45%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="font-medium">直接人工成本</span>
                    <span className="text-green-600 font-bold">30%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <span className="font-medium">物流运输成本</span>
                    <span className="text-purple-600 font-bold">15%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                    <span className="font-medium">管理费用</span>
                    <span className="text-yellow-600 font-bold">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>地点成本分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">广州总部</span>
                      </div>
                      <span className="text-blue-600 font-bold">60%</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      设计、采购、点蓝、配饰、包装
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Factory className="w-4 h-4 text-green-600" />
                        <span className="font-medium">广西生产基地</span>
                      </div>
                      <span className="text-green-600 font-bold">25%</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      工艺制作、质量检验
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">物流运输</span>
                      </div>
                      <span className="text-purple-600 font-bold">15%</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      双向物流、包装、保险
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
