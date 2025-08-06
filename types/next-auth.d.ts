import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      role?: string} & DefaultSession['user']}

  interface User {
    id: string}
}
