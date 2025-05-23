"use client"

import { openDB, IDBPDatabase } from 'idb'

// 定义数据库名称和版本
const DB_NAME = 'linghua-erp-offline'
const DB_VERSION = 1

// 定义存储对象
interface StoreConfig {
  name: string
  keyPath: string
  indexes: { name: string; keyPath: string; options?: IDBIndexParameters }[]
}

// 定义所有存储对象配置
const STORES: StoreConfig[] = [
  {
    name: 'finance',
    keyPath: 'id',
    indexes: [
      { name: 'timestamp', keyPath: 'timestamp' },
      { name: 'type', keyPath: 'type' },
      { name: 'synced', keyPath: 'synced' }
    ]
  },
  {
    name: 'inventory',
    keyPath: 'id',
    indexes: [
      { name: 'timestamp', keyPath: 'timestamp' },
      { name: 'category', keyPath: 'category' },
      { name: 'synced', keyPath: 'synced' }
    ]
  },
  {
    name: 'sales',
    keyPath: 'id',
    indexes: [
      { name: 'timestamp', keyPath: 'timestamp' },
      { name: 'status', keyPath: 'status' },
      { name: 'synced', keyPath: 'synced' }
    ]
  },
  {
    name: 'employees',
    keyPath: 'id',
    indexes: [
      { name: 'timestamp', keyPath: 'timestamp' },
      { name: 'department', keyPath: 'department' },
      { name: 'synced', keyPath: 'synced' }
    ]
  },
  {
    name: 'settings',
    keyPath: 'key',
    indexes: [
      { name: 'timestamp', keyPath: 'timestamp' }
    ]
  }
]

// 初始化数据库
async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 为每个存储对象创建对象存储
      STORES.forEach(store => {
        if (!db.objectStoreNames.contains(store.name)) {
          const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath })
          
          // 创建索引
          store.indexes.forEach(index => {
            objectStore.createIndex(index.name, index.keyPath, index.options)
          })
        }
      })
    }
  })
}

/**
 * 添加数据到指定存储
 * @param storeName 存储名称
 * @param data 要添加的数据
 * @returns 新添加数据的ID
 */
export async function addData(storeName: string, data: any): Promise<IDBValidKey> {
  const db = await initDB()
  const timestamp = Date.now()
  const dataWithTimestamp = {
    ...data,
    timestamp,
    synced: false
  }
  return db.add(storeName, dataWithTimestamp)
}

/**
 * 更新存储中的数据
 * @param storeName 存储名称
 * @param data 要更新的数据（必须包含keyPath字段）
 * @returns 无
 */
export async function updateData(storeName: string, data: any): Promise<void> {
  const db = await initDB()
  const timestamp = Date.now()
  const dataWithTimestamp = {
    ...data,
    timestamp,
    synced: false
  }
  await db.put(storeName, dataWithTimestamp)
}

/**
 * 从存储中获取数据
 * @param storeName 存储名称
 * @param key 数据的键
 * @returns 获取的数据，如果不存在则返回null
 */
export async function getData(storeName: string, key: IDBValidKey): Promise<any> {
  const db = await initDB()
  return db.get(storeName, key)
}

/**
 * 从存储中获取所有数据
 * @param storeName 存储名称
 * @returns 所有数据的数组
 */
export async function getAllData(storeName: string): Promise<any[]> {
  const db = await initDB()
  return db.getAll(storeName)
}

/**
 * 从存储中删除数据
 * @param storeName 存储名称
 * @param key 要删除的数据的键
 * @returns 无
 */
export async function deleteData(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await initDB()
  await db.delete(storeName, key)
}

/**
 * 清空存储中的所有数据
 * @param storeName 存储名称
 * @returns 无
 */
export async function clearStore(storeName: string): Promise<void> {
  const db = await initDB()
  await db.clear(storeName)
}

/**
 * 根据索引获取数据
 * @param storeName 存储名称
 * @param indexName 索引名称
 * @param key 索引键值
 * @returns 匹配的数据数组
 */
export async function getDataByIndex(storeName: string, indexName: string, key: IDBValidKey): Promise<any[]> {
  const db = await initDB()
  return db.getAllFromIndex(storeName, indexName, key)
}

/**
 * 获取未同步的数据
 * @param storeName 存储名称
 * @returns 未同步的数据数组
 */
export async function getUnsyncedData(storeName: string): Promise<any[]> {
  return getDataByIndex(storeName, 'synced', false)
}

/**
 * 标记数据为已同步
 * @param storeName 存储名称
 * @param key 数据的键
 * @returns 无
 */
export async function markAsSynced(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await initDB()
  const data = await db.get(storeName, key)
  if (data) {
    data.synced = true
    await db.put(storeName, data)
  }
}

/**
 * 检查数据库连接
 * @returns 如果数据库可以连接，则返回true
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const db = await initDB()
    return !!db
  } catch (error) {
    console.error('数据库连接检查失败:', error)
    return false
  }
}
