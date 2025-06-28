"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { EmployeesTab } from "@/components/mobile/employees/employees-tab"
import { ScheduleTab } from "@/components/mobile/employees/schedule-tab"
import { SalaryTab } from "@/components/mobile/employees/salary-tab"
import { PerformanceTab } from "@/components/mobile/employees/performance-tab"

export function MobileEmployeesPage() {
  const [activeTab, setActiveTab] = useState("employees")

  return (
    <div className="space-y-4">
      <Tabs defaultValue="employees" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employees">员工</TabsTrigger>
          <TabsTrigger value="schedule">排班</TabsTrigger>
          <TabsTrigger value="salary">工资</TabsTrigger>
          <TabsTrigger value="performance">绩效</TabsTrigger>
        </TabsList>
        
        <TabsContent value="employees" className="mt-4">
          <EmployeesTab />
        </TabsContent>
        
        <TabsContent value="schedule" className="mt-4">
          <ScheduleTab />
        </TabsContent>
        
        <TabsContent value="salary" className="mt-4">
          <SalaryTab />
        </TabsContent>
        
        <TabsContent value="performance" className="mt-4">
          <PerformanceTab />
        </TabsContent>
      </Tabs>
      
      {/* 悬浮按钮 - 仅在员工和排班标签页显示 */}
      {(activeTab === "employees" || activeTab === "schedule") && (
        <Button
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <Icons.plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
