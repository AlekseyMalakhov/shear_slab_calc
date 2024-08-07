export var footer_appear = 840; //высота экрана при которой появляется футер

export var concrete_properties = {
    //Rb, Rbt, МПа
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
    b100: [47.5, 2.2],
};

export var rebar_properies = {
    //Rsw, МПа
    a240c: 170,
    a400c: 280,
    a500c: 300,
};

export var unitFactor = {
    //коэффициенты перевода единиц
    force_units: {
        кН: 1, //основная единица внутренних расчетнов
        т: 9.807,
    },
    length_units: {
        мм: 1, //основная единица внутренних расчетов
        см: 10,
        м: 1000,
    },
};
