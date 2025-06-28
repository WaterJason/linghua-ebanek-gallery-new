"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SmartTooltip } from "@/components/ui/tooltip"
import { SmartInput } from "@/components/ui/smart-input"
import { SmartGuide, useSmartGuide } from "@/components/ui/smart-guide"
import { ModernPageContainer } from "@/components/modern-page-container"
import { useContextualHelp } from "@/hooks/use-contextual-help"
import { 
  HelpCircle, 
  Lightbulb, 
  Sparkles, 
  Target, 
  Search,
  Users,
  Package,
  DollarSign
} from "lucide-react"

export default function HumanizationDemoPage() {
  const [demoValue, setDemoValue] = useState("")
  const { isOpen: isGuideOpen, currentGuide, startGuide, closeGuide } = useSmartGuide()
  const { activeHelp, hideHelp, handlePageChange } = useContextualHelp('admin')

  // 演示数据
  const customerSuggestions = [
    { id: '1', value: '张三', label: '张三', category: '个人客户', frequency: 10 },
    { id: '2', value: '李四工艺坊', label: '李四工艺坊', category: '企业客户', frequency: 8 },
    { id: '3', value: '王五', label: '王五', category: '个人客户', frequency: 5 },
    { id: '4', value: '赵六珐琅店', label: '赵六珐琅店', category: '企业客户', frequency: 3 }
  ]

  const productSuggestions = [
    { id: '1', value: '祥云如意掐丝珐琅盘', label: '祥云如意掐丝珐琅盘', category: '珐琅盘', frequency: 15 },
    { id: '2', value: '莲花香炉', label: '莲花香炉', category: '香炉', frequency: 12 },
    { id: '3', value: '掐丝珐琅手镯', label: '掐丝珐琅手镯', category: '配饰', frequency: 20 },
    { id: '4', value: '凤凰纹珐琅瓶', label: '凤凰纹珐琅瓶', category: '花瓶', frequency: 8 }
  ]

  // 启动功能演示引导
  const startFeatureGuide = () => {
    const guideSteps = [
      {
        id: 'welcome',
        title: '欢迎体验人性化功能',
        content: '这里展示了聆花ERP系统的智能提示和上下文帮助功能，让操作更加便捷和智能。',
        target: '[data-demo-main]'
      },
      {
        id: 'smart-tooltips',
        title: '智能提示',
        content: '悬停在带有问号图标的元素上，可以看到详细的操作说明和建议。',
        target: '[data-demo-tooltips]'
      },
      {
        id: 'smart-input',
        title: '智能输入建议',
        content: '在输入框中输入内容时，系统会根据历史数据和使用频率提供智能建议。',
        target: '[data-demo-input]'
      },
      {
        id: 'contextual-help',
        title: '上下文帮助',
        content: '系统会根据您当前的操作和页面，主动提供相关的帮助信息。',
        target: '[data-demo-help]'
      }
    ]
    startGuide(guideSteps)
  }

  return (
    <TooltipProvider>
      <ModernPageContainer
        title="人性化功能演示"
        description="体验聆花ERP系统的智能提示、上下文帮助和操作引导功能"
        breadcrumbs={[
          { label: "首页", href: "/" },
          { label: "人性化功能演示" }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <SmartTooltip
              content="启动功能演示引导，了解各项人性化功能的使用方法"
              type="help"
              title="功能引导"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={startFeatureGuide}
                className="flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                功能引导
              </Button>
            </SmartTooltip>
          </div>
        }
      >
        <div data-demo-main className="space-y-6">
          
          {/* 功能概览卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-sm">智能提示</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  悬停提示和上下文帮助
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-sm">智能建议</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  基于历史数据的输入建议
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-sm">操作引导</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  分步式操作指导
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-orange-600" />
                  <CardTitle className="text-sm">上下文帮助</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  智能识别用户需求
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="tooltips" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tooltips">智能提示演示</TabsTrigger>
              <TabsTrigger value="input">智能输入演示</TabsTrigger>
              <TabsTrigger value="help">上下文帮助</TabsTrigger>
            </TabsList>

            <TabsContent value="tooltips" className="space-y-4">
              <Card data-demo-tooltips>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    智能提示功能演示
                  </CardTitle>
                  <CardDescription>
                    悬停在下面的元素上查看智能提示效果
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <SmartTooltip
                        content="这是一个帮助类型的提示，用于解释复杂的操作步骤"
                        type="help"
                        title="帮助提示"
                      >
                        <Button variant="outline" className="w-full">
                          <HelpCircle className="w-4 h-4 mr-2" />
                          帮助提示示例
                        </Button>
                      </SmartTooltip>

                      <SmartTooltip
                        content="这是一个信息类型的提示，用于提供额外的说明信息"
                        type="info"
                        title="信息提示"
                      >
                        <Button variant="outline" className="w-full">
                          <Users className="w-4 h-4 mr-2" />
                          信息提示示例
                        </Button>
                      </SmartTooltip>
                    </div>

                    <div className="space-y-3">
                      <SmartTooltip
                        content="这是一个警告类型的提示，用于提醒用户注意重要事项"
                        type="warning"
                        title="警告提示"
                      >
                        <Button variant="outline" className="w-full">
                          <Package className="w-4 h-4 mr-2" />
                          警告提示示例
                        </Button>
                      </SmartTooltip>

                      <SmartTooltip
                        content="这是一个成功类型的提示，用于确认操作成功完成"
                        type="success"
                        title="成功提示"
                      >
                        <Button variant="outline" className="w-full">
                          <DollarSign className="w-4 h-4 mr-2" />
                          成功提示示例
                        </Button>
                      </SmartTooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="input" className="space-y-4">
              <Card data-demo-input>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    智能输入建议演示
                  </CardTitle>
                  <CardDescription>
                    在输入框中输入内容，体验智能建议功能
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label>客户名称搜索</Label>
                      <SmartInput
                        suggestions={customerSuggestions}
                        placeholder="输入客户名称..."
                        showHistory={true}
                        showFrequent={true}
                        onSuggestionSelect={(suggestion) => {
                          console.log('选择了客户:', suggestion)
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        支持历史记录和常用客户建议
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label>产品名称搜索</Label>
                      <SmartInput
                        suggestions={productSuggestions}
                        placeholder="输入产品名称..."
                        showHistory={true}
                        showFrequent={true}
                        onSuggestionSelect={(suggestion) => {
                          console.log('选择了产品:', suggestion)
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        根据使用频率智能排序
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="help" className="space-y-4">
              <Card data-demo-help>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    上下文帮助演示
                  </CardTitle>
                  <CardDescription>
                    系统会根据您的操作自动提供相关帮助
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HelpCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">智能帮助系统</h3>
                    <p className="text-muted-foreground mb-4">
                      系统会根据您的操作习惯和当前页面，主动提供相关的帮助信息
                    </p>
                    <Button onClick={startFeatureGuide}>
                      体验操作引导
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* 智能引导组件 */}
        <SmartGuide
          steps={currentGuide}
          isOpen={isGuideOpen}
          onClose={closeGuide}
          title="人性化功能演示"
        />

        {/* 上下文帮助显示 */}
        {activeHelp && (
          <div className="fixed bottom-4 right-4 z-50">
            <Card className="w-80 shadow-lg border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-blue-900">
                    💡 {activeHelp.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={hideHelp}
                    className="h-6 w-6 p-0 text-blue-600"
                  >
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-blue-800">{activeHelp.content}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </ModernPageContainer>
    </TooltipProvider>
  )
}
