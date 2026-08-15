'use client';

import HeroSection from './_components/HeroSection/HeroSection';
import JourneySection from './_components/JourneySection/JourneySection';
import ExamTypeGrid from './_components/ExamTypeGrid/ExamTypeGrid';
import WhyWinDe from './_components/WhyWinDe/WhyWinDe';
import FaqSection from './_components/FaqSection/FaqSection';

export default function Home() {
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
