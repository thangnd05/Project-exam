import HeroSection from './HeroSection/HeroSection';
import ExamTypePage from './examtype/ExamTypePage';
import JoinClassPage from '../class/JoinClassPage';

export default function TestPage() {
  return (
    <div>
      {/* 🌟 HERO */}
      <HeroSection />

      {/* 🎯 MAIN ACTION */}
      <section className="main-section">
        <ExamTypePage />
        <JoinClassPage />
      </section>
    </div>
  );
}
