var BasicExecutionNode = require('./BasicExecutionNode');
var TISMachineManager = require('./TISMachine').default;
var nodeTypes = require('./TISMachine').nodeTypes;

var React = require('react');
var CodeMirror = require('codemirror');
var Marty = require('marty');
var AppComponent = require('./component/AppBaseComponent');



function updateBounds(bounds, value) {
    if (value < bounds[0]) {
        bounds[0] = value;
    }
    if (value > bounds[1]) {
        bounds[1] = value;
    }
    return bounds;
}

function findDimentions(nodes) {
    if (nodes.length === 0) { return [0, 0] }

    let xBounds = [nodes[0].position[0], nodes[0].position[0]];
    let yBounds = [nodes[0].position[1], nodes[0].position[1]];

    _.each(nodes, descr => {
        xBounds = updateBounds(xBounds, descr.position[0]);
        yBounds = updateBounds(yBounds, descr.position[1]);
    });

    return {
        x: {
            lower: xBounds[0],
            upper: xBounds[1]
        },
        y: {
            lower: yBounds[0],
            upper: yBounds[1]
        }
    };
}

class SourceEditorComponent extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.editor = null;
        this.state = {
            nodeState: props.state,
            pc: props.pc
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
            pc: nextProps.pc
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
    }

    componentDidMount() {
        this.editor = CodeMirror.fromTextArea(this.refs.container.getDOMNode(), {
            readOnly: !this.props.state.editable
        });
        this.editor.setValue(this.props.source.code);

        this.editor.on('beforeChange', (instance, change) => {
            change.update(change.from, change.to, _.map(change.text, text =>  text.toUpperCase()));
        });
        this.editor.on('changes', (instance, changes) => {
            this.props.source.code = this.editor.getValue();
        });

        this.updatePcLine(this.state.nodeState.state.pc);
    }
}

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

    isMachineCreated() {
        return this.app.manager.isMachineCreated();
    }
}

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

class StackMemoryNodeComponent extends BaseNodeComponent {
    constructor(props, context) {
        super(props, context);
        this.nodeStateDefaults = {
            stack: []
        };
    }

    render() {
        let state = this.getNodeState();
        let stackItems = _.map(state.state.stack, item => {
            return <div>{item}</div>;
        });
        return <div className="nodeFrame stackMemoryNode">
            <div className="leftPanel">
                STACK MEMORY NODE
            </div>
            <div className="rightPanel">
                {stackItems}
            </div>
        </div>;
    }
}

class MachineControlsComponent extends AppComponent {
    render() {
        return <div>
            <a href="#" onClick={this.stop.bind(this)}>Stop</a>
            <a href="#" onClick={this.step.bind(this)}>Step</a>
        </div>;
    }

    stop() {
        this.app.managerStore.stop();
    }
    step() {
        this.app.managerStore.step();
    }
}

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
        if (this.getMode()) {
            if (isConnected) {
                if (this.getOrientation()) {
                    return <div>{symbols.left + symbols.right}</div>;
                } else {
                    return <div>{symbols.up + symbols.down}</div>;
                }
            } else {
                return <div></div>;
            }
        } else {
            if (hasAddButton) {
                return <a className="addButton" onClick={this.addNode.bind(this)}>+</a>;
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
    getNodeOnePos() {
        let pos = this.props.position;
        if (this.getOrientation()) {
            return [pos[0] - 1, pos[1]];
        } else {
            return [pos[0], pos[1] - 1];
        }
    }
    getNodeTwoDesc() {
        return this.app.manager.getNodeDescriptor(this.getNodeTwoPos());
    }
    getNodeTwoPos() {
        let pos = this.props.position;
        if (this.getOrientation()) {
            return [pos[0], pos[1]];
        } else {
            return [pos[0], pos[1]];
        }
    }
}

class NodeDisplayComponent {
    render() {
        let node = this.props.node;
        let { type } = node;

        switch (type) {
            case "blank": return <div></div>;
            case "basicExecution": return <BasicExecutionNodeComponent {...node}/>;
            case "stackMemory": return <StackMemoryNodeComponent {...node}/>;
            default: throw "Display component not defined for: " + type;
        }
    }
}

var ModalRenderComponent = require('./component/ModalRender');

class RootComponent extends AppComponent {
    constructor(props, context) {
        super(props, context);
    }

    render() {
        let grid = this.makeTableContent();
        
        return <div className="appContainer">
            <ModalRenderComponent/>
            <MachineControlsComponent/>
            <div className="tableContainer">
                {grid}
            </div>
        </div>;
    }

    portCol(position) {
        return <div key={"portCol_" + position[0]} className="nodeVertPort">
            <PortComponent orientation="v" position={position}/>
        </div>;
    }
    portRow(yPos, xStart, xEnd) {
        return <div key={"portRow_" + yPos} className="nodeHorizPortRow">
            {_.map(_.range(xStart, xEnd + 1), xPos => {
                return [
                    <div key={"corner_" + xPos} className="nodeCorner"></div>,
                    <div key={xPos} className="nodeHorizPort">
                        <PortComponent orientation="h" position={[xPos, yPos]}/>
                    </div>
                ];
            })}
            <div key="corner_last" className="nodeCorner"></div>
        </div>;
    }

    makeTableContent() {
        let [tableStruct, xMin, xMax, yMin, yMax] = this.makeTableStruct(this.app.manager.nodeMap);

        let lastNode;
        let gridX = _.map(_.range(yMin, yMax + 1), (yIndex) => {
            let xNodes = tableStruct[yIndex];
            let gridY = _.map(_.range(xMin, xMax + 1), (xIndex) => {
                let node = xNodes[xIndex];
                lastNode = node;

                let portCol = this.portCol(node.position);
                return [
                    portCol,
                    <div key={xIndex} className="nodeCol">
                        <NodeDisplayComponent node={node}/>
                    </div>
                ];
            });

            let portRow = this.portRow(yIndex, xMin, xMax);
            let portCol = this.portCol([lastNode.position[0] + 1, lastNode.position[1]]);
            return [
                portRow,
                <div key={yIndex} className="nodeRow">
                    {gridY}
                    {portCol}
                </div>
            ];
        });

        let portRow = this.portRow(lastNode.position[1] + 1, xMin, xMax);
        let grid = <div className="nodeTable">
            {gridX}
            {portRow}
        </div>;

        return grid;
    }

    makeTableStruct(nodes) {
        // Rotates the dict by 90 degrees.
        // We do this because we want to render a html table, 
        // and they are row-major, while our format is column-major.
        let transposed = {};
        _.each(nodes, (col, xPos) => {
            _.each(col, (node, yPos) => {
                if (!transposed[yPos]) {
                    transposed[yPos] = {};
                }
                transposed[yPos][xPos] = node;
            });
        });

        let xValues = _.map(_.keys(nodes), i => +i);
        let xMin = _.min(xValues);
        let xMax = _.max(xValues);

        let yValues = _.map(_.keys(transposed), i => +i);
        let yMin = _.min(yValues);
        let yMax = _.max(yValues);

        // Fill in unfilled rows and cells
        let nodeGrid = _.zipObject(_.map(_.range(yMin, yMax + 1), yPos => {
            let col = transposed[yPos];
            return [yPos, _.zipObject(_.map(_.range(xMin, xMax + 1), xPos => {
                if (col === undefined || col[xPos] === undefined) {
                    return [xPos, {
                        type: 'blank',
                        position: [xPos, yPos]
                    }];
                }
                return [xPos, {
                    type: col[xPos].type,
                    desc: col[xPos],
                    position: [xPos, yPos]
                }];
            }))];
        }));

        return [nodeGrid, xMin, xMax, yMin, yMax];
    }
}

var RootComponentContainer = Marty.createContainer(RootComponent, {
    listenTo: 'managerStore'
});


class MachineManagerStore extends Marty.Store {
    constructor(options) {
        super(options);
        this.statusTypes = {
            IDLE: "IDLE",
            RUNNING: "RUNNING"
        };
        this.state = {
            status: this.statusTypes.IDLE
        };
    }

    create() {
        if (!this.app.manager.isMachineCreated()) {
            this.app.manager.create();
            this.setState({
                status: this.statusTypes.RUNNING
            });
        }
    }
    destroy() {
        if (this.app.manager.isMachineCreated()) {
            this.app.manager.destroy();
            this.setState({
                status: this.statusTypes.IDLE
            });
        }
    }

    step() {
        this.create();
        this.app.manager.getMachine().step();
        this.hasChanged();
    }
    stop() {
        this.destroy();
    }

    addNode(position, type) {
        this.app.manager.addNode(position, type);
        this.hasChanged();
    }
    delNode(position) {
        this.app.manager.delNode(position);
        this.hasChanged();
    }
}

class ModalStore extends Marty.Store {
    constructor(options) {
        super(options);
        this.modalTypes = {
            nodeAddDialog: "nodeAddDialog"
        };
        this.state = {
            current: null
        };
    }

    displayNodeAddDialog(pos) {
        this.displayModal(this.modalTypes.nodeAddDialog, pos);
    }

    displayModal(type, ...args) {
        this.setState({
            current: [type, args]
        });
    }
    closeModal() {
        this.setState({
            current: null
        });
    }
    getModal() {
        return this.state.current;
    }
}

class Application extends Marty.Application {
    constructor(options) {
        super(options);

        this.manager = new TISMachineManager();
        this.register('managerStore', MachineManagerStore);
        this.register('modalStore', ModalStore);

        this.manager.fromSource({
            nodes: [
            {
                type: "basicExecution",
                position: [0, 0],
                code: ""
            }
            ]
        });
    }
}

window.onload = function() {
    var app = new Application();

    React.render(
            <Marty.ApplicationContainer app={app}>
                <RootComponentContainer/>
            </Marty.ApplicationContainer>, document.body);
}
