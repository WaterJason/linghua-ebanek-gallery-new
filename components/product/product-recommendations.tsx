"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Product } from "@/types/product"
import { ImageIcon, ExternalLinkIcon } from "lucide-react"
import Link from "next/link"

interface ProductRecommendationsProps {
  product: Product
  allProducts: Product[]
  maxRecommendations?: number
}

export function ProductRecommendations({
  product,
  allProducts,
  maxRecommendations = 4
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([])
  
  // 计算产品相似度
  const calculateSimilarity = (product1: Product, product2: Product): number => {
    let score = 0
    
    // 相同分类加分
    if (product1.category && product2.category && product1.category === product2.category) {
      score += 3
    }
    
    // 相同材质加分
    if (product1.material && product2.material && product1.material === product2.material) {
      score += 2
    }
    
    // 价格相近加分 (价格差异在20%以内)
    const priceDiff = Math.abs(product1.price - product2.price) / product1.price
    if (priceDiff <= 0.2) {
      score += 2 * (1 - priceDiff)
    }
    
    // 名称相似加分 (包含相同关键词)
    const words1 = product1.name.toLowerCase().split(/\s+/)
    const words2 = product2.name.toLowerCase().split(/\s+/)
    const commonWords = words1.filter(word => words2.includes(word))
    score += commonWords.length * 0.5
    
    return score
  }
  
  // 生成推荐
  useEffect(() => {
    if (!product || !allProducts || allProducts.length === 0) {
      setRecommendations([])
      return
    }
    
    // 计算所有产品与当前产品的相似度
    const productsWithSimilarity = allProducts
      .filter(p => p.id !== product.id) // 排除当前产品
      .map(p => ({
        product: p,
        similarity: calculateSimilarity(product, p)
      }))
      .sort((a, b) => b.similarity - a.similarity) // 按相似度降序排序
      .slice(0, maxRecommendations) // 取前N个
      .map(item => item.product)
    
    setRecommendations(productsWithSimilarity)
  }, [product, allProducts, maxRecommendations])
  
  if (recommendations.length === 0) {
    return null
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">相关产品推荐</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recommendations.map(recommendation => (
            <Link 
              key={recommendation.id} 
              href={`/products/${recommendation.id}`}
              className="group"
            >
              <div className="space-y-2">
                <div className="aspect-square rounded-md overflow-hidden bg-muted">
                  {recommendation.imageUrl ? (
                    <img
                      src={recommendation.imageUrl}
                      alt={recommendation.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                    {recommendation.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    ¥{recommendation.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          根据分类、材质、价格等因素推荐的相关产品
        </p>
      </CardFooter>
    </Card>
  )
}

// 产品详情页推荐组件
export function ProductDetailRecommendations({
  product,
  allProducts,
  maxRecommendations = 4
}: ProductRecommendationsProps) {
  // 使用基础推荐组件
  return (
    <ProductRecommendations
      product={product}
      allProducts={allProducts}
      maxRecommendations={maxRecommendations}
    />
  )
}

// 产品列表页推荐组件
export function ProductListRecommendations({
  products,
  maxProducts = 4,
  title = "热门产品"
}: {
  products: Product[]
  maxProducts?: number
  title?: string
}) {
  // 根据库存和价格计算产品热度
  const getPopularProducts = (products: Product[]): Product[] => {
    return [...products]
      .filter(p => p.inventory && p.inventory > 0) // 只推荐有库存的产品
      .sort((a, b) => {
        // 计算热度分数 (可以根据需要调整算法)
        const scoreA = (a.inventory || 0) * 0.3 + a.price * 0.7
        const scoreB = (b.inventory || 0) * 0.3 + b.price * 0.7
        return scoreB - scoreA
      })
      .slice(0, maxProducts)
  }
  
  const popularProducts = getPopularProducts(products)
  
  if (popularProducts.length === 0) {
    return null
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {popularProducts.map(product => (
            <Link 
              key={product.id} 
              href={`/products/${product.id}`}
              className="group"
            >
              <div className="space-y-2">
                <div className="aspect-square rounded-md overflow-hidden bg-muted">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    ¥{product.price.toFixed(2)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          根据库存和价格推荐的热门产品
        </p>
        <Button variant="link" size="sm" className="p-0 h-auto" asChild>
          <Link href="/products">
            查看全部
            <ExternalLinkIcon className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
