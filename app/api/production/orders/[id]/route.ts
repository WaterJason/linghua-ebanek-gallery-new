import { NextRequest, NextResponse } from 'next/server';
import { 
  getProductionOrderById, 
  updateProductionOrder, 
  deleteProductionOrder,
  updateProductionOrderStage,
  updateProductionOrderStatus
} from '@/lib/actions/production-actions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const order = await getProductionOrderById(id);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Production order not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching production order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();
    
    const order = await updateProductionOrder(id, data);
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating production order:', error);
    return NextResponse.json(
      { error: 'Failed to update production order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await deleteProductionOrder(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting production order:', error);
    return NextResponse.json(
      { error: 'Failed to delete production order' },
      { status: 500 }
    );
  }
}
