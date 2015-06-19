var React = require('react');
var AppComponent = require('./AppBase');

let symbols = {
    up: "\u25b2",
    down: "\u25bc",
    left: "\u25c0",
    right: "\u25b6"
};
class PortComponent extends AppComponent {
    render() {
        let isConnected = this.isConnected();
        let hasAddButton = this.hasAddButton();

        let symbolSet = this.getOrientation() ? [symbols.left, symbols.right] : [symbols.up, symbols.down];

        if (this.getMode()) { // Running
            let nodeOne = this.getNodeOneInstance();
            let nodeTwo = this.getNodeTwoInstance();
            if (isConnected) {
                return <div className="portDisplay">
                    <span className="valueDisplay">{nodeTwo.getSideDisplayValue(this.getNodeTwoPort())}</span>
                    <span>{symbolSet[0]}</span>
                    <span>{symbolSet[1]}</span>
                    <span className="valueDisplay">{nodeOne.getSideDisplayValue(this.getNodeOnePort())}</span>
                </div>;
            } else {
                return <div></div>;
            }
        } else { // Not running
            if (hasAddButton) {
                return <a className="addButton" onClick={this.addNode.bind(this)}>+</a>;
            } else if (isConnected) {
                return <div className="portDisplay">
                    <div>{symbolSet[0]}</div>
                    <div>{symbolSet[1]}</div>
                </div>;
            } else {
                return <div></div>;
            }
        }
    }

    addNode() {
        if (this.getNodeOneDesc()) {
            this.app.modalStore.displayNodeAddDialog(this.getNodeTwoPos());
        } else {
            this.app.modalStore.displayNodeAddDialog(this.getNodeOnePos());
        }
    }

    hasAddButton() {
        let nodeDescOne = this.getNodeOneDesc();
        let nodeDescTwo = this.getNodeTwoDesc();;
        return (nodeDescOne && !nodeDescTwo) || (!nodeDescOne && nodeDescTwo);;
    }

    isConnected() {
        return this.getNodeOneDesc()
            && this.getNodeTwoDesc();
    }

    getMode() {
        return this.app.manager.isMachineCreated();
    }
    getOrientation() {
        return this.props.orientation === "v";
    }

    getNodeOneDesc() {
        return this.app.manager.getNodeDescriptor(this.getNodeOnePos());
    }
    getNodeOneInstance() {
        return this.app.manager.getMachine().getNodeInstance(this.getNodeOnePos());
    }
    getNodeOnePos() {
        let pos = this.props.position;
        if (this.getOrientation()) {
            return [pos[0] - 1, pos[1]];
        } else {
            return [pos[0], pos[1] - 1];
        }
    }
    getNodeOnePort() {
        return this.getOrientation() ? 'r' : 'd';
    }

    getNodeTwoDesc() {
        return this.app.manager.getNodeDescriptor(this.getNodeTwoPos());
    }
    getNodeTwoInstance() {
        return this.app.manager.getMachine().getNodeInstance(this.getNodeTwoPos());
    }
    getNodeTwoPos() {
        let pos = this.props.position;
        if (this.getOrientation()) {
            return [pos[0], pos[1]];
        } else {
            return [pos[0], pos[1]];
        }
    }
    getNodeTwoPort() {
        return this.getOrientation() ? 'l' : 'u';
    }
}

export default PortComponent;
