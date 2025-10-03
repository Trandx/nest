import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '@app/database';
import { IsExistRule, IsNotExistRule } from './rules';

const validatorRules = [IsExistRule, IsNotExistRule];

@Global()
@Module({
      imports: [DatabaseModule], // <- on forward la config
      providers: [...validatorRules],
      exports: [...validatorRules],
    })
export class ValidatorModule {
  // static register(dbConfig: PostgresConnectionOptions): DynamicModule {
  //   return {
  //     module: ValidatorModule,
  //     //imports: [DatabaseModule.register(dbConfig)], // <- on forward la config
  //     providers: [...validatorRules],
  //     exports: [...validatorRules],
  //   };
  // }
}