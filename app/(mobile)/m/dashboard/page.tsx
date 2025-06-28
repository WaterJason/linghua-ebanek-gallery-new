import { Metadata } from "next"
import { MobileDashboard } from "@/components/mobile/mobile-dashboard"

export const metadata: Metadata = {
  title: "移动端首页 | 聆花掐丝珐琅馆",
  description: "聆花掐丝珐琅馆移动端首页",
}

export default function MobileDashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">聆花掐丝珐琅馆</h1>
      <MobileDashboard />
    </div>
  )
}
