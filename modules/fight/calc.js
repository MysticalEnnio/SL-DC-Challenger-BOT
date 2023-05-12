const rankMins = new Map([
    [0, { min: 0, name: "F" }],
    [1, { min: 100, name: "E" }],
    [2, { min: 250, name: "D" }],
    [3, { min: 500, name: "C" }],
    [4, { min: 750, name: "B" }],
    [5, { min: 1000, name: "A" }],
    [6, { min: 1500, name: "S" }],
    [7, { min: 2500, name: "SR" }],
    [8, { min: 5000, name: "SSR" }],
]);

module.exports = {
    calculateStats: async (userId) => {
        //calculate stats
        let currentClient = require("../../db/mongo.js").currentClient();
        console.log("s1");
        await currentClient.connect();
        console.log("s2");
        user = await currentClient
            .db("users")
            .collection("data")
            .findOne({ id: userId });
        console.log("s3");
        //calculate rank using user.power
        let rankNum = 0;
        for (let i = 0; i < 9; i++) {
            if (user.power >= rankMins.get(i).min) {
                rankNum = i;
            }
        }
        const rank = rankMins.get(rankNum).name;

        console.log("s4");
        //Level =(sqrt(exp^1.75))/10
        await currentClient
            .db("users")
            .collection("data")
            .updateOne(
                { id: userId },
                {
                    $set: {
                        level:
                            Math.floor(
                                Math.sqrt(Math.pow(user.exp, 1.75)) / 10
                            ) + 1,
                        rank,
                        rankNum,
                        power: user.power >= 0 ? user.power : 0,
                    },
                }
            );
        console.log("s5");
        await currentClient.close();
    },
};
