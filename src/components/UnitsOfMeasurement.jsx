import React from "react";

export default class UnitsOfMeasurement extends React.Component {
    constructor(props) {
        super(props);
        this.handleSelect = this.handleSelect.bind(this);
    }

    handleSelect(e) {
        var state = {
            [e.target.id]: e.target.value,
        };
        this.props.onUnitsChange(state);
    }

    render() {
        return (
            <div>
                <h5>Единицы измерения</h5>
                <div className="form-group">
                    <label htmlFor="force_units" className="form-label">
                        Силовые факторы:
                    </label>
                    <select id="force_units" className="form-select" onChange={this.handleSelect} data-testid="force_units">
                        <option value="т">т, тм</option>
                        <option value="кН">кН, кНм</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="length_units" className="form-label">
                        Линейные размеры:
                    </label>
                    <select id="length_units" className="form-select" onChange={this.handleSelect}>
                        <option value="мм">мм</option>
                        <option value="см">см</option>
                        <option value="м">м</option>
                    </select>
                </div>
            </div>
        );
    }
}
