import { NextRequest, NextResponse } from 'next/server';
import { 
  getProductionCosts,
  createProductionCost
} from '@/lib/actions/production-actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productionOrderId = searchParams.get('productionOrderId');
    const stage = searchParams.get('stage');
    const costType = searchParams.get('costType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const filters = {
      productionOrderId: productionOrderId ? parseInt(productionOrderId) : undefined,
      stage: stage || undefined,
      costType: costType || undefined,
    };

    const costs = await getProductionCosts(filters, page, limit);
    return NextResponse.json(costs);
  } catch (error) {
    console.error('Error fetching production costs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production costs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const cost = await createProductionCost(data);
    return NextResponse.json(cost);
  } catch (error) {
    console.error('Error creating production cost:', error);
    return NextResponse.json(
      { error: 'Failed to create production cost' },
      { status: 500 }
    );
  }
}
