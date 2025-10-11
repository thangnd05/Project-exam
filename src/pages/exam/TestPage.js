// src/pages/exam/TestPage.js
import React from "react";
import classNames from "classnames/bind";
import style from "./TestStyle.scss";
import ExamTypePage from "./examtype/ExamTypePage";
import JoinClassPage from "../class/JoinClassPage";
const cx = classNames.bind(style);

export default function TestPage() {

  return (
     <div className={cx("wrapper")}>
    <ExamTypePage/>
    <JoinClassPage/>
    </div>

    
  );
}
