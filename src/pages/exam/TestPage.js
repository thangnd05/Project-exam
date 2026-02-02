import HeroSection from '../HeroSection/HeroSection';
import ExamTypePage from './examtype/ExamTypePage';
import HomeContent from '../../components/HomeContent';
import ProcessSection from '../ProcessSection/ProcessSection';
import Evaluation from '../../pages/evaluation/evaluation';

export default function TestPage() {
  return (
    <div>
      {/* 🌟 HERO */}
      <section className="hero-section">
        <HeroSection />
      </section>

      {/* 🎯 MAIN ACTION */}
      <section className="main-section">
        <ExamTypePage />
      </section>

      <section className="process-section">
        <ProcessSection />
      </section>
      {/* 📊 STATISTICS */}
      <section className="stats-section">
        <HomeContent />
      </section>

      {/* 📝 EVALUATION */}
      <section className="evaluation-section">
        <Evaluation />
      </section>
    </div>
  );
}
