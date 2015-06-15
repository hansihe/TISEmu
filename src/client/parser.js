var _ = require('lodash');

function parseLabel(source) {
    let pieces = _.map(source.split(":"), text => text.trim());
    switch (pieces.length) {
        case 1: {
            return [null, pieces[0]]
            break;
        }
        case 2: {
            return pieces;
            break;
        }
        default: {
            throw "";
        }
    }
}

function validateOpcode(args, format, opCode) {
    if (args.length !== format.length) {
        throw opCode + ": Expected " + format.length + " operands, got " + args.length;
    }
    return _.map(_.zip(format, args), ([format, arg]) => format(arg));
}

let addressableRegisters = ["ACC", "NIL", "LEFT", "RIGHT", "UP", "DOWN", "ANY", "LAST"];
function srcValueOperand(value) {
    let intParse = (+value);
    if (!isNaN(intParse)) {
        return intParse;
    } else if (_.contains(addressableRegisters, value)) {
        return value;
    } else {
        throw "invalid operand: " + value;
    }
}
function destValueOperand(value) {
    if (_.contains(addressableRegisters, value)) {
        return value;
    } else {
        throw "invalid operand: " + value;
    }
}

function labelOperand(value) {
    return value;
}

let opCodes = {
    NOP: [],
    MOV: [srcValueOperand, destValueOperand],
    SWP: [],
    SAV: [],
    ADD: [srcValueOperand],
    SUB: [srcValueOperand],
    NEG: [],
    JMP: [labelOperand],
    JEZ: [labelOperand],
    JNZ: [labelOperand],
    JGZ: [labelOperand],
    JLZ: [labelOperand],
    JRO: [srcValueOperand]
};
function parseOpcode(source) {
    let [opCode, ...args] = source.split(/[\s,]+/);
    let format = opCodes[opCode];
    if (!format) {
        throw "Unknown opcode: " + opCode;
    }
    return [opCode, validateOpcode(args, format, opCode)];
}

function trimComment(source) {
    return source.split("#")[0];
}

function parseBreakpoint(source) {
    if (source.startsWith("!")) {
        return [true, source.substr(1)];
    } else {
        return [false, source];
    }
}

function parseToAst(source) {
    let lines = source.toUpperCase().split("\n");
    return _.map(lines, (source, line) => {
        try {
            let [breakpoint, nSource] = parseBreakpoint(source);
            let [label, operation] = parseLabel(trimComment(nSource));
            if (operation) {
                return [label, parseOpcode(operation), breakpoint];
            } else {
                return [label, ["SKIP", []], breakpoint];
            }
        } catch (e) {
            throw "Parse error at line " + line + ": " + e;
        }
    });
}

function processAst(ast) {
    return {
        ast: ast,
        labels: _.zipObject(_.filter(_.map(ast, ([label], line) => [label, line]), ([label]) => label !== null)),
        instructions: _.map(ast, ([label, opcode, breakpoint]) => [opcode, breakpoint])
    }
}

function parse(source) {
    let ast = processAst(parseToAst(source));
    ast.source = source;
    return ast;
}

export default parse;
