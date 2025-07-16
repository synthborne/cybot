const { EmbedBuilder } = require('discord.js');
const Contest = require('../models/Contest.js');
const User = require('../models/User.js');
const { resetUserDatabase } = require('./reset_db.js');

const roleId = '1394364111709536396';
const channelId = '1394761312210522132';

function formatTime(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);

    const timeOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    };

    const day = date.toLocaleString('en-IN', { day: 'numeric', timeZone: 'Asia/Kolkata' });
    const month = date.toLocaleString('en-IN', { month: 'long', timeZone: 'Asia/Kolkata' });
    const year = date.toLocaleString('en-IN', { year: 'numeric', timeZone: 'Asia/Kolkata' });

    const formattedDate = `${day} ${month} ${year}`;
    const formattedTime = date.toLocaleString('en-IN', timeOptions);

    return `${formattedDate}, ${formattedTime} (IST)`;
}

async function upcomingContests(){
    const response = await fetch('https://codeforces.com/api/contest.list');
    const data = await response.json();

    if(data.status === 'FAILED') return;

    for(let i = 0; i < 50; i++){
        const contest_id = data.result[i].id;
        const contest_name = data.result[i].name;
        const contest_phase = data.result[i].phase;
        if(contest_phase === 'BEFORE'){
            const contest = await Contest.findOne({ contestId: contest_id });
            if(contest === null){
                await Contest.create({
                    contestId: contest_id,
                    name: contest_name,
                    phase: contest_phase,
                })
            }
        }
    }
}

async function contestReminder(client) {
    const response = await fetch('https://codeforces.com/api/contest.list');
    const data = await response.json();

    if(data.status === 'FAILED') return;

    for(let i = 0; i < 50; i++){
        const contest_id = data.result[i].id;
        const contest_name = data.result[i].name;
        const contest_phase = data.result[i].phase;
        const contest_unix = data.result[i].startTimeSeconds;
        const contest_time = data.result[i].relativeTimeSeconds;

        if(contest_phase === 'BEFORE' && Math.abs(contest_time) <= 3600){
            const contest = await Contest.findOne({ contestId: contest_id });
            if(contest === null) continue;
            if(contest.announce2 === true) continue;

            const targetChannel = await client.channels.fetch(channelId);
            await targetChannel.send({
                content: `<@&${roleId}> ${contest_name} is starting soon. Get ready to gamble some rating.`,
                allowedMentions: {
                    roles: [roleId]
                }
            });

            await Contest.updateOne(
                { contestId: contest_id },
                { $set: {announce2: true}}
            );
        }

        if(contest_phase === 'BEFORE' && Math.abs(contest_time) <= 86400){
            const contest = await Contest.findOne({ contestId: contest_id });
            if(contest === null) continue;
            if(contest.announce1 === true) continue;

            const targetChannel = await client.channels.fetch(channelId);
            await targetChannel.send({
                content: `<@&${roleId}> ${contest_name} starts on ${formatTime(contest_unix)}.`,
                allowedMentions: {
                    roles: [roleId]
                }
            });

            await Contest.updateOne(
                { contestId: contest_id },
                { $set: {announce1: true}}
            );
        }
    }
}

async function standingsDisplay(client) {
    const response = await fetch('https://codeforces.com/api/contest.list');
    const data = await response.json();

    if(data.status === 'FAILED') return;

    for(let i = 0; i < 50; i++){
        const contest_id = data.result[i].id;
        const contest_name = data.result[i].name;
        const contest_phase = data.result[i].phase;

        if(contest_phase === 'FINISHED'){
            const contest = await Contest.findOne({ contestId: contest_id });
            if(contest === null) continue;
            if(contest.display === true) continue;

            const standings_link = `https://codeforces.com/api/contest.standings?contestId=${contest_id}&from=1&count=50000&showUnofficial=true`;
            const standings_response = await fetch(`${standings_link}`);
            const standings_data = await standings_response.json();

            if(standings_data.status === 'FAILED') continue;

            const ranklist = [];
            const users = await User.find({});
            for(let i = 0; i < standings_data.result.rows.length; i++){
                const contest_handle = standings_data.result.rows[i].party.members[0].handle;
                const contest_rank = standings_data.result.rows[i].rank;
                const contest_score = standings_data.result.rows[i].points

                let success = false;
                for(let j = 0; j < users.length; j++){
                    if(users[j].handle === contest_handle) success = true;
                }
                if(success){
                    ranklist.push({
                        user: contest_handle,
                        score: contest_score,
                        rank: contest_rank
                    })
                }
            }

            const targetChannel = await client.channels.fetch(channelId);
            await targetChannel.send({
                content: `<@&${roleId}> Contest standings for ${contest_name}.`,
                allowedMentions: {
                    roles: [roleId]
                }
            });

            let standingsText = '```\n';
            standingsText += 'Handle         Points   Rank\n\n';
            for (const entry of ranklist) {
                const { user, score, rank } = entry;
                standingsText += `${user.padEnd(15)}${score.toString().padEnd(9)}${rank}\n`;
            }
            standingsText += '```';

            const embed = new EmbedBuilder()
                .setTitle('Contest Standings')
                .setColor(0x5865F2)
                .setDescription(standingsText);

            await targetChannel.send({ embeds: [embed] });

            await Contest.updateOne(
                { contestId: contest_id },
                { $set: {display: true}}
            );
        }
    }
}

async function ratingUpdate(client) {
    const contests = await Contest.find({});

    for(let i = 0; i < contests.length; i++){
        const response = await fetch(`https://codeforces.com/api/contest.ratingChanges?contestId=${contests[i].contestId}`);
        const data = await response.json();

        if(data.status === 'FAILED') continue;
        if(data.result.length === 0) continue;

        let ranklist = [];
        await resetUserDatabase(client);
        const users = await User.find({});
        for(let j = 0; j < data.result.length; j++){
            const obj = {};
            let success = false;
            for(let k = 0; k < users.length; k++){
                if(data.result[j].handle === users[k].handle) {
                    obj.newRating = users[k].curRating;
                    success = true;
                    break;
                }
            }
            if(success){
                obj.user = data.result[j].handle;
                obj.rank = data.result[j].rank;
                obj.delta = data.result[j].newRating - data.result[j].oldRating;
                ranklist.push(obj);
            }
        }
        
        const targetChannel = await client.channels.fetch(channelId);
        await targetChannel.send({
            content: `<@&${roleId}> Contest rating changes for ${contests[i].name} is live. Lets see who bricked in this contest.`,
            allowedMentions: {
                roles: [roleId]
            }
        });

        let standingsText = '```\n';
        standingsText += 'Handle         Rank   Delta   NewRating\n\n';
        for (const entry of ranklist) {
            const { user, rank, delta, newRating } = entry;
            const deltaStr = (delta > 0 ? '+' : '') + delta;
            standingsText += `${user.padEnd(15)}${rank.toString().padEnd(7)}${deltaStr.padEnd(8)}${newRating}\n`;
        }
        standingsText += '```';

        const embed = new EmbedBuilder()
            .setTitle('Contest Rating Changes')
            .setColor(0x5865F2)
            .setDescription(standingsText);
        await targetChannel.send({ embeds: [embed] })

        await Contest.deleteOne({ contestId: contests[i].contestId });
    }
}

module.exports = {
    upcomingContests,
    contestReminder,
    standingsDisplay,
    ratingUpdate,
};
