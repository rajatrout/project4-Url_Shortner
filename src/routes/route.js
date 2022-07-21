const express = require('express');

const router = express.Router();

const { shortnerUrl, getUrl } = require('../controller/urlController');

router.post('/url/shorten', shortnerUrl)

router.get('/:urlCode', getUrl)


router.all("/**", function (req, res) {
    res.status(404).send({
        status: false,
        msg: "The api you request is not available"
    })
});

module.exports = router;