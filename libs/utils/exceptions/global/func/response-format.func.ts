type ResponseAddType = {
    statusCode?: number;
    data?: any;
    method?: string;
    path?: string;
}
export type ResponseObjectType = {
    success: boolean;
    title: string;
    message: string | null;
    errors: any;
} & ResponseAddType
export const baseResponse:ResponseObjectType = {
    success: true,
    title: '',
    message: '',
    errors: null
}

export const successResponse = ({ data = null, message = ''}, options:ResponseAddType = {} ) => {
    return {
        ...baseResponse,
        ...options,
        data,
        message,
    }
}

export const errorResponse = ( { title = '', errors = null, message = ''}, options:ResponseAddType = {} ) => {
    return {
        ...baseResponse,
        ...options,
        success: false,
        errors,
        message,
        title,
    }
}

