import { Metadata } from "next"
import { NotificationsPage } from "@/components/notifications/notifications-page"

export const metadata: Metadata = {
  title: "通知中心 | 聆花掐丝珐琅馆",
  description: "查看系统通知和提醒",
}

export default function NotificationsPageRoute() {
  return <NotificationsPage />
}
