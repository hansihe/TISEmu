var React = require('react');
var Marty = require('marty');
var PortComponent = require('./NodePort');
var AppComponent = require('./AppBase');

var BasicExecutionNodeComponent = require('./NodeBasicExecution');
var StackMemoryNodeComponent = require('./NodeStackMemory');
var VisualNodeComponent = require('./NodeVisual');
var BeeperNodeComponent = require('./NodeBeeper');
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

class EmulatorComponent extends AppComponent {
    constructor(props, context) {
        super(props, context);
    }

    render() {
        let grid = this.makeTableContent();
        
        return <div className="tableContainer">
            {grid}
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

        return [nodeGrid, xMin, xMax, yMin, yMax];
    }
}

var EmulatorComponentContainer = Marty.createContainer(EmulatorComponent, {
    listenTo: 'managerStore'
});

export default EmulatorComponentContainer;
