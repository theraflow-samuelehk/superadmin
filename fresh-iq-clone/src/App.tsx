import { useState } from 'react';
import { translations, type Lang } from './i18n';
import Navbar from './components/Navbar';
import ScrollProgress from './components/ScrollProgress';
import LaunchBanner from './components/LaunchBanner';
import Hero from './components/Hero';
import StatsBar from './components/StatsBar';
import ProblemSection from './components/ProblemSection';
import SolutionSection from './components/SolutionSection';
import HowItWorks from './components/HowItWorks';
import BreathScore from './components/BreathScore';
import Science from './components/Science';
import WhyLove from './components/WhyLove';
import PerfectFor from './components/PerfectFor';
import VsComparison from './components/VsComparison';
import WhatsInTheBox from './components/WhatsInTheBox';
import Discreet from './components/Discreet';
import FAQ from './components/FAQ';
import Reviews from './components/Reviews';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';

export default function App() {
  const [lang, setLang] = useState<Lang>('en');
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <ScrollProgress />
      <Navbar t={t} lang={lang} setLang={setLang} />
      <LaunchBanner t={t} />
      <Hero t={t} />
      <StatsBar t={t} />
      <ProblemSection t={t} />
      <SolutionSection t={t} />
      <HowItWorks t={t} />
      <BreathScore t={t} />
      <Science t={t} />
      <WhyLove t={t} />
      <PerfectFor t={t} />
      <VsComparison t={t} />
      <WhatsInTheBox t={t} />
      <Discreet t={t} />
      <FAQ t={t} />
      <Reviews t={t} />
      <FinalCTA t={t} />
      <Footer t={t} />
    </div>
  );
}
