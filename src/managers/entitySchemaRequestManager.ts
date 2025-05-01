import { isNullOrWhitespace } from "../constants";

export interface ConnectionConfig {
    host: string;
    username: string;
    password: string;
}

export interface EntitySchemaRequest {
    uId: string;
    packageUId: string;
}

export class EntitySchemaRequestManager {
    private readonly authPath = '/ServiceModel/AuthService.svc/Login';
    private readonly entitySchemaManagerRequestPath = '/0/DataService/json/SyncReply/EntitySchemaManagerRequest';
    private readonly entitySchemaRequestPath = '/0/DataService/json/SyncReply/EntitySchemaRequest';
    private readonly tokenKey = 'BPMCSRF';

    private tokenValue: string = '';
    private cookie: string = '';

    constructor(private readonly config: ConnectionConfig){

    }

    private async sendPostRequest(url: string, additionalHeaders: Record<string,string>, body?: string): Promise<Response> {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...additionalHeaders
            },
            body: body,
        });

        return response;
    }

    private async getToken() {
        const url = this.config.host + this.authPath;
        const data = { UserName: this.config.username, UserPassword: this.config.password };
        const body = JSON.stringify(data);
        const additionalHeaders = {};
        const response = await this.sendPostRequest(url, additionalHeaders, body);

        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }

        response.headers.forEach((value, name) => {
            if(value.includes(this.tokenKey)) {
                const values = value.split(';');
                this.tokenValue = values[0].split('=')[1];
                this.cookie += values[0] + ';';
            }else if(value.includes('UserName') || value.includes('.ASPXAUTH') || value.includes('BPMLOADER')){
                this.cookie += value.split(';')[0] + ';';
            }
        });
    }

    public async getSchemasInfo(): Promise<string> {
        if(isNullOrWhitespace(this.tokenValue)){
            await this.getToken();
        }
        const url = this.config.host + this.entitySchemaManagerRequestPath;
        const additionalHeaders = { 
            "Cookie": this.cookie, 
            "BPMCSRF": this.tokenValue 
        };
        const response = await this.sendPostRequest(url, additionalHeaders);

        if (!response.ok) {
            this.cookie = '';
            this.tokenValue = '';
            throw new Error(`Ошибка: ${response.status}`);
        }

        return await response.text();
    }

    public async getSchemaData(request: EntitySchemaRequest): Promise<string> {
        if(isNullOrWhitespace(this.tokenValue)){
            await this.getToken();
        }
        const url = this.config.host + this.entitySchemaRequestPath;
        const additionalHeaders = { 
            "Cookie": this.cookie, 
            "BPMCSRF": this.tokenValue 
        };
        const body = JSON.stringify({
            uId: request.uId,
            packageUId: request.packageUId
        });
        const response = await this.sendPostRequest(url, additionalHeaders, body);

        if (!response.ok) {
            this.cookie = '';
            this.tokenValue = '';
            throw new Error(`Ошибка: ${response.status}`);
        }

        return await response.text();
    }
}