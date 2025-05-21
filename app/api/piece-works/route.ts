import { NextResponse } from "next/server"
import { getPieceWorks, createPieceWork } from "@/lib/actions/piece-work-actions"

export async function GET() {
  try {
    const pieceWorks = await getPieceWorks()
    return NextResponse.json(pieceWorks)
  } catch (error) {
    console.error("Error fetching piece works:", error)
    return NextResponse.json({ error: "Failed to fetch piece works" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const result = await createPieceWork(data)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error creating piece work:", error)
    return NextResponse.json({ error: "Failed to create piece work" }, { status: 500 })
  }
}
