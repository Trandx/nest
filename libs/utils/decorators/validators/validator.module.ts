import { DynamicModule, Global, Module, Type } from '@nestjs/common';
import { IsExistRule, IsNotExistRule } from './rules';
import { useContainer } from 'class-validator';
import { ModuleRef } from '@nestjs/core';

const rules = [IsExistRule, IsNotExistRule];

@Global()
@Module({})
export class ValidatorModule {
  static forRoot(databaseModule: Type<any>): DynamicModule {
    return {
      module: ValidatorModule,
      imports: [databaseModule],
      providers: [...rules],
      exports: [...rules],
    };
  }

  constructor(private readonly moduleRef: ModuleRef) {
    // Important : lie class-validator au conteneur Nest
    useContainer(this.moduleRef, { fallbackOnErrors: true });
  }
}
