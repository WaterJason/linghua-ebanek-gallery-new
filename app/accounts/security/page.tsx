import { Metadata } from "next"
import SecurityLogTable from "@/components/security-log-table"

export const metadata: Metadata = {
  title: "安全日志 | 聆花掐丝珐琅馆管理系统",
  description: "查看您的账号安全日志和登录历史",
}

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">安全日志</h1>
        <p className="text-muted-foreground">
          查看您的账号安全日志和登录历史
        </p>
      </div>
      <div className="border-b pb-6" />
      <SecurityLogTable />
    </div>
  )
}
