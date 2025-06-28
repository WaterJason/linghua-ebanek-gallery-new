"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QuickActionModal } from "@/components/quick-action-modals"
import {
  ShoppingCartIcon,
  DollarSignIcon,
  UsersIcon,
  StoreIcon,
  CreditCardIcon,
  PackageIcon,
  CalendarIcon,
  CoffeeIcon,
  PlusIcon,
  FileTextIcon,
  UserPlusIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickActionItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  color: string
  category: "sales" | "finance" | "inventory" | "hr" | "other"
  useModal?: boolean // 是否使用弹窗模式
}

const quickActions: QuickActionItem[] = [
  {
    id: "new-sales-order",
    title: "新建销售订单",
    description: "创建新的销售订单",
    icon: <ShoppingCartIcon className="w-6 h-6" />,
    href: "/sales/orders/new",
    color: "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:hover:bg-indigo-800 dark:text-indigo-300",
    category: "sales",
    useModal: true
  },
  {
    id: "record-income",
    title: "录入收款",
    description: "记录收入和付款",
    icon: <DollarSignIcon className="w-6 h-6" />,
    href: "/finance?tab=transactions",
    color: "bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-300",
    category: "finance",
    useModal: true
  },
  {
    id: "add-customer",
    title: "新增客户",
    description: "添加新客户信息",
    icon: <UsersIcon className="w-6 h-6" />,
    href: "/customers?action=new",
    color: "bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-300",
    category: "sales",
    useModal: true
  },
  {
    id: "quick-pos",
    title: "POS快速销售",
    description: "快速销售和结账",
    icon: <StoreIcon className="w-6 h-6" />,
    href: "/sales/pos",
    color: "bg-purple-50 hover:bg-purple-100 text-purple-600 dark:bg-purple-900 dark:hover:bg-purple-800 dark:text-purple-300",
    category: "sales",
    useModal: true
  },
  {
    id: "record-expense",
    title: "录入支出",
    description: "记录费用和支出",
    icon: <CreditCardIcon className="w-6 h-6" />,
    href: "/finance?tab=transactions",
    color: "bg-orange-50 hover:bg-orange-100 text-orange-600 dark:bg-orange-900 dark:hover:bg-orange-800 dark:text-orange-300",
    category: "finance",
    useModal: true
  },
  {
    id: "add-product",
    title: "新增产品",
    description: "添加新产品到库存",
    icon: <PackageIcon className="w-6 h-6" />,
    href: "/products?action=new",
    color: "bg-cyan-50 hover:bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:hover:bg-cyan-800 dark:text-cyan-300",
    category: "inventory",
    useModal: true
  },
  {
    id: "schedule-workshop",
    title: "安排手作团建",
    description: "创建新的团建活动",
    icon: <CalendarIcon className="w-6 h-6" />,
    href: "/workshops?action=new",
    color: "bg-pink-50 hover:bg-pink-100 text-pink-600 dark:bg-pink-900 dark:hover:bg-pink-800 dark:text-pink-300",
    category: "other",
    useModal: true
  },
  {
    id: "coffee-sales",
    title: "咖啡店销售",
    description: "记录咖啡店销售",
    icon: <CoffeeIcon className="w-6 h-6" />,
    href: "/daily-log?tab=coffee",
    color: "bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-900 dark:hover:bg-amber-800 dark:text-amber-300",
    category: "sales",
    useModal: true
  },
  {
    id: "add-employee",
    title: "新增员工",
    description: "添加新员工信息",
    icon: <UserPlusIcon className="w-6 h-6" />,
    href: "/employees?action=new",
    color: "bg-teal-50 hover:bg-teal-100 text-teal-600 dark:bg-teal-900 dark:hover:bg-teal-800 dark:text-teal-300",
    category: "hr",
    useModal: true
  }
]

interface ModernQuickActionsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModernQuickActions({
  open,
  onOpenChange
}: ModernQuickActionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [modalType, setModalType] = useState<string>("")
  const [modalOpen, setModalOpen] = useState(false)

  const categories = [
    { id: "all", name: "全部", icon: <PlusIcon className="w-4 h-4" /> },
    { id: "sales", name: "销售", icon: <ShoppingCartIcon className="w-4 h-4" /> },
    { id: "finance", name: "财务", icon: <DollarSignIcon className="w-4 h-4" /> },
    { id: "inventory", name: "库存", icon: <PackageIcon className="w-4 h-4" /> },
    { id: "hr", name: "人事", icon: <UsersIcon className="w-4 h-4" /> },
    { id: "other", name: "其他", icon: <FileTextIcon className="w-4 h-4" /> },
  ]

  const filteredActions = selectedCategory === "all"
    ? quickActions
    : quickActions.filter(action => action.category === selectedCategory)

  const handleActionClick = (action: QuickActionItem) => {
    if (action.useModal) {
      setModalType(action.id)
      setModalOpen(true)
    } else {
      onOpenChange(false)
      // 对于非弹窗模式，将通过Link组件处理导航
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
            <PlusIcon className="w-6 h-6 mr-2 text-indigo-600" />
            快速操作 / 日常录入
          </DialogTitle>
        </DialogHeader>

        {/* 分类筛选 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "flex items-center space-x-2 transition-all duration-200",
                selectedCategory === category.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              {category.icon}
              <span>{category.name}</span>
            </Button>
          ))}
        </div>

        {/* 快速操作网格 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredActions.map((action) => (
            action.useModal ? (
              <div
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-600 hover:shadow-lg hover:-translate-y-1 cursor-pointer",
                  action.color
                )}
              >
                <div className="mb-3">
                  {action.icon}
                </div>
                <h3 className="text-sm font-medium text-center mb-1">
                  {action.title}
                </h3>
                <p className="text-xs text-center opacity-75">
                  {action.description}
                </p>
              </div>
            ) : (
              <Link
                key={action.id}
                href={action.href}
                onClick={() => handleActionClick(action)}
                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-600 hover:shadow-lg hover:-translate-y-1",
                  action.color
                )}
              >
                <div className="mb-3">
                  {action.icon}
                </div>
                <h3 className="text-sm font-medium text-center mb-1">
                  {action.title}
                </h3>
                <p className="text-xs text-center opacity-75">
                  {action.description}
                </p>
              </Link>
            )
          ))}
        </div>

        {filteredActions.length === 0 && (
          <div className="text-center py-12">
            <PlusIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">
              该分类下暂无快速操作
            </p>
          </div>
        )}
      </DialogContent>

      {/* 快速操作弹窗 */}
      <QuickActionModal
        type={modalType}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) {
            setModalType("")
          }
        }}
      />
    </Dialog>
  )
}
