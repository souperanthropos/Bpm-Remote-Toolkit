import 'reflect-metadata';
import { Expose, plainToClass, Transform, Type } from "class-transformer";
import { isNullOrWhitespace } from '../../constants';
import { Resource } from './bpmn-viewer';
import { BpmnFilterParserHelper } from './helpers/bpmnFilterParserHelper';

function convertToPoint(input: string): Point | undefined {
    if (!isNullOrWhitespace(input)) {
        const coordinate = input.split(';');
        if (coordinate.length === 2) {
            return new Point(coordinate[0], coordinate[1]);
        }
    }
    return undefined;
}

function convertToMidPoints(input: any): Record<string, Point> {
    const points: Record<string, Point> = {};

    if (typeof input === 'object') {
        Object.entries(input).forEach(([key, value]) => {
            if (key.startsWith("Item") && typeof value === 'string') {
                const point = convertToPoint(value);
                if (point) {
                    points[key] = point;
                }
            }
        });
    }
    
    return points;
}

function convertToSize(input: string): Size | undefined {
    if (!isNullOrWhitespace(input)) {
        const coordinate = input.split(';');
        if (coordinate.length === 2) {
            return new Size(coordinate[0], coordinate[1]);
        }
    }
    return undefined;
}

class Point {
    X: number;
    Y: number;

    constructor(x: string, y: string){
        this.X = parseFloat(x);
        this.Y = parseFloat(y);
    }
}

class Size {
    Width: number;
    Height: number;

    constructor(width: string, height: string){
        this.Width = parseFloat(width);
        this.Height = parseFloat(height);
    }
}

class ParameterMapping {
    @Expose({ name: 'BL1' })
    Namespace: string = '';

    UId: string = '';

    @Expose({ name: 'A2' })
	ElementName: string = '';

    @Expose({ name: 'GT2' })
	ParameterId: string = '';

    @Expose({ name: 'GT1' })
    @Type(() => ParameterValue)
    Value: {} = {};
}

class ParameterValue {
    @Expose({ name: 'GS2' })
	Formula: string = '';
}

class Parameter {
    @Expose({ name: 'BL1' })
    Namespace: string = '';

    UId: string = '';

    @Expose({ name: 'A2' })
	Name: string = '';

    @Expose({ name: 'L8' })
    @Type(() => ParameterValue)
    Value?: ParameterValue;
}

export class Element {
    @Expose({ name: 'BL1' })
    Namespace: string = '';

    UId: string = '';

    @Expose({ name: 'A2' })
	Name: string = '';

    @Expose({ name: 'CH1' })
	BodyScript: string = '';

    @Expose({ name: 'BL3' })
    @Type(() => Point)
    @Transform(({ value }) => convertToPoint(value), { toClassOnly: true })
    Location?: Point;

    @Expose({ name: 'BN2' })
    @Type(() => Size)
    @Transform(({ value }) => convertToSize(value), { toClassOnly: true })
    Size?: Size;

    @Expose({ name: 'CI1' })
	SourceRef: string = '';

    @Expose({ name: 'CI2' })
	TargetRef: string = '';

    @Expose({ name: 'CI11' })
    @Type(() => Point)
    @Transform(({ value }) => convertToPoint(value), { toClassOnly: true })
    StartPoint?: Point;

    @Expose({ name: 'CI10' })
    @Type(() => Point)
    @Transform(({ value }) => convertToMidPoints(value), { toClassOnly: true })
    MidPoints?: Record<string, Point>;

    @Expose({ name: 'CI12' })
    @Type(() => Point)
    @Transform(({ value }) => convertToPoint(value), { toClassOnly: true })
    EndPoint?: Point;

    @Expose({ name: 'BP2' })
    @Type(() => Parameter)
    Parameters?: Parameter[];
}

export class ProcessSchema {
	UId: string = '';
	@Expose({ name: 'A2' })
	Name: string = '';

    @Expose({ name: 'FJ1' })
    @Type(() => Parameter)
    Parameters: Parameter[] = [];

    @Expose({ name: 'BK15' })
    @Type(() => ParameterMapping)
    ParameterMappings: ParameterMapping[] = [];

    @Expose({ name: 'BK4' })
    @Type(() => Element)
    Elements: Element[] = [];
}

export interface ElementSettings {
    //parameters?: Record<string, ElementParameter>;
    script?: string;
    condition?: string;
    filter?: string;
}

export class ProcessSchemaWrapper {
    private static _processSchema: ProcessSchema;
    private static _elementCaptions: Record<string, string> = {};
    private static _elementSettingsCache: Record<string, ElementSettings> = {};

    public static get processSchema(): ProcessSchema {
        return this._processSchema;
    }

    public static setMetadata(metadata: string, resource: Resource){
        const processMetadataJson = JSON.parse(metadata);
        this._processSchema = plainToClass(ProcessSchema, processMetadataJson.MetaData.Schema);
        this._elementCaptions = Resource.getElementsCaption(resource);
        this._elementSettingsCache = {};
    }

    public static getElementCaption(elementName: string): string {
        return this._elementCaptions[elementName];
    }

    public static getElementSettings(elementName: string): ElementSettings {
        if(this._elementSettingsCache[elementName]){
            return this._elementSettingsCache[elementName];
        }
        const element = this._processSchema.Elements.find(e=>e.Name === elementName);
        const settings: ElementSettings = { };
        if(element){
            switch(element.Namespace){
                case 'Terrasoft.Core.Process.ProcessSchemaScriptTask':
                    settings.script = element.BodyScript;
                    this._elementSettingsCache[elementName] = settings;
                    return settings;
                default:
                    if(element.Parameters){
                        const filter = element.Parameters.find(p=>p.Name === 'DataSourceFilters');
                        if(filter){
                            const filterHelper = new BpmnFilterParserHelper(filter.Value!.Formula);
                            settings.filter = filter.Value?.Formula;
                        }
                    }
            }
        }
        return settings;
    }
}