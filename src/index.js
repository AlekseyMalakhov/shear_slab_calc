import React, { useState, useEffect, Fragment } from 'react';
import ReactDOM from "react-dom";
import "./index.css";
import "./bootstrap.min.css";
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import ToggleButton from 'react-bootstrap/ToggleButton'
import Canvg from 'canvg';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, Media, AlignmentType } from "docx";

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

var concrete_properties = {         //Rb, Rbt, МПа
    b10: [6, 0.56],
    b15: [8.5, 0.75],                                 
    b20: [11.5, 0.9],
    b25: [14.5, 1.05],
    b30: [17, 1.15],
    b35: [19.5, 1.3],
    b40: [22, 1.4],
    b45: [25, 1.5],
    b50: [27.5, 1.6],
    b55: [30, 1.7],
    b60: [33, 1.8],
    b70: [37, 1.9],
    b80: [41, 2.1],
    b90: [44, 2.15],
    b100: [47.5, 2.2]
}

var rebar_properies = {         //Rsw, МПа
    a240c: 170,                                 
    a400c: 280,
    a500c: 300
}

var unitFactor = {                      //коэффициенты перевода единиц
                force_units: {
                    кН: 1,               //основная единица внутренних расчетнов
                    т: 9.807
                },
                length_units: {
                    мм: 1,              //основная единица внутренних расчетов
                    см: 10,
                    м: 1000
                }
}

//всякие вспомогательные функции

function checkDataAdequacy(state) {                             // проверяем достаточность исходных данных. Если каких то данных нет - добавляем их в результат
    var result = [];
    var id;
    var names = {
        input_n_load: "сила N",
        input_t_slab_size: "толщина плиты",
        input_a_slab_size: "привязка арматуры плиты",
        a_column_size: "размер колонны вдоль X",
        b_column_size: "размер колонны вдоль Y",
    };
	for (id in state) {
        if (!state[id] && (id !== "shear_reinforcement")        // тут мы проверяем незаполненные поля, кроме исключений, таких как shear_reinforcement, asw_tot и необязательных, таких как mx_load
                        && (id !== "slab_edge")
                        && (id !== "openingIsNear")
                        && (id !== "mx_load")
                        && (id !== "my_load")
                        && (id !== "input_mx_load")
                        && (id !== "input_my_load")
                        && (id !== "asw_tot")
                        && (id !== "edge_left")
                        && (id !== "edge_right")
                        && (id !== "edge_top")
                        && (id !== "edge_bottom")
                        && (id !== "input_edge_left_dist")
                        && (id !== "input_edge_right_dist")
                        && (id !== "input_edge_top_dist")
                        && (id !== "input_edge_bottom_dist")
                        && (id !== "edge_left_dist")
                        && (id !== "edge_right_dist")
                        && (id !== "edge_top_dist")
                        && (id !== "edge_bottom_dist")
                        && (id !== "out_asw_square")
                        && (id !== "out_asw_square_string")
                        && (id !== "in_asw_square")
                        && (id !== "in_asw_square_string")
                        && (id !== "svg_position_fixed")
                        && (id !== "slab_edge_type")
                        && (id !== "show_help")
                        && (id !== "u_show")
                        && (id !== "in_out_asw_show")
                        && (id !== "op_tangents_show")
                        && (id !== "merged_angls")
                        && (id !== "n_load")
                        && (id !== "t_slab_size")
                        && (id !== "a_slab_size")
                         ) {
                            result.push(names[id]);                //если в state есть незаполненная графа - добавляем её в результат
        }
    }
    if (state.a_column_size === 1) {
        result.push(names.a_column_size);
    }
    if (state.b_column_size === 1) {
        result.push(names.b_column_size);
    }
    if (state.shear_reinforcement && ((state.shear_bars_number.X.length - 1) !== state.shear_bars_row_number)) {    //если мы считаем поперечку и не заполнены все столбцы Х, то ошибка
        result.push("количество стержней вдоль X");
    }
    if (state.shear_reinforcement && ((state.shear_bars_number.Y.length - 1) !== state.shear_bars_row_number)) {        //если мы считаем поперечку и не заполнены все столбцы Y, то ошибка
        result.push("количество стержней вдоль Y");
    }
    if (state.shear_reinforcement && ((state.input_shear_bars_spacing_to_prev.length - 1) !== state.shear_bars_row_number)) {     //если мы считаем поперечку и не заполнены все расстояния до предыдцщего, то ошибка
        result.push("привязка ряда поперечной арматуры к предыдущему ряду");
    }
    if (state.shear_reinforcement && (state.aswCircles.length === 0) && (state.circlesX.length > 0)) {     //если у нас есть стержни, но они не попадают в расчетный контур
        result.push("Ни один из стержней армирования не попадает в расчетную зону");
    }
    return result;
}

function createInsufficientPhrase(result) {     // компануем фразу со списком нехватающих данных. берем array с названиями незаполненных граф
    var phrase = "";
    result.forEach((item, index) => {               
        if (index === 0) {                      // если в эррэе только 1 элемент  - берем его и все.
            phrase = item;
        } else {                                   //для последующих берем старую фразу, добавляем запятую и только после неё вставляем название незаполненной графы
            phrase = phrase + ", " + item;
        }
    });
    return phrase;
}

function findIntersect(u_line, tangent) {            // line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
    var x1 = u_line[0];
    var y1 = u_line[1];
    var x2 = u_line[2];
    var y2 = u_line[3];

    var x3 = tangent[0];
    var y3 = tangent[1];
    var x4 = tangent[2];
    var y4 = tangent[3];

    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {             // Check if none of the lines are of length 0
        return false;
    }
    var denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))
    
    if (denominator === 0) {                                                       // Lines are parallel
        return false;
    }
   
    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
    
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {                                  // is the intersection along the segments
        return false;
    }

    let x = x1 + ua * (x2 - x1);                    // Return an array with the x and y coordinates of the intersection
    x = Number(x.toFixed(3));
    let y = y1 + ua * (y2 - y1);
    y = Number(y.toFixed(3));
    return [x, y];
}

function findAngleReal(coords) {                                      //находим углы относительно 0,0. findAngle и findAngleReal эти две функции одинаковые по сути и их можно (НУЖНО!) в будущем объединить в одну. Щас просто нет времени 
    var result;
    if (coords.length !== 2) {
        result = 1;
        return result;
    }
    var angle = Math.atan(coords[0]/coords[1]) * 180/Math.PI ;
    if ((coords[0] >= 0) && (coords[1] >= 0)) {                               // право верх
        result = angle;
    }
    if ((coords[0] > 0) && (coords[1] < 0)) {                               // право низ
        result = angle + 180;
    }
    if ((coords[0] <= 0) && (coords[1] < 0)) {                               // лево низ
        result = angle + 180;
    }
    if ((coords[0] < 0) && (coords[1] >= 0)) {                               // лево верх
        result = angle + 360;
    }
    result = Number(result.toFixed(3));
    return result;                   //округляем до 3 знака после запятой
}

function findAngle(coords) {                                                        //находим углы относительно 250,250         
    var BC = Math.sqrt(Math.pow(250-coords[0],2)+ Math.pow(250-coords[1],2)); 
    var AC = Math.sqrt(Math.pow(coords[0]-250,2)+ Math.pow(coords[1],2));
    var angle = Math.acos((BC*BC+250*250-AC*AC) / (2*BC*250)) * (180 / Math.PI);
    if (coords[0] < 250) {                                 //если слева от оси У то прибавляем угол справа, чтобы угол всегда отсчитывался от вертикали по часовой стрелке
        angle = 180 + (180 - angle);
    }
    return Number(angle.toFixed(3));                    //округляем до 3 знака после запятой
}

function checkOpeningDistance(st, opening_number) {             //проверяем данное отверстие, расположено ли оно достаточно близко чтобы мы его учитывали в расчете
    //Сначало замеряем расстояние между всеми точками колонны и всеми точками отверстия. Результат каждого замера сверяем с 6h. Если все ок, замеряем расстояние между всеми точками колонны и всеми линиями отверстия. После каждого замера сверяем результат с 6h
                                                                //openingsDisplayCoords: [x1, y1, x2, y2], координаты прямоугольника отверстия для отображения
    var c_cord = st.columnRealCoords;                        //реальные координаты углов колонны
    var o_cord = st.openingsRealCoords[opening_number];      //реальные координаты углов отверстия

    var c_cord_p1 = [c_cord[0], c_cord[1]];                 //точка колонны x1, y1
    var c_cord_p2 = [c_cord[2], c_cord[1]];                 //точка колонны x2, y1
    var c_cord_p3 = [c_cord[2], c_cord[3]];                 //точка колонны x2, y2
    var c_cord_p4 = [c_cord[0], c_cord[3]];                 //точка колонны x1, y2

    var o_cord_p1 = [o_cord[0], o_cord[1]];                 //точка отверстия x1, y1
    var o_cord_p2 = [o_cord[2], o_cord[1]];                 //точка отверстия x2, y1
    var o_cord_p3 = [o_cord[2], o_cord[3]];                 //точка отверстия x2, y2
    var o_cord_p4 = [o_cord[0], o_cord[3]];                 //точка отверстия x1, y2

    var c_cord_points = [c_cord_p1, c_cord_p2, c_cord_p3, c_cord_p4];           //эррей точек колонны
    var o_cord_points = [o_cord_p1, o_cord_p2, o_cord_p3, o_cord_p4];           //эррей точек отверстия

    var dist;
    /*
    var distance = [];
    */

    // сначало проверяем расстояние от всех точек колонны до всех точек отверстия

    for (var i = 0; i < c_cord_points.length; i++) {                          //рассчитываем расстояние между всем точками колонны и всеми точками отверстия и сверяем его с 6h. Если оно меньше - сразу возвращаем true и останавливаем итерацию
        for (var k = 0; k < o_cord_points.length; k++) {
            dist = distanceTwoPoints(c_cord_points[i], o_cord_points[k]);
            /*
            distance.push(dist);
            console.log(distance);
            */
            if (dist < 6*st.t_slab_size) {
                return true;
            }
        }
    }

    // теперь проверяем расстояние от всех точек колонны до всех линий отверстия

    var o_cord_l1 = [o_cord[0], o_cord[1], o_cord[2], o_cord[1]];         //линия отверстия [x1, y1, x2, y1]
    var o_cord_l2 = [o_cord[2], o_cord[1], o_cord[2], o_cord[3]];         //линия отверстия [x2, y1, x2, y2]
    var o_cord_l3 = [o_cord[2], o_cord[3], o_cord[0], o_cord[3]];         //линия отверстия [x2, y2, x1, y2]
    var o_cord_l4 = [o_cord[0], o_cord[3], o_cord[0], o_cord[1]];         //линия отверстия [x1, y2, x1, y1]

    var o_cord_lines = [o_cord_l1, o_cord_l2, o_cord_l3, o_cord_l4];

    for (var j = 0; j < c_cord_points.length; j++) {                          //рассчитываем расстояние между всем точками колонны и всеми линиями отверстия и сверяем его с 6h. Если оно меньше - сразу возвращаем true и останавливаем итерацию
        for (var f = 0; f < o_cord_lines.length; f++) {
            dist = pDistance(c_cord_points[j], o_cord_lines[f]);
            /*
            distance.push(dist);
            console.log(distance);
            */
            if (dist < 6*st.t_slab_size) {
                return true;
            }
        }
    }

    return false;
}

function distanceTwoPoints(point1, point2) {            // point1 = [x1, y1], point2 = [x2, y2]
    var x1 = point1[0];
    var y1 = point1[1];
    var x2 = point2[0];
    var y2 = point2[1];
    var a = x1 - x2;
    var b = y1 - y2;
    var dist = Math.sqrt( a*a + b*b );
    dist = Number(dist.toFixed(2));                     //округляем
    return dist;
}

function pDistance(point, line) {                  //from here https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
    var A = point[0] - line[0];                                         // point = [x, y]
    var B = point[1] - line[1];                                         // line = [x1, y1, x2, y2]
    var C = line[2] - line[0];
    var D = line[3] - line[1];

    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq !== 0) //in case of 0 length line
        param = dot / len_sq;

    var xx, yy;

    if (param < 0) {
        xx = line[0];
        yy = line[1];
    }
    else if (param > 1) {
        xx = line[2];
        yy = line[3];
    }
    else {
        xx = line[0] + param * C;
        yy = line[1] + param * D;
    }

    var dx = point[0] - xx;
    var dy = point[1] - yy;

    var dist = Math.sqrt(dx * dx + dy * dy);
    dist = Number(dist.toFixed(3));                     //округляем
    return dist;
}

function checkOverlap(t1, t2) {                 //проверяем 2 треугольника - не накладываются ли они
    var int = [];
    var t1_1, t1_2, t1_3;                   //линии составляющие 1 и 2 треугольник
    var t2_1, t2_2, t2_3;

    t1_1 = [0, 0, t1[0], t1[1]];                //линии составляющие 1 треугольник - эррей [x1, y1, x2, y2]
    t1_2 = [0, 0, t1[2], t1[3]];
    t1_3 = [t1[0], t1[1], t1[2], t1[3]];

    t2_1 = [0, 0, t2[0], t2[1]];                //линии составляющие 1 треугольник - эррей [x1, y1, x2, y2]
    t2_2 = [0, 0, t2[2], t2[3]];
    t2_3 = [t2[0], t2[1], t2[2], t2[3]];

    var lines1 = [t1_1, t1_2, t1_3];
    var lines2 = [t2_1, t2_2, t2_3];

    for (var i = 0; i < lines1.length; i++) {               //если хоть 1 линия пересекается - треугольникик наложились
        for (var j = 0; j < lines2.length; j++) {
            int = findIntersect(lines1[i], lines2[j]);
            if (int && int[0] !==0 && int[1] !==0) {
                /*
                console.log("Линия 1_" + i + " и линия 2_" + j + " пересеклись");
                console.log("Точка пересечения " + int);
                */
               return true;
            }
        }
    }    
    return false;  
}

function sumTriangles(angles) {             //складываем 2 наложившихся треугольника вместе и получаем итоговый треугольник
    /*
    var angles = [242.632, 128.66, 214.695, 67.62];
    */
    var triang_fin = [];                                  // итоговый треугольник получаемый после слияния двух пересекающихся треугольников
    // чтобы все хорошо работало упорядочиваем наши углы в нужном порядке для каждого отверстия - сначало маленький угол - потом большой.
    var tang0 = Math.min(angles[0], angles[1]);                 //отверстие 1      
    var tang1 = Math.max(angles[0], angles[1]);
    var tang2 = Math.min(angles[2], angles[3]);                //отверстие 2
    var tang3 = Math.max(angles[2], angles[3]);
    /*
    console.log(tang0 + ", " + tang1 + ", " + tang2 + ", " + tang3);
    */
    //если стандартный случай, т.е. сравниваемые отверстия полностью лежат в 1, 2, 3 или 4 квадранте
    //т.е. если первое отверстие не лежит на половину в 1 на половину во 2 квадранте
    // и если второе отверстие не лежит на половину в 1 на половину во 2 квадранте
    if (!((tang0 < 90) && (tang1 > 270)) && !((tang2 < 90) && (tang3 > 270))) {
        triang_fin[0] = Math.min(tang0, tang1, tang2, tang3);                   //первая сторона треугольника (маленький угол)
        triang_fin[1] = Math.max(tang0, tang1, tang2, tang3);                   //вторая сторона треугольника (большой угол)
    } else {
        // если отверстие лежит на половину в 1 и на половину во 2 квадранте
        // в нестандартном случае у нас всегда часть углов лежит в 1 квадранте, часть во 2
        // в 1 квадранте мы выбираем угол с максимальным значением, во 2 квадранте выбираем угол с минимальным значением

        // сначало смотрим какие у нас углы лежат в 1 квадранте, какие во втором.
        var tngs = [tang0, tang1, tang2, tang3];                // кидаем наши углы в эррей
        var non_st = {                                       // здесь будут отсортированы углы нестандартного случая
            fst_quad: [],                                        // 1 квадрант
            snd_quad: []                                         // 2 квадрант
        }
        for (var s = 0; s < tngs.length; s++) {                // и проходимся по ним проверкой
            if ((tngs[s] > 0) && (tngs[s] <= 90)) {
                non_st.fst_quad.push(tngs[s]);                  // если угол в первом квадранте то добавляем его в список первого квадранта
            } else {
                non_st.snd_quad.push(tngs[s]);                  // если угол во втором то добавляем его в список второго квадранта
            }
        }
        triang_fin[0] = Math.min(...non_st.snd_quad);                   //первая сторона треугольника находится во 2 квадранте - выбираем самый маленький угол
        triang_fin[1] = Math.max(...non_st.fst_quad);                   //вторая сторона треугольника находится в 1 квадранте - выбираем самый большой угол
    }
    return triang_fin;
}

function merge(angles) {                   //1 проходка на слияние
    /*  [
        [67.62, 298.301]
        [332.103, 214.695]
        [242.632, 128.66]
         ]        
    */
    var new_angles = [...angles];                                 // здесь мы формируем новый эррей со слитыми треугольниками
    var triang_1 = [];
    var triang_2 = [];
    var merged_angles = [];
    var sum_angles = [];
    var angle1_1, angle1_2;
    var angle2_1, angle2_2;
    var coord1_1, coord1_2;
    var coord2_1, coord2_2;
    var items_to_delete = [];
    for (var i = 0; i < angles.length; i++) {              //берем отверстие 1
        for (var j = i + 1; j < angles.length; j++) {           //берем отверстие 2 
            angle1_1 = angles[i][0];                     //здесь мы берем первую касательную 1 отверстия и записываем её угол
            angle1_2 = angles[i][1];                     //здесь мы берем вторую касательную 1 отверстия и записываем её угол
            angle2_1 = angles[j][0];                     //здесь мы берем первую касательную 2 отверстия и записываем её угол
            angle2_2 = angles[j][1];                     //здесь мы берем вторую касательную 2 отверстия и записываем её угол

            coord1_1 = findAngleCoords(angle1_1, 10000);                //находим координаты второй точки 1 касательной 1 отверстия на расстоянии 10000
            coord1_2 = findAngleCoords(angle1_2, 10000);                //находим координаты второй точки 2 касательной 1 отверстия на расстоянии 10000
            coord2_1 = findAngleCoords(angle2_1, 10000);                //находим координаты второй точки 1 касательной 2 отверстия на расстоянии 10000
            coord2_2 = findAngleCoords(angle2_2, 10000);                //находим координаты второй точки 2 касательной 2 отверстия на расстоянии 10000

            triang_1 = [coord1_1[0], coord1_1[1], coord1_2[0], coord1_2[1]];            //треугольник 1 отверстия [x1, y1, x2, y2]. Третья точка 0,0
            triang_2 = [coord2_1[0], coord2_1[1], coord2_2[0], coord2_2[1]];            //треугольник 2 отверстия [x1, y1, x2, y2]. Третья точка 0,0
            if (checkOverlap(triang_1, triang_2)) {
                console.log("Отверстия " + i + " и " + j + " накладываются");
                //делаем список удаляемых элементов, (мы не можем просто удалитиь вот так new_angles.splice(i, 1); new_angles.splice(j, 1);)
                //потому что после первого удаления нарушается нумерация эррея
                //мы булем использовать функцию удаления с while. Для этього нам нужно отсортировать номера удаляемых элементов по возрастанию
                items_to_delete = [i, j];
                items_to_delete.sort((a, b) => a - b);      //эта функция отсортировывает элемнты по возрастанию
                while(items_to_delete.length) {                     //удаляем наложившиеся отверстия
                    new_angles.splice(items_to_delete.pop(), 1);
                }
                merged_angles = [angle1_1, angle1_2, angle2_1, angle2_2];          // углы наложившихся треугольников (уг1_1, уг1_2, уг2_1, уг2_2);
                sum_angles = sumTriangles(merged_angles);
                new_angles.push(sum_angles);
                return new_angles;  
            } else {
                console.log("Отверстия " + i + " и " + j + " не накладываются");
            }
        }
    }
    return new_angles;       
}

/*
var merge_test = [
    [],
    [
        [-450, 850, 332.103],
        [-450, -650, 214.695],
    ],
    [
        [-375, 275, 306.254],
        [-375, -75, 258.69],
    ],
];

console.log(merge(merge_test));
*/

var pass;     // число проходок по эррею отверстий (просто для информации в console.log)

function mergeOpenings(opening_tangents) {              //пробуем слить пересекающиеся все треугольники касательных  в один
    var prelim_result_new = [];                                   // предварительный результат новый - эррей с углами
    var prelim_result_old = [];                                   // предварительный результат старый - эррей с углами
    var angle1;
    var angle2;
    var angles = [];                    //сюда скинем все углы касательных
    var a = 0;
    pass = 1;

    for (var i = 1; i < opening_tangents.length; i++) {              //берем отверстие 
        if (opening_tangents[i].length >= 2) {                       // если у нас вообще отверстие имеется в наличии и присчитаны две касательные. (Могут быть кстати и 3 при сторонах отверстий лежащих на осях Х и У когда касательные проведенные из двух точек имеют одинаковый угол)
            angle1 = opening_tangents[i][0][2];                     //здесь мы берем первую касательную каждого отверстия и записываем её угол
            angle2 = opening_tangents[i][1][2];                     //здесь мы берем вторую касательную каждого отверстия и записываем её угол
            angles[a] = [angle1, angle2];
            a++;
        }
    }
    /*  [
        [67.62, 298.301]
        [332.103, 214.695]
        [242.632, 128.66]
        ]        
    */
    //получили список углов касательных
    // Вот у нас получился эррей angles из углов касательный [0, 1, 2, 3, 4, 5, 6, 7] - здесь углы 0 и 1 принадлежат отверстию 0, углы 1 и 2 - отверстию 1, 
    // углы 3 и 4 - отверстию 2, углы 5 и 6 - отверстию 3 и т.д.)
    prelim_result_old = [...angles];
    prelim_result_new = merge(angles);                  //делаем первую проходку - проходимся по всем углам, пробуем найти наложение
    
    pass++;
    // если наложения нашли, значчит мы получили новый треугольник (и удалили два старых) - следовательно нужно еще раз пропустить этот блок кода 
    // (вдруг новый треугольник перексекается еще с кем то) - следовательно гоняем этот блок кода, до тех пор, пока не найдем все пересечения
    while (prelim_result_new.length < prelim_result_old.length) {           //если новый эррей углов стал меньше старого (наши слияние) пробуем еще раз
        prelim_result_old = [...prelim_result_new];                     // снимаем копию с текущего результата
        prelim_result_new = merge(prelim_result_new);
        pass++;
        if (pass === 50) {
            return;
        }
    }

    if (prelim_result_new.length === prelim_result_old.length) {     // если слияние не нашли (или слияний больше нет) старый эррей равен новому - возвращаем что получили
        return prelim_result_new;
    }  
}

/*
    var midtans_test1 = [0, 2.961, 273.399, 185.646];
    var test = [
        [],
        [[850, 350, 67.62], [-650, 350, 298.301]],
        [[-450, 850, 332.103], [-450, -650, 214.695]],
        [[-850, -440, 242.632], [550, -440, 128.66]],
    ];

    var test_res = mergeOpenings(test); 

    console.log(test_res);
*/


function tangCenter(opening_tangents) {                                     //найдем биссектрису угла между крайними касательными к отверсти
    // находим координаты касательных на расстоянии 10000 используя функцию findAngleCoords
    // находим координату центра между двумя точками используя функцию findCenter
    // находим угол данной точки используя функцию findAngleReal
    var result = [0];
    var angle1;
    var angle2;
    var coord1, coord2, center;
    for (var i = 1; i < opening_tangents.length; i++) {              //берем отверстие 
        if (opening_tangents[i].length === 2) {
            angle1 = opening_tangents[i][0][2];                     //здесь мы берем первую касательную каждого отверстия и записываем её угол
            angle2 = opening_tangents[i][1][2];                     //здесь мы берем вторую касательную каждого отверстия и записываем её угол
            console.log("i = " + i + ", " + angle1 + ", " +  angle2);
            coord1 = findAngleCoords(angle1, 10000);                //находим координаты второй точки касательной на расстоянии 10000
            coord2 = findAngleCoords(angle2, 10000);
            center = findCenter(coord1, coord2);                    //находим координаты центра между этими двумя точками
            result[i] = findAngleReal(center);                      //находим угол к данной точке
            /*
            console.log(i + " _ " + angle1 + ", " + angle2);
            console.log(i + " _ " + coord1 + ", " + coord2);
            console.log(i + " _ " + center);
            console.log(i + " _ " + result[i]);
            */
        }
    }
    return result;
}

/*
var test_op_1 = [
    [],
    [
        [600, 450, 53.13],
        [-400, 450, 318.366],
    ],
    [
        [-400, 450, 318.366],
        [600, 450, 53.13],
    ],
    [
        [-400, 450, 42],
        [600, 450, 307],
    ],
    [
        [-400, 450, 307],
        [600, 450, 42],
    ],
    [
        [625, -425, 124.216],
        [375, -775, 154.179],
    ],
];

var testtangCenter = tangCenter(test_op_1);
console.log(testtangCenter);
*/

function findAngleCoords(angle, dist) {                 // находим координаты точки от 0,0 по углу и расстоянию
    var x = dist * Math.sin(angle * Math.PI/180);                   // находим координаты второй точки касательной например на расстоянии 10000 мм
    x = Number(x.toFixed(3));                                        //округляем
    var y = dist * Math.cos(angle * Math.PI/180);
    y = Number(y.toFixed(3)); 
    var result = [x, y];
    return result; 
}

function findUIntersectPoints(angles, uRealCoords) {        //находим реальные координаты пересечения u и касательных. Примем центр как 0,0
    /*
    angles = merged_angls;
            [62.103, 304.695]
            [342.181, 257.471]
            [124.216, 154.179]
            [111.371, 143.531]

            или

            [257.471, 62.103]
            [111.371, 154.179]
    */
   var u = uRealCoords;
   var u_lines = [];
   u_lines[0] = [u[0], u[1], u[2], u[1]];                              //линии u             
   u_lines[1] = [u[2], u[1], u[2], u[3]];
   u_lines[2] = [u[2], u[3], u[0], u[3]];
   u_lines[3] = [u[0], u[3], u[0], u[1]];

   var x, y;
   var line_coords = [];
   var inters_0, inters_1, inters_2, inters_3;

   var intersection = [];
   for (var i = 0; i < angles.length; i++) {                    //номер отверстия (слитого или реального)
        intersection[i] = [];
        for (var k = 0; k < angles[i].length; k++) {
            /*
            x = 10000 * Math.sin(angles[i] * Math.PI/180);                   // находим координаты второй точки касательной например на расстоянии 10000 мм
            x = Number(x.toFixed(3));                                        //округляем
            y = 10000 * Math.cos(angles[i] * Math.PI/180);
            y = Number(y.toFixed(3));
            */
            x = findAngleCoords(angles[i][k], 10000)[0];
            y = findAngleCoords(angles[i][k], 10000)[1];
            line_coords = [0, 0, x, y];          // находим координаты второй точки касательной например на расстоянии 10000 мм [x1, y1, x2, y2]

            inters_0 = findIntersect(u_lines[0], line_coords);               // пытаемся найти пересечение касательной со сторонами u
            if (inters_0) {
                intersection[i].push(inters_0);
            }

            inters_1 = findIntersect(u_lines[1], line_coords);
            if (inters_1) {
                intersection[i].push(inters_1);
            }

            inters_2 = findIntersect(u_lines[2], line_coords);
            if (inters_2) {
                intersection[i].push(inters_2);
            }

            inters_3 = findIntersect(u_lines[3], line_coords);
            if (inters_3) {
                intersection[i].push(inters_3);
            }
        }
   }

   return intersection;
}

/*

var angles_test_2 = [
    [257.471, 62.103],
    [111.371, 154.179],
];

var uRealCoords_test2 = [-335, 185, 335, -185];
var test3int = findUIntersectPoints(angles_test_2, uRealCoords_test2);
console.log(test3int);

*/

function findCenter(p1, p2) {                           //найти центр линии между двумя точками
    var result = [];
    result[0] = (p1[0] + p2[0])/2;                      //х
    result[1] = (p1[1] + p2[1])/2;                      //y
    result[0] = Number(result[0].toFixed(2)); 
    result[1] = Number(result[1].toFixed(2)); 
    return result;
}

function findDirection(p1, p2) {                    //найти направление линии вырубки (верт/горизонт)
    var result;
    if ((p1[0] === p2[0]) && (p1[1] !== p2[1])) {
        result = "vert";
    }
    if ((p1[0] !== p2[0]) && (p1[1] === p2[1])) {
        result = "horiz";
    }
    return result;
}

function calculateCutOff(int_point_1, int_point_2) {            //считаем характеристики вырубок
    var result = {
        cut_u: 0,
        cut_ibx: 0,
        cut_iby: 0,
        cut_sx: 0,
        cut_sy: 0,
        cut_mid: "",
        dir: ""
    };
    var cut_off;                                       //размер вырубки
    var cut_mid;                                      //координаты центра вырубаемой линии
    var ibx_cut, iby_cut, sx_cut, sy_cut;              // характеристики вырубки
    var dir;                                            //направление линии вырубки (вертикальное/горизонтальное)

    cut_off = distanceTwoPoints(int_point_1, int_point_2);          // посчитали длину вырубки
    result.cut_u = cut_off;

    cut_mid= findCenter(int_point_1, int_point_2);          // координата центра вырубки
    dir = findDirection(int_point_1, int_point_2);           // направление вырубки
    if (dir === "vert") {                                   //считаем характеристики вырубки
        ibx_cut = cut_off * Math.pow(cut_mid[0], 2);
        ibx_cut = Math.floor(ibx_cut);
        result.cut_ibx = ibx_cut;
        iby_cut = Math.pow(cut_off, 3)/12 + cut_off * Math.pow(cut_mid[1], 2);
        iby_cut = Math.floor(iby_cut);
        result.cut_iby = iby_cut;
    }
    if (dir === "horiz") {
        ibx_cut = Math.pow(cut_off, 3)/12 + cut_off * Math.pow(cut_mid[0], 2);
        ibx_cut = Math.floor(ibx_cut);
        result.cut_ibx = ibx_cut;
        iby_cut = cut_off * Math.pow(cut_mid[1], 2);
        iby_cut = Math.floor(iby_cut);
        result.cut_iby = iby_cut;
    }
    sx_cut = cut_off * cut_mid[0];
    sx_cut = Math.floor(sx_cut);
    result.cut_sx = sx_cut;
    sy_cut = cut_off * cut_mid[1];
    sy_cut = Math.floor(sy_cut);
    result.cut_sy = sy_cut;
    result.cut_mid = cut_mid;       //для отчета Word
    result.dir = dir;

    return result;
}

/*  определяем положение массива отверстий относительно тангент
function findPosition(int_point_1_ang, int_point_2_ang, mid_tans, opening_tangents) {         //определяем положение массива отверстий относительно тангент. Т.е. при одном и том же угле, вырубать по малому или большому радиусу
    console.log(int_point_1_ang);
    console.log(int_point_2_ang);
    console.log(mid_tans);
    var check = [];
    var result;
    for (var i = 1; i < mid_tans.length; i++) {
        if ((mid_tans[i] >= int_point_1_ang) && (mid_tans[i] <= int_point_2_ang)) {
            result = "standard";
        } else {
            result = "non_standard";
        }
        check.push(result);
    }
    console.log(check);
    console.log(result);
    return result;
}
*/

function ptInTriangle(p, p0, p1, p2) {                  //находит, лежит ли точка внутри треугольника. Взята от сюда http://jsfiddle.net/PerroAZUL/zdaY8/1/
    var A = 1/2 * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
    var sign = A < 0 ? -1 : 1;
    var s = (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y) * sign;
    var t = (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y) * sign;
    
    return s > 0 && t > 0 && (s + t) < 2 * A * sign;
}

function createCornerList(u_corners, triangles) {   // создаем список выбитых углов для каждого отверстия
    var p0 = {
        x: 0,
        y: 0
    }; 
    var p, p1, p2;                   // р0, р1, р2 - координаты треугольника, р - координаты точки
    var corner_list = [];            //список попавших углов
    var pInTrng;                     //булеан - попал/не попал 

    for (var b = 0; b < triangles.length; b++) {
        corner_list[b] = [];
        p1 = {
            x: triangles[b][0].x,
            y: triangles[b][0].y,
        };
        p2 = {
                x: triangles[b][1].x,
                y: triangles[b][1].y,
            };

        for (var c = 0; c < u_corners.length; c++) {
            p = {};
            p.x = u_corners[c][0];
            p.y = u_corners[c][1];
            pInTrng = ptInTriangle(p, p0, p1, p2);
            if (pInTrng) {
                corner_list[b].push(c);     //если угол попал - добавляем его в список для данного отверстия
            }
        }
    }  
    return corner_list;
}

function addCornersU(coords, uRealCoords, merged_angls) {         //проверяем находятся ли реальные координаты углов u внутри треугольника касательных. 
    // Если да, то используем угол U как еще одну точку для вычисления вырубок. Возвращаем эррей с вырубками
    // coords - это эррей intersection получаемый после запуска функции findUIntersectPoints, которая получает эррей с углами слитых триугольников и выдает эррей с координатами пересечения треугольников с u
    /*(4) coords = [
                        [                       // 1 отверстие (слитое или нет)
                            [-335, -74.446]         //координаты пересечения с u 1 касательной
                            [335, 177.351]          //координаты пересечения с u 2 касательной
                        ],
                        [                       // 2 отверстие (слитое или нет)
                            [335, -131.09]
                            [89.516, -185]
                        ]
                    ]
            */
    // т.е. независимо от количества исходных отверстий, в соордсах мы уже всегда видим финалтные отверстия, т.е.  например всего отверстий 4, но 3 из них слились в одно, соответственно в coords мы увидим два отверстия
    // (слитое и обычное)

    var u = uRealCoords;
    var u_corners = [];                             //реальные координаты углов u
    var result = {
            angles: [],
            cut_u: [],
            cut_ibx: [],
            cut_iby: [],
            cut_sx: [],
            cut_sy: [],
            cut_midX: [],
            cut_midY: [],
            dir: []
    };

    u_corners[0] = [u[0], u[1]];
    u_corners[1] = [u[2], u[1]];
    u_corners[2] = [u[2], u[3]];
    u_corners[3] = [u[0], u[3]];

    var int_point_1_ang, int_point_2_ang;
    var char, char1, char2, char3;                             //характеристики вырубки
    var c_point, c_point1, c_point2;                    //промежуточные точки для расчета


    // 1) МЫ БЕРЕМ УГЛЫ ТАНГЕНТ СЛИТЫХ (ФИНАЛЬНЫХ) КАСАТЕЛЬНЫХ И СТРОИМ ПО НИМ ТРЕУГОЛЬНИК, НАХОДЯЩИЙСЯ НА РАССТОЯНИИ 10 000 ОТ ЦЕНТРА
    // 2) и ПРОХОДИМСЯ ПО ВСЕМ КООРДИНАТАМ УГЛОВ И СМОТРИМ КАКИЕ ИЗ НИХ ПОПАДАЮТ В ЭТОТ ТРЕУГОЛЬНИК

    //1) БЕРЕМ ТАНГЕНТЫ И СТРОИМ ТРЕУГОЛЬНИК        merged_angls_test = [257.471, 62.103, 111.371, 154.179];

    var triangles = [];
    var t1, t2;

    if (merged_angls) {
       for (var i = 0; i < merged_angls.length; i++) {
            triangles[i] = [];
            triangles[i][0] = {};
            triangles[i][1] = {};
            t1 = findAngleCoords(merged_angls[i][0], 10000);
            t2 = findAngleCoords(merged_angls[i][1], 10000);
            triangles[i][0].x = t1[0];
            triangles[i][0].y = t1[1];
            triangles[i][1].x = t2[0];
            triangles[i][1].y = t2[1];
       }

        /*
            {x: -9761.863, y: -2169.337}
            {x: 8837.901, y: 4678.835}

            {x: 9312.404, y: -3644.055}
            {x: 4355.611, y: -9001.592}
        */

        //2) ВСЕ, КООРДИНАТЫ ТРЕУГОЛЬНИКА ЕСТЬ, ТЕПЕРЬ БЕРЕМ ПО ОЧЕРЕДИ ВСЕ УГЛЫ u И ПРОВЕРЯЕМ, ПОПАДАЮТ ЛИ ОНИ В ТРЕУГОЛЬНИК

        var corner_list = createCornerList(u_corners, triangles);       //делаем список выбитых углов для каждого отверстия

        // СЧИТАЕМ ВЫРУБКИ: ЕСЛИ ОТВЕРСТИЕ НЕ ИМЕЕТ УГЛОВ ВНУТРИ, ЗНАЧИТ ОНО СЧИТАЕТСЯ ПРЯМОЙ ВЫРУБКОЙ

        /*
        coords = [
            [                       // 1 отверстие (слитое или нет)
                [-335, -74.446]         //координаты пересечения с u 1 касательной
                [335, 177.351]          //координаты пересечения с u 2 касательной
            ],
            [                       // 2 отверстие (слитое или нет)
                [335, -131.09]
                [89.516, -185]
            ]
        ]

        merged_angls = [
                [257.471, 62.103],
                [111.371, 154.179],
            ];
        */

        for (var a = 0; a < coords.length; a++) {
            int_point_1_ang = Math.min(merged_angls[a][0], merged_angls[a][1]);
            console.log(merged_angls[a][0] + ", " + merged_angls[a][1] + ", " + int_point_1_ang);
            int_point_2_ang = Math.max(merged_angls[a][0], merged_angls[a][1]);

            if (corner_list[a].length !== 0) {      // если отверстие выбивает углы
                calcCornersCuts(corner_list[a], coords[a][0], coords[a][1]);
            } else {                                    //если отверстие не выбивает углы
                char = calculateCutOff(coords[a][0], coords[a][1]);                      //считаем характеристики вырубки
                fillResult(char);                                                   // и забиваем их в result
                result.angles.push([int_point_1_ang, int_point_2_ang]);             //вбиваем углы данного участка, чтобы потом вычислить какие арматурины он вышибает
            }            
        }
    }    

    function calcCornersCuts(cor_num_list, int_point_1, int_point_2) {
        /*
        Здесь накидаю некоторые мысли как решить проблему с углами больше 180 градусов
        Для этого можно попытаться использовать функцию findPosition
        pos = findPosition(int_point_1_ang, int_point_2_ang, mid_tans, opening_tangents);        
       
       //1) Берем угол 1 касательной и проходимся по списку углов st.opening_tangents_real и ищем совпадение с углами. Определяем к какому исходному
       //отверстию принадлежит данная касательная. Пусть это отверстия G
       //2) Берем угол 2 касательной и проходимся по списку углов st.opening_tangents_real и ищем совпадение с углами. Определяем к какому исходному
       //отверстию принадлежит данная касательная. Пусть это отверстия D
       //1) берем угол 1 касательной, строим точку на расстоянии 10 000 - точка a
       //2) берем угол 2 касательной, строим точку на расстоянии 10 000 - точка b
       //3) проводим линию между точкамиa ab
       //4) Берем из мид тангентс биссектрису которая относится к отверстию G и пробиваем её с линией ab
       //4) Берем из мид тангентс биссектрису которая относится к отверстию D и пробиваем её с линией ab
       //5) Если хоть одна биссектриса пересеклась с ab - это стандартный случай (выбивка меньше 180 градусов)
       //5) Если ни одна биссектриса не пересеклась с ab  - это нестандартный случай, выбивка больше 180 градусов, переходим в calcCornersCuts и меняем список выбитых углов на противоположный.
       //6) Также нужно поменять выбивку кружков арматуры на противоположный

       */

       // пока здесь все только до 180 градусов

        if (cor_num_list.length === 1) {                                    // если выбит 1 угол то
            c_point = u_corners[cor_num_list[0]];                       //координаты выбитого угла
            char1 = calculateCutOff(int_point_1, c_point);                      //считаем характеристики вырубки 1
            fillResult(char1);                                                      // и забиваем их в result 
            char2 = calculateCutOff(int_point_2, c_point);                      //считаем характеристики вырубки 2
            fillResult(char2);
            result.angles.push([int_point_1_ang, int_point_2_ang]);             //вбиваем углы данного участка, чтобы потом вычислить какие арматурины он вышибает  
        }
        if (cor_num_list.length === 2) {                                    // если выбито 2 угла то
            //определяем промежуточные точки (углы u)
            c_point1 = u_corners[cor_num_list[0]];                       //координаты выбитого угла 1
            c_point2 = u_corners[cor_num_list[1]];                       //координаты выбитого угла 1

            result.angles.push([int_point_1_ang, int_point_2_ang]);             //вбиваем углы данного участка, чтобы потом вычислить какие арматурины он вышибает  
            
            char1 = calculateCutOff(c_point1, c_point2);                      //сначало считаем характеристики вырубки между выбитыми углами u
            fillResult(char1);
            
            //дальше считаем расстояния от точек пересечения до соответствующих углов u. Тут нужно понять, к какому углу u относится какая точка.
            //проверяем точку 1
            //если координата двух точек имеют хоть одно совпадение - значит они лежат на одной прямой u. Следовательно между ними можно просты вычислить расстояние вырубки
            if (!((int_point_1[0] !== c_point1[0]) && (int_point_1[1] !== c_point1[1]))) {            
                // если точка 1 лежит на одной прямой с углом 1, значит считаем вырубку точка 1 - угол 1
                char2 = calculateCutOff(int_point_1, c_point1);                      //считаем характеристики вырубки 2
                fillResult(char2);                                                    // и забиваем их в result 
            } else {
                // если нет, то она лежит на одной прямой с углом 2 - считаем вырубку точка 1 - угол 2
                char2 = calculateCutOff(int_point_1, c_point2);
                fillResult(char2);
            }

            //проверяем точку 2
            if (!((int_point_2[0] !== c_point1[0]) && (int_point_2[1] !== c_point1[1]))) {            
                // если точка 2 лежит на одной прямой с углом 1, значит просто считаем вырубку точка 2 - угол 1
                char3 = calculateCutOff(int_point_2, c_point1);                      //считаем характеристики вырубки 3
                fillResult(char3);
            } else {
                // если нет, то она лежит на одной прямой с углом 2 - считаем вырубку точка 2 - угол 2
                char3 = calculateCutOff(int_point_2, c_point2);                      //считаем характеристики вырубки 3
                fillResult(char3);
            }
        }
    }

    function fillResult(char) {                 //вспомогательная функция по наполнению объекта результатов характеристик вырубок
        result.cut_u.push(char.cut_u);
        result.cut_ibx.push(char.cut_ibx);
        result.cut_iby.push(char.cut_iby);
        result.cut_sx.push(char.cut_sx);
        result.cut_sy.push(char.cut_sy);
        result.cut_midX.push(char.cut_mid[0]);                  //для отчета Word
        result.cut_midY.push(char.cut_mid[1]);
        result.dir.push(char.dir);
    }

    return result;   
}


/*
var coords_test = [
                    [
                        [-335, -74.446],
                        [335, 177.351],
                    ],
                    [
                        [335, -131.09],
                        [89.516, -185],
                    ],
                ];
var uRealCoords_test = [-335, 185, 335, -185];
var angles_test_3 = [
    [257.471, 62.103],
    [111.371, 154.179],
];

var test_1 = addCornersU(coords_test, uRealCoords_test, angles_test_3);
console.log(test_1);

*/




function findEmptyOps(openings) {                       //находим отверстия с неполностью заполненными характеристиками, чтобы не включать их в расчет
   var empty_ops = [];
   var id;
   for (id in openings) {
        for (var i = 1; i < openings[id].length; i++) {
            if ((openings[id][i] === "") && !empty_ops.includes(i)) {               // если находим пустую графу в данном отверстии и это отверстие еще не успели внести в список - вносим
                empty_ops.push(i);
            }
        }
   }
   return empty_ops;
}

var canvas_fake = () => {                              //вспомогательная функция для перегонки SVG в PNG для последующей вставки в отчет. Формирует фиктивный канвас, рисует на нем заданный SVG рисунок и возвращает его
    const canvas = document.getElementById('buffer');
    const ctx = canvas.getContext('2d');
    var sketch = document.getElementById('svg_background').outerHTML;
    var v = Canvg.fromString(ctx, sketch);
    v.start();
    var img = new Image();
    img = canvas.toDataURL("image/png");
    return img;
};

function checkCirclesOpenings(circle, cut_angles) {                   // проверяем какие кружки вышибаются касательными к отверстиям
    var result = false;
    var angle = findAngle(circle);
    var min_angle;
    var max_angle;
    for (var i = 0; i < cut_angles.length; i++) {
        min_angle = Math.min(cut_angles[i][0], cut_angles[i][1]);
        max_angle = Math.max(cut_angles[i][0], cut_angles[i][1]);
        console.log("part " + i + ", " + min_angle + ", " + max_angle);
        if ((min_angle < 90) && (max_angle > 270)) {                        //ситуация если одна касательная слева от полож Y, а другая справа
            if ((angle <= min_angle) || (angle >= max_angle)) {
                result = true;
            }
        } else {                                                            //обычная ситуация
            if ((angle >= min_angle) && (angle <= max_angle)) {
                result = true;
            }
        }
    }
    return result;
}

//основные компоненты

class App extends React.Component {                 // это наш главные самый верхний компонент в котором соединяются все нижние компоненты и который выполняет все вычисления
    constructor(props) {
        super(props);
        this.state = {                               // это наш глобал стейт в который мы закидываем все исходные данные для расчета. Мы его спускаем всем компонентам, чтобы он был доступен везде
            text_result: "Заполните все графы с данными для расчета",
            result_color: "secondary",
            asw_tot: 0,
            aswCircles: [],
            out_asw_square: [1, 1, 1, 1],
            out_asw_square_string: "0,0 0,0 0,0 0,0",
            in_asw_square: [1, 1, 1, 1],
            in_asw_square_string: "0,0 0,0 0,0 0,0",
            n_load: 0,                              //переменные есть со словом input и без. Со словом input, это то, что мы вводим в графы инпут сами. Эти числа могут быть в м, кН, мм, м ит.д.
            mx_load: 0,
            my_load: 0,
            input_n_load: 0,                        //переменные без слова input это то, что программа использует в расчете. Они всегда в кН или мм. Получаются приведением переменых без инпут
            input_mx_load: 0,                           // к одним единицам измерения кН и мм
            input_my_load: 0,
            a_column_size: 0,
            b_column_size: 0,
            input_a_column_size: 1,
            input_b_column_size: 1,
            concrete_grade: "b15",
            shear_bars_grade: "a240c",
            shear_bars_diameter: "6",
            shear_bars_row_number: 2,
            shear_bars_spacing_to_prev: [0],
            input_shear_bars_spacing_to_prev: [0],
            shear_bars_number: {
                                X: [0],
                                Y: [0]
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
            input_edge_bottom_dist:10000,
            edge_left_dist: 10000,
            edge_right_dist: 10000,
            edge_top_dist: 10000,
            edge_bottom_dist:10000,
            edge_left: false,
            edge_right: false,
            edge_top: false,
            edge_bottom:false,
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
                                [[]],           // это касательная к нулевому отверстию которого у нас нет
                                [                       // это 4 касательных к 1 отверстию которое всегда подгружается по умолчанию
                                    [250, 250],
                                    [250, 250],
                                    [250, 250],
                                    [250, 250]
                                ]
                            ],
            opening_tangents_real: [
                                [[]],           // это касательная к нулевому отверстию которого у нас нет
                                [                       // это 4 касательных к 1 отверстию которое всегда подгружается по умолчанию
                                    [0, 0],
                                    [0, 0],
                                    [0, 0],
                                    [0, 0]
                                ]
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
            merged_angls: []
        }
        this.calculate = this.calculate.bind(this);
        this.getData = this.getData.bind(this);
        this.exportToWord = this.exportToWord.bind(this);
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

    getData(local_state) {                                      // этот метод мы запускаем каждый раз при получении каких нибудь данных от дочерних компонентов
        this.setState(local_state, this.unitConversion);        //после получения данных: обновляем стейт -> рисуем колонну -> конвертируем исх данные в кН и мм unitConversion -> считаем периметр displayPerimeter -> считаем площадь арматуры calculateAsw -> запускаем основной расчет Calculate

    }

    unitConversion() {                                              // расчет происходит в кН, кН*мм и мм. Соответственно перед расчетом продавливания мы должны все исходные данные привести к этим единицам измерения
        var st = this.state;
        var props_to_convert = {                                        // список свойств глобал стейта которые подлежит конвертировать
            force_units: ["n_load", "mx_load", "my_load"],                              
            length_units: ["a_column_size", "b_column_size", "t_slab_size", "a_slab_size", "shear_bars_spacing_to_prev", "edge_left_dist", "edge_right_dist", "edge_top_dist", "edge_bottom_dist", "openings"]
        };
        var new_state = {};
        for (var i = 0; i < props_to_convert.force_units.length; i++) {                         //сначало конвертируем все силовые исходные данные по списку
            var name = props_to_convert.force_units[i];
            var val = st["input_" + name] * unitFactor.force_units[st.force_units];
            val = Number(val.toFixed(3));                                                           //округляем
            new_state[name] = val;
        }

        for (var i = 0; i < props_to_convert.length_units.length; i++) {                                //затем конвертируем все длиновые исходные данные по списку
            var name1 = props_to_convert.length_units[i];
            if (typeof st[name1] === "number") {
                new_state[name1] = st["input_" + name1] * unitFactor.length_units[st.length_units];
            }
            if (name1 === "shear_bars_spacing_to_prev") {                                                        //отдельно конвертируем одномерные эрреи (shear_bars_spacing_to_prev)
                var arr = [];
                for (var k = 0; k < st["input_" + name1].length; k++) {
                    arr[k] = st["input_" + name1][k] * unitFactor.length_units[st.length_units];
                }
                new_state[name1] = arr;
            }
            
            if (name1 === "openings") {                                                        //отдельно конвертируем объект с характеристиками отверстий
                var empty_ops = findEmptyOps(st.input_openings);                        //находим отверстия с не до конца заполненными графами
                var obj = {};                                               //будущий результат
                var id;
                var k;                                                      //отдельный счетчик для выходного openings - чтобы все было как надо, чтобы не было пустых строк                                                    
                for (id in st.input_openings) {                             //берем каждое свойство
                    obj[id] = [];
                    k = 0;
                    for (var j = 0; j < st.input_openings[id].length; j++) {                                    //и каждое значение в эррее
                        if (!empty_ops.includes(j)) {                           //если данное свойство не относится к отверстию у которого не полностью заполнены свойства - то добавляем его в выходной openings
                            if (id === "Y") {
                                obj[id][k] = st.input_openings[id][j] * unitFactor.length_units[st.length_units] * (-1);            //меняем направление оси У - в SVG она направлена вниз, у нас классически вверх
                            } else {
                                obj[id][k] = st.input_openings[id][j] * unitFactor.length_units[st.length_units];
                            }
                            k++;            //переходим выше только если смогли забить данное значение в эррей (т.е. наша характеристика не относится к отверстию с неполностью заполненными данными)
                        }
                    }
                }
                new_state.openings = obj;
            }
            
            
        }
        this.setState(new_state, this.displayColumn);                                          //затем обновляем глобальный стейт конвертированными значениями и идем считать дальше
    }

    displayColumn() {                                   // рассчитаем координаты колонны. Центр для отображения 250,250. Центр для расчетов 0,0
        var st = this.state;
        var columnRealCoords = [];                      //посчитаем реальные координаты - 0,0 - центр колонны. Они нам понадобятся для некоторых расчетов. Например рассчитать расстояние от отверстия до колонны
        var real_x1 = 0 - st.a_column_size/2; 
        var real_y1 = st.b_column_size/2; 
        var real_x2 = st.a_column_size/2; 
        var real_y2 = 0 - st.b_column_size/2;
        columnRealCoords = [real_x1, real_y1, real_x2, real_y2];

        var scaleFactor;                                               //рассчитываем масштаб отображения, чтобы влезало любое сечение
        if (st.a_column_size >= st.b_column_size) {
            scaleFactor = st.a_column_size/st.b_column_size;
        } else {
            scaleFactor = st.b_column_size/st.a_column_size;
        }

        scaleFactor = Number(scaleFactor.toFixed(3));               //округляем до 3 знака после запятой

        var a_column_size_display;
        var b_column_size_display;

        if (st.a_column_size >= st.b_column_size) {        //приводим большую сторону к размеру 150. Другую сторону подгоняем под него
            a_column_size_display = 150*st.custom_scale;
            b_column_size_display = Math.floor(150/scaleFactor)*st.custom_scale;            //чтобы не тратить впустую биты оперативки, округляем до целого, т.к. номер пикселя не может быть дробным
        } else {
            b_column_size_display = 150*st.custom_scale;
            a_column_size_display = Math.floor(150/scaleFactor)*st.custom_scale;
        }

        var x1 = 250 - a_column_size_display/2;                 //колонна всегда отображается по центру (250, 250). Рассчитываем координаты углов
        var y1 = 250 - b_column_size_display/2;
        var x2 = 250 + a_column_size_display/2;
        var y2 = 250 + b_column_size_display/2;

        var coords = x1 + "," + y1 + " " +                          //забиваем полученные координаты в строку для SVG
                x1 + "," + y2 + " " +
                x2 + "," + y2 + " " +
                x2 + "," + y1;
        
        var scaleFactorSize_a =  st.a_column_size/a_column_size_display;
        scaleFactorSize_a = Number(scaleFactorSize_a.toFixed(3));               //округляем до 3 знака после запятой
        var scaleFactorSize_b = st.b_column_size/b_column_size_display;
        scaleFactorSize_b = Number(scaleFactorSize_b.toFixed(3));


        
        var state = {                                          //и добавляем полученные значения в локальный стейт                                                              
            scaleFactorSize: [scaleFactorSize_a, scaleFactorSize_b],
            columnDisplayCoords: [x1, y1, x2, y2],
            columnRealCoords: columnRealCoords,
            columnDisplayString: coords
        };                                                                         
        this.setState(state, this.displaySlabEdge);       

    }

    displaySlabEdge() {                                         //нарисуем край плиты а также сформируем реальные координаты края плиты. Край плиты есть всегда, просто он может быть очень далеко
        var st = this.state;
        // для отображения
        var x1 = Math.floor(st.columnDisplayCoords[0] - ((st.slab_edge && st.edge_left) ? st.edge_left_dist : 1000000)/st.scaleFactorSize[0]);          //columnDisplayCoords: [x1, y1, x2, y2],
        var y1 = Math.floor(st.columnDisplayCoords[1] - ((st.slab_edge && st.edge_top) ? st.edge_top_dist : 1000000)/st.scaleFactorSize[1]);            // дробные пиксели ни к чему - округляем
        var x2 = Math.floor(st.columnDisplayCoords[2] + ((st.slab_edge && st.edge_right) ? st.edge_right_dist : 1000000)/st.scaleFactorSize[0]);      //если edge_right = true, тогда подставляем input_edge_right_dist. если false, то 1000000
        var y2 = Math.floor(st.columnDisplayCoords[3] + ((st.slab_edge && st.edge_bottom) ? st.edge_bottom_dist : 1000000)/st.scaleFactorSize[1]);
        var string = x1 + "," + y1 + " " +                          //забиваем полученные координаты в строку для SVG
					x1 + "," + y2 + " " +
					x2 + "," + y2 + " " +
                    x2 + "," + y1;
        
        // для расчетов
        var x1_real = st.columnRealCoords[0] - ((st.slab_edge && st.edge_left) ? st.edge_left_dist : 1000000);          //columnRealCoords: [x1, y1, x2, y2],
        var y1_real = st.columnRealCoords[1] + ((st.slab_edge && st.edge_top) ? st.edge_top_dist : 1000000);
        var x2_real = st.columnRealCoords[2] + ((st.slab_edge && st.edge_right) ? st.edge_right_dist : 1000000);
        var y2_real = st.columnRealCoords[3] - ((st.slab_edge && st.edge_bottom) ? st.edge_bottom_dist : 1000000);

        this.setState({
                        slabEdgeString: string,
                        slabEdgeCoords: [x1, y1, x2, y2],
                        slabEdgeRealCoords: [x1_real, y1_real, x2_real, y2_real]
                        }, this.displayOpenings);            
    }

    displayOpenings() {                                        //нарисуем отверстия
        if (this.state.openingIsNear) {
            var st = this.state;
            var new_open_Disp_Str = [];                                  //Эррей со строками отверстий
            var openingsRealCoords = [];                                 //эррей с реальными координатами отверстий
            var new_open_Disp_Crds = [];                                 //Эррей с координатами отверстий
            var openings = st.openings;
            for (var i = 1; i < st.openings.X.length; i++) {
                var real_x1 = openings.X[i] - openings.a[i]/2;                      //openingsRealCoords: [x1, y1, x2, y2], координаты прямоугольника отверстия для расчетов (например определение расстояния между отверстием и колонной)
                var real_y1 = -1 * openings.Y[i] + openings.b[i]/2;                 // меняем направление оси Y. openings.Y это для SVG, а в SVG ось Y направлена вниз.
                var real_x2 = openings.X[i] + openings.a[i]/2;
                var real_y2 = -1 * openings.Y[i] - openings.b[i]/2;

                var x1 = Math.floor(250 + (openings.X[i] - openings.a[i]/2)/st.scaleFactorSize[0]);          //openingsDisplayCoords: [x1, y1, x2, y2], координаты прямоугольника отверстия для отображения
                var y1 = Math.floor(250 + (openings.Y[i] - openings.b[i]/2)/st.scaleFactorSize[0]);             //округляем координаты пикселей до целого
                var x2 = Math.floor(250 + (openings.X[i] + openings.a[i]/2)/st.scaleFactorSize[0]);
                var y2 = Math.floor(250 + (openings.Y[i] + openings.b[i]/2)/st.scaleFactorSize[0]);
                
                var coords = x1 + "," + y1 + " " +                          //забиваем полученные координаты в строку для SVG
                            x1 + "," + y2 + " " +
                            x2 + "," + y2 + " " +
                            x2 + "," + y1;
                
                new_open_Disp_Str[i] = coords;
                new_open_Disp_Crds[i] = [x1, y1, x2, y2];
                openingsRealCoords[i] = [real_x1, real_y1, real_x2, real_y2];
            }
            this.setState({
                openingsDisplayString: new_open_Disp_Str,
                openingsDisplayCoords: new_open_Disp_Crds,
                openingsRealCoords: openingsRealCoords
                }, this.displayOpeningTangents);
            } else {
                this.displayCircles();
        }

    }

    displayOpeningTangents() {                                  //нарисуем касательные к отверстиям
        var st = this.state;
        var opening;
        var real_opening;
        var angles = [""], min_angle, max_angle;
        var tan1, tan2, tan3, tan4;
        var opening_tangents = [              // заготовка под эррей касательных к отверстиям. Эррей с координатами касательных x, y. Система - эррей[i][k][0]
                                [[]],           // это касательная к нулевому отверстию которого у нас нет
                                [                       // это 4 касательных к 1 отверстию которое всегда подгружается по умолчанию
                                    [250, 250],         //это нужно чтобы не получить при включении программы странные 4 линии сливающиеся в одну и уходящие за экран (4 касательных к отверстию №1 которое еще не забито)
                                    [250, 250],
                                    [250, 250],
                                    [250, 250]
                                ]
        ];

        var opening_tangents_real = [              // заготовка под эррей касательных к отверстиям. Эррей с координатами касательных x, y. Система - эррей[i][k][0]
                                [[]],           
                                [                       
                                    [0, 0],         
                                    [0, 0],
                                    [0, 0],
                                    [0, 0]
                                ]
        ];

        var final_opening_tangents =  [[[]]];
        var final_opening_tangents_real =  [[[]]];
                            
        for (var i = 1; i < st.openingsDisplayCoords.length; i++) {          //openingsDisplayCoords: [x1, y1, x2, y2], координаты прямоугольника отверстия для отображения
            opening = st.openingsDisplayCoords[i];                          //берем отверстие для отображения. По нему мы просчитаем координаты касательных для отрисовки
            real_opening = st.openingsRealCoords[i];                        //берем реальное отверстие. По ним мы будем считать углы, т.к. они используются в расчетах и соответственно должны быть 
            //точные и не зависеть от масштаба отображения. Потому что если их считать по openingsDisplayCoords, при изменении масштаба они будут немного гулять из-за округления и соответствнено будет менятся результат
            if (checkOpeningDistance(st, i)) {                            // если данное отверстие расположено на расстоянии менее 6h от колонны, то мы рисуем касательные
                opening_tangents[i] = [];                                          //и вытаскиваем из него координаты углов, которые будут нашими конечными точками касательных. Каждое отверстие имеет 4 касательных
                opening_tangents_real[i] = []; 
                angles[i] = [];                                                    // составляем список углов

                tan1 = findAngleReal([real_opening[0], real_opening[1]]);
                tan2 = findAngleReal([real_opening[2], real_opening[1]]);
                tan3 = findAngleReal([real_opening[2], real_opening[3]])
                tan4 = findAngleReal([real_opening[0], real_opening[3]])

                opening_tangents[i].push([opening[0], opening[1], tan1]);         //x1, y1, угол - касательная 1
                opening_tangents[i].push([opening[2], opening[1], tan2]);         //x2, y1, угол - касательная 2
                opening_tangents[i].push([opening[2], opening[3], tan3]);         //x2, y2, угол - касательная 3
                opening_tangents[i].push([opening[0], opening[3], tan4]);         //x1, y2, угол - касательная 4

                opening_tangents_real[i].push([real_opening[0], real_opening[1], tan1]);         //x1, y1, угол - касательная 1
                opening_tangents_real[i].push([real_opening[2], real_opening[1], tan2]);         //x2, y1, угол - касательная 2
                opening_tangents_real[i].push([real_opening[2], real_opening[3], tan3]);         //x2, y2, угол - касательная 3
                opening_tangents_real[i].push([real_opening[0], real_opening[3], tan4]);         //x1, y2, угол - касательная 4
                
                for (var k = 0; k < opening_tangents[i].length; k++) {
                    angles[i].push(opening_tangents[i][k][2]);
                }

                min_angle = Math.min(...angles[i]);                                     //находим минимальный угол из списка
                max_angle = Math.max(...angles[i]);                                     //находим максимальный угол из списка

                final_opening_tangents[i] = [];                                         //готовим наш чистовой эррей. Сюда мы добавим только мин макс касательные
                final_opening_tangents_real[i] = [];
                for (var k = 0; k < opening_tangents[i].length; k++) {
                    if (((opening[0] < 250) && (opening[2] >= 250) && (opening[1] <= 250))) {                                    // изза особенностей геометрии если мы здесь, то мы выбираем касательные НЕ с максимальными или минимальным углом 
                        if ((opening_tangents[i][k][2] !== min_angle) && (opening_tangents[i][k][2] !== max_angle) ) {          //если угол данной касательной данного отверстия НЕ соответствует минимальному или максимальному, то эту касательную добавляем в список
                            final_opening_tangents[i].push(opening_tangents[i][k]);
                            final_opening_tangents_real[i].push(opening_tangents_real[i][k]);
                        }
                    } else {                                                                                                    // во всех остальных случаях отбираем только максимальный и минимальный угол
                        if ((opening_tangents[i][k][2] === min_angle) || (opening_tangents[i][k][2] === max_angle) ) {          //если угол данной касательной данного отверстия соответствует минимальному или максимальному, то эту касательную добавляем в список
                            final_opening_tangents[i].push(opening_tangents[i][k]);
                            final_opening_tangents_real[i].push(opening_tangents_real[i][k]);
                        }
                    }
                }
            } else {
                console.log("Данное отверстие далеко");
                final_opening_tangents[i] = [];                 // если отверстие дальше 6h, тогда пустая строка
                final_opening_tangents_real[i] = [];
            }
        }

        var tangents_triangles = [];                            //эррей со строками координат треугольников которые будут закрывать часть контура продавливания
        var tangent_triang;
        var x1, x2, y1, y2;

        for (var i = 1; i < final_opening_tangents.length; i++) {                 //забиваем координаты треугольников которые будут закрывать часть контура продавливания, ограниченного касательными к отверстиям
            if (final_opening_tangents[i] && final_opening_tangents[i][1]) {
                x1 = final_opening_tangents[i][0][0];
                y1 = final_opening_tangents[i][0][1];
                x2 = final_opening_tangents[i][1][0];
                y2 = final_opening_tangents[i][1][1];
                tangent_triang = x1 + "," + y1 + " " +                          //забиваем полученные координаты в строку для SVG
                                x2 + "," + y2 + " " +
                                250 + "," + 250;
                tangents_triangles.push(tangent_triang);
            }
        }

        this.setState({                                         //отправляем эррей с координатами касательных в глобальный стейт
            opening_tangents: final_opening_tangents,
            opening_tangents_real: final_opening_tangents_real,
            tangents_triangles: tangents_triangles
            }, this.displayCircles);
    }

    displayCircles() {                                          //нарисуем кружочки арматуры
        var st = this.state;
        var x = [];                             //этот эррей будет содержать координаты Х всех кружочков
        var y = [];                             //этот эррей будет содержать координаты У всех кружочков

        for (var i = 0; i <= st.shear_bars_row_number; i++) {                                       
            //проходимся по всем рядам арматуры. Ряд арматуры представляет собой прямоугольник отстоящий от грани колонны на заданное растояние вдоль которого установлены кружочки - 
            //наша поперечноая арматура. Число кружочков вдоль оси Х и У в пределах данного ряда пользователь может  задать. Т.е. ряд состоит из 4 прямых линий кружочков: слева от колонны, 
            //справа от колонны. сверху от колонны и снизу от колонны. 
            var distanceToColumn = distanceToRow(i, st);                                            //расстояние от данного ряда до грани колонны
            var x1 = Math.round(st.columnDisplayCoords[0] - distanceToColumn/st.scaleFactorSize[0]);          //columnDisplayCoords: [x1, y1, x2, y2],
            var y1 = Math.round(st.columnDisplayCoords[1] - distanceToColumn/st.scaleFactorSize[1]);            //формируем угловые координаты для данного ряда
            var x2 = Math.round(st.columnDisplayCoords[2] + distanceToColumn/st.scaleFactorSize[0]);
            var y2 = Math.round(st.columnDisplayCoords[3] + distanceToColumn/st.scaleFactorSize[1]);

            var stepX;                                                               // это шаг размещения кружочков в данном ряду вдоль оси X
            var stepY;                                                                 //это шаг размещения кружочков в данном ряду вдоль оси У
                                                                                        // теперь рассчитаем шаг кружочков в пределах данного ряда
            if (st.shear_bars_number.X[i] === 1) {                                     //если пользователь задал нам всего 1 кружочек - тогда шаг = 0                            
                stepX = 0;
            } else {
                stepX = (x2 - x1)/(st.shear_bars_number.X[i]-1);                        // если пользователь задал несколько кружочков - размещаем их равномерно вдоль грани ряда
            }

            if (st.shear_bars_number.Y[i] === 1) {                                       // и тоже самое для У
                stepY = 0;
            } else {
                stepY = (y2 - y1)/(st.shear_bars_number.Y[i]-1);
            }

            if (st.shear_bars_number.X[i] > 100 || st.shear_bars_number.Y[i] > 100) {                                          // Ограничим количество стержней 100 по обоим направлениям чтобы не подвесить программу
                console.log("Too many circles in a row number " + i);
                return;
            }
                                                                                                                                //итак мы расчитали шаг кружочков в пределах данного ряда, теперь переходим к вычисленю
            calcCircleCoords(x1, y1, x2, y2, stepX, stepY, st.shear_bars_number.X[i], st.shear_bars_number.Y[i]);               //координат каждого отдельного кружочка в пределах данного ряда и забивки его в х и у эррей.    
        }

        //после того как мы наполнили наши ч и у координатами всех кружочков в каждом ряду - отправляем их в глобальный стейт

        var state = {
            circlesX: x,
            circlesY: y
        };

        this.setState(state, this.displayPerimeter); 

        // далее опишем функции которые здесь учавствовали

        function distanceToRow(row_number, state) {                             //функция рассчитывает расстояние от конкретного ряда до грани колонны
            var distance = 0;
            for (var i = 0; i <= row_number; i++) {
                distance = distance + state.shear_bars_spacing_to_prev[i];
            }
            return distance;
        }
        
        function calcCircleCoords(x1, y1, x2, y2, stepX, stepY, shear_bars_number_X, shear_bars_number_Y) {         
            // здесь мы будем рожать координаты каждого отдельного кружочка для заданного ряда. Нам нужно задать угловые координаты ряда, шаг кружочков вдоль грани вдоль оси Хи У, 
            // а также конкретно число кружочков вдоль данного ряда вдоль нужной грани
            var x_coord;                                                        // это X координата кружочка
            var y_coord;                                                        //это У координата кружочка
            // эти координаты мы начинаем потиху засовывать в наши х и у эрреи определенные в родительской функции. берем каждый кружочек добавляем к нему шаг и забиваем в эррей

            if (y1 > st.slabEdgeCoords[1]) {                                   // slabEdgeCoords: [x1, y1, x2, y2] проверяем кружки не лежат ли они за верхним краем плиты
                for (var i = 0; i < shear_bars_number_X; i++) {                     //формируем все кружки ВЫШЕ колонны (вдоль оси Х)
                    x_coord = x1 + stepX*i;
                    if ((x_coord > st.slabEdgeCoords[0]) && (x_coord < st.slabEdgeCoords[2])  ) { //проверяем что кружки находятся в пределах левого и правого края плиты
                        x.push(x_coord);
                        y.push(y1);
                    }
                }
            }
           
            if (y2 < st.slabEdgeCoords[3]) {                                    //проверяем кружки не лежат ли они за нижним краем плиты
                for (var i = 0; i < shear_bars_number_X; i++) {                     //формируем все кружки НИЖЕ колонны (вдоль оси Х)
                    x_coord = x1 + stepX*i;
                    if ((x_coord > st.slabEdgeCoords[0]) && (x_coord < st.slabEdgeCoords[2])  ) { //проверяем что кружки находятся в пределах левого и правого края плиты
                        x.push(x_coord);
                        y.push(y2);
                    }
                }
            }

            if (x1 > st.slabEdgeCoords[0]) {                                        //проверяем кружки не лежат ли они за левым краем плиты
                for (var i = 0; i < shear_bars_number_Y; i++) {                     //формируем все кружки СЛЕВА от колонны (вдоль оси У) 
                    y_coord = y1 + stepY*i;
                    if ((y_coord > st.slabEdgeCoords[1]) && (y_coord < st.slabEdgeCoords[3])  ) {    //проверяем что кружки находятся в пределах верхнего и нижнего края плиты
                        y.push(y_coord);
                        x.push(x1);
                    }
                    
                }
            }

            if (x2 < st.slabEdgeCoords[2]) {                                        //проверяем кружки не лежат ли они за правым краем плиты
                for (var i = 0; i < shear_bars_number_Y; i++) {                     //формируем все кружки СПРАВА от колонны (вдоль оси У)
                    y_coord = y1 + stepY*i;
                    if ((y_coord > st.slabEdgeCoords[1]) && (y_coord < st.slabEdgeCoords[3])  ) {        //проверяем что кружки находятся в пределах верхнего и нижнего края плиты
                        y.push(y_coord);
                        x.push(x2);
                    }
                }
            }
        }            
        
    }

    displayPerimeter() {                                  // Рассчитываем координаты периметра контура расчетного поперечного сечения u
        var st = this.state;
        var h0 = st.t_slab_size - st.a_slab_size;           //рабочая высота сечения, мм
        var distance = h0/2;                                   //расстояние от края колонны до контура u
        //координаты для отображения
        var x1 = Math.floor(st.columnDisplayCoords[0] - distance/st.scaleFactorSize[0]);          //columnDisplayCoords: [x1, y1, x2, y2], координаты прямоугольника u для отображения. Центр 250,250
        var y1 = Math.floor(st.columnDisplayCoords[1] - distance/st.scaleFactorSize[1]);            // дробные пиксели ни к чему - округляем
        var x2 = Math.floor(st.columnDisplayCoords[2] + distance/st.scaleFactorSize[0]);
        var y2 = Math.floor(st.columnDisplayCoords[3] + distance/st.scaleFactorSize[1]);

        //координаты для расчетов
        var x1_real = st.columnRealCoords[0] - distance;          //columnRealCoords: [x1, y1, x2, y2], координаты прямоугольника u для расчетов. Центр 0,0
        var y1_real = st.columnRealCoords[1] + distance;
        var x2_real = -x1_real;
        var y2_real = -y1_real;

        var slab_edge_type = "";

        var sideY = 2*y1_real;                                                        // длина стандартной стороны u вдоль У
        var sideX = 2*x2_real;                                                        // длина стандартной стороны u вдоль X
        var dist_left = Math.abs(st.slabEdgeRealCoords[0] - x1_real);                                 //Расстояние от u до левого края плиты. проверка рядом расположенного левого края плиты
        var dist_right = Math.abs(st.slabEdgeRealCoords[2] - x2_real);                                 
        var dist_top = Math.abs(st.slabEdgeRealCoords[1] - y1_real);                                
        var dist_bottom = Math.abs(st.slabEdgeRealCoords[3] - y2_real);
                           
        if (dist_left < sideY/2) {                                                  // если расстояние от u до левого края плиты меньше чем половина его стандартной вертикальной стороны,
            x1 = st.slabEdgeCoords[0];                                              // то контур u сразу перепрыгивает на левый край плиты
            x1_real = st.slabEdgeRealCoords[0];
            slab_edge_type = slab_edge_type + "l";
        }

        //проверка рядом расположенного правого края плиты
        if (dist_right < sideY/2) {                                                // если расстояние от u до правого края плиты меньше чем половина его стандартной вертикальной стороны,
            x2 = st.slabEdgeCoords[2];                                              // то контур u сразу перепрыгивает на правый край плиты
            x2_real = st.slabEdgeRealCoords[2];
            slab_edge_type = slab_edge_type + "r";
        }        

        //проверка рядом расположенного верхнего края плиты
        if (dist_top < sideX/2) {                                                   // если расстояние от u до верхнего края плиты меньше чем половина его стандартной горизонтальной стороны,
            y1 = st.slabEdgeCoords[1];                                              // то контур u сразу перепрыгивает на верхний край плиты
            y1_real = st.slabEdgeRealCoords[1];
            slab_edge_type = slab_edge_type + "t";
        }

        //проверка рядом расположенного нижнего края плиты
        if (dist_bottom < sideX/2) {                                                 // если расстояние от u до нижнего края плиты меньше чем половина его стандартной горизонтальной стороны,
            y2 = st.slabEdgeCoords[3];                                              // то контур u сразу перепрыгивает на нижний край плиты
            y2_real = st.slabEdgeRealCoords[3];
            slab_edge_type = slab_edge_type + "b";
        }

        var u_corners_angles = [];                                        // находим углы касательных к углам для последующего применения в расчетах
        u_corners_angles[0] = findAngleReal([x1_real, y1_real]);
        u_corners_angles[1] = findAngleReal([x2_real, y1_real]);
        u_corners_angles[2] = findAngleReal([x2_real, y2_real]);
        u_corners_angles[3] = findAngleReal([x1_real, y2_real]);

        var coords = x1 + "," + y1 + " " +                          //забиваем полученные координаты в строку для SVG
					x1 + "," + y2 + " " +
					x2 + "," + y2 + " " +
                    x2 + "," + y1;

        if ((slab_edge_type === "lr") || (slab_edge_type === "tb") || (slab_edge_type.length > 2)) {
            this.setState({
                uDisplayString: coords,
                uDisplayCoords: [x1, y1, x2, y2],
                uRealCoords: [x1_real, y1_real, x2_real, y2_real],
                uCornersAngles: u_corners_angles,
                slab_edge_type: slab_edge_type,
                text_result: "Данный случай не регламентирован СП 63.13330.2012",
                result_color: "secondary"
              });
        } else {
            this.setState({
                            uDisplayString: coords,
                            uDisplayCoords: [x1, y1, x2, y2],
                            uRealCoords: [x1_real, y1_real, x2_real, y2_real],
                            uCornersAngles: u_corners_angles,
                            slab_edge_type: slab_edge_type
                            }, this.displayIntersection);
        }
    }

    displayIntersection() {                                     //отображаем пересечение касательных к отверстиям с u
        var st = this.state;
        var u_lines = [];                                                  //создаем эррей линий из которых состоит u. uDisplayCoords: [x1, y1, x2, y2]
        var u = st.uDisplayCoords;
        u_lines[0] = [u[0], u[1], u[2], u[1]];                              //линии u             
        u_lines[1] = [u[2], u[1], u[2], u[3]];
        u_lines[2] = [u[2], u[3], u[0], u[3]];
        u_lines[3] = [u[0], u[3], u[0], u[1]];

        var intersection = [""];
        var tang_coords = [];
        for (var i = 1; i < st.opening_tangents.length; i++) {
            intersection[i] = [];
            for (var k = 0; k < st.opening_tangents[i].length; k++) {       //здесь мы берем каждую касательную, и находим её точку пересечения с u
                tang_coords = [250, 250, st.opening_tangents[i][k][0], st.opening_tangents[i][k][1]];
                intersection[i].push(findIntersect(u_lines[0], tang_coords));
                intersection[i].push(findIntersect(u_lines[1], tang_coords)); 
                intersection[i].push(findIntersect(u_lines[2], tang_coords)); 
                intersection[i].push(findIntersect(u_lines[3], tang_coords)); 
            }
        }
        this.setState({                                         //отправляем эррей с координатами касательных в глобальный стейт
            opening_tangents_intersect: intersection
            }, this.calculateU);
    }

    calculateU() {                                   //считаем длину расчетного контура и другие геометрические характеристики
        var st = this.state;
        var result = {                                          // результат будет содержать длину u и моменты сопротивления
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
            ly: 0
        };

        var h0 = st.t_slab_size - st.a_slab_size;                       //рабочая высота сечения, мм            

        var size_u_left = st.b_column_size + h0;                //размер контура расч. попер сечения u - левая  сторона
        var size_u_top = st.a_column_size + h0;                //размер контура расч. попер сечения u- верхняя сторона
        var size_u_right = st.b_column_size + h0;                //размер контура расч. попер сечения u- правая  сторона
        var size_u_bottom = st.a_column_size + h0;                //размер контура расч. попер сечения u- нижняя сторона

        var lx = size_u_top;                                //стандартные размеры u когда нет рядом плиты
        var ly = size_u_right;
        
        //проверяем есть ли рядом плита

        // считаем стороны
        if (st.slab_edge_type === "l") {       //лево   проверка рядом расположенного левого края плиты. Если расстояние между левым краем расчетного контура и краем плиты становится меньше чем левый контур/2,
            size_u_left = 0;                      //тогда контур размыкается и перелетает к плите.
            size_u_bottom = st.a_column_size + h0/2 + st.edge_left_dist;
            size_u_top = size_u_bottom;
            lx = size_u_top;
            ly = size_u_right;
            result.xa = st.a_column_size/2 + st.edge_left_dist;
            result.sx = 2*lx*((lx/2) - result.xa) + ly*(st.a_column_size + h0)/2;
            console.log("xa = " + result.xa);
            console.log("sx = " + result.sx);
        }  

        if (st.slab_edge_type === "r") {                                                         //право
            size_u_right = 0;
            size_u_bottom = st.a_column_size + h0/2 + st.edge_right_dist;
            size_u_top = size_u_bottom;
            lx = size_u_top;
            ly = size_u_left;
            result.xa = st.a_column_size/2 + st.edge_right_dist;
            result.sx = 2*lx*(result.xa - (lx/2)) - ly*(st.a_column_size + h0)/2;
            console.log("xa = " + result.xa);
            console.log("sx = " + result.sx);
        }

        if (st.slab_edge_type === "t") {                                                       //верх
            size_u_top = 0;
            size_u_right = st.b_column_size + h0/2 + st.edge_top_dist;
            size_u_left = size_u_right;
            lx = size_u_bottom;
            ly = size_u_left;
            result.ya = st.b_column_size/2 + st.edge_top_dist;
            result.sy = 2*ly*(result.ya - (ly/2)) - lx*(st.b_column_size + h0)/2;
            console.log("ya = " + result.ya);
            console.log("sy = " + result.sy);
        }

        if (st.slab_edge_type === "b") {                                                        //низ
            size_u_bottom = 0;
            size_u_right = st.b_column_size + h0/2 + st.edge_bottom_dist;
            size_u_left = size_u_right;
            lx = size_u_top;
            ly = size_u_left;
            result.ya = st.b_column_size/2 + st.edge_bottom_dist;
            result.sy = 2*ly*((ly/2) - result.ya) + lx*(st.b_column_size + h0)/2;
            console.log("ya = " + result.ya);
            console.log("sy = " + result.sy);
        } 
        
        if (st.slab_edge_type === "lt") {                                                        //лево-верх
            size_u_left = 0;
            size_u_top = 0;
            size_u_bottom = st.a_column_size + h0/2 + st.edge_left_dist;
            size_u_right = st.b_column_size + h0/2 + st.edge_top_dist;
            lx = size_u_bottom;
            ly = size_u_right;
            result.xa = st.a_column_size/2 + st.edge_left_dist;
            result.ya = st.b_column_size/2 + st.edge_top_dist;
            result.sx = lx*((lx/2) - result.xa) + ly*(st.a_column_size + h0)/2;
            result.sy = ly*(result.ya - (ly/2)) - lx*(st.b_column_size + h0)/2;
            console.log("xa = " + result.xa);
            console.log("ya = " + result.ya);
            console.log("sx = " + result.sx);
            console.log("sy = " + result.sy);
        }
        
        if (st.slab_edge_type === "rt") {                                                        //право-верх
            size_u_right = 0;
            size_u_top = 0;
            size_u_bottom = st.a_column_size + h0/2 + st.edge_right_dist;
            size_u_left = st.b_column_size + h0/2 + st.edge_top_dist;
            lx = size_u_bottom;
            ly = size_u_left;
            result.xa = st.a_column_size/2 + st.edge_right_dist;
            result.sx = lx*(result.xa - (lx/2)) - ly*(st.a_column_size + h0)/2;
            result.ya = st.b_column_size/2 + st.edge_top_dist;
            result.sy = ly*(result.ya - (ly/2)) - lx*(st.b_column_size + h0)/2;
            console.log("xa = " + result.xa);
            console.log("ya = " + result.ya);
            console.log("sx = " + result.sx);
            console.log("sy = " + result.sy);
        }

        if (st.slab_edge_type === "rb") {                                                        //право-низ
            size_u_right = 0;
            size_u_bottom = 0;
            size_u_top = st.a_column_size + h0/2 + st.edge_right_dist;
            size_u_left = st.b_column_size + h0/2 + st.edge_bottom_dist;
            lx = size_u_top;
            ly = size_u_left;
            result.xa = st.a_column_size/2 + st.edge_right_dist;
            result.sx = lx*(result.xa - (lx/2)) - ly*(st.a_column_size + h0)/2;
            result.ya = st.b_column_size/2 + st.edge_bottom_dist;
            result.sy = ly*((ly/2) - result.ya) + lx*(st.b_column_size + h0)/2;
            console.log("xa = " + result.xa);
            console.log("ya = " + result.ya);
            console.log("sx = " + result.sx);
            console.log("sy = " + result.sy);
        }

        if (st.slab_edge_type === "lb") {                                                        //лево-низ
            size_u_left = 0;
            size_u_bottom = 0;
            size_u_top = st.a_column_size + h0/2 + st.edge_left_dist;
            size_u_right = st.b_column_size + h0/2 + st.edge_bottom_dist;
            lx = size_u_top;
            ly = size_u_right;
            result.xa = st.a_column_size/2 + st.edge_left_dist;
            result.sx = lx*((lx/2) - result.xa) + ly*(st.a_column_size + h0)/2;
            result.ya = st.b_column_size/2 + st.edge_bottom_dist;
            result.sy = ly*((ly/2) - result.ya) + lx*(st.b_column_size + h0)/2;
            console.log("xa = " + result.xa);
            console.log("ya = " + result.ya);
            console.log("sx = " + result.sx);
            console.log("sy = " + result.sy);
        }

        //окончание проверки рядом плиты

        // Начало проверки отверстий
            // каждое отверстие своими касательными образует треугольник, который пересекается с u
            // каждое отверстие своим треугольником делает одну "вырубку" из u
            // вырубка может быть разной формы и длины
            // если треугольники наслаиваются, то они сливаются в один итоговый треугольник.
            // соответственно сначало строим итоговые треугольники, считаем сколько каждый из них вырубает, 
            // затем отнимаем от начального u длины вырубок и получаем итоговое u

        var cut_off = 0;    // суммарная вырубка u всеми отверстиями
        var cut_off_ibx = 0;        // суммарная вырубка ibx всеми отверстиями
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
            for (var i = 0; i < cut_chars.cut_u.length; i++) {
                cut_off = cut_off + cut_chars.cut_u[i];
                cut_off_ibx = cut_off_ibx + cut_chars.cut_ibx[i];
                cut_off_iby = cut_off_iby + cut_chars.cut_iby[i];
                cut_off_sx = cut_off_sx + cut_chars.cut_sx[i];
                cut_off_sy = cut_off_sy + cut_chars.cut_sy[i];
            }
            cut_off = Math.floor(cut_off);                   //округляем                
        }
        // окончание проверки отверстий

        result.u = size_u_left + size_u_top + size_u_right + size_u_bottom - cut_off;                 //периметр контура расчетного поперечного сечения, мм
        result.u  = Number(result.u.toFixed(3));                   //округляем

        if (st.openingIsNear) {                             //если есть отверстие считаем некоторые характеристики вырубки
            cut_xc = -cut_off_sx/result.u;
            cut_xc  = Number(cut_xc.toFixed(2));
            cut_yc = -cut_off_sy/result.u;
            cut_yc  = Number(cut_yc.toFixed(2));
        }

        //считаем xc и yc
        if (st.slab_edge_type === "l" || st.slab_edge_type === "r") { 
            result.xc = result.sx/result.u;
            result.xc  = Number(result.xc.toFixed(2));                   //округляем
            console.log("xc = " + result.xc);
        }
        if (st.slab_edge_type === "t" || st.slab_edge_type === "b") { 
            result.yc = result.sy/result.u;
            result.yc  = Number(result.yc.toFixed(2));                   //округляем
            console.log("yc = " + result.yc);
        }
        if (st.slab_edge_type === "lt" || st.slab_edge_type === "rt" || st.slab_edge_type === "rb" || st.slab_edge_type === "lb") { 
            result.xc = result.sx/result.u;
            result.xc  = Number(result.xc.toFixed(2));                   //округляем
            console.log("xc = " + result.xc);
            result.yc = result.sy/result.u;
            result.yc  = Number(result.yc.toFixed(2));                   //округляем
            console.log("yc = " + result.yc);
        }

        // характеристики сечения - стандартный случай
        if (st.slab_edge_type === "") {
            result.ibx = (Math.pow(lx, 3)/6) + ((ly * Math.pow(lx, 2))/2);                //момент инерции расчетного контура. Стандартный случай. Если u - прямоугольник, тогда считается так
            result.iby = (Math.pow(ly, 3)/6) + ((lx * Math.pow(ly, 2))/2);
            result.ibx = Math.floor(result.ibx);                   //округляем
            result.iby = Math.floor(result.iby);                   //округляем
            result.wbx = result.ibx/(lx/2);
            result.wby = result.iby/(ly/2);
            result.wbx = Math.floor(result.wbx);                           //округляем
            result.wby = Math.floor(result.wby);                   //округляем
        }

        //характеристики сечения - лево и право
        if (st.slab_edge_type === "l") {                  //ibx. если грань плиты слева
            result.ibx = Math.pow(lx, 3)/6 + 2 * lx * Math.pow((result.xa + result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa - result.xc), 2);
            result.ibx = Math.floor(result.ibx);
            console.log("ibx = " + result.ibx);
        }

        if (st.slab_edge_type === "r") {                  // ibx. если грань плиты справа
            result.ibx = Math.pow(lx, 3)/6 + 2 * lx * Math.pow((result.xa - result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa + result.xc), 2);
            result.ibx = Math.floor(result.ibx);
            console.log("ibx = " + result.ibx);
        }

        if (st.slab_edge_type === "r" || st.slab_edge_type === "l") {                  //другие характеристики расчетного контура. если грань плиты справа или слева
            result.iby = Math.pow(ly, 3)/12 + lx * Math.pow(ly, 2)/2;                   //iby
            result.iby = Math.floor(result.iby);
            console.log("iby = " + result.iby);
            result.xmax = result.xa + Math.abs(result.xc);                                        //наиболее удаленная точка
            result.xmax  = Number(result.xmax.toFixed(3));
            console.log("xmax = " + result.xmax);
            result.wbx = result.ibx / result.xmax;                                      //wbx
            result.wbx = Math.floor(result.wbx);
            console.log("wbx = " + result.wbx);
            result.wby = result.iby/(ly/2);                                             //wby
            result.wby = Math.floor(result.wby);
            console.log("wby = " + result.wby);
        }

        //характеристики сечения - низ и верх
        if (st.slab_edge_type === "t") {                  //iby. если грань плиты сверху
            result.iby = Math.pow(ly, 3)/6 + 2 * ly * Math.pow((result.ya - result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya + result.yc), 2);
            result.iby = Math.floor(result.iby);
            console.log("iby = " + result.iby);
        }

        if (st.slab_edge_type === "b") {                  //iby. если грань плиты снизу
            result.iby = Math.pow(ly, 3)/6 + 2 * ly * Math.pow((result.ya + result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya - result.yc), 2);
            result.iby = Math.floor(result.iby);
            console.log("iby = " + result.iby);
        }

        if (st.slab_edge_type === "t" || st.slab_edge_type === "b") {                  //другие характеристики расчетного контура. если грань плиты сверху или снизу
            result.ibx = Math.pow(lx, 3)/12 + ly * Math.pow(lx, 2)/2;                   //ibx
            result.ibx = Math.floor(result.ibx);
            console.log("ibx = " + result.ibx);
            result.ymax = result.ya + Math.abs(result.yc);                                        //наиболее удаленная точка
            result.ymax  = Number(result.ymax.toFixed(3));
            console.log("ymax = " + result.ymax);
            result.wby = result.iby / result.ymax;                                      //wby
            result.wby = Math.floor(result.wby);
            console.log("wby = " + result.wby);
            result.wbx = result.ibx/(lx/2);                                             //wbx
            result.wbx = Math.floor(result.wbx);
            console.log("wbx = " + result.wbx);
        }

        //характеристики сечения - лево-вверх, право-верх, право-низ, лево-них
        if (st.slab_edge_type === "lt") {                  //ibx и iby. если грань плиты лево-вверх
            result.ibx = Math.pow(lx, 3)/12 + lx * Math.pow((result.xa + result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa - result.xc), 2);
            result.ibx = Math.floor(result.ibx);
            console.log("ibx = " + result.ibx);
            result.iby = Math.pow(ly, 3)/12 + ly * Math.pow((result.ya - result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya + result.yc), 2);
            result.iby = Math.floor(result.iby);
            console.log("iby = " + result.iby);
        }

        if (st.slab_edge_type === "rt") {                  //ibx и iby. если грань плиты право-вверх
            result.ibx = Math.pow(lx, 3)/12 + lx * Math.pow((result.xa - result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa + result.xc), 2);
            result.ibx = Math.floor(result.ibx);
            console.log("ibx = " + result.ibx);
            result.iby = Math.pow(ly, 3)/12 + ly * Math.pow((result.ya - result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya + result.yc), 2);
            result.iby = Math.floor(result.iby);
            console.log("iby = " + result.iby);
        }

        if (st.slab_edge_type === "rb") {                  //ibx и iby. если грань плиты право-низ
            result.ibx = Math.pow(lx, 3)/12 + lx * Math.pow((result.xa - result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa + result.xc), 2);
            result.ibx = Math.floor(result.ibx);
            console.log("ibx = " + result.ibx);
            result.iby = Math.pow(ly, 3)/12 + ly * Math.pow((result.ya + result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya - result.yc), 2);
            result.iby = Math.floor(result.iby);
            console.log("iby = " + result.iby);
        }
        
        if (st.slab_edge_type === "lb") {                  //ibx и iby. если грань плиты лево-низ
            result.ibx = Math.pow(lx, 3)/12 + lx * Math.pow((result.xa + result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa - result.xc), 2);
            result.ibx = Math.floor(result.ibx);
            console.log("ibx = " + result.ibx);
            result.iby = Math.pow(ly, 3)/12 + ly * Math.pow((result.ya + result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya - result.yc), 2);
            result.iby = Math.floor(result.iby);
            console.log("iby = " + result.iby);
        }

        if (st.slab_edge_type === "lt" || st.slab_edge_type === "rt" || st.slab_edge_type === "rb" || st.slab_edge_type === "lb") {
            result.xmax = result.xa + Math.abs(result.xc);                               //наиболее удаленная точка
            result.xmax  = Number(result.xmax.toFixed(3));
            console.log("xmax = " + result.xmax);
            result.ymax = result.ya + Math.abs(result.yc);                               //наиболее удаленная точка
            result.ymax  = Number(result.ymax.toFixed(3));
            console.log("ymax = " + result.ymax);
            result.wbx = result.ibx / result.xmax;                                      //wbx
            result.wbx = Math.floor(result.wbx);
            console.log("wbx = " + result.wbx);
            result.wby = result.iby / result.ymax;                                      //wby
            result.wby = Math.floor(result.wby);
            console.log("wby = " + result.wby);
        }

        //если есть отверстия отнимаем от характеристик характеристики вырубки и пересчитываем характеристики
        if (st.openingIsNear) {
            result.ibx = result.ibx - cut_off_ibx - result.u * Math.pow(cut_xc, 2);
            result.ibx = Math.floor(result.ibx);
            console.log("ibx = " + result.ibx);
            result.iby = result.iby - cut_off_iby - result.u * Math.pow(cut_yc, 2);
            result.iby = Math.floor(result.iby);
            console.log("iby = " + result.iby);
            result.xmax_op = lx/2 + Math.abs(cut_xc);
            console.log("xmax_op = " + result.xmax_op);
            result.ymax_op = ly/2 + Math.abs(cut_yc);
            console.log("ymax_op = " + result.ymax_op);

            //если наиболее удаленная точка у нас еше не посчитана (наприм стандартный случай) - мы её считаем
            // если уже есть - то немного корректируем с учетом отверстия
            if (!result.xmax) {                             
                result.xmax = result.xmax_op;
            } else {
                result.xmax = result.xmax + cut_xc;
            }
            result.xmax  = Number(result.xmax.toFixed(3));

            if (!result.ymax) {
                result.ymax = result.ymax_op;
            } else {
                result.ymax = result.ymax + cut_yc;
            }
            result.ymax  = Number(result.ymax.toFixed(3));

            result.wbx = result.ibx / result.xmax;                                      //wbx
            result.wbx = Math.floor(result.wbx);
            console.log("wbx = " + result.wbx);
            result.wby = result.iby / result.ymax;                                      //wby
            result.wby = Math.floor(result.wby);
            console.log("wby = " + result.wby);
        }

        result.size_u_left = size_u_left;                           //данные для отчета Word
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

        this.setState({                                         //отправляем эррей с координатами касательных в глобальный стейт
                geom_chars: result,
                merged_angls: merged_angls
        }, this.calculateAsw);
    }

    calculateAsw() {                        // находим все стержни которые попадают в рабочую зону и учитываются в расчете
        var st = this.state;
        var h0_slab_size = st.t_slab_size - st.a_slab_size;
        if (st.openingIsNear) {
            var u_cut_angles = st.geom_chars.cut_chars.angles;
        }
        var distance = Math.round(h0_slab_size/2/st.scaleFactorSize[0]);                //h0/2
        var aswCircles = [];                                                            //эррей эрреев,
        var out_asw_square;
        var out_asw_square_string = "0,0 0,0 0,0 0,0";                      //забиваем сразу, чтобы не было ругани со стороны canvas_fake() 
        var in_asw_square;
        var in_asw_square_string  = "0,0 0,0 0,0 0,0";
        for (var i = 0; i < st.circlesX.length; i++) {                          // подсчитываем число кружков попадающих в расчетный зазор 0,5h0 по обе стороны от расчетного контура
           checkAswCircles(st.circlesX[i], st.circlesY[i], distance);           
        }

        function checkAswCircles(circleX, circleY, dist) {          //uDisplayCoords: [x1, y1, x2, y2],
            // сначало отбираем те кружки, которые находятся вдоль расчетного контура на расстоянии h0/2 от него
            // отметим координаты этой зоны. Это будет 2 квадрата в которых не учитываютс кружки: внутренний и наружный. Кружки которые попадают в узкую полоску между двумя квадратами - учитываются
            
            // наружный квадрат - если кружки попадают в него - они не учитываются
            
            var x1_out = st.uDisplayCoords[0] - dist;           // uDisplayCoords: [x1, y1, x2, y2]     slabEdgeCoords: [x1, y1, x2, y2]
            var y1_out = st.uDisplayCoords[1] - dist;
            var x2_out = st.uDisplayCoords[2] + dist;
            var y2_out = st.uDisplayCoords[3] + dist;
            

            //внутренний квадрат - если кружки попадают в него - они не учитываются
            var x1_in = st.uDisplayCoords[0] + dist;
            var y1_in = st.uDisplayCoords[1] + dist;
            var x2_in = st.uDisplayCoords[2] - dist;
            var y2_in = st.uDisplayCoords[3] - dist;

            //теперь забиваем варианты что u лежит на краю плиты (рядом край плиты)
            
            if (st.uDisplayCoords[0] === st.slabEdgeCoords[0]) {                        //если u лег на левый край плиты
                x1_out = st.uDisplayCoords[0];                                          //то оба квадрата тоже ложаться на левый край плиты
                x1_in = st.uDisplayCoords[0];
            }

            if (st.uDisplayCoords[2] === st.slabEdgeCoords[2]) {                        //если u лег на правый край плиты
                x2_out = st.uDisplayCoords[2];                                          //то оба квадрата тоже ложаться на правый край плиты
                x2_in = st.uDisplayCoords[2];
            }

            if (st.uDisplayCoords[1] === st.slabEdgeCoords[1]) {                        //если u лег на верхний край плиты
                y1_out = st.uDisplayCoords[1];                                          //то оба квадрата тоже ложаться на верхний край плиты
                y1_in = st.uDisplayCoords[1];
            }

            if (st.uDisplayCoords[3] === st.slabEdgeCoords[3]) {                        //если u лег на нижний край плиты
                y2_out = st.uDisplayCoords[3];                                          //то оба квадрата тоже ложаться на нижний край плиты
                y2_in = st.uDisplayCoords[3];
            }

            out_asw_square = [x1_out, y1_out, x2_out, y2_out];
            out_asw_square_string = x1_out + "," + y1_out + " " +                          //забиваем полученные координаты в строку для SVG
					x1_out + "," + y2_out + " " +
					x2_out + "," + y2_out + " " +
                    x2_out + "," + y1_out;

            in_asw_square = [x1_in, y1_in, x2_in, y2_in];
            in_asw_square_string = x1_in + "," + y1_in + " " +                          //забиваем полученные координаты в строку для SVG
					x1_in + "," + y2_in + " " +
					x2_in + "," + y2_in + " " +
                    x2_in + "," + y1_in;

            //теперь выберем только те кружки которые попадают в узкую полоску между ними

            if ((circleX >= x1_out) && (circleX <= x2_out) && (circleY >= y1_out) && (circleY <= y2_out)) {    // сначало ограничиваем наружный квадрат (out)
                if (!((circleX >= x1_in) && (circleX <= x2_in) && (circleY >= y1_in) && (circleY <= y2_in))) {     //затем ограничиваем внутренний квадрат (in) - в него нельзя попадать
                    //когда мы выделили нужные кружки - мы начинаем проверять их на совпадение, т.к. в углах могут быть совпадения
                    var coincidence = false;                        //здесь мы отмечаем случилось ли совпадение с одним из уже имеющихся эрреев
                    var arr2 = [circleX, circleY];                  //итак у нас есть кандидат на вставление в эррей расчетных стержней

                    if (aswCircles.length === 0) {                  //если он первый, то его сразу вставляем
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
                    for (var i = 0; i < aswCircles.length; i++) {           //если он не первый, то начинаем его поочередно сравнивать со всеми эрреями в aswCircles. Если совпадений нет, то вставляем
                        var local_result = [false, false];                        // это результат - здесь мы будем ставить галочки, какой из элементов эррея совпал. Если хоть один не совпал - значит это другой эррей - следовательно добавляем
                        var arr1 = aswCircles[i];                           //берем один из эрреев в aswCircles
                        for (var k = 0; k < arr1.length; k++) {
                            if(arr1[k] !== arr2[k]) {                       // если данный элемент элемент эррея кандидата не совпадает с аналогичным элементов существующего эррея - ставим галочку тру
                                local_result[k] = true;                           // если данный элемент не совпадает, то переходим к следующему
                            }
                        }
                        var trueNumber = 0;                             //здесь мы отмечаем сколько галочек получил каждый эррей в сравнении с 1 эрреем из aswCircles
                        local_result.forEach(function (e) {
                            if (e) {
                                trueNumber++;
                            }
                        });         // если мы получили хотябы одну галочку тру, значит все ок - этот эррей совсем другой и можно идти проверять дальше с другими эрреями из aswCircles. Если мы получили жаэе одной тру (все осталось фолс) - это значит этот эррей уже существует и дальше проверять нет смысла - его добавлять нельзя
                        if (trueNumber === 0) {
                            coincidence = true;
                        }
                    }
                    if (!coincidence) {             //после всех проверок мы смотрим есть ли у нас совпадение
                        /*
                        here we introduce check for openings tangents. And if it is OK - we push our arr2 to the aswCircles. All circles should have calculated angles.
                        */
                        if (st.openingIsNear) {
                            if (!checkCirclesOpenings(arr2, u_cut_angles)) {
                                aswCircles.push(arr2);      //если совпадения нет - значит это совершенно новый кружок - добавляем
                            }
                        } else {
                            aswCircles.push(arr2);      //если совпадения нет - значит это совершенно новый кружок - добавляем
                        }
                    }
                }
            } 
        }

        var shear_bars_diameter = Number(st.shear_bars_diameter);                               //конвертируем диаметр стержня в число ("6" в 6);
        var asw_tot = aswCircles.length * 3.142 * Math.pow((shear_bars_diameter/2), 2);         // вычисляем общую  площадь поперечной арматуры (мм2)
        asw_tot = Number(asw_tot.toFixed(3));

        this.setState({
            out_asw_square: out_asw_square,
            out_asw_square_string: out_asw_square_string,
            in_asw_square: in_asw_square,
            in_asw_square_string: in_asw_square_string,
            asw_tot: asw_tot,
            aswCircles: aswCircles
        }, function() {
            this.calculate();
        });
        
    }

    calculate() {                                                               //здесь мы собрали все исходные данные и делаем расчет как в СП
        var st = this.state;
        var check = checkDataAdequacy(st);                              //сначало проверяем наличие всех исходных данных. Заполнены ли все поля. Получаем на выходе ээрай с незаполненными графами
        if (check.length === 0) {                                       //если длина этого эррэя равна нулю, значит все ок и можно приступать к расчету
            var h0 = st.t_slab_size - st.a_slab_size;                       //рабочая высота сечения, мм
            console.log("h0 = " + h0 + " мм");
            var rbt = concrete_properties[st.concrete_grade][1] * 0.001 * st.gamma_b;        //считаем Rbt, кН/мм2 -основаная единица
            rbt = Number(rbt.toFixed(8));                                       //округляем
            console.log("Rbt = " + rbt + " кН/мм2");
            var geom_chars = st.geom_chars;
            var u = geom_chars.u;                                       //длина расчетного контура, мм
            var wbx = geom_chars.wbx;                                     //момент сопротивления сечения wbx, мм2 
            var wby = geom_chars.wby;                                     //момент сопротивления сечения wby, мм2 
            console.log("u = " + u + " мм");
            // считаем Mx
            var mbx_ult = rbt * wbx * h0;                                   //прочность бетона на действие Mx 
            mbx_ult = Number(mbx_ult.toFixed(2));                                       //округляем
            console.log("mbx_ult = " + mbx_ult + " кН*мм");

            // считаем My 
            var mby_ult = rbt * wby * h0;                                   //прочность бетона на действие My 
            mby_ult = Number(mby_ult.toFixed(2));                                       //округляем
            console.log("mby_ult = " + mby_ult + " кН*мм");

            // считаем N
            var ab = u * h0;                                            //площадь расчетного поперечного сечения, мм2
            ab = Number(ab.toFixed(3));
            console.log("Ab = " + ab + " мм2");

            //Считаем сколько несет бетон на продольную силу - формула 8.88. Весь расчет будет происходить в единицах измерения по умолчанию: кN, кNм, мм
            var fb_ult = rbt * ab;          // получаем кН/мм2 * мм2 = кН
            fb_ult = Number(fb_ult.toFixed(2));         //округляем до 2 знака после запятой
            console.log("fb_ult = " + fb_ult + " кН");

            var shear_reinf = calculateShearReinf(st);
            var fsw_ult = shear_reinf.fsw_ult;                        //прочность по арматуре на действие N
            console.log("fsw_ult = " + fsw_ult + " кН");
            var f_ult = fb_ult + fsw_ult;                                       //полная прочность сечения на действие N
            f_ult = Number(f_ult.toFixed(3));                                       //округляем
            console.log("f_ult = " + f_ult + " кН");

            // считаем Mx
            var mswx_ult = shear_reinf.mswx_ult;
            console.log("mswx_ult = " + mswx_ult + " кН*мм");


            // считаем My            
            var mswy_ult = shear_reinf.mswy_ult;
            console.log("mswy_ult = " + mswy_ult + " кН*мм");

            //считаем коэффициенты запаса
            var n_factor = st.n_load/f_ult;                             //считаем коэфф запаса по N
            n_factor = Number(n_factor.toFixed(3));

            var m_factor_1;
            var mx_1;
            var my_1;
            if ((st.slab_edge_type === "") && !st.openingIsNear) {                        //если u просто прямоугольник, т.е. нет рядом краев плит и отверстий
                m_factor_1 = ((st.mx_load*1000)/(mbx_ult + mswx_ult)) + ((st.my_load*1000)/(mby_ult + mswy_ult));                    //считаем коэф. запаса по моментам. Переводим моменты кНм в кН*мм
            }

            if ((st.slab_edge_type === "") && st.openingIsNear) {                        //если u просто прямоугольник и есть отверстия - докидываем моменты от расцентровки
                mx_1 = Math.abs(st.mx_load*1000) + Math.abs(st.n_load*geom_chars.cut_xc);
                mx_1 = Number(mx_1.toFixed(2));
                my_1 = Math.abs(st.my_load*1000) + Math.abs(st.n_load*geom_chars.cut_yc);
                my_1 = Number(my_1.toFixed(2));
                m_factor_1 = (mx_1/(mbx_ult + mswx_ult)) + (my_1/(mby_ult + mswy_ult));                    //считаем коэф. запаса по моментам. Переводим моменты кНм в кН*мм
            }

            if ((st.slab_edge_type !== "") && !st.openingIsNear) {                        //если ,близко край плиты и нет отверстия - докидываем моменты от расцентровки
                mx_1 = Math.abs(st.mx_load*1000) + Math.abs(st.n_load*geom_chars.xc);
                mx_1 = Number(mx_1.toFixed(2));
                my_1 = Math.abs(st.my_load*1000) + Math.abs(st.n_load*geom_chars.yc);
                my_1 = Number(my_1.toFixed(2));
                m_factor_1 = (mx_1/(mbx_ult + mswx_ult)) + (my_1/(mby_ult + mswy_ult));                    //считаем коэф. запаса по моментам. Переводим моменты кНм в кН*мм
            }

            if ((st.slab_edge_type !== "") && st.openingIsNear) {                        //если ,близко край плиты и есть отверстия - докидываем моменты от обоих расцентровак
                mx_1 = Math.abs(st.mx_load*1000) + Math.abs(st.n_load*geom_chars.xc) + Math.abs(st.n_load*geom_chars.cut_xc);
                mx_1 = Number(mx_1.toFixed(2));
                my_1 = Math.abs(st.my_load*1000) + Math.abs(st.n_load*geom_chars.yc) + Math.abs(st.n_load*geom_chars.cut_yc);
                my_1 = Number(my_1.toFixed(2));
                m_factor_1 = (mx_1/(mbx_ult + mswx_ult)) + (my_1/(mby_ult + mswy_ult));                    //считаем коэф. запаса по моментам. Переводим моменты кНм в кН*мм
            }

            m_factor_1 = Number(m_factor_1.toFixed(3));
            console.log(n_factor + ", " + m_factor_1);      

            var m_factor_2;
            if (m_factor_1 > (0.5*n_factor)) {                                    // m_factor принимается не более чем 0.5*n_factor. Пункт 8.1.46
                m_factor_2 = 0.5*n_factor;
                m_factor_2 = Number(m_factor_2.toFixed(3));
            } else {
                m_factor_2 = m_factor_1;
            }

            //считаем общий коэффициент запаса
            console.log(n_factor + ", " + m_factor_2);
            var factor = n_factor + m_factor_2;                                                          //считаем общий коэф. запаса.
            factor = Number(factor.toFixed(3));
            var result = "";
            var result_color = "";
            if (factor <= 1) {                                                                      //формируем фразу и цвет результата
                result = "Прочность обеспечена. Коэффициент использования = " + factor;
                result_color = "success";
            } else {
                result = "Прочность не обеспечена. Коэффициент использования = " + factor;
                result_color = "danger";
            }
            console.log(result);
            this.setState({ text_result: result,                                             //обновляем стейт результатом расчета
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
                                cut_chars: geom_chars.cut_chars
                            }
                        });
        } else {                                                                    // если длина эррэя check не равна нулю, то создаем фразу со списком недостающих данных
            var phrase = createInsufficientPhrase(check);
            this.setState({
                            text_result: "Заданы не все исходные данные. Пожалуйста заполните следующие графы: " + phrase + ".",
                            result_color: "secondary"
                          });
        }

        function calculateShearReinf(st) {                          //Считаем сколько несет арматура - формула 8.91
            var result = {
                fsw_ult_1: 0,
                fsw_ult: 0,
                mswx_ult_1: 0,
                mswx_ult: 0,
                mswy_ult_1: 0,
                mswy_ult: 0,
                asw_sw: 0,
                qsw: 0
            };

            if (st.shear_reinforcement) {                                       //если расчет по поперечке включен то считаем
                var rsw = rebar_properies[st.shear_bars_grade]*0.001;         // считаем Rsw, кН/мм2
                console.log("Rsw = " + rsw + " кН/мм2");

                // считаем fsw_ult
                var asw_tot = st.asw_tot;        //определим сколько арматуры попадает в зазор 0,5h0 по обе стороны от u.
                console.log("asw_tot = " + asw_tot + " мм2 и " + asw_tot * 0.01 + "см2");
                result.asw_sw = asw_tot/u;                             //отношение Asw/sw - погонная арматура
                result.asw_sw = Number(result.asw_sw.toFixed(3));
                result.qsw = rsw * result.asw_sw;
                result.qsw = Number(result.qsw.toFixed(3));
                console.log("qsw = " + result.qsw + " кН/мм = " + 1000*result.qsw + " кг/см");
                result.fsw_ult_1 = 0.8 * result.qsw * u;                  //  кН/мм2 * мм2
                result.fsw_ult_1 = Number(result.fsw_ult_1.toFixed(3));                   //округляем
                result.fsw_ult = result.fsw_ult_1;
                if (result.fsw_ult_1 < 0.25*fb_ult) {                            //проверка п. 8.1.48
                    result.fsw_ult = 0;
                }
                if (result.fsw_ult_1 > fb_ult) {
                    result.fsw_ult = fb_ult;
                }
                // конец расчета fsw_ult

                // считаем mswx_ult и mswy_ult

                result.mswx_ult_1 = 0.8 * result.qsw * wbx;                          // формула 8.97. wswx = wbx
                result.mswx_ult_1 = Number(result.mswx_ult_1.toFixed(3));                   //округляем
                result.mswy_ult_1 = 0.8 * result.qsw * wby;
                result.mswy_ult_1 = Number(result.mswy_ult_1.toFixed(3));                   //округляем
                result.mswx_ult = result.mswx_ult_1;
                result.mswy_ult = result.mswy_ult_1;
                if (result.mswx_ult_1 > mbx_ult) {                                //проверка п. 8.1.48
                    result.mswx_ult = mbx_ult;
                }
                if (result.mswy_ult_1 > mby_ult) {
                    result.mswy_ult = mby_ult;
                }

                // конец расчета mswx_ult и mswy_ult

            } else {                                                    //если расчет по поперечки выключен то fsw_ult = 0
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

    handleEnterKey(e) {                                                             //по нажатию Enter формируем отчет
        var key = e.keyCode;
		if ((key === 13) && (this.state.result_color !== "secondary")) {
            this.exportToWord();
        }
    }

    exportToWord() {                                                //формируем отчет в Word
        var st = this.state;
        var convert_n = (st.force_units === "кН") ? "" : " " + st.force_units + " = " + st.n_load;                         //формируем строку перевода единиц в СИ
        var convert_mx = (st.force_units === "кН") ? "" : " " + st.force_units + "м = " + st.mx_load;
        var convert_my = (st.force_units === "кН") ? "" : " " + st.force_units + "м = " + st.my_load;
        var convert_a = (st.length_units === "мм") ? "" : " " + st.length_units + " = " + st.a_column_size;                         
        var convert_b = (st.length_units === "мм") ? "" : " " + st.length_units + " = " + st.b_column_size;
        var convert_t = (st.length_units === "мм") ? "" : " " + st.length_units + " = " + st.t_slab_size;
        var convert_at = (st.length_units === "мм") ? "" : " " + st.length_units + " = " + st.a_slab_size;
        var conc_gr = st.concrete_grade.toUpperCase();
        var rebar_gr = st.shear_bars_grade.toUpperCase();
        var rbt = concrete_properties[st.concrete_grade][1] * 0.001;                                 //считаем Rbt, кН/мм2 -основаная единица
        rbt = Number(rbt.toFixed(8));
        var rsw = rebar_properies[st.shear_bars_grade]*0.001;         // считаем Rsw, кН/мм2
        rsw = Number(rsw.toFixed(3));
        var r_dist = [...st.shear_bars_spacing_to_prev];
        r_dist.shift();                                                     //удаляем 0
        var rows_dist = r_dist.join(", ");

        var convert_edge_left = (st.length_units === "мм") ? "" : " " + st.length_units + " = " + st.edge_left_dist;
        var edge_left = function() {
            if (st.edge_left) {
                var result = new Paragraph ({ text: "Слева: " + st.input_edge_left_dist + convert_edge_left + " мм,", style: "Norm1" });
                return result;
            }
        }

        var convert_edge_right = (st.length_units === "мм") ? "" : " " + st.length_units + " = " + st.edge_right_dist;
        var edge_right = function() {
            if (st.edge_right) {
                var result = new Paragraph ({ text: "Справа: " + st.input_edge_right_dist + convert_edge_right + " мм,", style: "Norm1" });
                return result;
            }
        }

        var convert_edge_top = (st.length_units === "мм") ? "" : " " + st.length_units + " = " + st.edge_top_dist;
        var edge_top = function() {
            if (st.edge_top) {
                var result = new Paragraph ({ text: "Сверху: " + st.input_edge_top_dist + convert_edge_top + " мм,", style: "Norm1" });
                return result;
            }
        }

        var convert_edge_bottom = (st.length_units === "мм") ? "" : " " + st.length_units + " = " + st.edge_bottom_dist;
        var edge_bottom = function() {
            if (st.edge_bottom) {
                var result = new Paragraph ({ text: "Снизу: " + st.input_edge_bottom_dist + convert_edge_bottom + " мм,", style: "Norm1" });
                return result;
            }
        }

        function OpeningsReport() {                                                                             //формируем строки отчета про характеристики отверстий
            var result = [];
            var convert_X, convert_Y, convert_a, convert_b;
            var k = 1;
            for (var i = 1; i < st.input_openings.X.length; i++) {
                if (st.input_openings.X[i] !== "") {                                       // если отверстие не удалено
                    convert_X = (st.length_units === "мм") ? "" : " " + st.length_units + " = " + st.openings.X[i];
                    convert_Y = (st.length_units === "мм") ? "" : " " + st.length_units + " = " + st.openings.Y[i]*(-1);            //меняем направление оси У - в SVG она направлена вниз, у нас классически вверх
                    convert_a = (st.length_units === "мм") ? "" : " " + st.length_units + " = " + st.openings.a[i]; 
                    convert_b = (st.length_units === "мм") ? "" : " " + st.length_units + " = " + st.openings.b[i]; 
                    
                    result.push(new Paragraph ({
                                    text: "Отверстие " + k + ":",
                                    style: "Norm1"                     
                    }));
                    result.push(new Paragraph ({
                                    text: " - размер вдоль оси Х = " + st.input_openings.a[i] + convert_a + " мм,",
                                    style: "Norm1"                     
                    }));
                    result.push(new Paragraph ({
                                    text: " - размер вдоль оси Y = " + st.input_openings.b[i] + convert_b + " мм,",
                                    style: "Norm1"                     
                    }));
                    result.push(new Paragraph ({
                                    text: " - привязка вдоль оси Х = " + st.input_openings.X[i] + convert_X + " мм,",
                                    style: "Norm1"                    
                    }));
                    result.push(new Paragraph ({
                                    text: " - привязка вдоль оси Y = " + st.input_openings.Y[i] + convert_Y + " мм,",
                                    style: "Norm1"                     
                    }));
                    k++;
                }
            }
            return result;
        }

        // Create document
        const doc = new Document({
            styles: {                                       //стили отчета
                paragraphStyles: [
                    {
                        id: "Norm1",
                        name: "Norm 1",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            font: "Calibri",
                            size: 26,
                        },
                        paragraph: {
                            spacing: {
                                /*
                                line: 320,
                                */
                                before: 240,
                                after: 120
                            }
                        }
                    },
                    {
                        id: "Head1",
                        name: "Head 1",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            font: "Calibri",
                            bold: true,
                            size: 32,
                        },
                        paragraph: {
                            alignment: AlignmentType.CENTER
                        }
                    },
                    {
                        id: "Head2",
                        name: "Head 2",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            font: "Calibri",
                            bold: true,
                            size: 26,
                        }
                    }
                ]
            }
        });
        var img = canvas_fake();                                                            //перегоняем SVG в PNG для вставки в Word                                   
        const image = Media.addImage(doc, img, 450, 450);

        // моделируем фразы с подстрочными символами для Word

        const text_break = new Paragraph({
            text: ""                      
        });

        const mx_letter =  new TextRun({                               //Mx
            children: [
                new TextRun({
                    text: "M",
                }),
                new TextRun({
                    text: "x",
                    subScript: true
                }),
            ]
        });

        const my_letter =  new TextRun({                               //My
            children: [
                new TextRun({
                    text: "M",
                }),
                new TextRun({
                    text: "y",
                    subScript: true
                }),
            ]
        });

        const at_letter =  new TextRun({                               //at
            children: [
                new TextRun({
                    text: "a",
                }),
                new TextRun({
                    text: "t",
                    subScript: true
                }),
            ]
        });

        const h0_letter =  new TextRun({                               //h0
            children: [
                new TextRun({
                    text: "h",
                }),
                new TextRun({
                    text: "0",
                    subScript: true
                }),
            ]
        });

        const rbt_letter =  new TextRun({                               //Rbt
            children: [
                new TextRun({
                    text: "R",
                }),
                new TextRun({
                    text: "bt",
                    subScript: true
                }),
            ]
        });

        const gamma_b_letter =  new TextRun({                               //γb
            children: [
                new TextRun({
                    text: "γ",
                }),
                new TextRun({
                    text: "b",
                    subScript: true
                }),
            ]
        });

        const sup_2 =  new TextRun({
            text: "2",
            superScript: true
        });

        const sup_3 =  new TextRun({
            text: "3",
            superScript: true
        });

        const rsw_letter =  new TextRun({                               //Rsw
            children: [
                new TextRun({
                    text: "R",
                }),
                new TextRun({
                    text: "sw",
                    subScript: true
                }),
            ]
        });

        const ab_letter =  new TextRun({                               //Ab
            children: [
                new TextRun({
                    text: "A",
                }),
                new TextRun({
                    text: "b",
                    subScript: true
                }),
            ]
        });

        const fbult_letter =  new TextRun({                               //Fb,ult
            children: [
                new TextRun({
                    text: "F",
                }),
                new TextRun({
                    text: "b,ult",
                    subScript: true
                }),
            ]
        });

        const lux_letter =  new TextRun({                               //Lux
            children: [
                new TextRun({
                    text: "L",
                }),
                new TextRun({
                    text: "ux",
                    subScript: true
                }),
            ]
        });

        const luy_letter =  new TextRun({                               //Luy
            children: [
                new TextRun({
                    text: "L",
                }),
                new TextRun({
                    text: "uy",
                    subScript: true
                }),
            ]
        });

        const ibx_letter =  new TextRun({                               //Ibx
            children: [
                new TextRun({
                    text: "I",
                }),
                new TextRun({
                    text: "bx",
                    subScript: true
                }),
            ]
        });

        const iby_letter =  new TextRun({                               //Iby
            children: [
                new TextRun({
                    text: "I",
                }),
                new TextRun({
                    text: "by",
                    subScript: true
                }),
            ]
        });

        const wbx_letter =  new TextRun({                               //Wbx
            children: [
                new TextRun({
                    text: "W",
                }),
                new TextRun({
                    text: "bx",
                    subScript: true
                }),
            ]
        });

        const wby_letter =  new TextRun({                               //Wby
            children: [
                new TextRun({
                    text: "W",
                }),
                new TextRun({
                    text: "by",
                    subScript: true
                }),
            ]
        });

        const mbxult_letter =  new TextRun({                               //Mbx,ult
            children: [
                new TextRun({
                    text: "M",
                }),
                new TextRun({
                    text: "bx,ult",
                    subScript: true
                }),
            ]
        });

        const mbyult_letter =  new TextRun({                               //Mby,ult
            children: [
                new TextRun({
                    text: "M",
                }),
                new TextRun({
                    text: "by,ult",
                    subScript: true
                }),
            ]
        });

        const asw_tot_letter =  new TextRun({                               //Asw_tot
            children: [
                new TextRun({
                    text: "A",
                }),
                new TextRun({
                    text: "sw_tot",
                    subScript: true
                }),
            ]
        });

        const asw_letter =  new TextRun({                               //Asw
            children: [
                new TextRun({
                    text: "A",
                }),
                new TextRun({
                    text: "sw",
                    subScript: true
                }),
            ]
        });

        const qsw_letter =  new TextRun({                               //qsw
            children: [
                new TextRun({
                    text: "q",
                }),
                new TextRun({
                    text: "sw",
                    subScript: true
                }),
            ]
        });

        const fswult_letter =  new TextRun({                               //Fsw,ult
            children: [
                new TextRun({
                    text: "F",
                }),
                new TextRun({
                    text: "sw,ult",
                    subScript: true
                }),
            ]
        });

        var fult_letter =  new TextRun({                               //Fult
            children: [
                new TextRun({
                    text: "F",
                }),
                new TextRun({
                    text: "ult",
                    subScript: true
                }),
            ]
        });

        const wswx_letter =  new TextRun({                               //Wsw,x
            children: [
                new TextRun({
                    text: "W",
                }),
                new TextRun({
                    text: "sw,x",
                    subScript: true
                }),
            ]
        });

        const wswy_letter =  new TextRun({                               //Wsw,y
            children: [
                new TextRun({
                    text: "W",
                }),
                new TextRun({
                    text: "sw,y",
                    subScript: true
                }),
            ]
        });

        const mswxult_letter =  new TextRun({                               //Msw,x,ult 
            children: [
                new TextRun({
                    text: "M",
                }),
                new TextRun({
                    text: "sw,x,ult",
                    subScript: true
                }),
            ]
        });

        const mswyult_letter =  new TextRun({                               //Msw,y,ult 
            children: [
                new TextRun({
                    text: "M",
                }),
                new TextRun({
                    text: "sw,y,ult",
                    subScript: true
                }),
            ]
        });

        var mxult_letter =  new TextRun({                               //Mx,ult
            children: [
                new TextRun({
                    text: "M",
                }),
                new TextRun({
                    text: "x,ult",
                    subScript: true
                }),
            ]
        });
        
        var myult_letter =  new TextRun({                               //My,ult
            children: [
                new TextRun({
                    text: "M",
                }),
                new TextRun({
                    text: "y,ult",
                    subScript: true
                }),
            ]
        });

        const sx_letter =  new TextRun({                               //Sx
            children: [
                new TextRun({
                    text: "S",
                }),
                new TextRun({
                    text: "x",
                    subScript: true
                }),
            ]
        });

        const sy_letter =  new TextRun({                               //Sy
            children: [
                new TextRun({
                    text: "S",
                }),
                new TextRun({
                    text: "y",
                    subScript: true
                }),
            ]
        });

        const xa_letter =  new TextRun({                               //xa
            children: [
                new TextRun({
                    text: "x",
                }),
                new TextRun({
                    text: "a",
                    subScript: true
                }),
            ]
        });

        const ya_letter =  new TextRun({                               //ya
            children: [
                new TextRun({
                    text: "y",
                }),
                new TextRun({
                    text: "a",
                    subScript: true
                }),
            ]
        });

        const xmax_letter =  new TextRun({                               //xmax
            children: [
                new TextRun({
                    text: "x",
                }),
                new TextRun({
                    text: "max",
                    subScript: true
                }),
            ]
        });

        const ymax_letter =  new TextRun({                               //ymax
            children: [
                new TextRun({
                    text: "y",
                }),
                new TextRun({
                    text: "max",
                    subScript: true
                }),
            ]
        });

        const xc_letter =  new TextRun({                               //xc
            children: [
                new TextRun({
                    text: "x",
                }),
                new TextRun({
                    text: "c",
                    subScript: true
                }),
            ]
        });

        const yc_letter =  new TextRun({                               //yc
            children: [
                new TextRun({
                    text: "y",
                }),
                new TextRun({
                    text: "c",
                    subScript: true
                }),
            ]
        });


        //Моделируем текстовку отчета для Word

        const report_1 = [
                new Paragraph({                                             //"<h2>Расчет на продавливание</h2>"
                    text: "Расчет на продавливание",
                    style: "Head1"
                }),
                text_break,
                new Paragraph({                                             // картинка
                    children: [
                        image,
                    ],
                    alignment: AlignmentType.CENTER,
                }),
                text_break,
                new Paragraph({                                               //"<p><b>Исходные данные:</b></p>"
                    text: "Исходные данные:",
                    style: "Head2"
                }),
                new Paragraph({                                               //"<p>Расчет будем вести в системе СИ: кН и мм.</p>"
                    text: "Расчет будем вести в системе СИ: кН и мм:",
                    style: "Norm1"
                }),
                new Paragraph({                                               // "<p>Продольная сила, N = " + st.input_n_load + convert_n + " кН,</p>"                                                                        
                    text: "Продольная сила, N = " + st.input_n_load + convert_n + " кН,",
                    style: "Norm1"
                }),
                new Paragraph({                                              //"<p>Изгибающий момент, Мx = " + st.input_mx_load + convert_mx + " кНм,</p>"
                    children: [
                        new TextRun({
                            text: "Изгибающий момент ",
                        }),
                        mx_letter,
                        new TextRun({
                            text: " = " + st.input_mx_load + convert_mx + " кНм,",
                        }),                        
                    ],
                    style: "Norm1"
                }),
                new Paragraph({                                             //"<p>Изгибающий момент, My = " + st.input_my_load + convert_my + " кНм,</p>"
                    children: [
                        new TextRun({
                            text: "Изгибающий момент ",
                        }),
                        my_letter,
                        new TextRun({
                            text: " = " + st.input_my_load + convert_my + " кНм,",
                        }),                        
                    ],
                    style: "Norm1"
                }),
                new Paragraph({                                            //"<p>Размер сечения колонны вдоль оси X, а = " + st.input_a_column_size + convert_a + " мм,</p>"
                    text: "Размер сечения колонны вдоль оси X, а = " + st.input_a_column_size + convert_a + " мм,",
                    style: "Norm1"
                }),
                new Paragraph({                                           //"<p>Размер сечения колонны вдоль оси Y, b = " + st.input_b_column_size + convert_b +" мм,</p>"
                    text: "Размер сечения колонны вдоль оси Y, b = " + st.input_b_column_size + convert_b +" мм,",
                    style: "Norm1"
                }),
                new Paragraph({                                            //"<p>Толщина плиты, h = " + st.input_t_slab_size + convert_t +" мм,</p>" 
                    text: "Толщина плиты, h = " + st.input_t_slab_size + convert_t +" мм,",
                    style: "Norm1"
                }),
                new Paragraph({                                        //  "<p>Привязка центра тяжести арматуры, a<sub>t</sub> = " + st.input_a_slab_size + convert_at +" мм,</p>"
                    children: [
                        new TextRun({
                            text: "Привязка центра тяжести арматуры, ",
                        }),
                        at_letter,
                        new TextRun({
                            text: " = " + st.input_a_slab_size + convert_at +" мм,",
                        }),                        
                    ],
                    style: "Norm1"
                }),
                new Paragraph({                                           //"<p>Класс бетона: " + conc_gr + "," + "</p>" 
                    text: "Класс бетона: " + conc_gr + ",",
                    style: "Norm1"
                }),
                new Paragraph({                                          //  "<p>Коэффициент γ<sub>b</sub> = " + st.gamma_b + "," + "</p>"
                    children: [
                        new TextRun({
                            text: "Коэффициент ",
                        }),
                        gamma_b_letter,
                        new TextRun({
                            text: " = " + st.gamma_b + ",",
                        }),
                    ],
                    style: "Norm1"
                }),
                new Paragraph({                                        //"<p>R<sub>bt</sub> = " + concrete_properties[st.concrete_grade][1] + " МПа = " + rbt + " кН/мм<sup>2</sup>,</p>" 
                    children: [
                        rbt_letter,
                        new TextRun({
                            text: " = " + concrete_properties[st.concrete_grade][1] + " МПа = " + rbt + " кН/мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ],
                    style: "Norm1"
                })
            ];
            
        const report_2 = function () {                                                      //часть про армирование
            var result = [];
            if (st.shear_reinforcement) {
                result = [
                    new Paragraph({                                                         //"<p>Класс поперечной арматуры: " + rebar_gr + ",</p>"
                        text: "Класс поперечной арматуры: " + rebar_gr + ",",
                        style: "Norm1"
                    }),
                    new Paragraph({                                                                      //<p>Диаметр поперечной арматуры = " + st.shear_bars_diameter + " мм,</p>"
                        text: "Диаметр поперечной арматуры = " + st.shear_bars_diameter + " мм,",           
                        style: "Norm1"
                    }),
                    new Paragraph({                                                                         //"<p>Rsw = " + rebar_properies[st.shear_bars_grade] + " МПа = " + rsw + " кН/мм<sup>2</sup>,</p>"
                        children: [
                            rsw_letter,
                            new TextRun({
                                text: " = " + rebar_properies[st.shear_bars_grade] + " МПа = " + rsw + " кН/мм",
                            }),
                            sup_2,                     
                        ],
                        style: "Norm1"
                    }),
                    new Paragraph({                                                                       //"<p>Количество рядов поперечной арматуры - " + st.shear_bars_row_number + "," + "</p>" 
                        text: "Количество рядов поперечной арматуры - " + st.shear_bars_row_number + ",",           
                        style: "Norm1"
                    }),
                    new Paragraph({                                                                       //"<p>Количество стержней поперечной арматуры - " + st.circlesX.length + " шт.</p>" + 
                        text: "Количество стержней поперечной арматуры - " + st.circlesX.length + " шт.",           
                        style: "Norm1"
                    }),
                    new Paragraph({                                                                       //"<p>Расстояние между рядами поперечной арматуры - " + rows_dist + " мм.</p>" + 
                        text: "Расстояние между рядами поперечной арматуры - " + rows_dist + " мм.",           
                        style: "Norm1"
                    })
                ];
            }
            return result;
        }

        const report_3 = function () {                                                          //часть про края плиты
            var result = [];
            if (st.slab_edge) {
                result = [
                    new Paragraph({                                                                       //"<p>Расстояние до ближайшего края плиты:</p>" +
                        text: "Расстояние до ближайшего края плиты:",           
                        style: "Norm1"
                    }),
                    edge_left(),
                    edge_right(),
                    edge_top(),
                    edge_bottom()
                ];
            }
            return result;
        }

        const report_4 = function () {                                                          //часть про отверстия
            var result = [];
            if (st.openingIsNear) {
                result = [
                    new Paragraph({                                                                       
                        text: "Размер отверстий, а также привязка центра отверстий к центру колонны:",           
                        style: "Norm1"
                    }),
                ];
                result = result.concat(OpeningsReport());
            }
            return result;
        }

        const report_5 = function() {
            var result = [];
            var part1 = [                                                           // общее начало расчета
                text_break,
                new Paragraph({                                                         //"<p><b>Расчет:</b></p>"
                    text: "Расчет:",
                    style: "Head2"
                }),
                new Paragraph({                                                        //"<p>h<sub>0</sub> = h - a<sub>t</sub> = " + st.t_slab_size + " - " + st.a_slab_size + " = " + st.report_data.h0 + " мм,</p>" + 
                    children: [
                        h0_letter,
                        new TextRun({
                            text: " = h - ",
                        }),
                        at_letter,
                        new TextRun({
                            text: " = " + st.t_slab_size + " - " + st.a_slab_size + " = " + st.report_data.h0 + " мм,",
                        }),
    
                    ],
                    style: "Norm1"
                }),
                new Paragraph({                                                        //"<p>R<sub>bt</sub> = R<sub>bt</sub> * γ<sub>b</sub> = " + rbt + " * " + st.gamma_b + " = " + st.report_data.rbt + "  кН/мм<sup>2</sup>,</p>" +
                    children: [
                        rbt_letter,
                        new TextRun({
                            text: " = ",
                        }),
                        rbt_letter,
                        new TextRun({
                            text: " * ",
                        }),
                        gamma_b_letter,
                        new TextRun({
                            text: " = " + rbt + " * " + st.gamma_b + " = " + st.report_data.rbt + " кН/мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        })
                    ],
                    style: "Norm1"
                })            
            ];
            var part2 =[];                              // учет отверстий
            var part3 =[];
            var part4 =[];
            if (st.openingIsNear) {
                part2 = [
                    new Paragraph({ 
                        children: [
                            new TextRun({
                                text: "Характеристики участков, отсекаемых касательными к отверстиям:",
                            }),
                        ],
                        style: "Norm1"
                    })
                ];
                part3 = cut_chars();
                part4 = [
                    new Paragraph({              // считаем вырубку u
                        children: [
                            new TextRun({
                                text: "Характеристики сечения, которые будут вычитаться из контура продавливания:",
                            }),
                        ],
                        style: "Norm1"
                    }),
                    new Paragraph({              // считаем вырубку u
                        children: u_phrase(),
                        style: "Norm1"
                    }),
                    new Paragraph({              // считаем вырубку ibx
                        children: ibx_tot_phrase(),
                        style: "Norm1"
                    }),
                    new Paragraph({              // считаем вырубку iby
                        children: iby_tot_phrase(),
                        style: "Norm1"
                    }),
                    new Paragraph({              // считаем вырубку sx
                        children: sx_tot_phrase(),
                        style: "Norm1"
                    }),
                    new Paragraph({              // считаем вырубку sy
                        children: sy_tot_phrase(),
                        style: "Norm1"
                    }),
                    new Paragraph({  
                        children: [
                            new TextRun({
                                text: "Итоговые характеристики сечения с учетом отверстий:",
                            }),
                        ],
                        style: "Norm1"
                    }),
                ];              
            }
            var part5 = [                                                           // продолжаем далее
                new Paragraph({                                                        //"<p>u = " + st.report_data.size_u_left + " + " + st.report_data.size_u_top + " + " + st.report_data.size_u_right + " + " + st.report_data.size_u_bottom + " - " + st.report_data.cut_off + " = " + st.report_data.u + " мм,</p>" +
                    children: [
                        new TextRun({
                            text: "u = " + st.report_data.size_u_left + " + " + st.report_data.size_u_top + " + " + st.report_data.size_u_right + " + " + st.report_data.size_u_bottom + " - " + st.report_data.cut_off + " = " + st.report_data.u + " мм,",
                        })
                    ],
                    style: "Norm1"
                }),
                new Paragraph({                                                        // "<p>A<sub>b</sub> = u * h<sub>0</sub> = " + st.report_data.u + " * " + st.report_data.h0 + " = " + st.report_data.ab + " мм<sup>2</sup>,</p>" +
                    children: [
                        ab_letter,
                        new TextRun({
                            text: " = u * ",
                        }),
                        h0_letter,
                        new TextRun({
                            text: " = " + st.report_data.u + " * " + st.report_data.h0 + " = " + st.report_data.ab + " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        })
                    ],
                    style: "Norm1"
                }),
                new Paragraph({                                                        // "<p>F<sub>b,ult</sub> = R<sub>bt</sub> * A<sub>b</sub> = " + st.report_data.rbt + " * " + st.report_data.ab + " = " + st.report_data.fb_ult + " кН,</p>" + 
                    children: [
                        fbult_letter,
                        new TextRun({
                            text: " = ",
                        }),
                        rbt_letter,
                        new TextRun({
                            text: " * ",
                        }),
                        ab_letter,
                        new TextRun({
                            text: " = " + st.report_data.rbt + " * " + st.report_data.ab + " = " + st.report_data.fb_ult + " кН,",
                        }),
                    ],
                    style: "Norm1"
                })
            ];

            var part6 = [];
            if (st.openingIsNear) {
                part6 = [
                    new Paragraph({                                          //x'c = s'x/u;
                        children: [
                            new TextRun({
                                text: "x'",
                            }),
                            new TextRun({
                                text: "c",
                                subScript: true
                            }),
                            new TextRun({
                                text: " = ",
                            }),
                            new TextRun({
                                text: "S'",
                            }),
                            new TextRun({
                                text: "x",
                                subScript: true
                            }),
                            new TextRun({
                                text: "/u = " + st.report_data.cut_off_sx + "/" + st.report_data.u + " = " + st.report_data.cut_xc + " мм," ,
                            }),
                        ],
                        style: "Norm1"
                    }),
                    new Paragraph({                                          //y'c = s'y/u;
                        children: [
                            new TextRun({
                                text: "y'",
                            }),
                            new TextRun({
                                text: "c",
                                subScript: true
                            }),
                            new TextRun({
                                text: " = ",
                            }),
                            new TextRun({
                                text: "S'",
                            }),
                            new TextRun({
                                text: "y",
                                subScript: true
                            }),
                            new TextRun({
                                text: "/u = " + st.report_data.cut_off_sy + "/" + st.report_data.u + " = " + st.report_data.cut_yc + " мм," ,
                            }),
                        ],
                        style: "Norm1"
                    })  

                ];
            }

            result = result.concat(part1, part2, part3, part4, part5, part6);

            function u_phrase() {
                var result;
                if (st.report_data.cut_chars.cut_u.length > 0) {
                    result = [
                        new TextRun({
                            text: "u' = ",
                        })
                    ];
                    var part1 = [];
                    var part2 = [];
                    for (var i = 0; i < st.report_data.cut_chars.cut_u.length; i++) {
                        if (i === 0) {
                            part1 = [
                                new TextRun({
                                    text: "u'",
                                }),
                                new TextRun({
                                    text: (i+1),
                                    subScript: true
                                })
                            ];
                        } else {
                            part1 = [
                                new TextRun({
                                    text: " + ",
                                }),
                                new TextRun({
                                    text: "u'",
                                }),
                                new TextRun({
                                    text: (i+1),
                                    subScript: true
                                }),                        
                            ];
                        }                    
                        result = result.concat(part1);
                    }
                    for (var i = 0; i < st.report_data.cut_chars.cut_u.length; i++) {
                        if (i === 0) {
                            part2 = [
                                new TextRun({
                                    text: " = ",
                                }),
                                new TextRun({
                                    text: st.report_data.cut_chars.cut_u[i],
                                }),                            
                            ];
                        } else {
                            part2 = [
                                new TextRun({
                                    text: " + ",
                                }),
                                new TextRun({
                                    text: st.report_data.cut_chars.cut_u[i],
                                }),                            
                            ];
                        }                    
                        result = result.concat(part2);
                    }
                    var part3 = [
                        new TextRun({
                            text: " = " + st.report_data.cut_off + " мм,",
                        }),
                    ];
                    result = result.concat(part3);
                } else {
                    result = [
                        new TextRun({
                            text: "u' = 0 мм",
                        })
                    ];
                }
                return result;
            }

            function cut_chars() {          //характеристики контуров
                var result = [
                    new Paragraph({            //
                        children: [
                            new TextRun({
                                text: "u'",
                            }),
                            new TextRun({
                                text: "i",
                                subScript: true
                            }),
                            new TextRun({
                                text: " - часть контура продавливания, отсекаемая касательными к отверстиям и не участвующая в расчете.",
                            }),
                        ],
                        style: "Norm1"
                    }),
                    new Paragraph({            //
                        children: [
                            new TextRun({
                                text: "I'",
                            }),
                            new TextRun({
                                text: "bx",
                                subScript: true
                            }),
                            new TextRun({
                                text: ", I'",
                            }),
                            new TextRun({
                                text: "by",
                                subScript: true
                            }),
                            new TextRun({
                                text: " - моменты инерции, вычитаемые из полных моментов инерции ",
                            }),
                            ibx_letter,
                            new TextRun({
                                text: " и ",
                            }),
                            iby_letter,
                            new TextRun({
                                text: ".",
                            }),
                        ],
                        style: "Norm1"
                    })
                ];
                var part;
                for (var i = 0; i < st.report_data.cut_chars.cut_u.length; i++) {
                    part = [
                        new Paragraph({            //
                            children: [
                                new TextRun({
                                    text: "Сектор " + (i+1) + ":",
                                }),
                            ],
                            style: "Norm1"
                        }),
                        new Paragraph({            //
                            children: [
                                new TextRun({
                                    text: "u'",
                                }),
                                new TextRun({
                                    text: (i+1),
                                    subScript: true
                                }),
                                new TextRun({
                                    text: " = " + st.report_data.cut_chars.cut_u[i] + " мм,",
                                }),
                            ],
                            style: "Norm1"
                        }),
                        new Paragraph({            //
                            children: [
                                new TextRun({
                                    text: "Координаты центра u'",
                                }),
                                new TextRun({
                                    text: (i+1),
                                    subScript: true
                                }),
                                new TextRun({
                                    text: " [Х, Y] = [" + st.report_data.cut_chars.cut_midX[i] + ", " + st.report_data.cut_chars.cut_midY[i] + "],",
                                }),
                            ],
                            style: "Norm1"
                        }),
                        new Paragraph({            //
                            children: ibx_phrase(i),
                            style: "Norm1"
                        }),
                        new Paragraph({            //
                            children: iby_phrase(i),
                            style: "Norm1"
                        }),
                        new Paragraph({            //
                            children: sx_phrase(i),
                            style: "Norm1"
                        }),
                        new Paragraph({            //
                            children: sy_phrase(i),
                            style: "Norm1"
                        })
                    ];
                    result = result.concat(part);
                }
                return result;
            }

            function ibx_phrase(i) {
                var db = st.report_data.cut_chars;
                var result = [
                    new TextRun({
                        text: "I'",
                    }),
                    new TextRun({
                        text: "bx" + (i+1),
                        subScript: true
                    }),
                    new TextRun({
                        text: " = ",
                    })
                ];

                var part1 = [];
                if (db.dir[i] === "horiz") {
                    part1 = [
                        new TextRun({
                            text: db.cut_u[i],
                        }),
                        sup_3,
                        new TextRun({
                            text: "/12 + " + db.cut_u[i] + " * " + db.cut_midX[i],
                        }),
                        sup_2,
                        new TextRun({
                            text: " = " + db.cut_ibx[i] + " мм",
                        }),
                        sup_3,
                        new TextRun({
                            text: ",",
                        }),
                    ];
                }

                if (db.dir[i] === "vert") {
                    part1 = [
                        new TextRun({
                            text: db.cut_u[i] + " * " + db.cut_midX[i],
                        }),
                        sup_2,
                        new TextRun({
                            text: " = " + db.cut_ibx[i] + " мм",
                        }),
                        sup_3,
                        new TextRun({
                            text: ",",
                        }),
                    ];                    
                }

                result = result.concat(part1);

                return result;
            }

            function iby_phrase(i) {
                var db = st.report_data.cut_chars;
                var result = [
                    new TextRun({
                        text: "I'",
                    }),
                    new TextRun({
                        text: "by" + (i+1),
                        subScript: true
                    }),
                    new TextRun({
                        text: " = ",
                    })
                ];

                var part1 = [];
                if (db.dir[i] === "vert") {
                    part1 = [
                        new TextRun({
                            text: db.cut_u[i],
                        }),
                        sup_3,
                        new TextRun({
                            text: "/12 + " + db.cut_u[i] + " * " + db.cut_midY[i],
                        }),
                        sup_2,
                        new TextRun({
                            text: " = " + db.cut_iby[i] + " мм",
                        }),
                        sup_3,
                        new TextRun({
                            text: ",",
                        }),
                    ];
                }

                if (db.dir[i] === "horiz") {
                    part1 = [
                        new TextRun({
                            text: db.cut_u[i] + " * " + db.cut_midY[i],
                        }),
                        sup_2,
                        new TextRun({
                            text: " = " + db.cut_iby[i] + " мм",
                        }),
                        sup_3,
                        new TextRun({
                            text: ",",
                        }),
                    ];                    
                }

                result = result.concat(part1);

                return result;
            }

            function sx_phrase(i) {
                var db = st.report_data.cut_chars;
                var result = [
                    new TextRun({
                        text: "S'",
                    }),
                    new TextRun({
                        text: "x" + (i+1),
                        subScript: true
                    }),
                    new TextRun({
                        text: " = " + db.cut_u[i] + " * " + db.cut_midX[i] + " = " + db.cut_sx[i] + " мм",
                    }),
                    sup_2,
                    new TextRun({
                        text: ",",
                    })
                ];
                return result;
            }

            function sy_phrase(i) {
                var db = st.report_data.cut_chars;
                var result = [
                    new TextRun({
                        text: "S'",
                    }),
                    new TextRun({
                        text: "y" + (i+1),
                        subScript: true
                    }),
                    new TextRun({
                        text: " = " + db.cut_u[i] + " * " + db.cut_midY[i] + " = " + db.cut_sy[i] + " мм",
                    }),
                    sup_2,
                    new TextRun({
                        text: ",",
                    })
                ];
                return result;
            }

            function ibx_tot_phrase() {
                var result;
                if (st.report_data.cut_chars.cut_u.length > 0) {
                    result = [
                        new TextRun({
                            text: "I'",
                        }),
                        new TextRun({
                            text: "bx",
                            subScript: true
                        }),
                        new TextRun({
                            text: " = ",
                        })
                    ];
                    var part1 = [];
                    var part2 = [];
                    for (var i = 0; i < st.report_data.cut_chars.cut_u.length; i++) {
                        if (i === 0) {
                            part1 = [
                                new TextRun({
                                    text: "I'",
                                }),
                                new TextRun({
                                    text: "bx" + (i+1),
                                    subScript: true
                                })
                            ];
                        } else {
                            part1 = [
                                new TextRun({
                                    text: " + ",
                                }),
                                new TextRun({
                                    text: "I'",
                                }),
                                new TextRun({
                                    text: "bx" + (i+1),
                                    subScript: true
                                }),                        
                            ];
                        }                    
                        result = result.concat(part1);
                    }
                    for (var i = 0; i < st.report_data.cut_chars.cut_u.length; i++) {
                        if (i === 0) {
                            part2 = [
                                new TextRun({
                                    text: " = ",
                                }),
                                new TextRun({
                                    text: st.report_data.cut_chars.cut_ibx[i],
                                }),                            
                            ];
                        } else {
                            part2 = [
                                new TextRun({
                                    text: " + ",
                                }),
                                new TextRun({
                                    text: st.report_data.cut_chars.cut_ibx[i],
                                }),                            
                            ];
                        }                    
                        result = result.concat(part2);
                    }
                    var part3 = [
                        new TextRun({
                            text: " = " + st.report_data.cut_off_ibx + " мм",
                        }),
                        sup_3,
                        new TextRun({
                            text: ",",
                        }),
                    ];
                    result = result.concat(part3);
                } else {
                    result = [
                        new TextRun({
                            text: "I'",
                        }),
                        new TextRun({
                            text: "bx",
                            subScript: true
                        }),
                        new TextRun({
                            text: " = 0 мм",
                        }),
                        sup_3,
                        new TextRun({
                            text: ",",
                        }),
                    ];
                }
                return result;
            }

            function iby_tot_phrase() {
                var result;
                if (st.report_data.cut_chars.cut_u.length > 0) {
                    result = [
                        new TextRun({
                            text: "I'",
                        }),
                        new TextRun({
                            text: "by",
                            subScript: true
                        }),
                        new TextRun({
                            text: " = ",
                        })
                    ];
                    var part1 = [];
                    var part2 = [];
                    for (var i = 0; i < st.report_data.cut_chars.cut_u.length; i++) {
                        if (i === 0) {
                            part1 = [
                                new TextRun({
                                    text: "I'",
                                }),
                                new TextRun({
                                    text: "by" + (i+1),
                                    subScript: true
                                })
                            ];
                        } else {
                            part1 = [
                                new TextRun({
                                    text: " + ",
                                }),
                                new TextRun({
                                    text: "I'",
                                }),
                                new TextRun({
                                    text: "by" + (i+1),
                                    subScript: true
                                }),                        
                            ];
                        }                    
                        result = result.concat(part1);
                    }
                    for (var i = 0; i < st.report_data.cut_chars.cut_u.length; i++) {
                        if (i === 0) {
                            part2 = [
                                new TextRun({
                                    text: " = ",
                                }),
                                new TextRun({
                                    text: st.report_data.cut_chars.cut_iby[i],
                                }),                            
                            ];
                        } else {
                            part2 = [
                                new TextRun({
                                    text: " + ",
                                }),
                                new TextRun({
                                    text: st.report_data.cut_chars.cut_iby[i],
                                }),                            
                            ];
                        }                    
                        result = result.concat(part2);
                    }
                    var part3 = [
                        new TextRun({
                            text: " = " + st.report_data.cut_off_iby + " мм",
                        }),
                        sup_3,
                        new TextRun({
                            text: ",",
                        }),
                    ];
                    result = result.concat(part3);
                } else {
                    result = [
                        new TextRun({
                            text: "I'",
                        }),
                        new TextRun({
                            text: "by",
                            subScript: true
                        }),
                        new TextRun({
                            text: " = 0 мм",
                        }),
                        sup_3,
                        new TextRun({
                            text: ",",
                        }),
                    ];
                }
                return result;
            }

            function sx_tot_phrase() {
                var result;
                if (st.report_data.cut_chars.cut_u.length > 0) {
                    result = [
                        new TextRun({
                            text: "S'",
                        }),
                        new TextRun({
                            text: "x",
                            subScript: true
                        }),
                        new TextRun({
                            text: " = ",
                        })
                    ];
                    var part1 = [];
                    var part2 = [];
                    for (var i = 0; i < st.report_data.cut_chars.cut_u.length; i++) {
                        if (i === 0) {
                            part1 = [
                                new TextRun({
                                    text: "S'",
                                }),
                                new TextRun({
                                    text: "x" + (i+1),
                                    subScript: true
                                })
                            ];
                        } else {
                            part1 = [
                                new TextRun({
                                    text: " + ",
                                }),
                                new TextRun({
                                    text: "S'",
                                }),
                                new TextRun({
                                    text: "x" + (i+1),
                                    subScript: true
                                }),                        
                            ];
                        }                    
                        result = result.concat(part1);
                    }
                    for (var i = 0; i < st.report_data.cut_chars.cut_u.length; i++) {
                        if (i === 0) {
                            part2 = [
                                new TextRun({
                                    text: " = ",
                                }),
                                new TextRun({
                                    text: st.report_data.cut_chars.cut_sx[i],
                                }),                            
                            ];
                        } else {
                            part2 = [
                                new TextRun({
                                    text: " + ",
                                }),
                                new TextRun({
                                    text: st.report_data.cut_chars.cut_sx[i],
                                }),                            
                            ];
                        }                    
                        result = result.concat(part2);
                    }
                    var part3 = [
                        new TextRun({
                            text: " = " + st.report_data.cut_off_sx + " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ];
                    result = result.concat(part3);
                } else {
                    result = [
                        new TextRun({
                            text: "S'",
                        }),
                        new TextRun({
                            text: "x",
                            subScript: true
                        }),
                        new TextRun({
                            text: " = 0 мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ];
                }
                return result;
            }

            function sy_tot_phrase() {
                var result;
                if (st.report_data.cut_chars.cut_u.length > 0) {
                    result = [
                        new TextRun({
                            text: "S'",
                        }),
                        new TextRun({
                            text: "y",
                            subScript: true
                        }),
                        new TextRun({
                            text: " = ",
                        })
                    ];
                    var part1 = [];
                    var part2 = [];
                    for (var i = 0; i < st.report_data.cut_chars.cut_u.length; i++) {
                        if (i === 0) {
                            part1 = [
                                new TextRun({
                                    text: "S'",
                                }),
                                new TextRun({
                                    text: "y" + (i+1),
                                    subScript: true
                                })
                            ];
                        } else {
                            part1 = [
                                new TextRun({
                                    text: " + ",
                                }),
                                new TextRun({
                                    text: "S'",
                                }),
                                new TextRun({
                                    text: "y" + (i+1),
                                    subScript: true
                                }),                        
                            ];
                        }                    
                        result = result.concat(part1);
                    }
                    for (var i = 0; i < st.report_data.cut_chars.cut_u.length; i++) {
                        if (i === 0) {
                            part2 = [
                                new TextRun({
                                    text: " = ",
                                }),
                                new TextRun({
                                    text: st.report_data.cut_chars.cut_sy[i],
                                }),                            
                            ];
                        } else {
                            part2 = [
                                new TextRun({
                                    text: " + ",
                                }),
                                new TextRun({
                                    text: st.report_data.cut_chars.cut_sy[i],
                                }),                            
                            ];
                        }                    
                        result = result.concat(part2);
                    }
                    var part3 = [
                        new TextRun({
                            text: " = " + st.report_data.cut_off_sy + " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ];
                    result = result.concat(part3);
                } else {
                    result = [
                        new TextRun({
                            text: "S'",
                        }),
                        new TextRun({
                            text: "y",
                            subScript: true
                        }),
                        new TextRun({
                            text: " = 0 мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ];
                }
                return result;
            }            
            return result;
        }  // конец report_5

        const report_6a = function () {                                                           //пояснение про Lux и Luy
            var result = [];
            if ((st.mx_load !== 0) || (st.mx_load !== 0) || st.openingIsNear) {
                result = [
                    new Paragraph({                                                        // L<sub>ux</sub>, L<sub>uy</sub>  - длина сторон прямоугольника u вдоль оси Х и Y.</p>" + 
                        children: [
                            lux_letter,
                            new TextRun({
                                text: ", ",
                            }),
                            luy_letter,
                            new TextRun({
                                text: " - длина сторон прямоугольника u вдоль оси Х и Y. ",
                            }),
                        ],
                        style: "Norm1"
                    }),
                ];
            }
            return result;
        }

        const report_6b = function () {                                                           //если колонна на краю плиты
            var result = [];
            var xa, ya, sx, sy, xc, yc;
            if (st.slab_edge_type === "l" || st.slab_edge_type === "r") {   // sx и ха разные, все остальное одинаковое
                if (st.slab_edge_type === "l") {
                    xa = new Paragraph({                  //  result.xa = st.a_column_size/2 + st.edge_left_dist;
                        children: [
                            xa_letter,
                            new TextRun({
                                text: " = " + st.a_column_size + "/2 + " + st.edge_left_dist + " = " + st.report_data.xa + " мм,",
                            }),
                        ],
                        style: "Norm1"
                    });
                    sx = new Paragraph({                      // result.sx = 2*lx*((lx/2) - result.xa) + ly*(st.a_column_size + h0)/2;
                        children: [
                            sx_letter,
                            new TextRun({
                                text: " = 2 * ",
                            }),
                            lux_letter,
                            new TextRun({
                                text: " * (",
                            }),
                            lux_letter,
                            new TextRun({
                                text: "/2 - ",
                            }),
                            xa_letter,
                            new TextRun({
                                text: ") + ",
                            }),
                            luy_letter,
                            new TextRun({
                                text: " * (a + ",
                            }),
                            h0_letter,
                            new TextRun({
                                text: ")/2 = 2 * " + st.report_data.lx + " * (" + st.report_data.lx + "/2 - " + st.report_data.xa + ") + " + st.report_data.ly + " * (" + st.a_column_size + " + " + st.report_data.h0 + ")/2 = " + st.report_data.sx + " мм",
                            }),
                            sup_2,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    });
                }
                if (st.slab_edge_type === "r") {
                    xa = new Paragraph({                  //  result.xa = st.a_column_size/2 + st.edge_right_dist;
                        children: [
                            xa_letter,
                            new TextRun({
                                text: " = " + st.a_column_size + "/2 + " + st.edge_right_dist + " = " + st.report_data.xa + " мм,",
                            }),
                        ],
                        style: "Norm1"
                    });
                    sx = new Paragraph({                      // result.sx = 2*lx*(result.xa - (lx/2)) - ly*(st.a_column_size + h0)/2;
                        children: [
                            sx_letter,
                            new TextRun({
                                text: " = 2 * ",
                            }),
                            lux_letter,
                            new TextRun({
                                text: " * (",
                            }),
                            xa_letter,
                            new TextRun({
                                text: " - ",
                            }),
                            lux_letter,                         
                            new TextRun({
                                text: "/2) - ",
                            }),
                            luy_letter,
                            new TextRun({
                                text: " * (a + ",
                            }),
                            h0_letter,
                            new TextRun({
                                text: ")/2 = 2 * " + st.report_data.lx + " * (" + st.report_data.xa + " - " + st.report_data.lx + "/2) - " + st.report_data.ly + " * (" + st.a_column_size + " + " + st.report_data.h0 + ")/2 = " + st.report_data.sx + " мм",
                            }),
                            sup_2,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    });
                }        
                xc = new Paragraph({                                          //result.xc = result.sx/result.u;
                        children: [
                            xc_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            sx_letter,
                            new TextRun({
                                text: "/u = " + st.report_data.sx + "/" + st.report_data.u + " = " + st.report_data.xc + " мм," ,
                            }),
                        ],
                        style: "Norm1"
                    });
                yc = new Paragraph({                                          //yc = 0
                        children: [
                            yc_letter,
                            new TextRun({
                                text: " = 0 мм,",
                            }),
                        ],
                        style: "Norm1"
                    });
                result = result.concat(xa, sx, xc, yc);
            }
            if (st.slab_edge_type === "t" || st.slab_edge_type === "b") {   // sy и ya разные, все остальное одинаковое
                if (st.slab_edge_type === "t") {
                    ya = new Paragraph({                  //  result.ya = st.b_column_size/2 + st.edge_top_dist;
                        children: [
                            ya_letter,
                            new TextRun({
                                text: " = " + st.b_column_size + "/2 + " + st.edge_top_dist + " = " + st.report_data.ya + " мм,",
                            }),
                        ],
                        style: "Norm1"
                    });
                    sy = new Paragraph({                      // result.sy = 2*ly*(result.ya - (ly/2)) - lx*(st.b_column_size + h0)/2;
                        children: [
                            sy_letter,
                            new TextRun({
                                text: " = 2 * ",
                            }),
                            luy_letter,
                            new TextRun({
                                text: " * (",
                            }),
                            ya_letter,
                            new TextRun({
                                text: " - ",
                            }),
                            luy_letter,                         
                            new TextRun({
                                text: "/2) - ",
                            }),
                            lux_letter,
                            new TextRun({
                                text: " * (b + ",
                            }),
                            h0_letter,
                            new TextRun({
                                text: ")/2 = 2 * " + st.report_data.ly + " * (" + st.report_data.ya + " - " + st.report_data.ly + "/2) - " + st.report_data.lx + " * (" + st.b_column_size + " + " + st.report_data.h0 + ")/2 = " + st.report_data.sy + " мм",
                            }),
                            sup_2,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    });
                }
                if (st.slab_edge_type === "b") {
                    ya = new Paragraph({                  //    result.ya = st.b_column_size/2 + st.edge_bottom_dist;
                        children: [
                            ya_letter,
                            new TextRun({
                                text: " = " + st.b_column_size + "/2 + " + st.edge_bottom_dist + " = " + st.report_data.ya + " мм,",
                            }),
                        ],
                        style: "Norm1"
                    });
                    sy = new Paragraph({                      //    result.sy = 2*ly*((ly/2) - result.ya) + lx*(st.b_column_size + h0)/2;
                        children: [
                            sy_letter,
                            new TextRun({
                                text: " = 2 * ",
                            }),
                            luy_letter,
                            new TextRun({
                                text: " * (",
                            }),
                            luy_letter,
                            new TextRun({
                                text: "/2 - ",
                            }),
                            ya_letter,
                            new TextRun({
                                text: ") + ",
                            }),
                            lux_letter,
                            new TextRun({
                                text: " * (b + ",
                            }),
                            h0_letter,
                            new TextRun({
                                text: ")/2 = 2 * " + st.report_data.ly + " * (" + st.report_data.ly + "/2 - " + st.report_data.ya + ") + " + st.report_data.lx + " * (" + st.b_column_size + " + " + st.report_data.h0 + ")/2 = " + st.report_data.sy + " мм",
                            }),
                            sup_2,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    });
                }
                yc = new Paragraph({                                          //result.yc = result.sy/result.u;
                    children: [
                        yc_letter,
                        new TextRun({
                            text: " = ",
                        }),
                        sy_letter,
                        new TextRun({
                            text: "/u = " + st.report_data.sy + "/" + st.report_data.u + " = " + st.report_data.yc + " мм," ,
                        }),
                    ],
                    style: "Norm1"
                });
                xc = new Paragraph({                                          //xc = 0
                    children: [
                        xc_letter,
                        new TextRun({
                            text: " = 0 мм,",
                        }),
                    ],
                    style: "Norm1"
                });
                result = result.concat(ya, sy, yc, xc);
            }

            if (st.slab_edge_type === "lt" || st.slab_edge_type === "rt" || st.slab_edge_type === "rb" || st.slab_edge_type === "lb") {
                if (st.slab_edge_type === "lt") {
                    xa = new Paragraph({                  //  result.xa = st.a_column_size/2 + st.edge_left_dist;
                        children: [
                            xa_letter,
                            new TextRun({
                                text: " = " + st.a_column_size + "/2 + " + st.edge_left_dist + " = " + st.report_data.xa + " мм,",
                            }),
                        ],
                        style: "Norm1"
                    });
                    ya = new Paragraph({                  //  result.ya = st.b_column_size/2 + st.edge_top_dist;
                        children: [
                            ya_letter,
                            new TextRun({
                                text: " = " + st.b_column_size + "/2 + " + st.edge_top_dist + " = " + st.report_data.ya + " мм,",
                            }),
                        ],
                        style: "Norm1"
                    });
                    sx = new Paragraph({                  // result.sx = lx*((lx/2) - result.xa) + ly*(st.a_column_size + h0)/2;
                        children: [
                            sx_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            lux_letter,
                            new TextRun({
                                text: " * (",
                            }),
                            lux_letter,
                            new TextRun({
                                text: "/2 - ",
                            }),
                            xa_letter,
                            new TextRun({
                                text: ") + ",
                            }),
                            luy_letter,
                            new TextRun({
                                text: " * (a + ",
                            }),
                            h0_letter,
                            new TextRun({
                                text: ")/2 = " + st.report_data.lx + " * (" + st.report_data.lx + "/2 - " + st.report_data.xa + ") + " + st.report_data.ly + " * (" + st.a_column_size + " + " + st.report_data.h0 + ")/2 = " + st.report_data.sx + " мм",
                            }),
                            sup_2,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    });
                    sy = new Paragraph({                 // result.sy = ly*(result.ya - (ly/2)) - lx*(st.b_column_size + h0)/2;
                        children: [
                            sy_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            luy_letter,
                            new TextRun({
                                text: " * (",
                            }),
                            ya_letter,
                            new TextRun({
                                text: " - ",
                            }),
                            luy_letter,                         
                            new TextRun({
                                text: "/2) - ",
                            }),
                            lux_letter,
                            new TextRun({
                                text: " * (b + ",
                            }),
                            h0_letter,
                            new TextRun({
                                text: ")/2 = " + st.report_data.ly + " * (" + st.report_data.ya + " - " + st.report_data.ly + "/2) - " + st.report_data.lx + " * (" + st.b_column_size + " + " + st.report_data.h0 + ")/2 = " + st.report_data.sy + " мм",
                            }),
                            sup_2,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    });                  
                }

                if (st.slab_edge_type === "rt") {
                    xa = new Paragraph({                  //  result.xa = st.a_column_size/2 + st.edge_right_dist;
                        children: [
                            xa_letter,
                            new TextRun({
                                text: " = " + st.a_column_size + "/2 + " + st.edge_right_dist + " = " + st.report_data.xa + " мм,",
                            }),
                        ],
                        style: "Norm1"
                    });
                    ya = new Paragraph({                  //  result.ya = st.b_column_size/2 + st.edge_top_dist;
                        children: [
                            ya_letter,
                            new TextRun({
                                text: " = " + st.b_column_size + "/2 + " + st.edge_top_dist + " = " + st.report_data.ya + " мм,",
                            }),
                        ],
                        style: "Norm1"
                    });
                    sx = new Paragraph({                  // result.sx = lx*(result.xa - (lx/2)) - ly*(st.a_column_size + h0)/2;
                        children: [
                            sx_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            lux_letter,
                            new TextRun({
                                text: " * (",
                            }),
                            xa_letter,
                            new TextRun({
                                text: " - ",
                            }),
                            lux_letter,                         
                            new TextRun({
                                text: "/2) - ",
                            }),
                            luy_letter,
                            new TextRun({
                                text: " * (a + ",
                            }),
                            h0_letter,
                            new TextRun({
                                text: ")/2 = " + st.report_data.lx + " * (" + st.report_data.xa + " - " + st.report_data.lx + "/2) - " + st.report_data.ly + " * (" + st.a_column_size + " + " + st.report_data.h0 + ")/2 = " + st.report_data.sx + " мм",
                            }),
                            sup_2,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    });
                    sy = new Paragraph({                 // result.sy = ly*(result.ya - (ly/2)) - lx*(st.b_column_size + h0)/2;
                        children: [
                            sy_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            luy_letter,
                            new TextRun({
                                text: " * (",
                            }),
                            ya_letter,
                            new TextRun({
                                text: " - ",
                            }),
                            luy_letter,                         
                            new TextRun({
                                text: "/2) - ",
                            }),
                            lux_letter,
                            new TextRun({
                                text: " * (b + ",
                            }),
                            h0_letter,
                            new TextRun({
                                text: ")/2 = " + st.report_data.ly + " * (" + st.report_data.ya + " - " + st.report_data.ly + "/2) - " + st.report_data.lx + " * (" + st.b_column_size + " + " + st.report_data.h0 + ")/2 = " + st.report_data.sy + " мм",
                            }),
                            sup_2,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    });
                }

                if (st.slab_edge_type === "rb") {
                    xa = new Paragraph({                  //  result.xa = st.a_column_size/2 + st.edge_right_dist;
                        children: [
                            xa_letter,
                            new TextRun({
                                text: " = " + st.a_column_size + "/2 + " + st.edge_right_dist + " = " + st.report_data.xa + " мм,",
                            }),
                        ],
                        style: "Norm1"
                    });
                    ya = new Paragraph({                  //  result.ya = st.b_column_size/2 + st.edge_bottom_dist;
                        children: [
                            ya_letter,
                            new TextRun({
                                text: " = " + st.b_column_size + "/2 + " + st.edge_bottom_dist + " = " + st.report_data.ya + " мм,",
                            }),
                        ],
                        style: "Norm1"
                    });
                    sx = new Paragraph({                  // result.sx = lx*(result.xa - (lx/2)) - ly*(st.a_column_size + h0)/2;
                        children: [
                            sx_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            lux_letter,
                            new TextRun({
                                text: " * (",
                            }),
                            xa_letter,
                            new TextRun({
                                text: " - ",
                            }),
                            lux_letter,                         
                            new TextRun({
                                text: "/2) - ",
                            }),
                            luy_letter,
                            new TextRun({
                                text: " * (a + ",
                            }),
                            h0_letter,
                            new TextRun({
                                text: ")/2 = " + st.report_data.lx + " * (" + st.report_data.xa + " - " + st.report_data.lx + "/2) - " + st.report_data.ly + " * (" + st.a_column_size + " + " + st.report_data.h0 + ")/2 = " + st.report_data.sx + " мм",
                            }),
                            sup_2,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    });
                    sy = new Paragraph({                  // result.sy = ly*((ly/2) - result.ya) + lx*(st.b_column_size + h0)/2;
                        children: [
                            sy_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            luy_letter,
                            new TextRun({
                                text: " * (",
                            }),
                            luy_letter,
                            new TextRun({
                                text: "/2 - ",
                            }),
                            ya_letter,
                            new TextRun({
                                text: ") + ",
                            }),
                            lux_letter,
                            new TextRun({
                                text: " * (b + ",
                            }),
                            h0_letter,
                            new TextRun({
                                text: ")/2 = " + st.report_data.ly + " * (" + st.report_data.ly + "/2 - " + st.report_data.ya + ") + " + st.report_data.lx + " * (" + st.b_column_size + " + " + st.report_data.h0 + ")/2 = " + st.report_data.sy + " мм",
                            }),
                            sup_2,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    });
                }

                if (st.slab_edge_type === "lb") {
                    xa = new Paragraph({                  //  result.xa = st.a_column_size/2 + st.edge_left_dist;
                        children: [
                            xa_letter,
                            new TextRun({
                                text: " = " + st.a_column_size + "/2 + " + st.edge_left_dist + " = " + st.report_data.xa + " мм,",
                            }),
                        ],
                        style: "Norm1"
                    });
                    ya = new Paragraph({                  //  result.ya = st.b_column_size/2 + st.edge_bottom_dist;
                        children: [
                            ya_letter,
                            new TextRun({
                                text: " = " + st.b_column_size + "/2 + " + st.edge_bottom_dist + " = " + st.report_data.ya + " мм,",
                            }),
                        ],
                        style: "Norm1"
                    });
                    sx = new Paragraph({                  // result.sx = lx*((lx/2) - result.xa) + ly*(st.a_column_size + h0)/2;
                        children: [
                            sx_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            lux_letter,
                            new TextRun({
                                text: " * (",
                            }),
                            lux_letter,
                            new TextRun({
                                text: "/2 - ",
                            }),
                            xa_letter,
                            new TextRun({
                                text: ") + ",
                            }),
                            luy_letter,
                            new TextRun({
                                text: " * (a + ",
                            }),
                            h0_letter,
                            new TextRun({
                                text: ")/2 = " + st.report_data.lx + " * (" + st.report_data.lx + "/2 - " + st.report_data.xa + ") + " + st.report_data.ly + " * (" + st.a_column_size + " + " + st.report_data.h0 + ")/2 = " + st.report_data.sx + " мм",
                            }),
                            sup_2,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    });
                    sy = new Paragraph({                  // result.sy = ly*((ly/2) - result.ya) + lx*(st.b_column_size + h0)/2;
                        children: [
                            sy_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            luy_letter,
                            new TextRun({
                                text: " * (",
                            }),
                            luy_letter,
                            new TextRun({
                                text: "/2 - ",
                            }),
                            ya_letter,
                            new TextRun({
                                text: ") + ",
                            }),
                            lux_letter,
                            new TextRun({
                                text: " * (b + ",
                            }),
                            h0_letter,
                            new TextRun({
                                text: ")/2 = " + st.report_data.ly + " * (" + st.report_data.ly + "/2 - " + st.report_data.ya + ") + " + st.report_data.lx + " * (" + st.b_column_size + " + " + st.report_data.h0 + ")/2 = " + st.report_data.sy + " мм",
                            }),
                            sup_2,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    });
                }

                xc = new Paragraph({                  //result.xc = result.sx/result.u;
                    children: [
                        xc_letter,
                        new TextRun({
                            text: " = ",
                        }),
                        sx_letter,
                        new TextRun({
                            text: "/u = " + st.report_data.sx + "/" + st.report_data.u + " = " + st.report_data.xc + " мм," ,
                        }),
                    ],
                    style: "Norm1"
                });
                yc = new Paragraph({                  //result.yc = result.sy/result.u;
                    children: [
                        yc_letter,
                        new TextRun({
                            text: " = ",
                        }),
                        sy_letter,
                        new TextRun({
                            text: "/u = " + st.report_data.sy + "/" + st.report_data.u + " = " + st.report_data.yc + " мм," ,
                        }),
                    ],
                    style: "Norm1"
                });
                result = result.concat(xa, ya, sx, sy, xc, yc); 
            }
            return result;
        }

        const report_6 = function () {                                               //часть про Mbx и Ibx и Wbx
            var result = [];
            var ibx_cut = [];                       //вырубкa ib'x-ux'c
            var ibx, xmax_t, xmax, wbx, xmax_p1;
            //мы считаем Mbx и все остальное если у нас явно заданы моменты или моменты появляются от смещения центра тяжести сечения (рядом край плиты или отверстие)
            if (st.report_data.mx_1 || st.mx_load || st.openingIsNear) {
                if (st.openingIsNear) {     //для начала посчитаем вырубку ib'x-ux'c
                    //часть с буквами
                    ibx_cut[0] = new TextRun({
                                text: " - I'",
                    });
                    ibx_cut[1] = new TextRun({
                        text: "bx",
                        subScript: true
                    });
                    ibx_cut[2] = new TextRun({
                        text: " - u * x'",
                    });
                    ibx_cut[3] = new TextRun({
                        text: "c",
                        subScript: true
                    });
                    ibx_cut[4] = sup_2;

                    //часть с цифрами
                    if (st.report_data.cut_xc >= 0) {           //если отрицательное, то берем в скобки
                        ibx_cut[5] = new TextRun({
                            text: " - " + st.report_data.cut_off_ibx + " - " + st.report_data.u + " * " + st.report_data.cut_xc,
                        });
                    } else {
                        ibx_cut[5] = new TextRun({
                            text: " - " + st.report_data.cut_off_ibx + " - " + st.report_data.u + " * (" + st.report_data.cut_xc + ")",
                        });
                    }
                    ibx_cut[6] = sup_2;
                }              
                if (st.slab_edge_type === "") {             //если колонна не на краю плиты
                    ibx = new Paragraph({                        // I<sub>bx</sub> = L<sub>ux</sub><sup>3</sup>/6 + L<sub>uy</sub> * L<sub>ux</sub><sup>2</sup>/2 = " + st.report_data.size_u_top + "<sup>3</sup>/6 + " + st.report_data.size_u_left + " * " + st.report_data.size_u_top + "<sup>2</sup>/2 = " + st.report_data.ibx + " мм<sup>3</sup>, </p>"
                        children: [
                            ibx_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            lux_letter,
                            sup_3,
                            new TextRun({
                                text: "/6 + ",
                            }),
                            luy_letter,
                            new TextRun({
                                text: " * ",
                            }),
                            lux_letter,
                            sup_2,
                            new TextRun({
                                text: "/2",
                            }),
                            ibx_cut[0],
                            ibx_cut[1],
                            ibx_cut[2],
                            ibx_cut[3],
                            ibx_cut[4],
                            new TextRun({
                                text: " = " + st.report_data.size_u_top,
                            }),
                            sup_3,
                            new TextRun({
                                text: "/6 + " + st.report_data.size_u_left + " * " + st.report_data.size_u_top,
                            }),
                            sup_2,
                            new TextRun({
                                text: "/2",
                            }),
                            ibx_cut[5],
                            ibx_cut[6],
                            new TextRun({
                                text: " = " + st.report_data.ibx + " мм",
                            }),
                            sup_3,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    });
                    if (st.openingIsNear) {                 //если рядом отверстие, то нужно будет высчитать эксцентриситет
                        xmax_t = new Paragraph({          //Наиболее удаленная точка
                            children: [
                                new TextRun({
                                    text: "Наиболее удаленная точка вдоль оси X, ",
                                }),
                                xmax_letter,
                                new TextRun({
                                    text: ":",
                                })
                            ],
                            style: "Norm1"
                        });
                        xmax = new Paragraph({            //result.xmax_op = lx/2 + Math.abs(cut_xc);
                            children: [
                                xmax_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: "/2 + |x'",
                                }),
                                new TextRun({
                                    text: "c",
                                    subScript: true
                                }),
                                new TextRun({
                                    text: "| = " + st.report_data.lx + "/2 + |" + st.report_data.cut_xc + "| = " + st.report_data.xmax + " мм,",
                                }),
                            ],
                            style: "Norm1"
                        });
                        wbx = new Paragraph({           // result.wbx = result.ibx / result.xmax;
                            children: [
                                wbx_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                ibx_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                xmax_letter,
                                new TextRun({
                                    text: " = " + st.report_data.ibx + "/" + st.report_data.xmax + " = " + st.report_data.wbx + " мм",
                                }),
                                sup_2,
                                new TextRun({
                                    text: ",",
                                })
                            ],
                            style: "Norm1"
                        });
                    } else {                            //если нет, то только wbx
                        wbx = new Paragraph({                        // <p>W<sub>bx</sub> = I<sub>bx</sub>/(L<sub>ux</sub>/2) = " + st.report_data.ibx + "/(" + st.report_data.size_u_top + "/2) = " + st.report_data.wbx + " мм<sup>2</sup>, </p>" +
                            children: [
                                wbx_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                ibx_letter,
                                new TextRun({
                                    text: "/(",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: "/2) = " + st.report_data.ibx + "/(" + st.report_data.size_u_top + "/2) = " + st.report_data.wbx + " мм",
                                }),
                                sup_2,
                                new TextRun({
                                    text: ",",
                                })
                            ],
                            style: "Norm1"
                        });
                    }
                    result = [ibx, xmax_t, xmax, wbx];
                }
                if (st.slab_edge_type === "l" || st.slab_edge_type === "r" || st.slab_edge_type === "lt" || st.slab_edge_type === "rt" || st.slab_edge_type === "rb" || st.slab_edge_type === "lb") {            //если край плиты слева или справа или угловые
                    if (st.slab_edge_type === "l" ) {
                        ibx = new Paragraph({        //  result.ibx = Math.pow(lx, 3)/6 + 2 * lx * Math.pow((result.xa + result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa - result.xc), 2);
                            children: [
                                ibx_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                lux_letter,
                                sup_3,
                                new TextRun({
                                    text: "/6 + 2 * ",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: " * (",
                                }),
                                xa_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                xc_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: "/2)",
                                }),
                                sup_2,
                                new TextRun({
                                    text: " + ",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: " * (",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                xa_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                xc_letter,
                                new TextRun({
                                    text: ")",
                                }),
                                sup_2,
                                ibx_cut[0],
                                ibx_cut[1],
                                ibx_cut[2],
                                ibx_cut[3],
                                ibx_cut[4],
                                new TextRun({
                                    text: " = " + st.report_data.lx,
                                }),
                                sup_3,
                                new TextRun({
                                    text: "/6 + 2 * " + st.report_data.lx + " * (" + st.report_data.xa + " + " + st.report_data.xc + " - " + st.report_data.lx + "/2)",
                                }),
                                sup_2,
                                new TextRun({
                                    text: " + " + st.report_data.ly + " * (" + st.report_data.lx + " - " + st.report_data.xa + " - " + st.report_data.xc + ")",
                                }),
                                sup_2,
                                ibx_cut[5],
                                ibx_cut[6],
                                new TextRun({
                                    text: " = " + st.report_data.ibx + " мм",
                                }),
                                sup_3
                            ],
                            style: "Norm1"
                        });
                    }
                    if (st.slab_edge_type === "r" ) {
                        ibx = new Paragraph({        //  result.ibx = Math.pow(lx, 3)/6 + 2 * lx * Math.pow((result.xa - result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa + result.xc), 2);
                            children: [
                                ibx_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                lux_letter,
                                sup_3,
                                new TextRun({
                                    text: "/6 + 2 * ",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: " * (",
                                }),
                                xa_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                xc_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: "/2)",
                                }),
                                sup_2,
                                new TextRun({
                                    text: " + ",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: " * (",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                xa_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                xc_letter,
                                new TextRun({
                                    text: ")",
                                }),
                                sup_2,
                                ibx_cut[0],
                                ibx_cut[1],
                                ibx_cut[2],
                                ibx_cut[3],
                                ibx_cut[4],
                                new TextRun({
                                    text: " = " + st.report_data.lx,
                                }),
                                sup_3,
                                new TextRun({
                                    text: "/6 + 2 * " + st.report_data.lx + " * (" + st.report_data.xa + " - (" + st.report_data.xc + ") - " + st.report_data.lx + "/2)",
                                }),
                                sup_2,
                                new TextRun({
                                    text: " + " + st.report_data.ly + " * (" + st.report_data.lx + " - " + st.report_data.xa + " + (" + st.report_data.xc + "))",
                                }),
                                sup_2,
                                ibx_cut[5],
                                ibx_cut[6],
                                new TextRun({
                                    text: " = " + st.report_data.ibx + " мм",
                                }),
                                sup_3
                            ],
                            style: "Norm1"
                        });
                    }
                    if (st.slab_edge_type === "lt" || st.slab_edge_type === "lb") {
                        ibx = new Paragraph({        //result.ibx = Math.pow(lx, 3)/12 + lx * Math.pow((result.xa + result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa - result.xc), 2);
                            children: [
                                ibx_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                lux_letter,
                                sup_3,
                                new TextRun({
                                    text: "/12 + ",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: " * (",
                                }),
                                xa_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                xc_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: "/2)",
                                }),
                                sup_2,
                                new TextRun({
                                    text: " + ",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: " * (",
                                }),
                                lux_letter,                     //result.ibx = Math.pow(lx, 3)/12 + lx * Math.pow((result.xa + result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa - result.xc), 2);
                                new TextRun({
                                    text: " - ",
                                }),
                                xa_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                xc_letter,
                                new TextRun({
                                    text: ")",
                                }),
                                sup_2,
                                ibx_cut[0],
                                ibx_cut[1],
                                ibx_cut[2],
                                ibx_cut[3],
                                ibx_cut[4],
                                new TextRun({
                                    text: " = " + st.report_data.lx,
                                }),
                                sup_3,
                                new TextRun({
                                    text: "/12 + " + st.report_data.lx + " * (" + st.report_data.xa + " + " + st.report_data.xc + " - " + st.report_data.lx + "/2)",
                                }),
                                sup_2,
                                new TextRun({
                                    text: " + " + st.report_data.ly + " * (" + st.report_data.lx + " - " + st.report_data.xa + " - " + st.report_data.xc + ")",
                                }),
                                sup_2,
                                ibx_cut[5],
                                ibx_cut[6],
                                new TextRun({
                                    text: " = " + st.report_data.ibx + " мм",
                                }),
                                sup_3
                            ],
                            style: "Norm1"
                        });
                    }
                    if (st.slab_edge_type === "rt" || st.slab_edge_type === "rb") {
                        ibx = new Paragraph({        //result.ibx = Math.pow(lx, 3)/12 + lx * Math.pow((result.xa - result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa + result.xc), 2);
                            children: [
                                ibx_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                lux_letter,
                                sup_3,
                                new TextRun({
                                    text: "/12 + ",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: " * (",
                                }),
                                xa_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                xc_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: "/2)",
                                }),
                                sup_2,
                                new TextRun({
                                    text: " + ",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: " * (",
                                }),
                                lux_letter,                     //result.ibx = Math.pow(lx, 3)/12 + lx * Math.pow((result.xa - result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa + result.xc), 2);
                                new TextRun({
                                    text: " - ",
                                }),
                                xa_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                xc_letter,
                                new TextRun({
                                    text: ")",
                                }),
                                sup_2,
                                ibx_cut[0],
                                ibx_cut[1],
                                ibx_cut[2],
                                ibx_cut[3],
                                ibx_cut[4],
                                new TextRun({
                                    text: " = " + st.report_data.lx,
                                }),
                                sup_3,
                                new TextRun({
                                    text: "/12 + " + st.report_data.lx + " * (" + st.report_data.xa + " - (" + st.report_data.xc + ") - " + st.report_data.lx + "/2)",
                                }),
                                sup_2,
                                new TextRun({
                                    text: " + " + st.report_data.ly + " * (" + st.report_data.lx + " - " + st.report_data.xa + " + (" + st.report_data.xc + "))",
                                }),
                                sup_2,
                                ibx_cut[5],
                                ibx_cut[6],
                                new TextRun({
                                    text: " = " + st.report_data.ibx + " мм",
                                }),
                                sup_3
                            ],
                            style: "Norm1"
                        });
                    }
                    xmax_t = new Paragraph({          //Наиболее удаленная точка
                            children: [
                                new TextRun({
                                    text: "Наиболее удаленная точка вдоль оси X, ",
                                }),
                                xmax_letter,
                                new TextRun({
                                    text: ":",
                                })
                            ],
                            style: "Norm1"
                    });
                    if (st.openingIsNear) {                     //если есть отверстие, то его нужно учесть в максимальном расстоянии
                        if (st.report_data.cut_xc >= 0) {
                            xmax_p1 = " = " + st.report_data.xa + " + |" + st.report_data.xc + "| + " + st.report_data.cut_xc + " = " + st.report_data.xmax + " мм,";
                        } else {
                            xmax_p1 = " = " + st.report_data.xa + " + |" + st.report_data.xc + "| + (" + st.report_data.cut_xc + ") = " + st.report_data.xmax + " мм,";
                        }
                        xmax = new Paragraph({            //result.xmax = result.xa + result.xc + cut_xc;    result.ymax = result.ymax + cut_yc;
                            children: [
                                xmax_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                xa_letter,
                                new TextRun({
                                    text: " + |",
                                }),
                                xc_letter,
                                new TextRun({
                                    text: " | + ",
                                }),
                                new TextRun({
                                    text: "x'",
                                }),
                                new TextRun({
                                    text: "c",
                                    subScript: true
                                }),
                                new TextRun({
                                    text: xmax_p1,
                                }),
                            ],
                            style: "Norm1"
                        });
                    } else {
                        xmax = new Paragraph({            //result.xmax = result.xa + result.xc;
                            children: [
                                xmax_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                xa_letter,
                                new TextRun({
                                    text: " + |",
                                }),
                                xc_letter,
                                new TextRun({
                                    text: "| = " + st.report_data.xa + " + |" + st.report_data.xc + "| = " + st.report_data.xmax + " мм,",
                                }),
                            ],
                            style: "Norm1"
                        });
                    }
                    wbx = new Paragraph({           // result.wbx = result.ibx / result.xmax;
                            children: [
                                wbx_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                ibx_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                xmax_letter,
                                new TextRun({
                                    text: " = " + st.report_data.ibx + "/" + st.report_data.xmax + " = " + st.report_data.wbx + " мм",
                                }),
                                sup_2,
                                new TextRun({
                                    text: ",",
                                })
                            ],
                            style: "Norm1"
                        });
                    result = result.concat(ibx, xmax_t, xmax, wbx);
                }
                if (st.slab_edge_type === "t" || st.slab_edge_type === "b") {             //если край плиты сверху или снизу
                    ibx = new Paragraph({                        //  result.ibx = Math.pow(lx, 3)/12 + ly * Math.pow(lx, 2)/2;
                        children: [
                            ibx_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            lux_letter,
                            sup_3,
                            new TextRun({
                                text: "/12 + ",
                            }),
                            luy_letter,
                            new TextRun({
                                text: " * ",
                            }),
                            lux_letter,
                            sup_2,
                            new TextRun({
                                text: "/2",
                            }),
                            ibx_cut[0],
                            ibx_cut[1],
                            ibx_cut[2],
                            ibx_cut[3],
                            ibx_cut[4],
                            new TextRun({
                                text: " = " + st.report_data.lx,
                            }),
                            sup_3,
                            new TextRun({
                                text: "/12 + " + st.report_data.ly + " * " + st.report_data.lx,
                            }),
                            sup_2,
                            new TextRun({
                                text: "/2",
                            }),
                            ibx_cut[5],
                            ibx_cut[6],
                            new TextRun({
                                text: " = " + st.report_data.ibx + " мм",
                            }),
                            sup_3,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    });
                    if (st.openingIsNear) {
                        xmax_t = new Paragraph({          //Наиболее удаленная точка
                            children: [
                                new TextRun({
                                    text: "Наиболее удаленная точка вдоль оси X, ",
                                }),
                                xmax_letter,
                                new TextRun({
                                    text: ":",
                                })
                            ],
                            style: "Norm1"
                        });
                        xmax = new Paragraph({            //result.xmax_op = lx/2 + Math.abs(cut_xc);
                            children: [
                                xmax_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: "/2 + |x'",
                                }),
                                new TextRun({
                                    text: "c",
                                    subScript: true
                                }),
                                new TextRun({
                                    text: "| = " + st.report_data.lx + "/2 + |" + st.report_data.cut_xc + "| = " + st.report_data.xmax + " мм,",
                                }),
                            ],
                            style: "Norm1"
                        });
                        wbx = new Paragraph({           // result.wbx = result.ibx / result.xmax;
                            children: [
                                wbx_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                ibx_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                xmax_letter,
                                new TextRun({
                                    text: " = " + st.report_data.ibx + "/" + st.report_data.xmax + " = " + st.report_data.wbx + " мм",
                                }),
                                sup_2,
                                new TextRun({
                                    text: ",",
                                })
                            ],
                            style: "Norm1"
                        });
                    } else {
                        wbx = new Paragraph({                        // result.wbx = result.ibx/(lx/2);
                            children: [
                                wbx_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                ibx_letter,
                                new TextRun({
                                    text: "/(",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: "/2) = " + st.report_data.ibx + "/(" + st.report_data.lx + "/2) = " + st.report_data.wbx + " мм",
                                }),
                                sup_2,
                                new TextRun({
                                    text: ",",
                                })
                            ],
                            style: "Norm1"
                        });
                    }
                    result = result.concat(ibx, xmax_t, xmax, wbx);
                }
                var mbxult = new Paragraph({                       //"<p>M<sub>bx,ult</sub> = R<sub>bt</sub> * W<sub>bx</sub> * h<sub>0</sub> = " + st.report_data.rbt + " * " + st.report_data.wbx + " * " + st.report_data.h0 + " = " + st.report_data.mbx_ult + " кН*мм</p>" +
                    children: [
                        mbxult_letter,
                        new TextRun({
                            text: " = ",
                        }),
                        rbt_letter,
                        new TextRun({
                            text: " * ",
                        }),
                        wbx_letter,
                        new TextRun({
                            text: " * ",
                        }),
                        h0_letter,
                        new TextRun({
                            text: " = " + st.report_data.rbt + " * " + st.report_data.wbx + " * " + st.report_data.h0 + " = " + st.report_data.mbx_ult + " кН*мм,",
                        }),
                    ],
                    style: "Norm1"
                });
                result.push(mbxult);
            }
            return result;
        }

        const report_7 = function () {                                               //часть про Mby и Iby и Wby
            var result = [];
            var iby_cut = [];                       //вырубкa ib'y-uy'c
            var iby, ymax_t, ymax, wby, ymax_p1;
            //мы считаем Mby и все остальное если у нас явно заданы моменты или моменты появляются от смещения центра тяжести сечения (рядом край плиты или отверстие)
            if (st.report_data.my_1 || st.my_load || st.openingIsNear) {
                if (st.openingIsNear) {     //для начала посчитаем вырубку ib'y-uy'c
                    //часть с буквами
                    iby_cut[0] = new TextRun({
                                text: " - I'",
                            });
                    iby_cut[1] = new TextRun({
                        text: "by",
                        subScript: true
                    });
                    iby_cut[2] = new TextRun({
                        text: " - u * y'",
                    });
                    iby_cut[3] = new TextRun({
                        text: "c",
                        subScript: true
                    });
                    iby_cut[4] = sup_2;

                    //часть с цифрами
                    if (st.report_data.cut_yc >= 0) {           //если отрицательное, то берем в скобки
                        iby_cut[5] = new TextRun({
                            text: " - " + st.report_data.cut_off_iby + " - " + st.report_data.u + " * " + st.report_data.cut_yc,
                        });
                    } else {
                        iby_cut[5] = new TextRun({
                            text: " - " + st.report_data.cut_off_iby + " - " + st.report_data.u + " * (" + st.report_data.cut_yc + ")",
                        });
                    }
                    iby_cut[6] = sup_2;
                }  
                if (st.slab_edge_type === "") {             //если колонна не на краю плиты
                    iby = new Paragraph({                        // <p>I<sub>by</sub> = L<sub>uy</sub><sup>3</sup>/6 + L<sub>ux</sub> * L<sub>uy</sub><sup>2</sup>/2 = " + st.report_data.size_u_left + "<sup>3</sup>/6 + " + st.report_data.size_u_top + " * " + st.report_data.size_u_left + "<sup>2</sup>/2 = " + st.report_data.iby + " мм<sup>3</sup>, </p>"
                        children: [
                            iby_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            luy_letter,
                            sup_3,
                            new TextRun({
                                text: "/6 + ",
                            }),
                            lux_letter,
                            new TextRun({
                                text: " * ",
                            }),
                            luy_letter,
                            sup_2,
                            new TextRun({
                                text: "/2",
                            }),
                            iby_cut[0],
                            iby_cut[1],
                            iby_cut[2],
                            iby_cut[3],
                            iby_cut[4],
                            new TextRun({
                                text: " = " + st.report_data.size_u_left,
                            }),
                            sup_3,
                            new TextRun({
                                text: "/6 + " + st.report_data.size_u_top + " * " + st.report_data.size_u_left,
                            }),
                            sup_2,
                            new TextRun({
                                text: "/2",
                            }),
                            iby_cut[5],
                            iby_cut[6],
                            new TextRun({
                                text: " = " + st.report_data.iby + " мм",
                            }),
                            sup_3,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    });
                    if (st.openingIsNear) {         //если рядом отверстие, то нужно будет высчитать эксцентриситет
                        ymax_t = new Paragraph({          //Наиболее удаленная точка
                            children: [
                                new TextRun({
                                    text: "Наиболее удаленная точка вдоль оси Y, ",
                                }),
                                ymax_letter,
                                new TextRun({
                                    text: ":",
                                })
                            ],
                            style: "Norm1"
                        });
                        ymax = new Paragraph({            //result.ymax_op = ly/2 + Math.abs(cut_yc);
                            children: [
                                ymax_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: "/2 + |y'",
                                }),
                                new TextRun({
                                    text: "c",
                                    subScript: true
                                }),
                                new TextRun({
                                    text: "| = " + st.report_data.ly + "/2 + |" + st.report_data.cut_yc + "| = " + st.report_data.ymax + " мм,",
                                }),
                            ],
                            style: "Norm1"
                        });
                        wby = new Paragraph({           //result.wby = result.iby / result.ymax;
                            children: [
                                wby_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                iby_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                ymax_letter,
                                new TextRun({
                                    text: " = " + st.report_data.iby + "/" + st.report_data.ymax + " = " + st.report_data.wby + " мм",
                                }),
                                sup_2,
                                new TextRun({
                                    text: ",",
                                })
                            ],
                            style: "Norm1"
                        });
                    } else {                        //если нет, то только wby
                        wby = new Paragraph({                        // <p>W<sub>by</sub> = I<sub>by</sub>/(L<sub>uy</sub>/2) = " + st.report_data.iby + "/(" + st.report_data.size_u_left + "/2) = " + st.report_data.wby + " мм<sup>2</sup>, </p>" +
                            children: [
                                wby_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                iby_letter,
                                new TextRun({
                                    text: "/(",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: "/2) = " + st.report_data.iby + "/(" + st.report_data.size_u_left + "/2) = " + st.report_data.wby + " мм",
                                }),
                                sup_2,
                                new TextRun({
                                    text: ",",
                                })
                            ],
                            style: "Norm1"
                        });
                    }
                    result = [iby, ymax_t, ymax, wby];
                }
                if (st.slab_edge_type === "l" || st.slab_edge_type === "r") {             //если край плиты слева или справа
                    iby = new Paragraph({                        // result.iby = Math.pow(ly, 3)/12 + lx * Math.pow(ly, 2)/2;
                        children: [
                            iby_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            luy_letter,
                            sup_3,
                            new TextRun({
                                text: "/12 + ",
                            }),
                            lux_letter,
                            new TextRun({
                                text: " * ",
                            }),
                            luy_letter,
                            sup_2,
                            new TextRun({
                                text: "/2",
                            }),
                            iby_cut[0],
                            iby_cut[1],
                            iby_cut[2],
                            iby_cut[3],
                            iby_cut[4],
                            new TextRun({
                                text: " = " + st.report_data.ly,
                            }),
                            sup_3,
                            new TextRun({
                                text: "/12 + " + st.report_data.lx + " * " + st.report_data.ly,
                            }),
                            sup_2,
                            new TextRun({
                                text: "/2",
                            }),
                            iby_cut[5],
                            iby_cut[6],
                            new TextRun({
                                text: " = " + st.report_data.iby + " мм",
                            }),
                            sup_3,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    });
                    if (st.openingIsNear) {
                        ymax_t = new Paragraph({          //Наиболее удаленная точка
                            children: [
                                new TextRun({
                                    text: "Наиболее удаленная точка вдоль оси Y, ",
                                }),
                                ymax_letter,
                                new TextRun({
                                    text: ":",
                                })
                            ],
                            style: "Norm1"
                        });
                        ymax = new Paragraph({            //result.ymax_op = ly/2 + Math.abs(cut_yc);
                            children: [
                                ymax_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: "/2 + |y'",
                                }),
                                new TextRun({
                                    text: "c",
                                    subScript: true
                                }),
                                new TextRun({
                                    text: "| = " + st.report_data.ly + "/2 + |" + st.report_data.cut_yc + "| = " + st.report_data.ymax + " мм,",
                                }),
                            ],
                            style: "Norm1"
                        });
                        wby = new Paragraph({           //result.wby = result.iby / result.ymax;
                            children: [
                                wby_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                iby_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                ymax_letter,
                                new TextRun({
                                    text: " = " + st.report_data.iby + "/" + st.report_data.ymax + " = " + st.report_data.wby + " мм",
                                }),
                                sup_2,
                                new TextRun({
                                    text: ",",
                                })
                            ],
                            style: "Norm1"
                        });
                    } else {
                        wby = new Paragraph({                        // result.wby = result.iby/(ly/2);
                            children: [
                                wby_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                iby_letter,
                                new TextRun({
                                    text: "/(",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: "/2) = " + st.report_data.iby + "/(" + st.report_data.ly + "/2) = " + st.report_data.wby + " мм",
                                }),
                                sup_2,
                                new TextRun({
                                    text: ",",
                                })
                            ],
                            style: "Norm1"
                        });
                    }
                    result = result.concat(iby, ymax_t, ymax, wby);
                }
                if (st.slab_edge_type === "t" || st.slab_edge_type === "b" || st.slab_edge_type === "lt" || st.slab_edge_type === "rt" || st.slab_edge_type === "rb" || st.slab_edge_type === "lb") {            //если край плиты сверху или снизу или угловые
                    if (st.slab_edge_type === "t" ) {
                        iby = new Paragraph({        // result.iby = Math.pow(ly, 3)/6 + 2 * ly * Math.pow((result.ya - result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya + result.yc), 2);
                            children: [
                                iby_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                luy_letter,
                                sup_3,
                                new TextRun({
                                    text: "/6 + 2 * ",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: " * (",
                                }),
                                ya_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                yc_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: "/2)",
                                }),
                                sup_2,
                                new TextRun({
                                    text: " + ",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: " * (",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                ya_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                yc_letter,
                                new TextRun({           // result.iby = Math.pow(ly, 3)/6 + 2 * ly * Math.pow((result.ya - result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya + result.yc), 2);
                                    text: ")",
                                }),
                                sup_2,
                                iby_cut[0],
                                iby_cut[1],
                                iby_cut[2],
                                iby_cut[3],
                                iby_cut[4],
                                new TextRun({
                                    text: " = " + st.report_data.ly,
                                }),
                                sup_3,
                                new TextRun({
                                    text: "/6 + 2 * " + st.report_data.ly + " * (" + st.report_data.ya + " - " + st.report_data.yc + " - " + st.report_data.ly + "/2)",
                                }),
                                sup_2,
                                new TextRun({
                                    text: " + " + st.report_data.lx + " * (" + st.report_data.ly + " - " + st.report_data.ya + " + " + st.report_data.yc + ")",
                                }),
                                sup_2,
                                iby_cut[5],
                                iby_cut[6],
                                new TextRun({
                                    text: " = " + st.report_data.iby + " мм",
                                }),
                                sup_3
                            ],
                            style: "Norm1"
                        });
                    }
                    if (st.slab_edge_type === "b" ) {
                        iby = new Paragraph({        // result.iby = Math.pow(ly, 3)/6 + 2 * ly * Math.pow((result.ya + result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya - result.yc), 2);
                            children: [
                                iby_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                luy_letter,
                                sup_3,
                                new TextRun({
                                    text: "/6 + 2 * ",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: " * (",
                                }),
                                ya_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                yc_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: "/2)",
                                }),
                                sup_2,
                                new TextRun({
                                    text: " + ",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: " * (",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                ya_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                yc_letter,
                                new TextRun({       // result.iby = Math.pow(ly, 3)/6 + 2 * ly * Math.pow((result.ya + result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya - result.yc), 2);
                                    text: ")",
                                }),
                                sup_2,
                                iby_cut[0],
                                iby_cut[1],
                                iby_cut[2],
                                iby_cut[3],
                                iby_cut[4],
                                new TextRun({
                                    text: " = " + st.report_data.ly,
                                }),
                                sup_3,
                                new TextRun({
                                    text: "/6 + 2 * " + st.report_data.ly + " * (" + st.report_data.ya + " + (" + st.report_data.yc + ") - " + st.report_data.ly + "/2)",
                                }),
                                sup_2,
                                new TextRun({
                                    text: " + " + st.report_data.lx + " * (" + st.report_data.ly + " - " + st.report_data.ya + " - (" + st.report_data.yc + "))",
                                }),
                                sup_2,
                                iby_cut[5],
                                iby_cut[6],                                
                                new TextRun({
                                    text: " = " + st.report_data.iby + " мм",
                                }),
                                sup_3
                            ],
                            style: "Norm1"
                        });
                    }
                    if (st.slab_edge_type === "lt" || st.slab_edge_type === "rt") {
                        iby = new Paragraph({        // result.iby = Math.pow(ly, 3)/12 + ly * Math.pow((result.ya - result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya + result.yc), 2);
                            children: [
                                iby_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                luy_letter,
                                sup_3,
                                new TextRun({
                                    text: "/12 + ",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: " * (",
                                }),
                                ya_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                yc_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: "/2)",
                                }),
                                sup_2,
                                new TextRun({
                                    text: " + ",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: " * (",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                ya_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                yc_letter,
                                new TextRun({           // result.iby = Math.pow(ly, 3)/12 + ly * Math.pow((result.ya - result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya + result.yc), 2);
                                    text: ")",
                                }),
                                sup_2,
                                iby_cut[0],
                                iby_cut[1],
                                iby_cut[2],
                                iby_cut[3],
                                iby_cut[4],
                                new TextRun({
                                    text: " = " + st.report_data.ly,
                                }),
                                sup_3,
                                new TextRun({
                                    text: "/12 + " + st.report_data.ly + " * (" + st.report_data.ya + " - (" + st.report_data.yc + ") - " + st.report_data.ly + "/2)",
                                }),
                                sup_2,
                                new TextRun({
                                    text: " + " + st.report_data.lx + " * (" + st.report_data.ly + " - " + st.report_data.ya + " + (" + st.report_data.yc + "))",
                                }),
                                sup_2,
                                iby_cut[5],
                                iby_cut[6],
                                new TextRun({
                                    text: " = " + st.report_data.iby + " мм",
                                }),
                                sup_3
                            ],
                            style: "Norm1"
                        });
                    }
                    if (st.slab_edge_type === "lb" || st.slab_edge_type === "rb") {
                        iby = new Paragraph({        // result.iby = Math.pow(ly, 3)/12 + ly * Math.pow((result.ya + result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya - result.yc), 2);
                            children: [
                                iby_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                luy_letter,
                                sup_3,
                                new TextRun({
                                    text: "/12 + ",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: " * (",
                                }),
                                ya_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                yc_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: "/2)",
                                }),
                                sup_2,
                                new TextRun({
                                    text: " + ",
                                }),
                                lux_letter,
                                new TextRun({
                                    text: " * (",
                                }),
                                luy_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                ya_letter,
                                new TextRun({
                                    text: " - ",
                                }),
                                yc_letter,
                                new TextRun({           // result.iby = Math.pow(ly, 3)/12 + ly * Math.pow((result.ya + result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya - result.yc), 2);
                                    text: ")",
                                }),
                                sup_2,
                                iby_cut[0],
                                iby_cut[1],
                                iby_cut[2],
                                iby_cut[3],
                                iby_cut[4],
                                new TextRun({
                                    text: " = " + st.report_data.ly,
                                }),
                                sup_3,
                                new TextRun({
                                    text: "/12 + " + st.report_data.ly + " * (" + st.report_data.ya + " + " + st.report_data.yc + " - " + st.report_data.ly + "/2)",
                                }),
                                sup_2,
                                new TextRun({
                                    text: " + " + st.report_data.lx + " * (" + st.report_data.ly + " - " + st.report_data.ya + " - " + st.report_data.yc + ")",
                                }),
                                sup_2,
                                iby_cut[5],
                                iby_cut[6],
                                new TextRun({
                                    text: " = " + st.report_data.iby + " мм",
                                }),
                                sup_3
                            ],
                            style: "Norm1"
                        });
                    }
                    ymax_t = new Paragraph({          //Наиболее удаленная точка
                            children: [
                                new TextRun({
                                    text: "Наиболее удаленная точка вдоль оси Y, ",
                                }),
                                ymax_letter,
                                new TextRun({
                                    text: ":",
                                })
                            ],
                            style: "Norm1"
                        });
                    if (st.openingIsNear) {                     //если есть отверстие, то его нужно учесть в максимальном расстоянии
                        if (st.report_data.cut_yc >= 0) {
                            ymax_p1 = " = " + st.report_data.ya + " + |" + st.report_data.yc + "| + " + st.report_data.cut_yc + " = " + st.report_data.ymax + " мм,";
                        } else {
                            ymax_p1 = " = " + st.report_data.ya + " + |" + st.report_data.yc + "| + (" + st.report_data.cut_yc + ") = " + st.report_data.ymax + " мм,";
                        }
                        ymax = new Paragraph({            //result.ymax = result.ya + result.yc + cut_yc;    result.ymax = result.ymax + cut_yc;
                            children: [
                                ymax_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                ya_letter,
                                new TextRun({
                                    text: " + |",
                                }),
                                yc_letter,
                                new TextRun({
                                    text: " | + ",
                                }),
                                new TextRun({
                                    text: "y'",
                                }),
                                new TextRun({
                                    text: "c",
                                    subScript: true
                                }),
                                new TextRun({
                                    text: ymax_p1,
                                }),
                            ],
                            style: "Norm1"
                        });
                    } else {
                        ymax = new Paragraph({            //result.ymax = result.ya + result.yc;
                            children: [
                                ymax_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                ya_letter,
                                new TextRun({
                                    text: " + |",
                                }),
                                yc_letter,
                                new TextRun({
                                    text: "| = " + st.report_data.ya + " + |" + st.report_data.yc + "| = " + st.report_data.ymax + " мм,",
                                }),
                            ],
                            style: "Norm1"
                        });
                    }
                    wby = new Paragraph({           //result.wby = result.iby / result.ymax;
                            children: [
                                wby_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                iby_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                ymax_letter,
                                new TextRun({
                                    text: " = " + st.report_data.iby + "/" + st.report_data.ymax + " = " + st.report_data.wby + " мм",
                                }),
                                sup_2,
                                new TextRun({
                                    text: ",",
                                })
                            ],
                            style: "Norm1"
                        });
                    result = result.concat(iby, ymax_t, ymax, wby);
                }
                var mbyult = new Paragraph({                       // M<sub>by,ult</sub> = R<sub>bt</sub> * W<sub>by</sub> * h<sub>0</sub> = " + st.report_data.rbt + " * " + st.report_data.wby + " * " + st.report_data.h0 + " = " + st.report_data.mby_ult + " кН*мм</p>
                            children: [
                                mbyult_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                rbt_letter,
                                new TextRun({
                                    text: " * ",
                                }),
                                wby_letter,
                                new TextRun({
                                    text: " * ",
                                }),
                                h0_letter,
                                new TextRun({
                                    text: " = " + st.report_data.rbt + " * " + st.report_data.wby + " * " + st.report_data.h0 + " = " + st.report_data.mby_ult + " кН*мм,",
                                }),
                            ],
                            style: "Norm1"
                });
                result.push(mbyult);
            }
            return result;
        }

        const report_8 = function () {                                               //часть про Fsw,ult
            var result = [];
            if (st.shear_reinforcement) {
                result = [
                    new Paragraph({                                     // <p>Принимаем, что поперечная арматура расположена равномерно вдоль контура продавливания. В расчете учитывается только арматура попадающая в зазор 0.5h<sub>0</sub> по обе стороны от u. </p>" +
                        children: [
                            new TextRun({
                                text: "Принимаем, что поперечная арматура расположена равномерно вдоль контура продавливания. В расчете учитывается только арматура попадающая в зазор 0.5",
                            }),
                            h0_letter,
                            new TextRun({
                                text: " по обе стороны от u.",
                            }),
                        ],
                        style: "Norm1"
                    }),
                    new Paragraph({                                     //"<p>Количество стержней учитываемых в расчете, n = " + st.aswCircles.length + " шт.</p>" +
                        children: [
                            new TextRun({
                                text: "Количество стержней учитываемых в расчете, n = " + st.aswCircles.length + " шт.",
                            }),
                        ],
                        style: "Norm1"
                    }),
                    new Paragraph({                                   //"<p>Полная площадь учитываемой поперечной арматуры, A<sub>sw_tot</sub>:" +
                        children: [
                            new TextRun({
                                text: "Полная площадь учитываемой поперечной арматуры, ",
                            }),
                            asw_tot_letter,
                            new TextRun({
                                text: ":",
                            }),
                        ],
                        style: "Norm1"
                    }),
                    new Paragraph({                                   //<p>A<sub>sw_tot</sub> = n * πr<sup>2</sup> = " + st.aswCircles.length + " * 3.142 * " + (st.shear_bars_diameter/2) + "<sup>2</sup> = " + st.asw_tot + " мм<sup>2</sup>,</p>" +
                        children: [
                            asw_tot_letter,
                            new TextRun({
                                text: " = n * πr",
                            }),
                            sup_2,
                            new TextRun({
                                text: " = " + st.aswCircles.length + " * 3.142 * " + (st.shear_bars_diameter/2),
                            }),
                            sup_2,
                            new TextRun({
                                text: " = " + st.asw_tot + " мм",
                            }),
                            sup_2,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    }),
                    new Paragraph({                                  // A<sub>sw</sub>/sw = A<sub>sw_tot</sub>/u = " + st.asw_tot + "/" + st.report_data.u + " = " + st.report_data.asw_sw + ",</p>" +
                        children: [
                            asw_letter,
                            new TextRun({
                                text: "/sw = ",
                            }),
                            asw_tot_letter,
                            new TextRun({
                                text: "/u = " + st.asw_tot + "/" + st.report_data.u + " = " + st.report_data.asw_sw,
                            }),
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    }),
                    new Paragraph({                                  // q<sub>sw</sub> = R<sub>sw</sub> * A<sub>sw</sub>/sw = " + rsw + " * " + st.report_data.asw_sw + " = " + st.report_data.qsw + " кН/мм, </p>" +
                        children: [
                            qsw_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            rsw_letter,
                            new TextRun({
                                text: " * ",
                            }),
                            asw_letter,
                            new TextRun({
                                text: "/sw = " + rsw + " * " + st.report_data.asw_sw + " = " + st.report_data.qsw + " кН/мм,",
                            }),
                        ],
                        style: "Norm1"
                    }),
                    new Paragraph({                                  // <p>F<sub>sw,ult</sub> = 0.8 * q<sub>sw</sub> * u = 0.8 * " + st.report_data.qsw  + " * " + st.report_data.u + " = " +  st.report_data.fsw_ult_1 + " кН,</p>" + 
                        children: [
                            fswult_letter,
                            new TextRun({
                                text: " = 0.8 * ",
                            }),
                            qsw_letter,
                            new TextRun({
                                text: " * u = 0.8 * " + st.report_data.qsw  + " * " + st.report_data.u + " = " +  st.report_data.fsw_ult_1 + " кН,",
                            }),
                        ],
                        style: "Norm1"
                    }),

                ];
            }
            return result;
        }

        const report_9 = function () {                                               //1 проверка Fsw,ult
            var result = [];
            if (st.shear_reinforcement) {
                var fb_ult_check = 0.25*st.report_data.fb_ult;              //0.25*Fbult
                fb_ult_check = Number(fb_ult_check.toFixed(3));
                if (st.report_data.fsw_ult_1 < fb_ult_check) {
                    result = [
                        new Paragraph({                        // Т.к. F<sub>sw,ult</sub> = " + st.report_data.fsw_ult_1 + " кН < 0.25 * F<sub>b,ult</sub> = " + (0.25*st.report_data.fb_ult) + " кН, поперечная арматура в расчете не учитывается. Принимаем F<sub>sw,ult</sub> = 0" + ",</p>
                            children: [
                                new TextRun({
                                    text: "Т. к. ",
                                }),
                                fswult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.fsw_ult_1 + " кН < 0.25 * ",
                                }),
                                fbult_letter,
                                new TextRun({
                                    text: " = " + fb_ult_check + " кН, поперечная арматура в расчете не учитывается. Принимаем ",
                                }),
                                fswult_letter,
                                new TextRun({
                                    text: " = 0.",
                                }),
                            ],
                            style: "Norm1"
                        }),
                    ];
                } else {
                    result = [
                        new Paragraph({                       // <p>Условие F<sub>sw,ult</sub> = " + st.report_data.fsw_ult_1 + " кН ≥ 0.25 * F<sub>b,ult</sub> = " + (0.25*st.report_data.fb_ult) + " кН выполняется. Поперечная арматура учитывается в расчете.
                            children: [
                                new TextRun({
                                    text: "Условие ",
                                }),
                                fswult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.fsw_ult_1 + " кН ≥ 0.25 * ",
                                }),
                                fbult_letter,
                                new TextRun({
                                    text: " = " + fb_ult_check + " кН выполняется. Поперечная арматура учитывается в расчете.",
                                }),
                            ],
                            style: "Norm1"
                        }),
                    ];
                }
            }
            return result;
        }

        const report_10 = function () {                                               //2 проверка Fsw,ult
            var result = [];
            if (st.shear_reinforcement) {
                if (st.report_data.fsw_ult_1 > st.report_data.fb_ult) {
                    result = [
                        new Paragraph({                                          // Т.к. F<sub>sw,ult</sub> = " + st.report_data.fsw_ult_1 + " кН > F<sub>b,ult</sub> = " + st.report_data.fb_ult + " кН, принимаем F<sub>sw,ult</sub> = F<sub>b,ult</sub> = " + st.report_data.fb_ult + " кН,
                            children: [
                                new TextRun({
                                    text: "Т. к. ",
                                }),
                                fswult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.fsw_ult_1 + " кН > ",
                                }),
                                fbult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.fb_ult + " кН, принимаем ",
                                }),
                                fswult_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                fbult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.fb_ult + " кН,",
                                }),
                            ],
                            style: "Norm1"
                        }),                        
                    ];
                } else {
                    result = [
                        new Paragraph({                                          // Т.к. F<sub>sw,ult</sub> = " + st.report_data.fsw_ult_1 + " кН ≤ F<sub>b,ult</sub> = " + st.report_data.fb_ult + " кН, оставляем значение F<sub>sw,ult</sub> = " + st.report_data.fsw_ult_1 + "кН,
                            children: [
                                new TextRun({
                                    text: "Т. к. ",
                                }),
                                fswult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.fsw_ult_1 + " кН ≤ ",
                                }),
                                fbult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.fb_ult + " кН, оставляем значение ",
                                }),
                                fswult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.fsw_ult_1 + " кН,",
                                }),
                            ],
                            style: "Norm1"
                        }),
                    ];
                }
            }
            return result;
        }

        const report_11 = function () {                                               //часть про Fult
            var result = [];
            if (st.shear_reinforcement) {
                result = [
                    new Paragraph({                          // F<sub>ult</sub> = F<sub>b,ult</sub> + F<sub>sw,ult</sub> = " + st.report_data.fb_ult  + " кН + " + st.report_data.fsw_ult + " кН = " +  st.report_data.f_ult + " кН,</p>"
                        children: [
                            fult_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            fbult_letter,
                            new TextRun({
                                text: " + ",
                            }),
                            fswult_letter,
                            new TextRun({
                                text: " = " + st.report_data.fb_ult  + " кН + " + st.report_data.fsw_ult + " кН = " +  st.report_data.f_ult + " кН,",
                            }),
                        ],
                        style: "Norm1"
                    }),
                ];
            }
            return result;
        }

        const report_12 = function () {                                               //часть про Mswx,ult
            var result = [];
            // если у нас есть армирование и момент заданный либо прямо, либо появившийся в результате смещения центра тяжести
            if (st.shear_reinforcement && (st.report_data.mx_1 || st.mx_load || st.openingIsNear)) {
                result = [
                    new Paragraph({                                          //<p>W<sub>sw,x</sub> = W<sub>bx</sub> = " + st.report_data.wbx  + " мм<sup>2</sup>,</p>" + 
                        children: [
                            wswx_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            wbx_letter,
                            new TextRun({
                                text: " = " + st.report_data.wbx  + " мм",
                            }),
                            sup_2,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    }),
                    new Paragraph({                     //M<sub>sw,x,ult</sub> = 0.8 * q<sub>sw</sub> * W<sub>sw,x</sub> = 0.8 * " + st.report_data.qsw  + " * " + st.report_data.wbx + " = " + st.report_data.mswx_ult_1 + " кН*мм,</p>"
                        children: [
                            mswxult_letter,
                            new TextRun({
                                text: " = 0.8 * ",
                            }),
                            qsw_letter,
                            new TextRun({
                                text: " * ",
                            }),
                            wswx_letter,
                            new TextRun({
                                text: " = 0.8 * " + st.report_data.qsw  + " * " + st.report_data.wbx + " = " + st.report_data.mswx_ult_1 + " кН*мм,",
                            }),
                        ],
                        style: "Norm1"
                    }),
                ];
            }
            return result;
        }

        const report_13 = function () {                                               //проверка Mswx,ult
            var result = [];
            // если у нас есть армирование и момент заданный либо прямо, либо появившийся в результате смещения центра тяжести
            if (st.shear_reinforcement && (st.report_data.mx_1 || st.mx_load || st.openingIsNear)) {
                if (st.report_data.mswx_ult_1 > st.report_data.mbx_ult) {
                    result = [
                        new Paragraph({                               //Т.к. M<sub>sw,x,ult</sub> = " + st.report_data.mswx_ult_1 + " кН*мм > M<sub>bx,ult</sub> = " + st.report_data.mbx_ult + " кН*мм, принимаем M<sub>sw,x,ult</sub> = M<sub>bx,ult</sub>  = " + st.report_data.mbx_ult + " кН*мм
                            children: [
                                new TextRun({
                                    text: "Т. к. ",
                                }),
                                mswxult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.mswx_ult_1 + " кН*мм > ",
                                }),
                                mbxult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.mbx_ult + " кН*мм, принимаем ",
                                }),
                                mswxult_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                mbxult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.mbx_ult + " кН*мм,",
                                })
                            ],
                            style: "Norm1"
                        }),
                    ];
                } else {
                    result = [
                        new Paragraph({                               //Т.к. M<sub>sw,x,ult</sub> = " + st.report_data.mswx_ult_1 + " кН*мм ≤ M<sub>bx,ult</sub> = " + st.report_data.mbx_ult + " кН*мм, оставляем значение M<sub>sw,x,ult</sub> = " + st.report_data.mswx_ult_1 + " кН*мм,</p>
                            children: [
                                new TextRun({
                                    text: "Т. к. ",
                                }),
                                mswxult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.mswx_ult_1 + " кН*мм ≤ ",
                                }),
                                mbxult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.mbx_ult + " кН*мм, оставляем значение ",
                                }),
                                mswxult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.mswx_ult_1 + " кН*мм,",
                                }),
                            ],
                            style: "Norm1"
                        }),

                    ];
                }
            }
            return result;
        }

        /*
        new Paragraph({                                          //
            children: [
                new TextRun({
                    text: " ",
                }),
            ],
            style: "Norm1"
        }),

        */

        const report_14 = function () {                                               //часть про Mswy,ult
            var result = [];
            // если у нас есть армирование и момент заданный либо прямо, либо появившийся в результате смещения центра тяжести
            if (st.shear_reinforcement && (st.report_data.my_1 || st.my_load || st.openingIsNear)) {
                result = [
                    new Paragraph({                                          //"<p>W<sub>sw,y</sub> = W<sub>by</sub> = " + st.report_data.wby  + " мм<sup>2</sup>,</p>" + 
                        children: [
                            wswy_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            wby_letter,
                            new TextRun({
                                text: " = " + st.report_data.wby  + " мм",
                            }),
                            sup_2,
                            new TextRun({
                                text: ",",
                            }),
                        ],
                        style: "Norm1"
                    }),
                    new Paragraph({                  //M<sub>sw,y,ult</sub> = 0.8 * q<sub>sw</sub> * W<sub>sw,y</sub> = 0.8 * " + st.report_data.qsw  + " * " + st.report_data.wby + " = " + st.report_data.mswy_ult_1 + " кН*мм,</p>" + 
                        children: [
                            mswyult_letter,
                            new TextRun({
                                text: " = 0.8 * ",
                            }),
                            qsw_letter,
                            new TextRun({
                                text: " * ",
                            }),
                            wswy_letter,
                            new TextRun({
                                text: " = 0.8 * " + st.report_data.qsw  + " * " + st.report_data.wby + " = " + st.report_data.mswy_ult_1 + " кН*мм,",
                            }),
                        ],
                        style: "Norm1"
                    }),
                ];
            }
            return result;
        }

        const report_15 = function () {                                               //проверка Mswy,ult
            var result = [];
            // если у нас есть армирование и момент заданный либо прямо, либо появившийся в результате смещения центра тяжести
            if (st.shear_reinforcement && (st.report_data.my_1 || st.my_load || st.openingIsNear)) {
                if (st.report_data.mswy_ult_1 > st.report_data.mby_ult) {
                    result = [
                        new Paragraph({        //"<p>Т.к. M<sub>sw,y,ult</sub> = " + st.report_data.mswy_ult_1 + " кН*мм > M<sub>by,ult</sub> = " + st.report_data.mby_ult + " кН*мм, принимаем M<sub>sw,y,ult</sub> = M<sub>by,ult</sub>  = " + st.report_data.mby_ult + " кН*мм,</p>"
                            children: [
                                new TextRun({
                                    text: "Т. к. ",
                                }),
                                mswyult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.mswy_ult_1 + " кН*мм > ",
                                }),
                                mbyult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.mby_ult + " кН*мм, принимаем ",
                                }),
                                mswyult_letter,
                                new TextRun({
                                    text: " = ",
                                }),
                                mbyult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.mby_ult + " кН*мм,",
                                })
                            ],
                            style: "Norm1"
                        }),
                    ];
                } else {
                    result = [
                        new Paragraph({          //Т.к. M<sub>sw,y,ult</sub> = " + st.report_data.mswy_ult_1 + " кН*мм ≤ M<sub>by,ult</sub> = " + st.report_data.mby_ult + " кН*мм, оставляем значение M<sub>sw,y,ult</sub> = " + st.report_data.mswy_ult_1 + " кН*мм,</p>
                            children: [
                                new TextRun({
                                    text: "Т. к. ",
                                }),
                                mswyult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.mswy_ult_1 + " кН*мм ≤ ",
                                }),
                                mbyult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.mby_ult + " кН*мм, оставляем значение ",
                                }),
                                mswyult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.mswy_ult_1 + " кН*мм,",
                                }),
                            ],
                            style: "Norm1"
                        }),

                    ];
                }
            }
            return result;
        }

        var mx_ult = st.report_data.mbx_ult  + st.report_data.mswx_ult;
        mx_ult = Number(mx_ult.toFixed(3));

        const report_16 = function () {                                               //часть про Mx,ult
            var result = [];
            // если у нас есть армирование и момент заданный либо прямо, либо появившийся в результате смещения центра тяжести
            if (st.shear_reinforcement && (st.report_data.mx_1 || st.mx_load || st.openingIsNear)) {
                result = [
                    new Paragraph({                     //M<sub>x,ult</sub> = M<sub>bx,ult</sub> + M<sub>sw,x,ult</sub> = " + st.report_data.mbx_ult  + " кН*мм + " + st.report_data.mswx_ult + " кН*мм = " +  mx_ult + " кН*мм,</p>" +
                        children: [
                            mxult_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            mbxult_letter,
                            new TextRun({
                                text: " + ",
                            }),
                            mswxult_letter,
                            new TextRun({
                                text: " = " + st.report_data.mbx_ult  + " кН*мм + " + st.report_data.mswx_ult + " кН*мм = " +  mx_ult + " кН*мм,",
                            })
                        ],
                        style: "Norm1"
                    }),
                ];
            }
            return result;
        }

        var my_ult = st.report_data.mby_ult  + st.report_data.mswy_ult;
        my_ult = Number(my_ult.toFixed(3));

        const report_17 = function () {                                               //часть про My,ult
            var result = [];
            // если у нас есть армирование и момент заданный либо прямо, либо появившийся в результате смещения центра тяжести
            if (st.shear_reinforcement && (st.report_data.my_1 || st.my_load || st.openingIsNear)) {
                result = [
                    new Paragraph({                     //M<sub>y,ult</sub> = M<sub>by,ult</sub> + M<sub>sw,y,ult</sub> = " + st.report_data.mby_ult  + " кН*мм + " + st.report_data.mswy_ult + " кН*мм = " +  my_ult + " кН*мм,
                        children: [
                            myult_letter,
                            new TextRun({
                                text: " = ",
                            }),
                            mbyult_letter,
                            new TextRun({
                                text: " + ",
                            }),
                            mswyult_letter,
                            new TextRun({
                                text: " = " + st.report_data.mby_ult  + " кН*мм + " + st.report_data.mswy_ult + " кН*мм = " +  my_ult + " кН*мм,",
                            })
                        ],
                        style: "Norm1"
                    }),
                ];
            }
            return result;
        }

        var n_factor_check = 0.5*st.report_data.n_factor;                       //0.5*st.report_data.n_factor
        n_factor_check = Number(n_factor_check.toFixed(3));

        const report_18 = function () {                                               //вычисление м фактор и н фактор
            var result = [];
            var p1, p2, p3, p4, p5;
            if (!st.shear_reinforcement) {
                fult_letter = fbult_letter;
                mxult_letter = mbxult_letter;
                myult_letter = mbyult_letter;
            }
            if (st.report_data.m_factor_1 !== 0 || st.report_data.m_factor_2 !== 0) {
                if ((st.slab_edge_type === "") && !st.openingIsNear) {             //если колонна не на краю плиты и нет лишних эксценриситетов от отверстия
                    if (st.mx_load && st.my_load) {
                        p1 = new Paragraph({                 //"<p>Выражение Mx/M<sub>x,ult</sub> + My/M<sub>y,ult</sub> = " + st.mx_load*1000 + " кН*мм / " + mx_ult + " + " + st.my_load*1000 + " кН*мм / " + my_ult + " = " + st.report_data.m_factor_1 + ",</p>" +
                            children: [
                                new TextRun({
                                    text: "Выражение ",
                                }),
                                mx_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                mxult_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                my_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                myult_letter,
                                new TextRun({
                                    text: " = " + st.mx_load*1000 + " кН*мм / " + mx_ult + " + " + st.my_load*1000 + " кН*мм / " + my_ult + " = " + st.report_data.m_factor_1 + ",",
                                }),
                            ],
                            style: "Norm1"
                        });
                    }
                    if (st.mx_load && !st.my_load) {
                        p1 = new Paragraph({                 //"<p>Выражение Mx/M<sub>x,ult</sub> 
                            children: [
                                new TextRun({
                                    text: "Выражение ",
                                }),
                                mx_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                mxult_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                my_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                myult_letter,
                                new TextRun({
                                    text: " = " + st.mx_load*1000 + " кН*мм / " + mx_ult + " + 0 = " + st.report_data.m_factor_1 + ",",
                                }),
                            ],
                            style: "Norm1"
                        });
                    }
                    if (!st.mx_load && st.my_load) {
                        p1 = new Paragraph({                 //"My/M<sub>y,ult</sub>
                            children: [
                                new TextRun({
                                    text: "Выражение ",
                                }),
                                mx_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                mxult_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                my_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                myult_letter,
                                new TextRun({
                                    text: " = 0 + " + st.my_load*1000 + " кН*мм / " + my_ult + " = " + st.report_data.m_factor_1 + ",",
                                }),
                            ],
                            style: "Norm1"
                        });
                    }
                    p2 = new Paragraph({                 //Выражение F/(2*F<sub>ult</sub>) = " + st.n_load + " /(2 * " + st.report_data.f_ult  + ") = " + 0.5*st.report_data.n_factor + ",</p>" + 
                        children: [
                            new TextRun({
                                text: "Выражение F/(2*",
                            }),
                            fult_letter,
                            new TextRun({
                                text: ") = " + st.n_load + " / (2 * " + st.report_data.f_ult  + ") = " + n_factor_check + ",",
                            }),
                        ],
                        style: "Norm1"
                    });
                    result = [p1, p2];
                }
                if ((st.slab_edge_type === "") && st.openingIsNear) {             //если u просто прямоугольник и есть отверстия - докидываем моменты от расцентровки
                    p1 = new Paragraph({                       //"Учет эксцентриситета приложения продавливающего усилия:",
                            children: [
                                new TextRun({
                                    text: "Учет эксцентриситета приложения продавливающего усилия:",
                                })
                            ],
                            style: "Norm1"
                        });
                    p2 = new Paragraph({                       //mx_1 = Math.abs(st.mx_load*1000) + Math.abs(st.n_load*geom_chars.cut_xc);
                            children: [
                                mx_letter,
                                new TextRun({
                                    text: " = |",
                                }),
                                mx_letter,
                                new TextRun({
                                    text: "| + |F * ",
                                }),
                                new TextRun({
                                    text: "x'",
                                }),
                                new TextRun({
                                    text: "c",
                                    subScript: true
                                }),
                                new TextRun({
                                    text: "| = |" + st.mx_load*1000 + "| кН*мм + |" + st.n_load + "| кН * |" + st.report_data.cut_xc + "| мм = " + st.report_data.mx_1 + " кН*мм,",
                                }),
                            ],
                            style: "Norm1"
                        });
                    p3 = new Paragraph({                       //my_1 = Math.abs(st.my_load*1000) + Math.abs(st.n_load*geom_chars.yc);
                            children: [
                                my_letter,
                                new TextRun({
                                    text: " = |",
                                }),
                                my_letter,
                                new TextRun({
                                    text: "| + |F * ",
                                }),
                                new TextRun({
                                    text: "y'",
                                }),
                                new TextRun({
                                    text: "c",
                                    subScript: true
                                }),
                                new TextRun({
                                    text: "| = |" + st.my_load*1000 + "| кН*мм + |" + st.n_load + "| кН * |" + st.report_data.cut_yc + "| мм = " + st.report_data.my_1 + " кН*мм,",
                                }),
                            ],
                            style: "Norm1"
                        });
                    p4 = new Paragraph({                 //"<p>Выражение Mx/M<sub>x,ult</sub> + My/M<sub>y,ult</sub> = " + st.mx_load*1000 + " кН*мм / " + mx_ult + " + " + st.my_load*1000 + " кН*мм / " + my_ult + " = " + st.report_data.m_factor_1 + ",</p>" +
                            children: [
                                new TextRun({
                                    text: "Выражение ",
                                }),
                                mx_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                mxult_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                my_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                myult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.mx_1 + " кН*мм / " + mx_ult + " + " + st.report_data.my_1 + " кН*мм / " + my_ult + " = " + st.report_data.m_factor_1 + ",",
                                }),
                            ],
                            style: "Norm1"
                        });
                    p5 = new Paragraph({                 //Выражение F/(2*F<sub>ult</sub>) = " + st.n_load + " /(2 * " + st.report_data.f_ult  + ") = " + 0.5*st.report_data.n_factor + ",</p>" + 
                            children: [
                                new TextRun({
                                    text: "Выражение F/(2*",
                                }),
                                fult_letter,
                                new TextRun({
                                    text: ") = " + st.n_load + " / (2 * " + st.report_data.f_ult  + ") = " + n_factor_check + ",",
                                }),
                            ],
                            style: "Norm1"
                        });
                    result = [p1, p2, p3, p4, p5];
                    
                }
                if ((st.slab_edge_type !== "") && !st.openingIsNear) {             //если край плиты рядом или нет отверстий)
                    p1 = new Paragraph({                       //"Учет эксцентриситета приложения продавливающего усилия:",
                            children: [
                                new TextRun({
                                    text: "Учет эксцентриситета приложения продавливающего усилия:",
                                })
                            ],
                            style: "Norm1"
                        });
                    if (st.report_data.mx_1 && st.report_data.my_1) {
                        p2 = new Paragraph({                       //mx_1 = Math.abs(st.mx_load*1000) + Math.abs(st.n_load*geom_chars.xc);
                                children: [
                                    mx_letter,
                                    new TextRun({
                                        text: " = |",
                                    }),
                                    mx_letter,
                                    new TextRun({
                                        text: "| + |F * ",
                                    }),
                                    xc_letter,
                                    new TextRun({
                                        text: "| = |" + st.mx_load*1000 + "| кН*мм + |" + st.n_load + "| кН * |" + st.report_data.xc + "| мм = " + st.report_data.mx_1 + " кН*мм,",
                                    }),
                                ],
                                style: "Norm1"
                            });
                        p3 = new Paragraph({                       //my_1 = Math.abs(st.my_load*1000) + Math.abs(st.n_load*geom_chars.yc);
                                children: [
                                    my_letter,
                                    new TextRun({
                                        text: " = |",
                                    }),
                                    my_letter,
                                    new TextRun({
                                        text: "| + |F * ",
                                    }),
                                    yc_letter,
                                    new TextRun({
                                        text: "| = |" + st.my_load*1000 + "| кН*мм + |" + st.n_load + "| кН * |" + st.report_data.yc + "| мм = " + st.report_data.my_1 + " кН*мм,",
                                    }),
                                ],
                                style: "Norm1"
                            });
                        p4 = new Paragraph({                 //"<p>Выражение Mx/M<sub>x,ult</sub> + My/M<sub>y,ult</sub> = " + st.mx_load*1000 + " кН*мм / " + mx_ult + " + " + st.my_load*1000 + " кН*мм / " + my_ult + " = " + st.report_data.m_factor_1 + ",</p>" +
                                children: [
                                    new TextRun({
                                        text: "Выражение ",
                                    }),
                                    mx_letter,
                                    new TextRun({
                                        text: "/",
                                    }),
                                    mxult_letter,
                                    new TextRun({
                                        text: " + ",
                                    }),
                                    my_letter,
                                    new TextRun({
                                        text: "/",
                                    }),
                                    myult_letter,
                                    new TextRun({
                                        text: " = " + st.report_data.mx_1 + " кН*мм / " + mx_ult + " + " + st.report_data.my_1 + " кН*мм / " + my_ult + " = " + st.report_data.m_factor_1 + ",",
                                    }),
                                ],
                                style: "Norm1"
                            });
                    }
                    if (st.report_data.mx_1 && !st.report_data.my_1) {
                        p2 = new Paragraph({                       //mx_1 = Math.abs(st.mx_load*1000) + Math.abs(st.n_load*geom_chars.xc);
                                children: [
                                    mx_letter,
                                    new TextRun({
                                        text: " = |",
                                    }),
                                    mx_letter,
                                    new TextRun({
                                        text: "| + |F * ",
                                    }),
                                    xc_letter,
                                    new TextRun({
                                        text: "| = |" + st.mx_load*1000 + "| кН*мм + |" + st.n_load + "| кН * |" + st.report_data.xc + "| мм = " + st.report_data.mx_1 + " кН*мм,",
                                    }),
                                ],
                                style: "Norm1"
                            });
                        p4 = new Paragraph({                 //"<p>Выражение Mx/M<sub>x,ult</sub> 
                            children: [
                                new TextRun({
                                    text: "Выражение ",
                                }),
                                mx_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                mxult_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                my_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                myult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.mx_1 + " кН*мм / " + mx_ult + " + 0 = " + st.report_data.m_factor_1 + ",",
                                }),
                            ],
                            style: "Norm1"
                        });
                    }
                    if (!st.report_data.mx_1 && st.report_data.my_1) {
                        p3 = new Paragraph({                       //my_1 = Math.abs(st.my_load*1000) + Math.abs(st.n_load*geom_chars.yc);
                                children: [
                                    my_letter,
                                    new TextRun({
                                        text: " = |",
                                    }),
                                    my_letter,
                                    new TextRun({
                                        text: "| + |F * ",
                                    }),
                                    yc_letter,
                                    new TextRun({
                                        text: "| = |" + st.my_load*1000 + "| кН*мм + |" + st.n_load + "| кН * |" + st.report_data.yc + "| мм = " + st.report_data.my_1 + " кН*мм,",
                                    }),
                                ],
                                style: "Norm1"
                            });
                        p4 = new Paragraph({                 //My/M<sub>y,ult</sub>
                            children: [
                                new TextRun({
                                    text: "Выражение ",
                                }),
                                mx_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                mxult_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                my_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                myult_letter,
                                new TextRun({
                                    text: " = 0 + " + st.report_data.my_1 + " кН*мм / " + my_ult + " = " + st.report_data.m_factor_1 + ",",
                                }),
                            ],
                            style: "Norm1"
                        });
                    }
                    p5 = new Paragraph({                 //Выражение F/(2*F<sub>ult</sub>) = " + st.n_load + " /(2 * " + st.report_data.f_ult  + ") = " + 0.5*st.report_data.n_factor + ",</p>" + 
                            children: [
                                new TextRun({
                                    text: "Выражение F/(2*",
                                }),
                                fult_letter,
                                new TextRun({
                                    text: ") = " + st.n_load + " / (2 * " + st.report_data.f_ult  + ") = " + n_factor_check + ",",
                                }),
                            ],
                            style: "Norm1"
                        });
                    result = [p1, p2, p3, p4, p5];
                    
                }
                if ((st.slab_edge_type !== "") && st.openingIsNear) {             //если край плиты рядом или нет отверстий)
                    p1 = new Paragraph({                       //"Учет эксцентриситета приложения продавливающего усилия:",
                            children: [
                                new TextRun({
                                    text: "Учет эксцентриситета приложения продавливающего усилия:",
                                })
                            ],
                            style: "Norm1"
                        });
                    p2 = new Paragraph({                       //mx_1 = Math.abs(st.mx_load*1000) + Math.abs(st.n_load*geom_chars.xc) + Math.abs(st.n_load*geom_chars.cut_xc);
                            children: [
                                mx_letter,
                                new TextRun({
                                    text: " = |",
                                }),
                                mx_letter,
                                new TextRun({
                                    text: "| + |F * ",
                                }),
                                xc_letter,
                                new TextRun({
                                    text: "| + |F * ",
                                }),
                                new TextRun({
                                    text: "x'",
                                }),
                                new TextRun({
                                    text: "c",
                                    subScript: true
                                }),
                                new TextRun({
                                    text: "| = |" + st.mx_load*1000 + "| кН*мм + |" + st.n_load + "| кН * |" + st.report_data.xc + "| мм + |" + st.n_load + "| кН * |" + st.report_data.cut_xc + "| мм = " + st.report_data.mx_1 + " кН*мм,",
                                }),
                            ],
                            style: "Norm1"
                        });
                    p3 = new Paragraph({                       //my_1 = Math.abs(st.my_load*1000) + Math.abs(st.n_load*geom_chars.yc) + Math.abs(st.n_load*geom_chars.cut_yc);
                            children: [
                                my_letter,
                                new TextRun({
                                    text: " = |",
                                }),
                                my_letter,
                                new TextRun({
                                    text: "| + |F * ",
                                }),
                                yc_letter,
                                new TextRun({
                                    text: "| + |F * ",
                                }),
                                new TextRun({
                                    text: "y'",
                                }),
                                new TextRun({
                                    text: "c",
                                    subScript: true
                                }),
                                new TextRun({
                                    text: "| = |" + st.my_load*1000 + "| кН*мм + |" + st.n_load + "| кН * |" + st.report_data.yc + "| мм + |" + st.n_load + "| кН * |" + st.report_data.cut_yc + "| мм = " + st.report_data.my_1 + " кН*мм,",
                                }),
                            ],
                            style: "Norm1"
                        });
                    p4 = new Paragraph({                 //"<p>Выражение Mx/M<sub>x,ult</sub> + My/M<sub>y,ult</sub> = " + st.mx_load*1000 + " кН*мм / " + mx_ult + " + " + st.my_load*1000 + " кН*мм / " + my_ult + " = " + st.report_data.m_factor_1 + ",</p>" +
                            children: [
                                new TextRun({
                                    text: "Выражение ",
                                }),
                                mx_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                mxult_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                my_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                myult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.mx_1 + " кН*мм / " + mx_ult + " + " + st.report_data.my_1 + " кН*мм / " + my_ult + " = " + st.report_data.m_factor_1 + ",",
                                }),
                            ],
                            style: "Norm1"
                        });
                    p5 = new Paragraph({                 //Выражение F/(2*F<sub>ult</sub>) = " + st.n_load + " /(2 * " + st.report_data.f_ult  + ") = " + 0.5*st.report_data.n_factor + ",</p>" + 
                            children: [
                                new TextRun({
                                    text: "Выражение F/(2*",
                                }),
                                fult_letter,
                                new TextRun({
                                    text: ") = " + st.n_load + " / (2 * " + st.report_data.f_ult  + ") = " + n_factor_check + ",",
                                }),
                            ],
                            style: "Norm1"
                        });
                    result = [p1, p2, p3, p4, p5];
                    
                }
            }
            return result;
        }

        const report_19 = function () {                                               //проверка mfactor
            var result = [];
            if (st.report_data.m_factor_1 !== 0 || st.report_data.m_factor_2 !== 0) {
                if (st.report_data.m_factor_1 > n_factor_check) {
                    result = [
                        new Paragraph({                 //Т.к. " + st.report_data.m_factor_1 + " > " + 0.5*st.report_data.n_factor + ", принимаем Mx/M<sub>x,ult</sub> + My/M<sub>y,ult</sub> = " + 0.5*st.report_data.n_factor + " ,</p>"
                            children: [
                                new TextRun({
                                    text: "Т. к. " + st.report_data.m_factor_1 + " > " + n_factor_check + ", принимаем ",
                                }),
                                mx_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                mxult_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                my_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                myult_letter,
                                new TextRun({
                                    text: " = " + n_factor_check + ",",
                                }),
                            ],
                            style: "Norm1"
                        }),
                    ];
                } else {
                    result = [ 
                        new Paragraph({                  //Т.к. " + st.report_data.m_factor_1 + " ≤ " + 0.5*st.report_data.n_factor + ", оставляем значение Mx/M<sub>x,ult</sub> + My/M<sub>y,ult</sub> = " + st.report_data.m_factor_1 + " ,</p>"
                            children: [
                                new TextRun({
                                    text: "Т. к. " + st.report_data.m_factor_1 + " ≤ " + n_factor_check + ", оставляем значение ",
                                }),
                                mx_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                mxult_letter,
                                new TextRun({
                                    text: " + ",
                                }),
                                my_letter,
                                new TextRun({
                                    text: "/",
                                }),
                                myult_letter,
                                new TextRun({
                                    text: " = " + st.report_data.m_factor_1 + ",",
                                }),
                            ],
                            style: "Norm1"
                        }),
                    ];
                }
            }
            return result;
        }

        const report_20 = function () {                                               //считаем коэф. использования
            var result = [];
            if ((st.report_data.m_factor_1 === 0 || st.report_data.m_factor_2 === 0)) {
                result = [
                    new Paragraph({                 //Коэффициент использования = F/F<sub>ult</sub> 
                        children: [
                            new TextRun({
                                text: "Коэффициент использования = F/",
                            }),
                            fult_letter,
                            new TextRun({
                                text: " = " + st.n_load + " / " + st.report_data.f_ult  + " = " + st.report_data.factor + ",",
                            })
                        ],
                        style: "Norm1"
                    }),                   
                ];
            } else {
                result = [
                    new Paragraph({                 //Коэффициент использования = F/F<sub>ult</sub> + Mx/M<sub>x,ult</sub> + My/M<sub>y,ult</sub> = " + st.n_load + " / " + st.report_data.f_ult  + " + " + st.report_data.m_factor_2 + " = " + st.report_data.factor + ",</p>" + 
                        children: [
                            new TextRun({
                                text: "Коэффициент использования = F/",
                            }),
                            fult_letter,
                            new TextRun({
                                text: " + ",
                            }),
                            mx_letter,
                            new TextRun({
                                text: "/",
                            }),
                            mxult_letter,
                            new TextRun({
                                text: " + ",
                            }),
                            my_letter,
                            new TextRun({
                                text: "/",
                            }),
                            myult_letter,
                            new TextRun({
                                text: " = " + st.n_load + " / " + st.report_data.f_ult  + " + " + st.report_data.m_factor_2 + " = " + st.report_data.factor + ",",
                            })
                        ],
                        style: "Norm1"
                    }),                   
                ];
            }
            return result;
        }

        const report_21 = function () {                                               //пишем вывод
            var result = [];
            if (st.report_data.factor <= 1) {
                result = [
                    new Paragraph({                           //<p><b>Вывод: прочность обеспечена. Коэффициент использования = " + st.report_data.factor + " .</b></p>" +
                        children: [
                            new TextRun({
                                text: "Вывод: прочность обеспечена. Коэффициент использования = " + st.report_data.factor + ".",
                            }),
                        ],
                        style: "Head2"
                    }),              
                ];
            } else {
                result = [
                    new Paragraph({                           //<p><b>Вывод: прочность не обеспечена. Коэффициент использования = " + st.report_data.factor + " .</b></p>" +
                        children: [
                            new TextRun({
                                text: "Вывод: прочность не обеспечена. Коэффициент использования = " + st.report_data.factor + ".",
                            }),
                        ],
                        style: "Head2"
                    }),              
                ];
            }
            return result;
        }

        //собираем всю текстовку вместе
        var word_text = report_1.concat(report_2(), report_3(), report_4(), report_5(), report_6a(), report_6b(), report_6(), report_7(), report_8(), report_9(), report_10(), report_11(), report_12(), report_13(),
                        report_14(), report_15(), report_16(), report_17(), report_18(), report_19(), report_20(), report_21());
        
        // и запихиваем её в Word
        doc.addSection({
            properties: {},
            children: word_text
        });

        //сохраняем файл отчета
        Packer.toBlob(doc).then((blob) => {
            // saveAs from FileSaver will download the file
            saveAs(blob, "prodavlivanie.docx");
        });
    }

    componentDidMount() {
        this.updateWindowDimensions();
        window.addEventListener('resize', this.updateWindowDimensions);
        window.addEventListener('keydown', this.handleEnterKey);
    }

    updateWindowDimensions() {                                          //здесь мы управляем размером картинки чтобы влезало на все экраны
        var position_fixed = false;
        var width;
        var svg_size;
        if (window.screen.width < window.innerWidth) {              // для мобильных браузеров
            width = window.screen.width;
        } else {
            width = window.innerWidth;
        }
        if (width >= 768 && !this.state.show_help) {
            position_fixed = true;
        }
        this.setState({svg_position_fixed: position_fixed},
            function() {
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
                    this.setState({svg_size: svg_size,
                                    v_width: width});
                }
                if (window.innerHeight <= 830 && window.innerHeight > 670) {
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
                    this.setState({svg_size: svg_size,
                        v_width: width});
                }
                if (window.innerHeight <= 670) {
                    position_fixed = false;
                    this.setState({svg_position_fixed: position_fixed},
                        function() {
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
                            this.setState({svg_size: svg_size,
                                v_width: width});
                        });
                }
            }
        );
    }

    render() {
        console.log(window.innerHeight);
        /*
        console.log(this.state);
        */
        /*
        var row;
        if ((window.innerHeight > 830) || (this.state.v_width <=768) ) {         // стандартная версия для высоких экранов или мобильных браузеров
            row = <Row>
                    <Col>
                        <div>
                            <UnitsOfMeasurement 
                                onUnitsChange = {this.getData}/>
                            <Loads 
                                onLoadChange = {this.getData} globalState = {this.state}/>
                            <ColumnSize 
                                onColumnSizeChange = {this.getData} globalState = {this.state}/>
                        </div>
                    </Col>
                    <Col md>
                        <div>
                            <SlabSize
                                    onSlabSizeChange = {this.getData} globalState = {this.state}/>
                            <Concrete 
                                    onConcreteChange = {this.getData} />
                            <ShearReinforcementSelect 
                                onShearReinforcementSelectChange = {this.getData} globalState = {this.state}/>
                            <ShearReinforcement 
                                className = {this.state.shear_reinforcement ? "panelVisible" : "panelInvisible"} 
                                globalState = {this.state} 
                                onShearReinforcementChange = {this.getData}/>
                            <SlabEdgeSelect
                                onSlabEdgeSelectChange = {this.getData} globalState = {this.state}/>
                            <SlabEdgeData
                                className = {this.state.slab_edge ? "panelVisible" : "panelInvisible"} 
                                globalState = {this.state}
                                onSlabEdgeDataChange = {this.getData}/>
                            <OpeningIsNearSelect
                                onOpeningIsNearSelectChange = {this.getData} globalState = {this.state}/>
                            <OpeningIsNearData
                                className = {this.state.openingIsNear ? "panelVisible mb-3" : "panelInvisible"} 
                                globalState = {this.state}
                                onOpeningIsNearChange = {this.getData}/>
                        </div>
                    </Col>
                    <div style={{flexGrow: 0, flexShrink: 0, flexBasis: this.state.svg_size + 30}} className="my-sidebar">
                        <div className = "position-relative">
                            <div className={this.state.svg_position_fixed ? "position-fixed" : ""}>
                                <Sketch onSketchChange = {this.getData} globalState = {this.state}/>
                                <ViewSettings 
                                    onViewSettingstChange = {this.getData} globalState = {this.state}/>
                                <Result globalState = {this.state}/>                        
                                <Button variant="primary" className = {(this.state.result_color !== "secondary") ? "" : "invisible"} onClick = {this.exportToWord}>Сохранить как MS Word</Button>
                                <canvas id="buffer" width="0" height="0" style = {{display: "none"}}></canvas>
                            </div>
                        </div>
                    </div>                    
                </Row> ;
        } else {                                //более компактная версия для невысоких экранов
            row = <Row>
                    <Col>
                        <div>
                            <UnitsOfMeasurement 
                                onUnitsChange = {this.getData}/>
                            <Loads 
                                onLoadChange = {this.getData} globalState = {this.state}/>
                            <ColumnSize 
                                onColumnSizeChange = {this.getData} globalState = {this.state}/>
                            <SlabSize
                                    onSlabSizeChange = {this.getData} globalState = {this.state}/>
                            <Concrete 
                                    onConcreteChange = {this.getData} />
                        </div>
                    </Col>
                    <Col md>
                        <div>                                                               
                            <ShearReinforcementSelect 
                                onShearReinforcementSelectChange = {this.getData} globalState = {this.state}/>
                            <ShearReinforcement 
                                globalState = {this.state} 
                                onShearReinforcementChange = {this.getData}/>
                            <SlabEdgeSelect
                                onSlabEdgeSelectChange = {this.getData} globalState = {this.state}/>
                            <SlabEdgeData
                                globalState = {this.state}
                                onSlabEdgeDataChange = {this.getData}/>
                            <OpeningIsNearSelect
                                onOpeningIsNearSelectChange = {this.getData} globalState = {this.state}/>
                            <OpeningIsNearData
                                globalState = {this.state}
                                onOpeningIsNearChange = {this.getData}/>
                            <ViewSettings
                                className = "border pl-1 mt-4"
                                onViewSettingstChange = {this.getData} globalState = {this.state}/>
                            
                        </div>
                    </Col>
                    <div style={{flexGrow: 0, flexShrink: 0, flexBasis: this.state.svg_size + 30}} className="my-sidebar">
                        <div className = "position-relative">
                            <div className={this.state.svg_position_fixed ? "position-fixed" : ""}>
                                <Sketch onSketchChange = {this.getData} globalState = {this.state}/>
                                <Result globalState = {this.state}/>                        
                                <Button variant="primary" className = {(this.state.result_color !== "secondary") ? "" : "invisible"} onClick = {this.exportToWord}>Сохранить как MS Word</Button>
                                <canvas id="buffer" width="0" height="0" style = {{display: "none"}}></canvas>
                            </div>
                        </div>
                    </div>                    
                </Row> ;
        }
        */

        return (
            <Fragment>
                <Container fluid={true} className = "pb-4 mb-5">
                    <Header 
                        onHelpPush = {this.getData} globalState = {this.state}/>
                    <Help 
                        globalState = {this.state}/>
                    <Row>
                        <Col>
                            <div>
                                <UnitsOfMeasurement 
                                    onUnitsChange = {this.getData}/>
                                <Loads 
                                    onLoadChange = {this.getData} globalState = {this.state}/>
                                <ColumnSize 
                                    onColumnSizeChange = {this.getData} globalState = {this.state}/>
                            </div>
                        </Col>
                        <Col md>
                            <div>
                                <SlabSize
                                        onSlabSizeChange = {this.getData} globalState = {this.state}/>
                                <Concrete 
                                        onConcreteChange = {this.getData} />
                                <ShearReinforcementSelect 
                                    onShearReinforcementSelectChange = {this.getData} globalState = {this.state}/>
                                <ShearReinforcement 
                                    className = {this.state.shear_reinforcement ? "panelVisible" : "panelInvisible"} 
                                    globalState = {this.state} 
                                    onShearReinforcementChange = {this.getData}/>
                                <SlabEdgeSelect
                                    onSlabEdgeSelectChange = {this.getData} globalState = {this.state}/>
                                <SlabEdgeData
                                    className = {this.state.slab_edge ? "panelVisible" : "panelInvisible"} 
                                    globalState = {this.state}
                                    onSlabEdgeDataChange = {this.getData}/>
                                <OpeningIsNearSelect
                                    onOpeningIsNearSelectChange = {this.getData} globalState = {this.state}/>
                                <OpeningIsNearData
                                    className = {this.state.openingIsNear ? "panelVisible mb-3" : "panelInvisible"} 
                                    globalState = {this.state}
                                    onOpeningIsNearChange = {this.getData}/>
                            </div>
                        </Col>
                        <div style={{flexGrow: 0, flexShrink: 0, flexBasis: this.state.svg_size + 30}} className="my-sidebar">
                            <div className = "position-relative">
                                <div className={this.state.svg_position_fixed ? "position-fixed" : ""}>
                                    <Sketch onSketchChange = {this.getData} globalState = {this.state}/>
                                    <ViewSettings 
                                        onViewSettingstChange = {this.getData} globalState = {this.state}/>
                                    <Result globalState = {this.state}/>                        
                                    <Button variant="primary" className = {(this.state.result_color !== "secondary") ? "" : "invisible"} onClick = {this.exportToWord}>Сохранить как MS Word</Button>
                                    <canvas id="buffer" width="0" height="0" style = {{display: "none"}}></canvas>
                                </div>
                            </div>
                        </div>                    
                    </Row>
                </Container>
                <div className = {((window.innerHeight > 830) || (this.state.v_width <=768) ) ? "invisible" : ""}>
                    <div className = {"alert-" + this.state.result_color + " footer p-2"}>
                        {this.state.text_result}
                    </div>                 
                </div>
            </Fragment>              
        );
            
    }
}

// дальше идут второстепенные компоненты

function Header(props) {
    function fixSVG() {                                                        //фиксируем/разфиксируем SVG
        var fixed = false;
        if (window.innerWidth >= 768) {
            if (props.globalState.svg_position_fixed) {
                fixed = false;
            } else {
                fixed = true;
            }
        } else {
            fixed = false;
        }
        var state = {
            svg_position_fixed: fixed
        };
        props.onHelpPush(state);        
    }

    return (
        <Row className = "top_header mb-3 py-2 h5">
            <div className="col-9 text-left my-auto">
                <span>Расчет на продавливание онлайн по СП 63.13330.2012 by TermenVox. 2020.</span>
            </div>
            <div className="col text-right my-auto"> 
                <span>v.0.1b</span>
                <span id = "help" onClick = {fixSVG} className = "ml-3" data-toggle="collapse" data-target="#help_par">
                    <i className="far fa-question-circle"></i>
                </span> 
            </div>    
        </Row>
    );
}

function Help(props) {

    function emulateClick() {
        console.log("click");
        document.getElementById("help").click();
    }

    return (
        <div className = "collapse border mb-4" id="help_par">
            <div className="col">
                <p>Всем привет!</p>
                <p>Цель этой программы быстро и удобно рассчитать плиту на продавливание. Для простоты использования и чтобы не морочить людям голову программа имеет пару допущений:
                </p>
                <p>1) Никаких "разгружающих" моментов. Все моменты всегда "догружают" сечение независимо от знака. Потому что, завтра выпускать отчет, а я тут буду еще сидеть разбираться: "А у меня
                        момент разгружает сечение, или не разгружает? А в какую сторону он крутит? В эту? А может в эту? А при каких РСН? А всегда так или бывает меняет знак?" Короче исходя их того, что 
                    большинство проектировщиков понятия не имеют куда там у них действует момент, все моменты всегда нагружают сечение. 
                    Взяли из схемы максимальные Мх, Му, разделили пополам, вбили их с любыми знаками и забыли.</p>
                <p>2) Никаких "разгружающих" продольных усилий, по вышеназванным причинам. Продольное усилие всегда нагружает сечение независимо от знака. </p>
                <p>Также данная версия программы имеет <b>одно ограничение</b>: если у Вас, несколько отверстий сливаются в одно и суммарный выбиваемый угол превышает 180 градусов, программа 
                    посчитает его неправильно. На данный момент я не придумал простого и надежного алгоритма как научить программу отличать углы больше 180 градусов от им обратным (например если у Вас 
                    наложенные отверстия выбьют угол 210 градусов, программа посчитает что выбитый угол равен 360-210 = 150 градусов.</p>
                <p>Эту проблему можно легко обойти следующим образом: разбейте Ваше отверстие на 2 (или столько, сколько нужно) отверстий и разместите их рядом, но так, чтобы они не пересекались. Для Вас погрешность будет 
                    минимальна, а для программы все углы окажутся меньше 180 градусов и она все нормально посчитает.</p>
                    <div className="card-deck mb-3">
                        <div className="card text-center" style={{maxWidth: 450}}>
                            <div className="card-body">
                                <h5 className="card-title">Работает</h5>
                            </div>
                            <img src="./pic/good_3.png" className="card-img-bottom" alt="хорошо"></img>
                        </div>
                        <div className="card text-center" style={{maxWidth: 450}}>
                            <div className="card-body">
                                <h5 className="card-title">Не работает:(Пичалька</h5>
                            </div>
                            <img src="./pic/bad_3.png" className="card-img-bottom" alt="плохо"></img>
                        </div>
                        <div className="card text-center" style={{maxWidth: 450}}>
                            <div className="card-body">
                                <h5 className="card-title">Обход ограничения</h5>
                            </div>
                            <img src="./pic/workaround_1.png" className="card-img-bottom" alt="обход ограничения"></img>
                        </div>                           
                    </div>
                <Row>
                    <div className="col-9 text-left">
                        <p>Для любителей покапаться в коде вот <a href="https://github.com/AlekseyMalakhov/shear_slab_calc">ссылка на GitHub</a> - милости просим.</p>
                        <p>Обсуждение программы на dwg.ru <a href="https://github.com/AlekseyMalakhov/shear_slab_calc">здесь.</a></p>
                        <p>Приятного пользования! TermenVox. 2020г. <a href="mailto:hexel@tut.by">hexel@tut.by</a></p>
                    </div>
                    <div className="col my-auto">
                        <Button variant="primary" onClick = {emulateClick}>Закрыть справку</Button>
                    </div>                 
                </Row>                    
            </div>
        </div>
    );
}

function ViewSettings(props) {
    function handleCheckBox(e) {
        var box = e.target.id;
        props.onViewSettingstChange({[box]: !props.globalState[box]});
    }

    return (
        <div className = {props.className}>
            <div className="form-check">
                <input type="checkbox" className="form-check-input" id="u_show" value="false" defaultChecked onChange={handleCheckBox}></input>
                <label htmlFor="u_show" className="form-check-label">Показать расчетный контур</label>
            </div>
            <div className="form-check">
                <input type="checkbox" className="form-check-input" id="in_out_asw_show" value="false" onChange={handleCheckBox}></input>
                <label htmlFor="in_out_asw_show" className="form-check-label">Показать наружный и внутренний контур учета поперечной арматуры</label>
            </div>
            <div className="form-check">
                <input type="checkbox" className="form-check-input" id="op_tangents_show" value="false" onChange={handleCheckBox}></input>
                <label htmlFor="op_tangents_show" className="form-check-label">Показать касательные к отверстиям</label>
            </div>
        </div>     
    );
}

class UnitsOfMeasurement extends React.Component {
    constructor(props) {
        super(props);
        this.handleSelect = this.handleSelect.bind(this);
    }

    handleSelect(e) {
        var state = {
            [e.target.id]: e.target.value,
        };
        this.props.onUnitsChange(state);
    }

    render() {
        return (
            <div>
                <h5>Единицы измерения</h5>
                <div  className="form-group">
                    <label htmlFor = "force_units">Силовые факторы:</label>
                    <select id = "force_units" className="form-control" onChange = {this.handleSelect}>
                        <option value = "т">т, тм</option>
                        <option value = "кН">кН, кНм</option>
                    </select>
                </div>
                <div  className="form-group">
                    <label htmlFor = "length_units">Линейные размеры:</label>
                    <select id = "length_units" className="form-control" onChange = {this.handleSelect}>
                        <option value = "мм">мм</option>
                        <option value = "см">см</option>
                        <option value = "м">м</option>
                    </select>
                </div>
                
            </div>
        );
    }
}

class Loads extends React.Component {
    constructor(props) {
        super(props);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(e) {
        var state = {
            [e.target.id]: Number(e.target.value),
        };
        this.props.onLoadChange(state);
    }

    render() {
        return (
            <form>
                <h5>Нагрузки</h5>
                <div className="form-group">
                    <label htmlFor = "input_n_load">Продольная сила N, {this.props.globalState.force_units}:</label>
                    <input type="number" step="0.0001" className="form-control" min="0" id="input_n_load" onChange={this.handleInput}></input>
                </div>
                <div className="form-group">
                    <label htmlFor = "input_mx_load">Изгибающий момент Mx, {this.props.globalState.force_units}м:</label>
                    <input type="number" step="0.0001" className="form-control" id="input_mx_load" onChange={this.handleInput}></input>
                </div>
                <div className="form-group">
                    <label htmlFor = "input_my_load">Изгибающий момент My, {this.props.globalState.force_units}м:</label>
                    <input type="number" step="0.0001" className="form-control" id="input_my_load" onChange={this.handleInput}></input>
                </div>
            </form>
        );
    }
}

class ColumnSize extends React.Component {
    constructor(props) {
        super(props);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(e) {
        var state = {
            [e.target.id]: Math.abs(Number(e.target.value)),
        };
        this.props.onColumnSizeChange(state);
    }

    render() {
        return (
            <div>
                <h5>Cечение колонны</h5>
                <div className="form-group">
                    <label htmlFor = "input_a_column_size">а, размер вдоль оси Х, {this.props.globalState.length_units}:</label>
                    <input type="number" step="0.0001" className="form-control" min="0" id="input_a_column_size" onChange={this.handleInput}></input>
                </div>
                <div className="form-group">
                    <label htmlFor = "input_b_column_size">b, размер вдоль оси Y, {this.props.globalState.length_units}:</label>
                    <input type="number" step="0.0001" className="form-control" min="0" id="input_b_column_size" onChange={this.handleInput}></input>
                </div>
            </div>
        );
    }
}

class SlabSize extends React.Component {
    constructor(props) {
        super(props);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(e) {
        var state = {
            [e.target.id]: Math.abs(Number(e.target.value)),
        };
        this.props.onSlabSizeChange(state);
    }

    render() {
        return (
            <div>
                <h5>Cечение плиты</h5>
                <div className="form-group">
                    <label htmlFor = "input_t_slab_size">Толщина, {this.props.globalState.length_units}:</label>
                    <input type="number" step="0.0001" className="form-control" min="0" id="input_t_slab_size" onChange={this.handleInput}></input>
                </div>
                <div className="form-group">
                    <label htmlFor = "input_a_slab_size">Привязка центра тяжести арматуры, {this.props.globalState.length_units}:</label>
                    <input type="number" step="0.0001" className="form-control" min="0" id="input_a_slab_size" onChange={this.handleInput}></input>
                </div>
            </div>
        );
    }
}

class Concrete extends React.Component {
    constructor(props) {
        super(props);
        this.handleSelect = this.handleSelect.bind(this);
        this.handleInput = this.handleInput.bind(this);
    }

    handleSelect(e) {
        var state = {
            concrete_grade: e.target.value,
        };
        this.props.onConcreteChange(state);
    }

    handleInput(e) {
        var state = {
            [e.target.id]: Math.abs(Number(e.target.value)),
        };
        this.props.onConcreteChange(state);
    }

    render() {
        return (
            <div>
                <h5>Бетон</h5>
                <div className="form-group">
                    <label htmlFor = "concrete_grade">Класс бетона:</label>
                    <select id = "concrete_grade" className="form-control" onChange = {this.handleSelect}>
                        <option value = "b10">В10</option>
                        <option value = "b15">В15</option>
                        <option value = "b20">В20</option>
                        <option value = "b25">В25</option>
                        <option value = "b30">В30</option>
                        <option value = "b35">В35</option>
                        <option value = "b40">В40</option>
                        <option value = "b45">В45</option>
                        <option value = "b50">В50</option>
                        <option value = "b55">В55</option>
                        <option value = "b60">В60</option>
                        <option value = "b70">В70</option>
                        <option value = "b80">В80</option>
                        <option value = "b90">В90</option>
                        <option value = "b100">В100</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor = "gamma_b">Коэффициент γb:</label>
                    <select id = "gamma_b" className="form-control" onChange = {this.handleInput}>
                        <option value = "0.9">0,9</option>
                        <option value = "1">1</option>
                    </select>
                </div>
            </div>
        );
    }
}

class ShearReinforcementSelect extends React.Component {
    constructor(props) {
        super(props);
        this.handleSelect = this.handleSelect.bind(this);
        this.checkButtonNo = this.checkButtonNo.bind(this);
        this.checkButtonYes = this.checkButtonYes.bind(this);
    }

    handleSelect(e) {
        var myValue = (e.target.value === "true");
        var state = {
            shear_reinforcement: myValue,
        };
        this.props.onShearReinforcementSelectChange(state);
    }

    // делаем скрыть/показать div на две кнопки
    
    checkButtonNo() {
        var result = "";
        if (this.props.globalState.shear_reinforcement) {       //если у нас есть попер армирование, то кнопка нет активна, да неактивна
            result = "#shear_r";
        }
        return result;
    }

    checkButtonYes() {
        var result = "";
        if (!this.props.globalState.shear_reinforcement) {      //если у нас нет попер армирование, то кнопка да активна, нет не активна
            result = "#shear_r";
        }
        return result;
    }

    render() {
        return (
            <div>
                <h5>Поперечное армирование: {this.props.globalState.shear_reinforcement ? "Да" : "Нет"}</h5>
                <div className="d-flex flex-column">
                    <ButtonGroup toggle>
                        <ToggleButton type="radio" data-toggle="collapse" data-target = {this.checkButtonNo()} name="radio" variant="info" defaultChecked value="false" onChange = {this.handleSelect}>
                            Нет
                        </ToggleButton>
                        <ToggleButton type="radio" data-toggle="collapse" data-target = {this.checkButtonYes()} name="radio" variant="info" value="true" onChange = {this.handleSelect}>
                            Да
                        </ToggleButton>
                    </ButtonGroup>
                </div>
            </div>
        );
        
    }
}

class ShearReinforcement extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            rows: []
        }
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

    handleSelect(e) {                                                       //обрабатывем выбор класса и диаметра арматуры
        var state = {
            [e.target.id]: e.target.value,
        };
        this.props.onShearReinforcementChange(state);
    }

    handleInputBarsNumber(e) {                                                              //обрабатываем количество стержней вдоль оси Х и У
        var gs = this.props.globalState;
        var value = Math.abs(Number(e.target.value));
        var row_number = Number(e.target.id.slice(e.target.id.lastIndexOf("_")+1));
        var axis = e.target.id.substring(18, 19);
        var shear_bars_number_obj = gs.shear_bars_number;
        shear_bars_number_obj[axis][row_number] = value;
        var state = {
            shear_bars_number: shear_bars_number_obj
        };
        this.props.onShearReinforcementChange(state);
    }

    handleReinforcementRows(e) {                                                        //обрабатываем привязку ряда арматуры к предыдущему ряду
        var gs = this.props.globalState;
        var value = Math.abs(Number(e.target.value));
        var row_number = Number(e.target.id.slice(e.target.id.lastIndexOf("_")+1));
        var spacing_array = [...gs.input_shear_bars_spacing_to_prev];
        spacing_array[row_number] = value;
        var state = {
            input_shear_bars_spacing_to_prev: spacing_array
        };
        this.props.onShearReinforcementChange(state);
    }

    handleRowsNumber(e) {                                                       //обрабатываем количество рядов поперечной арматуры при изменении её в графе input id = shear_bars_row_number
        var new_value = Math.abs(Number(e.target.value));                                     
        var state = {
            shear_bars_row_number: new_value
        };
        this.props.onShearReinforcementChange(state);
    }

    addRowNumber() {                                                             //обрабатываем количество рядов арматуры при нажатии кнопки Добавить ряд
        var gs = this.props.globalState;                                                
        var state = {
            shear_bars_row_number: gs.shear_bars_row_number + 1                  // берем старое количество рядов и добавляем 1
        }
        this.props.onShearReinforcementChange(state);
    }

    removeRowNumber() {                                                          //обрабатываем количество рядов арматуры при нажатии кнопки Удалить ряд
        var gs = this.props.globalState;
        var state = {
            shear_bars_row_number: gs.shear_bars_row_number - 1                  // берем старое количество рядов и удаляем 1
        }
        this.props.onShearReinforcementChange(state);
    }

    componentDidUpdate(prevProps) {                                                                     //если количество рядов арматуры обновилось - добавляем или удаляем ряд
        if (this.props.globalState.shear_bars_row_number > prevProps.globalState.shear_bars_row_number) {
            this.addRow();
        }
        if (this.props.globalState.shear_bars_row_number < prevProps.globalState.shear_bars_row_number) {
            this.removeRow();
        }
    }

    addRow() {                                              //добавляем ряд поперечной арматуры в DOM
        var gs = this.props.globalState;  
        var old_rows = this.state.rows;                                 //берем старые html ряды
        var key_number = gs.shear_bars_row_number;              // берем новое число рядов
        var rowKey = key_number + "row";
        var new_row = [<div key = {rowKey + "dddtt"} id = {"row_" + key_number}>            
                            <br></br>
                            <div className="form-group">
                                <label htmlFor = {"input_shear_bars_spacing_to_prev_" + key_number}>Привязка {key_number} ряда поперечной арматуры к предыдущему ряду, {gs.length_units}:</label>
                                <input type="number" step="0.0001" className="form-control" min="0" id = {"input_shear_bars_spacing_to_prev_" + key_number} onChange = {this.handleReinforcementRows}></input>
                            </div>
                            <div className="form-group">
                                <label htmlFor = {"shear_bars_number_X_" + key_number}>{key_number} ряд. Количество стержней вдоль оси Х, шт:</label>
                                <input type="number" className="form-control" min="0" id = {"shear_bars_number_X_" + key_number} onChange = {this.handleInputBarsNumber}></input>
                            </div>
                            <div className="form-group">
                                <label htmlFor = {"shear_bars_number_Y_" + key_number}>{key_number} ряд. Количество стержней вдоль оси Y, шт:</label>
                                <input type="number" className="form-control" min="0" id = {"shear_bars_number_Y_" + key_number} onChange = {this.handleInputBarsNumber}></input>
                            </div>
                     </div>];
        var new_rows = old_rows.concat(new_row);        // добавляем новый ряд к старым - делаем это имеено конкатам, чтобы родился новый инстанс эррея. Иначе реакт не заметит что мы внесли изменения в эррей.

        
        var shear_bars_number_obj = gs.shear_bars_number;       //делаем копию объекта в котором прописано сколько у нас стержней вдоль оси Х и У в каждом ряду
        shear_bars_number_obj.X[key_number] = 0;                // пишем что в нашем новом ряду пока 0 стержней вдоль Х и У
        shear_bars_number_obj.Y[key_number] = 0;

        var local_state = {
                            rows: new_rows,
                             };
        this.setState(local_state, function() {
            var state = {
                shear_bars_number: shear_bars_number_obj
            };
            this.props.onShearReinforcementChange(state);
        });

    }

    removeRow() {                                                                                       //удаляем ряд поперечки из DOM
        var gs = this.props.globalState;  
        var last_row_number = this.state.rows.length-1;                                                     //берем позицию последнего ряда в эррее
        var new_rows = [...this.state.rows];                                                                //снимаем копию старого эррэя с html элементами рядов
        new_rows.splice(last_row_number, 1);                                                                // удаляем из него последний ряд

        var last_row_bars_number = gs.shear_bars_number.X.length-1;                                 //берем позицию последних чисел в количестве стержней в ряду
        var shear_bars_number_X = [...gs.shear_bars_number.X];                                      //снимаем копии с эрреев с количеством стержней в ряду
        var shear_bars_number_Y = [...gs.shear_bars_number.Y];
        var input_shear_bars_spacing_to_prev = [...gs.input_shear_bars_spacing_to_prev];                        //снимам копию с эррея с отступами

        shear_bars_number_X.splice(last_row_bars_number, 1);                                                //удаляем количество стержней относящееся к последнему ряду
        shear_bars_number_Y.splice(last_row_bars_number, 1);
        input_shear_bars_spacing_to_prev.splice(last_row_bars_number, 1);                                         //удаляем отступы относящиеся к последнему ряду


        var local_state = {
                rows: new_rows,
                };
        this.setState(local_state, function() {
            var state = {
                shear_bars_number: {
                    X: shear_bars_number_X,
                    Y: shear_bars_number_Y
                },
                input_shear_bars_spacing_to_prev: input_shear_bars_spacing_to_prev
            };
            this.props.onShearReinforcementChange(state);
        });
    }

    removeRowClassChange() {                                                            //если рядом 2 или меньше - скрываем кнопку удалить
        if (this.props.globalState.shear_bars_row_number <= 2) {
            var className = "invisible";
        }
        return className;
    }

    render() {
        return (
            <div className = "collapse" id="shear_r">
                <h5>Характеристики поперечного армирования</h5>
                <div className="form-group">
                    <label htmlFor = "shear_bars_grade">Класс поперечной арматуры:</label>
                    <select id = "shear_bars_grade" className="form-control" onChange = {this.handleSelect}>
                        <option value = "a240c">А240С</option>
                        <option value = "a400c">А400С</option>
                        <option value = "a500c">А500С</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor = "shear_bars_diameter">Диаметр поперечной арматуры:</label>
                    <select id = "shear_bars_diameter" className="form-control" onChange = {this.handleSelect}>
                        <option value = "4">4</option>
                        <option value = "5">5</option>
                        <option value = "6">6</option>
                        <option value = "8">8</option>
                        <option value = "10">10</option>
                        <option value = "12">12</option>
                        <option value = "14">14</option>
                        <option value = "16">16</option>
                        <option value = "18">18</option>
                        <option value = "20">20</option>
                        <option value = "22">22</option>
                        <option value = "25">25</option>
                        <option value = "28">28</option>
                        <option value = "32">32</option>
                        <option value = "36">36</option>
                        <option value = "40">40</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor = "shear_bars_row_number">Количество рядов поперечной арматуры, шт:</label>
                    <input type="number" className="form-control" min="2" id="shear_bars_row_number" value = {this.props.globalState.shear_bars_row_number} onKeyDown = {(e) => e.preventDefault()} onChange = {this.handleRowsNumber}></input>
                </div>
                <br></br>
                <div id = "row_1">
                    <div className="form-group">
                        <label htmlFor = "input_shear_bars_spacing_to_prev_1">Привязка 1 ряда поперечной арматуры к грани колонны, {this.props.globalState.length_units}:</label>
                        <input type="number" step="0.0001" className="form-control" min="0" id="input_shear_bars_spacing_to_prev_1" onChange = {this.handleReinforcementRows}></input>
                    </div>
                    <div className="form-group">
                        <label htmlFor = "shear_bars_number_X_1">1 ряд. Количество стержней вдоль оси Х, шт:</label>
                        <input type="number" className="form-control" min="0" id="shear_bars_number_X_1" onChange = {this.handleInputBarsNumber}></input>
                    </div>
                    <div className="form-group">
                        <label htmlFor = "shear_bars_number_Y_1">1 ряд. Количество стержней вдоль оси Y, шт:</label>
                        <input type="number" className="form-control" min="0" id="shear_bars_number_Y_1" onChange = {this.handleInputBarsNumber}></input>
                    </div>
                </div>
                <br></br>
                <div id = "row_2">
                    <div className="form-group">
                        <label htmlFor = "input_shear_bars_spacing_to_prev_2">Привязка 2 ряда поперечной арматуры к предыдущему ряду, {this.props.globalState.length_units}:</label>
                        <input type="number" step="0.0001" className="form-control" min="0" id="input_shear_bars_spacing_to_prev_2" onChange = {this.handleReinforcementRows}></input>
                    </div>
                    <div className="form-group">
                        <label htmlFor = "shear_bars_number_X_2">2 ряд. Количество стержней вдоль оси Х, шт:</label>
                        <input type="number" className="form-control" min="0" id="shear_bars_number_X_2" onChange = {this.handleInputBarsNumber}></input>
                    </div>
                    <div className="form-group">
                        <label htmlFor = "shear_bars_number_Y_2">2 ряд. Количество стержней вдоль оси Y, шт:</label>
                        <input type="number" className="form-control" min="0" id="shear_bars_number_Y_2" onChange = {this.handleInputBarsNumber}></input>
                    </div>
                </div>

                {this.state.rows}
                <Button variant="success" onClick = {this.addRowNumber}>Добавить ряд</Button>
                <Button variant="danger" className = {"ml-3 " + ((this.props.globalState.shear_bars_row_number > 2) ? "": "invisible")} onClick = {this.removeRowNumber}>Удалить ряд</Button>
            </div>
        );
    }
}

class Sketch extends React.Component {                          // рисуем картинку
    constructor(props) {
        super(props);
        this.createCircles = this.createCircles.bind(this);
        this.circlesVisibility = this.circlesVisibility.bind(this);
        this.createOpenings = this.createOpenings.bind(this);
        this.createOpeningsTangent = this.createOpeningsTangent.bind(this);
        this.createTangentIntersect = this.createTangentIntersect.bind(this);
        this.createOpeningTriangles = this.createOpeningTriangles.bind(this);
        this.zoomPlus = this.zoomPlus.bind(this);
        this.zoomMinus = this.zoomMinus.bind(this);
        this.zoomInitial = this.zoomInitial.bind(this);
        this.zoomPanelStyle1 = this.zoomPanelStyle1.bind(this);
        this.zoomPanelStyle2 = this.zoomPanelStyle2.bind(this);

    }

    createCircles() {                                       //рисуем кружки арматуры
        var circles = [];
        var color;
        var gs = this.props.globalState;
        for (var i = 0; i < gs.circlesX.length; i++) {
            color = checkAswCircles(gs.circlesX[i], gs.circlesY[i]);                //проверяем цвет. Если кружок в пределах рабочей зоны - то один цвет, если нет - то другой
            var circle = <circle className = {this.circlesVisibility()} key = {"b" + i} cx={gs.circlesX[i]} cy={gs.circlesY[i]} r="3" fill={color} stroke={color} strokeWidth="1"></circle>;
            circles.push(circle);
        }

        function checkAswCircles(circleX, circleY) {          //uDisplayCoords: [x1, y1, x2, y2],  Проверяем попадают ли кружки в рабочую зону и выбираем соответственно цвет
            var color;
            for (var i = 0; i < gs.aswCircles.length; i++) {            // aswCircles [circleX, circleY] - сверяем наш кружок со списком кружков попавших в asw_tot. если совпадает - останавливаем итерацию и возвращаем black. если не совпадает - возвращаем 359ccc
                var arr = gs.aswCircles[i];
                if ((circleX === arr[0]) && (circleY === arr[1])) {
                    color = "black";
                    return color;
                }
            }
            color = "#359ccc";
            return color;
        }
        
        return circles;

    }

    circlesVisibility() {                                   //выключаем кружки если мы выбрали нет поперечного армирования
        var string;
        if (this.props.globalState.shear_reinforcement) {
            string = "circles_bars";
        } else {
            string = "circles_bars invisible";
        }
        return string;
    }

    createOpenings() {                                      //рисуем отверстия
        var gs = this.props.globalState;
        var openings = [];
        var opening;

        for (var i = 1; i < gs.openingsDisplayString.length; i++) {
            opening = <polygon id={"svg_opening_" + i} key = {i + "svg_opn"} className = {(this.props.globalState.openingIsNear) ? "": "invisible"} style={{fill: "white", stroke: "blue", strokeWidth: "1"}} points={this.props.globalState.openingsDisplayString[i]} />;
            openings.push(opening);
        }
        return openings;
    }

    createOpeningsTangent() {                       //здесь мы рисуем касательные
        var gs = this.props.globalState;
        var tangents = [];
        var tangent;
        for (var i = 1; i < gs.opening_tangents.length; i++) {
            for (var k = 0; k < gs.opening_tangents[i].length; k++) {
                tangent = <line key = {"tang" + i + k} x1="250" y1="250" x2={gs.opening_tangents[i][k][0]} y2={gs.opening_tangents[i][k][1]} className = {(this.props.globalState.openingIsNear) ? "": "invisible"} style={{stroke: (this.props.globalState.op_tangents_show) ? "#00ff00" : "transparent", strokeWidth: "1"}} /> 
                tangents.push(tangent);
            }
        }
        return tangents;
    }

    createTangentIntersect() {
        var gs = this.props.globalState;
        var circles = [];
        var circle;
        for (var i = 0; i < gs.opening_tangents_intersect.length; i++) {
            for (var k = 0; k < gs.opening_tangents_intersect[i].length; k++) {
                if (gs.opening_tangents_intersect[i]) {
                    circle = <circle key = {"inters" + i + k} cx={gs.opening_tangents_intersect[i][k][0]} cy={gs.opening_tangents_intersect[i][k][1]} r="1" fill = "transparent" stroke = {(this.props.globalState.op_tangents_show) ? "red" : "transparent"} strokeWidth="1" className = {(this.props.globalState.openingIsNear) ? "": "invisible"}></circle>;
                    circles.push(circle);
                }
            }
        }
        return circles;
    }

    createOpeningTriangles() {                  //создаем треугольники которые будут закрывать часть контура продавливания, ограниченного касательными к отверстиям
        var gs = this.props.globalState;
        var triangles = [];
        var triangle;
        for (var i = 0; i < gs.tangents_triangles.length; i++) {
            triangle = <polygon key = {"triang_" + i} className = {(this.props.globalState.openingIsNear) ? "": "invisible"} style={{fill: "white", stroke: "transparent", strokeWidth: "1"}} points={this.props.globalState.tangents_triangles[i]} />;
            triangles.push(triangle);
        }
        return triangles;
    }

    zoomPlus() {
        var gs = this.props.globalState;
        this.props.onSketchChange({
            custom_scale: gs.custom_scale + 0.1
        });
    }

    zoomMinus() {
        var gs = this.props.globalState;
        this.props.onSketchChange({
            custom_scale: gs.custom_scale - 0.1
        });
    }

    zoomInitial() {
        this.props.onSketchChange({
            custom_scale: 1
        });

    }

    zoomPanelStyle1() {
        var gs = this.props.globalState;
        var style_obj = {};
        if (window.innerWidth >= 768) {
            switch(gs.svg_size) {
                case 500:
                    style_obj = {
                        top: "370px", 
                        right: "30px"
                    };
                    break;
                case 450:
                    style_obj = {
                        top: "320px", 
                        right: "30px"
                    };
                    break;
                case 400:
                    style_obj = {
                        top: "270px", 
                        right: "30px"
                    };
                    break;
                default:
                    style_obj = {
                        display: "none"
                    };
            }
        } else {
            style_obj = {
                display: "none"
            };
        }
       
        return style_obj;

    }

    zoomPanelStyle2() {
        var gs = this.props.globalState;
        var class_name = "";
        if ((gs.svg_size < 400) || (window.innerWidth) <= 767) {
            class_name = "d-flex justify-content-center mt-1"
        } else {
            class_name = "d-none"
        }
        return class_name;
    }

    render() {
        return (
            <div>
                <h5>Эскиз</h5>
                <svg id="svg_background" viewBox="0 0 500 500" width={this.props.globalState.svg_size} height={this.props.globalState.svg_size}>
                    <polygon id="svg_frame" style={{fill: "transparent", stroke: "black", strokeWidth: "2"}} points="0,0 500,0 500,500 0,500" />
                    <polygon id="svg_u" style={{fill: "transparent", stroke: (this.props.globalState.u_show) ? "#f04d2b" : "transparent", strokeWidth: "1"}} points={this.props.globalState.uDisplayString} />
                    {this.createOpeningTriangles()}
                    <polygon id="svg_slab_edge" style={{fill: "grey", stroke: "blue", strokeWidth: "1", fillOpacity: "0.1"}} points={this.props.globalState.slabEdgeString} />
                    {this.createOpenings()}
                    <polygon id="in_asw_square" style={{fill: "transparent", stroke: (this.props.globalState.in_out_asw_show) ? "orange" : "transparent", strokeWidth: "1"}} points={this.props.globalState.in_asw_square_string} />
                    <polygon id="out_asw_square" style={{fill: "transparent", stroke: (this.props.globalState.in_out_asw_show) ? "orange" : "transparent", strokeWidth: "1"}} points={this.props.globalState.out_asw_square_string} />
			        <polygon id="svg_column" style={{fill: "#C4C4F2", stroke: "#913939", strokeWidth: "3"}} points={this.props.globalState.columnDisplayString} />
                    <line x1="250" y1="20" x2="250" y2="480" style={{stroke: "#00ff00", strokeWidth: "1"}} />
                    <line x1="250" y1="20" x2="243" y2="35" style={{stroke: "#00ff00", strokeWidth: "1"}} />
                    <line x1="250" y1="20" x2="257" y2="35" style={{stroke: "#00ff00", strokeWidth: "1"}} />
                    <line x1="20" y1="250" x2="480" y2="250" style={{stroke: "#00ff00", strokeWidth: "1"}} />
                    <line x1="465" y1="243" x2="480" y2="250" style={{stroke: "#00ff00", strokeWidth: "1"}} />
                    <line x1="465" y1="257" x2="480" y2="250" style={{stroke: "#00ff00", strokeWidth: "1"}} />
                    <text x="220" y="30" fontFamily="Helvetica, Arial, sans-serif" fontSize="24" fill="black">Y</text>
                    <text x="460" y="230" fontFamily="Helvetica, Arial, sans-serif" fontSize="24" fill="black">X</text>
                    {this.createCircles()}
                    {this.createOpeningsTangent()}
                    {this.createTangentIntersect()}                    
		        </svg>

                <div className = "zoom_panel_1" style={this.zoomPanelStyle1()}>                         {/* эти кнопки появляются когда экран большой*/}
                    <div id="zoom_plus" className="zoom">
                        <i onClick = {this.zoomPlus} className="fas fa-search-plus"></i>
                    </div>
                    <div id="zoom_minus" className="zoom">
                        <i onClick = {this.zoomMinus} className="fas fa-search-minus"></i>
                    </div>
                    <div  id="zoom_initial" className="zoom">
                        <i onClick = {this.zoomInitial} className="fas fa-times"></i>
                    </div>
                </div>

                <div className={this.zoomPanelStyle2()}>                                             {/* эти кнопки появляются когда экран маленький*/}
                    <Button variant="success" className = "mr-2" onClick = {this.zoomPlus}><i className="fas fa-search-plus"></i></Button>
                    <Button variant="success" className = "mr-2" onClick = {this.zoomMinus}><i className="fas fa-search-minus"></i></Button>
                    <Button variant="success" className = "mr-2" onClick = {this.zoomInitial}><i className="fas fa-times"></i></Button>
                </div>                                            
            </div>
        );
    }
    
}

class SlabEdgeSelect extends React.Component {
    constructor(props) {
        super(props);
        this.handleSelect = this.handleSelect.bind(this);
        this.checkButtonNo = this.checkButtonNo.bind(this);
        this.checkButtonYes = this.checkButtonYes.bind(this);
    }

    handleSelect(e) {
        var myValue = (e.target.value === "true");
        var state = {
            slab_edge: myValue,
        };
        this.props.onSlabEdgeSelectChange(state);
    }

     // делаем скрыть/показать div на две кнопки  
    
     checkButtonNo() {
        var result = "";
        if (this.props.globalState.slab_edge) {       //если у нас есть край плиты, то кнопка нет активна, да неактивна
            result = "#slab_e";
        }
        return result;
    }

    checkButtonYes() {
        var result = "";
        if (!this.props.globalState.slab_edge) {     //если у нас  нет края плиты, то кнопка да активна, нет не активна
            result = "#slab_e";
        }
        return result;
    }

    render() {
        return (
            <div>
                <h5 className = "mt-3">Колонна рядом с краем плиты: {this.props.globalState.slab_edge ? "Да" : "Нет"}</h5>
                <div className="d-flex flex-column">
                    <ButtonGroup toggle>
                        <ToggleButton type="radio" data-toggle="collapse" data-target = {this.checkButtonNo()} name="radio" variant="info" defaultChecked value="false" onChange = {this.handleSelect}>
                            Нет
                        </ToggleButton>
                        <ToggleButton type="radio" data-toggle="collapse" data-target = {this.checkButtonYes()} name="radio" variant="info" value="true" onChange = {this.handleSelect}>
                            Да
                        </ToggleButton>
                    </ButtonGroup>
                </div>
            </div>
        );
    }
}

class SlabEdgeData extends React.Component {                     //колонна на краю плиты
    constructor(props) {
        super(props);
        this.state = {
            edge_left: false,
            edge_right: false,
            edge_top: false,
            edge_bottom:false
        }
        this.handleInput = this.handleInput.bind(this);
        this.handleCheckBox = this.handleCheckBox.bind(this);
        this.leftFocus = React.createRef();                                             //делаем так, чтобы при установки галочки, происходил автофокус соответствующего поля ввода
        this.rightFocus = React.createRef();
        this.topFocus = React.createRef();
        this.bottomFocus = React.createRef();
        this.focusInput = this.focusInput.bind(this);
    }

    handleInput(e) {
        var state = {
            [e.target.id]: Math.abs(Number(e.target.value)),
        };
        this.props.onSlabEdgeDataChange(state);
    }

    handleCheckBox(e) {
        var box = e.target.id;
        this.setState({[box]: !this.state[box]},() => {
                this.props.onSlabEdgeDataChange(this.state);
                this.focusInput(box);
            });    
    }

    focusInput(id) {                                                          //делаем автофокус на нужное поле ввода
        switch(id) {
            case "edge_left":
                this.leftFocus.current.focus();
                break;
            case "edge_right":
                this.rightFocus.current.focus();
                break;
            case "edge_top":
                this.topFocus.current.focus();
                break;
            case "edge_bottom":
                this.bottomFocus.current.focus();
                break;
            default:
                console.log("Чето не то=))");
        }
    }

    render() {
        return (
            <div className = "collapse" id="slab_e">
                <h5>Укажите расстояние от грани колонны до ближайшего края плиты</h5>
                <div className="form-group">
                    <input type="checkbox" id="edge_left" value="left" onChange={this.handleCheckBox}></input>
                    <label htmlFor="edge_left">Слева, {this.props.globalState.length_units}:</label>
                    <input type="number" step="0.0001" className="form-control" min="0" id="input_edge_left_dist" ref={this.leftFocus} disabled={!this.state.edge_left} onChange={this.handleInput}></input>
                </div>
                
                <div className="form-group">
                    <input type="checkbox" id="edge_right" value="right" onChange={this.handleCheckBox}></input>
                    <label htmlFor="edge_right">Справа, {this.props.globalState.length_units}:</label>
                    <input type="number" step="0.0001" className="form-control" min="0" id="input_edge_right_dist" ref={this.rightFocus} disabled={!this.state.edge_right} onChange={this.handleInput}></input>
                </div>

                <div className="form-group">
                    <input type="checkbox" id="edge_top" value="top" onChange={this.handleCheckBox}></input>
                    <label htmlFor="edge_top">Сверху, {this.props.globalState.length_units}:</label>
                    <input type="number" step="0.0001" className="form-control" min="0" id="input_edge_top_dist" ref={this.topFocus} disabled={!this.state.edge_top} onChange={this.handleInput}></input>
                </div>
               
                <div className="form-group">
                    <input type="checkbox" id="edge_bottom" value="bottom" onChange={this.handleCheckBox}></input>
                    <label htmlFor="edge_bottom">Снизу, {this.props.globalState.length_units}:</label>
                    <input type="number" step="0.0001" className="form-control" min="0" id="input_edge_bottom_dist" ref={this.bottomFocus} disabled={!this.state.edge_bottom} onChange={this.handleInput}></input>
                </div>
            </div>
        );
    }
}

function OpeningIsNearSelect(props) {                           // тут мы решили перейти на хуксы=))
    return (
        <div>
            <h5 className = "mt-3">Отверстие рядом с колонной: {props.globalState.openingIsNear ? "Да" : "Нет"}</h5>
            <div className="d-flex flex-column">
                <ButtonGroup toggle>
                    <ToggleButton type="radio" data-toggle="collapse" data-target = {checkButtonNo()} name="radio" variant="info" defaultChecked value="false" onChange = {handleSelect}>
                        Нет
                    </ToggleButton>
                    <ToggleButton type="radio" data-toggle="collapse" data-target = {checkButtonYes()} name="radio" variant="info" value="true" onChange = {handleSelect}>
                        Да
                    </ToggleButton>
                </ButtonGroup>
            </div>
        </div>
    );

    function handleSelect(e) {
        var myValue = (e.target.value === "true");
        var state = {
            openingIsNear: myValue,
        };
        props.onOpeningIsNearSelectChange(state);
    }

    // делаем скрыть/показать div на две кнопки  
    
    function checkButtonNo() {
        var result = "";
        if (props.globalState.openingIsNear) {       //если у нас есть отверстия, то кнопка нет активна, да неактивна
            result = "#opening_near";
        }
        return result;
    }

    function checkButtonYes() {
        var result = "";
        if (!props.globalState.openingIsNear) {     //если у нас  нет отверстий, то кнопка да активна, нет не активна
            result = "#opening_near";
        }
        return result;
    }
}

function OpeningIsNearData(props) {                             //отверстия рядом с колонной. Кажды раз когда реакт запускает обновление стейта мы проигрываем эту функцию (компонент) по новому.
    const [openings_number, setOpeningsNumber] = useState(["", 1]);             // эррей с номерами отверстий. Для удобства нумерация начинается с 1. Отверстие 1 - позиция 1. Позиция 0 символизирует что у нас нет отверстия под номером 0
    const [input_openings, setOpenings] = useState({                                  //объект с характеристиками отверстий
                                                a: [0, ""],                         //Размер вдоль оси Х. Позиция 0 забита нулями т.к. у нас нет отверстия номер 0. Сделано для упрощения понимания.
                                                b: [0, ""],                         //Размер вдоль оси Y
                                                X: [0, ""],                         //Привязка вдоль оси Х
                                                Y: [0, ""]                          //Привязка вдоль оси Y
                                                     });                                   

    function handleInput(e) {                                                           //обрабатываем ввод пользователя
        var value_type = e.target.id.substring(8, 9);                                    // тип принятых данных (ширина, длина, привязка отверстия);
        var op_number = Number(e.target.id.slice(e.target.id.lastIndexOf("_")+1));          //номер отверстия
        var new_op_chract = {...input_openings};                                                  //снимаем копию со старого объекта с характеристиками
        if (e.target.value === "") {                                                        //забиваем ввод пользователя в нужную ячейку
            new_op_chract[value_type][op_number] = "";
        } else {
            new_op_chract[value_type][op_number] = Number(e.target.value);
        }
        setOpenings(new_op_chract);                                                 //обновляем стейт новым объектом свойств
    }

    function addOpeningNumber() {                                                   //добавляем отверстие
        var opening_n = openings_number.length - 1;                   //получаем номер последнего отверстия
        opening_n++;                                                                    //прибавляем 1 - получаем номер нового отверстия
        var new_openings_number = [...openings_number];                                  //снимаем копию со старого эррея с номерами отверстий
        new_openings_number.push(opening_n);                                            //добавляем в него номер нового отверстия
        setOpeningsNumber(new_openings_number);                                         //обновляем стейт новым эрреем отверстий

        var new_openings = {...input_openings};                                       //снимаем копию с эррея с характеристиками отверстий
        var id;                                                     
        for (id in new_openings) {
            new_openings[id][opening_n] = "";                            // забиваем ряд пустых характеристик для нового отверстия. Это нужно чтобы при первом вводе характеристик в новое отверстие исключить предупреждение что "A component is changing an uncontrolled input of type number to be controlled"
        }
        setOpenings(new_openings);
        
    }

    function removeOpeningNumber(e) {                                        //удаляем отверстие
        if (openings_html.length === 2) {                                       // если у нас осталось последнее отверстие - просто сворачиваем панель отверстий
            props.onOpeningIsNearChange({openingIsNear: false});
        } else {
            var op_remove = Number(e.target.id.substring(9));                    //получаем номер отверстия;
            var new_openings_number = [...openings_number];                     //снимаем копию со старого эррея с номерами отверстий
            new_openings_number[op_remove] = "removed"
            setOpeningsNumber(new_openings_number);                             //обновляем эррей номеров отверстий

            var new_openings = {...input_openings};                                  //снимаем копию с эррея с характеристиками отверстий
            var id;                                                     
            for (id in new_openings) {
                new_openings[id][op_remove] = "";                              //характеристики забиваем пустыми строками
            }
            setOpenings(new_openings);                                        //обновляем стейт новым объектом свойств
        }
    }

    useEffect(() => {                                       //каждый раз, когда характеристики отверстий меняются мы отправляем характеристики отверстий в глобальный стейт
        props.onOpeningIsNearChange({input_openings: input_openings});
    }, [input_openings]);

    const openings_html = [""];                                             //каждый раз при ререндере мы создаем отверстия заново из эррея номеров отверстий и объекта содержащего характеристики отверстий
    var nbr = 1;                                                                //номер отверстия для отображения
    for (let i = 1; i < openings_number.length; i++) {
        if (openings_number[i] !== "removed") {                             //удаленные отверстия не создаем
            var new_opening =  
                <fieldset id={"opening_" + i} key = {i + "opn"} className="border p-3 mb-3">
                    <button type="button" className={(nbr === 1) ? "close invisible" : "close"} aria-label="Close" onClick = {removeOpeningNumber}>
                        <span id={"op_close_" + i} aria-hidden="true">&times;</span>
                    </button>
                    <h5>Отверстие {nbr}</h5>
                    <div className="form-group">
                        <label htmlFor = {"opening_a_" + i}>Размер вдоль оси Х, {props.globalState.length_units}:</label>
                        <input type="number" step="0.0001" className="form-control" min="0" id={"opening_a_" + i} value = {input_openings.a[i]} onChange={handleInput}></input>         {/* элементы помнят ввод пользователя (value) - -получают его из стейта */}
                    </div>
                    <div className="form-group">
                        <label htmlFor = {"opening_b_" + i}>Размер вдоль оси Y, {props.globalState.length_units}:</label>
                        <input type="number" step="0.0001" className="form-control" min="0" id={"opening_b_" + i} value = {input_openings.b[i]} onChange={handleInput}></input>
                    </div>
                    <div className="form-group">
                        <label htmlFor = {"opening_X_" + i}>Привязка вдоль оси Х, {props.globalState.length_units}:</label>
                        <input type="number" step="0.0001" className="form-control" id = {"opening_X_" + i} value = {input_openings.X[i]} onChange = {handleInput}></input>
                    </div>
                    <div className="form-group">
                        <label htmlFor = {"opening_Y_" + i}>Привязка вдоль оси Y, {props.globalState.length_units}:</label>
                        <input type="number" step="0.0001" className="form-control" id = {"opening_Y_" + i} value = {input_openings.Y[i]} onChange = {handleInput}></input>
                    </div>
                </fieldset>;
            openings_html.push(new_opening);
            nbr++;
        }
    }

    return (
        <div className = "collapse" id="opening_near">                                                           
            <h5>Укажите размер отверстия, а также привязку центра отверстия к центру колонны</h5>
            {openings_html}
            <Button variant="success" onClick = {addOpeningNumber}>Добавить отверстие</Button>
        </div>
    )
}

class Result extends React.Component {                      // строка с результатом
    render() {
        return (
            <div className = {((window.innerHeight > 830) || (this.props.globalState.v_width <=768) ) ? "result_block" : "invisible"} >
                <h5>Результат</h5>
                <Alert className = "result_alert" variant={this.props.globalState.result_color}>
                    {this.props.globalState.text_result}
                </Alert>
            </div>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
);