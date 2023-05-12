const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

module.exports = {
    data: new SlashCommandBuilder()
        .setName("suggest-time")
        .setDescription("Suggest a date and time for this fight")
        .addStringOption((option) =>
            option
                .setName("date")
                .setDescription("Enter the date you want to fight(MM/DD/YYYY)")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("time")
                .setDescription("Enter the time you want to fight(HH:MM)")
                .setRequired(true)
        )
        .addBooleanOption((option) =>
            option.setName("pm").setDescription("Is it PM?")
        ),
    async execute(interaction) {
        await interaction.deferReply();
        //check if command is in a channel in fight category
        if (!interaction.channel.parent.name.toLowerCase() == "fights") {
            return interaction.followUp({
                content: "This command can only be used in a fight channel!",
                ephemeral: true,
            });
        }
        //check if date is valid with regex
        let date = interaction.options.getString("date");
        let regex = new RegExp(
            "^(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\\d\\d$"
        );
        if (!regex.test(date)) {
            return interaction.followUp({
                content: "Invalid date format! Please use MM/DD/YYYY",
                ephemeral: true,
            });
        }
        let time = interaction.options.getString("time");
        //check if pm is true
        let pm = interaction.options.getBoolean("pm");
        if (pm) {
            let hour = parseInt(time.split(":")[0]);
            hour = hour + 12;
            time = hour + ":" + time.split(":")[1];
        }
        regex = new RegExp("^([01]?[0-9]|2[0-3]):[0-5][0-9]$");
        if (!regex.test(time)) {
            return interaction.followUp({
                content: "Invalid time format! Please use HH:mm",
                ephemeral: true,
            });
        }
        //check if date is in the future
        date = dayjs(date + " " + time, "MM/DD/YYYY HH:mm");
        console.log(date.format("MM/DD/YYYY HH:mm"));
        if (date.isBefore(dayjs())) {
            return interaction.followUp({
                content: "Date is in the past!",
                ephemeral: true,
            });
        }
        let { currentClient } = require("../../db/mongo.js");
        currentClient = currentClient();

        //check if userId is in database
        await currentClient.connect();
        //check if users timezone is set
        const db = currentClient.db("users");
        let user = await db
            .collection("data")
            .findOne({ id: interaction.user.id });
        if (!user.timeOffset) {
            currentClient.close();
            return interaction.followUp({
                content:
                    "You haven't set your timezone yet! Please use /timezone to set your timezone",
                ephemeral: true,
            });
        }
        //get challenge using channel id
        let challenge = await currentClient
            .db("challenges")
            .collection("active")
            .findOne({ channelId: interaction.channel.id });
        if (!challenge) {
            console.log("challenge not found", challenge);
            currentClient.close();
            return interaction.followUp({
                content: "Error: Challenge not found!",
                ephemeral: true,
            });
        }
        //get timzeon of other user
        let otherUser = await db.collection("data").findOne({
            id:
                interaction.user.id == challenge.challengerId
                    ? challenge.challengedId
                    : challenge.challengerId,
        });

        if (!otherUser?.timeOffset) {
            currentClient.close();
            return interaction.followUp({
                content: "Other user has not set their timezone yet!",
                ephemeral: true,
            });
        }
        //convert date from user timezone to other user timezone (timezoneoffset can either be positive or negative)
        let timezoneOffset = otherUser.timeOffset - user.timeOffset;
        let otherUserDate = date.utc(user.timeOffset).add(timezoneOffset, "h");

        console.log(timezoneOffset);
        console.log(otherUserDate.format("MM/DD/YYYY HH:mm"));

        //send message in this channel tagging other user and saying that user suggested date
        interaction.followUp({
            content: `<@${otherUser.id}> <@${
                interaction.user.id
            }> suggested ${otherUserDate.format(
                "MM/DD/YYYY HH:mm"
            )} as a date for this fight!`,
            components: [
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `AcceptTime-${challenge._id}/${interaction.user.id}`
                            )
                            .setLabel("Accept Time")
                            .setStyle(ButtonStyle.Primary)
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(
                                `DeclineTime-${challenge._id}/${interaction.user.id}`
                            )
                            .setLabel("Decline Time")
                            .setStyle(ButtonStyle.Danger)
                    ),
            ],
        });
    },
};
