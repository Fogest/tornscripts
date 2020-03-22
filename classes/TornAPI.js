class TornAPI {
  static USERDATAKEY = 'TornAPI_userData';

  constructor(key, storage) {
    this.baseUrl = 'https://api.torn.com'
    this.key = key;
    this.userData = {};
    this.storage = storage;
  }

  getCachedUserData() {
    if (this.storage) {
      return this.storage.get(TornAPI.USERDATAKEY);
    }
  }

  async setupUserData() {
    const userData = this.getCachedUserData();
    if (userData) {
      this.userData = userData;
    } else {
      let data = await this.user();
      if (data) {
        this.userData = data

        // Save the data to avoid calling the api again in the future
        if (this.storage) this.storage.set(tornAPI.USERDATAKEY, data);
      }
    }
  }

  async faction(selections = '') {
    const targetUrl = `${this.baseUrl}/faction/?selections=${selections}&key=${this.key}`;
    return new Promise((resolve, reject) => {
      $.get(targetUrl, (data) => {
        if (data.error) reject(`Torn Faction Bank Script: Error Code: ${data.code} - ${data.error}`);
        resolve(data);
      });
    });
  }

  async user(selections = '') {
    const targetUrl = `${this.baseUrl}/user/?selections=${selections ? selections : ''}&key=${this.key}`;
    return new Promise((resolve) => {
      $.get(targetUrl, (data) => {
        if (data.error) reject(`Torn Faction Bank Script: ${data.code} - ${data.error}`);
        resolve(data);
      });
    });
  }
}