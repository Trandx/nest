// types/rpc.types.ts
export interface RpcHandler {
    (data: any): Promise<any> | any;
}

export interface RpcHandlers {
[key: string]: RpcHandler;
}

// interfaces/pool.interface.ts
export interface IPool<T> {
getClient(): Promise<T>;
}