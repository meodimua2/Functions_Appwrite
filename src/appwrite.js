const { Client, Databases } = require("node-appwrite");

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject("69ae327900231c1fca3c")
    .setKey("standard_99209615398642eb0d2f49aa4610d477137ea5a9f927f528724f7da75c5b00134250f3995d7dd5eab64aa6ab4b13c275c4440a3e22e6f6b7fc54d3a9d5b11d57822724cb8af94564fe3ce719cded7d053b6061f8b1a62e3da79488a9e402d7b611a2f06f09fd85b8842f254a4299032a46feac0e04c7af9e306f6c5e9849ec14");

const databases = new Databases(client);

module.exports = { databases };
