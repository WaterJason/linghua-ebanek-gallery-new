import { PageHeader } from "@/components/page-header"
import { SystemSettings } from "@/components/settings/system-settings"

export function DesktopSettingsPage() {
  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="系统设置"
        description="管理系统设置和配置"
      />
      
      <div className="space-y-6">
        <SystemSettings />
      </div>
    </div>
  )
}
