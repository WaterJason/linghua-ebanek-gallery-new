import { Metadata } from "next"
import { ModernPageContainer } from "@/components/modern-page-container"
import { HelpPage } from "@/components/help/help-page"

export const metadata: Metadata = {
  title: "帮助中心 | 聆花掐丝珐琅馆",
  description: "获取系统使用帮助和支持",
}

export default function HelpPageRoute() {
  return (
    <ModernPageContainer
      title="帮助中心"
      description="获取系统使用帮助和支持"
    >
      <HelpPage />
    </ModernPageContainer>
  )
}
