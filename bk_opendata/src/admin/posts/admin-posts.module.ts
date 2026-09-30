import { Module } from '@nestjs/common';
import { AdminPostsController } from './admin-posts.controller';
import { AdminPostsService } from './admin-posts.service';

@Module({
  controllers: [AdminPostsController],
  providers: [AdminPostsService],
  exports: [AdminPostsService],
})
export class AdminPostsModule {}
