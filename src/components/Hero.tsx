import { motion } from "framer-motion";
import { Flame, ArrowRight } from "lucide-react";
import { Typewriter } from "./ui/typewriter";
import { SparklesBackground } from "./ui/sparkles-background";
import { AnimatedBorderButton } from "./ui/animated-border-button";
import confetti from "canvas-confetti";

const stackWords = ["React", "Vue", "Angular", "Next.js", "MERN", "LAMP", "Python", "Rust"];

export function Hero() {
  const handleRoast = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#8b5cf6", "#3b82f6", "#f97316"],
    });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-canvas">
        <SparklesBackground particleCount={60} />
        <div className="absolute inset-0 bg-gradient-radial from-violet-500/5 via-transparent to-transparent" />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-8"
          >
            <Flame className="w-4 h-4" />
            <span>Over 10,000 stacks roasted</span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-foreground mb-6">
            Roast my{" "}
            <Typewriter
              words={stackWords}
              className="text-5xl md:text-7xl lg:text-8xl font-semibold"
            />
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Submit your tech stack. Get brutally honest AI-powered critiques.
            Join the community of developers who embrace the roast.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <AnimatedBorderButton onClick={handleRoast}>
              <Flame className="w-4 h-4 text-orange-400" />
              Submit Your Stack
            </AnimatedBorderButton>

            <motion.button
              whileHover={{ x: 5 }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              View Recent Roasts
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-20 grid grid-cols-3 gap-8 max-w-xl mx-auto"
        >
          {[
            { value: "10K+", label: "Stacks Roasted" },
            { value: "98%", label: "Burn Rate" },
            { value: "4.2M", label: "Laughs Generated" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-semibold text-foreground">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-canvas to-transparent" />
    </section>
  );
}
