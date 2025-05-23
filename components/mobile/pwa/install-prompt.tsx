"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // 阻止Chrome 67及更早版本自动显示安装提示
      e.preventDefault()
      // 保存事件，以便稍后触发
      setDeferredPrompt(e)
      // 显示自定义安装提示
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = () => {
    // 隐藏自定义安装提示
    setShowPrompt(false)
    
    // 如果没有保存的事件，则退出
    if (!deferredPrompt) {
      return
    }
    
    // 显示安装提示
    deferredPrompt.prompt()
    
    // 等待用户响应提示
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('用户接受了安装提示')
      } else {
        console.log('用户拒绝了安装提示')
      }
      // 清除保存的提示，因为它只能使用一次
      setDeferredPrompt(null)
    })
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 mx-auto w-[90%] max-w-md z-50">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">将应用添加到主屏幕</CardTitle>
          <CardDescription>安装聆华ERP应用，随时随地访问</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mr-3">
              <Icons.appWindow className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm">安装后，您可以：</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                <li className="flex items-center">
                  <Icons.check className="h-3 w-3 mr-1 text-green-500" />
                  离线使用应用
                </li>
                <li className="flex items-center">
                  <Icons.check className="h-3 w-3 mr-1 text-green-500" />
                  从主屏幕快速访问
                </li>
                <li className="flex items-center">
                  <Icons.check className="h-3 w-3 mr-1 text-green-500" />
                  获得更好的使用体验
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={handleDismiss}>稍后再说</Button>
          <Button onClick={handleInstallClick}>
            <Icons.download className="h-4 w-4 mr-2" />
            安装应用
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
