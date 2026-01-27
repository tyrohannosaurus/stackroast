#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const tools = JSON.parse(readFileSync('tools-export.json', 'utf8'));

// Group by category
const byCategory = {};
tools.forEach(tool => {
  const cat = tool.category || 'Uncategorized';
  if (!byCategory[cat]) byCategory[cat] = [];
  byCategory[cat].push(tool);
});

// Sort categories
const categories = Object.keys(byCategory).sort();

let md = '# StackRoast Tools Database\n\n';
md += `**Total Tools:** ${tools.length}\n\n`;
md += `**Last Updated:** ${new Date().toLocaleDateString()}\n\n`;
md += '---\n\n';

// Table of contents
md += '## Table of Contents\n\n';
categories.forEach(cat => {
  const count = byCategory[cat].length;
  const anchor = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  md += `- [${cat}](#${anchor}) (${count} tools)\n`;
});
md += '\n---\n\n';

// Tools by category
categories.forEach(category => {
  const categoryTools = byCategory[category].sort((a, b) => a.name.localeCompare(b.name));
  const anchor = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  md += `## ${category}\n\n`;
  md += `**Count:** ${categoryTools.length} tools\n\n`;
  
  categoryTools.forEach((tool, index) => {
    md += `### ${index + 1}. ${tool.name}\n\n`;
    md += `- **ID:** ${tool.id}\n`;
    md += `- **Slug:** \`${tool.slug}\`\n`;
    if (tool.description) {
      md += `- **Description:** ${tool.description}\n`;
    }
    if (tool.website_url) {
      md += `- **Website:** [${tool.website_url}](${tool.website_url})\n`;
    }
    if (tool.logo_url) {
      md += `- **Logo:** [${tool.logo_url}](${tool.logo_url})\n`;
    }
    if (tool.base_price !== null && tool.base_price !== undefined) {
      md += `- **Base Price:** $${tool.base_price}/month\n`;
    }
    if (tool.priority_score !== null && tool.priority_score !== undefined) {
      md += `- **Priority Score:** ${tool.priority_score}\n`;
    }
    md += `- **Status:** ${tool.status || 'approved'}\n`;
    if (tool.created_at) {
      const date = new Date(tool.created_at);
      md += `- **Created:** ${date.toLocaleDateString()}\n`;
    }
    md += '\n';
  });
  
  md += '---\n\n';
});

// Summary
md += '## Summary Statistics\n\n';
md += `- **Total Tools:** ${tools.length}\n`;
md += `- **Categories:** ${categories.length}\n`;
md += `- **All Tools Status:** approved\n\n`;

md += '### Tools by Category\n\n';
md += '| Category | Count |\n';
md += '|----------|-------|\n';
categories.forEach(cat => {
  md += `| ${cat} | ${byCategory[cat].length} |\n`;
});

writeFileSync('TOOLS_DATABASE.md', md);
console.log(`✅ Created TOOLS_DATABASE.md with ${tools.length} tools`);
