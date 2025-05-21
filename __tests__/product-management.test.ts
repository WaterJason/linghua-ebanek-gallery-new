import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  getProducts, 
  getProduct, 
  saveProduct, 
  deleteProduct, 
  getProductCategories,
  saveCategory,
  deleteCategory,
  getProductUnits,
  getProductMaterials,
  addProductUnit,
  removeProductUnit,
  addProductMaterial,
  removeProductMaterial,
  batchUpdateProducts
} from '@/lib/actions'

// 模拟prisma客户端
vi.mock('@/lib/db', () => {
  return {
    default: {
      product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
      },
      productCategory: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
      },
      productUnit: {
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn()
      },
      productMaterial: {
        findMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn()
      }
    }
  }
})

// 模拟next-auth
vi.mock('next-auth', () => {
  return {
    getServerSession: vi.fn(() => Promise.resolve({
      user: { id: 1, name: 'Test User', email: 'test@example.com' }
    }))
  }
})

// 模拟数据
const mockProducts = [
  { id: 1, name: '产品1', price: 100, category: '分类1', inventory: 10 },
  { id: 2, name: '产品2', price: 200, category: '分类2', inventory: 20 },
  { id: 3, name: '产品3', price: 300, category: '分类1', inventory: 30 }
]

const mockCategories = [
  { id: 1, name: '分类1', productCount: 2 },
  { id: 2, name: '分类2', productCount: 1 }
]

const mockUnits = ['个', '件', '套']
const mockMaterials = ['铜', '银', '金']

// 测试套件
describe('产品管理模块', () => {
  // 在每个测试前重置模拟
  beforeEach(() => {
    vi.resetAllMocks()
  })

  // 在每个测试后清理
  afterEach(() => {
    vi.clearAllMocks()
  })

  // 测试获取产品列表
  describe('getProducts', () => {
    it('应该返回产品列表', async () => {
      // 设置模拟返回值
      const prisma = require('@/lib/db').default
      prisma.product.findMany.mockResolvedValue(mockProducts)

      // 调用函数
      const result = await getProducts()

      // 验证结果
      expect(result).toEqual(mockProducts)
      expect(prisma.product.findMany).toHaveBeenCalledTimes(1)
    })

    it('应该处理错误情况', async () => {
      // 设置模拟抛出错误
      const prisma = require('@/lib/db').default
      prisma.product.findMany.mockRejectedValue(new Error('数据库错误'))

      // 调用函数并验证它抛出错误
      await expect(getProducts()).rejects.toThrow('获取产品列表失败')
    })
  })

  // 测试获取单个产品
  describe('getProduct', () => {
    it('应该返回指定ID的产品', async () => {
      // 设置模拟返回值
      const prisma = require('@/lib/db').default
      prisma.product.findUnique.mockResolvedValue(mockProducts[0])

      // 调用函数
      const result = await getProduct(1)

      // 验证结果
      expect(result).toEqual(mockProducts[0])
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      })
    })

    it('应该处理产品不存在的情况', async () => {
      // 设置模拟返回null
      const prisma = require('@/lib/db').default
      prisma.product.findUnique.mockResolvedValue(null)

      // 调用函数
      const result = await getProduct(999)

      // 验证结果
      expect(result).toBeNull()
    })
  })

  // 测试保存产品
  describe('saveProduct', () => {
    it('应该创建新产品', async () => {
      // 设置模拟返回值
      const prisma = require('@/lib/db').default
      prisma.product.findUnique.mockResolvedValue(null)
      prisma.product.create.mockResolvedValue({ id: 4, name: '新产品', price: 400 })

      // 调用函数
      const result = await saveProduct({ name: '新产品', price: 400 })

      // 验证结果
      expect(result).toEqual({ id: 4, name: '新产品', price: 400 })
      expect(prisma.product.create).toHaveBeenCalled()
    })

    it('应该更新现有产品', async () => {
      // 设置模拟返回值
      const prisma = require('@/lib/db').default
      prisma.product.findUnique.mockResolvedValue(mockProducts[0])
      prisma.product.update.mockResolvedValue({ ...mockProducts[0], price: 150 })

      // 调用函数
      const result = await saveProduct({ id: 1, name: '产品1', price: 150 })

      // 验证结果
      expect(result).toEqual({ ...mockProducts[0], price: 150 })
      expect(prisma.product.update).toHaveBeenCalled()
    })
  })

  // 测试删除产品
  describe('deleteProduct', () => {
    it('应该删除指定ID的产品', async () => {
      // 设置模拟返回值
      const prisma = require('@/lib/db').default
      prisma.product.delete.mockResolvedValue(mockProducts[0])

      // 调用函数
      const result = await deleteProduct(1)

      // 验证结果
      expect(result).toEqual(mockProducts[0])
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      })
    })

    it('应该处理删除不存在产品的情况', async () => {
      // 设置模拟抛出错误
      const prisma = require('@/lib/db').default
      prisma.product.delete.mockRejectedValue(new Error('记录不存在'))

      // 调用函数并验证它抛出错误
      await expect(deleteProduct(999)).rejects.toThrow('删除产品失败')
    })
  })

  // 测试获取产品分类
  describe('getProductCategories', () => {
    it('应该返回分类列表', async () => {
      // 设置模拟返回值
      const prisma = require('@/lib/db').default
      prisma.productCategory.findMany.mockResolvedValue(mockCategories)

      // 调用函数
      const result = await getProductCategories()

      // 验证结果
      expect(result).toEqual(mockCategories)
      expect(prisma.productCategory.findMany).toHaveBeenCalledTimes(1)
    })
  })

  // 测试批量更新产品
  describe('batchUpdateProducts', () => {
    it('应该批量更新产品', async () => {
      // 设置模拟返回值
      const prisma = require('@/lib/db').default
      prisma.product.update.mockResolvedValue({})

      // 调用函数
      const result = await batchUpdateProducts({
        selectedIds: [1, 2],
        updateFields: {
          category: '新分类',
          price: { action: 'increase', value: 10 }
        }
      })

      // 验证结果
      expect(result.updatedCount).toBe(2)
      expect(prisma.product.update).toHaveBeenCalledTimes(2)
    })
  })

  // 测试单位和材质管理
  describe('单位和材质管理', () => {
    it('应该获取单位列表', async () => {
      // 设置模拟返回值
      const prisma = require('@/lib/db').default
      prisma.productUnit.findMany.mockResolvedValue(
        mockUnits.map(name => ({ name }))
      )

      // 调用函数
      const result = await getProductUnits()

      // 验证结果
      expect(result).toEqual(mockUnits)
    })

    it('应该获取材质列表', async () => {
      // 设置模拟返回值
      const prisma = require('@/lib/db').default
      prisma.productMaterial.findMany.mockResolvedValue(
        mockMaterials.map(name => ({ name }))
      )

      // 调用函数
      const result = await getProductMaterials()

      // 验证结果
      expect(result).toEqual(mockMaterials)
    })

    it('应该添加新单位', async () => {
      // 设置模拟返回值
      const prisma = require('@/lib/db').default
      prisma.productUnit.create.mockResolvedValue({ name: '箱' })

      // 调用函数
      const result = await addProductUnit('箱')

      // 验证结果
      expect(result).toEqual({ name: '箱' })
      expect(prisma.productUnit.create).toHaveBeenCalledWith({
        data: { name: '箱' }
      })
    })

    it('应该删除单位', async () => {
      // 设置模拟返回值
      const prisma = require('@/lib/db').default
      prisma.productUnit.delete.mockResolvedValue({ name: '个' })

      // 调用函数
      const result = await removeProductUnit('个')

      // 验证结果
      expect(result).toEqual({ name: '个' })
      expect(prisma.productUnit.delete).toHaveBeenCalledWith({
        where: { name: '个' }
      })
    })
  })
})
