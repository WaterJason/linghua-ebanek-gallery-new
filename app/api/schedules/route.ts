import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let whereClause = {}

    if (startDate && endDate) {
      whereClause = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }
    }

    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: {
        employee: true,
      },
      orderBy: {
        date: "asc",
      },
    })

    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Error fetching schedules:", error)
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const schedule = await prisma.schedule.create({
      data: {
        employeeId: Number.parseInt(data.employeeId),
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
      },
    })

    return NextResponse.json(schedule)
  } catch (error) {
    console.error("Error creating schedule:", error)
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 })
  }
}
