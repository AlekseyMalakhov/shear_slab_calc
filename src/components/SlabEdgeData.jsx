import React from "react";

export default class SlabEdgeData extends React.Component {
    //колонна на краю плиты
    constructor(props) {
        super(props);
        this.state = {
            edge_left: false,
            edge_right: false,
            edge_top: false,
            edge_bottom: false,
        };
        this.handleInput = this.handleInput.bind(this);
        this.handleCheckBox = this.handleCheckBox.bind(this);
        this.leftFocus = React.createRef(); //делаем так, чтобы при установки галочки, происходил автофокус соответствующего поля ввода
        this.rightFocus = React.createRef();
        this.topFocus = React.createRef();
        this.bottomFocus = React.createRef();
        this.focusInput = this.focusInput.bind(this);
    }

    handleInput(e) {
        var state = {
            [e.target.id]: Math.abs(Number(e.target.value)),
        };
        this.props.onSlabEdgeDataChange(state);
    }

    handleCheckBox(e) {
        var box = e.target.id;
        this.setState({ [box]: !this.state[box] }, () => {
            this.props.onSlabEdgeDataChange(this.state);
            this.focusInput(box);
        });
    }

    focusInput(id) {
        //делаем автофокус на нужное поле ввода
        switch (id) {
            case "edge_left":
                this.leftFocus.current.focus();
                break;
            case "edge_right":
                this.rightFocus.current.focus();
                break;
            case "edge_top":
                this.topFocus.current.focus();
                break;
            case "edge_bottom":
                this.bottomFocus.current.focus();
                break;
            default:
                console.log("Чето не то=))");
        }
    }

    render() {
        return (
            <div id="slab_e">
                <h5>Укажите расстояние от грани колонны до ближайшего края плиты</h5>
                <div className="form-group">
                    <input type="checkbox" id="edge_left" value="left" onChange={this.handleCheckBox} data-testid="edge_left_yes"></input>
                    <label htmlFor="edge_left">Слева, {this.props.globalState.length_units}:</label>
                    <input
                        type="number"
                        step="0.0001"
                        className="form-control"
                        min="0"
                        id="input_edge_left_dist"
                        ref={this.leftFocus}
                        disabled={!this.state.edge_left}
                        onChange={this.handleInput}
                        data-testid="input_edge_left_dist"
                    ></input>
                </div>

                <div className="form-group">
                    <input type="checkbox" id="edge_right" value="right" onChange={this.handleCheckBox} data-testid="edge_right_yes"></input>
                    <label htmlFor="edge_right">Справа, {this.props.globalState.length_units}:</label>
                    <input
                        type="number"
                        step="0.0001"
                        className="form-control"
                        min="0"
                        id="input_edge_right_dist"
                        ref={this.rightFocus}
                        disabled={!this.state.edge_right}
                        onChange={this.handleInput}
                        data-testid="input_edge_right_dist"
                    ></input>
                </div>

                <div className="form-group">
                    <input type="checkbox" id="edge_top" value="top" onChange={this.handleCheckBox} data-testid="edge_top_yes"></input>
                    <label htmlFor="edge_top">Сверху, {this.props.globalState.length_units}:</label>
                    <input
                        type="number"
                        step="0.0001"
                        className="form-control"
                        min="0"
                        id="input_edge_top_dist"
                        ref={this.topFocus}
                        disabled={!this.state.edge_top}
                        onChange={this.handleInput}
                        data-testid="input_edge_top_dist"
                    ></input>
                </div>

                <div className="form-group">
                    <input type="checkbox" id="edge_bottom" value="bottom" onChange={this.handleCheckBox} data-testid="edge_bottom_yes"></input>
                    <label htmlFor="edge_bottom">Снизу, {this.props.globalState.length_units}:</label>
                    <input
                        type="number"
                        step="0.0001"
                        className="form-control"
                        min="0"
                        id="input_edge_bottom_dist"
                        ref={this.bottomFocus}
                        disabled={!this.state.edge_bottom}
                        onChange={this.handleInput}
                        data-testid="input_edge_bottom_dist"
                    ></input>
                </div>
            </div>
        );
    }
}
