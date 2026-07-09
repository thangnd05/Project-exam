import HeroSection from '../HeroSection/HeroSection';
import ExamTypePage from './examtype/ExamTypePage';
import ProcessSection from '../ProcessSection/ProcessSection';
import Evaluation from '~/features/evaluation/evaluation';

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
