import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import KeyIssues from './components/KeyIssues';
import Contact from './components/Contact';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <Hero />
        <About />
        <KeyIssues />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
