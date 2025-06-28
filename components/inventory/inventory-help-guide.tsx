"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  HelpCircleIcon,
  MousePointerClickIcon,
  SmartphoneIcon,
  UploadIcon,
  DownloadIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon
} from "lucide-react"

export function InventoryHelpGuide() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircleIcon className="h-4 w-4 mr-2" />
          使用帮助
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>产品库存管理使用指南</DialogTitle>
          <DialogDescription>
            了解如何高效使用新的可编辑库存管理功能
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="editing" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="editing">双击编辑</TabsTrigger>
            <TabsTrigger value="mobile">移动端</TabsTrigger>
            <TabsTrigger value="import">导入导出</TabsTrigger>
            <TabsTrigger value="sync">数据同步</TabsTrigger>
            <TabsTrigger value="tips">使用技巧</TabsTrigger>
          </TabsList>

          <TabsContent value="editing" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MousePointerClickIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">双击编辑功能</h3>
              </div>

              <div className="grid gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">可编辑字段</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Badge variant="outline">库存数量</Badge>
                    <Badge variant="outline">最低库存</Badge>
                    <Badge variant="outline">销售价格</Badge>
                    <Badge variant="outline">成本价格</Badge>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">操作步骤</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>双击要编辑的单元格</li>
                    <li>输入新的数值</li>
                    <li>按 <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> 保存或 <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> 取消</li>
                    <li>系统自动保存并同步到相关模块</li>
                  </ol>
                </div>

                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-start space-x-2">
                    <InfoIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">实时保存</p>
                      <p className="text-blue-700">编辑完成后数据会立即保存到数据库，并自动同步到产品、销售、采购模块。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mobile" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <SmartphoneIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">移动端优化</h3>
              </div>

              <div className="grid gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">移动端编辑</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    在手机或平板设备上，双击单元格会打开专门的编辑对话框，提供更好的触控体验。
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      <span>大尺寸输入框，便于触控操作</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      <span>批量编辑多个字段</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      <span>清晰的保存和取消按钮</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-start space-x-2">
                    <InfoIcon className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-green-800">自动检测</p>
                      <p className="text-green-700">系统会自动检测设备类型，在移动设备上提供优化的编辑体验。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <UploadIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">导入导出功能</h3>
              </div>

              <div className="grid gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">支持的文件格式</h4>
                  <div className="flex space-x-2">
                    <Badge>CSV</Badge>
                    <Badge>Excel (.xlsx)</Badge>
                    <Badge>Excel (.xls)</Badge>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">文件格式要求</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>必须包含：</strong>产品名称、SKU或条码（用于匹配产品）</p>
                    <p><strong>可选字段：</strong>库存数量、最低库存、销售价格、成本价格</p>
                    <p><strong>注意事项：</strong>第一行为标题行，系统会自动匹配列名</p>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">导入流程</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>点击"导入"按钮</li>
                    <li>选择CSV或Excel文件</li>
                    <li>系统自动验证文件格式</li>
                    <li>预览导入数据</li>
                    <li>确认导入，系统自动匹配产品</li>
                  </ol>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">导出功能</h4>
                  <div className="flex items-center space-x-2 text-sm">
                    <DownloadIcon className="h-4 w-4" />
                    <span>支持导出当前筛选结果为CSV文件</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <RefreshCwIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">数据同步机制</h3>
              </div>

              <div className="grid gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">自动同步范围</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span><strong>库存数量</strong> → 产品模块总库存</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span><strong>销售价格</strong> → 产品表价格 + 销售模块</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span><strong>成本价格</strong> → 采购模块成本记录</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-start space-x-2">
                    <AlertTriangleIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">同步说明</p>
                      <p className="text-yellow-700">数据同步在后台自动进行，即使同步失败也不会影响主要的编辑功能。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tips" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">使用技巧</h3>
              </div>

              <div className="grid gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">提高效率</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• 使用搜索功能快速定位产品</li>
                    <li>• 利用分类和状态筛选缩小范围</li>
                    <li>• 调整每页显示数量适应屏幕大小</li>
                    <li>• 使用键盘快捷键快速保存或取消</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">数据安全</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• 系统支持撤销/重做功能</li>
                    <li>• 所有操作都有详细的日志记录</li>
                    <li>• 导入前建议先导出备份</li>
                    <li>• 大批量操作前可先小范围测试</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">性能优化</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• 大数据量时使用分页浏览</li>
                    <li>• 避免同时编辑多个单元格</li>
                    <li>• 网络较慢时等待保存完成再继续</li>
                    <li>• 定期刷新数据确保最新状态</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-start space-x-2">
                    <InfoIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">快捷键</p>
                      <div className="text-blue-700 space-y-1">
                        <p><kbd className="px-1 py-0.5 bg-white rounded text-xs">Enter</kbd> - 保存编辑</p>
                        <p><kbd className="px-1 py-0.5 bg-white rounded text-xs">Esc</kbd> - 取消编辑</p>
                        <p><kbd className="px-1 py-0.5 bg-white rounded text-xs">Ctrl+Z</kbd> - 撤销操作</p>
                        <p><kbd className="px-1 py-0.5 bg-white rounded text-xs">Ctrl+Y</kbd> - 重做操作</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
