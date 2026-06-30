import HeroExperience from "./sections/HeroExperience";
import DreamCenter from "./sections/DreamCenter";
import RealityAnalysis from "./sections/RealityAnalysis";
import RealityGap from "./sections/RealityGap";
import AlternateFutures from "./sections/AlternateFutures";
import AIRoadmap from "./sections/AIRoadmap";
import StartJourneyCTA from "./sections/StartJourneyCTA";

export default function FutureJourneyShell() {
  return (
    <main className="bg-[#050816]">
      <HeroExperience />
      <DreamCenter />
      <RealityAnalysis />
      <RealityGap />
      <AlternateFutures />
      <AIRoadmap />
      <StartJourneyCTA />
    </main>
  );
}