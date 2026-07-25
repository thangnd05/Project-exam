import HeroSection from './components/HeroSection/HeroSection';
import ExploreOrb from './components/ExploreOrb/ExploreOrb';
import JourneySection from './components/JourneySection/JourneySection';

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <JourneySection />
      <ExploreOrb />
    </div>
  );
}
