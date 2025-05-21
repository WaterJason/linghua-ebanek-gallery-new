import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProductList } from '@/components/product/product-list'
import { Product, ProductCategory } from '@/types/product'

// 模拟数据
const mockProducts: Product[] = [
  { 
    id: 1, 
    name: '产品1', 
    price: 100, 
    category: '分类1', 
    inventory: 10,
    imageUrl: 'https://example.com/image1.jpg'
  },
  { 
    id: 2, 
    name: '产品2', 
    price: 200, 
    category: '分类2', 
    inventory: 20 
  },
  { 
    id: 3, 
    name: '产品3', 
    price: 300, 
    category: '分类1', 
    inventory: 30,
    imageUrl: 'https://example.com/image3.jpg'
  }
]

const mockCategories: ProductCategory[] = [
  { id: 1, name: '分类1', productCount: 2 },
  { id: 2, name: '分类2', productCount: 1 }
]

// 模拟回调函数
const mockOnFilterChange = vi.fn()
const mockOnAddProduct = vi.fn()
const mockOnEditProduct = vi.fn()
const mockOnDeleteProduct = vi.fn()
const mockOnSelectionChange = vi.fn()

// 测试套件
describe('ProductList 组件', () => {
  // 在每个测试前重置模拟
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('应该正确渲染产品列表', () => {
    // 渲染组件
    render(
      <ProductList
        products={mockProducts}
        categories={mockCategories}
        filter={{ searchQuery: '', categoryFilter: null }}
        onFilterChange={mockOnFilterChange}
        onAddProduct={mockOnAddProduct}
        onEditProduct={mockOnEditProduct}
        onDeleteProduct={mockOnDeleteProduct}
        onSelectionChange={mockOnSelectionChange}
        isLoading={false}
      />
    )

    // 验证产品名称是否显示
    expect(screen.getByText('产品1')).toBeInTheDocument()
    expect(screen.getByText('产品2')).toBeInTheDocument()
    expect(screen.getByText('产品3')).toBeInTheDocument()

    // 验证价格是否显示
    expect(screen.getByText('¥100.00')).toBeInTheDocument()
    expect(screen.getByText('¥200.00')).toBeInTheDocument()
    expect(screen.getByText('¥300.00')).toBeInTheDocument()
  })

  it('应该显示加载状态', () => {
    // 渲染组件，设置isLoading为true
    render(
      <ProductList
        products={[]}
        categories={[]}
        filter={{ searchQuery: '', categoryFilter: null }}
        onFilterChange={mockOnFilterChange}
        onAddProduct={mockOnAddProduct}
        onEditProduct={mockOnEditProduct}
        onDeleteProduct={mockOnDeleteProduct}
        onSelectionChange={mockOnSelectionChange}
        isLoading={true}
      />
    )

    // 验证加载状态是否显示
    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  it('应该处理搜索查询', async () => {
    // 渲染组件
    render(
      <ProductList
        products={mockProducts}
        categories={mockCategories}
        filter={{ searchQuery: '', categoryFilter: null }}
        onFilterChange={mockOnFilterChange}
        onAddProduct={mockOnAddProduct}
        onEditProduct={mockOnEditProduct}
        onDeleteProduct={mockOnDeleteProduct}
        onSelectionChange={mockOnSelectionChange}
        isLoading={false}
      />
    )

    // 找到搜索输入框
    const searchInput = screen.getByPlaceholderText('搜索产品...')
    
    // 输入搜索查询
    fireEvent.change(searchInput, { target: { value: '产品1' } })
    
    // 等待防抖
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ searchQuery: '产品1' })
      )
    }, { timeout: 1000 })
  })

  it('应该处理分类筛选', () => {
    // 渲染组件
    render(
      <ProductList
        products={mockProducts}
        categories={mockCategories}
        filter={{ searchQuery: '', categoryFilter: null }}
        onFilterChange={mockOnFilterChange}
        onAddProduct={mockOnAddProduct}
        onEditProduct={mockOnEditProduct}
        onDeleteProduct={mockOnDeleteProduct}
        onSelectionChange={mockOnSelectionChange}
        isLoading={false}
      />
    )

    // 找到分类选择器
    const categorySelect = screen.getByLabelText('分类')
    
    // 选择一个分类
    fireEvent.change(categorySelect, { target: { value: '1' } })
    
    // 验证回调是否被调用
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ categoryFilter: '1' })
    )
  })

  it('应该处理添加产品按钮点击', () => {
    // 渲染组件
    render(
      <ProductList
        products={mockProducts}
        categories={mockCategories}
        filter={{ searchQuery: '', categoryFilter: null }}
        onFilterChange={mockOnFilterChange}
        onAddProduct={mockOnAddProduct}
        onEditProduct={mockOnEditProduct}
        onDeleteProduct={mockOnDeleteProduct}
        onSelectionChange={mockOnSelectionChange}
        isLoading={false}
      />
    )

    // 找到添加产品按钮
    const addButton = screen.getByText('添加产品')
    
    // 点击按钮
    fireEvent.click(addButton)
    
    // 验证回调是否被调用
    expect(mockOnAddProduct).toHaveBeenCalledTimes(1)
  })

  it('应该处理编辑产品按钮点击', () => {
    // 渲染组件
    render(
      <ProductList
        products={mockProducts}
        categories={mockCategories}
        filter={{ searchQuery: '', categoryFilter: null }}
        onFilterChange={mockOnFilterChange}
        onAddProduct={mockOnAddProduct}
        onEditProduct={mockOnEditProduct}
        onDeleteProduct={mockOnDeleteProduct}
        onSelectionChange={mockOnSelectionChange}
        isLoading={false}
      />
    )

    // 找到编辑按钮（可能有多个，取第一个）
    const editButtons = screen.getAllByTitle('编辑')
    
    // 点击第一个编辑按钮
    fireEvent.click(editButtons[0])
    
    // 验证回调是否被调用，并且传入了正确的产品
    expect(mockOnEditProduct).toHaveBeenCalledWith(mockProducts[0])
  })

  it('应该处理删除产品按钮点击', () => {
    // 渲染组件
    render(
      <ProductList
        products={mockProducts}
        categories={mockCategories}
        filter={{ searchQuery: '', categoryFilter: null }}
        onFilterChange={mockOnFilterChange}
        onAddProduct={mockOnAddProduct}
        onEditProduct={mockOnEditProduct}
        onDeleteProduct={mockOnDeleteProduct}
        onSelectionChange={mockOnSelectionChange}
        isLoading={false}
      />
    )

    // 找到删除按钮（可能有多个，取第一个）
    const deleteButtons = screen.getAllByTitle('删除')
    
    // 点击第一个删除按钮
    fireEvent.click(deleteButtons[0])
    
    // 验证回调是否被调用，并且传入了正确的产品
    expect(mockOnDeleteProduct).toHaveBeenCalledWith(mockProducts[0])
  })

  it('应该处理产品选择', () => {
    // 渲染组件
    render(
      <ProductList
        products={mockProducts}
        categories={mockCategories}
        filter={{ searchQuery: '', categoryFilter: null }}
        onFilterChange={mockOnFilterChange}
        onAddProduct={mockOnAddProduct}
        onEditProduct={mockOnEditProduct}
        onDeleteProduct={mockOnDeleteProduct}
        onSelectionChange={mockOnSelectionChange}
        isLoading={false}
      />
    )

    // 找到复选框（可能有多个，取第一个）
    const checkboxes = screen.getAllByRole('checkbox')
    
    // 点击第一个复选框
    fireEvent.click(checkboxes[1]) // 第一个是全选复选框，所以取第二个
    
    // 验证回调是否被调用
    expect(mockOnSelectionChange).toHaveBeenCalled()
  })
})
