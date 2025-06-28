'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Package, Truck, Factory, CheckCircle, AlertTriangle, ArrowRight, MapPin } from 'lucide-react';
import { SupplyChainFlow } from '@/components/supply-chain-flow';

interface InventoryItem {
  id: number;
  product: {
    name: string;
    sku?: string;
  };
  warehouse: {
    name: string;
    type: string;
    location?: string;
  };
  quantity: number;
  status: string; // raw_material, in_transit, in_production, quality_check, finished, packaged
}

interface InventoryTransaction {
  id: number;
  type: string;
  product: {
    name: string;
  };
  sourceWarehouse?: {
    name: string;
  };
  targetWarehouse?: {
    name: string;
  };
  quantity: number;
  qualityStatus?: string;
  createdAt: string;
  notes?: string;
}

const statusConfig = {
  raw_material: { label: '原材料', color: 'bg-gray-100 text-gray-800', icon: Package },
  in_transit: { label: '在途', color: 'bg-blue-100 text-blue-800', icon: Truck },
  in_production: { label: '生产中', color: 'bg-purple-100 text-purple-800', icon: Factory },
  quality_check: { label: '质检中', color: 'bg-orange-100 text-orange-800', icon: CheckCircle },
  finished: { label: '成品', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  packaged: { label: '已包装', color: 'bg-indigo-100 text-indigo-800', icon: Package },
  exception: { label: '异常', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

const warehouseTypeConfig = {
  physical: { label: '实体仓库', icon: Package },
  virtual: { label: '虚拟仓库', icon: Factory },
  production_base: { label: '生产基地', icon: Factory },
};

export function SupplyChainInventory() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setIsLoading(true);
    try {
      // 获取真实库存数据
      const inventoryResponse = await fetch('/api/inventory');
      const inventoryData = await inventoryResponse.json();

      // 获取库存交易记录
      const transactionsResponse = await fetch('/api/inventory/transactions');
      const transactionsData = await transactionsResponse.json();

      // 转换数据格式以匹配组件期望的结构
      const formattedInventory: InventoryItem[] = inventoryData.map((item: any) => ({
        id: item.id,
        product: {
          name: item.product.name,
          sku: item.product.sku || ''
        },
        warehouse: {
          name: item.warehouse.name,
          type: item.warehouse.type,
          location: item.warehouse.location || ''
        },
        quantity: item.quantity,
        status: getSupplyChainStatus(item.warehouse.type, item.product.material)
      }));

      const formattedTransactions: InventoryTransaction[] = transactionsData.map((transaction: any) => ({
        id: transaction.id,
        type: transaction.type,
        product: { name: transaction.product.name },
        sourceWarehouse: transaction.sourceWarehouse ? { name: transaction.sourceWarehouse.name } : undefined,
        targetWarehouse: transaction.targetWarehouse ? { name: transaction.targetWarehouse.name } : undefined,
        quantity: transaction.quantity,
        createdAt: transaction.createdAt,
        notes: transaction.notes || '',
        qualityStatus: transaction.qualityStatus
      }));

      setInventoryItems(formattedInventory);
      setTransactions(formattedTransactions);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading inventory data:', error);
      toast({
        title: '加载失败',
        description: '无法加载库存数据',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // 根据仓库类型和产品材质确定供应链状态
  const getSupplyChainStatus = (warehouseType: string, material?: string) => {
    if (warehouseType === 'production_base') {
      return 'in_production';
    }
    if (material && material.includes('底胎')) {
      return 'raw_material';
    }
    if (material && material.includes('珐琅')) {
      return 'finished';
    }
    return 'raw_material';
  };

  const getInventoryByStatus = () => {
    const statusStats = {
      raw_material: 0,
      in_transit: 0,
      in_production: 0,
      quality_check: 0,
      finished: 0,
      packaged: 0,
    };

    inventoryItems.forEach(item => {
      if (statusStats.hasOwnProperty(item.status)) {
        statusStats[item.status as keyof typeof statusStats] += item.quantity;
      }
    });

    return statusStats;
  };

  const stats = getInventoryByStatus();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 供应链库存概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(stats).map(([status, quantity]) => {
          const config = statusConfig[status as keyof typeof statusConfig];
          const Icon = config.icon;
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">{config.label}</p>
                    <p className="text-2xl font-bold">{quantity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">库存分布</TabsTrigger>
          <TabsTrigger value="transactions">库存流转</TabsTrigger>
          <TabsTrigger value="flow">供应链流程</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>供应链库存分布</CardTitle>
              <CardDescription>各环节的库存状态和分布情况</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>产品</TableHead>
                    <TableHead>仓库位置</TableHead>
                    <TableHead>仓库类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">数量</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems.map((item) => {
                    const statusInfo = statusConfig[item.status as keyof typeof statusConfig];
                    const warehouseInfo = warehouseTypeConfig[item.warehouse.type as keyof typeof warehouseTypeConfig];
                    const StatusIcon = statusInfo.icon;
                    const WarehouseIcon = warehouseInfo.icon;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product.name}</div>
                            {item.product.sku && (
                              <div className="text-sm text-gray-500">SKU: {item.product.sku}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{item.warehouse.name}</div>
                              {item.warehouse.location && (
                                <div className="text-sm text-gray-500">{item.warehouse.location}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <WarehouseIcon className="h-4 w-4 text-gray-600" />
                            <span>{warehouseInfo.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>库存流转记录</CardTitle>
              <CardDescription>供应链各环节的库存变动记录</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>操作类型</TableHead>
                    <TableHead>产品</TableHead>
                    <TableHead>流转路径</TableHead>
                    <TableHead>数量</TableHead>
                    <TableHead>质检状态</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.createdAt).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.type === 'production_out' && '发往生产'}
                          {transaction.type === 'production_in' && '生产入库'}
                          {transaction.type === 'quality_check' && '质量检验'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{transaction.product.name}</TableCell>
                      <TableCell>
                        {transaction.sourceWarehouse && transaction.targetWarehouse ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{transaction.sourceWarehouse.name}</span>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{transaction.targetWarehouse.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{transaction.quantity}</TableCell>
                      <TableCell>
                        {transaction.qualityStatus && (
                          <Badge
                            className={
                              transaction.qualityStatus === 'passed'
                                ? 'bg-green-100 text-green-800'
                                : transaction.qualityStatus === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {transaction.qualityStatus === 'passed' && '通过'}
                            {transaction.qualityStatus === 'failed' && '不合格'}
                            {transaction.qualityStatus === 'pending' && '待检'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {transaction.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flow" className="space-y-4">
          <SupplyChainFlow />
        </TabsContent>
      </Tabs>
    </div>
  );
}
