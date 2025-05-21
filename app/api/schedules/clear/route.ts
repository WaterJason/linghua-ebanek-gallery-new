import { NextResponse } from "next/server"
import { clearAllSchedules } from "@/lib/actions/schedule-actions";

export async function DELETE() {
  try {
    const result = await clearAllSchedules()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error clearing schedules:", error)
    return NextResponse.json(
      { error: "Failed to clear schedules" },
      { status: 500 }
    )
  }
}
