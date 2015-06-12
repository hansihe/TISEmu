var React = require('react');

class AppComponent extends React.Component {
    constructor(props, context) {
        super(props, context);
        this.app = context.app;
    }
}
AppComponent.contextTypes = {
    app: React.PropTypes.object.isRequired
};

export default AppComponent;
