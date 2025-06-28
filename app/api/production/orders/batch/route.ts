import { NextRequest, NextResponse } from 'next/server';
import { 
  batchUpdateProductionOrders,
  batchCreateProductionOrders,
  batchDeleteProductionOrders
} from '@/lib/actions/production-actions';

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    
    let result;
    
    switch (action) {
      case 'create':
        result = await batchCreateProductionOrders(data);
        break;
      case 'update':
        result = await batchUpdateProductionOrders(data);
        break;
      case 'delete':
        result = await batchDeleteProductionOrders(data.ids);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid batch action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in batch operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform batch operation' },
      { status: 500 }
    );
  }
}
