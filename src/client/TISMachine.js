var _ = require('lodash');
var BB = require('bluebird');

export let nodeTypes = {
    basicExecution: require('./BasicExecutionNode'),
    stackMemory: require('./StackMemoryNode')
};

// The order of these are actually important. They decide the order in which the ANY opcode with read/write.
let sides = [
    ['l', [-1, 0]], // Left
    ['r', [1, 0]], // Right
    ['u', [0, -1]], // Up
    ['d', [0, 1]] // Down
];

function sumPositions(pos1, pos2) {
    return _.zipWith(pos1, pos2, _.add);
}

function opositeSide(sideName) {
    switch (sideName) {
        case 'l': return 'r';
        case 'r': return 'l';
        case 'u': return 'd';
        case 'd': return 'u';
    }
}

class TISMachine {
    constructor(nodeDescMap) {
        this.nodeDescMap = nodeDescMap;

        this.nodeMap = _.mapValues(this.nodeDescMap, col => {
            return _.mapValues(col, nodeDesc => {
                let nodeClass = nodeTypes[nodeDesc.type];
                return new nodeClass(nodeDesc);
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

    async stepRound(nodes) {
        let responsePromises = _.map(nodes, node => node.prepPass());
        _.each(nodes, node => node.readPass());
        _.each(nodes, node => node.writePass());
        let responses = await BB.all(responsePromises);

        let nextRoundNodes = _.unzip(_.filter(_.zip(responses, nodes), ([response]) => !response))[1];

        if (nextRoundNodes && nextRoundNodes.length !== nodes.length) {
            this.stepRound(nextRoundNodes);
        }
    }

    async step() {
        let nodes = [];
        this.eachNode(node => nodes.push(node));

        // Iterate until all conflicts are resolved
        await this.stepRound(nodes);

        // Move writes
        this.eachNode((node, position) => {
            _.each(sides, ([sideName, sidePos]) => {
                let sideNode = this.getNodeInstance(sumPositions(position, sidePos));
                if (sideNode) {
                    let readSide = opositeSide(sideName);
                    node.in[sideName] = sideNode.out[readSide];
                }
            });
        });
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
