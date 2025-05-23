"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PerformanceTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">绩效管理</h2>
        <Button size="sm">
          <Icons.plus className="h-4 w-4 mr-2" />
          新建评估
        </Button>
      </div>
      
      <div className="flex justify-between items-center">
        <Select defaultValue="202505">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择月份" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="202505">2025年5月</SelectItem>
            <SelectItem value="202504">2025年4月</SelectItem>
            <SelectItem value="202503">2025年3月</SelectItem>
            <SelectItem value="202502">2025年2月</SelectItem>
            <SelectItem value="202501">2025年1月</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="sm">
          <Icons.filter className="h-4 w-4 mr-2" />
          筛选
        </Button>
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
            <Badge className="bg-green-100 text-green-800 border-green-200">优秀</Badge>
          </div>
          
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>销售目标完成率</span>
              <span className="text-green-600">120%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>客户满意度</span>
              <span className="text-green-600">4.8/5.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>团队管理</span>
              <span className="text-green-600">4.5/5.0</span>
            </div>
          </div>
          
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline">查看详情</Button>
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
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">良好</Badge>
          </div>
          
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>采购成本控制</span>
              <span className="text-blue-600">95%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>供应商管理</span>
              <span className="text-blue-600">4.2/5.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>采购效率</span>
              <span className="text-blue-600">4.0/5.0</span>
            </div>
          </div>
          
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline">查看详情</Button>
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
            <Badge className="bg-green-100 text-green-800 border-green-200">优秀</Badge>
          </div>
          
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>生产效率</span>
              <span className="text-green-600">115%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>产品质量</span>
              <span className="text-green-600">4.7/5.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>团队管理</span>
              <span className="text-green-600">4.6/5.0</span>
            </div>
          </div>
          
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline">查看详情</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
