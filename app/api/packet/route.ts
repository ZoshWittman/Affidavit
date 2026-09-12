import { NextRequest, NextResponse } from 'next/server';
import { PacketManager } from '@/lib/packet';
import { createEvidence } from '@/lib/evidence';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { report, evidence } = body;

    if (!report || !report.title || !report.content || !Array.isArray(report.claims)) {
      return NextResponse.json(
        { error: 'Invalid report data' },
        { status: 400 }
      );
    }

    if (!Array.isArray(evidence)) {
      return NextResponse.json(
        { error: 'Evidence must be an array' },
        { status: 400 }
      );
    }

    const reportData = {
      id: crypto.randomUUID(),
      title: report.title,
      content: report.content,
      claims: report.claims,
      submittedAt: Date.now(),
    };

    const evidenceLedger = evidence.map((item: any) => {
      return createEvidence(
        item.type || 'digest',
        item.content || ''
      );
    });

    const manager = new PacketManager();
    const packet = manager.createPacket(reportData, evidenceLedger);

    return NextResponse.json({
      success: true,
      packetId: packet.id,
      verdict: packet.verdict,
    });
  } catch (error: any) {
    console.error('Error creating packet:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const manager = new PacketManager();
    const packets = manager.listPackets(50);
    const stats = manager.getStats();

    return NextResponse.json({
      packets,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching packets:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
