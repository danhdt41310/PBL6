import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventsService } from './events.service';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'REDIS_PUBSUB',
                transport: Transport.REDIS,
                options: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT) || 6379,
                },
            },
        ]),
    ],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule { }
