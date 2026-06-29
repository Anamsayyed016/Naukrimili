/**
 * Socket.io is mounted only when running server.cjs (not Next.js standalone).
 * Opt in via NEXT_PUBLIC_SOCKET_ENABLED=true on both server and client.
 */
export function isSocketClientEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SOCKET_ENABLED === 'true';
}
