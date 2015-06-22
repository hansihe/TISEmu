var React = require('react');
var Marty = require('marty');
var PortComponent = require('./NodePort');
var AppComponent = require('./AppBase');

var BasicExecutionNodeComponent = require('./NodeBasicExecution');
var StackMemoryNodeComponent = require('./NodeStackMemory');
var VisualNodeComponent = require('./NodeVisual');
var NumpadNodeComponent = require('./NodeNumpad');
var InputNodeComponent = require('./NodeInput');
//var OutputNodeComponent = require('./NodeOutput);
var BeeperNodeComponent = require('./NodeBeeper');

let nodeComponents = {
    blank: "div",
    basicExecution: BasicExecutionNodeComponent,
    stackMemory: StackMemoryNodeComponent,
    visual: VisualNodeComponent,
    numpad: NumpadNodeComponent,
//    input: InputNodeComponent,
//    output: OutputNodeComponent,
    beeper: BeeperNodeComponent
};

class NodeOptionBar extends AppComponent {
    render() {
        return <div className="controlBar">
            X
        </div>;
    }
}

class NodeDisplayComponent extends AppComponent {
    render() {
        let node = this.props.node;
        let { type } = node;

        let component = nodeComponents[type];
        let element = React.createElement(component, node);

        let optionBar = !this.app.manager.isMachineCreated() ? <NodeOptionBar/> : null;

        return <div className="nodeContainer">
            {optionBar}
            {element}
        </div>;
    }
}

class PortRowComponent extends AppComponent {
    constructor(props, context) {
        super(props, context);
    }

    render() {
        let { xMin, xMax, yMin, yMax } = this.props.bounds;
        let yPos = this.props.rowNum;

        let ports = _.map(_.range(xMin, xMax + 1), xPos => {
            return [
                <div key={"corner_" + xPos} className="nodeCorner"></div>,
                <div key={xPos} className="nodeHorizPort nodePort">
                    <PortComponent orientation="h" position={[xPos, yPos]}/>
                </div>
            ];
        });
        return <div key={"portRow_" + yPos} className="nodeHorizPortRow">
            {ports}
            <div key="corner_last" className="nodeCorner"></div>
        </div>;
    }
}

class NodeRowComponent extends AppComponent {
    constructor(props, context) {
        super(props, context);
    }

    render() {
        let rowStruct = this.props.rowStruct;
        let { xMin, xMax, yMin, yMax } = this.props.bounds;

        let columns = _.map(_.range(xMin, xMax + 1), (xIndex) => {
            let node = rowStruct[xIndex];

            let portCol = this.portCol(node.position);
            return [
                portCol,
                <div key={xIndex} className="nodeCol">
                    <NodeDisplayComponent node={node}/>
                </div>
            ];
        });

        let portCol = this.portCol([xMax + 1, this.props.yPos]);
        return <div key={this.props.yPos} className="nodeRow">
            {columns}
            {portCol}
        </div>
            //{portCol}
    }
    portCol(position) {
        return <div key={"portCol_" + position[0]} className="nodeVertPort nodePort">
            <PortComponent orientation="v" position={position}/>
        </div>;
    }
}

class NodeGridComponent extends AppComponent {
    constructor(props, context) {
        super(props, context);
    }

    render() {
        let gridStruct = this.props.gridStruct;
        let { xMin, xMax, yMin, yMax } = this.props.bounds;

        //let lastNode;
        let rows = _.map(_.range(yMin, yMax + 1), rowIndex => {
            let rowStruct = gridStruct[rowIndex];
            //lastNode = node;

            return [
                <PortRowComponent rowNum={rowIndex} bounds={this.props.bounds}/>,
                <NodeRowComponent rowStruct={rowStruct} bounds={this.props.bounds} yPos={rowIndex}/>
            ];
        });
        return <div className="tableContainer">
            <div className="nodeTable">
                {rows}
                <PortRowComponent rowNum={yMax + 1} bounds={this.props.bounds}/>
            </div>
        </div>;
    }
}
NodeGridComponent.propTypes = {
    gridStruct: React.PropTypes.object.isRequired,
    bounds: React.PropTypes.object.isRequired
};

class EmulatorComponent extends AppComponent {
    constructor(props, context) {
        super(props, context);
    }

    render() {
        let [gridStruct, gridBounds] = this.makeGridStruct(this.app.manager.nodeMap);

        return <NodeGridComponent gridStruct={gridStruct} bounds={gridBounds}/>;
    }


    makeGridStruct(nodes) {
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

        // Find the x bounds
        let xValues = _.map(_.keys(nodes), i => +i);
        let xMin = _.min(xValues);
        let xMax = _.max(xValues);

        // .. and the y bounds
        let yValues = _.map(_.keys(transposed), i => +i);
        let yMin = _.min(yValues);
        let yMax = _.max(yValues);

        // Fill in unfilled rows and cells, produce a complete grid
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

        return [nodeGrid, {xMin, xMax, yMin, yMax}];
    }
}

var EmulatorComponentContainer = Marty.createContainer(EmulatorComponent, {
    listenTo: 'managerStore'
});

export default EmulatorComponentContainer;
