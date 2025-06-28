"use client"

import * as React from "react"
import { Search, Clock, Star, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Suggestion {
  id: string
  value: string
  label: string
  category?: string
  frequency?: number
  lastUsed?: Date
  metadata?: Record<string, any>
}

interface SmartInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  suggestions?: Suggestion[]
  onSuggestionSelect?: (suggestion: Suggestion) => void
  onChange?: (value: string) => void
  showHistory?: boolean
  showFrequent?: boolean
  maxSuggestions?: number
  placeholder?: string
  className?: string
  enableSearch?: boolean
  customFilter?: (suggestions: Suggestion[], query: string) => Suggestion[]
}

export const SmartInput: React.FC<SmartInputProps> = ({
  suggestions = [],
  onSuggestionSelect,
  onChange,
  showHistory = true,
  showFrequent = true,
  maxSuggestions = 8,
  placeholder = "输入或选择...",
  className,
  enableSearch = true,
  customFilter,
  ...props
}) => {
  const [value, setValue] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = React.useState<Suggestion[]>([])
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const [history, setHistory] = React.useState<Suggestion[]>([])
  
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // 默认过滤函数
  const defaultFilter = React.useCallback((suggestions: Suggestion[], query: string) => {
    if (!query.trim()) return suggestions
    
    return suggestions.filter(suggestion =>
      suggestion.label.toLowerCase().includes(query.toLowerCase()) ||
      suggestion.value.toLowerCase().includes(query.toLowerCase())
    )
  }, [])

  // 更新过滤后的建议
  React.useEffect(() => {
    const filterFn = customFilter || defaultFilter
    let filtered = filterFn(suggestions, value)
    
    // 按频率和最近使用排序
    filtered = filtered.sort((a, b) => {
      const aScore = (a.frequency || 0) + (a.lastUsed ? Date.now() - a.lastUsed.getTime() : 0) / 1000000
      const bScore = (b.frequency || 0) + (b.lastUsed ? Date.now() - b.lastUsed.getTime() : 0) / 1000000
      return bScore - aScore
    })
    
    setFilteredSuggestions(filtered.slice(0, maxSuggestions))
  }, [suggestions, value, maxSuggestions, customFilter, defaultFilter])

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    onChange?.(newValue)
    setIsOpen(true)
    setSelectedIndex(-1)
  }

  // 处理建议选择
  const handleSuggestionSelect = (suggestion: Suggestion) => {
    setValue(suggestion.value)
    onChange?.(suggestion.value)
    onSuggestionSelect?.(suggestion)
    setIsOpen(false)
    setSelectedIndex(-1)
    
    // 更新历史记录
    setHistory(prev => {
      const filtered = prev.filter(item => item.id !== suggestion.id)
      return [{ ...suggestion, lastUsed: new Date() }, ...filtered].slice(0, 10)
    })
  }

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
          handleSuggestionSelect(filteredSuggestions[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  // 点击外部关闭
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 获取显示的建议分组
  const getSuggestionGroups = () => {
    const groups: { title: string; items: Suggestion[]; icon: React.ReactNode }[] = []
    
    if (value.trim()) {
      // 搜索结果
      if (filteredSuggestions.length > 0) {
        groups.push({
          title: "搜索结果",
          items: filteredSuggestions,
          icon: <Search className="w-4 h-4" />
        })
      }
    } else {
      // 历史记录
      if (showHistory && history.length > 0) {
        groups.push({
          title: "最近使用",
          items: history.slice(0, 5),
          icon: <Clock className="w-4 h-4" />
        })
      }
      
      // 常用建议
      if (showFrequent) {
        const frequent = suggestions
          .filter(s => (s.frequency || 0) > 0)
          .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
          .slice(0, 5)
        
        if (frequent.length > 0) {
          groups.push({
            title: "常用选项",
            items: frequent,
            icon: <Star className="w-4 h-4" />
          })
        }
      }
    }
    
    return groups
  }

  const suggestionGroups = getSuggestionGroups()

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={cn("pr-8", className)}
          {...props}
        />
        {enableSearch && (
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        )}
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setValue("")
              onChange?.("")
              inputRef.current?.focus()
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* 建议下拉框 */}
      {isOpen && suggestionGroups.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {suggestionGroups.map((group, groupIndex) => (
                <div key={group.title} className={cn(groupIndex > 0 && "border-t")}>
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                    {group.icon}
                    {group.title}
                  </div>
                  {group.items.map((suggestion, index) => {
                    const globalIndex = suggestionGroups
                      .slice(0, groupIndex)
                      .reduce((acc, g) => acc + g.items.length, 0) + index
                    
                    return (
                      <div
                        key={suggestion.id}
                        className={cn(
                          "px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors",
                          selectedIndex === globalIndex && "bg-muted"
                        )}
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{suggestion.label}</div>
                            {suggestion.category && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                {suggestion.category}
                              </Badge>
                            )}
                          </div>
                          {suggestion.frequency && suggestion.frequency > 0 && (
                            <div className="text-xs text-muted-foreground ml-2">
                              {suggestion.frequency}次
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
