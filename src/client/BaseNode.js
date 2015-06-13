//var Promise = require('bluebird');

var { sumPositions, getSide, opositeSide } = require('./sideUtils');

class BaseNode {
    constructor(machine, source) {
        this.machine = machine;
        this.source = source;
        this.position = source.position;

        this.state = {};

        this.outBuffer = {};
        this.out = {};

        this.modes = {
            RUN: "RUN",
            READ: "READ",
            WRITE: "WRITE"
        }
        this.mode = this.modes.RUN;

        this.WAIT_READ = Symbol();
        this.WAIT_WRITE = Symbol();
    }

    read(side) {
        let sideNode = this.getSideNode(side);
        if (!sideNode) {
            throw this.WAIT_READ;
        }
        let value = sideNode.readFrom(opositeSide(side));
        if (value === undefined) {
            throw this.WAIT_READ;
        }
        return value;
    }
    softRead(side) {
        try {
            return this.read(side)
        } catch (e) {
            if (e === this.WAIT_READ) {
                return undefined;
            }
            throw e;
        }
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
    waitWrite() {
        let wait = _.size(this.out) !== 0;
        if (wait) {
            throw this.WAIT_WRITE;
        }
    }
    write(side, value) {
        this.outBuffer[side] = value;
    }

    getSideNode(side) {
        let sidePos = sumPositions(this.position, getSide(side));
        return this.machine.getNodeInstance(sidePos);
    }

    doStepPass() {
        try {
            return this.pass()
        } catch (e) {
            if (e === this.WAIT_READ) {
                return false;
            } else if (e === this.WAIT_WRITE) {
                return false;
            } else {
                throw e;
            }
        }
    }
    doStepEnd() {
        _.each(this.outBuffer, (value, side) => this.out[side] = value);
        this.outBuffer = {};
    }

    // When we need to wait for a read, we should throw this.WAIT_READ
    // Writes will always succeed.
    // If the node has finished everything it should do that step (i/e its operation succeeded) it should return true.
    // If not, (i/e waiting for a read) return false.
    // Note: This may get called several times in the same step. 
    pass() {}
}

export default BaseNode;
