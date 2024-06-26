import HelpLoad from "./HelpLoad";

export default function Loads(props) {
    function handleInput(e) {
        var state = {
            [e.target.id]: Number(e.target.value),
        };
        props.onLoadChange(state);
    }

    return (
        <form>
            <h5>
                Нагрузки{" "}
                <span>
                    <HelpLoad />
                </span>
            </h5>
            <div className="form-group">
                <label htmlFor="input_n_load" className="form-label">
                    Продольная сила N, {props.globalState.force_units}:
                </label>
                <input
                    type="number"
                    step="0.0001"
                    className="form-control"
                    min="0"
                    id="input_n_load"
                    onChange={handleInput}
                    data-testid="input_n_load"
                ></input>
            </div>
            <div className="form-group">
                <label htmlFor="input_mx_load" className="form-label">
                    Изгибающий момент Mx, {props.globalState.force_units}м:
                </label>
                <input
                    type="number"
                    step="0.0001"
                    className="form-control"
                    id="input_mx_load"
                    onChange={handleInput}
                    data-testid="input_mx_load"
                ></input>
            </div>
            <div className="form-group">
                <label htmlFor="input_my_load" className="form-label">
                    Изгибающий момент My, {props.globalState.force_units}м:
                </label>
                <input
                    type="number"
                    step="0.0001"
                    className="form-control"
                    id="input_my_load"
                    onChange={handleInput}
                    data-testid="input_my_load"
                ></input>
            </div>
        </form>
    );
}
