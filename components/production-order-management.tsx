'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Plus, Search, Eye, Edit, Truck, Package, Factory, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { AddProductionOrderDialog } from './add-production-order-dialog';
import { getProductionOrders } from '@/lib/actions/production-actions';

interface ProductionOrder {
  id: number;
  orderNumber: string;
  productionBase: {
    name: string;
    location: string;
  };
  employee: {
    name: string;
  };
  status: string;
  priority: string;
  orderDate: string;
  expectedStartDate?: string;
  expectedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: string;
  items: {
    product: { name: string };
    quantity: number;
    specifications?: string;
    completedQuantity: number;
    qualityStatus: string;
  }[];
}

const statusConfig = {
  pending: { label: '待确认', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  in_production: { label: '生产中', color: 'bg-purple-100 text-purple-800', icon: Factory },
  quality_check: { label: '质检中', color: 'bg-orange-100 text-orange-800', icon: Package },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  shipped: { label: '已发货', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

const priorityConfig = {
  urgent: { label: '紧急', color: 'bg-red-100 text-red-800' },
  high: { label: '高', color: 'bg-orange-100 text-orange-800' },
  normal: { label: '普通', color: 'bg-gray-100 text-gray-800' },
  low: { label: '低', color: 'bg-green-100 text-green-800' },
};

export function ProductionOrderManagement() {
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ProductionOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    loadProductionOrders();
  }, []);

  useEffect(() => {
    let filtered = productionOrders;

    // 根据状态筛选
    if (currentTab !== 'all') {
      filtered = filtered.filter(order => order.status === currentTab);
    }

    // 根据搜索词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.productionBase.name.toLowerCase().includes(query) ||
        order.employee.name.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  }, [productionOrders, searchQuery, currentTab]);

  const loadProductionOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getProductionOrders();
      setProductionOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Error loading production orders:', error);
      toast({
        title: '加载失败',
        description: '无法加载生产订单数据',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStats = () => {
    const stats = {
      all: productionOrders.length,
      pending: 0,
      confirmed: 0,
      in_production: 0,
      quality_check: 0,
      completed: 0,
      shipped: 0,
    };

    productionOrders.forEach(order => {
      if (stats.hasOwnProperty(order.status)) {
        stats[order.status as keyof typeof stats]++;
      }
    });

    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>生产订单管理</CardTitle>
              <CardDescription>管理发送到生产基地的制作订单</CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新建生产订单
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索订单号、生产基地或负责人..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-auto">
              <TabsList>
                <TabsTrigger value="all">全部 ({stats.all})</TabsTrigger>
                <TabsTrigger value="pending">待确认 ({stats.pending})</TabsTrigger>
                <TabsTrigger value="in_production">生产中 ({stats.in_production})</TabsTrigger>
                <TabsTrigger value="quality_check">质检中 ({stats.quality_check})</TabsTrigger>
                <TabsTrigger value="completed">已完成 ({stats.completed})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || currentTab !== 'all' ? '没有找到匹配的订单' : '暂无生产订单数据'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>生产基地</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>下单日期</TableHead>
                  <TableHead>预计完成</TableHead>
                  <TableHead className="text-right">订单金额</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const statusInfo = statusConfig[order.status as keyof typeof statusConfig];
                  const priorityInfo = priorityConfig[order.priority as keyof typeof priorityConfig];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.productionBase.name}</div>
                          <div className="text-sm text-gray-500">{order.productionBase.location}</div>
                        </div>
                      </TableCell>
                      <TableCell>{order.employee.name}</TableCell>
                      <TableCell>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityInfo.color}>
                          {priorityInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(order.orderDate), 'yyyy-MM-dd')}</TableCell>
                      <TableCell>
                        {order.expectedEndDate ? format(new Date(order.expectedEndDate), 'yyyy-MM-dd') : '-'}
                      </TableCell>
                      <TableCell className="text-right">¥{order.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button variant="ghost" size="icon" title="查看详情">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="编辑订单">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 新增生产订单对话框 */}
      <AddProductionOrderDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onOrderAdded={loadProductionOrders}
      />
    </div>
  );
}
