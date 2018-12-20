import { Controller, Get } from '@nestjs/common';
import { AgendaService } from '../lib';
import { AppTasks } from './app.tasks';

@Controller('app')
export class AppController {
    constructor(
        private readonly agendaService: AgendaService,
        private readonly tasks: AppTasks,
    ) {}

    @Get('run')
    public async runTask() {
        const a = 1;
        const b = 2;

        await this.agendaService.createJob(this.tasks.justATest, {
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

    @Get('cancel')
    public async cancelJobs() {
        const jobs = await this.agendaService.cancelJobs({ name: 'justATest' });

        return jobs;
    }
}