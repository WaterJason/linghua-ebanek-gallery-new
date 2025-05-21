import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid channel price ID" }, { status: 400 })
    }
    
    const channelPrice = await prisma.channelPrice.findUnique({
      where: { id },
      include: {
        channel: true,
        product: true,
      },
    })
    
    if (!channelPrice) {
      return NextResponse.json({ error: "Channel price not found" }, { status: 404 })
    }
    
    return NextResponse.json(channelPrice)
  } catch (error) {
    console.error("Error fetching channel price:", error)
    return NextResponse.json({ error: "Failed to fetch channel price" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const data = await request.json()
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid channel price ID" }, { status: 400 })
    }
    
    // 验证必填字段
    if (data.price === undefined) {
      return NextResponse.json(
        { error: "Price is required" },
        { status: 400 }
      )
    }
    
    // 检查渠道价格是否存在
    const existingPrice = await prisma.channelPrice.findUnique({
      where: { id },
    })
    
    if (!existingPrice) {
      return NextResponse.json({ error: "Channel price not found" }, { status: 404 })
    }
    
    const updatedChannelPrice = await prisma.channelPrice.update({
      where: { id },
      data: {
        price: parseFloat(data.price),
        isActive: data.isActive,
      },
      include: {
        channel: true,
        product: true,
      },
    })
    
    return NextResponse.json(updatedChannelPrice)
  } catch (error) {
    console.error("Error updating channel price:", error)
    return NextResponse.json({ error: "Failed to update channel price" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid channel price ID" }, { status: 400 })
    }
    
    // 检查渠道价格是否存在
    const existingPrice = await prisma.channelPrice.findUnique({
      where: { id },
    })
    
    if (!existingPrice) {
      return NextResponse.json({ error: "Channel price not found" }, { status: 404 })
    }
    
    // 删除渠道价格
    await prisma.channelPrice.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting channel price:", error)
    return NextResponse.json({ error: "Failed to delete channel price" }, { status: 500 })
  }
}
