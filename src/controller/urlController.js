const urlModel = require('../models/urlModel');
const shortId = require('shortid');
const validUrl = require('validator');

const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
    17535,
    "redis-17535.c264.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("zOaJpMGeeXAlu1UmZl6AztswtECrzRpI", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});


function isValid(value) {  //function to validate string
    if (typeof value !== 'string' || value.trim().length == 0) return true
    if (value == undefined || value == null) return true
    return false
}



const SETEX_ASYNC = promisify(redisClient.SETEX).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//===================================================[API:FOR CREATING SHORT URL]===========================================================
exports.shortnerUrl = async (req, res) => {
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

        //getting data from cache if present
        let cacheData = await GET_ASYNC(`${data.longUrl}`)
        if (cacheData) {
            return res.status(200).send({ status: true, data: JSON.parse(cacheData) });
        }
        // checking if same link is stored in db and sending back data
        let longUrl = await urlModel.findOne({ longUrl: data.longUrl }).select({ _id: 0, __v: 0, createdAt: 0, updatedAt: 0 })
        if (longUrl) {
            //if already exist then setting the document in the cache with expire time
            await SETEX_ASYNC(`${data.longUrl}`, 3600, JSON.stringify(longUrl))
            return res.status(200).send({ status: true, data: longUrl })
        }

        //checking for valid url
        if (!validUrl.isURL(data.longUrl)) {
            return res.status(400).send({ status: false, message: "Please provide valid URL" })
        }
         // generating URL code
        const urlCode = shortId.generate().toLowerCase();

        //creating short URL

        const shortUrl = `http://localhost:3000/${urlCode}`;

        data.urlCode = urlCode;
        data.shortUrl = shortUrl;


        //creating document or short url
        const response = await urlModel.create(data);

        const responseData = { longUrl: response.longUrl, shortUrl: response.shortUrl, urlCode: response.urlCode }
        //finding the same created document and then setting the document in the cache with expire time
        await SETEX_ASYNC(`${data.longUrl}`, 3600, JSON.stringify(responseData))
        return res.status(201).send({ status: true, data: responseData });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

//===================================================[API:FOR REDIRECTING TO LONG URL]===========================================================

exports.getUrl = async (req, res) => {
    try {
        const urlCode = req.params.urlCode


        if (!shortId.isValid(urlCode)) {
            return res.status(400).send({ status: false, message: "URL Code is not valid." });
        }

        //getting data from cache if present
        let cacheData = await GET_ASYNC(`${urlCode}`);


        if (cacheData) {
            let url = JSON.parse(cacheData)
            return res.status(302).redirect(url.longUrl);
        } else {
            const checkUrl = await urlModel.findOne({ urlCode: urlCode })

            if (!checkUrl) {
                return res.status(404).send({ status: false, message: "URL not found." })
            }
            //if already exist then setting the document in the cache with expire time
            await SETEX_ASYNC(`${urlCode}`, 3600, JSON.stringify(checkUrl))
            return res.status(302).redirect(checkUrl.longUrl);
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}