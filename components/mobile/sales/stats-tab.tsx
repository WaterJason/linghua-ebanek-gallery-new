"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export function StatsTab() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">销售统计</h2>
      
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{formatCurrency(36450)}</div>
            <div className="text-sm text-muted-foreground">本月销售额</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">42</div>
            <div className="text-sm text-muted-foreground">本月订单数</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">销售趋势</h3>
          <div className="h-40 bg-muted/30 rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">图表加载中...</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">热销产品</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mr-3">
                  <img src="https://via.placeholder.com/40" alt="产品C" className="w-8 h-8 object-cover rounded" />
                </div>
                <p className="font-medium">产品C</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">120件</p>
                <p className="text-xs text-muted-foreground">占比32%</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mr-3">
                  <img src="https://via.placeholder.com/40" alt="产品D" className="w-8 h-8 object-cover rounded" />
                </div>
                <p className="font-medium">产品D</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">85件</p>
                <p className="text-xs text-muted-foreground">占比23%</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mr-3">
                  <img src="https://via.placeholder.com/40" alt="产品E" className="w-8 h-8 object-cover rounded" />
                </div>
                <p className="font-medium">产品E</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">42件</p>
                <p className="text-xs text-muted-foreground">占比11%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
