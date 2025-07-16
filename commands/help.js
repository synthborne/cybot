const { EmbedBuilder} = require('discord.js');

async function helpCommand(message) {
    const helpEmbed = new EmbedBuilder()
        .setTitle('📘 Bot Command Guide')
        .setColor(0x5865F2)
        .setDescription('Use the following commands to link Codeforces handles, practice problems, duel friends, view leaderboards, and stay updated on contests.')

        .addFields(
            {
                name: '🎯 Handle-Related Commands',
                value:
                    '`;handle identify {handle}` — Link your Codeforces handle to your Discord ID.\n' +
                    '`;handle info {handle}` — View detailed Codeforces profile information.\n' +
                    '`;handle info {@mention}` — View Codeforces info of a tagged user (must be linked).\n' +
                    '`;handle reset` — Unlink your Codeforces handle and remove it from the database.'
            },
            {
                name: '🧠 Practice Commands',
                value:
                    '`;practice {rating} {min_contestId (optional)}` — Receive a random unsolved problem of the given rating. The optional contest ID helps filter out older contests.\n' +
                    '`;practice complete` — Run this command after submitting the problem to earn getgud points.'
            },
            {
                name: '⚔️ Duel Commands',
                value:
                    '`;duel start {rating} {min_contestId (optional)} {@mention}` — Challenge a user to a duel on a random problem. The first to solve wins. You must mention the user you want to duel.\n' +
                    '`;duel accept` — Accept an incoming duel or draw offer.\n' +
                    '`;duel reject` — Reject an incoming duel or draw offer.\n' +
                    '`;duel withdraw` — Cancel a duel challenge you’ve sent.\n' +
                    '`;duel draw` — Offer a draw during an ongoing duel.\n' +
                    '`;duel complete` — Submit your duel solution to claim victory.\n' +
                    '`;duel status` — View your current duel status and details.'
            },
            {
                name: '🏆 Standings Commands',
                value:
                    '`;standings rating {role (optional)}` — Leaderboard sorted by Codeforces rating. If a role is specified (as plain text), only members with that role are included.\n' +
                    '`;standings getgud {role (optional)}` — Leaderboard based on server getgud points. Optional role filter supported.'
            },
            {
                name: '📅 Contest Reminder Features',
                value:
                    '• Notifies you about upcoming Codeforces contests.\n' +
                    '• Posts server-wide standings after each contest ends.\n' +
                    '• Alerts everyone when Codeforces rating changes are published.'
            }
        )
        .setFooter({ text: 'Arguments in {} are required, () are optional. Mention users with @.' });

    message.channel.send({ embeds: [helpEmbed] });
}

module.exports = helpCommand;