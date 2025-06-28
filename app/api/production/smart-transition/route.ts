import { NextRequest, NextResponse } from 'next/server';
import { smartStageTransition } from '@/lib/actions/production-actions';

export async function POST(request: NextRequest) {
  try {
    const {
      orderId,
      targetStage,
      operatorId,
      userRole,
      conditions = {},
      notes
    } = await request.json();

    if (!orderId || !targetStage || !operatorId || !userRole) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const result = await smartStageTransition(
      orderId,
      targetStage,
      operatorId,
      userRole,
      conditions,
      notes
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in smart stage transition:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '智能状态转换失败' },
      { status: 500 }
    );
  }
}
