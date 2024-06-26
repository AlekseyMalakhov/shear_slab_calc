import React from "react";

export default class Concrete extends React.Component {
    constructor(props) {
        super(props);
        this.handleSelect = this.handleSelect.bind(this);
        this.handleInput = this.handleInput.bind(this);
    }

    handleSelect(e) {
        var state = {
            concrete_grade: e.target.value,
        };
        this.props.onConcreteChange(state);
    }

    handleInput(e) {
        var state = {
            [e.target.id]: Math.abs(Number(e.target.value)),
        };
        this.props.onConcreteChange(state);
    }

    render() {
        return (
            <div>
                <h5>Бетон</h5>
                <div className="form-group">
                    <label htmlFor="concrete_grade" className="form-label">
                        Класс бетона:
                    </label>
                    <select id="concrete_grade" className="form-select" onChange={this.handleSelect} data-testid="concrete_grade">
                        <option value="b10">В10</option>
                        <option value="b15">В15</option>
                        <option value="b20">В20</option>
                        <option value="b25">В25</option>
                        <option value="b30">В30</option>
                        <option value="b35">В35</option>
                        <option value="b40">В40</option>
                        <option value="b45">В45</option>
                        <option value="b50">В50</option>
                        <option value="b55">В55</option>
                        <option value="b60">В60</option>
                        <option value="b70">В70</option>
                        <option value="b80">В80</option>
                        <option value="b90">В90</option>
                        <option value="b100">В100</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="gamma_b" className="form-label">
                        Коэффициент γb:
                    </label>
                    <select id="gamma_b" className="form-select" onChange={this.handleInput}>
                        <option value="0.9">0,9</option>
                        <option value="1">1</option>
                    </select>
                </div>
            </div>
        );
    }
}
