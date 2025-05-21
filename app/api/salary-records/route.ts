import { NextResponse } from "next/server"
import { getSalaryRecords, createSalaryRecord } from "@/lib/actions/employee-actions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId') ? parseInt(searchParams.get('employeeId')) : undefined
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')) : undefined
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')) : undefined
    
    const salaryRecords = await getSalaryRecords(employeeId, year, month)
    return NextResponse.json(salaryRecords)
  } catch (error) {
    console.error("Error fetching salary records:", error)
    return NextResponse.json(
      { error: "Failed to fetch salary records" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const salaryRecord = await createSalaryRecord(data)
    return NextResponse.json(salaryRecord)
  } catch (error) {
    console.error("Error creating salary record:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create salary record" },
      { status: error.statusCode || 500 }
    )
  }
}
