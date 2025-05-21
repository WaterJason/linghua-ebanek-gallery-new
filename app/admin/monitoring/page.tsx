/**
 * 系统监控仪表板页面
 * 
 * 显示系统健康状态和性能指标
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HealthStatus, SystemComponent } from '@/lib/monitoring';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Database, 
  Server, 
  Clock, 
  RefreshCw,
  Activity
} from 'lucide-react';

// 健康状态图标映射
const statusIcons = {
  [HealthStatus.HEALTHY]: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  [HealthStatus.DEGRADED]: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  [HealthStatus.UNHEALTHY]: <XCircle className="h-5 w-5 text-red-500" />,
};

// 组件图标映射
const componentIcons = {
  [SystemComponent.DATABASE]: <Database className="h-5 w-5" />,
  [SystemComponent.API]: <Server className="h-5 w-5" />,
  [SystemComponent.CACHE]: <Clock className="h-5 w-5" />,
  [SystemComponent.STORAGE]: <Server className="h-5 w-5" />,
  [SystemComponent.AUTHENTICATION]: <CheckCircle2 className="h-5 w-5" />,
  [SystemComponent.SYSTEM]: <Server className="h-5 w-5" />,
};

// 健康状态颜色映射
const statusColors = {
  [HealthStatus.HEALTHY]: 'bg-green-100 text-green-800',
  [HealthStatus.DEGRADED]: 'bg-yellow-100 text-yellow-800',
  [HealthStatus.UNHEALTHY]: 'bg-red-100 text-red-800',
};

/**
 * 系统监控仪表板页面组件
 */
export default function MonitoringPage() {
  // 健康状态
  const [healthStatus, setHealthStatus] = useState<any>(null);
  // 加载状态
  const [loading, setLoading] = useState<boolean>(true);
  // 错误状态
  const [error, setError] = useState<string | null>(null);
  // 自动刷新间隔（毫秒）
  const [refreshInterval, setRefreshInterval] = useState<number>(30000);
  // 上次刷新时间
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // 获取系统健康状态
  const fetchHealthStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (data.success) {
        setHealthStatus(data.data);
        setError(null);
      } else {
        setError(data.error?.message || '获取健康状态失败');
      }
    } catch (err) {
      setError('获取健康状态失败');
      console.error('Error fetching health status:', err);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  // 手动刷新
  const handleRefresh = () => {
    fetchHealthStatus();
  };

  // 初始加载和定时刷新
  useEffect(() => {
    fetchHealthStatus();
    
    // 设置定时刷新
    const intervalId = setInterval(fetchHealthStatus, refreshInterval);
    
    // 清理定时器
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">系统监控仪表板</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            上次刷新: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="health">
        <TabsList className="mb-6">
          <TabsTrigger value="health">系统健康</TabsTrigger>
          <TabsTrigger value="performance">性能指标</TabsTrigger>
          <TabsTrigger value="logs">系统日志</TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          {healthStatus && (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {statusIcons[healthStatus.status]}
                    系统健康状态
                    <Badge className={statusColors[healthStatus.status]}>
                      {healthStatus.status === HealthStatus.HEALTHY && '健康'}
                      {healthStatus.status === HealthStatus.DEGRADED && '性能下降'}
                      {healthStatus.status === HealthStatus.UNHEALTHY && '不健康'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">
                    最后检查时间: {new Date(healthStatus.timestamp).toLocaleString()}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {healthStatus.components.map((component: any, index: number) => (
                      <Card key={index}>
                        <CardHeader className="py-4">
                          <CardTitle className="text-base flex items-center gap-2">
                            {componentIcons[component.component]}
                            {component.component === SystemComponent.DATABASE && '数据库'}
                            {component.component === SystemComponent.API && 'API'}
                            {component.component === SystemComponent.CACHE && '缓存'}
                            {component.component === SystemComponent.STORAGE && '存储'}
                            {component.component === SystemComponent.AUTHENTICATION && '认证'}
                            {component.component === SystemComponent.SYSTEM && '系统'}
                            <Badge className={statusColors[component.status]}>
                              {component.status === HealthStatus.HEALTHY && '健康'}
                              {component.status === HealthStatus.DEGRADED && '性能下降'}
                              {component.status === HealthStatus.UNHEALTHY && '不健康'}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2">
                          {component.details && (
                            <div className="text-sm">
                              {component.details.responseTime && (
                                <p>响应时间: {component.details.responseTime}ms</p>
                              )}
                              {component.details.error && (
                                <p className="text-red-500">错误: {component.details.error}</p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                性能指标
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500">
                性能指标功能正在开发中...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                系统日志
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500">
                系统日志功能正在开发中...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
