import HeroSection from './components/HeroSection/HeroSection';
import ExploreOrb from './components/ExploreOrb/ExploreOrb';
import ProcessSection from './components/ProcessSection/ProcessSection';

export default function TestPage() {
  return (
    <div>

      <section className="hero-section">
        <HeroSection />
      </section>

      <ExploreOrb />

      <section className="process-section">
        <ProcessSection />
      </section>
    </div>
  );
}
