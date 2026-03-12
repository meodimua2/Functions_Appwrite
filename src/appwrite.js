const { Client, Databases } = require("node-appwrite");

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject("69ae327900231c1fca3c")
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

module.exports = { databases };
