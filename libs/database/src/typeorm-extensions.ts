import { FindOptionsOrder, FindOptionsWhere } from 'typeorm';
import { DeepPartial, ObjectLiteral, Repository } from 'typeorm';
import { update } from '@app/utils/function';
import { Brackets } from 'typeorm';

type Operator = "=" | "!=" | "<" | "<=" | ">" | ">=" | "LIKE" | "ILIKE" | "IN";

export type ConditionOptions<T> = FindOptionsWhere<T> | FindOptionsWhere<T>[];

export type UpSertType<T> = {
  condition: ConditionOptions<T>;
  data: DeepPartial<T>;
};

type BaseSerachOptions<T> = {
  keyword: string;
  condition?: ConditionOptions<T>;
  limit?: number;
  offset?: number;
}

/**
 * Full text search using PostgreSQL's full-text search capabilities.
 * Supports both vector-based search and like-based search.
 */

export type VectorSearchOptions<Entity> = ({
  searchVector: keyof Entity;
  order?: "ASC" | "DESC";
  language?: string;
} | {
  columns: (keyof Entity)[];
  order?: "ASC" | "DESC";
  language?: string;
}) & BaseSerachOptions<Entity>

export type SimpleSearchOptions<Entity> = {
  columns: (keyof Entity)[];
  order?: FindOptionsOrder<Entity>;
} & BaseSerachOptions<Entity>

export type SearchOptions<Entity> = SimpleSearchOptions<Entity> | VectorSearchOptions<Entity>;

declare module "typeorm" {
  interface Repository<Entity> {
    simpleSearch(options: SimpleSearchOptions<Entity>): Promise<[Entity[], number]>;
    deepSearch(options: SearchOptions<Entity>): Promise<[Entity[], number]>;
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

Repository.prototype.simpleSearch = async function <Entity extends ObjectLiteral>(
  options: SimpleSearchOptions<Entity>
){
  const repository = this as Repository<Entity>;
  const alias = repository.metadata.name.toLowerCase();
  const qb = repository.createQueryBuilder(alias);

  const { limit, offset, keyword, condition, columns } = options;

  if (!columns || columns.length === 0) {
    throw new Error(`Repository ${repository.metadata.name}: columns[] is required for simpleSearch().`);
  }

  // 🧩 Helper to build LIKE query block
  const buildLikeBrackets = () =>
    new Brackets(qbExp => {
      columns.forEach((col, index) => {
        const clause = `${alias}."${String(col)}" ILIKE :kw`;
        if (index === 0) qbExp.where(clause, { kw: `%${keyword}%` });
        else qbExp.orWhere(clause, { kw: `%${keyword}%` });
      });
    });

  // 🧠 No keyword → return condition only
  if (!keyword || keyword.trim() === '') {
    if (condition) qb.where(condition);
    if (limit) qb.take(limit);
    if (offset) qb.skip(offset);
    return qb.getManyAndCount();
  }

  // ⚙️ Apply condition + keyword in grouped brackets
  if (condition) {
    qb.where(condition).andWhere(buildLikeBrackets());
  } else {
    qb.where(buildLikeBrackets());
  }

  if (limit) qb.take(limit);
  if (offset) qb.skip(offset);

  return qb.getManyAndCount();
};

Repository.prototype.deepSearch = async function <Entity extends ObjectLiteral>(
  options: VectorSearchOptions<Entity>
) {
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
  } = options;

  if (!keyword || keyword.trim() === '') {
    if (condition) qb.where(condition);
    if (limit) qb.take(limit);
    if (offset) qb.skip(offset);
    return qb.getManyAndCount();
  }

  // 🧩 Helper to build the search block
  const buildSearchBrackets = () =>
    new Brackets(qbExp => {
      if ('searchVector' in options && repository.metadata.columns.some(c => c.databaseName === String(options.searchVector))) {
        const col = String(options.searchVector);
        qbExp.where(`${alias}."${col}" @@ plainto_tsquery(:lang, :kw)`, { lang: language, kw: keyword });
        qb.addSelect(`ts_rank(${alias}."${col}", plainto_tsquery(:lang, :kw))`, 'rank');
      } else if ('columns' in options && options.columns.length > 0) {
        const { columns } = options;
        const joinedCols = columns.map(col => `coalesce(${alias}."${String(col)}", '')`).join(" || ' ' || ");
        qbExp.where(`to_tsvector(:lang, ${joinedCols}) @@ plainto_tsquery(:lang, :kw)`, { lang: language, kw: keyword });
        qb.addSelect(`ts_rank(to_tsvector(:lang, ${joinedCols}), plainto_tsquery(:lang, :kw))`, 'rank');
      } else {
        throw new Error(
          `Repository ${repository.metadata.name}: No searchVector column or columns[] provided for deepSearch().`
        );
      }
    });

  // ⚙️ Apply condition + search
  if (condition) {
    qb.where(condition).andWhere(buildSearchBrackets());
  } else {
    qb.where(buildSearchBrackets());
  }

  // Apply rank ordering
  qb.orderBy('rank', order);

  if (limit) qb.take(limit);
  if (offset) qb.skip(offset);

  return qb.getManyAndCount();
};


Repository.prototype.whereAny = async function <Entity extends ObjectLiteral>(
  fields: string[],
  value: any | any[],
  operator: Operator = "="
): Promise<Entity[]> {
  const repository = (this as Repository<Entity>)
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

Repository.prototype.whereAll = async function <Entity extends ObjectLiteral>(
  fields: string[],
  value: any | any[],
  operator: Operator = "="
): Promise<Entity[]> {
  const repository = (this as Repository<Entity>)
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

Repository.prototype.customUpsert = async function <T extends ObjectLiteral>(
  { data, condition }: UpSertType<T>
) {
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

Repository.prototype.customUpdate = async function <T extends ObjectLiteral>(
  { data, condition }: UpSertType<T>
) {
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