"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export function EmployeesTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">员工管理</h2>
        <Button size="sm">
          <Icons.plus className="h-4 w-4 mr-2" />
          添加员工
        </Button>
      </div>
      
      <div className="relative">
        <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input placeholder="搜索员工..." className="pl-9" />
      </div>
      
      <div className="flex space-x-2 overflow-x-auto py-1">
        <Button variant="outline" size="sm" className="whitespace-nowrap">
          全部部门
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap">
          销售部
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap">
          采购部
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap">
          生产部
        </Button>
        <Button variant="outline" size="sm" className="whitespace-nowrap">
          财务部
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mr-3 overflow-hidden">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="张三" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <p className="font-medium">张三</p>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">销售部</Badge>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>销售经理</span>
                <span className="text-blue-600">查看详情</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mr-3 overflow-hidden">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="李四" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <p className="font-medium">李四</p>
                <Badge className="bg-green-100 text-green-800 border-green-200">采购部</Badge>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>采购专员</span>
                <span className="text-blue-600">查看详情</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mr-3 overflow-hidden">
              <img src="https://randomuser.me/api/portraits/men/67.jpg" alt="王五" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <p className="font-medium">王五</p>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">生产部</Badge>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>生产主管</span>
                <span className="text-blue-600">查看详情</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mr-3 overflow-hidden">
              <img src="https://randomuser.me/api/portraits/women/17.jpg" alt="赵六" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <p className="font-medium">赵六</p>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">财务部</Badge>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>财务经理</span>
                <span className="text-blue-600">查看详情</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
