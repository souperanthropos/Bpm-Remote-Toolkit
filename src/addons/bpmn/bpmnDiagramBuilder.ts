import { ProcessSchemaElement } from "./bpmn-converter";

interface BPMNShape {
    id: string;
    bounds: { x: number; y: number; width: number; height: number };
}

export class BpmnDiagramBuilder {
    private moddle: any;
    private process: any;
    private diagram: any;
    private elements: Record<string, any> = {};

    constructor(moddle: any, process: any) {
        this.moddle = moddle;
        this.process = process;
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
        const element = this.moddle.create(type, { id: `_${elementUid}`, ...additionalAttributes });
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
            id: `_${elementData.UId}_di`,
            bpmnElement: element,
            bounds: bounds
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
            id: `_${elementData.UId}_di`,
            bpmnElement: element,
            waypoint: waypoints
        });

        this.diagram.plane.planeElement.push(edge);
    }

    private getElementBounds(elementDataId: string): BPMNShape["bounds"] {
        const elementId = `_${elementDataId}_di`;
        const shape = this.diagram.plane.planeElement.find((el: BPMNShape) => el.id === elementId);
        return shape.bounds;
    }

    public addElement(elementData: ProcessSchemaElement): void {
        let element;
        let additionalAttributes: Record<string, any> = {};

        switch (elementData.BL1) {
            case 'Terrasoft.Core.Process.ProcessSchemaStartEvent':
            case 'Terrasoft.Core.Process.ProcessSchemaStartSignalEvent':
                if (elementData.BL1 === 'Terrasoft.Core.Process.ProcessSchemaStartSignalEvent') {
                    additionalAttributes = {
                        eventDefinitions: [
                            this.moddle.create('bpmn:SignalEventDefinition', {
                                id: `_${elementData.UId}_SignalEventDefinition`,
                                signalRef: `_${elementData.UId}_Signal`
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
                            id: `_${elementData.UId}_SignalEventDefinition`,
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
            case 'Terrasoft.Core.Process.ProcessSchemaScriptTask':
                additionalAttributes = {
                    scriptFormat: 'C#',
                    script: elementData.CH1
                };
                this.createBpmnElement('bpmn:ScriptTask', elementData.UId, additionalAttributes);
                this.createBpmnShape(elementData);
                break;
            case 'Terrasoft.Core.Process.ProcessSchemaUserTask':
                element = this.moddle.create('bpmn:Task', {
                    id: `_${elementData.UId}`,
                    name: elementData.A2
                });
                this.elements[elementData.UId] = element;
                this.process.get('flowElements').push(element);
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