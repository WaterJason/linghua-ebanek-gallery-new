"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  SearchIcon, 
  BookOpenIcon, 
  VideoIcon, 
  MessageCircleIcon, 
  PhoneIcon,
  HelpCircleIcon,
  FileTextIcon,
  PlayCircleIcon,
  ExternalLinkIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface HelpPageProps {
  className?: string
}

export function HelpPage({ className }: HelpPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeSection, setActiveSection] = useState("")
  const [isChatOpen, setIsChatOpen] = useState(false)

  // 监听URL hash变化
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      setActiveSection(hash)
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const helpSections = [
    {
      id: 'getting-started',
      title: '快速入门指南',
      description: '了解ERP系统的基本操作和功能',
      icon: <BookOpenIcon className="w-5 h-5" />,
      content: [
        {
          title: '系统登录',
          content: '使用您的邮箱和密码登录系统。首次登录请联系管理员获取账号。'
        },
        {
          title: '界面导航',
          content: '左侧导航栏包含所有主要功能模块，顶部导航栏提供快速操作和通知。'
        },
        {
          title: '基本操作',
          content: '大部分操作都支持增删改查，使用搜索功能可以快速找到需要的信息。'
        }
      ]
    },
    {
      id: 'product-management',
      title: '产品管理教程',
      description: '学习如何添加、编辑和管理产品信息',
      icon: <VideoIcon className="w-5 h-5" />,
      content: [
        {
          title: '添加新产品',
          content: '在产品管理页面点击"新增产品"按钮，填写产品基本信息、价格、库存等。'
        },
        {
          title: '产品分类',
          content: '合理设置产品分类有助于管理和查找，支持多级分类结构。'
        },
        {
          title: '库存管理',
          content: '产品库存会自动更新，也可以手动调整库存数量。'
        }
      ]
    },
    {
      id: 'sales-process',
      title: '销售流程指导',
      description: '掌握完整的销售订单处理流程',
      icon: <FileTextIcon className="w-5 h-5" />,
      content: [
        {
          title: '创建销售订单',
          content: '选择客户，添加产品，设置价格和数量，确认订单信息。'
        },
        {
          title: '订单处理',
          content: '订单创建后可以修改状态，处理付款，安排发货。'
        },
        {
          title: '售后服务',
          content: '记录客户反馈，处理退换货，维护客户关系。'
        }
      ]
    },
    {
      id: 'inventory-management',
      title: '库存管理',
      description: '观看库存管理的详细操作演示',
      icon: <PlayCircleIcon className="w-5 h-5" />,
      content: [
        {
          title: '库存查看',
          content: '实时查看所有产品的库存状态，包括在库、预留、可用数量。'
        },
        {
          title: '入库出库',
          content: '记录商品的入库和出库操作，系统自动更新库存数量。'
        },
        {
          title: '库存预警',
          content: '设置库存预警线，当库存不足时系统会自动提醒。'
        }
      ]
    }
  ]

  const faqItems = [
    {
      question: '如何重置密码？',
      answer: '在登录页面点击"忘记密码"，输入您的邮箱地址，系统会发送重置链接到您的邮箱。'
    },
    {
      question: '如何导出数据？',
      answer: '在各个管理页面都有导出功能，点击导出按钮选择需要的格式（Excel、CSV等）。'
    },
    {
      question: '系统支持哪些浏览器？',
      answer: '推荐使用Chrome、Firefox、Safari、Edge等现代浏览器的最新版本。'
    },
    {
      question: '如何联系技术支持？',
      answer: '您可以通过在线客服、电话400-123-4567或邮件support@linghua.com联系我们。'
    }
  ]

  const filteredSections = helpSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFaq = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={cn("space-y-6", className)}>
      {/* 搜索栏 */}
      <Card>
        <CardHeader>
          <CardTitle>帮助中心</CardTitle>
          <CardDescription>查找您需要的帮助信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索帮助内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="guides" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="guides">操作指南</TabsTrigger>
          <TabsTrigger value="faq">常见问题</TabsTrigger>
          <TabsTrigger value="contact">联系支持</TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="space-y-6">
          {filteredSections.map((section) => (
            <Card 
              key={section.id} 
              id={section.id}
              className={cn(
                "transition-all duration-200",
                activeSection === section.id && "ring-2 ring-primary"
              )}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {section.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {section.content.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        {item.content}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircleIcon className="w-5 h-5" />
                常见问题解答
              </CardTitle>
              <CardDescription>查看用户最常遇到的问题和解决方案</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFaq.map((item, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6" id="chat">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 在线客服 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircleIcon className="w-5 h-5" />
                  在线客服
                </CardTitle>
                <CardDescription>与我们的技术支持团队实时沟通</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ClockIcon className="w-4 h-4" />
                  服务时间：周一至周五 9:00-18:00
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircleIcon className="w-4 h-4" />
                  当前状态：在线
                </div>
                <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <MessageCircleIcon className="w-4 h-4 mr-2" />
                      开始对话
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>在线客服</DialogTitle>
                      <DialogDescription>
                        请描述您遇到的问题，我们会尽快为您解答
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <UserIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">客服小助手</span>
                        </div>
                        <p className="text-sm">您好！我是聆花ERP系统的客服助手，请问有什么可以帮助您的吗？</p>
                      </div>
                      <Input placeholder="请输入您的问题..." />
                      <Button className="w-full">发送消息</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* 电话支持 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PhoneIcon className="w-5 h-5" />
                  电话支持
                </CardTitle>
                <CardDescription>拨打热线获取即时帮助</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold text-primary">400-123-4567</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ClockIcon className="w-4 h-4" />
                  服务时间：7×24小时
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <a href="tel:400-123-4567">
                    <PhoneIcon className="w-4 h-4 mr-2" />
                    立即拨打
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
