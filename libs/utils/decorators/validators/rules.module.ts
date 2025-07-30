import { Global, Module } from "@nestjs/common";
import { IsNotExistRule, IsExistRule } from "./rules";

@Global()
@Module({
  providers: [
    IsNotExistRule,
    IsExistRule,
  ],
  exports:[ IsNotExistRule, IsExistRule ]
})
export class RulesModule {}