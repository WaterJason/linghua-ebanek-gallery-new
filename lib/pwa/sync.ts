"use client"

import { openDB, IDBPDatabase } from 'idb'

// 定义离线数据库名称和版本
const DB_NAME = 'linghua-erp-offline'
const DB_VERSION = 1

// 定义存储对象名称
const STORES = {
  PENDING_TRANSACTIONS: 'pendingTransactions',
  OFFLINE_DATA: 'offlineData',
  SYNC_LOG: 'syncLog'
}

// 初始化数据库
async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 创建待同步交易存储
      if (!db.objectStoreNames.contains(STORES.PENDING_TRANSACTIONS)) {
        const store = db.createObjectStore(STORES.PENDING_TRANSACTIONS, { 
          keyPath: 'id', 
          autoIncrement: true 
        })
        store.createIndex('timestamp', 'timestamp')
        store.createIndex('type', 'type')
      }

      // 创建离线数据存储
      if (!db.objectStoreNames.contains(STORES.OFFLINE_DATA)) {
        const store = db.createObjectStore(STORES.OFFLINE_DATA, { 
          keyPath: 'key' 
        })
        store.createIndex('category', 'category')
        store.createIndex('timestamp', 'timestamp')
      }

      // 创建同步日志存储
      if (!db.objectStoreNames.contains(STORES.SYNC_LOG)) {
        const store = db.createObjectStore(STORES.SYNC_LOG, { 
          keyPath: 'id', 
          autoIncrement: true 
        })
        store.createIndex('timestamp', 'timestamp')
        store.createIndex('status', 'status')
      }
    }
  })
}

// 添加待同步交易
export async function addPendingTransaction(transaction: any): Promise<number> {
  const db = await initDB()
  const tx = {
    ...transaction,
    timestamp: Date.now(),
    synced: false
  }
  return db.add(STORES.PENDING_TRANSACTIONS, tx)
}

// 获取所有待同步交易
export async function getPendingTransactions(): Promise<any[]> {
  const db = await initDB()
  return db.getAllFromIndex(STORES.PENDING_TRANSACTIONS, 'timestamp')
}

// 标记交易为已同步
export async function markTransactionSynced(id: number): Promise<void> {
  const db = await initDB()
  const tx = await db.get(STORES.PENDING_TRANSACTIONS, id)
  if (tx) {
    tx.synced = true
    await db.put(STORES.PENDING_TRANSACTIONS, tx)
  }
}

// 删除已同步的交易
export async function removeSyncedTransactions(): Promise<void> {
  const db = await initDB()
  const txs = await db.getAllFromIndex(STORES.PENDING_TRANSACTIONS, 'timestamp')
  
  const transaction = db.transaction(STORES.PENDING_TRANSACTIONS, 'readwrite')
  const store = transaction.objectStore(STORES.PENDING_TRANSACTIONS)
  
  for (const tx of txs) {
    if (tx.synced) {
      await store.delete(tx.id)
    }
  }
  
  await transaction.done
}

// 存储离线数据
export async function storeOfflineData(key: string, data: any, category: string): Promise<void> {
  const db = await initDB()
  await db.put(STORES.OFFLINE_DATA, {
    key,
    data,
    category,
    timestamp: Date.now()
  })
}

// 获取离线数据
export async function getOfflineData(key: string): Promise<any> {
  const db = await initDB()
  const data = await db.get(STORES.OFFLINE_DATA, key)
  return data ? data.data : null
}

// 获取特定类别的所有离线数据
export async function getOfflineDataByCategory(category: string): Promise<any[]> {
  const db = await initDB()
  const allData = await db.getAllFromIndex(STORES.OFFLINE_DATA, 'category', category)
  return allData.map(item => item.data)
}

// 记录同步日志
export async function logSync(action: string, status: 'success' | 'error', details?: any): Promise<void> {
  const db = await initDB()
  await db.add(STORES.SYNC_LOG, {
    action,
    status,
    details,
    timestamp: Date.now()
  })
}

// 执行数据同步
export async function syncData(): Promise<{ success: boolean, message: string }> {
  try {
    // 检查网络连接
    if (!navigator.onLine) {
      return { 
        success: false, 
        message: '无网络连接，无法同步数据' 
      }
    }

    // 获取待同步交易
    const pendingTransactions = await getPendingTransactions()
    
    if (pendingTransactions.length === 0) {
      return { 
        success: true, 
        message: '没有待同步的数据' 
      }
    }

    // 按类型分组交易
    const transactionsByType: Record<string, any[]> = {}
    
    pendingTransactions.forEach(tx => {
      if (!tx.synced) {
        if (!transactionsByType[tx.type]) {
          transactionsByType[tx.type] = []
        }
        transactionsByType[tx.type].push(tx)
      }
    })

    // 同步每种类型的交易
    for (const [type, transactions] of Object.entries(transactionsByType)) {
      try {
        // 这里应该调用相应的API来同步数据
        // 例如: await syncTransactionsToServer(type, transactions)
        
        // 模拟同步成功
        for (const tx of transactions) {
          await markTransactionSynced(tx.id)
        }
        
        await logSync(`同步${type}`, 'success', { count: transactions.length })
      } catch (error) {
        await logSync(`同步${type}`, 'error', { error: String(error), count: transactions.length })
        return { 
          success: false, 
          message: `同步${type}数据失败: ${error}` 
        }
      }
    }

    // 清理已同步的交易
    await removeSyncedTransactions()

    return { 
      success: true, 
      message: '数据同步成功' 
    }
  } catch (error) {
    await logSync('同步数据', 'error', { error: String(error) })
    return { 
      success: false, 
      message: `数据同步过程中发生错误: ${error}` 
    }
  }
}
