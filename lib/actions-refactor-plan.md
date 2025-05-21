# 服务器操作重构计划

## 问题

当前的 `lib/actions.ts` 文件存在以下问题：

1. 文件过大（超过7000行），难以维护和理解
2. 存在重复导出的函数，导致编译错误
3. 功能混杂，不同领域的操作混在一起
4. 缺乏模块化，难以扩展和测试

## 解决方案

将 `lib/actions.ts` 文件拆分为多个模块化的文件，每个文件负责特定的功能领域，并创建一个索引文件统一导出所有函数。

## 实施步骤

### 1. 创建新的目录结构

```
lib/
  ├── actions/
  │   ├── index.ts            # 统一导出所有函数
  │   ├── user-actions.ts     # 用户相关操作
  │   ├── auth-actions.ts     # 认证相关操作
  │   ├── role-actions.ts     # 角色和权限相关操作
  │   ├── employee-actions.ts # 员工相关操作
  │   ├── product-actions.ts  # 产品相关操作
  │   ├── inventory-actions.ts # 库存相关操作
  │   ├── sales-actions.ts    # 销售相关操作
  │   ├── purchase-actions.ts # 采购相关操作
  │   ├── workshop-actions.ts # 团建相关操作
  │   ├── system-actions.ts   # 系统相关操作
  │   └── ...
  └── actions.ts              # 保留原文件，但导入并重新导出新文件中的函数
```

### 2. 按功能领域拆分函数

1. **用户相关操作 (user-actions.ts)**
   - createUser
   - updateUser
   - deleteUser
   - getUserRoles
   - updateUserRoles
   - getUserProfile
   - updateUserProfile
   - updateUserPassword
   - updateUserSettings
   - ...

2. **认证相关操作 (auth-actions.ts)**
   - getCurrentUser
   - getUserLoginHistory
   - recordUserLogin
   - enableTwoFactorAuth
   - disableTwoFactorAuth
   - ...

3. **角色和权限相关操作 (role-actions.ts)**
   - getRoles
   - getRole
   - createRole
   - updateRole
   - deleteRole
   - getPermissions
   - getRolePermissions
   - updateRolePermissions
   - ...

4. **员工相关操作 (employee-actions.ts)**
   - getEmployees
   - createEmployee
   - updateEmployee
   - deleteEmployee
   - getSalaryRecords
   - createSalaryRecord
   - updateSalaryRecord
   - deleteSalaryRecord
   - ...

5. **产品相关操作 (product-actions.ts)**
   - getProducts
   - createProduct
   - updateProduct
   - deleteProduct
   - getProductCategories
   - createProductCategory
   - updateProductCategory
   - deleteProductCategory
   - ...

6. **库存相关操作 (inventory-actions.ts)**
   - getInventory
   - createInventory
   - updateInventory
   - deleteInventory
   - transferInventory
   - batchTransferInventory
   - getInventoryTransactions
   - ...

7. **销售相关操作 (sales-actions.ts)**
   - getOrders
   - createOrder
   - updateOrder
   - getGallerySales
   - createGallerySale
   - getCoffeeShopSales
   - createCoffeeShopSale
   - updateCoffeeShopSale
   - deleteCoffeeShopSale
   - ...

8. **采购相关操作 (purchase-actions.ts)**
   - getPurchaseOrders
   - createPurchaseOrder
   - updatePurchaseOrder
   - deletePurchaseOrder
   - receivePurchaseOrder
   - getSuppliers
   - createSupplier
   - updateSupplier
   - deleteSupplier
   - ...

9. **团建相关操作 (workshop-actions.ts)**
   - getWorkshopActivities
   - createWorkshopActivity
   - updateWorkshopActivity
   - deleteWorkshopActivity
   - getWorkshopTeamMembers
   - createWorkshopTeamMember
   - updateWorkshopTeamMember
   - deleteWorkshopTeamMember
   - ...

10. **系统相关操作 (system-actions.ts)**
    - getSystemSettings
    - updateSystemSettings
    - getSystemInfo
    - getLogs
    - createLog
    - createBackup
    - restoreBackup
    - getBackupsList
    - ...

### 3. 创建索引文件

在 `lib/actions/index.ts` 中导入并重新导出所有函数：

```typescript
// 导入所有模块
import * as userActions from './user-actions';
import * as authActions from './auth-actions';
import * as roleActions from './role-actions';
import * as employeeActions from './employee-actions';
import * as productActions from './product-actions';
import * as inventoryActions from './inventory-actions';
import * as salesActions from './sales-actions';
import * as purchaseActions from './purchase-actions';
import * as workshopActions from './workshop-actions';
import * as systemActions from './system-actions';

// 导出所有函数
export * from './user-actions';
export * from './auth-actions';
export * from './role-actions';
export * from './employee-actions';
export * from './product-actions';
export * from './inventory-actions';
export * from './sales-actions';
export * from './purchase-actions';
export * from './workshop-actions';
export * from './system-actions';

// 导出所有模块（可选，用于命名空间访问）
export {
  userActions,
  authActions,
  roleActions,
  employeeActions,
  productActions,
  inventoryActions,
  salesActions,
  purchaseActions,
  workshopActions,
  systemActions,
};
```

### 4. 更新原文件

更新 `lib/actions.ts` 文件，导入并重新导出新文件中的函数：

```typescript
// 导入并重新导出所有函数
export * from './actions/index';
```

### 5. 逐步迁移

1. 创建新的目录结构和文件
2. 从 `lib/actions.ts` 文件中复制相关函数到对应的新文件
3. 在 `lib/actions/index.ts` 中导入并重新导出所有函数
4. 更新 `lib/actions.ts` 文件，导入并重新导出新文件中的函数
5. 测试系统，确保所有功能正常工作
6. 逐步更新导入路径，从 `@/lib/actions` 改为 `@/lib/actions/index` 或特定的模块

### 6. 长期维护

1. 为每个模块添加单元测试
2. 添加类型定义，提高代码质量
3. 添加文档注释，提高可维护性
4. 定期审查和重构代码，保持模块化和可维护性

## 优势

1. 提高代码可维护性和可读性
2. 避免重复导出函数的问题
3. 更好的模块化，便于扩展和测试
4. 更清晰的责任划分，便于团队协作
5. 更好的性能，只加载需要的模块
6. 更好的类型推断和自动完成支持

## 风险和缓解措施

1. **风险**：迁移过程中可能引入新的错误
   **缓解**：逐步迁移，每次迁移一个模块，并进行充分测试

2. **风险**：导入路径变更可能导致现有代码无法工作
   **缓解**：保留原文件并重新导出新文件中的函数，确保向后兼容

3. **风险**：重构可能需要较长时间
   **缓解**：分阶段实施，优先处理最关键的模块
