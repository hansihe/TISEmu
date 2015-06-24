var React = require('react');
var Marty = require('marty');
var AppComponent = require('./AppBase');


var nodeTypes = require('../TISMachine').nodeTypes;
class NodeAddModal extends AppComponent {
    render() {
        let [pos] = this.props.args;
        let nodeButtons = _.map(nodeTypes, (node, name) => {
            return <a key={name} onClick={() => this.addModal(name)}>
                {node.displayName}
            </a>;
        });

        return <div>
            What node type do you want to add at {pos.toString()}?
            <br/>
            {nodeButtons}
        </div>;
    }
    addModal(name) {
        let [pos] = this.props.args;
        this.app.managerStore.addNode(pos, name);
        this.props.close();
    }
}

class NodeDelModal extends AppComponent {
    render() {
        let [pos] = this.props.args;
        return <div>
            Are you sure you want to delete the node at {pos.toString()}?
            You will lose unsaved code in the node.
            <br/>
            <a onClick={this.delNode.bind(this)}>Yes</a>
            <br/>
            <a onClick={this.props.close.bind(this)}>No</a>
        </div>;
    }
    delNode() {
        let [pos] = this.props.args;
        this.app.managerStore.delNode(pos);
        this.props.close();
    }
}

class SaveJsonModal extends AppComponent {
    render() {
        return <div>
            <div>Save this text to save your program. It can be pasted back into the load dialog.</div>
            <textarea readOnly value={this.props.args[0]}/>
        </div>;
    }
}

class LoadJsonModal extends AppComponent {
    render() {
        return <div>
            <div>Paste the text from the save dialog into the text area below to load a program</div>
            <textarea ref="text"/>
            <a href="#" onClick={this.doLoad.bind(this)}>Load</a>
        </div>;
    }

    doLoad() {
        this.props.args[0](this.refs.text.getDOMNode().value);
        this.props.close();
    }
}

class ModalRenderComponent extends AppComponent {
    constructor(props, context) {
        super(props, context);
        this.types = this.app.modalStore.modalTypes;
        this.typeComponents = {
            "nodeAddDialog": NodeAddModal,
            "nodeDelDialog": NodeDelModal,
            "saveJson": SaveJsonModal,
            "loadJson": LoadJsonModal
        };
    }

    render() {
        if (this.props.modal) {
            let content = this.makeContent();
            return <div className="modalContainer" ref="background" onClick={this.backClick.bind(this)}>
                <div className={"type " + this.props.modal[0] + "Type"}>
                    {content}
                </div>
            </div>;
        } else {
            return <div></div>;
        }
    }
    backClick(event) {
        if (event.target === this.refs.background.getDOMNode()) {
            this.closeModal();
        }
    }
    closeModal() {
        this.app.modalStore.closeModal();
    }
    makeContent() {
        let [type, args] = this.props.modal;
        let component = this.typeComponents[type];
        return React.createElement(component, {args: args, close: this.closeModal.bind(this)});
    }
}
let ModalRenderComponentContainer = Marty.createContainer(ModalRenderComponent, {
    listenTo: 'modalStore',
    fetch: {
        modal() {
            return this.app.modalStore.getModal();
        }
    }
});

export default ModalRenderComponentContainer;
