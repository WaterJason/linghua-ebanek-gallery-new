"use client"

import { DashboardPage, MobileDashboardPage } from "@/components/dashboard"
import { useIsMobile } from "@/hooks/use-mobile"

export default function Dashboard() {
  const isMobile = useIsMobile()

  return (
    <>
      {isMobile ? <MobileDashboardPage /> : <DashboardPage />}
    </>
  )
}
