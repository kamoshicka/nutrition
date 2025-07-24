/**
 * This script can be used to check for accessibility issues in the codebase.
 * It uses the axe-core library to scan for common accessibility issues.
 * 
 * Usage:
 * 1. Start the development server: npm run dev
 * 2. Run this script: node scripts/check-accessibility.js
 */

const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');

async function checkAccessibility() {
  console.log('Starting accessibility check...');
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // List of pages to check
  const pagesToCheck = [
    'http://localhost:3000',
    'http://localhost:3000/categories/1',
    'http://localhost:3000/foods/1',
    'http://localhost:3000/search?q=test'
  ];
  
  for (const url of pagesToCheck) {
    console.log(`\nChecking ${url}`);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle0' });
      
      // Run axe accessibility scan
      const results = await new AxePuppeteer(page).analyze();
      
      // Log results
      console.log(`Page: ${url}`);
      console.log(`Violations: ${results.violations.length}`);
      
      if (results.violations.length > 0) {
        console.log('\nAccessibility issues found:');
        results.violations.forEach((violation) => {
          console.log(`\n- Rule: ${violation.id} (${violation.impact} impact)`);
          console.log(`  Description: ${violation.description}`);
          console.log(`  Help: ${violation.help}`);
          console.log(`  Elements affected: ${violation.nodes.length}`);
        });
      } else {
        console.log('No accessibility issues found!');
      }
    } catch (error) {
      console.error(`Error checking ${url}:`, error.message);
    }
  }
  
  await browser.close();
  console.log('\nAccessibility check completed.');
}

checkAccessibility().catch(console.error);