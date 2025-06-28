import { Metadata } from "next"

export const metadata: Metadata = {
  title: "财务管理",
  description: "管理企业财务，包括资金账户、收支记录和财务报表。",
}

interface FinanceLayoutProps {
  children?: React.ReactNode
}

export default function FinanceLayout({ children }: FinanceLayoutProps) {
  return (
    <div className="w-full">
      {children}
    </div>
  )
}
