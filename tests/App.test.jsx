import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import App from "../src/App";

describe("App", () => {
    it("Простой тест", async () => {
        const user = userEvent.setup();
        render(<App />);

        const input_n_load = screen.getByTestId("input_n_load");
        const input_a_column_size = screen.getByTestId("input_a_column_size");
        const input_b_column_size = screen.getByTestId("input_b_column_size");
        const input_t_slab_size = screen.getByTestId("input_t_slab_size");
        const input_a_slab_size = screen.getByTestId("input_a_slab_size");
        const text_result = screen.getByTestId("text_result");

        await user.type(input_n_load, "50");
        await user.type(input_a_column_size, "500");
        await user.type(input_b_column_size, "400");
        await user.type(input_t_slab_size, "200");
        await user.type(input_a_slab_size, "30");

        //screen.debug(text_result);

        expect(text_result).toHaveTextContent("Прочность не обеспечена. Коэффициент использования = 2.308");
    });

    it("Простой тест c моментами", async () => {
        const user = userEvent.setup();
        render(<App />);

        const input_n_load = screen.getByTestId("input_n_load");
        const input_mx_load = screen.getByTestId("input_mx_load");
        const input_my_load = screen.getByTestId("input_my_load");
        const input_a_column_size = screen.getByTestId("input_a_column_size");
        const input_b_column_size = screen.getByTestId("input_b_column_size");
        const input_t_slab_size = screen.getByTestId("input_t_slab_size");
        const input_a_slab_size = screen.getByTestId("input_a_slab_size");
        const concrete_grade = screen.getByTestId("concrete_grade");
        const text_result = screen.getByTestId("text_result");

        await user.type(input_n_load, "50");
        await user.type(input_mx_load, "5");
        await user.type(input_my_load, "2");
        await user.type(input_a_column_size, "400");
        await user.type(input_b_column_size, "200");
        await user.type(input_t_slab_size, "200");
        await user.type(input_a_slab_size, "30");
        await user.selectOptions(concrete_grade, ["В20"]);

        //screen.debug(text_result);

        expect(text_result).toHaveTextContent("Прочность не обеспечена. Коэффициент использования = 2.841");
    });

    it("Армирование", async () => {
        const user = userEvent.setup();
        render(<App />);

        const input_n_load = screen.getByTestId("input_n_load");
        const input_mx_load = screen.getByTestId("input_mx_load");
        //const input_my_load = screen.getByTestId("input_my_load");
        const input_a_column_size = screen.getByTestId("input_a_column_size");
        const input_b_column_size = screen.getByTestId("input_b_column_size");
        const input_t_slab_size = screen.getByTestId("input_t_slab_size");
        const input_a_slab_size = screen.getByTestId("input_a_slab_size");
        const concrete_grade = screen.getByTestId("concrete_grade");

        //арматура
        const select_s_reinf_yes = screen.getByTestId("select_s_reinf_yes");
        const shear_bars_grade = screen.getByTestId("shear_bars_grade");
        const shear_bars_diameter = screen.getByTestId("shear_bars_diameter");
        const shear_bars_row_number = screen.getByTestId("shear_bars_row_number");

        const input_shear_bars_spacing_to_prev_1 = screen.getByTestId("input_shear_bars_spacing_to_prev_1");
        const shear_bars_number_X_1 = screen.getByTestId("shear_bars_number_X_1");
        const shear_bars_number_Y_1 = screen.getByTestId("shear_bars_number_Y_1");

        const input_shear_bars_spacing_to_prev_2 = screen.getByTestId("input_shear_bars_spacing_to_prev_2");
        const shear_bars_number_X_2 = screen.getByTestId("shear_bars_number_X_2");
        const shear_bars_number_Y_2 = screen.getByTestId("shear_bars_number_Y_2");

        const text_result = screen.getByTestId("text_result");

        await user.type(input_n_load, "40");
        await user.type(input_mx_load, "5");
        //await user.type(input_my_load, "2");
        await user.type(input_a_column_size, "500");
        await user.type(input_b_column_size, "200");
        await user.type(input_t_slab_size, "200");
        await user.type(input_a_slab_size, "30");
        await user.selectOptions(concrete_grade, ["В30"]);
        await user.click(select_s_reinf_yes);

        //вбиваем данные армирования
        await user.selectOptions(shear_bars_grade, ["А240С"]);
        await user.selectOptions(shear_bars_diameter, ["8"]);
        await user.type(shear_bars_row_number, "2");

        await user.type(input_shear_bars_spacing_to_prev_1, "50");
        await user.type(shear_bars_number_X_1, "5");
        await user.type(shear_bars_number_Y_1, "4");

        await user.type(input_shear_bars_spacing_to_prev_2, "100");
        await user.type(shear_bars_number_X_2, "7");
        await user.type(shear_bars_number_Y_2, "6");

        //screen.debug(text_result);

        expect(text_result).toHaveTextContent("Прочность обеспечена. Коэффициент использования = 0.962");
    });

    it("Колонна рядом с 1 краем плиты без армирования", async () => {
        const user = userEvent.setup();
        render(<App />);

        const input_n_load = screen.getByTestId("input_n_load");
        const input_mx_load = screen.getByTestId("input_mx_load");
        const input_my_load = screen.getByTestId("input_my_load");
        const input_a_column_size = screen.getByTestId("input_a_column_size");
        const input_b_column_size = screen.getByTestId("input_b_column_size");
        const input_t_slab_size = screen.getByTestId("input_t_slab_size");
        const input_a_slab_size = screen.getByTestId("input_a_slab_size");
        const concrete_grade = screen.getByTestId("concrete_grade");
        //край плиты
        const select_slab_edge_yes = screen.getByTestId("select_slab_edge_yes");
        const edge_left_yes = screen.getByTestId("edge_left_yes");
        const input_edge_left_dist = screen.getByTestId("input_edge_left_dist");

        const text_result = screen.getByTestId("text_result");

        await user.type(input_n_load, "50");
        await user.type(input_mx_load, "5");
        await user.type(input_my_load, "2");
        await user.type(input_a_column_size, "400");
        await user.type(input_b_column_size, "200");
        await user.type(input_t_slab_size, "200");
        await user.type(input_a_slab_size, "30");
        await user.selectOptions(concrete_grade, ["В20"]);

        //выбираем край плиты
        await user.click(select_slab_edge_yes);
        await user.click(edge_left_yes);
        await user.type(input_edge_left_dist, "0");

        //screen.debug(text_result);

        expect(text_result).toHaveTextContent("Прочность не обеспечена. Коэффициент использования = 3.986");
    });

    it("Колонна рядом с 1 краем плиты c армированием", async () => {
        const user = userEvent.setup();
        render(<App />);

        const input_n_load = screen.getByTestId("input_n_load");
        const input_mx_load = screen.getByTestId("input_mx_load");
        const input_my_load = screen.getByTestId("input_my_load");
        const input_a_column_size = screen.getByTestId("input_a_column_size");
        const input_b_column_size = screen.getByTestId("input_b_column_size");
        const input_t_slab_size = screen.getByTestId("input_t_slab_size");
        const input_a_slab_size = screen.getByTestId("input_a_slab_size");
        const concrete_grade = screen.getByTestId("concrete_grade");

        //арматура
        const select_s_reinf_yes = screen.getByTestId("select_s_reinf_yes");
        const shear_bars_grade = screen.getByTestId("shear_bars_grade");
        const shear_bars_diameter = screen.getByTestId("shear_bars_diameter");
        const shear_bars_row_number = screen.getByTestId("shear_bars_row_number");

        const input_shear_bars_spacing_to_prev_1 = screen.getByTestId("input_shear_bars_spacing_to_prev_1");
        const shear_bars_number_X_1 = screen.getByTestId("shear_bars_number_X_1");
        const shear_bars_number_Y_1 = screen.getByTestId("shear_bars_number_Y_1");

        const input_shear_bars_spacing_to_prev_2 = screen.getByTestId("input_shear_bars_spacing_to_prev_2");
        const shear_bars_number_X_2 = screen.getByTestId("shear_bars_number_X_2");
        const shear_bars_number_Y_2 = screen.getByTestId("shear_bars_number_Y_2");

        //край плиты
        const select_slab_edge_yes = screen.getByTestId("select_slab_edge_yes");
        const edge_left_yes = screen.getByTestId("edge_left_yes");
        const input_edge_left_dist = screen.getByTestId("input_edge_left_dist");

        const text_result = screen.getByTestId("text_result");

        await user.type(input_n_load, "50");
        await user.type(input_mx_load, "5");
        await user.type(input_my_load, "2");
        await user.type(input_a_column_size, "400");
        await user.type(input_b_column_size, "200");
        await user.type(input_t_slab_size, "200");
        await user.type(input_a_slab_size, "30");
        await user.selectOptions(concrete_grade, ["В20"]);

        //вбиваем данные армирования
        await user.click(select_s_reinf_yes);
        await user.selectOptions(shear_bars_grade, ["А240С"]);
        await user.selectOptions(shear_bars_diameter, ["8"]);
        await user.type(shear_bars_row_number, "2");

        await user.type(input_shear_bars_spacing_to_prev_1, "50");
        await user.type(shear_bars_number_X_1, "5");
        await user.type(shear_bars_number_Y_1, "4");

        await user.type(input_shear_bars_spacing_to_prev_2, "100");
        await user.type(shear_bars_number_X_2, "7");
        await user.type(shear_bars_number_Y_2, "6");

        //выбираем край плиты
        await user.click(select_slab_edge_yes);
        await user.click(edge_left_yes);
        await user.type(input_edge_left_dist, "0");

        //screen.debug(text_result);

        expect(text_result).toHaveTextContent("Прочность не обеспечена. Коэффициент использования = 2.111");
    });

    it("Колонна на углу плиты без армирования", async () => {
        const user = userEvent.setup();
        render(<App />);

        const input_n_load = screen.getByTestId("input_n_load");
        const input_mx_load = screen.getByTestId("input_mx_load");
        const input_my_load = screen.getByTestId("input_my_load");
        const input_a_column_size = screen.getByTestId("input_a_column_size");
        const input_b_column_size = screen.getByTestId("input_b_column_size");
        const input_t_slab_size = screen.getByTestId("input_t_slab_size");
        const input_a_slab_size = screen.getByTestId("input_a_slab_size");
        const concrete_grade = screen.getByTestId("concrete_grade");
        //край плиты
        const select_slab_edge_yes = screen.getByTestId("select_slab_edge_yes");
        const edge_left_yes = screen.getByTestId("edge_left_yes");
        const edge_top_yes = screen.getByTestId("edge_top_yes");
        const input_edge_left_dist = screen.getByTestId("input_edge_left_dist");
        const input_edge_top_dist = screen.getByTestId("input_edge_top_dist");

        const text_result = screen.getByTestId("text_result");

        await user.type(input_n_load, "50");
        await user.type(input_mx_load, "5");
        await user.type(input_my_load, "2");
        await user.type(input_a_column_size, "400");
        await user.type(input_b_column_size, "200");
        await user.type(input_t_slab_size, "200");
        await user.type(input_a_slab_size, "30");
        await user.selectOptions(concrete_grade, ["В20"]);

        //выбираем край плиты
        await user.click(select_slab_edge_yes);
        await user.click(edge_left_yes);
        await user.type(input_edge_left_dist, "0");
        await user.click(edge_top_yes);
        await user.type(input_edge_top_dist, "0");

        //screen.debug(text_result);

        expect(text_result).toHaveTextContent("Прочность не обеспечена. Коэффициент использования = 6.938");
    });

    it("Колонна с отверстиями", async () => {
        const user = userEvent.setup();
        render(<App />);

        const input_n_load = screen.getByTestId("input_n_load");
        const input_mx_load = screen.getByTestId("input_mx_load");
        const input_my_load = screen.getByTestId("input_my_load");
        const input_a_column_size = screen.getByTestId("input_a_column_size");
        const input_b_column_size = screen.getByTestId("input_b_column_size");
        const input_t_slab_size = screen.getByTestId("input_t_slab_size");
        const input_a_slab_size = screen.getByTestId("input_a_slab_size");
        const concrete_grade = screen.getByTestId("concrete_grade");

        //данные отверстия
        const opening_is_near_yes = screen.getByTestId("opening_is_near_yes");
        const add_opening = screen.getByTestId("add_opening");

        const opening_a_1 = screen.getByTestId("opening_a_1");
        const opening_b_1 = screen.getByTestId("opening_b_1");
        const opening_X_1 = screen.getByTestId("opening_X_1");
        const opening_Y_1 = screen.getByTestId("opening_Y_1");

        await user.click(add_opening);

        const opening_a_2 = screen.getByTestId("opening_a_2");
        const opening_b_2 = screen.getByTestId("opening_b_2");
        const opening_X_2 = screen.getByTestId("opening_X_2");
        const opening_Y_2 = screen.getByTestId("opening_Y_2");

        const text_result = screen.getByTestId("text_result");

        await user.type(input_n_load, "50");
        await user.type(input_mx_load, "5");
        await user.type(input_my_load, "3");
        await user.type(input_a_column_size, "400");
        await user.type(input_b_column_size, "200");
        await user.type(input_t_slab_size, "200");
        await user.type(input_a_slab_size, "30");
        await user.selectOptions(concrete_grade, ["В30"]);

        //вбиваем данные отверстия
        await user.click(opening_is_near_yes);

        await user.type(opening_a_1, "400");
        await user.type(opening_b_1, "200");
        await user.type(opening_X_1, "500");
        await user.type(opening_Y_1, "300");

        await user.type(opening_a_2, "100");
        await user.type(opening_b_2, "1200");
        await user.type(opening_X_2, "-300");
        await user.type(opening_Y_2, "-100");

        //screen.debug(text_result);

        expect(text_result).toHaveTextContent("Прочность не обеспечена. Коэффициент использования = 4.924");
    });

    it("Колонна с отверстиями и армированием", async () => {
        const user = userEvent.setup();
        render(<App />);

        const input_n_load = screen.getByTestId("input_n_load");
        const input_mx_load = screen.getByTestId("input_mx_load");
        const input_my_load = screen.getByTestId("input_my_load");
        const input_a_column_size = screen.getByTestId("input_a_column_size");
        const input_b_column_size = screen.getByTestId("input_b_column_size");
        const input_t_slab_size = screen.getByTestId("input_t_slab_size");
        const input_a_slab_size = screen.getByTestId("input_a_slab_size");
        const concrete_grade = screen.getByTestId("concrete_grade");

        //арматура
        const select_s_reinf_yes = screen.getByTestId("select_s_reinf_yes");
        const shear_bars_grade = screen.getByTestId("shear_bars_grade");
        const shear_bars_diameter = screen.getByTestId("shear_bars_diameter");
        const shear_bars_row_number = screen.getByTestId("shear_bars_row_number");

        const input_shear_bars_spacing_to_prev_1 = screen.getByTestId("input_shear_bars_spacing_to_prev_1");
        const shear_bars_number_X_1 = screen.getByTestId("shear_bars_number_X_1");
        const shear_bars_number_Y_1 = screen.getByTestId("shear_bars_number_Y_1");

        const input_shear_bars_spacing_to_prev_2 = screen.getByTestId("input_shear_bars_spacing_to_prev_2");
        const shear_bars_number_X_2 = screen.getByTestId("shear_bars_number_X_2");
        const shear_bars_number_Y_2 = screen.getByTestId("shear_bars_number_Y_2");

        //данные отверстия
        const opening_is_near_yes = screen.getByTestId("opening_is_near_yes");
        const add_opening = screen.getByTestId("add_opening");

        const opening_a_1 = screen.getByTestId("opening_a_1");
        const opening_b_1 = screen.getByTestId("opening_b_1");
        const opening_X_1 = screen.getByTestId("opening_X_1");
        const opening_Y_1 = screen.getByTestId("opening_Y_1");

        await user.click(add_opening);

        const opening_a_2 = screen.getByTestId("opening_a_2");
        const opening_b_2 = screen.getByTestId("opening_b_2");
        const opening_X_2 = screen.getByTestId("opening_X_2");
        const opening_Y_2 = screen.getByTestId("opening_Y_2");

        const text_result = screen.getByTestId("text_result");

        await user.type(input_n_load, "50");
        await user.type(input_mx_load, "5");
        await user.type(input_my_load, "3");
        await user.type(input_a_column_size, "400");
        await user.type(input_b_column_size, "200");
        await user.type(input_t_slab_size, "200");
        await user.type(input_a_slab_size, "30");
        await user.selectOptions(concrete_grade, ["В30"]);

        //вбиваем данные армирования
        await user.click(select_s_reinf_yes);

        await user.selectOptions(shear_bars_grade, ["А240С"]);
        await user.selectOptions(shear_bars_diameter, ["8"]);
        await user.type(shear_bars_row_number, "2");

        await user.type(input_shear_bars_spacing_to_prev_1, "50");
        await user.type(shear_bars_number_X_1, "5");
        await user.type(shear_bars_number_Y_1, "4");

        await user.type(input_shear_bars_spacing_to_prev_2, "100");
        await user.type(shear_bars_number_X_2, "7");
        await user.type(shear_bars_number_Y_2, "6");

        //вбиваем данные отверстия
        await user.click(opening_is_near_yes);

        await user.type(opening_a_1, "400");
        await user.type(opening_b_1, "200");
        await user.type(opening_X_1, "500");
        await user.type(opening_Y_1, "300");

        await user.type(opening_a_2, "100");
        await user.type(opening_b_2, "1200");
        await user.type(opening_X_2, "-300");
        await user.type(opening_Y_2, "-100");

        //screen.debug(text_result);

        expect(text_result).toHaveTextContent("Прочность не обеспечена. Коэффициент использования = 2.843");
    });
});
