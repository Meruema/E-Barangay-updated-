'use server';

import prisma from '@/lib/prisma';
import type { Barangay } from '@/lib/database.types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import {
  createSession as createSessionBase,
  getSession as getSessionBase,
  deleteSession as deleteSessionBase,
} from '@/lib/auth/session';
import { randomUUID } from 'crypto';

// -----------------
// Session User type
// -----------------
export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  blkLot: string;
  street: string;
  role: string;
  barangay: Barangay | null;
};

// -----------------
// Sign up
// -----------------
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  blkLot: string,
  street: string,
  barangayId: string,
  idUrl?: string,
  addressUrl?: string,
) {
  const existingUser = await prisma.user.findFirst({
    where: { email },
  });

  if (existingUser) return { error: 'User with this email already exists' };

  const hashedPassword = await bcrypt.hash(password, 10);

  // Validate barangayId exists
  const barangayExists = await prisma.barangay.findUnique({
    where: { id: barangayId },
  });
  if (!barangayExists) return { error: `Invalid barangay selected.` };

  try {
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email,
        fullName,
        blkLot,
        street,
        password: hashedPassword,
        role: 'USER',
        barangay: { connect: { id: barangayId } },
        createdAt: new Date(),
        updatedAt: new Date(),
        idUrl,
        addressUrl,
      },
    });

    revalidatePath('/');
    return { user };
  } catch (dbError: any) {
    console.error('Error creating user:', dbError);
    return { error: 'Failed to create user. Please try again.' };
  }
}

// -----------------
// Sign in
// -----------------
export async function signIn(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      blkLot: true,
      street: true,
      password: true,
      role: true,
      barangay: true,
      verified: true,
    },
  });

  if (!user) return { error: 'Invalid email or password' };

  if (!user.verified) return { error: 'Your account is not verified yet.' };

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return { error: 'Invalid email or password' };

  await createSessionBase(user.id); // ✅ only userId

  revalidatePath('/');
  return {
    user,
    role: user.role || 'USER',
  };
}

// -----------------
// Get current user
// -----------------
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSessionBase();
  if (!session) return null;

  // Fetch full user from DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }, // session stores a user object with an id
    select: {
      id: true,
      email: true,
      fullName: true,
      blkLot: true,
      street: true,
      role: true,
      barangay: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName || '',
    blkLot: user.blkLot || '',
    street: user.street || '',
    barangay: user.barangay
      ? {
          id: user.barangay.id,
          name: user.barangay.name,
          created_at:
            (user.barangay as any).created_at ??
            (user.barangay as any).createdAt ??
            '',
          updated_at:
            (user.barangay as any).updated_at ??
            (user.barangay as any).updatedAt ??
            '',
        }
      : null,
    role: user.role || 'USER',
  };
}

// -----------------
// Sign out
// -----------------
export async function signOut() {
  await deleteSessionBase();
  revalidatePath('/');
  redirect('/');
}
