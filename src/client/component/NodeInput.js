var _ = require('lodash');
var React = require('react');
var BaseNodeComponent = require('./NodeBase');
var SourceEditorComponent = require('./SourceEditor');

class InputNodeComponent extends BaseNodeComponent {
    constructor(props, context) {
        super(props, context);
        this.nodeStateDefaults = {
            currentValue: -1
        };
    }

    render() {
        console.log(this.props);
        let nodeDesc = this.getNodeDescriptor();
        let text = nodeDesc.values.join('\n');
        console.log(text);
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
                highlightLine={this}/>
        </div>;
    }

    textChange(text) {
        this.getNodeDescriptor().values = _.filter(text.split('\n'), line => {
            return !isNaN(+line);
        });
        this.forceUpdate();
    }
}

export default InputNodeComponent;
