var React = require('react');
var CodeMirror = require('codemirror');

class SourceEditorComponent extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.editor = null;
        this.state = {
            nodeState: props.state,
            pc: props.pc,
            text: props.text
        };
    }

    render() {
        return <textarea 
            ref="container" 
            className="inArea"/>;
    }

    componentWillReceiveProps(nextProps) {
        let nodeState = nextProps.state;
        this.setState({
            nodeState: nodeState,
            pc: nextProps.pc,
            text: nextProps.text
        });
        this.editor.setOption('readOnly', !nodeState.editable);
    }

    updatePcLine(newLine, oldLine) {
        if (oldLine !== undefined && oldLine !== -1) {
            this.editor.removeLineClass(oldLine, 'background', 'pcLine');
        }
        if (newLine !== undefined && newLine !== -1) {
            this.editor.addLineClass(newLine, 'background', 'pcLine');
        }
    }

    componentWillUpdate(nextProps, nextState) {
        if (this.state.pc !== nextState.pc) {
            this.updatePcLine(nextState.pc, this.state.pc);
        }
        if (this.state.text !== nextState.text) {
            this.editor.setValue(nextState.text);
        }
    }

    componentDidMount() {
        this.editor = CodeMirror.fromTextArea(this.refs.container.getDOMNode(), {
            readOnly: !this.props.state.editable
        });
        this.editor.setValue(this.props.text);
        this.setState({
            text: this.props.text
        });

        this.editor.on('beforeChange', (instance, change) => {
            change.update(change.from, change.to, _.map(change.text, text =>  text.toUpperCase()));
        });
        this.editor.on('changes', (instance, changes) => {
            this.props.source.code = this.editor.getValue();
        });

        this.updatePcLine(this.state.nodeState.state.pc);
    }
}

export default SourceEditorComponent;
