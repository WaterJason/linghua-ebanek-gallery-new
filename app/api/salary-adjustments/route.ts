import { NextResponse } from "next/server"
import { getSalaryAdjustments, createSalaryAdjustment } from "@/lib/actions/employee-actions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId') ? parseInt(searchParams.get('employeeId')) : undefined
    
    const salaryAdjustments = await getSalaryAdjustments(employeeId)
    return NextResponse.json(salaryAdjustments)
  } catch (error) {
    console.error("Error fetching salary adjustments:", error)
    return NextResponse.json(
      { error: "Failed to fetch salary adjustments" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const salaryAdjustment = await createSalaryAdjustment(data)
    return NextResponse.json(salaryAdjustment)
  } catch (error) {
    console.error("Error creating salary adjustment:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create salary adjustment" },
      { status: error.statusCode || 500 }
    )
  }
}
