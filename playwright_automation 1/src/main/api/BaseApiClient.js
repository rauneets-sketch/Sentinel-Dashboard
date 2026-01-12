const axios = require('axios');

class BaseApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.example.com',
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async get(endpoint) {
    return await this.client.get(endpoint);
  }

  async post(endpoint, data) {
    return await this.client.post(endpoint, data);
  }
}

module.exports = { BaseApiClient };
