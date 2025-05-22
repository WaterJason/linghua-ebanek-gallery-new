import { Metadata } from "next"
import { DashboardNav } from "@/components/dashboard-nav"

export const metadata: Metadata = {
  title: "财务管理",
  description: "管理企业财务，包括资金账户、收支记录和财务报表。",
}

interface FinanceLayoutProps {
  children?: React.ReactNode
}

export default function FinanceLayout({ children }: FinanceLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col space-y-6">
      <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex">
          <DashboardNav />
        </aside>
        <main className="flex w-full flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}