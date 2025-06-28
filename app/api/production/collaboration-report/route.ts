import { NextRequest, NextResponse } from 'next/server';
import { generateLocationCollaborationReport } from '@/lib/actions/production-actions';

export async function GET() {
  try {
    const report = await generateLocationCollaborationReport();
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating collaboration report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '地点协作报告生成失败' },
      { status: 500 }
    );
  }
}
