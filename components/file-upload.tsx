"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import {
  UploadIcon,
  XIcon,
  ImageIcon,
  ClipboardIcon,
  CompressIcon,
  CheckIcon,
  SettingsIcon,
  ArrowUpDownIcon
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { SortableImageGrid } from "@/components/sortable-image-grid"
import { compressImages } from "@/lib/image-utils"

interface FileUploadProps {
  onUploadComplete?: (fileUrl: string) => void
  onUpload?: (fileUrl: string) => void
  onMultiUploadComplete?: (fileUrls: string[]) => void
  onPrimaryImageChange?: (fileUrl: string) => void
  gallerySaleId?: number | null
  maxFiles?: number
  maxSize?: number // in bytes
  accept?: Record<string, string[]>
  defaultValue?: string
  defaultValues?: string[]
  allowPaste?: boolean
  autoUpload?: boolean
  enableCompression?: boolean
  enableSorting?: boolean
  primaryImageUrl?: string
}

export function FileUpload({
  onUploadComplete,
  onUpload,
  onMultiUploadComplete,
  onPrimaryImageChange,
  gallerySaleId = null,
  maxFiles = 10,
  maxSize = 30 * 1024 * 1024, // 30MB
  accept = {
    "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
  },
  defaultValue,
  defaultValues,
  allowPaste = true,
  autoUpload = false,
  enableCompression = true,
  enableSorting = true,
  primaryImageUrl,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(
    defaultValues
      ? defaultValues
      : defaultValue
        ? [defaultValue]
        : []
  )
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0)
  const [useCompression, setUseCompression] = useState<boolean>(true)
  const [compressionQuality, setCompressionQuality] = useState<number>(0.8)
  const [compressionMaxWidth, setCompressionMaxWidth] = useState<number>(1920)
  const [showSortableGrid, setShowSortableGrid] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})

  const dropzoneRef = useRef<HTMLDivElement>(null)

  // 初始化主图索引
  useEffect(() => {
    if (primaryImageUrl && uploadedUrls.length > 0) {
      const index = uploadedUrls.findIndex(url => url === primaryImageUrl)
      if (index !== -1) {
        setPrimaryImageIndex(index)
      }
    }
  }, [primaryImageUrl, uploadedUrls])

  // 处理文件添加
  const handleAddFiles = useCallback(
    (newFiles: File[]) => {
      // 如果已经有文件并且maxFiles为1，则替换文件
      if (maxFiles === 1) {
        setFiles(newFiles.slice(0, 1))
      } else {
        // 否则添加文件，但不超过maxFiles
        setFiles((prev) => {
          const combined = [...prev, ...newFiles]
          // 如果超过最大文件数，显示提示
          if (combined.length > maxFiles) {
            toast({
              title: "文件数量超出限制",
              description: `最多只能上传${maxFiles}个文件，已自动截取前${maxFiles}个`,
              variant: "warning",
            })
          }
          return combined.slice(0, maxFiles)
        })
      }
    },
    [maxFiles, toast],
  )

  // 拖放回调
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      handleAddFiles(acceptedFiles)

      // 如果设置了自动上传，添加文件后自动上传
      if (autoUpload && acceptedFiles.length > 0) {
        setTimeout(() => {
          uploadFiles(acceptedFiles)
        }, 100)
      }
    },
    [autoUpload, handleAddFiles],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept,
  })

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // 处理粘贴事件
  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      if (!allowPaste) return

      // 检查是否有图片数据
      const items = event.clipboardData?.items
      if (!items) return

      const imageFiles: File[] = []

      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        // 检查是否是图片
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile()
          if (file) {
            imageFiles.push(file)
          }
        }
      }

      if (imageFiles.length > 0) {
        handleAddFiles(imageFiles)

        // 如果设置了自动上传，添加文件后自动上传
        if (autoUpload) {
          setTimeout(() => {
            uploadFiles(imageFiles)
          }, 100)
        }

        // 显示提示
        toast({
          title: "已添加截图",
          description: `成功从剪贴板添加${imageFiles.length}张图片`,
        })
      }
    },
    [allowPaste, autoUpload, handleAddFiles, toast]
  )

  // 添加和移除粘贴事件监听
  useEffect(() => {
    if (allowPaste) {
      // 添加全局粘贴事件监听
      document.addEventListener('paste', handlePaste)

      // 清理函数
      return () => {
        document.removeEventListener('paste', handlePaste)
      }
    }
  }, [allowPaste, handlePaste])

  // 处理图片压缩
  const processFiles = async (filesToProcess: File[]): Promise<File[]> => {
    if (!enableCompression || !useCompression) {
      console.log('图片压缩已禁用，跳过压缩');
      return filesToProcess;
    }

    // 如果没有文件需要处理，直接返回
    if (!filesToProcess || filesToProcess.length === 0) {
      console.log('没有文件需要处理');
      return [];
    }

    try {
      // 显示压缩中提示
      toast({
        title: "正在处理图片",
        description: `正在压缩 ${filesToProcess.length} 张图片，请稍候...`,
      });

      console.log('开始压缩图片，参数:', {
        文件数量: filesToProcess.length,
        最大宽度: compressionMaxWidth,
        压缩质量: compressionQuality
      });

      // 压缩图片
      const processed = await compressImages(
        filesToProcess,
        compressionMaxWidth,
        0, // 自动计算高度
        compressionQuality
      );

      // 确保返回的文件数量正确
      if (processed.length !== filesToProcess.length) {
        console.warn(`压缩后文件数量不匹配: 原始=${filesToProcess.length}, 压缩后=${processed.length}`);
      }

      // 显示压缩结果
      const totalOriginalSize = filesToProcess.reduce((sum, file) => sum + file.size, 0);
      const totalCompressedSize = processed.reduce((sum, file) => sum + file.size, 0);

      // 计算节省的空间和压缩率
      const savedBytes = totalOriginalSize - totalCompressedSize;
      const savedPercent = Math.round((savedBytes / totalOriginalSize) * 100);

      console.log('压缩结果:', {
        原始总大小: `${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`,
        压缩后总大小: `${(totalCompressedSize / 1024 / 1024).toFixed(2)} MB`,
        节省空间: `${(savedBytes / 1024 / 1024).toFixed(2)} MB`,
        压缩率: `${savedPercent}%`
      });

      // 只有当实际节省了空间时才显示成功提示
      if (savedPercent > 0) {
        toast({
          title: "图片压缩完成",
          description: `压缩率: ${savedPercent}%，节省了 ${(savedBytes / 1024 / 1024).toFixed(2)} MB`,
        });
      } else if (savedPercent <= 0) {
        console.log('压缩没有节省空间，可能是图片已经很小或格式不适合压缩');
      }

      return processed;
    } catch (error) {
      console.error("图片压缩过程中发生错误:", error);

      // 显示错误提示，但继续使用原始文件
      toast({
        title: "图片压缩失败",
        description: "将使用原始图片上传",
        variant: "warning", // 使用警告而不是错误，因为我们有回退方案
      });

      return filesToProcess;
    }
  }

  // 上传单个文件并跟踪进度
  const uploadSingleFile = async (file: File, index: number): Promise<any> => {
    const formData = new FormData()
    formData.append("file", file)
    if (gallerySaleId) {
      formData.append("gallerySaleId", gallerySaleId.toString())
    }

    // 创建唯一的文件ID用于跟踪进度
    const fileId = `${file.name}-${Date.now()}-${index}`

    // 初始化进度
    setUploadProgress(prev => ({
      ...prev,
      [fileId]: 0
    }))

    // 使用XMLHttpRequest来跟踪上传进度
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      // 监听进度
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: percentComplete
          }))
        }
      })

      // 监听完成
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch (e) {
            reject(new Error('解析响应失败'))
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText)
            reject(new Error(errorResponse.error || '上传失败'))
          } catch (e) {
            reject(new Error(`上传失败，状态码: ${xhr.status}`))
          }
        }
      })

      // 监听错误
      xhr.addEventListener('error', () => {
        reject(new Error('网络错误'))
      })

      // 监听中止
      xhr.addEventListener('abort', () => {
        reject(new Error('上传已取消'))
      })

      // 打开连接并发送
      xhr.open('POST', '/api/upload', true)
      xhr.withCredentials = true // 确保发送凭证
      xhr.send(formData)
    })
  }

  const uploadFiles = async (filesToUpload?: File[]) => {
    const filesToProcess = filesToUpload || files;
    if (filesToProcess.length === 0) {
      console.log('没有文件需要上传');
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadProgress({});

    console.log(`开始上传 ${filesToProcess.length} 个文件`);

    try {
      // 处理文件（压缩等）
      console.log('开始处理文件（压缩等）');
      const processedFiles = await processFiles(filesToProcess);
      console.log(`文件处理完成，准备上传 ${processedFiles.length} 个文件`);

      // 使用Promise.allSettled代替Promise.all，确保一个文件上传失败不会影响其他文件
      const uploadPromises = processedFiles.map((file, index) =>
        uploadSingleFile(file, index).catch(error => {
          console.error(`文件 ${file.name} 上传失败:`, error);
          // 返回一个错误对象，而不是抛出异常
          return { error, file };
        })
      );

      // 计算总体进度
      const progressInterval = setInterval(() => {
        const values = Object.values(uploadProgress);
        if (values.length > 0) {
          const avgProgress = values.reduce((sum, val) => sum + val, 0) / values.length;
          setProgress(avgProgress);
        }
      }, 100);

      // 等待所有上传完成
      const results = await Promise.allSettled(uploadPromises);
      clearInterval(progressInterval);
      setProgress(100);

      // 处理上传结果
      const successResults = results
        .filter(result => result.status === 'fulfilled' && result.value && !result.value.error)
        .map(result => (result.status === 'fulfilled' ? result.value : null))
        .filter(Boolean);

      // 统计成功和失败的数量
      const successCount = successResults.length;
      const failCount = results.length - successCount;

      console.log(`上传完成: 成功=${successCount}, 失败=${failCount}`);

      if (successCount === 0) {
        throw new Error('所有文件上传失败');
      }

      // 获取上传的文件URL
      const urls = successResults.map(result => result.file.url);

      // 更新已上传URL列表
      setUploadedUrls(prev => {
        // 如果是单文件模式，替换所有URL
        if (maxFiles === 1) {
          return urls;
        }
        // 否则添加新URL
        return [...prev, ...urls];
      });

      // 如果是第一次上传，设置第一张图片为主图
      if (uploadedUrls.length === 0 && urls.length > 0) {
        setPrimaryImageIndex(0);
        if (onPrimaryImageChange) {
          onPrimaryImageChange(urls[0]);
        }
      }

      // 调用回调函数
      if (urls.length > 0) {
        // 单文件回调
        if (onUploadComplete) {
          onUploadComplete(urls[0]); // 如果只需要一个URL，传递第一个
        }
        if (onUpload) {
          onUpload(urls[0]); // 兼容旧的接口
        }

        // 多文件回调
        if (onMultiUploadComplete) {
          onMultiUploadComplete(urls);
        }
      }

      // 显示上传结果提示
      if (failCount > 0) {
        toast({
          title: "部分上传成功",
          description: `成功上传 ${successCount} 个文件，${failCount} 个文件上传失败`,
          variant: "warning",
        });
      } else {
        toast({
          title: "上传成功",
          description: `成功上传 ${urls.length} 个文件`,
        });
      }

      // 清空已上传的文件
      if (!filesToUpload) {
        setFiles([]);
      } else {
        // 如果是指定文件上传，只移除这些文件
        setFiles(prev =>
          prev.filter(file => !filesToUpload.includes(file))
        );
      }
    } catch (error) {
      console.error("上传过程中发生错误:", error);
      toast({
        title: "上传失败",
        description: error instanceof Error ? error.message : "文件上传失败，请稍后再试",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  }

  // 处理图片排序
  const handleReorderImages = (newOrder: string[]) => {
    setUploadedUrls(newOrder)

    // 更新主图索引
    const primaryUrl = uploadedUrls[primaryImageIndex]
    const newPrimaryIndex = newOrder.findIndex(url => url === primaryUrl)

    if (newPrimaryIndex !== -1) {
      setPrimaryImageIndex(newPrimaryIndex)
    } else if (newOrder.length > 0) {
      // 如果找不到原来的主图，设置第一张为主图
      setPrimaryImageIndex(0)
      if (onPrimaryImageChange) {
        onPrimaryImageChange(newOrder[0])
      }
    }

    // 调用多图片回调
    if (onMultiUploadComplete) {
      onMultiUploadComplete(newOrder)
    }
  }

  // 设置主图
  const handleSetPrimaryImage = (index: number) => {
    setPrimaryImageIndex(index)

    // 调用主图变更回调
    if (onPrimaryImageChange && uploadedUrls[index]) {
      onPrimaryImageChange(uploadedUrls[index])
    }
  }

  // 移除图片
  const handleRemoveImage = (index: number) => {
    const newUrls = [...uploadedUrls]
    newUrls.splice(index, 1)
    setUploadedUrls(newUrls)

    // 如果删除的是主图，更新主图索引
    if (index === primaryImageIndex) {
      if (newUrls.length > 0) {
        setPrimaryImageIndex(0)
        if (onPrimaryImageChange) {
          onPrimaryImageChange(newUrls[0])
        }
      }
    } else if (index < primaryImageIndex) {
      // 如果删除的图片在主图之前，主图索引需要减1
      setPrimaryImageIndex(primaryImageIndex - 1)
    }

    // 调用多图片回调
    if (onMultiUploadComplete) {
      onMultiUploadComplete(newUrls)
    }
  }

  // 切换排序模式
  const toggleSortMode = () => {
    setShowSortableGrid(!showSortableGrid)
  }

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <div
        {...getRootProps()}
        ref={dropzoneRef}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-primary"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <UploadIcon className="h-8 w-8 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-foreground font-medium">拖放文件到这里...</p>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">
                拖放文件到这里，或者 <span className="text-primary underline">点击浏览</span>
              </p>
              <p className="text-xs text-muted-foreground">
                支持的文件类型: JPG, PNG, GIF, WEBP (最大 {maxSize / 1024 / 1024}MB)
              </p>
              <p className="text-xs text-muted-foreground">
                最多可上传 {maxFiles} 张图片
              </p>
              {allowPaste && (
                <div className="flex items-center mt-2 text-xs text-foreground bg-muted border border-border px-3 py-1.5 rounded-full shadow-sm">
                  <ClipboardIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                  <span className="font-medium">支持截图后直接粘贴 (Ctrl+V)</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 工具栏 */}
      {(enableCompression || enableSorting) && uploadedUrls.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {enableSorting && uploadedUrls.length > 1 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={showSortableGrid ? "default" : "outline"}
                      size="sm"
                      onClick={toggleSortMode}
                      className="h-8"
                    >
                      <ArrowUpDownIcon className="h-4 w-4 mr-1" />
                      {showSortableGrid ? "完成排序" : "排序图片"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>拖拽图片调整顺序，设置主图</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {enableCompression && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <SettingsIcon className="h-4 w-4 mr-1" />
                  图片设置
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">图片压缩设置</h4>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="compression"
                      checked={useCompression}
                      onCheckedChange={setUseCompression}
                    />
                    <Label htmlFor="compression">启用图片压缩</Label>
                  </div>

                  {useCompression && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="quality">压缩质量: {Math.round(compressionQuality * 100)}%</Label>
                        </div>
                        <Slider
                          id="quality"
                          min={0.5}
                          max={1}
                          step={0.05}
                          value={[compressionQuality]}
                          onValueChange={(value) => setCompressionQuality(value[0])}
                        />
                        <p className="text-xs text-muted-foreground">
                          较低的质量可以减小文件大小，但可能影响图片清晰度
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="maxWidth">最大宽度: {compressionMaxWidth}px</Label>
                        </div>
                        <Slider
                          id="maxWidth"
                          min={800}
                          max={3840}
                          step={100}
                          value={[compressionMaxWidth]}
                          onValueChange={(value) => setCompressionMaxWidth(value[0])}
                        />
                        <p className="text-xs text-muted-foreground">
                          限制图片最大尺寸，超过此尺寸的图片将被等比例缩小
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}

      {/* 待上传文件列表 */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">已选择的文件:</p>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeFile(index)} disabled={uploading}>
                  <XIcon className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 上传进度 */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-gray-500">上传中... {Math.round(progress)}%</p>
        </div>
      )}

      {/* 上传按钮 */}
      {files.length > 0 && (
        <Button onClick={() => uploadFiles()} disabled={uploading} className="w-full">
          {uploading ? "上传中..." : `上传${files.length}个文件`}
        </Button>
      )}

      {/* 已上传图片 - 排序模式 */}
      {uploadedUrls.length > 0 && showSortableGrid && enableSorting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">拖拽图片调整顺序 ({uploadedUrls.length}/{maxFiles})</p>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSortMode}
              className="h-8 text-xs"
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              完成排序
            </Button>
          </div>

          <SortableImageGrid
            images={uploadedUrls}
            primaryImageIndex={primaryImageIndex}
            onReorder={handleReorderImages}
            onSetPrimary={handleSetPrimaryImage}
            onRemove={handleRemoveImage}
          />
        </div>
      )}

      {/* 已上传图片 - 普通模式 */}
      {uploadedUrls.length > 0 && !showSortableGrid && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">已上传的图片 ({uploadedUrls.length}/{maxFiles}):</p>
            <div className="flex items-center space-x-2">
              {uploadedUrls.length > 1 && enableSorting && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSortMode}
                  className="h-8 text-xs"
                >
                  <ArrowUpDownIcon className="h-4 w-4 mr-1" />
                  排序图片
                </Button>
              )}
              {uploadedUrls.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm("确定要清空所有图片吗？")) {
                      setUploadedUrls([])
                      if (onMultiUploadComplete) {
                        onMultiUploadComplete([])
                      }
                    }
                  }}
                  className="h-8 text-xs"
                >
                  清空
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {uploadedUrls.map((url, index) => (
              <div
                key={index}
                className={`relative group aspect-square rounded-md overflow-hidden border ${
                  index === primaryImageIndex ? 'ring-2 ring-primary' : ''
                }`}
              >
                <img
                  src={url || "/placeholder.svg"}
                  alt={`Uploaded ${index + 1}`}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* 设为主图按钮 */}
                  {index !== primaryImageIndex && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 bg-white/90 hover:bg-white"
                      onClick={() => handleSetPrimaryImage(index)}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </Button>
                  )}

                  {/* 删除按钮 */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2">
                  {index === primaryImageIndex ? (
                    <div className="flex items-center justify-between">
                      <span>图片 {index + 1}</span>
                      <span className="bg-primary text-white px-1.5 py-0.5 rounded-sm text-[10px]">主图</span>
                    </div>
                  ) : (
                    <span>图片 {index + 1}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
