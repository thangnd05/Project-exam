import React from "react";
import CreateTest from "~/components/CreateTest";
import styles from "./CreateTestPage.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

function CreateTestPage() {
  return (
    <div className={cx("wrapper")}>
      <CreateTest mode="personal" />
    </div>
  );
}

export default CreateTestPage;
