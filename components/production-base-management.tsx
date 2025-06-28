'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Plus, Search, Eye, Edit, MapPin, Star, Users, Clock } from 'lucide-react';
import { AddProductionBaseDialog } from './add-production-base-dialog';

interface ProductionBase {
  id: number;
  name: string;
  code: string;
  location: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  specialties: string[];
  capacity?: number;
  leadTime?: number;
  qualityRating?: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // 统计数据
  activeOrders?: number;
  completedOrders?: number;
  averageQuality?: number;
}

export function ProductionBaseManagement() {
  const [productionBases, setProductionBases] = useState<ProductionBase[]>([]);
  const [filteredBases, setFilteredBases] = useState<ProductionBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    loadProductionBases();
  }, []);

  useEffect(() => {
    let filtered = productionBases;

    // 根据搜索词筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(base =>
        base.name.toLowerCase().includes(query) ||
        base.location.toLowerCase().includes(query) ||
        base.specialties.some(specialty => specialty.toLowerCase().includes(query))
      );
    }

    setFilteredBases(filtered);
  }, [productionBases, searchQuery]);

  const loadProductionBases = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/production/bases');
      if (response.ok) {
        const data = await response.json();
        setProductionBases(data);
        setFilteredBases(data);
      } else {
        throw new Error('Failed to fetch production bases');
      }
    } catch (error) {
      console.error('Error loading production bases:', error);
      toast({
        title: '加载失败',
        description: '无法加载生产基地数据',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderQualityStars = (rating?: number) => {
    if (!rating) return '-';
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
      }
    }

    return (
      <div className="flex items-center space-x-1">
        <div className="flex">{stars}</div>
        <span className="text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>生产基地管理</CardTitle>
              <CardDescription>管理合作的生产基地信息和能力</CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新增生产基地
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索基地名称、位置或专长..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : filteredBases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? '没有找到匹配的生产基地' : '暂无生产基地数据'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>基地信息</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>专长工艺</TableHead>
                  <TableHead>产能信息</TableHead>
                  <TableHead>质量评级</TableHead>
                  <TableHead>订单统计</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBases.map((base) => (
                  <TableRow key={base.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{base.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {base.location}
                        </div>
                        <div className="text-xs text-gray-400">编码: {base.code}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {base.contactName && <div className="font-medium">{base.contactName}</div>}
                        {base.contactPhone && <div className="text-gray-600">{base.contactPhone}</div>}
                        {base.contactEmail && <div className="text-gray-600">{base.contactEmail}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {base.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {base.capacity && (
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            月产能: {base.capacity} 件
                          </div>
                        )}
                        {base.leadTime && (
                          <div className="flex items-center text-gray-600">
                            <Clock className="h-3 w-3 mr-1" />
                            周期: {base.leadTime} 天
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderQualityStars(base.qualityRating)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>进行中: {base.activeOrders || 0}</div>
                        <div className="text-gray-600">已完成: {base.completedOrders || 0}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={base.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {base.isActive ? '活跃' : '停用'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="icon" title="查看详情">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="编辑基地">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 新增生产基地对话框 */}
      <AddProductionBaseDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onBaseAdded={loadProductionBases}
      />
    </div>
  );
}
