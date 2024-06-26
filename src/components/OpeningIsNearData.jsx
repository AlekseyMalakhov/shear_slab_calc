import { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";

export default function OpeningIsNearData(props) {
    //отверстия рядом с колонной. Кажды раз когда реакт запускает обновление стейта мы проигрываем эту функцию (компонент) по новому.
    const [openings_number, setOpeningsNumber] = useState(["", 1]); // эррей с номерами отверстий. Для удобства нумерация начинается с 1. Отверстие 1 - позиция 1. Позиция 0 символизирует что у нас нет отверстия под номером 0
    const [input_openings, setOpenings] = useState({
        //объект с характеристиками отверстий
        a: [0, ""], //Размер вдоль оси Х. Позиция 0 забита нулями т.к. у нас нет отверстия номер 0. Сделано для упрощения понимания.
        b: [0, ""], //Размер вдоль оси Y
        X: [0, ""], //Привязка вдоль оси Х
        Y: [0, ""], //Привязка вдоль оси Y
    });

    function handleInput(e) {
        //обрабатываем ввод пользователя
        var value_type = e.target.id.substring(8, 9); // тип принятых данных (ширина, длина, привязка отверстия);
        var op_number = Number(e.target.id.slice(e.target.id.lastIndexOf("_") + 1)); //номер отверстия
        var new_op_chract = { ...input_openings }; //снимаем копию со старого объекта с характеристиками
        if (e.target.value === "") {
            //забиваем ввод пользователя в нужную ячейку
            new_op_chract[value_type][op_number] = "";
        } else {
            new_op_chract[value_type][op_number] = Number(e.target.value);
        }
        setOpenings(new_op_chract); //обновляем стейт новым объектом свойств
    }

    function addOpeningNumber() {
        //добавляем отверстие
        var opening_n = openings_number.length - 1; //получаем номер последнего отверстия
        opening_n++; //прибавляем 1 - получаем номер нового отверстия
        var new_openings_number = [...openings_number]; //снимаем копию со старого эррея с номерами отверстий
        new_openings_number.push(opening_n); //добавляем в него номер нового отверстия
        setOpeningsNumber(new_openings_number); //обновляем стейт новым эрреем отверстий

        var new_openings = { ...input_openings }; //снимаем копию с эррея с характеристиками отверстий
        var id;
        for (id in new_openings) {
            new_openings[id][opening_n] = ""; // забиваем ряд пустых характеристик для нового отверстия. Это нужно чтобы при первом вводе характеристик в новое отверстие исключить предупреждение что "A component is changing an uncontrolled input of type number to be controlled"
        }
        setOpenings(new_openings);
    }

    function removeOpeningNumber(e) {
        //удаляем отверстие
        if (openings_html.length === 2) {
            // если у нас осталось последнее отверстие - просто сворачиваем панель отверстий
            props.onOpeningIsNearChange({ openingIsNear: false });
        } else {
            var op_remove = Number(e.target.id.substring(9)); //получаем номер отверстия;
            var new_openings_number = [...openings_number]; //снимаем копию со старого эррея с номерами отверстий
            new_openings_number[op_remove] = "removed";
            setOpeningsNumber(new_openings_number); //обновляем эррей номеров отверстий

            var new_openings = { ...input_openings }; //снимаем копию с эррея с характеристиками отверстий
            var id;
            for (id in new_openings) {
                new_openings[id][op_remove] = ""; //характеристики забиваем пустыми строками
            }
            setOpenings(new_openings); //обновляем стейт новым объектом свойств
        }
    }

    useEffect(() => {
        //каждый раз, когда характеристики отверстий меняются мы отправляем характеристики отверстий в глобальный стейт
        props.onOpeningIsNearChange({ input_openings: input_openings });
    }, [input_openings]);

    const openings_html = [""]; //каждый раз при ререндере мы создаем отверстия заново из эррея номеров отверстий и объекта содержащего характеристики отверстий
    var nbr = 1; //номер отверстия для отображения
    for (let i = 1; i < openings_number.length; i++) {
        if (openings_number[i] !== "removed") {
            //удаленные отверстия не создаем
            var new_opening = (
                <fieldset id={"opening_" + i} key={i + "opn"} className="border p-3 mb-3">
                    <button
                        id={"op_close_" + i}
                        type="button"
                        className={nbr === 1 ? "btn-close invisible" : "btn-close"}
                        aria-label="Close"
                        onClick={removeOpeningNumber}
                        style={{ float: "right", marginTop: "3px" }}
                    ></button>
                    <h5>Отверстие {nbr}</h5>
                    <div className="form-group">
                        <label htmlFor={"opening_a_" + i}>Размер вдоль оси Х, {props.globalState.length_units}:</label>
                        <input
                            type="number"
                            step="0.0001"
                            className="form-control"
                            min="0"
                            id={"opening_a_" + i}
                            value={input_openings.a[i]}
                            onChange={handleInput}
                            data-testid={"opening_a_" + i}
                        ></input>{" "}
                        {/* элементы помнят ввод пользователя (value) - -получают его из стейта */}
                    </div>
                    <div className="form-group">
                        <label htmlFor={"opening_b_" + i}>Размер вдоль оси Y, {props.globalState.length_units}:</label>
                        <input
                            type="number"
                            step="0.0001"
                            className="form-control"
                            min="0"
                            id={"opening_b_" + i}
                            value={input_openings.b[i]}
                            onChange={handleInput}
                            data-testid={"opening_b_" + i}
                        ></input>
                    </div>
                    <div className="form-group">
                        <label htmlFor={"opening_X_" + i}>Привязка вдоль оси Х, {props.globalState.length_units}:</label>
                        <input
                            type="number"
                            step="0.0001"
                            className="form-control"
                            id={"opening_X_" + i}
                            value={input_openings.X[i]}
                            onChange={handleInput}
                            data-testid={"opening_X_" + i}
                        ></input>
                    </div>
                    <div className="form-group">
                        <label htmlFor={"opening_Y_" + i}>Привязка вдоль оси Y, {props.globalState.length_units}:</label>
                        <input
                            type="number"
                            step="0.0001"
                            className="form-control"
                            id={"opening_Y_" + i}
                            value={input_openings.Y[i]}
                            onChange={handleInput}
                            data-testid={"opening_Y_" + i}
                        ></input>
                    </div>
                </fieldset>
            );
            openings_html.push(new_opening);
            nbr++;
        }
    }

    return (
        <div id="opening_near">
            <h5>Укажите размер отверстия, а также привязку центра отверстия к центру колонны</h5>
            {openings_html}
            <Button variant="success" onClick={addOpeningNumber} data-testid="add_opening">
                Добавить отверстие
            </Button>
        </div>
    );
}
