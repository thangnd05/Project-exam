import HeroSection from './components/HeroSection/HeroSection';
import ExploreOrb from './components/ExploreOrb/ExploreOrb';
import JourneySection from './components/JourneySection/JourneySection';
import ClosingCta from './components/ClosingCta/ClosingCta';

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <JourneySection />
      <ExploreOrb />
      <ClosingCta />
    </div>
  );
}
