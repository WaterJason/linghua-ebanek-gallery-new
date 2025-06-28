# 聆花掐丝珐琅馆ERP系统 - 供应链流程调整总结

## 一、业务需求分析

### 原始供应链流程
您的业务流程包含以下关键环节：
1. **产品设计** (广州)
2. **底胎采购/定制** (广州)
3. **寄送广西生产基地** (物流)
4. **工艺制作** (广西，财务独立)
5. **寄回广州** (物流)
6. **配饰装裱包装** (广州)
7. **渠道销售** (各渠道)
8. **月度结款** (财务)

### 关键挑战
- **地理分离**：生产在广西，设计和包装在广州
- **财务独立**：广西生产基地需要独立核算
- **质量控制**：需要严格的质量检验和追溯
- **物流管理**：涉及多次跨省运输
- **库存追踪**：需要跟踪各环节的库存状态

## 二、ERP系统调整内容

### 2.1 新增数据模型

#### 生产基地管理 (ProductionBase)
```sql
-- 新增生产基地表
CREATE TABLE ProductionBase (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  code VARCHAR UNIQUE NOT NULL,
  location VARCHAR NOT NULL,
  contactName VARCHAR,
  contactPhone VARCHAR,
  contactEmail VARCHAR,
  address VARCHAR,
  specialties TEXT[] DEFAULT '{}',
  capacity INTEGER,
  leadTime INTEGER,
  qualityRating DECIMAL,
  isActive BOOLEAN DEFAULT true,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### 生产订单管理 (ProductionOrder)
```sql
-- 新增生产订单表
CREATE TABLE ProductionOrder (
  id SERIAL PRIMARY KEY,
  orderNumber VARCHAR UNIQUE NOT NULL,
  productionBaseId INTEGER REFERENCES ProductionBase(id),
  employeeId INTEGER REFERENCES Employee(id),
  sourceOrderId INTEGER,
  orderDate TIMESTAMP NOT NULL,
  expectedStartDate TIMESTAMP,
  expectedEndDate TIMESTAMP,
  actualStartDate TIMESTAMP,
  actualEndDate TIMESTAMP,
  status VARCHAR DEFAULT 'pending',
  priority VARCHAR DEFAULT 'normal',
  totalAmount DECIMAL NOT NULL,
  paidAmount DECIMAL DEFAULT 0,
  paymentStatus VARCHAR DEFAULT 'unpaid',
  shippingMethod VARCHAR,
  trackingNumber VARCHAR,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### 质量检验记录 (QualityRecord)
```sql
-- 新增质量检验记录表
CREATE TABLE QualityRecord (
  id SERIAL PRIMARY KEY,
  productionOrderId INTEGER REFERENCES ProductionOrder(id),
  productionBaseId INTEGER REFERENCES ProductionBase(id),
  productId INTEGER REFERENCES Product(id),
  inspectorId INTEGER REFERENCES Employee(id),
  inspectionDate TIMESTAMP NOT NULL,
  qualityGrade VARCHAR NOT NULL,
  qualityScore DECIMAL,
  defectDescription TEXT,
  actionRequired TEXT,
  status VARCHAR DEFAULT 'pending',
  images TEXT[] DEFAULT '{}',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### 物流记录 (ShippingRecord)
```sql
-- 新增物流记录表
CREATE TABLE ShippingRecord (
  id SERIAL PRIMARY KEY,
  productionOrderId INTEGER REFERENCES ProductionOrder(id),
  shippingType VARCHAR NOT NULL,
  shippingDate TIMESTAMP NOT NULL,
  expectedDate TIMESTAMP,
  actualDate TIMESTAMP,
  carrier VARCHAR,
  trackingNumber VARCHAR,
  shippingCost DECIMAL,
  status VARCHAR DEFAULT 'pending',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### 2.2 扩展现有模型

#### 供应商模型扩展
```sql
-- 为Supplier表添加供应商类型字段
ALTER TABLE Supplier ADD COLUMN supplierType VARCHAR DEFAULT 'material';
-- 类型：material(材料供应商), production_base(生产基地), service(服务供应商)
```

#### 仓库模型扩展
```sql
-- 为Warehouse表添加生产基地关联
ALTER TABLE Warehouse ADD COLUMN productionBaseId INTEGER;
-- 仓库类型扩展：physical(实体仓库), virtual(虚拟仓库), production_base(生产基地仓库)
```

#### 库存事务模型扩展
```sql
-- 为InventoryTransaction表添加生产相关字段
ALTER TABLE InventoryTransaction ADD COLUMN productionOrderId INTEGER;
ALTER TABLE InventoryTransaction ADD COLUMN qualityStatus VARCHAR;
-- 事务类型扩展：production_out(发往生产), production_in(生产入库), quality_check(质检)
```

### 2.3 新增业务功能

#### 生产订单管理
- **订单创建**：从销售订单转换或独立创建生产订单
- **状态跟踪**：pending → confirmed → in_production → quality_check → completed → shipped
- **进度监控**：实时更新生产进度和预计完成时间
- **成本核算**：跟踪材料成本、加工费用、物流费用等

#### 生产基地管理
- **基地档案**：基本信息、联系方式、专长工艺
- **能力评估**：产能、交期、质量评级
- **绩效分析**：按时交付率、质量合格率、成本控制
- **合作历史**：历史订单记录和评价

#### 质量管理
- **检验标准**：制定各类产品的质量标准
- **检验记录**：详细的质检数据和照片
- **问题追溯**：质量问题的原因分析和改进措施
- **供应商评级**：基于质量表现的基地评级

#### 物流管理
- **发货管理**：发往生产基地的物流跟踪
- **收货管理**：从生产基地返回的物流跟踪
- **运费核算**：物流成本统计和分析
- **异常处理**：物流异常和处理记录

#### 供应链库存管理
- **多仓库支持**：广州总仓、广西生产基地仓库
- **状态追踪**：原材料 → 在途 → 生产中 → 质检中 → 成品 → 已包装
- **流转记录**：详细的库存流转历史
- **可视化展示**：供应链各环节的库存分布

## 三、页面和组件调整

### 3.1 制作管理页面 (/production)
- **新增标签页**：
  - 生产订单：管理发送到生产基地的订单
  - 生产基地：管理合作的生产基地信息
  - 计件工单：原有的计件工作管理
  - 制作报表：各类生产报表

### 3.2 库存管理页面 (/inventory)
- **新增功能**：
  - 供应链库存：展示各环节的库存状态
  - 库存流转：记录供应链中的库存变动
  - 流程可视化：供应链流程图（规划中）

### 3.3 新增组件
- **ProductionOrderManagement**：生产订单管理组件
- **ProductionBaseManagement**：生产基地管理组件
- **SupplyChainInventory**：供应链库存管理组件

## 四、数据操作函数

### 4.1 生产相关操作 (lib/actions/production-actions.ts)
- `getProductionBases()` - 获取生产基地列表
- `createProductionBase()` - 创建生产基地
- `updateProductionBase()` - 更新生产基地信息
- `getProductionOrders()` - 获取生产订单列表
- `createProductionOrder()` - 创建生产订单
- `updateProductionOrderStatus()` - 更新生产订单状态
- `createQualityRecord()` - 创建质量检验记录
- `createShippingRecord()` - 创建物流记录
- `updateShippingRecordStatus()` - 更新物流状态

## 五、业务流程支持

### 5.1 完整流程追踪
1. **销售订单** → 生成生产需求
2. **生产订单** → 发送到生产基地
3. **物流跟踪** → 原材料运输到生产基地
4. **生产进度** → 实时更新制作状态
5. **质量检验** → 完工产品质量控制
6. **物流跟踪** → 成品运输回广州
7. **库存入库** → 成品入库待包装
8. **最终包装** → 包装完成待销售

### 5.2 财务管理支持
- **成本核算**：按订单核算完整成本
- **付款管理**：支持预付款、进度款、尾款
- **对账管理**：与生产基地的定期对账
- **利润分析**：各环节的利润贡献分析

### 5.3 报表和分析
- **生产进度报表**：各订单的生产状态
- **质量分析报表**：质量问题统计和趋势
- **成本分析报表**：各环节成本构成
- **供应商评估报表**：生产基地综合评价

## 六、实施效果

### 6.1 解决的问题
✅ **地理分离管理**：通过生产基地和物流管理解决
✅ **财务独立核算**：支持独立的成本核算和付款管理
✅ **质量控制追溯**：完整的质量检验和问题追溯体系
✅ **物流状态跟踪**：实时的物流状态和异常处理
✅ **库存状态管理**：多仓库和供应链状态追踪

### 6.2 提升的能力
- **透明度提升**：全流程可视化和实时状态更新
- **效率提升**：自动化的状态流转和提醒机制
- **质量提升**：标准化的质量检验和改进流程
- **成本控制**：精确的成本核算和分析
- **决策支持**：丰富的报表和数据分析

## 七、后续优化建议

### 7.1 短期优化
- 完善质量检验标准库
- 优化物流成本核算
- 增加移动端支持

### 7.2 长期规划
- 集成第三方物流API
- 开发供应链可视化大屏
- 实现智能排产和预警
- 建立供应商协同平台

这次调整使您的ERP系统能够完整支持复杂的供应链流程，提高了生产管理的效率和透明度，为业务的进一步发展奠定了坚实的基础。
