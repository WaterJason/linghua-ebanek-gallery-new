import { NextRequest, NextResponse } from 'next/server';
import { 
  getShippingRecords,
  createShippingRecord,
  updateShippingRecordStatus
} from '@/lib/actions/production-actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productionOrderId = searchParams.get('productionOrderId');
    const shippingType = searchParams.get('shippingType');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const filters = {
      productionOrderId: productionOrderId ? parseInt(productionOrderId) : undefined,
      shippingType: shippingType || undefined,
      status: status || undefined,
    };

    const records = await getShippingRecords(filters, page, limit);
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching shipping records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const record = await createShippingRecord(data);
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error creating shipping record:', error);
    return NextResponse.json(
      { error: 'Failed to create shipping record' },
      { status: 500 }
    );
  }
}
