import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import Collapse from "react-bootstrap/Collapse";

export default function Help(props) {
    function emulateClick() {
        console.log("click");
        document.getElementById("help").click();
    }

    return (
        <Collapse in={props.globalState.show_help}>
            <div className="border mb-4" id="help_par">
                <div className="col" style={{ paddingLeft: "15px", paddingRight: "15px" }}>
                    <p>Всем привет!</p>
                    <p>
                        Цель этой программы быстро и удобно рассчитать плиту на продавливание. Для простоты использования и чтобы не морочить людям
                        голову программа имеет пару допущений:
                    </p>
                    <p>
                        1) Никаких "разгружающих" моментов. Все моменты всегда "догружают" сечение независимо от знака. Потому что, завтра выпускать
                        отчет, а я тут буду еще сидеть разбираться: "А у меня момент разгружает сечение, или не разгружает? А в какую сторону он
                        крутит? В эту? А может в эту? А при каких РСН? А всегда так или бывает меняет знак?" Короче исходя их того, что большинство
                        проектировщиков понятия не имеют куда там у них действует момент, все моменты всегда нагружают сечение. Взяли из схемы
                        максимальные Мх, Му, разделили пополам, вбили их с любыми знаками и забыли.
                    </p>
                    <p>
                        2) Никаких "разгружающих" продольных усилий, по вышеназванным причинам. Продольное усилие всегда нагружает сечение независимо
                        от знака.{" "}
                    </p>
                    <p>
                        Моменты Мх и Му это моменты <b>вдоль</b> осей Х и Y, а не относительно. Почему? Потому что такой подход принят в СП.
                    </p>
                    <p>
                        Также данная версия программы имеет <b>одно ограничение</b>: если у Вас, несколько отверстий сливаются в одно и суммарный
                        выбиваемый угол превышает 180 градусов, программа посчитает его неправильно. На данный момент я не придумал простого и
                        надежного алгоритма как научить программу отличать углы больше 180 градусов от им обратным (например если у Вас наложенные
                        отверстия выбьют угол 210 градусов, программа посчитает что выбитый угол равен 360-210 = 150 градусов.
                    </p>
                    <p>
                        Эту проблему можно легко обойти следующим образом: разбейте Ваше отверстие на 2 (или столько, сколько нужно) отверстий и
                        разместите их рядом, но так, чтобы они не пересекались. Для Вас погрешность будет минимальна, а для программы все углы
                        окажутся меньше 180 градусов и она все нормально посчитает.
                    </p>
                    <div className="row mb-3">
                        <div className="col-lg">
                            <div className="card text-center" style={{ maxWidth: 450 }}>
                                <div className="card-body">
                                    <h5 className="card-title">Работает</h5>
                                </div>
                                <img src="/pic/good_3.png" className="card-img-bottom" alt="хорошо"></img>
                            </div>
                        </div>
                        <div className="col-lg">
                            <div className="card text-center" style={{ maxWidth: 450 }}>
                                <div className="card-body">
                                    <h5 className="card-title">Не работает:(Пичалька</h5>
                                </div>
                                <img src="/pic/bad_3.png" className="card-img-bottom" alt="плохо"></img>
                            </div>
                        </div>
                        <div className="col-lg">
                            <div className="card text-center" style={{ maxWidth: 450 }}>
                                <div className="card-body">
                                    <h5 className="card-title">Обход ограничения</h5>
                                </div>
                                <img src="/pic/workaround_1.png" className="card-img-bottom" alt="обход ограничения"></img>
                            </div>
                        </div>
                    </div>
                    <Row>
                        <div className="col-9 text-left">
                            <p>
                                Для любителей покапаться в коде вот <a href="https://github.com/AlekseyMalakhov/shear_slab_calc">ссылка на GitHub</a>{" "}
                                - милости просим.
                            </p>
                            <p>
                                Обсуждение программы на dwg.ru <a href="https://forum.dwg.ru/showthread.php?p=1859398#post1859398">здесь.</a>
                            </p>
                            <p>
                                Приятного пользования! TermenVox. 2020г. <a href="mailto:hexel@tut.by">hexel@tut.by</a>
                            </p>
                        </div>
                        <div className="col my-auto">
                            <Button variant="primary" onClick={emulateClick}>
                                Закрыть справку
                            </Button>
                        </div>
                    </Row>
                </div>
            </div>
        </Collapse>
    );
}
