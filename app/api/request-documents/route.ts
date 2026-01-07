import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documents } = body;

    if (!documents || !Array.isArray(documents)) {
      return NextResponse.json(
        { error: 'Invalid documents data' },
        { status: 400 },
      );
    }

    // Create all document records
    const createdDocuments = await prisma.requestDocument.createMany({
      data: documents,
    });

    return NextResponse.json(
      { success: true, count: createdDocuments.count },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating request documents:', error);
    return NextResponse.json(
      { error: 'Failed to save documents' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID required' },
        { status: 400 },
      );
    }

    const documents = await prisma.requestDocument.findMany({
      where: { requestId },
      orderBy: { uploadedAt: 'asc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching request documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 },
    );
  }
}
