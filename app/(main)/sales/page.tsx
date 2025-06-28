import { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModernPageContainer } from "@/components/modern-page-container"
import { CustomerManagement } from "@/components/customer-management"
import { OrderManagement } from "@/components/order-management"
import { PosSystem } from "@/components/pos-system"
import { SalesReportDashboard } from "@/components/sales-report-dashboard"
import { ShoppingCartIcon, FileIcon, UsersIcon, BarChart3Icon } from "lucide-react"

export const metadata: Metadata = {
  title: "销售管理 | 聆花掐丝珐琅馆",
  description: "管理订单、客户、POS销售和销售报表",
}

export default function SalesPage() {
  return (
    <ModernPageContainer
      title="销售管理"
      description="管理订单、客户、POS销售和销售报表"
      breadcrumbs={[
        { label: "首页", href: "/" },
        { label: "销售管理" }
      ]}
    >
      <Tabs defaultValue="pos" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pos" className="flex items-center gap-2">
            <ShoppingCartIcon className="h-4 w-4" />
            POS销售
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <FileIcon className="h-4 w-4" />
            订单管理
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            客户管理
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3Icon className="h-4 w-4" />
            销售报表
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="space-y-6">
          <PosSystem />
        </TabsContent>
        <TabsContent value="orders" className="space-y-6">
          <OrderManagement />
        </TabsContent>
        <TabsContent value="customers" className="space-y-6">
          <CustomerManagement />
        </TabsContent>
        <TabsContent value="reports" className="space-y-6">
          <SalesReportDashboard />
        </TabsContent>
      </Tabs>
    </ModernPageContainer>
  )
}
