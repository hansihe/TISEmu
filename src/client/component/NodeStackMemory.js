var React = require('react');
var BaseNodeComponent = require('./NodeBase');

class StackMemoryNodeComponent extends BaseNodeComponent {
    constructor(props, context) {
        super(props, context);
        this.nodeStateDefaults = {
            stack: []
        };
    }

    render() {
        let state = this.getNodeState();
        let stackItems = _.map(state.state.stack, item => {
            return <div>{item}</div>;
        });
        return <div className="nodeFrame stackMemoryNode">
            <div className="leftPanel">
                STACK MEMORY NODE
            </div>
            <div className="rightPanel">
                {stackItems}
            </div>
        </div>;
    }
}

export default StackMemoryNodeComponent;
