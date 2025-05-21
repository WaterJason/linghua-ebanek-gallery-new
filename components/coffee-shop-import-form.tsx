"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { UploadIcon, FileIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react"
import { importCoffeeShopSales } from "@/lib/actions/sales-actions";

export function CoffeeShopImportForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [jsonData, setJsonData] = useState("")
  const [csvData, setCsvData] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [validationSuccess, setValidationSuccess] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null)

  // 处理JSON数据导入
  const handleJsonImport = async () => {
    setIsLoading(true)
    setValidationErrors([])
    setValidationSuccess(false)
    setImportResult(null)

    try {
      // 解析JSON数据
      let data
      try {
        data = JSON.parse(jsonData)
      } catch (error) {
        setValidationErrors(["JSON格式无效，请检查数据格式"])
        setIsLoading(false)
        return
      }

      // 验证数据格式
      const errors = validateImportData(data)
      if (errors.length > 0) {
        setValidationErrors(errors)
        setIsLoading(false)
        return
      }

      setValidationSuccess(true)

      // 导入数据
      const result = await importCoffeeShopSales(Array.isArray(data) ? data : [data])
      setImportResult({
        success: true,
        message: result.message || `成功导入 ${result.count} 条记录`
      })

      // 清空表单
      setJsonData("")
    } catch (error) {
      console.error("Error importing JSON data:", error)
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : "导入失败，请检查数据格式"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 处理CSV数据导入
  const handleCsvImport = async () => {
    setIsLoading(true)
    setValidationErrors([])
    setValidationSuccess(false)
    setImportResult(null)

    try {
      // 解析CSV数据
      const data = parseCsvData(csvData)
      
      // 验证数据格式
      const errors = validateImportData(data)
      if (errors.length > 0) {
        setValidationErrors(errors)
        setIsLoading(false)
        return
      }

      setValidationSuccess(true)

      // 导入数据
      const result = await importCoffeeShopSales(data)
      setImportResult({
        success: true,
        message: result.message || `成功导入 ${result.count} 条记录`
      })

      // 清空表单
      setCsvData("")
    } catch (error) {
      console.error("Error importing CSV data:", error)
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : "导入失败，请检查数据格式"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 处理文件上传
  const handleFileUpload = async () => {
    if (!file) {
      toast({
        title: "请选择文件",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setValidationErrors([])
    setValidationSuccess(false)
    setImportResult(null)

    try {
      // 读取文件内容
      const fileContent = await readFileContent(file)
      
      // 根据文件类型解析数据
      let data
      if (file.name.endsWith(".json")) {
        data = JSON.parse(fileContent)
      } else if (file.name.endsWith(".csv")) {
        data = parseCsvData(fileContent)
      } else {
        setValidationErrors(["不支持的文件格式，请上传JSON或CSV文件"])
        setIsLoading(false)
        return
      }

      // 验证数据格式
      const errors = validateImportData(data)
      if (errors.length > 0) {
        setValidationErrors(errors)
        setIsLoading(false)
        return
      }

      setValidationSuccess(true)

      // 导入数据
      const result = await importCoffeeShopSales(Array.isArray(data) ? data : [data])
      setImportResult({
        success: true,
        message: result.message || `成功导入 ${result.count} 条记录`
      })

      // 清空表单
      setFile(null)
    } catch (error) {
      console.error("Error importing file:", error)
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : "导入失败，请检查文件格式"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 读取文件内容
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string)
        } else {
          reject(new Error("读取文件失败"))
        }
      }
      reader.onerror = () => reject(new Error("读取文件失败"))
      reader.readAsText(file)
    })
  }

  // 解析CSV数据
  const parseCsvData = (csvContent: string) => {
    // 简单的CSV解析，可以根据需要扩展
    const lines = csvContent.split("\n").filter(line => line.trim() !== "")
    const headers = lines[0].split(",").map(header => header.trim())
    
    return lines.slice(1).map(line => {
      const values = line.split(",").map(value => value.trim())
      const record: Record<string, any> = {}
      
      headers.forEach((header, index) => {
        record[header] = values[index] || ""
      })
      
      return record
    })
  }

  // 验证导入数据
  const validateImportData = (data: any): string[] => {
    const errors: string[] = []
    
    // 检查是否为数组
    if (!Array.isArray(data)) {
      if (typeof data === "object" && data !== null) {
        data = [data] // 单个对象转为数组
      } else {
        errors.push("数据格式无效，应为对象数组")
        return errors
      }
    }
    
    // 检查数组是否为空
    if (data.length === 0) {
      errors.push("数据为空，没有可导入的记录")
      return errors
    }
    
    // 检查每条记录的必要字段
    data.forEach((record, index) => {
      if (!record.date) {
        errors.push(`第 ${index + 1} 条记录缺少日期字段`)
      }
      
      if (!record.totalSales && record.totalSales !== 0) {
        errors.push(`第 ${index + 1} 条记录缺少总销售额字段`)
      }
    })
    
    return errors
  }

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>导入咖啡店销售数据</CardTitle>
        <CardDescription>通过JSON、CSV或文件导入咖啡店销售数据</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="json">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="json">JSON格式</TabsTrigger>
            <TabsTrigger value="csv">CSV格式</TabsTrigger>
            <TabsTrigger value="file">文件上传</TabsTrigger>
          </TabsList>
          
          <TabsContent value="json" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="json-data">JSON数据</Label>
              <Textarea
                id="json-data"
                placeholder='[{"date": "2023-01-01", "totalSales": 1000, "cashAmount": 500, "cardAmount": 500, "customerCount": 20, "staffOnDuty": ["1", "2"]}]'
                className="min-h-[200px]"
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                输入JSON格式的咖啡店销售数据，可以是单个对象或对象数组
              </p>
            </div>
            
            <Button onClick={handleJsonImport} disabled={isLoading || !jsonData}>
              {isLoading ? "导入中..." : "导入JSON数据"}
            </Button>
          </TabsContent>
          
          <TabsContent value="csv" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-data">CSV数据</Label>
              <Textarea
                id="csv-data"
                placeholder="date,totalSales,cashAmount,cardAmount,customerCount,staffOnDuty
2023-01-01,1000,500,500,20,1,2"
                className="min-h-[200px]"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                输入CSV格式的咖啡店销售数据，第一行为标题行
              </p>
            </div>
            
            <Button onClick={handleCsvImport} disabled={isLoading || !csvData}>
              {isLoading ? "导入中..." : "导入CSV数据"}
            </Button>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">选择文件</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileChange}
                />
                {file && (
                  <div className="flex items-center gap-1 text-sm">
                    <FileIcon className="h-4 w-4" />
                    {file.name}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                上传JSON或CSV格式的咖啡店销售数据文件
              </p>
            </div>
            
            <Button onClick={handleFileUpload} disabled={isLoading || !file}>
              <UploadIcon className="mr-2 h-4 w-4" />
              {isLoading ? "上传中..." : "上传并导入"}
            </Button>
          </TabsContent>
        </Tabs>
        
        {/* 验证结果 */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-destructive/10 rounded-md border border-destructive">
            <div className="flex items-center gap-2 text-destructive font-medium mb-2">
              <AlertCircleIcon className="h-5 w-5" />
              验证失败
            </div>
            <ul className="list-disc list-inside text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {validationSuccess && !importResult && (
          <div className="mt-4 p-3 bg-green-100 rounded-md border border-green-200">
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircleIcon className="h-5 w-5" />
              数据验证通过，正在导入...
            </div>
          </div>
        )}
        
        {importResult && (
          <div className={`mt-4 p-3 rounded-md border ${
            importResult.success 
              ? "bg-green-100 border-green-200 text-green-600" 
              : "bg-destructive/10 border-destructive text-destructive"
          }`}>
            <div className="flex items-center gap-2 font-medium">
              {importResult.success 
                ? <CheckCircleIcon className="h-5 w-5" /> 
                : <AlertCircleIcon className="h-5 w-5" />}
              {importResult.message}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
