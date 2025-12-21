import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    // Get current session and user
    const session = await getSession();
    const currentUser = session?.user;

    if (id) {
      const requestData = await prisma.request.findUnique({
        where: { id },
        include: {
          item: {
            include: {
              category: true,
            },
          },
          actions: true,
        },
      });

      if (!requestData) {
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 },
        );
      }

      // If admin, restrict to their barangay
      if (currentUser && currentUser.role === 'ADMIN') {
        // Only allow if the request's item is in the admin's barangay
        const admin = await prisma.user.findUnique({
          where: { id: currentUser.id },
          select: { adminBarangayId: true },
        });
        if (
          requestData.item?.barangayId &&
          admin?.adminBarangayId &&
          requestData.item.barangayId !== admin.adminBarangayId
        ) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      return NextResponse.json(requestData);
    }

    let where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    // If admin, restrict to their barangay
    if (currentUser && currentUser.role === 'ADMIN') {
      const admin = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { adminBarangayId: true },
      });
      if (admin?.adminBarangayId) {
        where.item = { barangayId: admin.adminBarangayId };
      }
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        item: {
          include: {
            category: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        actions: {
          orderBy: { actionDate: 'desc' },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, itemId, reason } = body;

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: 'userId and itemId are required' },
        { status: 400 },
      );
    }

    const newRequest = await prisma.request.create({
      data: {
        userId,
        itemId,
        reason: reason || null,
        status: 'pending',
      },
      include: {
        item: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, remarks, adminUserId } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Request id is required' },
        { status: 400 },
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 },
      );
    }

    // Update request status
    const updatedRequest = await prisma.request.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        item: {
          include: {
            category: true,
          },
        },
        actions: true,
      },
    });

    // Create request action if adminUserId is provided
    if (adminUserId) {
      await prisma.requestAction.create({
        data: {
          requestId: id,
          adminUserId,
          actionType: status,
          remarks: remarks || null,
          actionDate: new Date(),
        },
      });

      // Fetch updated request with new action
      const requestWithAction = await prisma.request.findUnique({
        where: { id },
        include: {
          item: {
            include: {
              category: true,
            },
          },
          actions: {
            orderBy: { actionDate: 'desc' },
          },
        },
      });

      return NextResponse.json(requestWithAction);
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 },
    );
  }
}
