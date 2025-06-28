import { NextRequest, NextResponse } from 'next/server';
import { generateSmartSchedule } from '@/lib/actions/production-actions';

export async function POST(request: NextRequest) {
  try {
    const {
      orderId,
      productComplexity = 1,
      urgencyLevel = 'NORMAL'
    } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: '缺少订单ID' },
        { status: 400 }
      );
    }

    const schedule = await generateSmartSchedule(
      orderId,
      productComplexity,
      urgencyLevel
    );

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error generating smart schedule:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '智能调度生成失败' },
      { status: 500 }
    );
  }
}
