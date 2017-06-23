// 监测host是否符合规则
var config = require('../config/config.js');
module.exports = function (req, res, next) {
    var host = req.headers.host;
    // if (config.adminhost !== host) {
    //     res.status(404);
    //     return res.send('Not Found');
    // }
    next();
}
