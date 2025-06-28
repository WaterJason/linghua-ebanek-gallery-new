"use client"

import { useState, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  ImageIcon, 
  UploadIcon, 
  XIcon, 
  AlertCircleIcon, 
  CheckCircleIcon,
  Trash2Icon
} from "lucide-react"
import { useDropzone } from "react-dropzone"

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  url?: string;
  error?: string;
}

interface ProductImageUploaderProps {
  onUploadComplete?: (urls: string[]) => void;
  onCancel?: () => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
}

export function ProductImageUploader({
  onUploadComplete,
  onCancel,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedFileTypes = ["image/jpeg", "image/png", "image/webp"]
}: ProductImageUploaderProps) {
  const { toast } = useToast()
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  // 处理文件拖放
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // 处理被拒绝的文件
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(rejection => {
        const error = rejection.errors[0]
        return `${rejection.file.name}: ${error.message}`
      })
      
      toast({
        title: "文件上传失败",
        description: errors.join(", "),
        variant: "destructive",
      })
      return
    }
    
    // 检查文件数量限制
    if (images.length + acceptedFiles.length > maxFiles) {
      toast({
        title: "超出文件数量限制",
        description: `最多只能上传 ${maxFiles} 个文件`,
        variant: "destructive",
      })
      return
    }
    
    // 添加新文件
    const newImages = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: "pending" as const
    }))
    
    setImages(prev => [...prev, ...newImages])
  }, [images.length, maxFiles, toast])
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': acceptedFileTypes
    },
    maxSize,
    multiple: true
  })
  
  // 处理移除图片
  const handleRemoveImage = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(image => image.id !== id)
      
      // 释放预览URL
      const imageToRemove = prev.find(image => image.id === id)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview)
      }
      
      return filtered
    })
  }
  
  // 处理上传
  const handleUpload = async () => {
    if (images.length === 0) {
      setUploadError("请先选择要上传的图片")
      return
    }
    
    setIsUploading(true)
    setUploadError(null)
    
    const pendingImages = images.filter(img => img.status === "pending")
    const uploadedUrls: string[] = []
    
    for (let i = 0; i < pendingImages.length; i++) {
      const image = pendingImages[i]
      
      // 更新状态为上传中
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, status: "uploading" } : img
      ))
      
      try {
        // 创建FormData
        const formData = new FormData()
        formData.append("file", image.file)
        
        // 模拟上传进度
        const progressInterval = setInterval(() => {
          setImages(prev => prev.map(img => 
            img.id === image.id ? { 
              ...img, 
              progress: Math.min(img.progress + 10, 90) 
            } : img
          ))
        }, 200)
        
        // 发送请求
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        
        clearInterval(progressInterval)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "上传失败")
        }
        
        const data = await response.json()
        
        // 更新状态为成功
        setImages(prev => prev.map(img => 
          img.id === image.id ? { 
            ...img, 
            status: "success", 
            progress: 100,
            url: data.url
          } : img
        ))
        
        uploadedUrls.push(data.url)
      } catch (error) {
        console.error("上传错误:", error)
        
        // 更新状态为错误
        setImages(prev => prev.map(img => 
          img.id === image.id ? { 
            ...img, 
            status: "error", 
            progress: 0,
            error: error instanceof Error ? error.message : "上传失败"
          } : img
        ))
      }
    }
    
    setIsUploading(false)
    
    // 如果有成功上传的图片，调用回调
    if (uploadedUrls.length > 0) {
      if (onUploadComplete) {
        onUploadComplete(uploadedUrls)
      }
      
      toast({
        title: "上传成功",
        description: `成功上传 ${uploadedUrls.length} 张图片`,
      })
    }
  }
  
  // 处理清除所有
  const handleClearAll = () => {
    // 释放所有预览URL
    images.forEach(image => {
      URL.revokeObjectURL(image.preview)
    })
    
    setImages([])
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            产品图片上传
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 拖放区域 */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center gap-2">
              <UploadIcon className="h-10 w-10 text-muted-foreground" />
              {isDragActive ? (
                <p>拖放文件到这里...</p>
              ) : (
                <>
                  <p>拖放文件到这里，或点击选择文件</p>
                  <p className="text-sm text-muted-foreground">
                    支持的文件格式: JPG, PNG, WebP (最大 {maxSize / 1024 / 1024}MB)
                  </p>
                </>
              )}
            </div>
          </div>
          
          {uploadError && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle>上传错误</AlertTitle>
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}
          
          {/* 图片预览区域 */}
          {images.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">已选择 {images.length} 张图片</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearAll}
                  disabled={isUploading}
                >
                  <Trash2Icon className="h-4 w-4 mr-2" />
                  清除全部
                </Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map(image => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-md overflow-hidden border bg-muted">
                      <img
                        src={image.preview}
                        alt={image.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* 状态指示器 */}
                    {image.status === "uploading" && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-3/4">
                          <Progress value={image.progress} className="h-2" />
                          <p className="text-xs text-center text-white mt-1">
                            {image.progress}%
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {image.status === "success" && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                        <CheckCircleIcon className="h-4 w-4" />
                      </div>
                    )}
                    
                    {image.status === "error" && (
                      <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                        <div className="text-white text-center p-2">
                          <AlertCircleIcon className="h-6 w-6 mx-auto mb-1" />
                          <p className="text-xs">{image.error || "上传失败"}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* 删除按钮 */}
                    {image.status !== "uploading" && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(image.id)}
                      >
                        <XIcon className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {/* 文件名 */}
                    <p className="text-xs truncate mt-1">
                      {image.file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isUploading}>
            取消
          </Button>
          <Button onClick={handleUpload} disabled={images.length === 0 || isUploading}>
            {isUploading ? (
              <>
                <UploadIcon className="mr-2 h-4 w-4 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <UploadIcon className="mr-2 h-4 w-4" />
                开始上传
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
