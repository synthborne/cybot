const User = require('../models/User.js');
const { EmbedBuilder } = require('discord.js');
const roleAssign = require('./role_assign.js');

async function handleCommand(command, message){
    if(command.length === 3 && command[1] === 'identify'){
        const cf_user = command[2];
        const user_response = await fetch(`https://codeforces.com/api/user.info?handles=${cf_user}`);
        const user_data = await user_response.json();

        if(user_data.status === 'FAILED'){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription('Incorrect handle/Server error. Try again!');
            await message.channel.send({embeds: [embed]});
            return;
        }
        
        const user = await User.findOne({ discordId: message.author.id });
        if(user === null){
            const prob_response = await fetch('https://codeforces.com/api/problemset.problems?tags=bitmasks');
            const prob_data = await prob_response.json();
            const len = prob_data.result.problems.length;
            const index = Math.floor(Math.random() * (len - 1));

            const contest_id = prob_data.result.problems[index].contestId;
            const prob_index = prob_data.result.problems[index].index;
            const link = `https://codeforces.com/contest/${contest_id}/problem/${prob_index}`;
            
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`Submit a compilation error to [problem](${link}) within 60 seconds.`);
            await message.channel.send({embeds: [embed]});

            let counter = 0;
            const intervalId = setInterval(async () => {
                const sub_response = await fetch(`https://codeforces.com/api/user.status?handle=${cf_user}&from=1&count=1`)
                const sub_data = await sub_response.json();
                counter++;

                if( sub_data.status === 'OK' && 
                    sub_data.result[0].problem.contestId === contest_id && 
                    sub_data.result[0].problem.index === prob_index && 
                    sub_data.result[0].verdict === 'COMPILATION_ERROR')
                {
                    const embed = new EmbedBuilder()
                        .setColor(0x5865F2)
                        .setDescription('Good job! Welcome to the hood.');
                    await message.channel.send({embeds: [embed]});

                    const guild = message.guild;
                    const member = await guild.members.fetch(message.author.id);
                    const role = await guild.roles.fetch(roleAssign(user_data.result[0].maxRating));
                    await member.roles.add(role);

                    await User.create({
                        discordId: message.author.id,
                        handle: user_data.result[0].handle,
                        rating: user_data.result[0].maxRating,
                        curRating : user_data.result[0].rating,
                        points: 0
                    });
                    clearInterval(intervalId);
                }

                if(counter === 12){
                    const embed = new EmbedBuilder()
                        .setColor(0x5865F2)
                        .setDescription('You ran out of time. Just how you do in contests.');
                    await message.channel.send({embeds: [embed]});
                    clearInterval(intervalId);
                }
            }, 5000);
        }
        else{
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription('This account is already linked to the server.');
            await message.channel.send({embeds: [embed]});
        }
    }

    if(command.length === 3 && command[1] === 'info'){
        let cf_user;
        const firstMention = message.mentions.users.first();
        if(firstMention){
            const user = await User.findOne({ discordId: firstMention.id });
            if(user === null){
                const embed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setDescription('The mentioned user not found in the database.');
                await message.channel.send({embeds: [embed]});
                return;
            }
            cf_user = user.handle;
        }
        else cf_user = command[2];

        const user_response = await fetch(`https://codeforces.com/api/user.info?handles=${cf_user}`);
        const user_data = await user_response.json();

        if(user_data.status === 'FAILED'){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription('Incorrect handle/Server error. Try again!');
            await message.channel.send({embeds: [embed]});
            return;
        }
        
        const rating_response = await fetch(`https://codeforces.com/api/user.rating?handle=${cf_user}`);
        const rating_data = await rating_response.json();

        const sub_response = await fetch(`https://codeforces.com/api/user.status?handle=${cf_user}&from=1&count=5000`);
        const sub_data = await sub_response.json();

        let highestDelta = 0, lowestDelta = 0, bestRank = 50000;
        let maxSolved_practice = 0, maxSolved_contest = 0;
        let avgSolved_practice = 0, avgSolved_contest = 0;
        let solved_practice = 0, solved_contest = 0;
        let problems_solved = 0;

        for(let i = 6; i < rating_data.result.length; i++){
            highestDelta = Math.max(highestDelta, rating_data.result[i].newRating - rating_data.result[i].oldRating);
            lowestDelta = Math.min(lowestDelta, rating_data.result[i].newRating - rating_data.result[i].oldRating);
            bestRank = Math.min(bestRank, rating_data.result[i].rank);
        }

        for(let i = 0; i < sub_data.result.length; i++){
            if(sub_data.result[i].verdict === 'OK'){
                const rating = sub_data.result[i].problem.rating;
                const type = sub_data.result[i].author.participantType;

                if(type === 'CONTESTANT' && rating !== undefined){
                    maxSolved_contest = Math.max(maxSolved_contest, rating);
                    avgSolved_contest += rating;
                    solved_contest++;
                }

                if(type === 'PRACTICE' && rating !== undefined){
                    maxSolved_practice = Math.max(maxSolved_practice, rating);
                    avgSolved_practice += rating;
                    solved_practice++;
                }
                problems_solved++;
            }
        }
        avgSolved_contest /= solved_contest;
        avgSolved_practice /= solved_practice;

        const embed = new EmbedBuilder()
            .setTitle('User Info')
            .setColor(0x5865F2)
            .setDescription(
                '**General Info**\n' +
                '```' +
                `Username:        ${user_data.result[0].handle}\n` +
                `Current Rating:  ${user_data.result[0].rating}\n` +
                `Peak Rating:     ${user_data.result[0].maxRating}\n` +
                `Peak Rank:       ${user_data.result[0].maxRank}\n` +
                `Friends:         ${user_data.result[0].friendOfCount}\n` +
                '```\n' +
                '**Contest Stats (excludes first 6 contests)**\n' +
                '```' +
                `Best Rank:           ${bestRank}\n` +
                `Highest Delta:       ${highestDelta}\n` +
                `Lowest Delta:        ${lowestDelta}\n` +
                '```\n' +
                '**Problem Stats**\n' +
                '```' +
                `Problems solved:          ${problems_solved}\n` +
                `Max Solved (contest):     ${maxSolved_contest}\n` +
                `Max Solved (practice):    ${maxSolved_practice}\n` +
                `Avg Solved (contest):     ${avgSolved_contest.toFixed(2)}\n` +
                `Avg Solved (practice):    ${avgSolved_practice.toFixed(2)}\n` +
                '```'
            );
        await message.channel.send({embeds: [embed]});  
    }

    if(command.length === 2 && command[1] === 'reset'){
        const user = await User.findOne({ discordId: message.author.id });
        if(user === null){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription('Handle not found in the database.');
            await message.channel.send({embeds: [embed]});  
        }
        else{
            await User.deleteOne({ discordId: message.author.id });
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription('Handle deleted from the database.');
            await message.channel.send({embeds: [embed]});  
        }
    }
}

module.exports = handleCommand;