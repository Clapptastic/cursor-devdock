/**
 * Tests for updateCoverageBadge.js utility
 */

const {
  getCoverageColor,
  generateBadgeMarkdown
} = require('../../../scripts/updateCoverageBadge');

// Mock path and fs modules
jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/')),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue(''),
  writeFileSync: jest.fn(),
}));

describe('Update Coverage Badge Utility', () => {
  
  describe('getCoverageColor', () => {
    test('should return brightgreen for coverage >= 80%', () => {
      expect(getCoverageColor(80)).toBe('brightgreen');
      expect(getCoverageColor(90)).toBe('brightgreen');
      expect(getCoverageColor(100)).toBe('brightgreen');
    });
    
    test('should return yellow for coverage between 65% and 79%', () => {
      expect(getCoverageColor(65)).toBe('yellow');
      expect(getCoverageColor(70)).toBe('yellow');
      expect(getCoverageColor(79)).toBe('yellow');
    });
    
    test('should return red for coverage < 65%', () => {
      expect(getCoverageColor(64)).toBe('red');
      expect(getCoverageColor(50)).toBe('red');
      expect(getCoverageColor(0)).toBe('red');
    });
  });
  
  describe('generateBadgeMarkdown', () => {
    test('should generate correct badge markdown for different percentages', () => {
      const highCoverageBadge = generateBadgeMarkdown(90);
      const mediumCoverageBadge = generateBadgeMarkdown(70);
      const lowCoverageBadge = generateBadgeMarkdown(30);
      
      expect(highCoverageBadge).toContain('coverage-90%25-brightgreen');
      expect(mediumCoverageBadge).toContain('coverage-70%25-yellow');
      expect(lowCoverageBadge).toContain('coverage-30%25-red');
    });
    
    test('should include proper shields.io URL and path to coverage', () => {
      const badge = generateBadgeMarkdown(85);
      
      expect(badge).toMatch(/^\[!\[Coverage\]\(https:\/\/img\.shields\.io\/badge\/coverage-85%25-brightgreen\)\]\(.*\)$/);
      expect(badge).toContain('coverage/index.html');
    });
  });
}); 