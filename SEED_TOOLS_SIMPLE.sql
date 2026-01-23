-- Comprehensive Tools Database for StackRoast
-- Run this in Supabase SQL Editor to seed tools
-- Safe to run multiple times (uses ON CONFLICT)

-- Frontend Frameworks
INSERT INTO tools (name, slug, logo_url, category, base_price, priority_score, website_url) VALUES
('React', 'react', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', 'Frontend Framework', 0, 100, 'https://react.dev'),
('Vue.js', 'vuejs', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg', 'Frontend Framework', 0, 95, 'https://vuejs.org'),
('Angular', 'angular', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg', 'Frontend Framework', 0, 90, 'https://angular.io'),
('Svelte', 'svelte', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/svelte/svelte-original.svg', 'Frontend Framework', 0, 85, 'https://svelte.dev'),
('Next.js', 'nextjs', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg', 'Frontend Framework', 0, 98, 'https://nextjs.org'),
('Nuxt.js', 'nuxtjs', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nuxtjs/nuxtjs-original.svg', 'Frontend Framework', 0, 88, 'https://nuxt.com'),
('Remix', 'remix', 'https://remix.run/img/logo.svg', 'Frontend Framework', 0, 82, 'https://remix.run'),
('Gatsby', 'gatsby', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gatsby/gatsby-original.svg', 'Frontend Framework', 0, 75, 'https://www.gatsbyjs.com')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, logo_url = EXCLUDED.logo_url, category = EXCLUDED.category, priority_score = EXCLUDED.priority_score, website_url = EXCLUDED.website_url;

-- Backend Frameworks
INSERT INTO tools (name, slug, logo_url, category, base_price, priority_score, website_url) VALUES
('Node.js', 'nodejs', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg', 'Backend Framework', 0, 100, 'https://nodejs.org'),
('Express', 'express', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg', 'Backend Framework', 0, 95, 'https://expressjs.com'),
('Fastify', 'fastify', 'https://www.fastify.io/images/fastify-logo-inverted.png', 'Backend Framework', 0, 85, 'https://www.fastify.io'),
('NestJS', 'nestjs', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nestjs/nestjs-plain.svg', 'Backend Framework', 0, 90, 'https://nestjs.com'),
('Python', 'python', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg', 'Backend Framework', 0, 98, 'https://www.python.org'),
('Django', 'django', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg', 'Backend Framework', 0, 92, 'https://www.djangoproject.com'),
('Flask', 'flask', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg', 'Backend Framework', 0, 88, 'https://flask.palletsprojects.com'),
('FastAPI', 'fastapi', 'https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png', 'Backend Framework', 0, 90, 'https://fastapi.tiangolo.com'),
('Ruby on Rails', 'rails', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rails/rails-original-wordmark.svg', 'Backend Framework', 0, 85, 'https://rubyonrails.org'),
('Laravel', 'laravel', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-plain.svg', 'Backend Framework', 0, 87, 'https://laravel.com'),
('Go', 'go', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg', 'Backend Framework', 0, 93, 'https://go.dev'),
('Rust', 'rust', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg', 'Backend Framework', 0, 88, 'https://www.rust-lang.org'),
('Java', 'java', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg', 'Backend Framework', 0, 90, 'https://www.java.com'),
('Spring Boot', 'spring', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg', 'Backend Framework', 0, 89, 'https://spring.io'),
('.NET', 'dotnet', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dotnetcore/dotnetcore-original.svg', 'Backend Framework', 0, 88, 'https://dotnet.microsoft.com'),
('PHP', 'php', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg', 'Backend Framework', 0, 80, 'https://www.php.net')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, logo_url = EXCLUDED.logo_url, category = EXCLUDED.category, priority_score = EXCLUDED.priority_score, website_url = EXCLUDED.website_url;

-- Databases
INSERT INTO tools (name, slug, logo_url, category, base_price, priority_score, website_url) VALUES
('PostgreSQL', 'postgresql', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg', 'Database', 0, 100, 'https://www.postgresql.org'),
('MySQL', 'mysql', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg', 'Database', 0, 95, 'https://www.mysql.com'),
('MongoDB', 'mongodb', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg', 'Database', 0, 92, 'https://www.mongodb.com'),
('Redis', 'redis', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg', 'Database', 0, 90, 'https://redis.io'),
('SQLite', 'sqlite', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg', 'Database', 0, 85, 'https://www.sqlite.org'),
('Supabase', 'supabase', 'https://supabase.com/favicon.ico', 'Database', 0, 95, 'https://supabase.com'),
('Firebase', 'firebase', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg', 'Database', 0, 88, 'https://firebase.google.com'),
('PlanetScale', 'planetscale', 'https://planetscale.com/favicon.ico', 'Database', 0, 87, 'https://planetscale.com'),
('Neon', 'neon', 'https://neon.tech/favicon.ico', 'Database', 0, 85, 'https://neon.tech')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, logo_url = EXCLUDED.logo_url, category = EXCLUDED.category, priority_score = EXCLUDED.priority_score, website_url = EXCLUDED.website_url;

-- Cloud Platforms & Hosting
INSERT INTO tools (name, slug, logo_url, category, base_price, priority_score, website_url) VALUES
('Vercel', 'vercel', 'https://vercel.com/favicon.ico', 'Hosting', 0, 100, 'https://vercel.com'),
('Netlify', 'netlify', 'https://www.netlify.com/favicon.ico', 'Hosting', 0, 95, 'https://www.netlify.com'),
('AWS', 'aws', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg', 'Cloud Platform', 0, 98, 'https://aws.amazon.com'),
('Google Cloud', 'gcp', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg', 'Cloud Platform', 0, 95, 'https://cloud.google.com'),
('Azure', 'azure', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg', 'Cloud Platform', 0, 92, 'https://azure.microsoft.com'),
('DigitalOcean', 'digitalocean', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/digitalocean/digitalocean-original.svg', 'Cloud Platform', 0, 88, 'https://www.digitalocean.com'),
('Railway', 'railway', 'https://railway.app/favicon.ico', 'Hosting', 0, 90, 'https://railway.app'),
('Render', 'render', 'https://render.com/favicon.ico', 'Hosting', 0, 88, 'https://render.com'),
('Fly.io', 'flyio', 'https://fly.io/favicon.ico', 'Hosting', 0, 85, 'https://fly.io'),
('Cloudflare Pages', 'cloudflare-pages', 'https://www.cloudflare.com/favicon.ico', 'Hosting', 0, 87, 'https://pages.cloudflare.com')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, logo_url = EXCLUDED.logo_url, category = EXCLUDED.category, priority_score = EXCLUDED.priority_score, website_url = EXCLUDED.website_url;

-- Styling & UI Libraries
INSERT INTO tools (name, slug, logo_url, category, base_price, priority_score, website_url) VALUES
('Tailwind CSS', 'tailwindcss', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg', 'Styling', 0, 100, 'https://tailwindcss.com'),
('Bootstrap', 'bootstrap', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg', 'Styling', 0, 90, 'https://getbootstrap.com'),
('Material-UI', 'material-ui', 'https://mui.com/favicon.ico', 'UI Library', 0, 92, 'https://mui.com'),
('Chakra UI', 'chakra-ui', 'https://chakra-ui.com/favicon.ico', 'UI Library', 0, 88, 'https://chakra-ui.com'),
('Ant Design', 'ant-design', 'https://ant.design/favicon.ico', 'UI Library', 0, 87, 'https://ant.design'),
('Shadcn/ui', 'shadcn', 'https://ui.shadcn.com/favicon.ico', 'UI Library', 0, 95, 'https://ui.shadcn.com'),
('Radix UI', 'radix-ui', 'https://www.radix-ui.com/favicon.ico', 'UI Library', 0, 93, 'https://www.radix-ui.com'),
('Headless UI', 'headless-ui', 'https://headlessui.com/favicon.ico', 'UI Library', 0, 85, 'https://headlessui.com'),
('Styled Components', 'styled-components', 'https://styled-components.com/favicon.ico', 'Styling', 0, 88, 'https://styled-components.com'),
('Sass', 'sass', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sass/sass-original.svg', 'Styling', 0, 85, 'https://sass-lang.com')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, logo_url = EXCLUDED.logo_url, category = EXCLUDED.category, priority_score = EXCLUDED.priority_score, website_url = EXCLUDED.website_url;

-- State Management
INSERT INTO tools (name, slug, logo_url, category, base_price, priority_score, website_url) VALUES
('Redux', 'redux', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redux/redux-original.svg', 'State Management', 0, 95, 'https://redux.js.org'),
('Zustand', 'zustand', 'https://github.com/pmndrs/zustand/raw/main/examples/demo/public/favicon.ico', 'State Management', 0, 92, 'https://zustand-demo.pmnd.rs'),
('Jotai', 'jotai', 'https://jotai.org/favicon.ico', 'State Management', 0, 88, 'https://jotai.org'),
('Recoil', 'recoil', 'https://recoiljs.org/favicon.ico', 'State Management', 0, 85, 'https://recoiljs.org'),
('Pinia', 'pinia', 'https://pinia.vuejs.org/favicon.ico', 'State Management', 0, 90, 'https://pinia.vuejs.org')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, logo_url = EXCLUDED.logo_url, category = EXCLUDED.category, priority_score = EXCLUDED.priority_score, website_url = EXCLUDED.website_url;

-- Testing
INSERT INTO tools (name, slug, logo_url, category, base_price, priority_score, website_url) VALUES
('Jest', 'jest', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jest/jest-plain.svg', 'Testing', 0, 95, 'https://jestjs.io'),
('Vitest', 'vitest', 'https://vitest.dev/favicon.ico', 'Testing', 0, 92, 'https://vitest.dev'),
('Cypress', 'cypress', 'https://www.cypress.io/favicon.ico', 'Testing', 0, 90, 'https://www.cypress.io'),
('Playwright', 'playwright', 'https://playwright.dev/favicon.ico', 'Testing', 0, 88, 'https://playwright.dev'),
('Testing Library', 'testing-library', 'https://testing-library.com/favicon.ico', 'Testing', 0, 93, 'https://testing-library.com')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, logo_url = EXCLUDED.logo_url, category = EXCLUDED.category, priority_score = EXCLUDED.priority_score, website_url = EXCLUDED.website_url;

-- Authentication
INSERT INTO tools (name, slug, logo_url, category, base_price, priority_score, website_url) VALUES
('Auth0', 'auth0', 'https://auth0.com/favicon.ico', 'Authentication', 0, 95, 'https://auth0.com'),
('Clerk', 'clerk', 'https://clerk.com/favicon.ico', 'Authentication', 0, 92, 'https://clerk.com'),
('Supabase Auth', 'supabase-auth', 'https://supabase.com/favicon.ico', 'Authentication', 0, 90, 'https://supabase.com'),
('NextAuth.js', 'nextauth', 'https://next-auth.js.org/favicon.ico', 'Authentication', 0, 93, 'https://next-auth.js.org'),
('Firebase Auth', 'firebase-auth', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg', 'Authentication', 0, 88, 'https://firebase.google.com')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, logo_url = EXCLUDED.logo_url, category = EXCLUDED.category, priority_score = EXCLUDED.priority_score, website_url = EXCLUDED.website_url;

-- Development Tools
INSERT INTO tools (name, slug, logo_url, category, base_price, priority_score, website_url) VALUES
('TypeScript', 'typescript', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg', 'Language', 0, 100, 'https://www.typescriptlang.org'),
('JavaScript', 'javascript', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg', 'Language', 0, 98, 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'),
('Git', 'git', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg', 'Version Control', 0, 100, 'https://git-scm.com'),
('GitHub', 'github', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg', 'Version Control', 0, 98, 'https://github.com'),
('GitLab', 'gitlab', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/gitlab/gitlab-original.svg', 'Version Control', 0, 92, 'https://gitlab.com'),
('VS Code', 'vscode', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg', 'Editor', 0, 95, 'https://code.visualstudio.com'),
('Docker', 'docker', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg', 'DevOps', 0, 98, 'https://www.docker.com'),
('Kubernetes', 'kubernetes', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg', 'DevOps', 0, 92, 'https://kubernetes.io')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, logo_url = EXCLUDED.logo_url, category = EXCLUDED.category, priority_score = EXCLUDED.priority_score, website_url = EXCLUDED.website_url;

-- Popular Tools
INSERT INTO tools (name, slug, logo_url, category, base_price, priority_score, website_url) VALUES
('Linear', 'linear', 'https://linear.app/favicon.ico', 'Project Management', 8, 95, 'https://linear.app'),
('Jira', 'jira', 'https://www.atlassian.com/favicon.ico', 'Project Management', 7, 90, 'https://www.atlassian.com/software/jira'),
('Notion', 'notion', 'https://www.notion.so/favicon.ico', 'Productivity', 8, 92, 'https://www.notion.so'),
('Figma', 'figma', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg', 'Design', 12, 98, 'https://www.figma.com'),
('Slack', 'slack', 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg', 'Communication', 7, 95, 'https://slack.com'),
('Stripe', 'stripe', 'https://stripe.com/favicon.ico', 'Payment', 0, 98, 'https://stripe.com'),
('Sentry', 'sentry', 'https://sentry.io/favicon.ico', 'Monitoring', 0, 95, 'https://sentry.io'),
('Vercel Analytics', 'vercel-analytics', 'https://vercel.com/favicon.ico', 'Analytics', 0, 90, 'https://vercel.com/analytics')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, logo_url = EXCLUDED.logo_url, category = EXCLUDED.category, priority_score = EXCLUDED.priority_score, website_url = EXCLUDED.website_url;

-- Verify insertion
SELECT 
  COUNT(*) as total_tools, 
  category, 
  COUNT(*) as count 
FROM tools 
GROUP BY category 
ORDER BY count DESC;
