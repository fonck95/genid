import Header from './components/Header';
import Hero from './components/Hero';
import NewsSection from './components/NewsSection';
import PhotoGallery from './components/PhotoGallery';
import FacebookEmbed from './components/FacebookEmbed';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <Hero />
        <NewsSection />
        <PhotoGallery />
        <FacebookEmbed />
      </main>
      <Footer />
    </div>
  );
}

export default App;
