"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, PlusIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getEmployees } from "@/lib/actions/employee-actions";
import { getProducts } from "@/lib/actions/product-actions";
import { createGallerySale } from "@/lib/actions/sales-actions";
import { toast } from "@/components/ui/use-toast"
import { FileUpload } from "@/components/file-upload"
import { Card, CardContent } from "@/components/ui/card"

const formSchema = z.object({
  date: z.date({
    required_error: "请选择日期",
  }),
  employee: z.string({
    required_error: "请选择销售员工",
  }),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().min(1),
        price: z.number().min(0),
      }),
    )
    .min(1, "至少添加一项销售商品"),
  totalAmount: z.number().min(0),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
})

export function SalesEntryForm() {
  const [items, setItems] = useState([{ id: 1, productId: "", quantity: 1, price: 0 }])
  const [employees, setEmployees] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [createdSaleId, setCreatedSaleId] = useState<number | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      items: [{ productId: "", quantity: 1, price: 0 }],
      totalAmount: 0,
      notes: "",
      imageUrl: "",
    },
  })

  // 获取员工和产品数据
  useEffect(() => {
    async function fetchData() {
      try {
        const [employeesData, productsData] = await Promise.all([getEmployees(), getProducts()])

        setEmployees(employeesData.filter((e) => e.status === "active"))
        setProducts(productsData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true)
    try {
      const result = await createGallerySale(values)
      setCreatedSaleId(result.id)

      toast({
        title: "销售数据提交成功",
        description: "销售记录已保存到数据库",
      })

      // 不重置表单，让用户可以上传图片
    } catch (error) {
      console.error("Error submitting sales data:", error)
      toast({
        title: "提交失败",
        description: "保存销售记录时出错",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUploadComplete = (fileUrl: string) => {
    form.setValue("imageUrl", fileUrl)

    toast({
      title: "图片上传成功",
      description: "销售凭证已成功上传",
    })

    // 上传完成后重置表单
    setTimeout(() => {
      form.reset({
        date: new Date(),
        items: [{ productId: "", quantity: 1, price: 0 }],
        totalAmount: 0,
        notes: "",
        imageUrl: "",
      })
      setItems([{ id: 1, productId: "", quantity: 1, price: 0 }])
      setCreatedSaleId(null)
    }, 1000)
  }

  const addItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1
    setItems([...items, { id: newId, productId: "", quantity: 1, price: 0 }])
  }

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))

      // 更新表单中的items
      const updatedItems = form.getValues("items").filter((_, index) => items[index].id !== id)
      form.setValue("items", updatedItems)

      // 重新计算总金额
      const total = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
      form.setValue("totalAmount", total)
    }
  }

  const updateItem = (id: number, field: string, value: any) => {
    const updatedItems = items.map((item) => {
      if (item.id === id) {
        if (field === "productId") {
          const product = products.find((p) => p.id.toString() === value)
          return {
            ...item,
            [field]: value,
            price: product ? product.price : 0,
          }
        }
        return { ...item, [field]: value }
      }
      return item
    })
    setItems(updatedItems)

    // 更新表单中的items
    const formItems = updatedItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }))
    form.setValue("items", formItems)

    // 更新总金额
    const total = updatedItems.reduce((sum, item) => {
      return sum + item.price * item.quantity
    }, 0)
    form.setValue("totalAmount", total)
  }

  if (loading) {
    return <div className="text-center py-4">加载数据中...</div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>日期</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "yyyy-MM-dd") : <span>选择日期</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>销售员工</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择员工" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name} ({employee.position})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <FormLabel>销售商品</FormLabel>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <PlusIcon className="h-4 w-4 mr-2" />
              添加商品
            </Button>
          </div>

          {items.map((item, index) => (
            <div key={item.id} className="flex items-end gap-4">
              <div className="flex-1">
                <FormLabel className={index !== 0 ? "sr-only" : ""}>商品</FormLabel>
                <Select
                  value={item.productId.toString()}
                  onValueChange={(value) => updateItem(item.id, "productId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择商品" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} (¥{product.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-20">
                <FormLabel className={index !== 0 ? "sr-only" : ""}>数量</FormLabel>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", Number.parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="w-28">
                <FormLabel className={index !== 0 ? "sr-only" : ""}>单价</FormLabel>
                <Input type="number" value={item.price} readOnly />
              </div>

              <div className="w-28">
                <FormLabel className={index !== 0 ? "sr-only" : ""}>小计</FormLabel>
                <Input type="number" value={item.price * item.quantity} readOnly />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                disabled={items.length <= 1}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>总金额</FormLabel>
                <FormControl>
                  <Input type="number" {...field} readOnly />
                </FormControl>
                <FormDescription>销售提成将按总金额的10%计算</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>备注</FormLabel>
                <FormControl>
                  <Textarea placeholder="添加销售备注信息..." className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!createdSaleId && (
          <Button type="submit" className="w-full md:w-auto" disabled={submitting}>
            {submitting ? "提交中..." : "提交销售记录"}
          </Button>
        )}
      </form>

      {createdSaleId && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">上传销售凭证</h3>
            <FileUpload onUploadComplete={handleUploadComplete} gallerySaleId={createdSaleId} />
          </CardContent>
        </Card>
      )}
    </Form>
  )
}
