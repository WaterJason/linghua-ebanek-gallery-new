import { Metadata } from "next"
import { ModernPageContainer } from "@/components/modern-page-container"
import { NewCustomWorkForm } from "@/components/sales/new-custom-work-form"

export const metadata: Metadata = {
  title: "新建定制订单 | 聆花掐丝珐琅馆",
  description: "创建新的定制作品订单",
}

export default function NewCustomWorkPage() {
  return (
    <ModernPageContainer
      title="新建定制订单"
      description="创建新的定制作品订单"
      showBackButton={true}
      backHref="/sales/custom-works"
    >
      <div className="max-w-4xl">
        <NewCustomWorkForm />
      </div>
    </ModernPageContainer>
  )
}
