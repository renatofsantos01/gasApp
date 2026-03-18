import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CouponsModule } from '../coupons/coupons.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, CouponsModule, NotificationsModule],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
