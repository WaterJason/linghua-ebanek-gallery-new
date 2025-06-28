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
  Plus, Calculator, DollarSign, TrendingUp, Users, Clock, 
  CheckCircle, XCircle, AlertTriangle, FileText, Download 
} from 'lucide-react'
import { toast } from 'sonner'

interface PieceWorkRecord {
  id: number
  employee: { id: number; name: string }
  workDate: string
  workType: string
  location: string
  pieceCount: number
  pieceRate: number
  totalAmount: number
  qualityGrade?: string
  qualityBonus: number
  qualityPenalty: number
  status: string
  paymentStatus: string
  productionOrder?: { id: number; orderNumber: string; product: { name: string } }
  reviewedBy?: { name: string }
  reviewedAt?: string
  notes?: string
}

interface ProductionCost {
  id: number
  productionOrder: { id: number; orderNumber: string; product: { name: string } }
  costCategory: string
  costType: string
  stage: string
  location: string
  amount: number
  quantity?: number
  unitCost?: number
  employee?: { name: string }
  workType?: string
  description?: string
  recordedDate: string
  recordedByUser: { name: string }
}

interface CostAnalysis {
  totalCost: number
  costByCategory: Array<{
    category: string
    amount: number
    percentage: number
  }>
  costByStage: Array<{
    stage: string
    amount: number
    percentage: number
  }>
  costByLocation: Array<{
    location: string
    amount: number
    percentage: number
  }>
  laborCostDetails: Array<{
    employeeId: number
    employeeName: string
    workType: string
    amount: number
    hours?: number
    pieces?: number
  }>
  profitAnalysis: {
    revenue: number
    totalCost: number
    grossProfit: number
    profitMargin: number
  }
}

const workTypeConfig = {
  CLOISONNE_BLUE: { label: '点蓝工艺', color: 'bg-blue-100 text-blue-800', location: '广州' },
  ACCESSORY_WORK: { label: '配饰工艺', color: 'bg-green-100 text-green-800', location: '广州' },
  POLISHING: { label: '抛光工艺', color: 'bg-purple-100 text-purple-800', location: '广西' },
  ASSEMBLY: { label: '组装工艺', color: 'bg-yellow-100 text-yellow-800', location: '广西' },
  PACKAGING: { label: '包装工艺', color: 'bg-pink-100 text-pink-800', location: '广州' },
  QUALITY_CHECK: { label: '质量检验', color: 'bg-gray-100 text-gray-800', location: '广西' }
}

const statusConfig = {
  PENDING: { label: '待审核', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  APPROVED: { label: '已审核', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: '已拒绝', color: 'bg-red-100 text-red-800', icon: XCircle },
  PAID: { label: '已支付', color: 'bg-blue-100 text-blue-800', icon: DollarSign }
}

const paymentStatusConfig = {
  UNPAID: { label: '未支付', color: 'bg-gray-100 text-gray-800' },
  PARTIAL: { label: '部分支付', color: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: '已支付', color: 'bg-green-100 text-green-800' },
  REFUNDED: { label: '已退款', color: 'bg-red-100 text-red-800' }
}

export default function CostAccountingManagement() {
  const [activeTab, setActiveTab] = useState('piece-work')
  const [pieceWorkRecords, setPieceWorkRecords] = useState<PieceWorkRecord[]>([])
  const [productionCosts, setProductionCosts] = useState<ProductionCost[]>([])
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRecords, setSelectedRecords] = useState<number[]>([])
  const [showPieceWorkDialog, setShowPieceWorkDialog] = useState(false)
  const [showCostDialog, setShowCostDialog] = useState(false)
  const [selectedProductionOrderId, setSelectedProductionOrderId] = useState<number | null>(null)

  // 统计数据
  const [stats, setStats] = useState({
    totalPieceWorkAmount: 0,
    pendingApproval: 0,
    totalProductionCost: 0,
    avgPieceRate: 0,
    monthlyPieceWork: 0,
    qualityBonusTotal: 0
  })

  // 新建计件工资表单
  const [newPieceWork, setNewPieceWork] = useState({
    employeeId: '',
    workDate: new Date().toISOString().split('T')[0],
    workType: '',
    location: '',
    pieceCount: '',
    pieceRate: '',
    qualityGrade: '',
    qualityBonus: '',
    qualityPenalty: '',
    notes: ''
  })

  // 新建成本记录表单
  const [newCost, setNewCost] = useState({
    productionOrderId: '',
    costCategory: '',
    costType: '',
    stage: '',
    location: '',
    amount: '',
    quantity: '',
    description: '',
    employeeId: '',
    workType: '',
    materialType: '',
    supplier: ''
  })

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      
      if (activeTab === 'piece-work') {
        const response = await fetch('/api/cost-accounting/piece-work')
        if (response.ok) {
          const data = await response.json()
          setPieceWorkRecords(data.data || [])
          
          // 计算统计数据
          setStats(prev => ({
            ...prev,
            totalPieceWorkAmount: data.summary?.totalAmount || 0,
            pendingApproval: data.data?.filter((r: any) => r.status === 'PENDING').length || 0,
            avgPieceRate: data.data?.length > 0 ? data.summary?.totalAmount / data.summary?.totalPieces : 0,
            qualityBonusTotal: data.summary?.totalBonus || 0
          }))
        }
      } else if (activeTab === 'production-costs') {
        const response = await fetch('/api/cost-accounting/production-costs')
        if (response.ok) {
          const data = await response.json()
          setProductionCosts(data.data || [])
          
          setStats(prev => ({
            ...prev,
            totalProductionCost: data.summary?.totalAmount || 0
          }))
        }
      } else if (activeTab === 'analysis' && selectedProductionOrderId) {
        const response = await fetch(`/api/cost-accounting/analysis/${selectedProductionOrderId}`)
        if (response.ok) {
          const data = await response.json()
          setCostAnalysis(data)
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePieceWork = async () => {
    try {
      if (!newPieceWork.employeeId || !newPieceWork.workType || !newPieceWork.pieceCount || !newPieceWork.pieceRate) {
        toast.error('请填写所有必填字段')
        return
      }

      const response = await fetch('/api/cost-accounting/piece-work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newPieceWork,
          employeeId: parseInt(newPieceWork.employeeId),
          pieceCount: parseInt(newPieceWork.pieceCount),
          pieceRate: parseFloat(newPieceWork.pieceRate),
          qualityBonus: parseFloat(newPieceWork.qualityBonus) || 0,
          qualityPenalty: parseFloat(newPieceWork.qualityPenalty) || 0
        })
      })

      if (response.ok) {
        toast.success('计件工资记录创建成功')
        setShowPieceWorkDialog(false)
        setNewPieceWork({
          employeeId: '',
          workDate: new Date().toISOString().split('T')[0],
          workType: '',
          location: '',
          pieceCount: '',
          pieceRate: '',
          qualityGrade: '',
          qualityBonus: '',
          qualityPenalty: '',
          notes: ''
        })
        loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || '创建失败')
      }
    } catch (error) {
      console.error('创建计件工资记录失败:', error)
      toast.error('创建计件工资记录失败')
    }
  }

  const handleBatchApprove = async (action: 'approve' | 'reject' | 'pay') => {
    try {
      if (selectedRecords.length === 0) {
        toast.error('请选择要操作的记录')
        return
      }

      const response = await fetch('/api/cost-accounting/piece-work', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          recordIds: selectedRecords,
          reviewedBy: 1, // TODO: 从用户会话获取
          reviewNotes: `批量${action === 'approve' ? '审核通过' : action === 'reject' ? '拒绝' : '支付'}`
        })
      })

      if (response.ok) {
        const actionText = action === 'approve' ? '审核通过' : action === 'reject' ? '拒绝' : '支付'
        toast.success(`批量${actionText}成功`)
        setSelectedRecords([])
        loadData()
      } else {
        const error = await response.json()
        toast.error(error.error || '操作失败')
      }
    } catch (error) {
      console.error('批量操作失败:', error)
      toast.error('批量操作失败')
    }
  }

  const getWorkTypeBadge = (workType: string) => {
    const config = workTypeConfig[workType as keyof typeof workTypeConfig]
    if (!config) return <Badge variant="outline">{workType}</Badge>
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
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

  const getPaymentStatusBadge = (status: string) => {
    const config = paymentStatusConfig[status as keyof typeof paymentStatusConfig]
    if (!config) return <Badge variant="secondary">{status}</Badge>
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
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
          <h1 className="text-2xl font-bold text-gray-900">成本核算管理</h1>
          <p className="text-gray-600">计件工资管理、生产成本核算与薪酬自动计算</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">计件工资总额</p>
                <p className="text-2xl font-bold text-gray-900">¥{stats.totalPieceWorkAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">待审核记录</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApproval}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">生产成本总额</p>
                <p className="text-2xl font-bold text-gray-900">¥{stats.totalProductionCost.toFixed(2)}</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">质量奖金</p>
                <p className="text-2xl font-bold text-gray-900">¥{stats.qualityBonusTotal.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="piece-work">计件工资</TabsTrigger>
          <TabsTrigger value="production-costs">生产成本</TabsTrigger>
          <TabsTrigger value="analysis">成本分析</TabsTrigger>
          <TabsTrigger value="salary">薪酬管理</TabsTrigger>
        </TabsList>

        {/* 计件工资标签页 */}
        <TabsContent value="piece-work" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>计件工资记录</CardTitle>
                <div className="flex space-x-2">
                  {selectedRecords.length > 0 && (
                    <>
                      <Button variant="outline" onClick={() => handleBatchApprove('approve')}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        批量审核
                      </Button>
                      <Button variant="outline" onClick={() => handleBatchApprove('reject')}>
                        <XCircle className="w-4 h-4 mr-2" />
                        批量拒绝
                      </Button>
                      <Button variant="outline" onClick={() => handleBatchApprove('pay')}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        批量支付
                      </Button>
                    </>
                  )}
                  <Dialog open={showPieceWorkDialog} onOpenChange={setShowPieceWorkDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        新建记录
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>创建计件工资记录</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="employee">员工</Label>
                            <Select value={newPieceWork.employeeId} onValueChange={(value) => 
                              setNewPieceWork(prev => ({ ...prev, employeeId: value }))
                            }>
                              <SelectTrigger>
                                <SelectValue placeholder="选择员工" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">张师傅</SelectItem>
                                <SelectItem value="2">李师傅</SelectItem>
                                <SelectItem value="3">王师傅</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="workDate">工作日期</Label>
                            <Input
                              id="workDate"
                              type="date"
                              value={newPieceWork.workDate}
                              onChange={(e) => setNewPieceWork(prev => ({ ...prev, workDate: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="workType">工作类型</Label>
                            <Select value={newPieceWork.workType} onValueChange={(value) => {
                              const config = workTypeConfig[value as keyof typeof workTypeConfig]
                              setNewPieceWork(prev => ({ 
                                ...prev, 
                                workType: value,
                                location: config?.location || ''
                              }))
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="选择工作类型" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CLOISONNE_BLUE">点蓝工艺</SelectItem>
                                <SelectItem value="ACCESSORY_WORK">配饰工艺</SelectItem>
                                <SelectItem value="POLISHING">抛光工艺</SelectItem>
                                <SelectItem value="ASSEMBLY">组装工艺</SelectItem>
                                <SelectItem value="PACKAGING">包装工艺</SelectItem>
                                <SelectItem value="QUALITY_CHECK">质量检验</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="location">工作地点</Label>
                            <Input
                              id="location"
                              value={newPieceWork.location}
                              onChange={(e) => setNewPieceWork(prev => ({ ...prev, location: e.target.value }))}
                              placeholder="工作地点"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="pieceCount">完成件数</Label>
                            <Input
                              id="pieceCount"
                              type="number"
                              value={newPieceWork.pieceCount}
                              onChange={(e) => setNewPieceWork(prev => ({ ...prev, pieceCount: e.target.value }))}
                              placeholder="件数"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="pieceRate">计件单价</Label>
                            <Input
                              id="pieceRate"
                              type="number"
                              step="0.01"
                              value={newPieceWork.pieceRate}
                              onChange={(e) => setNewPieceWork(prev => ({ ...prev, pieceRate: e.target.value }))}
                              placeholder="单价"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="qualityGrade">质量等级</Label>
                            <Select value={newPieceWork.qualityGrade} onValueChange={(value) => 
                              setNewPieceWork(prev => ({ ...prev, qualityGrade: value }))
                            }>
                              <SelectTrigger>
                                <SelectValue placeholder="等级" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="A">A级</SelectItem>
                                <SelectItem value="B">B级</SelectItem>
                                <SelectItem value="C">C级</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="qualityBonus">质量奖金</Label>
                            <Input
                              id="qualityBonus"
                              type="number"
                              step="0.01"
                              value={newPieceWork.qualityBonus}
                              onChange={(e) => setNewPieceWork(prev => ({ ...prev, qualityBonus: e.target.value }))}
                              placeholder="奖金"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="qualityPenalty">质量扣款</Label>
                            <Input
                              id="qualityPenalty"
                              type="number"
                              step="0.01"
                              value={newPieceWork.qualityPenalty}
                              onChange={(e) => setNewPieceWork(prev => ({ ...prev, qualityPenalty: e.target.value }))}
                              placeholder="扣款"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="notes">备注</Label>
                          <Textarea
                            id="notes"
                            value={newPieceWork.notes}
                            onChange={(e) => setNewPieceWork(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="输入备注信息"
                            rows={3}
                          />
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowPieceWorkDialog(false)}>
                            取消
                          </Button>
                          <Button onClick={handleCreatePieceWork}>
                            创建记录
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedRecords.length === pieceWorkRecords.length && pieceWorkRecords.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRecords(pieceWorkRecords.map(r => r.id))
                          } else {
                            setSelectedRecords([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>员工</TableHead>
                    <TableHead>工作类型</TableHead>
                    <TableHead>工作地点</TableHead>
                    <TableHead>完成件数</TableHead>
                    <TableHead>计件单价</TableHead>
                    <TableHead>总金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>支付状态</TableHead>
                    <TableHead>工作日期</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pieceWorkRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(record.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRecords(prev => [...prev, record.id])
                            } else {
                              setSelectedRecords(prev => prev.filter(id => id !== record.id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {record.employee.name}
                      </TableCell>
                      <TableCell>
                        {getWorkTypeBadge(record.workType)}
                      </TableCell>
                      <TableCell>{record.location}</TableCell>
                      <TableCell>{record.pieceCount}</TableCell>
                      <TableCell>¥{record.pieceRate.toFixed(2)}</TableCell>
                      <TableCell className="font-medium">
                        ¥{record.totalAmount.toFixed(2)}
                        {(record.qualityBonus > 0 || record.qualityPenalty > 0) && (
                          <div className="text-xs text-gray-500">
                            {record.qualityBonus > 0 && `+¥${record.qualityBonus.toFixed(2)}`}
                            {record.qualityPenalty > 0 && `-¥${record.qualityPenalty.toFixed(2)}`}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(record.paymentStatus)}
                      </TableCell>
                      <TableCell>
                        {new Date(record.workDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {pieceWorkRecords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  暂无计件工资记录
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 生产成本标签页 */}
        <TabsContent value="production-costs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>生产成本记录</CardTitle>
                <Dialog open={showCostDialog} onOpenChange={setShowCostDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      新建成本
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>创建生产成本记录</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="productionOrder">生产订单</Label>
                        <Select value={newCost.productionOrderId} onValueChange={(value) =>
                          setNewCost(prev => ({ ...prev, productionOrderId: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="选择生产订单" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">PO-2024-001</SelectItem>
                            <SelectItem value="2">PO-2024-002</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="costCategory">成本类别</Label>
                          <Select value={newCost.costCategory} onValueChange={(value) =>
                            setNewCost(prev => ({ ...prev, costCategory: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue placeholder="选择类别" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DIRECT_MATERIAL">直接材料</SelectItem>
                              <SelectItem value="DIRECT_LABOR">直接人工</SelectItem>
                              <SelectItem value="MANUFACTURING_OVERHEAD">制造费用</SelectItem>
                              <SelectItem value="SHIPPING_COST">物流费用</SelectItem>
                              <SelectItem value="QUALITY_COST">质量成本</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="stage">生产阶段</Label>
                          <Select value={newCost.stage} onValueChange={(value) =>
                            setNewCost(prev => ({ ...prev, stage: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue placeholder="选择阶段" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DESIGN">设计</SelectItem>
                              <SelectItem value="MATERIAL_PROCUREMENT">采购</SelectItem>
                              <SelectItem value="IN_PRODUCTION">制作</SelectItem>
                              <SelectItem value="QUALITY_CHECK">质检</SelectItem>
                              <SelectItem value="PACKAGING">包装</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="location">发生地点</Label>
                          <Select value={newCost.location} onValueChange={(value) =>
                            setNewCost(prev => ({ ...prev, location: value }))
                          }>
                            <SelectTrigger>
                              <SelectValue placeholder="选择地点" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="广州设计中心">广州设计中心</SelectItem>
                              <SelectItem value="广西生产基地">广西生产基地</SelectItem>
                              <SelectItem value="广州包装中心">广州包装中心</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="amount">金额</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={newCost.amount}
                            onChange={(e) => setNewCost(prev => ({ ...prev, amount: e.target.value }))}
                            placeholder="成本金额"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">描述</Label>
                        <Textarea
                          id="description"
                          value={newCost.description}
                          onChange={(e) => setNewCost(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="成本描述"
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowCostDialog(false)}>
                          取消
                        </Button>
                        <Button onClick={() => {
                          // TODO: 实现创建成本记录
                          toast.success('成本记录创建成功')
                          setShowCostDialog(false)
                        }}>
                          创建记录
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>生产订单</TableHead>
                    <TableHead>成本类别</TableHead>
                    <TableHead>生产阶段</TableHead>
                    <TableHead>发生地点</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>单位成本</TableHead>
                    <TableHead>记录时间</TableHead>
                    <TableHead>记录人</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productionCosts.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell className="font-medium">
                        {cost.productionOrder.orderNumber}
                        <div className="text-xs text-gray-500">
                          {cost.productionOrder.product.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {cost.costCategory}
                        </Badge>
                      </TableCell>
                      <TableCell>{cost.stage}</TableCell>
                      <TableCell>{cost.location}</TableCell>
                      <TableCell className="font-medium">
                        ¥{cost.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{cost.quantity || '-'}</TableCell>
                      <TableCell>
                        {cost.unitCost ? `¥${cost.unitCost.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(cost.recordedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{cost.recordedByUser.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {productionCosts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  暂无生产成本记录
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 成本分析标签页 */}
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>成本分析</CardTitle>
                <div className="flex space-x-2">
                  <Select value={selectedProductionOrderId?.toString() || ''} onValueChange={(value) => {
                    setSelectedProductionOrderId(parseInt(value))
                    loadData()
                  }}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="选择生产订单" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">PO-2024-001</SelectItem>
                      <SelectItem value="2">PO-2024-002</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    导出报告
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {costAnalysis ? (
                <div className="space-y-6">
                  {/* 利润分析 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">总收入</p>
                          <p className="text-xl font-bold text-green-600">
                            ¥{costAnalysis.profitAnalysis.revenue.toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">总成本</p>
                          <p className="text-xl font-bold text-red-600">
                            ¥{costAnalysis.profitAnalysis.totalCost.toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">毛利润</p>
                          <p className="text-xl font-bold text-blue-600">
                            ¥{costAnalysis.profitAnalysis.grossProfit.toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">利润率</p>
                          <p className="text-xl font-bold text-purple-600">
                            {costAnalysis.profitAnalysis.profitMargin.toFixed(1)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 成本分类分析 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>按类别分析</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {costAnalysis.costByCategory.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <span className="font-medium">{item.category}</span>
                              <div className="text-right">
                                <div className="font-bold">¥{item.amount.toFixed(2)}</div>
                                <div className="text-sm text-gray-500">{item.percentage.toFixed(1)}%</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>按阶段分析</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {costAnalysis.costByStage.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <span className="font-medium">{item.stage}</span>
                              <div className="text-right">
                                <div className="font-bold">¥{item.amount.toFixed(2)}</div>
                                <div className="text-sm text-gray-500">{item.percentage.toFixed(1)}%</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 人工成本详情 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>人工成本详情</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>员工</TableHead>
                            <TableHead>工作类型</TableHead>
                            <TableHead>工作时长</TableHead>
                            <TableHead>完成件数</TableHead>
                            <TableHead>成本金额</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {costAnalysis.laborCostDetails.map((detail, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{detail.employeeName}</TableCell>
                              <TableCell>{detail.workType}</TableCell>
                              <TableCell>{detail.hours ? `${detail.hours}小时` : '-'}</TableCell>
                              <TableCell>{detail.pieces ? `${detail.pieces}件` : '-'}</TableCell>
                              <TableCell className="font-medium">¥{detail.amount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  请选择生产订单查看成本分析
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 薪酬管理标签页 */}
        <TabsContent value="salary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>薪酬管理</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                薪酬管理功能开发中...
                <br />
                将集成计件工资自动计算和发放功能
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
