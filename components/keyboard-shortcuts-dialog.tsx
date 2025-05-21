"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  getAllShortcuts, 
  getShortcutGroups, 
  formatShortcut, 
  ShortcutConfig, 
  ShortcutGroup 
} from '@/lib/keyboard-shortcuts'
import { SearchIcon } from 'lucide-react'

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 键盘快捷键帮助对话框
 * 
 * 显示系统中所有可用的键盘快捷键，按组分类，支持搜索。
 */
export function KeyboardShortcutsDialog({
  open,
  onOpenChange
}: KeyboardShortcutsDialogProps) {
  const [groups, setGroups] = useState<ShortcutGroup[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  
  // 加载快捷键
  useEffect(() => {
    if (open) {
      const shortcutGroups = getShortcutGroups()
      setGroups(shortcutGroups)
      
      if (shortcutGroups.length > 0) {
        setActiveTab(shortcutGroups[0].name)
      }
    }
  }, [open])
  
  // 过滤快捷键
  const filteredGroups = groups.map(group => ({
    ...group,
    shortcuts: group.shortcuts.filter(shortcut => {
      if (!searchQuery) return true
      
      const query = searchQuery.toLowerCase()
      return (
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.key.toLowerCase().includes(query) ||
        formatShortcut(shortcut).toLowerCase().includes(query)
      )
    })
  })).filter(group => group.shortcuts.length > 0)
  
  // 所有快捷键
  const allShortcuts = groups.flatMap(group => 
    group.shortcuts.map(shortcut => ({
      ...shortcut,
      groupName: group.name
    }))
  ).filter(shortcut => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      shortcut.description.toLowerCase().includes(query) ||
      shortcut.key.toLowerCase().includes(query) ||
      formatShortcut(shortcut).toLowerCase().includes(query) ||
      shortcut.groupName.toLowerCase().includes(query)
    )
  })
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>键盘快捷键</DialogTitle>
          <DialogDescription>
            浏览系统中所有可用的键盘快捷键，提高操作效率。
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索快捷键..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex flex-wrap">
            <TabsTrigger value="all">全部</TabsTrigger>
            {filteredGroups.map(group => (
              <TabsTrigger key={group.name} value={group.name}>
                {group.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <ScrollArea className="h-[400px] pr-4">
            <TabsContent value="all" className="space-y-6">
              {searchQuery ? (
                <div className="space-y-4">
                  {allShortcuts.map((shortcut, index) => (
                    <ShortcutItem
                      key={index}
                      shortcut={shortcut}
                      groupName={shortcut.groupName}
                    />
                  ))}
                </div>
              ) : (
                filteredGroups.map(group => (
                  <div key={group.name} className="space-y-4">
                    <h3 className="text-lg font-semibold">{group.name}</h3>
                    <div className="space-y-2">
                      {group.shortcuts.map((shortcut, index) => (
                        <ShortcutItem
                          key={index}
                          shortcut={shortcut}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
              
              {allShortcuts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  没有找到匹配的快捷键
                </div>
              )}
            </TabsContent>
            
            {filteredGroups.map(group => (
              <TabsContent key={group.name} value={group.name} className="space-y-4">
                {group.shortcuts.map((shortcut, index) => (
                  <ShortcutItem
                    key={index}
                    shortcut={shortcut}
                  />
                ))}
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
        
        <div className="mt-4 text-sm text-muted-foreground">
          提示: 按下 <kbd className="px-1 py-0.5 rounded border">?</kbd> 可随时打开此帮助对话框
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ShortcutItemProps {
  shortcut: ShortcutConfig
  groupName?: string
}

/**
 * 快捷键项组件
 */
function ShortcutItem({ shortcut, groupName }: ShortcutItemProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b">
      <div>
        <div className="font-medium">{shortcut.description}</div>
        {groupName && (
          <div className="text-xs text-muted-foreground">{groupName}</div>
        )}
      </div>
      <div className="flex items-center">
        <kbd className="px-2 py-1 rounded bg-muted border text-sm font-mono">
          {formatShortcut(shortcut)}
        </kbd>
      </div>
    </div>
  )
}

/**
 * 注册问号键快捷键，用于打开快捷键帮助对话框
 * @param setOpen 设置对话框打开状态的函数
 */
export function registerHelpShortcut(setOpen: (open: boolean) => void): void {
  if (typeof window === 'undefined') return
  
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === '?' && !event.ctrlKey && !event.altKey && !event.metaKey) {
      // 如果当前焦点在输入框中，不触发快捷键
      const activeElement = document.activeElement as HTMLElement
      const isInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
      )
      
      if (!isInput) {
        event.preventDefault()
        setOpen(true)
      }
    }
  }
  
  window.addEventListener('keydown', handleKeyDown)
  
  // 返回清理函数
  return () => {
    window.removeEventListener('keydown', handleKeyDown)
  }
}
