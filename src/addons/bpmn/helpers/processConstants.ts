export enum ComparisonType {
    BETWEEN = 0,
    IS_NULL = 1,
    IS_NOT_NULL = 2,
    EQUAL = 3,
    NOT_EQUAL = 4,
    LESS = 5,
    LESS_OR_EQUAL = 6,
    GREATER = 7,
    GREATER_OR_EQUAL = 8,
    START_WITH = 9,
    NOT_START_WITH = 10,
    CONTAIN = 11,
    NOT_CONTAIN = 12,
    END_WITH = 13,
    NOT_END_WITH = 14,
    EXISTS = 15,
    NOT_EXISTS = 16
}

export enum ExpressionType {
    SCHEMA_COLUMN = 0,
    FUNCTION = 1,
    PARAMETER = 2,
    SUBQUERY = 3,
    ARITHMETIC_OPERATION = 4
}

export enum FilterType {
    NONE = 0,
    COMPARE = 1,
    IS_NULL = 2,
    BETWEEN = 3,
    IN = 4,
    EXISTS = 5,
    FILTER_GROUP = 6
}

export enum DataValueType {  
    GUID = 0,
    TEXT = 1,
    INTEGER = 4,
    FLOAT = 5,
    MONEY = 6,
    DATE_TIME = 7,
    DATE = 8,
    TIME = 9,
    LOOKUP = 10,
    ENUM = 11,
    BOOLEAN = 12,
    BLOB = 13,
    IMAGE = 14,
    CUSTOM_OBJECT = 15,
    IMAGELOOKUP = 16,
    COLLECTION = 17,
    COLOR = 18,
    LOCALIZABLE_STRING = 19,
    ENTITY = 20,
    ENTITY_COLLECTION = 21,
    ENTITY_COLUMN_MAPPING_COLLECTION = 22,
    HASH_TEXT = 23,
    SECURE_TEXT = 24,
    FILE = 25,
    MAPPING = 26,
    SHORT_TEXT = 27,
    MEDIUM_TEXT = 28,
    MAXSIZE_TEXT = 29,
    LONG_TEXT = 30,
    FLOAT1 = 31,
    FLOAT2 = 32,
    FLOAT3 = 33,
    FLOAT4 = 34,
    LOCALIZABLE_PARAMETER_VALUES_LIST = 35,
    METADATA_TEXT = 36,
    STAGE_INDICATOR = 37,
    OBJECT_LIST = 38,
    COMPOSITE_OBJECT_LIST = 39,
    FLOAT8 = 40
}

export enum FunctionType {
    NONE = 0,
    MACROS = 1,
    AGGREGATION = 2,
    DATE_PART = 3,
    LENGTH = 4,
    WINDOW = 5
}

export enum QueryMacrosType {
    NONE = 0,
    CURRENT_USER = 1,
    CURRENT_USER_CONTACT = 2,
    YESTERDAY = 3,
    TODAY = 4,
    TOMORROW = 5,
    PREVIOUS_WEEK = 6,
    CURRENT_WEEK = 7,
    NEXT_WEEK = 8,
    PREVIOUS_MONTH = 9,
    CURRENT_MONTH = 10,
    NEXT_MONTH = 11,
    PREVIOUS_QUARTER = 12,
    CURRENT_QUARTER = 13,
    NEXT_QUARTER = 14,
    PREVIOUS_HALF_YEAR = 15,
    CURRENT_HALF_YEAR = 16,
    NEXT_HALF_YEAR = 17,
    PREVIOUS_YEAR = 18,
    CURRENT_YEAR = 19,
    PREVIOUS_HOUR = 20,
    CURRENT_HOUR = 21,
    NEXT_HOUR = 22,
    NEXT_YEAR = 23,
    NEXT_N_DAYS = 24,
    PREVIOUS_N_DAYS = 25,
    NEXT_N_HOURS = 26,
    PREVIOUS_N_HOURS = 27,
    PRIMARY_COLUMN = 34,
    PRIMARY_DISPLAY_COLUMN = 35,
    PRIMARY_IMAGE_COLUMN = 36,
    DAY_OF_YEAR_TODAY = 37,
    DAY_OF_YEAR_TODAY_PLUS_DAYS_OFFSET = 38,
    NEXT_N_DAYS_OF_YEAR = 39,
    PREVIOUS_N_DAYS_OF_YEAR = 40
}

export enum AggregationType {
    NONE = 0,
    COUNT = 1,
    SUM = 2,
    AVG = 3,
    MIN = 4,
    MAX = 5
}

export enum AggregationEvalType {
    NONE = 0,
    ALL = 1,
    DISTINCT = 2
}

export enum DatePartType {
    NONE = 0,
    DAY = 1,
    WEEK = 2,
    MONTH = 3,
    YEAR = 4,
    WEEK_DAY = 5,
    HOUR = 6,
    HOUR_MINUTE = 7
}

export enum LogicalOperatorType {
    AND = 0,
    OR = 1
}

export enum ReadDataResultType {
    ENTITY = 0,
    FUNCTION = 1,
    ENTITY_COLLECTION = 2
}

export enum AggregateFunctionType {
    Count = 0,
    Sum = 1,
    Average = 2,
    Minimum = 3,
    Maximum = 4
}

//Name:0:1 - отключена
//Name:1:1 - по возрастанию
//Name:2:1 - по убыванию
export enum OrderDirectionType {
    None = 0,
    Ascending = 1,
    Descending = 2
}

export const OrderDirectionTypeResource: Record<string, string> = {
    [OrderDirectionType.None]: 'Отключена',
    [OrderDirectionType.Ascending]: 'По возрастанию',
    [OrderDirectionType.Descending]: 'По убыванию'
};

export const AggregateFunctionTypeResource: Record<string, string> = {
    [AggregateFunctionType.Count]: 'количество записей',
    [AggregateFunctionType.Sum]: 'сумма',
    [AggregateFunctionType.Average]: 'среднее',
    [AggregateFunctionType.Minimum]: 'минимум',
    [AggregateFunctionType.Maximum]: 'максимум'
};

export const ReadDataResultTypeResource: Record<string, string> = {
    [ReadDataResultType.ENTITY]: 'Читать первую запись из выборки',
    [ReadDataResultType.FUNCTION]: 'Считать функцию',
    [ReadDataResultType.ENTITY_COLLECTION]: 'Считать коллекцию записей'
};

export const LogicalOperatorTypeResource: Record<string, string> = {
    [LogicalOperatorType.AND]: 'И',
    [LogicalOperatorType.OR]: 'ИЛИ',
};

export const AggregationTypeResource: Record<string, string> = {
    [AggregationType.NONE]: 'операция не выбрана',
    [AggregationType.COUNT]: 'количество',
    [AggregationType.SUM]: 'сумма',
    [AggregationType.AVG]: 'среднее',
    [AggregationType.MIN]: 'минимум',
    [AggregationType.MAX]: 'максимум'
};

export const ComparisonTypeResource: Record<string, string> = {
    [ComparisonType.BETWEEN]: 'входит в диапазон',
    [ComparisonType.CONTAIN]: 'содержит',
    [ComparisonType.END_WITH]: 'заканчивается на',
    [ComparisonType.EQUAL]: '=',
    [ComparisonType.EXISTS]: 'существует',
    [ComparisonType.GREATER]: '>',
    [ComparisonType.GREATER_OR_EQUAL]: '≥',
    [ComparisonType.IS_NOT_NULL]: 'заполнено',
    [ComparisonType.IS_NULL]: 'не заполнено',
    [ComparisonType.LESS]: '<',
    [ComparisonType.LESS_OR_EQUAL]: '≤',
    [ComparisonType.NOT_CONTAIN]: 'не содержит',
    [ComparisonType.NOT_END_WITH]: 'не заканчивается на',
    [ComparisonType.NOT_EQUAL]: '≠',
    [ComparisonType.NOT_EXISTS]: 'не существует',
    [ComparisonType.NOT_START_WITH]: 'не начинается на',
    [ComparisonType.START_WITH]: 'начинается на'
};