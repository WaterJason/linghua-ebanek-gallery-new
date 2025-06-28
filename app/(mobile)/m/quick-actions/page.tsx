import { Metadata } from "next"
import { MobileQuickActions } from "@/components/mobile/mobile-quick-actions"

export const metadata: Metadata = {
  title: "快速操作 | 聆花掐丝珐琅馆",
  description: "聆花掐丝珐琅馆移动端快速操作",
}

export default function MobileQuickActionsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">快速操作</h1>
      <MobileQuickActions />
    </div>
  )
}
