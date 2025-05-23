"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon, XIcon, Loader2Icon } from "lucide-react"
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { globalSearch, SearchResultItem, SearchResultType } from "@/lib/actions/search-actions"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

// 搜索类型配置
const searchTypeConfig: Record<SearchResultType, {
  label: string;
  icon: React.ReactNode;
  color: string;
}> = {
  product: {
    label: "产品",
    icon: <span className="text-blue-500">P</span>,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  order: {
    label: "订单",
    icon: <span className="text-green-500">O</span>,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  customer: {
    label: "客户",
    icon: <span className="text-purple-500">C</span>,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
  supplier: {
    label: "供应商",
    icon: <span className="text-amber-500">S</span>,
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  },
  employee: {
    label: "员工",
    icon: <span className="text-indigo-500">E</span>,
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  },
  inventory: {
    label: "库存",
    icon: <span className="text-cyan-500">I</span>,
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  },
  workshop: {
    label: "团建",
    icon: <span className="text-pink-500">W</span>,
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  },
  channel: {
    label: "渠道",
    icon: <span className="text-orange-500">CH</span>,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  },
  finance: {
    label: "财务",
    icon: <span className="text-emerald-500">F</span>,
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  },
  other: {
    label: "其他",
    icon: <span className="text-gray-500">O</span>,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  },
}

// 搜索历史项
interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

// 全局搜索组件属性
interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  shortcut?: string;
  maxHistoryItems?: number;
}

/**
 * 全局搜索组件
 * 
 * 提供跨模块的全局搜索功能，支持快捷键触发和搜索历史记录。
 */
export function GlobalSearch({
  className,
  placeholder = "搜索产品、订单、客户...",
  shortcut = "k",
  maxHistoryItems = 5,
}: GlobalSearchProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<SearchResultType[]>([])
  const debouncedQuery = useDebounce(query, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // 加载搜索历史
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem("search-history")
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory))
      }
    } catch (error) {
      console.error("Failed to load search history:", error)
    }
  }, [])
  
  // 保存搜索历史
  const saveToHistory = useCallback((query: string) => {
    if (!query.trim() || query.length < 2) return
    
    const newItem: SearchHistoryItem = {
      query,
      timestamp: Date.now(),
    }
    
    // 检查是否已存在相同查询
    const exists = history.some(item => item.query.toLowerCase() === query.toLowerCase())
    
    if (!exists) {
      const updatedHistory = [newItem, ...history].slice(0, maxHistoryItems)
      setHistory(updatedHistory)
      
      try {
        localStorage.setItem("search-history", JSON.stringify(updatedHistory))
      } catch (error) {
        console.error("Failed to save search history:", error)
      }
    }
  }, [history, maxHistoryItems])
  
  // 执行搜索
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([])
        return
      }
      
      setLoading(true)
      
      try {
        const { results } = await globalSearch({
          query: debouncedQuery,
          types: selectedTypes.length > 0 ? selectedTypes : undefined,
          limit: 20,
        })
        
        setResults(results)
      } catch (error) {
        console.error("Search failed:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }
    
    performSearch()
  }, [debouncedQuery, selectedTypes])
  
  // 监听快捷键
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === shortcut && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(open => !open)
      }
    }
    
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [shortcut])
  
  // 处理搜索结果点击
  const handleResultClick = (result: SearchResultItem) => {
    saveToHistory(query)
    setOpen(false)
    router.push(result.link)
  }
  
  // 切换搜索类型过滤器
  const toggleType = (type: SearchResultType) => {
    setSelectedTypes(prev => 
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }
  
  // 清除搜索历史
  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem("search-history")
  }
  
  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">{placeholder}</span>
        <span className="inline-flex lg:hidden">搜索...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            ref={inputRef}
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setQuery("")}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* 搜索类型过滤器 */}
        <div className="flex flex-wrap gap-1 p-2 border-b">
          {Object.entries(searchTypeConfig).map(([type, config]) => (
            <Badge
              key={type}
              variant={selectedTypes.includes(type as SearchResultType) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleType(type as SearchResultType)}
            >
              {config.icon} {config.label}
            </Badge>
          ))}
        </div>
        
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">搜索中...</span>
            </div>
          )}
          
          {!loading && query && results.length === 0 && (
            <CommandEmpty>未找到匹配的结果</CommandEmpty>
          )}
          
          {!query && history.length > 0 && (
            <CommandGroup heading="搜索历史">
              {history.map((item, index) => (
                <CommandItem
                  key={`history-${index}`}
                  onSelect={() => {
                    setQuery(item.query)
                    inputRef.current?.focus()
                  }}
                >
                  <SearchIcon className="mr-2 h-4 w-4" />
                  <span>{item.query}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </CommandItem>
              ))}
              <div className="px-2 py-1.5 text-xs text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={clearHistory}
                >
                  清除历史记录
                </Button>
              </div>
            </CommandGroup>
          )}
          
          {results.length > 0 && (
            <CommandGroup heading="搜索结果">
              {results.map((result) => {
                const typeConfig = searchTypeConfig[result.type]
                
                return (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    onSelect={() => handleResultClick(result)}
                    className="py-2"
                  >
                    <div className="flex items-center gap-2 w-full">
                      {result.imageUrl ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={result.imageUrl} alt={result.title} />
                          <AvatarFallback className={typeConfig.color}>
                            {typeConfig.icon}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", typeConfig.color)}>
                          {typeConfig.icon}
                        </div>
                      )}
                      
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="font-medium truncate">{result.title}</div>
                        {result.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {result.description}
                          </div>
                        )}
                      </div>
                      
                      <Badge variant="outline" className={typeConfig.color}>
                        {typeConfig.label}
                      </Badge>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
