import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { TaskMetadataExplorer } from './agenda-task-metadata.explorer';
import { AgendaService } from './agenda.service';
import { TaskRegisterMetadata } from './agenda.utils';

export class InvalidModuleRefException extends Error {
    constructor() {
        super(`Invalid ModuleRef exception. Remember to set module reference "setModuleRef()".`);
    }
}

@Injectable()
export class AgendaTaskRegisterService {
    private moduleRef: ModuleRef = null;
    private readonly moduleName: string = 'AgendaModule';
    private readonly metadataExplorer: TaskMetadataExplorer;
    private logger: Logger = new Logger('Agenda tasks');

    constructor(private readonly agendaService: AgendaService) {
        this.metadataExplorer = new TaskMetadataExplorer(
            new MetadataScanner(),
        );
    }

    setModuleRef(moduleRef) {
        this.moduleRef = moduleRef;
    }

    async register(tasks, metaData?: TaskRegisterMetadata) {
        if (!this.moduleRef) {
            throw new InvalidModuleRefException();
        }

        if (Array.isArray(tasks)) {
            tasks.forEach(async (task) => {
                const instance = this.moduleRef.get(task);

                if (!instance) {
                    return;
                }

                await this.createTasks(instance, metaData);
            });
        } else {
            const instance = this.moduleRef.get(tasks);

            if (!instance) {
                return;
            }

            await this.createTasks(instance, metaData);
        }
    }

    async createTasks(instance, metaData?: TaskRegisterMetadata) {
        for (const { task, metadata } of this.metadataExplorer.explore(instance)) {
            if (metaData) {
                if (metaData.concurrency) {
                    Object.assign(metadata, { concurrency: metaData.concurrency });
                }

                if (metaData.collection) {
                    Object.assign(metadata, { collection: metaData.collection });
                }

                if (metaData.completedCollection) {
                    Object.assign(metadata, { completedCollection: metaData.completedCollection });
                }

                if (metaData.options) {
                    Object.assign(metadata, {
                        options: Object.assign({}, metadata.options || {}, metaData.options),
                    });
                }
            }

            await this.agendaService.registerTask(task, metadata, instance);

            const taskDesc = {
                name: metadata.name,
                collection: metadata.collection,
                concurrency: metadata.concurrency,
            };

            this.logger.log(JSON.stringify(taskDesc), 'Agenda register task');
        }
    }
}