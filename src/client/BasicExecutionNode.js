var _ = require('lodash');
var BaseNode = require('./BaseNode');
var parse = require('./parser');

let opHandlers = {
    NOP([]) {
        this.incrPc();
    },
    MOV([src, dest]) {
        let value = this.getOperand(src);

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
    constructor(machine, source) {
        super(machine, source);

        this.ast = parse(source.code);

        // If the node doesn't actually do anything, there is no point in doing anything
        this.hasInstructions = false;
        _.each(this.ast.instructions, instruction => {
            if (instruction !== "SKIP") this.hasInstructions = true;
        });

        this.state = {
            pc: 0,
            acc: 0,
            bak: 0,
            lastPort: -1
        };

        this.checkPc();
    }

    incrPc() {
        this.state.pc += 1;
        this.checkPc();
    }
    setPc(value) {
        this.state.pc = value;
        this.checkPc();
    }

    checkPc() {
        // Prevent infinite loops. When the PC wraps twice, we want to stop. It should not happen in reality,
        // but infinite loops are no fun.
        let wraps = 0;
        while (wraps < 2) {
            let instruction = this.ast.instructions[this.state.pc];

            if (this.state.pc >= this.ast.instructions.length) {
                this.state.pc = 0;
                wraps += 1;
                continue;
            } else if (instruction[0] === "SKIP") {
                this.state.pc += 1;
                continue;
            } else {
                break;
            }
        }
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
                    let l = this.softRead('l');
                    if (l !== undefined) {
                        this.state.lastPort = 'l';
                        return l;
                    }

                    let r = this.read('r');
                    if (r !== undefined) {
                        this.state.lastPort = 'r';
                        return r;
                    }

                    let u = this.read('u');
                    if (u !== undefined) {
                        this.state.lastPort = 'u';
                        return u;
                    }

                    let d = this.read('d');
                    if (d !== undefined) {
                        this.state.lastPort = 'd';
                        return d;
                    }

                    throw this.WAIT_READ;
                }
                case "LAST": {
                    // TODO: Reverse implementation
                    try {
                        return this.read(this.state.lastPort);
                    } catch (e) {
                        return 0;
                    }
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
            case "ANY": {
                this.write('a', value);
                return true;
            }
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

    pass() {
        if (!this.hasInstructions) return true;

        this.waitWrite();

        if (this.stepIncrOp) {
            this.stepIncrOp = false;
            this.incrPc();
            return;
        }

        this.checkPc();

        let [opCode, operands] = this.ast.instructions[this.state.pc];
        let handler = opHandlers[opCode];

        handler.call(this, operands);

        return true;
    }
}
BasicExecutionNode.nodeType = "basicExecution";
BasicExecutionNode.displayName = "Basic Execution Node";

export default BasicExecutionNode;
