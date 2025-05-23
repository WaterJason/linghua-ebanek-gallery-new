"use server";

/**
 * 全局搜索服务
 *
 * 本模块提供全局搜索功能，支持跨模块搜索各种实体。
 *
 * @module 全局搜索
 * @category 核心模块
 */

import prisma from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";
import { fuzzySearch } from "@/lib/fuzzy-search";
import { logActivity } from "@/lib/user-activity-logger";

// 搜索结果类型
export type SearchResultType =
  | "product"   // 产品
  | "order"     // 订单
  | "customer"  // 客户
  | "supplier"  // 供应商
  | "employee"  // 员工
  | "inventory" // 库存
  | "workshop"  // 团建
  | "channel"   // 渠道
  | "finance"   // 财务
  | "other";    // 其他

// 搜索结果项
export interface SearchResultItem {
  id: string | number;
  type: SearchResultType;
  title: string;
  description?: string;
  imageUrl?: string;
  link: string;
  relevance: number;
  metadata?: Record<string, any>;
}

// 搜索参数
export interface SearchParams {
  query: string;
  types?: SearchResultType[];
  limit?: number;
  offset?: number;
}

/**
 * 全局搜索
 *
 * @param params 搜索参数
 * @returns 搜索结果
 */
export async function globalSearch(params: SearchParams) {
  try {
    // 获取当前用户
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("未授权");
    }

    // 如果查询为空，返回空结果
    if (!params.query || params.query.trim() === "") {
      return { results: [], total: 0 };
    }

    // 记录搜索活动
    logActivity("search", {
      query: params.query,
      types: params.types,
      userId: currentUser.id,
    });

    // 构建查询类型
    const types = params.types || [
      "product", "order", "customer", "supplier",
      "employee", "inventory", "workshop", "channel", "finance"
    ];

    // 限制结果数量
    const limit = params.limit || 20;
    const offset = params.offset || 0;

    // 存储所有搜索结果
    let allResults: SearchResultItem[] = [];

    // 根据类型执行不同的搜索
    if (types.includes("product")) {
      const products = await searchProducts(params.query);
      allResults = [...allResults, ...products];
    }

    if (types.includes("order")) {
      const orders = await searchOrders(params.query);
      allResults = [...allResults, ...orders];
    }

    if (types.includes("customer")) {
      const customers = await searchCustomers(params.query);
      allResults = [...allResults, ...customers];
    }

    if (types.includes("supplier")) {
      const suppliers = await searchSuppliers(params.query);
      allResults = [...allResults, ...suppliers];
    }

    if (types.includes("employee")) {
      const employees = await searchEmployees(params.query);
      allResults = [...allResults, ...employees];
    }

    if (types.includes("inventory")) {
      const inventoryItems = await searchInventory(params.query);
      allResults = [...allResults, ...inventoryItems];
    }

    if (types.includes("workshop")) {
      const workshops = await searchWorkshops(params.query);
      allResults = [...allResults, ...workshops];
    }

    if (types.includes("channel")) {
      const channels = await searchChannels(params.query);
      allResults = [...allResults, ...channels];
    }

    if (types.includes("finance")) {
      const financeItems = await searchFinance(params.query);
      allResults = [...allResults, ...financeItems];
    }

    // 按相关性排序
    allResults.sort((a, b) => b.relevance - a.relevance);

    // 分页
    const paginatedResults = allResults.slice(offset, offset + limit);

    return {
      results: paginatedResults,
      total: allResults.length,
    };
  } catch (error) {
    console.error("全局搜索失败:", error);
    throw new Error("全局搜索失败");
  }
}

/**
 * 搜索产品
 *
 * @param query 搜索关键词
 * @returns 搜索结果
 */
async function searchProducts(query: string): Promise<SearchResultItem[]> {
  // 从数据库获取产品
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { material: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { barcode: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      productCategory: true,
    },
    take: 50,
  });

  // 使用模糊搜索计算相关性
  const fuzzyResults = fuzzySearch(
    products,
    query,
    {
      keys: ["name", "description", "material", "sku", "barcode"],
      threshold: 0.3,
    }
  );

  // 转换为搜索结果格式
  return fuzzyResults.map(result => ({
    id: result.item.id,
    type: "product" as SearchResultType,
    title: result.item.name,
    description: result.item.description || `${result.item.productCategory?.name || ""} - ${result.item.material || ""}`,
    imageUrl: result.item.imageUrl || result.item.imageUrls?.[0],
    link: `/products/${result.item.id}`,
    relevance: result.score,
    metadata: {
      price: result.item.price,
      category: result.item.productCategory?.name,
      inventory: result.item.inventory,
    },
  }));
}

/**
 * 搜索订单
 *
 * @param query 搜索关键词
 * @returns 搜索结果
 */
async function searchOrders(query: string): Promise<SearchResultItem[]> {
  // 从数据库获取订单
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { orderNumber: { contains: query, mode: "insensitive" } },
        { notes: { contains: query, mode: "insensitive" } },
        { customRequirements: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      customer: true,
      employee: true,
    },
    take: 50,
  });

  // 使用模糊搜索计算相关性
  const fuzzyResults = fuzzySearch(
    orders,
    query,
    {
      keys: ["orderNumber", "notes", "customRequirements"],
      threshold: 0.3,
    }
  );

  // 转换为搜索结果格式
  return fuzzyResults.map(result => ({
    id: result.item.id,
    type: "order" as SearchResultType,
    title: `订单 #${result.item.orderNumber}`,
    description: `客户: ${result.item.customer?.name} - 金额: ¥${result.item.totalAmount}`,
    link: `/sales/orders/${result.item.id}`,
    relevance: result.score,
    metadata: {
      status: result.item.status,
      paymentStatus: result.item.paymentStatus,
      orderDate: result.item.orderDate,
      customerName: result.item.customer?.name,
      employeeName: result.item.employee?.name,
    },
  }));
}

/**
 * 搜索客户
 *
 * @param query 搜索关键词
 * @returns 搜索结果
 */
async function searchCustomers(query: string): Promise<SearchResultItem[]> {
  // 从数据库获取客户
  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
        { notes: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 50,
  });

  // 使用模糊搜索计算相关性
  const fuzzyResults = fuzzySearch(
    customers,
    query,
    {
      keys: ["name", "phone", "email", "address", "notes"],
      threshold: 0.3,
    }
  );

  // 转换为搜索结果格式
  return fuzzyResults.map(result => ({
    id: result.item.id,
    type: "customer" as SearchResultType,
    title: result.item.name,
    description: `${result.item.type === "individual" ? "个人客户" : "企业客户"} - ${result.item.phone || result.item.email || ""}`,
    link: `/customers/${result.item.id}`,
    relevance: result.score,
    metadata: {
      type: result.item.type,
      phone: result.item.phone,
      email: result.item.email,
      isActive: result.item.isActive,
    },
  }));
}

/**
 * 搜索供应商
 *
 * @param query 搜索关键词
 * @returns 搜索结果
 */
async function searchSuppliers(query: string): Promise<SearchResultItem[]> {
  // 从数据库获取供应商
  const suppliers = await prisma.supplier.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { contactPerson: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 50,
  });

  // 使用模糊搜索计算相关性
  const fuzzyResults = fuzzySearch(
    suppliers,
    query,
    {
      keys: ["name", "contactPerson", "phone", "email", "address", "description"],
      threshold: 0.3,
    }
  );

  // 转换为搜索结果格式
  return fuzzyResults.map(result => ({
    id: result.item.id,
    type: "supplier" as SearchResultType,
    title: result.item.name,
    description: `联系人: ${result.item.contactPerson || ""} - ${result.item.phone || result.item.email || ""}`,
    link: `/purchase/suppliers/${result.item.id}`,
    relevance: result.score,
    metadata: {
      contactPerson: result.item.contactPerson,
      phone: result.item.phone,
      email: result.item.email,
      isActive: result.item.isActive,
    },
  }));
}

/**
 * 搜索员工
 *
 * @param query 搜索关键词
 * @returns 搜索结果
 */
async function searchEmployees(query: string): Promise<SearchResultItem[]> {
  // 从数据库获取员工
  const employees = await prisma.employee.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { position: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 50,
  });

  // 使用模糊搜索计算相关性
  const fuzzyResults = fuzzySearch(
    employees,
    query,
    {
      keys: ["name", "position", "phone", "email"],
      threshold: 0.3,
    }
  );

  // 转换为搜索结果格式
  return fuzzyResults.map(result => ({
    id: result.item.id,
    type: "employee" as SearchResultType,
    title: result.item.name,
    description: `职位: ${result.item.position} - ${result.item.phone || result.item.email || ""}`,
    link: `/employees/${result.item.id}`,
    relevance: result.score,
    metadata: {
      position: result.item.position,
      phone: result.item.phone,
      email: result.item.email,
      status: result.item.status,
    },
  }));
}

/**
 * 搜索库存
 *
 * @param query 搜索关键词
 * @returns 搜索结果
 */
async function searchInventory(query: string): Promise<SearchResultItem[]> {
  // 从数据库获取库存项
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: {
      OR: [
        { notes: { contains: query, mode: "insensitive" } },
        {
          product: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { sku: { contains: query, mode: "insensitive" } },
              { barcode: { contains: query, mode: "insensitive" } },
            ],
          },
        },
        {
          warehouse: {
            name: { contains: query, mode: "insensitive" },
          },
        },
      ],
    },
    include: {
      product: true,
      warehouse: true,
    },
    take: 50,
  });

  // 使用模糊搜索计算相关性
  const fuzzyResults = fuzzySearch(
    inventoryItems.map(item => ({
      ...item,
      productName: item.product.name,
      warehouseName: item.warehouse.name,
    })),
    query,
    {
      keys: ["notes", "productName", "warehouseName"],
      threshold: 0.3,
    }
  );

  // 转换为搜索结果格式
  return fuzzyResults.map(result => ({
    id: result.item.id,
    type: "inventory" as SearchResultType,
    title: result.item.product.name,
    description: `仓库: ${result.item.warehouse.name} - 数量: ${result.item.quantity}`,
    imageUrl: result.item.product.imageUrl || result.item.product.imageUrls?.[0],
    link: `/inventory?productId=${result.item.productId}&warehouseId=${result.item.warehouseId}`,
    relevance: result.score,
    metadata: {
      quantity: result.item.quantity,
      minQuantity: result.item.minQuantity,
      warehouseName: result.item.warehouse.name,
      productName: result.item.product.name,
    },
  }));
}

/**
 * 搜索团建活动
 *
 * @param query 搜索关键词
 * @returns 搜索结果
 */
async function searchWorkshops(query: string): Promise<SearchResultItem[]> {
  // 从数据库获取团建活动
  const workshops = await prisma.workshop.findMany({
    where: {
      OR: [
        { notes: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
        {
          customer: {
            name: { contains: query, mode: "insensitive" },
          },
        },
        {
          teacher: {
            name: { contains: query, mode: "insensitive" },
          },
        },
        {
          activity: {
            name: { contains: query, mode: "insensitive" },
          },
        },
      ],
    },
    include: {
      customer: true,
      teacher: true,
      activity: true,
    },
    take: 50,
  });

  // 使用模糊搜索计算相关性
  const fuzzyResults = fuzzySearch(
    workshops.map(workshop => ({
      ...workshop,
      customerName: workshop.customer?.name || "",
      teacherName: workshop.teacher?.name || "",
      activityName: workshop.activity?.name || "",
    })),
    query,
    {
      keys: ["notes", "location", "customerName", "teacherName", "activityName"],
      threshold: 0.3,
    }
  );

  // 转换为搜索结果格式
  return fuzzyResults.map(result => ({
    id: result.item.id,
    type: "workshop" as SearchResultType,
    title: result.item.activity?.name || `团建活动 #${result.item.id}`,
    description: `客户: ${result.item.customer?.name || ""} - 讲师: ${result.item.teacher?.name || ""} - 日期: ${new Date(result.item.date).toLocaleDateString()}`,
    link: `/workshop/${result.item.id}`,
    relevance: result.score,
    metadata: {
      date: result.item.date,
      location: result.item.location,
      participants: result.item.participants,
      status: result.item.status,
    },
  }));
}

/**
 * 搜索渠道
 *
 * @param query 搜索关键词
 * @returns 搜索结果
 */
async function searchChannels(query: string): Promise<SearchResultItem[]> {
  // 从数据库获取渠道
  const channels = await prisma.channel.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { code: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { contactName: { contains: query, mode: "insensitive" } },
        { contactPhone: { contains: query, mode: "insensitive" } },
        { contactEmail: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 50,
  });

  // 使用模糊搜索计算相关性
  const fuzzyResults = fuzzySearch(
    channels,
    query,
    {
      keys: ["name", "code", "description", "contactName", "contactPhone", "contactEmail", "address"],
      threshold: 0.3,
    }
  );

  // 转换为搜索结果格式
  return fuzzyResults.map(result => ({
    id: result.item.id,
    type: "channel" as SearchResultType,
    title: result.item.name,
    description: `代码: ${result.item.code} - 联系人: ${result.item.contactName || ""}`,
    link: `/channels/${result.item.id}`,
    relevance: result.score,
    metadata: {
      code: result.item.code,
      contactName: result.item.contactName,
      contactPhone: result.item.contactPhone,
      status: result.item.status,
    },
  }));
}

/**
 * 搜索财务记录
 *
 * @param query 搜索关键词
 * @returns 搜索结果
 */
async function searchFinance(query: string): Promise<SearchResultItem[]> {
  // 从数据库获取财务交易
  const transactions = await prisma.financialTransaction.findMany({
    where: {
      OR: [
        { notes: { contains: query, mode: "insensitive" } },
        { counterparty: { contains: query, mode: "insensitive" } },
        {
          account: {
            name: { contains: query, mode: "insensitive" },
          },
        },
        {
          category: {
            name: { contains: query, mode: "insensitive" },
          },
        },
      ],
    },
    include: {
      account: true,
      category: true,
    },
    take: 50,
  });

  // 使用模糊搜索计算相关性
  const fuzzyResults = fuzzySearch(
    transactions.map(transaction => ({
      ...transaction,
      accountName: transaction.account?.name || "",
      categoryName: transaction.category?.name || "",
    })),
    query,
    {
      keys: ["notes", "counterparty", "accountName", "categoryName"],
      threshold: 0.3,
    }
  );

  // 转换为搜索结果格式
  return fuzzyResults.map(result => ({
    id: result.item.id,
    type: "finance" as SearchResultType,
    title: `${result.item.type === "income" ? "收入" : "支出"} - ¥${Math.abs(result.item.amount)}`,
    description: `账户: ${result.item.account.name} - 分类: ${result.item.category?.name || ""} - 日期: ${new Date(result.item.transactionDate).toLocaleDateString()}`,
    link: `/finance/transactions/${result.item.id}`,
    relevance: result.score,
    metadata: {
      type: result.item.type,
      amount: result.item.amount,
      transactionDate: result.item.transactionDate,
      status: result.item.status,
    },
  }));
}
