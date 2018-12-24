import { Module, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AgendaModule, AgendaTaskRegisterService, AgendaService } from '../lib';
import { AppTasks } from './app.tasks';
import { AnotherTasks } from './another.tasks';
import { AppController } from './app.controller';

@Module({
  imports: [AgendaModule],
  controllers: [AppController],
  providers: [AppTasks, AnotherTasks],
})
export class AppModule implements OnModuleInit {
  constructor(
      private readonly moduleRef: ModuleRef,
      private readonly taskRegister: AgendaTaskRegisterService,
  ) {}
  async onModuleInit() {
      this.taskRegister.setModuleRef(this.moduleRef);

      await this.taskRegister.register([AppTasks, AnotherTasks], {
        collection: 'test',
        options: {
          db: {
            address: 'mongodb://127.0.0.1/agenda',
            options: {
              useNewUrlParser: true,
            },
          },
        },
      });
  }
}