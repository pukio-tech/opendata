import { Module } from '@nestjs/common';
import { MinceturController } from './mincetur.controller';
import { MinceturService } from './mincetur.service';

@Module({
  controllers: [MinceturController],
  providers: [MinceturService],
  exports: [MinceturService],
})
export class MinceturModule {}
