import HeroSection from './components/HeroSection/HeroSection';
import JourneySection from './components/JourneySection/JourneySection';
import ExploreOrb from './components/ExploreOrb/ExploreOrb';
import WhyWinDe from './components/WhyWinDe/WhyWinDe';

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <JourneySection />
      <ExploreOrb />
      <WhyWinDe />
    </div>
  );
}
