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
                let leftExpression = '';
                let rightExpression = '';
                if(filter.className === 'Terrasoft.InFilter'){
                    leftExpression = filter.leftExpressionCaption;
                    rightExpression = filter.rightExpressions[0].parameter.value.displayValue;
                    if(filter.rightExpressions.length > 1){
                        throw('rightExpressions.length > 1');
                    }
                }else{
                    leftExpression = filter.leftExpression.columnPath;
                    rightExpression = filter.rightExpression.parameter.value.displayValue;
                }
                filterDisplayValue = `${leftExpression}${this.getComparisonSymbol(filter.comparisonType)}${rightExpression}`;
            });	
        }
        
        return filterDisplayValue;
    }
}