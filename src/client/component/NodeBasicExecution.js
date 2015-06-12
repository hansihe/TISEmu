var React = require('react');
var BaseNodeComponent = require('./NodeBase');
var SourceEditorComponent = require('./SourceEditor');

class BasicExecutionNodeComponent extends BaseNodeComponent {
    constructor(props, context) {
        super(props, context);
        this.nodeStateDefaults = {
            pc: -1,
            acc: 0,
            bak: 0,
            lastPort: -1,
            mode: "IDLE"
        };
    }

    render() {
        let manager = this.app.manager;
        let nodeDesc = manager.getNodeDescriptor(this.props.position);

        let state = this.getNodeState();
        let lastPort = (state.state.lastPort === -1) ? "N/A" : state.state.lastPort;

        return <div className="nodeFrame basicExecNode">
            <div className="leftPanel">
                <SourceEditorComponent source={nodeDesc} state={state} pc={state.state.pc}/>
            </div>
            <div className="rightPanel">
                <div className="fragment">ACC<br/>{state.state.acc}</div>
                <div className="fragment">BAK<br/>{state.state.bak}</div>
                <div className="fragment">LAST<br/>{lastPort}</div>
                <div className="fragment">MODE<br/>{state.state.mode}</div>
            </div>
        </div>;
    }
}

export default BasicExecutionNodeComponent;
