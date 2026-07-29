import { MotionConfig } from "framer-motion";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Plans from "./components/Plans";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

/**
 * Landing page de Gym Assist Management Suite.
 * MotionConfig con reducedMotion="user" desactiva las animaciones de
 * Framer Motion cuando el sistema pide movimiento reducido.
 */
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen bg-navy-950 font-sans text-white antialiased selection:bg-emerald-400/30 selection:text-white">
        {/* Matiz superior azul marino + patrón de cuadrícula del fondo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-gradient-to-b from-navy-900 to-transparent"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-grid" />

        <div className="relative">
          <Header />
          <main>
            <Hero />
            <Features />
            <Plans />
            <Contact />
          </main>
          <Footer />
        </div>
      </div>
    </MotionConfig>
  );
}
