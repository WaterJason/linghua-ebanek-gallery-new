import { test, expect } from '@playwright/test'

// 测试产品管理模块的端到端测试
test.describe('产品管理模块', () => {
  // 在每个测试前登录
  test.beforeEach(async ({ page }) => {
    // 访问登录页面
    await page.goto('/login')
    
    // 输入登录凭据
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'password')
    
    // 点击登录按钮
    await page.click('button[type="submit"]')
    
    // 等待登录成功并跳转
    await page.waitForURL('/')
    
    // 导航到产品管理页面
    await page.goto('/products')
    
    // 确保页面已加载
    await expect(page.locator('h2:has-text("产品管理")')).toBeVisible()
  })
  
  // 测试产品列表加载
  test('应该加载产品列表', async ({ page }) => {
    // 等待产品列表加载完成
    await page.waitForSelector('table')
    
    // 验证表格标题
    const headers = await page.locator('thead th').allTextContents()
    expect(headers).toContain('产品名称')
    expect(headers).toContain('价格')
    expect(headers).toContain('分类')
    
    // 验证至少有一行产品数据
    const rowCount = await page.locator('tbody tr').count()
    expect(rowCount).toBeGreaterThan(0)
  })
  
  // 测试添加产品
  test('应该能够添加新产品', async ({ page }) => {
    // 点击添加产品按钮
    await page.click('button:has-text("添加产品")')
    
    // 等待对话框打开
    await expect(page.locator('div[role="dialog"] h2:has-text("添加产品")')).toBeVisible()
    
    // 填写产品信息
    const productName = `测试产品 ${Date.now()}`
    await page.fill('input[name="name"]', productName)
    await page.fill('input[name="price"]', '199.99')
    
    // 选择分类（如果有）
    const categorySelect = page.locator('select[name="category"]')
    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption({ index: 1 })
    }
    
    // 点击保存按钮
    await page.click('button:has-text("保存")')
    
    // 等待对话框关闭
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 5000 })
    
    // 验证成功提示
    await expect(page.locator('div[role="status"]:has-text("成功")')).toBeVisible()
    
    // 验证新产品是否出现在列表中
    await expect(page.locator(`td:has-text("${productName}")`)).toBeVisible()
  })
  
  // 测试编辑产品
  test('应该能够编辑产品', async ({ page }) => {
    // 等待产品列表加载完成
    await page.waitForSelector('table')
    
    // 点击第一个产品的编辑按钮
    await page.locator('tbody tr').first().locator('button[title="编辑"]').click()
    
    // 等待对话框打开
    await expect(page.locator('div[role="dialog"] h2:has-text("编辑产品")')).toBeVisible()
    
    // 修改产品价格
    const newPrice = '299.99'
    await page.fill('input[name="price"]', newPrice)
    
    // 点击保存按钮
    await page.click('button:has-text("保存")')
    
    // 等待对话框关闭
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 5000 })
    
    // 验证成功提示
    await expect(page.locator('div[role="status"]:has-text("成功")')).toBeVisible()
    
    // 验证价格是否已更新
    await expect(page.locator('tbody tr').first().locator(`td:has-text("¥${newPrice}")`)).toBeVisible()
  })
  
  // 测试删除产品
  test('应该能够删除产品', async ({ page }) => {
    // 等待产品列表加载完成
    await page.waitForSelector('table')
    
    // 获取第一个产品的名称
    const productName = await page.locator('tbody tr').first().locator('td').nth(1).textContent()
    
    // 点击第一个产品的删除按钮
    await page.locator('tbody tr').first().locator('button[title="删除"]').click()
    
    // 等待确认对话框打开
    await expect(page.locator('div[role="alertdialog"]')).toBeVisible()
    
    // 点击确认删除按钮
    await page.click('button:has-text("确认删除")')
    
    // 等待对话框关闭
    await expect(page.locator('div[role="alertdialog"]')).not.toBeVisible({ timeout: 5000 })
    
    // 验证成功提示
    await expect(page.locator('div[role="status"]:has-text("成功")')).toBeVisible()
    
    // 验证产品是否已从列表中移除
    await expect(page.locator(`td:has-text("${productName}")`)).not.toBeVisible()
  })
  
  // 测试产品搜索
  test('应该能够搜索产品', async ({ page }) => {
    // 等待产品列表加载完成
    await page.waitForSelector('table')
    
    // 获取第一个产品的名称
    const productName = await page.locator('tbody tr').first().locator('td').nth(1).textContent()
    
    // 在搜索框中输入产品名称
    await page.fill('input[placeholder="搜索产品..."]', productName!)
    
    // 等待搜索结果
    await page.waitForTimeout(500) // 等待防抖
    
    // 验证搜索结果只包含匹配的产品
    const rowCount = await page.locator('tbody tr').count()
    expect(rowCount).toBeGreaterThan(0)
    
    // 验证所有显示的行都包含搜索词
    for (let i = 0; i < rowCount; i++) {
      const rowText = await page.locator('tbody tr').nth(i).textContent()
      expect(rowText?.toLowerCase()).toContain(productName?.toLowerCase())
    }
  })
  
  // 测试分类筛选
  test('应该能够按分类筛选产品', async ({ page }) => {
    // 等待产品列表加载完成
    await page.waitForSelector('table')
    
    // 获取分类选择器
    const categorySelect = page.locator('select[aria-label="分类"]')
    
    // 确保有分类可选
    const optionCount = await page.locator('select[aria-label="分类"] option').count()
    if (optionCount <= 1) {
      // 如果没有分类，跳过测试
      test.skip()
      return
    }
    
    // 选择第一个非"全部"的分类
    const categoryOption = page.locator('select[aria-label="分类"] option').nth(1)
    const categoryName = await categoryOption.textContent()
    const categoryValue = await categoryOption.getAttribute('value')
    
    await categorySelect.selectOption(categoryValue!)
    
    // 等待筛选结果
    await page.waitForTimeout(500)
    
    // 验证所有显示的行都属于选定的分类
    const rowCount = await page.locator('tbody tr').count()
    for (let i = 0; i < rowCount; i++) {
      const categoryCell = await page.locator('tbody tr').nth(i).locator('td').nth(2).textContent()
      expect(categoryCell).toBe(categoryName)
    }
  })
  
  // 测试批量编辑
  test('应该能够批量编辑产品', async ({ page }) => {
    // 等待产品列表加载完成
    await page.waitForSelector('table')
    
    // 选择前两个产品
    await page.locator('tbody tr').nth(0).locator('input[type="checkbox"]').check()
    await page.locator('tbody tr').nth(1).locator('input[type="checkbox"]').check()
    
    // 点击批量编辑按钮
    await page.click('button:has-text("批量编辑")')
    
    // 等待对话框打开
    await expect(page.locator('div[role="dialog"] h2:has-text("批量编辑产品")')).toBeVisible()
    
    // 选择要编辑的字段
    await page.locator('input[name="fields.price"]').check()
    
    // 选择价格操作
    await page.locator('select[name="priceAction"]').selectOption('increase')
    
    // 输入价格变化值
    await page.fill('input[name="priceValue"]', '10')
    
    // 点击保存按钮
    await page.click('button:has-text("保存")')
    
    // 等待对话框关闭
    await expect(page.locator('div[role="dialog"]')).not.toBeVisible({ timeout: 5000 })
    
    // 验证成功提示
    await expect(page.locator('div[role="status"]:has-text("成功")')).toBeVisible()
  })
  
  // 测试导出功能
  test('应该能够导出产品数据', async ({ page, context }) => {
    // 等待产品列表加载完成
    await page.waitForSelector('table')
    
    // 监听下载事件
    const downloadPromise = context.waitForEvent('download')
    
    // 点击导出按钮
    await page.click('button:has-text("导出数据")')
    
    // 等待对话框打开
    await expect(page.locator('div[role="dialog"] h2:has-text("导出产品数据")')).toBeVisible()
    
    // 点击导出按钮
    await page.click('div[role="dialog"] button:has-text("导出数据")')
    
    // 等待下载开始
    const download = await downloadPromise
    
    // 验证下载的文件名
    expect(download.suggestedFilename()).toContain('products_export')
  })
  
  // 测试产品分析页面
  test('应该能够访问产品分析页面', async ({ page }) => {
    // 点击数据分析按钮
    await page.click('a:has-text("数据分析")')
    
    // 等待页面加载
    await expect(page.locator('h1:has-text("产品数据分析")')).toBeVisible()
    
    // 验证图表是否显示
    await expect(page.locator('svg')).toBeVisible()
    
    // 验证统计卡片是否显示
    await expect(page.locator('div:has-text("产品总数")')).toBeVisible()
    await expect(page.locator('div:has-text("库存总价值")')).toBeVisible()
    await expect(page.locator('div:has-text("平均价格")')).toBeVisible()
  })
})
