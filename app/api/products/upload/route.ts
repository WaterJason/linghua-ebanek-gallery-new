import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-helpers"

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

/**
 * POST /api/products/upload - 产品图片上传
 * 支持多图片上传，文件格式验证
 * 性能目标：≤3秒 (5MB文件)
 */
export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    // 身份验证
    // const session = await getServerSession()
    // if (!session) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    console.log("🔄 [POST /api/products/upload] 开始文件上传...")

    // 解析表单数据
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({
        error: "No files provided",
        details: "请选择要上传的文件"
      }, { status: 400 })
    }

    // 验证文件
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxFileSize = 5 * 1024 * 1024 // 5MB
    const uploadedFiles = []
    const errors = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        // 验证文件类型
        if (!allowedTypes.includes(file.type)) {
          errors.push({
            file: file.name,
            error: `不支持的文件类型: ${file.type}。支持的格式: JPG, PNG, WebP`
          })
          continue
        }

        // 验证文件大小
        if (file.size > maxFileSize) {
          errors.push({
            file: file.name,
            error: `文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB。最大支持: 5MB`
          })
          continue
        }

        // 生成唯一文件名
        const timestamp = Date.now()
        const randomString = Math.random().toString(36).substring(2, 15)
        const extension = file.name.split('.').pop()
        const fileName = `product_${timestamp}_${randomString}.${extension}`

        // 确保上传目录存在
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'products')
        await mkdir(uploadDir, { recursive: true })

        // 保存文件
        const filePath = join(uploadDir, fileName)
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        // 生成访问URL
        const fileUrl = `/uploads/products/${fileName}`

        uploadedFiles.push({
          originalName: file.name,
          fileName,
          url: fileUrl,
          size: file.size,
          type: file.type
        })

        console.log(`✅ 文件上传成功: ${file.name} -> ${fileName}`)
      } catch (error) {
        console.error(`❌ 文件上传失败: ${file.name}`, error)
        errors.push({
          file: file.name,
          error: error instanceof Error ? error.message : "上传失败"
        })
      }
    }

    const responseTime = Date.now() - startTime
    console.log(`🔄 [POST /api/products/upload] 上传完成, 响应时间: ${responseTime}ms`)

    return NextResponse.json({
      success: true,
      message: `成功上传 ${uploadedFiles.length} 个文件`,
      files: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
      performance: {
        responseTime,
        operation: "upload",
        fileCount: uploadedFiles.length
      }
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ [POST /api/products/upload] 上传失败:", error)
    return NextResponse.json({
      error: "File upload failed",
      details: error instanceof Error ? error.message : "Unknown error",
      performance: { responseTime }
    }, { status: 500 })
  }
}

/**
 * DELETE /api/products/upload - 删除产品图片
 * 支持批量删除
 */
export async function DELETE(request: Request) {
  const startTime = Date.now()

  try {
    const { urls } = await request.json()
    console.log("🔄 [DELETE /api/products/upload] 删除文件:", urls)

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({
        error: "No file URLs provided",
        details: "请提供要删除的文件URL"
      }, { status: 400 })
    }

    const deletedFiles = []
    const errors = []

    for (const url of urls) {
      try {
        // 从URL提取文件名
        const fileName = url.split('/').pop()
        if (!fileName) {
          errors.push({
            url,
            error: "无效的文件URL"
          })
          continue
        }

        // 构建文件路径
        const filePath = join(process.cwd(), 'public', 'uploads', 'products', fileName)

        // 删除文件
        const fs = require('fs').promises
        await fs.unlink(filePath)

        deletedFiles.push({
          url,
          fileName
        })

        console.log(`✅ 文件删除成功: ${fileName}`)
      } catch (error) {
        console.error(`❌ 文件删除失败: ${url}`, error)
        errors.push({
          url,
          error: error instanceof Error ? error.message : "删除失败"
        })
      }
    }

    const responseTime = Date.now() - startTime
    console.log(`🔄 [DELETE /api/products/upload] 删除完成, 响应时间: ${responseTime}ms`)

    return NextResponse.json({
      success: true,
      message: `成功删除 ${deletedFiles.length} 个文件`,
      deletedFiles,
      errors: errors.length > 0 ? errors : undefined,
      performance: {
        responseTime,
        operation: "delete",
        fileCount: deletedFiles.length
      }
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error("❌ [DELETE /api/products/upload] 删除失败:", error)
    return NextResponse.json({
      error: "File deletion failed",
      details: error instanceof Error ? error.message : "Unknown error",
      performance: { responseTime }
    }, { status: 500 })
  }
}
