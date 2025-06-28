import { Metadata } from "next"
import { ModernPageContainer } from "@/components/modern-page-container"
import { MessagesPage } from "@/components/messages/messages-page"

export const metadata: Metadata = {
  title: "消息中心 | 聆花掐丝珐琅馆",
  description: "查看和管理系统消息",
}

export default function MessagesPageRoute() {
  return (
    <ModernPageContainer
      title="消息中心"
      description="查看和管理系统消息"
    >
      <MessagesPage />
    </ModernPageContainer>
  )
}
