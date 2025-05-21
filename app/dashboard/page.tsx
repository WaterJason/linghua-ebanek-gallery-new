import { Metadata } from "next"
import { MobileDashboard } from "@/components/mobile-dashboard"
import { DesktopDashboard } from "@/components/desktop-dashboard"
import { ClientOnly } from "@/components/client-only"
import { Button } from "@/components/ui/button"
import { CalendarIcon, BarChart3Icon, UsersIcon, PackageIcon, CogIcon, RefreshCwIcon } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "仪表盘 | 聆花掐丝珐琅馆",
  description: "查看业务关键指标和数据分析",
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">仪表盘</h1>
          <p className="text-muted-foreground">查看业务关键指标和数据分析</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/sales/reports">
              <BarChart3Icon className="mr-2 h-4 w-4" />
              销售报表
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/schedules">
              <CalendarIcon className="mr-2 h-4 w-4" />
              排班管理
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/inventory">
              <PackageIcon className="mr-2 h-4 w-4" />
              库存管理
            </Link>
          </Button>
        </div>
      </div>

      <ClientOnly>
        {/* 根据设备类型渲染不同的仪表盘 */}
        <div className="block md:hidden">
          <MobileDashboard />
        </div>
        <div className="hidden md:block">
          <DesktopDashboard />
        </div>
      </ClientOnly>
    </div>
  )
}
