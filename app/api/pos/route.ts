import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

// 生成订单编号
function generateOrderNumber() {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  return `POS${year}${month}${day}${random}`
}

// 创建POS销售
export async function POST(request: Request) {
  try {
    // 检查用户是否已登录且有权限
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "未授权" }, { status: 403 })
    }

    const data = await request.json()

    // 验证必填字段
    if (!data.employeeId || !data.items || data.items.length === 0 || !data.warehouseId) {
      return NextResponse.json({ error: "员工、商品和仓库为必填项" }, { status: 400 })
    }

    // 生成订单编号
    const orderNumber = generateOrderNumber()

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 创建或获取客户
      let customerId = data.customerId

      if (!customerId && data.customerInfo) {
        // 如果提供了客户信息但没有客户ID，则创建新客户或查找现有客户
        if (data.customerInfo.phone) {
          // 查找是否有相同手机号的客户
          const existingCustomer = await tx.customer.findFirst({
            where: {
              phone: data.customerInfo.phone,
            },
          })

          if (existingCustomer) {
            customerId = existingCustomer.id
          } else {
            // 创建新客户
            const newCustomer = await tx.customer.create({
              data: {
                name: data.customerInfo.name || "散客",
                phone: data.customerInfo.phone,
                email: data.customerInfo.email || null,
                address: data.customerInfo.address || null,
                type: "individual",
              },
            })
            customerId = newCustomer.id
          }
        } else {
          // 如果没有提供手机号，创建匿名客户
          const anonymousCustomer = await tx.customer.create({
            data: {
              name: data.customerInfo.name || "散客",
              type: "individual",
            },
          })
          customerId = anonymousCustomer.id
        }
      } else if (!customerId) {
        // 如果没有提供客户ID和客户信息，创建匿名客户
        const anonymousCustomer = await tx.customer.create({
          data: {
            name: "散客",
            type: "individual",
          },
        })
        customerId = anonymousCustomer.id
      }

      // 计算总金额
      const totalAmount = data.items.reduce((sum, item) => {
        return sum + (Number(item.price) * Number(item.quantity) - Number(item.discount || 0))
      }, 0)

      // 创建订单
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: Number(customerId),
          employeeId: Number(data.employeeId),
          orderDate: new Date(),
          status: "completed", // POS销售直接完成
          totalAmount,
          paidAmount: totalAmount, // POS销售直接支付全额
          paymentStatus: "paid", // POS销售直接标记为已支付
          paymentMethod: data.paymentMethod || "cash",
          notes: data.notes,
        },
      })

      // 创建订单项并减少库存
      for (const item of data.items) {
        // 创建订单项
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
            discount: Number(item.discount || 0),
            notes: item.notes,
          },
        })

        // 查找库存
        const inventory = await tx.inventoryItem.findFirst({
          where: {
            warehouseId: Number(data.warehouseId),
            productId: Number(item.productId),
          },
        })

        if (inventory) {
          // 检查库存是否足够
          if (inventory.quantity < Number(item.quantity)) {
            throw new Error(`产品 ${item.productId} 库存不足`)
          }

          // 减少库存
          await tx.inventoryItem.update({
            where: { id: inventory.id },
            data: {
              quantity: inventory.quantity - Number(item.quantity),
            },
          })

          // 记录库存交易
          await tx.inventoryTransaction.create({
            data: {
              type: "out",
              sourceWarehouseId: Number(data.warehouseId),
              productId: Number(item.productId),
              quantity: Number(item.quantity),
              notes: `POS销售: ${orderNumber}`,
              referenceId: order.id,
              referenceType: "pos",
            },
          })
        } else {
          throw new Error(`产品 ${item.productId} 在仓库 ${data.warehouseId} 中没有库存记录`)
        }
      }

      // 创建销售记录（兼容现有系统）
      const gallerySale = await tx.gallerySale.create({
        data: {
          employeeId: Number(data.employeeId),
          date: new Date(),
          totalAmount,
          notes: `POS销售: ${orderNumber}`,
        },
      })

      // 创建销售项目明细
      for (const item of data.items) {
        await tx.salesItem.create({
          data: {
            gallerySaleId: gallerySale.id,
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
          },
        })
      }

      return {
        order,
        gallerySale,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("POS销售失败:", error)
    return NextResponse.json({ error: error.message || "POS销售失败" }, { status: 500 })
  }
}
