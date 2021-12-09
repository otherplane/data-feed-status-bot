require('dotenv').config({ path: './test.env' })
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true
}
