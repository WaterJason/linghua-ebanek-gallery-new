import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // 确保params是已解析的
    const { id: idParam } = params || {}
    const id = Number.parseInt(idParam)

    const employee = await prisma.employee.findUnique({
      where: { id },
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error("Error fetching employee:", error)
    return NextResponse.json({ error: "Failed to fetch employee" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // 确保params是已解析的
    const { id: idParam } = params || {}
    const id = Number.parseInt(idParam)
    const data = await request.json()

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name: data.name,
        position: data.position,
        phone: data.phone,
        email: data.email,
        dailySalary: Number.parseFloat(data.dailySalary),
        status: data.status,
      },
    })

    return NextResponse.json(employee)
  } catch (error) {
    console.error("Error updating employee:", error)
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // 确保params是已解析的
    const { id: idParam } = params || {}
    const id = Number.parseInt(idParam)

    await prisma.employee.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting employee:", error)
    return NextResponse.json({ error: "Failed to delete employee" }, { status: 500 })
  }
}
