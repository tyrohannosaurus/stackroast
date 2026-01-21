// GitHub Repository Parser
// Extracts tech stack information from common dependency files

interface ParsedDependency {
  name: string;
  version?: string;
  category: string;
}

interface ParsedStack {
  name: string;
  dependencies: ParsedDependency[];
  devDependencies: ParsedDependency[];
  languages: string[];
  frameworks: string[];
}

// Common framework/tool mappings
const TOOL_MAPPINGS: Record<string, { name: string; category: string }> = {
  // JavaScript/TypeScript Frameworks
  'react': { name: 'React', category: 'Frontend' },
  'react-dom': { name: 'React', category: 'Frontend' },
  'next': { name: 'Next.js', category: 'Framework' },
  'vue': { name: 'Vue.js', category: 'Frontend' },
  'nuxt': { name: 'Nuxt', category: 'Framework' },
  'svelte': { name: 'Svelte', category: 'Frontend' },
  'angular': { name: 'Angular', category: 'Frontend' },
  '@angular/core': { name: 'Angular', category: 'Frontend' },
  
  // Backend
  'express': { name: 'Express.js', category: 'Backend' },
  'fastify': { name: 'Fastify', category: 'Backend' },
  'koa': { name: 'Koa', category: 'Backend' },
  'hono': { name: 'Hono', category: 'Backend' },
  'nestjs': { name: 'NestJS', category: 'Backend' },
  '@nestjs/core': { name: 'NestJS', category: 'Backend' },
  
  // Databases
  'mongoose': { name: 'MongoDB', category: 'Database' },
  'mongodb': { name: 'MongoDB', category: 'Database' },
  'pg': { name: 'PostgreSQL', category: 'Database' },
  'mysql': { name: 'MySQL', category: 'Database' },
  'mysql2': { name: 'MySQL', category: 'Database' },
  'prisma': { name: 'Prisma', category: 'Database' },
  '@prisma/client': { name: 'Prisma', category: 'Database' },
  'drizzle-orm': { name: 'Drizzle', category: 'Database' },
  'typeorm': { name: 'TypeORM', category: 'Database' },
  'sequelize': { name: 'Sequelize', category: 'Database' },
  '@supabase/supabase-js': { name: 'Supabase', category: 'Backend' },
  'firebase': { name: 'Firebase', category: 'Backend' },
  
  // UI Libraries
  'tailwindcss': { name: 'Tailwind CSS', category: 'Styling' },
  '@chakra-ui/react': { name: 'Chakra UI', category: 'UI Library' },
  '@mui/material': { name: 'Material UI', category: 'UI Library' },
  'antd': { name: 'Ant Design', category: 'UI Library' },
  'shadcn-ui': { name: 'shadcn/ui', category: 'UI Library' },
  '@radix-ui/react-dialog': { name: 'Radix UI', category: 'UI Library' },
  
  // State Management
  'redux': { name: 'Redux', category: 'State Management' },
  '@reduxjs/toolkit': { name: 'Redux Toolkit', category: 'State Management' },
  'zustand': { name: 'Zustand', category: 'State Management' },
  'jotai': { name: 'Jotai', category: 'State Management' },
  'recoil': { name: 'Recoil', category: 'State Management' },
  '@tanstack/react-query': { name: 'TanStack Query', category: 'Data Fetching' },
  'swr': { name: 'SWR', category: 'Data Fetching' },
  
  // Auth
  'next-auth': { name: 'NextAuth.js', category: 'Auth' },
  '@auth/core': { name: 'Auth.js', category: 'Auth' },
  'passport': { name: 'Passport.js', category: 'Auth' },
  '@clerk/nextjs': { name: 'Clerk', category: 'Auth' },
  
  // Testing
  'jest': { name: 'Jest', category: 'Testing' },
  'vitest': { name: 'Vitest', category: 'Testing' },
  '@testing-library/react': { name: 'Testing Library', category: 'Testing' },
  'cypress': { name: 'Cypress', category: 'Testing' },
  'playwright': { name: 'Playwright', category: 'Testing' },
  
  // Build Tools
  'vite': { name: 'Vite', category: 'Build Tool' },
  'webpack': { name: 'Webpack', category: 'Build Tool' },
  'esbuild': { name: 'esbuild', category: 'Build Tool' },
  'turbo': { name: 'Turborepo', category: 'Build Tool' },
  
  // Python
  'django': { name: 'Django', category: 'Framework' },
  'flask': { name: 'Flask', category: 'Framework' },
  'fastapi': { name: 'FastAPI', category: 'Framework' },
  'sqlalchemy': { name: 'SQLAlchemy', category: 'Database' },
  'pandas': { name: 'Pandas', category: 'Data Science' },
  'numpy': { name: 'NumPy', category: 'Data Science' },
  'tensorflow': { name: 'TensorFlow', category: 'ML/AI' },
  'pytorch': { name: 'PyTorch', category: 'ML/AI' },
  'torch': { name: 'PyTorch', category: 'ML/AI' },
  'scikit-learn': { name: 'scikit-learn', category: 'ML/AI' },
  'openai': { name: 'OpenAI', category: 'ML/AI' },
  'langchain': { name: 'LangChain', category: 'ML/AI' },
  
  // Hosting/Deployment
  'vercel': { name: 'Vercel', category: 'Hosting' },
  '@vercel/analytics': { name: 'Vercel', category: 'Hosting' },
  'netlify-cli': { name: 'Netlify', category: 'Hosting' },
};

// Python package mappings
const PYTHON_MAPPINGS: Record<string, { name: string; category: string }> = {
  'django': { name: 'Django', category: 'Framework' },
  'flask': { name: 'Flask', category: 'Framework' },
  'fastapi': { name: 'FastAPI', category: 'Framework' },
  'sqlalchemy': { name: 'SQLAlchemy', category: 'Database' },
  'psycopg2': { name: 'PostgreSQL', category: 'Database' },
  'psycopg2-binary': { name: 'PostgreSQL', category: 'Database' },
  'pymongo': { name: 'MongoDB', category: 'Database' },
  'redis': { name: 'Redis', category: 'Database' },
  'celery': { name: 'Celery', category: 'Task Queue' },
  'pandas': { name: 'Pandas', category: 'Data Science' },
  'numpy': { name: 'NumPy', category: 'Data Science' },
  'scipy': { name: 'SciPy', category: 'Data Science' },
  'matplotlib': { name: 'Matplotlib', category: 'Data Science' },
  'tensorflow': { name: 'TensorFlow', category: 'ML/AI' },
  'torch': { name: 'PyTorch', category: 'ML/AI' },
  'scikit-learn': { name: 'scikit-learn', category: 'ML/AI' },
  'transformers': { name: 'Hugging Face', category: 'ML/AI' },
  'openai': { name: 'OpenAI', category: 'ML/AI' },
  'langchain': { name: 'LangChain', category: 'ML/AI' },
  'pytest': { name: 'pytest', category: 'Testing' },
  'requests': { name: 'Requests', category: 'HTTP' },
  'httpx': { name: 'HTTPX', category: 'HTTP' },
  'pydantic': { name: 'Pydantic', category: 'Validation' },
  'boto3': { name: 'AWS SDK', category: 'Cloud' },
  'google-cloud-storage': { name: 'Google Cloud', category: 'Cloud' },
};

export function parsePackageJson(content: string): ParsedDependency[] {
  try {
    const pkg = JSON.parse(content);
    const allDeps: ParsedDependency[] = [];
    const seen = new Set<string>();

    const processDeps = (deps: Record<string, string> | undefined) => {
      if (!deps) return;
      
      for (const [name, version] of Object.entries(deps)) {
        const mapping = TOOL_MAPPINGS[name.toLowerCase()];
        if (mapping && !seen.has(mapping.name)) {
          seen.add(mapping.name);
          allDeps.push({
            name: mapping.name,
            version: version.replace(/[\^~]/g, ''),
            category: mapping.category,
          });
        }
      }
    };

    processDeps(pkg.dependencies);
    processDeps(pkg.devDependencies);

    return allDeps;
  } catch (error) {
    console.error('Error parsing package.json:', error);
    return [];
  }
}

export function parseRequirementsTxt(content: string): ParsedDependency[] {
  const lines = content.split('\n');
  const deps: ParsedDependency[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Parse format: package==version or package>=version or just package
    const match = trimmed.match(/^([a-zA-Z0-9_-]+)(?:[=<>!]+(.+))?$/);
    if (match) {
      const [, pkgName, version] = match;
      const mapping = PYTHON_MAPPINGS[pkgName.toLowerCase()];
      
      if (mapping && !seen.has(mapping.name)) {
        seen.add(mapping.name);
        deps.push({
          name: mapping.name,
          version,
          category: mapping.category,
        });
      }
    }
  }

  return deps;
}

export function parsePyprojectToml(content: string): ParsedDependency[] {
  // Simple TOML parsing for dependencies
  const deps: ParsedDependency[] = [];
  const seen = new Set<string>();
  
  // Match dependencies = [...] section
  const depsMatch = content.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
  if (depsMatch) {
    const depsStr = depsMatch[1];
    const pkgMatches = depsStr.matchAll(/"([a-zA-Z0-9_-]+)(?:[=<>!]+[^"]+)?"/g);
    
    for (const match of pkgMatches) {
      const pkgName = match[1];
      const mapping = PYTHON_MAPPINGS[pkgName.toLowerCase()];
      
      if (mapping && !seen.has(mapping.name)) {
        seen.add(mapping.name);
        deps.push({
          name: mapping.name,
          category: mapping.category,
        });
      }
    }
  }

  return deps;
}

export function parseGemfile(content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];
  const lines = content.split('\n');

  const RUBY_MAPPINGS: Record<string, { name: string; category: string }> = {
    'rails': { name: 'Ruby on Rails', category: 'Framework' },
    'sinatra': { name: 'Sinatra', category: 'Framework' },
    'pg': { name: 'PostgreSQL', category: 'Database' },
    'mysql2': { name: 'MySQL', category: 'Database' },
    'redis': { name: 'Redis', category: 'Database' },
    'sidekiq': { name: 'Sidekiq', category: 'Background Jobs' },
    'rspec': { name: 'RSpec', category: 'Testing' },
    'devise': { name: 'Devise', category: 'Auth' },
  };

  const seen = new Set<string>();

  for (const line of lines) {
    const match = line.match(/gem\s+['"]([a-zA-Z0-9_-]+)['"]/);
    if (match) {
      const gemName = match[1];
      const mapping = RUBY_MAPPINGS[gemName.toLowerCase()];
      
      if (mapping && !seen.has(mapping.name)) {
        seen.add(mapping.name);
        deps.push({
          name: mapping.name,
          category: mapping.category,
        });
      }
    }
  }

  return deps;
}

export function parseGoMod(content: string): ParsedDependency[] {
  const deps: ParsedDependency[] = [];
  const seen = new Set<string>();

  const GO_MAPPINGS: Record<string, { name: string; category: string }> = {
    'gin-gonic/gin': { name: 'Gin', category: 'Framework' },
    'gorilla/mux': { name: 'Gorilla Mux', category: 'Router' },
    'labstack/echo': { name: 'Echo', category: 'Framework' },
    'go-gorm/gorm': { name: 'GORM', category: 'ORM' },
    'jackc/pgx': { name: 'PostgreSQL', category: 'Database' },
    'go-redis/redis': { name: 'Redis', category: 'Database' },
    'stretchr/testify': { name: 'Testify', category: 'Testing' },
  };

  const requireMatch = content.match(/require\s*\(([\s\S]*?)\)/);
  if (requireMatch) {
    const requires = requireMatch[1];
    
    for (const [pattern, mapping] of Object.entries(GO_MAPPINGS)) {
      if (requires.includes(pattern) && !seen.has(mapping.name)) {
        seen.add(mapping.name);
        deps.push({
          name: mapping.name,
          category: mapping.category,
        });
      }
    }
  }

  return deps;
}

export async function fetchGitHubRepo(repoUrl: string): Promise<{ files: Record<string, string>; repoName: string } | null> {
  // Extract owner/repo from URL
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub URL');
  }

  const [, owner, repo] = match;
  const repoName = repo.replace(/\.git$/, '');

  const filesToFetch = [
    'package.json',
    'requirements.txt',
    'pyproject.toml',
    'Gemfile',
    'go.mod',
    'Cargo.toml',
  ];

  const files: Record<string, string> = {};

  for (const file of filesToFetch) {
    try {
      const response = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repoName}/main/${file}`
      );
      
      if (response.ok) {
        files[file] = await response.text();
      }
    } catch (error) {
      // File doesn't exist, continue
    }

    // Also try master branch
    if (!files[file]) {
      try {
        const response = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repoName}/master/${file}`
        );
        
        if (response.ok) {
          files[file] = await response.text();
        }
      } catch (error) {
        // File doesn't exist
      }
    }
  }

  return { files, repoName };
}

export function parseRepoFiles(files: Record<string, string>): ParsedDependency[] {
  const allDeps: ParsedDependency[] = [];
  const seen = new Set<string>();

  if (files['package.json']) {
    const deps = parsePackageJson(files['package.json']);
    for (const dep of deps) {
      if (!seen.has(dep.name)) {
        seen.add(dep.name);
        allDeps.push(dep);
      }
    }
  }

  if (files['requirements.txt']) {
    const deps = parseRequirementsTxt(files['requirements.txt']);
    for (const dep of deps) {
      if (!seen.has(dep.name)) {
        seen.add(dep.name);
        allDeps.push(dep);
      }
    }
  }

  if (files['pyproject.toml']) {
    const deps = parsePyprojectToml(files['pyproject.toml']);
    for (const dep of deps) {
      if (!seen.has(dep.name)) {
        seen.add(dep.name);
        allDeps.push(dep);
      }
    }
  }

  if (files['Gemfile']) {
    const deps = parseGemfile(files['Gemfile']);
    for (const dep of deps) {
      if (!seen.has(dep.name)) {
        seen.add(dep.name);
        allDeps.push(dep);
      }
    }
  }

  if (files['go.mod']) {
    const deps = parseGoMod(files['go.mod']);
    for (const dep of deps) {
      if (!seen.has(dep.name)) {
        seen.add(dep.name);
        allDeps.push(dep);
      }
    }
  }

  return allDeps;
}
