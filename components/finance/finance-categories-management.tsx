"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CategoriesTable } from "@/components/finance/categories-table"
import { CategoryDialog } from "@/components/finance/category-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function FinanceCategoriesManagement() {
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">收支分类</h2>
          <p className="text-muted-foreground">管理收入和支出的分类，便于财务统计与分析</p>
        </div>
        <Button onClick={() => setIsAddCategoryOpen(true)}>
          添加分类
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>分类列表</CardTitle>
          <CardDescription>查看和管理所有收支分类</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoriesTable />
        </CardContent>
      </Card>

      <CategoryDialog 
        open={isAddCategoryOpen}
        onOpenChange={setIsAddCategoryOpen}
      />
    </div>
  )
} 