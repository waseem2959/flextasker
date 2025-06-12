#!/usr/bin/env node

/**
 * Test Performance Monitor
 * 
 * Monitors test execution time and provides performance insights
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestPerformanceMonitor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      totalTime: 0,
      suites: [],
      slowTests: [],
      recommendations: []
    };
  }

  async runTests() {
    console.log('🚀 Starting test performance analysis...\n');
    
    const startTime = Date.now();
    
    try {
      // Run tests with verbose output to capture timing
      const output = execSync('npm run test:ci -- --verbose', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const endTime = Date.now();
      this.results.totalTime = endTime - startTime;
      
      this.parseTestOutput(output);
      this.analyzePerformance();
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    }
  }

  parseTestOutput(output) {
    const lines = output.split('\n');
    let currentSuite = null;
    
    lines.forEach(line => {
      // Parse test suite information
      if (line.includes('PASS') && line.includes('.test.')) {
        const match = line.match(/PASS\s+(.+\.test\.[jt]sx?)\s+\((\d+\.?\d*)\s*s\)/);
        if (match) {
          const [, suiteName, duration] = match;
          const suite = {
            name: suiteName.split('/').pop(),
            duration: parseFloat(duration),
            path: suiteName
          };
          this.results.suites.push(suite);
          
          // Flag slow tests (>2 seconds)
          if (suite.duration > 2) {
            this.results.slowTests.push(suite);
          }
        }
      }
      
      // Count total tests
      if (line.includes('Tests:') && line.includes('passed')) {
        const match = line.match(/(\d+)\s+passed/);
        if (match) {
          this.results.totalTests = parseInt(match[1]);
        }
      }
    });
  }

  analyzePerformance() {
    const avgTestTime = this.results.totalTime / this.results.totalTests;
    
    // Generate recommendations
    if (this.results.totalTime > 30000) { // > 30 seconds
      this.results.recommendations.push({
        type: 'warning',
        message: 'Total test execution time is high. Consider parallelization or test optimization.'
      });
    }
    
    if (this.results.slowTests.length > 0) {
      this.results.recommendations.push({
        type: 'info',
        message: `${this.results.slowTests.length} test suite(s) are running slowly. Consider optimization.`
      });
    }
    
    if (avgTestTime > 200) { // > 200ms per test
      this.results.recommendations.push({
        type: 'warning',
        message: 'Average test execution time is high. Review test complexity and mocking strategies.'
      });
    } else {
      this.results.recommendations.push({
        type: 'success',
        message: 'Test execution performance is good!'
      });
    }
  }

  generateReport() {
    console.log('📊 Test Performance Report');
    console.log('=' .repeat(50));
    console.log(`📅 Timestamp: ${this.results.timestamp}`);
    console.log(`⏱️  Total Time: ${(this.results.totalTime / 1000).toFixed(2)}s`);
    console.log(`🧪 Total Tests: ${this.results.totalTests}`);
    console.log(`📈 Avg Time/Test: ${(this.results.totalTime / this.results.totalTests).toFixed(2)}ms`);
    console.log(`📦 Test Suites: ${this.results.suites.length}`);
    
    if (this.results.slowTests.length > 0) {
      console.log('\n🐌 Slow Test Suites (>2s):');
      this.results.slowTests.forEach(suite => {
        console.log(`   • ${suite.name}: ${suite.duration}s`);
      });
    }
    
    console.log('\n💡 Recommendations:');
    this.results.recommendations.forEach(rec => {
      const icon = rec.type === 'success' ? '✅' : rec.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`   ${icon} ${rec.message}`);
    });
    
    // Save detailed report
    this.saveDetailedReport();
    
    console.log('\n📄 Detailed report saved to: test-performance-report.json');
  }

  saveDetailedReport() {
    const reportPath = path.join(process.cwd(), 'test-performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
  }
}

// Run the performance monitor
if (require.main === module) {
  const monitor = new TestPerformanceMonitor();
  monitor.runTests().catch(console.error);
}

module.exports = TestPerformanceMonitor;
