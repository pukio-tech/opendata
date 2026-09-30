import { Module } from '@nestjs/common';
import { AdminPlacesController } from './admin-places.controller';
import { AdminPlacesService } from './admin-places.service';

@Module({
  controllers: [AdminPlacesController],
  providers: [AdminPlacesService],
  exports: [AdminPlacesService],
})
export class AdminPlacesModule {}
