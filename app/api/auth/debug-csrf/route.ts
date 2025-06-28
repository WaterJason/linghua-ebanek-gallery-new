import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [CSRF Debug] 开始CSRF调试")
    
    // 获取所有Cookie
    const cookies = request.cookies.getAll()
    console.log("🔍 [CSRF Debug] 所有Cookie:", cookies)
    
    // 检查CSRF Token相关的Cookie
    const csrfCookie = request.cookies.get("next-auth.csrf-token") || 
                      request.cookies.get("__Host-next-auth.csrf-token")
    
    console.log("🔍 [CSRF Debug] CSRF Cookie:", csrfCookie)
    
    // 检查Headers
    const headers = {
      'user-agent': request.headers.get('user-agent'),
      'referer': request.headers.get('referer'),
      'origin': request.headers.get('origin'),
      'host': request.headers.get('host'),
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
    }
    
    console.log("🔍 [CSRF Debug] 请求Headers:", headers)
    
    // 检查环境变量
    const envVars = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '已设置' : '未设置',
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
      AUTH_SECRET: process.env.AUTH_SECRET ? '已设置' : '未设置',
      NODE_ENV: process.env.NODE_ENV,
    }
    
    console.log("🔍 [CSRF Debug] 环境变量:", envVars)
    
    return NextResponse.json({
      success: true,
      debug: {
        cookies: cookies,
        csrfCookie: csrfCookie,
        headers: headers,
        envVars: envVars,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error("❌ [CSRF Debug] 调试失败:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [CSRF Debug] POST请求调试")
    
    const body = await request.text()
    console.log("🔍 [CSRF Debug] 请求体:", body)
    
    const contentType = request.headers.get('content-type')
    console.log("🔍 [CSRF Debug] Content-Type:", contentType)
    
    // 解析表单数据
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = new URLSearchParams(body)
      const csrfToken = formData.get('csrfToken')
      console.log("🔍 [CSRF Debug] 表单中的CSRF Token:", csrfToken)
      
      // 检查Cookie中的CSRF Token
      const csrfCookie = request.cookies.get("next-auth.csrf-token") || 
                        request.cookies.get("__Host-next-auth.csrf-token")
      console.log("🔍 [CSRF Debug] Cookie中的CSRF Token:", csrfCookie?.value)
      
      // 比较Token
      if (csrfToken && csrfCookie?.value) {
        const tokensMatch = csrfToken === csrfCookie.value
        console.log("🔍 [CSRF Debug] Token匹配:", tokensMatch)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "POST调试完成，查看服务器日志"
    })
    
  } catch (error) {
    console.error("❌ [CSRF Debug] POST调试失败:", error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
