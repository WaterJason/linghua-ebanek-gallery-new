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
  DownloadIcon,
  XIcon,
  MaximizeIcon,
  MinimizeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "lucide-react"
import { Product } from "@/types/product"

interface ProductImagePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialImageUrl: string | null
  product: Product | null
  products: Product[]
}

export function ProductImagePreview({
  open,
  onOpenChange,
  initialImageUrl,
  product,
  products
}: ProductImagePreviewProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentProductIndex, setCurrentProductIndex] = useState(-1)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 重置状态并设置当前产品和图片
  useEffect(() => {
    if (open && product) {
      setZoom(1)
      setRotation(0)
      
      // 查找当前产品在产品列表中的索引
      const productIndex = products.findIndex(p => p.id === product.id)
      setCurrentProductIndex(productIndex)
      
      // 设置当前产品的图片列表
      const urls: string[] = []
      if (product.imageUrl) {
        urls.push(product.imageUrl)
      }
      if (product.imageUrls && Array.isArray(product.imageUrls)) {
        // 过滤掉已经包含的主图
        const additionalUrls = product.imageUrls.filter(url => url !== product.imageUrl)
        urls.push(...additionalUrls)
      }
      setImageUrls(urls)
      
      // 如果提供了初始图片URL，找到它在图片列表中的索引
      if (initialImageUrl && urls.includes(initialImageUrl)) {
        setCurrentImageIndex(urls.indexOf(initialImageUrl))
      } else {
        setCurrentImageIndex(0)
      }
    }
  }, [open, product, products, initialImageUrl])
  
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
  
  // 处理下载
  const handleDownload = () => {
    if (imageUrls.length === 0 || currentImageIndex >= imageUrls.length) return
    
    const link = document.createElement('a')
    link.href = imageUrls[currentImageIndex]
    link.download = `product-image-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  // 切换到下一张图片
  const nextImage = () => {
    if (imageUrls.length <= 1) return
    setCurrentImageIndex(prev => (prev + 1) % imageUrls.length)
    resetTransform()
  }
  
  // 切换到上一张图片
  const prevImage = () => {
    if (imageUrls.length <= 1) return
    setCurrentImageIndex(prev => (prev - 1 + imageUrls.length) % imageUrls.length)
    resetTransform()
  }
  
  // 切换到下一个产品
  const nextProduct = () => {
    if (products.length <= 1 || currentProductIndex < 0) return
    const nextIndex = (currentProductIndex + 1) % products.length
    const nextProduct = products[nextIndex]
    
    // 重置变换并设置新产品
    resetTransform()
    setCurrentProductIndex(nextIndex)
    
    // 设置新产品的图片
    const urls: string[] = []
    if (nextProduct.imageUrl) {
      urls.push(nextProduct.imageUrl)
    }
    if (nextProduct.imageUrls && Array.isArray(nextProduct.imageUrls)) {
      const additionalUrls = nextProduct.imageUrls.filter(url => url !== nextProduct.imageUrl)
      urls.push(...additionalUrls)
    }
    setImageUrls(urls)
    setCurrentImageIndex(0)
  }
  
  // 切换到上一个产品
  const prevProduct = () => {
    if (products.length <= 1 || currentProductIndex < 0) return
    const prevIndex = (currentProductIndex - 1 + products.length) % products.length
    const prevProduct = products[prevIndex]
    
    // 重置变换并设置新产品
    resetTransform()
    setCurrentProductIndex(prevIndex)
    
    // 设置新产品的图片
    const urls: string[] = []
    if (prevProduct.imageUrl) {
      urls.push(prevProduct.imageUrl)
    }
    if (prevProduct.imageUrls && Array.isArray(prevProduct.imageUrls)) {
      const additionalUrls = prevProduct.imageUrls.filter(url => url !== prevProduct.imageUrl)
      urls.push(...additionalUrls)
    }
    setImageUrls(urls)
    setCurrentImageIndex(0)
  }
  
  // 重置变换
  const resetTransform = () => {
    setZoom(1)
    setRotation(0)
  }
  
  // 获取当前产品名称
  const getCurrentProductName = () => {
    if (currentProductIndex >= 0 && currentProductIndex < products.length) {
      return products[currentProductIndex].name
    }
    return "产品图片预览"
  }
  
  // 获取当前图片URL
  const getCurrentImageUrl = () => {
    if (imageUrls.length > 0 && currentImageIndex < imageUrls.length) {
      return imageUrls[currentImageIndex]
    }
    return null
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${isFullscreen ? 'w-screen h-screen max-w-none m-0 rounded-none' : 'max-w-4xl'} p-0 overflow-hidden`}
      >
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="truncate max-w-[200px]">{getCurrentProductName()}</span>
              {imageUrls.length > 1 && (
                <span className="text-sm text-muted-foreground">
                  {currentImageIndex + 1} / {imageUrls.length}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
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
          {/* 左侧产品导航按钮 */}
          {products.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white z-10"
              onClick={prevProduct}
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </Button>
          )}
          
          {/* 左侧图片导航按钮 */}
          {imageUrls.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-16 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white z-10"
              onClick={prevImage}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
          )}
          
          {/* 图片 */}
          {getCurrentImageUrl() ? (
            <img
              ref={imageRef}
              src={getCurrentImageUrl() || ''}
              alt={getCurrentProductName()}
              className="max-h-full transition-transform"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
                cursor: 'grab',
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full text-muted-foreground">
              无图片可预览
            </div>
          )}
          
          {/* 右侧图片导航按钮 */}
          {imageUrls.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-16 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white z-10"
              onClick={nextImage}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </Button>
          )}
          
          {/* 右侧产品导航按钮 */}
          {products.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white z-10"
              onClick={nextProduct}
            >
              <ChevronRightIcon className="h-6 w-6" />
            </Button>
          )}
        </div>
        
        {/* 缩略图导航 */}
        {imageUrls.length > 1 && (
          <div className="p-2 border-t flex items-center justify-center gap-2 overflow-x-auto">
            {imageUrls.map((url, index) => (
              <div
                key={index}
                className={`w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2 ${
                  index === currentImageIndex ? 'border-primary' : 'border-transparent'
                }`}
                onClick={() => {
                  setCurrentImageIndex(index)
                  resetTransform()
                }}
              >
                <img
                  src={url}
                  alt={`缩略图 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
