'use strict';

const https = require('https');
const qs = require('qs');
const axios = require('axios');

class SplunkApi {
  constructor(usr, pwd, host, port) {
    this.usr = usr;
    this.pwd = pwd;
    host = host || 'localhost';
    port = port || 8089;
    this.axios = axios.create({
      baseURL: `https://${host}:${port}/services`,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
  }

  async request(fun, data) {
    fun = fun || {
      method: 'get',
      url: '/search/scheduler',
    };
    console.log(data);
    data = data || {};
    data['output_mode'] = 'json';
    const config = {
      method: fun.method,
      url: fun.url,
      auth: {
        username: this.usr,
        password: this.pwd,
      },
    };
    if (fun.method == 'get') {
      config.params = data;
    } else {
      config.data = qs.stringify(data);
    }
    const response = await this.axios(config);
    return response.data;
  }

  async search(search, timerange) {
    search = search || '';
    search = `search ${search}`;
    const fun = {
      method: 'post',
      url: '/search/jobs/export',
    };
    const data = {
      search,
      earliest_time: timerange[0] || '',
      latest_time: timerange[1] || '',
    };
    console.log(data);
    const result = await this.request(fun, data);
    const rows = result.trim().split('\n');
    rows.splice(-1, 1);
    const records = rows.map((row) => {
      const record = JSON.parse(row);
      record.result._raw = JSON.parse(record.result._raw);
      return record;
    });
    return records;
  }
}

module.exports = SplunkApi;
