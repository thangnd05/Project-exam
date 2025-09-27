// src/pages/exam/TestPage.js
import React, { useEffect, useState } from "react";
import classNames from "classnames/bind";
import style from "./TestStyle.scss";
import ExamPage from "./exampage/ExamPage";
import ExamTypePage from "./examtype/ExamTypePage";
const cx = classNames.bind(style);

export default function TestPage() {

  return (
     <div className={cx("wrapper")}>
    <ExamTypePage/>
    <ExamPage/>
    </div>

    
  );
}
