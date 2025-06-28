"use client"

import { useState } from "react"
import { ModernPageContainer } from "@/components/modern-page-container"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InlineEdit, InlinePriceEdit, InlineInventoryEdit } from "@/components/ui/inline-edit"
import { useToast } from "@/components/ui/use-toast"

export default function TestInlineEditPage() {
  const { toast } = useToast()
  const [productData, setProductData] = useState({
    name: "测试产品",
    price: 99.99,
    inventory: 50,
    dimensions: "10x20x5cm",
    description: "这是一个测试产品"
  })

  // 模拟API更新
  const updateField = async (field: string, value: string | number): Promise<boolean> => {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟随机失败（10%概率）
      if (Math.random() < 0.1) {
        throw new Error("模拟网络错误")
      }

      // 更新本地状态
      setProductData(prev => ({ ...prev, [field]: value }))
      
      toast({
        title: "更新成功",
        description: `${field} 已更新为: ${value}`,
      })
      
      return true
    } catch (error) {
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      })
      return false
    }
  }

  return (
    <ModernPageContainer
      title="内联编辑测试"
      description="测试产品列表的内联编辑功能"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>产品信息内联编辑</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">产品名称</label>
                  <InlineEdit
                    value={productData.name}
                    onSave={(value) => updateField("name", value)}
                    placeholder="产品名称"
                    validator={(value) => {
                      if (typeof value === 'string' && value.trim().length < 2) {
                        return "产品名称至少需要2个字符"
                      }
                      return null
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">价格</label>
                  <InlinePriceEdit
                    value={productData.price}
                    onSave={(value) => updateField("price", value)}
                    displayClassName="font-medium text-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">库存</label>
                  <InlineInventoryEdit
                    value={productData.inventory}
                    onSave={(value) => updateField("inventory", value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">尺寸</label>
                  <InlineEdit
                    value={productData.dimensions}
                    onSave={(value) => updateField("dimensions", value)}
                    placeholder="长x宽x高"
                    allowEmpty={true}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">描述</label>
                  <InlineEdit
                    value={productData.description}
                    onSave={(value) => updateField("description", value)}
                    placeholder="产品描述"
                    allowEmpty={true}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-2">使用说明：</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 双击任意字段进入编辑模式</li>
                <li>• 按 Enter 键保存，按 Esc 键取消</li>
                <li>• 点击确认按钮保存，点击取消按钮放弃更改</li>
                <li>• 失去焦点时自动取消编辑（除非正在保存）</li>
                <li>• 有10%概率模拟网络错误用于测试错误处理</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>当前数据</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm">
              {JSON.stringify(productData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </ModernPageContainer>
  )
}
