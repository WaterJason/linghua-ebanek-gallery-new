"use client"

import { ProductList } from "./product-list"
import { Product, ProductCategory, ProductFilter } from "@/types/product"

interface ProductListMobileProps {
  products: Product[]
  categories: ProductCategory[]
  filter: ProductFilter
  onFilterChange: (filter: Partial<ProductFilter>) => void
  onAddProduct: () => void
  onEditProduct: (product: Product) => void
  onDeleteProduct: (productId: number) => void
  onSelectionChange: (productIds: number[]) => void
  isLoading?: boolean
}

export function ProductListMobile(props: ProductListMobileProps) {
  // 暂时使用桌面版组件，后续可以优化为移动端专用布局
  return <ProductList {...props} />
}
