import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import classNames from "classnames/bind";
import style from "./ExamTypeStyle.module.scss";

const cx = classNames.bind(style);

function ExamTypePage() {
  const [examTypes, setExamTypes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("/api/exam-types")
      .then((response) => {
        setExamTypes(response.data);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy exam types:", error);
      });
  }, []);

  const handleClick = (examTypeId) => {
    navigate(`/exam-types/${examTypeId}`); 
  };

  return (
    <div className={cx("exam-type-container")}>
      <p className={cx("exam-type-title", "fw-bold")}>
        Loại đề thi
      </p>
      <div className={cx("exam-types-grid")}>
        {examTypes.map((examType) => (
          <Button
            variant=""
            key={examType.examTypeId}
            className={cx("exam-type-btn", "bg-body-tertiary", "btn-cate")}
            onClick={() => handleClick(examType.examTypeId)}
          >
            {examType.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default ExamTypePage;