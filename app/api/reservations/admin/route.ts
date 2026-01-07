import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch all reservations for admin (with optional barangay filter)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const barangayId = searchParams.get('barangayId');
    const status = searchParams.get('status');

    const where: any = {};

    // Filter by barangay if provided (for admin users)
    if (barangayId) {
      where.item = {
        barangayId,
      };
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      where.status = status;
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        item: {
          select: {
            id: true,
            name: true,
            type: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ reservationDate: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('Error fetching admin reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 },
    );
  }
}
