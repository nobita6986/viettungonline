import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from '../services/user.service';
import { prisma } from '@viettung/database';

@Module({
  controllers: [UserController],
  providers: [
    {
      provide: UserService,
      useFactory: () => {
        return new UserService(prisma as any);
      },
    },
  ],
  exports: [UserService]
})
export class UserModule {}
