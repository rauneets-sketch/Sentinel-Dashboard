const fs = require('fs');
const yaml = require('yaml');
const path = require('path');

class ConfigManager {
  constructor() {
    const env = process.env.ENV || 'dev';
    this.loadConfig(env);
  }

  static getInstance() {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  loadConfig(environment) {
    const configPath = path.join(process.cwd(), 'config', `${environment}.yaml`);
    const configFile = fs.readFileSync(configPath, 'utf8');
    this.config = yaml.parse(configFile);
  }

  getConfig() { return this.config; }
  getBaseUrl() { return this.config.baseUrl; }
  getApiBaseUrl() { return this.config.api.baseUrl; }
}

module.exports = { ConfigManager };
