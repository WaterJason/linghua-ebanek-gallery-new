"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TransactionsTable } from "@/components/finance/transactions-table"
import { TransactionDialog } from "@/components/finance/transaction-dialog"
import { TransactionFilterDialog } from "@/components/finance/transaction-filter-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"

export function FinanceTransactionsManagement() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [transactionType, setTransactionType] = useState<"income" | "expense" | "transfer" | null>(null)

  const handleAddIncome = () => {
    setTransactionType("income")
    setIsAddTransactionOpen(true)
  }

  const handleAddExpense = () => {
    setTransactionType("expense")
    setIsAddTransactionOpen(true)
  }

  const handleAddTransfer = () => {
    setTransactionType("transfer")
    setIsAddTransactionOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">交易记录</h2>
          <p className="text-muted-foreground">管理企业的所有收入、支出和转账记录</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setIsFilterOpen(true)}>
            <Icons.filter className="mr-2 h-4 w-4" />
            筛选
          </Button>
          <Button onClick={handleAddIncome} variant="outline" className="bg-green-50 hover:bg-green-100 text-green-600">
            <Icons.plus className="mr-2 h-4 w-4" />
            收入
          </Button>
          <Button onClick={handleAddExpense} variant="outline" className="bg-red-50 hover:bg-red-100 text-red-600">
            <Icons.minus className="mr-2 h-4 w-4" />
            支出
          </Button>
          <Button onClick={handleAddTransfer} variant="outline">
            <Icons.transfer className="mr-2 h-4 w-4" />
            转账
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>交易列表</CardTitle>
          <CardDescription>查看和管理所有交易记录</CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionsTable />
        </CardContent>
      </Card>

      <TransactionDialog 
        open={isAddTransactionOpen}
        onOpenChange={setIsAddTransactionOpen}
        defaultType={transactionType}
      />

      <TransactionFilterDialog 
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
      />
    </div>
  )
} 