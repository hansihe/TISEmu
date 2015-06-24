var BasicExecutionNode = require('./node/BasicExecutionNode');
var TISMachineManager = require('./TISMachine').default;
var nodeTypes = require('./TISMachine').nodeTypes;

var React = require('react');
var Marty = require('marty');
Marty.HttpStateSource.removeHook('parseJSON');
var AppComponent = require('./component/AppBase');

function updateBounds(bounds, value) {
    if (value < bounds[0]) {
        bounds[0] = value;
    }
    if (value > bounds[1]) {
        bounds[1] = value;
    }
    return bounds;
}

function findDimentions(nodes) {
    if (nodes.length === 0) { return [0, 0] }

    let xBounds = [nodes[0].position[0], nodes[0].position[0]];
    let yBounds = [nodes[0].position[1], nodes[0].position[1]];

    _.each(nodes, descr => {
        xBounds = updateBounds(xBounds, descr.position[0]);
        yBounds = updateBounds(yBounds, descr.position[1]);
    });

    return {
        x: {
            lower: xBounds[0],
            upper: xBounds[1]
        },
        y: {
            lower: yBounds[0],
            upper: yBounds[1]
        }
    };
}


var Constants = Marty.createConstants([
    'FETCH_PROGRAM',
    'PUBLISH_PROGRAM'
]);


class TopBarComponent extends AppComponent {
    render() {
        let cyclesDisplay;
        if (this.app.manager.isMachineCreated()) {
            cyclesDisplay = <div className="cycleDisplay">
                Cycle: {this.app.manager.getMachine().state.cycle}
            </div>;
        }

        return <div className="topBar">
            <div className="heading">TISE</div>
            <a href="#" onClick={this.run.bind(this)}>Run</a>
            <a href="#" onClick={this.runFast.bind(this)}>Fast</a>
            <a href="#" onClick={this.step.bind(this)}>Step</a>
            <a href="#" onClick={this.stop.bind(this)}>Stop</a>
            <a href="#" onClick={this.save.bind(this)}>Save Program</a>
            {cyclesDisplay}
        </div>;
    }

    stop() {
        this.app.managerStore.stop();
    }
    step() {
        this.app.managerStore.step();
    }
    run() {
        this.app.managerStore.run(10, 10);
    }
    runFast() {
        this.app.managerStore.run(10, 200);
    }
    save() {
        this.app.managerStore.publishProgram();
    }
}
let TopBarComponentContainer = Marty.createContainer(TopBarComponent, {
    listenTo: ['managerStore']
});


var ModalRenderComponent = require('./component/ModalRender');


// [cycleDelay, ticksPerCycle]
let speeds = [
    [10, 1],
    [10, 10],
];

class MachineManagerStore extends Marty.Store {
    constructor(options) {
        super(options);
        this.statusTypes = {
            IDLE: "IDLE",
            RUNNING: "RUNNING"
        };
        this.state = {
            status: this.statusTypes.IDLE,
            running: false
        };
    }

    create() {
        if (!this.app.manager.isMachineCreated()) {
            this.app.manager.create();
            this.setState({
                status: this.statusTypes.RUNNING
            });
            return true;
        }
        return false;
    }
    destroy() {
        if (this.app.manager.isMachineCreated()) {
            this.app.manager.destroy();
            this.setState({
                status: this.statusTypes.IDLE
            });
            return true;
        }
        return false;
    }

    _runStep() {
        if (this.state.running) {
            for (let i = 0; i < this.state.runSpeed[1]; i++) {
                if (this.app.manager.getMachine().state.breakpoint) return;
                this.app.manager.getMachine().step();
            }
            this.hasChanged();

            setTimeout(this._runStep.bind(this), this.state.runSpeed[0]);
        }
    }
    run(cycleDelay, ticksPerCycle) {
        this.state.runSpeed = [cycleDelay, ticksPerCycle];

        if (this.state.running) return;
        this.step();
        this.state.running = true;

        this._runStep();
    }
    step() {
        if (!this.create()) {
            this.app.manager.getMachine().step();
        }
        this.state.running = false;
        this.hasChanged();
    }
    stop() {
        this.state.running = false;
        this.destroy();
    }

    addNode(position, type) {
        this.app.manager.addNode(position, type);
        this.hasChanged();
    }
    delNode(position) {
        this.app.manager.delNode(position);
        this.hasChanged();
    }

    fromSource(source) {
        this.app.manager.fromSource(source);
        this.hasChanged();
    }
    toSource() {
        return this.app.manager.toSource();
    }

    publishProgram() {
        return this.app.programStore.saveProgram(this.toSource());
    }
}

class ModalStore extends Marty.Store {
    constructor(options) {
        super(options);
        this.modalTypes = {
            nodeAddDialog: "nodeAddDialog",
            nodeDelDialog: "nodeDelDialog",
            saveJson: "saveJson",
            loadJson: "loadJson"
        };
        this.state = {
            current: null
        };
    }

    displayNodeAddDialog(pos) {
        this.displayModal(this.modalTypes.nodeAddDialog, pos);
    }
    displayNodeDelDialog(pos) {
        this.displayModal(this.modalTypes.nodeDelDialog, pos);
    }

    displaySaveJsonDialog() {
        this.displayModal(this.modalTypes.saveJson, JSON.stringify(this.app.managerStore.toSource()));
    }
    displayLoadJsonDialog() {
        this.displayModal(this.modalTypes.loadJson, (text) => {
            this.app.managerStore.fromSource(JSON.parse(text));
        });
    }

    displayModal(type, ...args) {
        this.setState({
            current: [type, args]
        });
    }
    closeModal() {
        this.setState({
            current: null
        });
    }
    getModal() {
        return this.state.current;
    }
}

class ProgramAPI extends Marty.HttpStateSource {
    constructor(options) {
        super(options);
        this.baseUrl = "/api";
    }

    getProgram(id) {
        return this.get('/Program/' + id)
            .then(res => {
                if (res.ok) {
                    return res.json().then(json => {
                        return json.program.source;
                    });
                }
                throw new Error("Could not get program", res);
            });
    }

    publishProgram(source) {
        console.log(source);
        return this.post({
            url: '/Program',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(source)
        })
            .then(res => {
                if (res.ok) {
                    return res.json().then(json => {
                        return json.program.id;
                    });
                }
                throw new Error("Could not add program", res);
            });
    }
}

class ProgramQueries extends Marty.Queries {
    fetchProgram(id) {
        this.dispatch(Constants.FETCH_PROGRAM_STARTING, id);
        return this.app.programAPI.getProgram(id)
            .then(program => {
                this.dispatch(Constants.FETCH_PROGRAM, id, program);
                return program;
            })
            .catch(err => {
                this.dispatch(Constants.FETCH_PROGRAM_FAILED, id);
                return err;
            });
    }
}

class ProgramActions extends Marty.ActionCreators {
    publishProgram(source) {
        this.dispatch(Constants.PUBLISH_PROGRAM_STARTING, source);
        return this.app.programAPI.publishProgram(source)
            .then(id => {
                this.dispatch(Constants.PUBLISH_PROGRAM, source, id);
                return id;
            })
            .catch(err => {
                this.dispatch(Constants.PUBLISH_PROGRAM_FAILED, source, err);
                return err;
            });
    }
}

class ProgramStore extends Marty.Store {
    constructor(options) {
        super(options);
        this.state = {
            programs: {}
        };
        this.handlers = {
            programFetched: Constants.FETCH_PROGRAM,
            programPublished: Constants.PUBLISH_PROGRAM
        };
    }

    programFetched(id, program) {
        console.log(id, program);
        this.state.programs[id] = program;
        this.hasChanged();
    }
    programPublished(program, id) {
        this.state.programs[id] = program;
        this.hasChanged();
    }

    fetchProgram(id) {
        return this.fetch({
            id: id,
            locally() {
                return this.state.programs[id];
            },
            remotely() {
                return this.app.programQueries.fetchProgram(id);
            }
        });
    }

    getProgram(id) {
        return this.state.programs[id];
    }

    loadProgram(id) {
        let fetch = this.fetchProgram(id);
        fetch.toPromise().then(() => {
            this.app.managerStore.fromSource(this.getProgram(id));
        });
        return fetch;
    }

    saveProgram(source) {
        let promise = this.app.programActions.publishProgram(source);
        return promise
            .then(id => {
                console.log(id);
                this.app.router.transitionTo('/' + id);
                return id;
            });
    }
}

class Application extends Marty.Application {
    constructor(options) {
        super(options);

        this.contants = Constants;
        this.manager = new TISMachineManager();
        this.register('managerStore', MachineManagerStore);
        this.register('modalStore', ModalStore);

        this.register('programAPI', ProgramAPI);
        this.register('programQueries', ProgramQueries);
        this.register('programActions', ProgramActions);
        this.register('programStore', ProgramStore);

        this.manager.fromSource({
            nodes: [
            {
                type: "basicExecution",
                position: [0, 0],
                code: ""
            }
            ]
        });
    }
}

var Router = require('react-router');
var { Route, DefaultRoute, RouteHandler, HistoryLocation } = Router;

class RootComponent extends React.Component {
    constructor(props, context) {
        super(props, context);
    }

    render() {
        return <div className="appContainer">
            <ModalRenderComponent/>
            <TopBarComponentContainer/>
            <RouteHandler/>
        </div>;
    }
}

var EmulatorDisplayComponent = require('./component/EmulatorDisplayComponent');

var FetchProgramContainer = Marty.createContainer(EmulatorDisplayComponent, {
    listenTo: 'programStore',
    fetch: {
        program() {
            return this.app.programStore.loadProgram(this.props.params.programId);
        }
    },
    pending() {
        return <div>Loading</div>;
    },
    failed() {
        return <div>Failed to fetch program :(<br/>It may not exist.</div>;
    }
});

var routes = (
    <Route handler={RootComponent}>
        <DefaultRoute handler={EmulatorDisplayComponent}/>
        <Route path="/:programId" handler={FetchProgramContainer}/>
    </Route>
);

window.onload = function() {
    var app = new Application();
    window.app = app;

    let router = Router.create({
        routes: routes,
        location: HistoryLocation
    });
    app.router = router;

    router.run(Root => {
        React.render((
            <Marty.ApplicationContainer app={app}> 
                <Root/>
            </Marty.ApplicationContainer>
        ), document.body);
    });

//    React.render(
//            <Marty.ApplicationContainer app={app}>
//                <RootComponentContainer/>
//            </Marty.ApplicationContainer>, document.body);
}
