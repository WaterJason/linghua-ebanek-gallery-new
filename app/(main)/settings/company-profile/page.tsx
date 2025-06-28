"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import {
  BuildingIcon,
  SaveIcon,
  RefreshCwIcon,
  UploadIcon,
  ImageIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  FileTextIcon
} from "lucide-react"
import { useEnhancedOperations } from "@/lib/enhanced-operations-integration"
import { ModernPageContainer } from "@/components/modern-page-container"

interface CompanyProfile {
  id?: number
  companyName: string
  companyNameEn?: string
  logoUrl?: string
  address: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
  phone: string
  fax?: string
  email: string
  website?: string
  taxNumber?: string
  businessLicense?: string
  legalRepresentative?: string
  registeredCapital?: string
  businessScope?: string
  description?: string
  foundedDate?: string
}

export default function CompanyProfilePage() {
  const enhancedOps = useEnhancedOperations()
  const [profile, setProfile] = useState<CompanyProfile>({
    companyName: "",
    address: "",
    phone: "",
    email: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchCompanyProfile()
  }, [])

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/settings/company-profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        if (data.logoUrl) {
          setLogoPreview(data.logoUrl)
        }
      } else {
        // 如果没有数据，使用默认值
        console.log("No company profile found, using defaults")
      }
    } catch (error) {
      console.error("获取公司信息失败:", error)
      toast({
        title: "错误",
        description: "获取公司信息失败",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CompanyProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "文件过大",
          description: "Logo文件大小不能超过5MB",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "文件格式错误",
          description: "请选择图片文件",
          variant: "destructive",
        })
        return
      }

      setLogoFile(file)

      // 创建预览
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null

    const formData = new FormData()
    formData.append('file', logoFile)
    formData.append('type', 'company-logo')

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Logo上传失败")
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("Logo上传失败:", error)
      throw error
    }
  }

  const handleSave = async () => {
    try {
      await enhancedOps.executeOperation(
        async () => {
          setSaving(true)

          let logoUrl = profile.logoUrl

          // 如果有新的Logo文件，先上传
          if (logoFile) {
            logoUrl = await uploadLogo()
          }

          const profileData = {
            ...profile,
            logoUrl,
          }

          const response = await fetch("/api/settings/company-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profileData)
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "保存公司信息失败")
          }

          const savedProfile = await response.json()
          setProfile(savedProfile)
          setLogoFile(null)

          return savedProfile
        },
        {
          playSound: true,
          soundType: 'success',
          feedbackMessage: "公司信息保存成功",
          enableUndo: true,
          undoTags: ['save', 'company-profile'],
          undoPriority: 7
        }
      )
    } catch (error) {
      console.error("保存公司信息失败:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleRefresh = () => {
    fetchCompanyProfile()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <ModernPageContainer
      title="公司信息设置"
      description="管理公司基本信息和Logo"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || saving}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            <SaveIcon className="mr-2 h-4 w-4" />
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo上传区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              公司Logo
            </CardTitle>
            <CardDescription>
              上传公司Logo，支持JPG、PNG格式，最大5MB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center bg-muted/10">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Company Logo"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center">
                    <BuildingIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">暂无Logo</p>
                  </div>
                )}
              </div>

              <div className="w-full">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center w-full p-2 border border-dashed border-muted-foreground/25 rounded-lg hover:bg-muted/50 transition-colors">
                    <UploadIcon className="h-4 w-4 mr-2" />
                    选择Logo文件
                  </div>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>

              {logoFile && (
                <p className="text-sm text-muted-foreground">
                  已选择: {logoFile.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 基本信息 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BuildingIcon className="h-5 w-5" />
              基本信息
            </CardTitle>
            <CardDescription>
              配置公司的基本信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">公司名称 *</Label>
                <Input
                  id="companyName"
                  value={profile.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="输入公司名称"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyNameEn">公司英文名称</Label>
                <Input
                  id="companyNameEn"
                  value={profile.companyNameEn || ""}
                  onChange={(e) => handleInputChange('companyNameEn', e.target.value)}
                  placeholder="输入公司英文名称"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4" />
                公司地址 *
              </Label>
              <Textarea
                id="address"
                value={profile.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="输入公司详细地址"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">城市</Label>
                <Input
                  id="city"
                  value={profile.city || ""}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="城市"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">省份</Label>
                <Input
                  id="province"
                  value={profile.province || ""}
                  onChange={(e) => handleInputChange('province', e.target.value)}
                  placeholder="省份"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">邮政编码</Label>
                <Input
                  id="postalCode"
                  value={profile.postalCode || ""}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="邮政编码"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 联系信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhoneIcon className="h-5 w-5" />
            联系信息
          </CardTitle>
          <CardDescription>
            配置公司的联系方式
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4" />
                联系电话 *
              </Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="输入联系电话"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fax">传真号码</Label>
              <Input
                id="fax"
                value={profile.fax || ""}
                onChange={(e) => handleInputChange('fax', e.target.value)}
                placeholder="输入传真号码"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <MailIcon className="h-4 w-4" />
                邮箱地址 *
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="输入邮箱地址"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">官方网站</Label>
              <Input
                id="website"
                value={profile.website || ""}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 法律信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            法律信息
          </CardTitle>
          <CardDescription>
            配置公司的法律和注册信息
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxNumber">税务登记号</Label>
              <Input
                id="taxNumber"
                value={profile.taxNumber || ""}
                onChange={(e) => handleInputChange('taxNumber', e.target.value)}
                placeholder="输入税务登记号"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessLicense">营业执照号</Label>
              <Input
                id="businessLicense"
                value={profile.businessLicense || ""}
                onChange={(e) => handleInputChange('businessLicense', e.target.value)}
                placeholder="输入营业执照号"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="legalRepresentative">法定代表人</Label>
              <Input
                id="legalRepresentative"
                value={profile.legalRepresentative || ""}
                onChange={(e) => handleInputChange('legalRepresentative', e.target.value)}
                placeholder="输入法定代表人姓名"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registeredCapital">注册资本</Label>
              <Input
                id="registeredCapital"
                value={profile.registeredCapital || ""}
                onChange={(e) => handleInputChange('registeredCapital', e.target.value)}
                placeholder="输入注册资本"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessScope">经营范围</Label>
            <Textarea
              id="businessScope"
              value={profile.businessScope || ""}
              onChange={(e) => handleInputChange('businessScope', e.target.value)}
              placeholder="输入经营范围"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="foundedDate">成立日期</Label>
              <Input
                id="foundedDate"
                type="date"
                value={profile.foundedDate || ""}
                onChange={(e) => handleInputChange('foundedDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">国家/地区</Label>
              <Input
                id="country"
                value={profile.country || "中国"}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="国家/地区"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">公司简介</Label>
            <Textarea
              id="description"
              value={profile.description || ""}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="输入公司简介"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </ModernPageContainer>
  )
}
