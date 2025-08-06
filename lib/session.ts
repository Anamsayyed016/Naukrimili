import { getServerSession } from 'next-auth';
import { authOptions } from './auth-config';

export async function getSession() {
  return await getServerSession(authOptions);
  // TODO: Complete function implementation
}
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
  // TODO: Complete function implementation
}
}