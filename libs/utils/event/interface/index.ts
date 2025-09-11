export type EventMap = Record<string, any>;

export type EventType<T extends EventMap> = { eventName: keyof T; payload: T[keyof T] }

