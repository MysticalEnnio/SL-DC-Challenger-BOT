const {
    ActionRowBuilder,
    ChannelType,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const dayjs = require("dayjs");

module.exports = {
    execute: async (userId, interaction, client) => {
        await interaction.deferReply();
        console.log("accept.js executed!");
        let { currentClient } = require("../../../db/mongo.js");
        currentClient = currentClient();

        //check if userId is in database
        await currentClient.connect();
        const db = currentClient.db("challenges");
        let challenge = await db.collection("active").findOne({
            challengerId: userId,
            challengedId: interaction.user.id,
        });
        let guildData = await currentClient
            .db("guilds")
            .collection("data")
            .findOne({ id: challenge.guildId });

        console.log(challenge);
        if (!challenge) {
            currentClient.close();
            return interaction.followUp({
                content: "Error! Challenge not found!",
            });
        }
        //check if challenge is declined
        if (challenge.status == 2) {
            currentClient.close();
            return interaction.followUp({
                content: "Challenge already declined!",
            });
        }
        //check if challenge is already accepted
        if (challenge.status == 1) {
            currentClient.close();
            return interaction.followUp({
                content: "Challenge already accepted!",
            });
        }
        if (!guildData.fightCategory) {
            return interaction.followUp({
                content:
                    "Error! No fight category set! Please contact an admin to set the fight category with the command `/setfightcategory`",
            });
        }
        //keep interaction alive

        let challengeChannel = await client.guilds.cache
            .get(challenge.guildId)
            .channels.create({
                name: `${challenge.challengerName}   vs   ${challenge.challengedName}`,
                type: ChannelType.GuildText,
            });

        await db.collection("active").updateOne(
            { challengerId: userId, challengedId: interaction.user.id },
            {
                $set: {
                    status: 1,
                    statusText: "Accepted",
                    channelId: challengeChannel.id,
                },
            }
        );

        await challengeChannel.setParent(guildData.fightCategory);
        await challengeChannel.lockPermissions();
        challengeChannel.permissionOverwrites.create(
            challengeChannel.guild.roles.everyone,
            {
                ViewChannel: false,
            }
        );
        challengeChannel.permissionOverwrites.create(challenge.challengerId, {
            ViewChannel: true,
        });
        challengeChannel.permissionOverwrites.create(challenge.challengedId, {
            ViewChannel: true,
        });

        let invite = await challengeChannel.createInvite({
            maxAge: 10 * 60 * 1000, // maximum time for the invite, in milliseconds
            maxUses: 1, // maximum times it can be used
        });
        interaction.followUp({
            content: `You accepted ${challenge.challengerName}'s challenge! \nHere is the channel for the fight: \n${invite}`,
        });
        client.users.cache.get(userId).send({
            content: `${interaction.user.username} accepted your challenge to a duel! \nHere is the channel for the fight: \n${invite}`,
        });
        let challengerData = await currentClient
            .db("users")
            .collection("data")
            .findOne({ id: challenge.challengerId });
        let challengedData = await currentClient
            .db("users")
            .collection("data")
            .findOne({ id: challenge.challengedId });
        let challengerTimezone = challengerData?.timeOffset;
        let challengedTimezone = challengedData?.timeOffset;

        let timezoneText = "";
        console.log(challengerTimezone, challengedTimezone);
        console.log(!!challengerTimezone + !!challengedTimezone);
        switch (!!challengerTimezone + !!challengedTimezone) {
            case 0:
                timezoneText =
                    "Both players must set their timezone with the command `/timezone`";
                break;
            case 1:
                if (challengerTimezone) {
                    timezoneText = `${challenge.challengerName} has set their timezone to utc${challengerTimezone} \n${challenge.challengedName} must set their timezone with the command \`/timezone\``;
                    console.log("timezoneText from case 1", timezoneText);
                } else {
                    timezoneText = `${challenge.challengedName} has set their timezone to utc${challengedTimezone} \n${challenge.challengerName} must set their timezone with the command \`/timezone\``;
                }
                break;
            case 2:
                //calculate diffrence between timezones (challenger is ... hours (ahead/behind) of challenged)
                let diff = challengerTimezone - challengedTimezone;
                if (diff > 0) {
                    timezoneText = `${challenge.challengerName} is ${diff} hours ahead of ${challenge.challengedName}`;
                } else if (diff < 0) {
                    timezoneText = `${challenge.challengerName} is ${Math.abs(
                        diff
                    )} hours behind ${challenge.challengedName}`;
                } else {
                    timezoneText = `${challenge.challengerName} and ${challenge.challengedName} are in the same timezone`;
                }
                break;
        }
        console.log("timezoneText", timezoneText);

        //send a message to the channel telling them that they have to set their timezone with the command /timezone andwith help on the commands: /suggest-time, /suggest-date, /propose-winner
        //the message should also have a button to cancel the challenge
        await challengeChannel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle(
                        `${challenge.challengerName} vs ${challenge.challengedName}`
                    )
                    .setDescription(
                        `${timezoneText}\n
                    A time and date can be suggested with the command \`/suggest-time\`\n
                    The winner can be proposed with the command \`/propose-winner\` (Both players have to propose the same winner)\n
                    If both players cant decide an admin can be called to review the match with /admin-decide\n`
                    )
                    .setColor("#91a1e3"),
            ],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("cancel-" + challenge._id)
                        .setLabel("Cancel Challenge")
                        .setStyle(ButtonStyle.Primary)
                ),
            ],
        });

        currentClient.close();
    },
};
