// src/components/Comment/RenderComment.js

import React from 'react';
import { Form, Button } from 'react-bootstrap';
import classNames from 'classnames/bind';
import ReactQuill from 'react-quill';
import DOMPurify from 'dompurify';

import style from '../../Layout/comment/comment.module.scss';
import "react-quill/dist/quill.snow.css";

const cx = classNames.bind(style);

function RenderComment({
    comment,
    level,
    userId,
    editingCommentId,
    setEditingCommentId,
    editingContent,
    setEditingContent,
    replyingTo,
    setReplyingTo,
    replyContent,
    setReplyContent,
    isDeleting,
    quillRef,
    handleEdit,
    handleSave,
    deleteComment,
    handleReplySubmit
}) {
    const isEditing = editingCommentId === comment.comment_id;
    const isReplying = replyingTo === comment.comment_id;

    const handleReplyClick = () => {
        setReplyingTo(comment.comment_id);
        setReplyContent(`<p>@${comment.user.username}&nbsp;</p>`);
    };

    const indentationStyle = {
        marginLeft: level > 0 ? '50px' : '0px',
        borderLeft: level > 0 ? '2px solid #f0f0f0' : 'none',
        paddingLeft: level > 0 ? '15px' : '0px',
    };

    return (
        <div className={cx("mb-3")} style={indentationStyle}>
            <div className={cx("author")}>{comment.user?.username || "Anonymous"}</div>
            <div className={cx("")}>
                {isEditing ? (
                    <div className={cx("w-100")}>
                        <Form className={cx('w-100')}>
                            <Form.Group className={cx("quill")}>
                                <ReactQuill
                                    className={cx("comment", "h-100", "fs-com")}
                                    value={editingContent}
                                    onChange={setEditingContent}
                                    placeholder="Nhập bình luận"
                                    style={{ minHeight: "150px" }}
                                    modules={{ toolbar: false }}
                                    theme="bubble"
                                    ref={quillRef}
                                />
                            </Form.Group>
                        </Form>
                        <div className={cx("d-flex mt-3")}>
                            <button onClick={() => handleSave(comment.comment_id)} className={cx("btn btn-success py-2 ", "btn-text")}>Lưu</button>
                            <button onClick={() => setEditingCommentId(null)} className={cx("btn btn-secondary mx-3 py-2 ", "btn-text")}>Để sau</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={cx("text-content")} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }} />
                        <div className={cx("d-flex align-items-start mt-3")}>
                            {/* Điều kiện 1: Nếu là chủ comment, hiện Sửa/Xóa */}
                            {comment.userId === userId && (
                                <div>
                                    <span onClick={() => handleEdit(comment)} className={cx("text-primary text-decoration-underline", "fix_content", 'cursor-pointer')}>Sửa</span>
                                    <span disabled={isDeleting} onClick={() => deleteComment(comment.comment_id)} className={cx("text-danger text-decoration-underline mx-4", "fix_content", 'cursor-pointer')}>Xóa</span>
                                </div>
                            )}

                            {/* Điều kiện 2: Nếu KHÔNG phải chủ comment VÀ ĐÃ ĐĂNG NHẬP, hiện Reply */}
                            {comment.userId !== userId && userId && (
                                <div>
                                    <span onClick={handleReplyClick} className={cx("text-tertiary text-decoration-underline", "fix_content", 'cursor-pointer')}>
                                        Reply
                                    </span>
                                </div>
                            )}

                            {/* Phần hiển thị thời gian không đổi */}
                            <div className={cx("d-flex justify-content-end w-100")}>
                                <small className={cx("text-secondary", "fix_content")}>{comment.created_at}</small>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {isReplying && (
                <div className={cx("reply-form", "mt-3")}>
                    <ReactQuill
                        theme="bubble"
                        value={replyContent}
                        onChange={setReplyContent}
                        placeholder={`Trả lời ${comment.user.username}...`}
                        modules={{ toolbar: false }}
                        className={cx("comment", "h-100", "fs-com")}
                        style={{ minHeight: "100px" }}
                    />
                    <div className="mt-3">
                        <Button size="sm" variant="primary" onClick={() => handleReplySubmit(comment.comment_id)}>Gửi</Button>
                        <Button size="sm" variant="secondary" className="ms-2" onClick={() => setReplyingTo(null)}>Để sau</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RenderComment;