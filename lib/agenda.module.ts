import { Module } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { AgendaTaskRegisterService } from './agenda-task-register.service';
import { FancyLoggerService } from './fancy-logger.service';

@Module({
    providers: [
        AgendaService,
        AgendaTaskRegisterService,
        FancyLoggerService,
    ],
    exports: [AgendaService, AgendaTaskRegisterService],
})
export class AgendaModule {}