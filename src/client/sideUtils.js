var _ = require('lodash');

// The order of these are actually important. They decide the order in which the ANY opcode with read/write.
export var nodeSidePairs = [
    ['l', [-1, 0]],
    ['r', [1, 0]],
    ['u', [0, -1]],
    ['d', [0, 1]]
];

export var nodeSides = _.zipObject(nodeSidePairs);

export function getSide(side) {
    let resp = nodeSides[side];
    if (!resp) {
        throw "No such side: " + side;
    }
    return resp;
}

export function opositeSide(sideName) {
    switch (sideName) {
        case 'l': return 'r';
        case 'r': return 'l';
        case 'u': return 'd';
        case 'd': return 'u';
    }
}

export function sumPositions(pos1, pos2) {
    return _.zipWith(pos1, pos2, _.add);
}
