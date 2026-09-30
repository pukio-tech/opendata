import { Module } from '@nestjs/common';
import { AdminPlacesModule } from './places/admin-places.module';
import { AdminPostsModule } from './posts/admin-posts.module';
import { AdminCompaniesModule } from './companies/admin-companies.module';
import { AdminMuseumsModule } from './museums/admin-museums.module';

@Module({
  imports: [AdminPlacesModule, AdminPostsModule, AdminCompaniesModule, AdminMuseumsModule],
  exports: [AdminPlacesModule, AdminPostsModule, AdminCompaniesModule, AdminMuseumsModule],
})
export class AdminModule {}
