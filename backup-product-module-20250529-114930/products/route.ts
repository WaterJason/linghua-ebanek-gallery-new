import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        // 过滤掉所有占位产品 - 关键修复
        type: {
          notIn: ["category_placeholder", "unit_placeholder", "material_placeholder"]
        }
      },
      orderBy: {
        id: "asc",
      },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // 解析请求数据
    let data;
    try {
      data = await request.json();
      console.log("Creating product with data:", data);
    } catch (parseError) {
      console.error("Error parsing request data:", parseError);
      return NextResponse.json({
        error: "Invalid request data format",
        details: "Could not parse JSON data"
      }, { status: 400 });
    }

    // 验证必填字段
    if (!data.name || data.name.trim() === "") {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    // 验证价格
    let price = 0;
    try {
      price = Number.parseFloat(data.price);
      if (isNaN(price) || price <= 0) {
        return NextResponse.json({ error: "Valid product price is required" }, { status: 400 });
      }
    } catch (priceError) {
      return NextResponse.json({ error: "Invalid price format" }, { status: 400 });
    }

    // 验证佣金率
    let commissionRate = 0;
    try {
      commissionRate = Number.parseFloat(data.commissionRate || "0");
      if (isNaN(commissionRate)) commissionRate = 0;
    } catch (rateError) {
      commissionRate = 0;
    }

    // 验证成本
    let cost = null;
    if (data.cost) {
      try {
        cost = Number.parseFloat(data.cost);
        if (isNaN(cost)) cost = null;
      } catch (costError) {
        cost = null;
      }
    }

    // 准备产品数据
    const productData = {
      name: data.name.trim(),
      price: price,
      commissionRate: commissionRate,
      type: data.type || "product",
      imageUrl: data.imageUrl || null,
      description: data.description || null,
      categoryId: data.categoryId === "uncategorized" ? null : data.categoryId ? parseInt(data.categoryId) : null,
      cost: cost,
      sku: data.sku || null,
      barcode: data.barcode || null,
    };

    try {
      // 创建产品
      const product = await prisma.product.create({
        data: productData,
      });

      console.log("Product created successfully:", product);
      return NextResponse.json(product);
    } catch (dbError) {
      console.error("Database error creating product:", dbError);
      return NextResponse.json({
        error: "Database error creating product",
        details: dbError.message || "Unknown database error"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({
      error: "Failed to create product",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    console.log("Updating product with data:", data)
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // 验证必填字段
    if (!updateData.name || updateData.name.trim() === "") {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    }

    if (!updateData.price || isNaN(Number(updateData.price)) || Number(updateData.price) <= 0) {
      return NextResponse.json({ error: "Valid product price is required" }, { status: 400 })
    }

    try {
      const product = await prisma.product.update({
        where: { id: Number(id) },
        data: {
          name: updateData.name,
          price: Number.parseFloat(updateData.price || "0"),
          commissionRate: Number.parseFloat(updateData.commissionRate || "0"),
          type: updateData.type || "product",
          imageUrl: updateData.imageUrl,
          description: updateData.description,
          categoryId: updateData.categoryId === "uncategorized" ? null : updateData.categoryId ? parseInt(updateData.categoryId) : null,
          cost: updateData.cost ? Number.parseFloat(updateData.cost) : null,
          sku: updateData.sku || null,
          barcode: updateData.barcode || null,
        },
      })

      console.log("Product updated successfully:", product)
      return NextResponse.json(product)
    } catch (dbError) {
      console.error("Database error updating product:", dbError)
      return NextResponse.json({
        error: "Database error updating product",
        details: dbError.message || "Unknown database error"
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({
      error: "Failed to update product",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
