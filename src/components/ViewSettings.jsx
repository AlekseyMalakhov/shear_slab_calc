export default function ViewSettings(props) {
    function handleCheckBox(e) {
        var box = e.target.id;
        props.onViewSettingstChange({ [box]: !props.globalState[box] });
    }

    return (
        <div className={props.className}>
            <div className="form-check">
                <input type="checkbox" className="form-check-input" id="u_show" value="false" defaultChecked onChange={handleCheckBox}></input>
                <label htmlFor="u_show" className="form-check-label">
                    Показать расчетный контур
                </label>
            </div>
            <div className="form-check">
                <input type="checkbox" className="form-check-input" id="in_out_asw_show" value="false" onChange={handleCheckBox}></input>
                <label htmlFor="in_out_asw_show" className="form-check-label">
                    Показать наружный и внутренний контур учета поперечной арматуры
                </label>
            </div>
            <div className="form-check">
                <input type="checkbox" className="form-check-input" id="op_tangents_show" value="false" onChange={handleCheckBox}></input>
                <label htmlFor="op_tangents_show" className="form-check-label">
                    Показать касательные к отверстиям
                </label>
            </div>
        </div>
    );
}
