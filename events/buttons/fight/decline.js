module.exports = {
    execute: async (userId, interaction, client) => {
        let { currentClient } = require("../../../db/mongo.js");
        currentClient = currentClient();

        //check if userId is in database
        await currentClient.connect();
        const db = currentClient.db("challenges");
        let challenge = await db.collection("active").findOne({
            challengerId: userId,
            challengedId: interaction.user.id,
        });
        console.log(challenge);
        if (!challenge) {
            currentClient.close();
            return interaction.reply({
                content: "Error! Challenge not found!",
            });
        }
        //check if challenge is declined
        if (challenge.status == 2) {
            currentClient.close();
            return interaction.reply({
                content: "Challenge already declined!",
            });
        }
        //check if challenge is already accepted
        if (challenge.status == 1) {
            currentClient.close();
            return interaction.reply({
                content: "Challenge already accepted!",
            });
        }
        //update challenge status to accepted
        await db
            .collection("active")
            .updateOne(
                { challengerId: userId, challengedId: interaction.user.id },
                { $set: { status: 2, statusText: "Declined" } }
            );
        currentClient.close();
        //send confirmation message
        interaction.reply({
            content: "Challenge declined!",
        });
        client.users.cache.get(userId).send({
            content: `${interaction.user.username} declined your challenge to a duel!`,
        });
    },
};
