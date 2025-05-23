"use client"

import { useState } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  SearchIcon,
  LockIcon,
  ShieldIcon
} from "lucide-react"
import { Permission } from "@/types/user"

interface PermissionListProps {
  permissions: Permission[]
  isLoading: boolean
}

/**
 * 权限列表组件
 */
export function PermissionList({ 
  permissions, 
  isLoading 
}: PermissionListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  
  // 过滤权限
  const filteredPermissions = permissions.filter(permission => {
    const query = searchQuery.toLowerCase()
    return (
      permission.name.toLowerCase().includes(query) ||
      permission.code.toLowerCase().includes(query) ||
      permission.module.toLowerCase().includes(query) ||
      (permission.description && permission.description.toLowerCase().includes(query))
    )
  })
  
  // 获取所有模块
  const getModules = () => {
    const modules = new Set<string>()
    permissions.forEach(p => modules.add(p.module))
    return Array.from(modules).sort()
  }
  
  // 获取模块权限
  const getModulePermissions = (module: string) => {
    return filteredPermissions.filter(p => p.module === module)
  }
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索权限..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {filteredPermissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <LockIcon className="h-12 w-12 text-muted-foreground opacity-20" />
          <h3 className="mt-4 text-lg font-medium">暂无权限</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery ? "没有符合搜索条件的权限" : "系统中还没有权限"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {getModules().map(module => {
            const modulePermissions = getModulePermissions(module)
            if (modulePermissions.length === 0) return null
            
            return (
              <div key={module} className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldIcon className="h-4 w-4" />
                  <h3 className="text-lg font-medium">{module}</h3>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>权限名称</TableHead>
                        <TableHead>权限代码</TableHead>
                        <TableHead>描述</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modulePermissions.map(permission => (
                        <TableRow key={permission.id}>
                          <TableCell className="font-medium">
                            {permission.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {permission.code}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {permission.description || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
