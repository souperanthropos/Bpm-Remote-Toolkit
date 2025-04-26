import { ProcessSchemaElement } from "./bpmn-converter";
import { Resource } from "./bpmn-viewer";

interface BPMNShape {
    id: string;
    bounds: { x: number; y: number; width: number; height: number };
}

function getValue(obj: Resource, path: string[]): Resource | string | undefined {
    return path.reduce((acc: Resource | undefined, key) => {
        if (typeof acc === "object" && acc !== null && key in acc) {
            return acc[key] as Resource;
        }
        return undefined;
    }, obj as Resource) as Resource | string | undefined;
}

export class BpmnDiagramBuilder {
    private moddle: any;
    private process: any;
    private diagram: any;
    private elementCaptions: Record<string, string>;
    private elements: Record<string, any> = {};

    constructor(moddle: any, process: any, elementCaptions: Record<string, string>) {
        this.moddle = moddle;
        this.process = process;
        this.elementCaptions = elementCaptions;
        this.diagram = this.moddle.create('bpmndi:BPMNDiagram', {
            id: `${process.id}_Diagram`,
            plane: this.moddle.create('bpmndi:BPMNPlane', {
                id: `${process.id}_Plane`,
                bpmnElement: process,
                planeElement: []
            })
        });
    }

    private createBpmnElement(type: string, elementUid: string, additionalAttributes: Record<string, any> = {}) {
        const element = this.moddle.create(type, { id: `id_${elementUid}`, ...additionalAttributes });
        this.elements[elementUid] = element;
        this.process.get('flowElements').push(element);
    }

    private createBpmnShape(elementData: ProcessSchemaElement) {
        const element = this.elements[elementData.UId];
        const coordinate = elementData.BL3.split(';');
        const size = elementData.BN2.split(';');
        const bounds = this.moddle.create('dc:Bounds', {
            x: parseFloat(coordinate[0]),
            y: parseFloat(coordinate[1]),
            width: parseFloat(size[0]),
            height: parseFloat(size[1])
        });
        const shape = this.moddle.create('bpmndi:BPMNShape', {
            id: `id_${elementData.UId}_di`,
            bpmnElement: element,
            bounds: bounds/*,
            label: this.moddle.create('bpmndi:BPMNLabel', {
                bounds: this.moddle.create('dc:Bounds', { x: 110, y: 140, width: 80, height: 20 })
            })*/
        });
        this.diagram.plane.planeElement.push(shape);
    }

    private createBpmnEdge(elementData: ProcessSchemaElement) {
        const element = this.elements[elementData.UId];
        const waypoints = [];

        if (elementData.CI11 && elementData.CI12) {
            // Добавляем начальную точку
            waypoints.push(this.moddle.create('dc:Point', {
                x: parseFloat(elementData.CI11.split(';')[0]),
                y: parseFloat(elementData.CI11.split(';')[1])
            }));

            // Добавляем промежуточные точки, если они есть
            if (elementData.CI10) {
                Object.values(elementData.CI10).forEach(point => {
                    if (typeof point === 'string') {
                        const coords = point.split(';');
                        waypoints.push(this.moddle.create('dc:Point', {
                            x: parseFloat(coords[0]),
                            y: parseFloat(coords[1])
                        }));
                    }
                });
            }

            // Добавляем конечную точку
            waypoints.push(this.moddle.create('dc:Point', {
                x: parseFloat(elementData.CI12.split(';')[0]),
                y: parseFloat(elementData.CI12.split(';')[1])
            }));

        } else {
            let pointStart;
            let pointEnd;
            const sourceBounds = this.getElementBounds(elementData.CI1);
            const targetBounds = this.getElementBounds(elementData.CI2);

            if (sourceBounds.x > targetBounds.x) {
                pointStart = { x: sourceBounds.x + sourceBounds.width / 2, y: sourceBounds.y };
                pointEnd = { x: targetBounds.x + targetBounds.width, y: targetBounds.y + targetBounds.height / 2 };
            } else {
                pointStart = { x: sourceBounds.x + sourceBounds.width, y: sourceBounds.y + sourceBounds.height / 2 };
                pointEnd = { x: targetBounds.x, y: targetBounds.y + targetBounds.height / 2 };
            }

            waypoints.push(this.moddle.create('dc:Point', pointStart));

            if (elementData.CI10) {
                Object.values(elementData.CI10).forEach(point => {
                    if (typeof point === 'string') {
                        const coords = point.split(';');
                        waypoints.push(this.moddle.create('dc:Point', {
                            x: parseFloat(coords[0]),
                            y: parseFloat(coords[1])
                        }));
                    }
                });
            }

            waypoints.push(this.moddle.create('dc:Point', pointEnd));
        }


        const edge = this.moddle.create('bpmndi:BPMNEdge', {
            id: `id_${elementData.UId}_di`,
            bpmnElement: element,
            waypoint: waypoints
        });

        this.diagram.plane.planeElement.push(edge);
    }

    private getElementBounds(elementDataId: string): BPMNShape["bounds"] {
        const elementId = `id_${elementDataId}_di`;
        const shape = this.diagram.plane.planeElement.find((el: BPMNShape) => el.id === elementId);
        return shape.bounds;
    }

    public addElement(elementData: ProcessSchemaElement): void {
        
        let additionalAttributes: Record<string, any> = {};

        switch (elementData.BL1) {
            case 'Terrasoft.Core.Process.ProcessSchemaStartEvent':
            case 'Terrasoft.Core.Process.ProcessSchemaStartSignalEvent':
                if (elementData.BL1 === 'Terrasoft.Core.Process.ProcessSchemaStartSignalEvent') {
                    additionalAttributes = {
                        eventDefinitions: [
                            this.moddle.create('bpmn:SignalEventDefinition', {
                                id: `id_${elementData.UId}_SignalEventDefinition`,
                                signalRef: `id_${elementData.UId}_Signal`
                            })
                        ]
                    };
                }
                this.createBpmnElement('bpmn:StartEvent', elementData.UId, additionalAttributes);
                this.createBpmnShape(elementData);
                break;
            case 'Terrasoft.Core.Process.ProcessSchemaTerminateEvent':
                this.createBpmnElement('bpmn:EndEvent', elementData.UId);
                this.createBpmnShape(elementData);
                break;
            case 'Terrasoft.Core.Process.ProcessSchemaIntermediateCatchTimerEvent':
                additionalAttributes = {
                    eventDefinitions: [
                        this.moddle.create('bpmn:TimerEventDefinition', {
                            id: `id_${elementData.UId}_SignalEventDefinition`,
                            timeDuration: this.moddle.create('bpmn:FormalExpression', { body: 'PT5M' }) // Таймер на 5 минут
                        })
                    ]
                };
                this.createBpmnElement('bpmn:IntermediateCatchEvent', elementData.UId, additionalAttributes);
                this.createBpmnShape(elementData);
                break;
            case 'Terrasoft.Core.Process.ProcessSchemaExclusiveGateway':
                this.createBpmnElement('bpmn:ExclusiveGateway', elementData.UId);
                this.createBpmnShape(elementData);
                break;
            case 'Terrasoft.Core.Process.ProcessSchemaParallelGateway':
                this.createBpmnElement('bpmn:ParallelGateway', elementData.UId);
                this.createBpmnShape(elementData);
                break;
            case 'Terrasoft.Core.Process.ProcessSchemaScriptTask':
                additionalAttributes = {
                    scriptFormat: 'C#',
                    script: elementData.CH1
                };
                this.createBpmnElement('bpmn:ScriptTask', elementData.UId, additionalAttributes);
                this.createBpmnShape(elementData);
                break;
            case 'Terrasoft.Core.Process.ProcessSchemaUserTask':
                let elementCaption = this.elementCaptions[elementData.A2];
                if(elementCaption){
                    if(elementCaption.length > 16){
                        elementCaption = elementCaption.substring(0, 16) + '...';
                    }
                    additionalAttributes = {
                        name: elementCaption
                    };
                }else{
                    additionalAttributes = {
                        name: elementData.A2
                    };
                }
                this.createBpmnElement('bpmn:Task', elementData.UId, additionalAttributes);
                this.createBpmnShape(elementData);
                break;
            case 'Terrasoft.Core.Process.ProcessSchemaSubProcess':
                additionalAttributes = {
                    triggeredByEvent: false
                };
                this.createBpmnElement('bpmn:SubProcess', elementData.UId, additionalAttributes);
                this.createBpmnShape(elementData);
                break;
            case 'Terrasoft.Core.Process.ProcessSchemaConditionalFlow':
            case 'Terrasoft.Core.Process.ProcessSchemaSequenceFlow':
                additionalAttributes = {
                    sourceRef: this.elements[elementData.CI1],
                    targetRef: this.elements[elementData.CI2]
                };
                if (elementData.BL1 === 'Terrasoft.Core.Process.ProcessSchemaConditionalFlow') {
                    additionalAttributes.conditionExpression = this.moddle.create('bpmn:FormalExpression', {
                        body: 'someVariable > 10'
                    });
                }
                this.createBpmnElement('bpmn:SequenceFlow', elementData.UId, additionalAttributes);
                this.createBpmnEdge(elementData);
                break;
        }
    }

    public getDiagram(): any {
        return this.diagram;
    }
}