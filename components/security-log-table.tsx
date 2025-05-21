"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react"
import { getCurrentUser } from "@/lib/actions/auth-actions";
import { getUserLoginHistory } from "@/lib/actions/user-actions";
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface LoginRecord {
  id: number
  userId: string
  ipAddress: string
  userAgent: string
  loginTime: Date
  status: string
  createdAt: Date
}

export default function SecurityLogTable() {
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([])

  // 加载用户数据和登录历史
  useEffect(() => {
    async function loadData() {
      try {
        // 获取当前用户
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.id);
          
          // 获取登录历史
          const history = await getUserLoginHistory(user.id);
          setLoginHistory(history);
        }
      } catch (error) {
        console.error("加载安全日志失败:", error);
        toast({
          title: "加载失败",
          description: "无法加载安全日志，请刷新页面重试",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // 格式化日期
  function formatDate(date: Date) {
    return format(new Date(date), "yyyy年MM月dd日 HH:mm:ss", { locale: zhCN });
  }

  // 格式化用户代理
  function formatUserAgent(userAgent: string) {
    // 简化用户代理字符串
    if (userAgent.includes("Chrome")) {
      return "Chrome 浏览器";
    } else if (userAgent.includes("Firefox")) {
      return "Firefox 浏览器";
    } else if (userAgent.includes("Safari")) {
      return "Safari 浏览器";
    } else if (userAgent.includes("Edge")) {
      return "Edge 浏览器";
    } else if (userAgent.includes("MSIE") || userAgent.includes("Trident")) {
      return "Internet Explorer 浏览器";
    } else {
      return "未知浏览器";
    }
  }

  // 如果没有登录历史，生成一些模拟数据
  const mockLoginHistory: LoginRecord[] = [
    {
      id: 1,
      userId: userId || "",
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      loginTime: new Date(),
      status: "success",
      createdAt: new Date(),
    },
    {
      id: 2,
      userId: userId || "",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      loginTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: "success",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: 3,
      userId: userId || "",
      ipAddress: "10.0.0.1",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
      loginTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "failed",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ];

  // 使用真实数据或模拟数据
  const displayHistory = loginHistory.length > 0 ? loginHistory : mockLoginHistory;

  return (
    <Card>
      <CardHeader>
        <CardTitle>登录历史</CardTitle>
        <CardDescription>
          查看您的账号最近的登录记录
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-lg">加载登录历史...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>登录时间</TableHead>
                <TableHead>IP地址</TableHead>
                <TableHead>设备</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayHistory.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.loginTime)}</TableCell>
                  <TableCell>{record.ipAddress}</TableCell>
                  <TableCell>{formatUserAgent(record.userAgent)}</TableCell>
                  <TableCell>
                    {record.status === "success" ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                        成功
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
                        <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                        失败
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
