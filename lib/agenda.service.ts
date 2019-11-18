import { Injectable, Logger } from '@nestjs/common';
import { TaskMetadata } from './agenda.utils';
import { Controller } from '@nestjs/common/interfaces';
import * as Agenda from 'agenda';
import * as Bluebird from 'bluebird';
import { ObjectId } from 'mongodb';

interface AgendaNest extends Agenda {
    _collection?: any;
    _db?: any;
    _mdb?: any;
    db_init?: any;
    _indices?: any;
}

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
    private logger: Logger = new Logger('Agenda service');

    public async registerTask(task: (job: Agenda.Job, done) => void, metadata: TaskMetadata, ctrl: Controller) {
        const agendaName: string = metadata.collection || AgendaService.DEFAULT_AGENDA_NAME;

        if (!this.agendas[agendaName]) {
            this.agendas[agendaName] = await this.createAgenda(metadata);
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

        const requeuedJobs = jobs.map((job: Agenda.Job) => agenda.now(job.attrs.name, job.attrs.data));

        return Promise.all(requeuedJobs);
    }

    public async rerunJobs(queryParams: any) {
        const jobs: Agenda.Job[] = await this.getJobs(queryParams);

        const metadata: TaskMetadata = this.tasks[queryParams.name];
        const agenda: Agenda = this.getAgenda(metadata.collection);

        const rerunJobs = jobs.map((job: Agenda.Job) => {
            job.attrs.nextRunAt = new Date();
            job.save();
        });

        return Promise.all(jobs);
    }

    public async cancelJobs(queryParams: any) {
        const metadata: TaskMetadata = this.tasks[queryParams.name];
        const agenda: Agenda = this.getAgenda(metadata.collection);

        let numRemoved;

        if (queryParams._id) {
            numRemoved = await agenda.cancel({ _id: new ObjectId(queryParams._id) });
        } else {
            numRemoved = await agenda.cancel(queryParams);
        }

        return numRemoved;
    }

    private async createAgenda({
        options,
        completedCollection
    }: {
        options ?: Agenda.AgendaConfiguration;
        completedCollection?: string;
    }): Bluebird<Agenda> {
        const agenda: AgendaNest = new Agenda(options);

        let completedCol;

        return new Promise((resolve) => {
            agenda.on('ready', async () => {
                await agenda.start();

                if (completedCollection) {
                    completedCol = agenda._mdb.collection(completedCollection);
                    completedCol.createIndex(agenda._indices, {name: 'findAndLockNextJobIndex'}, (err: any) => {
                        this.logger.error(err);
                    });
                }
            });

            agenda.on('complete', async (job: Agenda.Job) => {
                if (
                    completedCollection &&
                    (job.attrs.data.completed === true || job.attrs.data.completed === undefined)
                ) {
                    completedCol.insertOne(job.attrs);
                    job.remove();
                }
            });

            resolve(agenda);
        });
    }
}
