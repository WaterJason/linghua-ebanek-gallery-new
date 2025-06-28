import { NextRequest, NextResponse } from 'next/server';
import { runProductionAlerts } from '@/lib/actions/production-actions';

export async function GET() {
  try {
    const alertsReport = await runProductionAlerts();
    return NextResponse.json(alertsReport);
  } catch (error) {
    console.error('Error running production alerts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生产预警检查失败' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    // 手动触发预警检查
    const alertsReport = await runProductionAlerts();
    return NextResponse.json({
      message: '预警检查已完成',
      ...alertsReport
    });
  } catch (error) {
    console.error('Error running production alerts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生产预警检查失败' },
      { status: 500 }
    );
  }
}
