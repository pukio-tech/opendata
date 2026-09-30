import { Module } from '@nestjs/common';
import { AdminMuseumsController } from './admin-museums.controller';
import { AdminMuseumsService } from './admin-museums.service';

@Module({
  controllers: [AdminMuseumsController],
  providers: [AdminMuseumsService],
  exports: [AdminMuseumsService],
})
export class AdminMuseumsModule {}
