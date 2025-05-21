"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { 
  ZoomInIcon, 
  ZoomOutIcon, 
  RotateCwIcon, 
  RotateCcwIcon, 
  CropIcon, 
  DownloadIcon,
  XIcon,
  MaximizeIcon,
  MinimizeIcon,
  CheckIcon
} from "lucide-react"

interface ImagePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
  title?: string
  onSave?: (editedImageUrl: string) => void
  allowEdit?: boolean
}

export function ImagePreview({
  open,
  onOpenChange,
  imageUrl,
  title = "图片预览",
  onSave,
  allowEdit = false
}: ImagePreviewProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isCropping, setIsCropping] = useState(false)
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null)
  
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 重置编辑状态
  useEffect(() => {
    if (open) {
      setZoom(1)
      setRotation(0)
      setIsCropping(false)
      setEditedImageUrl(null)
    }
  }, [open])
  
  // 处理缩放
  const handleZoom = (value: number[]) => {
    setZoom(value[0])
  }
  
  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3))
  }
  
  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5))
  }
  
  // 处理旋转
  const rotateClockwise = () => {
    setRotation(prev => (prev + 90) % 360)
  }
  
  const rotateCounterClockwise = () => {
    setRotation(prev => (prev - 90 + 360) % 360)
  }
  
  // 处理全屏
  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev)
  }
  
  // 处理裁剪
  const toggleCropping = () => {
    setIsCropping(prev => !prev)
  }
  
  // 处理下载
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `image-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  // 应用编辑并保存
  const handleSave = () => {
    if (!imageRef.current || !onSave) return
    
    try {
      // 创建canvas来应用变换
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      const img = imageRef.current
      
      // 设置canvas尺寸
      if (rotation % 180 === 0) {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
      } else {
        // 如果旋转了90/270度，交换宽高
        canvas.width = img.naturalHeight
        canvas.height = img.naturalWidth
      }
      
      // 移动到中心点
      ctx.translate(canvas.width / 2, canvas.height / 2)
      
      // 应用旋转
      ctx.rotate((rotation * Math.PI) / 180)
      
      // 绘制图像
      ctx.drawImage(
        img,
        -img.naturalWidth / 2,
        -img.naturalHeight / 2,
        img.naturalWidth,
        img.naturalHeight
      )
      
      // 转换为base64
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      
      // 保存编辑后的图片
      setEditedImageUrl(dataUrl)
      onSave(dataUrl)
      
      // 关闭预览
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving edited image:', error)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${isFullscreen ? 'w-screen h-screen max-w-none m-0 rounded-none' : 'max-w-4xl'} p-0 overflow-hidden`}
      >
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex items-center space-x-2">
              {allowEdit && (
                <>
                  <Button variant="ghost" size="icon" onClick={zoomOut} disabled={zoom <= 0.5}>
                    <ZoomOutIcon className="h-4 w-4" />
                  </Button>
                  <div className="w-24">
                    <Slider
                      value={[zoom]}
                      min={0.5}
                      max={3}
                      step={0.1}
                      onValueChange={handleZoom}
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={zoomIn} disabled={zoom >= 3}>
                    <ZoomInIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={rotateCounterClockwise}>
                    <RotateCcwIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={rotateClockwise}>
                    <RotateCwIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={toggleCropping} className={isCropping ? 'bg-primary/20' : ''}>
                    <CropIcon className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" onClick={handleDownload}>
                <DownloadIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                {isFullscreen ? <MinimizeIcon className="h-4 w-4" /> : <MaximizeIcon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div 
          ref={containerRef}
          className="relative overflow-auto bg-black/10 flex items-center justify-center"
          style={{
            height: isFullscreen ? 'calc(100vh - 8rem)' : '70vh',
          }}
        >
          <img
            ref={imageRef}
            src={editedImageUrl || imageUrl}
            alt="Preview"
            className="max-h-full transition-transform"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center',
              cursor: isCropping ? 'crosshair' : 'grab',
            }}
          />
        </div>
        
        {allowEdit && (
          <DialogFooter className="p-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              <CheckIcon className="mr-2 h-4 w-4" />
              保存修改
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
