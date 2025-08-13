import { Global, Module } from '@nestjs/common';
import { KeyGeneratorService } from './key-generator.service';

@Global()
@Module({
  providers: [KeyGeneratorService],
  exports: [KeyGeneratorService],
})
export class KeyGeneratorModule {
  // static use(storeServiceClass: Type<StoreService>): DynamicModule {
  //   return {
  //     module: KeyGeneratorModule,
  //     imports: [],
  //     providers: [
  //       {
  //         provide: 'StoreService',
  //         useClass: storeServiceClass,
  //       },
  //       KeyGeneratorService
  //     ],
  //     exports: [KeyGeneratorService],
  //   };
  // }
}
