import React from "react";
import Button from "react-bootstrap/Button";

export default class ShearReinforcement extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rows: [],
        };
        this.handleSelect = this.handleSelect.bind(this);
        this.handleInputBarsNumber = this.handleInputBarsNumber.bind(this);
        this.addRow = this.addRow.bind(this);
        this.addRowNumber = this.addRowNumber.bind(this);
        this.removeRow = this.removeRow.bind(this);
        this.removeRowNumber = this.removeRowNumber.bind(this);
        this.handleReinforcementRows = this.handleReinforcementRows.bind(this);
        this.removeRowClassChange = this.removeRowClassChange.bind(this);
        this.handleRowsNumber = this.handleRowsNumber.bind(this);
    }

    handleSelect(e) {
        //обрабатывем выбор класса и диаметра арматуры
        var state = {
            [e.target.id]: e.target.value,
        };
        this.props.onShearReinforcementChange(state);
    }

    handleInputBarsNumber(e) {
        //обрабатываем количество стержней вдоль оси Х и У
        var gs = this.props.globalState;
        var value = Math.abs(Number(e.target.value));
        var row_number = Number(e.target.id.slice(e.target.id.lastIndexOf("_") + 1));
        var axis = e.target.id.substring(18, 19);
        var shear_bars_number_obj = gs.shear_bars_number;
        shear_bars_number_obj[axis][row_number] = value;
        var state = {
            shear_bars_number: shear_bars_number_obj,
        };
        this.props.onShearReinforcementChange(state);
    }

    handleReinforcementRows(e) {
        //обрабатываем привязку ряда арматуры к предыдущему ряду
        var gs = this.props.globalState;
        var value = Math.abs(Number(e.target.value));
        var row_number = Number(e.target.id.slice(e.target.id.lastIndexOf("_") + 1));
        var spacing_array = [...gs.input_shear_bars_spacing_to_prev];
        spacing_array[row_number] = value;
        var state = {
            input_shear_bars_spacing_to_prev: spacing_array,
        };
        this.props.onShearReinforcementChange(state);
    }

    handleRowsNumber(e) {
        //обрабатываем количество рядов поперечной арматуры при изменении её в графе input id = shear_bars_row_number
        var new_value = Math.abs(Number(e.target.value));
        var state = {
            shear_bars_row_number: new_value,
        };
        this.props.onShearReinforcementChange(state);
    }

    addRowNumber() {
        //обрабатываем количество рядов арматуры при нажатии кнопки Добавить ряд
        var gs = this.props.globalState;
        var state = {
            shear_bars_row_number: gs.shear_bars_row_number + 1, // берем старое количество рядов и добавляем 1
        };
        this.props.onShearReinforcementChange(state);
    }

    removeRowNumber() {
        //обрабатываем количество рядов арматуры при нажатии кнопки Удалить ряд
        var gs = this.props.globalState;
        var state = {
            shear_bars_row_number: gs.shear_bars_row_number - 1, // берем старое количество рядов и удаляем 1
        };
        this.props.onShearReinforcementChange(state);
    }

    componentDidUpdate(prevProps) {
        //если количество рядов арматуры обновилось - добавляем или удаляем ряд
        if (this.props.globalState.shear_bars_row_number > prevProps.globalState.shear_bars_row_number) {
            this.addRow();
        }
        if (this.props.globalState.shear_bars_row_number < prevProps.globalState.shear_bars_row_number) {
            this.removeRow();
        }
    }

    addRow() {
        //добавляем ряд поперечной арматуры в DOM
        var gs = this.props.globalState;
        var old_rows = this.state.rows; //берем старые html ряды
        var key_number = gs.shear_bars_row_number; // берем новое число рядов
        var rowKey = key_number + "row";
        var new_row = [
            <div key={rowKey + "dddtt"} id={"row_" + key_number}>
                <br></br>
                <div className="form-group">
                    <label htmlFor={"input_shear_bars_spacing_to_prev_" + key_number}>
                        Привязка {key_number} ряда поперечной арматуры к предыдущему ряду, {gs.length_units}:
                    </label>
                    <input
                        type="number"
                        step="0.0001"
                        className="form-control"
                        min="0"
                        id={"input_shear_bars_spacing_to_prev_" + key_number}
                        onChange={this.handleReinforcementRows}
                        data-testid={"input_shear_bars_spacing_to_prev_" + key_number}
                    ></input>
                </div>
                <div className="form-group">
                    <label htmlFor={"shear_bars_number_X_" + key_number}>{key_number} ряд. Количество стержней вдоль оси Х, шт:</label>
                    <input
                        type="number"
                        className="form-control"
                        min="0"
                        id={"shear_bars_number_X_" + key_number}
                        onChange={this.handleInputBarsNumber}
                        data-testid={"shear_bars_number_X_" + key_number}
                    ></input>
                </div>
                <div className="form-group">
                    <label htmlFor={"shear_bars_number_Y_" + key_number}>{key_number} ряд. Количество стержней вдоль оси Y, шт:</label>
                    <input
                        type="number"
                        className="form-control"
                        min="0"
                        id={"shear_bars_number_Y_" + key_number}
                        onChange={this.handleInputBarsNumber}
                        data-testid={"shear_bars_number_Y_" + key_number}
                    ></input>
                </div>
            </div>,
        ];
        var new_rows = old_rows.concat(new_row); // добавляем новый ряд к старым - делаем это имеено конкатам, чтобы родился новый инстанс эррея. Иначе реакт не заметит что мы внесли изменения в эррей.

        var shear_bars_number_obj = gs.shear_bars_number; //делаем копию объекта в котором прописано сколько у нас стержней вдоль оси Х и У в каждом ряду
        shear_bars_number_obj.X[key_number] = 0; // пишем что в нашем новом ряду пока 0 стержней вдоль Х и У
        shear_bars_number_obj.Y[key_number] = 0;

        var local_state = {
            rows: new_rows,
        };
        this.setState(local_state, function () {
            var state = {
                shear_bars_number: shear_bars_number_obj,
            };
            this.props.onShearReinforcementChange(state);
        });
    }

    removeRow() {
        //удаляем ряд поперечки из DOM
        var gs = this.props.globalState;
        var last_row_number = this.state.rows.length - 1; //берем позицию последнего ряда в эррее
        var new_rows = [...this.state.rows]; //снимаем копию старого эррэя с html элементами рядов
        new_rows.splice(last_row_number, 1); // удаляем из него последний ряд

        var last_row_bars_number = gs.shear_bars_number.X.length - 1; //берем позицию последних чисел в количестве стержней в ряду
        var shear_bars_number_X = [...gs.shear_bars_number.X]; //снимаем копии с эрреев с количеством стержней в ряду
        var shear_bars_number_Y = [...gs.shear_bars_number.Y];
        var input_shear_bars_spacing_to_prev = [...gs.input_shear_bars_spacing_to_prev]; //снимам копию с эррея с отступами

        shear_bars_number_X.splice(last_row_bars_number, 1); //удаляем количество стержней относящееся к последнему ряду
        shear_bars_number_Y.splice(last_row_bars_number, 1);
        input_shear_bars_spacing_to_prev.splice(last_row_bars_number, 1); //удаляем отступы относящиеся к последнему ряду

        var local_state = {
            rows: new_rows,
        };
        this.setState(local_state, function () {
            var state = {
                shear_bars_number: {
                    X: shear_bars_number_X,
                    Y: shear_bars_number_Y,
                },
                input_shear_bars_spacing_to_prev: input_shear_bars_spacing_to_prev,
            };
            this.props.onShearReinforcementChange(state);
        });
    }

    removeRowClassChange() {
        //если рядом 2 или меньше - скрываем кнопку удалить
        if (this.props.globalState.shear_bars_row_number <= 2) {
            var className = "invisible";
        }
        return className;
    }

    render() {
        return (
            <div className="" id="shear_r">
                <h5>Характеристики поперечного армирования</h5>
                <div className="form-group">
                    <label htmlFor="shear_bars_grade">Класс поперечной арматуры:</label>
                    <select id="shear_bars_grade" className="form-select" onChange={this.handleSelect} data-testid="shear_bars_grade">
                        <option value="a240c">А240С</option>
                        <option value="a400c">А400С</option>
                        <option value="a500c">А500С</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="shear_bars_diameter">Диаметр поперечной арматуры:</label>
                    <select id="shear_bars_diameter" className="form-select" onChange={this.handleSelect} data-testid="shear_bars_diameter">
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="8">8</option>
                        <option value="10">10</option>
                        <option value="12">12</option>
                        <option value="14">14</option>
                        <option value="16">16</option>
                        <option value="18">18</option>
                        <option value="20">20</option>
                        <option value="22">22</option>
                        <option value="25">25</option>
                        <option value="28">28</option>
                        <option value="32">32</option>
                        <option value="36">36</option>
                        <option value="40">40</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="shear_bars_row_number">Количество рядов поперечной арматуры, шт:</label>
                    <input
                        type="number"
                        className="form-control"
                        min="2"
                        id="shear_bars_row_number"
                        value={this.props.globalState.shear_bars_row_number}
                        onKeyDown={(e) => e.preventDefault()}
                        onChange={this.handleRowsNumber}
                        data-testid="shear_bars_row_number"
                    ></input>
                </div>
                <br></br>
                <div id="row_1">
                    <div className="form-group">
                        <label htmlFor="input_shear_bars_spacing_to_prev_1">
                            Привязка 1 ряда поперечной арматуры к грани колонны, {this.props.globalState.length_units}:
                        </label>
                        <input
                            type="number"
                            step="0.0001"
                            className="form-control"
                            min="0"
                            id="input_shear_bars_spacing_to_prev_1"
                            onChange={this.handleReinforcementRows}
                            data-testid="input_shear_bars_spacing_to_prev_1"
                        ></input>
                    </div>
                    <div className="form-group">
                        <label htmlFor="shear_bars_number_X_1">1 ряд. Количество стержней вдоль оси Х, шт:</label>
                        <input
                            type="number"
                            className="form-control"
                            min="0"
                            id="shear_bars_number_X_1"
                            onChange={this.handleInputBarsNumber}
                            data-testid="shear_bars_number_X_1"
                        ></input>
                    </div>
                    <div className="form-group">
                        <label htmlFor="shear_bars_number_Y_1">1 ряд. Количество стержней вдоль оси Y, шт:</label>
                        <input
                            type="number"
                            className="form-control"
                            min="0"
                            id="shear_bars_number_Y_1"
                            onChange={this.handleInputBarsNumber}
                            data-testid="shear_bars_number_Y_1"
                        ></input>
                    </div>
                </div>
                <br></br>
                <div id="row_2">
                    <div className="form-group">
                        <label htmlFor="input_shear_bars_spacing_to_prev_2">
                            Привязка 2 ряда поперечной арматуры к предыдущему ряду, {this.props.globalState.length_units}:
                        </label>
                        <input
                            type="number"
                            step="0.0001"
                            className="form-control"
                            min="0"
                            id="input_shear_bars_spacing_to_prev_2"
                            onChange={this.handleReinforcementRows}
                            data-testid="input_shear_bars_spacing_to_prev_2"
                        ></input>
                    </div>
                    <div className="form-group">
                        <label htmlFor="shear_bars_number_X_2">2 ряд. Количество стержней вдоль оси Х, шт:</label>
                        <input
                            type="number"
                            className="form-control"
                            min="0"
                            id="shear_bars_number_X_2"
                            onChange={this.handleInputBarsNumber}
                            data-testid="shear_bars_number_X_2"
                        ></input>
                    </div>
                    <div className="form-group">
                        <label htmlFor="shear_bars_number_Y_2">2 ряд. Количество стержней вдоль оси Y, шт:</label>
                        <input
                            type="number"
                            className="form-control"
                            min="0"
                            id="shear_bars_number_Y_2"
                            onChange={this.handleInputBarsNumber}
                            data-testid="shear_bars_number_Y_2"
                        ></input>
                    </div>
                </div>

                {this.state.rows}
                <Button variant="success" onClick={this.addRowNumber}>
                    Добавить ряд
                </Button>
                <Button
                    variant="danger"
                    className={"ms-3 " + (this.props.globalState.shear_bars_row_number > 2 ? "" : "invisible")}
                    onClick={this.removeRowNumber}
                >
                    Удалить ряд
                </Button>
            </div>
        );
    }
}
