import { Logger } from "../../common/logger";
import { Resource } from "./bpmn-viewer";
import { BpmnDiagramBuilder } from "./bpmnDiagramBuilder";

export interface ProcessSchemaElement {
    A2: string;
	BL1: string;
	BL3: string;
	BN2: string;
	UId: string;
    CH1: string;
	CI1: string;
	CI2: string;
    CI10: {}
    CI11?: string;
    CI12?: string;
}

interface ProcessSchema {
	UId: string;
	A2: string;
	BK3?: Array<{ UId: string; BM4?: Array<{ UId: string }> }>;
	BK4?: ProcessSchemaElement[];
}

interface MetaData {
	Schema: ProcessSchema;
}

export class BpmnConverter {

    public static async convertToBpmn(metaData: MetaData, elementCaptions: Record<string, string>): Promise<string> {
        var BpmnModdle = require('bpmn-moddle');
        var moddle = new BpmnModdle();
    
        // Создаем процесс
        const process = moddle.create('bpmn:Process', {
            id: metaData.Schema.A2,
            isExecutable: true
        });
    
        // Создаем билдера диаграмм
        const diagramBuilder = new BpmnDiagramBuilder(moddle, process, elementCaptions);
    
        // Добавляем элементы в диаграмму
        metaData.Schema.BK4?.forEach(elementData => {
            diagramBuilder.addElement(elementData);
        });
    
        // Создаем корневой элемент BPMN
        const definitions = moddle.create('bpmn:Definitions', {
            id: `id_${metaData.Schema.UId}`,
            targetNamespace: 'http://bpmn.io/schema/bpmn',
            rootElements: [process, diagramBuilder.getDiagram()]
        });
    
        // Генерируем XML
        const { xml } = await moddle.toXML(definitions);
        Logger.writeToChannel(xml);
        return xml;
    }
}