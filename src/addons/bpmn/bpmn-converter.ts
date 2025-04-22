import { Logger } from "../../common/logger";

interface ProcessSchemaElement {
	BL1: string;
	BL3: string;
	BN2: string;
	UId: string;
	CI1?: string;
	CI2?: string;
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
    private elements: Record<string, any> = {};

    public async convertToBpmn(metaData: MetaData): Promise<string> {
        var BpmnModdle = require('bpmn-moddle');
        var moddle = new BpmnModdle();
    
        // Создаем определения BPMN
        const definitions = moddle.create('bpmn:Definitions', {
            id: metaData.Schema.UId,
            targetNamespace: 'http://bpmn.io/schema/bpmn'
        });
    
        // Создаем процесс
        const process = moddle.create('bpmn:Process', {
            id: metaData.Schema.A2,
            isExecutable: true
        });
        definitions.get('rootElements').push(process);
    
    
        // Создаем диаграмму BPMN
        const diagram = moddle.create('bpmndi:BPMNDiagram', {
            id: `${metaData.Schema.UId}_Diagram`,
            plane: moddle.create('bpmndi:BPMNPlane', {
                id: `${metaData.Schema.UId}_Plane`,
                bpmnElement: process,
                planeElement: []
            })
        });
        definitions.get('rootElements').push(diagram);
    
        // Создаем элементы процесса (события, потоки)
        const elements: Record<string, any> = {};
        metaData.Schema.BK4?.forEach(elementData => {
            let element;
            let shape;
            let bounds;
    
            switch (elementData.BL1) {
                case 'Terrasoft.Core.Process.ProcessSchemaStartEvent':
                    element = moddle.create('bpmn:StartEvent', { id: `_${elementData.UId}` });
                    elements[elementData.UId] = element;
                    process.get('flowElements').push(element);
                    const xy = elementData.BL3.split(';');
                    const wh = elementData.BN2.split(';');
                    bounds = moddle.create('dc:Bounds', {
                        x: xy[0],
                        y: xy[1],
                        width: wh[0],
                        height: wh[1]
                    });
                    shape = moddle.create('bpmndi:BPMNShape', {
                        id: `_${elementData.UId}_di`,
                        bpmnElement: element,
                        bounds: bounds
                    });
                    diagram.plane.planeElement.push(shape);
                    break;
                case 'Terrasoft.Core.Process.ProcessSchemaTerminateEvent':
                    element = moddle.create('bpmn:EndEvent', { id: `_${elementData.UId}` });
                    elements[elementData.UId] = element;
                    process.get('flowElements').push(element);
                    const xy1 = elementData.BL3.split(';');
                    const wh1 = elementData.BN2.split(';');
                    bounds = moddle.create('dc:Bounds', {
                        x: xy1[0],
                        y: xy1[1],
                        width: wh1[0],
                        height: wh1[1]
                    });
                    shape = moddle.create('bpmndi:BPMNShape', {
                        id: `_${elementData.UId}_di`,
                        bpmnElement: element,
                        bounds: bounds
                    });
                    diagram.plane.planeElement.push(shape);
                    break;
                case 'Terrasoft.Core.Process.ProcessSchemaSequenceFlow':
                    if(elementData.CI1 && elementData.CI2){
                        element = moddle.create('bpmn:SequenceFlow', {
                            id: `_${elementData.UId}`,
                            sourceRef: elements[elementData.CI1],
                            targetRef: elements[elementData.CI2]
                        });
                        process.get('flowElements').push(element);
                        const waypoint1 = moddle.create('dc:Point', { x: 77, y: 197 });
                        const waypoint2 = moddle.create('dc:Point', { x: 600, y: 197 });
                        shape = moddle.create('bpmndi:BPMNEdge', {
                            id: `_${elementData.UId}_di`,
                            bpmnElement: element,
                            waypoint: [waypoint1, waypoint2]
                        });
                        diagram.plane.planeElement.push(shape);
                    }
                    break;
            }
        });
    
        // Генерация XML
        const { xml } = await moddle.toXML(definitions);
        Logger.writeToChannel(xml);
        return xml;
    }
}