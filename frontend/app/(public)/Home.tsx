'use client';

import HeroSection from './_components/HeroSection/HeroSection';
// import JourneySection from './_components/JourneySection/JourneySection';
import RankScope from './_components/RankScope/RankScope';
import CertificationOrbit from './_components/CertificationOrbit/CertificationOrbit';
// import ExamTypeGrid from './_components/ExamTypeGrid/ExamTypeGrid';
// import WhyWinDe from './_components/WhyWinDe/WhyWinDe';
// import FaqSection from './_components/FaqSection/FaqSection';

export default function Home() {
  return (
    <div>
      <HeroSection />
      {/* <JourneySection /> */}
      <RankScope />
      <CertificationOrbit />
      {/* <ExamTypeGrid />
      <WhyWinDe />
      <FaqSection /> */}
    </div>
  );
}
