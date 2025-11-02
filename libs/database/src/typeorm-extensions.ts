import { FindOptionsOrder, FindOptionsWhere, DeepPartial, ObjectLiteral, Repository, Brackets } from 'typeorm';
import { update } from '@app/utils/function';

/**
 * PostgreSQL text search language configurations
 */
export type TSLanguage = 
  | 'simple' 
  | 'english' 
  | 'french' 
  | 'german' 
  | 'spanish' 
  | 'portuguese'
  | 'italian'
  | 'dutch'
  | 'russian';

type Operator = "=" | "!=" | "<" | "<=" | ">" | ">=" | "LIKE" | "ILIKE" | "IN";

export type ConditionOptions<T> = FindOptionsWhere<T> | FindOptionsWhere<T>[];

export type UpSertType<T> = {
  condition: ConditionOptions<T>;
  data: DeepPartial<T>;
};

type BaseSearchOptions<T> = {
  keyword: string;
  condition?: ConditionOptions<T>;
  limit?: number;
  offset?: number;
}

/**
 * Options for vector-based full-text search using PostgreSQL's tsvector
 */
export type VectorSearchOptions<Entity> = ({
  searchVector: keyof Entity;
  order?: "ASC" | "DESC";
  language?: TSLanguage;
  mode?: 'and' | 'or' | 'phrase' | 'prefix';
} | {
  columns: (keyof Entity)[];
  order?: "ASC" | "DESC";
  language?: TSLanguage;
  mode?: 'and' | 'or' | 'phrase' | 'prefix';
}) & BaseSearchOptions<Entity>

/**
 * Options for simple ILIKE-based search
 */
export type SimpleSearchOptions<Entity> = {
  columns: (keyof Entity)[];
  order?: FindOptionsOrder<Entity>;
} & BaseSearchOptions<Entity>

declare module "typeorm" {
  interface Repository<Entity> {
    simpleSearch(options: SimpleSearchOptions<Entity>): Promise<[Entity[], number]>;
    deepSearch(options: VectorSearchOptions<Entity>): Promise<[Entity[], number]>;
    whereAny(
      fields: string[],
      value: any | any[],
      operator?: Operator
    ): Promise<Entity[]>;
    whereAll(
      fields: string[],
      value: string | string[],
      operator?: Operator
    ): Promise<Entity[]>;
    customUpsert<T extends ObjectLiteral>(
      options: UpSertType<T>
    ): Promise<T[]>;
    customUpdate<T extends ObjectLiteral>(
      options: UpSertType<T>
    ): Promise<T[]>;
  }
}

function buildCondition(
  alias: string,
  field: string,
  operator: Operator,
  paramName: string
) {
  if (operator === "IN") {
    return `${alias}.${field} IN (:...${paramName})`;
  }
  return `${alias}.${field} ${operator} :${paramName}`;
}

/**
 * Simple ILIKE-based search across multiple columns
 * Good for basic searches without PostgreSQL full-text search setup
 * 
 * Usage:
 * ```typescript
 * const [results, count] = await productRepo.simpleSearch({
 *   keyword: 'laptop',
 *   columns: ['name', 'description'],
 *   condition: { isActive: true },
 *   limit: 20
 * });
 * ```
 */
Repository.prototype.simpleSearch = async function <Entity extends ObjectLiteral>(
  options: SimpleSearchOptions<Entity>
): Promise<[Entity[], number]> {
  const repository = this as Repository<Entity>;
  const alias = repository.metadata.name.toLowerCase();
  const qb = repository.createQueryBuilder(alias);

  const { limit, offset, keyword, condition, columns } = options;

  if (!columns || columns.length === 0) {
    throw new Error(`Repository ${repository.metadata.name}: columns[] is required for simpleSearch().`);
  }

  // Helper to build LIKE query block
  const buildLikeBrackets = () =>
    new Brackets(qbExp => {
      columns.forEach((col, index) => {
        const clause = `${alias}."${String(col)}" ILIKE :kw`;
        if (index === 0) qbExp.where(clause, { kw: `%${keyword}%` });
        else qbExp.orWhere(clause, { kw: `%${keyword}%` });
      });
    });

  // No keyword → return condition only
  if (!keyword || keyword.trim() === '') {
    if (condition) qb.where(condition);
    if (limit) qb.take(limit);
    if (offset) qb.skip(offset);
    return qb.getManyAndCount();
  }

  // Apply condition + keyword in grouped brackets
  if (condition) {
    qb.where(condition).andWhere(buildLikeBrackets());
  } else {
    qb.where(buildLikeBrackets());
  }

  if (limit) qb.take(limit);
  if (offset) qb.skip(offset);

  return qb.getManyAndCount();
};

/**
 * Full-text search using PostgreSQL's tsvector capabilities
 * 
 * Search modes:
 * - 'and': All words must be present (default) - "laptop gaming" → laptop AND gaming
 * - 'or': Any word can be present - "laptop gaming" → laptop OR gaming  
 * - 'phrase': Exact phrase match - "laptop gaming" → "laptop gaming"
 * - 'prefix': Prefix matching for autocomplete - "lapt gam" → laptop* AND gam*
 * 
 * Usage:
 * ```typescript
 * // Using pre-computed tsvector column
 * const [results, count] = await userRepo.deepSearch({
 *   keyword: 'john',
 *   searchVector: 'searchVector',
 *   limit: 10
 * });
 * 
 * // Dynamic search across columns (AND mode)
 * const [results, count] = await productRepo.deepSearch({
 *   keyword: 'laptop gaming',
 *   columns: ['name', 'description'],
 *   mode: 'and', // All words required
 *   limit: 20
 * });
 * 
 * // OR mode - any word matches
 * const [results, count] = await productRepo.deepSearch({
 *   keyword: 'laptop gaming',
 *   columns: ['name', 'description'],
 *   mode: 'or', // Either word matches
 *   limit: 20
 * });
 * ```
 */
Repository.prototype.deepSearch = async function <Entity extends ObjectLiteral>(
  options: VectorSearchOptions<Entity>
): Promise<[Entity[], number]> {
  const repository = this as Repository<Entity>;
  const alias = repository.metadata.name.toLowerCase();
  const qb = repository.createQueryBuilder(alias);
  
  const {
    limit,
    offset,
    keyword,
    order = 'DESC',
    language = 'simple',
    condition,
    mode = 'and',
  } = options;

  // Handle empty/no keyword: return filtered results without ranking
  if (!keyword || keyword.trim() === '') {
    if (condition) qb.where(condition);
    if (limit) qb.take(limit);
    if (offset) qb.skip(offset);
    return qb.getManyAndCount();
  }

  // Sanitize and format keyword based on search mode
  const sanitizedKeyword = (() => {
    const cleaned = keyword
      .trim()
      .replace(/[:\(\)\|\&!]/g, ' ') // Remove special tsquery operators
      .split(/\s+/)
      .filter(word => word.length > 0);

    switch (mode) {
      case 'or':
        // Any word matches: laptop | gaming
        return cleaned.join(' | ');
      
      case 'phrase':
        // Exact phrase: laptop <-> gaming
        return cleaned.join(' <-> ');
      
      case 'prefix':
        // Prefix matching for autocomplete: laptop:* & gaming:*
        return cleaned.map(word => `${word}:*`).join(' & ');
      
      case 'and':
      default:
        // All words must match: laptop & gaming
        return cleaned.join(' & ');
    }
  })();

  // Build the full-text search brackets
  const buildSearchBrackets = (): Brackets => {
    return new Brackets(qbExp => {
      // Option 1: Use pre-computed tsvector column
      if ('searchVector' in options && options.searchVector) {
        const col = String(options.searchVector);
        
        // Verify column exists
        const columnExists = repository.metadata.columns.some(
          c => c.databaseName === col || c.propertyName === col
        );
        
        if (!columnExists) {
          throw new Error(
            `Repository ${repository.metadata.name}: Column "${col}" not found. ` +
            `Available columns: ${repository.metadata.columns.map(c => c.propertyName).join(', ')}`
          );
        }

        qbExp.where(
          `${alias}."${col}" @@ to_tsquery(:lang, :kw)`,
          { lang: language, kw: sanitizedKeyword }
        );
        
        qb.addSelect(
          `ts_rank(${alias}."${col}", to_tsquery(:lang, :kw))`,
          'rank'
        );
      } 
      // Option 2: Dynamic search across multiple columns
      else if ('columns' in options && options.columns && options.columns.length > 0) {
        const { columns } = options;
        
        // Verify all columns exist
        const invalidColumns = columns.filter(col => 
          !repository.metadata.columns.some(
            c => c.propertyName === String(col) || c.databaseName === String(col)
          )
        );
        
        if (invalidColumns.length > 0) {
          throw new Error(
            `Repository ${repository.metadata.name}: Invalid columns: ${invalidColumns.join(', ')}. ` +
            `Available columns: ${repository.metadata.columns.map(c => c.propertyName).join(', ')}`
          );
        }

        const joinedCols = columns
          .map(col => `coalesce(${alias}."${String(col)}", '')`)
          .join(" || ' ' || ");

        qbExp.where(
          `to_tsvector(:lang, ${joinedCols}) @@ to_tsquery(:lang, :kw)`,
          { lang: language, kw: sanitizedKeyword }
        );
        
        qb.addSelect(
          `ts_rank(to_tsvector(:lang, ${joinedCols}), to_tsquery(:lang, :kw))`,
          'rank'
        );
      } 
      // No search configuration provided
      else {
        throw new Error(
          `Repository ${repository.metadata.name}: deepSearch requires either ` +
          `'searchVector' (tsvector column name) or 'columns' (array of text columns). ` +
          `Example: { keyword: 'search', columns: ['name', 'description'] }`
        );
      }
    });
  };

  // Apply conditions and search
  try {
    if (condition) {
      qb.where(condition).andWhere(buildSearchBrackets());
    } else {
      qb.where(buildSearchBrackets());
    }

    // Apply rank-based ordering
    qb.orderBy('rank', order);
    
    // Apply pagination
    if (limit) qb.take(limit);
    if (offset) qb.skip(offset);

    return await qb.getManyAndCount();
  } catch (error) {
    // Enhance error messages for common PostgreSQL issues
    if (error instanceof Error) {
      if (error.message.includes('language')) {
        throw new Error(
          `Invalid text search language: "${language}". ` +
          `Valid options: simple, english, french, german, spanish, etc.`
        );
      }
      if (error.message.includes('tsvector')) {
        throw new Error(
          `Text search error: Ensure your database supports PostgreSQL full-text search ` +
          `and that tsvector columns are properly configured. Original error: ${error.message}`
        );
      }
    }
    throw error;
  }
};

/**
 * Find entities where ANY of the specified fields match the value (OR condition)
 * 
 * Usage:
 * ```typescript
 * // Find users where email OR username equals 'john@example.com'
 * const users = await userRepo.whereAny(['email', 'username'], 'john@example.com');
 * 
 * // Find products where categoryId is 1 OR 2 OR 3
 * const products = await productRepo.whereAny(['categoryId'], [1, 2, 3]);
 * ```
 */
Repository.prototype.whereAny = async function <Entity extends ObjectLiteral>(
  fields: string[],
  value: any | any[],
  operator: Operator = "="
): Promise<Entity[]> {
  const repository = this as Repository<Entity>;
  const alias = repository.metadata.name.toLowerCase();
  const qb = repository.createQueryBuilder(alias);

  if (Array.isArray(value) && operator === "=") operator = "IN";

  fields.forEach((field, index) => {
    const paramName = `${field}_any`;
    const condition = buildCondition(alias, field, operator, paramName);

    if (index === 0) {
      qb.where(condition, { [paramName]: value });
    } else {
      qb.orWhere(condition, { [paramName]: value });
    }
  });
  
  return qb.getMany();
};

/**
 * Find entities where ALL of the specified fields match the value (AND condition)
 * 
 * Usage:
 * ```typescript
 * // Find users where isActive = true AND isVerified = true
 * const users = await userRepo.whereAll(['isActive', 'isVerified'], true);
 * ```
 */
Repository.prototype.whereAll = async function <Entity extends ObjectLiteral>(
  fields: string[],
  value: any | any[],
  operator: Operator = "="
): Promise<Entity[]> {
  const repository = this as Repository<Entity>;
  const alias = repository.metadata.name.toLowerCase();
  const qb = repository.createQueryBuilder(alias);

  if (Array.isArray(value) && operator === "=") operator = "IN";

  fields.forEach((field, index) => {
    const paramName = `${field}_all`;
    const condition = buildCondition(alias, field, operator, paramName);

    if (index === 0) {
      qb.where(condition, { [paramName]: value });
    } else {
      qb.andWhere(condition, { [paramName]: value });
    }
  });
  
  return qb.getMany();
};

/**
 * Upsert: Update if exists, insert if not
 * 
 * Usage:
 * ```typescript
 * const result = await userRepo.customUpsert({
 *   condition: { email: 'john@example.com' },
 *   data: { name: 'John Doe', age: 30 }
 * });
 * ```
 */
Repository.prototype.customUpsert = async function <T extends ObjectLiteral>(
  { data, condition }: UpSertType<T>
): Promise<T[]> {
  try {
    const entityRepository = this as Repository<T>;
    let result = await entityRepository.find({ where: condition });

    if (result.length > 0) {
      result = update<T>(result, data as T);
    } else {
      result = [entityRepository.create(data)];
    }
    
    return entityRepository.save<T>(result);
  } catch (error) {
    throw error;
  }
};

/**
 * Update entities matching the condition
 * Returns empty array if no matches found
 * 
 * Usage:
 * ```typescript
 * const result = await userRepo.customUpdate({
 *   condition: { isActive: true },
 *   data: { updatedAt: new Date() }
 * });
 * ```
 */
Repository.prototype.customUpdate = async function <T extends ObjectLiteral>(
  { data, condition }: UpSertType<T>
): Promise<T[]> {
  try {
    const entityRepository = this as Repository<T>;
    let result = await entityRepository.find({ where: condition });

    if (result.length === 0) return [];

    result = update<T>(result, data as T);
    return entityRepository.save(result);
  } catch (error) {
    throw error;
  }
};