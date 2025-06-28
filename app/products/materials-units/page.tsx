"use client"

import { ModernPageContainer } from "@/components/modern-page-container"
import { MaterialUnitManagement } from "@/components/product/material-unit-management"

export default function MaterialsUnitsPage() {
  return (
    <ModernPageContainer
      title="材质与单位管理"
      description="管理产品的材质和计量单位，支持创建、编辑和删除操作"
    >
      <MaterialUnitManagement />
    </ModernPageContainer>
  )
}
