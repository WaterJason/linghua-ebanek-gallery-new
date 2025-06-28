import { Metadata } from "next"
import { FinanceAccountManagement } from "@/components/finance/finance-account-management"

export const metadata: Metadata = {
  title: "资金账户管理 | 聆花掐丝珐琅馆",
  description: "管理银行账户和资金流水",
}

export default function FinanceAccountsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">资金账户管理</h1>
        <p className="text-muted-foreground">管理银行账户、现金账户和资金流水</p>
      </div>
      <FinanceAccountManagement />
    </div>
  )
}
