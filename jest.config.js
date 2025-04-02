module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/src/**/__tests__/**/*.js',
    '**/src/**/*.test.js'
  ],

  // An array of file extensions your modules use
  moduleFileExtensions: ['js', 'mjs'],

  // Transform configuration for handling ES modules
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.config.js' }]
  },

  // A map of regular expressions to module names or to arrays of module names
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'src/js/**/*.js',
    '!src/js/**/*.test.js',
    '!src/js/**/__tests__/**'
  ],

  // The paths to modules that run some code to configure or set up the testing environment
  setupFiles: ['<rootDir>/jest.setup.js'],

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!gl-matrix).+\\.js$'
  ],

  // Add root directory to module resolution
  rootDir: '.',

  // Add test environment options
  testEnvironmentOptions: {
    url: 'http://localhost'
  },

  // Add module resolution settings
  moduleDirectories: ['node_modules', 'src'],

  // Add test timeout
  testTimeout: 10000
}; 