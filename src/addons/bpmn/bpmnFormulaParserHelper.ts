import { ParameterMapping, ProcessElement } from "./bpmn-viewer";

export class BpmnFormulaParserHelper {
    
    constructor(private readonly originalFormula: string){

    }

    private extractAllElementParameters(): string[] {
		const regex = /\[Element:{[^}]+}\]\.\[Parameter:{[^}]+}\]/g;
		const matches = this.originalFormula.match(regex);
		return matches || [];
	}

    private getDisplayValue(replacements: string[]): string {
		const cleanedString = this.originalFormula.replace(/\[IsOwnerSchema:false\]\.\[IsSchema:false\]\./g, '');
		let index = 0;
		return cleanedString.replace(/\[Element:{[^}]+}\]\.\[Parameter:{[^}]+}\]/g, () => {
			return index < replacements.length ? replacements[index++] : `[Нет данных]`;
		});
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

    public getConditionFormulaDisplayValue(elementCaptions: Record<string, string>, parameterMappings: Record<string, ParameterMapping>, elementParameters: Record<string, ProcessElement>): string {
        const extractedParameters = this.extractAllElementParameters();
        const formulaParts = new Array<string>();
        extractedParameters.forEach(param => {
            const parameterMapping = parameterMappings[param];
            const parameters = elementParameters[parameterMapping.elementName].parameters;
            const firstDisplayValue = elementCaptions[parameterMapping.elementName];
            let secondDisplayValue = parameterMapping.parameterId;
            for(const key in parameters){
                if(parameters[key].Uid === parameterMapping.parameterId){
                    secondDisplayValue = parameters[key].Caption;
                    break;
                }
            }
            if(parameterMapping) {
                formulaParts.push(`${firstDisplayValue}.${secondDisplayValue}`);
            }
        });
        return this.getDisplayValue(formulaParts);
    }
}