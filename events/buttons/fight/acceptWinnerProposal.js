module.exports = {
    execute: async (data, interaction, client) => {
        await interaction.deferReply();
        let propsalUserId = data.split("/")[1];
        let winnerId = data.split("/")[0];
        console.log(data);
        console.log(winnerId, propsalUserId, interaction.user.id);
        //check if user is proposal sender
        if (propsalUserId == interaction.user.id) {
            return interaction.followUp({
                content: "You can't accept your own proposal!",
            });
        }
        let currentClient = require("../../../db/mongo.js").currentClient();
        await currentClient.connect();
        const db = currentClient.db("challenges");
        let challenge = await db.collection("active").findOne({
            channelId: interaction.channelId,
        });
        if (!challenge) {
            currentClient.close();
            return interaction.followUp({
                content: "Error! Challenge not found!",
            });
        }
        let loserId =
            challenge.challengedId == winnerId
                ? challenge.challengerId
                : challenge.challengedId;
        let guildData = await currentClient
            .db("guilds")
            .collection("data")
            .findOne({ id: challenge.guildId });
        if (!guildData.fightArchiveCategory) {
            currentClient.close();
            return interaction.followUp({
                content:
                    "Error! No fight archive category set! Please contact an admin to set the fight-archive category with the command `/setfightcategory`",
            });
        }

        //archive challenge and set winner
        await db.collection("archived").insertOne({
            ...challenge,
            winnerId,
            outcome: 1,
            outcomeText:
                winnerId == challenge.challengerId
                    ? `${challenge.challengerName} won`
                    : `${challenge.challengedName} won`,
        });
        await db.collection("active").deleteOne({
            channelId: interaction.channelId,
        });

        let channel = await client.channels.fetch(challenge.channelId);
        console.log(challenge.challengedId, challenge.challengerId);
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
        let message = await interaction.followUp({
            content: `<@${
                interaction.user.id == challenge.challengerId
                    ? challenge.challengedId
                    : challenge.challengerId
            }> ${interaction.user.username} has confirmed that **${
                winnerId == interaction.user.id ? "he" : "you"
            }** ${
                winnerId == interaction.user.id ? "is" : "are"
            } the winner of the duel!`,
        });
    },
};
