"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { DownloadIcon, UploadIcon, FileTextIcon, TableIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProductImportDialog } from "./product-import-dialog"

interface ProductImportExportProps {
  onImportComplete?: () => void
}

export function ProductImportExport({ onImportComplete }: ProductImportExportProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)

  // 导出CSV
  const handleExportCSV = async () => {
    try {
      setIsExporting(true)
      console.log("🔄 [Export] 开始导出CSV...")

      const response = await fetch("/api/products/export?format=csv&includeImages=true")
      if (!response.ok) {
        throw new Error("导出失败")
      }

      // 获取文件内容
      const csvContent = await response.text()
      
      // 创建下载链接
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "导出成功",
        description: "产品数据已导出为CSV文件",
      })

      console.log("✅ [Export] CSV导出成功")
    } catch (error) {
      console.error("🔥 [Export] CSV导出失败:", error)
      toast({
        title: "导出失败",
        description: "无法导出产品数据，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // 导出Excel
  const handleExportExcel = async () => {
    try {
      setIsExporting(true)
      console.log("🔄 [Export] 开始导出Excel...")

      const response = await fetch("/api/products/export?format=excel&includeImages=true")
      if (!response.ok) {
        throw new Error("获取数据失败")
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "获取数据失败")
      }

      // 动态导入xlsx库
      const XLSX = await import('xlsx')
      
      // 创建工作簿
      const workbook = XLSX.utils.book_new()
      
      // 创建工作表
      const worksheet = XLSX.utils.json_to_sheet(result.data)
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, "产品数据")
      
      // 导出文件
      const filename = `products_export_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(workbook, filename)

      toast({
        title: "导出成功",
        description: "产品数据已导出为Excel文件",
      })

      console.log("✅ [Export] Excel导出成功")
    } catch (error) {
      console.error("🔥 [Export] Excel导出失败:", error)
      toast({
        title: "导出失败",
        description: "无法导出产品数据，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex gap-2">
      {/* 导出按钮 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isExporting}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            {isExporting ? "导出中..." : "导出"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleExportCSV}>
            <FileTextIcon className="h-4 w-4 mr-2" />
            导出为CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportExcel}>
            <TableIcon className="h-4 w-4 mr-2" />
            导出为Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 导入按钮 */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <UploadIcon className="h-4 w-4 mr-2" />
            导入
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>导入产品数据</DialogTitle>
          </DialogHeader>
          <ProductImportDialog
            onImportComplete={() => {
              setShowImportDialog(false)
              onImportComplete?.()
            }}
            onCancel={() => setShowImportDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
