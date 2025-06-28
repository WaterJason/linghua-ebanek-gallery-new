"use client"

import { ArtworkList } from "./artwork-list"
import { Artwork, ArtworkCategory, ArtworkFilter } from "@/types/artwork"

interface ArtworkListMobileProps {
  artworks: Artwork[]
  categories: ArtworkCategory[]
  filter: ArtworkFilter
  onFilterChange: (filter: Partial<ArtworkFilter>) => void
  onAddArtwork: () => void
  onEditArtwork: (artwork: Artwork) => void
  onDeleteArtwork: (artworkId: number) => void
  onSelectionChange: (artworkIds: number[]) => void
  isLoading?: boolean
}

export function ArtworkListMobile(props: ArtworkListMobileProps) {
  // 暂时使用桌面版组件，后续可以优化为移动端专用布局
  return <ArtworkList {...props} />
}
