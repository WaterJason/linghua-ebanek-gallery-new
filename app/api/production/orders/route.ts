import { NextRequest, NextResponse } from 'next/server';
import { getProductionOrders, createProductionOrder } from '@/lib/actions/production-actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const productionBaseId = searchParams.get('productionBaseId');
    const assignedToUserId = searchParams.get('assignedToUserId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    const filters = {
      stage: stage || undefined,
      status: status || undefined,
      priority: priority || undefined,
      productionBaseId: productionBaseId ? parseInt(productionBaseId) : undefined,
      assignedToUserId: assignedToUserId ? parseInt(assignedToUserId) : undefined,
      search: search || undefined,
    };

    const orders = await getProductionOrders(filters, page, limit);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching production orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const order = await createProductionOrder(data);
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error creating production order:', error);
    return NextResponse.json(
      { error: 'Failed to create production order' },
      { status: 500 }
    );
  }
}
