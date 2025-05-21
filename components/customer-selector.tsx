"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2, Plus, Search, User } from "lucide-react"
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { getCustomers, createCustomer } from "@/lib/actions/customer-actions"

// 客户表单验证模式
const customerFormSchema = z.object({
  name: z.string().min(2, { message: "客户名称至少需要2个字符" }),
  phone: z.string().optional(),
  email: z.string().email({ message: "请输入有效的电子邮件地址" }).optional().or(z.literal("")),
  address: z.string().optional(),
  type: z.string().default("individual"),
  notes: z.string().optional(),
});

export function CustomerSelector({ value, onChange, allowEmpty = false }) {
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // 初始化客户表单
  const customerForm = useForm({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      type: "individual",
      notes: "",
    },
  })

  // 加载客户数据
  useEffect(() => {
    async function loadCustomers() {
      setIsLoading(true)
      try {
        const data = await getCustomers()
        setCustomers(data)
      } catch (error) {
        console.error("Error loading customers:", error)
        toast({
          title: "加载失败",
          description: "无法加载客户数据",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomers()
  }, [])

  // 创建新客户
  async function handleCreateCustomer(data) {
    try {
      const newCustomer = await createCustomer(data)
      setCustomers(prev => [...prev, newCustomer])
      onChange(newCustomer.id.toString())
      setShowNewCustomerDialog(false)
      customerForm.reset()
      toast({
        title: "创建成功",
        description: "客户已成功创建",
      })
    } catch (error) {
      console.error("Error creating customer:", error)
      toast({
        title: "创建失败",
        description: error.message || "创建客户时出错",
        variant: "destructive",
      })
    }
  }

  // 过滤客户
  const filteredCustomers = searchTerm
    ? customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : customers

  // 获取当前选中的客户
  const selectedCustomer = customers.find(customer => customer.id.toString() === value)

  return (
    <div>
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
            ) : value && selectedCustomer ? (
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>{selectedCustomer.name}</span>
                {selectedCustomer.phone && (
                  <span className="ml-2 text-muted-foreground text-sm">
                    ({selectedCustomer.phone})
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">选择客户</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start" side="bottom" sideOffset={5}>
          <Command className="w-full">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="搜索客户..."
                className="flex h-9 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
            </div>
            <CommandList>
              <CommandEmpty>
                {searchTerm ? (
                  <div className="py-6 text-center text-sm">
                    <p>未找到匹配的客户</p>
                    <Button 
                      variant="link" 
                      className="mt-2"
                      onClick={() => {
                        customerForm.setValue("name", searchTerm);
                        setShowNewCustomerDialog(true);
                        setOpen(false);
                      }}
                    >
                      创建新客户 "{searchTerm}"
                    </Button>
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm">暂无客户数据</p>
                )}
              </CommandEmpty>
              <CommandGroup heading="客户列表">
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
                      <span className="text-muted-foreground">不选择客户</span>
                    </div>
                  </CommandItem>
                )}
                {filteredCustomers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id.toString()}
                    onSelect={() => {
                      onChange(customer.id.toString());
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === customer.id.toString() ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{customer.name}</span>
                      {customer.phone && (
                        <span className="ml-2 text-muted-foreground text-sm">
                          ({customer.phone})
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setShowNewCustomerDialog(true);
                    setOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>创建新客户</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* 新建客户对话框 */}
      <Dialog open={showNewCustomerDialog} onOpenChange={setShowNewCustomerDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>创建新客户</DialogTitle>
            <DialogDescription>
              添加新客户的详细信息。创建后将自动选中该客户。
            </DialogDescription>
          </DialogHeader>
          <Form {...customerForm}>
            <form onSubmit={customerForm.handleSubmit(handleCreateCustomer)} className="space-y-4">
              <FormField
                control={customerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>客户名称</FormLabel>
                    <FormControl>
                      <Input placeholder="输入客户名称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={customerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>联系电话</FormLabel>
                    <FormControl>
                      <Input placeholder="输入联系电话" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={customerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>电子邮箱</FormLabel>
                    <FormControl>
                      <Input placeholder="输入电子邮箱" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={customerForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>地址</FormLabel>
                    <FormControl>
                      <Input placeholder="输入地址" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={customerForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>客户类型</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="individual">个人</option>
                        <option value="company">企业</option>
                        <option value="school">学校</option>
                        <option value="government">政府机构</option>
                        <option value="other">其他</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={customerForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>备注</FormLabel>
                    <FormControl>
                      <Input placeholder="输入备注信息" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowNewCustomerDialog(false)}>
                  取消
                </Button>
                <Button type="submit">创建客户</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
