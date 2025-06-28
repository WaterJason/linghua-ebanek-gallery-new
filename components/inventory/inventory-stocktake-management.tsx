"use client"

import { useState } from "react"

  // 数据同步 - 自动刷新数据
  useEffect(() => {
    const handleDataRefresh = () => {
      // 触发数据重新获取
      if (typeof refetch === 'function') {
        refetch();
      }
    };
    
    // 监听存储变化
    window.addEventListener('storage', handleDataRefresh);
    
    return () => {
      window.removeEventListener('storage', handleDataRefresh);
    };
  }, []);
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  PlusIcon, 
  SearchIcon, 
  ClipboardListIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertTriangleIcon
} from "lucide-react"

export function InventoryStocktakeManagement() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月盘点</CardTitle>
            <ClipboardListIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">本月盘点次数</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进行中</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">正在进行的盘点</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">已完成盘点</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">差异项目</CardTitle>
            <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">发现差异的项目</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>库存盘点管理</CardTitle>
              <CardDescription>管理库存盘点计划和执行</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索盘点记录..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                新建盘点
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ClipboardListIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">暂无盘点记录</p>
            <p className="text-xs text-muted-foreground mt-2">点击"新建盘点"开始创建盘点计划</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
