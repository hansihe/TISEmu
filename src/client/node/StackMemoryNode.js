var _ = require('lodash');
var BaseNode = require('./BaseNode');

var { nodeSidePairs } = require('../sideUtils');

class StackMemoryNode extends BaseNode {
    constructor(machine, source) {
        super(machine, source);

        this.state.stack = [];
        this.state.readStack = [];
    }

    readFrom(side) {
        return this.state.stack.pop();
    }

    pass() {
        _.each(nodeSidePairs, ([side]) => {
            let value = this.softRead(side);
            if (value !== undefined) {
                this.state.readStack.push(value);
            }
        });
        return false;
    }

    stepEnd() {
        this.state.stack = this.state.stack.concat(this.state.readStack);
        this.state.readStack = [];
    }
}
StackMemoryNode.nodeType = "stackMemory";
StackMemoryNode.displayName = "Stack Memory Node";

export default StackMemoryNode;
