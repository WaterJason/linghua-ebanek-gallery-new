'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { CalendarIcon, Plus, X } from 'lucide-react';
// import { format as formatDate } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { createProductionOrder, getProductionBases } from '@/lib/actions/production-actions';
import { getEmployees } from '@/lib/actions/employee-actions';
import { getProducts } from "@/lib/actions/product-actions";

// 导入增强操作系统
import { useEnhancedOperations } from "@/lib/enhanced-operations"

interface AddProductionOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderAdded: () => void;
}

interface ProductionBase {
  id: number;
  name: string;
  location: string;
}

interface Employee {
  id: number;
  name: string;
}

interface Artwork {
  id: number;
  name: string;
}

interface OrderItem {
  productId: string;
  quantity: string;
  specifications: string;
}

export function AddProductionOrderDialog({ open, onOpenChange, onOrderAdded }: AddProductionOrderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productionBases, setProductionBases] = useState<ProductionBase[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Artwork[]>([]);

  // 增强操作系统
  const enhancedOps = useEnhancedOperations('production')
  const [formData, setFormData] = useState({
    productionBaseId: '',
    employeeId: '',
    expectedStartDate: undefined as Date | undefined,
    expectedEndDate: undefined as Date | undefined,
    priority: 'normal',
    totalAmount: '',
    shippingMethod: '',
    notes: '',
    items: [{ productId: '', quantity: '1', specifications: '' }] as OrderItem[],
  });

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      // 加载生产基地
      const basesData = await getProductionBases();
      setProductionBases(basesData.map(base => ({
        id: base.id,
        name: base.name,
        location: base.location,
      })));

      // 加载员工
      const employeesData = await getEmployees();
      setEmployees(employeesData.map(emp => ({
        id: emp.id,
        name: emp.name,
      })));

      // 加载产品
      const productsData = await getProducts();
      setProducts(productsData.map(prod => ({
        id: prod.id,
        name: prod.name,
      })));
    } catch (error) {
      console.error('Error loading data:', error);
      // 如果加载失败，使用模拟数据作为fallback
      setProductionBases([
        { id: 1, name: '广西生产基地', location: '广西南宁' },
        { id: 2, name: '北京工艺坊', location: '北京朝阳' },
      ]);

      setEmployees([
        { id: 1, name: '张三' },
        { id: 2, name: '李四' },
        { id: 3, name: '王五' },
      ]);

      setProducts([
        { id: 1, name: '掐丝珐琅手镯' },
        { id: 2, name: '掐丝珐琅项链' },
        { id: 3, name: '掐丝珐琅耳环' },
        { id: 4, name: '掐丝珐琅胸针' },
        { id: 5, name: '掐丝珐琅戒指' },
      ]);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: '1', specifications: '' }],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productionBaseId || !formData.employeeId || !formData.totalAmount) {
      toast({
        title: '验证失败',
        description: '请填写必填字段：生产基地、负责人、订单金额',
      });
      return;
    }

    // 验证订单项
    const validItems = formData.items.filter(item => item.productId && item.quantity);
    if (validItems.length === 0) {
      toast({
        title: '验证失败',
        description: '请至少添加一个有效的产品项',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        productionBaseId: parseInt(formData.productionBaseId),
        employeeId: parseInt(formData.employeeId),
        expectedStartDate: formData.expectedStartDate,
        expectedEndDate: formData.expectedEndDate,
        priority: formData.priority,
        totalAmount: parseFloat(formData.totalAmount),
        shippingMethod: formData.shippingMethod,
        notes: formData.notes,
        items: validItems.map(item => ({
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          specifications: item.specifications,
        })),
      };

      await enhancedOps.create('生产订单').form(
        async () => {
          return await createProductionOrder(submitData)
        },
        null,
        submitData,
        { canUndo: true }
      )

      // 重置表单
      setFormData({
        productionBaseId: '',
        employeeId: '',
        expectedStartDate: undefined,
        expectedEndDate: undefined,
        priority: 'normal',
        totalAmount: '',
        shippingMethod: '',
        notes: '',
        items: [{ productId: '', quantity: '1', specifications: '' }],
      });

      onOrderAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating production order:', error);
      // 错误已由增强操作系统处理
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新建生产订单</DialogTitle>
          <DialogDescription>
            创建新的生产订单，发送到生产基地进行制作
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productionBaseId">生产基地 *</Label>
              <Select value={formData.productionBaseId} onValueChange={(value) => handleInputChange('productionBaseId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择生产基地" />
                </SelectTrigger>
                <SelectContent>
                  {productionBases.map((base) => (
                    <SelectItem key={base.id} value={base.id.toString()}>
                      {base.name} ({base.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeId">负责人 *</Label>
              <Select value={formData.employeeId} onValueChange={(value) => handleInputChange('employeeId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择负责人" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>预计开始日期</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expectedStartDate ? formData.expectedStartDate.toISOString().split('T')[0] : '请选择日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.expectedStartDate}
                    onSelect={(date) => handleInputChange('expectedStartDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>预计完成日期</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expectedEndDate ? formData.expectedEndDate.toISOString().split('T')[0] : '请选择日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.expectedEndDate}
                    onSelect={(date) => handleInputChange('expectedEndDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">优先级</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">紧急</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="normal">普通</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalAmount">订单金额 *</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                placeholder="请输入订单金额"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingMethod">寄送方式</Label>
              <Input
                id="shippingMethod"
                value={formData.shippingMethod}
                onChange={(e) => handleInputChange('shippingMethod', e.target.value)}
                placeholder="请输入寄送方式"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>产品清单</Label>
              <Button type="button" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                添加产品
              </Button>
            </div>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Select value={item.productId} onValueChange={(value) => handleItemChange(index, 'productId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择产品" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      placeholder="数量"
                    />
                  </div>
                  <div className="col-span-5">
                    <Input
                      value={item.specifications}
                      onChange={(e) => handleItemChange(index, 'specifications', e.target.value)}
                      placeholder="工艺规格要求"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="请输入备注信息"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '创建中...' : '创建订单'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
