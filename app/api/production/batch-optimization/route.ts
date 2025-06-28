import { NextRequest, NextResponse } from 'next/server';
import { optimizeBatchScheduling } from '@/lib/actions/production-actions';

export async function POST(request: NextRequest) {
  try {
    const {
      orderIds,
      optimizationGoal = 'minimize_time'
    } = await request.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: '请提供有效的订单ID列表' },
        { status: 400 }
      );
    }

    const optimization = await optimizeBatchScheduling(
      orderIds,
      optimizationGoal
    );

    return NextResponse.json(optimization);
  } catch (error) {
    console.error('Error optimizing batch scheduling:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '批量调度优化失败' },
      { status: 500 }
    );
  }
}
