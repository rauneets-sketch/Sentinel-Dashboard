const { BaseApiClient } = require('./BaseApiClient');

class UserApiClient extends BaseApiClient {
  async getUsers(endpoint) {
    return await this.get(endpoint);
  }

  async createUser(endpoint, userData) {
    return await this.post(endpoint, userData);
  }
}

module.exports = { UserApiClient };
