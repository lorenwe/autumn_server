var express = require('express');
var router = express.Router();

var ArticleController = require('../controller/article.controller');

router.get('/', ArticleController.index);
router.get('/page/:page', ArticleController.index);

module.exports = router;