const { EmbedBuilder} = require('discord.js');
const User = require('../models/User.js');
const Practice = require('../models/Practice.js');

async function practiceCommand(command, message){

    const user = await User.findOne({ discordId: message.author.id });
    if(user === null){
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription('Handle not found in the database.');
        await message.channel.send({embeds: [embed]});  
        return;
    }

    if(command.length === 2 && command[1] === 'complete'){
        const practice_user = await Practice.findOne({ discordId: message.author.id });
        if(practice_user === null){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription('You do not have an ongoing practice problem.');
            await message.channel.send({embeds: [embed]});
            return;
        }

        const cf_user = user.handle;
        const sub_response = await fetch(`https://codeforces.com/api/user.status?handle=${cf_user}&from=1&count=1`);
        const sub_data = await sub_response.json();
        
        const sub_index = sub_data.result[0].problem.index;
        const sub_contestId = sub_data.result[0].problem.contestId;
        const sub_time = sub_data.result[0].creationTimeSeconds;
        const verdict = sub_data.result[0].verdict;
        const points = practice_user.points;

        if(sub_index === practice_user.index && sub_contestId === practice_user.contestId && verdict === 'OK'){

            let timeTaken = sub_time * 1000 - practice_user.createdAt;
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
                .setDescription(`I expected nothing less. Good job!\n
                                Time taken: ${hours}:${minutes}:${timeTaken}
                                Received *Getgud* points: +${points}`);
            await message.channel.send({embeds: [embed]});

            await User.updateOne({ handle: user.handle }, { $inc: { points: points } });
        }
        else{
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription('I did not have any hopes either.')
            await message.channel.send({embeds: [embed]});
        }

        await Practice.deleteOne({ discordId: message.author.id });
    }

    else if(command.length >= 2){

        const practice_user = await Practice.findOne({ discordId: message.author.id });
        if(practice_user !== null){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription('You already have an ongoing practice problem. Resolve it first.');
            await message.channel.send({embeds: [embed]});
            return;
        }

        const prob_response = await fetch('https://codeforces.com/api/problemset.problems?');
        const prob_data = await prob_response.json();

        if(prob_data.status === 'FAILED'){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription('Server error! There is nothing you can do right now.');
            await message.channel.send({embeds: [embed]});  
            return;
        }

        let required_rating = 0;
        let min_contestId = 0;
        if(command.length >= 2) required_rating = parseInt(command[1]);
        if(command.length >= 3) min_contestId = parseInt(command[2]);

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
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription('No problems found. Try entering correct arguments for rating and contestId.');
            await message.channel.send({embeds: [embed]});
            return;
        }

        const cf_user = user.handle;
        const sub_response = await fetch(`https://codeforces.com/api/user.status?handle=${cf_user}&from=1&count=5000`);
        const sub_data = await sub_response.json();

        for(let i = 0; i < 200; i++){
            let index = Math.floor(Math.random() * (len - 1));
            const problem = problem_list[index];
            const problem_name = problem.name;
            const problem_index = problem.index;
            const problem_contestId = problem.contestId;
            let success = true;

            for(let j = 0; j < sub_data.result.length; j++){
                const sub_index = sub_data.result[j].problem.index;
                const sub_contestId = sub_data.result[j].problem.contestId;

                if(sub_index === problem_index && sub_contestId === problem_contestId) success = false;
            }

            if(success){
                const link = `https://codeforces.com/problemset/problem/${problem_contestId}/${problem_index}`;
                const embed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setDescription(`Good luck: [${problem_name}](${link})`);
                await message.channel.send({embeds: [embed]});

                await Practice.create({
                    discordId: message.author.id,
                    contestId: problem_contestId,
                    index: problem_index,
                    points: required_rating / 100
                });
                return;
            }
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setDescription('No problems found. Try entering correct arguments for rating and contestId.');
        await message.channel.send({embeds: [embed]});
    }
}

module.exports = practiceCommand;