const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("challenge")
        .setDescription("Challenge a user to a fight!")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("User to challenge(e.g. user#0000)")
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply();
        //check if interaction was written in a server
        if (!interaction.inGuild()) {
            return interaction.followUp(
                "You can only use this command in a server!"
            );
        }
        let { currentClient } = require("../../db/mongo.js");
        currentClient = currentClient();
        //ping users databse
        await currentClient.connect();
        //check if fightCategory is set in database
        let guildData = await currentClient
            .db("guilds")
            .collection("data")
            .findOne({ id: interaction.guild.id });
        if (!guildData?.fightCategory) {
            currentClient.close();
            return interaction.followUp(
                "The fight category has not been set yet!"
            );
        }
        //check if user is already in database
        const db = currentClient.db("users");
        let user = await db
            .collection("data")
            .findOne({ id: interaction.user.id });
        if (!user || !user.joinedGuild) {
            currentClient.close();
            return interaction.followUp(
                "You havent joined the Adventure Guild yet! (/ag-join)"
            );
        }
        //verify if user is format user#0000
        let challengedUser = interaction.options.getUser("user");
        console.log(challengedUser);
        if (!challengedUser) {
            await currentClient.close();
            return interaction.followUp({
                content: "Please specify a user to challenge!",
                ephemeral: true,
            });
        }
        //keep interaction alive

        //verify if user is in server
        await interaction.guild.members.fetch();
        let members = interaction.guild.members.cache;
        let member = members.find(
            (member) => member.user.id === challengedUser.id
        );
        if (!member) {
            await currentClient.close();
            return interaction.followUp({
                content: "That user is not in this server!",
                ephemeral: true,
            });
        }
        //check if user is alredy challenged
        if (
            await currentClient.db("challenges").collection("active").findOne({
                challengedId: member.user.id,
                challengerId: interaction.user.id,
            })
        ) {
            await currentClient.close();
            return interaction.followUp({
                content: "You have already challenged this user!",
                ephemeral: true,
            });
        }
        //check if user is in the Adventure Guild
        let challengedUserData = await db
            .collection("data")
            .findOne({ id: member.user.id });
        if (!challengedUserData || !challengedUserData.joinedGuild) {
            currentClient.close();
            return interaction.followUp({
                content:
                    "That user has not joined the Adventure Guild yet! (/ag-join)",
                ephemeral: true,
            });
        }

        //send challenge message to challenged user
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel("Accept fight")
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId("accept-" + interaction.user.id)
            )
            .addComponents(
                new ButtonBuilder()
                    .setLabel("Decline fight")
                    .setStyle(ButtonStyle.Danger)
                    .setCustomId("decline-" + interaction.user.id)
            );

        await currentClient.db("challenges").collection("active").insertOne({
            challengerId: interaction.user.id,
            challengedId: member.user.id,
            challengerName: interaction.user.username,
            challengedName: member.user.username,
            status: 0,
            statusText: "Pending",
            timestamp: Date.now(),
            guildId: interaction.guild.id,
        });

        const challengeEmbed = new EmbedBuilder()
            .setTitle("You have been challenged to a fight!")
            .setDescription(
                `${interaction.user.username} has challenged you to a fight!`
            )
            .setColor("#91a1e3");
        await member.send({ embeds: [challengeEmbed], components: [row] });
        //send confirmation message to challenger
        await interaction.followUp({
            content: `You have challenged ${member.user.username} to a fight!`,
            ephemeral: true,
        });
        await currentClient.close();
    },
};
