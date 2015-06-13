var _ = require('lodash');
var BaseNode = require('./BaseNode');

var { nodeSidePairs } = require('./sideUtils');

class VisualNode extends BaseNode {
    constructor(machine, source) {
        super(machine, source);
        this.state.sequence = [];
        this.state.image = _.map(_.range(0, this.source.size[1] + 1), () => _.map(_.range(0, this.source.size[0] + 1), () => 0));
    }

    draw() {
        let [xPos, yPos, ...colors] = this.state.sequence;
        _.each(colors, (color, num) => {
            if (color < 0 || color > 4) return;
            if (this.state.image[yPos] === undefined 
             || this.state.image[yPos][xPos + num] === undefined) return;
            this.state.image[yPos][xPos + num] = color;
        });

        this.state.sequence = [];
    }

    pass() {
        _.each(nodeSidePairs, ([side]) => {
            let value = this.softRead(side);
            if (value === undefined) return;

            if (value < 0) {
                this.draw();
            } else {
                this.state.sequence.push(value);
            }
        });
        return false;
    }
}
VisualNode.nodeType = "visual";
VisualNode.displayName = "Visualization Node";
VisualNode.getBaseDescriptor = function() {
    return {
        size: [36, 22]
    };
};

export default VisualNode;
