const User = require('../models/User.js');
const { EmbedBuilder } = require('discord.js');

async function standingsCommand(command, message) {

    if(command.length >= 2 && command[1] === 'rating'){
        const users = await User.find({}).sort({ curRating: -1 });
        let standings = [];

        if(command.length === 3){
            const guild = message.guild;
            const roleName = command[2];
            const roles = await guild.roles.fetch();
            const role = roles.find(r => r.name.toLowerCase() === roleName.toLowerCase());

            if (!role) {
                const embed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setDescription('Role not found in the server.');
                await message.channel.send({embeds: [embed]});  
                return;
            }

            const members = await guild.members.fetch();
            const membersWithRole = members.filter(member => member.roles.cache.has(role.id));
            const membersArray = [...membersWithRole.values()];
            let counter = 0;

            for(let i = 0; i < users.length; i++) {
                let success = false;
                for (let j = 0; j < membersArray.length; j++) {
                    if (users[i].discordId === membersArray[j].id) {
                        success = true;
                        counter++;
                        break;
                    }
                }
                if(success){
                    standings.push({
                        server_rank: counter,
                        handle: users[i].handle,
                        rating: users[i].curRating,
                    });
                }
            }
        }
        else{
            for(let i = 0; i < users.length; i++) {
                standings.push({
                    server_rank: i + 1,
                    handle: users[i].handle,
                    rating: users[i].curRating
                })
            }
        }
        if(standings.length === 0){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription('No user found in the database with this role.');
            await message.channel.send({embeds: [embed]});  
            return;
        }

        let standingsText = '```\n';
        standingsText += 'Rank  Handle               Rating\n\n';
        for (const entry of standings) {
            const { server_rank, handle, rating } = entry;
            standingsText += `${server_rank.toString().padEnd(6)}${handle.padEnd(20)}${rating}\n`;
        }
        standingsText += '```';

        const embed = new EmbedBuilder()
            .setTitle('Server Standings')
            .setColor(0x5865F2)
            .setDescription(standingsText);
        await message.channel.send({ embeds: [embed] });
    }

    if(command.length >= 2 && command[1] === 'getgud'){
        const users = await User.find({}).sort({ points: -1 });
        let standings = [];

        if(command.length === 3){
            const guild = message.guild;
            const roleName = command[2];
            const roles = await guild.roles.fetch();
            const role = roles.find(r => r.name.toLowerCase() === roleName.toLowerCase());

            if (!role) {
                const embed = new EmbedBuilder()
                    .setColor(0x5865F2)
                    .setDescription('Role not found in the server.');
                await message.channel.send({embeds: [embed]});  
                return;
            }

            const members = await guild.members.fetch();
            const membersWithRole = members.filter(member => member.roles.cache.has(role.id));
            const membersArray = [...membersWithRole.values()];
            let counter = 0;

            for(let i = 0; i < users.length; i++) {
                let success = false;
                for (let j = 0; j < membersArray.length; j++) {
                    if (users[i].discordId === membersArray[j].id) {
                        success = true;
                        counter++;
                        break;
                    }
                }
                if(success){
                    standings.push({
                        server_rank: counter,
                        handle: users[i].handle,
                        points: users[i].points,
                    });
                }
            }
        }
        else{
            for(let i = 0; i < users.length; i++) {
                standings.push({
                    server_rank: i + 1,
                    handle: users[i].handle,
                    points: users[i].points
                })
            }
        }
        if(standings.length === 0){
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setDescription('No user found in the database with this role.');
            await message.channel.send({embeds: [embed]});  
            return;
        }

        let standingsText = '```\n';
        standingsText += 'Rank  Handle               Points\n\n';
        for (const entry of standings) {
            const { server_rank, handle, points } = entry;
            standingsText += `${server_rank.toString().padEnd(6)}${handle.padEnd(20)}${points}\n`;
        }
        standingsText += '```';

        const embed = new EmbedBuilder()
            .setTitle('Server Standings')
            .setColor(0x5865F2)
            .setDescription(standingsText);
        await message.channel.send({ embeds: [embed] });
    }
}

module.exports = standingsCommand;