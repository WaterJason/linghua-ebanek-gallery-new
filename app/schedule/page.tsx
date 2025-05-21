import { getEmployees } from "@/lib/actions/employee-actions"
import { SchedulePage } from "@/components/schedule-page"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "排班管理 | 聆花掐丝珐琅馆",
  description: "管理员工排班和出勤记录",
}

export default async function SchedulePageRoute() {
  // 获取所有在职员工
  const employees = await getEmployees()
  const activeEmployees = employees.filter((employee) => employee.status === "active")

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">排班管理</h1>
      </div>

      <SchedulePage employees={activeEmployees} />
    </div>
  )
}
