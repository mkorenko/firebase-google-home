const {auth} = require('./src/functions/auth/auth');
const {token} = require('./src/functions/auth/token');
const {smarthome} = require('./src/functions/smarthome/smarthome');
const {reportstate} = require('./src/functions/reportstate');
const {onlinePing} = require('./src/functions/online-ping');

module.exports = {
  auth,
  token,
  smarthome,
  reportstate,
  onlinePing,
};
