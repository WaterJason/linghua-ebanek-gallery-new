"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { 
  Package, 
  Truck, 
  Factory, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Calendar,
  RefreshCw,
  ArrowRight,
  Edit,
  Eye
} from "lucide-react"

interface SupplyChainItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  currentStage: string;
  status: string;
  progress: number;
  estimatedCompletion: string;
  actualCompletion?: string;
  location: string;
  assignedTo?: string;
  qualityStatus?: string;
  notes?: string;
  warehouseType: string;
  lastUpdated: string;
}

const stageConfig = {
  design: { 
    label: '产品设计', 
    color: 'bg-blue-100 text-blue-800', 
    icon: Package,
    progress: 10
  },
  material_procurement: { 
    label: '底胎采购', 
    color: 'bg-purple-100 text-purple-800', 
    icon: Package,
    progress: 20
  },
  shipping_to_production: { 
    label: '寄送生产基地', 
    color: 'bg-orange-100 text-orange-800', 
    icon: Truck,
    progress: 30
  },
  in_production: { 
    label: '工艺制作', 
    color: 'bg-green-100 text-green-800', 
    icon: Factory,
    progress: 60
  },
  quality_check: { 
    label: '质量检验', 
    color: 'bg-teal-100 text-teal-800', 
    icon: CheckCircle,
    progress: 80
  },
  shipping_back: { 
    label: '寄回广州', 
    color: 'bg-orange-100 text-orange-800', 
    icon: Truck,
    progress: 90
  },
  packaging: { 
    label: '配饰装裱包装', 
    color: 'bg-indigo-100 text-indigo-800', 
    icon: Package,
    progress: 95
  },
  completed: { 
    label: '已完成', 
    color: 'bg-emerald-100 text-emerald-800', 
    icon: CheckCircle,
    progress: 100
  },
  exception: { 
    label: '异常', 
    color: 'bg-red-100 text-red-800', 
    icon: AlertTriangle,
    progress: 0
  }
};

export function SupplyChainStatusTracker() {
  const [supplyChainItems, setSupplyChainItems] = useState<SupplyChainItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadSupplyChainData();
    // 设置定时刷新
    const interval = setInterval(loadSupplyChainData, 30000); // 每30秒刷新一次
    return () => clearInterval(interval);
  }, []);

  const loadSupplyChainData = async () => {
    try {
      // 从库存API获取数据并转换为供应链状态
      const inventoryResponse = await fetch('/api/inventory');
      const inventoryData = await inventoryResponse.json();

      // 转换库存数据为供应链跟踪数据
      const supplyChainData: SupplyChainItem[] = inventoryData.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        currentStage: getStageFromWarehouseType(item.warehouse.type),
        status: getStatusFromWarehouseType(item.warehouse.type),
        progress: getProgressFromWarehouseType(item.warehouse.type),
        estimatedCompletion: getEstimatedCompletion(item.warehouse.type),
        location: item.warehouse.name,
        assignedTo: getAssignedPerson(item.warehouse.type),
        qualityStatus: getQualityStatus(item.warehouse.type),
        notes: item.notes || '',
        warehouseType: item.warehouse.type,
        lastUpdated: item.updatedAt || new Date().toISOString()
      }));

      setSupplyChainItems(supplyChainData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading supply chain data:', error);
      toast({
        title: '加载失败',
        description: '无法加载供应链状态数据',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const getStageFromWarehouseType = (warehouseType: string) => {
    switch (warehouseType) {
      case 'physical': return 'design';
      case 'production_base': return 'in_production';
      case 'virtual': return 'packaging';
      default: return 'design';
    }
  };

  const getStatusFromWarehouseType = (warehouseType: string) => {
    switch (warehouseType) {
      case 'physical': return 'design';
      case 'production_base': return 'in_production';
      case 'virtual': return 'packaging';
      default: return 'design';
    }
  };

  const getProgressFromWarehouseType = (warehouseType: string) => {
    switch (warehouseType) {
      case 'physical': return 10;
      case 'production_base': return 60;
      case 'virtual': return 95;
      default: return 10;
    }
  };

  const getEstimatedCompletion = (warehouseType: string) => {
    const now = new Date();
    const days = warehouseType === 'production_base' ? 15 : 
                 warehouseType === 'virtual' ? 3 : 7;
    now.setDate(now.getDate() + days);
    return now.toISOString().split('T')[0];
  };

  const getAssignedPerson = (warehouseType: string) => {
    switch (warehouseType) {
      case 'physical': return '张设计师';
      case 'production_base': return '李师傅';
      case 'virtual': return '王包装员';
      default: return undefined;
    }
  };

  const getQualityStatus = (warehouseType: string) => {
    return warehouseType === 'production_base' ? 'pending' : undefined;
  };

  const updateItemStatus = async (itemId: number, newStage: string, notes?: string) => {
    try {
      // 这里应该调用API更新状态
      const response = await fetch(`/api/inventory/${itemId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stage: newStage,
          notes: notes || `状态更新为: ${stageConfig[newStage as keyof typeof stageConfig]?.label}`
        }),
      });

      if (response.ok) {
        toast({
          title: '状态更新成功',
          description: `已更新为: ${stageConfig[newStage as keyof typeof stageConfig]?.label}`,
        });
        loadSupplyChainData(); // 重新加载数据
      } else {
        throw new Error('更新失败');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: '更新失败',
        description: '无法更新供应链状态',
        variant: 'destructive',
      });
    }
  };

  const getFilteredItems = () => {
    if (selectedStage === 'all') {
      return supplyChainItems;
    }
    return supplyChainItems.filter(item => item.currentStage === selectedStage);
  };

  const getStageStats = () => {
    const stats = {};
    Object.keys(stageConfig).forEach(stage => {
      stats[stage] = supplyChainItems.filter(item => item.currentStage === stage).length;
    });
    return stats;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">加载中...</div>
      </div>
    );
  }

  const stats = getStageStats();
  const filteredItems = getFilteredItems();

  return (
    <div className="space-y-6">
      {/* 状态概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Object.entries(stageConfig).map(([stage, config]) => {
          const Icon = config.icon;
          const count = stats[stage] || 0;
          
          return (
            <Card 
              key={stage} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedStage === stage ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedStage(selectedStage === stage ? 'all' : stage)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">{config.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 供应链状态列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>供应链状态跟踪</CardTitle>
              <CardDescription>
                实时跟踪产品在供应链中的位置和状态
                {selectedStage !== 'all' && (
                  <span className="ml-2">
                    - 筛选: {stageConfig[selectedStage as keyof typeof stageConfig]?.label}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button onClick={loadSupplyChainData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>产品</TableHead>
                <TableHead>当前阶段</TableHead>
                <TableHead>进度</TableHead>
                <TableHead>位置</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>预计完成</TableHead>
                <TableHead>质检状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const stageInfo = stageConfig[item.currentStage as keyof typeof stageConfig];
                const StageIcon = stageInfo?.icon || Package;
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-muted-foreground">数量: {item.quantity}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={stageInfo?.color}>
                        <StageIcon className="h-3 w-3 mr-1" />
                        {stageInfo?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{item.progress}%</span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{item.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.assignedTo && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{item.assignedTo}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{item.estimatedCompletion}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.qualityStatus && (
                        <Badge
                          className={
                            item.qualityStatus === 'passed'
                              ? 'bg-green-100 text-green-800'
                              : item.qualityStatus === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {item.qualityStatus === 'passed' && '通过'}
                          {item.qualityStatus === 'failed' && '不合格'}
                          {item.qualityStatus === 'pending' && '待检验'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
