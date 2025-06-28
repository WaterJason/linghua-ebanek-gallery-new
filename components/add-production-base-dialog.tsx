'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';
import { createProductionBase } from '@/lib/actions/production-actions';

// 导入增强操作系统
import { useEnhancedOperations } from "@/lib/enhanced-operations"

interface AddProductionBaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBaseAdded: () => void;
}

export function AddProductionBaseDialog({ open, onOpenChange, onBaseAdded }: AddProductionBaseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 增强操作系统
  const enhancedOps = useEnhancedOperations('production')
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    specialties: [] as string[],
    capacity: '',
    leadTime: '',
    qualityRating: '',
    isActive: true,
    notes: '',
  });
  const [newSpecialty, setNewSpecialty] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()],
      }));
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.code || !formData.location) {
      toast({
        title: '验证失败',
        description: '请填写必填字段：名称、编码、位置',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        leadTime: formData.leadTime ? parseInt(formData.leadTime) : undefined,
        qualityRating: formData.qualityRating ? parseFloat(formData.qualityRating) : undefined,
      };

      await enhancedOps.create('生产基地').form(
        async () => {
          return await createProductionBase(submitData)
        },
        null,
        submitData,
        { canUndo: true }
      )

      // 重置表单
      setFormData({
        name: '',
        code: '',
        location: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        address: '',
        specialties: [],
        capacity: '',
        leadTime: '',
        qualityRating: '',
        isActive: true,
        notes: '',
      });

      onBaseAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating production base:', error);
      toast({
        title: '创建失败',
        description: '创建生产基地时出错',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增生产基地</DialogTitle>
          <DialogDescription>
            添加新的生产基地信息，包括联系方式和能力评估
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">基地名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="请输入基地名称"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">基地编码 *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="请输入基地编码"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">所在地区 *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="请输入所在地区"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">联系人</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                placeholder="请输入联系人"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">联系电话</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                placeholder="请输入联系电话"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">联系邮箱</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                placeholder="请输入联系邮箱"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">详细地址</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="请输入详细地址"
            />
          </div>

          <div className="space-y-2">
            <Label>专长工艺</Label>
            <div className="flex space-x-2">
              <Input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                placeholder="请输入专长工艺"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
              />
              <Button type="button" onClick={addSpecialty}>添加</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                  <span>{specialty}</span>
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeSpecialty(specialty)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">月产能（件）</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
                placeholder="请输入月产能"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadTime">标准周期（天）</Label>
              <Input
                id="leadTime"
                type="number"
                value={formData.leadTime}
                onChange={(e) => handleInputChange('leadTime', e.target.value)}
                placeholder="请输入标准周期"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualityRating">质量评级（1-5）</Label>
              <Input
                id="qualityRating"
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={formData.qualityRating}
                onChange={(e) => handleInputChange('qualityRating', e.target.value)}
                placeholder="请输入质量评级"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
            <Label htmlFor="isActive">启用状态</Label>
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
              {isSubmitting ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
