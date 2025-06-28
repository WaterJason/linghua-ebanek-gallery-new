"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { 
  ArrowRight, 
  Package, 
  Truck, 
  Factory, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Calendar,
  BarChart3
} from "lucide-react"

interface ProductionOrder {
  id: number;
  productName: string;
  quantity: number;
  status: string;
  currentStage: string;
  progress: number;
  estimatedCompletion: string;
  actualCompletion?: string;
  qualityStatus?: string;
  location: string;
  assignedTo?: string;
  notes?: string;
}

interface FlowStage {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  duration: string;
  location: string;
}

const flowStages: FlowStage[] = [
  {
    id: 'design',
    name: '产品设计',
    description: '产品设计与规格确定',
    icon: Package,
    color: 'bg-blue-100 text-blue-800',
    duration: '1-2天',
    location: '广州设计中心'
  },
  {
    id: 'material_procurement',
    name: '底胎采购',
    description: '底胎材料采购或定制',
    icon: Package,
    color: 'bg-purple-100 text-purple-800',
    duration: '3-5天',
    location: '供应商'
  },
  {
    id: 'shipping_to_production',
    name: '寄送生产基地',
    description: '材料运输至广西生产基地',
    icon: Truck,
    color: 'bg-orange-100 text-orange-800',
    duration: '1-2天',
    location: '物流运输'
  },
  {
    id: 'production',
    name: '工艺制作',
    description: '掐丝珐琅工艺制作',
    icon: Factory,
    color: 'bg-green-100 text-green-800',
    duration: '7-15天',
    location: '广西生产基地'
  },
  {
    id: 'quality_check',
    name: '质量检验',
    description: '产品质量检验与验收',
    icon: CheckCircle,
    color: 'bg-teal-100 text-teal-800',
    duration: '1-2天',
    location: '广西生产基地'
  },
  {
    id: 'shipping_back',
    name: '寄回广州',
    description: '成品运输回广州',
    icon: Truck,
    color: 'bg-orange-100 text-orange-800',
    duration: '1-2天',
    location: '物流运输'
  },
  {
    id: 'packaging',
    name: '配饰装裱包装',
    description: '最终包装与配饰装裱',
    icon: Package,
    color: 'bg-indigo-100 text-indigo-800',
    duration: '1-3天',
    location: '广州包装中心'
  },
  {
    id: 'sales',
    name: '渠道销售',
    description: '产品销售与配送',
    icon: CheckCircle,
    color: 'bg-emerald-100 text-emerald-800',
    duration: '持续',
    location: '各销售渠道'
  }
];

export function SupplyChainFlow() {
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProductionOrders();
  }, []);

  const loadProductionOrders = async () => {
    setIsLoading(true);
    try {
      // 模拟生产订单数据 - 实际应该从API获取
      const mockOrders: ProductionOrder[] = [
        {
          id: 1,
          productName: "龙凤呈祥珐琅盘",
          quantity: 50,
          status: "in_production",
          currentStage: "production",
          progress: 65,
          estimatedCompletion: "2024-01-15",
          location: "广西生产基地",
          assignedTo: "李师傅",
          notes: "工艺复杂，需要额外时间"
        },
        {
          id: 2,
          productName: "花鸟图珐琅瓶",
          quantity: 30,
          status: "quality_check",
          currentStage: "quality_check",
          progress: 85,
          estimatedCompletion: "2024-01-12",
          location: "广西生产基地",
          assignedTo: "王检验员",
          qualityStatus: "pending"
        },
        {
          id: 3,
          productName: "山水画珐琅屏风",
          quantity: 20,
          status: "shipping_back",
          currentStage: "shipping_back",
          progress: 90,
          estimatedCompletion: "2024-01-10",
          location: "运输中",
          notes: "预计明天到达广州"
        },
        {
          id: 4,
          productName: "牡丹花珐琅首饰盒",
          quantity: 100,
          status: "design",
          currentStage: "design",
          progress: 20,
          estimatedCompletion: "2024-01-25",
          location: "广州设计中心",
          assignedTo: "张设计师"
        }
      ];

      setProductionOrders(mockOrders);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading production orders:', error);
      toast({
        title: '加载失败',
        description: '无法加载生产订单数据',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const getStageIndex = (stageId: string) => {
    return flowStages.findIndex(stage => stage.id === stageId);
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      'design': 'bg-blue-500',
      'material_procurement': 'bg-purple-500',
      'shipping_to_production': 'bg-orange-500',
      'in_production': 'bg-green-500',
      'quality_check': 'bg-teal-500',
      'shipping_back': 'bg-orange-500',
      'packaging': 'bg-indigo-500',
      'completed': 'bg-emerald-500',
      'exception': 'bg-red-500'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>供应链流程图</CardTitle>
          <CardDescription>聆花掐丝珐琅馆产品从设计到销售的完整流程</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 流程图 */}
          <div className="relative">
            <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
              {flowStages.map((stage, index) => (
                <div key={stage.id} className="flex items-center min-w-0 flex-shrink-0">
                  <div className="flex flex-col items-center text-center min-w-[120px]">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stage.color} mb-2`}>
                      <stage.icon className="h-6 w-6" />
                    </div>
                    <div className="text-sm font-medium mb-1">{stage.name}</div>
                    <div className="text-xs text-muted-foreground mb-1">{stage.duration}</div>
                    <div className="text-xs text-muted-foreground">{stage.location}</div>
                  </div>
                  {index < flowStages.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-4 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList>
          <TabsTrigger value="orders">生产订单</TabsTrigger>
          <TabsTrigger value="analytics">流程分析</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>当前生产订单</CardTitle>
              <CardDescription>跟踪各个生产订单在供应链中的位置和进度</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productionOrders.map((order) => {
                  const currentStageIndex = getStageIndex(order.currentStage);
                  const currentStage = flowStages[currentStageIndex];
                  
                  return (
                    <div key={order.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{order.productName}</h4>
                          <p className="text-sm text-muted-foreground">数量: {order.quantity}件</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {currentStage?.name || order.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>进度</span>
                          <span>{order.progress}%</span>
                        </div>
                        <Progress value={order.progress} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{order.location}</span>
                        </div>
                        {order.assignedTo && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{order.assignedTo}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>预计: {order.estimatedCompletion}</span>
                        </div>
                        {order.qualityStatus && (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <span>质检: {order.qualityStatus === 'pending' ? '待检验' : order.qualityStatus}</span>
                          </div>
                        )}
                      </div>
                      
                      {order.notes && (
                        <div className="mt-3 p-2 bg-muted rounded text-sm">
                          <strong>备注:</strong> {order.notes}
                        </div>
                      )}
                      
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                          查看详情
                        </Button>
                        <Button size="sm" variant="outline">
                          更新状态
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">总订单数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{productionOrders.length}</div>
                <p className="text-xs text-muted-foreground">当前活跃订单</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">平均进度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(productionOrders.reduce((sum, order) => sum + order.progress, 0) / productionOrders.length)}%
                </div>
                <p className="text-xs text-muted-foreground">整体完成度</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">生产中订单</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {productionOrders.filter(order => order.status === 'in_production').length}
                </div>
                <p className="text-xs text-muted-foreground">正在制作</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">待质检订单</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {productionOrders.filter(order => order.status === 'quality_check').length}
                </div>
                <p className="text-xs text-muted-foreground">等待检验</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>流程效率分析</CardTitle>
              <CardDescription>各阶段平均耗时和瓶颈分析</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>流程效率分析功能开发中...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
