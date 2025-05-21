import { NextResponse } from "next/server"
import { createBatchSchedules } from "@/lib/actions/schedule-actions";

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Invalid data format. Expected non-empty array of schedule requests." },
        { status: 400 }
      )
    }
    
    const schedules = await createBatchSchedules(data)
    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Error creating batch schedules:", error)
    return NextResponse.json(
      { error: "Failed to create batch schedules" },
      { status: 500 }
    )
  }
}
