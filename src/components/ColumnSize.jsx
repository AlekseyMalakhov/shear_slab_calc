import React from "react";

export default class ColumnSize extends React.Component {
    constructor(props) {
        super(props);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(e) {
        var state = {
            [e.target.id]: Math.abs(Number(e.target.value)),
        };
        this.props.onColumnSizeChange(state);
    }

    render() {
        return (
            <div>
                <h5>Cечение колонны</h5>
                <div className="form-group">
                    <label htmlFor="input_a_column_size" className="form-label">
                        а, размер вдоль оси Х, {this.props.globalState.length_units}:
                    </label>
                    <input
                        type="number"
                        step="0.0001"
                        className="form-control"
                        min="0"
                        id="input_a_column_size"
                        onChange={this.handleInput}
                        data-testid="input_a_column_size"
                    ></input>
                </div>
                <div className="form-group">
                    <label htmlFor="input_b_column_size" className="form-label">
                        b, размер вдоль оси Y, {this.props.globalState.length_units}:
                    </label>
                    <input
                        type="number"
                        step="0.0001"
                        className="form-control"
                        min="0"
                        id="input_b_column_size"
                        onChange={this.handleInput}
                        data-testid="input_b_column_size"
                    ></input>
                </div>
            </div>
        );
    }
}
