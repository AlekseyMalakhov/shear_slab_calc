import React from "react";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import ToggleButton from "react-bootstrap/ToggleButton";

export default class SlabEdgeSelect extends React.Component {
    constructor(props) {
        super(props);
        this.handleSelect = this.handleSelect.bind(this);
    }

    handleSelect(value) {
        var state = {
            slab_edge: value,
        };
        this.props.onSlabEdgeSelectChange(state);
    }

    render() {
        return (
            <div>
                <h5 className="mt-3">Колонна рядом с краем плиты: {this.props.globalState.slab_edge ? "Да" : "Нет"}</h5>
                <div className="d-flex flex-column">
                    <ToggleButtonGroup onChange={this.handleSelect} type="radio" name="select_slab_edge">
                        <ToggleButton id="tg3" variant="info" value={false} onChange={this.handleSelect} checked={!this.props.globalState.slab_edge}>
                            Нет
                        </ToggleButton>
                        <ToggleButton
                            id="tg4"
                            variant="info"
                            value={true}
                            onChange={this.handleSelect}
                            checked={this.props.globalState.slab_edge}
                            data-testid="select_slab_edge_yes"
                        >
                            Да
                        </ToggleButton>
                    </ToggleButtonGroup>
                </div>
            </div>
        );
    }
}
