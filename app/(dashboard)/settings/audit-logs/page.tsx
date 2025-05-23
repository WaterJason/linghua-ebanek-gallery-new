import { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { AuditLogList } from "@/components/settings/audit-log-list"

export const metadata: Metadata = {
  title: "审计日志",
  description: "查看系统操作日志和审计记录",
}

export default function AuditLogsPage() {
  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="审计日志"
        description="查看系统操作日志和审计记录"
      />
      
      <div className="space-y-6">
        <AuditLogList />
      </div>
    </div>
  )
}
