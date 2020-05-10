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
    if (message.author.username != "BriBot") {
        //commands
        switch (message.content.toLowerCase()) {
            case "ping":
                message.channel.send("Pong");
                break;
            case "movie poll":
                generatePoll(message);
                break;
            case "f":
                message.channel.send("F");
                break;
            case "countdown":
                setTimeout(() => message.channel.send("3"), 1000);
                setTimeout(() => message.channel.send("2"), 2000);
                setTimeout(() => message.channel.send("1"), 3000);
                setTimeout(() => message.channel.send("Go"), 4000);
                break;
        }

        //random responses
        if (message.content.toLowerCase().includes("valorant")) {
            message.channel.send("Valorant!");
        } else if (message.content.toLowerCase().includes("did you know")) {
            message.channel.send("Obviously");
        } else if (message.content.toLowerCase().includes("ac")) {
            message.channel.send("Obviously");
        } else if (message.content.toLowerCase().includes("animal crossing")) {
            message.channel.send("Obviously");
        } else if (message.content.toLowerCase().includes("toaster strudel")) {
            message.channel.send("Erica!");
        } 
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
    let movies = await lots_of_messages_getter(moviesChannel);
    let titles = [];
    movies.forEach(movie => {
        let valid = false;
        let platform = "";
        movie.reactions.cache.forEach(reaction => {
            if (reaction._emoji.name == '😍') {
                valid = true;
                platform = "N";
            } else if (reaction._emoji.name == '😆') {
                valid = true;
                platform = "D+";
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
    let movie1 = titles[opt1];
    let movie2 = titles[opt2];
    let movie3 = titles[opt3];
    let movie4 = titles[opt4];

    movie1.details = await getMovieDetails(movie1.title);
    movie2.details = await getMovieDetails(movie2.title);
    movie3.details = await getMovieDetails(movie3.title);
    movie4.details = await getMovieDetails(movie4.title);

    if (message) {
        message.channel.send("Movies: \n" + ":regional_indicator_a: " + movie1.title + " | " + movie1.platform + " | " + movie1.details.Runtime + " | " + movie1.details.imdbRating +  "\n" 
            + ":regional_indicator_b: " + movie2.title + " | " + movie2.platform + " | " + movie2.details.Runtime + " | " + movie2.details.imdbRating +  "\n" 
            + ":regional_indicator_c: " + movie3.title + " | " + movie3.platform + " | " + movie3.details.Runtime + " | " + movie3.details.imdbRating +  "\n"
            + ":regional_indicator_d: " + movie4.title + " | " + movie4.platform + " | " + movie4.details.Runtime + " | " + movie4.details.imdbRating +  "\n");
    } else {
        let general = bot.channels.cache.get("689660661923446864");
        general.send("(beta) Movies: \n" + ":regional_indicator_a: " + movie1.title + " | " + movie1.platform + " | " + movie1.details.Runtime + " | " + movie1.details.imdbRating +  "\n" 
        + ":regional_indicator_b: " + movie2.title + " | " + movie2.platform + " | " + movie2.details.Runtime + " | " + movie2.details.imdbRating +  "\n" 
        + ":regional_indicator_c: " + movie3.title + " | " + movie3.platform + " | " + movie3.details.Runtime + " | " + movie3.details.imdbRating +  "\n"
        + ":regional_indicator_d: " + movie4.title + " | " + movie4.platform + " | " + movie4.details.Runtime + " | " + movie4.details.imdbRating +  "\n");
    }
}

async function getMovieDetails(title) {
    return await fetch(`http://www.omdbapi.com/?t=${title}&apikey=${auth.OMDB_API_KEY}`).then(res => res.json());
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
