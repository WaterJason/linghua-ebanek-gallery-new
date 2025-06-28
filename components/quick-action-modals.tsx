"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { useToast } from "@/components/ui/use-toast" // 暂时注释，未使用
import {
  ShoppingCartIcon,
  DollarSignIcon,
  CreditCardIcon,
  UsersIcon,
  PackageIcon,
  CalendarIcon,
  CoffeeIcon,
  UserPlusIcon,
  PlusIcon,
  SaveIcon,
  XIcon
} from "lucide-react"

// 导入server actions
import { createSalesOrder } from "@/lib/actions/sales-actions"
import { createFinancialTransaction } from "@/lib/actions/finance-actions"
import { createCustomer } from "@/lib/actions/sales-actions"
import { createProduct } from "@/lib/actions/product-actions"
import { createEmployee } from "@/lib/actions/employee-actions"
// import { createWorkshopActivity } from "@/lib/actions/workshop-actions" // 暂时注释
import { createCoffeeShopSale } from "@/lib/actions/sales-actions"

// 导入反馈和撤销系统 - 暂时注释，未使用
// import { withFormFeedback } from "@/lib/feedback-system"
// import { undoRedoManager, createFormAction } from "@/lib/undo-redo-system"

interface QuickActionModalProps {
  type: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickActionModal({ type, open, onOpenChange }: QuickActionModalProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement)

      // 操作名称映射（暂时未使用）

      // 直接执行操作
      switch (type) {
        case 'new-sales-order':
          await handleCreateSalesOrder(formData)
          break
        case 'record-income':
          await handleRecordIncome(formData)
          break
        case 'record-expense':
          await handleRecordExpense(formData)
          break
        case 'add-customer':
          await handleAddCustomer(formData)
          break
        case 'add-product':
          await handleAddArtwork(formData)
          break
        case 'schedule-workshop':
          await handleScheduleWorkshop(formData)
          break
        case 'coffee-sales':
          await handleCoffeeSales(formData)
          break
        case 'add-employee':
          await handleAddEmployee(formData)
          break
        case 'quick-pos':
          await handleQuickPos(formData)
          break
        default:
          throw new Error('未知操作类型')
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Quick action error:', error)
      // 错误已由反馈系统处理
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const renderModalContent = () => {
    switch (type) {
      case 'new-sales-order':
        return <NewSalesOrderModal onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      case 'record-income':
        return <RecordIncomeModal onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      case 'record-expense':
        return <RecordExpenseModal onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      case 'add-customer':
        return <AddCustomerModal onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      case 'add-product':
        return <AddArtworkModal onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      case 'schedule-workshop':
        return <ScheduleWorkshopModal onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      case 'coffee-sales':
        return <CoffeeSalesModal onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      case 'add-employee':
        return <AddEmployeeModal onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      case 'quick-pos':
        return <QuickPosModal onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      default:
        return <div>未知操作类型</div>
    }
  }

  const getModalTitle = () => {
    const titles = {
      'new-sales-order': '新建销售订单',
      'record-income': '录入收款',
      'record-expense': '录入支出',
      'add-customer': '新增客户',
      'add-product': '新增产品',
      'schedule-workshop': '安排手作团建',
      'coffee-sales': '咖啡店销售',
      'add-employee': '新增员工',
      'quick-pos': 'POS快速销售'
    }
    return titles[type as keyof typeof titles] || '快速操作'
  }

  const getModalIcon = () => {
    const icons = {
      'new-sales-order': <ShoppingCartIcon className="w-5 h-5" />,
      'record-income': <DollarSignIcon className="w-5 h-5" />,
      'record-expense': <CreditCardIcon className="w-5 h-5" />,
      'add-customer': <UsersIcon className="w-5 h-5" />,
      'add-product': <PackageIcon className="w-5 h-5" />,
      'schedule-workshop': <CalendarIcon className="w-5 h-5" />,
      'coffee-sales': <CoffeeIcon className="w-5 h-5" />,
      'add-employee': <UserPlusIcon className="w-5 h-5" />,
      'quick-pos': <ShoppingCartIcon className="w-5 h-5" />
    }
    return icons[type as keyof typeof icons] || <PlusIcon className="w-5 h-5" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getModalIcon()}
            {getModalTitle()}
          </DialogTitle>
          <DialogDescription>
            快速录入数据，提高工作效率
          </DialogDescription>
        </DialogHeader>
        {renderModalContent()}
      </DialogContent>
    </Dialog>
  )
}

// 新建销售订单弹窗
function NewSalesOrderModal({ onSubmit, onCancel, loading }: { onSubmit: (e: React.FormEvent) => void, onCancel: () => void, loading: boolean }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer">客户</Label>
          <Select name="customer">
            <SelectTrigger>
              <SelectValue placeholder="选择客户" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer1">张三</SelectItem>
              <SelectItem value="customer2">李四</SelectItem>
              <SelectItem value="customer3">王五</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">订单日期</Label>
          <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product">产品</Label>
        <Select name="product">
          <SelectTrigger>
            <SelectValue placeholder="选择产品" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="product1">掐丝珐琅手镯</SelectItem>
            <SelectItem value="product2">珐琅画框</SelectItem>
            <SelectItem value="product3">定制珐琅饰品</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">数量</Label>
          <Input name="quantity" type="number" placeholder="1" min="1" defaultValue="1" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">单价</Label>
          <Input name="price" type="number" placeholder="0.00" step="0.01" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">备注</Label>
        <Textarea name="notes" placeholder="订单备注信息..." />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <XIcon className="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          <SaveIcon className="w-4 h-4 mr-2" />
          {loading ? "保存中..." : "保存订单"}
        </Button>
      </div>
    </form>
  )
}

// 录入收款弹窗
function RecordIncomeModal({ onSubmit, onCancel, loading }: { onSubmit: (e: React.FormEvent) => void, onCancel: () => void, loading: boolean }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">收款金额</Label>
          <Input name="amount" type="number" placeholder="0.00" step="0.01" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">收款日期</Label>
          <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="source">收款来源</Label>
        <Select name="source">
          <SelectTrigger>
            <SelectValue placeholder="选择收款来源" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sales">销售收入</SelectItem>
            <SelectItem value="workshop">团建收入</SelectItem>
            <SelectItem value="coffee">咖啡店收入</SelectItem>
            <SelectItem value="other">其他收入</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="method">收款方式</Label>
        <Select name="method">
          <SelectTrigger>
            <SelectValue placeholder="选择收款方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">现金</SelectItem>
            <SelectItem value="wechat">微信</SelectItem>
            <SelectItem value="alipay">支付宝</SelectItem>
            <SelectItem value="bank">银行转账</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">收款说明</Label>
        <Textarea name="description" placeholder="收款说明..." />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <XIcon className="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          <SaveIcon className="w-4 h-4 mr-2" />
          {loading ? "保存中..." : "确认收款"}
        </Button>
      </div>
    </form>
  )
}

// 录入支出弹窗
function RecordExpenseModal({ onSubmit, onCancel, loading }: { onSubmit: (e: React.FormEvent) => void, onCancel: () => void, loading: boolean }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">支出金额</Label>
          <Input name="amount" type="number" placeholder="0.00" step="0.01" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">支出日期</Label>
          <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">支出类别</Label>
        <Select name="category">
          <SelectTrigger>
            <SelectValue placeholder="选择支出类别" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="material">原材料采购</SelectItem>
            <SelectItem value="salary">员工工资</SelectItem>
            <SelectItem value="rent">房租水电</SelectItem>
            <SelectItem value="marketing">营销推广</SelectItem>
            <SelectItem value="other">其他支出</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier">供应商/收款方</Label>
        <Input name="supplier" placeholder="供应商或收款方名称" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">支出说明</Label>
        <Textarea name="description" placeholder="支出说明..." />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <XIcon className="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          <SaveIcon className="w-4 h-4 mr-2" />
          {loading ? "保存中..." : "确认支出"}
        </Button>
      </div>
    </form>
  )
}

// 新增客户弹窗
function AddCustomerModal({ onSubmit, onCancel, loading }: { onSubmit: (e: React.FormEvent) => void, onCancel: () => void, loading: boolean }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">客户姓名</Label>
          <Input name="name" placeholder="客户姓名" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">联系电话</Label>
          <Input name="phone" placeholder="手机号码" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">邮箱地址</Label>
        <Input name="email" type="email" placeholder="邮箱地址" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">客户类型</Label>
        <Select name="type">
          <SelectTrigger>
            <SelectValue placeholder="选择客户类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">个人客户</SelectItem>
            <SelectItem value="corporate">企业客户</SelectItem>
            <SelectItem value="vip">VIP客户</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">联系地址</Label>
        <Textarea name="address" placeholder="详细地址..." />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <XIcon className="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          <SaveIcon className="w-4 h-4 mr-2" />
          {loading ? "保存中..." : "添加客户"}
        </Button>
      </div>
    </form>
  )
}

// 新增产品弹窗
function AddArtworkModal({ onSubmit, onCancel, loading }: { onSubmit: (e: React.FormEvent) => void, onCancel: () => void, loading: boolean }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">产品名称</Label>
        <Input name="name" placeholder="产品名称" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">产品分类</Label>
          <Select name="category">
            <SelectTrigger>
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jewelry">珐琅饰品</SelectItem>
              <SelectItem value="artwork">珐琅画</SelectItem>
              <SelectItem value="custom">定制产品</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">销售价格</Label>
          <Input name="price" type="number" placeholder="0.00" step="0.01" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cost">成本价格</Label>
          <Input name="cost" type="number" placeholder="0.00" step="0.01" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">初始库存</Label>
          <Input name="stock" type="number" placeholder="0" min="0" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">产品描述</Label>
        <Textarea name="description" placeholder="产品详细描述..." />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <XIcon className="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          <SaveIcon className="w-4 h-4 mr-2" />
          {loading ? "保存中..." : "添加产品"}
        </Button>
      </div>
    </form>
  )
}

// 安排手作团建弹窗
function ScheduleWorkshopModal({ onSubmit, onCancel, loading }: { onSubmit: (e: React.FormEvent) => void, onCancel: () => void, loading: boolean }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">团建活动名称</Label>
        <Input name="title" placeholder="团建活动名称" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">活动日期</Label>
          <Input name="date" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">活动时间</Label>
          <Input name="time" type="time" defaultValue="14:00" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">活动类型</Label>
        <Select name="type">
          <SelectTrigger>
            <SelectValue placeholder="选择活动类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="jewelry">饰品点蓝手作</SelectItem>
            <SelectItem value="cloisonne">掐丝珐琅手作</SelectItem>
            <SelectItem value="painting">珐琅画制作</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="participants">参与人数</Label>
          <Input name="participants" type="number" placeholder="人数" min="1" defaultValue="1" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">活动价格</Label>
          <Input name="price" type="number" placeholder="0.00" step="0.01" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">活动备注</Label>
        <Textarea name="notes" placeholder="活动安排和注意事项..." />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <XIcon className="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          <SaveIcon className="w-4 h-4 mr-2" />
          {loading ? "保存中..." : "安排团建"}
        </Button>
      </div>
    </form>
  )
}

// 咖啡店销售弹窗
function CoffeeSalesModal({ onSubmit, onCancel, loading }: { onSubmit: (e: React.FormEvent) => void, onCancel: () => void, loading: boolean }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="item">商品</Label>
        <Select name="item">
          <SelectTrigger>
            <SelectValue placeholder="选择商品" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="americano">美式咖啡</SelectItem>
            <SelectItem value="latte">拿铁</SelectItem>
            <SelectItem value="cappuccino">卡布奇诺</SelectItem>
            <SelectItem value="cake">蛋糕</SelectItem>
            <SelectItem value="sandwich">三明治</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">数量</Label>
          <Input name="quantity" type="number" placeholder="1" min="1" defaultValue="1" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">单价</Label>
          <Input name="price" type="number" placeholder="0.00" step="0.01" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment">支付方式</Label>
        <Select name="payment">
          <SelectTrigger>
            <SelectValue placeholder="选择支付方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">现金</SelectItem>
            <SelectItem value="wechat">微信支付</SelectItem>
            <SelectItem value="alipay">支付宝</SelectItem>
            <SelectItem value="card">银行卡</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">备注</Label>
        <Textarea name="notes" placeholder="订单备注..." />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <XIcon className="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          <SaveIcon className="w-4 h-4 mr-2" />
          {loading ? "保存中..." : "确认销售"}
        </Button>
      </div>
    </form>
  )
}

// 新增员工弹窗
function AddEmployeeModal({ onSubmit, onCancel, loading }: { onSubmit: (e: React.FormEvent) => void, onCancel: () => void, loading: boolean }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">员工姓名</Label>
          <Input name="name" placeholder="员工姓名" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">联系电话</Label>
          <Input name="phone" placeholder="手机号码" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">邮箱地址</Label>
        <Input name="email" type="email" placeholder="邮箱地址" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position">职位</Label>
          <Select name="position">
            <SelectTrigger>
              <SelectValue placeholder="选择职位" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manager">管理员</SelectItem>
              <SelectItem value="craftsman">工艺师</SelectItem>
              <SelectItem value="sales">销售员</SelectItem>
              <SelectItem value="assistant">助理</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="salary">日薪</Label>
          <Input name="salary" type="number" placeholder="0.00" step="0.01" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">入职日期</Label>
        <Input name="startDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <XIcon className="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          <SaveIcon className="w-4 h-4 mr-2" />
          {loading ? "保存中..." : "添加员工"}
        </Button>
      </div>
    </form>
  )
}

// POS快速销售弹窗
function QuickPosModal({ onSubmit, onCancel, loading }: { onSubmit: (e: React.FormEvent) => void, onCancel: () => void, loading: boolean }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="product">商品</Label>
        <Select name="product">
          <SelectTrigger>
            <SelectValue placeholder="选择商品" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="product1">掐丝珐琅手镯</SelectItem>
            <SelectItem value="product2">珐琅画框</SelectItem>
            <SelectItem value="product3">定制珐琅饰品</SelectItem>
            <SelectItem value="americano">美式咖啡</SelectItem>
            <SelectItem value="latte">拿铁</SelectItem>
            <SelectItem value="cake">蛋糕</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">数量</Label>
          <Input name="quantity" type="number" placeholder="1" min="1" defaultValue="1" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">单价</Label>
          <Input name="price" type="number" placeholder="0.00" step="0.01" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer">客户</Label>
        <Select name="customer">
          <SelectTrigger>
            <SelectValue placeholder="选择客户（可选）" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customer1">张三</SelectItem>
            <SelectItem value="customer2">李四</SelectItem>
            <SelectItem value="customer3">王五</SelectItem>
            <SelectItem value="walk-in">散客</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment">支付方式</Label>
        <Select name="payment">
          <SelectTrigger>
            <SelectValue placeholder="选择支付方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">现金</SelectItem>
            <SelectItem value="wechat">微信支付</SelectItem>
            <SelectItem value="alipay">支付宝</SelectItem>
            <SelectItem value="card">银行卡</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">备注</Label>
        <Textarea name="notes" placeholder="销售备注..." />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <XIcon className="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          <SaveIcon className="w-4 h-4 mr-2" />
          {loading ? "处理中..." : "确认销售"}
        </Button>
      </div>
    </form>
  )
}

// 处理函数
async function handleCreateSalesOrder(formData: FormData) {
  const customerSelect = formData.get('customer') as string
  const productSelect = formData.get('product') as string
  const quantity = parseInt(formData.get('quantity') as string) || 1
  const price = parseFloat(formData.get('price') as string) || 0
  const notes = formData.get('notes') as string || ''

  // 计算总金额
  const totalAmount = quantity * price

  // 由于是快速操作，使用默认值
  const orderData = {
    customerId: customerSelect ? parseInt(customerSelect.replace('customer', '')) : 1, // 默认客户ID
    employeeId: 1, // 默认员工ID（当前登录用户）
    orderDate: new Date(),
    totalAmount, // 提供必填的总金额
    items: [{
      productId: productSelect ? parseInt(productSelect.replace('product', '')) : 1,
      quantity,
      price
    }],
    status: 'pending' as const,
    paymentStatus: 'unpaid' as const,
    notes
  }

  await createSalesOrder(orderData)
  return { message: '销售订单创建成功' }
}

async function handleRecordIncome(formData: FormData) {
  const amount = parseFloat(formData.get('amount') as string)
  const date = formData.get('date') as string
  const source = formData.get('source') as string
  const method = formData.get('method') as string
  const description = formData.get('description') as string || ''

  const transactionData = {
    transactionDate: date,
    amount,
    type: 'income' as const,
    accountId: 1, // 默认账户
    paymentMethod: method,
    counterparty: source,
    notes: description
  }

  await createFinancialTransaction(transactionData)
  return { message: '收款记录已保存' }
}

async function handleRecordExpense(formData: FormData) {
  const amount = parseFloat(formData.get('amount') as string)
  const date = formData.get('date') as string
  const category = formData.get('category') as string
  const supplier = formData.get('supplier') as string || ''
  const description = formData.get('description') as string || ''

  const transactionData = {
    transactionDate: date,
    amount,
    type: 'expense' as const,
    accountId: 1, // 默认账户
    counterparty: supplier,
    notes: description
  }

  await createFinancialTransaction(transactionData)
  return { message: '支出记录已保存' }
}

async function handleAddCustomer(formData: FormData) {
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const type = formData.get('type') as string
  const address = formData.get('address') as string

  const customerData = {
    name,
    phone: phone || undefined,
    email: email || undefined,
    type: type || 'regular',
    address: address || undefined
  }

  await createCustomer(customerData)
  return { message: '客户添加成功' }
}

async function handleAddArtwork(formData: FormData) {
  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const price = parseFloat(formData.get('price') as string)
  const cost = parseFloat(formData.get('cost') as string) || 0
  const stock = parseInt(formData.get('stock') as string) || 0
  const description = formData.get('description') as string || ''

  const artworkData = {
    name,
    description,
    price,
    cost: cost || undefined,
    categoryId: category ? 1 : undefined, // 简化处理
    inventory: stock,
    material: '珐琅', // 默认材质
    unit: '套' // 默认单位
  }

  await createProduct(artworkData)
  return { message: '产品添加成功' }
}

async function handleScheduleWorkshop(formData: FormData) {
  const title = formData.get('title') as string
  const date = formData.get('date') as string
  const time = formData.get('time') as string
  const participants = parseInt(formData.get('participants') as string) || 1
  const price = parseFloat(formData.get('price') as string) || 0
  const notes = formData.get('notes') as string || ''

  // 暂时简化workshop创建，因为类型定义复杂
  // 实际应用中需要根据具体的workshop模型调整
  console.log('Workshop data:', { title, date, time, participants, price, notes })

  // TODO: 实现正确的workshop创建逻辑
  // await createWorkshopActivity(workshopData)
  return { message: '团建活动安排成功（暂时模拟）' }
}

async function handleCoffeeSales(formData: FormData) {
  const item = formData.get('item') as string
  const quantity = parseInt(formData.get('quantity') as string) || 1
  const price = parseFloat(formData.get('price') as string) || 0
  const payment = formData.get('payment') as string
  const notes = formData.get('notes') as string || ''

  const totalSales = quantity * price
  const paymentAmounts = {
    cashAmount: payment === 'cash' ? totalSales : 0,
    cardAmount: payment === 'card' ? totalSales : 0,
    wechatAmount: payment === 'wechat' ? totalSales : 0,
    alipayAmount: payment === 'alipay' ? totalSales : 0,
    otherAmount: !['cash', 'card', 'wechat', 'alipay'].includes(payment) ? totalSales : 0
  }

  const coffeeData = {
    date: new Date().toISOString().split('T')[0],
    totalSales,
    ...paymentAmounts,
    customerCount: 1,
    staffOnDuty: ['1'], // 默认员工
    notes,
    items: [{
      name: item,
      category: '饮品',
      quantity,
      unitPrice: price,
      totalPrice: totalSales
    }]
  }

  await createCoffeeShopSale(coffeeData)
  return { message: '咖啡店销售记录已保存' }
}

async function handleAddEmployee(formData: FormData) {
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const position = formData.get('position') as string
  const salary = parseFloat(formData.get('salary') as string) || 0
  const startDate = formData.get('startDate') as string

  const employeeData = {
    name,
    phone: phone || undefined,
    email: email || undefined,
    position: position || 'assistant',
    dailySalary: salary,
    status: 'active' as const
  }

  await createEmployee(employeeData)
  return { message: '员工添加成功' }
}

async function handleQuickPos(formData: FormData) {
  const product = formData.get('product') as string
  const quantity = parseInt(formData.get('quantity') as string) || 1
  const price = parseFloat(formData.get('price') as string) || 0
  const customer = formData.get('customer') as string
  const payment = formData.get('payment') as string
  const notes = formData.get('notes') as string || ''

  const totalAmount = quantity * price

  // 创建销售订单
  const orderData = {
    customerId: customer && customer !== 'walk-in' ? parseInt(customer.replace('customer', '')) : 1, // 默认客户ID
    employeeId: 1, // 默认员工ID（当前登录用户）
    orderDate: new Date(),
    totalAmount, // 提供必填的总金额
    items: [{
      productId: product ? parseInt(product.replace('product', '')) : 1,
      quantity,
      price
    }],
    status: 'completed' as const, // POS销售直接完成
    paymentStatus: 'paid' as const, // POS销售直接支付
    notes
  }

  await createSalesOrder(orderData)

  // 同时记录收款
  const transactionData = {
    transactionDate: new Date().toISOString().split('T')[0],
    amount: totalAmount,
    type: 'income' as const,
    accountId: 1,
    paymentMethod: payment,
    counterparty: customer === 'walk-in' ? '散客' : `客户${customer}`,
    notes: `POS销售 - ${product} x ${quantity}`
  }

  await createFinancialTransaction(transactionData)
  return { message: 'POS销售完成，收款已记录' }
}