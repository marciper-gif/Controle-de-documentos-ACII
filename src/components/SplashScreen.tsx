import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, CheckCircle2, Shield } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const fullSlogan = 'Excelência em cada processo, qualidade em cada resultado.';

  // Velocidade da máquina de escrever (ms por caractere)
  const TYPING_SPEED_MS = 40;
  // Tempo de leitura extra após a frase terminar de aparecer
  const READING_BUFFER_MS = 2000;
  // Tempo total = tempo real de digitação da frase + tempo de leitura
  // (garante que a mensagem sempre termine de aparecer E dê tempo de ler,
  // em vez de um valor fixo desconectado do conteúdo)
  const SPLASH_DURATION_MS = fullSlogan.length * TYPING_SPEED_MS + READING_BUFFER_MS;

  useEffect(() => {
    // Typewriter effect for the slogan
    let currentIdx = 0;
    const typingInterval = setInterval(() => {
      if (currentIdx <= fullSlogan.length) {
        setDisplayedText(fullSlogan.slice(0, currentIdx));
        currentIdx++;
      } else {
        clearInterval(typingInterval);
      }
    }, TYPING_SPEED_MS);

    // Timer dinâmico: espera a frase terminar de digitar + tempo de leitura
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, SPLASH_DURATION_MS);

    return () => {
      clearInterval(typingInterval);
      clearTimeout(timer);
    };
  }, []);

  const handleAnimationComplete = () => {
    if (!isVisible) {
      onComplete();
    }
  };

  return (
    <AnimatePresence onExitComplete={handleAnimationComplete}>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => setIsVisible(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#1e3a5f] via-[#112240] to-[#0f172a] text-white overflow-hidden select-none cursor-pointer"
          title="Clique para pular"
        >
          {/* Ambient Lighting & Decorative Glows */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.12)_0,transparent_70%)] pointer-events-none" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Grid pattern background overlay */}
          <div 
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`,
              backgroundSize: '28px 28px'
            }}
          />

          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg w-full">
            {/* Logo Emblem with Animated Scale & Pulsing Ring */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-8"
            >
              {/* Outer glowing pulsing ring */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.25, 0.5, 0.25]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute -inset-4 rounded-3xl bg-sky-400/30 blur-lg"
              />

              {/* Main Emblem Badge */}
              <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-[#2b5182] via-[#1e3a5f] to-emerald-600 p-0.5 shadow-2xl shadow-sky-950/60 flex items-center justify-center">
                <div className="w-full h-full bg-[#0f172a]/90 backdrop-blur-md rounded-[14px] flex flex-col items-center justify-center p-2 border border-white/15">
                  <span className="font-black text-4xl tracking-tight text-white font-display">
                    ACII
                  </span>
                  <div className="w-6 h-1 bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full mt-1.5" />
                </div>
              </div>

              {/* Floating Sparkle Icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="absolute -top-2 -right-2 bg-[#0f172a] border border-sky-400/40 p-1.5 rounded-full text-sky-400 shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
            </motion.div>

            {/* Title & Brand Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-1.5"
            >
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-100 font-display">
                Controle de Processos
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-sky-300/90 flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Associação Comercial de Imperatriz</span>
              </p>
            </motion.div>

            {/* Impact Phrase with Typewriter Effect */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-6 py-2.5 px-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-xl flex items-center gap-2.5 max-w-md"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-200 font-sans leading-relaxed tracking-wide min-h-[20px] text-left">
                "{displayedText}"
                <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1 animate-pulse align-middle" />
              </span>
            </motion.div>

            {/* Bottom Loading Progress Indicator */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '100%' }}
              transition={{ delay: 0.5, duration: 2.2, ease: 'easeInOut' }}
              className="mt-10 h-1.5 bg-slate-800/80 rounded-full overflow-hidden max-w-[220px] border border-white/5"
            >
              <motion.div
                animate={{
                  x: ['-100%', '100%']
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.4,
                  ease: 'easeInOut'
                }}
                className="h-full w-full bg-gradient-to-r from-sky-500 via-emerald-400 to-sky-500 rounded-full"
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.8 }}
              className="mt-3 text-[10px] font-mono text-slate-400 tracking-wider"
            >
              Carregando portal corporativo...
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
