import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import prisma from "@/lib/db"

// 确保上传目录存在
async function ensureDir(dirPath: string) {
  try {
    await mkdir(dirPath, { recursive: true })
  } catch (error) {
    console.error("创建目录失败:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // 检查用户是否已登录
    let session = null;
    try {
      const authModule = await import("@/auth").catch(e => {
        console.error("Failed to import auth module:", e);
        return { auth: null };
      });

      if (authModule.auth) {
        session = await authModule.auth();
      }
    } catch (authError) {
      console.error("Authentication error:", authError);
    }

    console.log("Upload API - Session:", session ? "Authenticated" : "Not authenticated")

    // 临时禁用会话检查，用于调试
    // if (!session) {
    //   return NextResponse.json({ error: "未授权" }, { status: 403 })
    // }

    // 检查系统设置是否允许上传图片
    try {
      const settings = await prisma.systemSetting.findFirst()
      console.log("Upload API - System settings:", settings)
      if (settings && !settings.enableImageUpload) {
        return NextResponse.json({ error: "系统已禁用图片上传功能" }, { status: 403 })
      }
    } catch (settingsError) {
      console.error("Error checking system settings:", settingsError)
      // 继续执行，不阻止上传
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const gallerySaleId = formData.get("gallerySaleId") as string

    if (!file) {
      return NextResponse.json({ error: "未提供文件" }, { status: 400 })
    }

    // 检查文件类型
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "不支持的文件类型" }, { status: 400 })
    }

    // 检查文件大小（限制为30MB）
    const maxSize = 30 * 1024 * 1024 // 30MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: `文件大小超过限制，最大支持${maxSize / 1024 / 1024}MB` }, { status: 400 })
    }

    // 生成唯一文件名
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`

    // 设置上传路径
    const uploadDir = join(process.cwd(), "public", "uploads")
    const filePath = join(uploadDir, fileName)

    // 确保上传目录存在
    await ensureDir(uploadDir)

    // 读取文件内容
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 写入文件
    await writeFile(filePath, buffer)

    // 保存文件信息到数据库
    let uploadedFile;
    try {
      uploadedFile = await prisma.uploadedFile.create({
        data: {
          filename: fileName,
          originalName: file.name,
          path: `/uploads/${fileName}`,
          mimetype: file.type,
          size: file.size,
          gallerySaleId: gallerySaleId ? Number(gallerySaleId) : null,
        },
      })
      console.log("File record created in database:", uploadedFile)
    } catch (dbError) {
      console.error("Error saving file to database:", dbError)
      // 即使数据库记录失败，也返回文件URL
      return NextResponse.json({
        success: true,
        file: {
          id: 0, // 临时ID
          filename: fileName,
          path: `/uploads/${fileName}`,
          url: `/uploads/${fileName}`,
        },
      })
    }

    // 如果提供了销售记录ID，更新销售记录的图片URL
    if (gallerySaleId) {
      await prisma.gallerySale.update({
        where: { id: Number(gallerySaleId) },
        data: {
          imageUrl: `/uploads/${fileName}`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      file: {
        id: uploadedFile.id,
        filename: uploadedFile.filename,
        path: uploadedFile.path,
        url: `/uploads/${fileName}`,
      },
    })
  } catch (error) {
    console.error("文件上传失败:", error)
    return NextResponse.json({ error: "文件上传失败" }, { status: 500 })
  }
}
