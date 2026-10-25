'use client';

import { buildLoginUrlFromHere } from '@/app/features/auth/authRedirect';
import { useRouter } from '@/app/i18n/navigation';
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert } from "react-bootstrap";
import { useJoinClass } from '@/app/features/classes/hooks/useMyClasses';
import classNames from "classnames/bind";
import { useAuth } from "@/app/hooks/useAuth";
import routes from "@/app/configs/Routes";
import CommonFormModal from "@/app/components/modal/CommonFormModal";
import ModalActionFooter from "@/app/components/modal/ModalActionFooter";
import styles from "@/app/components/modal/CommonFormModal.module.scss";

const cx = classNames.bind(styles);

type JoinClassModalProps = {
    show: boolean;
    onClose: () => void;
};

function JoinClassModal({ show, onClose }: JoinClassModalProps) {
    const t = useTranslations("Classes");
    const tCommon = useTranslations("Common");
    const [code, setCode] = useState("");

    const [message, setMessage] = useState("");
    const [type, setType] = useState("info");

    const { user } = useAuth();
    const router = useRouter();
    const joinMutation = useJoinClass();
    const loading = joinMutation.isPending;

    const handleJoin = () => {
        setMessage("");

        if (!user) {
            setType("warning");
            setMessage(t("joinClass.loginRequired"));

            setTimeout(() => {
                onClose();
                router.push(buildLoginUrlFromHere());
            }, 1200);

            return;
        }

        if (!code.trim()) {
            setType("danger");
            setMessage(t("joinClass.codeRequired"));
            return;
        }

        joinMutation.mutate(
            { classQr: code.trim().toUpperCase() },
            {
                onSuccess: () => {
                    setType("success");
                    setMessage(t("joinClass.success"));

                    setTimeout(() => {
                        setCode("");
                        onClose();
                        router.push(routes.myClasses);
                    }, 1500);
                },
                onError: (err) => {
                    setType("danger");
                    setMessage(
                        err.response?.data?.message ||
                        t("joinClass.notFound")
                    );
                },
            }
        );
    };

    return (
        <CommonFormModal
            show={show}
            onHide={onClose}
            title={t("joinClass.title")}
            footer={(
                <ModalActionFooter
                    cancelLabel={t("common.later")}
                    submitLabel={t("joinClass.submit")}
                    loadingLabel={tCommon("processing")}
                    loading={loading}
                    onCancel={onClose}
                    onSubmit={handleJoin}
                />
            )}
        >

            {message && (
                <Alert
                    variant={type}
                    style={{ margin: "1.5rem 2rem", fontSize: "var(--font-size-ssm)" }}
                >
                    {message}
                </Alert>
            )}

            <div className={cx("formGroup")}>
                <label className={cx("label")}>{t("joinClass.codeLabel")}</label>

                <div className={cx("inputWrapper")}>
                    <input
                        type="text"
                        className={cx("inputControl")}
                        placeholder={t("joinClass.codePlaceholder")}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className={cx("tip")}>
                    <span>{t("joinClass.codeTip")}</span>
                </div>
            </div>
        </CommonFormModal>
    );
}

export default JoinClassModal;
