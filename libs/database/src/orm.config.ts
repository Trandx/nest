import { join } from 'path';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';

// const ENV = process.env.NODE_ENV;
//console.log(config_env.DB_HOST);
export function dbConfig() {
  const config_env = process.env;

  //console.log(config_env.DB_NAME);

  const config: PostgresConnectionOptions = {
    type: 'postgres',
    host: config_env.DB_HOST,
    port: +(config_env.DB_PORT || 5432),
    database: config_env.DB_NAME,
    username: config_env.DB_USERNAME,
    password: config_env.DB_PASSWORD,
    ssl: config_env.DB_SSL == 'true',
    poolSize: +(config_env.DB_MAX_POOL || 100),
    installExtensions: true,
    //connectTimeoutMS: 5000,
    synchronize: false, // config_env.TYPEORM_SYNCHRONIZE == 'true',
    migrationsTableName: 'migrations',
    entities: [join('dist', '**', '*.entity.{ts,js}')],
    logging: true,
    extra: {
      max: 10, // Nombre maximal de connexions dans le pool
      min: 0,  // Nombre minimal de connexions dans le pool
      idleTimeoutMillis: 30000, // Délai avant de fermer une connexion inactive
    },
  };

  return config;
}

export const dataSource = new DataSource(dbConfig());
