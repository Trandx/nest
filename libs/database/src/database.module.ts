import { DynamicModule, Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';


@Global()
@Module({})
export class DatabaseModule {
  static register( config: PostgresConnectionOptions ): DynamicModule {
    
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync(
          config
        //   {
        //   useFactory: () =>  config,
        // }
        )
      ],
      providers: [DatabaseService],
      exports: [DatabaseService],
    };
  }
}
