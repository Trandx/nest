// audit.interceptor.ts
import {
    CallHandler,
    ExecutionContext,
    Inject,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ActivityLogService } from './activiy-log.service';
import { Reflector } from '@nestjs/core';
import { ACTION_KEY } from './decorator';
import { ACTIVITY_LOG_EVENT_NAME } from './const';

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

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly activityLogService: ActivityLogService,
        @Inject(ACTIVITY_LOG_EVENT_NAME) private readonly eventName: string
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

                    await this.activityLogService.sendAsync({
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
