import React from "react";

export default class SlabSize extends React.Component {
    constructor(props) {
        super(props);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(e) {
        var state = {
            [e.target.id]: Math.abs(Number(e.target.value)),
        };
        this.props.onSlabSizeChange(state);
    }

    render() {
        return (
            <div>
                <h5>Cечение плиты</h5>
                <div className="form-group">
                    <label htmlFor="input_t_slab_size" className="form-label">
                        Толщина, {this.props.globalState.length_units}:
                    </label>
                    <input
                        type="number"
                        step="0.0001"
                        className="form-control"
                        min="0"
                        id="input_t_slab_size"
                        onChange={this.handleInput}
                        data-testid="input_t_slab_size"
                    ></input>
                </div>
                <div className="form-group">
                    <label htmlFor="input_a_slab_size" className="form-label">
                        Привязка центра тяжести арматуры, {this.props.globalState.length_units}:
                    </label>
                    <input
                        type="number"
                        step="0.0001"
                        className="form-control"
                        min="0"
                        id="input_a_slab_size"
                        onChange={this.handleInput}
                        data-testid="input_a_slab_size"
                    ></input>
                </div>
            </div>
        );
    }
}
