import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

const SESSION_COOKIE_NAME = 'session_token';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function createSession(userId: string) {
  const cookieStore = await cookies();

  // Session token keeps the full UUID intact by using a delimiter not present in UUIDs.
  const randomPart = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  const sessionToken = `${userId}::${randomPart}`;

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return sessionToken;
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  // Extract user ID from session token (preserves UUID hyphen structure)
  if (!sessionToken.includes('::')) {
    // Legacy session token format (cannot recover full UUID). Clear it and treat as unauthenticated.
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  const [userId] = sessionToken.split('::');

  if (!isValidUuid(userId)) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  if (!userId) {
    return null;
  }

  // Verify user exists in database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      barangay: true,
      fullName: true,
      blkLot: true,
      street: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      barangay: user.barangay,
      fullName: user.fullName,
      blkLot: user.blkLot,
      street: user.street,
      role: user.role,
    },
  };
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

function isValidUuid(value: string): boolean {
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(value);
}
