import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";

export default function HelpLoad() {
    return (
        <OverlayTrigger
            trigger="click"
            rootClose={true}
            placement="right"
            overlay={
                <Popover id="popover-basic">
                    <Popover.Header as="h3">Направление моментов</Popover.Header>
                    <Popover.Body>
                        Моменты Мх и Му это моменты <b>вдоль</b> осей Х и Y, а не относительно. Почему? Потому что такой подход принят в СП.
                    </Popover.Body>
                </Popover>
            }
        >
            <i id="help_m" className="far fa-question-circle"></i>
        </OverlayTrigger>
    );
}
