import { NextResponse } from "next/server"
import { getPieceWorkItems, createPieceWorkItem } from "@/lib/actions/workshop-actions"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    const pieceWorkItems = await getPieceWorkItems(type || undefined)

    return NextResponse.json(pieceWorkItems)
  } catch (error) {
    console.error("Error fetching piece work items:", error)
    return NextResponse.json({ error: "Failed to fetch piece work items" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const pieceWorkItem = await createPieceWorkItem(data)

    return NextResponse.json(pieceWorkItem)
  } catch (error) {
    console.error("Error creating piece work item:", error)
    return NextResponse.json({ error: "Failed to create piece work item" }, { status: 500 })
  }
}
