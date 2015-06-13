var BasicExecutionNode = require('./BasicExecutionNode');
var TISMachineManager = require('./TISMachine').default;
var nodeTypes = require('./TISMachine').nodeTypes;

var React = require('react');
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





class TopBarComponent extends AppComponent {
    render() {
        return <div className="topBar">
            <div className="heading">TISE</div>
            <a href="#" onClick={this.run.bind(this)}>Run</a>
            <a href="#" onClick={this.runFast.bind(this)}>Fast</a>
            <a href="#" onClick={this.step.bind(this)}>Step</a>
            <a href="#" onClick={this.stop.bind(this)}>Stop</a>
        </div>;
    }

    stop() {
        this.app.managerStore.stop();
    }
    step() {
        this.app.managerStore.step();
    }
    run() {
        this.app.managerStore.run(10, 10);
    }
    runFast() {
        this.app.managerStore.run(10, 200);
    }
}


var BasicExecutionNodeComponent = require('./component/NodeBasicExecution');
var StackMemoryNodeComponent = require('./component/NodeStackMemory');
var VisualNodeComponent = require('./component/NodeVisual');
var BeeperNodeComponent = require('./component/NodeBeeper');
class NodeDisplayComponent {
    render() {
        let node = this.props.node;
        let { type } = node;

        switch (type) {
            case "blank": return <div></div>;
            case "basicExecution": return <BasicExecutionNodeComponent {...node}/>;
            case "stackMemory": return <StackMemoryNodeComponent {...node}/>;
            case "visual": return <VisualNodeComponent {...node}/>;
            case "beeper": return <BeeperNodeComponent {...node}/>;
            default: throw "Display component not defined for: " + type;
        }
    }
}

var ModalRenderComponent = require('./component/ModalRender');
var PortComponent = require('./component/NodePort');

class RootComponent extends AppComponent {
    constructor(props, context) {
        super(props, context);
    }

    render() {
        let grid = this.makeTableContent();
        
        return <div className="appContainer">
            <ModalRenderComponent/>
            <TopBarComponent/>
            <div className="tableContainer">
                {grid}
            </div>
        </div>;
    }

    portCol(position) {
        return <div key={"portCol_" + position[0]} className="nodeVertPort nodePort">
            <PortComponent orientation="v" position={position}/>
        </div>;
    }
    portRow(yPos, xStart, xEnd) {
        return <div key={"portRow_" + yPos} className="nodeHorizPortRow">
            {_.map(_.range(xStart, xEnd + 1), xPos => {
                return [
                    <div key={"corner_" + xPos} className="nodeCorner"></div>,
                    <div key={xPos} className="nodeHorizPort nodePort">
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

// [cycleDelay, ticksPerCycle]
let speeds = [
    [10, 1],
    [10, 10],
];

class MachineManagerStore extends Marty.Store {
    constructor(options) {
        super(options);
        this.statusTypes = {
            IDLE: "IDLE",
            RUNNING: "RUNNING"
        };
        this.state = {
            status: this.statusTypes.IDLE,
            running: false
        };
    }

    create() {
        if (!this.app.manager.isMachineCreated()) {
            this.app.manager.create();
            this.setState({
                status: this.statusTypes.RUNNING
            });
            return true;
        }
        return false;
    }
    destroy() {
        if (this.app.manager.isMachineCreated()) {
            this.app.manager.destroy();
            this.setState({
                status: this.statusTypes.IDLE
            });
            return true;
        }
        return false;
    }

    _runStep() {
        if (this.state.running) {
            for (let i = 0; i < this.state.runSpeed[1]; i++) {
                this.app.manager.getMachine().step();
            }
            this.hasChanged();

            setTimeout(this._runStep.bind(this), this.state.runSpeed[0]);
        }
    }
    run(cycleDelay, ticksPerCycle) {
        this.state.runSpeed = [cycleDelay, ticksPerCycle];

        if (this.state.running) return;
        this.step();
        this.state.running = true;

        this._runStep();
    }
    step() {
        if (!this.create()) {
            this.app.manager.getMachine().step();
        }
        this.state.running = false;
        this.hasChanged();
    }
    stop() {
        this.state.running = false;
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

    fromSource(source) {
        this.app.manager.fromSource(source);
        this.hasChanged();
    }
    toSource() {
        return this.app.manager.toSource();
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
    window.app = app;

    React.render(
            <Marty.ApplicationContainer app={app}>
                <RootComponentContainer/>
            </Marty.ApplicationContainer>, document.body);
}
