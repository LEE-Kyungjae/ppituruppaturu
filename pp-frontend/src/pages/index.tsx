// frontend/src/pages/index.tsx
import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import SocialLogin from '@/components/auth/SocialLogin';
import SEOHead from '@/components/SEOHead';
import { generateSEO, generateBreadcrumbStructuredData } from '@/utils/seo';
import { Users, Gamepad2, Layers, Zap, ArrowRight } from 'lucide-react';

const HeroSection = () => {
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 1.5]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <section className="relative h-screen flex items-center justify-center text-white overflow-hidden">
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900"
        style={{ scale, opacity }}
      />
      <div className="relative z-10 text-center p-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tight"
        >
          PITTURU: The Next Dimension of Gaming
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8"
        >
          Experience a seamless fusion of technologies, creating a gaming platform that&rsquo;s powerful, flexible, and endlessly fun.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <button className="bg-white text-black font-bold py-3 px-8 rounded-full text-lg hover:bg-gray-200 transition-colors duration-300 flex items-center gap-2 mx-auto">
            Get Started <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title, description, index }: {
  icon: React.ComponentType;
  title: string;
  description: string;
  index: number;
}) => {
  const Icon = icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      viewport={{ once: true }}
      className="bg-gray-800 p-8 rounded-2xl border border-gray-700"
    >
      <div className="bg-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center mb-4">
        <Icon size={24} />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  );
};

const FeaturesSection = () => {
  const features = [
    { icon: Users, title: 'Community Driven', description: 'Engage with a vibrant community of gamers and developers.' },
    { icon: Gamepad2, title: 'Diverse Mini-Games', description: 'A constantly expanding library of fun and addictive mini-games.' },
    { icon: Layers, title: 'Hybrid Technology', description: 'Leveraging Unity and Flutter for a seamless cross-platform experience.' },
    { icon: Zap, title: 'Real-time Backend', description: 'Powered by a high-performance Go backend for instant action.' },
  ];

  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-12"
        >
          Why PittuRu?
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <FeatureCard key={i} index={i} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  return (
    <section className="py-20 bg-gray-800 text-white">
      <div className="container mx-auto px-4 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold mb-4"
        >
          Ready to Dive In?
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto"
        >
          Join thousands of players and start your gaming journey today. It&rsquo;s free to play!
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <button className="bg-blue-500 text-white font-bold py-4 px-10 rounded-full text-xl hover:bg-blue-600 transition-colors duration-300">
            Create Your Account
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [points, setPoints] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // In a real app, you'd validate the token and fetch user data
      setIsLoggedIn(true);
      setUsername('Player1'); // Placeholder
      setPoints(1250); // Placeholder
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLoginModal(false);
    // Fetch and set user data
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsLoggedIn(false);
    setUsername('');
    setPoints(0);
  };

  const seoProps = generateSEO({
    title: 'PittuRu - The Next Dimension of Gaming',
    description: 'Experience a seamless fusion of technologies, creating a gaming platform that\'s powerful, flexible, and endlessly fun.',
    keywords: ['mini-games', 'browser games', 'free games', 'online gaming'],
    url: '/'
  });

  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Home', url: '/' }
  ]);

  return (
    <>
      <SEOHead {...seoProps} breadcrumbs={breadcrumbData} />
      <Navbar 
        isLoggedIn={isLoggedIn}
        username={username}
        points={points}
        onLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />
      <main className="bg-gray-900">
        <HeroSection />
        <FeaturesSection />
        <CTASection />
      </main>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full mx-4 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Login or Sign Up</h2>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>
            <SocialLogin />
          </div>
        </div>
      )}
    </>
  );
}
