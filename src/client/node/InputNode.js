var _ = require('lodash');
var BaseNode = require('./BaseNode');

function parseValues(values) {
  let lines = values.split('\n');
  
  // Remove comments and trim whitespace
  let lineRawValues = _.map(lines, line => _.trim(line.split("#")[0]));
  
  // Parse integers (if existent)
  let lineValues = _.map(lineRawValues, value => {
    if (value.length === 0) return null;
    return +value;
  });
  
  // Remove lines without integers
  let valueList = _.filter(lineValues, value => value !== null);
  
  // Generate sourcemap (valueList key -> line number)
  let sourceMap = _.reduce(lineValues, (acc, value, num) => {
    if (value !== null) {
      acc.push(num);
    }
    return acc;
  }, []);
  
  return {valueList, sourceMap};
}

class InputNode extends BaseNode {
    constructor(machine, source) {
        super(machine, source);

        this.state.text = source.values;
        let {valueList, sourceMap} = parseValues(source.values);

        this.state.values = valueList;
        this.state.sourceMap = sourceMap;

        this.state.currentValue = 0;
    }

    pass() {
        if (this.state.currentValue > this.state.values.length) return true;

        this.waitWrite();
        this.write('a', this.state.values[this.state.currentValue]);
        this.state.currentValue += 1;
        return true;
    }
}
InputNode.nodeType = "input";
InputNode.displayName = "Input Node";
InputNode.getBaseDescriptor = function() {
    return {
        values: ""
    };
};

export default InputNode;
