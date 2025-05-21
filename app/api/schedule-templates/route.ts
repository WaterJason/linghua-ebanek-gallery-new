import { NextResponse } from "next/server"
import { getScheduleTemplates, createScheduleTemplate } from "@/lib/actions/schedule-actions";

export async function GET() {
  try {
    const templates = await getScheduleTemplates()
    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error fetching schedule templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedule templates" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const template = await createScheduleTemplate(data)
    return NextResponse.json(template)
  } catch (error) {
    console.error("Error creating schedule template:", error)
    return NextResponse.json(
      { error: "Failed to create schedule template" },
      { status: 500 }
    )
  }
}
