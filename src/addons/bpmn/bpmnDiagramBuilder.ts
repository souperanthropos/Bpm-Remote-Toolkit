import { Element, ProcessSchemaWrapper } from "./processSchema";

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
        const element = this.moddle.create(type, { id: `id_${elementUid}`, ...additionalAttributes });
        this.elements[elementUid] = element;
        this.process.get('flowElements').push(element);
    }

    private createBpmnShape(processElement: Element) {
        const element = this.elements[processElement.UId];
        const bounds = this.moddle.create('dc:Bounds', {
            x: processElement.Location?.X,
            y: processElement.Location?.Y,
            width: processElement.Size?.Width,
            height: processElement.Size?.Height
        });
        const shape = this.moddle.create('bpmndi:BPMNShape', {
            id: `id_${processElement.UId}_di`,
            bpmnElement: element,
            bounds: bounds
        });
        this.diagram.plane.planeElement.push(shape);
    }

    private createBpmnEdge(processElement: Element) {
        const element = this.elements[processElement.UId];
        const waypoints = [];

        if (processElement.StartPoint && processElement.EndPoint) {
            // Добавляем начальную точку
            waypoints.push(this.moddle.create('dc:Point', {
                x: processElement.StartPoint.X,
                y: processElement.StartPoint.Y
            }));

            // Добавляем промежуточные точки, если они есть
            if (processElement.MidPoints) {
                Object.entries(processElement.MidPoints).forEach(([key, value]) => {
                    waypoints.push(this.moddle.create('dc:Point', {
                        x: value.X,
                        y: value.Y
                    }));
                });

            }

            // Добавляем конечную точку
            waypoints.push(this.moddle.create('dc:Point', {
                x: processElement.EndPoint.X,
                y: processElement.EndPoint.Y
            }));

        } else {
            let pointStart;
            let pointEnd;
            const sourceBounds = this.getElementBounds(processElement.SourceRef);
            const targetBounds = this.getElementBounds(processElement.TargetRef);

            if (sourceBounds.x > targetBounds.x) {
                pointStart = { x: sourceBounds.x + sourceBounds.width / 2, y: sourceBounds.y };
                pointEnd = { x: targetBounds.x + targetBounds.width, y: targetBounds.y + targetBounds.height / 2 };
            } else {
                pointStart = { x: sourceBounds.x + sourceBounds.width, y: sourceBounds.y + sourceBounds.height / 2 };
                pointEnd = { x: targetBounds.x, y: targetBounds.y + targetBounds.height / 2 };
            }

            waypoints.push(this.moddle.create('dc:Point', pointStart));

            if (processElement.MidPoints) {
                Object.entries(processElement.MidPoints).forEach(([key, value]) => {
                    waypoints.push(this.moddle.create('dc:Point', {
                        x: value.X,
                        y: value.Y
                    }));
                });
            }

            waypoints.push(this.moddle.create('dc:Point', pointEnd));
        }


        const edge = this.moddle.create('bpmndi:BPMNEdge', {
            id: `id_${processElement.UId}_di`,
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

    public addElements(elements: Element[]): void {
        elements.forEach(element => {
            let additionalAttributes: Record<string, any> = {
                customProperty: `${element.Name}`
            };
            let elementCaption = ProcessSchemaWrapper.getElementCaption(element.Name);

            switch (element.Namespace) {
                case 'Terrasoft.Core.Process.ProcessSchemaStartEvent':
                case 'Terrasoft.Core.Process.ProcessSchemaStartSignalEvent':
                    if (elementCaption) {
                        additionalAttributes.name = elementCaption.length > 16 ? elementCaption.substring(0, 16) + '...' : elementCaption;
                    }
                    if (element.Namespace === 'Terrasoft.Core.Process.ProcessSchemaStartSignalEvent') {
                        additionalAttributes.eventDefinitions = [
                            this.moddle.create('bpmn:SignalEventDefinition', {
                                id: `id_${element.UId}_SignalEventDefinition`,
                                signalRef: `id_${element.UId}_Signal`
                            })
                        ];
                    }
                    this.createBpmnElement('bpmn:StartEvent', element.UId, additionalAttributes);
                    this.createBpmnShape(element);
                    break;
                case 'Terrasoft.Core.Process.ProcessSchemaTerminateEvent':
                    this.createBpmnElement('bpmn:EndEvent', element.UId, additionalAttributes);
                    this.createBpmnShape(element);
                    break;
                case 'Terrasoft.Core.Process.ProcessSchemaIntermediateCatchTimerEvent':
                    additionalAttributes.eventDefinitions = [
                        this.moddle.create('bpmn:TimerEventDefinition', {
                            id: `id_${element.UId}_SignalEventDefinition`,
                            timeDuration: this.moddle.create('bpmn:FormalExpression', { body: '' })
                        })
                    ];
                    this.createBpmnElement('bpmn:IntermediateCatchEvent', element.UId, additionalAttributes);
                    this.createBpmnShape(element);
                    break;
                case 'Terrasoft.Core.Process.ProcessSchemaExclusiveGateway':
                    this.createBpmnElement('bpmn:ExclusiveGateway', element.UId, additionalAttributes);
                    this.createBpmnShape(element);
                    break;
                case 'Terrasoft.Core.Process.ProcessSchemaParallelGateway':
                    this.createBpmnElement('bpmn:ParallelGateway', element.UId, additionalAttributes);
                    this.createBpmnShape(element);
                    break;
                case 'Terrasoft.Core.Process.ProcessSchemaScriptTask':
                    additionalAttributes.scriptFormat = 'C#';
                    if (elementCaption) {
                        additionalAttributes.name = elementCaption.length > 16 ? elementCaption.substring(0, 16) + '...' : elementCaption;
                    }
                    this.createBpmnElement('bpmn:ScriptTask', element.UId, additionalAttributes);
                    this.createBpmnShape(element);
                    break;
                case 'Terrasoft.Core.Process.ProcessSchemaUserTask':
                case 'Terrasoft.Core.Process.ProcessSchemaFormulaTask':
                    if (elementCaption) {
                        additionalAttributes.name = elementCaption.length > 16 ? elementCaption.substring(0, 16) + '...' : elementCaption;
                    }
                    this.createBpmnElement('bpmn:Task', element.UId, additionalAttributes);
                    this.createBpmnShape(element);
                    break;
                case 'Terrasoft.Core.Process.ProcessSchemaSubProcess':
                    additionalAttributes.triggeredByEvent = false;
                    if (elementCaption) {
                        additionalAttributes.name = elementCaption.length > 16 ? elementCaption.substring(0, 16) + '...' : elementCaption;
                    }
                    this.createBpmnElement('bpmn:SubProcess', element.UId, additionalAttributes);
                    this.createBpmnShape(element);
                    break;
                case 'Terrasoft.Core.Process.ProcessSchemaConditionalFlow':
                case 'Terrasoft.Core.Process.ProcessSchemaSequenceFlow':
                    if (elementCaption) {
                        additionalAttributes.name = elementCaption;
                    }
                    additionalAttributes.sourceRef = this.elements[element.SourceRef];
                    additionalAttributes.targetRef = this.elements[element.TargetRef];
                    if (element.Namespace === 'Terrasoft.Core.Process.ProcessSchemaConditionalFlow') {
                        additionalAttributes.conditionExpression = this.moddle.create('bpmn:FormalExpression', {
                            body: ''
                        });
                    }
                    this.createBpmnElement('bpmn:SequenceFlow', element.UId, additionalAttributes);
                    this.createBpmnEdge(element);
                    break;
            }
        });
    }

    public getDiagram(): any {
        return this.diagram;
    }
}