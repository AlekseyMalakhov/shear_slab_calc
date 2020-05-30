'use strict';
import React from 'react';
import App from '../App.js';
import { create, act } from "react-test-renderer";

test("Простой тест", () => {
    let component;
    act(() => {
        component = create(
          <App></App>
        );
    });
    var app = component.getInstance();
    var mock_state = {
      input_n_load: 50,
      input_a_column_size: 500,
      input_b_column_size: 400,
      input_t_slab_size: 200,
      input_a_slab_size: 30,
      concrete_grade: "b10",
    };
    app.getData(mock_state);
    //console.log(app.state);
    //expect(app.state.report_data.factor).toBe(2.308);
    expect(app.state.report_data).toMatchSnapshot();
   
});

test("Простой тест c моментами", () => {
  let component;
  act(() => {
      component = create(
        <App></App>
      );
  });
  var app = component.getInstance();
  var mock_state = {
    input_n_load: 50,
    input_mx_load: 5,
    input_my_load: 2,
    input_a_column_size: 400,
    input_b_column_size: 200,
    input_t_slab_size: 200,
    input_a_slab_size: 30,
    concrete_grade: "b20",
  };
  app.getData(mock_state);
  //console.log(app.state);
  //expect(app.state.report_data.factor).toBe(2.841);
  expect(app.state.report_data).toMatchSnapshot();
});

test("Армирование", () => {
  let component;
  act(() => {
      component = create(
        <App></App>
      );
  });
  var app = component.getInstance();
  var mock_state = {
    input_n_load: 40,
    input_mx_load: 5,
    input_a_column_size: 500,
    input_b_column_size: 200,
    input_t_slab_size: 200,
    input_a_slab_size: 30,
    concrete_grade: "b30",
    shear_bars_diameter: "8",
    shear_bars_grade: "a240c",
    shear_bars_row_number: 2,
    input_shear_bars_spacing_to_prev: [0, 50, 100],
    shear_reinforcement: true,
    shear_bars_number: {
      X: [0, 5, 7],
      Y: [0, 4, 6],
    },
  };
  app.getData(mock_state);
  //console.log(app.state);
  //expect(app.state.report_data.factor).toBe(0.962);
  expect(app.state.report_data).toMatchSnapshot();
});

test("Колонна рядом с 1 краем плиты без армирования", () => {
  let component;
  act(() => {
      component = create(
        <App></App>
      );
  });
  var app = component.getInstance();
  var mock_state = {
    input_n_load: 50,
    input_mx_load: 5,
    input_my_load: 2,
    input_a_column_size: 400,
    input_b_column_size: 200,
    input_t_slab_size: 200,
    input_a_slab_size: 30,
    concrete_grade: "b20",
    slab_edge: true,
    edge_left: true,
    input_edge_left_dist: 0,
  };

  app.getData(mock_state);
  //console.log(app.state);
  //expect(app.state.report_data.factor).toBe(3.986);
  expect(app.state.report_data).toMatchSnapshot();
});

test("Колонна рядом с 1 краем плиты c армированием", () => {
  let component;
  act(() => {
      component = create(
        <App></App>
      );
  });
  var app = component.getInstance();
  var mock_state = {
    input_n_load: 50,
    input_mx_load: 5,
    input_my_load: 2,
    input_a_column_size: 400,
    input_b_column_size: 200,
    input_t_slab_size: 200,
    input_a_slab_size: 30,
    concrete_grade: "b20",
    slab_edge: true,
    edge_left: true,
    input_edge_left_dist: 0,
    shear_bars_diameter: "8",
    shear_bars_grade: "a240c",
    shear_bars_row_number: 2,
    input_shear_bars_spacing_to_prev: [0, 50, 100],
    shear_reinforcement: true,
    shear_bars_number: {
      X: [0, 5, 7],
      Y: [0, 4, 6],
    },
  };

  app.getData(mock_state);
  //console.log(app.state);
  //expect(app.state.report_data.factor).toBe(2.111);
  expect(app.state.report_data).toMatchSnapshot();
});

test("Колонна на углу плиты без армирования", () => {
  let component;
  act(() => {
      component = create(
        <App></App>
      );
  });
  var app = component.getInstance();
  var mock_state = {
    input_n_load: 50,
    input_mx_load: 5,
    input_my_load: 3,
    input_a_column_size: 400,
    input_b_column_size: 200,
    input_t_slab_size: 200,
    input_a_slab_size: 30,
    concrete_grade: "b20",
    slab_edge: true,
    edge_top: true,
    edge_left: true,
    input_edge_left_dist: 0,
    input_edge_top_dist: 0,
  };

  app.getData(mock_state);
  //console.log(app.state);
  //expect(app.state.report_data.factor).toBe(6.938);
  expect(app.state.report_data).toMatchSnapshot();
});

test("Колонна с отверстиями", () => {
  let component;
  act(() => {
      component = create(
        <App></App>
      );
  });
  var app = component.getInstance();
  var mock_state = {
    input_n_load: 50,
    input_mx_load: 5,
    input_my_load: 3,
    input_a_column_size: 400,
    input_b_column_size: 200,
    input_t_slab_size: 200,
    input_a_slab_size: 30,
    concrete_grade: "b30",
    openingIsNear: true,
    input_openings: {
      X: [0, 500, -300],
      Y: [0, 300, -100],
      a: [0, 400, 100],
      b: [0, 200, 1200],
    },
  };

  app.getData(mock_state);
  //console.log(app.state);
  //expect(app.state.report_data.factor).toBe(4.924);
  expect(app.state.report_data).toMatchSnapshot();
});

test("Колонна с отверстиями и армированием", () => {
  let component;
  act(() => {
      component = create(
        <App></App>
      );
  });
  var app = component.getInstance();
  var mock_state = {
    input_n_load: 50,
    input_mx_load: 5,
    input_my_load: 3,
    input_a_column_size: 400,
    input_b_column_size: 200,
    input_t_slab_size: 200,
    input_a_slab_size: 30,
    concrete_grade: "b30",
    openingIsNear: true,
    input_openings: {
      X: [0, 500, -300],
      Y: [0, 300, -100],
      a: [0, 400, 100],
      b: [0, 200, 1200],
    },
    shear_bars_diameter: "8",
    shear_bars_grade: "a240c",
    shear_bars_row_number: 2,
    input_shear_bars_spacing_to_prev: [0, 50, 100],
    shear_reinforcement: true,
    shear_bars_number: {
      X: [0, 5, 7],
      Y: [0, 4, 6],
    },
  };

  app.getData(mock_state);
  //console.log(app.state);
  //expect(app.state.report_data.factor).toBe(2.843);
  expect(app.state.report_data).toMatchSnapshot();
});