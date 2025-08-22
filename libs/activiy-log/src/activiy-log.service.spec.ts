import { Test, TestingModule } from '@nestjs/testing';
import { ActiviyLogService } from './activiy-log.service';

describe('ActiviyLogService', () => {
  let service: ActiviyLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActiviyLogService],
    }).compile();

    service = module.get<ActiviyLogService>(ActiviyLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
