import { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { NotificationCenter } from "@/components/dashboard/notification-center"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "通知中心",
  description: "查看所有系统通知和提醒",
}

export default function NotificationsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="通知中心"
        text="查看和管理所有系统通知"
      />
      <Card className="p-0">
        <NotificationCenter limit={20} />
      </Card>
    </DashboardShell>
  )
}