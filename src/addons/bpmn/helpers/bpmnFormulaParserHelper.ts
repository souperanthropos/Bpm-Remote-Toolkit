import { Logger } from "../../../common/logger";
import { Resource } from "../bpmn-viewer";
import { ProcessSchema } from "../processSchema";

export class BpmnFormulaParserHelper {
    private readonly elementCaptions: Record<string, string>;

    constructor(private readonly processSchema: ProcessSchema,
        private readonly resource: Resource
    ){
        this.elementCaptions = Resource.getElementsCaption(resource);
    }

    private extractElementValue(formula: string): string {
        const regex = /Element:\s*{([^}]*)}/;
        const match = formula.match(regex);
        return match ? match[1] : '';
    }

    private extractParameterValue(formula: string): string {
        const regex = /Parameter:\s*{([^}]*)}/;
        const match = formula.match(regex);
        return match ? match[1] : '';
    }

    /*private getDisplayValue(replacements: string[]): string {
		const cleanedString = this.formula.replace(/\[IsOwnerSchema:false\]\.\[IsSchema:false\]\./g, '');
		let index = 0;
		return cleanedString.replace(/\[Element:{[^}]+}\]\.\[Parameter:{[^}]+}\]/g, () => {
			return index < replacements.length ? replacements[index++] : `[Нет данных]`;
		});
	}*/

    private replaceElementValue(source: string, newValue: string): string {
        const cleanedString = source.replace(/\[IsOwnerSchema:false\]\.\[IsSchema:false\]\./g, '');
        return cleanedString.replace(/\[Element:{[^}]+}\]/g, newValue);
    }

    private replaceParameterValue(source: string, newValue: string): string {
        const cleanedString = source.replace(/\[IsOwnerSchema:false\]\.\[IsSchema:false\]\./g, '');
        return cleanedString.replace(/\[Parameter:{[^}]+}\]/g, newValue);
    }

    private parseFormula(formula: string): string {
        const elementUid = this.extractElementValue(formula);
        const element = this.processSchema.Elements.find(e=>e.UId === elementUid);
        const parameterUid = this.extractParameterValue(formula);
        let parameter = this.processSchema.Parameters.find(p=>p.UId === parameterUid);

        if(element){
            const elementCaption = this.elementCaptions[element.Name];
            formula = this.replaceElementValue(formula, elementCaption);
            parameter = element.Parameters?.find(p=>p.UId === parameterUid);
        }
        if(parameter){
            let parameterCaption = parameter.Name;
            if(element){
                parameterCaption = Resource.getParameterCaption(this.resource, `${element.Name}`, parameter.Name);
            }
            formula = this.replaceParameterValue(formula, parameterCaption);
        }

        return formula;
    }

    public getFormulaDisplayValue(formula: string): string {
        return formula.replace(/\[#.*?#\]/g, (substr)=>{
            Logger.writeToChannel(substr);
            return this.parseFormula(substr);
        });
	}
}