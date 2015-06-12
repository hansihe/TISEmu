var React = require('react');
var BaseNodeComponent = require('./NodeBase');

class BeeperNodeComponent extends BaseNodeComponent {
    render() {
        return <div className="nodeFrame beeperNode">
            BEEPER NODE
        </div>;
    }
}

export default BeeperNodeComponent;
