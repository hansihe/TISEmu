//var Promise = require('bluebird');

class BaseNode {
    constructor(source) {
        this.out = {};
        this.outWait = null;
        this.in = {};

        this.modes = {
            RUN: "RUN",
            READ: "READ",
            WRITE: "WRITE"
        }
        this.mode = this.modes.RUN;

        this.source = source;
        this.position = source.position;

        this.WAIT_READ = Symbol();
        this.WAIT_WRITE = Symbol();
    }

    read(side) {
        if (!this.in[side]) {
            throw this.WAIT_READ;
        }
        let obj = this.in[side];
        obj.read = true;
        return obj.value;
    }

    write(side, value) {
        let obj = {
            read: false,
            value: value
        };

        this.out[side] = obj;
        this.outWait = obj;
    }

    async prepPass() {
        this.passState = {
            pass: "PRE"
        };
        let readPromise = new Promise((resolve, reject) => {
            this.passState.readP = { resolve, reject };
        });
        let writePromise = new Promise((resolve, reject) => {
            this.passState.writeP = { resolve, reject };
        });

        
        this.in = _.zipObject(_.filter(_.pairs(this.in), ([key, val]) => {
            return val && !val.read;
        }));

        if (this.outWait) {
            if (this.outWait.read) {
                this.outWait = null;
            } else {
                return false;
            }
        }

        try {
            await this.step(readPromise, writePromise);
        } catch (e) {
            if (e === this.WAIT_READ) {
                this.passState.readP.reject();
                this.passState.writeP.reject();
                return false;
            } else {
                throw e;
            }
        }

        return true;
    }

    readPass() {
        this.passState.pass = "READ";
        this.passState.readP.resolve();
    }

    writePass() {
        this.passState.pass = "WRITE";
        this.passState.writeP.resolve();
    }

    // For operations solely on the node itself, it can be done directly in step().
    // The read pass is allowed to fail (throw this.WAIT_READ) if read value(s) are not availible.
    // The write pass must always succeed.
    async step(readPass, writePass) {}
}

export default BaseNode;
