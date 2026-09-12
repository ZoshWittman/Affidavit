import { NextRequest, NextResponse } from 'next/server';
import { PacketManager } from '@/lib/packet';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { humanName } = body;

    if (!humanName || typeof humanName !== 'string') {
      return NextResponse.json(
        { error: 'humanName is required' },
        { status: 400 }
      );
    }

    const manager = new PacketManager();
    const success = manager.sealPacket(id, humanName);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to seal packet. Only HOLD packets can be sealed.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sealing packet:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
