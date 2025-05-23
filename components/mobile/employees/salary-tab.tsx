"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SalaryTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">工资管理</h2>
        <Button size="sm">
          <Icons.plus className="h-4 w-4 mr-2" />
          新建工资单
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
          <Icons.download className="h-4 w-4 mr-2" />
          导出
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
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">销售部</Badge>
          </div>
          
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>基本工资</span>
              <span>{formatCurrency(8000)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>排班工资</span>
              <span>{formatCurrency(2000)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>销售提成</span>
              <span className="text-green-600">+{formatCurrency(3500)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>合计</span>
              <span>{formatCurrency(13500)}</span>
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
            <Badge className="bg-green-100 text-green-800 border-green-200">采购部</Badge>
          </div>
          
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>基本工资</span>
              <span>{formatCurrency(6000)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>排班工资</span>
              <span>{formatCurrency(1800)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>绩效奖金</span>
              <span className="text-green-600">+{formatCurrency(1200)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>合计</span>
              <span>{formatCurrency(9000)}</span>
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
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">生产部</Badge>
          </div>
          
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>基本工资</span>
              <span>{formatCurrency(7000)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>排班工资</span>
              <span>{formatCurrency(1400)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>生产奖金</span>
              <span className="text-green-600">+{formatCurrency(2000)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>合计</span>
              <span>{formatCurrency(10400)}</span>
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
