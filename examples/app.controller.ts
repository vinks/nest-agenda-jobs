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
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;

        await this.agendaService.createJob(this.appTasks.justATest, {
            type: 'now',
            autoRemove: false,
        }, {a, b});

        return true;
    }

    @Get('jobs')
    public async getJobs() {
        const jobs = await this.agendaService.getJobs({ name: 'justATest' });

        return jobs;
    }

    @Get('rerun')
    public async rerunJobs() {
        const jobs = await this.agendaService.rerunJobs({ name: 'justATest' });

        return jobs;
    }

    @Get('requeue')
    public async requeueJob() {
        const jobs = await this.agendaService.requeueJobs({ name: 'justATest' });

        return jobs;
    }

    @Get('cancel')
    public async cancelJobs() {
        const jobs = await this.agendaService.cancelJobs({ name: 'justATest' });

        return jobs;
    }
}