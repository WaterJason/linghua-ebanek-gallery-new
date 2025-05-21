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
    title: "概览",
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
    ],
  },
  {
    title: "人员管理",
    icon: UserIcon,
    items: [
      {
        title: "排班管理",
        href: "/schedule",
        icon: CalendarIcon,
      },
      {
        title: "员工管理",
        href: "/employees",
        icon: UsersIcon,
      },
      {
        title: "薪资管理",
        href: "/salary",
        icon: DollarSignIcon,
      },
    ],
  },
  {
    title: "商品与库存",
    icon: BoxIcon,
    items: [
      {
        title: "产品管理",
        href: "/products",
        icon: TagIcon,
      },
      {
        title: "库存管理",
        href: "/inventory",
        icon: PackageIcon,
      },
      {
        title: "采购管理",
        href: "/purchase",
        icon: ShoppingCartIcon,
      },
      {
        title: "制作管理",
        href: "/production",
        icon: ClipboardListIcon,
      },
      {
        title: "手作团建管理",
        href: "/workshop",
        icon: ClipboardListIcon,
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
      },
      {
        title: "POS销售记录",
        href: "/sales/pos",
        icon: ShoppingCartIcon,
      },
      {
        title: "渠道管理",
        href: "/channels",
        icon: GlobeIcon,
      },
      {
        title: "财务管理",
        href: "/finance",
        icon: BarChart2Icon,
      },
    ],
  },
  {
    title: "报表",
    icon: BarChartIcon,
    items: [
      {
        title: "咖啡店报表",
        href: "/coffee-reports",
        icon: CoffeeIcon,
      },
      {
        title: "咖啡店数据录入",
        href: "/daily-log?tab=coffee",
        icon: ClipboardListIcon,
      },
      {
        title: "综合报表",
        href: "/reports",
        icon: PieChartIcon,
      },
    ],
  },
  {
    title: "系统",
    icon: WrenchIcon,
    items: [
      {
        title: "系统设置",
        href: "/settings",
        icon: SettingsIcon,
      },
      {
        title: "账号管理",
        href: "/accounts",
        icon: UserIcon,
      },
      {
        title: "权限管理",
        href: "/permissions",
        icon: ShieldIcon,
      },
      {
        title: "数据备份",
        href: "/settings/backup",
        icon: DatabaseIcon,
      },
    ],
  },
]

// 扁平化导航项，用于搜索和其他需要所有导航项的场景
export const flattenedNavItems: NavItem[] = navigationGroups.flatMap(group => group.items)
