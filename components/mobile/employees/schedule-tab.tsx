"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"

export function ScheduleTab() {
  // 获取当前周的日期
  const getCurrentWeekDates = () => {
    const today = new Date()
    const currentDay = today.getDay() // 0 是周日，1 是周一，以此类推
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1) // 调整到周一
    
    return Array(7).fill(0).map((_, i) => {
      const day = new Date(today.setDate(diff + i))
      return {
        date: day.getDate(),
        day: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
        isToday: new Date().getDate() === day.getDate()
      }
    })
  }

  const weekDates = getCurrentWeekDates()

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">排班管理</h2>
        <Button size="sm">
          <Icons.plus className="h-4 w-4 mr-2" />
          新建排班
        </Button>
      </div>
      
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm">
          <Icons.chevronLeft className="h-4 w-4 mr-2" />
          上一周
        </Button>
        <span className="text-sm font-medium">2025年5月</span>
        <Button variant="outline" size="sm">
          下一周
          <Icons.chevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDates.map((date, index) => (
          <div key={index} className={`p-2 text-xs ${date.isToday ? 'bg-primary text-primary-foreground rounded-md' : ''}`}>
            <div>{date.day}</div>
            <div className="font-bold">{date.date}</div>
          </div>
        ))}
      </div>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3 overflow-hidden">
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="张三" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-medium">张三</p>
                <p className="text-xs text-muted-foreground">销售经理</p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">销售部</Badge>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mt-3">
            {Array(7).fill(0).map((_, index) => (
              <div key={index} className={`h-6 rounded-md flex items-center justify-center text-xs ${index < 5 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                {index < 5 ? '上班' : '休息'}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3 overflow-hidden">
                <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="李四" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-medium">李四</p>
                <p className="text-xs text-muted-foreground">采购专员</p>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200">采购部</Badge>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mt-3">
            {Array(7).fill(0).map((_, index) => (
              <div key={index} className={`h-6 rounded-md flex items-center justify-center text-xs ${index !== 0 && index !== 6 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                {index !== 0 && index !== 6 ? '上班' : '休息'}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3 overflow-hidden">
                <img src="https://randomuser.me/api/portraits/men/67.jpg" alt="王五" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-medium">王五</p>
                <p className="text-xs text-muted-foreground">生产主管</p>
              </div>
            </div>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">生产部</Badge>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mt-3">
            {Array(7).fill(0).map((_, index) => (
              <div key={index} className={`h-6 rounded-md flex items-center justify-center text-xs ${index % 2 === 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}`}>
                {index % 2 === 0 ? '上班' : '休息'}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
