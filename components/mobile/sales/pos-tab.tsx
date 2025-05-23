"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { formatCurrency } from "@/lib/utils"

export function PosTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">POS销售</h2>
        <Button size="sm">
          <Icons.plus className="h-4 w-4 mr-2" />
          新建销售
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">最近POS销售</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <p className="font-medium">饰品销售</p>
                <p className="text-xs text-muted-foreground">今天 14:25</p>
              </div>
              <p className="font-semibold text-green-600">{formatCurrency(850)}</p>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <p className="font-medium">摆件销售</p>
                <p className="text-xs text-muted-foreground">今天 11:30</p>
              </div>
              <p className="font-semibold text-green-600">{formatCurrency(1200)}</p>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">工艺品销售</p>
                <p className="text-xs text-muted-foreground">昨天 16:45</p>
              </div>
              <p className="font-semibold text-green-600">{formatCurrency(2400)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Button className="w-full" size="lg">
        <Icons.store className="h-5 w-5 mr-2" />
        进入POS模式
      </Button>
    </div>
  )
}
