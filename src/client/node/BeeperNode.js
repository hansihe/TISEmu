var _ = require('lodash');
var BaseNode = require('./BaseNode');

var { nodeSidePairs } = require('../sideUtils');

let ctx = new AudioContext();
function playOsc(type,freq,vol,dur) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + dur);

    g.gain.value = vol;
    g.gain.setValueAtTime(1,ctx.currentTime + dur - 0.04);
    g.gain.linearRampToValueAtTime(0,ctx.currentTime + dur);
    o.connect(g);
    g.connect(ctx.destination);
}
function playTone(num) {
    if (num < 0) num = 0;
    if (num > 10) num = 10;
    let freq = 50 + (150 * num);
    playOsc('square', freq, 0.5, 0.2);
}

class BeeperNode extends BaseNode {
    constructor(machine, source) {
        super(machine, source);
    }

    pass() {
        _.each(nodeSidePairs, ([side]) => {
            try {
                let value = this.read(side);
                playTone(value);
            } catch (e) {
                if (e !== this.WAIT_READ) {
                    throw e;
                }
            }
        });
        return false;
    }
}
BeeperNode.nodeType = "beeper";
BeeperNode.displayName = "Beeper Node";

export default BeeperNode;
