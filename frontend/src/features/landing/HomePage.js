import HeroSection from './components/HeroSection/HeroSection';
import JourneySection from './components/JourneySection/JourneySection';
import ExploreOrb from './components/ExploreOrb/ExploreOrb';
import WhyWinDe from './components/WhyWinDe/WhyWinDe';
import FaqSection from './components/FaqSection/FaqSection';

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <JourneySection />
      <ExploreOrb />
      <WhyWinDe />
      <FaqSection />
    </div>
  );
}
