"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2, Search, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { getEmployees } from "@/lib/actions/employee-actions"

export function EmployeeSelector({ value, onChange, allowEmpty = false, role = null }) {
  const [open, setOpen] = useState(false)
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // 加载员工数据
  useEffect(() => {
    async function loadEmployees() {
      setIsLoading(true)
      try {
        const data = await getEmployees()
        // 如果指定了角色，过滤员工
        const filteredData = role 
          ? data.filter(employee => employee.position.includes(role))
          : data
        setEmployees(filteredData)
      } catch (error) {
        console.error("Error loading employees:", error)
        toast({
          title: "加载失败",
          description: "无法加载员工数据",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadEmployees()
  }, [role])

  // 过滤员工
  const filteredEmployees = searchTerm
    ? employees.filter(employee => 
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.phone && employee.phone.includes(searchTerm)) ||
        (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : employees

  // 获取当前选中的员工
  const selectedEmployee = employees.find(employee => employee.id.toString() === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>加载中...</span>
            </div>
          ) : value && selectedEmployee ? (
            <div className="flex items-center">
              <UserRound className="mr-2 h-4 w-4" />
              <span>{selectedEmployee.name}</span>
              <span className="ml-2 text-muted-foreground text-sm">
                ({selectedEmployee.position})
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">选择员工</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" side="bottom" sideOffset={5}>
        <Command className="w-full">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="搜索员工..."
              className="flex h-9 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
          </div>
          <CommandList>
            <CommandEmpty>
              {searchTerm ? (
                <p className="py-6 text-center text-sm">未找到匹配的员工</p>
              ) : (
                <p className="py-6 text-center text-sm">暂无员工数据</p>
              )}
            </CommandEmpty>
            <CommandGroup heading="员工列表">
              {allowEmpty && (
                <CommandItem
                  value="empty"
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === "" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="text-muted-foreground">不选择员工</span>
                  </div>
                </CommandItem>
              )}
              {filteredEmployees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={employee.id.toString()}
                  onSelect={() => {
                    onChange(employee.id.toString());
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === employee.id.toString() ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{employee.name}</span>
                    <span className="ml-2 text-muted-foreground text-sm">
                      ({employee.position})
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
