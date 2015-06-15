var _ = require('lodash');
var BaseNode = require('./BaseNode');

class InputNode extends BaseNode {
    constructor(machine, source) {
        super(machine, source);

        this.state.values = source.values;
        this.state.currentValue = 0;
    }

    pass() {
        if (this.state.currentValue > this.state.values.length) return true;

        this.waitWrite();
        this.write('a', this.state.values[this.state.currentValue]);
        this.state.currentValue += 1;
        return true;
    }
}
InputNode.nodeType = "input";
InputNode.displayName = "Input Node";
InputNode.getBaseDescriptor = function() {
    return {
        values: []
    };
};

export default InputNode;
