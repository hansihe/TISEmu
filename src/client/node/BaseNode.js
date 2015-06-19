//var Promise = require('bluebird');

var { sumPositions, getSide, opositeSide } = require('../sideUtils');

class BaseNode {
    constructor(machine, source) {
        this.machine = machine;
        this.source = source;
        this.position = source.position;

        this.state = {};

        this.outBuffer = {};
        this.out = {};

        this.modes = {
            IDLE: "IDLE",
            RUN: "RUN",
            READ: "READ",
            WRITE: "WRITE"
        }
        this.state.mode = this.modes.RUN;

        this.WAIT_READ = Symbol();
        this.WAIT_WRITE = Symbol();
    }

    read(side) {
        if (side === 'a') {
            let value;

            value = this.softRead('l');
            if (value !== undefined) {
                this.state.lastPort = 'l';
                return value;
            }

            value = this.softRead('r');
            if (value !== undefined) {
                this.state.lastPort = 'r';
                return value;
            }

            value = this.softRead('u');
            if (value !== undefined) {
                this.state.lastPort = 'u';
                return value;
            }

            value = this.softRead('d');
            if (value !== undefined) {
                this.state.lastPort = 'd';
                return value;
            }

            throw this.WAIT_READ;
        }

        let value = this.softRead(side);
        if (value === undefined) {
            throw this.WAIT_READ;
        }
        return value;
    }
    softRead(side) {
        let sideNode = this.getSideNode(side);
        if (!sideNode) {
            return undefined;
        }
        let value = sideNode.readFrom(opositeSide(side));
        return value;
    }

    readFrom(side) {
        let value = this.out['a'];
        if (value !== undefined) {
            delete this.out['a'];
            this.state.lastPort = side;
            return value;
        }

        value = this.out[side];
        delete this.out[side];
        return value;
    }
    isWriting() {
        return _.size(this.out) !== 0;
    }
    waitWrite() {
        if (this.isWriting()) {
            throw this.WAIT_WRITE;
        }
    }
    write(side, value) {
        this.outBuffer[side] = value;
    }

    getSideDisplayValue(side) {
        if (this.out['a']) return this.out[a];
        return this.out[side];
    }

    getSideNode(side) {
        let sidePos = sumPositions(this.position, getSide(side));
        return this.machine.getNodeInstance(sidePos);
    }

    setMode(mode) {
        this.state.mode = mode;
    }

    doStepPass() {
        try {
            let res = this.pass();
            this.setMode(this.modes.RUN);
            return res;
        } catch (e) {
            if (e === this.WAIT_READ) {
                this.setMode(this.modes.READ);
                return false;
            } else if (e === this.WAIT_WRITE) {
                this.setMode(this.modes.WRITE);
                return false;
            } else {
                throw e;
            }
        }
    }
    doStepEnd() {
        _.each(this.outBuffer, (value, side) => this.out[side] = value);
        this.outBuffer = {};
        this.stepEnd();
    }

    clamp(value) {
        if (value < -999) return -999;
        if (value > 999) return 999;
        return value;
    }

    stepEnd() {}

    // When we need to wait for a read, we should throw this.WAIT_READ
    // Writes will always succeed.
    // If the node has finished everything it should do that step (i/e its operation succeeded) it should return true.
    // If not, (i/e waiting for a read) return false.
    // Note: This may get called several times in the same step. 
    pass() {}
}

export default BaseNode;
