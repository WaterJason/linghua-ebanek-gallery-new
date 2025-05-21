"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { DownloadIcon, UploadIcon, FileIcon } from "lucide-react"

interface ExportImportButtonsProps {
  type: "sales" | "payroll" | "products"
  year?: number
  month?: number
}

export function ExportImportButtons({ type, year, month }: ExportImportButtonsProps) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const handleExport = async () => {
    try {
      let url = ""

      switch (type) {
        case "sales":
          url = "/api/export/sales"
          break
        case "payroll":
          if (!year || !month) {
            toast({
              title: "导出失败",
              description: "请选择年份和月份",
              variant: "destructive",
            })
            return
          }
          url = `/api/export/payroll?year=${year}&month=${month}`
          break
        case "products":
          url = "/api/export/products"
          break
      }

      // 触发文件下载
      window.location.href = url
    } catch (error) {
      console.error("导出失败:", error)
      toast({
        title: "导出失败",
        description: "导出数据时出错",
        variant: "destructive",
      })
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "导入失败",
        description: "请选择要导入的文件",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)

    try {
      const formData = new FormData()
      formData.append("file", importFile)

      let url = ""
      switch (type) {
        case "products":
          url = "/api/import/products"
          break
        default:
          throw new Error("不支持的导入类型")
      }

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "导入失败")
      }

      const result = await response.json()

      toast({
        title: "导入成功",
        description: result.message || `成功导入${result.products?.length || 0}条数据`,
      })

      setIsImportDialogOpen(false)
      setImportFile(null)
    } catch (error) {
      console.error("导入失败:", error)
      toast({
        title: "导入失败",
        description: error.message || "导入数据时出错",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleExport}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          导出
        </Button>
        {type === "products" && (
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <UploadIcon className="mr-2 h-4 w-4" />
            导入
          </Button>
        )}
      </div>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入数据</DialogTitle>
            <DialogDescription>请选择要导入的Excel文件。文件必须包含正确的列名和格式。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">选择文件</Label>
              <Input
                id="file"
                type="file"
                accept=".xlsx"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              {importFile && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileIcon className="h-4 w-4" />
                  <span>{importFile.name}</span>
                  <span>({(importFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleImport} disabled={!importFile || isImporting}>
              {isImporting ? "导入中..." : "导入"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
