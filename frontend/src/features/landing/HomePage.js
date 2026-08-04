import HeroSection from './components/HeroSection/HeroSection';
import JourneySection from './components/JourneySection/JourneySection';
import ExamTypeGrid from './components/ExamTypeGrid/ExamTypeGrid';
import WhyWinDe from './components/WhyWinDe/WhyWinDe';
import FaqSection from './components/FaqSection/FaqSection';

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <JourneySection />
      <ExamTypeGrid />
      <WhyWinDe />
      <FaqSection />
    </div>
  );
}
