/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(dt-sql-parser)/)'
    ],
    moduleNameMapper: {
        '^dt-sql-parser$': '<rootDir>/node_modules/dt-sql-parser/dist/index.js'
    }
}; 