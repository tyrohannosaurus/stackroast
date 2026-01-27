-- Migration: Add new stack kit categories
-- Adds use-case specific categories for better organization

-- Drop the existing constraint
ALTER TABLE stack_kits DROP CONSTRAINT IF EXISTS stack_kits_category_check;

-- Add new constraint with expanded categories
ALTER TABLE stack_kits ADD CONSTRAINT stack_kits_category_check 
CHECK (category IN (
  -- Original categories
  'Full Stack Development',
  'Frontend Development',
  'Backend Development',
  'Mobile Development',
  'DevOps & Infrastructure',
  'Data & Analytics',
  'AI & Machine Learning',
  'Design & Prototyping',
  'Testing & QA',
  'Security & Monitoring',
  'Content & Marketing',
  'Productivity & Collaboration',
  'Other',
  -- New use-case specific categories
  'E-commerce Stack',
  'Marketing Stack',
  'Content Creator Stack',
  'Freelancer Stack',
  'Web Hosting',
  'Security Stack',
  'SEO Stack',
  'No-Code Stack'
));

-- Add comment
COMMENT ON CONSTRAINT stack_kits_category_check ON stack_kits IS 
'Categories include both technical and use-case specific options';
