import { NextRequest, NextResponse } from 'next/server';
import { 
  getQualityRecords,
  createQualityRecord
} from '@/lib/actions/production-actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productionOrderId = searchParams.get('productionOrderId');
    const productionBaseId = searchParams.get('productionBaseId');
    const result = searchParams.get('result');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const filters = {
      productionOrderId: productionOrderId ? parseInt(productionOrderId) : undefined,
      productionBaseId: productionBaseId ? parseInt(productionBaseId) : undefined,
      result: result || undefined,
    };

    const records = await getQualityRecords(filters, page, limit);
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching quality records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quality records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const record = await createQualityRecord(data);
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error creating quality record:', error);
    return NextResponse.json(
      { error: 'Failed to create quality record' },
      { status: 500 }
    );
  }
}
