/**
 * 作品管理模块功能测试脚本
 * 测试所有API端点和功能
 */

const BASE_URL = 'http://localhost:3000/api/artworks'

// 测试数据
const testCategory = {
  name: '景泰蓝作品',
  code: 'JTL',
  description: '传统景泰蓝工艺作品',
  isActive: true,
  sortOrder: 1
}

const testArtwork = {
  name: '景泰蓝花瓶',
  price: 1288.00,
  commissionRate: 15,
  cost: 800.00,
  sku: 'JTL-001',
  barcode: '1234567890123',
  description: '精美的景泰蓝花瓶，采用传统工艺制作',
  dimensions: '高30cm，直径15cm',
  material: '铜胎珐琅',
  unit: '件',
  inventory: 10,
  status: 'active'
}

// API调用函数
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`)
    }
    
    return data
  } catch (error) {
    console.error(`API调用失败 [${url}]:`, error.message)
    throw error
  }
}

// 测试函数
async function testArtworkModule() {
  console.log('🎨 开始测试作品管理模块...\n')

  let categoryId = null
  let artworkId = null

  try {
    // 1. 测试创建分类
    console.log('📁 测试创建作品分类...')
    const categoryResult = await apiCall(`${BASE_URL}/categories`, {
      method: 'POST',
      body: JSON.stringify(testCategory),
    })
    categoryId = categoryResult.category.id
    console.log(`✅ 分类创建成功，ID: ${categoryId}`)

    // 2. 测试获取分类列表
    console.log('📋 测试获取分类列表...')
    const categoriesResult = await apiCall(`${BASE_URL}/categories`)
    console.log(`✅ 获取到 ${categoriesResult.categories.length} 个分类`)

    // 3. 测试创建作品
    console.log('🎨 测试创建作品...')
    const artworkData = { ...testArtwork, categoryId }
    const artworkResult = await apiCall(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(artworkData),
    })
    artworkId = artworkResult.artwork.id
    console.log(`✅ 作品创建成功，ID: ${artworkId}`)

    // 4. 测试获取作品列表
    console.log('📋 测试获取作品列表...')
    const artworksResult = await apiCall(BASE_URL)
    console.log(`✅ 获取到 ${artworksResult.artworks.length} 个作品`)

    // 5. 测试获取单个作品
    console.log('🔍 测试获取单个作品...')
    const singleArtworkResult = await apiCall(`${BASE_URL}/${artworkId}`)
    console.log(`✅ 获取作品详情成功: ${singleArtworkResult.artwork.name}`)

    // 6. 测试更新作品
    console.log('✏️ 测试更新作品...')
    const updateData = { ...artworkData, name: '景泰蓝花瓶（精装版）', price: 1588.00 }
    const updateResult = await apiCall(`${BASE_URL}/${artworkId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
    console.log(`✅ 作品更新成功: ${updateResult.artwork.name}`)

    // 7. 测试搜索功能
    console.log('🔍 测试搜索功能...')
    const searchResult = await apiCall(`${BASE_URL}/search?query=景泰蓝&categoryId=${categoryId}`)
    console.log(`✅ 搜索到 ${searchResult.artworks.length} 个作品`)

    // 8. 测试统计功能
    console.log('📊 测试统计功能...')
    const statsResult = await apiCall(`${BASE_URL}/stats`)
    console.log(`✅ 统计数据获取成功，总作品数: ${statsResult.stats.overview.totalArtworks}`)

    // 9. 测试批量操作
    console.log('📦 测试批量导出...')
    const batchResult = await apiCall(`${BASE_URL}/batch`, {
      method: 'POST',
      body: JSON.stringify({
        action: 'export',
        artworkIds: [artworkId]
      }),
    })
    console.log(`✅ 批量导出成功，导出 ${batchResult.count} 个作品`)

    // 10. 测试导入功能
    console.log('📥 测试导入功能...')
    const importData = {
      artworks: [
        {
          name: '景泰蓝茶具套装',
          price: 2888.00,
          commissionRate: 20,
          categoryName: '景泰蓝作品',
          sku: 'JTL-002',
          description: '精美的景泰蓝茶具套装'
        }
      ],
      options: {
        createMissingCategories: false,
        skipDuplicates: true
      }
    }
    const importResult = await apiCall(`${BASE_URL}/import`, {
      method: 'POST',
      body: JSON.stringify(importData),
    })
    console.log(`✅ 导入成功，导入 ${importResult.imported} 个作品`)

    // 11. 清理测试数据
    console.log('🧹 清理测试数据...')
    
    // 删除作品
    await apiCall(`${BASE_URL}/${artworkId}`, { method: 'DELETE' })
    console.log('✅ 测试作品删除成功')

    // 删除导入的作品
    const finalArtworksResult = await apiCall(BASE_URL)
    for (const artwork of finalArtworksResult.artworks) {
      if (artwork.name.includes('景泰蓝')) {
        await apiCall(`${BASE_URL}/${artwork.id}`, { method: 'DELETE' })
        console.log(`✅ 作品 "${artwork.name}" 删除成功`)
      }
    }

    // 删除分类
    await apiCall(`${BASE_URL}/categories/${categoryId}`, { method: 'DELETE' })
    console.log('✅ 测试分类删除成功')

    console.log('\n🎉 作品管理模块测试完成！所有功能正常工作。')

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    
    // 尝试清理
    try {
      if (artworkId) {
        await apiCall(`${BASE_URL}/${artworkId}`, { method: 'DELETE' })
        console.log('🧹 清理测试作品成功')
      }
      if (categoryId) {
        await apiCall(`${BASE_URL}/categories/${categoryId}`, { method: 'DELETE' })
        console.log('🧹 清理测试分类成功')
      }
    } catch (cleanupError) {
      console.error('清理失败:', cleanupError.message)
    }
  }
}

// 运行测试
if (typeof window === 'undefined') {
  // Node.js环境
  const fetch = require('node-fetch')
  testArtworkModule()
} else {
  // 浏览器环境
  window.testArtworkModule = testArtworkModule
  console.log('测试函数已加载，请在控制台运行: testArtworkModule()')
}
