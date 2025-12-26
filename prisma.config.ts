export default {
  datasource: {
    provider: 'postgresql' as const,
    url: process.env.DATABASE_URL,
  },
};

