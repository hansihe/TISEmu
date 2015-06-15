var _ = require('lodash');
var BaseNode = require('./BaseNode');

class OutputNode extends BaseNode {
    constructor(machine, source) {
        super(machine, source);

        this.state.values = source.values;
        this.state.outValues = [];
    }

    pass() {
        let value = this.read('a');
        if (value !== undefined) {
            this.state.outValues.push(value);
            return true;
        }
        return false;
    }
}
OutputNode.nodeType = "output";
OutputNode.displayName = "Output Node";
OutputNode.getBaseDescriptor = function() {
    return {
        values: []
    };
};

export default OutputNode;
