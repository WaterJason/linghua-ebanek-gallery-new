import { NextResponse } from "next/server"
import { getSalaryRecord, updateSalaryRecord, deleteSalaryRecord } from "@/lib/actions/employee-actions";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 确保params是已解析的
    const { id: idParam } = params || {}
    const id = parseInt(idParam)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      )
    }

    const salaryRecord = await getSalaryRecord(id)
    if (!salaryRecord) {
      return NextResponse.json(
        { error: "Salary record not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(salaryRecord)
  } catch (error) {
    console.error("Error fetching salary record:", error)
    return NextResponse.json(
      { error: "Failed to fetch salary record" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 确保params是已解析的
    const { id: idParam } = params || {}
    const id = parseInt(idParam)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      )
    }

    const data = await request.json()
    const salaryRecord = await updateSalaryRecord(id, data)
    return NextResponse.json(salaryRecord)
  } catch (error) {
    console.error("Error updating salary record:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update salary record" },
      { status: error.statusCode || 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 确保params是已解析的
    const { id: idParam } = params || {}
    const id = parseInt(idParam)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      )
    }

    const result = await deleteSalaryRecord(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error deleting salary record:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete salary record" },
      { status: error.statusCode || 500 }
    )
  }
}
