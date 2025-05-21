import { plainToClass, Transform, Type } from "class-transformer";
import { isNullOrWhitespace } from "../constants";

function convertToColumnsData(input: any): ColumnInfo[] {
    const columns: ColumnInfo[] = [];

    if (typeof input === 'object') {
        Object.entries(input).forEach(([key, value]) => {
            if(value && typeof value === 'object'){
                Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                    columns.push(plainToClass(ColumnInfo, nestedValue));
                });
            }
        });
    }
    
    return columns;
}

class ObjectInfo {
    isVirtual: boolean = false;
    id: string = '';
    name: string = '';
    caption: string = '';
    uId: string = '';
    packageUId: string = '';
    parentUId: string = '';
    extendParent: boolean = false;
}

class ObjectInfoList {
    @Type(() => ObjectInfo)
    collection: ObjectInfo[] = [];

    public getObjectInfo(objectName: string): ObjectInfo | undefined {
        return this.collection.find(o=>o.name === objectName);
    }
}

class ColumnInfo {
    uId: string = '';
    name: string = '';
    caption: Record<string,string> = {};
}

class ObjectSchemaInfo {
    @Type(() => ColumnInfo)
    @Transform(({ value }) => convertToColumnsData(value))
    columns: ColumnInfo[] = [];

    public getColumnsInfo(uIds: string[]): string[] {
        const columnsInfo: string[] = [];

        uIds.forEach(uId =>{
            const columnInfo = this.columns.find(o=>o.uId === uId);
            if(columnInfo){
                columnsInfo.push(columnInfo.caption['ru-RU']);
            }
        });
        
        return columnsInfo;
    }
}

class ObjectSchemaInfoResult {
    @Type(() => ObjectSchemaInfo)
    schema?: ObjectSchemaInfo;

    success: boolean = false;
    maxEntitySchemaNameLength: number = 0;
}

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

    private objectInfoList?: ObjectInfoList;

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

    private async getSchemasInfo() {
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

        const body = await response.text();
        this.objectInfoList = plainToClass(ObjectInfoList, JSON.parse(body));
    }

    private async getObjectSchemaInfo(objectName: string): Promise<ObjectSchemaInfo | undefined> {
        if(isNullOrWhitespace(this.tokenValue)){
            await this.getToken();
        }

        if(this.objectInfoList === undefined){
            await this.getSchemasInfo();
        }

        const objectInfo = this.objectInfoList?.getObjectInfo(objectName);
        if(objectInfo === undefined){
            return undefined;
        }

        const url = this.config.host + this.entitySchemaRequestPath;
        const additionalHeaders = { 
            "Cookie": this.cookie, 
            "BPMCSRF": this.tokenValue 
        };
        const body = JSON.stringify({
            uId: objectInfo.uId,
            packageUId: objectInfo.packageUId
        });
        const response = await this.sendPostRequest(url, additionalHeaders, body);

        if (!response.ok) {
            this.cookie = '';
            this.tokenValue = '';
            throw new Error(`Ошибка: ${response.status}`);
        }

        const responseBody = await response.text();
        const objectSchemaInfoResult = plainToClass(ObjectSchemaInfoResult, JSON.parse(responseBody));
        return objectSchemaInfoResult.schema;
    }

    public async getColumnNameList(objectName: string, uIds: string[]): Promise<string[]> {
        const objectSchemaInfo = await this.getObjectSchemaInfo(objectName);
        if(objectSchemaInfo){
            return objectSchemaInfo.getColumnsInfo(uIds);
        }
        return [];
    }
}