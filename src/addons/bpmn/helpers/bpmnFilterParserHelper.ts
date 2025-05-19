import 'reflect-metadata';
import { plainToClass, Transform, Type } from "class-transformer";
import { ComparisonType, ComparisonTypeResource, DataValueType, ExpressionType, FilterType, LogicalOperatorType } from "./processConstants";
import { isNullOrWhitespace } from '../../../constants';

function serializedFilterEditDataConverter(value: string): SerializedFilterEditData | undefined {
    if (!isNullOrWhitespace(value)) {
        const filterJson = JSON.parse(value);
        return plainToClass(SerializedFilterEditData, filterJson);
    }
    return undefined;
}

function filterEditDataItemConverter(value: any): Record<string, FilterEditDataItem> {
    const filterEditDataItem: Record<string, FilterEditDataItem> = {};
    if (typeof value === 'object') {
        Object.entries(value).forEach(([key, data]) => {
            if (typeof data === 'object') {
                const item = plainToClass(FilterEditDataItem, data);
                filterEditDataItem[key] = item;
            }
        });
    }
    return filterEditDataItem;
}

class ParameterValue {
    value: string = '';
    displayValue: string = '';
}

class ParameterExpression {
    className: string = '';

    @Transform(({ value }) => DataValueType[value])
    dataValueType: DataValueType = DataValueType.GUID;

    @Type(() => ParameterValue)
    value!: ParameterValue;
}

class LeftExpression {
    className: string = '';
    columnPath: string = '';

    @Transform(({ value }) => ExpressionType[value])
    expressionType: ExpressionType = ExpressionType.SCHEMA_COLUMN;
}

class RightExpression {
    className: string = '';

    @Transform(({ value }) => ExpressionType[value])
    expressionType: ExpressionType = ExpressionType.SCHEMA_COLUMN;

    @Type(() => ParameterExpression)
    parameter!: ParameterExpression;
}

class FilterEditDataItem {
    className: string = '';
    isEnabled: boolean = false;
    trimDateTimeParameterToDate: boolean = false;
    isAggregative: boolean = false;
    key: string = '';
    leftExpressionCaption: boolean = false;

    @Transform(({ value }) => FilterType[value])
    filterType: FilterType = FilterType.NONE;

    @Transform(({ value }) => ComparisonType[value])
    comparisonType: ComparisonType = ComparisonType.BETWEEN;

    @Transform(({ value }) => DataValueType[value])
    dataValueType!: DataValueType;

    @Type(() => LeftExpression)
    leftExpression?: LeftExpression;

    @Type(() => RightExpression)
    rightExpression!: RightExpression;
}

class SerializedFilterEditData {
    className: string = '';
    isEnabled: boolean = false;
    rootSchemaName: string = '';
    key: string = '';

    @Transform(({ value }) => filterEditDataItemConverter(value))
    items: Record<string, FilterEditDataItem> = {};

    @Transform(({ value }) => FilterType[value])
    filterType: FilterType = FilterType.NONE;

    @Transform(({ value }) => LogicalOperatorType[value])
    logicalOperation: LogicalOperatorType = LogicalOperatorType.AND;
}

export class Filter {
    className: string = '';

    @Type(() => SerializedFilterEditData)
    @Transform(({ value }) => serializedFilterEditDataConverter(value))
    serializedFilterEditData!: SerializedFilterEditData;
}

export class BpmnFilterParserHelper {
    private readonly filter: Filter;

    constructor(originalFormula: string){
        const filterJson = JSON.parse(originalFormula);
        this.filter = plainToClass(Filter, filterJson);
    }

    private getRightExpressionDisplayValue(parameter: ParameterExpression): string {
        let displayValue = '';
        const dataValueType = DataValueType[parameter.dataValueType.toString() as keyof typeof DataValueType];

        switch(dataValueType){
            case DataValueType.BOOLEAN:
                displayValue = parameter.value ? 'ДА' : 'НЕТ';
                break;
            case DataValueType.MAPPING:
            default:
                displayValue = parameter.value.displayValue;
                break;
        }

        return displayValue;
    }

    private getRenderSubFilter(key: string, subFilter: FilterEditDataItem): string {
        const comparisonKey = ComparisonType[subFilter.comparisonType];

        let innerHtml = `
			<div class="${key}-child-conteiner">
                <span id="leftExpression">${subFilter.leftExpressionCaption}</span>
                <span id="comparationType">${ComparisonTypeResource[comparisonKey]}</span>
                <span id="rightExpression">${this.getRightExpressionDisplayValue(subFilter.rightExpression.parameter)}</span>
            </div>
        `;

        return innerHtml;
    }

    public getRootSchemaName(): string {
        return this.filter.serializedFilterEditData.rootSchemaName;
    }

    public getRenderFilter(): string {
        let childsInnerHtml = `
        `;

        Object.entries(this.filter.serializedFilterEditData.items).forEach(([key, subFilter]) => {
            childsInnerHtml += this.getRenderSubFilter(key, subFilter);
        });

        let innerHtml = `
			<div class="general-conteiner">
                <span id="logicaloperation">${this.filter.serializedFilterEditData.logicalOperation}</span>
                <div class="vl"></div>
                <div class="childs-conteiner">${childsInnerHtml}</div>
            </div>
        `;
        
        return innerHtml;
    }
}