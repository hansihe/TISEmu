var React = require('react');
var BaseNodeComponent = require('./NodeBase');
var SourceEditorComponent = require('./SourceEditor');

let lastPortNames = {
    null: "N/A",
    l: "LEFT",
    r: "RIGHT",
    u: "UP",
    d: "DOWN"
};

class BasicExecutionNodeComponent extends BaseNodeComponent {
    constructor(props, context) {
        super(props, context);
        this.nodeStateDefaults = {
            pc: null,
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
        let lastPort = lastPortNames[state.state.lastPort];

        return <div className="nodeFrame basicExecNode">
            <div className="leftPanel">
                <SourceEditorComponent 
                    editable={state.editable}
                    text={nodeDesc.code}
                    textChange={this.setCode.bind(this)}
                    highlightLine={state.state.pc}/>
            </div>
            <div className="rightPanel">
                <div className="fragment">ACC<br/>{state.state.acc}</div>
                <div className="fragment">BAK<br/>{state.state.bak}</div>
                <div className="fragment">LAST<br/>{lastPort}</div>
                <div className="fragment">MODE<br/>{state.state.mode}</div>
            </div>
        </div>;
    }

    setCode(source) {
        this.app.manager.getNodeDescriptor(this.props.position).code = source;
    }
}

export default BasicExecutionNodeComponent;
