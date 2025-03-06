//Good ✅
export interface SendEmail{
    from?: string;
    to: string[] | string;
    subject: string;
    body: string;
}

export interface TemplateEmail {
    templatePath: {
        html: string
        css: string
    };
    params: { [key: string]: any };
}