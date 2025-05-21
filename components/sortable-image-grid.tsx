"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ImagePreview } from "@/components/image-preview"
import { XIcon, CheckIcon, EyeIcon, StarIcon, MoveIcon } from "lucide-react"

interface SortableItemProps {
  id: string
  url: string
  index: number
  isPrimary: boolean
  onSetPrimary: (id: string) => void
  onRemove: (id: string) => void
  onPreview: (url: string) => void
}

function SortableItem({ id, url, index, isPrimary, onSetPrimary, onRemove, onPreview }: SortableItemProps) {
  return (
    <div
      className={`relative border rounded-md overflow-hidden group touch-manipulation ${
        isPrimary ? 'ring-2 ring-primary' : ''
      }`}
    >
      <div className="aspect-square relative">
        <div className="absolute top-2 left-2 z-10 bg-black/50 text-white p-1 rounded">
          <MoveIcon className="h-4 w-4" />
        </div>
        <img
          src={url || "/placeholder.svg"}
          alt={`图片 ${index + 1}`}
          className="object-cover w-full h-full"
          onError={(e) => {
            console.error("图片加载失败:", url)
            e.currentTarget.src = "/placeholder.svg"
          }}
        />
      </div>
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {/* 预览按钮 */}
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-white/90 hover:bg-white"
          onClick={(e) => {
            e.stopPropagation()
            onPreview(url)
          }}
        >
          <EyeIcon className="h-4 w-4" />
        </Button>

        {/* 设为主图按钮 */}
        {!isPrimary && (
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation()
              onSetPrimary(id)
            }}
          >
            <StarIcon className="h-4 w-4" />
          </Button>
        )}

        {/* 删除按钮 */}
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(id)
          }}
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 px-2">
        {isPrimary ? (
          <div className="flex items-center justify-between">
            <span>图片 {index + 1}</span>
            <span className="bg-primary text-white px-1.5 py-0.5 rounded-sm text-[10px]">主图</span>
          </div>
        ) : (
          <span>图片 {index + 1}</span>
        )}
      </div>
    </div>
  )
}

interface SortableImageGridProps {
  images: string[]
  primaryImageIndex: number
  onReorder: (newOrder: string[]) => void
  onSetPrimary: (index: number) => void
  onRemove: (index: number) => void
}

export function SortableImageGrid({
  images,
  primaryImageIndex,
  onReorder,
  onSetPrimary,
  onRemove,
}: SortableImageGridProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // 简化版的拖拽排序 - 使用按钮上下移动
  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === images.length - 1)
    ) {
      return; // 已经在最顶部或最底部
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newImages = [...images];

    // 交换位置
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];

    // 调用回调
    onReorder(newImages);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {images.map((url, index) => (
          <div key={url} className="relative">
            <SortableItem
              id={url}
              url={url}
              index={index}
              isPrimary={index === primaryImageIndex}
              onSetPrimary={() => onSetPrimary(index)}
              onRemove={() => onRemove(index)}
              onPreview={(url) => setPreviewImage(url)}
            />
            <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
              {index > 0 && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6 bg-black/50 hover:bg-black/70"
                  onClick={() => moveImage(index, 'up')}
                >
                  <span className="sr-only">上移</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                </Button>
              )}
              {index < images.length - 1 && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6 bg-black/50 hover:bg-black/70"
                  onClick={() => moveImage(index, 'down')}
                >
                  <span className="sr-only">下移</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 图片预览对话框 */}
      {previewImage && (
        <ImagePreview
          open={!!previewImage}
          onOpenChange={() => setPreviewImage(null)}
          imageUrl={previewImage}
          title="图片预览"
          allowEdit={false}
        />
      )}
    </>
  )
}
