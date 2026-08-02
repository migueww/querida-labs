import { Collection, ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";
import { MateriaPrima, MateriaPrimaDTO, PaginatedResult } from "@/types/revalidacao";
import { classifyProduct } from "@/lib/services/revalidacao/classifier";

export interface MongoMateriaPrimaDocument {
  _id?: ObjectId;
  codigoProduto: string;
  nomeProduto: string;
  distribuidor: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MateriaPrimaModel {
  private static async getCollection(): Promise<Collection<MongoMateriaPrimaDocument>> {
    const db = await getDatabase();
    const collection = db.collection<MongoMateriaPrimaDocument>("materias_primas");
    
    // Ensure unique index on codigoProduto
    await collection.createIndex({ codigoProduto: 1 }, { unique: true });
    
    // Ensure text index or index for search performance
    await collection.createIndex({ nomeProduto: 1 });
    await collection.createIndex({ distribuidor: 1 });
    
    return collection;
  }

  public static normalizeDistribuidor(distribuidor?: string): string {
    if (!distribuidor || !distribuidor.trim()) {
      return "NÃO ATRIBUIDO";
    }
    return distribuidor.trim().toUpperCase();
  }

  public static normalizeCodigo(codigo: string | number): string {
    return String(codigo).trim();
  }

  public static toDTO(mp: MateriaPrima): MateriaPrimaDTO {
    return {
      id: mp.id,
      codigoProduto: mp.codigoProduto,
      nomeProduto: mp.nomeProduto,
      distribuidor: mp.distribuidor,
      classificacao: mp.classificacao,
      createdAt: mp.createdAt.toISOString(),
      updatedAt: mp.updatedAt.toISOString(),
    };
  }

  private static mapDocToEntity(doc: MongoMateriaPrimaDocument): MateriaPrima {
    const codigoProduto = String(doc.codigoProduto).trim();
    return {
      id: doc._id ? doc._id.toString() : "",
      codigoProduto,
      nomeProduto: doc.nomeProduto,
      distribuidor: doc.distribuidor || "NÃO ATRIBUIDO",
      classificacao: classifyProduct(codigoProduto, doc.nomeProduto),
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    };
  }

  public static async findAll(params: {
    search?: string;
    page?: number;
    pageSize?: number;
    classificacao?: string;
  }): Promise<PaginatedResult<MateriaPrimaDTO>> {
    const collection = await this.getCollection();
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize || 15));
    const skip = (page - 1) * pageSize;

    const query: any = {};

    if (params.search && params.search.trim()) {
      const searchRegex = new RegExp(params.search.trim(), "i");
      query.$or = [
        { codigoProduto: searchRegex },
        { nomeProduto: searchRegex },
        { distribuidor: searchRegex },
      ];
    }

    // Fetch documents matching search query
    const docs = await collection
      .find(query)
      .sort({ codigoProduto: 1 })
      .toArray();

    // Map to entities (which computes virtual classificacao)
    let entities = docs.map((doc) => this.mapDocToEntity(doc));

    // Filter by classificacao if requested
    if (params.classificacao && params.classificacao !== "ALL") {
      entities = entities.filter(
        (e) => e.classificacao.toUpperCase() === params.classificacao?.toUpperCase()
      );
    }

    const total = entities.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const paginatedItems = entities.slice(skip, skip + pageSize);

    return {
      data: paginatedItems.map((item) => this.toDTO(item)),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  public static async findByCodigo(codigoProduto: string): Promise<MateriaPrima | null> {
    const collection = await this.getCollection();
    const cleanCode = this.normalizeCodigo(codigoProduto);
    const doc = await collection.findOne({ codigoProduto: cleanCode });
    if (!doc) return null;
    return this.mapDocToEntity(doc);
  }

  public static async findById(id: string): Promise<MateriaPrima | null> {
    const collection = await this.getCollection();
    if (!ObjectId.isValid(id)) return null;
    const doc = await collection.findOne({ _id: new ObjectId(id) });
    if (!doc) return null;
    return this.mapDocToEntity(doc);
  }

  public static async create(data: {
    codigoProduto: string | number;
    nomeProduto: string;
    distribuidor?: string;
  }): Promise<MateriaPrima> {
    const collection = await this.getCollection();
    const cleanCode = this.normalizeCodigo(data.codigoProduto);
    
    if (!cleanCode) {
      throw new Error("O Código do Produto é obrigatório.");
    }
    if (!data.nomeProduto || !data.nomeProduto.trim()) {
      throw new Error("O Nome do Produto é obrigatório.");
    }

    const existing = await collection.findOne({ codigoProduto: cleanCode });
    if (existing) {
      throw new Error(`O Código do Produto '${cleanCode}' já está cadastrado.`);
    }

    const now = new Date();
    const docToInsert: MongoMateriaPrimaDocument = {
      codigoProduto: cleanCode,
      nomeProduto: data.nomeProduto.trim(),
      distribuidor: this.normalizeDistribuidor(data.distribuidor),
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(docToInsert);
    return this.mapDocToEntity({
      ...docToInsert,
      _id: result.insertedId,
    });
  }

  public static async update(
    id: string,
    data: {
      codigoProduto?: string | number;
      nomeProduto?: string;
      distribuidor?: string;
    }
  ): Promise<MateriaPrima | null> {
    const collection = await this.getCollection();
    if (!ObjectId.isValid(id)) return null;

    const existingDoc = await collection.findOne({ _id: new ObjectId(id) });
    if (!existingDoc) return null;

    const updates: Partial<MongoMateriaPrimaDocument> = {
      updatedAt: new Date(),
    };

    if (data.codigoProduto !== undefined) {
      const cleanCode = this.normalizeCodigo(data.codigoProduto);
      if (!cleanCode) {
        throw new Error("O Código do Produto é obrigatório.");
      }
      if (cleanCode !== existingDoc.codigoProduto) {
        const conflict = await collection.findOne({ codigoProduto: cleanCode });
        if (conflict) {
          throw new Error(`O Código do Produto '${cleanCode}' já pertence a outro produto.`);
        }
      }
      updates.codigoProduto = cleanCode;
    }

    if (data.nomeProduto !== undefined) {
      if (!data.nomeProduto.trim()) {
        throw new Error("O Nome do Produto é obrigatório.");
      }
      updates.nomeProduto = data.nomeProduto.trim();
    }

    if (data.distribuidor !== undefined) {
      updates.distribuidor = this.normalizeDistribuidor(data.distribuidor);
    }

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    return this.findById(id);
  }

  public static async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    if (!ObjectId.isValid(id)) return false;
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }

  public static async getAllAsMap(): Promise<Map<string, MateriaPrima>> {
    const collection = await this.getCollection();
    const docs = await collection.find({}).toArray();
    const map = new Map<string, MateriaPrima>();
    for (const doc of docs) {
      const entity = this.mapDocToEntity(doc);
      map.set(entity.codigoProduto, entity);
    }
    return map;
  }

  public static async upsertMany(
    items: Array<{
      codigoProduto: string | number;
      nomeProduto: string;
      distribuidor?: string;
    }>
  ): Promise<{ insertedCount: number; updatedCount: number }> {
    const collection = await this.getCollection();
    const now = new Date();

    let insertedCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      const cleanCode = this.normalizeCodigo(item.codigoProduto);
      const cleanName = String(item.nomeProduto || "").trim();
      const normDistribuidor = this.normalizeDistribuidor(item.distribuidor);

      if (!cleanCode || !cleanName) continue;

      const existing = await collection.findOne({ codigoProduto: cleanCode });

      if (existing) {
        await collection.updateOne(
          { _id: existing._id },
          {
            $set: {
              nomeProduto: cleanName,
              distribuidor: normDistribuidor,
              updatedAt: now,
            },
          }
        );
        updatedCount++;
      } else {
        await collection.insertOne({
          codigoProduto: cleanCode,
          nomeProduto: cleanName,
          distribuidor: normDistribuidor,
          createdAt: now,
          updatedAt: now,
        });
        insertedCount++;
      }
    }

    return { insertedCount, updatedCount };
  }

  public static async deleteMany(ids: string[]): Promise<number> {
    const collection = await this.getCollection();
    const objectIds = ids
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    if (objectIds.length === 0) return 0;

    const result = await collection.deleteMany({
      _id: { $in: objectIds },
    });

    return result.deletedCount;
  }

  public static async clearAll(): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.deleteMany({});
    return result.deletedCount;
  }

  public static async exportFiltered(params: {
    search?: string;
    classificacao?: string;
  }): Promise<MateriaPrimaDTO[]> {
    const collection = await this.getCollection();
    const query: any = {};

    if (params.search && params.search.trim()) {
      const searchRegex = new RegExp(params.search.trim(), "i");
      query.$or = [
        { codigoProduto: searchRegex },
        { nomeProduto: searchRegex },
        { distribuidor: searchRegex },
      ];
    }

    const docs = await collection
      .find(query)
      .sort({ codigoProduto: 1 })
      .toArray();

    let entities = docs.map((doc) => this.mapDocToEntity(doc));

    if (params.classificacao && params.classificacao !== "ALL") {
      entities = entities.filter(
        (e) => e.classificacao.toUpperCase() === params.classificacao?.toUpperCase()
      );
    }

    return entities.map((item) => this.toDTO(item));
  }
}
