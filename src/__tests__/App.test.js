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
    expect(app.state.report_data.factor).toBe(2.308);
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
  expect(app.state.report_data.factor).toBe(2.841);
});