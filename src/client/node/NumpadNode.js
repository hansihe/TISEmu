var _ = require('lodash');
var BaseNode = require('./BaseNode');

var { nodeSidePairs } = require('../sideUtils');

class NumpadNode extends BaseNode {
    constructor(machine, source) {
        super(machine, source);

        this.state.key = undefined;
    }

    readFrom(side) {
        let value = this.state.key;
        this.state.key = undefined;
        return value;
    }

    pass() {
        return true;
    }
}
NumpadNode.nodeType = "numpad";
NumpadNode.displayName = "Numpad Input Node";

export default NumpadNode;
