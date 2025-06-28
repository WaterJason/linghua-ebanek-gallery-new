/**
 * 产品管理模块
 *
 * 本模块提供产品管理相关的功能，包括产品的增删改查、产品分类管理、产品库存管理等。
 *
 * @module 产品管理
 * @category 核心模块
 */

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  PrismaProduct,
  PrismaProductCategory,
  CreateProductInput,
  UpdateProductInput,
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
  BatchUpdateProductsInput
} from "@/types/prisma-models";
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateCreateProductCategory,
  validateUpdateProductCategory
} from "@/lib/validation";
import { ProductDataAdapter, FrontendProduct, BackendProductInput, ExtendedPrismaProduct } from "@/lib/data-adapter";

/**
 * 获取所有产品
 *
 * 获取所有产品列表，包括产品分类和标签信息。
 *
 * @returns 产品列表，包含分类和标签信息
 *
 * @example
 * ```typescript
 * // 获取所有产品
 * const products = await getProducts();
 * console.log(products[0].name); // 输出第一个产品的名称
 * console.log(products[0].category); // 输出第一个产品的分类
 * console.log(products[0].tags); // 输出第一个产品的标签列表
 * ```
 *
 * @throws 如果获取产品失败，会抛出错误
 *
 * @category 查询
 */
export async function getProducts(): Promise<FrontendProduct[]> {
  try {
    console.log('🔄 [getProducts] 开始获取产品数据...');

    const products = await prisma.product.findMany({
      where: {
        // 过滤掉所有占位产品 - 关键修复
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
    });

    console.log(`📊 [getProducts] 从数据库获取到 ${products.length} 个产品`);

    // 使用数据适配层转换数据格式
    const adaptedProducts = ProductDataAdapter.toFrontendList(products as ExtendedPrismaProduct[]);

    console.log(`✅ [getProducts] 数据适配完成，返回 ${adaptedProducts.length} 个产品`);
    console.log('🔍 [getProducts] 第一个产品示例:', adaptedProducts[0] ? {
      id: adaptedProducts[0].id,
      name: adaptedProducts[0].name,
      categoryName: adaptedProducts[0].categoryName,
      tags: adaptedProducts[0].tags,
      status: adaptedProducts[0].status
    } : '无产品');

    return adaptedProducts;
  } catch (error) {
    console.error('❌ [getProducts] 获取产品失败:', error);
    // 使用统一的错误处理机制
    const { handleError, DatabaseError } = require('@/lib/error-handler');
    const appError = await handleError(error, 'product-management');
    throw new DatabaseError('获取产品列表失败', { originalError: error }, 'product-management');
  }
}

/**
 * 获取单个产品
 * @param id 产品ID
 * @returns 产品信息，包含分类和标签
 */
export async function getProduct(id: number): Promise<FrontendProduct> {
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
    });

    if (!product) {
      throw new Error("产品不存在");
    }

    // 使用数据适配层转换数据格式
    return ProductDataAdapter.toFrontend(product as ExtendedPrismaProduct);
  } catch (error) {
    console.error("Error getting product:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to get product");
  }
}

/**
 * 创建产品
 * @param data 产品数据
 * @returns 创建的产品
 */
export async function createProduct(data: CreateProductInput): Promise<PrismaProduct> {
  try {
    console.log("创建产品，输入数据:", data);

    // 验证数据
    const validation = validateCreateProduct(data);
    if (!validation.isValid) {
      console.error("产品数据验证失败:", validation.errors);
      throw new Error(`数据验证失败: ${validation.errors.join("; ")}`);
    }

    // 检查产品是否已存在（仅检查非空字段）
    const whereConditions = [];
    if (data.name) whereConditions.push({ name: data.name });
    if (data.sku) whereConditions.push({ sku: data.sku });
    if (data.barcode) whereConditions.push({ barcode: data.barcode });

    if (whereConditions.length > 0) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          OR: whereConditions,
        },
      });

      if (existingProduct) {
        throw new Error(`产品已存在: ${existingProduct.name}`);
      }
    }

    // 创建产品
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description || "",
        sku: data.sku || "",
        barcode: data.barcode || "",
        price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
        commissionRate: data.commissionRate ? (typeof data.commissionRate === 'string' ? parseFloat(data.commissionRate) : data.commissionRate) : 0,
        cost: data.cost ? (typeof data.cost === 'string' ? parseFloat(data.cost) : data.cost) : null,
        categoryId: data.categoryId ? (typeof data.categoryId === 'string' ? parseInt(data.categoryId) : data.categoryId) : null,
        unit: data.unit || null,
        imageUrl: data.imageUrl || null,
        imageUrls: data.imageUrls || [],
        dimensions: data.dimensions || null,
        material: data.material || null,
        details: data.details || null,
        inventory: data.inventory || null,
        type: data.type || "product",
        // 移除 isActive 字段，因为 Product 模型中没有这个字段
      },
    });

    // 如果提供了标签，关联标签
    if (data.tagIds && Array.isArray(data.tagIds) && data.tagIds.length > 0) {
      for (const tagId of data.tagIds) {
        await prisma.productTagsOnProducts.create({
          data: {
            productId: product.id,
            tagId: parseInt(tagId),
          },
        });
      }
    }

    console.log("产品创建成功:", product);
    revalidatePath("/products");
    return product;
  } catch (error) {
    console.error("创建产品时发生错误:", error);
    throw error instanceof Error ? error : new Error("创建产品失败");
  }
}

/**
 * 更新产品
 * @param id 产品ID
 * @param data 更新的产品数据
 * @returns 更新后的产品
 */
export async function updateProduct(id: number, data: UpdateProductInput): Promise<PrismaProduct> {
  try {
    // 验证数据
    const validation = validateUpdateProduct(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 检查产品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new Error("产品不存在");
    }

    // 准备更新数据
    const updateData: any = {};

    // 只更新提供的字段
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.barcode !== undefined) updateData.barcode = data.barcode;
    if (data.price !== undefined) updateData.price = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
    if (data.commissionRate !== undefined) updateData.commissionRate = typeof data.commissionRate === 'string' ? parseFloat(data.commissionRate) : data.commissionRate;
    if (data.cost !== undefined) updateData.cost = data.cost !== null ? (typeof data.cost === 'string' ? parseFloat(data.cost) : data.cost) : null;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId !== null ? (typeof data.categoryId === 'string' ? parseInt(data.categoryId) : data.categoryId) : null;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.imageUrls !== undefined) updateData.imageUrls = data.imageUrls;
    if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
    if (data.material !== undefined) updateData.material = data.material;
    if (data.details !== undefined) updateData.details = data.details;
    if (data.inventory !== undefined) updateData.inventory = data.inventory;
    if (data.type !== undefined) updateData.type = data.type;
    // 移除 isActive 字段，因为 Product 模型中没有这个字段

    // 如果更新了库存，同步更新库存管理模块
    if (data.inventory !== undefined) {
      try {
        // 查找现有库存记录
        const existingInventory = await prisma.inventoryItem.findFirst({
          where: { productId: id },
        });

        if (existingInventory) {
          // 更新库存记录
          await prisma.inventoryItem.update({
            where: { id: existingInventory.id },
            data: { quantity: Number(data.inventory) },
          });

          // 记录库存变更
          await prisma.inventoryTransaction.create({
            data: {
              productId: id,
              quantity: Number(data.inventory) - existingInventory.quantity,
              type: "adjustment",
              notes: `从产品管理模块更新库存`,
              sourceWarehouseId: existingInventory.warehouseId,
            },
          });
        } else {
          // 查找默认仓库
          const defaultWarehouse = await prisma.warehouse.findFirst({
            where: { isDefault: true },
          });

          if (defaultWarehouse) {
            // 创建新的库存记录
            await prisma.inventoryItem.create({
              data: {
                productId: id,
                quantity: Number(data.inventory),
                warehouseId: defaultWarehouse.id,
              },
            });

            // 记录库存变更
            await prisma.inventoryTransaction.create({
              data: {
                productId: id,
                quantity: Number(data.inventory),
                type: "initial",
                notes: `从产品管理模块初始化库存`,
                targetWarehouseId: defaultWarehouse.id,
              },
            });
          }
        }
      } catch (inventoryError) {
        console.error("Error updating inventory:", inventoryError);
        // 不阻止产品更新，只记录错误
      }
    }

    // 更新产品
    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    // 如果提供了标签，更新标签
    if (data.tagIds !== undefined) {
      // 删除现有标签关联
      await prisma.productTagsOnProducts.deleteMany({
        where: { productId: id },
      });

      // 添加新标签关联
      if (data.tagIds && Array.isArray(data.tagIds) && data.tagIds.length > 0) {
        for (const tagId of data.tagIds) {
          await prisma.productTagsOnProducts.create({
            data: {
              productId: product.id,
              tagId: parseInt(tagId),
            },
          });
        }
      }
    }

    revalidatePath("/products");
    revalidatePath("/inventory");
    return product;
  } catch (error) {
    console.error("Error updating product:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update product");
  }
}

/**
 * 删除产品
 *
 * 删除产品记录。如果产品有库存记录、销售记录或订单记录，则无法删除。
 *
 * @param id - 产品ID
 * @returns 操作结果，包含成功标志
 *
 * @example
 * ```typescript
 * // 删除ID为1的产品
 * const result = await deleteProduct(1);
 * if (result.success) {
 *   console.log('产品删除成功');
 * }
 * ```
 *
 * @throws 如果产品不存在、有库存记录、有销售记录、有订单记录或删除失败，会抛出错误
 *
 * @category 删除
 */
export async function deleteProduct(id: number): Promise<{ success: boolean }> {
  try {
    console.log(`开始删除产品，产品ID: ${id}`);

    // 检查产品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new Error("产品不存在");
    }

    console.log(`产品存在，开始检查依赖关系: ${existingProduct.name}`);

    // 收集所有阻止删除的记录信息
    const blockingRecords: string[] = [];

    // 检查产品是否有库存记录
    const inventory = await prisma.inventoryItem.findFirst({
      where: { productId: id },
      include: {
        warehouse: {
          select: { name: true }
        }
      }
    });

    if (inventory) {
      blockingRecords.push(`库存记录 (仓库: ${inventory.warehouse?.name || '未知'}, 数量: ${inventory.quantity})`);
    }

    // 检查产品是否有销售记录
    const salesItem = await prisma.salesItem.findFirst({
      where: { productId: id },
      include: {
        gallerySale: {
          select: { id: true, date: true }
        }
      }
    });

    if (salesItem) {
      const saleDate = salesItem.gallerySale?.date ? new Date(salesItem.gallerySale.date).toLocaleDateString() : '未知日期';
      blockingRecords.push(`销售记录 (销售单号: ${salesItem.gallerySale?.id || '未知'}, 日期: ${saleDate})`);
    }

    // 检查产品是否有订单记录
    const orderItem = await prisma.orderItem.findFirst({
      where: { productId: id },
      include: {
        order: {
          select: { id: true, orderNumber: true, createdAt: true }
        }
      }
    });

    if (orderItem) {
      const orderDate = orderItem.order?.createdAt ? new Date(orderItem.order.createdAt).toLocaleDateString() : '未知日期';
      blockingRecords.push(`订单记录 (订单号: ${orderItem.order?.orderNumber || orderItem.order?.id || '未知'}, 日期: ${orderDate})`);
    }

    // 检查产品是否有采购订单记录
    const purchaseOrderItem = await prisma.purchaseOrderItem.findFirst({
      where: { productId: id },
      include: {
        purchaseOrder: {
          select: { id: true, orderNumber: true, createdAt: true }
        }
      }
    });

    if (purchaseOrderItem) {
      const purchaseDate = purchaseOrderItem.purchaseOrder?.createdAt ? new Date(purchaseOrderItem.purchaseOrder.createdAt).toLocaleDateString() : '未知日期';
      blockingRecords.push(`采购订单记录 (采购单号: ${purchaseOrderItem.purchaseOrder?.orderNumber || purchaseOrderItem.purchaseOrder?.id || '未知'}, 日期: ${purchaseDate})`);
    }

    // 如果有任何阻止删除的记录，抛出详细错误信息
    if (blockingRecords.length > 0) {
      const errorMessage = `无法删除产品 "${existingProduct.name}"，因为存在以下关联记录：\n${blockingRecords.map(record => `• ${record}`).join('\n')}\n\n请先处理这些关联记录后再删除产品。`;
      console.log(`产品删除被阻止: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    console.log(`没有发现阻止删除的记录，开始删除产品`);

    // 删除产品标签关联
    await prisma.productTagsOnProducts.deleteMany({
      where: { productId: id },
    });

    // 删除产品
    await prisma.product.delete({
      where: { id },
    });

    console.log(`产品删除成功: ${existingProduct.name}`);
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete product");
  }
}

/**
 * 批量更新产品
 * @param data 批量更新的产品数据数组
 * @returns 更新结果
 */
export async function batchUpdateProducts(data: BatchUpdateProductsInput[]) {
  try {
    const results = [];
    let updatedCount = 0;

    for (const item of data) {
      if (!item.id) {
        results.push({
          id: null,
          status: "error",
          message: "缺少产品ID",
        });
        continue;
      }

      try {
        // 检查产品是否存在
        const existingProduct = await prisma.product.findUnique({
          where: { id: typeof item.id === 'string' ? parseInt(item.id) : item.id },
        });

        if (!existingProduct) {
          results.push({
            id: item.id,
            status: "error",
            message: "产品不存在",
          });
          continue;
        }

        // 更新产品
        const updateData: any = {};

        if (item.name !== undefined) updateData.name = item.name;
        if (item.price !== undefined) updateData.price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        if (item.commissionRate !== undefined) updateData.commissionRate = typeof item.commissionRate === 'string' ? parseFloat(item.commissionRate) : item.commissionRate;
        if (item.cost !== undefined) updateData.cost = item.cost !== null ? (typeof item.cost === 'string' ? parseFloat(item.cost) : item.cost) : null;
        if (item.categoryId !== undefined) updateData.categoryId = item.categoryId !== null ? (typeof item.categoryId === 'string' ? parseInt(item.categoryId) : item.categoryId) : null;
        if (item.unit !== undefined) updateData.unit = item.unit;
        if (item.material !== undefined) updateData.material = item.material;
        if (item.inventory !== undefined) updateData.inventory = typeof item.inventory === 'string' ? parseInt(item.inventory) : item.inventory;
        if (item.status !== undefined) updateData.status = item.status;
        // 移除 isActive 字段，因为 Product 模型中没有这个字段

        // 如果更新了库存，同步更新库存管理模块
        if (item.inventory !== undefined) {
          try {
            const productId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
            const inventoryValue = typeof item.inventory === 'string' ? parseInt(item.inventory) : item.inventory;

            // 查找现有库存记录
            const existingInventory = await prisma.inventoryItem.findFirst({
              where: { productId },
            });

            if (existingInventory) {
              // 更新库存记录
              await prisma.inventoryItem.update({
                where: { id: existingInventory.id },
                data: { quantity: inventoryValue },
              });

              // 记录库存变更
              await prisma.inventoryTransaction.create({
                data: {
                  productId,
                  quantity: inventoryValue - existingInventory.quantity,
                  type: "adjustment",
                  notes: `从产品管理模块批量更新库存`,
                  sourceWarehouseId: existingInventory.warehouseId,
                },
              });
            } else {
              // 查找默认仓库
              const defaultWarehouse = await prisma.warehouse.findFirst({
                where: { isDefault: true },
              });

              if (defaultWarehouse) {
                // 创建新的库存记录
                await prisma.inventoryItem.create({
                  data: {
                    productId,
                    quantity: inventoryValue,
                    warehouseId: defaultWarehouse.id,
                  },
                });

                // 记录库存变更
                await prisma.inventoryTransaction.create({
                  data: {
                    productId,
                    quantity: inventoryValue,
                    type: "initial",
                    notes: `从产品管理模块批量初始化库存`,
                    targetWarehouseId: defaultWarehouse.id,
                  },
                });
              }
            }
          } catch (inventoryError) {
            console.error("Error updating inventory in batch update:", inventoryError);
            // 不阻止产品更新，只记录错误
          }
        }

        const product = await prisma.product.update({
          where: { id: typeof item.id === 'string' ? parseInt(item.id) : item.id },
          data: updateData,
        });

        updatedCount++;

        results.push({
          id: item.id,
          status: "success",
          product,
        });
      } catch (error) {
        results.push({
          id: item.id,
          status: "error",
          message: error instanceof Error ? error.message : "更新失败",
        });
      }
    }

    revalidatePath("/products");
    revalidatePath("/inventory");
    return { results, updatedCount };
  } catch (error) {
    console.error("Error batch updating products:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to batch update products");
  }
}

/**
 * 获取产品分类
 */
export async function getProductCategories() {
  try {
    const categories = await prisma.productCategory.findMany({
      include: {
        parent: true,
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    return categories.map(category => ({
      ...category,
      productCount: category._count.products,
      childrenCount: category._count.children,
    }));
  } catch (error) {
    console.error("Error fetching product categories:", error);
    throw new Error("Failed to fetch product categories");
  }
}

/**
 * 创建产品分类
 * @param data 分类数据
 * @returns 创建的分类
 */
export async function createProductCategory(data: CreateProductCategoryInput): Promise<PrismaProductCategory> {
  try {
    // 验证数据
    const validation = validateCreateProductCategory(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 创建分类
    const category = await prisma.productCategory.create({
      data: {
        name: data.name,
        description: data.description || "",
        parentId: data.parentId ? (typeof data.parentId === 'string' ? parseInt(data.parentId) : data.parentId) : null,
        imageUrl: data.imageUrl || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        sortOrder: data.sortOrder || 0,
        code: data.code || null,
        level: 1, // 默认为顶级分类
      },
    });

    revalidatePath("/products/categories");
    return category;
  } catch (error) {
    console.error("Error creating product category:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create product category");
  }
}

/**
 * 更新产品分类
 * @param id 分类ID
 * @param data 更新的分类数据
 * @returns 更新后的分类
 */
export async function updateProductCategory(id: number, data: UpdateProductCategoryInput): Promise<PrismaProductCategory> {
  try {
    // 验证数据
    const validation = validateUpdateProductCategory(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join("; "));
    }

    // 检查分类是否存在
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new Error("分类不存在");
    }

    // 检查是否会形成循环引用
    if (data.parentId && parseInt(data.parentId) === id) {
      throw new Error("分类不能作为自己的父分类");
    }

    // 如果指定了父分类，检查父分类是否存在
    if (data.parentId) {
      const parentCategory = await prisma.productCategory.findUnique({
        where: { id: parseInt(data.parentId) },
      });

      if (!parentCategory) {
        throw new Error("父分类不存在");
      }

      // 检查是否会形成循环引用（深度检查）
      let currentParentId = parseInt(data.parentId);
      const visitedIds = new Set<number>();

      while (currentParentId) {
        if (visitedIds.has(currentParentId)) {
          throw new Error("分类层级形成循环引用");
        }

        visitedIds.add(currentParentId);

        const parent = await prisma.productCategory.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        });

        if (!parent || !parent.parentId) {
          break;
        }

        currentParentId = parent.parentId;

        if (currentParentId === id) {
          throw new Error("分类层级形成循环引用");
        }
      }
    }

    // 准备更新数据
    const updateData: any = {};

    // 只更新提供的字段
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.parentId !== undefined) updateData.parentId = data.parentId !== null ? (typeof data.parentId === 'string' ? parseInt(data.parentId) : data.parentId) : null;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    // 更新分类
    const category = await prisma.productCategory.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/products/categories");
    return category;
  } catch (error) {
    console.error("Error updating product category:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update product category");
  }
}

/**
 * 删除产品分类
 *
 * 删除产品分类记录。如果分类下有产品或子分类，则无法删除。
 *
 * @param id - 分类ID
 * @returns 操作结果，包含成功标志
 *
 * @example
 * ```typescript
 * // 删除ID为1的产品分类
 * const result = await deleteProductCategory(1);
 * if (result.success) {
 *   console.log('产品分类删除成功');
 * }
 * ```
 *
 * @throws 如果分类不存在、有产品、有子分类或删除失败，会抛出错误
 *
 * @category 删除
 */
export async function deleteProductCategory(id: number): Promise<{ success: boolean }> {
  try {
    console.log(`开始删除产品分类，分类ID: ${id}`);

    // 检查分类是否存在
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
        children: {
          select: { id: true, name: true }
        },
        products: {
          select: { id: true, name: true }
        }
      },
    });

    if (!existingCategory) {
      throw new Error("分类不存在");
    }

    console.log(`分类存在，开始检查依赖关系: ${existingCategory.name}`);
    console.log(`子分类数量: ${existingCategory._count.children}, 产品数量: ${existingCategory._count.products}`);

    // 收集所有阻止删除的记录信息
    const blockingRecords: string[] = [];

    // 检查分类是否有子分类
    if (existingCategory._count.children > 0) {
      const childNames = existingCategory.children.map(child => child.name).join(', ');
      blockingRecords.push(`子分类 (${existingCategory._count.children}个): ${childNames}`);
    }

    // 检查分类是否有产品
    if (existingCategory._count.products > 0) {
      const productNames = existingCategory.products.slice(0, 3).map(product => product.name).join(', ');
      const moreProducts = existingCategory._count.products > 3 ? ` 等${existingCategory._count.products}个产品` : '';
      blockingRecords.push(`关联产品: ${productNames}${moreProducts}`);
    }

    // 如果有任何阻止删除的记录，抛出详细错误信息
    if (blockingRecords.length > 0) {
      const errorMessage = `无法删除分类 "${existingCategory.name}"，因为存在以下关联记录：\n${blockingRecords.map(record => `• ${record}`).join('\n')}\n\n请先处理这些关联记录后再删除分类。`;
      console.log(`分类删除被阻止: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    console.log(`没有发现阻止删除的记录，开始删除分类`);

    // 删除分类
    await prisma.productCategory.delete({
      where: { id },
    });

    console.log(`分类删除成功: ${existingCategory.name}`);
    revalidatePath("/products/categories");
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product category:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete product category");
  }
}

/**
 * 获取产品标签
 */
export async function getProductTags() {
  try {
    const tags = await prisma.productTag.findMany({
      include: {
        products: {
          select: {
            productId: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    return tags.map(tag => ({
      ...tag,
      productCount: tag.products.length,
    }));
  } catch (error) {
    console.error("Error fetching product tags:", error);
    throw new Error("Failed to fetch product tags");
  }
}

/**
 * 创建产品标签
 */
export async function createProductTag(data: any) {
  try {
    // 验证必填字段
    if (!data.name) {
      throw new Error("标签名称为必填项");
    }

    // 检查标签是否已存在
    const existingTag = await prisma.productTag.findFirst({
      where: {
        name: data.name,
      },
    });

    if (existingTag) {
      throw new Error("标签已存在");
    }

    // 创建标签
    const tag = await prisma.productTag.create({
      data: {
        name: data.name,
        description: data.description || "",
        color: data.color || "#000000",
      },
    });

    revalidatePath("/products/tags");
    return tag;
  } catch (error) {
    console.error("Error creating product tag:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create product tag");
  }
}

/**
 * 更新产品标签
 */
export async function updateProductTag(id: number, data: any) {
  try {
    // 检查标签是否存在
    const existingTag = await prisma.productTag.findUnique({
      where: { id },
    });

    if (!existingTag) {
      throw new Error("标签不存在");
    }

    // 如果更改了名称，检查是否已存在
    if (data.name && data.name !== existingTag.name) {
      const duplicateTag = await prisma.productTag.findFirst({
        where: {
          name: data.name,
          NOT: {
            id,
          },
        },
      });

      if (duplicateTag) {
        throw new Error("标签名称已存在");
      }
    }

    // 更新标签
    const tag = await prisma.productTag.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existingTag.name,
        description: data.description !== undefined ? data.description : existingTag.description,
        color: data.color !== undefined ? data.color : existingTag.color,
      },
    });

    revalidatePath("/products/tags");
    return tag;
  } catch (error) {
    console.error("Error updating product tag:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to update product tag");
  }
}

/**
 * 删除产品标签
 *
 * 删除产品标签记录。如果标签已被产品使用，则无法删除。
 *
 * @param id - 标签ID
 * @returns 操作结果，包含成功标志
 *
 * @example
 * ```typescript
 * // 删除ID为1的产品标签
 * const result = await deleteProductTag(1);
 * if (result.success) {
 *   console.log('产品标签删除成功');
 * }
 * ```
 *
 * @throws 如果标签不存在、已被产品使用或删除失败，会抛出错误
 *
 * @category 删除
 */
export async function deleteProductTag(id: number): Promise<{ success: boolean }> {
  try {
    // 检查标签是否存在
    const existingTag = await prisma.productTag.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!existingTag) {
      throw new Error("标签不存在");
    }

    // 检查标签是否有产品
    if (existingTag.products.length > 0) {
      throw new Error("标签已被产品使用，无法删除");
    }

    // 删除标签
    await prisma.productTag.delete({
      where: { id },
    });

    revalidatePath("/products/tags");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product tag:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to delete product tag");
  }
}

/**
 * 为产品添加标签
 */
export async function addTagToProduct(productId: number, tagId: number) {
  try {
    // 检查产品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error("产品不存在");
    }

    // 检查标签是否存在
    const tag = await prisma.productTag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      throw new Error("标签不存在");
    }

    // 检查关联是否已存在
    const existingRelation = await prisma.productTagsOnProducts.findFirst({
      where: {
        productId,
        tagId,
      },
    });

    if (existingRelation) {
      throw new Error("产品已有该标签");
    }

    // 创建关联
    await prisma.productTagsOnProducts.create({
      data: {
        productId,
        tagId,
      },
    });

    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Error adding tag to product:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to add tag to product");
  }
}

/**
 * 从产品移除标签
 */
export async function removeTagFromProduct(productId: number, tagId: number) {
  try {
    // 检查关联是否存在
    const relation = await prisma.productTagsOnProducts.findFirst({
      where: {
        productId,
        tagId,
      },
    });

    if (!relation) {
      throw new Error("产品没有该标签");
    }

    // 删除关联
    await prisma.productTagsOnProducts.delete({
      where: {
        productId_tagId: {
          productId,
          tagId,
        },
      },
    });

    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Error removing tag from product:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to remove tag from product");
  }
}

/**
 * 获取产品材料
 *
 * 由于没有专门的Material模型，我们从产品表中提取不同的材质值作为材质列表
 *
 * @returns 材质列表
 */
export async function getProductMaterials() {
  try {
    // 从产品表中提取不同的材质值
    const products = await prisma.product.findMany({
      where: {
        material: {
          not: null,
        },
      },
      select: {
        material: true,
      },
      distinct: ['material'],
    });

    // 转换为字符串数组
    const materials = products
      .map(p => p.material)
      .filter(Boolean) as string[];

    return materials;
  } catch (error) {
    console.error("Error fetching product materials:", error);
    throw new Error("Failed to fetch product materials");
  }
}

/**
 * 添加产品材料
 *
 * 由于没有专门的Material模型，我们创建一个占位产品来存储材料信息
 *
 * @param material 材料名称或材料对象
 * @returns 添加结果
 */
export async function addProductMaterial(material: string | { name: string }) {
  try {
    // 验证必填字段
    const materialName = typeof material === 'string' ? material : material.name;

    if (!materialName || materialName.trim() === '') {
      throw new Error("材料名称为必填项");
    }

    // 检查材料是否已存在
    const existingProducts = await prisma.product.findMany({
      where: {
        material: materialName.trim(),
      },
    });

    if (existingProducts.length > 0) {
      // 材料已存在，直接返回
      return { success: true, material: materialName.trim() };
    }

    // 创建一个占位产品，用于存储材料
    const placeholderProduct = await prisma.product.create({
      data: {
        name: `${materialName.trim()} 材料`,
        price: 0,
        commissionRate: 0,
        type: "material_placeholder",
        material: materialName.trim(),
        description: `${materialName.trim()} 材料的占位产品`,
      },
    });

    revalidatePath("/products");
    return { success: true, material: materialName.trim() };
  } catch (error) {
    console.error("Error adding product material:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to add product material");
  }
}

/**
 * 移除产品材料
 *
 * 由于没有专门的Material模型，我们删除对应的占位产品
 *
 * @param material 材料名称或ID
 * @returns 删除结果
 */
export async function removeProductMaterial(material: string | number) {
  try {
    let placeholderProducts;

    if (typeof material === 'number') {
      // 如果提供的是ID，查找对应的占位产品
      placeholderProducts = await prisma.product.findMany({
        where: {
          id: material,
          type: "material_placeholder",
        },
      });
    } else {
      // 如果提供的是材料名称，查找对应的占位产品
      placeholderProducts = await prisma.product.findMany({
        where: {
          material: material,
          type: "material_placeholder",
        },
      });
    }

    if (placeholderProducts.length === 0) {
      throw new Error("找不到指定的材料");
    }

    // 检查是否有产品使用了该材料
    const productsUsingMaterial = await prisma.product.findMany({
      where: {
        material: placeholderProducts[0].material,
        type: {
          not: "material_placeholder",
        },
      },
    });

    if (productsUsingMaterial.length > 0) {
      throw new Error("该材料正在被产品使用，无法删除");
    }

    // 删除占位产品
    for (const product of placeholderProducts) {
      await prisma.product.delete({
        where: {
          id: product.id,
        },
      });
    }

    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Error removing product material:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to remove product material");
  }
}

/**
 * 获取产品单位
 *
 * 由于没有专门的Unit模型，我们从产品表中提取不同的单位值作为单位列表
 *
 * @returns 单位列表
 */
export async function getProductUnits() {
  try {
    // 从产品表中提取不同的单位值
    const products = await prisma.product.findMany({
      where: {
        unit: {
          not: null,
        },
      },
      select: {
        unit: true,
      },
      distinct: ['unit'],
    });

    // 转换为字符串数组
    const units = products
      .map(p => p.unit)
      .filter(Boolean) as string[];

    return units;
  } catch (error) {
    console.error("Error fetching product units:", error);
    throw new Error("Failed to fetch product units");
  }
}

/**
 * 添加产品单位
 *
 * 由于没有专门的Unit模型，我们创建一个占位产品来存储单位信息
 *
 * @param unit 单位名称或单位对象
 * @returns 添加结果
 */
export async function addProductUnit(unit: string | { name: string }) {
  try {
    // 验证必填字段
    const unitName = typeof unit === 'string' ? unit : unit.name;

    if (!unitName || unitName.trim() === '') {
      throw new Error("单位名称为必填项");
    }

    // 检查单位是否已存在
    const existingProducts = await prisma.product.findMany({
      where: {
        unit: unitName.trim(),
      },
    });

    if (existingProducts.length > 0) {
      // 单位已存在，直接返回
      return { success: true, unit: unitName.trim() };
    }

    // 创建一个占位产品，用于存储单位
    const placeholderProduct = await prisma.product.create({
      data: {
        name: `${unitName.trim()} 单位`,
        price: 0,
        commissionRate: 0,
        type: "unit_placeholder",
        unit: unitName.trim(),
        description: `${unitName.trim()} 单位的占位产品`,
      },
    });

    revalidatePath("/products");
    return { success: true, unit: unitName.trim() };
  } catch (error) {
    console.error("Error adding product unit:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to add product unit");
  }
}

/**
 * 移除产品单位
 *
 * 由于没有专门的Unit模型，我们删除对应的占位产品
 *
 * @param unit 单位名称或ID
 * @returns 删除结果
 */
export async function removeProductUnit(unit: string | number) {
  try {
    let placeholderProducts;

    if (typeof unit === 'number') {
      // 如果提供的是ID，查找对应的占位产品
      placeholderProducts = await prisma.product.findMany({
        where: {
          id: unit,
          type: "unit_placeholder",
        },
      });
    } else {
      // 如果提供的是单位名称，查找对应的占位产品
      placeholderProducts = await prisma.product.findMany({
        where: {
          unit: unit,
          type: "unit_placeholder",
        },
      });
    }

    if (placeholderProducts.length === 0) {
      throw new Error("找不到指定的单位");
    }

    // 检查是否有产品使用了该单位
    const productsUsingUnit = await prisma.product.findMany({
      where: {
        unit: placeholderProducts[0].unit,
        type: {
          not: "unit_placeholder",
        },
      },
    });

    if (productsUsingUnit.length > 0) {
      throw new Error("该单位正在被产品使用，无法删除");
    }

    // 删除占位产品
    for (const product of placeholderProducts) {
      await prisma.product.delete({
        where: {
          id: product.id,
        },
      });
    }

    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Error removing product unit:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to remove product unit");
  }
}

/**
 * 根据标签获取产品
 */
export async function getProductsByTag(tagId: number) {
  try {
    const productTags = await prisma.productTagsOnProducts.findMany({
      where: { tagId },
      include: {
        product: {
          include: {
            productCategory: true,
            productTags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    });

    return productTags.map(pt => ({
      ...pt.product,
      category: pt.product.productCategory,
      tags: pt.product.productTags.map(pt => pt.tag),
    }));
  } catch (error) {
    console.error("Error fetching products by tag:", error);
    throw new Error("Failed to fetch products by tag");
  }
}
