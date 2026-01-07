import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, reason, suspendedBy } = body;

    if (!userId || !reason || !suspendedBy) {
      return NextResponse.json(
        { error: 'User ID, reason, and suspended by are required' },
        { status: 400 },
      );
    }

    // Update user account status to suspended
    await prisma.user.update({
      where: { id: userId },
      data: { accountStatus: 'suspended' },
    });

    // Create suspension record
    const suspension = await prisma.accountSuspension.create({
      data: {
        userId,
        reason,
        suspendedBy,
        isActive: true,
      },
    });

    return NextResponse.json(suspension, { status: 201 });
  } catch (error) {
    console.error('Error suspending user:', error);
    return NextResponse.json(
      { error: 'Failed to suspend user' },
      { status: 500 },
    );
  }
}
