const Discord = require("discord.js");
const fetch = require("node-fetch");
const auth = require('./auth.json');

// Initialize Discord Bot
var bot = new Discord.Client();

bot.on('ready', () => {
    console.log("Ready!");
});

bot.on('message', message => {
    if (message.author.username == "BriBot" && message.content.includes("Movies:")) {
        message.react('🇦');
        message.react('🇧');
        message.react('🇨');
        message.react('🇩');
    }
    switch (message.content.toLowerCase()) {
        case "!ping":
            message.channel.send("Pong");
            break;
        case "toaster strudel":
            message.channel.send("Erica!");
            break;
        case "movie poll":
            generatePoll(message);
            break;
        case "valorant":
            message.channel.send("Valorant!");
            break;
    }
});

bot.login(auth.Token);


//automatically poll general channel at Noon
var now = new Date();
var millisTillNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0) - now;
if (millisTillNoon < 0) {
     millisTillNoon += 86400000; // it's after Noon, try Noon tomorrow.
}

console.log("time until poll: " + millisTillNoon);
setTimeout(autoPoll, millisTillNoon);

function autoPoll() {
    generatePoll();
    setInterval(() => {
        console.log("poll");
        generatePoll()
    }, 86400000);
}

async function generatePoll(message) {
    var moviesChannel = bot.channels.cache.get("705311653113233444");
    lots_of_messages_getter(moviesChannel).then(movies => {
        let titles = [];
        movies.forEach(movie => {
            let valid = false;
            let platform = "";
            movie.reactions.cache.forEach(reaction => {
                if (reaction._emoji.name == '😍') {
                    valid = true;
                    platform = "(N)";
                } else if (reaction._emoji.name == '😆') {
                    valid = true;
                    platform = "(D+)";
                }
            });
            if (valid) {
                titles.push({
                    title: movie.content,
                    platform
                });
            }
        });

        //get 4 unique movies
        let opt1 = 0, opt2 = 0, opt3 = 0, opt4 = 0;
        while(opt1 == opt2 || opt1 == opt3 || opt1 == opt4 || opt2 == opt3 || opt2 == opt4 || opt3 == opt4) {
            opt1 = Math.floor(Math.random()*titles.length);
            opt2 = Math.floor(Math.random()*titles.length);
            opt3 = Math.floor(Math.random()*titles.length);
            opt4 = Math.floor(Math.random()*titles.length);
        }

        await getMovieDetails();
        if (message) {
            message.channel.send("Movies: \n" + ":regional_indicator_a: " + titles[opt1].title + " " + titles[opt1].platform +  "\n" 
                + ":regional_indicator_b: " + titles[opt2].title + " " + titles[opt2].platform + "\n" 
                + ":regional_indicator_c: " + titles[opt3].title + " " + titles[opt3].platform + "\n" 
                + ":regional_indicator_d: " + titles[opt4].title + " " + titles[opt4].platform);
        } else {
            let general = bot.channels.cache.get("689660661923446864");
            general.send("Movies: \n" + ":regional_indicator_a: " + titles[opt1].title + " " + titles[opt1].platform +  "\n" 
            + ":regional_indicator_b: " + titles[opt2].title + " " + titles[opt2].platform + "\n" 
            + ":regional_indicator_c: " + titles[opt3].title + " " + titles[opt3].platform + "\n" 
            + ":regional_indicator_d: " + titles[opt4].title + " " + titles[opt4].platform);
        }
    });
}



//https://stackoverflow.com/questions/55153125/fetch-more-than-100-messages
async function lots_of_messages_getter(channel, limit = 500) {
    const sum_messages = [];
    let last_id;

    while (true) {
        const options = { limit: 100 };
        if (last_id) {
            options.before = last_id;
        }

        const messages = await channel.messages.fetch(options);
        sum_messages.push(...messages.array());
        last_id = messages.last().id;

        if (messages.size != 100 || sum_messages >= limit) {
            break;
        }
    }

    return sum_messages;
}