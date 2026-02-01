import HeroSection from './HeroSection/HeroSection';
import ExamTypePage from './examtype/ExamTypePage';

export default function TestPage() {
  return (
    <div>
      {/* 🌟 HERO */}
      <HeroSection />

      {/* 🎯 MAIN ACTION */}
      <section className="main-section">
        <ExamTypePage />
      </section>
    </div>
  );
}
