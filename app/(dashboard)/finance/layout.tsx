import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { DashboardNav } from "@/components/dashboard-nav"
import { SiteFooter } from "@/components/site-footer"
import { UserAccountNav } from "@/components/user-account-nav"
import { MainNav } from "@/components/main-nav"
import { MobileNav } from "@/components/mobile-nav"
import { getUser } from "@/lib/actions/user-actions"

export const metadata: Metadata = {
  title: "财务管理",
  description: "管理企业财务，包括资金账户、收支记录和财务报表。",
}

interface FinanceLayoutProps {
  children?: React.ReactNode
}

export default async function FinanceLayout({ children }: FinanceLayoutProps) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const user = await getUser(session.user.id)

  return (
    <div className="flex min-h-screen flex-col space-y-6">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav />
          <div className="hidden md:flex">
            <UserAccountNav
              user={{
                name: user?.name,
                image: user?.image,
                email: user?.email,
              }}
            />
          </div>
          <MobileNav />
        </div>
      </header>
      <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex">
          <DashboardNav />
        </aside>
        <main className="flex w-full flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
      <SiteFooter className="border-t" />
    </div>
  )
}
