'use strict';
import React from 'react';
import App from '../App.js';
import { create, act } from "react-test-renderer";


test("App created correctly", () => {
    let component;

    act(() => {
        component = create(
          <App></App>
        );
    });

    var app = component.getInstance();

    console.log(app.state.report_data);

    expect(component).toBeTruthy();
});