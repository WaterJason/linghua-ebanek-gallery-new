'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, CheckCircle, XCircle, TrendingDown, Calculator, 
  FileText, Clock, DollarSign, Package, ArrowRight, Eye
} from 'lucide-react'
import { toast } from 'sonner'

interface QuantityVariance {
  id: number
  transferId: number
  transfer: {
    transferNumber: string
    sourceWarehouse: { name: string }
    targetWarehouse: { name: string }
    product: { name: string }
  }
  expectedQuantity: number
  actualQuantity: number
  varianceQuantity: number
  variancePercentage: number
  varianceType: string
  status: string
  detectedAt: string
  resolvedAt?: string
  resolvedBy?: { name: string }
  costImpact: number
  notes?: string
  evidenceFiles?: string[]
  qualityIssues?: Array<{
    type: string
    quantity: number
    description: string
  }>
}

const varianceTypeConfig = {
  QUALITY_DEFECT: { 
    label: '质量缺陷', 
    color: 'bg-red-100 text-red-800', 
    icon: XCircle,
    description: '产品质量不合格导致的数量减少'
  },
  PRODUCTION_LOSS: { 
    label: '生产损耗', 
    color: 'bg-orange-100 text-orange-800', 
    icon: TrendingDown,
    description: '正常生产过程中的损耗'
  },
  REWORK_REQUIRED: { 
    label: '需要返工', 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: Clock,
    description: '需要返工处理的产品'
  },
  SHIPPING_DAMAGE: { 
    label: '运输损坏', 
    color: 'bg-purple-100 text-purple-800', 
    icon: Package,
    description: '运输过程中造成的损坏'
  },
  COUNTING_ERROR: { 
    label: '盘点错误', 
    color: 'bg-blue-100 text-blue-800', 
    icon: Calculator,
    description: '人工盘点或系统记录错误'
  }
}

const statusConfig = {
  DETECTED: { label: '已检测', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  INVESTIGATING: { label: '调查中', color: 'bg-blue-100 text-blue-800', icon: Eye },
  RESOLVED: { label: '已解决', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  WRITTEN_OFF: { label: '已核销', color: 'bg-gray-100 text-gray-800', icon: FileText }
}

export default function QuantityVarianceManagement() {
  const [variances, setVariances] = useState<QuantityVariance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVariance, setSelectedVariance] = useState<QuantityVariance | null>(null)
  const [showResolveDialog, setShowResolveDialog] = useState(false)
  const [resolveForm, setResolveForm] = useState({
    varianceType: '',
    resolution: '',
    costAdjustment: '',
    notes: '',
    qualityIssues: [] as Array<{ type: string; quantity: number; description: string }>
  })

  // 统计数据
  const [stats, setStats] = useState({
    totalVariances: 0,
    unresolvedVariances: 0,
    totalCostImpact: 0,
    averageVarianceRate: 0,
    qualityDefectRate: 0,
    productionLossRate: 0
  })

  useEffect(() => {
    loadVariances()
  }, [])

  const loadVariances = async () => {
    try {
      setLoading(true)
      
      // 模拟数据 - 实际应该从API获取
      const mockVariances: QuantityVariance[] = [
        {
          id: 1,
          transferId: 1,
          transfer: {
            transferNumber: 'TF-2024-001',
            sourceWarehouse: { name: '广州原料仓' },
            targetWarehouse: { name: '广西生产仓' },
            product: { name: '珐琅底胎-圆形' }
          },
          expectedQuantity: 100,
          actualQuantity: 90,
          varianceQuantity: -10,
          variancePercentage: -10.0,
          varianceType: 'QUALITY_DEFECT',
          status: 'INVESTIGATING',
          detectedAt: '2024-12-20T10:30:00Z',
          costImpact: 150.00,
          notes: '生产过程中发现10个底胎有微小裂纹',
          qualityIssues: [
            { type: '表面裂纹', quantity: 7, description: '底胎表面出现细微裂纹' },
            { type: '尺寸偏差', quantity: 3, description: '尺寸超出允许公差范围' }
          ]
        },
        {
          id: 2,
          transferId: 2,
          transfer: {
            transferNumber: 'TF-2024-002',
            sourceWarehouse: { name: '广西生产仓' },
            targetWarehouse: { name: '广州精加工仓' },
            product: { name: '珐琅半成品-花卉图案' }
          },
          expectedQuantity: 80,
          actualQuantity: 85,
          varianceQuantity: 5,
          variancePercentage: 6.25,
          varianceType: 'COUNTING_ERROR',
          status: 'RESOLVED',
          detectedAt: '2024-12-19T14:20:00Z',
          resolvedAt: '2024-12-19T16:45:00Z',
          resolvedBy: { name: '李质检员' },
          costImpact: 0,
          notes: '重新盘点后发现系统记录错误，实际数量正确'
        }
      ]

      setVariances(mockVariances)

      // 计算统计数据
      const totalVariances = mockVariances.length
      const unresolvedVariances = mockVariances.filter(v => v.status !== 'RESOLVED' && v.status !== 'WRITTEN_OFF').length
      const totalCostImpact = mockVariances.reduce((sum, v) => sum + v.costImpact, 0)
      const qualityDefects = mockVariances.filter(v => v.varianceType === 'QUALITY_DEFECT').length
      const productionLosses = mockVariances.filter(v => v.varianceType === 'PRODUCTION_LOSS').length

      setStats({
        totalVariances,
        unresolvedVariances,
        totalCostImpact,
        averageVarianceRate: totalVariances > 0 ? 
          mockVariances.reduce((sum, v) => sum + Math.abs(v.variancePercentage), 0) / totalVariances : 0,
        qualityDefectRate: totalVariances > 0 ? (qualityDefects / totalVariances) * 100 : 0,
        productionLossRate: totalVariances > 0 ? (productionLosses / totalVariances) * 100 : 0
      })

    } catch (error) {
      console.error('加载数量差异数据失败:', error)
      toast.error('加载数量差异数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleResolveVariance = async () => {
    try {
      if (!selectedVariance || !resolveForm.varianceType || !resolveForm.resolution) {
        toast.error('请填写所有必填字段')
        return
      }

      // 实际应该调用API
      const response = await fetch(`/api/production/quantity-variances/${selectedVariance.id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          varianceType: resolveForm.varianceType,
          resolution: resolveForm.resolution,
          costAdjustment: parseFloat(resolveForm.costAdjustment) || 0,
          notes: resolveForm.notes,
          qualityIssues: resolveForm.qualityIssues,
          resolvedBy: 1 // TODO: 从用户会话获取
        })
      })

      if (response.ok) {
        toast.success('数量差异已解决')
        setShowResolveDialog(false)
        setSelectedVariance(null)
        setResolveForm({
          varianceType: '',
          resolution: '',
          costAdjustment: '',
          notes: '',
          qualityIssues: []
        })
        loadVariances()
      } else {
        toast.error('解决数量差异失败')
      }
    } catch (error) {
      console.error('解决数量差异失败:', error)
      toast.error('解决数量差异失败')
    }
  }

  const getVarianceTypeBadge = (type: string) => {
    const config = varianceTypeConfig[type as keyof typeof varianceTypeConfig]
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

  const getVarianceColor = (percentage: number) => {
    if (percentage === 0) return 'text-gray-600'
    if (percentage > 0) return 'text-green-600'
    if (percentage >= -5) return 'text-yellow-600'
    if (percentage >= -10) return 'text-orange-600'
    return 'text-red-600'
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
          <h1 className="text-2xl font-bold text-gray-900">数量差异管理</h1>
          <p className="text-gray-600">双地点生产流程中的数量差异检测、分析和处理</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">总差异次数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVariances}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">未解决差异</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unresolvedVariances}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">成本影响</p>
                <p className="text-2xl font-bold text-gray-900">¥{stats.totalCostImpact.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均差异率</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageVarianceRate.toFixed(1)}%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 差异记录表格 */}
      <Card>
        <CardHeader>
          <CardTitle>数量差异记录</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>转移单号</TableHead>
                <TableHead>产品</TableHead>
                <TableHead>转移路径</TableHead>
                <TableHead>预期数量</TableHead>
                <TableHead>实际数量</TableHead>
                <TableHead>差异</TableHead>
                <TableHead>差异类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>成本影响</TableHead>
                <TableHead>检测时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variances.map((variance) => (
                <TableRow key={variance.id}>
                  <TableCell className="font-medium">
                    {variance.transfer.transferNumber}
                  </TableCell>
                  <TableCell>{variance.transfer.product.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2 text-sm">
                      <span>{variance.transfer.sourceWarehouse.name}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span>{variance.transfer.targetWarehouse.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{variance.expectedQuantity}</TableCell>
                  <TableCell>{variance.actualQuantity}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={`font-medium ${getVarianceColor(variance.variancePercentage)}`}>
                        {variance.varianceQuantity > 0 ? '+' : ''}{variance.varianceQuantity}
                      </span>
                      <span className={`text-xs ${getVarianceColor(variance.variancePercentage)}`}>
                        ({variance.variancePercentage > 0 ? '+' : ''}{variance.variancePercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getVarianceTypeBadge(variance.varianceType)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(variance.status)}
                  </TableCell>
                  <TableCell>
                    <span className={variance.costImpact > 0 ? 'text-red-600' : 'text-gray-600'}>
                      ¥{variance.costImpact.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(variance.detectedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {variance.status !== 'RESOLVED' && variance.status !== 'WRITTEN_OFF' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedVariance(variance)
                          setShowResolveDialog(true)
                        }}
                      >
                        处理
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {variances.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              暂无数量差异记录
            </div>
          )}
        </CardContent>
      </Card>

      {/* 处理差异对话框 */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>处理数量差异</DialogTitle>
          </DialogHeader>
          
          {selectedVariance && (
            <div className="space-y-6">
              {/* 差异信息 */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedVariance.transfer.transferNumber}</strong> - 
                  预期 {selectedVariance.expectedQuantity} 件，实际 {selectedVariance.actualQuantity} 件，
                  差异 {selectedVariance.varianceQuantity} 件 ({selectedVariance.variancePercentage.toFixed(1)}%)
                </AlertDescription>
              </Alert>

              {/* 差异类型 */}
              <div>
                <Label htmlFor="varianceType">差异类型 *</Label>
                <Select value={resolveForm.varianceType} onValueChange={(value) => 
                  setResolveForm(prev => ({ ...prev, varianceType: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="选择差异类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(varianceTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center space-x-2">
                          <config.icon className="w-4 h-4" />
                          <div>
                            <div>{config.label}</div>
                            <div className="text-xs text-gray-500">{config.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 处理方案 */}
              <div>
                <Label htmlFor="resolution">处理方案 *</Label>
                <Select value={resolveForm.resolution} onValueChange={(value) => 
                  setResolveForm(prev => ({ ...prev, resolution: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="选择处理方案" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACCEPT_LOSS">接受损耗</SelectItem>
                    <SelectItem value="REWORK">安排返工</SelectItem>
                    <SelectItem value="SUPPLIER_CLAIM">供应商索赔</SelectItem>
                    <SelectItem value="INSURANCE_CLAIM">保险理赔</SelectItem>
                    <SelectItem value="WRITE_OFF">直接核销</SelectItem>
                    <SelectItem value="INVESTIGATE_FURTHER">进一步调查</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 成本调整 */}
              <div>
                <Label htmlFor="costAdjustment">成本调整金额</Label>
                <Input
                  id="costAdjustment"
                  type="number"
                  step="0.01"
                  value={resolveForm.costAdjustment}
                  onChange={(e) => setResolveForm(prev => ({ ...prev, costAdjustment: e.target.value }))}
                  placeholder="输入成本调整金额"
                />
              </div>

              {/* 处理说明 */}
              <div>
                <Label htmlFor="notes">处理说明</Label>
                <Textarea
                  id="notes"
                  value={resolveForm.notes}
                  onChange={(e) => setResolveForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="详细说明差异原因和处理措施"
                  rows={4}
                />
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleResolveVariance}>
                  确认处理
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
