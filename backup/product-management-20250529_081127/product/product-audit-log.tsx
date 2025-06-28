"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { 
  FileTextIcon,
  ArrowRightIcon
} from "lucide-react"
import { EntityAuditLog } from "@/components/audit/entity-audit-log"

interface ProductAuditLogProps {
  productId: number
  className?: string
  showHeader?: boolean
  limit?: number
}

export function ProductAuditLog({
  productId,
  className,
  showHeader = true,
  limit = 5
}: ProductAuditLogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isFullLogOpen, setIsFullLogOpen] = useState(false)

  // 查看完整日志
  const handleViewFullLog = () => {
    window.open(`/settings/audit-logs?entityType=product&entityId=${productId}`, "_blank")
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">加载中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="text-base">操作日志</CardTitle>
          <CardDescription>记录对此产品的所有操作</CardDescription>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <EntityAuditLog
          entityType="product"
          entityId={productId.toString()}
          limit={limit}
          showHeader={false}
        />
        
        <div className="p-4 pt-0">
          <Button variant="outline" className="w-full" onClick={handleViewFullLog}>
            查看完整日志
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
