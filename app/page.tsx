import { redirect } from "next/navigation"

export default function HomePage() {
  // 重定向到正确的路由组中的仪表盘页面
  redirect("/dashboard")
}
