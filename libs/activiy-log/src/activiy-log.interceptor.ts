// audit.interceptor.ts
import {
    CallHandler,
    ExecutionContext,
    Inject,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ActivityLogService } from './activiy-log.service';
import { Reflector } from '@nestjs/core';
import { ACTION_KEY } from './decorator';

export type ActivityLog = {
    userId: string | number | null;
    method: string;
    url: string;
    ip: string;
    action: string;
    body: any;
    query: any;
    params: any;
    response: any;
    duration: string;
    startedAt: Date;
    finishedAt: Date;
}

export const NOTIFICATION_EVENT_NAME = 'NOTIFICATION_EVENT_NAME'

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly auditService: ActivityLogService,
        @Inject(NOTIFICATION_EVENT_NAME) private readonly eventName: string
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const user = request.user; // comes from authentication (Passport, JWT, etc.)
        const action = this.reflector.get<string>(ACTION_KEY, context.getHandler()) ?? request.action;
        const { method, url, body, query, params, ip } = request;

        const start = Date.now(); // record start time

        return next.handle().pipe(
            tap(async (data) => {
                try {
                    const end = Date.now();
                    // make a payload
                    const payload: ActivityLog = {
                        userId: user?.id ?? null,
                        method,
                        url,
                        ip,
                        action, //: 'CREATE_INVOICE',
                        body,
                        query,
                        params,
                        response: data,
                        duration: `${end - start}ms`, // duration in ms
                        startedAt: new Date(start),
                        finishedAt: new Date(end),
                    }

                    await this.auditService.sendAsync({
                        eventName: this.eventName,
                        payload
                    });
                } catch (error) {
                    throw error;
                }
            }),
        );
    }
}
