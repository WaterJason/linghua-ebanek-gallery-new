"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import { DesktopEmployeesPage } from "@/components/employees/desktop-employees-page"
import { MobileEmployeesPage } from "@/components/employees/mobile-employees-page"

export default function EmployeesPage() {
  const isMobile = useIsMobile()

  return (
    <>
      {isMobile ? <MobileEmployeesPage /> : <DesktopEmployeesPage />}
    </>
  )
}
