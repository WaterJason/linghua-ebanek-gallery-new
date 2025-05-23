import { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { DictionaryList } from "@/components/settings/dictionary-list"

export const metadata: Metadata = {
  title: "数据字典管理",
  description: "管理系统数据字典和字典项",
}

export default function DictionariesPage() {
  return (
    <div className="flex flex-col space-y-6">
      <PageHeader
        title="数据字典管理"
        description="管理系统数据字典和字典项"
      />
      
      <div className="space-y-6">
        <DictionaryList />
      </div>
    </div>
  )
}
