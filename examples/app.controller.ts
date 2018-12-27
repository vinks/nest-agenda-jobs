import { Controller, Get } from '@nestjs/common';
import { AgendaService } from '../lib';
import { AppTasks } from './app.tasks';
import { AnotherTasks } from './another.tasks';
import { ObjectID } from 'mongodb';

@Controller('app')
export class AppController {
    constructor(
        private readonly agendaService: AgendaService,
        private readonly appTasks: AppTasks,
        private readonly anotherTasks: AnotherTasks,
    ) {}

    @Get('run')
    public async runTask() {
        const a = 1;
        const b = 2;

        await this.agendaService.createJob(this.appTasks.justATest, {
            type: 'now',
            autoRemove: false,
        }, {a, b});

        await this.agendaService.createJob(this.anotherTasks.justAnotherTest, {
            type: 'schedule',
            interval: 'in 15 seconds',
            autoRemove: false,
        }, {a, b});

        return true;
    }

    @Get('jobs')
    public async getJobs() {
        const jobs = await this.agendaService.getJobs({ name: 'justATest', _id: '5c221a195251fa55ac7027dd' });

        return jobs;
    }

    @Get('requeue')
    public async requeueJob() {
        const jobs = await this.agendaService.requeueJobs({ name: 'justATest', _id: '5c24b429557a0340d461955d' });

        return jobs;
    }

    @Get('cancel')
    public async cancelJobs() {
        const jobs = await this.agendaService.cancelJobs({ name: 'justATest' });

        return jobs;
    }
}