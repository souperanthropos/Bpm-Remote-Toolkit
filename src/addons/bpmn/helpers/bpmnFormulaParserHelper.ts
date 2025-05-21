import { ProcessSchema } from "../processSchema";

export class BpmnFormulaParserHelper {
    private formula: string = '';

    constructor(private readonly processSchema: ProcessSchema,
        private readonly elementCaptions: Record<string, string>
    ){

    }

    private extractAllElementParameters(): string[] {
		const regex = /\[Element:{[^}]+}\]\.\[Parameter:{[^}]+}\]/g;
		const matches = this.formula.match(regex);
		return matches || [];
	}

    private extractParameterValue(): string {
        const regex = /Parameter:\s*{([^}]*)}/;
        const match = this.formula.match(regex);
        return match ? match[1] : '';
    }

    private getDisplayValue(replacements: string[]): string {
		const cleanedString = this.formula.replace(/\[IsOwnerSchema:false\]\.\[IsSchema:false\]\./g, '');
		let index = 0;
		return cleanedString.replace(/\[Element:{[^}]+}\]\.\[Parameter:{[^}]+}\]/g, () => {
			return index < replacements.length ? replacements[index++] : `[Нет данных]`;
		});
	}

    public getParameterName(formula: string): string {
        this.formula = formula;
        const parameterUid = this.extractParameterValue();
        const parameter = this.processSchema.Parameters.find(p=>p.UId === parameterUid);
		if(parameter){
            return parameter.Name;
        }
        return '';
	}

    public getConditionFormulaDisplayValue(formula: string): string {
        this.formula = formula;
        /*const extractedParameters = this.extractAllElementParameters();
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
        */
       return '';
    }
}