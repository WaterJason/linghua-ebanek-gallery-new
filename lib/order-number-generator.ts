/**
 * 订单号生成工具
 * 为不同类型的订单生成唯一的订单号
 */

import prisma from "@/lib/db";

/**
 * 订单类型枚举
 */
export enum OrderType {
  PURCHASE = 'PO',      // 采购订单 Purchase Order
  SALES = 'SO',         // 销售订单 Sales Order
  PRODUCTION = 'PRO',   // 生产订单 Production Order
  WORKSHOP = 'WO',      // 团建订单 Workshop Order
}

/**
 * 生成订单号
 * 格式：{前缀}{年月日}{4位序号}
 * 例如：PO20241228001, SO20241228001
 * 
 * @param orderType 订单类型
 * @param date 订单日期，默认为当前日期
 * @returns 生成的订单号
 */
export async function generateOrderNumber(
  orderType: OrderType, 
  date: Date = new Date()
): Promise<string> {
  try {
    // 格式化日期为 YYYYMMDD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // 构建订单号前缀
    const prefix = `${orderType}${dateStr}`;
    
    // 根据订单类型查询当天的最大序号
    let maxSequence = 0;
    
    switch (orderType) {
      case OrderType.PURCHASE:
        const purchaseOrders = await prisma.purchaseOrder.findMany({
          where: {
            orderNumber: {
              startsWith: prefix
            }
          },
          select: {
            orderNumber: true
          },
          orderBy: {
            orderNumber: 'desc'
          },
          take: 1
        });
        
        if (purchaseOrders.length > 0) {
          const lastOrderNumber = purchaseOrders[0].orderNumber;
          const sequenceStr = lastOrderNumber.slice(-3); // 取最后3位
          maxSequence = parseInt(sequenceStr) || 0;
        }
        break;
        
      case OrderType.SALES:
        const salesOrders = await prisma.order.findMany({
          where: {
            orderNumber: {
              startsWith: prefix
            }
          },
          select: {
            orderNumber: true
          },
          orderBy: {
            orderNumber: 'desc'
          },
          take: 1
        });
        
        if (salesOrders.length > 0) {
          const lastOrderNumber = salesOrders[0].orderNumber;
          const sequenceStr = lastOrderNumber.slice(-3);
          maxSequence = parseInt(sequenceStr) || 0;
        }
        break;
        
      case OrderType.PRODUCTION:
        const productionOrders = await prisma.productionOrder.findMany({
          where: {
            orderNumber: {
              startsWith: prefix
            }
          },
          select: {
            orderNumber: true
          },
          orderBy: {
            orderNumber: 'desc'
          },
          take: 1
        });
        
        if (productionOrders.length > 0) {
          const lastOrderNumber = productionOrders[0].orderNumber;
          const sequenceStr = lastOrderNumber.slice(-3);
          maxSequence = parseInt(sequenceStr) || 0;
        }
        break;
        
      case OrderType.WORKSHOP:
        // Workshop 表没有 orderNumber 字段，使用 ID 生成
        const workshops = await prisma.workshop.findMany({
          orderBy: {
            id: 'desc'
          },
          take: 1
        });
        
        if (workshops.length > 0) {
          maxSequence = workshops[0].id;
        }
        break;
        
      default:
        throw new Error(`不支持的订单类型: ${orderType}`);
    }
    
    // 生成新的序号（递增1）
    const newSequence = maxSequence + 1;
    const sequenceStr = String(newSequence).padStart(3, '0');
    
    // 生成完整的订单号
    const orderNumber = `${prefix}${sequenceStr}`;
    
    console.log(`生成订单号: ${orderNumber} (类型: ${orderType}, 日期: ${dateStr}, 序号: ${newSequence})`);
    
    return orderNumber;
  } catch (error) {
    console.error('生成订单号失败:', error);
    throw new Error(`生成订单号失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 验证订单号格式
 * 
 * @param orderNumber 订单号
 * @param orderType 期望的订单类型
 * @returns 验证结果
 */
export function validateOrderNumber(orderNumber: string, orderType: OrderType): boolean {
  try {
    // 检查订单号长度和格式
    const expectedLength = orderType.length + 8 + 3; // 前缀 + 日期 + 序号
    
    if (orderNumber.length !== expectedLength) {
      return false;
    }
    
    // 检查前缀
    if (!orderNumber.startsWith(orderType)) {
      return false;
    }
    
    // 检查日期部分（8位数字）
    const dateStr = orderNumber.slice(orderType.length, orderType.length + 8);
    if (!/^\d{8}$/.test(dateStr)) {
      return false;
    }
    
    // 检查序号部分（3位数字）
    const sequenceStr = orderNumber.slice(-3);
    if (!/^\d{3}$/.test(sequenceStr)) {
      return false;
    }
    
    // 验证日期是否有效
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6));
    const day = parseInt(dateStr.slice(6, 8));
    
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || 
        date.getMonth() !== month - 1 || 
        date.getDate() !== day) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('验证订单号失败:', error);
    return false;
  }
}

/**
 * 从订单号中提取信息
 * 
 * @param orderNumber 订单号
 * @returns 提取的信息
 */
export function parseOrderNumber(orderNumber: string): {
  type: string;
  date: Date;
  sequence: number;
} | null {
  try {
    // 确定订单类型
    let orderType: OrderType | null = null;
    for (const type of Object.values(OrderType)) {
      if (orderNumber.startsWith(type)) {
        orderType = type;
        break;
      }
    }
    
    if (!orderType) {
      return null;
    }
    
    // 验证订单号格式
    if (!validateOrderNumber(orderNumber, orderType)) {
      return null;
    }
    
    // 提取日期
    const dateStr = orderNumber.slice(orderType.length, orderType.length + 8);
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6));
    const day = parseInt(dateStr.slice(6, 8));
    const date = new Date(year, month - 1, day);
    
    // 提取序号
    const sequenceStr = orderNumber.slice(-3);
    const sequence = parseInt(sequenceStr);
    
    return {
      type: orderType,
      date,
      sequence
    };
  } catch (error) {
    console.error('解析订单号失败:', error);
    return null;
  }
}

/**
 * 检查订单号是否已存在
 * 
 * @param orderNumber 订单号
 * @param orderType 订单类型
 * @returns 是否已存在
 */
export async function isOrderNumberExists(
  orderNumber: string, 
  orderType: OrderType
): Promise<boolean> {
  try {
    switch (orderType) {
      case OrderType.PURCHASE:
        const purchaseOrder = await prisma.purchaseOrder.findUnique({
          where: { orderNumber }
        });
        return !!purchaseOrder;
        
      case OrderType.SALES:
        const salesOrder = await prisma.order.findUnique({
          where: { orderNumber }
        });
        return !!salesOrder;
        
      case OrderType.PRODUCTION:
        const productionOrder = await prisma.productionOrder.findUnique({
          where: { orderNumber }
        });
        return !!productionOrder;
        
      default:
        return false;
    }
  } catch (error) {
    console.error('检查订单号是否存在失败:', error);
    return false;
  }
}
