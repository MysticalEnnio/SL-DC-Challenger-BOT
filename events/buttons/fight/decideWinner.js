const ObjectId = require("mongodb").ObjectId;

module.exports = {
    execute: async (data, interaction, client) => {
        interaction.deferReply();
        let challengeId = data.split("/")[0];
        console.log("challengeId: " + challengeId);
        let winnerId = data.split("/")[1];

        let currentClient = require("../../../db/mongo.js").currentClient();
        await currentClient.connect();
        const db = currentClient.db("challenges");
        console.log(ObjectId);
        let challenge = await db.collection("adminDecide").findOne({
            challengeId: new ObjectId(challengeId),
        });
        if (!challenge) {
            currentClient.close();
            return interaction.followUp({
                content: "Error! Challenge not found!",
            });
        }

        challenge = await db.collection("active").findOne({
            _id: new ObjectId(challenge.challengeId),
        });
        if (!challenge) {
            currentClient.close();
            return interaction.followUp({
                content: "Error! Challenge not found!",
            });
        }

        let loserId =
            challenge.challengerId == winnerId
                ? challenge.challengedId
                : challenge.challengerId;

        let guildData = await currentClient
            .db("guilds")
            .collection("data")
            .findOne({ id: challenge.guildId });
        if (!guildData.fightArchiveCategory) {
            currentClient.close();
            return interaction.followUp({
                content:
                    "Error! No fight archive category set! Please contact an admin to set the fight archive category with the command `/set-fight-archive-category`",
            });
        }

        //archive challenge and set winner
        await db.collection("archived").insertOne({
            ...challenge,
            winnerId,
            outcome: 1,
            outcomeText: `${
                winnerId == challenge.challengerId
                    ? challenge.challengerName
                    : challenge.challengedName
            } won`,
        });
        await db.collection("active").deleteOne({
            channelId: challenge.channelId,
        });

        let channel = await client.channels.fetch(challenge.channelId);
        console.log(challenge.challengedId, challenge.challengerId);
        console.log("channel: " + channel);
        channel.permissionOverwrites.create(channel.guild.roles.everyone, {
            ViewChannel: false,
        });
        channel.permissionOverwrites.create(challenge.challengedId, {
            SendMessages: false,
            ViewChannel: true,
        });
        channel.permissionOverwrites.create(challenge.challengerId, {
            SendMessages: false,
            ViewChannel: true,
        });
        //move channel to fight-archive category
        channel.setParent(guildData.fightArchiveCategory);

        let winner = await currentClient
            .db("users")
            .collection("data")
            .findOne({ id: winnerId });
        let loser = await currentClient.db("users").collection("data").findOne({
            id: loserId,
        });
        //calculate exp for winner (Exp per win = (UserLevel^2) * (EnemyLevel/UserLevel))
        let exp =
            Math.floor(
                Math.pow(winner.level, 2) * (loser.level / winner.level)
            ) + 4;
        console.log("winner exp: " + exp);
        //calculate power for winner (Power per win = 10 * ((EnemyLevel+10)/(UserLevel+10)))
        let power = Math.floor(10 * ((loser.level + 10) / (winner.level + 10)));
        //add exp to winners exp, add 1 to wins and 1 to fights
        await currentClient
            .db("users")
            .collection("data")
            .updateOne(
                { id: winnerId },
                {
                    $inc: {
                        exp,
                        power,
                        wins: 1,
                        fights: 1,
                    },
                }
            );
        //add 1 to losses and 1 to fights
        await currentClient
            .db("users")
            .collection("data")
            .updateOne(
                {
                    id: loserId,
                },
                {
                    $inc: {
                        exp: Math.floor(exp / 5),
                        power: -Math.floor(power / 2),
                        losses: 1,
                        fights: 1,
                    },
                }
            );

        await require("../../../modules/fight/calc.js").calculateStats(
            winnerId
        );
        await require("../../../modules/fight/calc.js").calculateStats(loserId);

        //send a message tagging the other user and saying that the user has confirmed the winner
        await interaction.followUp({
            content: `<@${interaction.user.id}> has confirmed that ${
                winnerId == challenge.challengerId
                    ? challenge.challengerName
                    : challenge.challengedName
            } is the winner of the duel!`,
        });
    },
};
