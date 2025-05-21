import { NextResponse } from "next/server"
import { deleteScheduleTemplate } from "@/lib/actions/schedule-actions";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      )
    }

    const result = await deleteScheduleTemplate(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error deleting schedule template:", error)
    return NextResponse.json(
      { error: "Failed to delete schedule template" },
      { status: 500 }
    )
  }
}
