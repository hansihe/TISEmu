var _ = require('lodash');
var BB = require('bluebird');

export let nodeTypes = {
    basicExecution: require('./node/BasicExecutionNode'),
    stackMemory: require('./node/StackMemoryNode'),
    visual: require('./node/VisualNode'),
    numpad: require('./node/NumpadNode'),
    input: require('./node/InputNode'),
    //output: require('./node/OutputNode'),
    beeper: require('./node/BeeperNode')
};

let sides = require('./sideUtils').nodeSidePairs;

var { opositeSide, sumPositions } = require('./sideUtils');

class TISMachine {
    constructor(nodeDescMap) {
        this.nodeDescMap = nodeDescMap;

        this.nodeMap = _.mapValues(this.nodeDescMap, col => {
            return _.mapValues(col, nodeDesc => {
                let nodeClass = nodeTypes[nodeDesc.type];
                return new nodeClass(this, nodeDesc);
            });
        });

        // Sort the nodeMap both in the x and y axis. Flatten two dimensional array into a single list.
        // This is the order iteration should happen in.
        this.sortedNodes = _.flatten(
                // Axis 1
                _.map(_.sortBy(_.pairs(
                            _.mapValues(this.nodeMap, val => {
                                // Axis 2
                                return _.map(_.sortBy(_.pairs(val), col => col[0]), col => col[1]);
                            })
                            ), row => row[0]), row => row[1])
                );

        this.state = {
            cycle: 0,
            breakpoint: false
        };

        console.log(this);
    }

    eachNode(func) {
        _.each(this.sortedNodes, node => {
            func(node, node.position);
        });
    }

    step() {
        this.state.breakpoint = false;

        // After two passes all conflicts should be resolved.
        this.eachNode(node => node.performStepPass());
        this.eachNode(node => node.performStepPass());

        this.eachNode(node => node.doStepEnd());

        this.state.cycle += 1;
    }

    onBreakpoint() {
        this.state.breakpoint = true;
    }

    getNodeInstance([xPos, yPos]) {
        let xCol = this.nodeMap[yPos];
        if (xCol) {
            return xCol[xPos];
        }
    }

    getStateOverview() {
        return _.map(this.machine.nodes, yNodes => {
            return _.map(yNodes, node => {
                return node.state;
            })
        })
    }
}

class TISMachineManager {
    constructor() {
        this.nodeMap = null;

        this.isCreated = false;
        this.machine = null;
    }

    fromSource(source) {
        this.destroy();

        let { nodes } = source;

        this.nodeMap = {};
        _.each(nodes, nodeDescriptor => {
            let [xPos, yPos] = nodeDescriptor.position;
            if (!this.nodeMap[yPos]) {
                this.nodeMap[yPos] = {};
            }

            let nodeClass = nodeTypes[nodeDescriptor.type];
            if (nodeClass.getTempDescriptor) {
                nodeDescriptor.temp = nodeClass.getTempDescriptor();
            } else {
                nodeDescriptor.temp = {};
            }

            this.nodeMap[yPos][xPos] = nodeDescriptor;
        });
    }

    toSource() {
        let nodes = [];
        _.each(this.nodeMap, (col, xPos) => {
            _.each(col, (node, yPos) => {
                nodes.push(node);
            });
        });

        let filteredNodes = _.map(nodes, node => {
            delete node['temp'];
            return node;
        });

        return {
            nodes: filteredNodes
        };
    }

    addNode(position, type) {
        if (this.isMachineCreated()) {
            throw "Cannot modify machine while running";
        }
        let nodeClass = nodeTypes[type];

        if (!this.nodeMap[position[1]]) {
            this.nodeMap[position[1]] = {};
        }

        let descriptor = {
            position: position,
            type: type
        };
        if (nodeClass.getBaseDescriptor) {
            _.assign(descriptor, nodeClass.getBaseDescriptor());
        }
        if (nodeClass.getTempDescriptor) {
            descriptor.temp = nodeClass.getTempDescriptor();
        } else {
            descriptor.temp = {};
        }

        console.log(descriptor);
        this.nodeMap[position[1]][position[0]] = descriptor;
    }
    delNode(position) {
        if (this.nodeMap[position[1]]) {
            delete this.nodeMap[position[1]][position[0]];
            if (_.size(this.nodeMap[position[1]]) === 0) {
                delete this.nodeMap[position[1]];
            }
        }
    }

    getNodeDescriptor([xPos, yPos]) {
        let xCol = this.nodeMap[yPos];
        if (xCol) {
            return xCol[xPos];
        }
    }

    create() {
        this.machine = new TISMachine(this.nodeMap);
        this.isCreated = true;
    }
    destroy() {
        this.machine = null;
        this.isCreated = false;
    }

    getMachine() {
        if (!this.isCreated) {
            throw "Machine is not created";
        }
        return this.machine;
    }
    isMachineCreated() {
        return this.isCreated;
    }
}

export default TISMachineManager;
