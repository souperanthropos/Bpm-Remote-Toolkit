import 'reflect-metadata';
import { plainToClass, Transform, Type } from "class-transformer";
import { FilterType, LogicalOperatorType } from "./filterConstants";
import { isNullOrWhitespace } from '../../../constants';

function serializedFilterEditDataConverter(value: string): SerializedFilterEditData | undefined {
    if (!isNullOrWhitespace(value)) {
        const filterJson = JSON.parse(value);
        return plainToClass(SerializedFilterEditData, filterJson);
    }
    return undefined;
}

class SerializedFilterEditData {
    className: string = '';
    isEnabled: boolean = false;
    rootSchemaName: string = '';
    key: string = '';

    @Transform(({ value }) => FilterType[value])
    filterType: FilterType = FilterType.NONE;

    @Transform(({ value }) => LogicalOperatorType[value])
    logicalOperation: LogicalOperatorType = LogicalOperatorType.AND;
}

export class Filter {
    className: string = '';

    @Type(() => SerializedFilterEditData)
    @Transform(({ value }) => serializedFilterEditDataConverter(value))
    serializedFilterEditData?: SerializedFilterEditData;
    dataSourceFilters: string = '';
}

export class BpmnFilterParserHelper {
    private readonly filter: Filter;

    constructor(private readonly originalFormula: string){
        const filterJson = JSON.parse(originalFormula);
        this.filter = plainToClass(Filter, filterJson);
    }

    public getFilterDisplayValue(): string {
        let filterDisplayValue = '';
        
        return filterDisplayValue;
    }
}