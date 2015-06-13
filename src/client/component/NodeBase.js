var AppComponent = require('./AppBase');

class BaseNodeComponent extends AppComponent {
    constructor(props, context) {
        super(props, context);
        this.nodeStateDefaults = {};
    }

    getNodeState() {
        let running = this.isMachineCreated();
        let state = {
            running: running,
            editable: !running
        };
        if (running) {
            state.state = this.getNodeInstance().state;
        } else {
            state.state = this.nodeStateDefaults;
        }
        return state;
    }

    getNodeInstance() {
        return this.app.manager.getMachine().getNodeInstance(this.props.position);
    }

    getNodeDescriptor() {
        return this.props.desc;
    }

    isMachineCreated() {
        return this.app.manager.isMachineCreated();
    }
}

export default BaseNodeComponent;
