import { NextResponse } from "next/server";
import { createPosSale } from "@/lib/actions/pos-actions";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const result = await createPosSale(data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating POS sale:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create POS sale" },
      { status: 500 }
    );
  }
}
