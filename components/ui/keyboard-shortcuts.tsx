"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { KeyboardIcon } from "lucide-react"

interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  category: string
}

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  // 定义快捷键
  const shortcuts: KeyboardShortcut[] = [
    // 导航快捷键
    {
      key: "Ctrl+H",
      description: "返回首页",
      action: () => router.push("/"),
      category: "导航"
    },
    {
      key: "Ctrl+P",
      description: "产品管理",
      action: () => router.push("/products"),
      category: "导航"
    },
    {
      key: "Ctrl+S",
      description: "销售管理",
      action: () => router.push("/sales"),
      category: "导航"
    },
    {
      key: "Ctrl+I",
      description: "库存管理",
      action: () => router.push("/inventory"),
      category: "导航"
    },
    {
      key: "Ctrl+F",
      description: "财务管理",
      action: () => router.push("/finance"),
      category: "导航"
    },
    {
      key: "Ctrl+E",
      description: "员工管理",
      action: () => router.push("/employees"),
      category: "导航"
    },
    // 操作快捷键
    {
      key: "Ctrl+N",
      description: "新建记录",
      action: () => {
        // 根据当前页面决定新建什么
        const path = window.location.pathname
        if (path.includes("/products")) {
          router.push("/products/new")
        } else if (path.includes("/sales")) {
          router.push("/sales/new")
        } else if (path.includes("/customers")) {
          router.push("/customers/new")
        } else {
          router.push("/daily-log")
        }
      },
      category: "操作"
    },
    {
      key: "Ctrl+D",
      description: "数据录入",
      action: () => router.push("/daily-log"),
      category: "操作"
    },
    {
      key: "Ctrl+Q",
      description: "快速操作",
      action: () => router.push("/m/quick-actions"),
      category: "操作"
    },
    // 系统快捷键
    {
      key: "Ctrl+/",
      description: "显示快捷键帮助",
      action: () => setIsOpen(true),
      category: "系统"
    },
    {
      key: "Ctrl+,",
      description: "系统设置",
      action: () => router.push("/settings"),
      category: "系统"
    },
    {
      key: "Escape",
      description: "关闭对话框/返回",
      action: () => {
        // 关闭当前对话框或返回上一页
        if (isOpen) {
          setIsOpen(false)
        } else {
          router.back()
        }
      },
      category: "系统"
    }
  ]

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 如果在输入框中，不处理快捷键
      const target = event.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true") {
        // 只处理 Escape 和 Ctrl+/ 快捷键
        if (event.key === "Escape" || (event.ctrlKey && event.key === "/")) {
          event.preventDefault()
          const shortcut = shortcuts.find(s => 
            (event.key === "Escape" && s.key === "Escape") ||
            (event.ctrlKey && event.key === "/" && s.key === "Ctrl+/")
          )
          shortcut?.action()
        }
        return
      }

      // 查找匹配的快捷键
      const shortcut = shortcuts.find(s => {
        const keys = s.key.split("+")
        if (keys.length === 1) {
          return event.key === keys[0]
        } else if (keys.length === 2) {
          const [modifier, key] = keys
          return (
            ((modifier === "Ctrl" && event.ctrlKey) ||
             (modifier === "Alt" && event.altKey) ||
             (modifier === "Shift" && event.shiftKey)) &&
            event.key.toLowerCase() === key.toLowerCase()
          )
        }
        return false
      })

      if (shortcut) {
        event.preventDefault()
        shortcut.action()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [shortcuts, isOpen, router])

  // 按分类分组快捷键
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, KeyboardShortcut[]>)

  return (
    <>
      {/* 快捷键帮助按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-shadow"
        title="快捷键帮助 (Ctrl+/)"
      >
        <KeyboardIcon className="h-5 w-5" />
      </button>

      {/* 快捷键帮助对话框 */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>键盘快捷键</DialogTitle>
            <DialogDescription>
              使用这些快捷键可以更高效地操作系统
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3">{category}</h3>
                <div className="grid gap-2">
                  {categoryShortcuts.map((shortcut) => (
                    <div key={shortcut.key} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                      <span className="text-sm">{shortcut.description}</span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {shortcut.key}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 提示：在输入框中时，只有 <Badge variant="outline" className="mx-1">Escape</Badge> 和 
              <Badge variant="outline" className="mx-1">Ctrl+/</Badge> 快捷键可用。
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
