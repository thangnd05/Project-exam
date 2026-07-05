import React, {useEffect, useState, useRef, useCallback} from 'react';
import {useParams} from 'react-router-dom';
import { generatePracticeQuestion, checkPracticeAnswer, markVocabKnown } from '../../api/practiceQuestionApi';
import { getTtsUrl } from '~/utils/mediaUrl';
import { useStreak } from '~/hooks/useStreak';
import {Container, Spinner} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {motion, AnimatePresence} from 'framer-motion';
import {
    CheckCircle,
    XCircle,
    ArrowRight,
    SkipForward,
    Sparkles,
    BookOpen,
    Target,
    Trophy,
    ChevronRight,
    Volume2
} from 'lucide-react';

import styles from './PracticePage.module.scss';

const cx = classNames.bind(styles);

const PracticePage = () => {
    const {albumId} = useParams();
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState(null);
    const [userAnswer, setUserAnswer] = useState({english: '', vietnamese: ''});
    const [result, setResult] = useState(null);
    const [finished, setFinished] = useState(false);
    const [loadingNext, setLoadingNext] = useState(false);
    const [markingKnown, setMarkingKnown] = useState(false);
    const [knownMessage, setKnownMessage] = useState('');
    const [sessionScore, setSessionScore] = useState({correct: 0, total: 0});
    const audioRef = useRef(null);
    const { refreshStreak } = useStreak();

    const fetchQuestion = useCallback(async () => {
        try {
            setLoading(true);
            const data = await generatePracticeQuestion(albumId);
            if (!data) {
                setFinished(true);
                setQuestion(null);
            } else {
                setQuestion(data);
            }
        } catch (err) {
            console.error('Lỗi lấy câu hỏi:', err);
        } finally {
            setLoading(false);
            setResult(null);
            setSelectedOption(null);
            setUserAnswer({english: '', vietnamese: ''});
        }
    }, [albumId]);

    useEffect(() => {
        fetchQuestion();
    }, [fetchQuestion]);

    // Tự động phát âm thanh lần đầu mỗi khi có câu hỏi mới
    useEffect(() => {
        if (!question?.word || !audioRef.current) return;

        const audioEl = audioRef.current;
        audioEl.load();

        const tryPlay = () => audioEl.play();

        // Thử phát ngay; nếu trình duyệt chặn (vd: vừa F5 chưa tương tác)
        // thì chờ thao tác đầu tiên của người dùng rồi phát lại đúng câu hiện tại.
        tryPlay()?.catch(() => {
            const playOnInteract = () => {
                tryPlay()?.catch(() => {});
            };
            window.addEventListener('pointerdown', playOnInteract, { once: true });
            window.addEventListener('keydown', playOnInteract, { once: true });

            // Cleanup nếu đổi câu trước khi người dùng kịp tương tác
            audioEl._cleanupAutoplay = () => {
                window.removeEventListener('pointerdown', playOnInteract);
                window.removeEventListener('keydown', playOnInteract);
            };
        });

        return () => {
            audioEl._cleanupAutoplay?.();
            audioEl._cleanupAutoplay = null;
        };
    }, [question]);

    const handleSubmit = async () => {
        if (!question) return;

        const payload =
            question.type === 'MULTICHOICE'
                ? {
                      vocabId: question.vocabId,
                      type: question.type,
                      selectedOptionText: question.options[selectedOption],
                  }
                : {
                      vocabId: question.vocabId,
                      type: question.type,
                      userEnglish: userAnswer.english,
                      userVietnamese: userAnswer.vietnamese,
                  };

        try {
            const data = await checkPracticeAnswer(payload);
            setResult(data);
            if (data.correct) {
                setSessionScore(prev => ({...prev, correct: prev.correct + 1}));
            }
            setSessionScore(prev => ({...prev, total: prev.total + 1}));
            refreshStreak(); // 🔥 luyện từ vựng -> cập nhật streak
        } catch (err) {
            console.error('Lỗi khi chấm:', err);
        }
    };

    const handleNext = async () => {
        setLoadingNext(true);
        await fetchQuestion();
        setLoadingNext(false);
    };

    const handleMarkKnown = async () => {
        if (!question) return;
        try {
            setMarkingKnown(true);
            await markVocabKnown(question.vocabId);
            refreshStreak(); // 🔥 học từ vựng -> cập nhật streak
            setKnownMessage('Bạn đã đánh dấu từ này là đã biết!');
            setTimeout(() => setKnownMessage(''), 2000);
            setTimeout(async () => {
                await fetchQuestion();
            }, 1500);
        } catch (err) {
            console.error('Lỗi khi đánh dấu đã biết:', err);
            setKnownMessage('Có lỗi xảy ra khi đánh dấu từ này!');
        } finally {
            setMarkingKnown(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className={cx('wrapper')}>
                <Container className={cx('loadingContainer')}>
                    <motion.div
                        initial={{opacity: 0, scale: 0.8}}
                        animate={{opacity: 1, scale: 1}}
                        className={cx('loadingContent')}
                    >
                        <Spinner animation="border" variant="primary" className={cx('spinner')} />
                        <p className={cx('loadingText')}>Đang tải câu hỏi...</p>
                    </motion.div>
                </Container>
            </div>
        );
    }

    // Finished state
    if (finished) {
        return (
            <div className={cx('wrapper')}>
                <Container className={cx('finishedContainer')}>
                    <motion.div
                        initial={{opacity: 0, y: 30}}
                        animate={{opacity: 1, y: 0}}
                        className={cx('finishedCard')}
                    >
                        <div className={cx('finishedIcon')}>
                            <Trophy size={64} />
                        </div>
                        <h2 className={cx('finishedTitle')}>Chúc mừng bạn!</h2>
                        <p className={cx('finishedSubtitle')}>
                            Bạn đã hoàn thành tất cả từ trong album này!
                        </p>

                        <button className={cx('backBtn')} onClick={() => window.history.back()}>
                            <ArrowRight size={20} className={cx('backBtnIcon')} />
                            Quay lại Album
                        </button>
                    </motion.div>
                </Container>
            </div>
        );
    }

    // No question state
    if (!question) {
        return (
            <div className={cx('wrapper')}>
                <Container className={cx('emptyContainer')}>
                    <div className={cx('emptyContent')}>
                        <BookOpen size={64} className={cx('emptyIcon')} />
                        <h3>Không có câu hỏi nào khả dụng</h3>
                        <button className={cx('backBtn')} onClick={() => window.history.back()}>
                            Quay lại
                        </button>
                    </div>
                </Container>
            </div>
        );
    }

    // Main UI
    const isMultiChoice = question.type === 'MULTICHOICE';
    const canSubmit = isMultiChoice
        ? selectedOption !== null
        : userAnswer.english.trim() !== '' || userAnswer.vietnamese.trim() !== '';

    return (
        <div className={cx('wrapper')}>
            <Container className={cx('practiceContainer')}>
                {/* Known Message Toast */}
                <AnimatePresence>
                    {knownMessage && (
                        <motion.div
                            initial={{opacity: 0, y: -20}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -20}}
                            className={cx('toast', knownMessage.includes('lỗi') ? 'error' : 'success')}
                        >
                            <Sparkles size={18} />
                            <span>{knownMessage}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <motion.div
                    initial={{opacity: 0, y: -20}}
                    animate={{opacity: 1, y: 0}}
                    className={cx('header')}
                >
                    <div className={cx('headerLeft')}>
                        <div className={cx('typeBadge')}>
                            {isMultiChoice ? <Target size={16} /> : <BookOpen size={16} />}
                            <span>{isMultiChoice ? 'Chọn đáp án' : 'Nhập từ'}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Main Card */}
                <motion.div
                    key={question.vocabId}
                    initial={{opacity: 0, x: 50}}
                    animate={{opacity: 1, x: 0}}
                    exit={{opacity: 0, x: -50}}
                    className={cx('mainCard')}
                >
                    {/* Question Section */}
                    <div className={cx('questionSection')}>
                        <h2 className={cx('questionText')}>{question.questionText}</h2>

                        {/* Audio Player */}
                        <div className={cx('audioSection')}>
                            <audio
                                ref={audioRef}
                                key={question.vocabId}
                                preload="none"
                                className={cx('audioPlayer')}
                            >
                                <source
                                    src={getTtsUrl(question.word)}
                                    type="audio/mpeg"
                                />
                            </audio>
                            <button
                                className={cx('playBtn')}
                                onClick={() => {
                                    if (audioRef.current) {
                                        audioRef.current.play();
                                    }
                                }}
                            >
                                <Volume2 size={28} />
                            </button>
                        </div>
                    </div>

                    {/* Answer Section */}
                    <div className={cx('answerSection')}>
                        {isMultiChoice ? (
                            <div className={cx('optionsGrid')}>
                                {question.options?.map((opt, idx) => (
                                    <motion.button
                                        key={idx}
                                        whileHover={{scale: 1.02}}
                                        whileTap={{scale: 0.98}}
                                        onClick={() => setSelectedOption(idx)}
                                        className={cx('optionBtn', {
                                            selected: selectedOption === idx,
                                            correct: result?.correct && selectedOption === idx,
                                            wrong: result && !result.correct && selectedOption === idx
                                        })}
                                    >
                                        <span className={cx('optionIndex')}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className={cx('optionText')}>{opt}</span>
                                        {result && selectedOption === idx && (
                                            <span className={cx('optionIcon')}>
                                                {result.correct ? (
                                                    <CheckCircle size={20} className={cx('iconCorrect')} />
                                                ) : (
                                                    <XCircle size={20} className={cx('iconWrong')} />
                                                )}
                                            </span>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        ) : (
                            <div className={cx('inputGroup')}>
                                <div className={cx('inputWrapper')}>
                                    <label className={cx('inputLabel')}>Từ tiếng Anh</label>
                                    <input
                                        type="text"
                                        value={userAnswer.english}
                                        onChange={(e) => setUserAnswer({...userAnswer, english: e.target.value})}
                                        placeholder="Nhập từ tiếng Anh..."
                                        className={cx('textInput')}
                                        autoComplete="off"
                                    />
                                    {result && (
                                        <span className={cx('inputIcon', result.correct ? 'correct' : 'wrong')}>
                                            {result.correct ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                        </span>
                                    )}
                                </div>
                                <div className={cx('inputWrapper')}>
                                    <label className={cx('inputLabel')}>Nghĩa tiếng Việt</label>
                                    <input
                                        type="text"
                                        value={userAnswer.vietnamese}
                                        onChange={(e) => setUserAnswer({...userAnswer, vietnamese: e.target.value})}
                                        placeholder="Nhập nghĩa tiếng Việt..."
                                        className={cx('textInput')}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Result Feedback */}
                        <AnimatePresence>
                            {result && (
                                <motion.div
                                    initial={{opacity: 0, height: 0}}
                                    animate={{opacity: 1, height: 'auto'}}
                                    exit={{opacity: 0, height: 0}}
                                    className={cx('resultCard', result.correct ? 'correct' : 'wrong')}
                                >
                                    <div className={cx('resultHeader')}>
                                        {result.correct ? (
                                            <>
                                                <CheckCircle size={24} className={cx('resultIcon')} />
                                                <span className={cx('resultTitle')}>Chính xác!</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle size={24} className={cx('resultIcon')} />
                                                <span className={cx('resultTitle')}>Chưa đúng rồi!</span>
                                            </>
                                        )}
                                    </div>

                                    {!result.correct && (
                                        <div className={cx('correctAnswer')}>
                                            <div className={cx('answerRow')}>
                                                <span className={cx('answerLabel')}>Từ đúng:</span>
                                                <span className={cx('answerWord')}>{question.word}</span>
                                            </div>
                                            <div className={cx('answerRow')}>
                                                <span className={cx('answerLabel')}>Nghĩa:</span>
                                                <span className={cx('answerMeaning')}>{question.meaning}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className={cx('resultStats')}>
                                        <div className={cx('statItem')}>
                                            <span className={cx('statLabel')}>Trạng thái</span>
                                            <span className={cx('statValue')}>{result.status}</span>
                                        </div>
                                        <div className={cx('statItem')}>
                                            <span className={cx('statLabel')}>Số lần đúng</span>
                                            <span className={cx('statValue')}>{result.correctCount}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Action Buttons */}
                        <div className={cx('actionButtons')}>
                            {!result ? (
                                <button
                                    className={cx('submitBtn')}
                                    onClick={handleSubmit}
                                    disabled={!canSubmit}
                                >
                                    Kiểm tra đáp án
                                </button>
                            ) : (
                                <>
                                    <button
                                        className={cx('skipBtn')}
                                        onClick={handleNext}
                                        disabled={loadingNext}
                                    >
                                        {loadingNext ? (
                                            <Spinner size="sm" animation="border" />
                                        ) : (
                                            <>
                                                <SkipForward size={18} />
                                                Câu tiếp theo
                                                <ChevronRight size={18} />
                                            </>
                                        )}
                                    </button>
                                    <button
                                        className={cx('knownBtn')}
                                        onClick={handleMarkKnown}
                                        disabled={markingKnown}
                                    >
                                        <Sparkles size={18} />
                                        {markingKnown ? 'Đang xử lý...' : 'Đã biết từ này'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </Container>
        </div>
    );
};

export default PracticePage;
