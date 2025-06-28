import { NextRequest, NextResponse } from 'next/server';
import { 
  getProductionStageHistory,
  createProductionStageHistory
} from '@/lib/actions/production-actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productionOrderId = searchParams.get('productionOrderId');
    const stage = searchParams.get('stage');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const filters = {
      productionOrderId: productionOrderId ? parseInt(productionOrderId) : undefined,
      stage: stage || undefined,
    };

    const history = await getProductionStageHistory(filters, page, limit);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching stage history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stage history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const history = await createProductionStageHistory(data);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error creating stage history:', error);
    return NextResponse.json(
      { error: 'Failed to create stage history' },
      { status: 500 }
    );
  }
}
