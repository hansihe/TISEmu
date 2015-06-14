var React = require('react');
var BaseNodeComponent = require('./NodeBase');

class NumpadNodeComponent extends BaseNodeComponent {
    render() {
        let f = num => {
            return () => this.sendKey(num);
        };
        return <div className="nodeFrame numpadNode">
            <div className="numpadRow">
                <div className="button"><a onClick={f(7)}>7</a></div>
                <div className="button"><a onClick={f(8)}>8</a></div>
                <div className="button"><a onClick={f(9)}>9</a></div>
            </div>
            <div className="numpadRow">
                <div className="button"><a onClick={f(4)}>4</a></div>
                <div className="button"><a onClick={f(5)}>5</a></div>
                <div className="button"><a onClick={f(6)}>6</a></div>
            </div>
            <div className="numpadRow">
                <div className="button"><a onClick={f(1)}>1</a></div>
                <div className="button"><a onClick={f(2)}>2</a></div>
                <div className="button"><a onClick={f(3)}>3</a></div>
            </div>
            <div className="numpadRow">
                <div className="button"><a onClick={f(0)}>0</a></div>
                <div className="big button"><a onClick={f(-1)}>ENTER</a></div>
            </div>
        </div>;
    }

    sendKey(key) {
        if (this.isMachineCreated()) {
            let node = this.getNodeInstance();
            if (node.state.key === undefined) {
                node.state.key = key;
            }
        }
    }
}

export default NumpadNodeComponent;
