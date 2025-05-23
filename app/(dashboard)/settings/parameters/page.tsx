import { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { SystemParameters } from "@/components/settings/system-parameters"

export const metadata: Metadata = {
  title: "系统参数",
  description: "配置系统全局参数和设置",
}

export default function ParametersPage() {
  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="系统参数"
        description="配置系统全局参数和设置"
      />
      
      <div className="space-y-6">
        <SystemParameters />
      </div>
    </div>
  )
}
