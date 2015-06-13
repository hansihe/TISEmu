var _ = require('lodash');
var BaseNode = require('./BaseNode');

var { nodeSidePairs } = require('./sideUtils');

class StackMemoryNode extends BaseNode {
    constructor(machine, source) {
        super(machine, source);

        this.state.stack = [];
    }

    readFrom(side) {
        return this.state.stack.pop();
    }

    pass() {
        _.each(nodeSidePairs, ([side]) => {
            let value = this.softRead(side);
            if (value !== undefined) {
                this.state.stack.push(value);
            }
        });
        return false;
    }
}
StackMemoryNode.nodeType = "stackMemory";
StackMemoryNode.displayName = "Stack Memory Node";

export default StackMemoryNode;
