import { Metadata } from "next"
import { CustomWorkManagement } from "@/components/sales/custom-work-management"

export const metadata: Metadata = {
  title: "定制作品 | 聆花掐丝珐琅馆",
  description: "管理定制作品订单和制作进度",
}

export default function SalesCustomWorksPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">定制作品</h1>
        <p className="text-muted-foreground">管理定制作品订单和制作进度</p>
      </div>

      <CustomWorkManagement />
    </div>
  )
}
