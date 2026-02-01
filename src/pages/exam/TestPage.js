import HeroSection from './HeroSection/HeroSection';
import ExamTypePage from './examtype/ExamTypePage';
import HomeContent from '../../components/HomeContent';
import ProcessSection from './ProcessSection/ProcessSection';

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
    </div>
  );
}
