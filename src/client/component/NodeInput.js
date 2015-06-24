var _ = require('lodash');
var React = require('react');
var BaseNodeComponent = require('./NodeBase');
var SourceEditorComponent = require('./SourceEditor');

class InputNodeComponent extends BaseNodeComponent {
    constructor(props, context) {
        super(props, context);
        this.nodeStateDefaults = {
            currentValue: -1,
            sourceMap: []
        };
    }

    render() {
        let nodeDesc = this.getNodeDescriptor();
        let text = nodeDesc.values;
        let state = this.getNodeState();
            
        return <div className="nodeFrame inputNode">
            <div className="heading">
                Input Node
                <br/>
                (one number per line)
            </div>
            <SourceEditorComponent
                editable={true}
                text={text}
                textChange={this.textChange.bind(this)}
                highlightLine={state.state.sourceMap[state.state.currentValue]}/>
        </div>;
    }

    textChange(text) {
        this.getNodeDescriptor().values = text;
    }
}

export default InputNodeComponent;
