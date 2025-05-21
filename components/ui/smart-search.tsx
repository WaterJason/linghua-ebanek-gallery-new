"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { SearchIcon, XIcon, FilterIcon, ChevronDownIcon, CheckIcon } from 'lucide-react'

// 搜索过滤器类型
export interface SearchFilter {
  id: string
  name: string
  value: string
  type: 'category' | 'tag' | 'range' | 'boolean' | 'text'
  active: boolean
}

// 搜索建议类型
export interface SearchSuggestion {
  id: string
  text: string
  type: 'recent' | 'popular' | 'category' | 'tag' | 'item'
  category?: string
}

// 搜索历史项类型
export interface SearchHistoryItem {
  id: string
  text: string
  timestamp: number
  filters: SearchFilter[]
}

interface SmartSearchProps {
  placeholder?: string
  onSearch: (query: string, filters: SearchFilter[]) => void
  suggestions?: SearchSuggestion[]
  filters?: SearchFilter[]
  className?: string
  showFilterBadges?: boolean
  showSuggestions?: boolean
  showHistory?: boolean
  maxHistoryItems?: number
  autoFocus?: boolean
}

/**
 * 智能搜索组件
 *
 * 提供高级搜索功能，包括搜索建议、过滤器、搜索历史等。
 */
export function SmartSearch({
  placeholder = '搜索...',
  onSearch,
  suggestions = [],
  filters = [],
  className = '',
  showFilterBadges = true,
  showSuggestions = true,
  showHistory = true,
  maxHistoryItems = 5,
  autoFocus = false
}: SmartSearchProps) {
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([])
  const [showFilterPopover, setShowFilterPopover] = useState(false)
  const [showSuggestionPopover, setShowSuggestionPopover] = useState(false)
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // 加载搜索历史
  useEffect(() => {
    if (showHistory && typeof window !== 'undefined') {
      try {
        const savedHistory = localStorage.getItem('search-history')
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory))
        }
      } catch (error) {
        console.error('Failed to load search history:', error)
      }
    }
  }, [showHistory])

  // 保存搜索历史
  const saveToHistory = useCallback((searchQuery: string, searchFilters: SearchFilter[]) => {
    if (!showHistory || !searchQuery.trim()) return

    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      text: searchQuery,
      timestamp: Date.now(),
      filters: searchFilters.filter(f => f.active)
    }

    // 检查是否已存在相同的搜索
    const exists = history.some(item =>
      item.text === searchQuery &&
      item.filters.length === newItem.filters.length &&
      item.filters.every(f =>
        newItem.filters.some(nf => nf.id === f.id && nf.value === f.value)
      )
    )

    if (!exists) {
      const updatedHistory = [newItem, ...history].slice(0, maxHistoryItems)
      setHistory(updatedHistory)

      try {
        localStorage.setItem('search-history', JSON.stringify(updatedHistory))
      } catch (error) {
        console.error('Failed to save search history:', error)
      }
    }
  }, [history, maxHistoryItems, showHistory])

  // 处理搜索
  const handleSearch = useCallback(() => {
    onSearch(query, activeFilters)
    saveToHistory(query, activeFilters)
    setShowSuggestionPopover(false)
  }, [query, activeFilters, onSearch, saveToHistory])

  // 处理按键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestionPopover(false)
    }
  }

  // 处理过滤器变化
  const handleFilterChange = (filter: SearchFilter, active: boolean) => {
    const updatedFilters = activeFilters.map(f =>
      f.id === filter.id ? { ...f, active } : f
    )

    if (!activeFilters.some(f => f.id === filter.id)) {
      updatedFilters.push({ ...filter, active })
    }

    setActiveFilters(updatedFilters)
  }

  // 移除过滤器
  const handleRemoveFilter = (filterId: string) => {
    setActiveFilters(activeFilters.filter(f => f.id !== filterId))
  }

  // 清除所有过滤器
  const handleClearFilters = () => {
    setActiveFilters([])
  }

  // 处理建议点击
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    setShowSuggestionPopover(false)

    // 如果是分类或标签建议，添加相应的过滤器
    if (suggestion.type === 'category' || suggestion.type === 'tag') {
      const filter = filters.find(f =>
        (suggestion.type === 'category' && f.type === 'category' && f.name === suggestion.category) ||
        (suggestion.type === 'tag' && f.type === 'tag' && f.value === suggestion.text)
      )

      if (filter && !activeFilters.some(f => f.id === filter.id)) {
        setActiveFilters([...activeFilters, { ...filter, active: true }])
      }
    }

    // 自动搜索
    setTimeout(() => {
      onSearch(suggestion.text, activeFilters)
    }, 0)
  }

  // 处理历史项点击
  const handleHistoryClick = (item: SearchHistoryItem) => {
    setQuery(item.text)
    setActiveFilters(item.filters)
    setShowSuggestionPopover(false)

    // 自动搜索
    setTimeout(() => {
      onSearch(item.text, item.filters)
    }, 0)
  }

  // 过滤建议
  const filteredSuggestions = query
    ? suggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(query.toLowerCase())
      )
    : suggestions

  return (
    <div className={cn('relative w-full', className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <div className="relative w-full">
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                const newValue = e.target.value;
                setQuery(newValue);
              }}
              onKeyDown={handleKeyDown}
              className="pl-9 pr-10"
              autoFocus={autoFocus}
            />



            {/* 清除按钮 */}
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}

            {/* 使用绝对定位的div作为建议下拉框 */}
            {showSuggestions && query.trim() && (
              <div
                className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-950 rounded-md border shadow-md max-h-[300px] overflow-auto"
              >
                <div className="p-2">
                  {query && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-muted-foreground mb-1">搜索</div>
                      <div
                        className="flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-accent cursor-pointer"
                        onClick={() => {
                          handleSearch();
                          inputRef.current?.focus();
                        }}
                        onMouseDown={(e) => e.preventDefault()} // 防止失去焦点
                      >
                        <SearchIcon className="mr-2 h-4 w-4" />
                        搜索 "{query}"
                      </div>
                    </div>
                  )}

                  {showHistory && history.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-medium text-muted-foreground mb-1">搜索历史</div>
                      {history.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-accent cursor-pointer"
                          onClick={() => {
                            handleHistoryClick(item);
                            inputRef.current?.focus();
                          }}
                          onMouseDown={(e) => e.preventDefault()} // 防止失去焦点
                        >
                          <div className="flex items-center">
                            <SearchIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{item.text}</span>
                          </div>
                          {item.filters.length > 0 && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {item.filters.length} 个过滤器
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredSuggestions.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">建议</div>
                      {filteredSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-accent cursor-pointer"
                          onClick={() => {
                            handleSuggestionClick(suggestion);
                            inputRef.current?.focus();
                          }}
                          onMouseDown={(e) => e.preventDefault()} // 防止失去焦点
                        >
                          {suggestion.type === 'category' && (
                            <Badge variant="outline" className="mr-2">
                              {suggestion.category}
                            </Badge>
                          )}
                          {suggestion.type === 'tag' && (
                            <Badge variant="secondary" className="mr-2">
                              {suggestion.text}
                            </Badge>
                          )}
                          {suggestion.type === 'recent' && (
                            <SearchIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          )}
                          {suggestion.type === 'popular' && (
                            <SearchIcon className="mr-2 h-4 w-4 text-primary" />
                          )}
                          <span>{suggestion.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredSuggestions.length === 0 && !history.length && (
                    <div className="text-sm text-center py-2 text-muted-foreground">没有找到相关建议</div>
                  )}
                </div>
              </div>
            )}
          </div>


        </div>

        <Popover open={showFilterPopover} onOpenChange={setShowFilterPopover}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={() => setShowFilterPopover(true)}
            >
              <FilterIcon className="h-4 w-4" />
              {activeFilters.filter(f => f.active).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                  {activeFilters.filter(f => f.active).length}
                </span>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">过滤器</h4>
                {activeFilters.some(f => f.active) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-8 px-2 text-xs"
                  >
                    清除全部
                  </Button>
                )}
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {filters.map((filter) => (
                    <div key={filter.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{filter.name}</div>
                        <div className="text-xs text-muted-foreground">{filter.value}</div>
                      </div>
                      <Button
                        variant={activeFilters.some(f => f.id === filter.id && f.active) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange(
                          filter,
                          !activeFilters.some(f => f.id === filter.id && f.active)
                        )}
                        className="h-8"
                      >
                        {activeFilters.some(f => f.id === filter.id && f.active) ? (
                          <CheckIcon className="h-4 w-4 mr-1" />
                        ) : null}
                        {activeFilters.some(f => f.id === filter.id && f.active) ? "已选择" : "选择"}
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="pt-2 border-t">
                <Button className="w-full" onClick={() => {
                  setShowFilterPopover(false)
                  handleSearch()
                }}>
                  应用过滤器
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button onClick={handleSearch}>
          搜索
        </Button>
      </div>

      {/* 活动过滤器标签 */}
      {showFilterBadges && activeFilters.filter(f => f.active).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {activeFilters.filter(f => f.active).map((filter) => (
            <Badge key={filter.id} variant="secondary" className="pl-2 pr-1 py-1">
              <span className="mr-1">{filter.name}: {filter.value}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveFilter(filter.id)}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {activeFilters.filter(f => f.active).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-6 px-2 text-xs"
            >
              清除全部
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
