import { FindOptionsWhere } from 'typeorm';
import { DeepPartial, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { update } from '@app/utils/function';

type Operator = "=" | "!=" | "<" | "<=" | ">" | ">=" | "LIKE" | "ILIKE" | "IN";

export type ConditionOptions<T> = FindOptionsWhere<T> | FindOptionsWhere<T>[];

export type UpSertType<T> = {
  entityClass: EntityTarget<T>;
  condition: ConditionOptions<T>;
  data: DeepPartial<T>;
};

declare module "typeorm" {
  interface Repository<Entity> {
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
Repository.prototype.whereAny = async function<Entity extends ObjectLiteral> (
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

Repository.prototype.whereAll = async function<Entity extends ObjectLiteral> (
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

Repository.prototype.customUpsert = async function<T extends ObjectLiteral>(
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

Repository.prototype.customUpdate = async function<T extends ObjectLiteral>(
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