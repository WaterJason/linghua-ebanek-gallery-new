import { NextRequest, NextResponse } from 'next/server';
import { getProductionBases, createProductionBase } from '@/lib/actions/production-actions';

export async function GET() {
  try {
    const bases = await getProductionBases();
    return NextResponse.json(bases);
  } catch (error) {
    console.error('Error fetching production bases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production bases' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const base = await createProductionBase(data);
    return NextResponse.json(base);
  } catch (error) {
    console.error('Error creating production base:', error);
    return NextResponse.json(
      { error: 'Failed to create production base' },
      { status: 500 }
    );
  }
}
