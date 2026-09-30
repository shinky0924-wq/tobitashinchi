// @ts-nocheck
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import Header from './components/Header';
import Hero from './components/Hero';
import Concerns from './components/Concerns';
import Reasons from './components/Reasons';
import FAQ from './components/FAQ';
import Testimonials from './components/Testimonials';
import JobDetails from './components/JobDetails';
import Flow from './components/Flow';
import ConsultationForm from './components/ConsultationForm';
import Footer from './components/Footer';

export default function App() {
  const [injectedMessage, setInjectedMessage] = useState<string>('');

  const handleScrollToForm = () => {
    const target = document.getElementById('consultation');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleInjectedScroll = (message: string) => {
    setInjectedMessage(message);
    const target = document.getElementById('consultation');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleClearInjected = () => {
    setInjectedMessage('');
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-rose-100 selection:text-secondary flex flex-col font-sans antialiased text-[#1b1c1c]">
      {/* Navigation */}
      <Header onCtaclick={handleScrollToForm} />

      {/* Main Layout Area */}
      <main className="flex-grow">
        
        {/* Hero Section */}
        <Hero onCtaclick={handleScrollToForm} />

        {/* concerns Bento Grid block */}
        <Concerns />

        {/* Reasons Section */}
        <Reasons />

        {/* FAQ accordion section */}
        <FAQ />

        {/* Testimonials Quote Cards */}
        <Testimonials />

        {/* Job detailed specification with live interactive income simulator */}
        <JobDetails onCtaclickWithData={handleInjectedScroll} />

        {/* Onboarding steps list */}
        <Flow />

        {/* Action interactive consultation panel */}
        <ConsultationForm 
          initialMessage={injectedMessage} 
          onClearInitialMessage={handleClearInjected} 
        />

      </main>

      {/* Footer component */}
      <Footer />
    </div>
  );
}
