/**
 * 库存管理API客户端
 * 替换Server Actions，使用统一的API Routes架构
 */

// 获取所有库存数据
export async function getInventory() {
  const response = await fetch('/api/inventory', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`获取库存数据失败: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

// 获取所有仓库数据
export async function getWarehouses() {
  const response = await fetch('/api/warehouses', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`获取仓库数据失败: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

// 创建库存记录
export async function createInventory(data: {
  productId: number
  warehouseId: number
  quantity: number
  minQuantity?: number
  notes?: string
}) {
  const response = await fetch('/api/inventory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`创建库存记录失败: ${response.statusText}`)
  }

  const result = await response.json()
  return result
}

// 更新库存记录
export async function updateInventory(id: number, data: {
  quantity?: number
  minQuantity?: number
  notes?: string
}) {
  const response = await fetch(`/api/inventory/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`更新库存记录失败: ${response.statusText}`)
  }

  const result = await response.json()
  return result
}

// 批量更新库存
export async function batchUpdateInventory(data: {
  inventoryIds: number[]
  actionType: string
  quantity?: number
  notes?: string
  warehouseId?: number
}) {
  const response = await fetch('/api/inventory/batch', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`批量更新库存失败: ${response.statusText}`)
  }

  const result = await response.json()
  return result
}

// 删除库存记录
export async function deleteInventory(id: number) {
  const response = await fetch(`/api/inventory/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`删除库存记录失败: ${response.statusText}`)
  }

  const result = await response.json()
  return result
}

// 批量删除库存记录
export async function batchDeleteInventory(ids: number[]) {
  const response = await fetch('/api/inventory/batch', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  })

  if (!response.ok) {
    throw new Error(`批量删除库存记录失败: ${response.statusText}`)
  }

  const result = await response.json()
  return result
}

// 库存转移
export async function transferInventory(data: {
  sourceWarehouseId: number
  targetWarehouseId: number
  productId: number
  quantity: number
  notes?: string
}) {
  const response = await fetch('/api/inventory/transfer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`库存转移失败: ${response.statusText}`)
  }

  const result = await response.json()
  return result
}

// 获取库存交易记录
export async function getInventoryTransactions(params?: {
  productId?: number
  warehouseId?: number
  type?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}) {
  const searchParams = new URLSearchParams()
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })
  }

  const response = await fetch(`/api/inventory/transactions?${searchParams}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`获取库存交易记录失败: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

// 导出库存数据
export async function exportInventory(params?: {
  warehouseId?: number
  format?: 'csv' | 'excel'
}) {
  const searchParams = new URLSearchParams()
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })
  }

  const response = await fetch(`/api/inventory/export?${searchParams}`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`导出库存数据失败: ${response.statusText}`)
  }

  return response.blob()
}

// 导入库存数据
export async function importInventory(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/inventory/import', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`导入库存数据失败: ${response.statusText}`)
  }

  const result = await response.json()
  return result
}

// 同步产品库存
export async function syncProductInventory(productId: number) {
  const response = await fetch('/api/inventory/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId }),
  })

  if (!response.ok) {
    throw new Error(`同步产品库存失败: ${response.statusText}`)
  }

  const result = await response.json()
  return result
}
