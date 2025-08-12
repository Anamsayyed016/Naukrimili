const Environment = require('jest-environment-jsdom');

class CustomEnvironment extends Environment {
  constructor(config, context) {
    super(config, context);
    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoder = TextDecoder;
  }

  async setup() {
    await super.setup();
    // Add any additional setup here
  }

  async teardown() {
    // Add any cleanup here
    await super.teardown();
  }
}

module.exports = CustomEnvironment;
