"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ProductImageUploader } from "@/components/product/product-image-uploader"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircleIcon, CheckCircleIcon, ImageIcon } from "lucide-react"

export default function TestImageUploadPage() {
  const { toast } = useToast()
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null)

  // 处理上传完成
  const handleUploadComplete = (urls: string[]) => {
    setUploadedUrls(prev => [...prev, ...urls])
    
    setTestResult({
      success: true,
      message: "图片上传测试成功",
      details: `成功上传 ${urls.length} 张图片`
    })
  }
  
  // 处理清除上传结果
  const handleClearResults = () => {
    setUploadedUrls([])
    setTestResult(null)
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">产品图片上传测试</h1>
        <p className="text-muted-foreground">测试产品图片批量上传功能</p>
      </div>
      
      {testResult && (
        <Alert variant={testResult.success ? "default" : "destructive"}>
          {testResult.success ? (
            <CheckCircleIcon className="h-4 w-4" />
          ) : (
            <AlertCircleIcon className="h-4 w-4" />
          )}
          <AlertTitle>{testResult.message}</AlertTitle>
          {testResult.details && (
            <AlertDescription>{testResult.details}</AlertDescription>
          )}
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ProductImageUploader
            onUploadComplete={handleUploadComplete}
            onCancel={() => {}}
          />
        </div>
        
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                上传结果
              </CardTitle>
              {uploadedUrls.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClearResults}>
                  清除结果
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {uploadedUrls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>暂无上传结果</p>
                  <p className="text-sm">上传图片后将在此处显示结果</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p>共上传 {uploadedUrls.length} 张图片</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {uploadedUrls.map((url, index) => (
                      <div key={index} className="space-y-2">
                        <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                          <img
                            src={url}
                            alt={`上传图片 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-xs break-all">
                          <p className="font-medium">URL:</p>
                          <p className="text-muted-foreground">{url}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
