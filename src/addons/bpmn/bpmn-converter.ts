import { Logger } from "../../common/logger";
import { BpmnDiagramBuilder } from "./bpmnDiagramBuilder";
import { ProcessSchemaWrapper } from "./processSchema";

export class BpmnConverter {

    public static async convertToBpmn(processSchemaWrapper: ProcessSchemaWrapper): Promise<string> {
        var BpmnModdle = require('bpmn-moddle');
        var moddle = new BpmnModdle();

        const processSchema = processSchemaWrapper.processSchema;
    
        // Создаем процесс
        const process = moddle.create('bpmn:Process', {
            id: processSchema.Name,
            isExecutable: true
        });
    
        // Создаем билдера диаграмм
        const diagramBuilder = new BpmnDiagramBuilder(processSchemaWrapper, moddle, process);
    
        // Добавляем элементы в диаграмму
        diagramBuilder.addElements(processSchema.Elements);
    
        // Создаем корневой элемент BPMN
        const definitions = moddle.create('bpmn:Definitions', {
            id: `id_${processSchema.UId}`,
            targetNamespace: 'http://bpmn.io/schema/bpmn',
            rootElements: [process, diagramBuilder.getDiagram()]
        });
    
        // Генерируем XML
        const { xml } = await moddle.toXML(definitions);
        Logger.writeToChannel(xml);
        return xml;
    }
}