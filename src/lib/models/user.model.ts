import { Collection, ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { User, UserDTO } from "@/types/auth";

export interface MongoUserDocument {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel {
  private static async getCollection(): Promise<Collection<MongoUserDocument>> {
    const db = await getDatabase();
    const collection = db.collection<MongoUserDocument>("users");
    // Ensure unique index on email
    await collection.createIndex({ email: 1 }, { unique: true });
    return collection;
  }

  public static toDTO(user: User): UserDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private static mapDocToUser(doc: MongoUserDocument): User {
    return {
      id: doc._id ? doc._id.toString() : "",
      name: doc.name,
      email: doc.email.toLowerCase().trim(),
      passwordHash: doc.passwordHash,
      role: doc.role,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }

  public static async findByEmail(email: string): Promise<User | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({
      email: email.toLowerCase().trim(),
    });
    if (!doc) return null;
    return this.mapDocToUser(doc);
  }

  public static async findById(id: string): Promise<User | null> {
    const collection = await this.getCollection();
    if (!ObjectId.isValid(id)) return null;
    const doc = await collection.findOne({ _id: new ObjectId(id) });
    if (!doc) return null;
    return this.mapDocToUser(doc);
  }

  public static async create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const collection = await this.getCollection();
    const now = new Date();
    const docToInsert: MongoUserDocument = {
      name: user.name,
      email: user.email.toLowerCase().trim(),
      passwordHash: user.passwordHash,
      role: user.role,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(docToInsert);
    return {
      ...user,
      id: result.insertedId.toString(),
      email: docToInsert.email,
      createdAt: now,
      updatedAt: now,
    };
  }

  public static async countUsers(): Promise<number> {
    const collection = await this.getCollection();
    return collection.countDocuments();
  }
}
