import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun } from "docx";
import { canvas_fake } from "./lib";
import { concrete_properties, rebar_properies } from "./settings";

export default function exportToWord(st) {
    //формируем отчет в Word
    var convert_n = st.force_units === "кН" ? "" : " " + st.force_units + " = " + st.n_load; //формируем строку перевода единиц в СИ
    var convert_mx = st.force_units === "кН" ? "" : " " + st.force_units + "м = " + st.mx_load;
    var convert_my = st.force_units === "кН" ? "" : " " + st.force_units + "м = " + st.my_load;
    var convert_a = st.length_units === "мм" ? "" : " " + st.length_units + " = " + st.a_column_size;
    var convert_b = st.length_units === "мм" ? "" : " " + st.length_units + " = " + st.b_column_size;
    var convert_t = st.length_units === "мм" ? "" : " " + st.length_units + " = " + st.t_slab_size;
    var convert_at = st.length_units === "мм" ? "" : " " + st.length_units + " = " + st.a_slab_size;
    var conc_gr = st.concrete_grade.toUpperCase();
    var rebar_gr = st.shear_bars_grade.toUpperCase();
    var rbt = concrete_properties[st.concrete_grade][1] * 0.001; //считаем Rbt, кН/мм2 -основаная единица
    rbt = Number(rbt.toFixed(8));
    var rsw = rebar_properies[st.shear_bars_grade] * 0.001; // считаем Rsw, кН/мм2
    rsw = Number(rsw.toFixed(3));
    var r_dist = [...st.shear_bars_spacing_to_prev];
    r_dist.shift(); //удаляем 0
    var rows_dist = r_dist.join(", ");

    var convert_edge_left = st.length_units === "мм" ? "" : " " + st.length_units + " = " + st.edge_left_dist;
    var edge_left = function () {
        if (st.edge_left) {
            var result = new Paragraph({ text: "Слева: " + st.input_edge_left_dist + convert_edge_left + " мм,", style: "Norm1" });
            return result;
        }
    };

    var convert_edge_right = st.length_units === "мм" ? "" : " " + st.length_units + " = " + st.edge_right_dist;
    var edge_right = function () {
        if (st.edge_right) {
            var result = new Paragraph({ text: "Справа: " + st.input_edge_right_dist + convert_edge_right + " мм,", style: "Norm1" });
            return result;
        }
    };

    var convert_edge_top = st.length_units === "мм" ? "" : " " + st.length_units + " = " + st.edge_top_dist;
    var edge_top = function () {
        if (st.edge_top) {
            var result = new Paragraph({ text: "Сверху: " + st.input_edge_top_dist + convert_edge_top + " мм,", style: "Norm1" });
            return result;
        }
    };

    var convert_edge_bottom = st.length_units === "мм" ? "" : " " + st.length_units + " = " + st.edge_bottom_dist;
    var edge_bottom = function () {
        if (st.edge_bottom) {
            var result = new Paragraph({ text: "Снизу: " + st.input_edge_bottom_dist + convert_edge_bottom + " мм,", style: "Norm1" });
            return result;
        }
    };

    function OpeningsReport() {
        //формируем строки отчета про характеристики отверстий
        var result = [];
        var convert_X, convert_Y, convert_a, convert_b;
        var k = 1;
        for (var i = 1; i < st.input_openings.X.length; i++) {
            if (st.input_openings.X[i] !== "") {
                // если отверстие не удалено
                convert_X = st.length_units === "мм" ? "" : " " + st.length_units + " = " + st.openings.X[i];
                convert_Y = st.length_units === "мм" ? "" : " " + st.length_units + " = " + st.openings.Y[i] * -1; //меняем направление оси У - в SVG она направлена вниз, у нас классически вверх
                convert_a = st.length_units === "мм" ? "" : " " + st.length_units + " = " + st.openings.a[i];
                convert_b = st.length_units === "мм" ? "" : " " + st.length_units + " = " + st.openings.b[i];

                result.push(
                    new Paragraph({
                        text: "Отверстие " + k + ":",
                        style: "Norm1",
                    })
                );
                result.push(
                    new Paragraph({
                        text: " - размер вдоль оси Х = " + st.input_openings.a[i] + convert_a + " мм,",
                        style: "Norm1",
                    })
                );
                result.push(
                    new Paragraph({
                        text: " - размер вдоль оси Y = " + st.input_openings.b[i] + convert_b + " мм,",
                        style: "Norm1",
                    })
                );
                result.push(
                    new Paragraph({
                        text: " - привязка вдоль оси Х = " + st.input_openings.X[i] + convert_X + " мм,",
                        style: "Norm1",
                    })
                );
                result.push(
                    new Paragraph({
                        text: " - привязка вдоль оси Y = " + st.input_openings.Y[i] + convert_Y + " мм,",
                        style: "Norm1",
                    })
                );
                k++;
            }
        }
        return result;
    }

    // Create document
    const doc = new Document({
        styles: {
            //стили отчета
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
                            after: 120,
                        },
                    },
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
                        alignment: AlignmentType.CENTER,
                    },
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
                    },
                },
                {
                    id: "Warning",
                    name: "Warning 1",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: {
                        font: "Calibri",
                        bold: true,
                        size: 26,
                        highlight: "yellow",
                    },
                },
            ],
        },
        sections: [],
    });
    var img = canvas_fake(); //перегоняем SVG в PNG для вставки в Word
    //const image = Media.addImage({document: doc, data: img, transformation: { width: 450, height: 450 }});
    const image = new ImageRun({
        type: "png",
        data: img,
        transformation: { width: 450, height: 450 },
    });

    // моделируем фразы с подстрочными символами для Word

    const text_break = new Paragraph({
        text: "",
    });

    const mx_letter = new TextRun({
        //Mx
        children: [
            new TextRun({
                text: "M",
            }),
            new TextRun({
                text: "x",
                subScript: true,
            }),
        ],
    });

    const my_letter = new TextRun({
        //My
        children: [
            new TextRun({
                text: "M",
            }),
            new TextRun({
                text: "y",
                subScript: true,
            }),
        ],
    });

    const at_letter = new TextRun({
        //at
        children: [
            new TextRun({
                text: "a",
            }),
            new TextRun({
                text: "t",
                subScript: true,
            }),
        ],
    });

    const h0_letter = new TextRun({
        //h0
        children: [
            new TextRun({
                text: "h",
            }),
            new TextRun({
                text: "0",
                subScript: true,
            }),
        ],
    });

    const rbt_letter = new TextRun({
        //Rbt
        children: [
            new TextRun({
                text: "R",
            }),
            new TextRun({
                text: "bt",
                subScript: true,
            }),
        ],
    });

    const gamma_b_letter = new TextRun({
        //γb
        children: [
            new TextRun({
                text: "γ",
            }),
            new TextRun({
                text: "b",
                subScript: true,
            }),
        ],
    });

    const sup_2 = new TextRun({
        text: "2",
        superScript: true,
    });

    const sup_3 = new TextRun({
        text: "3",
        superScript: true,
    });

    const rsw_letter = new TextRun({
        //Rsw
        children: [
            new TextRun({
                text: "R",
            }),
            new TextRun({
                text: "sw",
                subScript: true,
            }),
        ],
    });

    const ab_letter = new TextRun({
        //Ab
        children: [
            new TextRun({
                text: "A",
            }),
            new TextRun({
                text: "b",
                subScript: true,
            }),
        ],
    });

    const fbult_letter = new TextRun({
        //Fb,ult
        children: [
            new TextRun({
                text: "F",
            }),
            new TextRun({
                text: "b,ult",
                subScript: true,
            }),
        ],
    });

    const lux_letter = new TextRun({
        //Lux
        children: [
            new TextRun({
                text: "L",
            }),
            new TextRun({
                text: "ux",
                subScript: true,
            }),
        ],
    });

    const luy_letter = new TextRun({
        //Luy
        children: [
            new TextRun({
                text: "L",
            }),
            new TextRun({
                text: "uy",
                subScript: true,
            }),
        ],
    });

    const ibx_letter = new TextRun({
        //Ibx
        children: [
            new TextRun({
                text: "I",
            }),
            new TextRun({
                text: "bx",
                subScript: true,
            }),
        ],
    });

    const iby_letter = new TextRun({
        //Iby
        children: [
            new TextRun({
                text: "I",
            }),
            new TextRun({
                text: "by",
                subScript: true,
            }),
        ],
    });

    const wbx_letter = new TextRun({
        //Wbx
        children: [
            new TextRun({
                text: "W",
            }),
            new TextRun({
                text: "bx",
                subScript: true,
            }),
        ],
    });

    const wby_letter = new TextRun({
        //Wby
        children: [
            new TextRun({
                text: "W",
            }),
            new TextRun({
                text: "by",
                subScript: true,
            }),
        ],
    });

    const mbxult_letter = new TextRun({
        //Mbx,ult
        children: [
            new TextRun({
                text: "M",
            }),
            new TextRun({
                text: "bx,ult",
                subScript: true,
            }),
        ],
    });

    const mbyult_letter = new TextRun({
        //Mby,ult
        children: [
            new TextRun({
                text: "M",
            }),
            new TextRun({
                text: "by,ult",
                subScript: true,
            }),
        ],
    });

    const asw_tot_letter = new TextRun({
        //Asw_tot
        children: [
            new TextRun({
                text: "A",
            }),
            new TextRun({
                text: "sw_tot",
                subScript: true,
            }),
        ],
    });

    const asw_letter = new TextRun({
        //Asw
        children: [
            new TextRun({
                text: "A",
            }),
            new TextRun({
                text: "sw",
                subScript: true,
            }),
        ],
    });

    const qsw_letter = new TextRun({
        //qsw
        children: [
            new TextRun({
                text: "q",
            }),
            new TextRun({
                text: "sw",
                subScript: true,
            }),
        ],
    });

    const fswult_letter = new TextRun({
        //Fsw,ult
        children: [
            new TextRun({
                text: "F",
            }),
            new TextRun({
                text: "sw,ult",
                subScript: true,
            }),
        ],
    });

    var fult_letter = new TextRun({
        //Fult
        children: [
            new TextRun({
                text: "F",
            }),
            new TextRun({
                text: "ult",
                subScript: true,
            }),
        ],
    });

    const wswx_letter = new TextRun({
        //Wsw,x
        children: [
            new TextRun({
                text: "W",
            }),
            new TextRun({
                text: "sw,x",
                subScript: true,
            }),
        ],
    });

    const wswy_letter = new TextRun({
        //Wsw,y
        children: [
            new TextRun({
                text: "W",
            }),
            new TextRun({
                text: "sw,y",
                subScript: true,
            }),
        ],
    });

    const mswxult_letter = new TextRun({
        //Msw,x,ult
        children: [
            new TextRun({
                text: "M",
            }),
            new TextRun({
                text: "sw,x,ult",
                subScript: true,
            }),
        ],
    });

    const mswyult_letter = new TextRun({
        //Msw,y,ult
        children: [
            new TextRun({
                text: "M",
            }),
            new TextRun({
                text: "sw,y,ult",
                subScript: true,
            }),
        ],
    });

    var mxult_letter = new TextRun({
        //Mx,ult
        children: [
            new TextRun({
                text: "M",
            }),
            new TextRun({
                text: "x,ult",
                subScript: true,
            }),
        ],
    });

    var myult_letter = new TextRun({
        //My,ult
        children: [
            new TextRun({
                text: "M",
            }),
            new TextRun({
                text: "y,ult",
                subScript: true,
            }),
        ],
    });

    const sx_letter = new TextRun({
        //Sx
        children: [
            new TextRun({
                text: "S",
            }),
            new TextRun({
                text: "x",
                subScript: true,
            }),
        ],
    });

    const sy_letter = new TextRun({
        //Sy
        children: [
            new TextRun({
                text: "S",
            }),
            new TextRun({
                text: "y",
                subScript: true,
            }),
        ],
    });

    const xa_letter = new TextRun({
        //xa
        children: [
            new TextRun({
                text: "x",
            }),
            new TextRun({
                text: "a",
                subScript: true,
            }),
        ],
    });

    const ya_letter = new TextRun({
        //ya
        children: [
            new TextRun({
                text: "y",
            }),
            new TextRun({
                text: "a",
                subScript: true,
            }),
        ],
    });

    const xmax_letter = new TextRun({
        //xmax
        children: [
            new TextRun({
                text: "x",
            }),
            new TextRun({
                text: "max",
                subScript: true,
            }),
        ],
    });

    const ymax_letter = new TextRun({
        //ymax
        children: [
            new TextRun({
                text: "y",
            }),
            new TextRun({
                text: "max",
                subScript: true,
            }),
        ],
    });

    const xc_letter = new TextRun({
        //xc
        children: [
            new TextRun({
                text: "x",
            }),
            new TextRun({
                text: "c",
                subScript: true,
            }),
        ],
    });

    const yc_letter = new TextRun({
        //yc
        children: [
            new TextRun({
                text: "y",
            }),
            new TextRun({
                text: "c",
                subScript: true,
            }),
        ],
    });

    //Моделируем текстовку отчета для Word

    const report_1 = [
        new Paragraph({
            //Предупреждение о баге в LibreOffice
            text: `Внимание! Если Вы пользуетесь LibreOffice, то текст файла может отображаться некорректно! Будут отсутствовать многие буквы, особенно те, рядом с которыми стоят подстрочные символы типа Rsw, Mx и тд. Это баг в LibreOffice (ссылка https://bugs.documentfoundation.org/show_bug.cgi?id=161790). Пожалуйста, используйте MS Word или любые другие просмотрщики Docx файлов, можно онлайн.`,
            style: "Warning",
        }),
        text_break,
        new Paragraph({
            //"<h2>Расчет на продавливание</h2>"
            text: "Расчет на продавливание",
            style: "Head1",
        }),
        text_break,
        new Paragraph({
            // картинка
            children: [image],
            alignment: AlignmentType.CENTER,
        }),
        text_break,
        new Paragraph({
            //"<p><b>Исходные данные:</b></p>"
            text: "Исходные данные:",
            style: "Head2",
        }),
        new Paragraph({
            //"<p>Расчет будем вести в системе СИ: кН и мм.</p>"
            text: "Расчет будем вести в системе СИ: кН и мм:",
            style: "Norm1",
        }),
        new Paragraph({
            // "<p>Продольная сила, N = " + st.input_n_load + convert_n + " кН,</p>"
            text: "Продольная сила, N = " + st.input_n_load + convert_n + " кН,",
            style: "Norm1",
        }),
        new Paragraph({
            //"<p>Изгибающий момент, Мx = " + st.input_mx_load + convert_mx + " кНм,</p>"
            children: [
                new TextRun({
                    text: "Изгибающий момент ",
                }),
                mx_letter,
                new TextRun({
                    text: " = " + st.input_mx_load + convert_mx + " кНм,",
                }),
            ],
            style: "Norm1",
        }),
        new Paragraph({
            //"<p>Изгибающий момент, My = " + st.input_my_load + convert_my + " кНм,</p>"
            children: [
                new TextRun({
                    text: "Изгибающий момент ",
                }),
                my_letter,
                new TextRun({
                    text: " = " + st.input_my_load + convert_my + " кНм,",
                }),
            ],
            style: "Norm1",
        }),
        new Paragraph({
            //"<p>Размер сечения колонны вдоль оси X, а = " + st.input_a_column_size + convert_a + " мм,</p>"
            text: "Размер сечения колонны вдоль оси X, а = " + st.input_a_column_size + convert_a + " мм,",
            style: "Norm1",
        }),
        new Paragraph({
            //"<p>Размер сечения колонны вдоль оси Y, b = " + st.input_b_column_size + convert_b +" мм,</p>"
            text: "Размер сечения колонны вдоль оси Y, b = " + st.input_b_column_size + convert_b + " мм,",
            style: "Norm1",
        }),
        new Paragraph({
            //"<p>Толщина плиты, h = " + st.input_t_slab_size + convert_t +" мм,</p>"
            text: "Толщина плиты, h = " + st.input_t_slab_size + convert_t + " мм,",
            style: "Norm1",
        }),
        new Paragraph({
            //  "<p>Привязка центра тяжести арматуры, a<sub>t</sub> = " + st.input_a_slab_size + convert_at +" мм,</p>"
            children: [
                new TextRun({
                    text: "Привязка центра тяжести арматуры, ",
                }),
                at_letter,
                new TextRun({
                    text: " = " + st.input_a_slab_size + convert_at + " мм,",
                }),
            ],
            style: "Norm1",
        }),
        new Paragraph({
            //"<p>Класс бетона: " + conc_gr + "," + "</p>"
            text: "Класс бетона: " + conc_gr + ",",
            style: "Norm1",
        }),
        new Paragraph({
            //  "<p>Коэффициент γ<sub>b</sub> = " + st.gamma_b + "," + "</p>"
            children: [
                new TextRun({
                    text: "Коэффициент ",
                }),
                gamma_b_letter,
                new TextRun({
                    text: " = " + st.gamma_b + ",",
                }),
            ],
            style: "Norm1",
        }),
        new Paragraph({
            //"<p>R<sub>bt</sub> = " + concrete_properties[st.concrete_grade][1] + " МПа = " + rbt + " кН/мм<sup>2</sup>,</p>"
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
            style: "Norm1",
        }),
    ];

    const report_2 = function () {
        //часть про армирование
        var result = [];
        if (st.shear_reinforcement) {
            result = [
                new Paragraph({
                    //"<p>Класс поперечной арматуры: " + rebar_gr + ",</p>"
                    text: "Класс поперечной арматуры: " + rebar_gr + ",",
                    style: "Norm1",
                }),
                new Paragraph({
                    //<p>Диаметр поперечной арматуры = " + st.shear_bars_diameter + " мм,</p>"
                    text: "Диаметр поперечной арматуры = " + st.shear_bars_diameter + " мм,",
                    style: "Norm1",
                }),
                new Paragraph({
                    //"<p>Rsw = " + rebar_properies[st.shear_bars_grade] + " МПа = " + rsw + " кН/мм<sup>2</sup>,</p>"
                    children: [
                        rsw_letter,
                        new TextRun({
                            text: " = " + rebar_properies[st.shear_bars_grade] + " МПа = " + rsw + " кН/мм",
                        }),
                        sup_2,
                    ],
                    style: "Norm1",
                }),
                new Paragraph({
                    //"<p>Количество рядов поперечной арматуры - " + st.shear_bars_row_number + "," + "</p>"
                    text: "Количество рядов поперечной арматуры - " + st.shear_bars_row_number + ",",
                    style: "Norm1",
                }),
                new Paragraph({
                    //"<p>Количество стержней поперечной арматуры - " + st.circlesX.length + " шт.</p>" +
                    text: "Количество стержней поперечной арматуры - " + st.circlesX.length + " шт.",
                    style: "Norm1",
                }),
                new Paragraph({
                    //"<p>Расстояние между рядами поперечной арматуры - " + rows_dist + " мм.</p>" +
                    text: "Расстояние между рядами поперечной арматуры - " + rows_dist + " мм.",
                    style: "Norm1",
                }),
            ];
        }
        return result;
    };

    const report_3 = function () {
        //часть про края плиты
        var result = [];
        if (st.slab_edge) {
            result = [
                new Paragraph({
                    //"<p>Расстояние до ближайшего края плиты:</p>" +
                    text: "Расстояние до ближайшего края плиты:",
                    style: "Norm1",
                }),
                edge_left(),
                edge_right(),
                edge_top(),
                edge_bottom(),
            ];
        }
        return result;
    };

    const report_4 = function () {
        //часть про отверстия
        var result = [];
        if (st.openingIsNear) {
            result = [
                new Paragraph({
                    text: "Размер отверстий, а также привязка центра отверстий к центру колонны:",
                    style: "Norm1",
                }),
            ];
            result = result.concat(OpeningsReport());
        }
        return result;
    };

    const report_5 = function () {
        var result = [];
        var part1 = [
            // общее начало расчета
            text_break,
            new Paragraph({
                //"<p><b>Расчет:</b></p>"
                text: "Расчет:",
                style: "Head2",
            }),
            new Paragraph({
                //"<p>h<sub>0</sub> = h - a<sub>t</sub> = " + st.t_slab_size + " - " + st.a_slab_size + " = " + st.report_data.h0 + " мм,</p>" +
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
                style: "Norm1",
            }),
            new Paragraph({
                //"<p>R<sub>bt</sub> = R<sub>bt</sub> * γ<sub>b</sub> = " + rbt + " * " + st.gamma_b + " = " + st.report_data.rbt + "  кН/мм<sup>2</sup>,</p>" +
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
                    }),
                ],
                style: "Norm1",
            }),
        ];
        var part2 = []; // учет отверстий
        var part3 = [];
        var part4 = [];
        if (st.openingIsNear) {
            part2 = [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Характеристики участков, отсекаемых касательными к отверстиям:",
                        }),
                    ],
                    style: "Norm1",
                }),
            ];
            part3 = cut_chars();
            part4 = [
                new Paragraph({
                    // считаем вырубку u
                    children: [
                        new TextRun({
                            text: "Характеристики сечения, которые будут вычитаться из контура продавливания:",
                        }),
                    ],
                    style: "Norm1",
                }),
                new Paragraph({
                    // считаем вырубку u
                    children: u_phrase(),
                    style: "Norm1",
                }),
                new Paragraph({
                    // считаем вырубку ibx
                    children: ibx_tot_phrase(),
                    style: "Norm1",
                }),
                new Paragraph({
                    // считаем вырубку iby
                    children: iby_tot_phrase(),
                    style: "Norm1",
                }),
                new Paragraph({
                    // считаем вырубку sx
                    children: sx_tot_phrase(),
                    style: "Norm1",
                }),
                new Paragraph({
                    // считаем вырубку sy
                    children: sy_tot_phrase(),
                    style: "Norm1",
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Итоговые характеристики сечения с учетом отверстий:",
                        }),
                    ],
                    style: "Norm1",
                }),
            ];
        }
        var part5 = [
            // продолжаем далее
            new Paragraph({
                //"<p>u = " + st.report_data.size_u_left + " + " + st.report_data.size_u_top + " + " + st.report_data.size_u_right + " + " + st.report_data.size_u_bottom + " - " + st.report_data.cut_off + " = " + st.report_data.u + " мм,</p>" +
                children: [
                    new TextRun({
                        text:
                            "u = " +
                            st.report_data.size_u_left +
                            " + " +
                            st.report_data.size_u_top +
                            " + " +
                            st.report_data.size_u_right +
                            " + " +
                            st.report_data.size_u_bottom +
                            " - " +
                            st.report_data.cut_off +
                            " = " +
                            st.report_data.u +
                            " мм,",
                    }),
                ],
                style: "Norm1",
            }),
            new Paragraph({
                // "<p>A<sub>b</sub> = u * h<sub>0</sub> = " + st.report_data.u + " * " + st.report_data.h0 + " = " + st.report_data.ab + " мм<sup>2</sup>,</p>" +
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
                    }),
                ],
                style: "Norm1",
            }),
            new Paragraph({
                // "<p>F<sub>b,ult</sub> = R<sub>bt</sub> * A<sub>b</sub> = " + st.report_data.rbt + " * " + st.report_data.ab + " = " + st.report_data.fb_ult + " кН,</p>" +
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
                style: "Norm1",
            }),
        ];

        var part6 = [];
        if (st.openingIsNear) {
            part6 = [
                new Paragraph({
                    //x'c = -s'x/u;
                    children: [
                        new TextRun({
                            text: "x'",
                        }),
                        new TextRun({
                            text: "c",
                            subScript: true,
                        }),
                        new TextRun({
                            text: " = ",
                        }),
                        new TextRun({
                            text: "-S'",
                        }),
                        new TextRun({
                            text: "x",
                            subScript: true,
                        }),
                        new TextRun({
                            text: "/u = " + st.report_data.cut_off_sx + "/" + st.report_data.u + " = " + st.report_data.cut_xc + " мм,",
                        }),
                    ],
                    style: "Norm1",
                }),
                new Paragraph({
                    //y'c = -s'y/u;
                    children: [
                        new TextRun({
                            text: "y'",
                        }),
                        new TextRun({
                            text: "c",
                            subScript: true,
                        }),
                        new TextRun({
                            text: " = ",
                        }),
                        new TextRun({
                            text: "-S'",
                        }),
                        new TextRun({
                            text: "y",
                            subScript: true,
                        }),
                        new TextRun({
                            text: "/u = " + st.report_data.cut_off_sy + "/" + st.report_data.u + " = " + st.report_data.cut_yc + " мм,",
                        }),
                    ],
                    style: "Norm1",
                }),
            ];
        }

        result = result.concat(part1, part2, part3, part4, part5, part6);

        function u_phrase() {
            var result;
            if (st.report_data.cut_chars.cut_u.length > 0) {
                result = [
                    new TextRun({
                        text: "u' = ",
                    }),
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
                                text: i + 1,
                                subScript: true,
                            }),
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
                                text: i + 1,
                                subScript: true,
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
                    }),
                ];
            }
            return result;
        }

        function cut_chars() {
            //характеристики контуров
            var result = [
                new Paragraph({
                    //
                    children: [
                        new TextRun({
                            text: "u'",
                        }),
                        new TextRun({
                            text: "i",
                            subScript: true,
                        }),
                        new TextRun({
                            text: " - часть контура продавливания, отсекаемая касательными к отверстиям и не участвующая в расчете.",
                        }),
                    ],
                    style: "Norm1",
                }),
                new Paragraph({
                    //
                    children: [
                        new TextRun({
                            text: "I'",
                        }),
                        new TextRun({
                            text: "bx",
                            subScript: true,
                        }),
                        new TextRun({
                            text: ", I'",
                        }),
                        new TextRun({
                            text: "by",
                            subScript: true,
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
                    style: "Norm1",
                }),
            ];
            var part;
            for (var i = 0; i < st.report_data.cut_chars.cut_u.length; i++) {
                part = [
                    new Paragraph({
                        //
                        children: [
                            new TextRun({
                                text: "Сектор " + (i + 1) + ":",
                            }),
                        ],
                        style: "Norm1",
                    }),
                    new Paragraph({
                        //
                        children: [
                            new TextRun({
                                text: "u'",
                            }),
                            new TextRun({
                                text: i + 1,
                                subScript: true,
                            }),
                            new TextRun({
                                text: " = " + st.report_data.cut_chars.cut_u[i] + " мм,",
                            }),
                        ],
                        style: "Norm1",
                    }),
                    new Paragraph({
                        //
                        children: [
                            new TextRun({
                                text: "Координаты центра линии u'",
                            }),
                            new TextRun({
                                text: i + 1,
                                subScript: true,
                            }),
                            new TextRun({
                                text: " [Х, Y] = [" + st.report_data.cut_chars.cut_midX[i] + ", " + st.report_data.cut_chars.cut_midY[i] + "],",
                            }),
                        ],
                        style: "Norm1",
                    }),
                    new Paragraph({
                        //
                        children: ibx_phrase(i),
                        style: "Norm1",
                    }),
                    new Paragraph({
                        //
                        children: iby_phrase(i),
                        style: "Norm1",
                    }),
                    new Paragraph({
                        //
                        children: sx_phrase(i),
                        style: "Norm1",
                    }),
                    new Paragraph({
                        //
                        children: sy_phrase(i),
                        style: "Norm1",
                    }),
                ];
                result = result.concat(part);
            }
            return result;
        }

        function ibx_phrase(i) {
            var db = st.report_data.cut_chars;
            //отрицательное число берем в скобочки
            var cut_midX = db.cut_midX[i];
            if (db.cut_midX[i] < 0) {
                cut_midX = "(" + db.cut_midX[i] + ")";
            }
            var result = [
                new TextRun({
                    text: "I'",
                }),
                new TextRun({
                    text: "bx" + (i + 1),
                    subScript: true,
                }),
                new TextRun({
                    text: " = ",
                }),
            ];

            var part1 = [];
            if (db.dir[i] === "horiz") {
                part1 = [
                    new TextRun({
                        text: db.cut_u[i],
                    }),
                    sup_3,
                    new TextRun({
                        text: "/12 + " + db.cut_u[i] + " * " + cut_midX,
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
                        text: db.cut_u[i] + " * " + cut_midX,
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
            //отрицательное число берем в скобочки
            var cut_midY = db.cut_midY[i];
            if (db.cut_midY[i] < 0) {
                cut_midY = "(" + db.cut_midY[i] + ")";
            }
            var result = [
                new TextRun({
                    text: "I'",
                }),
                new TextRun({
                    text: "by" + (i + 1),
                    subScript: true,
                }),
                new TextRun({
                    text: " = ",
                }),
            ];

            var part1 = [];
            if (db.dir[i] === "vert") {
                part1 = [
                    new TextRun({
                        text: db.cut_u[i],
                    }),
                    sup_3,
                    new TextRun({
                        text: "/12 + " + db.cut_u[i] + " * " + cut_midY,
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
                        text: db.cut_u[i] + " * " + cut_midY,
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
            //отрицательное число берем в скобочки
            var cut_midX = db.cut_midX[i];
            if (db.cut_midX[i] < 0) {
                cut_midX = "(" + db.cut_midX[i] + ")";
            }
            var result = [
                new TextRun({
                    text: "S'",
                }),
                new TextRun({
                    text: "x" + (i + 1),
                    subScript: true,
                }),
                new TextRun({
                    text: " = " + db.cut_u[i] + " * " + cut_midX + " = " + db.cut_sx[i] + " мм",
                }),
                sup_2,
                new TextRun({
                    text: ",",
                }),
            ];
            return result;
        }

        function sy_phrase(i) {
            var db = st.report_data.cut_chars;
            //отрицательное число берем в скобочки
            var cut_midY = db.cut_midY[i];
            if (db.cut_midY[i] < 0) {
                cut_midY = "(" + db.cut_midY[i] + ")";
            }
            var result = [
                new TextRun({
                    text: "S'",
                }),
                new TextRun({
                    text: "y" + (i + 1),
                    subScript: true,
                }),
                new TextRun({
                    text: " = " + db.cut_u[i] + " * " + cut_midY + " = " + db.cut_sy[i] + " мм",
                }),
                sup_2,
                new TextRun({
                    text: ",",
                }),
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
                        subScript: true,
                    }),
                    new TextRun({
                        text: " = ",
                    }),
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
                                text: "bx" + (i + 1),
                                subScript: true,
                            }),
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
                                text: "bx" + (i + 1),
                                subScript: true,
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
                        subScript: true,
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
                        subScript: true,
                    }),
                    new TextRun({
                        text: " = ",
                    }),
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
                                text: "by" + (i + 1),
                                subScript: true,
                            }),
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
                                text: "by" + (i + 1),
                                subScript: true,
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
                        subScript: true,
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
                        subScript: true,
                    }),
                    new TextRun({
                        text: " = ",
                    }),
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
                                text: "x" + (i + 1),
                                subScript: true,
                            }),
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
                                text: "x" + (i + 1),
                                subScript: true,
                            }),
                        ];
                    }
                    result = result.concat(part1);
                }
                for (var i = 0; i < st.report_data.cut_chars.cut_u.length; i++) {
                    //отрицательное число берем в скобочки
                    var cut_sx = st.report_data.cut_chars.cut_sx[i];
                    if (cut_sx < 0) {
                        cut_sx = "(" + cut_sx + ")";
                    }
                    if (i === 0) {
                        part2 = [
                            new TextRun({
                                text: " = " + cut_sx,
                            }),
                        ];
                    } else {
                        part2 = [
                            new TextRun({
                                text: " + " + cut_sx,
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
                        subScript: true,
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
                        subScript: true,
                    }),
                    new TextRun({
                        text: " = ",
                    }),
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
                                text: "y" + (i + 1),
                                subScript: true,
                            }),
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
                                text: "y" + (i + 1),
                                subScript: true,
                            }),
                        ];
                    }
                    result = result.concat(part1);
                }
                for (var i = 0; i < st.report_data.cut_chars.cut_u.length; i++) {
                    //отрицательное число берем в скобочки
                    var cut_sy = st.report_data.cut_chars.cut_sy[i];
                    if (cut_sy < 0) {
                        cut_sy = "(" + cut_sy + ")";
                    }
                    if (i === 0) {
                        part2 = [
                            new TextRun({
                                text: " = " + cut_sy,
                            }),
                        ];
                    } else {
                        part2 = [
                            new TextRun({
                                text: " + " + cut_sy,
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
                        subScript: true,
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
    }; // конец report_5

    const report_6a = function () {
        //пояснение про Lux и Luy
        var result = [];
        if (st.mx_load !== 0 || st.mx_load !== 0 || st.openingIsNear) {
            result = [
                new Paragraph({
                    // L<sub>ux</sub>, L<sub>uy</sub>  - длина сторон прямоугольника u вдоль оси Х и Y.</p>" +
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
                    style: "Norm1",
                }),
            ];
        }
        return result;
    };

    const report_6b = function () {
        //если колонна на краю плиты
        var result = [];
        var xa, ya, sx, sy, xc, yc;
        if (st.slab_edge_type === "l" || st.slab_edge_type === "r") {
            // sx и ха разные, все остальное одинаковое
            if (st.slab_edge_type === "l") {
                xa = new Paragraph({
                    //  result.xa = st.a_column_size/2 + st.edge_left_dist;
                    children: [
                        xa_letter,
                        new TextRun({
                            text: " = " + st.a_column_size + "/2 + " + st.edge_left_dist + " = " + st.report_data.xa + " мм,",
                        }),
                    ],
                    style: "Norm1",
                });
                sx = new Paragraph({
                    // result.sx = 2*lx*((lx/2) - result.xa) + ly*(st.a_column_size + h0)/2;
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
                            text:
                                ")/2 = 2 * " +
                                st.report_data.lx +
                                " * (" +
                                st.report_data.lx +
                                "/2 - " +
                                st.report_data.xa +
                                ") + " +
                                st.report_data.ly +
                                " * (" +
                                st.a_column_size +
                                " + " +
                                st.report_data.h0 +
                                ")/2 = " +
                                st.report_data.sx +
                                " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ],
                    style: "Norm1",
                });
            }
            if (st.slab_edge_type === "r") {
                xa = new Paragraph({
                    //  result.xa = st.a_column_size/2 + st.edge_right_dist;
                    children: [
                        xa_letter,
                        new TextRun({
                            text: " = " + st.a_column_size + "/2 + " + st.edge_right_dist + " = " + st.report_data.xa + " мм,",
                        }),
                    ],
                    style: "Norm1",
                });
                sx = new Paragraph({
                    // result.sx = 2*lx*(result.xa - (lx/2)) - ly*(st.a_column_size + h0)/2;
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
                            text:
                                ")/2 = 2 * " +
                                st.report_data.lx +
                                " * (" +
                                st.report_data.xa +
                                " - " +
                                st.report_data.lx +
                                "/2) - " +
                                st.report_data.ly +
                                " * (" +
                                st.a_column_size +
                                " + " +
                                st.report_data.h0 +
                                ")/2 = " +
                                st.report_data.sx +
                                " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ],
                    style: "Norm1",
                });
            }
            xc = new Paragraph({
                //result.xc = result.sx/result.u;
                children: [
                    xc_letter,
                    new TextRun({
                        text: " = ",
                    }),
                    sx_letter,
                    new TextRun({
                        text: "/u = " + st.report_data.sx + "/" + st.report_data.u + " = " + st.report_data.xc + " мм,",
                    }),
                ],
                style: "Norm1",
            });
            yc = new Paragraph({
                //yc = 0
                children: [
                    yc_letter,
                    new TextRun({
                        text: " = 0 мм,",
                    }),
                ],
                style: "Norm1",
            });
            result = result.concat(xa, sx, xc, yc);
        }
        if (st.slab_edge_type === "t" || st.slab_edge_type === "b") {
            // sy и ya разные, все остальное одинаковое
            if (st.slab_edge_type === "t") {
                ya = new Paragraph({
                    //  result.ya = st.b_column_size/2 + st.edge_top_dist;
                    children: [
                        ya_letter,
                        new TextRun({
                            text: " = " + st.b_column_size + "/2 + " + st.edge_top_dist + " = " + st.report_data.ya + " мм,",
                        }),
                    ],
                    style: "Norm1",
                });
                sy = new Paragraph({
                    // result.sy = 2*ly*(result.ya - (ly/2)) - lx*(st.b_column_size + h0)/2;
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
                            text:
                                ")/2 = 2 * " +
                                st.report_data.ly +
                                " * (" +
                                st.report_data.ya +
                                " - " +
                                st.report_data.ly +
                                "/2) - " +
                                st.report_data.lx +
                                " * (" +
                                st.b_column_size +
                                " + " +
                                st.report_data.h0 +
                                ")/2 = " +
                                st.report_data.sy +
                                " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ],
                    style: "Norm1",
                });
            }
            if (st.slab_edge_type === "b") {
                ya = new Paragraph({
                    //    result.ya = st.b_column_size/2 + st.edge_bottom_dist;
                    children: [
                        ya_letter,
                        new TextRun({
                            text: " = " + st.b_column_size + "/2 + " + st.edge_bottom_dist + " = " + st.report_data.ya + " мм,",
                        }),
                    ],
                    style: "Norm1",
                });
                sy = new Paragraph({
                    //    result.sy = 2*ly*((ly/2) - result.ya) + lx*(st.b_column_size + h0)/2;
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
                            text:
                                ")/2 = 2 * " +
                                st.report_data.ly +
                                " * (" +
                                st.report_data.ly +
                                "/2 - " +
                                st.report_data.ya +
                                ") + " +
                                st.report_data.lx +
                                " * (" +
                                st.b_column_size +
                                " + " +
                                st.report_data.h0 +
                                ")/2 = " +
                                st.report_data.sy +
                                " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ],
                    style: "Norm1",
                });
            }
            yc = new Paragraph({
                //result.yc = result.sy/result.u;
                children: [
                    yc_letter,
                    new TextRun({
                        text: " = ",
                    }),
                    sy_letter,
                    new TextRun({
                        text: "/u = " + st.report_data.sy + "/" + st.report_data.u + " = " + st.report_data.yc + " мм,",
                    }),
                ],
                style: "Norm1",
            });
            xc = new Paragraph({
                //xc = 0
                children: [
                    xc_letter,
                    new TextRun({
                        text: " = 0 мм,",
                    }),
                ],
                style: "Norm1",
            });
            result = result.concat(ya, sy, yc, xc);
        }

        if (st.slab_edge_type === "lt" || st.slab_edge_type === "rt" || st.slab_edge_type === "rb" || st.slab_edge_type === "lb") {
            if (st.slab_edge_type === "lt") {
                xa = new Paragraph({
                    //  result.xa = st.a_column_size/2 + st.edge_left_dist;
                    children: [
                        xa_letter,
                        new TextRun({
                            text: " = " + st.a_column_size + "/2 + " + st.edge_left_dist + " = " + st.report_data.xa + " мм,",
                        }),
                    ],
                    style: "Norm1",
                });
                ya = new Paragraph({
                    //  result.ya = st.b_column_size/2 + st.edge_top_dist;
                    children: [
                        ya_letter,
                        new TextRun({
                            text: " = " + st.b_column_size + "/2 + " + st.edge_top_dist + " = " + st.report_data.ya + " мм,",
                        }),
                    ],
                    style: "Norm1",
                });
                sx = new Paragraph({
                    // result.sx = lx*((lx/2) - result.xa) + ly*(st.a_column_size + h0)/2;
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
                            text:
                                ")/2 = " +
                                st.report_data.lx +
                                " * (" +
                                st.report_data.lx +
                                "/2 - " +
                                st.report_data.xa +
                                ") + " +
                                st.report_data.ly +
                                " * (" +
                                st.a_column_size +
                                " + " +
                                st.report_data.h0 +
                                ")/2 = " +
                                st.report_data.sx +
                                " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ],
                    style: "Norm1",
                });
                sy = new Paragraph({
                    // result.sy = ly*(result.ya - (ly/2)) - lx*(st.b_column_size + h0)/2;
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
                            text:
                                ")/2 = " +
                                st.report_data.ly +
                                " * (" +
                                st.report_data.ya +
                                " - " +
                                st.report_data.ly +
                                "/2) - " +
                                st.report_data.lx +
                                " * (" +
                                st.b_column_size +
                                " + " +
                                st.report_data.h0 +
                                ")/2 = " +
                                st.report_data.sy +
                                " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ],
                    style: "Norm1",
                });
            }

            if (st.slab_edge_type === "rt") {
                xa = new Paragraph({
                    //  result.xa = st.a_column_size/2 + st.edge_right_dist;
                    children: [
                        xa_letter,
                        new TextRun({
                            text: " = " + st.a_column_size + "/2 + " + st.edge_right_dist + " = " + st.report_data.xa + " мм,",
                        }),
                    ],
                    style: "Norm1",
                });
                ya = new Paragraph({
                    //  result.ya = st.b_column_size/2 + st.edge_top_dist;
                    children: [
                        ya_letter,
                        new TextRun({
                            text: " = " + st.b_column_size + "/2 + " + st.edge_top_dist + " = " + st.report_data.ya + " мм,",
                        }),
                    ],
                    style: "Norm1",
                });
                sx = new Paragraph({
                    // result.sx = lx*(result.xa - (lx/2)) - ly*(st.a_column_size + h0)/2;
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
                            text:
                                ")/2 = " +
                                st.report_data.lx +
                                " * (" +
                                st.report_data.xa +
                                " - " +
                                st.report_data.lx +
                                "/2) - " +
                                st.report_data.ly +
                                " * (" +
                                st.a_column_size +
                                " + " +
                                st.report_data.h0 +
                                ")/2 = " +
                                st.report_data.sx +
                                " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ],
                    style: "Norm1",
                });
                sy = new Paragraph({
                    // result.sy = ly*(result.ya - (ly/2)) - lx*(st.b_column_size + h0)/2;
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
                            text:
                                ")/2 = " +
                                st.report_data.ly +
                                " * (" +
                                st.report_data.ya +
                                " - " +
                                st.report_data.ly +
                                "/2) - " +
                                st.report_data.lx +
                                " * (" +
                                st.b_column_size +
                                " + " +
                                st.report_data.h0 +
                                ")/2 = " +
                                st.report_data.sy +
                                " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ],
                    style: "Norm1",
                });
            }

            if (st.slab_edge_type === "rb") {
                xa = new Paragraph({
                    //  result.xa = st.a_column_size/2 + st.edge_right_dist;
                    children: [
                        xa_letter,
                        new TextRun({
                            text: " = " + st.a_column_size + "/2 + " + st.edge_right_dist + " = " + st.report_data.xa + " мм,",
                        }),
                    ],
                    style: "Norm1",
                });
                ya = new Paragraph({
                    //  result.ya = st.b_column_size/2 + st.edge_bottom_dist;
                    children: [
                        ya_letter,
                        new TextRun({
                            text: " = " + st.b_column_size + "/2 + " + st.edge_bottom_dist + " = " + st.report_data.ya + " мм,",
                        }),
                    ],
                    style: "Norm1",
                });
                sx = new Paragraph({
                    // result.sx = lx*(result.xa - (lx/2)) - ly*(st.a_column_size + h0)/2;
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
                            text:
                                ")/2 = " +
                                st.report_data.lx +
                                " * (" +
                                st.report_data.xa +
                                " - " +
                                st.report_data.lx +
                                "/2) - " +
                                st.report_data.ly +
                                " * (" +
                                st.a_column_size +
                                " + " +
                                st.report_data.h0 +
                                ")/2 = " +
                                st.report_data.sx +
                                " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ],
                    style: "Norm1",
                });
                sy = new Paragraph({
                    // result.sy = ly*((ly/2) - result.ya) + lx*(st.b_column_size + h0)/2;
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
                            text:
                                ")/2 = " +
                                st.report_data.ly +
                                " * (" +
                                st.report_data.ly +
                                "/2 - " +
                                st.report_data.ya +
                                ") + " +
                                st.report_data.lx +
                                " * (" +
                                st.b_column_size +
                                " + " +
                                st.report_data.h0 +
                                ")/2 = " +
                                st.report_data.sy +
                                " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ],
                    style: "Norm1",
                });
            }

            if (st.slab_edge_type === "lb") {
                xa = new Paragraph({
                    //  result.xa = st.a_column_size/2 + st.edge_left_dist;
                    children: [
                        xa_letter,
                        new TextRun({
                            text: " = " + st.a_column_size + "/2 + " + st.edge_left_dist + " = " + st.report_data.xa + " мм,",
                        }),
                    ],
                    style: "Norm1",
                });
                ya = new Paragraph({
                    //  result.ya = st.b_column_size/2 + st.edge_bottom_dist;
                    children: [
                        ya_letter,
                        new TextRun({
                            text: " = " + st.b_column_size + "/2 + " + st.edge_bottom_dist + " = " + st.report_data.ya + " мм,",
                        }),
                    ],
                    style: "Norm1",
                });
                sx = new Paragraph({
                    // result.sx = lx*((lx/2) - result.xa) + ly*(st.a_column_size + h0)/2;
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
                            text:
                                ")/2 = " +
                                st.report_data.lx +
                                " * (" +
                                st.report_data.lx +
                                "/2 - " +
                                st.report_data.xa +
                                ") + " +
                                st.report_data.ly +
                                " * (" +
                                st.a_column_size +
                                " + " +
                                st.report_data.h0 +
                                ")/2 = " +
                                st.report_data.sx +
                                " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ],
                    style: "Norm1",
                });
                sy = new Paragraph({
                    // result.sy = ly*((ly/2) - result.ya) + lx*(st.b_column_size + h0)/2;
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
                            text:
                                ")/2 = " +
                                st.report_data.ly +
                                " * (" +
                                st.report_data.ly +
                                "/2 - " +
                                st.report_data.ya +
                                ") + " +
                                st.report_data.lx +
                                " * (" +
                                st.b_column_size +
                                " + " +
                                st.report_data.h0 +
                                ")/2 = " +
                                st.report_data.sy +
                                " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ],
                    style: "Norm1",
                });
            }

            xc = new Paragraph({
                //result.xc = result.sx/result.u;
                children: [
                    xc_letter,
                    new TextRun({
                        text: " = ",
                    }),
                    sx_letter,
                    new TextRun({
                        text: "/u = " + st.report_data.sx + "/" + st.report_data.u + " = " + st.report_data.xc + " мм,",
                    }),
                ],
                style: "Norm1",
            });
            yc = new Paragraph({
                //result.yc = result.sy/result.u;
                children: [
                    yc_letter,
                    new TextRun({
                        text: " = ",
                    }),
                    sy_letter,
                    new TextRun({
                        text: "/u = " + st.report_data.sy + "/" + st.report_data.u + " = " + st.report_data.yc + " мм,",
                    }),
                ],
                style: "Norm1",
            });
            result = result.concat(xa, ya, sx, sy, xc, yc);
        }
        return result;
    };

    const report_6 = function () {
        //часть про Mbx и Ibx и Wbx
        var result = [];
        var ibx_cut = []; //вырубкa ib'x-ux'c
        var ibx, xmax_t, xmax, wbx, xmax_p1;
        //мы считаем Mbx и все остальное если у нас явно заданы моменты или моменты появляются от смещения центра тяжести сечения (рядом край плиты или отверстие)
        if (st.report_data.mx_1 || st.mx_load || st.openingIsNear) {
            if (st.openingIsNear) {
                //для начала посчитаем вырубку ib'x-ux'c
                //часть с буквами
                ibx_cut[0] = new TextRun({
                    text: " - I'",
                });
                ibx_cut[1] = new TextRun({
                    text: "bx",
                    subScript: true,
                });
                ibx_cut[2] = new TextRun({
                    text: " - u * x'",
                });
                ibx_cut[3] = new TextRun({
                    text: "c",
                    subScript: true,
                });
                ibx_cut[4] = sup_2;

                //часть с цифрами
                if (st.report_data.cut_xc >= 0) {
                    //если отрицательное, то берем в скобки
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
            if (st.slab_edge_type === "") {
                //если колонна не на краю плиты
                ibx = new Paragraph({
                    // I<sub>bx</sub> = L<sub>ux</sub><sup>3</sup>/6 + L<sub>uy</sub> * L<sub>ux</sub><sup>2</sup>/2 = " + st.report_data.size_u_top + "<sup>3</sup>/6 + " + st.report_data.size_u_left + " * " + st.report_data.size_u_top + "<sup>2</sup>/2 = " + st.report_data.ibx + " мм<sup>3</sup>, </p>"
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
                    style: "Norm1",
                });
                if (st.openingIsNear) {
                    //если рядом отверстие, то нужно будет высчитать эксцентриситет
                    xmax_t = new Paragraph({
                        //Наиболее удаленная точка
                        children: [
                            new TextRun({
                                text: "Наиболее удаленная точка вдоль оси X, ",
                            }),
                            xmax_letter,
                            new TextRun({
                                text: ":",
                            }),
                        ],
                        style: "Norm1",
                    });
                    xmax = new Paragraph({
                        //result.xmax_op = lx/2 + Math.abs(cut_xc);
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
                                subScript: true,
                            }),
                            new TextRun({
                                text: "| = " + st.report_data.lx + "/2 + |" + st.report_data.cut_xc + "| = " + st.report_data.xmax + " мм,",
                            }),
                        ],
                        style: "Norm1",
                    });
                    wbx = new Paragraph({
                        // result.wbx = result.ibx / result.xmax;
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
                            }),
                        ],
                        style: "Norm1",
                    });
                } else {
                    //если нет, то только wbx
                    wbx = new Paragraph({
                        // <p>W<sub>bx</sub> = I<sub>bx</sub>/(L<sub>ux</sub>/2) = " + st.report_data.ibx + "/(" + st.report_data.size_u_top + "/2) = " + st.report_data.wbx + " мм<sup>2</sup>, </p>" +
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
                            }),
                        ],
                        style: "Norm1",
                    });
                }
                result = [ibx, xmax_t, xmax, wbx];
            }
            if (
                st.slab_edge_type === "l" ||
                st.slab_edge_type === "r" ||
                st.slab_edge_type === "lt" ||
                st.slab_edge_type === "rt" ||
                st.slab_edge_type === "rb" ||
                st.slab_edge_type === "lb"
            ) {
                //если край плиты слева или справа или угловые
                if (st.slab_edge_type === "l") {
                    ibx = new Paragraph({
                        //  result.ibx = Math.pow(lx, 3)/6 + 2 * lx * Math.pow((result.xa + result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa - result.xc), 2);
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
                                text:
                                    "/6 + 2 * " +
                                    st.report_data.lx +
                                    " * (" +
                                    st.report_data.xa +
                                    " + " +
                                    st.report_data.xc +
                                    " - " +
                                    st.report_data.lx +
                                    "/2)",
                            }),
                            sup_2,
                            new TextRun({
                                text:
                                    " + " +
                                    st.report_data.ly +
                                    " * (" +
                                    st.report_data.lx +
                                    " - " +
                                    st.report_data.xa +
                                    " - " +
                                    st.report_data.xc +
                                    ")",
                            }),
                            sup_2,
                            ibx_cut[5],
                            ibx_cut[6],
                            new TextRun({
                                text: " = " + st.report_data.ibx + " мм",
                            }),
                            sup_3,
                        ],
                        style: "Norm1",
                    });
                }
                if (st.slab_edge_type === "r") {
                    ibx = new Paragraph({
                        //  result.ibx = Math.pow(lx, 3)/6 + 2 * lx * Math.pow((result.xa - result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa + result.xc), 2);
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
                                text:
                                    "/6 + 2 * " +
                                    st.report_data.lx +
                                    " * (" +
                                    st.report_data.xa +
                                    " - (" +
                                    st.report_data.xc +
                                    ") - " +
                                    st.report_data.lx +
                                    "/2)",
                            }),
                            sup_2,
                            new TextRun({
                                text:
                                    " + " +
                                    st.report_data.ly +
                                    " * (" +
                                    st.report_data.lx +
                                    " - " +
                                    st.report_data.xa +
                                    " + (" +
                                    st.report_data.xc +
                                    "))",
                            }),
                            sup_2,
                            ibx_cut[5],
                            ibx_cut[6],
                            new TextRun({
                                text: " = " + st.report_data.ibx + " мм",
                            }),
                            sup_3,
                        ],
                        style: "Norm1",
                    });
                }
                if (st.slab_edge_type === "lt" || st.slab_edge_type === "lb") {
                    ibx = new Paragraph({
                        //result.ibx = Math.pow(lx, 3)/12 + lx * Math.pow((result.xa + result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa - result.xc), 2);
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
                            lux_letter, //result.ibx = Math.pow(lx, 3)/12 + lx * Math.pow((result.xa + result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa - result.xc), 2);
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
                                text:
                                    "/12 + " +
                                    st.report_data.lx +
                                    " * (" +
                                    st.report_data.xa +
                                    " + " +
                                    st.report_data.xc +
                                    " - " +
                                    st.report_data.lx +
                                    "/2)",
                            }),
                            sup_2,
                            new TextRun({
                                text:
                                    " + " +
                                    st.report_data.ly +
                                    " * (" +
                                    st.report_data.lx +
                                    " - " +
                                    st.report_data.xa +
                                    " - " +
                                    st.report_data.xc +
                                    ")",
                            }),
                            sup_2,
                            ibx_cut[5],
                            ibx_cut[6],
                            new TextRun({
                                text: " = " + st.report_data.ibx + " мм",
                            }),
                            sup_3,
                        ],
                        style: "Norm1",
                    });
                }
                if (st.slab_edge_type === "rt" || st.slab_edge_type === "rb") {
                    ibx = new Paragraph({
                        //result.ibx = Math.pow(lx, 3)/12 + lx * Math.pow((result.xa - result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa + result.xc), 2);
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
                            lux_letter, //result.ibx = Math.pow(lx, 3)/12 + lx * Math.pow((result.xa - result.xc - lx/2), 2) + ly * Math.pow((lx - result.xa + result.xc), 2);
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
                                text:
                                    "/12 + " +
                                    st.report_data.lx +
                                    " * (" +
                                    st.report_data.xa +
                                    " - (" +
                                    st.report_data.xc +
                                    ") - " +
                                    st.report_data.lx +
                                    "/2)",
                            }),
                            sup_2,
                            new TextRun({
                                text:
                                    " + " +
                                    st.report_data.ly +
                                    " * (" +
                                    st.report_data.lx +
                                    " - " +
                                    st.report_data.xa +
                                    " + (" +
                                    st.report_data.xc +
                                    "))",
                            }),
                            sup_2,
                            ibx_cut[5],
                            ibx_cut[6],
                            new TextRun({
                                text: " = " + st.report_data.ibx + " мм",
                            }),
                            sup_3,
                        ],
                        style: "Norm1",
                    });
                }
                xmax_t = new Paragraph({
                    //Наиболее удаленная точка
                    children: [
                        new TextRun({
                            text: "Наиболее удаленная точка вдоль оси X, ",
                        }),
                        xmax_letter,
                        new TextRun({
                            text: ":",
                        }),
                    ],
                    style: "Norm1",
                });
                if (st.openingIsNear) {
                    //если есть отверстие, то его нужно учесть в максимальном расстоянии
                    if (st.report_data.cut_xc >= 0) {
                        xmax_p1 =
                            " = " +
                            st.report_data.xa +
                            " + |" +
                            st.report_data.xc +
                            "| + " +
                            st.report_data.cut_xc +
                            " = " +
                            st.report_data.xmax +
                            " мм,";
                    } else {
                        xmax_p1 =
                            " = " +
                            st.report_data.xa +
                            " + |" +
                            st.report_data.xc +
                            "| + (" +
                            st.report_data.cut_xc +
                            ") = " +
                            st.report_data.xmax +
                            " мм,";
                    }
                    xmax = new Paragraph({
                        //result.xmax = result.xa + result.xc + cut_xc;    result.ymax = result.ymax + cut_yc;
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
                                subScript: true,
                            }),
                            new TextRun({
                                text: xmax_p1,
                            }),
                        ],
                        style: "Norm1",
                    });
                } else {
                    xmax = new Paragraph({
                        //result.xmax = result.xa + result.xc;
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
                        style: "Norm1",
                    });
                }
                wbx = new Paragraph({
                    // result.wbx = result.ibx / result.xmax;
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
                        }),
                    ],
                    style: "Norm1",
                });
                result = result.concat(ibx, xmax_t, xmax, wbx);
            }
            if (st.slab_edge_type === "t" || st.slab_edge_type === "b") {
                //если край плиты сверху или снизу
                ibx = new Paragraph({
                    //  result.ibx = Math.pow(lx, 3)/12 + ly * Math.pow(lx, 2)/2;
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
                    style: "Norm1",
                });
                if (st.openingIsNear) {
                    xmax_t = new Paragraph({
                        //Наиболее удаленная точка
                        children: [
                            new TextRun({
                                text: "Наиболее удаленная точка вдоль оси X, ",
                            }),
                            xmax_letter,
                            new TextRun({
                                text: ":",
                            }),
                        ],
                        style: "Norm1",
                    });
                    xmax = new Paragraph({
                        //result.xmax_op = lx/2 + Math.abs(cut_xc);
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
                                subScript: true,
                            }),
                            new TextRun({
                                text: "| = " + st.report_data.lx + "/2 + |" + st.report_data.cut_xc + "| = " + st.report_data.xmax + " мм,",
                            }),
                        ],
                        style: "Norm1",
                    });
                    wbx = new Paragraph({
                        // result.wbx = result.ibx / result.xmax;
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
                            }),
                        ],
                        style: "Norm1",
                    });
                } else {
                    wbx = new Paragraph({
                        // result.wbx = result.ibx/(lx/2);
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
                            }),
                        ],
                        style: "Norm1",
                    });
                }
                result = result.concat(ibx, xmax_t, xmax, wbx);
            }
            var mbxult = new Paragraph({
                //"<p>M<sub>bx,ult</sub> = R<sub>bt</sub> * W<sub>bx</sub> * h<sub>0</sub> = " + st.report_data.rbt + " * " + st.report_data.wbx + " * " + st.report_data.h0 + " = " + st.report_data.mbx_ult + " кН*мм</p>" +
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
                        text:
                            " = " +
                            st.report_data.rbt +
                            " * " +
                            st.report_data.wbx +
                            " * " +
                            st.report_data.h0 +
                            " = " +
                            st.report_data.mbx_ult +
                            " кН*мм,",
                    }),
                ],
                style: "Norm1",
            });
            result.push(mbxult);
        }
        return result;
    };

    const report_7 = function () {
        //часть про Mby и Iby и Wby
        var result = [];
        var iby_cut = []; //вырубкa ib'y-uy'c
        var iby, ymax_t, ymax, wby, ymax_p1;
        //мы считаем Mby и все остальное если у нас явно заданы моменты или моменты появляются от смещения центра тяжести сечения (рядом край плиты или отверстие)
        if (st.report_data.my_1 || st.my_load || st.openingIsNear) {
            if (st.openingIsNear) {
                //для начала посчитаем вырубку ib'y-uy'c
                //часть с буквами
                iby_cut[0] = new TextRun({
                    text: " - I'",
                });
                iby_cut[1] = new TextRun({
                    text: "by",
                    subScript: true,
                });
                iby_cut[2] = new TextRun({
                    text: " - u * y'",
                });
                iby_cut[3] = new TextRun({
                    text: "c",
                    subScript: true,
                });
                iby_cut[4] = sup_2;

                //часть с цифрами
                if (st.report_data.cut_yc >= 0) {
                    //если отрицательное, то берем в скобки
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
            if (st.slab_edge_type === "") {
                //если колонна не на краю плиты
                iby = new Paragraph({
                    // <p>I<sub>by</sub> = L<sub>uy</sub><sup>3</sup>/6 + L<sub>ux</sub> * L<sub>uy</sub><sup>2</sup>/2 = " + st.report_data.size_u_left + "<sup>3</sup>/6 + " + st.report_data.size_u_top + " * " + st.report_data.size_u_left + "<sup>2</sup>/2 = " + st.report_data.iby + " мм<sup>3</sup>, </p>"
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
                    style: "Norm1",
                });
                if (st.openingIsNear) {
                    //если рядом отверстие, то нужно будет высчитать эксцентриситет
                    ymax_t = new Paragraph({
                        //Наиболее удаленная точка
                        children: [
                            new TextRun({
                                text: "Наиболее удаленная точка вдоль оси Y, ",
                            }),
                            ymax_letter,
                            new TextRun({
                                text: ":",
                            }),
                        ],
                        style: "Norm1",
                    });
                    ymax = new Paragraph({
                        //result.ymax_op = ly/2 + Math.abs(cut_yc);
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
                                subScript: true,
                            }),
                            new TextRun({
                                text: "| = " + st.report_data.ly + "/2 + |" + st.report_data.cut_yc + "| = " + st.report_data.ymax + " мм,",
                            }),
                        ],
                        style: "Norm1",
                    });
                    wby = new Paragraph({
                        //result.wby = result.iby / result.ymax;
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
                            }),
                        ],
                        style: "Norm1",
                    });
                } else {
                    //если нет, то только wby
                    wby = new Paragraph({
                        // <p>W<sub>by</sub> = I<sub>by</sub>/(L<sub>uy</sub>/2) = " + st.report_data.iby + "/(" + st.report_data.size_u_left + "/2) = " + st.report_data.wby + " мм<sup>2</sup>, </p>" +
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
                            }),
                        ],
                        style: "Norm1",
                    });
                }
                result = [iby, ymax_t, ymax, wby];
            }
            if (st.slab_edge_type === "l" || st.slab_edge_type === "r") {
                //если край плиты слева или справа
                iby = new Paragraph({
                    // result.iby = Math.pow(ly, 3)/12 + lx * Math.pow(ly, 2)/2;
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
                    style: "Norm1",
                });
                if (st.openingIsNear) {
                    ymax_t = new Paragraph({
                        //Наиболее удаленная точка
                        children: [
                            new TextRun({
                                text: "Наиболее удаленная точка вдоль оси Y, ",
                            }),
                            ymax_letter,
                            new TextRun({
                                text: ":",
                            }),
                        ],
                        style: "Norm1",
                    });
                    ymax = new Paragraph({
                        //result.ymax_op = ly/2 + Math.abs(cut_yc);
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
                                subScript: true,
                            }),
                            new TextRun({
                                text: "| = " + st.report_data.ly + "/2 + |" + st.report_data.cut_yc + "| = " + st.report_data.ymax + " мм,",
                            }),
                        ],
                        style: "Norm1",
                    });
                    wby = new Paragraph({
                        //result.wby = result.iby / result.ymax;
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
                            }),
                        ],
                        style: "Norm1",
                    });
                } else {
                    wby = new Paragraph({
                        // result.wby = result.iby/(ly/2);
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
                            }),
                        ],
                        style: "Norm1",
                    });
                }
                result = result.concat(iby, ymax_t, ymax, wby);
            }
            if (
                st.slab_edge_type === "t" ||
                st.slab_edge_type === "b" ||
                st.slab_edge_type === "lt" ||
                st.slab_edge_type === "rt" ||
                st.slab_edge_type === "rb" ||
                st.slab_edge_type === "lb"
            ) {
                //если край плиты сверху или снизу или угловые
                if (st.slab_edge_type === "t") {
                    iby = new Paragraph({
                        // result.iby = Math.pow(ly, 3)/6 + 2 * ly * Math.pow((result.ya - result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya + result.yc), 2);
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
                            new TextRun({
                                // result.iby = Math.pow(ly, 3)/6 + 2 * ly * Math.pow((result.ya - result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya + result.yc), 2);
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
                                text:
                                    "/6 + 2 * " +
                                    st.report_data.ly +
                                    " * (" +
                                    st.report_data.ya +
                                    " - " +
                                    st.report_data.yc +
                                    " - " +
                                    st.report_data.ly +
                                    "/2)",
                            }),
                            sup_2,
                            new TextRun({
                                text:
                                    " + " +
                                    st.report_data.lx +
                                    " * (" +
                                    st.report_data.ly +
                                    " - " +
                                    st.report_data.ya +
                                    " + " +
                                    st.report_data.yc +
                                    ")",
                            }),
                            sup_2,
                            iby_cut[5],
                            iby_cut[6],
                            new TextRun({
                                text: " = " + st.report_data.iby + " мм",
                            }),
                            sup_3,
                        ],
                        style: "Norm1",
                    });
                }
                if (st.slab_edge_type === "b") {
                    iby = new Paragraph({
                        // result.iby = Math.pow(ly, 3)/6 + 2 * ly * Math.pow((result.ya + result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya - result.yc), 2);
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
                            new TextRun({
                                // result.iby = Math.pow(ly, 3)/6 + 2 * ly * Math.pow((result.ya + result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya - result.yc), 2);
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
                                text:
                                    "/6 + 2 * " +
                                    st.report_data.ly +
                                    " * (" +
                                    st.report_data.ya +
                                    " + (" +
                                    st.report_data.yc +
                                    ") - " +
                                    st.report_data.ly +
                                    "/2)",
                            }),
                            sup_2,
                            new TextRun({
                                text:
                                    " + " +
                                    st.report_data.lx +
                                    " * (" +
                                    st.report_data.ly +
                                    " - " +
                                    st.report_data.ya +
                                    " - (" +
                                    st.report_data.yc +
                                    "))",
                            }),
                            sup_2,
                            iby_cut[5],
                            iby_cut[6],
                            new TextRun({
                                text: " = " + st.report_data.iby + " мм",
                            }),
                            sup_3,
                        ],
                        style: "Norm1",
                    });
                }
                if (st.slab_edge_type === "lt" || st.slab_edge_type === "rt") {
                    iby = new Paragraph({
                        // result.iby = Math.pow(ly, 3)/12 + ly * Math.pow((result.ya - result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya + result.yc), 2);
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
                            new TextRun({
                                // result.iby = Math.pow(ly, 3)/12 + ly * Math.pow((result.ya - result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya + result.yc), 2);
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
                                text:
                                    "/12 + " +
                                    st.report_data.ly +
                                    " * (" +
                                    st.report_data.ya +
                                    " - (" +
                                    st.report_data.yc +
                                    ") - " +
                                    st.report_data.ly +
                                    "/2)",
                            }),
                            sup_2,
                            new TextRun({
                                text:
                                    " + " +
                                    st.report_data.lx +
                                    " * (" +
                                    st.report_data.ly +
                                    " - " +
                                    st.report_data.ya +
                                    " + (" +
                                    st.report_data.yc +
                                    "))",
                            }),
                            sup_2,
                            iby_cut[5],
                            iby_cut[6],
                            new TextRun({
                                text: " = " + st.report_data.iby + " мм",
                            }),
                            sup_3,
                        ],
                        style: "Norm1",
                    });
                }
                if (st.slab_edge_type === "lb" || st.slab_edge_type === "rb") {
                    iby = new Paragraph({
                        // result.iby = Math.pow(ly, 3)/12 + ly * Math.pow((result.ya + result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya - result.yc), 2);
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
                            new TextRun({
                                // result.iby = Math.pow(ly, 3)/12 + ly * Math.pow((result.ya + result.yc - ly/2), 2) + lx * Math.pow((ly - result.ya - result.yc), 2);
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
                                text:
                                    "/12 + " +
                                    st.report_data.ly +
                                    " * (" +
                                    st.report_data.ya +
                                    " + " +
                                    st.report_data.yc +
                                    " - " +
                                    st.report_data.ly +
                                    "/2)",
                            }),
                            sup_2,
                            new TextRun({
                                text:
                                    " + " +
                                    st.report_data.lx +
                                    " * (" +
                                    st.report_data.ly +
                                    " - " +
                                    st.report_data.ya +
                                    " - " +
                                    st.report_data.yc +
                                    ")",
                            }),
                            sup_2,
                            iby_cut[5],
                            iby_cut[6],
                            new TextRun({
                                text: " = " + st.report_data.iby + " мм",
                            }),
                            sup_3,
                        ],
                        style: "Norm1",
                    });
                }
                ymax_t = new Paragraph({
                    //Наиболее удаленная точка
                    children: [
                        new TextRun({
                            text: "Наиболее удаленная точка вдоль оси Y, ",
                        }),
                        ymax_letter,
                        new TextRun({
                            text: ":",
                        }),
                    ],
                    style: "Norm1",
                });
                if (st.openingIsNear) {
                    //если есть отверстие, то его нужно учесть в максимальном расстоянии
                    if (st.report_data.cut_yc >= 0) {
                        ymax_p1 =
                            " = " +
                            st.report_data.ya +
                            " + |" +
                            st.report_data.yc +
                            "| + " +
                            st.report_data.cut_yc +
                            " = " +
                            st.report_data.ymax +
                            " мм,";
                    } else {
                        ymax_p1 =
                            " = " +
                            st.report_data.ya +
                            " + |" +
                            st.report_data.yc +
                            "| + (" +
                            st.report_data.cut_yc +
                            ") = " +
                            st.report_data.ymax +
                            " мм,";
                    }
                    ymax = new Paragraph({
                        //result.ymax = result.ya + result.yc + cut_yc;    result.ymax = result.ymax + cut_yc;
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
                                subScript: true,
                            }),
                            new TextRun({
                                text: ymax_p1,
                            }),
                        ],
                        style: "Norm1",
                    });
                } else {
                    ymax = new Paragraph({
                        //result.ymax = result.ya + result.yc;
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
                        style: "Norm1",
                    });
                }
                wby = new Paragraph({
                    //result.wby = result.iby / result.ymax;
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
                        }),
                    ],
                    style: "Norm1",
                });
                result = result.concat(iby, ymax_t, ymax, wby);
            }
            var mbyult = new Paragraph({
                // M<sub>by,ult</sub> = R<sub>bt</sub> * W<sub>by</sub> * h<sub>0</sub> = " + st.report_data.rbt + " * " + st.report_data.wby + " * " + st.report_data.h0 + " = " + st.report_data.mby_ult + " кН*мм</p>
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
                        text:
                            " = " +
                            st.report_data.rbt +
                            " * " +
                            st.report_data.wby +
                            " * " +
                            st.report_data.h0 +
                            " = " +
                            st.report_data.mby_ult +
                            " кН*мм,",
                    }),
                ],
                style: "Norm1",
            });
            result.push(mbyult);
        }
        return result;
    };

    const report_8 = function () {
        //часть про Fsw,ult
        var result = [];
        if (st.shear_reinforcement) {
            result = [
                new Paragraph({
                    // <p>Принимаем, что поперечная арматура расположена равномерно вдоль контура продавливания. В расчете учитывается только арматура попадающая в зазор 0.5h<sub>0</sub> по обе стороны от u. </p>" +
                    children: [
                        new TextRun({
                            text: "Принимаем, что поперечная арматура расположена равномерно вдоль контура продавливания. В расчете учитывается только арматура попадающая в зазор 0.5",
                        }),
                        h0_letter,
                        new TextRun({
                            text: " по обе стороны от u.",
                        }),
                    ],
                    style: "Norm1",
                }),
                new Paragraph({
                    //"<p>Количество стержней учитываемых в расчете, n = " + st.aswCircles.length + " шт.</p>" +
                    children: [
                        new TextRun({
                            text: "Количество стержней учитываемых в расчете, n = " + st.aswCircles.length + " шт.",
                        }),
                    ],
                    style: "Norm1",
                }),
                new Paragraph({
                    //"<p>Полная площадь учитываемой поперечной арматуры, A<sub>sw_tot</sub>:" +
                    children: [
                        new TextRun({
                            text: "Полная площадь учитываемой поперечной арматуры, ",
                        }),
                        asw_tot_letter,
                        new TextRun({
                            text: ":",
                        }),
                    ],
                    style: "Norm1",
                }),
                new Paragraph({
                    //<p>A<sub>sw_tot</sub> = n * πr<sup>2</sup> = " + st.aswCircles.length + " * 3.142 * " + (st.shear_bars_diameter/2) + "<sup>2</sup> = " + st.asw_tot + " мм<sup>2</sup>,</p>" +
                    children: [
                        asw_tot_letter,
                        new TextRun({
                            text: " = n * πr",
                        }),
                        sup_2,
                        new TextRun({
                            text: " = " + st.aswCircles.length + " * 3.142 * " + st.shear_bars_diameter / 2,
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
                    style: "Norm1",
                }),
                new Paragraph({
                    // A<sub>sw</sub>/sw = A<sub>sw_tot</sub>/u = " + st.asw_tot + "/" + st.report_data.u + " = " + st.report_data.asw_sw + ",</p>" +
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
                    style: "Norm1",
                }),
                new Paragraph({
                    // q<sub>sw</sub> = R<sub>sw</sub> * A<sub>sw</sub>/sw = " + rsw + " * " + st.report_data.asw_sw + " = " + st.report_data.qsw + " кН/мм, </p>" +
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
                    style: "Norm1",
                }),
                new Paragraph({
                    // <p>F<sub>sw,ult</sub> = 0.8 * q<sub>sw</sub> * u = 0.8 * " + st.report_data.qsw  + " * " + st.report_data.u + " = " +  st.report_data.fsw_ult_1 + " кН,</p>" +
                    children: [
                        fswult_letter,
                        new TextRun({
                            text: " = 0.8 * ",
                        }),
                        qsw_letter,
                        new TextRun({
                            text: " * u = 0.8 * " + st.report_data.qsw + " * " + st.report_data.u + " = " + st.report_data.fsw_ult_1 + " кН,",
                        }),
                    ],
                    style: "Norm1",
                }),
            ];
        }
        return result;
    };

    const report_9 = function () {
        //1 проверка Fsw,ult
        var result = [];
        if (st.shear_reinforcement) {
            var fb_ult_check = 0.25 * st.report_data.fb_ult; //0.25*Fbult
            fb_ult_check = Number(fb_ult_check.toFixed(3));
            if (st.report_data.fsw_ult_1 < fb_ult_check) {
                result = [
                    new Paragraph({
                        // Т.к. F<sub>sw,ult</sub> = " + st.report_data.fsw_ult_1 + " кН < 0.25 * F<sub>b,ult</sub> = " + (0.25*st.report_data.fb_ult) + " кН, поперечная арматура в расчете не учитывается. Принимаем F<sub>sw,ult</sub> = 0" + ",</p>
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
                        style: "Norm1",
                    }),
                ];
            } else {
                result = [
                    new Paragraph({
                        // <p>Условие F<sub>sw,ult</sub> = " + st.report_data.fsw_ult_1 + " кН ≥ 0.25 * F<sub>b,ult</sub> = " + (0.25*st.report_data.fb_ult) + " кН выполняется. Поперечная арматура учитывается в расчете.
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
                        style: "Norm1",
                    }),
                ];
            }
        }
        return result;
    };

    const report_10 = function () {
        //2 проверка Fsw,ult
        var result = [];
        if (st.shear_reinforcement) {
            if (st.report_data.fsw_ult_1 > st.report_data.fb_ult) {
                result = [
                    new Paragraph({
                        // Т.к. F<sub>sw,ult</sub> = " + st.report_data.fsw_ult_1 + " кН > F<sub>b,ult</sub> = " + st.report_data.fb_ult + " кН, принимаем F<sub>sw,ult</sub> = F<sub>b,ult</sub> = " + st.report_data.fb_ult + " кН,
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
                        style: "Norm1",
                    }),
                ];
            } else {
                result = [
                    new Paragraph({
                        // Т.к. F<sub>sw,ult</sub> = " + st.report_data.fsw_ult_1 + " кН ≤ F<sub>b,ult</sub> = " + st.report_data.fb_ult + " кН, оставляем значение F<sub>sw,ult</sub> = " + st.report_data.fsw_ult_1 + "кН,
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
                        style: "Norm1",
                    }),
                ];
            }
        }
        return result;
    };

    const report_11 = function () {
        //часть про Fult
        var result = [];
        if (st.shear_reinforcement) {
            result = [
                new Paragraph({
                    // F<sub>ult</sub> = F<sub>b,ult</sub> + F<sub>sw,ult</sub> = " + st.report_data.fb_ult  + " кН + " + st.report_data.fsw_ult + " кН = " +  st.report_data.f_ult + " кН,</p>"
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
                            text: " = " + st.report_data.fb_ult + " кН + " + st.report_data.fsw_ult + " кН = " + st.report_data.f_ult + " кН,",
                        }),
                    ],
                    style: "Norm1",
                }),
            ];
        }
        return result;
    };

    const report_12 = function () {
        //часть про Mswx,ult
        var result = [];
        // если у нас есть армирование и момент заданный либо прямо, либо появившийся в результате смещения центра тяжести
        if (st.shear_reinforcement && (st.report_data.mx_1 || st.mx_load || st.openingIsNear)) {
            result = [
                new Paragraph({
                    //<p>W<sub>sw,x</sub> = W<sub>bx</sub> = " + st.report_data.wbx  + " мм<sup>2</sup>,</p>" +
                    children: [
                        wswx_letter,
                        new TextRun({
                            text: " = ",
                        }),
                        wbx_letter,
                        new TextRun({
                            text: " = " + st.report_data.wbx + " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ],
                    style: "Norm1",
                }),
                new Paragraph({
                    //M<sub>sw,x,ult</sub> = 0.8 * q<sub>sw</sub> * W<sub>sw,x</sub> = 0.8 * " + st.report_data.qsw  + " * " + st.report_data.wbx + " = " + st.report_data.mswx_ult_1 + " кН*мм,</p>"
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
                            text: " = 0.8 * " + st.report_data.qsw + " * " + st.report_data.wbx + " = " + st.report_data.mswx_ult_1 + " кН*мм,",
                        }),
                    ],
                    style: "Norm1",
                }),
            ];
        }
        return result;
    };

    const report_13 = function () {
        //проверка Mswx,ult
        var result = [];
        // если у нас есть армирование и момент заданный либо прямо, либо появившийся в результате смещения центра тяжести
        if (st.shear_reinforcement && (st.report_data.mx_1 || st.mx_load || st.openingIsNear)) {
            if (st.report_data.mswx_ult_1 > st.report_data.mbx_ult) {
                result = [
                    new Paragraph({
                        //Т.к. M<sub>sw,x,ult</sub> = " + st.report_data.mswx_ult_1 + " кН*мм > M<sub>bx,ult</sub> = " + st.report_data.mbx_ult + " кН*мм, принимаем M<sub>sw,x,ult</sub> = M<sub>bx,ult</sub>  = " + st.report_data.mbx_ult + " кН*мм
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
                            }),
                        ],
                        style: "Norm1",
                    }),
                ];
            } else {
                result = [
                    new Paragraph({
                        //Т.к. M<sub>sw,x,ult</sub> = " + st.report_data.mswx_ult_1 + " кН*мм ≤ M<sub>bx,ult</sub> = " + st.report_data.mbx_ult + " кН*мм, оставляем значение M<sub>sw,x,ult</sub> = " + st.report_data.mswx_ult_1 + " кН*мм,</p>
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
                        style: "Norm1",
                    }),
                ];
            }
        }
        return result;
    };

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

    const report_14 = function () {
        //часть про Mswy,ult
        var result = [];
        // если у нас есть армирование и момент заданный либо прямо, либо появившийся в результате смещения центра тяжести
        if (st.shear_reinforcement && (st.report_data.my_1 || st.my_load || st.openingIsNear)) {
            result = [
                new Paragraph({
                    //"<p>W<sub>sw,y</sub> = W<sub>by</sub> = " + st.report_data.wby  + " мм<sup>2</sup>,</p>" +
                    children: [
                        wswy_letter,
                        new TextRun({
                            text: " = ",
                        }),
                        wby_letter,
                        new TextRun({
                            text: " = " + st.report_data.wby + " мм",
                        }),
                        sup_2,
                        new TextRun({
                            text: ",",
                        }),
                    ],
                    style: "Norm1",
                }),
                new Paragraph({
                    //M<sub>sw,y,ult</sub> = 0.8 * q<sub>sw</sub> * W<sub>sw,y</sub> = 0.8 * " + st.report_data.qsw  + " * " + st.report_data.wby + " = " + st.report_data.mswy_ult_1 + " кН*мм,</p>" +
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
                            text: " = 0.8 * " + st.report_data.qsw + " * " + st.report_data.wby + " = " + st.report_data.mswy_ult_1 + " кН*мм,",
                        }),
                    ],
                    style: "Norm1",
                }),
            ];
        }
        return result;
    };

    const report_15 = function () {
        //проверка Mswy,ult
        var result = [];
        // если у нас есть армирование и момент заданный либо прямо, либо появившийся в результате смещения центра тяжести
        if (st.shear_reinforcement && (st.report_data.my_1 || st.my_load || st.openingIsNear)) {
            if (st.report_data.mswy_ult_1 > st.report_data.mby_ult) {
                result = [
                    new Paragraph({
                        //"<p>Т.к. M<sub>sw,y,ult</sub> = " + st.report_data.mswy_ult_1 + " кН*мм > M<sub>by,ult</sub> = " + st.report_data.mby_ult + " кН*мм, принимаем M<sub>sw,y,ult</sub> = M<sub>by,ult</sub>  = " + st.report_data.mby_ult + " кН*мм,</p>"
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
                            }),
                        ],
                        style: "Norm1",
                    }),
                ];
            } else {
                result = [
                    new Paragraph({
                        //Т.к. M<sub>sw,y,ult</sub> = " + st.report_data.mswy_ult_1 + " кН*мм ≤ M<sub>by,ult</sub> = " + st.report_data.mby_ult + " кН*мм, оставляем значение M<sub>sw,y,ult</sub> = " + st.report_data.mswy_ult_1 + " кН*мм,</p>
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
                        style: "Norm1",
                    }),
                ];
            }
        }
        return result;
    };

    var mx_ult = st.report_data.mbx_ult + st.report_data.mswx_ult;
    mx_ult = Number(mx_ult.toFixed(3));

    const report_16 = function () {
        //часть про Mx,ult
        var result = [];
        // если у нас есть армирование и момент заданный либо прямо, либо появившийся в результате смещения центра тяжести
        if (st.shear_reinforcement && (st.report_data.mx_1 || st.mx_load || st.openingIsNear)) {
            result = [
                new Paragraph({
                    //M<sub>x,ult</sub> = M<sub>bx,ult</sub> + M<sub>sw,x,ult</sub> = " + st.report_data.mbx_ult  + " кН*мм + " + st.report_data.mswx_ult + " кН*мм = " +  mx_ult + " кН*мм,</p>" +
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
                            text: " = " + st.report_data.mbx_ult + " кН*мм + " + st.report_data.mswx_ult + " кН*мм = " + mx_ult + " кН*мм,",
                        }),
                    ],
                    style: "Norm1",
                }),
            ];
        }
        return result;
    };

    var my_ult = st.report_data.mby_ult + st.report_data.mswy_ult;
    my_ult = Number(my_ult.toFixed(3));

    const report_17 = function () {
        //часть про My,ult
        var result = [];
        // если у нас есть армирование и момент заданный либо прямо, либо появившийся в результате смещения центра тяжести
        if (st.shear_reinforcement && (st.report_data.my_1 || st.my_load || st.openingIsNear)) {
            result = [
                new Paragraph({
                    //M<sub>y,ult</sub> = M<sub>by,ult</sub> + M<sub>sw,y,ult</sub> = " + st.report_data.mby_ult  + " кН*мм + " + st.report_data.mswy_ult + " кН*мм = " +  my_ult + " кН*мм,
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
                            text: " = " + st.report_data.mby_ult + " кН*мм + " + st.report_data.mswy_ult + " кН*мм = " + my_ult + " кН*мм,",
                        }),
                    ],
                    style: "Norm1",
                }),
            ];
        }
        return result;
    };

    var n_factor_check = 0.5 * st.report_data.n_factor; //0.5*st.report_data.n_factor
    n_factor_check = Number(n_factor_check.toFixed(3));

    const report_18 = function () {
        //вычисление м фактор и н фактор
        var result = [];
        var p1, p2, p3, p4, p5;
        if (!st.shear_reinforcement) {
            fult_letter = fbult_letter;
            mxult_letter = mbxult_letter;
            myult_letter = mbyult_letter;
        }
        if (st.report_data.m_factor_1 !== 0 || st.report_data.m_factor_2 !== 0) {
            if (st.slab_edge_type === "" && !st.openingIsNear) {
                //если колонна не на краю плиты и нет лишних эксценриситетов от отверстия
                if (st.mx_load && st.my_load) {
                    p1 = new Paragraph({
                        //"<p>Выражение Mx/M<sub>x,ult</sub> + My/M<sub>y,ult</sub> = " + st.mx_load*1000 + " кН*мм / " + mx_ult + " + " + st.my_load*1000 + " кН*мм / " + my_ult + " = " + st.report_data.m_factor_1 + ",</p>" +
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
                                text:
                                    " = " +
                                    st.mx_load * 1000 +
                                    " кН*мм / " +
                                    mx_ult +
                                    " + " +
                                    st.my_load * 1000 +
                                    " кН*мм / " +
                                    my_ult +
                                    " = " +
                                    st.report_data.m_factor_1 +
                                    ",",
                            }),
                        ],
                        style: "Norm1",
                    });
                }
                if (st.mx_load && !st.my_load) {
                    p1 = new Paragraph({
                        //"<p>Выражение Mx/M<sub>x,ult</sub>
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
                                text: " = " + st.mx_load * 1000 + " кН*мм / " + mx_ult + " + 0 = " + st.report_data.m_factor_1 + ",",
                            }),
                        ],
                        style: "Norm1",
                    });
                }
                if (!st.mx_load && st.my_load) {
                    p1 = new Paragraph({
                        //"My/M<sub>y,ult</sub>
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
                                text: " = 0 + " + st.my_load * 1000 + " кН*мм / " + my_ult + " = " + st.report_data.m_factor_1 + ",",
                            }),
                        ],
                        style: "Norm1",
                    });
                }
                p2 = new Paragraph({
                    //Выражение F/(2*F<sub>ult</sub>) = " + st.n_load + " /(2 * " + st.report_data.f_ult  + ") = " + 0.5*st.report_data.n_factor + ",</p>" +
                    children: [
                        new TextRun({
                            text: "Выражение F/(2*",
                        }),
                        fult_letter,
                        new TextRun({
                            text: ") = " + st.n_load + " / (2 * " + st.report_data.f_ult + ") = " + n_factor_check + ",",
                        }),
                    ],
                    style: "Norm1",
                });
                result = [p1, p2];
            }
            if (st.slab_edge_type === "" && st.openingIsNear) {
                //если u просто прямоугольник и есть отверстия - докидываем моменты от расцентровки
                p1 = new Paragraph({
                    //"Учет эксцентриситета приложения продавливающего усилия:",
                    children: [
                        new TextRun({
                            text: "Учет эксцентриситета приложения продавливающего усилия:",
                        }),
                    ],
                    style: "Norm1",
                });
                p2 = new Paragraph({
                    //mx_1 = Math.abs(st.mx_load*1000) + Math.abs(st.n_load*geom_chars.cut_xc);
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
                            subScript: true,
                        }),
                        new TextRun({
                            text:
                                "| = |" +
                                st.mx_load * 1000 +
                                "| кН*мм + |" +
                                st.n_load +
                                "| кН * |" +
                                st.report_data.cut_xc +
                                "| мм = " +
                                st.report_data.mx_1 +
                                " кН*мм,",
                        }),
                    ],
                    style: "Norm1",
                });
                p3 = new Paragraph({
                    //my_1 = Math.abs(st.my_load*1000) + Math.abs(st.n_load*geom_chars.yc);
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
                            subScript: true,
                        }),
                        new TextRun({
                            text:
                                "| = |" +
                                st.my_load * 1000 +
                                "| кН*мм + |" +
                                st.n_load +
                                "| кН * |" +
                                st.report_data.cut_yc +
                                "| мм = " +
                                st.report_data.my_1 +
                                " кН*мм,",
                        }),
                    ],
                    style: "Norm1",
                });
                p4 = new Paragraph({
                    //"<p>Выражение Mx/M<sub>x,ult</sub> + My/M<sub>y,ult</sub> = " + st.mx_load*1000 + " кН*мм / " + mx_ult + " + " + st.my_load*1000 + " кН*мм / " + my_ult + " = " + st.report_data.m_factor_1 + ",</p>" +
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
                            text:
                                " = " +
                                st.report_data.mx_1 +
                                " кН*мм / " +
                                mx_ult +
                                " + " +
                                st.report_data.my_1 +
                                " кН*мм / " +
                                my_ult +
                                " = " +
                                st.report_data.m_factor_1 +
                                ",",
                        }),
                    ],
                    style: "Norm1",
                });
                p5 = new Paragraph({
                    //Выражение F/(2*F<sub>ult</sub>) = " + st.n_load + " /(2 * " + st.report_data.f_ult  + ") = " + 0.5*st.report_data.n_factor + ",</p>" +
                    children: [
                        new TextRun({
                            text: "Выражение F/(2*",
                        }),
                        fult_letter,
                        new TextRun({
                            text: ") = " + st.n_load + " / (2 * " + st.report_data.f_ult + ") = " + n_factor_check + ",",
                        }),
                    ],
                    style: "Norm1",
                });
                result = [p1, p2, p3, p4, p5];
            }
            if (st.slab_edge_type !== "" && !st.openingIsNear) {
                //если край плиты рядом или нет отверстий)
                p1 = new Paragraph({
                    //"Учет эксцентриситета приложения продавливающего усилия:",
                    children: [
                        new TextRun({
                            text: "Учет эксцентриситета приложения продавливающего усилия:",
                        }),
                    ],
                    style: "Norm1",
                });
                if (st.report_data.mx_1 && st.report_data.my_1) {
                    p2 = new Paragraph({
                        //mx_1 = Math.abs(st.mx_load*1000) + Math.abs(st.n_load*geom_chars.xc);
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
                                text:
                                    "| = |" +
                                    st.mx_load * 1000 +
                                    "| кН*мм + |" +
                                    st.n_load +
                                    "| кН * |" +
                                    st.report_data.xc +
                                    "| мм = " +
                                    st.report_data.mx_1 +
                                    " кН*мм,",
                            }),
                        ],
                        style: "Norm1",
                    });
                    p3 = new Paragraph({
                        //my_1 = Math.abs(st.my_load*1000) + Math.abs(st.n_load*geom_chars.yc);
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
                                text:
                                    "| = |" +
                                    st.my_load * 1000 +
                                    "| кН*мм + |" +
                                    st.n_load +
                                    "| кН * |" +
                                    st.report_data.yc +
                                    "| мм = " +
                                    st.report_data.my_1 +
                                    " кН*мм,",
                            }),
                        ],
                        style: "Norm1",
                    });
                    p4 = new Paragraph({
                        //"<p>Выражение Mx/M<sub>x,ult</sub> + My/M<sub>y,ult</sub> = " + st.mx_load*1000 + " кН*мм / " + mx_ult + " + " + st.my_load*1000 + " кН*мм / " + my_ult + " = " + st.report_data.m_factor_1 + ",</p>" +
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
                                text:
                                    " = " +
                                    st.report_data.mx_1 +
                                    " кН*мм / " +
                                    mx_ult +
                                    " + " +
                                    st.report_data.my_1 +
                                    " кН*мм / " +
                                    my_ult +
                                    " = " +
                                    st.report_data.m_factor_1 +
                                    ",",
                            }),
                        ],
                        style: "Norm1",
                    });
                }
                if (st.report_data.mx_1 && !st.report_data.my_1) {
                    p2 = new Paragraph({
                        //mx_1 = Math.abs(st.mx_load*1000) + Math.abs(st.n_load*geom_chars.xc);
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
                                text:
                                    "| = |" +
                                    st.mx_load * 1000 +
                                    "| кН*мм + |" +
                                    st.n_load +
                                    "| кН * |" +
                                    st.report_data.xc +
                                    "| мм = " +
                                    st.report_data.mx_1 +
                                    " кН*мм,",
                            }),
                        ],
                        style: "Norm1",
                    });
                    p4 = new Paragraph({
                        //"<p>Выражение Mx/M<sub>x,ult</sub>
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
                        style: "Norm1",
                    });
                }
                if (!st.report_data.mx_1 && st.report_data.my_1) {
                    p3 = new Paragraph({
                        //my_1 = Math.abs(st.my_load*1000) + Math.abs(st.n_load*geom_chars.yc);
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
                                text:
                                    "| = |" +
                                    st.my_load * 1000 +
                                    "| кН*мм + |" +
                                    st.n_load +
                                    "| кН * |" +
                                    st.report_data.yc +
                                    "| мм = " +
                                    st.report_data.my_1 +
                                    " кН*мм,",
                            }),
                        ],
                        style: "Norm1",
                    });
                    p4 = new Paragraph({
                        //My/M<sub>y,ult</sub>
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
                        style: "Norm1",
                    });
                }
                p5 = new Paragraph({
                    //Выражение F/(2*F<sub>ult</sub>) = " + st.n_load + " /(2 * " + st.report_data.f_ult  + ") = " + 0.5*st.report_data.n_factor + ",</p>" +
                    children: [
                        new TextRun({
                            text: "Выражение F/(2*",
                        }),
                        fult_letter,
                        new TextRun({
                            text: ") = " + st.n_load + " / (2 * " + st.report_data.f_ult + ") = " + n_factor_check + ",",
                        }),
                    ],
                    style: "Norm1",
                });
                result = [p1, p2, p3, p4, p5];
            }
            if (st.slab_edge_type !== "" && st.openingIsNear) {
                //если край плиты рядом или нет отверстий)
                p1 = new Paragraph({
                    //"Учет эксцентриситета приложения продавливающего усилия:",
                    children: [
                        new TextRun({
                            text: "Учет эксцентриситета приложения продавливающего усилия:",
                        }),
                    ],
                    style: "Norm1",
                });
                p2 = new Paragraph({
                    //mx_1 = Math.abs(st.mx_load*1000) + Math.abs(st.n_load*geom_chars.xc) + Math.abs(st.n_load*geom_chars.cut_xc);
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
                            subScript: true,
                        }),
                        new TextRun({
                            text:
                                "| = |" +
                                st.mx_load * 1000 +
                                "| кН*мм + |" +
                                st.n_load +
                                "| кН * |" +
                                st.report_data.xc +
                                "| мм + |" +
                                st.n_load +
                                "| кН * |" +
                                st.report_data.cut_xc +
                                "| мм = " +
                                st.report_data.mx_1 +
                                " кН*мм,",
                        }),
                    ],
                    style: "Norm1",
                });
                p3 = new Paragraph({
                    //my_1 = Math.abs(st.my_load*1000) + Math.abs(st.n_load*geom_chars.yc) + Math.abs(st.n_load*geom_chars.cut_yc);
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
                            subScript: true,
                        }),
                        new TextRun({
                            text:
                                "| = |" +
                                st.my_load * 1000 +
                                "| кН*мм + |" +
                                st.n_load +
                                "| кН * |" +
                                st.report_data.yc +
                                "| мм + |" +
                                st.n_load +
                                "| кН * |" +
                                st.report_data.cut_yc +
                                "| мм = " +
                                st.report_data.my_1 +
                                " кН*мм,",
                        }),
                    ],
                    style: "Norm1",
                });
                p4 = new Paragraph({
                    //"<p>Выражение Mx/M<sub>x,ult</sub> + My/M<sub>y,ult</sub> = " + st.mx_load*1000 + " кН*мм / " + mx_ult + " + " + st.my_load*1000 + " кН*мм / " + my_ult + " = " + st.report_data.m_factor_1 + ",</p>" +
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
                            text:
                                " = " +
                                st.report_data.mx_1 +
                                " кН*мм / " +
                                mx_ult +
                                " + " +
                                st.report_data.my_1 +
                                " кН*мм / " +
                                my_ult +
                                " = " +
                                st.report_data.m_factor_1 +
                                ",",
                        }),
                    ],
                    style: "Norm1",
                });
                p5 = new Paragraph({
                    //Выражение F/(2*F<sub>ult</sub>) = " + st.n_load + " /(2 * " + st.report_data.f_ult  + ") = " + 0.5*st.report_data.n_factor + ",</p>" +
                    children: [
                        new TextRun({
                            text: "Выражение F/(2*",
                        }),
                        fult_letter,
                        new TextRun({
                            text: ") = " + st.n_load + " / (2 * " + st.report_data.f_ult + ") = " + n_factor_check + ",",
                        }),
                    ],
                    style: "Norm1",
                });
                result = [p1, p2, p3, p4, p5];
            }
        }
        return result;
    };

    const report_19 = function () {
        //проверка mfactor
        var result = [];
        if (st.report_data.m_factor_1 !== 0 || st.report_data.m_factor_2 !== 0) {
            if (st.report_data.m_factor_1 > n_factor_check) {
                result = [
                    new Paragraph({
                        //Т.к. " + st.report_data.m_factor_1 + " > " + 0.5*st.report_data.n_factor + ", принимаем Mx/M<sub>x,ult</sub> + My/M<sub>y,ult</sub> = " + 0.5*st.report_data.n_factor + " ,</p>"
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
                        style: "Norm1",
                    }),
                ];
            } else {
                result = [
                    new Paragraph({
                        //Т.к. " + st.report_data.m_factor_1 + " ≤ " + 0.5*st.report_data.n_factor + ", оставляем значение Mx/M<sub>x,ult</sub> + My/M<sub>y,ult</sub> = " + st.report_data.m_factor_1 + " ,</p>"
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
                        style: "Norm1",
                    }),
                ];
            }
        }
        return result;
    };

    const report_20 = function () {
        //считаем коэф. использования
        var result = [];
        if (st.report_data.m_factor_1 === 0 || st.report_data.m_factor_2 === 0) {
            result = [
                new Paragraph({
                    //Коэффициент использования = F/F<sub>ult</sub>
                    children: [
                        new TextRun({
                            text: "Коэффициент использования = F/",
                        }),
                        fult_letter,
                        new TextRun({
                            text: " = " + st.n_load + " / " + st.report_data.f_ult + " = " + st.report_data.factor + ",",
                        }),
                    ],
                    style: "Norm1",
                }),
            ];
        } else {
            result = [
                new Paragraph({
                    //Коэффициент использования = F/F<sub>ult</sub> + Mx/M<sub>x,ult</sub> + My/M<sub>y,ult</sub> = " + st.n_load + " / " + st.report_data.f_ult  + " + " + st.report_data.m_factor_2 + " = " + st.report_data.factor + ",</p>" +
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
                            text:
                                " = " +
                                st.n_load +
                                " / " +
                                st.report_data.f_ult +
                                " + " +
                                st.report_data.m_factor_2 +
                                " = " +
                                st.report_data.factor +
                                ",",
                        }),
                    ],
                    style: "Norm1",
                }),
            ];
        }
        return result;
    };

    const report_21 = function () {
        //пишем вывод
        var result = [];
        if (st.report_data.factor <= 1) {
            result = [
                new Paragraph({
                    //<p><b>Вывод: прочность обеспечена. Коэффициент использования = " + st.report_data.factor + " .</b></p>" +
                    children: [
                        new TextRun({
                            text: "Вывод: прочность обеспечена. Коэффициент использования = " + st.report_data.factor + ".",
                        }),
                    ],
                    style: "Head2",
                }),
            ];
        } else {
            result = [
                new Paragraph({
                    //<p><b>Вывод: прочность не обеспечена. Коэффициент использования = " + st.report_data.factor + " .</b></p>" +
                    children: [
                        new TextRun({
                            text: "Вывод: прочность не обеспечена. Коэффициент использования = " + st.report_data.factor + ".",
                        }),
                    ],
                    style: "Head2",
                }),
            ];
        }
        return result;
    };

    //собираем всю текстовку вместе
    var word_text = report_1.concat(
        report_2(),
        report_3(),
        report_4(),
        report_5(),
        report_6a(),
        report_6b(),
        report_6(),
        report_7(),
        report_8(),
        report_9(),
        report_10(),
        report_11(),
        report_12(),
        report_13(),
        report_14(),
        report_15(),
        report_16(),
        report_17(),
        report_18(),
        report_19(),
        report_20(),
        report_21()
    );

    //console.log(JSON.stringify(word_text));

    // и запихиваем её в Word
    doc.addSection({
        properties: {},
        children: word_text,
    });

    //сохраняем файл отчета
    Packer.toBlob(doc).then((blob) => {
        // saveAs from FileSaver will download the file
        saveAs(blob, "prodavlivanie.docx");
    });
}
