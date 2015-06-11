var _ = require('lodash');
var BaseNode = require('./BaseNode');

let opHandlers = {
    NOP([]) {
        this.incrPc();
    },
    async MOV([src, dest], writePass) {
        let value = this.getOperand(src);
        await writePass;

        // If we interacted with a i/o port, we can't increment pc
        // until the i/o operation is done.
        if (this.setOperand(dest, value)) {
            this.stepIncrOp = true;
        } else {
            this.incrPc();
        }
    },
    SWP([]) {
        let tmpAcc = this.state.acc;
        this.state.acc = this.state.bak;
        this.state.bak = tmpAcc;
        this.incrPc();
    },
    SAV([]) {
        this.state.bak = this.state.acc;
        this.incrPc();
    },
    ADD([src]) {
        let value = this.getOperand(src);
        this.state.acc += value;
        this.incrPc();
    },
    SUB([src]) {
        let value = this.getOperand(src);
        this.state.acc -= value;
        this.incrPc();
    },
    NEG([]) {
        this.state.acc = -this.state.acc;
    },
    JMP([label]) {
        this.jumpLabel(label);
    },
    JEZ([label]) {
        if (this.state.acc === 0) {
            this.jumpLabel(label);
        } else {
            this.incrPc();
        }
    },
    JNZ([label]) {
        if (this.state.acc !== 0) {
            this.jumpLabel(label);
        } else {
            this.incrPc();
        }
    },
    JGZ([label]) {
        if (this.state.acc > 0) {
            this.jumpLabel(label);
        } else {
            this.incrPc();
        }
    },
    JLZ([label]) {
        if (this.state.acc < 0) {
            this.jumpLabel(label);
        } else {
            this.incrPc();
        }
    },
    JRO([src]) {
        let value = this.getOperand(src);
        this.setPc(value);
    }
};


class BasicExecutionNode extends BaseNode {
    constructor(ast, source) {
        super(source);

        this.ast = ast;

        this.state = {
            pc: 0,
            acc: 0,
            bak: 0,
            lastPort: -1
        };
    }

    checkPc() {
        if (this.state.pc >= this.ast.instructions.length) {
            this.state.pc = 0;
        }
    }
    incrPc() {
        this.state.pc += 1;
        this.checkPc();
    }
    setPc(value) {
        this.state.pc = value;
    }

    getOperand(operand) {
        if ((typeof operand) === "string") {
            switch (operand) {
                case "ACC": return this.state.acc;
                case "NIL": return 0;
                case "LEFT": {
                    return this.read('l');
                }
                case "RIGHT": {
                    return this.read('r');
                }
                case "UP": {
                    return this.read('u');
                }
                case "DOWN": {
                    return this.read('d');
                }
                case "ANY": {
                    // TODO: Reverse implementation
                    throw "unimplemented";
                }
                case "LAST": {
                    // TODO: Reverse implementation
                    throw "unimplemented";
                }
                default: {
                    throw "Could not resolve unknown operand (runtime error, should not happen!!): " + operand;
                }
            }
        } else {
            return operand;
        }
    }
    setOperand(operand, value) {
        switch (operand) {
            case "ACC": {
                this.state.acc = value;
                return;
            }
            case "NIL": return;
            case "LEFT": {
                this.write('l', value);
                return true;
            }
            case "RIGHT": {
                this.write('r', value);
                return true;
            }
            case "UP": {
                this.write('u', value);
                return true;
            }
            case "DOWN": {
                this.write('d', value);
                return true;
            }
            case "ANY": return true;
            case "LAST": return true;
        }
    }

    resolveLabel(label) {
        let ret = this.ast.labels[label];
        if (ret === undefined) {
            throw "Undefined label: " + label;
        }
        return ret;
    }
    jumpLabel(label) {
        this.setPc(this.resolveLabel(label));
    }

    async step(readPass, writePass) {
        if (this.stepIncrOp) {
            this.stepIncrOp = false;
            this.incrPc();
            return;
        }

        let [opCode, operands] = this.ast.instructions[this.state.pc];
        let handler = opHandlers[opCode];

        await readPass;
        await handler.call(this, operands, writePass);
    }
}
BasicExecutionNode.nodeType = "basicExecution";

export default BasicExecutionNode;
