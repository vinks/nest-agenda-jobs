import { Injectable } from '@nestjs/common';
import { TaskMetadata } from './agenda.utils';
import { FancyLoggerService } from './fancy-logger.service';
import { Controller } from '@nestjs/common/interfaces';
import * as Agenda from 'agenda';
import * as Bluebird from 'bluebird';
import { ObjectId } from 'mongodb';

@Injectable()
export class AgendaService {
    private static readonly DEFAULT_AGENDA_NAME: string = 'default';
    private static readonly DEBUG_EVENTS: Array<string> = [
        'job enqueue',
        'job complete',
        'job failed attempt',
        'job failed',
    ];

    private agendas: { [name: string]: Agenda } = {};
    private tasks: { [name: string]: TaskMetadata } = {};
    private debugActive: boolean = false;

    constructor(
        private readonly fancyLogger: FancyLoggerService,
    ) {}

    public async registerTask(task: (job, done) => void, metadata: TaskMetadata, ctrl: Controller) {
        const agendaName: string = metadata.collection || AgendaService.DEFAULT_AGENDA_NAME;

        if (!this.agendas[agendaName]) {
            this.agendas[agendaName] = await this.createAgenda(metadata.options);
        }

        this.agendas[agendaName].define(metadata.name, async (j, d) => {
            return Promise.resolve(task.call(ctrl, j, d));
        });

        this.tasks[metadata.name] = metadata;
    }

    public getAgendas() {
        return this.agendas;
    }

    public getAgenda(name: string): Agenda {
        const agendaName: string = name || AgendaService.DEFAULT_AGENDA_NAME;
        const agenda: Agenda = this.getAgendas()[agendaName];

        return agenda;
    }

    public async createJob(task, jobParams, data: Object, opts?: Agenda.JobOptions): Bluebird<Agenda.Job<any>> {
        const metadata: TaskMetadata = this.tasks[task.name];
        const agenda: Agenda = this.getAgenda(metadata.collection);
        const { autoRemove } = jobParams;

        let job: Agenda.Job;

        if (jobParams.type === 'now') {
            job = await agenda.now(task.name, Object.assign({}, data, { autoRemove }));

            return job;
        } else {
            job = agenda.create(task.name, data);
            job[jobParams.type](jobParams.interval || jobParams.time, opts);
            job.save();
        }

        return job;
    }

    public async getJobs(queryParams: any): Promise<Agenda.Job[]> {
        const metadata: TaskMetadata = this.tasks[queryParams.name];
        const agenda: Agenda = this.getAgenda(metadata.collection);
        let jobs;

        if (queryParams._id) {
            jobs = await agenda.jobs({ _id: new ObjectId(queryParams._id) });
        } else {
            jobs = await agenda.jobs(queryParams);
        }

        return jobs;
    }

    public async requeueJobs(queryParams: any) {
        const jobs: Agenda.Job[] = await this.getJobs(queryParams);

        const metadata: TaskMetadata = this.tasks[queryParams.name];
        const agenda: Agenda = this.getAgenda(metadata.collection);

        const requeuedJobs = jobs.map((job: Agenda.Job) => agenda.create(job.attrs.name, job.attrs.data).save());

        return Promise.all(requeuedJobs);
    }

    public async cancelJobs(queryParams: any) {
        const metadata: TaskMetadata = this.tasks[queryParams.name];
        const agenda: Agenda = this.getAgenda(metadata.collection);

        const numRemoved = await agenda.cancel(queryParams);

        return numRemoved;
    }

    private async createAgenda(agendaOptions?: Agenda.AgendaConfiguration ): Bluebird<Agenda> {
        const agenda: Agenda = new Agenda(agendaOptions);

        return new Promise((resolve) => {
            agenda.on('ready', async () => {
                await agenda.start();
            });

            resolve(agenda);
        });
    }
}
