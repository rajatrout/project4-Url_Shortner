const express = require('express');

const router = express.Router();

const { shortnerUrl, getUrl } = require('../controller/urlController');

router.post('/url/shorten', shortnerUrl)

router.get('/:urlCode', getUrl)

module.exports = router;