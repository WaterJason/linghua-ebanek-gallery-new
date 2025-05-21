"use client"

import { useState } from 'react'
import { PerformanceDashboard } from '@/components/monitoring/performance-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { AlertCircleIcon, InfoIcon, SaveIcon } from 'lucide-react'

/**
 * 性能监控设置页面
 */
export default function PerformanceMonitoringPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [settings, setSettings] = useState({
    enablePerformanceMonitoring: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true',
    enableServerLogging: process.env.NEXT_PUBLIC_ENABLE_SERVER_LOGGING === 'true',
    maxMetricsCount: 1000,
    maxStorageAgeDays: 7,
    samplingRate: 100, // 百分比
  })
  
  // 保存设置
  const saveSettings = () => {
    // 在实际应用中，这里应该调用API保存设置
    toast({
      title: '设置已保存',
      description: '性能监控设置已成功保存。',
    })
  }
  
  // 清除所有性能数据
  const clearAllData = () => {
    if (confirm('确定要清除所有性能数据吗？此操作不可撤销。')) {
      // 在实际应用中，这里应该调用API清除数据
      toast({
        title: '数据已清除',
        description: '所有性能数据已成功清除。',
      })
    }
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold tracking-tight">性能监控</h1>
        <Button onClick={saveSettings}>
          <SaveIcon className="h-4 w-4 mr-2" />
          保存设置
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">性能仪表板</TabsTrigger>
          <TabsTrigger value="settings">监控设置</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6">
          <PerformanceDashboard />
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本设置</CardTitle>
              <CardDescription>
                配置性能监控的基本设置，包括启用/禁用监控、数据存储等。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableMonitoring">启用性能监控</Label>
                  <p className="text-sm text-muted-foreground">
                    启用后，系统将收集性能指标，包括页面加载时间、组件渲染时间等。
                  </p>
                </div>
                <Switch
                  id="enableMonitoring"
                  checked={settings.enablePerformanceMonitoring}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, enablePerformanceMonitoring: checked })
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableServerLogging">启用服务器日志</Label>
                  <p className="text-sm text-muted-foreground">
                    启用后，性能指标将发送到服务器进行长期存储和分析。
                  </p>
                </div>
                <Switch
                  id="enableServerLogging"
                  checked={settings.enableServerLogging}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, enableServerLogging: checked })
                  }
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxMetricsCount">最大指标数量</Label>
                  <Input
                    id="maxMetricsCount"
                    type="number"
                    value={settings.maxMetricsCount}
                    onChange={(e) => 
                      setSettings({ 
                        ...settings, 
                        maxMetricsCount: parseInt(e.target.value) || 1000 
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    本地存储的最大指标数量，超过此数量将删除最旧的指标。
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxStorageAgeDays">最大存储天数</Label>
                  <Input
                    id="maxStorageAgeDays"
                    type="number"
                    value={settings.maxStorageAgeDays}
                    onChange={(e) => 
                      setSettings({ 
                        ...settings, 
                        maxStorageAgeDays: parseInt(e.target.value) || 7 
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    本地存储的指标最大保留天数，超过此天数将被自动删除。
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="samplingRate">采样率 (%)</Label>
                  <Input
                    id="samplingRate"
                    type="number"
                    min="1"
                    max="100"
                    value={settings.samplingRate}
                    onChange={(e) => 
                      setSettings({ 
                        ...settings, 
                        samplingRate: parseInt(e.target.value) || 100 
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    性能指标的采样率，100% 表示收集所有指标，较低的值可减少性能开销。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>数据管理</CardTitle>
              <CardDescription>
                管理已收集的性能数据，包括导出、清除等操作。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-4 p-4 rounded-md bg-muted">
                <AlertCircleIcon className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">注意</p>
                  <p className="text-sm text-muted-foreground">
                    清除性能数据是不可逆操作，一旦清除将无法恢复。请确保在清除前已导出需要保留的数据。
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button variant="destructive" onClick={clearAllData}>
                  清除所有性能数据
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>性能优化建议</CardTitle>
              <CardDescription>
                基于收集的性能数据，系统提供的性能优化建议。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 rounded-md bg-muted">
                  <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">启用性能监控</p>
                    <p className="text-sm text-muted-foreground">
                      启用性能监控可以帮助您发现系统中的性能瓶颈，但也会带来一定的性能开销。
                      建议在开发和测试环境中启用，在生产环境中使用较低的采样率。
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 rounded-md bg-muted">
                  <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">关注关键指标</p>
                    <p className="text-sm text-muted-foreground">
                      重点关注页面加载时间、首次内容绘制、最大内容绘制等关键指标，
                      这些指标直接影响用户体验。如果这些指标表现不佳，应优先进行优化。
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 rounded-md bg-muted">
                  <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">定期分析性能数据</p>
                    <p className="text-sm text-muted-foreground">
                      建议定期分析性能数据，识别性能趋势和异常，及时发现并解决性能问题。
                      可以设置性能预警，当关键指标超过阈值时及时通知相关人员。
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
