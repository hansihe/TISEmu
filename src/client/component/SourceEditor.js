var React = require('react');
var CodeMirror = require('codemirror');

class SourceEditorComponent extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.editor = null;
        this.state = {
            editable: props.editable,
            highlightLine: props.hightlightLine,
            text: props.text,
            hasBreakpoints: props.breakpoints !== undefined,
            breakpoints: props.breakpoints
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
            text: nextProps.text,
            hasBreakpoints: nextProps.breakpoints !== undefined,
            breakpoints: nextProps.breakpoints
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

    updateBreakpoints(lines) {
        this.editor.clearGutter("textEditorBreakpoint");
        _.each(lines, line => {
            let marker = document.createElement('div');
            marker.style.color = "#822";
            marker.innerHTML = "x";
            this.editor.setGutterMarker(line, "textEditorBreakpoint", marker);
        });
    }

    componentWillUpdate(nextProps, nextState) {
        // Disabled, using css hack instead. See .markedTextEdit
        //if (this.state.highlightLine !== nextState.highlightLine) {
        //    this.updateHighlightLine(nextState.highlightLine, this.state.highlightLine);
        //}
        if (this.state.text !== nextState.text) {
            console.log("update");
            this.editor.setValue(nextState.text);
        }
        if (this.state.editable !== nextState.editable) {
            this.editor.setOption('readOnly', !nextState.editable);
        }
        //this.updateBreakpoints(nextState.breakpoints);
    }

    componentDidMount() {
        this.editor = CodeMirror.fromTextArea(this.refs.container.getDOMNode(), {
            readOnly: !this.state.editable,
            gutters: this.state.hasBreakpoints ? ["textEditorBreakpoint"] : []
        });
        this.editor.setValue(this.state.text);

        this.editor.on('beforeChange', (instance, change) => {
            change.update(change.from, change.to, _.map(change.text, text =>  text.toUpperCase()));
        });
        this.editor.on('changes', (instance, changes) => {
            this.props.textChange(instance.getValue());
            this.updateBreakpoints(this.state.breakpoints);
        });
        this.editor.on('gutterClick', (instance, line) => {
            this.props.toggleBreakpoint && this.props.toggleBreakpoint(line);
        });

        this.updateHighlightLine(this.state.highlightLine);
        //this.updateBreakpoints(this.state.breakpoints);
    }
}
SourceEditorComponent.propTypes = {
    editable: React.PropTypes.bool,
    text: React.PropTypes.string,
    textChange: React.PropTypes.func,
    highlightLine: React.PropTypes.number,
    //breakpoints: React.PropTypes.arrayOf(React.PropTypes.number),
    //toggleBreakpoint: React.PropTypes.func
};

export default SourceEditorComponent;
