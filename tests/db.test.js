const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config({
  path: ".env.local"
});

let client;
let db;

jest.setTimeout(30000); // Increase timeout to 30 seconds

beforeAll(async () => {
  const uri = process.env.MONGO_URI || "mongodb+srv://naukrimili123:naukrimili123@naukrimili.lb6ad5e.mongodb.net/";
  client = await MongoClient.connect(uri);
  db = client.db("test_job_portal");
});

afterAll(async () => {
  await client.close();
});

describe("Database Connection", () => {
  it("should connect to MongoDB", async () => {
    expect(client).toBeDefined();
    expect(db).toBeDefined();
  });

  it("should be able to query the database", async () => {
    const collections = await db.listCollections().toArray();
    expect(Array.isArray(collections)).toBe(true);
  });

  // Test to ensure we"re using the test database
  it("should be using the test database", async () => {
    expect(db.databaseName).toBe("test_job_portal");
  });
});

describe("Basic Database Operations", () => {
  const testCollection = "test_collection";
  let session;

  beforeEach(async () => {
    session = client.startSession();
    await session.withTransaction(async () => {
      await db.collection(testCollection).deleteMany({});
    });
  });

  afterEach(async () => {
    await session.endSession();
  });

  afterAll(async () => {
    const tempSession = client.startSession();
    try {
      await tempSession.withTransaction(async () => {
        await db.collection(testCollection).drop().catch(() => {
          // Ignore error if collection doesn"t exist
        });
      });
    } finally {
      await tempSession.endSession();
    }
  });

  it("should insert a document with transaction", async () => {
    const mockJob = {
      title: "Test Job",
      company: "Test Company",
      location: "Test Location",
      created_at: new Date()
    };

    let result;
    await session.withTransaction(async () => {
      result = await db.collection(testCollection).insertOne(mockJob, { session });
      expect(result.acknowledged).toBe(true);
      expect(result.insertedId).toBeDefined();

      const insertedJob = await db.collection(testCollection).findOne(
        { _id: result.insertedId },
        { session }
      );
      expect(insertedJob.title).toBe(mockJob.title);
    });
  });

  it("should update a document with transaction", async () => {
    const mockJob = {
      title: "Original Title",
      company: "Test Company"
    };

    let insertResult;
    let updateResult;
    
    await session.withTransaction(async () => {
      insertResult = await db.collection(testCollection).insertOne(mockJob, { session });
      updateResult = await db.collection(testCollection).updateOne(
        { _id: insertResult.insertedId },
        { $set: { title: "Updated Title" } },
        { session }
      );

      expect(updateResult.modifiedCount).toBe(1);

      const updatedJob = await db.collection(testCollection).findOne(
        { _id: insertResult.insertedId },
        { session }
      );
      expect(updatedJob.title).toBe("Updated Title");
    });
  });

  it("should delete a document with transaction", async () => {
    const mockJob = {
      title: "To Be Deleted",
      company: "Test Company"
    };

    let insertResult;
    await session.withTransaction(async () => {
      insertResult = await db.collection(testCollection).insertOne(mockJob, { session });
      const deleteResult = await db.collection(testCollection).deleteOne(
        { _id: insertResult.insertedId },
        { session }
      );

      expect(deleteResult.deletedCount).toBe(1);

      const deletedJob = await db.collection(testCollection).findOne(
        { _id: insertResult.insertedId },
        { session }
      );
      expect(deletedJob).toBeNull();
    });
  });
});
