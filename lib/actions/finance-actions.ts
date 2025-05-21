/**
 * 财务管理模块
 *
 * 本模块提供财务管理相关的功能，包括资金账户管理、收支分类管理、资金交易记录管理等。
 *
 * @module 财务管理
 * @category 核心模块
 */

"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  PrismaFinancialAccount,
  PrismaFinancialCategory,
  PrismaFinancialTransaction,
  CreateFinancialAccountInput,
  UpdateFinancialAccountInput,
  CreateFinancialCategoryInput,
  UpdateFinancialCategoryInput,
  CreateFinancialTransactionInput,
  UpdateFinancialTransactionInput
} from "@/types/prisma-models";
import { ErrorUtils } from "@/lib/error-utils";

/**
 * 获取所有资金账户
 *
 * @param includeInactive 是否包含非活跃账户
 * @returns 资金账户列表
 */
export async function getFinancialAccounts(includeInactive: boolean = false): Promise<PrismaFinancialAccount[]> {
  try {
    const whereClause = includeInactive ? {} : { isActive: true };

    const accounts = await prisma.financialAccount.findMany({
      where: whereClause,
      orderBy: {
        name: "asc",
      },
    });

    return accounts;
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-accounts");
    throw appError;
  }
}

/**
 * 获取单个资金账户
 *
 * @param id 账户ID
 * @returns 资金账户
 */
export async function getFinancialAccount(id: number): Promise<PrismaFinancialAccount | null> {
  try {
    const account = await prisma.financialAccount.findUnique({
      where: { id },
    });

    return account;
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-accounts");
    throw appError;
  }
}

/**
 * 创建资金账户
 *
 * @param data 账户创建数据
 * @returns 创建的账户
 */
export async function createFinancialAccount(data: CreateFinancialAccountInput): Promise<PrismaFinancialAccount> {
  try {
    // 验证必填字段
    if (!data.name) {
      throw new Error("账户名称为必填项");
    }

    if (!data.accountType) {
      throw new Error("账户类型为必填项");
    }

    // 创建账户
    const account = await prisma.financialAccount.create({
      data: {
        name: data.name,
        accountNumber: data.accountNumber || null,
        accountType: data.accountType,
        bankName: data.bankName || null,
        initialBalance: data.initialBalance || 0,
        currentBalance: data.initialBalance || 0, // 初始余额即为当前余额
        isActive: data.isActive !== undefined ? data.isActive : true,
        notes: data.notes || null,
      },
    });

    revalidatePath("/finance/accounts");
    return account;
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-accounts");
    throw appError;
  }
}

/**
 * 更新资金账户
 *
 * @param id 账户ID
 * @param data 账户更新数据
 * @returns 更新后的账户
 */
export async function updateFinancialAccount(id: number, data: UpdateFinancialAccountInput): Promise<PrismaFinancialAccount> {
  try {
    // 检查账户是否存在
    const existingAccount = await prisma.financialAccount.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      throw new Error("账户不存在");
    }

    // 如果更新初始余额，需要同时更新当前余额
    let currentBalanceChange = 0;
    if (data.initialBalance !== undefined && data.initialBalance !== existingAccount.initialBalance) {
      currentBalanceChange = data.initialBalance - existingAccount.initialBalance;
    }

    // 更新账户
    const account = await prisma.financialAccount.update({
      where: { id },
      data: {
        name: data.name,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        bankName: data.bankName,
        initialBalance: data.initialBalance,
        currentBalance: {
          increment: currentBalanceChange,
        },
        isActive: data.isActive,
        notes: data.notes,
      },
    });

    revalidatePath("/finance/accounts");
    return account;
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-accounts");
    throw appError;
  }
}

/**
 * 删除资金账户
 *
 * @param id 账户ID
 * @returns 操作结果
 */
export async function deleteFinancialAccount(id: number): Promise<{ success: boolean }> {
  try {
    // 检查账户是否存在
    const existingAccount = await prisma.financialAccount.findUnique({
      where: { id },
      include: {
        transactions: {
          take: 1,
        },
      },
    });

    if (!existingAccount) {
      throw new Error("账户不存在");
    }

    // 检查账户是否有关联的交易记录
    if (existingAccount.transactions.length > 0) {
      throw new Error("该账户已有交易记录，无法删除");
    }

    // 删除账户
    await prisma.financialAccount.delete({
      where: { id },
    });

    revalidatePath("/finance/accounts");
    return { success: true };
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-accounts");
    throw appError;
  }
}

/**
 * 获取所有收支分类
 *
 * @param type 分类类型 (income, expense, all)
 * @param includeInactive 是否包含非活跃分类
 * @returns 收支分类列表
 */
export async function getFinancialCategories(
  type: string = "all",
  includeInactive: boolean = false
): Promise<PrismaFinancialCategory[]> {
  try {
    let whereClause: any = {};

    if (type !== "all") {
      whereClause.type = type;
    }

    if (!includeInactive) {
      whereClause.isActive = true;
    }

    const categories = await prisma.financialCategory.findMany({
      where: whereClause,
      orderBy: [
        {
          type: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return categories;
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-categories");
    throw appError;
  }
}

/**
 * 获取单个收支分类
 *
 * @param id 分类ID
 * @returns 收支分类
 */
export async function getFinancialCategory(id: number): Promise<PrismaFinancialCategory | null> {
  try {
    const category = await prisma.financialCategory.findUnique({
      where: { id },
    });

    return category;
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-categories");
    throw appError;
  }
}

/**
 * 创建收支分类
 *
 * @param data 分类创建数据
 * @returns 创建的分类
 */
export async function createFinancialCategory(data: CreateFinancialCategoryInput): Promise<PrismaFinancialCategory> {
  try {
    // 验证必填字段
    if (!data.name) {
      throw new Error("分类名称为必填项");
    }

    if (!data.type) {
      throw new Error("分类类型为必填项");
    }

    if (!data.code) {
      throw new Error("分类编码为必填项");
    }

    // 检查编码是否已存在
    const existingCategory = await prisma.financialCategory.findFirst({
      where: { code: data.code },
    });

    if (existingCategory) {
      throw new Error("分类编码已存在");
    }

    // 创建分类
    const category = await prisma.financialCategory.create({
      data: {
        name: data.name,
        type: data.type,
        code: data.code,
        parentId: data.parentId || null,
        description: data.description || null,
        isSystem: data.isSystem !== undefined ? data.isSystem : false,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    revalidatePath("/finance/categories");
    return category;
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-categories");
    throw appError;
  }
}

/**
 * 更新收支分类
 *
 * @param id 分类ID
 * @param data 分类更新数据
 * @returns 更新后的分类
 */
export async function updateFinancialCategory(id: number, data: UpdateFinancialCategoryInput): Promise<PrismaFinancialCategory> {
  try {
    // 检查分类是否存在
    const existingCategory = await prisma.financialCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new Error("分类不存在");
    }

    // 如果更新编码，检查新编码是否已存在
    if (data.code && data.code !== existingCategory.code) {
      const duplicateCode = await prisma.financialCategory.findFirst({
        where: { code: data.code },
      });

      if (duplicateCode) {
        throw new Error("分类编码已存在");
      }
    }

    // 更新分类
    const category = await prisma.financialCategory.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        code: data.code,
        parentId: data.parentId,
        description: data.description,
        isSystem: data.isSystem,
        isActive: data.isActive,
      },
    });

    revalidatePath("/finance/categories");
    return category;
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-categories");
    throw appError;
  }
}

/**
 * 删除收支分类
 *
 * @param id 分类ID
 * @returns 操作结果
 */
export async function deleteFinancialCategory(id: number): Promise<{ success: boolean }> {
  try {
    // 检查分类是否存在
    const existingCategory = await prisma.financialCategory.findUnique({
      where: { id },
      include: {
        transactions: {
          take: 1,
        },
        children: {
          take: 1,
        },
      },
    });

    if (!existingCategory) {
      throw new Error("分类不存在");
    }

    // 检查分类是否为系统预设
    if (existingCategory.isSystem) {
      throw new Error("系统预设分类不能删除");
    }

    // 检查分类是否有子分类
    if (existingCategory.children.length > 0) {
      throw new Error("该分类下有子分类，无法删除");
    }

    // 检查分类是否有关联的交易记录
    if (existingCategory.transactions.length > 0) {
      throw new Error("该分类已有交易记录，无法删除");
    }

    // 删除分类
    await prisma.financialCategory.delete({
      where: { id },
    });

    revalidatePath("/finance/categories");
    return { success: true };
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-categories");
    throw appError;
  }
}

/**
 * 获取财务交易记录
 *
 * @param accountId 账户ID
 * @param categoryId 分类ID
 * @param type 交易类型
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param limit 每页数量
 * @param offset 偏移量
 * @returns 交易记录列表和总数
 */
export async function getFinancialTransactions(
  accountId?: number,
  categoryId?: number,
  type?: string,
  startDate?: string,
  endDate?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ data: PrismaFinancialTransaction[], total: number }> {
  try {
    // 构建查询条件
    let whereClause: any = {};

    if (accountId) {
      whereClause.accountId = accountId;
    }

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (type) {
      whereClause.type = type;
    }

    if (startDate && endDate) {
      whereClause.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.transactionDate = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.transactionDate = {
        lte: new Date(endDate),
      };
    }

    // 获取总记录数
    const total = await prisma.financialTransaction.count({
      where: whereClause,
    });

    // 获取分页数据
    const transactions = await prisma.financialTransaction.findMany({
      where: whereClause,
      include: {
        account: true,
        category: true,
      },
      orderBy: {
        transactionDate: "desc",
      },
      skip: offset,
      take: limit,
    });

    return {
      data: transactions,
      total,
    };
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-transactions");
    throw appError;
  }
}

/**
 * 获取单个财务交易记录
 *
 * @param id 交易记录ID
 * @returns 交易记录
 */
export async function getFinancialTransaction(id: number): Promise<PrismaFinancialTransaction | null> {
  try {
    const transaction = await prisma.financialTransaction.findUnique({
      where: { id },
      include: {
        account: true,
        category: true,
      },
    });

    return transaction;
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-transactions");
    throw appError;
  }
}

/**
 * 创建财务交易记录
 *
 * @param data 交易记录创建数据
 * @returns 创建的交易记录
 */
export async function createFinancialTransaction(data: CreateFinancialTransactionInput): Promise<PrismaFinancialTransaction> {
  try {
    // 验证必填字段
    if (!data.transactionDate) {
      throw new Error("交易日期为必填项");
    }

    if (data.amount === undefined || data.amount === null) {
      throw new Error("交易金额为必填项");
    }

    if (!data.type) {
      throw new Error("交易类型为必填项");
    }

    if (!data.accountId) {
      throw new Error("资金账户为必填项");
    }

    // 检查账户是否存在
    const account = await prisma.financialAccount.findUnique({
      where: { id: data.accountId },
    });

    if (!account) {
      throw new Error("资金账户不存在");
    }

    // 如果指定了分类，检查分类是否存在
    if (data.categoryId) {
      const category = await prisma.financialCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new Error("收支分类不存在");
      }

      // 检查分类类型是否与交易类型匹配
      if ((data.type === "income" && category.type !== "income") ||
          (data.type === "expense" && category.type !== "expense")) {
        throw new Error("收支分类类型与交易类型不匹配");
      }
    }

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 创建交易记录
      const transaction = await tx.financialTransaction.create({
        data: {
          transactionDate: new Date(data.transactionDate),
          amount: data.amount,
          type: data.type,
          accountId: data.accountId,
          categoryId: data.categoryId || null,
          paymentMethod: data.paymentMethod || null,
          relatedId: data.relatedId || null,
          relatedType: data.relatedType || null,
          counterparty: data.counterparty || null,
          notes: data.notes || null,
          attachmentUrl: data.attachmentUrl || null,
          status: data.status || "completed",
          createdById: data.createdById || null,
        },
      });

      // 更新账户余额
      if (data.type === "income") {
        // 收入增加账户余额
        await tx.financialAccount.update({
          where: { id: data.accountId },
          data: {
            currentBalance: {
              increment: data.amount,
            },
          },
        });
      } else if (data.type === "expense") {
        // 支出减少账户余额
        await tx.financialAccount.update({
          where: { id: data.accountId },
          data: {
            currentBalance: {
              decrement: data.amount,
            },
          },
        });
      } else if (data.type === "transfer") {
        // 转账类型需要处理目标账户
        if (!data.relatedId) {
          throw new Error("转账交易必须指定目标账户");
        }

        // 减少源账户余额
        await tx.financialAccount.update({
          where: { id: data.accountId },
          data: {
            currentBalance: {
              decrement: data.amount,
            },
          },
        });

        // 增加目标账户余额
        await tx.financialAccount.update({
          where: { id: data.relatedId },
          data: {
            currentBalance: {
              increment: data.amount,
            },
          },
        });
      }

      return transaction;
    });

    revalidatePath("/finance/transactions");
    return result;
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-transactions");
    throw appError;
  }
}

/**
 * 更新财务交易记录
 *
 * @param id 交易记录ID
 * @param data 交易记录更新数据
 * @returns 更新后的交易记录
 */
export async function updateFinancialTransaction(id: number, data: UpdateFinancialTransactionInput): Promise<PrismaFinancialTransaction> {
  try {
    // 检查交易记录是否存在
    const existingTransaction = await prisma.financialTransaction.findUnique({
      where: { id },
      include: {
        account: true,
      },
    });

    if (!existingTransaction) {
      throw new Error("交易记录不存在");
    }

    // 如果更新了账户，检查新账户是否存在
    let newAccount = existingTransaction.account;
    if (data.accountId && data.accountId !== existingTransaction.accountId) {
      newAccount = await prisma.financialAccount.findUnique({
        where: { id: data.accountId },
      });

      if (!newAccount) {
        throw new Error("资金账户不存在");
      }
    }

    // 如果更新了分类，检查新分类是否存在
    if (data.categoryId && data.categoryId !== existingTransaction.categoryId) {
      const category = await prisma.financialCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new Error("收支分类不存在");
      }

      // 检查分类类型是否与交易类型匹配
      const transactionType = data.type || existingTransaction.type;
      if ((transactionType === "income" && category.type !== "income") ||
          (transactionType === "expense" && category.type !== "expense")) {
        throw new Error("收支分类类型与交易类型不匹配");
      }
    }

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 计算金额变化
      const amountChange = data.amount !== undefined ? data.amount - existingTransaction.amount : 0;
      const typeChanged = data.type !== undefined && data.type !== existingTransaction.type;
      const accountChanged = data.accountId !== undefined && data.accountId !== existingTransaction.accountId;

      // 如果金额、类型或账户发生变化，需要更新账户余额
      if (amountChange !== 0 || typeChanged || accountChanged) {
        // 恢复原账户余额
        if (existingTransaction.type === "income") {
          await tx.financialAccount.update({
            where: { id: existingTransaction.accountId },
            data: {
              currentBalance: {
                decrement: existingTransaction.amount,
              },
            },
          });
        } else if (existingTransaction.type === "expense") {
          await tx.financialAccount.update({
            where: { id: existingTransaction.accountId },
            data: {
              currentBalance: {
                increment: existingTransaction.amount,
              },
            },
          });
        } else if (existingTransaction.type === "transfer" && existingTransaction.relatedId) {
          // 恢复源账户余额
          await tx.financialAccount.update({
            where: { id: existingTransaction.accountId },
            data: {
              currentBalance: {
                increment: existingTransaction.amount,
              },
            },
          });

          // 恢复目标账户余额
          await tx.financialAccount.update({
            where: { id: existingTransaction.relatedId },
            data: {
              currentBalance: {
                decrement: existingTransaction.amount,
              },
            },
          });
        }

        // 应用新的账户余额变化
        const newType = data.type || existingTransaction.type;
        const newAmount = data.amount !== undefined ? data.amount : existingTransaction.amount;
        const newAccountId = data.accountId || existingTransaction.accountId;
        const newRelatedId = data.relatedId !== undefined ? data.relatedId : existingTransaction.relatedId;

        if (newType === "income") {
          await tx.financialAccount.update({
            where: { id: newAccountId },
            data: {
              currentBalance: {
                increment: newAmount,
              },
            },
          });
        } else if (newType === "expense") {
          await tx.financialAccount.update({
            where: { id: newAccountId },
            data: {
              currentBalance: {
                decrement: newAmount,
              },
            },
          });
        } else if (newType === "transfer" && newRelatedId) {
          // 减少源账户余额
          await tx.financialAccount.update({
            where: { id: newAccountId },
            data: {
              currentBalance: {
                decrement: newAmount,
              },
            },
          });

          // 增加目标账户余额
          await tx.financialAccount.update({
            where: { id: newRelatedId },
            data: {
              currentBalance: {
                increment: newAmount,
              },
            },
          });
        }
      }

      // 更新交易记录
      const transaction = await tx.financialTransaction.update({
        where: { id },
        data: {
          transactionDate: data.transactionDate ? new Date(data.transactionDate) : undefined,
          amount: data.amount,
          type: data.type,
          accountId: data.accountId,
          categoryId: data.categoryId,
          paymentMethod: data.paymentMethod,
          relatedId: data.relatedId,
          relatedType: data.relatedType,
          counterparty: data.counterparty,
          notes: data.notes,
          attachmentUrl: data.attachmentUrl,
          status: data.status,
        },
        include: {
          account: true,
          category: true,
        },
      });

      return transaction;
    });

    revalidatePath("/finance/transactions");
    return result;
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-transactions");
    throw appError;
  }
}

/**
 * 删除财务交易记录
 *
 * @param id 交易记录ID
 * @returns 操作结果
 */
export async function deleteFinancialTransaction(id: number): Promise<{ success: boolean }> {
  try {
    // 检查交易记录是否存在
    const existingTransaction = await prisma.financialTransaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      throw new Error("交易记录不存在");
    }

    // 使用事务确保数据一致性
    await prisma.$transaction(async (tx) => {
      // 恢复账户余额
      if (existingTransaction.type === "income") {
        await tx.financialAccount.update({
          where: { id: existingTransaction.accountId },
          data: {
            currentBalance: {
              decrement: existingTransaction.amount,
            },
          },
        });
      } else if (existingTransaction.type === "expense") {
        await tx.financialAccount.update({
          where: { id: existingTransaction.accountId },
          data: {
            currentBalance: {
              increment: existingTransaction.amount,
            },
          },
        });
      } else if (existingTransaction.type === "transfer" && existingTransaction.relatedId) {
        // 恢复源账户余额
        await tx.financialAccount.update({
          where: { id: existingTransaction.accountId },
          data: {
            currentBalance: {
              increment: existingTransaction.amount,
            },
          },
        });

        // 恢复目标账户余额
        await tx.financialAccount.update({
          where: { id: existingTransaction.relatedId },
          data: {
            currentBalance: {
              decrement: existingTransaction.amount,
            },
          },
        });
      }

      // 删除交易记录
      await tx.financialTransaction.delete({
        where: { id },
      });
    });

    revalidatePath("/finance/transactions");
    return { success: true };
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-transactions");
    throw appError;
  }
}

/**
 * 获取账户余额列表
 *
 * @param includeInactive 是否包含非活跃账户
 * @returns 账户余额列表
 */
export async function getAccountBalances(includeInactive: boolean = false): Promise<any[]> {
  try {
    const whereClause = includeInactive ? {} : { isActive: true };

    const accounts = await prisma.financialAccount.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        accountType: true,
        initialBalance: true,
        currentBalance: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return accounts.map(account => ({
      id: account.id,
      name: account.name,
      accountType: account.accountType,
      initialBalance: account.initialBalance,
      currentBalance: account.currentBalance,
      transactionsCount: account._count.transactions,
    }));
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-accounts");
    throw appError;
  }
}

/**
 * 获取财务统计数据
 *
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 财务统计数据
 */
export async function getFinancialSummary(startDate: string, endDate: string): Promise<any> {
  try {
    if (!startDate || !endDate) {
      throw new Error("开始日期和结束日期为必填项");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // 获取收入和支出总额
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        transactionDate: {
          gte: start,
          lte: end,
        },
        type: {
          in: ["income", "expense"],
        },
      },
      include: {
        account: true,
        category: true,
      },
    });

    // 计算总收入和总支出
    const incomeTransactions = transactions.filter(t => t.type === "income");
    const expenseTransactions = transactions.filter(t => t.type === "expense");

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netAmount = totalIncome - totalExpense;

    // 按分类统计收入
    const incomeByCategory = [];
    const incomeCategoryMap = new Map();

    for (const t of incomeTransactions) {
      const categoryId = t.categoryId || 0;
      const categoryName = t.category?.name || "未分类";

      if (!incomeCategoryMap.has(categoryId)) {
        incomeCategoryMap.set(categoryId, {
          categoryId,
          categoryName,
          amount: 0,
        });
      }

      incomeCategoryMap.get(categoryId).amount += t.amount;
    }

    incomeCategoryMap.forEach(category => {
      incomeByCategory.push({
        ...category,
        percentage: totalIncome > 0 ? (category.amount / totalIncome) * 100 : 0,
      });
    });

    // 按分类统计支出
    const expenseByCategory = [];
    const expenseCategoryMap = new Map();

    for (const t of expenseTransactions) {
      const categoryId = t.categoryId || 0;
      const categoryName = t.category?.name || "未分类";

      if (!expenseCategoryMap.has(categoryId)) {
        expenseCategoryMap.set(categoryId, {
          categoryId,
          categoryName,
          amount: 0,
        });
      }

      expenseCategoryMap.get(categoryId).amount += t.amount;
    }

    expenseCategoryMap.forEach(category => {
      expenseByCategory.push({
        ...category,
        percentage: totalExpense > 0 ? (category.amount / totalExpense) * 100 : 0,
      });
    });

    // 按账户统计收入
    const incomeByAccount = [];
    const incomeAccountMap = new Map();

    for (const t of incomeTransactions) {
      const accountId = t.accountId;
      const accountName = t.account?.name || "未知账户";

      if (!incomeAccountMap.has(accountId)) {
        incomeAccountMap.set(accountId, {
          accountId,
          accountName,
          amount: 0,
        });
      }

      incomeAccountMap.get(accountId).amount += t.amount;
    }

    incomeAccountMap.forEach(account => {
      incomeByAccount.push({
        ...account,
        percentage: totalIncome > 0 ? (account.amount / totalIncome) * 100 : 0,
      });
    });

    // 按账户统计支出
    const expenseByAccount = [];
    const expenseAccountMap = new Map();

    for (const t of expenseTransactions) {
      const accountId = t.accountId;
      const accountName = t.account?.name || "未知账户";

      if (!expenseAccountMap.has(accountId)) {
        expenseAccountMap.set(accountId, {
          accountId,
          accountName,
          amount: 0,
        });
      }

      expenseAccountMap.get(accountId).amount += t.amount;
    }

    expenseAccountMap.forEach(account => {
      expenseByAccount.push({
        ...account,
        percentage: totalExpense > 0 ? (account.amount / totalExpense) * 100 : 0,
      });
    });

    // 按日期统计交易
    const dailyTransactions = [];
    const dateMap = new Map();

    // 创建日期范围内的所有日期
    const dateRange = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateRange.push(dateStr);
      dateMap.set(dateStr, {
        date: dateStr,
        income: 0,
        expense: 0,
        net: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 统计每日收支
    for (const t of transactions) {
      const dateStr = t.transactionDate.toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
        const dailyData = dateMap.get(dateStr);
        if (t.type === "income") {
          dailyData.income += t.amount;
        } else if (t.type === "expense") {
          dailyData.expense += t.amount;
        }
        dailyData.net = dailyData.income - dailyData.expense;
      }
    }

    // 转换为数组
    dateRange.forEach(dateStr => {
      dailyTransactions.push(dateMap.get(dateStr));
    });

    return {
      totalIncome,
      totalExpense,
      netAmount,
      incomeByCategory,
      expenseByCategory,
      incomeByAccount,
      expenseByAccount,
      dailyTransactions,
    };
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-summary");
    throw appError;
  }
}

/**
 * 初始化系统预设的收支分类
 *
 * 创建系统预设的收支分类，用于初始化系统
 *
 * @returns 创建的分类列表
 */
export async function initializeFinancialCategories(): Promise<PrismaFinancialCategory[]> {
  try {
    // 检查是否已存在系统预设分类
    const existingCategories = await prisma.financialCategory.findMany({
      where: {
        isSystem: true,
      },
    });

    if (existingCategories.length > 0) {
      return existingCategories;
    }

    // 系统预设的收入分类
    const incomeCategories = [
      { name: "销售收入", code: "income-sales", type: "income", description: "POS销售、订单销售、定制作品" },
      { name: "渠道销售收入", code: "income-channel", type: "income", description: "渠道销售收入" },
      { name: "手作团建收入", code: "income-workshop", type: "income", description: "手作团建收入" },
      { name: "咖啡店销售收入", code: "income-coffee", type: "income", description: "咖啡店销售收入" },
      { name: "渠道押金收入", code: "income-deposit", type: "income", description: "渠道押金收入" },
      { name: "其他收入", code: "income-other", type: "income", description: "其他收入" },
    ];

    // 系统预设的支出分类
    const expenseCategories = [
      { name: "采购付款", code: "expense-purchase", type: "expense", description: "原材料、成品采购" },
      { name: "工资支出", code: "expense-salary", type: "expense", description: "员工工资支出" },
      { name: "渠道押金退还", code: "expense-deposit-refund", type: "expense", description: "渠道押金退还" },
      { name: "运费支出", code: "expense-shipping", type: "expense", description: "运费支出" },
      { name: "加工费支出", code: "expense-processing", type: "expense", description: "外部加工费" },
      { name: "咖啡店采购支出", code: "expense-coffee", type: "expense", description: "咖啡店采购支出" },
      { name: "其他支出", code: "expense-other", type: "expense", description: "其他支出" },
    ];

    // 创建所有分类
    const categories = [];

    // 创建收入分类
    for (const category of incomeCategories) {
      const newCategory = await prisma.financialCategory.create({
        data: {
          name: category.name,
          type: category.type,
          code: category.code,
          description: category.description,
          isSystem: true,
          isActive: true,
        },
      });
      categories.push(newCategory);
    }

    // 创建支出分类
    for (const category of expenseCategories) {
      const newCategory = await prisma.financialCategory.create({
        data: {
          name: category.name,
          type: category.type,
          code: category.code,
          description: category.description,
          isSystem: true,
          isActive: true,
        },
      });
      categories.push(newCategory);
    }

    return categories;
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-categories");
    throw appError;
  }
}

/**
 * 自动创建财务交易记录（从其他模块）
 *
 * @param data 交易记录创建数据
 * @returns 创建的交易记录
 */
export async function autoCreateFinancialTransaction(data: CreateFinancialTransactionInput): Promise<PrismaFinancialTransaction> {
  try {
    // 验证必填字段
    if (!data.transactionDate) {
      throw new Error("交易日期为必填项");
    }

    if (data.amount === undefined || data.amount === null) {
      throw new Error("交易金额为必填项");
    }

    if (!data.type) {
      throw new Error("交易类型为必填项");
    }

    if (!data.accountId) {
      throw new Error("资金账户为必填项");
    }

    if (!data.relatedType) {
      throw new Error("关联业务类型为必填项");
    }

    if (!data.relatedId) {
      throw new Error("关联业务ID为必填项");
    }

    // 检查账户是否存在
    const account = await prisma.financialAccount.findUnique({
      where: { id: data.accountId },
    });

    if (!account) {
      throw new Error("资金账户不存在");
    }

    // 检查是否已存在相同关联业务的交易记录
    const existingTransaction = await prisma.financialTransaction.findFirst({
      where: {
        relatedType: data.relatedType,
        relatedId: data.relatedId,
      },
    });

    if (existingTransaction) {
      // 如果已存在，则返回已存在的交易记录
      return existingTransaction;
    }

    // 如果未指定分类，根据关联业务类型自动选择分类
    if (!data.categoryId) {
      let categoryCode = "";

      switch (data.relatedType) {
        case "pos_sale":
        case "order":
          categoryCode = "income-sales";
          break;
        case "channel_sale":
          categoryCode = "income-channel";
          break;
        case "workshop":
          categoryCode = "income-workshop";
          break;
        case "coffee_sale":
          categoryCode = "income-coffee";
          break;
        case "channel_deposit":
          categoryCode = data.type === "income" ? "income-deposit" : "expense-deposit-refund";
          break;
        case "purchase":
          categoryCode = "expense-purchase";
          break;
        case "salary":
          categoryCode = "expense-salary";
          break;
        default:
          categoryCode = data.type === "income" ? "income-other" : "expense-other";
      }

      // 查找对应的分类
      const category = await prisma.financialCategory.findFirst({
        where: {
          code: categoryCode,
        },
      });

      if (category) {
        data.categoryId = category.id;
      }
    }

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 创建交易记录
      const transaction = await tx.financialTransaction.create({
        data: {
          transactionDate: new Date(data.transactionDate),
          amount: data.amount,
          type: data.type,
          accountId: data.accountId,
          categoryId: data.categoryId || null,
          paymentMethod: data.paymentMethod || null,
          relatedId: data.relatedId || null,
          relatedType: data.relatedType || null,
          counterparty: data.counterparty || null,
          notes: data.notes || null,
          attachmentUrl: data.attachmentUrl || null,
          status: data.status || "completed",
          createdById: data.createdById || null,
        },
      });

      // 更新账户余额
      if (data.type === "income") {
        // 收入增加账户余额
        await tx.financialAccount.update({
          where: { id: data.accountId },
          data: {
            currentBalance: {
              increment: data.amount,
            },
          },
        });
      } else if (data.type === "expense") {
        // 支出减少账户余额
        await tx.financialAccount.update({
          where: { id: data.accountId },
          data: {
            currentBalance: {
              decrement: data.amount,
            },
          },
        });
      }

      return transaction;
    });

    return result;
  } catch (error) {
    const appError = await ErrorUtils.handleError(error, "finance-transactions");
    throw appError;
  }
}