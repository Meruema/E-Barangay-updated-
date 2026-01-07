import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Fetch reservations for a specific facility and date
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const itemId = searchParams.get('itemId');
    const date = searchParams.get('date');

    if (!itemId || !date) {
      return NextResponse.json(
        { error: 'Item ID and date are required' },
        { status: 400 },
      );
    }

    // Only return confirmed reservations (pending ones don't block slots)
    const reservations = await prisma.reservation.findMany({
      where: {
        itemId,
        reservationDate: new Date(date),
        status: 'confirmed',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 },
    );
  }
}

// POST - Create a new reservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, itemId, reservationDate, timeSlots, reason } = body;

    if (
      !userId ||
      !itemId ||
      !reservationDate ||
      !timeSlots ||
      timeSlots.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Check if user already has a pending reservation for this facility
    const existingPendingReservation = await prisma.reservation.findFirst({
      where: {
        userId,
        itemId,
        status: 'pending',
      },
    });

    if (existingPendingReservation) {
      return NextResponse.json(
        {
          error:
            'You already have a pending reservation for this facility. Please wait for admin approval or cancellation before creating a new one.',
        },
        { status: 409 },
      );
    }

    // Check for conflicts with CONFIRMED reservations only
    const confirmedReservations = await prisma.reservation.findMany({
      where: {
        itemId,
        reservationDate: new Date(reservationDate),
        status: 'confirmed',
      },
    });

    const bookedSlots = confirmedReservations.flatMap((r) => r.timeSlots);
    const conflicts = timeSlots.filter((slot: string) =>
      bookedSlots.includes(slot),
    );

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: `Time slots already confirmed: ${conflicts.join(', ')}` },
        { status: 409 },
      );
    }

    // Create reservation (pending requests can overlap)
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        itemId,
        reservationDate: new Date(reservationDate),
        timeSlots,
        reason,
        status: 'pending',
      },
      include: {
        item: {
          select: {
            name: true,
            type: true,
          },
        },
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 },
    );
  }
}

// PATCH - Update reservation status (approve/reject by admin)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      reservationId,
      status,
      approvedBy,
      rejectionReason,
      autoRejectConflicts,
    } = body;

    console.log('PATCH reservation request:', {
      reservationId,
      status,
      approvedBy,
      rejectionReason,
      autoRejectConflicts,
    });

    if (!reservationId || !status) {
      return NextResponse.json(
        { error: 'Reservation ID and status are required' },
        { status: 400 },
      );
    }

    // Get the reservation being updated
    const currentReservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    console.log('Current reservation:', currentReservation);

    if (!currentReservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 },
      );
    }

    // If confirming, check for conflicts with other pending reservations
    let conflictingReservations: any[] = [];
    if (status === 'confirmed') {
      const pendingConflicts = await prisma.reservation.findMany({
        where: {
          id: { not: reservationId },
          itemId: currentReservation.itemId,
          reservationDate: currentReservation.reservationDate,
          status: 'pending',
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      // Check for actual time slot overlaps
      conflictingReservations = pendingConflicts.filter((res) =>
        res.timeSlots.some((slot: string) =>
          currentReservation.timeSlots.includes(slot),
        ),
      );

      // If conflicts exist and auto-reject not confirmed, return conflicts for user confirmation
      if (conflictingReservations.length > 0 && !autoRejectConflicts) {
        return NextResponse.json(
          {
            requiresConfirmation: true,
            conflictingReservations: conflictingReservations.map((r) => ({
              id: r.id,
              userName: r.user.fullName || r.user.email,
              timeSlots: r.timeSlots,
            })),
          },
          { status: 200 },
        );
      }
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'confirmed' && approvedBy) {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    }

    if (status === 'cancelled' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    console.log('Update data:', updateData);

    // Update the reservation
    const reservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: updateData,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        item: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('Updated reservation:', reservation);

    // Auto-reject conflicting reservations if confirming
    if (status === 'confirmed' && conflictingReservations.length > 0) {
      await prisma.reservation.updateMany({
        where: {
          id: { in: conflictingReservations.map((r) => r.id) },
        },
        data: {
          status: 'cancelled',
          rejectionReason: 'Time slot conflict with approved reservation',
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      reservation,
      rejectedCount: conflictingReservations.length,
    });
  } catch (error) {
    console.error('Error updating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 },
    );
  }
}
