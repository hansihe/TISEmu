var React = require('react');
var CodeMirror = require('codemirror');

class SourceEditorComponent extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.editor = null;
        this.state = {
            editable: props.editable,
            highlightLine: props.hightlightLine,
            text: props.text
        };
    }

    render() {
        return <div className={"textEditor markedTextEdit highlightLine-"+this.state.highlightLine}>
            <textarea 
                ref="container" 
                className="inArea"/>
        </div>;
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            editable: nextProps.editable,
            highlightLine: nextProps.highlightLine,
            text: nextProps.text
        });
    }

    updateHighlightLine(newLine, oldLine) {
        if (oldLine !== undefined && oldLine !== -1) {
            this.editor.removeLineClass(oldLine, 'background', 'pcLine');
        }
        if (newLine !== undefined && newLine !== -1) {
            this.editor.addLineClass(newLine, 'background', 'pcLine');
        }
    }

    componentWillUpdate(nextProps, nextState) {
        // Disabled, using css hack instead. See .markedTextEdit
        //if (this.state.highlightLine !== nextState.highlightLine) {
        //    this.updateHighlightLine(nextState.highlightLine, this.state.highlightLine);
        //}
        if (this.state.text !== nextState.text) {
            this.editor.setValue(nextState.text);
        }
        if (this.state.editable !== nextState.editable) {
            this.editor.setOption('readOnly', !nextState.editable);
        }
    }

    componentDidMount() {
        this.editor = CodeMirror.fromTextArea(this.refs.container.getDOMNode(), {
            readOnly: !this.state.editable
        });
        this.editor.setValue(this.state.text);

        this.editor.on('beforeChange', (instance, change) => {
            change.update(change.from, change.to, _.map(change.text, text =>  text.toUpperCase()));
        });
        this.editor.on('changes', (instance, changes) => {
            this.props.textChange(this.editor.getValue());
        });

        this.updateHighlightLine(this.state.highlightLine);
    }
}

export default SourceEditorComponent;
