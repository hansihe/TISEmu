var React = require('react');
var BaseNodeComponent = require('./NodeBase');

let colors = ['black', 'grey', 'grey', 'white', 'red'];
class VisualNodeComponent extends BaseNodeComponent {
    render() {
        return <div className="nodeFrame visualNode">
            <canvas ref="canvas" className="canvas" width={30} height={18}/>
        </div>;
    }
    componentDidUpdate() {
        let canvas = this.refs.canvas.getDOMNode();
        let context = canvas.getContext('2d');

        if (this.isMachineCreated()) {
            let instance = this.getNodeInstance();
            _.each(instance.state.image, (yCol, yPos) => {
                _.each(yCol, (color, xPos) => {
                    context.fillStyle = colors[color];
                    context.fillRect(xPos, yPos, 1, 1);
                });
            });
        } else {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
}

export default VisualNodeComponent;
