var _ = require('lodash');
var BB = require('bluebird');

export let nodeTypes = {
    basicExecution: require('./BasicExecutionNode'),
    stackMemory: require('./StackMemoryNode'),
    beeper: require('./BeeperNode')
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
    }

    eachNode(func) {
        _.each(this.nodeMap, yNodes => {
            _.each(yNodes, node => {
                func(node, node.position);
            });
        });
    }

    stepPass(nodes, num) {
        console.log("PASS", num, ":", nodes.length);
        if (nodes.length === 0) {
            return;
        }

        let responses = _.map(nodes, node => node.doStepPass());
        let nextRoundNodes = _.unzip(_.filter(_.zip(responses, nodes), ([response]) => !response))[1];

        if (nextRoundNodes && nextRoundNodes.length !== nodes.length) {
            return this.stepPass(nextRoundNodes, num + 1);
        } else {
            return nextRoundNodes;
        }
    }

    step() {
        let nodes = [];
        this.eachNode(node => nodes.push(node));

        // Iterate until all conflicts are resolved
        let res = this.stepPass(nodes, 0);
        this.stepPass(res, 0); // TODO: This is a really shitty way to do it, but it does make sure all interactions are done.

        this.eachNode(node => node.doStepEnd());
    }

    getNodeInstance([xPos, yPos]) {
        let yCol = this.nodeMap[xPos];
        if (yCol) {
            return yCol[yPos];
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
            if (!this.nodeMap[xPos]) {
                this.nodeMap[xPos] = {};
            }

            this.nodeMap[xPos][yPos] = nodeDescriptor;
        });
    }

    toSource() {
        // TODO
    }

    addNode(position, type, code="") {
        if (this.isMachineCreated()) {
            throw "Cannot modify machine while running";
        }
        if (!this.nodeMap[position[0]]) {
            this.nodeMap[position[0]] = {};
        }
        this.nodeMap[position[0]][position[1]] = {
            position: position,
            code: code,
            type: type
        };
    }
    delNode(position) {
        if (this.nodeMap[position[0]]) {
            this.nodeMap[position[0]][position[1]] = undefined;
        }
    }

    getNodeDescriptor([xPos, yPos]) {
        let yCol = this.nodeMap[xPos];
        if (yCol) {
            return yCol[yPos];
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
