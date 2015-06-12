var _ = require('lodash');
var BaseNode = require('./BaseNode');

class StackMemoryNode extends BaseNode {
    constructor(source) {
        super(source);
    }
}
StackMemoryNode.nodeType = "stackMemory";
StackMemoryNode.displayName = "Stack Memory Node";

export default StackMemoryNode;
