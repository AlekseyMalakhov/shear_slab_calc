import { Canvg } from "canvg";

export function checkDataAdequacy(state) {
    // проверяем достаточность исходных данных. Если каких то данных нет - добавляем их в результат
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
        if (
            !state[id] &&
            id !== "shear_reinforcement" && // тут мы проверяем незаполненные поля, кроме исключений, таких как shear_reinforcement, asw_tot и необязательных, таких как mx_load
            id !== "slab_edge" &&
            id !== "openingIsNear" &&
            id !== "mx_load" &&
            id !== "my_load" &&
            id !== "input_mx_load" &&
            id !== "input_my_load" &&
            id !== "asw_tot" &&
            id !== "edge_left" &&
            id !== "edge_right" &&
            id !== "edge_top" &&
            id !== "edge_bottom" &&
            id !== "input_edge_left_dist" &&
            id !== "input_edge_right_dist" &&
            id !== "input_edge_top_dist" &&
            id !== "input_edge_bottom_dist" &&
            id !== "edge_left_dist" &&
            id !== "edge_right_dist" &&
            id !== "edge_top_dist" &&
            id !== "edge_bottom_dist" &&
            id !== "out_asw_square" &&
            id !== "out_asw_square_string" &&
            id !== "in_asw_square" &&
            id !== "in_asw_square_string" &&
            id !== "svg_position_fixed" &&
            id !== "slab_edge_type" &&
            id !== "show_help" &&
            id !== "u_show" &&
            id !== "in_out_asw_show" &&
            id !== "op_tangents_show" &&
            id !== "merged_angls" &&
            id !== "n_load" &&
            id !== "t_slab_size" &&
            id !== "a_slab_size" &&
            id !== "v_width"
        ) {
            // console.log("id = " + id);
            result.push(names[id]); //если в state есть незаполненная графа - добавляем её в результат
        }
    }
    if (state.a_column_size === 1) {
        result.push(names.a_column_size);
    }
    if (state.b_column_size === 1) {
        result.push(names.b_column_size);
    }
    /*
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
    */
    if (
        (state.shear_reinforcement && state.shear_bars_number.X.length - 1 !== state.shear_bars_row_number) ||
        (state.shear_reinforcement && state.shear_bars_number.Y.length - 1 !== state.shear_bars_row_number) ||
        (state.shear_reinforcement && state.input_shear_bars_spacing_to_prev.length - 1 !== state.shear_bars_row_number) ||
        (state.shear_reinforcement && state.aswCircles.length === 0 && state.circlesX.length > 0)
    ) {
        //если мы считаем поперечку и не заполнены все столбцы то ошибка
        result.push("характеристики армирования");
    }
    // console.log(result);
    return result;
}

export function createInsufficientPhrase(result) {
    // компануем фразу со списком нехватающих данных. берем array с названиями незаполненных граф
    // console.log(result);
    var phrase = "";
    result.forEach((item, index) => {
        if (index === 0) {
            // если в эррэе только 1 элемент  - берем его и все.
            phrase = item;
        } else {
            //для последующих берем старую фразу, добавляем запятую и только после неё вставляем название незаполненной графы
            phrase = phrase + ", " + item;
        }
    });
    return phrase;
}

export function findIntersect(u_line, tangent) {
    // line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
    var x1 = u_line[0];
    var y1 = u_line[1];
    var x2 = u_line[2];
    var y2 = u_line[3];

    var x3 = tangent[0];
    var y3 = tangent[1];
    var x4 = tangent[2];
    var y4 = tangent[3];

    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
        // Check if none of the lines are of length 0
        return false;
    }
    var denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

    if (denominator === 0) {
        // Lines are parallel
        return false;
    }

    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        // is the intersection along the segments
        return false;
    }

    let x = x1 + ua * (x2 - x1); // Return an array with the x and y coordinates of the intersection
    x = Number(x.toFixed(3));
    let y = y1 + ua * (y2 - y1);
    y = Number(y.toFixed(3));
    return [x, y];
}

export function findAngleReal(coords) {
    //находим углы относительно 0,0. findAngle и findAngleReal эти две функции одинаковые по сути и их можно (НУЖНО!) в будущем объединить в одну. Щас просто нет времени
    var result;
    if (coords.length !== 2) {
        result = 1;
        return result;
    }
    var angle = (Math.atan(coords[0] / coords[1]) * 180) / Math.PI;
    if (coords[0] >= 0 && coords[1] >= 0) {
        // право верх
        result = angle;
    }
    if (coords[0] > 0 && coords[1] < 0) {
        // право низ
        result = angle + 180;
    }
    if (coords[0] <= 0 && coords[1] < 0) {
        // лево низ
        result = angle + 180;
    }
    if (coords[0] < 0 && coords[1] >= 0) {
        // лево верх
        result = angle + 360;
    }
    result = Number(result.toFixed(3));
    return result; //округляем до 3 знака после запятой
}

function findAngle(coords) {
    //находим углы относительно 250,250
    var BC = Math.sqrt(Math.pow(250 - coords[0], 2) + Math.pow(250 - coords[1], 2));
    var AC = Math.sqrt(Math.pow(coords[0] - 250, 2) + Math.pow(coords[1], 2));
    var angle = Math.acos((BC * BC + 250 * 250 - AC * AC) / (2 * BC * 250)) * (180 / Math.PI);
    if (coords[0] < 250) {
        //если слева от оси У то прибавляем угол справа, чтобы угол всегда отсчитывался от вертикали по часовой стрелке
        angle = 180 + (180 - angle);
    }
    return Number(angle.toFixed(3)); //округляем до 3 знака после запятой
}

export function checkOpeningDistance(st, opening_number) {
    //проверяем данное отверстие, расположено ли оно достаточно близко чтобы мы его учитывали в расчете
    //Сначало замеряем расстояние между всеми точками колонны и всеми точками отверстия. Результат каждого замера сверяем с 6h. Если все ок, замеряем расстояние между всеми точками колонны и всеми линиями отверстия. После каждого замера сверяем результат с 6h
    //openingsDisplayCoords: [x1, y1, x2, y2], координаты прямоугольника отверстия для отображения
    var c_cord = st.columnRealCoords; //реальные координаты углов колонны
    var o_cord = st.openingsRealCoords[opening_number]; //реальные координаты углов отверстия

    var c_cord_p1 = [c_cord[0], c_cord[1]]; //точка колонны x1, y1
    var c_cord_p2 = [c_cord[2], c_cord[1]]; //точка колонны x2, y1
    var c_cord_p3 = [c_cord[2], c_cord[3]]; //точка колонны x2, y2
    var c_cord_p4 = [c_cord[0], c_cord[3]]; //точка колонны x1, y2

    var o_cord_p1 = [o_cord[0], o_cord[1]]; //точка отверстия x1, y1
    var o_cord_p2 = [o_cord[2], o_cord[1]]; //точка отверстия x2, y1
    var o_cord_p3 = [o_cord[2], o_cord[3]]; //точка отверстия x2, y2
    var o_cord_p4 = [o_cord[0], o_cord[3]]; //точка отверстия x1, y2

    var c_cord_points = [c_cord_p1, c_cord_p2, c_cord_p3, c_cord_p4]; //эррей точек колонны
    var o_cord_points = [o_cord_p1, o_cord_p2, o_cord_p3, o_cord_p4]; //эррей точек отверстия

    var dist;
    /*
    var distance = [];
    */

    // сначало проверяем расстояние от всех точек колонны до всех точек отверстия

    for (var i = 0; i < c_cord_points.length; i++) {
        //рассчитываем расстояние между всем точками колонны и всеми точками отверстия и сверяем его с 6h. Если оно меньше - сразу возвращаем true и останавливаем итерацию
        for (var k = 0; k < o_cord_points.length; k++) {
            dist = distanceTwoPoints(c_cord_points[i], o_cord_points[k]);
            /*
            distance.push(dist);
            // console.log(distance);
            */
            if (dist < 6 * st.t_slab_size) {
                return true;
            }
        }
    }

    // теперь проверяем расстояние от всех точек колонны до всех линий отверстия

    var o_cord_l1 = [o_cord[0], o_cord[1], o_cord[2], o_cord[1]]; //линия отверстия [x1, y1, x2, y1]
    var o_cord_l2 = [o_cord[2], o_cord[1], o_cord[2], o_cord[3]]; //линия отверстия [x2, y1, x2, y2]
    var o_cord_l3 = [o_cord[2], o_cord[3], o_cord[0], o_cord[3]]; //линия отверстия [x2, y2, x1, y2]
    var o_cord_l4 = [o_cord[0], o_cord[3], o_cord[0], o_cord[1]]; //линия отверстия [x1, y2, x1, y1]

    var o_cord_lines = [o_cord_l1, o_cord_l2, o_cord_l3, o_cord_l4];

    for (var j = 0; j < c_cord_points.length; j++) {
        //рассчитываем расстояние между всем точками колонны и всеми линиями отверстия и сверяем его с 6h. Если оно меньше - сразу возвращаем true и останавливаем итерацию
        for (var f = 0; f < o_cord_lines.length; f++) {
            dist = pDistance(c_cord_points[j], o_cord_lines[f]);
            /*
            distance.push(dist);
            // console.log(distance);
            */
            if (dist < 6 * st.t_slab_size) {
                return true;
            }
        }
    }

    return false;
}

function distanceTwoPoints(point1, point2) {
    // point1 = [x1, y1], point2 = [x2, y2]
    var x1 = point1[0];
    var y1 = point1[1];
    var x2 = point2[0];
    var y2 = point2[1];
    var a = x1 - x2;
    var b = y1 - y2;
    var dist = Math.sqrt(a * a + b * b);
    dist = Number(dist.toFixed(2)); //округляем
    return dist;
}

function pDistance(point, line) {
    //from here https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
    var A = point[0] - line[0]; // point = [x, y]
    var B = point[1] - line[1]; // line = [x1, y1, x2, y2]
    var C = line[2] - line[0];
    var D = line[3] - line[1];

    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq !== 0)
        //in case of 0 length line
        param = dot / len_sq;

    var xx, yy;

    if (param < 0) {
        xx = line[0];
        yy = line[1];
    } else if (param > 1) {
        xx = line[2];
        yy = line[3];
    } else {
        xx = line[0] + param * C;
        yy = line[1] + param * D;
    }

    var dx = point[0] - xx;
    var dy = point[1] - yy;

    var dist = Math.sqrt(dx * dx + dy * dy);
    dist = Number(dist.toFixed(3)); //округляем
    return dist;
}

function checkOverlap(t1, t2) {
    //проверяем 2 треугольника - не накладываются ли они
    var int = [];
    var t1_1, t1_2, t1_3; //линии составляющие 1 и 2 треугольник
    var t2_1, t2_2, t2_3;

    t1_1 = [0, 0, t1[0], t1[1]]; //линии составляющие 1 треугольник - эррей [x1, y1, x2, y2]
    t1_2 = [0, 0, t1[2], t1[3]];
    t1_3 = [t1[0], t1[1], t1[2], t1[3]];

    t2_1 = [0, 0, t2[0], t2[1]]; //линии составляющие 1 треугольник - эррей [x1, y1, x2, y2]
    t2_2 = [0, 0, t2[2], t2[3]];
    t2_3 = [t2[0], t2[1], t2[2], t2[3]];

    var lines1 = [t1_1, t1_2, t1_3];
    var lines2 = [t2_1, t2_2, t2_3];

    for (var i = 0; i < lines1.length; i++) {
        //если хоть 1 линия пересекается - треугольникик наложились
        for (var j = 0; j < lines2.length; j++) {
            int = findIntersect(lines1[i], lines2[j]);
            if (int && int[0] !== 0 && int[1] !== 0) {
                /*
                // console.log("Линия 1_" + i + " и линия 2_" + j + " пересеклись");
                // console.log("Точка пересечения " + int);
                */
                return true;
            }
        }
    }
    return false;
}

function sumTriangles(angles) {
    //складываем 2 наложившихся треугольника вместе и получаем итоговый треугольник
    /*
    var angles = [242.632, 128.66, 214.695, 67.62];
    */
    var triang_fin = []; // итоговый треугольник получаемый после слияния двух пересекающихся треугольников
    // чтобы все хорошо работало упорядочиваем наши углы в нужном порядке для каждого отверстия - сначало маленький угол - потом большой.
    var tang0 = Math.min(angles[0], angles[1]); //отверстие 1
    var tang1 = Math.max(angles[0], angles[1]);
    var tang2 = Math.min(angles[2], angles[3]); //отверстие 2
    var tang3 = Math.max(angles[2], angles[3]);
    /*
    // console.log(tang0 + ", " + tang1 + ", " + tang2 + ", " + tang3);
    */
    //если стандартный случай, т.е. сравниваемые отверстия полностью лежат в 1, 2, 3 или 4 квадранте
    //т.е. если первое отверстие не лежит на половину в 1 на половину во 2 квадранте
    // и если второе отверстие не лежит на половину в 1 на половину во 2 квадранте
    if (!(tang0 < 90 && tang1 > 270) && !(tang2 < 90 && tang3 > 270)) {
        triang_fin[0] = Math.min(tang0, tang1, tang2, tang3); //первая сторона треугольника (маленький угол)
        triang_fin[1] = Math.max(tang0, tang1, tang2, tang3); //вторая сторона треугольника (большой угол)
    } else {
        // если отверстие лежит на половину в 1 и на половину во 2 квадранте
        // в нестандартном случае у нас всегда часть углов лежит в 1 квадранте, часть во 2
        // в 1 квадранте мы выбираем угол с максимальным значением, во 2 квадранте выбираем угол с минимальным значением

        // сначало смотрим какие у нас углы лежат в 1 квадранте, какие во втором.
        var tngs = [tang0, tang1, tang2, tang3]; // кидаем наши углы в эррей
        var non_st = {
            // здесь будут отсортированы углы нестандартного случая
            fst_quad: [], // 1 квадрант
            snd_quad: [], // 2 квадрант
        };
        for (var s = 0; s < tngs.length; s++) {
            // и проходимся по ним проверкой
            if (tngs[s] > 0 && tngs[s] <= 90) {
                non_st.fst_quad.push(tngs[s]); // если угол в первом квадранте то добавляем его в список первого квадранта
            } else {
                non_st.snd_quad.push(tngs[s]); // если угол во втором то добавляем его в список второго квадранта
            }
        }
        triang_fin[0] = Math.min(...non_st.snd_quad); //первая сторона треугольника находится во 2 квадранте - выбираем самый маленький угол
        triang_fin[1] = Math.max(...non_st.fst_quad); //вторая сторона треугольника находится в 1 квадранте - выбираем самый большой угол
    }
    return triang_fin;
}

function merge(angles) {
    //1 проходка на слияние
    /*  [
        [67.62, 298.301]
        [332.103, 214.695]
        [242.632, 128.66]
         ]        
    */
    var new_angles = [...angles]; // здесь мы формируем новый эррей со слитыми треугольниками
    var triang_1 = [];
    var triang_2 = [];
    var merged_angles = [];
    var sum_angles = [];
    var angle1_1, angle1_2;
    var angle2_1, angle2_2;
    var coord1_1, coord1_2;
    var coord2_1, coord2_2;
    var items_to_delete = [];
    for (var i = 0; i < angles.length; i++) {
        //берем отверстие 1
        for (var j = i + 1; j < angles.length; j++) {
            //берем отверстие 2
            angle1_1 = angles[i][0]; //здесь мы берем первую касательную 1 отверстия и записываем её угол
            angle1_2 = angles[i][1]; //здесь мы берем вторую касательную 1 отверстия и записываем её угол
            angle2_1 = angles[j][0]; //здесь мы берем первую касательную 2 отверстия и записываем её угол
            angle2_2 = angles[j][1]; //здесь мы берем вторую касательную 2 отверстия и записываем её угол

            coord1_1 = findAngleCoords(angle1_1, 10000); //находим координаты второй точки 1 касательной 1 отверстия на расстоянии 10000
            coord1_2 = findAngleCoords(angle1_2, 10000); //находим координаты второй точки 2 касательной 1 отверстия на расстоянии 10000
            coord2_1 = findAngleCoords(angle2_1, 10000); //находим координаты второй точки 1 касательной 2 отверстия на расстоянии 10000
            coord2_2 = findAngleCoords(angle2_2, 10000); //находим координаты второй точки 2 касательной 2 отверстия на расстоянии 10000

            triang_1 = [coord1_1[0], coord1_1[1], coord1_2[0], coord1_2[1]]; //треугольник 1 отверстия [x1, y1, x2, y2]. Третья точка 0,0
            triang_2 = [coord2_1[0], coord2_1[1], coord2_2[0], coord2_2[1]]; //треугольник 2 отверстия [x1, y1, x2, y2]. Третья точка 0,0
            if (checkOverlap(triang_1, triang_2)) {
                // console.log("Отверстия " + i + " и " + j + " накладываются");
                //делаем список удаляемых элементов, (мы не можем просто удалитиь вот так new_angles.splice(i, 1); new_angles.splice(j, 1);)
                //потому что после первого удаления нарушается нумерация эррея
                //мы булем использовать функцию удаления с while. Для этього нам нужно отсортировать номера удаляемых элементов по возрастанию
                items_to_delete = [i, j];
                items_to_delete.sort((a, b) => a - b); //эта функция отсортировывает элемнты по возрастанию
                while (items_to_delete.length) {
                    //удаляем наложившиеся отверстия
                    new_angles.splice(items_to_delete.pop(), 1);
                }
                merged_angles = [angle1_1, angle1_2, angle2_1, angle2_2]; // углы наложившихся треугольников (уг1_1, уг1_2, уг2_1, уг2_2);
                sum_angles = sumTriangles(merged_angles);
                new_angles.push(sum_angles);
                return new_angles;
            } else {
                // console.log("Отверстия " + i + " и " + j + " не накладываются");
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

// console.log(merge(merge_test));
*/

// var pass;  число проходок по эррею отверстий (просто для информации в console.log)

export function mergeOpenings(opening_tangents) {
    //пробуем слить пересекающиеся все треугольники касательных  в один
    var prelim_result_new = []; // предварительный результат новый - эррей с углами
    var prelim_result_old = []; // предварительный результат старый - эррей с углами
    var angle1;
    var angle2;
    var angles = []; //сюда скинем все углы касательных
    var a = 0;
    //pass = 1;

    for (var i = 1; i < opening_tangents.length; i++) {
        //берем отверстие
        if (opening_tangents[i].length >= 2) {
            // если у нас вообще отверстие имеется в наличии и присчитаны две касательные. (Могут быть кстати и 3 при сторонах отверстий лежащих на осях Х и У когда касательные проведенные из двух точек имеют одинаковый угол)
            angle1 = opening_tangents[i][0][2]; //здесь мы берем первую касательную каждого отверстия и записываем её угол
            angle2 = opening_tangents[i][1][2]; //здесь мы берем вторую касательную каждого отверстия и записываем её угол
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
    prelim_result_new = merge(angles); //делаем первую проходку - проходимся по всем углам, пробуем найти наложение

    //pass++;
    // если наложения нашли, значчит мы получили новый треугольник (и удалили два старых) - следовательно нужно еще раз пропустить этот блок кода
    // (вдруг новый треугольник перексекается еще с кем то) - следовательно гоняем этот блок кода, до тех пор, пока не найдем все пересечения
    while (prelim_result_new.length < prelim_result_old.length) {
        //если новый эррей углов стал меньше старого (наши слияние) пробуем еще раз
        prelim_result_old = [...prelim_result_new]; // снимаем копию с текущего результата
        prelim_result_new = merge(prelim_result_new);
        // pass++;
        // if (pass === 50) {
        //     return;
        // }
    }

    if (prelim_result_new.length === prelim_result_old.length) {
        // если слияние не нашли (или слияний больше нет) старый эррей равен новому - возвращаем что получили
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

    // console.log(test_res);
*/

export function tangCenter(opening_tangents) {
    //найдем биссектрису угла между крайними касательными к отверсти
    // находим координаты касательных на расстоянии 10000 используя функцию findAngleCoords
    // находим координату центра между двумя точками используя функцию findCenter
    // находим угол данной точки используя функцию findAngleReal
    var result = [0];
    var angle1;
    var angle2;
    var coord1, coord2, center;
    for (var i = 1; i < opening_tangents.length; i++) {
        //берем отверстие
        if (opening_tangents[i].length === 2) {
            angle1 = opening_tangents[i][0][2]; //здесь мы берем первую касательную каждого отверстия и записываем её угол
            angle2 = opening_tangents[i][1][2]; //здесь мы берем вторую касательную каждого отверстия и записываем её угол
            // console.log("i = " + i + ", " + angle1 + ", " + angle2);
            coord1 = findAngleCoords(angle1, 10000); //находим координаты второй точки касательной на расстоянии 10000
            coord2 = findAngleCoords(angle2, 10000);
            center = findCenter(coord1, coord2); //находим координаты центра между этими двумя точками
            result[i] = findAngleReal(center); //находим угол к данной точке
            /*
            // console.log(i + " _ " + angle1 + ", " + angle2);
            // console.log(i + " _ " + coord1 + ", " + coord2);
            // console.log(i + " _ " + center);
            // console.log(i + " _ " + result[i]);
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
// console.log(testtangCenter);
*/

function findAngleCoords(angle, dist) {
    // находим координаты точки от 0,0 по углу и расстоянию
    var x = dist * Math.sin((angle * Math.PI) / 180); // находим координаты второй точки касательной например на расстоянии 10000 мм
    x = Number(x.toFixed(3)); //округляем
    var y = dist * Math.cos((angle * Math.PI) / 180);
    y = Number(y.toFixed(3));
    var result = [x, y];
    return result;
}

export function findUIntersectPoints(angles, uRealCoords) {
    //находим реальные координаты пересечения u и касательных. Примем центр как 0,0
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
    u_lines[0] = [u[0], u[1], u[2], u[1]]; //линии u
    u_lines[1] = [u[2], u[1], u[2], u[3]];
    u_lines[2] = [u[2], u[3], u[0], u[3]];
    u_lines[3] = [u[0], u[3], u[0], u[1]];

    var x, y;
    var line_coords = [];
    var inters_0, inters_1, inters_2, inters_3;

    var intersection = [];
    for (var i = 0; i < angles.length; i++) {
        //номер отверстия (слитого или реального)
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
            line_coords = [0, 0, x, y]; // находим координаты второй точки касательной например на расстоянии 10000 мм [x1, y1, x2, y2]

            // пытаемся найти пересечение касательной со сторонами u
            // касательная, может пересечься только с 1 линией u. Если она пересекается с двумя линиями u, значит она проходит через угол u.
            // в таком случае мы берем пересечение только с 1 стороной u.
            inters_0 = findIntersect(u_lines[0], line_coords);
            if (inters_0) {
                intersection[i].push(inters_0);
                // console.log("отверстие " + i + ", касательная " + k + ", пересеклась с линией u 0");
                // если мы находим пересечение с одной стороной, мы выскакиваем из этой итерации данного лупа, чтобы
                // не получить второе совпадение, если у нас касательная проходит через угол u, т.е. пересекается с двумя сторонами u.
                continue;
            }

            inters_1 = findIntersect(u_lines[1], line_coords);
            if (inters_1) {
                intersection[i].push(inters_1);
                // console.log("отверстие " + i + ", касательная " + k + ", пересеклась с линией u 1");
                continue;
            }

            inters_2 = findIntersect(u_lines[2], line_coords);
            if (inters_2) {
                intersection[i].push(inters_2);
                // console.log("отверстие " + i + ", касательная " + k + ", пересеклась с линией u 2");
                continue;
            }

            inters_3 = findIntersect(u_lines[3], line_coords);
            if (inters_3) {
                intersection[i].push(inters_3);
                // console.log("отверстие " + i + ", касательная " + k + ", пересеклась с линией u 3");
                continue;
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
// console.log(test3int);

*/

function findCenter(p1, p2) {
    //найти центр линии между двумя точками
    var result = [];
    result[0] = (p1[0] + p2[0]) / 2; //х
    result[1] = (p1[1] + p2[1]) / 2; //y
    result[0] = Number(result[0].toFixed(2));
    result[1] = Number(result[1].toFixed(2));
    return result;
}

function findDirection(p1, p2) {
    //найти направление линии вырубки (верт/горизонт)
    var result;
    if (p1[0] === p2[0] && p1[1] !== p2[1]) {
        result = "vert";
    }
    if (p1[0] !== p2[0] && p1[1] === p2[1]) {
        result = "horiz";
    }
    if (p1[0] === p2[0] && p1[1] === p2[1]) {
        // если ширина вырубки = 0, например касательная попала точно на угол u
        result = "NO_REZ";
    }
    return result;
}

function calculateCutOff(int_point_1, int_point_2) {
    //считаем характеристики вырубок
    var result = {
        cut_u: 0,
        cut_ibx: 0,
        cut_iby: 0,
        cut_sx: 0,
        cut_sy: 0,
        cut_mid: "",
        dir: "",
    };
    var cut_off; //размер вырубки
    var cut_mid; //координаты центра вырубаемой линии
    var ibx_cut, iby_cut, sx_cut, sy_cut; // характеристики вырубки
    var dir; //направление линии вырубки (вертикальное/горизонтальное)

    cut_off = distanceTwoPoints(int_point_1, int_point_2); // посчитали длину вырубки
    // console.log("cut_off = " + cut_off);
    result.cut_u = cut_off;

    cut_mid = findCenter(int_point_1, int_point_2); // координата центра вырубки
    dir = findDirection(int_point_1, int_point_2); // направление вырубки
    if (dir === "vert") {
        //считаем характеристики вырубки
        ibx_cut = cut_off * Math.pow(cut_mid[0], 2);
        ibx_cut = Math.floor(ibx_cut);
        result.cut_ibx = ibx_cut;
        iby_cut = Math.pow(cut_off, 3) / 12 + cut_off * Math.pow(cut_mid[1], 2);
        iby_cut = Math.floor(iby_cut);
        result.cut_iby = iby_cut;
    }
    if (dir === "horiz") {
        ibx_cut = Math.pow(cut_off, 3) / 12 + cut_off * Math.pow(cut_mid[0], 2);
        ibx_cut = Math.floor(ibx_cut);
        result.cut_ibx = ibx_cut;
        iby_cut = cut_off * Math.pow(cut_mid[1], 2);
        iby_cut = Math.floor(iby_cut);
        result.cut_iby = iby_cut;
    }
    if (dir === "NO_REZ") {
        //если ширина вырубки = 0, например касательная попала точно на угол u
        ibx_cut = 0;
        result.cut_ibx = ibx_cut;
        iby_cut = 0;
        result.cut_iby = iby_cut;
    }
    sx_cut = cut_off * cut_mid[0];
    sx_cut = Math.floor(sx_cut);
    result.cut_sx = sx_cut;
    sy_cut = cut_off * cut_mid[1];
    sy_cut = Math.floor(sy_cut);
    result.cut_sy = sy_cut;
    result.cut_mid = cut_mid; //для отчета Word
    result.dir = dir;

    return result;
}

/*  определяем положение массива отверстий относительно тангент
function findPosition(int_point_1_ang, int_point_2_ang, mid_tans, opening_tangents) {         //определяем положение массива отверстий относительно тангент. Т.е. при одном и том же угле, вырубать по малому или большому радиусу
    // console.log(int_point_1_ang);
    // console.log(int_point_2_ang);
    // console.log(mid_tans);
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
    // console.log(check);
    // console.log(result);
    return result;
}
*/

function ptInTriangle(p, p0, p1, p2) {
    //находит, лежит ли точка внутри треугольника. Взята от сюда http://jsfiddle.net/PerroAZUL/zdaY8/1/
    var A = (1 / 2) * (-p1.y * p2.x + p0.y * (-p1.x + p2.x) + p0.x * (p1.y - p2.y) + p1.x * p2.y);
    var sign = A < 0 ? -1 : 1;
    var s = (p0.y * p2.x - p0.x * p2.y + (p2.y - p0.y) * p.x + (p0.x - p2.x) * p.y) * sign;
    var t = (p0.x * p1.y - p0.y * p1.x + (p0.y - p1.y) * p.x + (p1.x - p0.x) * p.y) * sign;

    return s > 0 && t > 0 && s + t < 2 * A * sign;
}

function createCornerList(u_corners, triangles) {
    // создаем список выбитых углов для каждого отверстия
    var p0 = {
        x: 0,
        y: 0,
    };
    var p, p1, p2; // р0, р1, р2 - координаты треугольника, р - координаты точки
    var corner_list = []; //список попавших углов
    var pInTrng; //булеан - попал/не попал

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
                corner_list[b].push(c); //если угол попал - добавляем его в список для данного отверстия
            }
        }
    }
    return corner_list;
}

export function addCornersU(coords, uRealCoords, merged_angls) {
    //проверяем находятся ли реальные координаты углов u внутри треугольника касательных.
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
    var u_corners = []; //реальные координаты углов u
    var result = {
        angles: [],
        cut_u: [],
        cut_ibx: [],
        cut_iby: [],
        cut_sx: [],
        cut_sy: [],
        cut_midX: [],
        cut_midY: [],
        dir: [],
    };

    u_corners[0] = [u[0], u[1]];
    u_corners[1] = [u[2], u[1]];
    u_corners[2] = [u[2], u[3]];
    u_corners[3] = [u[0], u[3]];

    var int_point_1_ang, int_point_2_ang;
    var char, char1, char2, char3; //характеристики вырубки
    var c_point, c_point1, c_point2; //промежуточные точки для расчета

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

        var corner_list = createCornerList(u_corners, triangles); //делаем список выбитых углов для каждого отверстия
        // console.log(corner_list);

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
            // console.log(merged_angls[a][0] + ", " + merged_angls[a][1] + ", " + int_point_1_ang);
            int_point_2_ang = Math.max(merged_angls[a][0], merged_angls[a][1]);

            if (corner_list[a].length !== 0) {
                // если отверстие выбивает углы
                calcCornersCuts(corner_list[a], coords[a][0], coords[a][1]);
            } else {
                //если отверстие не выбивает углы
                char = calculateCutOff(coords[a][0], coords[a][1]); //считаем характеристики вырубки
                fillResult(char); // и забиваем их в result
                result.angles.push([int_point_1_ang, int_point_2_ang]); //вбиваем углы данного участка, чтобы потом вычислить какие арматурины он вышибает
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

        if (cor_num_list.length === 1) {
            // если выбит 1 угол то
            c_point = u_corners[cor_num_list[0]]; //координаты выбитого угла
            char1 = calculateCutOff(int_point_1, c_point); //считаем характеристики вырубки 1
            fillResult(char1); // и забиваем их в result
            char2 = calculateCutOff(int_point_2, c_point); //считаем характеристики вырубки 2
            fillResult(char2);
            result.angles.push([int_point_1_ang, int_point_2_ang]); //вбиваем углы данного участка, чтобы потом вычислить какие арматурины он вышибает
        }
        if (cor_num_list.length === 2) {
            // если выбито 2 угла то
            //определяем промежуточные точки (углы u)
            c_point1 = u_corners[cor_num_list[0]]; //координаты выбитого угла 1
            c_point2 = u_corners[cor_num_list[1]]; //координаты выбитого угла 1

            result.angles.push([int_point_1_ang, int_point_2_ang]); //вбиваем углы данного участка, чтобы потом вычислить какие арматурины он вышибает

            char1 = calculateCutOff(c_point1, c_point2); //сначало считаем характеристики вырубки между выбитыми углами u
            fillResult(char1);

            //дальше считаем расстояния от точек пересечения до соответствующих углов u. Тут нужно понять, к какому углу u относится какая точка.
            //проверяем точку 1
            //если координата двух точек имеют хоть одно совпадение - значит они лежат на одной прямой u. Следовательно между ними можно просты вычислить расстояние вырубки
            if (!(int_point_1[0] !== c_point1[0] && int_point_1[1] !== c_point1[1])) {
                // если точка 1 лежит на одной прямой с углом 1, значит считаем вырубку точка 1 - угол 1
                char2 = calculateCutOff(int_point_1, c_point1); //считаем характеристики вырубки 2
                fillResult(char2); // и забиваем их в result
            } else {
                // если нет, то она лежит на одной прямой с углом 2 - считаем вырубку точка 1 - угол 2
                char2 = calculateCutOff(int_point_1, c_point2);
                fillResult(char2);
            }

            //проверяем точку 2
            if (!(int_point_2[0] !== c_point1[0] && int_point_2[1] !== c_point1[1])) {
                // если точка 2 лежит на одной прямой с углом 1, значит просто считаем вырубку точка 2 - угол 1
                char3 = calculateCutOff(int_point_2, c_point1); //считаем характеристики вырубки 3
                fillResult(char3);
            } else {
                // если нет, то она лежит на одной прямой с углом 2 - считаем вырубку точка 2 - угол 2
                char3 = calculateCutOff(int_point_2, c_point2); //считаем характеристики вырубки 3
                fillResult(char3);
            }
        }
    }

    function fillResult(char) {
        //вспомогательная функция по наполнению объекта результатов характеристик вырубок
        result.cut_u.push(char.cut_u);
        result.cut_ibx.push(char.cut_ibx);
        result.cut_iby.push(char.cut_iby);
        result.cut_sx.push(char.cut_sx);
        result.cut_sy.push(char.cut_sy);
        result.cut_midX.push(char.cut_mid[0]); //для отчета Word
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
// console.log(test_1);

*/

export function findEmptyOps(openings) {
    //находим отверстия с неполностью заполненными характеристиками, чтобы не включать их в расчет
    var empty_ops = [];
    var id;
    for (id in openings) {
        for (var i = 1; i < openings[id].length; i++) {
            if (openings[id][i] === "" && !empty_ops.includes(i)) {
                // если находим пустую графу в данном отверстии и это отверстие еще не успели внести в список - вносим
                empty_ops.push(i);
            }
        }
    }
    return empty_ops;
}

export var canvas_fake = () => {
    //вспомогательная функция для перегонки SVG в PNG для последующей вставки в отчет. Формирует фиктивный канвас, рисует на нем заданный SVG рисунок и возвращает его
    const canvas = document.getElementById("buffer");
    const ctx = canvas.getContext("2d");
    var sketch = document.getElementById("svg_background").outerHTML;
    var v = Canvg.fromString(ctx, sketch);
    v.start();
    var img = new Image();
    img = canvas.toDataURL("image/png");
    return img;
};

export function checkCirclesOpenings(circle, cut_angles) {
    // проверяем какие кружки вышибаются касательными к отверстиям
    var result = false;
    var angle = findAngle(circle);
    var min_angle;
    var max_angle;
    for (var i = 0; i < cut_angles.length; i++) {
        min_angle = Math.min(cut_angles[i][0], cut_angles[i][1]);
        max_angle = Math.max(cut_angles[i][0], cut_angles[i][1]);
        // console.log("part " + i + ", " + min_angle + ", " + max_angle);
        if (min_angle < 90 && max_angle > 270) {
            //ситуация если одна касательная слева от полож Y, а другая справа
            if (angle <= min_angle || angle >= max_angle) {
                result = true;
            }
        } else {
            //обычная ситуация
            if (angle >= min_angle && angle <= max_angle) {
                result = true;
            }
        }
    }
    return result;
}
