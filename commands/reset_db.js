const Duel = require('../models/Duel.js');
const User = require('../models/User.js');
const roleAssign = require('./role_assign.js');

const guildId = '1392882080408408114';

async function resetUserDatabase(client) {
    
    let rankRoles = [
        '1394107629671940197',
        '1394107576014077994',
        '1394107528966705234',
        '1394107258585088020',
        '1394107187428593774',
        '1394107102330486897'
    ]
    const users = await User.find({});
    for(let i = 0; i < users.length; i++){
        const response = await fetch(`https://codeforces.com/api/user.info?handles=${users[i].handle}`);
        const data = await response.json();

        if(data.status === 'FAILED') continue;

        await User.updateOne(
            { handle: users[i].handle },
            { $set: {
                rating: data.result[0].maxRating,
                curRating: data.result[0].rating
            }}
        )

        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(users[i].discordId);

        for (let j = 0; j < rankRoles.length; j++) {
            const roleId = rankRoles[j];
            const role = await guild.roles.fetch(roleId).catch(() => null);
            if (!role) continue;

            const freshMember = await guild.members.fetch(member.id, { force: true });
            if (freshMember.roles.cache.has(role.id)) {
                await freshMember.roles.remove(role);
            } 
        }
        await member.roles.add(roleAssign(users[i].rating));
    }
}

async function resetDuelDatabase() {
    const duels = await Duel.find({});
    for(let i = 0; i < duels.length; i++){
        const differece = Date.now() - duels[i].createdAt;
        if(differece >= 86400000){
            await Duel.deleteOne({ discordId1: duels[i].discordId1 });
            await Duel.deleteOne({ discordId1: duels[i].discordId2 });
        }
    }
}

module.exports = {
    resetUserDatabase,
    resetDuelDatabase,
}