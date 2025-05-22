"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AccountsTable } from "@/components/finance/accounts-table"
import { AccountDialog } from "@/components/finance/account-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function FinanceAccountsManagement() {
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">资金账户</h2>
          <p className="text-muted-foreground">管理企业的资金账户，包括银行账户、现金账户等</p>
        </div>
        <Button onClick={() => setIsAddAccountOpen(true)}>
          添加账户
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>账户列表</CardTitle>
          <CardDescription>查看和管理所有资金账户</CardDescription>
        </CardHeader>
        <CardContent>
          <AccountsTable />
        </CardContent>
      </Card>

      <AccountDialog 
        open={isAddAccountOpen}
        onOpenChange={setIsAddAccountOpen}
      />
    </div>
  )
} 