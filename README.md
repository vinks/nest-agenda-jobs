<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="http://kamilmysliwiec.com/public/nest-logo.png#1" alt="Nest Logo" /></a>
</p>

## Description

This is a [Agenda](https://github.com/agenda) task wrapper module for [Nest](https://github.com/nestjs/nest).

## Installation

```bash
$ npm i --save nest-agenda-jobs
```

## Quick Start

```ts
import { Injectable } from '@nestjs/common';
import { Task } from '../lib';

@Injectable()
export class AppTasks {
    @Task({ name: 'justATest' })
    justATest(job: Agenda.Job, done) {
        const result: number = (job.attrs.data || []).reduce((a, b) => a + b);

        setTimeout(() => {
            done(null, result);
        }, 900);
    }
}

import { Controller, Get } from '@nestjs/common';
import * as Bull from 'bull';
import { BullService } from '../lib';
import { AppTasks } from './app.tasks';

@Controller('app')
export class AppController {
    constructor(
        private readonly agendaService: AgendaService,
        private readonly tasks: AppTasks,
    ) {}

    @Get()
    public async runTask() {
         const data = [1, 2, 3];

        await this.agendaService.createJob(this.tasks.justATest, {
            type: 'now',
            autoRemove: false,
        }, data);

        return true;
    }
}

import { Module, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AgendaModule, AgendaTaskRegisterService, AgendaService } from '../lib';
import { AppTasks } from './app.tasks';
import { AppController } from './app.controller';

@Module({
  imports: [AgendaModule],
  controllers: [AppController],
  providers: [AppTasks],
})
export class AppModule implements OnModuleInit {
  constructor(
      private readonly moduleRef: ModuleRef,
      private readonly taskRegister: AgendaTaskRegisterService,
  ) {}
  async onModuleInit() {
      this.taskRegister.setModuleRef(this.moduleRef);

      await this.taskRegister.register(AppTasks, {
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
```