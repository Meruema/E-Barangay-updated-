import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch reservations for a specific user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    const reservations = await prisma.reservation.findMany({
      where: { userId },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            type: true,
            category: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: [{ reservationDate: 'desc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 },
    );
  }
}
