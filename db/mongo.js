const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
    "mongodb+srv://root:dmZxKlLCW6TGvgks@sl-dc-bot.9cfxcv0.mongodb.net/?retryWrites=true&w=majority";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
let currentClient = null;

exports.mongo = class Mongo {
    constructor() {
        this.client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });
        currentClient = this.client;
        console.log("MongoDB client created.");
    }
    async connect() {
        await this.client.connect();
        return this.client;
    }
    async disconnect() {
        await this.client.close();
        return this.client;
    }
};

exports.currentClient = function () {
    return currentClient;
};
