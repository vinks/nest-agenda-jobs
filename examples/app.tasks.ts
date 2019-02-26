import { Injectable } from '@nestjs/common';
import * as Agenda from 'agenda';
import { Task } from '../lib';

async function sleep(delay) {
    return new Promise((ok) => {
      setTimeout(ok, delay * 1000);
    });
}

async function addFunc(a, b) {
    await sleep(2);
    return a + b;
}

@Injectable()
export class AppTasks {
    @Task({ name: 'justATest' })
    async justATest(job: Agenda.Job, done) {
        const result = await addFunc(
            job.attrs.data.a,
            job.attrs.data.b,
        );

        if (job.attrs.data.autoRemove) {
            job.remove();
        }

        job.attrs.data.extra = [];
        job.save();

        console.log('Result justATest', result, new Date().toString());

        done(null, result);
    }
}