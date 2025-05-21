import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        id: "asc",
      },
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error("Error fetching employees:", error)
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        position: data.position,
        phone: data.phone,
        email: data.email,
        dailySalary: Number.parseFloat(data.dailySalary),
        status: data.status || "active",
      },
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error("Error creating employee:", error)
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 })
  }
}
