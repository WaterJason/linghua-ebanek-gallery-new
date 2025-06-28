import { Metadata } from "next"
import { ModernPageContainer } from "@/components/modern-page-container"
import { ComposeMessageForm } from "@/components/messages/compose-message-form"

export const metadata: Metadata = {
  title: "发送消息 | 聆花掐丝珐琅馆",
  description: "发送新消息",
}

export default function ComposeMessagePage() {
  return (
    <ModernPageContainer
      title="发送消息"
      description="发送新消息给团队成员"
      showBackButton={true}
      backHref="/messages"
    >
      <ComposeMessageForm />
    </ModernPageContainer>
  )
}
