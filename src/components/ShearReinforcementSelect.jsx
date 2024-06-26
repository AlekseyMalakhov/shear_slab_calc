import React from "react";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import ToggleButton from "react-bootstrap/ToggleButton";

export default class ShearReinforcementSelect extends React.Component {
    constructor(props) {
        super(props);
        this.handleSelect = this.handleSelect.bind(this);
    }

    handleSelect(value) {
        var state = {
            shear_reinforcement: value,
        };
        this.props.onShearReinforcementSelectChange(state);
    }

    render() {
        return (
            <div>
                <h5>Поперечное армирование: {this.props.globalState.shear_reinforcement ? "Да" : "Нет"}</h5>
                <div className="d-flex flex-column">
                    <ToggleButtonGroup onChange={this.handleSelect} type="radio" name="select_s_reinf">
                        <ToggleButton id="tg1" variant="info" value={false} checked={!this.props.globalState.shear_reinforcement}>
                            Нет
                        </ToggleButton>
                        <ToggleButton
                            id="tg2"
                            variant="info"
                            value={true}
                            checked={this.props.globalState.shear_reinforcement}
                            data-testid="select_s_reinf_yes"
                        >
                            Да
                        </ToggleButton>
                    </ToggleButtonGroup>
                </div>
            </div>
        );
    }
}
