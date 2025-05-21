import { Metadata } from "next"
import ProfileForm from "@/components/profile-form"

export const metadata: Metadata = {
  title: "个人资料 | 聆花掐丝珐琅馆管理系统",
  description: "管理您的个人资料和账号设置",
}

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">个人资料</h1>
        <p className="text-muted-foreground">
          管理您的个人资料和账号设置
        </p>
      </div>
      <div className="border-b pb-6" />
      <ProfileForm />
    </div>
  )
}
