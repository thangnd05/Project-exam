'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { getTtsUrl } from '@/app/utils/mediaUrl';
import { useStreak } from '@/app/features/gamification/streak/hooks/useStreak';
import { useStreakRestoreGate } from '@/app/features/gamification/streak/hooks/useStreakRestoreGate';
import StreakRestoreModal from '@/app/features/gamification/streak/StreakRestoreModal';
import {
  useCheckPracticeAnswer,
  useGeneratePracticeQuestion,
  useMarkVocabKnown,
} from './_hooks/usePractice';
import {Container, Spinner} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {motion, AnimatePresence} from 'framer-motion';
import {
    CheckCircle,
    XCircle,
    ArrowLeft,
    BookOpen,
    Volume2
} from 'lucide-react';
import type { PracticeCheckRequest, PracticeCheckResponse, PracticeQuestionResponse } from '@/app/types';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from './Practice.module.scss';

const cx = classNames.bind(styles);

type AutoplayAudioElement = HTMLAudioElement & {
    _cleanupAutoplay?: (() => void) | null;
};

const Practice = () => {
    const t = useTranslations('Vocabulary');
    const tCommon = useTranslations('Common');
    const {albumId} = useParams<{ albumId: string }>();
    const [question, setQuestion] = useState<PracticeQuestionResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [userAnswer, setUserAnswer] = useState({english: '', vietnamese: ''});
    const [result, setResult] = useState<PracticeCheckResponse | null>(null);
    const [finished, setFinished] = useState(false);
    const [loadingNext, setLoadingNext] = useState(false);
    const [knownMessage, setKnownMessage] = useState<'' | 'markedKnown' | 'markError'>('');
    const audioRef = useRef<AutoplayAudioElement | null>(null);
    const { refreshStreak } = useStreak();
    const { blocked, allow, streakReady } = useStreakRestoreGate();
    const markMutation = useMarkVocabKnown(albumId);
    const markingKnown = markMutation.isPending;
    const checkMutation = useCheckPracticeAnswer(albumId);
    // Chỉ lấy mutateAsync (ổn định giữa các lần render). Object trả về từ useMutation đổi mỗi
    // render, đưa nó vào deps làm effect bên dưới gọi API sinh câu hỏi liên tục.
    const { mutateAsync: generateQuestion } = useGeneratePracticeQuestion(albumId);

    const fetchQuestion = useCallback(async () => {
        try {
            setLoading(true);
            const data = await generateQuestion();
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
    }, [generateQuestion]);

    useEffect(() => {
        if (!streakReady || blocked) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- API sinh câu hỏi ngẫu nhiên (mỗi lần gọi một câu khác), không đưa vào cache useQuery được; chỉ gọi khi cổng streak mở
        fetchQuestion();
    }, [fetchQuestion, streakReady, blocked]);

    useEffect(() => {
        if (!question?.word || !audioRef.current) return;

        const audioEl = audioRef.current;
        audioEl.load();

        const tryPlay = () => audioEl.play();

        tryPlay()?.catch(() => {
            const playOnInteract = () => {
                tryPlay()?.catch(() => {});
            };
            window.addEventListener('pointerdown', playOnInteract, { once: true });
            window.addEventListener('keydown', playOnInteract, { once: true });

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

        const payload: PracticeCheckRequest =
            question.type === 'MULTICHOICE'
                ? {
                      vocabId: question.vocabId,
                      type: question.type,
                      selectedOptionText: question.options![selectedOption!],
                  }
                : {
                      vocabId: question.vocabId,
                      type: question.type,
                      userEnglish: userAnswer.english,
                      userVietnamese: userAnswer.vietnamese,
                  };

        checkMutation.mutate(payload, {
            onSuccess: (data) => {
                setResult(data);
                refreshStreak();
            },
            onError: (err) => {
                console.error('Lỗi khi chấm:', err);
            },
        });
    };

    const handleNext = async () => {
        setLoadingNext(true);
        await fetchQuestion();
        setLoadingNext(false);
    };

    const handleMarkKnown = () => {
        if (!question) return;
        markMutation.mutate(question.vocabId, {
            onSuccess: () => {
                refreshStreak();
                setKnownMessage('markedKnown');
                setTimeout(() => setKnownMessage(''), 2000);
                setTimeout(() => {
                    fetchQuestion();
                }, 1500);
            },
            onError: (err) => {
                console.error('Lỗi khi đánh dấu đã biết:', err);
                setKnownMessage('markError');
            },
        });
    };

    if (!streakReady || blocked || loading) {
        return (
            <div className={cx('wrapper')}>
                <Container className={cx('loadingContainer')}>
                    <motion.div
                        initial={{opacity: 0, scale: 0.8}}
                        animate={{opacity: 1, scale: 1}}
                        className={cx('loadingContent')}
                    >
                        <Spinner animation="border" variant="primary" className={cx('spinner')} />
                        <p className={cx('loadingText')}>{t('practice.loading')}</p>
                    </motion.div>
                </Container>
                <StreakRestoreModal show={blocked} onClose={allow} />
            </div>
        );
    }

    if (finished) {
        return (
            <div className={cx('wrapper')}>
                <Container className={cx('finishedContainer')}>
                    <motion.div
                        initial={{opacity: 0, y: 30}}
                        animate={{opacity: 1, y: 0}}
                        className={cx('finishedCard')}
                    >
                        <h2 className={cx('finishedTitle')}>{t('practice.finishedTitle')}</h2>
                        <p className={cx('finishedSubtitle')}>
                            {t('practice.finishedSubtitle')}
                        </p>

                        <ButtonPrime variant="primary" size="lg" onClick={() => window.history.back()}>
                            <ArrowLeft size={20} />
                            {t('practice.backToAlbum')}
                        </ButtonPrime>
                    </motion.div>
                </Container>
            </div>
        );
    }

    if (!question) {
        return (
            <div className={cx('wrapper')}>
                <Container className={cx('emptyContainer')}>
                    <div className={cx('emptyContent')}>
                        <BookOpen size={64} className={cx('emptyIcon')} />
                        <h3>{t('practice.noQuestion')}</h3>
                        <ButtonPrime variant="outline" onClick={() => window.history.back()}>
                            {t('practice.back')}
                        </ButtonPrime>
                    </div>
                </Container>
            </div>
        );
    }

    const isMultiChoice = question.type === 'MULTICHOICE';
    const canSubmit = isMultiChoice
        ? selectedOption !== null
        : userAnswer.english.trim() !== '' || userAnswer.vietnamese.trim() !== '';

    return (
        <div className={cx('wrapper')}>
            <Container className={cx('practiceContainer')}>

                <AnimatePresence>
                    {knownMessage && (
                        <motion.div
                            initial={{opacity: 0, y: -20}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -20}}
                            className={cx('toast', knownMessage === 'markError' ? 'error' : 'success')}
                        >
                            <span>{t(`practice.${knownMessage}`)}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    initial={{opacity: 0, y: -20}}
                    animate={{opacity: 1, y: 0}}
                    className={cx('header')}
                >
                    <div className={cx('headerLeft')}>
                        <div className={cx('typeBadge')}>
                            <span>{isMultiChoice ? t('practice.multiChoice') : t('practice.typeWord')}</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    key={question.vocabId}
                    initial={{opacity: 0, x: 50}}
                    animate={{opacity: 1, x: 0}}
                    exit={{opacity: 0, x: -50}}
                    className={cx('mainCard')}
                >

                    <div className={cx('questionSection')}>
                        <h2 className={cx('questionText')}>{question.questionText}</h2>

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
                                    <label className={cx('inputLabel')}>{t('practice.englishWord')}</label>
                                    <input
                                        type="text"
                                        value={userAnswer.english}
                                        onChange={(e) => setUserAnswer({...userAnswer, english: e.target.value})}
                                        placeholder={t('practice.englishPlaceholder')}
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
                                    <label className={cx('inputLabel')}>{t('practice.vietnameseMeaning')}</label>
                                    <input
                                        type="text"
                                        value={userAnswer.vietnamese}
                                        onChange={(e) => setUserAnswer({...userAnswer, vietnamese: e.target.value})}
                                        placeholder={t('practice.vietnamesePlaceholder')}
                                        className={cx('textInput')}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                        )}

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
                                                <span className={cx('resultTitle')}>{t('practice.correct')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle size={24} className={cx('resultIcon')} />
                                                <span className={cx('resultTitle')}>{t('practice.incorrect')}</span>
                                            </>
                                        )}
                                    </div>

                                    {!result.correct && (
                                        <div className={cx('correctAnswer')}>
                                            <div className={cx('answerRow')}>
                                                <span className={cx('answerLabel')}>{t('practice.correctWord')}</span>
                                                <span className={cx('answerWord')}>{question.word}</span>
                                            </div>
                                            <div className={cx('answerRow')}>
                                                <span className={cx('answerLabel')}>{t('practice.meaning')}</span>
                                                <span className={cx('answerMeaning')}>{question.meaning}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className={cx('resultStats')}>
                                        <div className={cx('statItem')}>
                                            <span className={cx('statLabel')}>{t('practice.status')}</span>
                                            <span className={cx('statValue')}>{result.status}</span>
                                        </div>
                                        <div className={cx('statItem')}>
                                            <span className={cx('statLabel')}>{t('practice.correctCount')}</span>
                                            <span className={cx('statValue')}>{result.correctCount}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className={cx('actionButtons')}>
                            {!result ? (
                                <ButtonPrime
                                    variant="primary"
                                    className={cx('submitBtn')}
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || checkMutation.isPending}
                                >
                                    {checkMutation.isPending ? t('practice.checking') : t('practice.check')}
                                </ButtonPrime>
                            ) : (
                                <>
                                    <ButtonPrime
                                        variant="outline"
                                        className={cx('skipBtn')}
                                        onClick={handleNext}
                                        disabled={loadingNext}
                                    >
                                        {loadingNext ? <Spinner size="sm" animation="border" /> : t('practice.next')}
                                    </ButtonPrime>
                                    <ButtonPrime
                                        variant="success"
                                        className={cx('knownBtn')}
                                        onClick={handleMarkKnown}
                                        disabled={markingKnown}
                                    >
                                        {markingKnown ? tCommon('processing') : t('practice.known')}
                                    </ButtonPrime>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </Container>
        </div>
    );
};

export default Practice;
