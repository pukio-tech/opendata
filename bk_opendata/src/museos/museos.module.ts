import { Module } from '@nestjs/common';
import { MuseosController } from './museos.controller';
import { MuseosService } from './museos.service';

@Module({
  controllers: [MuseosController],
  providers: [MuseosService],
  exports: [MuseosService],
})
export class MuseosModule {}
