import Header from './components/Header';
import Hero from './components/Hero';
import FeaturedPosts from './components/FeaturedPosts';
import About from './components/About';
import KeyIssues from './components/KeyIssues';
import CampaignGallery from './components/CampaignGallery';
import SocialFeed from './components/SocialFeed';
import Contact from './components/Contact';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <Hero />
        <FeaturedPosts />
        <About />
        <KeyIssues />
        <CampaignGallery />
        <SocialFeed />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
