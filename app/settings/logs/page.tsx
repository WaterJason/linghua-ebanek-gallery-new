"use client"

import { SystemLogs } from "@/components/system-logs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"

export default function SystemLogsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold tracking-tight">系统日志</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>系统日志记录</CardTitle>
          <CardDescription>
            查看系统操作日志和错误记录，帮助诊断和解决问题
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SystemLogs />
        </CardContent>
      </Card>
    </div>
  )
}
