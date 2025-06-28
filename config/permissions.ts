// 权限模块定义
export const PERMISSION_MODULES = [
  {
    code: "dashboard",
    name: "仪表盘",
    permissions: [
      { code: "view", name: "查看仪表盘", description: "允许查看系统仪表盘" },
    ]
  },
  {
    code: "products",
    name: "产品管理",
    permissions: [
      { code: "view", name: "查看产品", description: "允许查看产品列表和详情" },
      { code: "create", name: "创建产品", description: "允许创建新产品" },
      { code: "edit", name: "编辑产品", description: "允许编辑现有产品" },
      { code: "delete", name: "删除产品", description: "允许删除产品" },
      { code: "category", name: "管理分类", description: "允许管理产品分类" },
      { code: "analytics", name: "查看分析", description: "允许查看产品分析报告" },
    ]
  },
  {
    code: "inventory",
    name: "库存管理",
    permissions: [
      { code: "view", name: "查看库存", description: "允许查看库存列表和详情" },
      { code: "create", name: "创建库存记录", description: "允许创建库存记录" },
      { code: "edit", name: "编辑库存", description: "允许编辑库存记录" },
      { code: "delete", name: "删除库存记录", description: "允许删除库存记录" },
    ]
  },
  {
    code: "purchase",
    name: "采购管理",
    permissions: [
      { code: "view", name: "查看采购", description: "允许查看采购订单列表和详情" },
      { code: "create", name: "创建采购订单", description: "允许创建采购订单" },
      { code: "edit", name: "编辑采购订单", description: "允许编辑采购订单" },
      { code: "delete", name: "删除采购订单", description: "允许删除采购订单" },
      { code: "receive", name: "采购入库", description: "允许处理采购入库" },
      { code: "supplier", name: "管理供应商", description: "允许管理供应商" },
    ]
  },
  {
    code: "sales",
    name: "销售管理",
    permissions: [
      { code: "view", name: "查看销售", description: "允许查看销售记录列表和详情" },
      { code: "create", name: "创建销售", description: "允许创建销售记录" },
      { code: "edit", name: "编辑销售", description: "允许编辑销售记录" },
      { code: "delete", name: "删除销售", description: "允许删除销售记录" },
    ]
  },
  {
    code: "production",
    name: "生产管理",
    permissions: [
      { code: "view", name: "查看生产", description: "允许查看生产记录列表和详情" },
      { code: "create", name: "创建生产记录", description: "允许创建生产记录" },
      { code: "edit", name: "编辑生产", description: "允许编辑生产记录" },
      { code: "delete", name: "删除生产记录", description: "允许删除生产记录" },
    ]
  },
  {
    code: "employees",
    name: "员工管理",
    permissions: [
      { code: "view", name: "查看员工", description: "允许查看员工列表和详情" },
      { code: "create", name: "创建员工", description: "允许创建新员工" },
      { code: "edit", name: "编辑员工", description: "允许编辑员工信息" },
      { code: "delete", name: "删除员工", description: "允许删除员工" },
    ]
  },
  {
    code: "schedule",
    name: "排班管理",
    permissions: [
      { code: "view", name: "查看排班", description: "允许查看排班表" },
      { code: "create", name: "创建排班", description: "允许创建排班" },
      { code: "edit", name: "编辑排班", description: "允许编辑排班" },
      { code: "delete", name: "删除排班", description: "允许删除排班" },
    ]
  },
  {
    code: "salary",
    name: "薪资管理",
    permissions: [
      { code: "view", name: "查看薪资", description: "允许查看薪资记录" },
      { code: "create", name: "创建薪资记录", description: "允许创建薪资记录" },
      { code: "edit", name: "编辑薪资", description: "允许编辑薪资记录" },
      { code: "approve", name: "审批薪资", description: "允许审批薪资" },
      { code: "pay", name: "发放薪资", description: "允许发放薪资" },
    ]
  },
  {
    code: "reports",
    name: "报表管理",
    permissions: [
      { code: "view", name: "查看报表", description: "允许查看系统报表" },
      { code: "export", name: "导出报表", description: "允许导出报表数据" },
    ]
  },
  {
    code: "customers",
    name: "客户管理",
    permissions: [
      { code: "view", name: "查看客户", description: "允许查看客户列表和详情" },
      { code: "create", name: "创建客户", description: "允许创建新客户" },
      { code: "edit", name: "编辑客户", description: "允许编辑客户信息" },
      { code: "delete", name: "删除客户", description: "允许删除客户" },
    ]
  },
  {
    code: "channels",
    name: "渠道管理",
    permissions: [
      { code: "view", name: "查看渠道", description: "允许查看渠道列表和详情" },
      { code: "create", name: "创建渠道", description: "允许创建新渠道" },
      { code: "edit", name: "编辑渠道", description: "允许编辑渠道信息" },
      { code: "delete", name: "删除渠道", description: "允许删除渠道" },
    ]
  },
  {
    code: "finance",
    name: "财务管理",
    permissions: [
      { code: "view", name: "查看财务", description: "允许查看财务记录" },
      { code: "create", name: "创建财务记录", description: "允许创建财务记录" },
      { code: "edit", name: "编辑财务", description: "允许编辑财务记录" },
      { code: "approve", name: "审批财务", description: "允许审批财务记录" },
    ]
  },
  {
    code: "system",
    name: "系统设置",
    permissions: [
      { code: "view", name: "查看设置", description: "允许查看系统设置" },
      { code: "edit", name: "编辑设置", description: "允许编辑系统设置" },
    ]
  },
  {
    code: "users",
    name: "用户管理",
    permissions: [
      { code: "view", name: "查看用户", description: "允许查看用户列表和详情" },
      { code: "create", name: "创建用户", description: "允许创建新用户" },
      { code: "edit", name: "编辑用户", description: "允许编辑用户信息" },
      { code: "delete", name: "删除用户", description: "允许删除用户" },
    ]
  },
  {
    code: "permissions",
    name: "权限管理",
    permissions: [
      { code: "view", name: "查看权限", description: "允许查看角色和权限" },
      { code: "create", name: "创建角色", description: "允许创建新角色" },
      { code: "edit", name: "编辑角色", description: "允许编辑角色" },
      { code: "delete", name: "删除角色", description: "允许删除角色" },
      { code: "assign", name: "分配权限", description: "允许为角色分配权限" },
    ]
  },
]
