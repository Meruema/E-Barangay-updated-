import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

// Only SUPER_ADMIN can access these endpoints
async function requireSuperAdmin(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  // List all barangays (public)
  const barangays = await prisma.barangay.findMany();
  return NextResponse.json(barangays);
}

export async function POST(request: NextRequest) {
  // Create a new barangay
  const unauthorized = await requireSuperAdmin(request);
  if (unauthorized) return unauthorized;
  const { name } = await request.json();
  if (!name)
    return NextResponse.json({ error: 'Name required' }, { status: 400 });
  // Check for duplicate
  const existing = await prisma.barangay.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'Barangay already exists.' },
      { status: 400 },
    );
  }
  const barangay = await prisma.barangay.create({ data: { name } });
  return NextResponse.json(barangay);
}

export async function PUT(request: NextRequest) {
  // Update barangay name
  const unauthorized = await requireSuperAdmin(request);
  if (unauthorized) return unauthorized;
  const { id, name } = await request.json();
  if (!id || !name)
    return NextResponse.json(
      { error: 'ID and name required' },
      { status: 400 },
    );
  const barangay = await prisma.barangay.update({
    where: { id },
    data: { name },
  });
  return NextResponse.json(barangay);
}

export async function DELETE(request: NextRequest) {
  // Delete barangay
  const unauthorized = await requireSuperAdmin(request);
  if (unauthorized) return unauthorized;
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  await prisma.barangay.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
