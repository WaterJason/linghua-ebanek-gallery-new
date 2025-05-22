"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "@/components/ui/use-toast"

export default function NewTodoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(event.currentTarget)
    
    try {
      // 这里应该调用API创建待办事项
      // 目前只是模拟成功
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "待办事项已创建",
        description: "新的待办事项已成功添加",
      })
      
      router.push("/todos")
    } catch (error) {
      toast({
        title: "创建失败",
        description: "无法创建待办事项，请稍后再试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <DashboardShell>
      <DashboardHeader
        heading="添加待办事项"
        text="创建新的待办任务"
      />
      <Card>
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle>待办事项信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input id="title" name="title" placeholder="输入待办事项标题" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea id="description" name="description" placeholder="输入详细描述" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">类型</Label>
                <Select name="type" defaultValue="other">
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order">订单</SelectItem>
                    <SelectItem value="inventory">库存</SelectItem>
                    <SelectItem value="schedule">排班</SelectItem>
                    <SelectItem value="workshop">团建</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">优先级</Label>
                <Select name="priority" defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue placeholder="选择优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">紧急</SelectItem>
                    <SelectItem value="medium">中等</SelectItem>
                    <SelectItem value="low">普通</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">截止日期</Label>
              <DatePicker />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "创建中..." : "创建待办事项"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </DashboardShell>
  )
}