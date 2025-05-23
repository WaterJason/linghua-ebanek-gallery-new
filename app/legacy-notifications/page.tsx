import { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { NotificationCenter } from "@/components/dashboard/notification-center"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "旧版通知中心",
  description: "查看所有系统通知和提醒（旧版）",
}

export default function LegacyNotificationsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="旧版通知中心"
        text="查看和管理所有系统通知（旧版）"
      >
        <Button asChild>
          <Link href="/notifications">前往新版通知中心</Link>
        </Button>
      </DashboardHeader>
      <Card className="p-0">
        <NotificationCenter limit={20} />
      </Card>
    </DashboardShell>
  )
}
