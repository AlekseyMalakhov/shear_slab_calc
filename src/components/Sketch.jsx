import React from "react";
import Button from "react-bootstrap/Button";

export default class Sketch extends React.Component {
    // рисуем картинку
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

    createCircles() {
        //рисуем кружки арматуры
        var circles = [];
        var color;
        var gs = this.props.globalState;
        for (var i = 0; i < gs.circlesX.length; i++) {
            color = checkAswCircles(gs.circlesX[i], gs.circlesY[i]); //проверяем цвет. Если кружок в пределах рабочей зоны - то один цвет, если нет - то другой
            var circle = (
                <circle
                    className={this.circlesVisibility()}
                    key={"b" + i}
                    cx={gs.circlesX[i]}
                    cy={gs.circlesY[i]}
                    r="3"
                    fill={color}
                    stroke={color}
                    strokeWidth="1"
                ></circle>
            );
            circles.push(circle);
        }

        function checkAswCircles(circleX, circleY) {
            //uDisplayCoords: [x1, y1, x2, y2],  Проверяем попадают ли кружки в рабочую зону и выбираем соответственно цвет
            var color;
            for (var i = 0; i < gs.aswCircles.length; i++) {
                // aswCircles [circleX, circleY] - сверяем наш кружок со списком кружков попавших в asw_tot. если совпадает - останавливаем итерацию и возвращаем black. если не совпадает - возвращаем 359ccc
                var arr = gs.aswCircles[i];
                if (circleX === arr[0] && circleY === arr[1]) {
                    color = "black";
                    return color;
                }
            }
            color = "#359ccc";
            return color;
        }

        return circles;
    }

    circlesVisibility() {
        //выключаем кружки если мы выбрали нет поперечного армирования
        var string;
        if (this.props.globalState.shear_reinforcement) {
            string = "circles_bars";
        } else {
            string = "circles_bars invisible";
        }
        return string;
    }

    createOpenings() {
        //рисуем отверстия
        var gs = this.props.globalState;
        var openings = [];
        var opening;

        for (var i = 1; i < gs.openingsDisplayString.length; i++) {
            opening = (
                <polygon
                    id={"svg_opening_" + i}
                    key={i + "svg_opn"}
                    className={this.props.globalState.openingIsNear ? "" : "invisible"}
                    style={{ fill: "white", stroke: "blue", strokeWidth: "1" }}
                    points={this.props.globalState.openingsDisplayString[i]}
                />
            );
            openings.push(opening);
        }
        return openings;
    }

    createOpeningsTangent() {
        //здесь мы рисуем касательные
        var gs = this.props.globalState;
        var tangents = [];
        var tangent;
        for (var i = 1; i < gs.opening_tangents.length; i++) {
            for (var k = 0; k < gs.opening_tangents[i].length; k++) {
                tangent = (
                    <line
                        key={"tang" + i + k}
                        x1="250"
                        y1="250"
                        x2={gs.opening_tangents[i][k][0]}
                        y2={gs.opening_tangents[i][k][1]}
                        className={this.props.globalState.openingIsNear ? "" : "invisible"}
                        style={{ stroke: this.props.globalState.op_tangents_show ? "#00ff00" : "transparent", strokeWidth: "1" }}
                    />
                );
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
                    circle = (
                        <circle
                            key={"inters" + i + k}
                            cx={gs.opening_tangents_intersect[i][k][0]}
                            cy={gs.opening_tangents_intersect[i][k][1]}
                            r="1"
                            fill="transparent"
                            stroke={this.props.globalState.op_tangents_show ? "red" : "transparent"}
                            strokeWidth="1"
                            className={this.props.globalState.openingIsNear ? "" : "invisible"}
                        ></circle>
                    );
                    circles.push(circle);
                }
            }
        }
        return circles;
    }

    createOpeningTriangles() {
        //создаем треугольники которые будут закрывать часть контура продавливания, ограниченного касательными к отверстиям
        var gs = this.props.globalState;
        var triangles = [];
        var triangle;
        for (var i = 0; i < gs.tangents_triangles.length; i++) {
            triangle = (
                <polygon
                    key={"triang_" + i}
                    className={this.props.globalState.openingIsNear ? "" : "invisible"}
                    style={{ fill: "white", stroke: "transparent", strokeWidth: "1" }}
                    points={this.props.globalState.tangents_triangles[i]}
                />
            );
            triangles.push(triangle);
        }
        return triangles;
    }

    zoomPlus() {
        var gs = this.props.globalState;
        this.props.onSketchChange({
            custom_scale: gs.custom_scale + 0.1,
        });
    }

    zoomMinus() {
        var gs = this.props.globalState;
        this.props.onSketchChange({
            custom_scale: gs.custom_scale - 0.1,
        });
    }

    zoomInitial() {
        this.props.onSketchChange({
            custom_scale: 1,
        });
    }

    zoomPanelStyle1() {
        var gs = this.props.globalState;
        var style_obj = {};
        if (window.innerWidth >= 768) {
            switch (gs.svg_size) {
                case 500:
                    style_obj = {
                        top: "370px",
                        right: "30px",
                    };
                    break;
                case 450:
                    style_obj = {
                        top: "320px",
                        right: "30px",
                    };
                    break;
                case 400:
                    style_obj = {
                        top: "270px",
                        right: "30px",
                    };
                    break;
                default:
                    style_obj = {
                        display: "none",
                    };
            }
        } else {
            style_obj = {
                display: "none",
            };
        }

        return style_obj;
    }

    zoomPanelStyle2() {
        var gs = this.props.globalState;
        var class_name = "";
        if (gs.svg_size < 400 || window.innerWidth <= 767) {
            class_name = "d-flex justify-content-center mt-1";
        } else {
            class_name = "d-none";
        }
        return class_name;
    }

    render() {
        return (
            <div>
                <h5>Эскиз</h5>
                <svg id="svg_background" viewBox="0 0 500 500" width={this.props.globalState.svg_size} height={this.props.globalState.svg_size}>
                    <polygon id="svg_frame" style={{ fill: "transparent", stroke: "black", strokeWidth: "2" }} points="0,0 500,0 500,500 0,500" />
                    <polygon
                        id="svg_u"
                        style={{ fill: "transparent", stroke: this.props.globalState.u_show ? "#f04d2b" : "transparent", strokeWidth: "1" }}
                        points={this.props.globalState.uDisplayString}
                    />
                    {this.createOpeningTriangles()}
                    <polygon
                        id="svg_slab_edge"
                        style={{ fill: "grey", stroke: "blue", strokeWidth: "1", fillOpacity: "0.1" }}
                        points={this.props.globalState.slabEdgeString}
                    />
                    {this.createOpenings()}
                    <polygon
                        id="in_asw_square"
                        style={{ fill: "transparent", stroke: this.props.globalState.in_out_asw_show ? "orange" : "transparent", strokeWidth: "1" }}
                        points={this.props.globalState.in_asw_square_string}
                    />
                    <polygon
                        id="out_asw_square"
                        style={{ fill: "transparent", stroke: this.props.globalState.in_out_asw_show ? "orange" : "transparent", strokeWidth: "1" }}
                        points={this.props.globalState.out_asw_square_string}
                    />
                    <polygon
                        id="svg_column"
                        style={{ fill: "#C4C4F2", stroke: "#913939", strokeWidth: "3" }}
                        points={this.props.globalState.columnDisplayString}
                    />
                    <line x1="250" y1="20" x2="250" y2="480" style={{ stroke: "#00ff00", strokeWidth: "1" }} />
                    <line x1="250" y1="20" x2="243" y2="35" style={{ stroke: "#00ff00", strokeWidth: "1" }} />
                    <line x1="250" y1="20" x2="257" y2="35" style={{ stroke: "#00ff00", strokeWidth: "1" }} />
                    <line x1="20" y1="250" x2="480" y2="250" style={{ stroke: "#00ff00", strokeWidth: "1" }} />
                    <line x1="465" y1="243" x2="480" y2="250" style={{ stroke: "#00ff00", strokeWidth: "1" }} />
                    <line x1="465" y1="257" x2="480" y2="250" style={{ stroke: "#00ff00", strokeWidth: "1" }} />
                    <text x="220" y="30" fontFamily="Helvetica, Arial, sans-serif" fontSize="24" fill="black">
                        Y
                    </text>
                    <text x="460" y="230" fontFamily="Helvetica, Arial, sans-serif" fontSize="24" fill="black">
                        X
                    </text>
                    {this.createCircles()}
                    {this.createOpeningsTangent()}
                    {this.createTangentIntersect()}
                </svg>

                <div className="zoom_panel_1" style={this.zoomPanelStyle1()}>
                    {" "}
                    {/* эти кнопки появляются когда экран большой*/}
                    <div id="zoom_plus" className="zoom">
                        <i onClick={this.zoomPlus} className="fas fa-search-plus"></i>
                    </div>
                    <div id="zoom_minus" className="zoom">
                        <i onClick={this.zoomMinus} className="fas fa-search-minus"></i>
                    </div>
                    <div id="zoom_initial" className="zoom">
                        <i onClick={this.zoomInitial} className="fas fa-times"></i>
                    </div>
                </div>

                <div className={this.zoomPanelStyle2()}>
                    {" "}
                    {/* эти кнопки появляются когда экран маленький*/}
                    <Button variant="success" className="me-2" onClick={this.zoomPlus}>
                        <i className="fas fa-search-plus"></i>
                    </Button>
                    <Button variant="success" className="me-2" onClick={this.zoomMinus}>
                        <i className="fas fa-search-minus"></i>
                    </Button>
                    <Button variant="success" className="me-2" onClick={this.zoomInitial}>
                        <i className="fas fa-times"></i>
                    </Button>
                </div>
            </div>
        );
    }
}
