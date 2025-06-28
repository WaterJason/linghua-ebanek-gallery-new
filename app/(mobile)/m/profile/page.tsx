import { Metadata } from "next"
import { MobileProfile } from "@/components/mobile/mobile-profile"

export const metadata: Metadata = {
  title: "我的 | 聆花掐丝珐琅馆",
  description: "聆花掐丝珐琅馆移动端个人中心",
}

export default function MobileProfilePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">我的</h1>
      <MobileProfile />
    </div>
  )
}
