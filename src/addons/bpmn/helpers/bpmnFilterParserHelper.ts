export class BpmnFilterParserHelper {

    constructor(private readonly originalFormula: string){

    }

    private getComparisonSymbol(comparisonType: number): string {
        switch(comparisonType) {
            case 3:
                return ' = ';
            default:
                return ` [Нет данных] `;
        }
    }

    public getFilterDisplayValue(): string {
        let filterDisplayValue = '';

        const filterDataJson = JSON.parse(this.originalFormula);
        if(filterDataJson.serializedFilterEditData) {
            const dataSourceFilters = JSON.parse(filterDataJson.serializedFilterEditData);
            Object.keys(dataSourceFilters.items).forEach(key => {
                const filter = dataSourceFilters.items[key];
                filterDisplayValue = `${filter.leftExpression.columnPath}${this.getComparisonSymbol(filter.comparisonType)}${filter.rightExpression.parameter.value.displayValue}`;
            });	
        }
        
        return filterDisplayValue;
    }
}