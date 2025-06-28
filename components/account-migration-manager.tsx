"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import {
  UserIcon,
  UsersIcon,
  LinkIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InfoIcon,
  RefreshCwIcon
} from "lucide-react"

interface UnlinkedAccount {
  unlinkedEmployees: any[]
  unlinkedUsers: any[]
  matchSuggestions: any[]
  summary: {
    unlinkedEmployeeCount: number
    unlinkedUserCount: number
    suggestionCount: number
  }
}

interface MatchSuggestion {
  employeeId: number
  userId: string
  employee: any
  user: any
  score: number
  reasons: string[]
  confidence: 'high' | 'medium' | 'low'
}

export function AccountMigrationManager() {
  const [data, setData] = useState<UnlinkedAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMatches, setSelectedMatches] = useState<string[]>([])
  const [showBatchDialog, setShowBatchDialog] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchProcessing, setBatchProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchUnlinkedAccounts()
  }, [])

  const fetchUnlinkedAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employees/unified-create')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        throw new Error('获取未关联账号失败')
      }
    } catch (error) {
      console.error('获取未关联账号失败:', error)
      toast({
        title: "获取数据失败",
        description: "无法获取未关联账号信息",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMatchSelection = (matchId: string, checked: boolean) => {
    if (checked) {
      setSelectedMatches(prev => [...prev, matchId])
    } else {
      setSelectedMatches(prev => prev.filter(id => id !== matchId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const highConfidenceMatches = data?.matchSuggestions
        .filter(match => match.confidence === 'high')
        .map(match => `${match.employeeId}-${match.userId}`) || []
      setSelectedMatches(highConfidenceMatches)
    } else {
      setSelectedMatches([])
    }
  }

  const handleBatchLink = async () => {
    if (selectedMatches.length === 0) return

    setBatchProcessing(true)
    setBatchProgress(0)
    setShowBatchDialog(true)

    try {
      const linkPairs = selectedMatches.map(matchId => {
        const [employeeId, userId] = matchId.split('-')
        return { employeeId: parseInt(employeeId), userId }
      })

      const response = await fetch('/api/employees/batch-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkPairs,
          operationId: `batch-link-${Date.now()}`,
          strictMode: false
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '批量关联失败')
      }

      const result = await response.json()

      setBatchProgress(100)

      // 刷新数据
      await fetchUnlinkedAccounts()
      setSelectedMatches([])

      toast({
        title: "批量关联完成",
        description: `成功关联 ${result.summary.successful} 个账号，失败 ${result.summary.failed} 个`,
      })

    } catch (error) {
      console.error('批量关联失败:', error)
      toast({
        title: "批量关联失败",
        description: error instanceof Error ? error.message : "批量关联操作失败",
        variant: "destructive",
      })
    } finally {
      setBatchProcessing(false)
      setTimeout(() => setShowBatchDialog(false), 2000)
    }
  }

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge variant="default" className="bg-green-100 text-green-800">高</Badge>
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">中</Badge>
      case 'low':
        return <Badge variant="outline" className="bg-red-100 text-red-800">低</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCwIcon className="h-6 w-6 animate-spin mr-2" />
          加载中...
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <XCircleIcon className="h-6 w-6 text-destructive mr-2" />
          无法加载数据
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 概览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未关联员工</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.unlinkedEmployeeCount}</div>
            <p className="text-xs text-muted-foreground">需要关联用户账号</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未关联用户</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.unlinkedUserCount}</div>
            <p className="text-xs text-muted-foreground">需要关联员工信息</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">匹配建议</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.suggestionCount}</div>
            <p className="text-xs text-muted-foreground">智能匹配建议</p>
          </CardContent>
        </Card>
      </div>

      {/* 匹配建议 */}
      {data.matchSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              智能匹配建议
            </CardTitle>
            <CardDescription>
              系统根据姓名、邮箱、电话等信息智能匹配员工和用户账号
            </CardDescription>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedMatches.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm">选择所有高置信度匹配</span>
              {selectedMatches.length > 0 && (
                <Button
                  onClick={handleBatchLink}
                  size="sm"
                  className="ml-auto"
                >
                  批量关联 ({selectedMatches.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">选择</TableHead>
                  <TableHead>员工信息</TableHead>
                  <TableHead>用户信息</TableHead>
                  <TableHead>匹配原因</TableHead>
                  <TableHead>置信度</TableHead>
                  <TableHead>评分</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.matchSuggestions.map((match: MatchSuggestion) => {
                  const matchId = `${match.employeeId}-${match.userId}`
                  return (
                    <TableRow key={matchId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedMatches.includes(matchId)}
                          onCheckedChange={(checked) => handleMatchSelection(matchId, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{match.employee.name}</div>
                          <div className="text-sm text-muted-foreground">{match.employee.position}</div>
                          {match.employee.email && (
                            <div className="text-xs text-muted-foreground">{match.employee.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{match.user.name}</div>
                          <div className="text-sm text-muted-foreground">{match.user.email}</div>
                          <div className="text-xs text-muted-foreground">{match.user.role}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {match.reasons.map((reason, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getConfidenceBadge(match.confidence)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{match.score}</div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 批量处理对话框 */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量关联进度</DialogTitle>
            <DialogDescription>
              正在批量关联员工和用户账号...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Progress value={batchProgress} className="w-full" />
            <div className="text-center text-sm text-muted-foreground">
              {batchProcessing ? "处理中..." : "完成"}
            </div>
          </div>
          {!batchProcessing && (
            <DialogFooter>
              <Button onClick={() => setShowBatchDialog(false)}>
                关闭
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
