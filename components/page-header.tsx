import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  children?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {backHref && (
            <Button variant="outline" size="icon" asChild className="mr-2">
              <Link href={backHref} aria-label={backLabel || "返回"}>
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        {children}
      </div>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
