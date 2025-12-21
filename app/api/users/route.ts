import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { randomUUID } from 'crypto';
import { Barangay } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Frontend → Prisma enum mapping
const barangayMap = {
  'Molino I': 'Molino_I',
  'Molino II': 'Molino_II',
  'Molino III': 'Molino_III',
  'Molino IV': 'Molino_IV',
} as const;

type BarangayKey = keyof typeof barangayMap; // "Molino I" | "Molino II" | "Molino III" | "Molino IV"

// Helper to map frontend string to Prisma enum
const prismaBarangay = (barangay: BarangayKey) => barangayMap[barangay];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password, authUserId, barangay } = body;

    if (!email || !username || !barangay) {
      return NextResponse.json(
        { error: 'Email, username, and barangay are required' },
        { status: 400 },
      );
    }

    if (!Object.keys(barangayMap).includes(barangay)) {
      return NextResponse.json(
        { error: `Invalid barangay: ${barangay}` },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 409 },
      );
    }

    // Hash password (replace placeholder with proper hash in production)
    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : 'hashed_password_placeholder';

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        id: authUserId || randomUUID(),
        email,
        username,
        password: hashedPassword,
        role: 'USER',
        barangay: prismaBarangay(barangay as BarangayKey) as Barangay,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const email = searchParams.get('email');
    const username = searchParams.get('username');

    if (id) {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json(user);
    }
    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json(user);
    }
    if (username) {
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json(user);
    }
    // Return all users for admin page
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        barangay: {
          select: {
            name: true,
          },
        },
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching user(s):', error);
    return NextResponse.json(
      { error: 'Failed to fetch user(s)' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      );
    }
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      );
    }
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 },
    );
  }
}
