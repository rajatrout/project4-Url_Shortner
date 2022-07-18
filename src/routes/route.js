const express = require('express');

const router = express.Router();

const {shortnerUrl} = require('../controller/urlController');

router.post('/url/shorten',shortnerUrl)

module.exports = router;