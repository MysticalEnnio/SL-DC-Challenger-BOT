const { SlashCommandBuilder } = require("discord.js");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

module.exports = {
    data: new SlashCommandBuilder()
        .setName("timezone")
        .setDescription(
            "Enter your current hour to set your timezone(used for fights)"
        )
        .addIntegerOption((option) =>
            option
                .setName("hour")
                .setDescription(
                    "Enter your current hour(e.g. 8:33pm = 8, 20:33 = 20, 8:33am = 8)"
                )
                .setRequired(true)
        )
        .addBooleanOption((option) =>
            option.setName("pm").setDescription("Is it PM?")
        ),
    async execute(interaction) {
        let { currentClient } = require("../../db/mongo.js");
        currentClient = currentClient();

        //check if userId is in database
        await currentClient.connect();
        //get utc+0 time
        let utcTime = dayjs().utcOffset(0);
        //get hour
        let hour = interaction.options.getInteger("hour");
        //get pm
        let pm = interaction.options.getBoolean("pm");
        if (pm) hour = hour + 12;
        if (hour < 0 || hour > 24) {
            currentClient.close();
            return interaction.reply({ content: "Invalid hour!" });
        }
        //get difference between utc+0 time and current time
        console.log(utcTime.hour());
        console.log(hour);
        if (utcTime.hour() < hour - 12) {
            hour = hour - 24;
        }
        let difference = hour - utcTime.hour();
        //check if user is in database
        const db = currentClient.db("users");
        let user = await db
            .collection("data")
            .findOne({ id: interaction.user.id });
        if (!user) {
            await db.collection("data").insertOne({
                id: interaction.user.id,
                name: interaction.user.username,
                joinedGuild: false,
                timeOffset: difference,
            });
            currentClient.close();
            return interaction.reply({
                content: `Your timezone has been set to UTC${difference}`,
            });
        }
        //update timezone
        await db
            .collection("data")
            .updateOne(
                { id: interaction.user.id },
                { $set: { timeOffset: difference } }
            );
        currentClient.close();
        //send confirmation message
        interaction.reply({
            content: `Your timezone has been set to UTC${difference}`,
        });
    },
};
