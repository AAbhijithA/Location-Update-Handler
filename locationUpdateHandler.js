const dotenv = require('dotenv');
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config({ path : './.env' });

/**
 * Environment Variables
 * access them in the .env file
 */
const Port = process.env.PORT;
const Database = process.env.DB_NAME;
const Collection = process.env.COLLECTION_DL;
const mongoUri = process.env.MONGO_URI;

/**
 * MongoDB Client is Connection Pooled
 * Pool Sizes in the .env file
 */
const mongoClient = new MongoClient(mongoUri, {
    minPoolSize : process.env.MONGO_MIN_POOL_SIZE,
    maxPoolSize : process.env.MONGO_MAX_POOL_SIZE,
    useNewUrlParser: true,
});

/**
 * Params : userId, Latitude, Longitude, Status
 * Verfies if the fields are within bounds
 */
function verifyFields(userID, Lat, Lon, status) {
    if(userID.length === 0 || isNaN(Lat) || isNaN(Lon) || status.length === 0) {
        console.log(1);
        return false;
    }
    else if(Lat > 90 || Lat < -90 || Lon > 180 || Lon < -180) {
        console.log(2);
        return false;
    }
    else if(status !== "B" && status !== "F" && status !== "O") {
        console.log(status);
        console.log(3);
        return false;
    }
    return true;
}

/**
 * Params : userId, Latitude, Longitude, Status
 * Makes the find, update and options part of the query
 * for driver location update
 */
function createQueryDriverUpdate(userID, Lat, Lon, status) {
    const qFind = { "userID" : userID };
    const qUpdate = { 
        $set : {
            "status" : status, 
            "location.coordinates" : [Lon, Lat], 
        },
        $setOnInsert : {
            "location.type" : "Point",
        },
    };
    const qOptions = { upsert : true };
    const query = [qFind, qUpdate, qOptions];
    return query;
}

/**
 * Params : userId, Status
 * Makes the find and update part of the query
 * for driver status update
 */
function createQueryDriverStatus(userID, status) {
    const qFind = {"userID" : userID};
    const qUpdate = {
        $set : {
            "status" : status
        }
    }
    const query = [qFind, qUpdate];
    return query;
}

/**
 * Params-Query : UserID, Latitude, Longitude, Status
 * http://localhost:{port}/updateDriverLoc?userid={userid}&lat={lat}&lon={lon}&status={status}
 * Connects to the MongoDB Client and updates (or) inserts new records
 * into LocationDB Database driverlocation collection
 */
app.put('/updateDriverLoc', async (req,res) => {
    try {
        const userID = String(req.query.userid), Lat = parseFloat(req.query.lat);
        const Lon = parseFloat(req.query.lon), status = String(req.query.status);
        if(!verifyFields(userID,Lat,Lon,status)) {
            res.status(400).json({ message : "Wrong fields, Update Failed"});
            return;
        }
        const query = createQueryDriverUpdate(userID,Lat,Lon,status)
        const client = await mongoClient.connect();
        const db = client.db(Database);
        const dlCollection = db.collection(Collection)
        const result = await dlCollection.updateOne(query[0], query[1], query[2]);
        console.log(result);
        client.close();
    }
    catch(err) {
        console.log(err);
        res.status(500).json({ message : "Update Failed"});
        return;
    }
    res.status(200).json({ message : "Update Done"});
    return;
})

/**
 * Params-Query : UserID
 * http://localhost:{port}/getDriverLoc?userid={userid}
 * Connects to the MongoDB Client and gets coordinates of user
 * from LocationDB Database driverlocation collection
 */
app.get('/getDriverLoc', async (req, res) => {
    try {
        const driverId = String(req.query.userid);
        const client = await mongoClient.connect();
        const db = client.db(Database);
        const dlCollection = db.collection(Collection);
        const result = await dlCollection.findOne({"userID" : driverId });
        console.log(result);
        if(!result || Object.keys(result).length === 0) {
            throw new Error("Driver doesn't exist");
        }
        client.close();
        res.status(200).json({ latitude : result.location.coordinates[1], longitude : result.location.coordinates[0]});
    }
    catch(err) {
        console.log(err);
        res.status(500).json({ message : "Driver couldn't be found"});
        return;
    }
})

/**
 * Params-Query : UserID, Status
 * http://localhost:{port}/updateDriverStatus?userid={userid}&status={status}
 * Connects to the MongoDB Client and updates status of user records
 * into LocationDB Database driverlocation collection
 */
app.put('/updateDriverStatus', async (req, res) => {
    try {
        const driverId = String(req.query.userid), status = String(req.query.status);
        const client = await mongoClient.connect();
        const db = client.db(Database);
        const dlCollection = db.collection(Collection);
        const query = createQueryDriverStatus(driverId,status);
        const result = await dlCollection.updateOne(query[0], query[1]);
        console.log(result);
        client.close();
    }
    catch(err) {
        console.log(err);
        res.status(500).json({ message : "Driver couldn't be updated"});
        return;
    }
    res.status(200).json({ message : "Update Done"});
    return;
})

app.listen(Port, () => {
    console.log("Location Update Handler is running at Port:" + Port);
})