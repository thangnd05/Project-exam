import React, { useState } from "react";
import CreateTestModal from "~/components/modals/CreateTestModal";
import { IoRocketOutline } from "react-icons/io5";
import styles from "./CreateTestPage.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

function CreateTestPage() {
  const [showModal, setShowModal] = useState(false);

  const handleSuccess = () => {
    // Refresh or navigate after successful creation
    console.log("Test created successfully!");
  };

  return (
    <div className={cx("wrapper")}>
      <div className={cx("container")}>
        <div className={cx("header")}>
          <h1>Quản lý bài thi</h1>
          <p>Tạo và quản lý các bài kiểm tra của bạn</p>
        </div>

        <button className={cx("btnCreate")} onClick={() => setShowModal(true)}>
          <IoRocketOutline size={20} />
          <span>Tạo bài thi mới</span>
        </button>

        <CreateTestModal
          show={showModal}
          onClose={() => setShowModal(false)}
          mode="personal"
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}

export default CreateTestPage;
