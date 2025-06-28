import {
  LayoutDashboardIcon,
  CalendarIcon,
  UsersIcon,
  ClipboardListIcon,
  DollarSignIcon,
  SettingsIcon,
  PackageIcon,
  ShoppingCartIcon,
  GlobeIcon,
  CoffeeIcon,
  PieChartIcon,
  TagIcon,
  LayersIcon,
  RulerIcon,
  BarChart2Icon,
  FileTextIcon,
  ShieldIcon,
  HomeIcon,
  UserIcon,
  BoxIcon,
  ShoppingBagIcon,
  BarChartIcon,
  WrenchIcon,
  FolderIcon,
  DatabaseIcon,
  BuildingIcon,
  BriefcaseIcon,
  TruckIcon,
  LineChartIcon,
  CreditCardIcon,
  FileIcon,
  UsersRoundIcon,
  BellIcon,
  FolderArchiveIcon,
  MessageSquareIcon,
  PaletteIcon,
  PlusIcon,
  WarehouseIcon,
  ArrowRightIcon,
  LinkIcon,
  ClockIcon,
  AlertTriangleIcon,
  BarChart3Icon,
  WalletIcon,
  TrendingUpIcon,

} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: any
  children?: NavItem[]
}

export interface NavGroup {
  title: string
  icon: any
  items: NavItem[]
}

export const navigationGroups: NavGroup[] = [
  {
    title: "概览与客户",
    icon: HomeIcon,
    items: [
      {
        title: "仪表盘",
        href: "/",
        icon: LayoutDashboardIcon,
      },
      {
        title: "数据录入",
        href: "/daily-log",
        icon: ClipboardListIcon,
      },
      {
        title: "待办事项",
        href: "/todos",
        icon: ClipboardListIcon,
      },
      {
        title: "消息中心",
        href: "/messages",
        icon: MessageSquareIcon,
      },
    ],
  },
  {
    title: "销售与渠道",
    icon: ShoppingBagIcon,
    items: [
      {
        title: "销售管理",
        href: "/sales",
        icon: DollarSignIcon,
        children: [
          {
            title: "POS销售",
            href: "/sales?tab=pos",
            icon: ShoppingCartIcon,
          },
          {
            title: "销售订单",
            href: "/sales?tab=orders",
            icon: FileIcon,
          },
          {
            title: "客户管理",
            href: "/sales?tab=customers",
            icon: UsersRoundIcon,
          },
          {
            title: "销售报表",
            href: "/sales?tab=reports",
            icon: BarChart3Icon,
          },
          {
            title: "定制作品",
            href: "/sales/custom-works",
            icon: BriefcaseIcon,
          },
        ],
      },
      {
        title: "渠道管理",
        href: "/channels",
        icon: GlobeIcon,
      },
    ],
  },
  {
    title: "运营与服务",
    icon: BriefcaseIcon,
    items: [
      {
        title: "手作团建",
        href: "/workshops",
        icon: BuildingIcon,
        children: [
          {
            title: "团建订单",
            href: "/workshops?tab=orders",
            icon: FileIcon,
          },
          {
            title: "活动管理",
            href: "/workshops?tab=activities",
            icon: CalendarIcon,
          },
          {
            title: "成本分析",
            href: "/workshops?tab=analysis",
            icon: BarChartIcon,
          },
          {
            title: "快速录入",
            href: "/workshops?tab=entry",
            icon: PlusIcon,
          },
        ],
      },
      {
        title: "咖啡店管理",
        href: "/coffee-shop",
        icon: CoffeeIcon,
        children: [
          {
            title: "咖啡店概览",
            href: "/coffee-shop",
            icon: CoffeeIcon,
          },
          {
            title: "销售记录",
            href: "/coffee-shop/sales",
            icon: ShoppingCartIcon,
          },
          {
            title: "采购记录",
            href: "/coffee-shop/purchase",
            icon: TruckIcon,
          },
        ],
      },
    ],
  },
  {
    title: "供应链与生产",
    icon: TruckIcon,
    items: [
      {
        title: "产品管理",
        href: "/products",
        icon: PackageIcon,
        children: [
          {
            title: "产品列表",
            href: "/products",
            icon: PackageIcon,
          },
          {
            title: "添加产品",
            href: "/products/add",
            icon: PlusIcon,
          },
          {
            title: "产品分类",
            href: "/products/categories",
            icon: TagIcon,
          },
          {
            title: "材质管理",
            href: "/products/materials",
            icon: LayersIcon,
          },
          {
            title: "单位管理",
            href: "/products/units",
            icon: RulerIcon,
          },
          {
            title: "标签管理",
            href: "/products/tags",
            icon: TagIcon,
          },
          {
            title: "产品分析",
            href: "/products/analytics",
            icon: BarChartIcon,
          },
        ],
      },
      {
        title: "库存管理",
        href: "/inventory",
        icon: PackageIcon,
        children: [
          {
            title: "库存概览",
            href: "/inventory?tab=dashboard",
            icon: LayoutDashboardIcon,
          },
          {
            title: "产品库存编辑",
            href: "/inventory?tab=products",
            icon: PackageIcon,
          },
          {
            title: "仓库管理",
            href: "/inventory?tab=warehouses",
            icon: WarehouseIcon,
          },
          {
            title: "库存转移",
            href: "/inventory?tab=transfer",
            icon: ArrowRightIcon,
          },
          {
            title: "供应链库存",
            href: "/inventory?tab=supply-chain",
            icon: TruckIcon,
          },
          {
            title: "状态跟踪",
            href: "/inventory?tab=status-tracker",
            icon: ClockIcon,
          },
          {
            title: "交易记录",
            href: "/inventory?tab=transactions",
            icon: ClipboardListIcon,
          },
          {
            title: "库存分析",
            href: "/inventory?tab=analytics",
            icon: BarChartIcon,
          },
          {
            title: "库存预警",
            href: "/inventory?tab=alerts",
            icon: AlertTriangleIcon,
          },
          {
            title: "业务集成",
            href: "/inventory?tab=integration",
            icon: LinkIcon,
          },
        ],
      },
      {
        title: "采购管理",
        href: "/purchase",
        icon: ShoppingCartIcon,
        children: [
          {
            title: "采购订单",
            href: "/purchase?tab=orders",
            icon: FileIcon,
          },
          {
            title: "供应商管理",
            href: "/purchase?tab=suppliers",
            icon: UsersIcon,
          },
          {
            title: "采购统计",
            href: "/purchase?tab=statistics",
            icon: BarChartIcon,
          },
        ],
      },
      {
        title: "制作管理",
        href: "/production",
        icon: WrenchIcon,
        children: [
          {
            title: "生产订单",
            href: "/production?tab=orders",
            icon: FileIcon,
          },
          {
            title: "生产基地",
            href: "/production?tab=bases",
            icon: BuildingIcon,
          },
          {
            title: "计件工单",
            href: "/production?tab=production",
            icon: WrenchIcon,
          },
          {
            title: "制作报表",
            href: "/production?tab=reports",
            icon: BarChartIcon,
          },
        ],
      },
      {
        title: "作品管理",
        href: "/artworks",
        icon: PaletteIcon,
      },
    ],
  },
  {
    title: "财务与人事",
    icon: DollarSignIcon,
    items: [
      {
        title: "财务管理",
        href: "/finance",
        icon: CreditCardIcon,
        children: [
          {
            title: "财务概览",
            href: "/finance?tab=overview",
            icon: BarChart3Icon,
          },
          {
            title: "资金账户",
            href: "/finance?tab=accounts",
            icon: WalletIcon,
          },
          {
            title: "交易记录",
            href: "/finance?tab=transactions",
            icon: FileTextIcon,
          },
          {
            title: "收支分类",
            href: "/finance?tab=categories",
            icon: TagIcon,
          },
          {
            title: "财务报表",
            href: "/finance?tab=reports",
            icon: TrendingUpIcon,
          },
        ],
      },
      {
        title: "员工管理",
        href: "/employees",
        icon: UsersIcon,
        children: [
          {
            title: "员工列表",
            href: "/employees",
            icon: UsersIcon,
          },
          {
            title: "考勤管理",
            href: "/schedules",
            icon: CalendarIcon,
          },
          {
            title: "薪资管理",
            href: "/payroll",
            icon: DollarSignIcon,
          },
          {
            title: "薪资记录",
            href: "/payroll/records",
            icon: FileTextIcon,
          },
          {
            title: "薪资发放",
            href: "/payroll/disbursements",
            icon: DollarSignIcon,
          },
        ],
      },
    ],
  },
  {
    title: "报表中心",
    icon: LineChartIcon,
    items: [
      {
        title: "综合报表",
        href: "/reports",
        icon: PieChartIcon,
        children: [
          {
            title: "报表概览",
            href: "/reports",
            icon: PieChartIcon,
          },
          {
            title: "销售报表",
            href: "/reports/sales",
            icon: BarChart3Icon,
          },
          {
            title: "采购报表",
            href: "/reports/purchase",
            icon: ShoppingCartIcon,
          },
          {
            title: "库存报表",
            href: "/reports/inventory",
            icon: PackageIcon,
          },
          {
            title: "财务报表",
            href: "/reports/finance",
            icon: CreditCardIcon,
          },
          {
            title: "员工报表",
            href: "/reports/employees",
            icon: UsersIcon,
          },
          {
            title: "团建报表",
            href: "/reports/workshops",
            icon: BuildingIcon,
          },
          {
            title: "咖啡店报表",
            href: "/reports/coffee-shop",
            icon: CoffeeIcon,
          },
        ],
      },
    ],
  },
  {
    title: "系统管理",
    icon: WrenchIcon,
    items: [
      {
        title: "系统设置",
        href: "/settings",
        icon: SettingsIcon,
        children: [
          {
            title: "系统概览",
            href: "/settings",
            icon: SettingsIcon,
          },
          {
            title: "系统诊断中心",
            href: "/settings/diagnostics",
            icon: BarChart2Icon,
          },
          {
            title: "用户管理",
            href: "/settings/users",
            icon: UsersIcon,
          },
          {
            title: "角色管理",
            href: "/settings/roles",
            icon: ShieldIcon,
          },
          {
            title: "权限分配",
            href: "/settings/permissions",
            icon: ShieldIcon,
          },
          {
            title: "公司信息",
            href: "/settings/company-profile",
            icon: BuildingIcon,
          },
          {
            title: "系统参数",
            href: "/settings/parameters",
            icon: SettingsIcon,
          },
          {
            title: "数据字典",
            href: "/settings/dictionaries",
            icon: DatabaseIcon,
          },
          {
            title: "账号迁移",
            href: "/settings/account-migration",
            icon: LinkIcon,
          },
          {
            title: "系统监控",
            href: "/settings/monitoring",
            icon: BarChart2Icon,
          },
          {
            title: "系统日志",
            href: "/settings/logs",
            icon: FileTextIcon,
          },
          {
            title: "数据备份恢复",
            href: "/settings/backup-restore",
            icon: FolderArchiveIcon,
          },
          {
            title: "数据导入导出",
            href: "/settings/data-io-templates",
            icon: FolderArchiveIcon,
          },
        ],
      },
      {
        title: "工作流管理",
        href: "/workflows",
        icon: FileIcon,
        children: [
          {
            title: "待我审批",
            href: "/workflows/approvals",
            icon: ShieldIcon,
          },
          {
            title: "我的工作流",
            href: "/workflows/my",
            icon: UserIcon,
          },
          {
            title: "工作流定义",
            href: "/workflows",
            icon: FileIcon,
          },
        ],
      },
      {
        title: "通知中心",
        href: "/notifications",
        icon: BellIcon,
      },
    ],
  },
]

// 扁平化导航项，用于搜索和其他需要所有导航项的场景
export const flattenedNavItems: NavItem[] = navigationGroups.flatMap(group => group.items)
