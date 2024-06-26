import React from "react";
import Alert from "react-bootstrap/Alert";
import { footer_appear } from "../settings";

export default class Result extends React.Component {
    // строка с результатом
    render() {
        return (
            <div className={window.innerHeight > footer_appear || this.props.globalState.v_width <= 768 ? "result_block" : "displ_none"}>
                <h5>Результат</h5>
                <Alert className="result_alert" variant={this.props.globalState.result_color}>
                    {this.props.globalState.text_result}
                </Alert>
            </div>
        );
    }
}
