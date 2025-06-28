import { Metadata } from "next"
import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { AuditLogList } from "@/components/settings/audit-log-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
        <Suspense fallback={
          <Card>
            <CardHeader>
              <CardTitle>审计日志</CardTitle>
              <CardDescription>加载中...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        }>
          <AuditLogList />
        </Suspense>
      </div>
    </div>
  )
}
