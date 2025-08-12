import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";
import { MongoClient } from "mongodb";
import { configureToMatchImageSnapshot } from "jest-image-snapshot";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

expect.extend({ toMatchImageSnapshot: configureToMatchImageSnapshot() });

// Mock NextJS router
jest.mock("next/router", () => ({
  useRouter() {
    return {
      pathname: "/",
      route: "/",
      query: {},
      asPath: "/",
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock NextAuth session hook
jest.mock("next-auth/react", () => ({
  useSession() {
    return {
      data: null,
      status: "unauthenticated",
    };
  },
}));

// Setup MongoDB Memory Server for testing
let mongoClient;
let mockDb;

beforeAll(async () => {
  const uri = process.env.MONGO_URI || "mongodb+srv://naukrimili123:naukrimili123@naukrimili.lb6ad5e.mongodb.net/";
  mongoClient = await MongoClient.connect(uri);
  mockDb = mongoClient.db("test_job_portal");
});

afterAll(async () => {
  if (mongoClient) {
    await mongoClient.close();
  }
});

// Make the mock database available globally for tests
global.__MONGO_CLIENT__ = mongoClient;
global.__MONGO_DB__ = mockDb;

// Suppress console errors and warnings in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("Error: connect ECONNREFUSED")) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("Warning:")) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
