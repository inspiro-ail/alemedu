const serverless = require('serverless-http');
const app = require('../../proxy');

module.exports.handler = serverless(app);
