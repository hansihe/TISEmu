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
            try {
                this.state.stack.push(this.read(side));
            } catch (e) {
                if (e !== this.WAIT_READ) {
                    throw e;
                }
            }
        });
        return false;
    }
}
StackMemoryNode.nodeType = "stackMemory";
StackMemoryNode.displayName = "Stack Memory Node";

export default StackMemoryNode;
