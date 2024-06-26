import React, { Fragment } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";

import Loads from "./components/Loads";
import Collapse from "react-bootstrap/Collapse";
import ShearReinforcementSelect from "./components/ShearReinforcementSelect";
import SlabEdgeSelect from "./components/SlabEdgeSelect";
import OpeningIsNearSelect from "./components/OpeningIsNearSelect";
import { footer_appear, concrete_properties, rebar_properies, unitFactor } from "./settings";
import Result from "./components/Result";
import UnitsOfMeasurement from "./components/UnitsOfMeasurement";
import ColumnSize from "./components/ColumnSize";
import SlabSize from "./components/SlabSize";
import Concrete from "./components/Concrete";
import ShearReinforcement from "./components/ShearReinforcement";
import Sketch from "./components/Sketch";
import SlabEdgeData from "./components/SlabEdgeData";
import Header from "./components/Header";
import Help from "./components/Help";
import ViewSettings from "./components/ViewSettings";
import OpeningIsNearData from "./components/OpeningIsNearData";
import {
    checkDataAdequacy,
    findEmptyOps,
    checkOpeningDistance,
    findAngleReal,
    findIntersect,
    mergeOpenings,
    tangCenter,
    findUIntersectPoints,
    addCornersU,
    checkCirclesOpenings,
    createInsufficientPhrase,
} from "./lib";
import exportToWord from "./exportToWord";

// всякие второстепенные исходные данные

//система координат
//Углы всегда отсчитываются от вертикальной оси по часовой стрелке
//если в тексте комментариев встретятся нумерация квадрантов, то я нумеровал их так
/*                                      
            /|\ Y
       4     |     1
             |
     --------|--------> X
             |
       3     |     2

или так

            /|\ Y
       1     |     2
             |
     --------|--------> X
             |
       4     |     3
    
    Т.е. углы всегда от отсчитываются от вертикальной оси Y по часовой стрелке, а номера квадрантов могут быть самые разные=)
*/

//всякие вспомогательные функции

//основные компоненты

class App extends React.Component {
    // это наш главные самый верхний компонент в котором соединяются все нижние компоненты и который выполняет все вычисления
    constructor(props) {
        super(props);
        this.state = {
            // это наш глобал стейт в который мы закидываем все исходные данные для расчета. Мы его спускаем всем компонентам, чтобы он был доступен везде
            text_result: "Заполните все графы с данными для расчета",
            result_color: "secondary",
            asw_tot: 0,
            aswCircles: [],
            out_asw_square: [1, 1, 1, 1],
            out_asw_square_string: "0,0 0,0 0,0 0,0",
            in_asw_square: [1, 1, 1, 1],
            in_asw_square_string: "0,0 0,0 0,0 0,0",
            n_load: 0, //переменные есть со словом input и без. Со словом input, это то, что мы вводим в графы инпут сами. Эти числа могут быть в м, кН, мм, м ит.д.
            mx_load: 0,
            my_load: 0,
            input_n_load: 0, //переменные без слова input это то, что программа использует в расчете. Они всегда в кН или мм. Получаются приведением переменых без инпут
            input_mx_load: 0, // к одним единицам измерения кН и мм
            input_my_load: 0,
            a_column_size: 0,
            b_column_size: 0,
            input_a_column_size: 1,
            input_b_column_size: 1,
            concrete_grade: "b10",
            shear_bars_grade: "a240c",
            shear_bars_diameter: "6",
            shear_bars_row_number: 2,
            shear_bars_spacing_to_prev: [0],
            input_shear_bars_spacing_to_prev: [0],
            shear_bars_number: {
                X: [0],
                Y: [0],
            },
            force_units: "т",
            length_units: "мм",
            t_slab_size: 0,
            a_slab_size: 0,
            input_t_slab_size: "",
            input_a_slab_size: "",
            shear_reinforcement: false,
            slab_edge: false,
            slab_edge_type: false,
            openingIsNear: false,
            scaleFactorSize: [1, 1],
            columnDisplayCoords: [1, 1, 1, 1],
            columnRealCoords: [1, 1, 1, 1],
            columnDisplayString: "",
            uDisplayString: "",
            slabEdgeString: "",
            uDisplayCoords: [1, 1, 1, 1],
            uRealCoords: [1, 1, 1, 1],
            uCornersAngles: [1, 1, 1, 1],
            slabEdgeCoords: [1, 1, 1, 1],
            slabEdgeRealCoords: [1, 1, 1, 1],
            input_edge_left_dist: 10000,
            input_edge_right_dist: 10000,
            input_edge_top_dist: 10000,
            input_edge_bottom_dist: 10000,
            edge_left_dist: 10000,
            edge_right_dist: 10000,
            edge_top_dist: 10000,
            edge_bottom_dist: 10000,
            edge_left: false,
            edge_right: false,
            edge_top: false,
            edge_bottom: false,
            circlesX: [],
            circlesY: [],
            svg_size: 500,
            svg_position_fixed: true,
            openings: {},
            input_openings: {},
            openingsDisplayString: [""],
            openingsDisplayCoords: [[1, 1, 1, 1]],
            openingsRealCoords: [[1, 1, 1, 1]],
            opening_tangents: [
                [[]], // это касательная к нулевому отверстию которого у нас нет
                [
                    // это 4 касательных к 1 отверстию которое всегда подгружается по умолчанию
                    [250, 250],
                    [250, 250],
                    [250, 250],
                    [250, 250],
                ],
            ],
            opening_tangents_real: [
                [[]], // это касательная к нулевому отверстию которого у нас нет
                [
                    // это 4 касательных к 1 отверстию которое всегда подгружается по умолчанию
                    [0, 0],
                    [0, 0],
                    [0, 0],
                    [0, 0],
                ],
            ],
            opening_tangents_intersect: [""],
            tangents_triangles: [],
            custom_scale: 1,
            gamma_b: 0.9,
            report_data: {},
            show_help: false,
            geom_chars: {},
            u_show: true,
            in_out_asw_show: false,
            op_tangents_show: false,
            v_width: 1,
            merged_angls: [],
        };
        this.calculate = this.calculate.bind(this);
        this.getData = this.getData.bind(this);
        this.displayPerimeter = this.displayPerimeter.bind(this);
        this.unitConversion = this.unitConversion.bind(this);
        this.displayColumn = this.displayColumn.bind(this);
        this.displayCircles = this.displayCircles.bind(this);
        this.displaySlabEdge = this.displaySlabEdge.bind(this);
        this.displayOpenings = this.displayOpenings.bind(this);
        this.displayOpeningTangents = this.displayOpeningTangents.bind(this);
        this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
        this.handleEnterKey = this.handleEnterKey.bind(this);
        this.calculateU = this.calculateU.bind(this);
    }

    getData(local_state) {
        // этот метод мы запускаем каждый раз при получении каких нибудь данных от дочерних компонентов
        this.setState(local_state, this.unitConversion); //после получения данных: обновляем стейт -> рисуем колонну -> конвертируем исх данные в кН и мм unitConversion -> считаем периметр displayPerimeter -> считаем площадь арматуры calculateAsw -> запускаем основной расчет Calculate
    }

    unitConversion() {
        // расчет происходит в кН, кН*мм и мм. Соответственно перед расчетом продавливания мы должны все исходные данные привести к этим единицам измерения
        var st = this.state;
        var props_to_convert = {
            // список свойств глобал стейта которые подлежит конвертировать
            force_units: ["n_load", "mx_load", "my_load"],
            length_units: [
                "a_column_size",
                "b_column_size",
                "t_slab_size",
                "a_slab_size",
                "shear_bars_spacing_to_prev",
                "edge_left_dist",
                "edge_right_dist",
                "edge_top_dist",
                "edge_bottom_dist",
                "openings",
            ],
        };
        var new_state = {};
        for (var i = 0; i < props_to_convert.force_units.length; i++) {
            //сначало конвертируем все силовые исходные данные по списку
            var name = props_to_convert.force_units[i];
            var val = st["input_" + name] * unitFactor.force_units[st.force_units];
            val = Number(val.toFixed(3)); //округляем
            new_state[name] = val;
        }

        for (var i = 0; i < props_to_convert.length_units.length; i++) {
            //затем конвертируем все длиновые исходные данные по списку
            var name1 = props_to_convert.length_units[i];
            if (typeof st[name1] === "number") {
                new_state[name1] = st["input_" + name1] * unitFactor.length_units[st.length_units];
            }
            if (name1 === "shear_bars_spacing_to_prev") {
                //отдельно конвертируем одномерные эрреи (shear_bars_spacing_to_prev)
                var arr = [];
                for (var k = 0; k < st["input_" + name1].length; k++) {
                    arr[k] = st["input_" + name1][k] * unitFactor.length_units[st.length_units];
                }
                new_state[name1] = arr;
            }

            if (name1 === "openings") {
                //отдельно конвертируем объект с характеристиками отверстий
                var empty_ops = findEmptyOps(st.input_openings); //находим отверстия с не до конца заполненными графами
                var obj = {}; //будущий результат
                var id;
                var k; //отдельный счетчик для выходного openings - чтобы все было как надо, чтобы не было пустых строк
                for (id in st.input_openings) {
                    //берем каждое свойство
                    obj[id] = [];
                    k = 0;
                    for (var j = 0; j < st.input_openings[id].length; j++) {
                        //и каждое значение в эррее
                        if (!empty_ops.includes(j)) {
                            //если данное свойство не относится к отверстию у которого не полностью заполнены свойства - то добавляем его в выходной openings
                            if (id === "Y") {
                                obj[id][k] = st.input_openings[id][j] * unitFactor.length_units[st.length_units] * -1; //меняем направление оси У - в SVG она направлена вниз, у нас классически вверх
                            } else {
                                obj[id][k] = st.input_openings[id][j] * unitFactor.length_units[st.length_units];
                            }
                            k++; //переходим выше только если смогли забить данное значение в эррей (т.е. наша характеристика не относится к отверстию с неполностью заполненными данными)
                        }
                    }
                }
                new_state.openings = obj;
            }
        }
        this.setState(new_state, this.displayColumn); //затем обновляем глобальный стейт конвертированными значениями и идем считать дальше
    }

    displayColumn() {
        // рассчитаем координаты колонны. Центр для отображения 250,250. Центр для расчетов 0,0
        var st = this.state;
        var columnRealCoords = []; //посчитаем реальные координаты - 0,0 - центр колонны. Они нам понадобятся для некоторых расчетов. Например рассчитать расстояние от отверстия до колонны
        var real_x1 = 0 - st.a_column_size / 2;
        var real_y1 = st.b_column_size / 2;
        var real_x2 = st.a_column_size / 2;
        var real_y2 = 0 - st.b_column_size / 2;
        columnRealCoords = [real_x1, real_y1, real_x2, real_y2];

        var scaleFactor; //рассчитываем масштаб отображения, чтобы влезало любое сечение
        if (st.a_column_size >= st.b_column_size) {
            scaleFactor = st.a_column_size / st.b_column_size;
        } else {
            scaleFactor = st.b_column_size / st.a_column_size;
        }

        scaleFactor = Number(scaleFactor.toFixed(3)); //округляем до 3 знака после запятой

        var a_column_size_display;
        var b_column_size_display;

        if (st.a_column_size >= st.b_column_size) {
            //приводим большую сторону к размеру 150. Другую сторону подгоняем под него
            a_column_size_display = 150 * st.custom_scale;
            b_column_size_display = Math.floor(150 / scaleFactor) * st.custom_scale; //чтобы не тратить впустую биты оперативки, округляем до целого, т.к. номер пикселя не может быть дробным
        } else {
            b_column_size_display = 150 * st.custom_scale;
            a_column_size_display = Math.floor(150 / scaleFactor) * st.custom_scale;
        }

        var x1 = 250 - a_column_size_display / 2; //колонна всегда отображается по центру (250, 250). Рассчитываем координаты углов
        var y1 = 250 - b_column_size_display / 2;
        var x2 = 250 + a_column_size_display / 2;
        var y2 = 250 + b_column_size_display / 2;

        var coords =
            x1 +
            "," +
            y1 +
            " " + //забиваем полученные координаты в строку для SVG
            x1 +
            "," +
            y2 +
            " " +
            x2 +
            "," +
            y2 +
            " " +
            x2 +
            "," +
            y1;

        var scaleFactorSize_a = st.a_column_size / a_column_size_display;
        scaleFactorSize_a = Number(scaleFactorSize_a.toFixed(3)); //округляем до 3 знака после запятой
        var scaleFactorSize_b = st.b_column_size / b_column_size_display;
        scaleFactorSize_b = Number(scaleFactorSize_b.toFixed(3));

        var state = {
            //и добавляем полученные значения в локальный стейт
            scaleFactorSize: [scaleFactorSize_a, scaleFactorSize_b],
            columnDisplayCoords: [x1, y1, x2, y2],
            columnRealCoords: columnRealCoords,
            columnDisplayString: coords,
        };
        this.setState(state, this.displaySlabEdge);
    }

    displaySlabEdge() {
        //нарисуем край плиты а также сформируем реальные координаты края плиты. Край плиты есть всегда, просто он может быть очень далеко
        var st = this.state;
        // для отображения
        var x1 = Math.floor(st.columnDisplayCoords[0] - (st.slab_edge && st.edge_left ? st.edge_left_dist : 1000000) / st.scaleFactorSize[0]); //columnDisplayCoords: [x1, y1, x2, y2],
        var y1 = Math.floor(st.columnDisplayCoords[1] - (st.slab_edge && st.edge_top ? st.edge_top_dist : 1000000) / st.scaleFactorSize[1]); // дробные пиксели ни к чему - округляем
        var x2 = Math.floor(st.columnDisplayCoords[2] + (st.slab_edge && st.edge_right ? st.edge_right_dist : 1000000) / st.scaleFactorSize[0]); //если edge_right = true, тогда подставляем input_edge_right_dist. если false, то 1000000
        var y2 = Math.floor(st.columnDisplayCoords[3] + (st.slab_edge && st.edge_bottom ? st.edge_bottom_dist : 1000000) / st.scaleFactorSize[1]);
        var string =
            x1 +
            "," +
            y1 +
            " " + //забиваем полученные координаты в строку для SVG
            x1 +
            "," +
            y2 +
            " " +
            x2 +
            "," +
            y2 +
            " " +
            x2 +
            "," +
            y1;

        // для расчетов
        var x1_real = st.columnRealCoords[0] - (st.slab_edge && st.edge_left ? st.edge_left_dist : 1000000); //columnRealCoords: [x1, y1, x2, y2],
        var y1_real = st.columnRealCoords[1] + (st.slab_edge && st.edge_top ? st.edge_top_dist : 1000000);
        var x2_real = st.columnRealCoords[2] + (st.slab_edge && st.edge_right ? st.edge_right_dist : 1000000);
        var y2_real = st.columnRealCoords[3] - (st.slab_edge && st.edge_bottom ? st.edge_bottom_dist : 1000000);

        this.setState(
            {
                slabEdgeString: string,
                slabEdgeCoords: [x1, y1, x2, y2],
                slabEdgeRealCoords: [x1_real, y1_real, x2_real, y2_real],
            },
            this.displayOpenings
        );
    }

    displayOpenings() {
        //нарисуем отверстия
        if (this.state.openingIsNear) {
            var st = this.state;
            var new_open_Disp_Str = []; //Эррей со строками отверстий
            var openingsRealCoords = []; //эррей с реальными координатами отверстий
            var new_open_Disp_Crds = []; //Эррей с координатами отверстий
            var openings = st.openings;
            for (var i = 1; i < st.openings.X.length; i++) {
                var real_x1 = openings.X[i] - openings.a[i] / 2; //openingsRealCoords: [x1, y1, x2, y2], координаты прямоугольника отверстия для расчетов (например определение расстояния между отверстием и колонной)
                var real_y1 = -1 * openings.Y[i] + openings.b[i] / 2; // меняем направление оси Y. openings.Y это для SVG, а в SVG ось Y направлена вниз.
                var real_x2 = openings.X[i] + openings.a[i] / 2;
                var real_y2 = -1 * openings.Y[i] - openings.b[i] / 2;

                var x1 = Math.floor(250 + (openings.X[i] - openings.a[i] / 2) / st.scaleFactorSize[0]); //openingsDisplayCoords: [x1, y1, x2, y2], координаты прямоугольника отверстия для отображения
                var y1 = Math.floor(250 + (openings.Y[i] - openings.b[i] / 2) / st.scaleFactorSize[0]); //округляем координаты пикселей до целого
                var x2 = Math.floor(250 + (openings.X[i] + openings.a[i] / 2) / st.scaleFactorSize[0]);
                var y2 = Math.floor(250 + (openings.Y[i] + openings.b[i] / 2) / st.scaleFactorSize[0]);

                var coords =
                    x1 +
                    "," +
                    y1 +
                    " " + //забиваем полученные координаты в строку для SVG
                    x1 +
                    "," +
                    y2 +
                    " " +
                    x2 +
                    "," +
                    y2 +
                    " " +
                    x2 +
                    "," +
                    y1;

                new_open_Disp_Str[i] = coords;
                new_open_Disp_Crds[i] = [x1, y1, x2, y2];
                openingsRealCoords[i] = [real_x1, real_y1, real_x2, real_y2];
            }
            this.setState(
                {
                    openingsDisplayString: new_open_Disp_Str,
                    openingsDisplayCoords: new_open_Disp_Crds,
                    openingsRealCoords: openingsRealCoords,
                },
                this.displayOpeningTangents
            );
        } else {
            this.displayCircles();
        }
    }

    displayOpeningTangents() {
        //нарисуем касательные к отверстиям
        var st = this.state;
        var opening;
        var real_opening;
        var angles = [""],
            min_angle,
            max_angle;
        var tan1, tan2, tan3, tan4;
        var opening_tangents = [
            // заготовка под эррей касательных к отверстиям. Эррей с координатами касательных x, y. Система - эррей[i][k][0]
            [[]], // это касательная к нулевому отверстию которого у нас нет
            [
                // это 4 касательных к 1 отверстию которое всегда подгружается по умолчанию
                [250, 250], //это нужно чтобы не получить при включении программы странные 4 линии сливающиеся в одну и уходящие за экран (4 касательных к отверстию №1 которое еще не забито)
                [250, 250],
                [250, 250],
                [250, 250],
            ],
        ];

        var opening_tangents_real = [
            // заготовка под эррей касательных к отверстиям. Эррей с координатами касательных x, y. Система - эррей[i][k][0]
            [[]],
            [
                [0, 0],
                [0, 0],
                [0, 0],
                [0, 0],
            ],
        ];

        var final_opening_tangents = [[[]]];
        var final_opening_tangents_real = [[[]]];

        for (var i = 1; i < st.openingsDisplayCoords.length; i++) {
            //openingsDisplayCoords: [x1, y1, x2, y2], координаты прямоугольника отверстия для отображения
            opening = st.openingsDisplayCoords[i]; //берем отверстие для отображения. По нему мы просчитаем координаты касательных для отрисовки
            real_opening = st.openingsRealCoords[i]; //берем реальное отверстие. По ним мы будем считать углы, т.к. они используются в расчетах и соответственно должны быть
            //точные и не зависеть от масштаба отображения. Потому что если их считать по openingsDisplayCoords, при изменении масштаба они будут немного гулять из-за округления и соответствнено будет менятся результат
            if (checkOpeningDistance(st, i)) {
                // если данное отверстие расположено на расстоянии менее 6h от колонны, то мы рисуем касательные
                opening_tangents[i] = []; //и вытаскиваем из него координаты углов, которые будут нашими конечными точками касательных. Каждое отверстие имеет 4 касательных
                opening_tangents_real[i] = [];
                angles[i] = []; // составляем список углов

                tan1 = findAngleReal([real_opening[0], real_opening[1]]);
                tan2 = findAngleReal([real_opening[2], real_opening[1]]);
                tan3 = findAngleReal([real_opening[2], real_opening[3]]);
                tan4 = findAngleReal([real_opening[0], real_opening[3]]);

                opening_tangents[i].push([opening[0], opening[1], tan1]); //x1, y1, угол - касательная 1
                opening_tangents[i].push([opening[2], opening[1], tan2]); //x2, y1, угол - касательная 2
                opening_tangents[i].push([opening[2], opening[3], tan3]); //x2, y2, угол - касательная 3
                opening_tangents[i].push([opening[0], opening[3], tan4]); //x1, y2, угол - касательная 4

                opening_tangents_real[i].push([real_opening[0], real_opening[1], tan1]); //x1, y1, угол - касательная 1
                opening_tangents_real[i].push([real_opening[2], real_opening[1], tan2]); //x2, y1, угол - касательная 2
                opening_tangents_real[i].push([real_opening[2], real_opening[3], tan3]); //x2, y2, угол - касательная 3
                opening_tangents_real[i].push([real_opening[0], real_opening[3], tan4]); //x1, y2, угол - касательная 4

                for (var k = 0; k < opening_tangents[i].length; k++) {
                    angles[i].push(opening_tangents[i][k][2]);
                }

                min_angle = Math.min(...angles[i]); //находим минимальный угол из списка
                max_angle = Math.max(...angles[i]); //находим максимальный угол из списка

                final_opening_tangents[i] = []; //готовим наш чистовой эррей. Сюда мы добавим только мин макс касательные
                final_opening_tangents_real[i] = [];
                for (var k = 0; k < opening_tangents[i].length; k++) {
                    if (opening[0] < 250 && opening[2] >= 250 && opening[1] <= 250) {
                        // изза особенностей геометрии если мы здесь, то мы выбираем касательные НЕ с максимальными или минимальным углом
                        if (opening_tangents[i][k][2] !== min_angle && opening_tangents[i][k][2] !== max_angle) {
                            //если угол данной касательной данного отверстия НЕ соответствует минимальному или максимальному, то эту касательную добавляем в список
                            final_opening_tangents[i].push(opening_tangents[i][k]);
                            final_opening_tangents_real[i].push(opening_tangents_real[i][k]);
                        }
                    } else {
                        // во всех остальных случаях отбираем только максимальный и минимальный угол
                        if (opening_tangents[i][k][2] === min_angle || opening_tangents[i][k][2] === max_angle) {
                            //если угол данной касательной данного отверстия соответствует минимальному или максимальному, то эту касательную добавляем в список
                            final_opening_tangents[i].push(opening_tangents[i][k]);
                            final_opening_tangents_real[i].push(opening_tangents_real[i][k]);
                        }
                    }
                }
            } else {
                // console.log("Данное отверстие далеко");
                final_opening_tangents[i] = []; // если отверстие дальше 6h, тогда пустая строка
                final_opening_tangents_real[i] = [];
            }
        }

        var tangents_triangles = []; //эррей со строками координат треугольников которые будут закрывать часть контура продавливания
        var tangent_triang;
        var x1, x2, y1, y2;

        for (var i = 1; i < final_opening_tangents.length; i++) {
            //забиваем координаты треугольников которые будут закрывать часть контура продавливания, ограниченного касательными к отверстиям
            if (final_opening_tangents[i] && final_opening_tangents[i][1]) {
                x1 = final_opening_tangents[i][0][0];
                y1 = final_opening_tangents[i][0][1];
                x2 = final_opening_tangents[i][1][0];
                y2 = final_opening_tangents[i][1][1];
                tangent_triang =
                    x1 +
                    "," +
                    y1 +
                    " " + //забиваем полученные координаты в строку для SVG
                    x2 +
                    "," +
                    y2 +
                    " " +
                    250 +
                    "," +
                    250;
                tangents_triangles.push(tangent_triang);
            }
        }

        this.setState(
            {
                //отправляем эррей с координатами касательных в глобальный стейт
                opening_tangents: final_opening_tangents,
                opening_tangents_real: final_opening_tangents_real,
                tangents_triangles: tangents_triangles,
            },
            this.displayCircles
        );
    }

    displayCircles() {
        //нарисуем кружочки арматуры
        var st = this.state;
        var x = []; //этот эррей будет содержать координаты Х всех кружочков
        var y = []; //этот эррей будет содержать координаты У всех кружочков

        for (var i = 0; i <= st.shear_bars_row_number; i++) {
            //проходимся по всем рядам арматуры. Ряд арматуры представляет собой прямоугольник отстоящий от грани колонны на заданное растояние вдоль которого установлены кружочки -
            //наша поперечноая арматура. Число кружочков вдоль оси Х и У в пределах данного ряда пользователь может  задать. Т.е. ряд состоит из 4 прямых линий кружочков: слева от колонны,
            //справа от колонны. сверху от колонны и снизу от колонны.
            var distanceToColumn = distanceToRow(i, st); //расстояние от данного ряда до грани колонны
            var x1 = Math.round(st.columnDisplayCoords[0] - distanceToColumn / st.scaleFactorSize[0]); //columnDisplayCoords: [x1, y1, x2, y2],
            var y1 = Math.round(st.columnDisplayCoords[1] - distanceToColumn / st.scaleFactorSize[1]); //формируем угловые координаты для данного ряда
            var x2 = Math.round(st.columnDisplayCoords[2] + distanceToColumn / st.scaleFactorSize[0]);
            var y2 = Math.round(st.columnDisplayCoords[3] + distanceToColumn / st.scaleFactorSize[1]);

            var stepX; // это шаг размещения кружочков в данном ряду вдоль оси X
            var stepY; //это шаг размещения кружочков в данном ряду вдоль оси У
            // теперь рассчитаем шаг кружочков в пределах данного ряда
            if (st.shear_bars_number.X[i] === 1) {
                //если пользователь задал нам всего 1 кружочек - тогда шаг = 0
                stepX = 0;
            } else {
                stepX = (x2 - x1) / (st.shear_bars_number.X[i] - 1); // если пользователь задал несколько кружочков - размещаем их равномерно вдоль грани ряда
            }

            if (st.shear_bars_number.Y[i] === 1) {
                // и тоже самое для У
                stepY = 0;
            } else {
                stepY = (y2 - y1) / (st.shear_bars_number.Y[i] - 1);
            }

            if (st.shear_bars_number.X[i] > 100 || st.shear_bars_number.Y[i] > 100) {
                // Ограничим количество стержней 100 по обоим направлениям чтобы не подвесить программу
                // console.log("Too many circles in a row number " + i);
                return;
            }
            //итак мы расчитали шаг кружочков в пределах данного ряда, теперь переходим к вычисленю
            calcCircleCoords(x1, y1, x2, y2, stepX, stepY, st.shear_bars_number.X[i], st.shear_bars_number.Y[i]); //координат каждого отдельного кружочка в пределах данного ряда и забивки его в х и у эррей.
        }

        //после того как мы наполнили наши ч и у координатами всех кружочков в каждом ряду - отправляем их в глобальный стейт

        var state = {
            circlesX: x,
            circlesY: y,
        };

        this.setState(state, this.displayPerimeter);

        // далее опишем функции которые здесь учавствовали

        function distanceToRow(row_number, state) {
            //функция рассчитывает расстояние от конкретного ряда до грани колонны
            var distance = 0;
            for (var i = 0; i <= row_number; i++) {
                distance = distance + state.shear_bars_spacing_to_prev[i];
            }
            return distance;
        }

        function calcCircleCoords(x1, y1, x2, y2, stepX, stepY, shear_bars_number_X, shear_bars_number_Y) {
            // здесь мы будем рожать координаты каждого отдельного кружочка для заданного ряда. Нам нужно задать угловые координаты ряда, шаг кружочков вдоль грани вдоль оси Хи У,
            // а также конкретно число кружочков вдоль данного ряда вдоль нужной грани
            var x_coord; // это X координата кружочка
            var y_coord; //это У координата кружочка
            // эти координаты мы начинаем потиху засовывать в наши х и у эрреи определенные в родительской функции. берем каждый кружочек добавляем к нему шаг и забиваем в эррей

            if (y1 > st.slabEdgeCoords[1]) {
                // slabEdgeCoords: [x1, y1, x2, y2] проверяем кружки не лежат ли они за верхним краем плиты
                for (var i = 0; i < shear_bars_number_X; i++) {
                    //формируем все кружки ВЫШЕ колонны (вдоль оси Х)
                    x_coord = x1 + stepX * i;
                    if (x_coord > st.slabEdgeCoords[0] && x_coord < st.slabEdgeCoords[2]) {
                        //проверяем что кружки находятся в пределах левого и правого края плиты
                        x.push(x_coord);
                        y.push(y1);
                    }
                }
            }

            if (y2 < st.slabEdgeCoords[3]) {
                //проверяем кружки не лежат ли они за нижним краем плиты
                for (var i = 0; i < shear_bars_number_X; i++) {
                    //формируем все кружки НИЖЕ колонны (вдоль оси Х)
                    x_coord = x1 + stepX * i;
                    if (x_coord > st.slabEdgeCoords[0] && x_coord < st.slabEdgeCoords[2]) {
                        //проверяем что кружки находятся в пределах левого и правого края плиты
                        x.push(x_coord);
                        y.push(y2);
                    }
                }
            }

            if (x1 > st.slabEdgeCoords[0]) {
                //проверяем кружки не лежат ли они за левым краем плиты
                for (var i = 0; i < shear_bars_number_Y; i++) {
                    //формируем все кружки СЛЕВА от колонны (вдоль оси У)
                    y_coord = y1 + stepY * i;
                    if (y_coord > st.slabEdgeCoords[1] && y_coord < st.slabEdgeCoords[3]) {
                        //проверяем что кружки находятся в пределах верхнего и нижнего края плиты
                        y.push(y_coord);
                        x.push(x1);
                    }
                }
            }

            if (x2 < st.slabEdgeCoords[2]) {
                //проверяем кружки не лежат ли они за правым краем плиты
                for (var i = 0; i < shear_bars_number_Y; i++) {
                    //формируем все кружки СПРАВА от колонны (вдоль оси У)
                    y_coord = y1 + stepY * i;
                    if (y_coord > st.slabEdgeCoords[1] && y_coord < st.slabEdgeCoords[3]) {
                        //проверяем что кружки находятся в пределах верхнего и нижнего края плиты
                        y.push(y_coord);
                        x.push(x2);
                    }
                }
            }
        }
    }

    displayPerimeter() {
        // Рассчитываем координаты периметра контура расчетного поперечного сечения u
        var st = this.state;
        var h0 = st.t_slab_size - st.a_slab_size; //рабочая высота сечения, мм
        var distance = h0 / 2; //расстояние от края колонны до контура u
        //координаты для отображения
        var x1 = Math.floor(st.columnDisplayCoords[0] - distance / st.scaleFactorSize[0]); //columnDisplayCoords: [x1, y1, x2, y2], координаты прямоугольника u для отображения. Центр 250,250
        var y1 = Math.floor(st.columnDisplayCoords[1] - distance / st.scaleFactorSize[1]); // дробные пиксели ни к чему - округляем
        var x2 = Math.floor(st.columnDisplayCoords[2] + distance / st.scaleFactorSize[0]);
        var y2 = Math.floor(st.columnDisplayCoords[3] + distance / st.scaleFactorSize[1]);

        //координаты для расчетов
        var x1_real = st.columnRealCoords[0] - distance; //columnRealCoords: [x1, y1, x2, y2], координаты прямоугольника u для расчетов. Центр 0,0
        var y1_real = st.columnRealCoords[1] + distance;
        var x2_real = -x1_real;
        var y2_real = -y1_real;

        var slab_edge_type = "";

        var sideY = 2 * y1_real; // длина стандартной стороны u вдоль У
        var sideX = 2 * x2_real; // длина стандартной стороны u вдоль X
        var dist_left = Math.abs(st.slabEdgeRealCoords[0] - x1_real); //Расстояние от u до левого края плиты. проверка рядом расположенного левого края плиты
        var dist_right = Math.abs(st.slabEdgeRealCoords[2] - x2_real);
        var dist_top = Math.abs(st.slabEdgeRealCoords[1] - y1_real);
        var dist_bottom = Math.abs(st.slabEdgeRealCoords[3] - y2_real);

        if (dist_left < sideY / 2) {
            // если расстояние от u до левого края плиты меньше чем половина его стандартной вертикальной стороны,
            x1 = st.slabEdgeCoords[0]; // то контур u сразу перепрыгивает на левый край плиты
            x1_real = st.slabEdgeRealCoords[0];
            slab_edge_type = slab_edge_type + "l";
        }

        //проверка рядом расположенного правого края плиты
        if (dist_right < sideY / 2) {
            // если расстояние от u до правого края плиты меньше чем половина его стандартной вертикальной стороны,
            x2 = st.slabEdgeCoords[2]; // то контур u сразу перепрыгивает на правый край плиты
            x2_real = st.slabEdgeRealCoords[2];
            slab_edge_type = slab_edge_type + "r";
        }

        //проверка рядом расположенного верхнего края плиты
        if (dist_top < sideX / 2) {
            // если расстояние от u до верхнего края плиты меньше чем половина его стандартной горизонтальной стороны,
            y1 = st.slabEdgeCoords[1]; // то контур u сразу перепрыгивает на верхний край плиты
            y1_real = st.slabEdgeRealCoords[1];
            slab_edge_type = slab_edge_type + "t";
        }

        //проверка рядом расположенного нижнего края плиты
        if (dist_bottom < sideX / 2) {
            // если расстояние от u до нижнего края плиты меньше чем половина его стандартной горизонтальной стороны,
            y2 = st.slabEdgeCoords[3]; // то контур u сразу перепрыгивает на нижний край плиты
            y2_real = st.slabEdgeRealCoords[3];
            slab_edge_type = slab_edge_type + "b";
        }

        var u_corners_angles = []; // находим углы касательных к углам для последующего применения в расчетах
        u_corners_angles[0] = findAngleReal([x1_real, y1_real]);
        u_corners_angles[1] = findAngleReal([x2_real, y1_real]);
        u_corners_angles[2] = findAngleReal([x2_real, y2_real]);
        u_corners_angles[3] = findAngleReal([x1_real, y2_real]);

        var coords =
            x1 +
            "," +
            y1 +
            " " + //забиваем полученные координаты в строку для SVG
            x1 +
            "," +
            y2 +
            " " +
            x2 +
            "," +
            y2 +
            " " +
            x2 +
            "," +
            y1;

        if (slab_edge_type === "lr" || slab_edge_type === "tb" || slab_edge_type.length > 2) {
            this.setState({
                uDisplayString: coords,
                uDisplayCoords: [x1, y1, x2, y2],
                uRealCoords: [x1_real, y1_real, x2_real, y2_real],
                uCornersAngles: u_corners_angles,
                slab_edge_type: slab_edge_type,
                text_result: "Данный случай не регламентирован СП 63.13330.2012",
                result_color: "secondary",
            });
        } else {
            this.setState(
                {
                    uDisplayString: coords,
                    uDisplayCoords: [x1, y1, x2, y2],
                    uRealCoords: [x1_real, y1_real, x2_real, y2_real],
                    uCornersAngles: u_corners_angles,
                    slab_edge_type: slab_edge_type,
                },
                this.displayIntersection
            );
        }
    }

    displayIntersection() {
        //отображаем пересечение касательных к отверстиям с u
        var st = this.state;
        var u_lines = []; //создаем эррей линий из которых состоит u. uDisplayCoords: [x1, y1, x2, y2]
        var u = st.uDisplayCoords;
        u_lines[0] = [u[0], u[1], u[2], u[1]]; //линии u
        u_lines[1] = [u[2], u[1], u[2], u[3]];
        u_lines[2] = [u[2], u[3], u[0], u[3]];
        u_lines[3] = [u[0], u[3], u[0], u[1]];

        var intersection = [""];
        var tang_coords = [];
        for (var i = 1; i < st.opening_tangents.length; i++) {
            intersection[i] = [];
            for (var k = 0; k < st.opening_tangents[i].length; k++) {
                //здесь мы берем каждую касательную, и находим её точку пересечения с u
                tang_coords = [250, 250, st.opening_tangents[i][k][0], st.opening_tangents[i][k][1]];
                intersection[i].push(findIntersect(u_lines[0], tang_coords));
                intersection[i].push(findIntersect(u_lines[1], tang_coords));
                intersection[i].push(findIntersect(u_lines[2], tang_coords));
                intersection[i].push(findIntersect(u_lines[3], tang_coords));
            }
        }
        this.setState(
            {
                //отправляем эррей с координатами касательных в глобальный стейт
                opening_tangents_intersect: intersection,
            },
            this.calculateU
        );
    }

    calculateU() {
        //считаем длину расчетного контура и другие геометрические характеристики
        var st = this.state;
        var result = {
            // результат будет содержать длину u и моменты сопротивления
            u: 0,
            wbx: 0,
            wby: 0,
            size_u_left: 0,
            size_u_top: 0,
            size_u_right: 0,
            size_u_bottom: 0,
            cut_off: 0,
            ibx: 0,
            iby: 0,
            sx: 0,
            sy: 0,
            xa: 0,
            ya: 0,
            xc: 0,
            yc: 0,
            xmax: 0,
            ymax: 0,
            xmax_op: 0,
            ymax_op: 0,
            lx: 0,
            ly: 0,
        };

        var h0 = st.t_slab_size - st.a_slab_size; //рабочая высота сечения, мм

        var size_u_left = st.b_column_size + h0; //размер контура расч. попер сечения u - левая  сторона
        var size_u_top = st.a_column_size + h0; //размер контура расч. попер сечения u- верхняя сторона
        var size_u_right = st.b_column_size + h0; //размер контура расч. попер сечения u- правая  сторона
        var size_u_bottom = st.a_column_size + h0; //размер контура расч. попер сечения u- нижняя сторона

        var lx = size_u_top; //стандартные размеры u когда нет рядом плиты
        var ly = size_u_right;

        //проверяем есть ли рядом плита

        // считаем стороны
        if (st.slab_edge_type === "l") {
            //лево   проверка рядом расположенного левого края плиты. Если расстояние между левым краем расчетного контура и краем плиты становится меньше чем левый контур/2,
            size_u_left = 0; //тогда контур размыкается и перелетает к плите.
            size_u_bottom = st.a_column_size + h0 / 2 + st.edge_left_dist;
            size_u_top = size_u_bottom;
            lx = size_u_top;
            ly = size_u_right;
            result.xa = st.a_column_size / 2 + st.edge_left_dist;
            result.sx = 2 * lx * (lx / 2 - result.xa) + (ly * (st.a_column_size + h0)) / 2;
            // console.log("xa = " + result.xa);
            // console.log("sx = " + result.sx);
        }

        if (st.slab_edge_type === "r") {
            //право
            size_u_right = 0;
            size_u_bottom = st.a_column_size + h0 / 2 + st.edge_right_dist;
            size_u_top = size_u_bottom;
            lx = size_u_top;
            ly = size_u_left;
            result.xa = st.a_column_size / 2 + st.edge_right_dist;
            result.sx = 2 * lx * (result.xa - lx / 2) - (ly * (st.a_column_size + h0)) / 2;
            // console.log("xa = " + result.xa);
            // console.log("sx = " + result.sx);
        }

        if (st.slab_edge_type === "t") {
            //верх
            size_u_top = 0;
            size_u_right = st.b_column_size + h0 / 2 + st.edge_top_dist;
            size_u_left = size_u_right;
            lx = size_u_bottom;
            ly = size_u_left;
            result.ya = st.b_column_size / 2 + st.edge_top_dist;
            result.sy = 2 * ly * (result.ya - ly / 2) - (lx * (st.b_column_size + h0)) / 2;
            // console.log("ya = " + result.ya);
            // console.log("sy = " + result.sy);
        }

        if (st.slab_edge_type === "b") {
            //низ
            size_u_bottom = 0;
            size_u_right = st.b_column_size + h0 / 2 + st.edge_bottom_dist;
            size_u_left = size_u_right;
            lx = size_u_top;
            ly = size_u_left;
            result.ya = st.b_column_size / 2 + st.edge_bottom_dist;
            result.sy = 2 * ly * (ly / 2 - result.ya) + (lx * (st.b_column_size + h0)) / 2;
            // console.log("ya = " + result.ya);
            // console.log("sy = " + result.sy);
        }

        if (st.slab_edge_type === "lt") {
            //лево-верх
            size_u_left = 0;
            size_u_top = 0;
            size_u_bottom = st.a_column_size + h0 / 2 + st.edge_left_dist;
            size_u_right = st.b_column_size + h0 / 2 + st.edge_top_dist;
            lx = size_u_bottom;
            ly = size_u_right;
            result.xa = st.a_column_size / 2 + st.edge_left_dist;
            result.ya = st.b_column_size / 2 + st.edge_top_dist;
            result.sx = lx * (lx / 2 - result.xa) + (ly * (st.a_column_size + h0)) / 2;
            result.sy = ly * (result.ya - ly / 2) - (lx * (st.b_column_size + h0)) / 2;
            // console.log("xa = " + result.xa);
            // console.log("ya = " + result.ya);
            // console.log("sx = " + result.sx);
            // console.log("sy = " + result.sy);
        }

        if (st.slab_edge_type === "rt") {
            //право-верх
            size_u_right = 0;
            size_u_top = 0;
            size_u_bottom = st.a_column_size + h0 / 2 + st.edge_right_dist;
            size_u_left = st.b_column_size + h0 / 2 + st.edge_top_dist;
            lx = size_u_bottom;
            ly = size_u_left;
            result.xa = st.a_column_size / 2 + st.edge_right_dist;
            result.sx = lx * (result.xa - lx / 2) - (ly * (st.a_column_size + h0)) / 2;
            result.ya = st.b_column_size / 2 + st.edge_top_dist;
            result.sy = ly * (result.ya - ly / 2) - (lx * (st.b_column_size + h0)) / 2;
            // console.log("xa = " + result.xa);
            // console.log("ya = " + result.ya);
            // console.log("sx = " + result.sx);
            // console.log("sy = " + result.sy);
        }

        if (st.slab_edge_type === "rb") {
            //право-низ
            size_u_right = 0;
            size_u_bottom = 0;
            size_u_top = st.a_column_size + h0 / 2 + st.edge_right_dist;
            size_u_left = st.b_column_size + h0 / 2 + st.edge_bottom_dist;
            lx = size_u_top;
            ly = size_u_left;
            result.xa = st.a_column_size / 2 + st.edge_right_dist;
            result.sx = lx * (result.xa - lx / 2) - (ly * (st.a_column_size + h0)) / 2;
            result.ya = st.b_column_size / 2 + st.edge_bottom_dist;
            result.sy = ly * (ly / 2 - result.ya) + (lx * (st.b_column_size + h0)) / 2;
            // console.log("xa = " + result.xa);
            // console.log("ya = " + result.ya);
            // console.log("sx = " + result.sx);
            // console.log("sy = " + result.sy);
        }

        if (st.slab_edge_type === "lb") {
            //лево-низ
            size_u_left = 0;
            size_u_bottom = 0;
            size_u_top = st.a_column_size + h0 / 2 + st.edge_left_dist;
            size_u_right = st.b_column_size + h0 / 2 + st.edge_bottom_dist;
            lx = size_u_top;
            ly = size_u_right;
            result.xa = st.a_column_size / 2 + st.edge_left_dist;
            result.sx = lx * (lx / 2 - result.xa) + (ly * (st.a_column_size + h0)) / 2;
            result.ya = st.b_column_size / 2 + st.edge_bottom_dist;
            result.sy = ly * (ly / 2 - result.ya) + (lx * (st.b_column_size + h0)) / 2;
            // console.log("xa = " + result.xa);
            // console.log("ya = " + result.ya);
            // console.log("sx = " + result.sx);
            // console.log("sy = " + result.sy);
        }

        //окончание проверки рядом плиты

        // Начало проверки отверстий
        // каждое отверстие своими касательными образует треугольник, который пересекается с u
        // каждое отверстие своим треугольником делает одну "вырубку" из u
        // вырубка может быть разной формы и длины
        // если треугольники наслаиваются, то они сливаются в один итоговый треугольник.
        // соответственно сначало строим итоговые треугольники, считаем сколько каждый из них вырубает,
        // затем отнимаем от начального u длины вырубок и получаем итоговое u

        var cut_off = 0; // суммарная вырубка u всеми отверстиями
        var cut_off_ibx = 0; // суммарная вырубка ibx всеми отверстиями
        var cut_off_iby = 0;
        var cut_off_sx = 0;
        var cut_off_sy = 0;
        var cut_xc = 0;
        var cut_yc = 0;
        var cut_chars;
        var mid_tans;
        if (st.openingIsNear) {
            /*
            var merged_angls = mergeAngles(st.opening_tangents);     //закидываем все имеющиеся углы в функцию mergeAngles и пытаемсся сделать слияние
            */

            var merged_angls = mergeOpenings(st.opening_tangents_real); //закидываем все имеющиеся отверстия в функцию mergeOpenings и пытаемсся сделать слияние

            //закидываем все имеющиеся углы в функцию tangCenter и находим биссектрису между касательными к каждому отверстию. Это нам будет нужно чтобы потом определить когда вырубается угол больше 180 градусов.
            mid_tans = tangCenter(st.opening_tangents_real);
            /*
            mid_tans: (5) [0, 3.399, 296.289, 139.197, 127.451]
            */

            // переходим к поиску реальных координат пересечений касательных слитых треугольников и u.
            var coords_intersect = findUIntersectPoints(merged_angls, st.uRealCoords);

            // проходимся по всем координатам точек пересечения, и вычисляем все вырубки
            cut_chars = addCornersU(coords_intersect, st.uRealCoords, merged_angls);

            //считаем сумму вырубок u, iby, ibx
            // console.log("cut_chars.cut_u = " + cut_chars.cut_u);
            for (var i = 0; i < cut_chars.cut_u.length; i++) {
                cut_off = cut_off + cut_chars.cut_u[i];
                cut_off_ibx = cut_off_ibx + cut_chars.cut_ibx[i];
                cut_off_iby = cut_off_iby + cut_chars.cut_iby[i];
                cut_off_sx = cut_off_sx + cut_chars.cut_sx[i];
                cut_off_sy = cut_off_sy + cut_chars.cut_sy[i];
            }
            cut_off = Math.floor(cut_off); //округляем
        }
        // окончание проверки отверстий

        result.u = size_u_left + size_u_top + size_u_right + size_u_bottom - cut_off; //периметр контура расчетного поперечного сечения, мм
        result.u = Number(result.u.toFixed(3)); //округляем

        if (st.openingIsNear) {
            //если есть отверстие считаем некоторые характеристики вырубки
            cut_xc = -cut_off_sx / result.u;
            cut_xc = Number(cut_xc.toFixed(2));
            cut_yc = -cut_off_sy / result.u;
            cut_yc = Number(cut_yc.toFixed(2));
        }

        //считаем xc и yc
        if (st.slab_edge_type === "l" || st.slab_edge_type === "r") {
            result.xc = result.sx / result.u;
            result.xc = Number(result.xc.toFixed(2)); //округляем
            // console.log("xc = " + result.xc);
        }
        if (st.slab_edge_type === "t" || st.slab_edge_type === "b") {
            result.yc = result.sy / result.u;
            result.yc = Number(result.yc.toFixed(2)); //округляем
            // console.log("yc = " + result.yc);
        }
        if (st.slab_edge_type === "lt" || st.slab_edge_type === "rt" || st.slab_edge_type === "rb" || st.slab_edge_type === "lb") {
            result.xc = result.sx / result.u;
            result.xc = Number(result.xc.toFixed(2)); //округляем
            // console.log("xc = " + result.xc);
            result.yc = result.sy / result.u;
            result.yc = Number(result.yc.toFixed(2)); //округляем
            // console.log("yc = " + result.yc);
        }

        // характеристики сечения - стандартный случай
        if (st.slab_edge_type === "") {
            result.ibx = Math.pow(lx, 3) / 6 + (ly * Math.pow(lx, 2)) / 2; //момент инерции расчетного контура. Стандартный случай. Если u - прямоугольник, тогда считается так
            result.iby = Math.pow(ly, 3) / 6 + (lx * Math.pow(ly, 2)) / 2;
            result.ibx = Math.floor(result.ibx); //округляем
            result.iby = Math.floor(result.iby); //округляем
            result.wbx = result.ibx / (lx / 2);
            result.wby = result.iby / (ly / 2);
            result.wbx = Math.floor(result.wbx); //округляем
            result.wby = Math.floor(result.wby); //округляем
        }

        //характеристики сечения - лево и право
        if (st.slab_edge_type === "l") {
            //ibx. если грань плиты слева
            result.ibx = Math.pow(lx, 3) / 6 + 2 * lx * Math.pow(result.xa + result.xc - lx / 2, 2) + ly * Math.pow(lx - result.xa - result.xc, 2);
            result.ibx = Math.floor(result.ibx);
            // console.log("ibx = " + result.ibx);
        }

        if (st.slab_edge_type === "r") {
            // ibx. если грань плиты справа
            result.ibx = Math.pow(lx, 3) / 6 + 2 * lx * Math.pow(result.xa - result.xc - lx / 2, 2) + ly * Math.pow(lx - result.xa + result.xc, 2);
            result.ibx = Math.floor(result.ibx);
            // console.log("ibx = " + result.ibx);
        }

        if (st.slab_edge_type === "r" || st.slab_edge_type === "l") {
            //другие характеристики расчетного контура. если грань плиты справа или слева
            result.iby = Math.pow(ly, 3) / 12 + (lx * Math.pow(ly, 2)) / 2; //iby
            result.iby = Math.floor(result.iby);
            // console.log("iby = " + result.iby);
            result.xmax = result.xa + Math.abs(result.xc); //наиболее удаленная точка
            result.xmax = Number(result.xmax.toFixed(3));
            // console.log("xmax = " + result.xmax);
            result.wbx = result.ibx / result.xmax; //wbx
            result.wbx = Math.floor(result.wbx);
            // console.log("wbx = " + result.wbx);
            result.wby = result.iby / (ly / 2); //wby
            result.wby = Math.floor(result.wby);
            // console.log("wby = " + result.wby);
        }

        //характеристики сечения - низ и верх
        if (st.slab_edge_type === "t") {
            //iby. если грань плиты сверху
            result.iby = Math.pow(ly, 3) / 6 + 2 * ly * Math.pow(result.ya - result.yc - ly / 2, 2) + lx * Math.pow(ly - result.ya + result.yc, 2);
            result.iby = Math.floor(result.iby);
            // console.log("iby = " + result.iby);
        }

        if (st.slab_edge_type === "b") {
            //iby. если грань плиты снизу
            result.iby = Math.pow(ly, 3) / 6 + 2 * ly * Math.pow(result.ya + result.yc - ly / 2, 2) + lx * Math.pow(ly - result.ya - result.yc, 2);
            result.iby = Math.floor(result.iby);
            // console.log("iby = " + result.iby);
        }

        if (st.slab_edge_type === "t" || st.slab_edge_type === "b") {
            //другие характеристики расчетного контура. если грань плиты сверху или снизу
            result.ibx = Math.pow(lx, 3) / 12 + (ly * Math.pow(lx, 2)) / 2; //ibx
            result.ibx = Math.floor(result.ibx);
            // console.log("ibx = " + result.ibx);
            result.ymax = result.ya + Math.abs(result.yc); //наиболее удаленная точка
            result.ymax = Number(result.ymax.toFixed(3));
            // console.log("ymax = " + result.ymax);
            result.wby = result.iby / result.ymax; //wby
            result.wby = Math.floor(result.wby);
            // console.log("wby = " + result.wby);
            result.wbx = result.ibx / (lx / 2); //wbx
            result.wbx = Math.floor(result.wbx);
            // console.log("wbx = " + result.wbx);
        }

        //характеристики сечения - лево-вверх, право-верх, право-низ, лево-них
        if (st.slab_edge_type === "lt") {
            //ibx и iby. если грань плиты лево-вверх
            result.ibx = Math.pow(lx, 3) / 12 + lx * Math.pow(result.xa + result.xc - lx / 2, 2) + ly * Math.pow(lx - result.xa - result.xc, 2);
            result.ibx = Math.floor(result.ibx);
            // console.log("ibx = " + result.ibx);
            result.iby = Math.pow(ly, 3) / 12 + ly * Math.pow(result.ya - result.yc - ly / 2, 2) + lx * Math.pow(ly - result.ya + result.yc, 2);
            result.iby = Math.floor(result.iby);
            // console.log("iby = " + result.iby);
        }

        if (st.slab_edge_type === "rt") {
            //ibx и iby. если грань плиты право-вверх
            result.ibx = Math.pow(lx, 3) / 12 + lx * Math.pow(result.xa - result.xc - lx / 2, 2) + ly * Math.pow(lx - result.xa + result.xc, 2);
            result.ibx = Math.floor(result.ibx);
            // console.log("ibx = " + result.ibx);
            result.iby = Math.pow(ly, 3) / 12 + ly * Math.pow(result.ya - result.yc - ly / 2, 2) + lx * Math.pow(ly - result.ya + result.yc, 2);
            result.iby = Math.floor(result.iby);
            // console.log("iby = " + result.iby);
        }

        if (st.slab_edge_type === "rb") {
            //ibx и iby. если грань плиты право-низ
            result.ibx = Math.pow(lx, 3) / 12 + lx * Math.pow(result.xa - result.xc - lx / 2, 2) + ly * Math.pow(lx - result.xa + result.xc, 2);
            result.ibx = Math.floor(result.ibx);
            // console.log("ibx = " + result.ibx);
            result.iby = Math.pow(ly, 3) / 12 + ly * Math.pow(result.ya + result.yc - ly / 2, 2) + lx * Math.pow(ly - result.ya - result.yc, 2);
            result.iby = Math.floor(result.iby);
            // console.log("iby = " + result.iby);
        }

        if (st.slab_edge_type === "lb") {
            //ibx и iby. если грань плиты лево-низ
            result.ibx = Math.pow(lx, 3) / 12 + lx * Math.pow(result.xa + result.xc - lx / 2, 2) + ly * Math.pow(lx - result.xa - result.xc, 2);
            result.ibx = Math.floor(result.ibx);
            // console.log("ibx = " + result.ibx);
            result.iby = Math.pow(ly, 3) / 12 + ly * Math.pow(result.ya + result.yc - ly / 2, 2) + lx * Math.pow(ly - result.ya - result.yc, 2);
            result.iby = Math.floor(result.iby);
            // console.log("iby = " + result.iby);
        }

        if (st.slab_edge_type === "lt" || st.slab_edge_type === "rt" || st.slab_edge_type === "rb" || st.slab_edge_type === "lb") {
            result.xmax = result.xa + Math.abs(result.xc); //наиболее удаленная точка
            result.xmax = Number(result.xmax.toFixed(3));
            // console.log("xmax = " + result.xmax);
            result.ymax = result.ya + Math.abs(result.yc); //наиболее удаленная точка
            result.ymax = Number(result.ymax.toFixed(3));
            // console.log("ymax = " + result.ymax);
            result.wbx = result.ibx / result.xmax; //wbx
            result.wbx = Math.floor(result.wbx);
            // console.log("wbx = " + result.wbx);
            result.wby = result.iby / result.ymax; //wby
            result.wby = Math.floor(result.wby);
            // console.log("wby = " + result.wby);
        }

        //если есть отверстия отнимаем от характеристик характеристики вырубки и пересчитываем характеристики
        if (st.openingIsNear) {
            result.ibx = result.ibx - cut_off_ibx - result.u * Math.pow(cut_xc, 2);
            result.ibx = Math.floor(result.ibx);
            // console.log("ibx = " + result.ibx);
            result.iby = result.iby - cut_off_iby - result.u * Math.pow(cut_yc, 2);
            result.iby = Math.floor(result.iby);
            // console.log("iby = " + result.iby);
            result.xmax_op = lx / 2 + Math.abs(cut_xc);
            // console.log("xmax_op = " + result.xmax_op);
            result.ymax_op = ly / 2 + Math.abs(cut_yc);
            // console.log("ymax_op = " + result.ymax_op);

            //если наиболее удаленная точка у нас еше не посчитана (наприм стандартный случай) - мы её считаем
            // если уже есть - то немного корректируем с учетом отверстия
            if (!result.xmax) {
                result.xmax = result.xmax_op;
            } else {
                result.xmax = result.xmax + cut_xc;
            }
            result.xmax = Number(result.xmax.toFixed(3));

            if (!result.ymax) {
                result.ymax = result.ymax_op;
            } else {
                result.ymax = result.ymax + cut_yc;
            }
            result.ymax = Number(result.ymax.toFixed(3));

            result.wbx = result.ibx / result.xmax; //wbx
            result.wbx = Math.floor(result.wbx);
            // console.log("wbx = " + result.wbx);
            result.wby = result.iby / result.ymax; //wby
            result.wby = Math.floor(result.wby);
            // console.log("wby = " + result.wby);
        }

        result.size_u_left = size_u_left; //данные для отчета Word
        result.size_u_top = size_u_top;
        result.size_u_right = size_u_right;
        result.size_u_bottom = size_u_bottom;
        result.cut_off = cut_off;
        result.cut_off_ibx = cut_off_ibx;
        result.cut_off_iby = cut_off_iby;
        result.cut_off_sx = cut_off_sx;
        result.cut_off_sy = cut_off_sy;
        result.cut_xc = cut_xc;
        result.cut_yc = cut_yc;
        result.lx = lx;
        result.ly = ly;
        result.cut_chars = cut_chars;
        result.mid_tans = mid_tans;

        this.setState(
            {
                //отправляем эррей с координатами касательных в глобальный стейт
                geom_chars: result,
                merged_angls: merged_angls,
            },
            this.calculateAsw
        );
    }

    calculateAsw() {
        // находим все стержни которые попадают в рабочую зону и учитываются в расчете
        var st = this.state;
        var h0_slab_size = st.t_slab_size - st.a_slab_size;
        if (st.openingIsNear) {
            var u_cut_angles = st.geom_chars.cut_chars.angles;
        }
        var distance = Math.round(h0_slab_size / 2 / st.scaleFactorSize[0]); //h0/2
        var aswCircles = []; //эррей эрреев,
        var out_asw_square;
        var out_asw_square_string = "0,0 0,0 0,0 0,0"; //забиваем сразу, чтобы не было ругани со стороны canvas_fake()
        var in_asw_square;
        var in_asw_square_string = "0,0 0,0 0,0 0,0";
        for (var i = 0; i < st.circlesX.length; i++) {
            // подсчитываем число кружков попадающих в расчетный зазор 0,5h0 по обе стороны от расчетного контура
            checkAswCircles(st.circlesX[i], st.circlesY[i], distance);
        }

        function checkAswCircles(circleX, circleY, dist) {
            //uDisplayCoords: [x1, y1, x2, y2],
            // сначало отбираем те кружки, которые находятся вдоль расчетного контура на расстоянии h0/2 от него
            // отметим координаты этой зоны. Это будет 2 квадрата в которых не учитываютс кружки: внутренний и наружный. Кружки которые попадают в узкую полоску между двумя квадратами - учитываются

            // наружный квадрат - если кружки попадают в него - они не учитываются

            var x1_out = st.uDisplayCoords[0] - dist; // uDisplayCoords: [x1, y1, x2, y2]     slabEdgeCoords: [x1, y1, x2, y2]
            var y1_out = st.uDisplayCoords[1] - dist;
            var x2_out = st.uDisplayCoords[2] + dist;
            var y2_out = st.uDisplayCoords[3] + dist;

            //внутренний квадрат - если кружки попадают в него - они не учитываются
            var x1_in = st.uDisplayCoords[0] + dist;
            var y1_in = st.uDisplayCoords[1] + dist;
            var x2_in = st.uDisplayCoords[2] - dist;
            var y2_in = st.uDisplayCoords[3] - dist;

            //теперь забиваем варианты что u лежит на краю плиты (рядом край плиты)

            if (st.uDisplayCoords[0] === st.slabEdgeCoords[0]) {
                //если u лег на левый край плиты
                x1_out = st.uDisplayCoords[0]; //то оба квадрата тоже ложаться на левый край плиты
                x1_in = st.uDisplayCoords[0];
            }

            if (st.uDisplayCoords[2] === st.slabEdgeCoords[2]) {
                //если u лег на правый край плиты
                x2_out = st.uDisplayCoords[2]; //то оба квадрата тоже ложаться на правый край плиты
                x2_in = st.uDisplayCoords[2];
            }

            if (st.uDisplayCoords[1] === st.slabEdgeCoords[1]) {
                //если u лег на верхний край плиты
                y1_out = st.uDisplayCoords[1]; //то оба квадрата тоже ложаться на верхний край плиты
                y1_in = st.uDisplayCoords[1];
            }

            if (st.uDisplayCoords[3] === st.slabEdgeCoords[3]) {
                //если u лег на нижний край плиты
                y2_out = st.uDisplayCoords[3]; //то оба квадрата тоже ложаться на нижний край плиты
                y2_in = st.uDisplayCoords[3];
            }

            out_asw_square = [x1_out, y1_out, x2_out, y2_out];
            out_asw_square_string =
                x1_out +
                "," +
                y1_out +
                " " + //забиваем полученные координаты в строку для SVG
                x1_out +
                "," +
                y2_out +
                " " +
                x2_out +
                "," +
                y2_out +
                " " +
                x2_out +
                "," +
                y1_out;

            in_asw_square = [x1_in, y1_in, x2_in, y2_in];
            in_asw_square_string =
                x1_in +
                "," +
                y1_in +
                " " + //забиваем полученные координаты в строку для SVG
                x1_in +
                "," +
                y2_in +
                " " +
                x2_in +
                "," +
                y2_in +
                " " +
                x2_in +
                "," +
                y1_in;

            //теперь выберем только те кружки которые попадают в узкую полоску между ними

            if (circleX >= x1_out && circleX <= x2_out && circleY >= y1_out && circleY <= y2_out) {
                // сначало ограничиваем наружный квадрат (out)
                if (!(circleX >= x1_in && circleX <= x2_in && circleY >= y1_in && circleY <= y2_in)) {
                    //затем ограничиваем внутренний квадрат (in) - в него нельзя попадать
                    //когда мы выделили нужные кружки - мы начинаем проверять их на совпадение, т.к. в углах могут быть совпадения
                    var coincidence = false; //здесь мы отмечаем случилось ли совпадение с одним из уже имеющихся эрреев
                    var arr2 = [circleX, circleY]; //итак у нас есть кандидат на вставление в эррей расчетных стержней

                    if (aswCircles.length === 0) {
                        //если он первый, то его сразу вставляем
                        /*
                        here we introduce check for openings tangents. And if it is OK - we push our arr2 to the aswCircles. All circles should have calculated angles.
                        */
                        if (st.openingIsNear) {
                            if (!checkCirclesOpenings(arr2, u_cut_angles)) {
                                aswCircles.push(arr2);
                            }
                        } else {
                            aswCircles.push(arr2);
                        }
                    }
                    for (var i = 0; i < aswCircles.length; i++) {
                        //если он не первый, то начинаем его поочередно сравнивать со всеми эрреями в aswCircles. Если совпадений нет, то вставляем
                        var local_result = [false, false]; // это результат - здесь мы будем ставить галочки, какой из элементов эррея совпал. Если хоть один не совпал - значит это другой эррей - следовательно добавляем
                        var arr1 = aswCircles[i]; //берем один из эрреев в aswCircles
                        for (var k = 0; k < arr1.length; k++) {
                            if (arr1[k] !== arr2[k]) {
                                // если данный элемент элемент эррея кандидата не совпадает с аналогичным элементов существующего эррея - ставим галочку тру
                                local_result[k] = true; // если данный элемент не совпадает, то переходим к следующему
                            }
                        }
                        var trueNumber = 0; //здесь мы отмечаем сколько галочек получил каждый эррей в сравнении с 1 эрреем из aswCircles
                        local_result.forEach(function (e) {
                            if (e) {
                                trueNumber++;
                            }
                        }); // если мы получили хотябы одну галочку тру, значит все ок - этот эррей совсем другой и можно идти проверять дальше с другими эрреями из aswCircles. Если мы получили жаэе одной тру (все осталось фолс) - это значит этот эррей уже существует и дальше проверять нет смысла - его добавлять нельзя
                        if (trueNumber === 0) {
                            coincidence = true;
                        }
                    }
                    if (!coincidence) {
                        //после всех проверок мы смотрим есть ли у нас совпадение
                        /*
                        here we introduce check for openings tangents. And if it is OK - we push our arr2 to the aswCircles. All circles should have calculated angles.
                        */
                        if (st.openingIsNear) {
                            if (!checkCirclesOpenings(arr2, u_cut_angles)) {
                                aswCircles.push(arr2); //если совпадения нет - значит это совершенно новый кружок - добавляем
                            }
                        } else {
                            aswCircles.push(arr2); //если совпадения нет - значит это совершенно новый кружок - добавляем
                        }
                    }
                }
            }
        }

        var shear_bars_diameter = Number(st.shear_bars_diameter); //конвертируем диаметр стержня в число ("6" в 6);
        var asw_tot = aswCircles.length * 3.142 * Math.pow(shear_bars_diameter / 2, 2); // вычисляем общую  площадь поперечной арматуры (мм2)
        asw_tot = Number(asw_tot.toFixed(3));

        this.setState(
            {
                out_asw_square: out_asw_square,
                out_asw_square_string: out_asw_square_string,
                in_asw_square: in_asw_square,
                in_asw_square_string: in_asw_square_string,
                asw_tot: asw_tot,
                aswCircles: aswCircles,
            },
            function () {
                this.calculate();
            }
        );
    }

    calculate() {
        //здесь мы собрали все исходные данные и делаем расчет как в СП
        var st = this.state;
        var check = checkDataAdequacy(st); //сначало проверяем наличие всех исходных данных. Заполнены ли все поля. Получаем на выходе ээрай с незаполненными графами
        if (check.length === 0) {
            //если длина этого эррэя равна нулю, значит все ок и можно приступать к расчету
            var h0 = st.t_slab_size - st.a_slab_size; //рабочая высота сечения, мм
            // console.log("h0 = " + h0 + " мм");
            var rbt = concrete_properties[st.concrete_grade][1] * 0.001 * st.gamma_b; //считаем Rbt, кН/мм2 -основаная единица
            rbt = Number(rbt.toFixed(8)); //округляем
            // console.log("Rbt = " + rbt + " кНмм2");
            var geom_chars = st.geom_chars;
            var u = geom_chars.u; //длина расчетного контура, мм
            var wbx = geom_chars.wbx; //момент сопротивления сечения wbx, мм2
            var wby = geom_chars.wby; //момент сопротивления сечения wby, мм2
            // console.log("u = " + u + " мм");
            // считаем Mx
            var mbx_ult = rbt * wbx * h0; //прочность бетона на действие Mx
            mbx_ult = Number(mbx_ult.toFixed(2)); //округляем
            // console.log("mbx_ult = " + mbx_ult + " кН*мм");

            // считаем My
            var mby_ult = rbt * wby * h0; //прочность бетона на действие My
            mby_ult = Number(mby_ult.toFixed(2)); //округляем
            // console.log("mby_ult = " + mby_ult + " кН*мм");

            // считаем N
            var ab = u * h0; //площадь расчетного поперечного сечения, мм2
            ab = Number(ab.toFixed(3));
            // console.log("Ab = " + ab + " мм2");

            //Считаем сколько несет бетон на продольную силу - формула 8.88. Весь расчет будет происходить в единицах измерения по умолчанию: кN, кNм, мм
            var fb_ult = rbt * ab; // получаем кН/мм2 * мм2 = кН
            fb_ult = Number(fb_ult.toFixed(2)); //округляем до 2 знака после запятой
            // console.log("fb_ult = " + fb_ult + " кН");

            var shear_reinf = calculateShearReinf(st);
            var fsw_ult = shear_reinf.fsw_ult; //прочность по арматуре на действие N
            // console.log("fsw_ult = " + fsw_ult + " кН");
            var f_ult = fb_ult + fsw_ult; //полная прочность сечения на действие N
            f_ult = Number(f_ult.toFixed(3)); //округляем
            // console.log("f_ult = " + f_ult + " кН");

            // считаем Mx
            var mswx_ult = shear_reinf.mswx_ult;
            // console.log("mswx_ult = " + mswx_ult + " кН*мм");

            // считаем My
            var mswy_ult = shear_reinf.mswy_ult;
            // console.log("mswy_ult = " + mswy_ult + " кН*мм");

            //считаем коэффициенты запаса
            var n_factor = st.n_load / f_ult; //считаем коэфф запаса по N
            n_factor = Number(n_factor.toFixed(3));

            var m_factor_1;
            var mx_1;
            var my_1;
            if (st.slab_edge_type === "" && !st.openingIsNear) {
                //если u просто прямоугольник, т.е. нет рядом краев плит и отверстий
                m_factor_1 = (st.mx_load * 1000) / (mbx_ult + mswx_ult) + (st.my_load * 1000) / (mby_ult + mswy_ult); //считаем коэф. запаса по моментам. Переводим моменты кНм в кН*мм
            }

            if (st.slab_edge_type === "" && st.openingIsNear) {
                //если u просто прямоугольник и есть отверстия - докидываем моменты от расцентровки
                mx_1 = Math.abs(st.mx_load * 1000) + Math.abs(st.n_load * geom_chars.cut_xc);
                mx_1 = Number(mx_1.toFixed(2));
                my_1 = Math.abs(st.my_load * 1000) + Math.abs(st.n_load * geom_chars.cut_yc);
                my_1 = Number(my_1.toFixed(2));
                m_factor_1 = mx_1 / (mbx_ult + mswx_ult) + my_1 / (mby_ult + mswy_ult); //считаем коэф. запаса по моментам. Переводим моменты кНм в кН*мм
            }

            if (st.slab_edge_type !== "" && !st.openingIsNear) {
                //если ,близко край плиты и нет отверстия - докидываем моменты от расцентровки
                mx_1 = Math.abs(st.mx_load * 1000) + Math.abs(st.n_load * geom_chars.xc);
                mx_1 = Number(mx_1.toFixed(2));
                my_1 = Math.abs(st.my_load * 1000) + Math.abs(st.n_load * geom_chars.yc);
                my_1 = Number(my_1.toFixed(2));
                m_factor_1 = mx_1 / (mbx_ult + mswx_ult) + my_1 / (mby_ult + mswy_ult); //считаем коэф. запаса по моментам. Переводим моменты кНм в кН*мм
            }

            if (st.slab_edge_type !== "" && st.openingIsNear) {
                //если ,близко край плиты и есть отверстия - докидываем моменты от обоих расцентровак
                mx_1 = Math.abs(st.mx_load * 1000) + Math.abs(st.n_load * geom_chars.xc) + Math.abs(st.n_load * geom_chars.cut_xc);
                mx_1 = Number(mx_1.toFixed(2));
                my_1 = Math.abs(st.my_load * 1000) + Math.abs(st.n_load * geom_chars.yc) + Math.abs(st.n_load * geom_chars.cut_yc);
                my_1 = Number(my_1.toFixed(2));
                m_factor_1 = mx_1 / (mbx_ult + mswx_ult) + my_1 / (mby_ult + mswy_ult); //считаем коэф. запаса по моментам. Переводим моменты кНм в кН*мм
            }

            m_factor_1 = Number(m_factor_1.toFixed(3));
            // console.log(n_factor + ", " + m_factor_1);

            var m_factor_2;
            if (m_factor_1 > 0.5 * n_factor) {
                // m_factor принимается не более чем 0.5*n_factor. Пункт 8.1.46
                m_factor_2 = 0.5 * n_factor;
                m_factor_2 = Number(m_factor_2.toFixed(3));
            } else {
                m_factor_2 = m_factor_1;
            }

            //считаем общий коэффициент запаса
            // console.log(n_factor + ", " + m_factor_2);
            var factor = n_factor + m_factor_2; //считаем общий коэф. запаса.
            factor = Number(factor.toFixed(3));
            var result = "";
            var result_color = "";
            if (factor <= 1 && factor >= 0) {
                //формируем фразу и цвет результата
                result = "Прочность обеспечена. Коэффициент использования = " + factor;
                result_color = "success";
            }
            if (factor > 1) {
                result = "Прочность не обеспечена. Коэффициент использования = " + factor;
                result_color = "danger";
            }
            if (factor < 0) {
                result = "Хм... Что-то пошло не так. Коэффициент использования отрицательный = " + factor + ". Попробуйте изменить исходные данные.";
                result_color = "secondary";
            }
            // console.log(result);
            this.setState({
                text_result: result, //обновляем стейт результатом расчета
                result_color: result_color,
                report_data: {
                    h0: h0,
                    rbt: rbt,
                    u: u,
                    ab: ab,
                    wbx: wbx,
                    wby: wby,
                    size_u_left: geom_chars.size_u_left,
                    size_u_top: geom_chars.size_u_top,
                    size_u_right: geom_chars.size_u_right,
                    size_u_bottom: geom_chars.size_u_bottom,
                    cut_off: geom_chars.cut_off,
                    ibx: geom_chars.ibx,
                    iby: geom_chars.iby,
                    mbx_ult: mbx_ult,
                    mby_ult: mby_ult,
                    fb_ult: fb_ult,
                    fsw_ult_1: shear_reinf.fsw_ult_1,
                    fsw_ult: fsw_ult,
                    f_ult: f_ult,
                    mswx_ult_1: shear_reinf.mswx_ult_1,
                    mswx_ult: mswx_ult,
                    mswy_ult_1: shear_reinf.mswy_ult_1,
                    mswy_ult: mswy_ult,
                    n_factor: n_factor,
                    m_factor_1: m_factor_1,
                    m_factor_2: m_factor_2,
                    factor: factor,
                    asw_sw: shear_reinf.asw_sw,
                    qsw: shear_reinf.qsw,
                    mx_1: mx_1,
                    my_1: my_1,
                    sx: geom_chars.sx,
                    sy: geom_chars.sy,
                    xa: geom_chars.xa,
                    ya: geom_chars.ya,
                    xc: geom_chars.xc,
                    yc: geom_chars.yc,
                    xmax: geom_chars.xmax,
                    ymax: geom_chars.ymax,
                    lx: geom_chars.lx,
                    ly: geom_chars.ly,
                    xmax_op: geom_chars.xmax_op,
                    ymax_op: geom_chars.ymax_op,
                    cut_off_ibx: geom_chars.cut_off_ibx,
                    cut_off_iby: geom_chars.cut_off_iby,
                    cut_off_sx: geom_chars.cut_off_sx,
                    cut_off_sy: geom_chars.cut_off_sy,
                    cut_xc: geom_chars.cut_xc,
                    cut_yc: geom_chars.cut_yc,
                    cut_chars: geom_chars.cut_chars,
                },
            });
        } else {
            // если длина эррэя check не равна нулю, то создаем фразу со списком недостающих данных
            var phrase = createInsufficientPhrase(check);
            this.setState({
                text_result: "Заданы не все исходные данные. Пожалуйста заполните следующие графы: " + phrase + ".",
                result_color: "secondary",
            });
        }

        function calculateShearReinf(st) {
            //Считаем сколько несет арматура - формула 8.91
            var result = {
                fsw_ult_1: 0,
                fsw_ult: 0,
                mswx_ult_1: 0,
                mswx_ult: 0,
                mswy_ult_1: 0,
                mswy_ult: 0,
                asw_sw: 0,
                qsw: 0,
            };

            if (st.shear_reinforcement) {
                //если расчет по поперечке включен то считаем
                var rsw = rebar_properies[st.shear_bars_grade] * 0.001; // считаем Rsw, кН/мм2
                // console.log("Rsw = " + rsw + " кНмм2");

                // считаем fsw_ult
                var asw_tot = st.asw_tot; //определим сколько арматуры попадает в зазор 0,5h0 по обе стороны от u.
                // console.log("asw_tot = " + asw_tot + " мм2 и " + asw_tot * 0.01 + "см2");
                result.asw_sw = asw_tot / u; //отношение Asw/sw - погонная арматура
                result.asw_sw = Number(result.asw_sw.toFixed(3));
                result.qsw = rsw * result.asw_sw;
                result.qsw = Number(result.qsw.toFixed(3));
                // console.log("qsw = " + result.qsw + " кНмм = " + 1000 * result.qsw + " кгсм");
                result.fsw_ult_1 = 0.8 * result.qsw * u; //  кН/мм2 * мм2
                result.fsw_ult_1 = Number(result.fsw_ult_1.toFixed(3)); //округляем
                result.fsw_ult = result.fsw_ult_1;
                if (result.fsw_ult_1 < 0.25 * fb_ult) {
                    //проверка п. 8.1.48
                    result.fsw_ult = 0;
                }
                if (result.fsw_ult_1 > fb_ult) {
                    result.fsw_ult = fb_ult;
                }
                // конец расчета fsw_ult

                // считаем mswx_ult и mswy_ult

                result.mswx_ult_1 = 0.8 * result.qsw * wbx; // формула 8.97. wswx = wbx
                result.mswx_ult_1 = Number(result.mswx_ult_1.toFixed(3)); //округляем
                result.mswy_ult_1 = 0.8 * result.qsw * wby;
                result.mswy_ult_1 = Number(result.mswy_ult_1.toFixed(3)); //округляем
                result.mswx_ult = result.mswx_ult_1;
                result.mswy_ult = result.mswy_ult_1;
                if (result.mswx_ult_1 > mbx_ult) {
                    //проверка п. 8.1.48
                    result.mswx_ult = mbx_ult;
                }
                if (result.mswy_ult_1 > mby_ult) {
                    result.mswy_ult = mby_ult;
                }

                // конец расчета mswx_ult и mswy_ult
            } else {
                //если расчет по поперечки выключен то fsw_ult = 0
                result.fsw_ult_1 = 0;
                result.fsw_ult = 0;
                result.mswx_ult_1 = 0;
                result.mswx_ult = 0;
                result.mswy_ult_1 = 0;
                result.mswy_ult = 0;
                result.asw_sw = 0;
                result.qsw = 0;
            }
            return result;
        }
    }

    handleEnterKey(e) {
        //по нажатию Enter формируем отчет
        var key = e.keyCode;
        if (key === 13 && this.state.result_color !== "secondary") {
            exportToWord(this.state);
        }
    }

    componentDidMount() {
        this.updateWindowDimensions();
        window.addEventListener("resize", this.updateWindowDimensions);
        window.addEventListener("keydown", this.handleEnterKey);
    }

    updateWindowDimensions() {
        //здесь мы управляем размером картинки чтобы влезало на все экраны
        var position_fixed = false;
        var width;
        var svg_size;
        if (window.screen.width < window.innerWidth) {
            // для мобильных браузеров
            width = window.screen.width;
        } else {
            width = window.innerWidth;
        }
        if (width >= 768 && !this.state.show_help) {
            position_fixed = true;
        }
        this.setState({ svg_position_fixed: position_fixed }, function () {
            if (window.innerHeight > 830) {
                if (width >= 1300) {
                    svg_size = 500;
                } else if (width >= 1150 && width <= 1299) {
                    svg_size = 450;
                } else if (width >= 1000 && width <= 1149) {
                    svg_size = 400;
                } else if (width >= 768 && width <= 999) {
                    svg_size = 350;
                } else if (width >= 540 && width <= 767) {
                    svg_size = 500;
                } else if (width < 540) {
                    svg_size = width - 40;
                }
                this.setState({ svg_size: svg_size, v_width: width });
            }
            if (window.innerHeight <= 830 && window.innerHeight > 680) {
                if (width >= 1300) {
                    svg_size = 400;
                } else if (width >= 1150 && width <= 1299) {
                    svg_size = 350;
                } else if (width >= 1000 && width <= 1149) {
                    svg_size = 300;
                } else if (width >= 768 && width <= 999) {
                    svg_size = 250;
                } else if (width >= 530 && width <= 767) {
                    svg_size = 500;
                } else if (width <= 529) {
                    svg_size = width - 40;
                }
                this.setState({ svg_size: svg_size, v_width: width });
            }
            if (window.innerHeight <= 680) {
                position_fixed = false;
                this.setState({ svg_position_fixed: position_fixed }, function () {
                    if (width >= 1300) {
                        svg_size = 400;
                    } else if (width >= 1150 && width <= 1299) {
                        svg_size = 350;
                    } else if (width >= 1000 && width <= 1149) {
                        svg_size = 300;
                    } else if (width >= 768 && width <= 999) {
                        svg_size = 250;
                    } else if (width >= 530 && width <= 767) {
                        svg_size = 500;
                    } else if (width <= 529) {
                        svg_size = width - 40;
                    }
                    this.setState({ svg_size: svg_size, v_width: width });
                });
            }
        });
    }

    render() {
        // console.log(this.state);
        return (
            <Fragment>
                <Container fluid={true} className="pb-4 mb-5">
                    <Header onHelpPush={this.getData} globalState={this.state} />
                    <Help globalState={this.state} />
                    <Row>
                        <Col>
                            <div>
                                <UnitsOfMeasurement onUnitsChange={this.getData} />
                                <Loads onLoadChange={this.getData} globalState={this.state} />
                                <ColumnSize onColumnSizeChange={this.getData} globalState={this.state} />
                            </div>
                        </Col>
                        <Col md>
                            <div>
                                <SlabSize onSlabSizeChange={this.getData} globalState={this.state} />
                                <Concrete onConcreteChange={this.getData} />

                                <ShearReinforcementSelect onShearReinforcementSelectChange={this.getData} globalState={this.state} />
                                <Collapse in={this.state.shear_reinforcement}>
                                    <div>
                                        <ShearReinforcement globalState={this.state} onShearReinforcementChange={this.getData} />
                                    </div>
                                </Collapse>

                                <SlabEdgeSelect onSlabEdgeSelectChange={this.getData} globalState={this.state} />
                                <Collapse in={this.state.slab_edge}>
                                    <div>
                                        <SlabEdgeData globalState={this.state} onSlabEdgeDataChange={this.getData} />
                                    </div>
                                </Collapse>

                                <OpeningIsNearSelect onOpeningIsNearSelectChange={this.getData} globalState={this.state} />
                                <Collapse in={this.state.openingIsNear}>
                                    <div>
                                        <OpeningIsNearData globalState={this.state} onOpeningIsNearChange={this.getData} />
                                    </div>
                                </Collapse>
                            </div>
                        </Col>
                        <div style={{ flexGrow: 0, flexShrink: 0, flexBasis: this.state.svg_size + 30 }} className="my-sidebar">
                            <div className="position-relative">
                                <div className={this.state.svg_position_fixed ? "position-fixed" : ""}>
                                    <Sketch onSketchChange={this.getData} globalState={this.state} />
                                    <ViewSettings onViewSettingstChange={this.getData} globalState={this.state} />
                                    <Result globalState={this.state} />
                                    <Button
                                        variant="primary"
                                        className={
                                            (this.state.result_color !== "secondary" ? "" : "invisible") +
                                            (window.innerHeight > footer_appear || this.state.v_width <= 768 ? "" : " mt-3")
                                        }
                                        onClick={() => exportToWord(this.state)}
                                    >
                                        Сохранить как MS Word
                                    </Button>
                                    <canvas id="buffer" width="0" height="0" style={{ display: "none" }}></canvas>
                                </div>
                            </div>
                        </div>
                    </Row>
                </Container>
                <div className={window.innerHeight > footer_appear || this.state.v_width <= 768 ? "invisible" : "footer"}>
                    <div className={"alert " + "alert-" + this.state.result_color + " footer_alert p-2"} data-testid="text_result">
                        {this.state.text_result}
                    </div>
                </div>
            </Fragment>
        );
    }
}

export default App;
