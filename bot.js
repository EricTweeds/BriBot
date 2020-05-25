const Discord = require("discord.js");
const fetch = require("node-fetch");
const ytdl = require("ytdl-core");
const request = require("request");

const auth = require('./auth.json');

var port = process.env.PORT || 8080;

const testSong = 'https://www.youtube.com/watch?v=Krw642HTCgw&ab_channel=AudioLibrary%E2%80%94Musicforcontentcreators';
const youtubeURL = 'https://www.youtube.com/watch?v=';

let dispatcher = null;

let spotifyToken = "";

const schedulePoll = false;
const GENRES = ["action", "adventure", "animation", "biography", "comedy", "crime",
                "documentary", "drama", "family", "fantasy", "film noir", "history",
                "horror", "music", "musical", "mystery", "romance", "sci-fi",
                "short film", "sport", "superhero", "thriller", "war", "western"];

// Initialize Discord Bot
var bot = new Discord.Client();

bot.on('ready', () => {
    console.log("Ready!");
    connectSpotify();
});

bot.on('message', message => {
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
            case "list genres":
                message.channel.send(GENRES.join("\n"));
                break;
            case "gulag":
                gulag();
                break;
            case "play":
                playmusic();
                break;
            case "stop":
                stopmusic();
                break;
            case "resume":
                resumemusic();
                break;
            case "pause":
                pausemusic();
                break;
            case "rick roll":
                playsong("never gonna give you up");
                break;
        }

        if (message.content.toLowerCase().startsWith("movie poll") && message.content.toLowerCase().includes("-g")) {
            let genre = message.content.toLowerCase().substr(message.content.toLowerCase().indexOf("g") + 2);
            if (GENRES.indexOf(genre) < 0) {
                message.channel.send("Invalid Genre, to see options use `list genres`");
            } else {
                generatePollWithGenre(message, genre);
            }
        }

        if (message.content.toLowerCase().startsWith("!details")) {
            sendMovieDetails(message);
        }

        if (message.content.toLowerCase().startsWith("volume")) {
            let volume = message.content.toLowerCase().substr(7);
            if (isNaN(volume) || volume > 10) {
                message.channel.send("Invalid volume, 1 is normal, 0.5 is half, 2 is double.");
            } else {
                setvolume(volume);
            }
        }

        if (message.content.toLowerCase().startsWith("play song")) {
            let song = message.content.toLowerCase().substr(10);
            if (song == "" || !song) {
                message.channel.send("Invalid Title");
            } else {
                playsong(song);
            }
        }


        if (message.content.toLowerCase().startsWith("play link")) {
            let link = message.content.substr(10);
            if (link == "" || !link) {
                message.channel.send("Invalid Link");
            } else {
                playlink(link);
            }
        }


        if (message.content.startsWith("/poll")) {
            generatePoll(message);
        }

        //random responses
        if (message.content.toLowerCase().includes("valorant")) {
            message.channel.send("Valorant!");
        } else if (message.content.toLowerCase().includes("did you know")) {
            message.channel.send("Obviously");
        } else if (message.content.toLowerCase().includes(" ac ")) {
            message.channel.send("Obviously");
        } else if (message.content.toLowerCase().includes("animal crossing")) {
            message.channel.send("Obviously");
        } else if (message.content.toLowerCase().includes("toaster strudel")) {
            message.channel.send("Erica!");
        } 
    }
});

bot.on('voiceStateUpdate', (oldMember, newMember) => {
    let newUserChannel = newMember.channelID;
    let oldUserChannel = oldMember.channelID;

    if(oldUserChannel !== auth.GulagID && newUserChannel === auth.GulagID) {
       gulag();
    } else if(newUserChannel === undefined){
      // User leaves a voice channel
    }
});


bot.login(auth.Token);

async function connectSpotify() {
    var payload = auth.spotify.clientId + ":" + auth.spotify.clientSecret;
    var encodedPayload = new Buffer.from(payload).toString("base64");

    var opts = {
        url: "https://accounts.spotify.com/api/token",
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + encodedPayload
        },
        body: "grant_type=client_credentials&scope=playlist-modify-public playlist-modify-private"
    };

    request(opts, function (err, res, body) {
        let info = JSON.parse(body);
        spotifyToken = info.access_token;
        if (err) {
            console.log(err);
        } else {
            console.log("Token Received");
        }
    });
}


async function playmusic() {
    var opts = {
        url: "https://api.spotify.com/v1/playlists/4y1qqP8HXKL9IoRkJAYapV",
        method: "GET",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Bearer " + spotifyToken
        }
    };

    request(opts, async function (err, res, body) {
        let playlist = JSON.parse(body);
        let songs = playlist.tracks.items.map(song => {
            let artists = song.track.artists.map(artist => {
                return artist.name;
            });
            return song.track.name + " " + artists.join(" ");
        });
        playPlaylist(songs);
    });

}

async function playPlaylist(songs) {
    let randint = Math.floor(Math.random()*songs.length);

    let link = await getYoutubeId(songs[randint]);

    let randints = {counter: 1};
    randints[randint] = true;
    console.log(songs[randint]);
    player(link, randints, songs);

}

function player(link, randints, songs) {
    let gamingChannel = bot.channels.cache.get(auth.GamingID);
    gamingChannel.join().then(connection => {
        dispatcher = connection.play(ytdl(link, { filter: 'audioonly' }), { volume: 0.5 });
        dispatcher.on("finish", async function() {
            if (randints.counter >= songs.length) {
                return gamingChannel.leave();
            } else {
                let randint = Math.floor(Math.random()*songs.length);
                while(randints[randint] == true) {
                    randint = Math.floor(Math.random()*songs.length);
                }
                let link = await getYoutubeId(songs[randint]);
                console.log(songs[randint]);
                randints[randint] = true;
                randints.counter ++;
                return player(link, randints, songs);
            }
        });
    }).catch(e => {
        console.log(e);
    });
}

function playlink(link) {
    let gamingChannel = bot.channels.cache.get(auth.GamingID);
    gamingChannel.join().then(connection => {
        let audio = ytdl(link, { filter: 'audioonly' });
        dispatcher = connection.play(audio, { volume: 0.5 });
        dispatcher.on("error", e => {
            console.log(e);
        });
        dispatcher.on("finish", end => {
            gamingChannel.leave();
        });
    }).catch(e => {
        console.log(e);
    });
}

async function playsong(title) {
    let id = await getYoutubeId(title);

    if(!id) return;

    let gamingChannel = bot.channels.cache.get(auth.GamingID);
    gamingChannel.join().then(connection => {
        let url = youtubeURL + id;
        let audio = ytdl(url, { filter: 'audioonly' });
        dispatcher = connection.play(audio, { volume: 0.5 });
        dispatcher.on("error", e => {
            console.log(e);
        });
        dispatcher.on("finish", end => {
            gamingChannel.leave();
        });
    }).catch(e => {
        console.log(e);
    });
}

function stopmusic() {
    let gamingChannel = bot.channels.cache.get(auth.GamingID);
    gamingChannel.leave();
}

function pausemusic() {
    if (dispatcher) {
        dispatcher.pause();
    }
}

function resumemusic() {
    if (dispatcher) {
        dispatcher.resume();
    }
}

function setvolume(volume) {
    if (dispatcher) {
        dispatcher.setVolume(volume);
    }
}


async function getYoutubeId(title) {
    let search = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${title}&key=${auth.googleToken}`).then(res => res.json());

    if (!search || !search.items || !search.items.length) return;

    return search.items[0].id.videoId;
}

//automatically poll general channel at Noon
if (schedulePoll) {
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
}


async function generatePoll(message) {
    let name = "Movies: \n";
    let opt1 = {}, opt2 = {}, opt3 = {}, opt4 = {};
    if (message.content.startsWith("/poll")) {
        let regex = /\w+|"[^"]+"/g;
        let words = message.content.match(regex);
        name = words[1].replace(/\"/g, '') + ": \n";
        opt1.title = words[2].replace(/\"/g, '');
        opt2.title = words[3].replace(/\"/g, '');
        opt3.title = words[4].replace(/\"/g, '');
        opt4.title = words[5].replace(/\"/g, '');
    } else {
        var moviesChannel = bot.channels.cache.get(auth.MovieID);
        let movies = await lots_of_messages_getter(moviesChannel);
        let titles = [];
        movies.forEach(movie => {
            let platform = "";
            let count = 0;
            movie.reactions.cache.forEach(reaction => {
                if (reaction._emoji.name == '😍') {
                    platform = "N";
                } else if (reaction._emoji.name == '😆') {
                    platform = "D+";
                } else if (reaction._emoji.name == '👍') {
                    count = reaction.count;
                }
            });
            if (platform && platform != "") {
                titles.push({
                    title: movie.content,
                    platform
                });
                //add multiple ballots for liked movies
                for (let i = 0; i < count; i++) {
                    titles.push({
                        title: movie.content,
                        platform
                    });
                }
            }
        });

        //get 4 unique movies
        while(opt1.title == opt2.title || opt1.title == opt3.title || opt1.title == opt4.title || opt2.title == opt3.title || opt2.title == opt4.title || opt3.title == opt4.title) {
            opt1 = titles[Math.floor(Math.random()*titles.length)];
            opt2 = titles[Math.floor(Math.random()*titles.length)];
            opt3 = titles[Math.floor(Math.random()*titles.length)];
            opt4 = titles[Math.floor(Math.random()*titles.length)];
        }
    }

    opt1.details = await getMovieDetails(opt1.title);
    opt2.details = await getMovieDetails(opt2.title);
    opt3.details = await getMovieDetails(opt3.title);
    opt4.details = await getMovieDetails(opt4.title);

    if (message) {
        message.channel.send(name + ":regional_indicator_a: " + opt1.title +  (opt1.platform ? (" | " + opt1.platform + " | ") : " | ") + (opt1.details.Runtime ? opt1.details.Runtime : "N/A") + " | " + (opt1.details.imdbRating ? opt1.details.imdbRating : "N/A") +  "\n" 
            + ":regional_indicator_b: " + opt2.title + (opt2.platform ? (" | " + opt2.platform + " | ") : " | ")  + (opt2.details.Runtime ? opt2.details.Runtime : "N/A") + " | " + (opt2.details.imdbRating ? opt2.details.imdbRating : "N/A")  +  "\n" 
            + ":regional_indicator_c: " + opt3.title + (opt3.platform ? (" | " + opt3.platform + " | ") : " | ")  + (opt3.details.Runtime ? opt3.details.Runtime : "N/A") + " | " + (opt3.details.imdbRating ? opt3.details.imdbRating : "N/A") +  "\n"
            + ":regional_indicator_d: " + opt4.title + (opt4.platform ? (" | " + opt4.platform + " | ") : " | ")  + (opt4.details.Runtime ? opt4.details.Runtime : "N/A") + " | " + (opt4.details.imdbRating ? opt4.details.imdbRating : "N/A") +  "\n").then(message => {
                message.react('🇦');
                message.react('🇧');
                message.react('🇨');
                message.react('🇩');
            });
    } else {
        let general = bot.channels.cache.get(auth.GeneralID);
        general.send(name + ":regional_indicator_a: " + opt1.title +  (opt1.platform ? (" | " + opt1.platform + " | ") : " | ") + (opt1.details.Runtime ? opt1.details.Runtime : "N/A") + " | " + (opt1.details.imdbRating ? opt1.details.imdbRating : "N/A") +  "\n" 
        + ":regional_indicator_b: " + opt2.title + (opt2.platform ? (" | " + opt2.platform + " | ") : " | ")  + (opt2.details.Runtime ? opt2.details.Runtime : "N/A") + " | " + (opt2.details.imdbRating ? opt2.details.imdbRating : "N/A")  +  "\n" 
        + ":regional_indicator_c: " + opt3.title + (opt3.platform ? (" | " + opt3.platform + " | ") : " | ")  + (opt3.details.Runtime ? opt3.details.Runtime : "N/A") + " | " + (opt3.details.imdbRating ? opt3.details.imdbRating : "N/A") +  "\n"
        + ":regional_indicator_d: " + opt4.title + (opt4.platform ? (" | " + opt4.platform + " | ") : " | ")  + (opt4.details.Runtime ? opt4.details.Runtime : "N/A") + " | " + (opt4.details.imdbRating ? opt4.details.imdbRating : "N/A") +  "\n").then(message => {
            message.react('🇦');
            message.react('🇧');
            message.react('🇨');
            message.react('🇩');
        });
    }
}

function gulag() {
    let gulagChannel = bot.channels.cache.get(auth.GulagID);
    gulagChannel.join().then(connection => {
        const dispatcher = connection.play("./gulag.mp3", {volume: 0.5});
        dispatcher.on("finish", end => {
            gulagChannel.leave();
        });
    }).catch(e => {
        console.log(e);
    });
}

async function generatePollWithGenre(message, genre) {
    var moviesChannel = bot.channels.cache.get(auth.MovieID);
    let movies = await lots_of_messages_getter(moviesChannel);
    let titles = [];

    movies.forEach(movie => {
        let platform = "";
        let count = 0;
        movie.reactions.cache.forEach(reaction => {
            if (reaction._emoji.name == '😍') {
                platform = "N";
            } else if (reaction._emoji.name == '😆') {
                platform = "D+";
            } else if (reaction._emoji.name == '👍') {
                count = reaction.count;
            }
        });

        if (platform && platform != "") {
            titles.push({
                title: movie.content,
                platform
            });
        }
    });

    let genreMovies = [];
    for (let i = 0; i < titles.length; i++) {
        let details = await getMovieDetails(titles[i].title);
        if (details.Genre && details.Genre.toLowerCase().includes(genre)) {
            genreMovies.push({
                ...titles[i],
                details
            });
        }
    }
    if (genreMovies.length >= 4) {
        //get 4 unique movies
        let opt1 = 0, opt2 = 0, opt3 = 0, opt4 = 0;
        while(opt1.title == opt2.title || opt1.title == opt3.title || opt1.title == opt4.title || opt2.title == opt3.title || opt2.title == opt4.title || opt3.title == opt4.title) {
            opt1 = genreMovies[Math.floor(Math.random()*genreMovies.length)];
            opt2 = genreMovies[Math.floor(Math.random()*genreMovies.length)];
            opt3 = genreMovies[Math.floor(Math.random()*genreMovies.length)];
            opt4 = genreMovies[Math.floor(Math.random()*genreMovies.length)];
        }

        message.channel.send(capitalize(genre) + " Movies: \n" + ":regional_indicator_a: " + opt1.title + " | " + opt1.platform + " | " + (opt1.details.Runtime ? opt1.details.Runtime : "N/A") + " | " + (opt1.details.imdbRating ? opt1.details.imdbRating : "N/A") +  "\n" 
        + ":regional_indicator_b: " + opt2.title + " | " + opt2.platform + " | " + (opt2.details.Runtime ? opt2.details.Runtime : "N/A") + " | " + (opt2.details.imdbRating ? opt2.details.imdbRating : "N/A")  +  "\n" 
        + ":regional_indicator_c: " + opt3.title + " | " + opt3.platform + " | " + (opt3.details.Runtime ? opt3.details.Runtime : "N/A") + " | " + (opt3.details.imdbRating ? opt3.details.imdbRating : "N/A") +  "\n"
        + ":regional_indicator_d: " + opt4.title + " | " + opt4.platform + " | " + (opt4.details.Runtime ? opt4.details.Runtime : "N/A") + " | " + (opt4.details.imdbRating ? opt4.details.imdbRating : "N/A") +  "\n").then(message => {
            message.react('🇦');
            message.react('🇧');
            message.react('🇨');
            message.react('🇩');
        });

    } else {
        let response = capitalize(genre) + " Movies: \n";
        let indicators = [":regional_indicator_a: ", ":regional_indicator_b: ", ":regional_indicator_c: ", ":regional_indicator_d: "];
        genreMovies.forEach((movie, index) => {
            response += indicators[index] + movie.title + " | " + movie.platform + " | " + (movie.details.Runtime ? movie.details.Runtime : "N/A") + " | " + (movie.details.imdbRating ? movie.details.imdbRating : "N/A") +  "\n";
        });
        message.channel.send(response).then(message => {
            message.react('🇦');
            message.react('🇧');
            message.react('🇨');
            message.react('🇩');
        });
    }
}

async function sendMovieDetails(message) {
    let title = message.content.substr(9);
    let details = await getMovieDetails(title);
    if (details && details.Title) {
        let response = "";
        let keys = Object.keys(details);
        let values = Object.values(details);
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] === "Ratings") {
                values[i].forEach(rating => {
                    response += rating.Source + ": " + rating.Value + "\n";
                });
            } else {
                response += keys[i] + ": "  + values[i] + "\n";
            }
        }
        message.channel.send(response);
    } else {
        message.channel.send("Movie Not Found");
    }
}

async function getMovieDetails(title) {
    let search = await fetch(`http://www.omdbapi.com/?s=${title}&apikey=${auth.OMDB_API_KEY}`).then(res => res.json());
    let id = "";
    if (search && search.Search) {
        search.Search.forEach(movie => {
            if (movie.Title.toLowerCase() === title.toLowerCase() && id == "") {
                id = movie.imdbID;
            }
        });
    }
    if (id) {
        return await fetch(`http://www.omdbapi.com/?i=${id}&apikey=${auth.OMDB_API_KEY}`).then(res => res.json());
    } else {
        return {};
    }
}

//https://flaviocopes.com/how-to-uppercase-first-letter-javascript/
const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
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
