import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const type = searchParams.get('type'); // 'service' or 'facility' for dashboard tabs
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const barangayId = searchParams.get('barangayId');

    // Get current session and user
    const session = await getSession();
    const currentUser = session?.user;

    if (id) {
      const item = await prisma.item.findUnique({
        where: { id },
        include: {
          category: true,
        },
      });

      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      // If admin, restrict to their barangay
      if (currentUser && currentUser.role === 'ADMIN') {
        const admin = await prisma.user.findUnique({
          where: { id: currentUser.id },
          select: { adminBarangayId: true },
        });
        if (
          item.barangayId &&
          admin?.adminBarangayId &&
          item.barangayId !== admin.adminBarangayId
        ) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      return NextResponse.json(item);
    }

    let where: any = {
      status: 'available',
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (type && (type === 'service' || type === 'facility')) {
      // Filter by category name (case-insensitive)
      where.category = { name: { equals: type, mode: 'insensitive' } };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // If admin, restrict to their barangay
    if (currentUser && currentUser.role === 'ADMIN') {
      const admin = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { adminBarangayId: true },
      });
      if (admin?.adminBarangayId) {
        where.barangayId = admin.adminBarangayId;
      }
    } else if (barangayId) {
      where.barangayId = barangayId;
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/items — Create new item
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const currentUser = session?.user;
    const body = await request.json();
    const { category_id, booking_rules, image_url, payment, ...data } = body;

    // Transform snake_case fields to camelCase for Prisma
    const createData: any = { ...data };

    if (booking_rules !== undefined) {
      createData.bookingRules = booking_rules;
    }

    if (image_url !== undefined) {
      createData.imageUrl = image_url;
    }

    if (category_id !== undefined) {
      if (category_id === null) {
        // Don't connect to any category
      } else {
        createData.category = { connect: { id: category_id } };
      }
    }

    // Lock new item to admin's barangay
    if (currentUser && currentUser.role === 'ADMIN') {
      const admin = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { adminBarangayId: true },
      });
      if (admin?.adminBarangayId) {
        createData.barangay = { connect: { id: admin.adminBarangayId } };
      } else {
        return NextResponse.json(
          { error: 'Admin has no assigned barangay' },
          { status: 400 },
        );
      }
    }

    // Note: 'payment' field is ignored as it doesn't exist in the Prisma schema

    const item = await prisma.item.create({
      data: createData,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/items — Update item
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, category_id, booking_rules, image_url, payment, ...data } =
      body;

    if (!id) {
      return NextResponse.json({ error: 'Missing item ID' }, { status: 400 });
    }

    // Transform snake_case fields to camelCase for Prisma
    const updateData: any = { ...data };

    if (booking_rules !== undefined) {
      updateData.bookingRules = booking_rules;
    }

    if (image_url !== undefined) {
      updateData.imageUrl = image_url;
    }

    if (category_id !== undefined) {
      if (category_id === null) {
        updateData.category = { disconnect: true };
      } else {
        updateData.category = { connect: { id: category_id } };
      }
    }

    // Note: 'payment' field is ignored as it doesn't exist in the Prisma schema

    const updatedItem = await prisma.item.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/items?id=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing item ID' }, { status: 400 });
    }

    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 },
    );
  }
}
