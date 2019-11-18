import { Module } from '@nestjs/common';
import { AgendaService } from './agenda.service';
import { AgendaTaskRegisterService } from './agenda-task-register.service';

@Module({
    providers: [
        AgendaService,
        AgendaTaskRegisterService,
    ],
    exports: [AgendaService, AgendaTaskRegisterService],
})
export class AgendaModule {}