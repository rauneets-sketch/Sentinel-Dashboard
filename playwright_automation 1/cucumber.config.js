module.exports = {
  default: {
    require: [
      'src/main/hooks/hooks.js',
      'src/test/stepdefinitions/**/*.js'
    ],
    format: [
      'progress',
      'json:reports/cucumber-report.json',
      'html:reports/cucumber-report.html'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    // Allure reporter will be handled via hooks.js screenshot attachment
    publishQuiet: true
  }
};