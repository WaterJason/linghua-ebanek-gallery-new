"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  HelpCircleIcon,
  SearchIcon,
  BookOpenIcon,
  VideoIcon,
  MessageCircleIcon,
  PhoneIcon,
  ExternalLinkIcon,
  FileTextIcon,
  PlayCircleIcon
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface HelpCenterProps {
  className?: string
}

interface HelpItem {
  id: string
  title: string
  description: string
  type: 'guide' | 'video' | 'faq' | 'contact'
  icon: React.ReactNode
  link: string
  popular?: boolean
  new?: boolean
}

export function HelpCenter({ className }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const helpItems: HelpItem[] = [
    {
      id: '1',
      title: '快速入门指南',
      description: '了解ERP系统的基本操作和功能',
      type: 'guide',
      icon: <BookOpenIcon className="w-4 h-4" />,
      link: '/help#getting-started',
      popular: true
    },
    {
      id: '2',
      title: '产品管理教程',
      description: '学习如何添加、编辑和管理产品信息',
      type: 'video',
      icon: <VideoIcon className="w-4 h-4" />,
      link: '/help#product-management',
      popular: true
    },
    {
      id: '3',
      title: '销售流程指导',
      description: '掌握完整的销售订单处理流程',
      type: 'guide',
      icon: <FileTextIcon className="w-4 h-4" />,
      link: '/help#sales-process'
    },
    {
      id: '4',
      title: '库存管理视频',
      description: '观看库存管理的详细操作演示',
      type: 'video',
      icon: <PlayCircleIcon className="w-4 h-4" />,
      link: '/help#inventory-management',
      new: true
    },
    {
      id: '5',
      title: '常见问题解答',
      description: '查看用户最常遇到的问题和解决方案',
      type: 'faq',
      icon: <HelpCircleIcon className="w-4 h-4" />,
      link: '/help#faq',
      popular: true
    },
    {
      id: '6',
      title: '在线客服',
      description: '与我们的技术支持团队实时沟通',
      type: 'contact',
      icon: <MessageCircleIcon className="w-4 h-4" />,
      link: '/help#chat'
    },
    {
      id: '7',
      title: '技术支持热线',
      description: '拨打400-123-4567获取电话支持',
      type: 'contact',
      icon: <PhoneIcon className="w-4 h-4" />,
      link: 'tel:400-123-4567'
    }
  ]

  const filteredItems = helpItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guide':
        return 'bg-blue-100 text-blue-700'
      case 'video':
        return 'bg-purple-100 text-purple-700'
      case 'faq':
        return 'bg-green-100 text-green-700'
      case 'contact':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'guide':
        return '指南'
      case 'video':
        return '视频'
      case 'faq':
        return 'FAQ'
      case 'contact':
        return '联系'
      default:
        return '其他'
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-200",
            className
          )}
          title="帮助中心"
        >
          <HelpCircleIcon className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-none shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">帮助中心</CardTitle>
              <Link href="/help">
                <Button variant="ghost" size="sm" className="text-xs">
                  <ExternalLinkIcon className="w-3 h-3 mr-1" />
                  完整帮助
                </Button>
              </Link>
            </div>

            {/* 搜索框 */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索帮助内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto px-4 pb-4">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8">
                  <HelpCircleIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? '未找到相关帮助内容' : '暂无帮助内容'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <Link key={item.id} href={item.link}>
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            getTypeColor(item.type)
                          )}>
                            {item.icon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium truncate">
                              {item.title}
                            </h4>
                            <div className="flex gap-1">
                              {item.popular && (
                                <Badge variant="secondary" className="text-xs px-1">
                                  热门
                                </Badge>
                              )}
                              {item.new && (
                                <Badge variant="destructive" className="text-xs px-1">
                                  新
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                            {item.description}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {getTypeName(item.type)}
                          </Badge>
                        </div>
                        <ExternalLinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 快速联系 */}
            <div className="border-t p-4">
              <div className="text-xs text-muted-foreground mb-2">需要更多帮助？</div>
              <div className="flex gap-2">
                <Link href="/help#chat" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <MessageCircleIcon className="w-3 h-3 mr-1" />
                    在线客服
                  </Button>
                </Link>
                <Link href="tel:400-123-4567" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <PhoneIcon className="w-3 h-3 mr-1" />
                    电话支持
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
