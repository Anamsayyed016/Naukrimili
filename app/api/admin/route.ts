export function GET() {
  return new Response(JSON.stringify({
    userData: {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      avatar: 'https://example.com/avatar.jpg'
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
