import { Metadata } from "next"
import UserSettingsForm from "@/components/user-settings-form"

export const metadata: Metadata = {
  title: "账号设置 | 聆花掐丝珐琅馆管理系统",
  description: "管理您的账号设置和偏好",
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">账号设置</h1>
        <p className="text-muted-foreground">
          管理您的账号设置和偏好
        </p>
      </div>
      <div className="border-b pb-6" />
      <UserSettingsForm />
    </div>
  )
}
