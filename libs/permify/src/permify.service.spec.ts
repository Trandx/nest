import { Test, TestingModule } from '@nestjs/testing';
import { PermifyService } from './permify.service';

describe('PermifyService', () => {
  let service: PermifyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermifyService],
    }).compile();

    service = module.get<PermifyService>(PermifyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
