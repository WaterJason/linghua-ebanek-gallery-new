import { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { NotificationList } from "@/components/notifications/notification-list"

export const metadata: Metadata = {
  title: "通知中心",
  description: "查看所有系统通知和提醒",
}

export default function NotificationsPage() {
  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="通知中心"
        description="查看所有系统通知和提醒"
      />
      
      <div className="space-y-6">
        <NotificationList />
      </div>
    </div>
  )
}
