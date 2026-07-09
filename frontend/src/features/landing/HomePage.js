import HeroSection from './components/HeroSection/HeroSection';
import ExamTypePage from '~/features/tests/exam/exam-types/ExamTypePage';
import ProcessSection from './components/ProcessSection/ProcessSection';
import Evaluation from './components/Evaluation/Evaluation';

export default function TestPage() {
  return (
    <div>

      <section className="hero-section">
        <HeroSection />
      </section>

      <section className="main-section">
        <ExamTypePage />
      </section>

      <section className="process-section">
        <ProcessSection />
      </section>

      <section className="evaluation-section">
        <Evaluation />
      </section>
    </div>
  );
}
