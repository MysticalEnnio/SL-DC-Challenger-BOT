const ObjectId = require("mongodb").ObjectId;

module.exports = {
    execute: async (challengeId, interaction, client) => {
        interaction.deferReply();

        let currentClient = require("../../../db/mongo.js").currentClient();
        await currentClient.connect();
        //get challenge
        const db = currentClient.db("challenges");
        let challenge = await db.collection("active").findOne({
            _id: new ObjectId(challengeId),
        });
        if (!challenge) {
            currentClient.close();
            return interaction.followUp({
                content: "Error! Challenge not found!",
            });
        }

        //send message in the challenge channel saying that the matchcode is invalid
        let channel = await client.channels.fetch(challenge.channelId);
        channel.send({
            content: `The match code provided for the admin is invalid!`,
        });

        currentClient.close();
        interaction.followUp({
            content:
                "The players have been notified of the invalid match code!",
        });
    },
};
