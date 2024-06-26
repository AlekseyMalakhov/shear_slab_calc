import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import ToggleButton from "react-bootstrap/ToggleButton";

export default function OpeningIsNearSelect(props) {
    function handleSelect(value) {
        var state = {
            openingIsNear: value,
        };
        props.onOpeningIsNearSelectChange(state);
    }

    return (
        <div>
            <h5 className="mt-3">Отверстие рядом с колонной: {props.globalState.openingIsNear ? "Да" : "Нет"}</h5>
            <div className="d-flex flex-column">
                <ToggleButtonGroup onChange={handleSelect} type="radio" name="opening_is_near">
                    <ToggleButton id="tg5" variant="info" value={false} checked={!props.globalState.openingIsNear}>
                        Нет
                    </ToggleButton>
                    <ToggleButton id="tg6" variant="info" value={true} checked={props.globalState.openingIsNear} data-testid="opening_is_near_yes">
                        Да
                    </ToggleButton>
                </ToggleButtonGroup>
            </div>
        </div>
    );
}
