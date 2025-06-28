import { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { DictionaryDetail } from "@/components/settings/dictionary-detail"
import { getDictionary } from "@/lib/actions/dictionary-actions"

interface DictionaryDetailPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: DictionaryDetailPageProps): Promise<Metadata> {
  const id = parseInt(params.id)
  
  try {
    const dictionary = await getDictionary(id)
    return {
      title: `数据字典 - ${dictionary.name}`,
      description: dictionary.description || `管理数据字典 ${dictionary.name} 的字典项`,
    }
  } catch (error) {
    return {
      title: "数据字典详情",
      description: "管理数据字典的字典项",
    }
  }
}

export default async function DictionaryDetailPage({ params }: DictionaryDetailPageProps) {
  const id = parseInt(params.id)
  
  try {
    const dictionary = await getDictionary(id)
    
    return (
      <div className="flex flex-col space-y-6">
        <PageHeader
          title={`数据字典: ${dictionary.name}`}
          description={dictionary.description || "管理数据字典的字典项"}
          backHref="/settings/dictionaries"
          backLabel="返回数据字典列表"
        />
        
        <div className="space-y-6">
          <DictionaryDetail dictionary={dictionary} />
        </div>
      </div>
    )
  } catch (error) {
    return notFound()
  }
}
