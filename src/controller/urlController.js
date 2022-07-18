const urlModel = require('../models/urlModel');
const shortId = require('shortid');
const validUrl = require('validator');



function isValid(value) {  //function to validated string
    if (typeof value !== 'string' || value.trim().length == 0) return true
    if (value == undefined || value == null) return true
    return false
}

exports.shortnerUrl = async(req, res) => {
    try {
        let data = req.body;
        //valid data
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Invalid Url please provide valid details" })
        }

        //valid url data
        if (isValid(data.longUrl)) {
            return res.status(400).send({ status: false, message: "Please provide long URL" })
        }
        
        // checking if same link is stored in db and sending back data
        let longUrl = await urlModel.findOne({ longUrl: data.longUrl }).select({ _id: 0, __v: 0, createdAt: 0, updatedAt: 0 })
        if (longUrl) {
            return res.status(200).send({ status: false, data: longUrl })
        }

        //checking for valid url
        if (!validUrl.isURL(data.longUrl)) {
            return res.status(400).send({ status: false, message: "Please provide valid URL" })
        }
        // generating URL code
        let urlCode = shortId.generate().toLowerCase();

        //creating short URL

        const shortUrl = `http://localhost:3000/${urlCode}`;

        data.urlCode = urlCode;
        data.shortUrl = shortUrl;

        //creating document or short url
        await urlModel.create(data);
        let responseData = await urlModel.findOne({ urlCode: urlCode }).select({ _id: 0, __v: 0, createdAt: 0, updatedAt: 0 })

        return res.status(201).send({ status: true, data: responseData })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

exports.getUrl = async(req, res) => {
    try {
        const urlCode = req.params.urlCode

        if (!shortId.isValid(urlCode)) {
            return res.status(400).send({ status: false, message: "URL Code is not valid." })
        }

        const checkUrl = await urlModel.findOne({ urlCode: urlCode })

        if (!checkUrl) {
            return res.status(404).send({ status: false, message: "URL not found." })
        }

        return res.status(302).redirect(checkUrl.longUrl)

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}