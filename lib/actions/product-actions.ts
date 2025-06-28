"use server"

/**
 * 产品管理模块
 * 
 * 本模块提供产品管理相关的功能，包括产品的增删改查、分类管理等。
 * 基于产品管理模块重构，排除SKU、成本价格、佣金率、详情字段。
 * 
 * @module 产品管理
 * @category 核心模块
 */

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

/**
 * 获取所有产品
 * 
 * @returns 产品列表
 */
export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        type: {
          notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
        }
      },
      include: {
        productCategory: true,
        productTags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    })

    return products
  } catch (error) {
    console.error("Error fetching products:", error)
    throw new Error("Failed to fetch products")
  }
}

/**
 * 根据ID获取单个产品
 * 
 * @param id 产品ID
 * @returns 产品信息
 */
export async function getProduct(id: number) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productCategory: true,
        productTags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return product
  } catch (error) {
    console.error("Error fetching product:", error)
    throw new Error("Failed to fetch product")
  }
}

/**
 * 创建产品
 * 
 * @param data 产品数据（排除SKU、成本价格、佣金率、详情字段）
 * @returns 创建的产品
 */
export async function createProduct(data: any) {
  try {
    // 验证必填字段
    if (!data.name || !data.price) {
      throw new Error("产品名称和价格为必填项")
    }

    // 准备产品数据 - 排除指定字段
    const productData = {
      name: data.name.trim(),
      price: Number.parseFloat(data.price || "0"),
      type: data.type || "product",
      imageUrl: data.imageUrl,
      imageUrls: data.imageUrls || [],
      description: data.description,
      categoryId: data.categoryId === "uncategorized" ? null : data.categoryId ? parseInt(data.categoryId) : null,
      barcode: data.barcode || null,
      dimensions: data.dimensions || null,
      material: data.material || "珐琅", // 默认值
      unit: data.unit || "套", // 默认值
      inventory: data.inventory ? Number.parseInt(data.inventory) : null,
    }

    const product = await prisma.product.create({
      data: productData,
      include: {
        productCategory: true,
        productTags: {
          include: {
            tag: true,
          },
        },
      },
    })

    revalidatePath("/products")
    return product
  } catch (error) {
    console.error("Error creating product:", error)
    throw new Error("Failed to create product")
  }
}

/**
 * 更新产品
 * 
 * @param id 产品ID
 * @param data 更新数据
 * @returns 更新后的产品
 */
export async function updateProduct(id: number, data: any) {
  try {
    // 验证必填字段
    if (!data.name || !data.price) {
      throw new Error("产品名称和价格为必填项")
    }

    // 检查产品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      throw new Error("产品不存在")
    }

    // 更新产品 - 排除指定字段
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name.trim(),
        price: Number.parseFloat(data.price || "0"),
        type: data.type || "product",
        imageUrl: data.imageUrl,
        imageUrls: data.imageUrls || [],
        description: data.description,
        categoryId: data.categoryId === "uncategorized" ? null : data.categoryId ? parseInt(data.categoryId) : null,
        barcode: data.barcode || null,
        dimensions: data.dimensions || null,
        material: data.material || "珐琅",
        unit: data.unit || "套",
        inventory: data.inventory ? Number.parseInt(data.inventory) : null,
      },
      include: {
        productCategory: true,
        productTags: {
          include: {
            tag: true,
          },
        },
      },
    })

    revalidatePath("/products")
    return product
  } catch (error) {
    console.error("Error updating product:", error)
    throw new Error("Failed to update product")
  }
}

/**
 * 删除产品
 * 
 * @param id 产品ID
 * @returns 删除结果
 */
export async function deleteProduct(id: number) {
  try {
    // 检查产品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      throw new Error("产品不存在")
    }

    // 删除产品
    await prisma.product.delete({
      where: { id }
    })

    revalidatePath("/products")
    return { success: true }
  } catch (error) {
    console.error("Error deleting product:", error)
    throw new Error("Failed to delete product")
  }
}

/**
 * 获取产品分类
 * 
 * @returns 分类列表
 */
export async function getProductCategories() {
  try {
    const categories = await prisma.productCategory.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: [
        { level: "asc" },
        { sortOrder: "asc" },
        { name: "asc" }
      ],
    })

    return categories
  } catch (error) {
    console.error("Error fetching product categories:", error)
    throw new Error("Failed to fetch product categories")
  }
}

/**
 * 创建产品分类
 * 
 * @param data 分类数据
 * @returns 创建的分类
 */
export async function createProductCategory(data: any) {
  try {
    // 验证必填字段
    if (!data.name) {
      throw new Error("分类名称为必填项")
    }

    // 检查分类名称是否已存在
    const existingCategory = await prisma.productCategory.findFirst({
      where: { 
        name: data.name.trim(),
        parentId: data.parentId || null
      }
    })

    if (existingCategory) {
      throw new Error("同级分类名称已存在")
    }

    // 计算层级和路径
    let level = 1
    let path = data.name.trim()
    
    if (data.parentId) {
      const parentCategory = await prisma.productCategory.findUnique({
        where: { id: parseInt(data.parentId) }
      })
      
      if (!parentCategory) {
        throw new Error("父分类不存在")
      }
      
      level = (parentCategory.level || 1) + 1
      path = `${parentCategory.path || parentCategory.name}/${data.name.trim()}`
    }

    // 准备分类数据
    const categoryData = {
      name: data.name.trim(),
      code: data.code?.trim() || null,
      parentId: data.parentId ? parseInt(data.parentId) : null,
      description: data.description?.trim() || null,
      imageUrl: data.imageUrl || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      sortOrder: data.sortOrder || 0,
      level,
      path,
    }

    const category = await prisma.productCategory.create({
      data: categoryData,
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    revalidatePath("/products")
    return category
  } catch (error) {
    console.error("Error creating product category:", error)
    throw new Error("Failed to create product category")
  }
}

/**
 * 更新产品分类
 * 
 * @param id 分类ID
 * @param data 更新数据
 * @returns 更新后的分类
 */
export async function updateProductCategory(id: number, data: any) {
  try {
    // 验证必填字段
    if (!data.name) {
      throw new Error("分类名称为必填项")
    }

    // 检查分类是否存在
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      throw new Error("分类不存在")
    }

    // 检查分类名称是否已存在（排除当前分类）
    const duplicateCategory = await prisma.productCategory.findFirst({
      where: { 
        name: data.name.trim(),
        parentId: data.parentId || null,
        id: { not: id }
      }
    })

    if (duplicateCategory) {
      throw new Error("同级分类名称已存在")
    }

    // 计算层级和路径
    let level = 1
    let path = data.name.trim()
    
    if (data.parentId) {
      const parentCategory = await prisma.productCategory.findUnique({
        where: { id: parseInt(data.parentId) }
      })
      
      if (!parentCategory) {
        throw new Error("父分类不存在")
      }
      
      // 防止循环引用
      if (parentCategory.id === id) {
        throw new Error("不能将分类设置为自己的父分类")
      }
      
      level = (parentCategory.level || 1) + 1
      path = `${parentCategory.path || parentCategory.name}/${data.name.trim()}`
    }

    // 更新分类
    const category = await prisma.productCategory.update({
      where: { id },
      data: {
        name: data.name.trim(),
        code: data.code?.trim() || null,
        parentId: data.parentId ? parseInt(data.parentId) : null,
        description: data.description?.trim() || null,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        sortOrder: data.sortOrder || 0,
        level,
        path,
      },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    revalidatePath("/products")
    return category
  } catch (error) {
    console.error("Error updating product category:", error)
    throw new Error("Failed to update product category")
  }
}

/**
 * 删除产品分类
 * 
 * @param id 分类ID
 * @returns 删除结果
 */
export async function deleteProductCategory(id: number) {
  try {
    // 检查分类是否存在
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    })

    if (!existingCategory) {
      throw new Error("分类不存在")
    }

    // 检查是否有子分类
    if (existingCategory.children && existingCategory.children.length > 0) {
      throw new Error("该分类下有子分类，无法删除")
    }

    // 检查是否有关联的产品
    if (existingCategory._count.products > 0) {
      throw new Error("该分类下有产品，无法删除")
    }

    // 删除分类
    await prisma.productCategory.delete({
      where: { id }
    })

    revalidatePath("/products")
    return { success: true }
  } catch (error) {
    console.error("Error deleting product category:", error)
    throw new Error("Failed to delete product category")
  }
}

// 为了向后兼容，提供artwork相关的别名函数
export const getArtworks = getProducts
export const getArtwork = getProduct
export const createArtwork = createProduct
export const updateArtwork = updateProduct
export const deleteArtwork = deleteProduct
export const getArtworkCategories = getProductCategories
export const createArtworkCategory = createProductCategory
export const updateArtworkCategory = updateProductCategory
export const deleteArtworkCategory = deleteProductCategory
