import Row from "react-bootstrap/Row";

export default function Header(props) {
    function toggleHelp() {
        //фиксируем/разфиксируем SVG и открываем/закрываем help
        var fixed = false;
        var show_help = false;
        if (window.innerWidth >= 768) {
            if (props.globalState.svg_position_fixed) {
                fixed = false;
            } else {
                fixed = true;
            }
        } else {
            fixed = false;
        }

        if (props.globalState.show_help) {
            show_help = false;
        } else {
            show_help = true;
        }
        var state = {
            svg_position_fixed: fixed,
            show_help: show_help,
        };
        props.onHelpPush(state);
    }

    return (
        <Row className="top_header mb-3 py-2 h5">
            <div className="col-9 text-left my-auto">
                <span>Расчет на продавливание онлайн по СП 63.13330.2012 by TermenVox. 2020.</span>
            </div>
            <div className="col text-end my-auto">
                <span>v1.0</span>
                <span id="help" onClick={toggleHelp} className="ms-3">
                    <i className="far fa-question-circle"></i>
                </span>
            </div>
        </Row>
    );
}
