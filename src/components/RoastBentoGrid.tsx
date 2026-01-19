import { BentoCard, BentoGrid } from "./ui/bento-card";
import { Flame, Trophy, Users, Zap, Code, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const mockRoasts = [
  {
    id: 1,
    user: "dev_sarah",
    stack: ["React", "Redux", "jQuery", "Webpack 3"],
    roast: "jQuery in 2024? Bold strategy. Your bundle size thanks you for the extra 85kb of 'just in case' utilities.",
    burnScore: 87,
  },
  {
    id: 2,
    user: "php_master",
    stack: ["PHP 5.6", "MySQL", "FTP Deploy"],
    roast: "FTP deploy? I too like to live dangerously. Nothing says 'production ready' like accidentally uploading your .env file.",
    burnScore: 94,
  },
];

const topRoasters = [
  { name: "roast_king", score: 12450, roasts: 234 },
  { name: "savage_dev", score: 11200, roasts: 189 },
  { name: "brutal_bob", score: 9800, roasts: 156 },
  { name: "no_mercy", score: 8900, roasts: 142 },
  { name: "stack_slayer", score: 7500, roasts: 98 },
];

export function RoastBentoGrid() {
  return (
    <section className="relative py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Fresh Off the Grill
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Real stacks. Real roasts. Real tears.
          </p>
        </div>

        {/* Bento Grid */}
        <BentoGrid>
          {/* Feature Roast Card */}
          <BentoCard colSpan={2} rowSpan={2} glowOnHover className="p-6">
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Hot Roast
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-orange-500/10 text-orange-400">
                  <span className="text-sm font-mono font-bold">
                    {mockRoasts[0].burnScore}
                  </span>
                  <span className="text-xs">burn</span>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-sm font-medium">
                    DS
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      @{mockRoasts[0].user}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      submitted 2h ago
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {mockRoasts[0].stack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 rounded bg-secondary text-xs font-mono text-muted-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <p className="text-foreground leading-relaxed">
                  "{mockRoasts[0].roast}"
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4">
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  🔥 285 burns
                </button>
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  💬 42 replies
                </button>
              </div>
            </div>
          </BentoCard>

          {/* Top Roasters */}
          <BentoCard colSpan={1} rowSpan={2} className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-foreground">
                Top Roasters
              </span>
            </div>
            <div className="space-y-3">
              {topRoasters.map((roaster, index) => (
                <motion.div
                  key={roaster.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <span
                    className={`text-sm font-mono w-6 ${
                      index === 0
                        ? "text-yellow-400"
                        : index === 1
                        ? "text-zinc-400"
                        : index === 2
                        ? "text-orange-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500/50 to-blue-500/50 flex items-center justify-center text-[10px] font-medium">
                    {roaster.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate">
                      @{roaster.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {roaster.roasts} roasts
                    </div>
                  </div>
                  <div className="text-xs font-mono text-violet-400">
                    {roaster.score.toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </BentoCard>

          {/* Quick Stats */}
          <BentoCard className="p-4 flex flex-col justify-center items-center text-center">
            <Zap className="w-8 h-8 text-yellow-400 mb-2" />
            <div className="text-2xl font-semibold text-foreground">156</div>
            <div className="text-xs text-muted-foreground">Roasts Today</div>
          </BentoCard>

          {/* Active Users */}
          <BentoCard className="p-4 flex flex-col justify-center items-center text-center">
            <Users className="w-8 h-8 text-blue-400 mb-2" />
            <div className="text-2xl font-semibold text-foreground">2.4K</div>
            <div className="text-xs text-muted-foreground">Active Roasters</div>
          </BentoCard>

          {/* Code Stats */}
          <BentoCard className="p-4 flex flex-col justify-center items-center text-center">
            <Code className="w-8 h-8 text-green-400 mb-2" />
            <div className="text-2xl font-semibold text-foreground">47</div>
            <div className="text-xs text-muted-foreground">Stacks per Hour</div>
          </BentoCard>

          {/* Trend Stats */}
          <BentoCard className="p-4 flex flex-col justify-center items-center text-center">
            <TrendingUp className="w-8 h-8 text-violet-400 mb-2" />
            <div className="text-2xl font-semibold text-foreground">+23%</div>
            <div className="text-xs text-muted-foreground">Weekly Growth</div>
          </BentoCard>

          {/* Second Roast */}
          <BentoCard colSpan={2} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xs font-medium flex-shrink-0">
                PM
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">
                    @{mockRoasts[1].user}
                  </span>
                  <span className="text-xs text-muted-foreground">• 5h ago</span>
                  <div className="ml-auto flex items-center gap-1 text-orange-400">
                    <Flame className="w-3 h-3" />
                    <span className="text-xs font-mono">{mockRoasts[1].burnScore}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {mockRoasts[1].stack.map((tech) => (
                    <span
                      key={tech}
                      className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-mono text-muted-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-foreground/80">
                  "{mockRoasts[1].roast}"
                </p>
              </div>
            </div>
          </BentoCard>
        </BentoGrid>
      </div>
    </section>
  );
}
