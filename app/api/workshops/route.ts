import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET() {
  try {
    const workshops = await prisma.workshop.findMany({
      include: {
        employee: true,
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(workshops)
  } catch (error) {
    console.error("Error fetching workshops:", error)
    return NextResponse.json({ error: "Failed to fetch workshops" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // 验证必需字段
    if (!data.name) {
      return NextResponse.json({ error: "Workshop name is required" }, { status: 400 })
    }
    if (!data.startTime) {
      return NextResponse.json({ error: "Start time is required" }, { status: 400 })
    }
    if (!data.endTime) {
      return NextResponse.json({ error: "End time is required" }, { status: 400 })
    }

    const workshop = await prisma.workshop.create({
      data: {
        name: data.name,
        employeeId: Number.parseInt(data.employee),
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        role: data.role,
        locationType: data.locationType,
        location: data.location,
        participants: Number.parseInt(data.participants),
        duration: Number.parseFloat(data.duration),
        notes: data.notes,
      },
    })

    return NextResponse.json(workshop)
  } catch (error) {
    console.error("Error creating workshop:", error)
    return NextResponse.json({ error: "Failed to create workshop" }, { status: 500 })
  }
}
