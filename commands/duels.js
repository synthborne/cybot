const { EmbedBuilder } = require('discord.js');
const User = require('../models/User.js');
const Duel = require('../models/Duel.js');

async function giveProblem(duel_user1, duel_user2, required_rating, min_contestId, message){
    const user1 = await User.findOne({ discordId:duel_user1.discordId1 });
    const user2 = await User.findOne({ discordId:duel_user2.discordId2 });

    const prob_response = await fetch('https://codeforces.com/api/problemset.problems?');
    const prob_data = await prob_response.json();

    if(prob_data.status === 'FAILED'){
        await Duel.deleteOne({ discordId1: message.author.id });
        await Duel.deleteOne({ discordId1: duel_user1.discordId2 });

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription('Server error! There is nothing you can do right now.');
        await message.channel.send({embeds: [embed]});  
        return [-1];
    }

    let problem_list = [];
    for(let i = 0; i < prob_data.result.problems.length; i++){
        const rating = parseInt(prob_data.result.problems[i].rating);
        const contest_id = parseInt(prob_data.result.problems[i].contestId);
        if(isNaN(rating)) continue;

        if(rating === required_rating && contest_id >= min_contestId){
            problem_list.push(prob_data.result.problems[i]);
        }
    }
    let len = problem_list.length;
    if(len === 0){
        await Duel.deleteOne({ discordId1: message.author.id });
        await Duel.deleteOne({ discordId1: duel_user1.discordId2 });

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription('No problems found. Try entering correct arguments for rating and contestId.');
        await message.channel.send({embeds: [embed]});
        return [-1];
    }

    const cf_user1 = user1.handle;
    const sub_response1 = await fetch(`https://codeforces.com/api/user.status?handle=${cf_user1}&from=1&count=5000`);
    const sub_data1 = await sub_response1.json();

    const cf_user2 = user2.handle;
    const sub_response2 = await fetch(`https://codeforces.com/api/user.status?handle=${cf_user2}&from=1&count=5000`);
    const sub_data2 = await sub_response2.json();

    for(let i = 0; i < 500; i++){
        let index = Math.floor(Math.random() * (len - 1));
        const problem = problem_list[index];
        const problem_name = problem.name;
        const problem_index = problem.index;
        const problem_contestId = problem.contestId;
        let success1 = true, success2 = true;

        for(let j = 0; j < sub_data1.result.length; j++){
            const sub_index = sub_data1.result[j].problem.index;
            const sub_contestId = sub_data1.result[j].problem.contestId;

            if(sub_index === problem_index && sub_contestId === problem_contestId) success1 = false;
        }

        for(let j = 0; j < sub_data2.result.length; j++){
            const sub_index = sub_data2.result[j].problem.index;
            const sub_contestId = sub_data2.result[j].problem.contestId;

            if(sub_index === problem_index && sub_contestId === problem_contestId) success2 = false;
        }

        if(success1 && success2){
            await Duel.updateOne(
                { discordId1: duel_user1.discordId1 },
                { $set: {contestId: problem_contestId, index: problem_index}}
            );
            await Duel.updateOne(
                { discordId1: duel_user2.discordId1 },
                { $set: {contestId: problem_contestId, index: problem_index}}
            );
            console.log('uppper');
            console.log(problem_contestId);
            console.log(problem_index);
            return [problem_contestId, problem_index, problem_name];
        }
    }
}
 
async function duelCommand(command, message, client) {

    const user1 = await User.findOne({ discordId: message.author.id });
    if(user1 === null){
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription('Your handle not found in the database.');
        await message.channel.send({embeds: [embed]});  
        return;
    }

    if(command.length >= 4 && command[1] === 'start'){
        const firstMention = message.mentions.users.first();
        if(!firstMention){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription('Who are you trying to duel against?');
            await message.channel.send({embeds: [embed]});
            return;
        }

        const user2 = await User.findOne({ discordId: firstMention.id });
        if(user2 === null){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`Opponent's handle not found in the database.`);
            await message.channel.send({embeds: [embed]});  
            return;
        }

        if(message.author.id === firstMention.id){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`Do not even think about crashing this bot with edge cases.`);
            await message.channel.send({embeds: [embed]});  
            return;
        }

        const duel_user1 = await Duel.findOne({ discordId1: message.author.id });
        const duel_user2 = await Duel.findOne({ discordId1: firstMention.id });
        
        if(duel_user1 !== null){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`You are currently in a duel, challenging someone or being challenged.`);
            await message.channel.send({embeds: [embed]}); 
            return;
        }

        if(duel_user2 !== null){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`Your opponent is currently in a duel, challenging someone or being challenged.`);
            await message.channel.send({embeds: [embed]});
            return;
        }

        let required_rating = 0;
        let min_contestId = 0;
        if(command.length >= 4) required_rating = parseInt(command[2]);
        if(command.length >= 5) min_contestId = parseInt(command[3]);

        await Duel.create({
            discordId1: message.author.id,
            discordId2: firstMention.id,
            status: 'CHALLENGER',
            rating: required_rating,
            min_contestId: min_contestId
        })
        await Duel.create({
            discordId1: firstMention.id,
            discordId2: message.author.id,
            status: 'CHALLENGED',
            rating: required_rating,
            min_contestId: min_contestId
        })

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription(`Duel initiated.`);
        await message.channel.send({embeds: [embed]});
    }

    if(command.length === 2 && command[1] === 'accept'){
        const duel_user1 = await Duel.findOne({ discordId1: message.author.id });
        if(duel_user1 === null){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`You are currently not in a duel.`);
            await message.channel.send({embeds: [embed]});
            return;
        }

        const duel_user2 = await Duel.findOne({ discordId1: duel_user1.discordId2});

        if(duel_user1.status === 'CHALLENGED'){
            await Duel.updateOne(
                { discordId1: message.author.id },
                { $set: {status: 'ONGOING'}}
            );
            await Duel.updateOne(
                { discordId1: duel_user1.discordId2 },
                { $set: {status: 'ONGOING'}}
            );
            const info = await giveProblem(duel_user1, duel_user2, duel_user1.rating, duel_user1.min_contestId, message);
            if(info[0] === -1) return;

            const link = `https://codeforces.com/problemset/problem/${info[0]}/${info[1]}`;
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`Good luck: [${info[2]}](${link})`);
            await message.channel.send({embeds: [embed]});
        }
        
        else if(duel_user1.status === 'ONGOING' && duel_user2.draw_status){
            await Duel.deleteOne({ discordId1: message.author.id });
            await Duel.deleteOne({ discordId1: duel_user1.discordId2 });

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`Handshakes please!`);
            await message.channel.send({embeds: [embed]});
        }
        
        else{
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`You are not being challenged or offered a draw.`);
            await message.channel.send({embeds: [embed]});
        }
    }

    if(command.length === 2 && command[1] === 'reject'){
        const duel_user1 = await Duel.findOne({ discordId1: message.author.id });
        if(duel_user1 === null){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`You are currently not in a duel.`);
            await message.channel.send({embeds: [embed]});
            return;
        }
        
        const duel_user2 = await Duel.findOne({ discordId1: duel_user1.discordId2});

        if(duel_user1.status === 'CHALLENGED'){
            await Duel.deleteOne({ discordId1: message.author.id });
            await Duel.deleteOne({ discordId1: duel_user1.discordId2 });

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`Duel challenge refused.`);
            await message.channel.send({embeds: [embed]});
        }

        else if(duel_user1.status === 'ONGOING' && duel_user2.draw_status){
            await Duel.updateOne(
                { discordId1: duel_user1.discordId2 },
                { $set: {draw_status: false}}
            );

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`Draw offer refused.`);
            await message.channel.send({embeds: [embed]});
        }

        else{
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`You are not being challenged or offered a draw.`);
            await message.channel.send({embeds: [embed]});
        }
    }

    if(command.length === 2 && command[1] === 'withdraw'){
        const duel_user1 = await Duel.findOne({ discordId1: message.author.id });
        if(duel_user1 === null){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`You are currently not in a duel.`);
            await message.channel.send({embeds: [embed]});
            return;
        }
        
        if(duel_user1.status === 'CHALLENGER'){
            await Duel.deleteOne({ discordId1: message.author.id });
            await Duel.deleteOne({ discordId1:duel_user1.discordId2 });

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`Challenge withdrawn.`);
            await message.channel.send({embeds: [embed]});
        }
        
        else if(duel_user1.status === 'ONGOING' && duel_user1.draw_status){
            await Duel.updateOne(
                { discordId1: message.author.id },
                { $set: {draw_status: false}}
            );

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`Draw withdrawn.`);
            await message.channel.send({embeds: [embed]});
        }

        else{
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`You are not currently offering a challenge or a draw.`);
            await message.channel.send({embeds: [embed]});
        }
    }

    if(command.length === 2 && command[1] === 'draw'){
        const duel_user1 = await Duel.findOne({ discordId1: message.author.id });
        if(duel_user1 === null){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`You are currently not in a duel.`);
            await message.channel.send({embeds: [embed]});
            return;
        }

        if(duel_user1.status === 'ONGOING'){
            await Duel.updateOne(
                { discordId1: message.author.id },
                { $set: {draw_status: true}}
            );

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`Draw offered.`);
            await message.channel.send({embeds: [embed]});
        }

        else{
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`You are currently not in an ongoing duel.`);
            await message.channel.send({embeds: [embed]});
        }
    }

    if(command.length === 2 && command[1] === 'status'){
        const duel_user1 = await Duel.findOne({ discordId1: message.author.id });
        if(duel_user1 === null){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`You are currently not in a duel.`);
            await message.channel.send({embeds: [embed]});
            return;
        }
        
        const user = await client.users.fetch(duel_user1.discordId2);
        if(duel_user1.status === 'ONGOING'){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`You are currently in a duel with ${user.username}.`);
            await message.channel.send({embeds: [embed]});
        }

        if(duel_user1.status === 'CHALLENGER'){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`You are currently challenging ${user.username} to a duel.`);
            await message.channel.send({embeds: [embed]});
        }

        if(duel_user1.status === 'CHALLENGED'){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`You are currently being challenged by ${user.username} for a duel.`);
            await message.channel.send({embeds: [embed]});
        }
    }

    if(command.length === 2 && command[1] === 'complete'){
        const duel_user1 = await Duel.findOne({ discordId1: message.author.id });
        if(duel_user1 === null || duel_user1.status !== 'ONGOING'){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`You are currently not in any ongoing duel.`);
            await message.channel.send({embeds: [embed]});
            return;
        }

        const user = await User.findOne({ discordId: duel_user1.discordId1 });
        const cf_user = user.handle;
        const sub_response = await fetch(`https://codeforces.com/api/user.status?handle=${cf_user}&from=1&count=1`);
        const sub_data = await sub_response.json();

        const sub_index = sub_data.result[0].problem.index;
        const sub_contestId = sub_data.result[0].problem.contestId;
        const sub_time = sub_data.result[0].creationTimeSeconds;
        const verdict = sub_data.result[0].verdict;

        if(sub_index === duel_user1.index && sub_contestId === duel_user1.contestId && verdict === 'OK'){

            let timeTaken = sub_time * 1000 - duel_user1.createdAt;
            timeTaken = Math.floor(timeTaken / 1000);
            let hours = Math.floor(timeTaken / 3600);
            timeTaken %= 3600;
            let minutes = Math.floor(timeTaken / 60);
            timeTaken %= 60;

            hours = hours.toString();
            minutes = minutes.toString();
            timeTaken = timeTaken.toString();

            if(minutes.length === 1) minutes = '0' + minutes;
            if(timeTaken.length === 1) timeTaken = '0' + timeTaken;

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription(`${user.handle} wins!\n
                                Time taken: ${hours}:${minutes}:${timeTaken}`);
            await message.channel.send({embeds: [embed]});

            await Duel.deleteOne({ discordId1: duel_user1.discordId1});
            await Duel.deleteOne({ discordId1: duel_user1.discordId2});
        }
        else{
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription('What are you up to? Trying to trick the bot? Solve the problem first.')
            await message.channel.send({embeds: [embed]});
        }
    }
}

module.exports = duelCommand;
