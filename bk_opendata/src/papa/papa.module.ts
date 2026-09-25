import { Module } from '@nestjs/common';
import { PapaController } from './papa.controller';
import { PapaService } from './papa.service';

@Module({
  controllers: [PapaController],
  providers: [PapaService],
  exports: [PapaService],
})
export class PapaModule {}
