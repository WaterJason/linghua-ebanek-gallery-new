import { Metadata } from "next"
import { ModernPageContainer } from "@/components/modern-page-container"
import { NewCustomerForm } from "@/components/customers/new-customer-form"

export const metadata: Metadata = {
  title: "新建客户 | 聆花掐丝珐琅馆",
  description: "创建新的客户信息",
}

export default function NewCustomerPage() {
  return (
    <ModernPageContainer
      title="新建客户"
      description="创建新的客户信息"
      showBackButton={true}
      backHref="/customers"
    >
      <div className="max-w-2xl">
        <NewCustomerForm />
      </div>
    </ModernPageContainer>
  )
}
