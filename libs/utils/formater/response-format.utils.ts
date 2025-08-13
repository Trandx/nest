type RespnseAddType = {
    statusCode?: number;
    data?: any;
    method?: string;
    path?: string;
}
export type ResponseObjectType = {
    success: boolean;
    message: string | null;
    errors: any;
} & RespnseAddType
export const baseResponse:ResponseObjectType = {
    success: true,
    message: '',
    errors: null
}

export const successResponse = <T>({ data = null as unknown as T, message = ''}, options:RespnseAddType = {} ) => {
    return {
        ...baseResponse,
        ...options,
        data,
        message,
    }
}

export const errorResponse = ( {errors = null, message = ''}, options:RespnseAddType = {} ) => {
    return {
        ...baseResponse,
        ...options,
        success: false,
        errors,
        message,
    }
}

