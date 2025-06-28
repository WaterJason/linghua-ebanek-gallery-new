"use client"

import { ModernPageContainer } from "@/components/modern-page-container"
import { FavoriteButton } from "@/components/personalization/favorite-button"
import { FavoritesManager } from "@/components/personalization/favorites-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  StarIcon, 
  HeartIcon, 
  BookmarkIcon,
  FileTextIcon,
  SearchIcon,
  PlayIcon,
  SettingsIcon
} from "lucide-react"

export default function TestFavoritesPage() {
  return (
    <ModernPageContainer
      title="收藏功能测试"
      description="测试收藏功能的各种使用场景"
      breadcrumbs={[
        { label: "首页", href: "/" },
        { label: "收藏功能测试" }
      ]}
      favoriteButton={
        <FavoriteButton
          type="page"
          title="收藏功能测试页面"
          url="/test-favorites"
          icon="StarIcon"
          category="system"
          description="用于测试收藏功能的演示页面"
          variant="ghost"
          size="sm"
        />
      }
      actions={
        <div className="flex gap-2">
          <FavoritesManager
            trigger={
              <Button variant="outline" size="sm">
                <SettingsIcon className="h-4 w-4 mr-2" />
                管理收藏
              </Button>
            }
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 页面收藏示例 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookmarkIcon className="h-5 w-5" />
              页面收藏
            </CardTitle>
            <CardDescription>
              收藏常用的业务页面，快速访问
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <FavoriteButton
                type="page"
                title="员工管理"
                url="/employees"
                icon="UsersIcon"
                category="employee"
                description="管理员工信息和考勤"
                size="sm"
              />
              <FavoriteButton
                type="page"
                title="财务管理"
                url="/finance"
                icon="DollarSignIcon"
                category="finance"
                description="查看财务数据和报表"
                size="sm"
              />
              <FavoriteButton
                type="page"
                title="库存管理"
                url="/inventory"
                icon="PackageIcon"
                category="inventory"
                description="管理库存和进销存"
                size="sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* 报表收藏示例 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileTextIcon className="h-5 w-5" />
              报表收藏
            </CardTitle>
            <CardDescription>
              收藏常用的报表配置
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <FavoriteButton
                type="report"
                title="月度销售报表"
                icon="BarChartIcon"
                category="sales"
                description="按月统计的销售数据报表"
                config={{ period: 'monthly', type: 'sales' }}
                size="sm"
              />
              <FavoriteButton
                type="report"
                title="库存预警报表"
                icon="AlertTriangleIcon"
                category="inventory"
                description="低库存商品预警报表"
                config={{ type: 'low-stock', threshold: 10 }}
                size="sm"
              />
              <FavoriteButton
                type="report"
                title="员工绩效报表"
                icon="TrendingUpIcon"
                category="employee"
                description="员工工作绩效统计报表"
                config={{ type: 'performance', period: 'quarterly' }}
                size="sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* 搜索收藏示例 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchIcon className="h-5 w-5" />
              搜索收藏
            </CardTitle>
            <CardDescription>
              收藏常用的搜索条件
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <FavoriteButton
                type="search"
                title="高价值客户搜索"
                icon="SearchIcon"
                category="customer"
                description="搜索消费金额超过1万的客户"
                config={{ 
                  filters: { totalSpent: { min: 10000 } },
                  sortBy: 'totalSpent',
                  order: 'desc'
                }}
                size="sm"
              />
              <FavoriteButton
                type="search"
                title="热销产品搜索"
                icon="SearchIcon"
                category="product"
                description="搜索销量前20的产品"
                config={{ 
                  filters: { status: 'active' },
                  sortBy: 'salesCount',
                  order: 'desc',
                  limit: 20
                }}
                size="sm"
              />
              <FavoriteButton
                type="search"
                title="待处理订单搜索"
                icon="SearchIcon"
                category="sales"
                description="搜索状态为待处理的订单"
                config={{ 
                  filters: { status: 'pending' },
                  sortBy: 'createdAt',
                  order: 'asc'
                }}
                size="sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* 操作收藏示例 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayIcon className="h-5 w-5" />
              操作收藏
            </CardTitle>
            <CardDescription>
              收藏复杂的操作流程
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <FavoriteButton
                type="operation"
                title="月末库存盘点"
                icon="ClipboardCheckIcon"
                category="inventory"
                description="月末库存盘点的完整操作流程"
                config={{ 
                  steps: [
                    'export_current_inventory',
                    'physical_count',
                    'compare_differences',
                    'adjust_inventory',
                    'generate_report'
                  ]
                }}
                size="sm"
              />
              <FavoriteButton
                type="operation"
                title="新员工入职流程"
                icon="UserPlusIcon"
                category="employee"
                description="新员工入职的标准操作流程"
                config={{ 
                  steps: [
                    'create_employee_record',
                    'assign_role_permissions',
                    'setup_workspace',
                    'training_schedule',
                    'probation_tracking'
                  ]
                }}
                size="sm"
              />
              <FavoriteButton
                type="operation"
                title="月度财务结算"
                icon="CalculatorIcon"
                category="finance"
                description="月度财务数据结算流程"
                config={{ 
                  steps: [
                    'reconcile_accounts',
                    'calculate_commissions',
                    'generate_statements',
                    'tax_calculations',
                    'close_period'
                  ]
                }}
                size="sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* 功能说明 */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StarIcon className="h-5 w-5" />
              收藏功能说明
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  页面收藏
                </Badge>
                <p className="text-sm text-muted-foreground">
                  收藏常用的业务页面，在顶部导航栏快速访问
                </p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  报表收藏
                </Badge>
                <p className="text-sm text-muted-foreground">
                  保存报表配置，包括字段、筛选条件和图表类型
                </p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  搜索收藏
                </Badge>
                <p className="text-sm text-muted-foreground">
                  保存复杂的搜索条件，避免重复设置筛选参数
                </p>
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  操作收藏
                </Badge>
                <p className="text-sm text-muted-foreground">
                  保存复杂的操作流程，标准化业务操作步骤
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModernPageContainer>
  )
}
