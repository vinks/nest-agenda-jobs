import 'reflect-metadata';
import { AgendaConfiguration, JobAttributes } from 'agenda';
import { TASK_METADATA, TASK_CONFIGURATION_METADATA } from './agenda.constants';

export interface TaskMetadata {
    name: string;
    collection?: string;
    completedCollection?: string;
    isCompleted?: (jobAttr: JobAttributes) => boolean;
    concurrency?: number;
    options?: AgendaConfiguration;
}

export interface TaskRegisterMetadata {
    collection?: string;
    completedCollection?: string;
    isCompleted?: (jobAttr: JobAttributes) => boolean;
    concurrency?: number;
    options?: AgendaConfiguration;
}

export const Task = (metadata?: TaskMetadata | string): MethodDecorator => {
    return (target, key, descriptor: PropertyDescriptor) => {
        Reflect.defineMetadata(TASK_CONFIGURATION_METADATA, metadata, descriptor.value);
        Reflect.defineMetadata(TASK_METADATA, true, descriptor.value);
        return descriptor;
    };
};