"use strict";

const chalk = require("chalk"),
    cheers = require('./cheers'),

    CHEER_SECOND = 2,
    CHEER_THIRD = 3;

module.exports = function formatBadge(badgeInfo) {
    switch(badgeInfo._id) {
    case "premium": return chalk.hex('#FFFFFF').bgHex('#009CDC')("👑 ");
    case "turbo": return chalk.hex('#FFFFFF').bgHex('#6441A5')("🔋 ");
    case "moderator": return chalk.hex('#FFFFFF').bgHex('#34AE0A')("⚔️ ");
    case "admin": return chalk.hex('#FFFFFF').bgHex('#FAAF19')("🛡 ");
    case "staff": return chalk.hex('#FFFFFF').bgHex('#200F33')("🔧 ");
    case "global_mod": return chalk.hex('#FFFFFF').bgHex('#016e2b')("🗡 "); //TODO should be an axe...
    case "broadcaster": return chalk.hex('#FFFFFF').bgHex('#E71818')("🎥 ");
    case "subscriber": return chalk.hex('#2D2D2D').bgHex('#E1E1E1')("★ ");
    case "verified":
    case "partner": return chalk.hex('#FFFFFF').bgHex('#6441A5')("✓ ");
    case "bits": return chalk
        .hex(cheers.textColors(badgeInfo.version))
        .bgHex(cheers.colors(badgeInfo.version))(`${cheers.character(badgeInfo.version)} `);
    case "clip-champ": return chalk.hex('#FFFFFF').bgHex('#6045a0')("🎬 ");
    case "sub-gifter": return chalk.hex('#7c5bbd')("🎁 "); // Has no bg color
    case "bits-leader": {
        let char = '①',
            color = '#d8b055';
        if(badgeInfo.version == CHEER_SECOND) {
            char = '②';
            color = '#bec4c9';
        }
        else if(badgeInfo.version == CHEER_THIRD) {
            char = '③';
            color = '#c6815f';
        }
        return chalk.hex('#ffffff').bgHex(color)(`${char} `);
    }
    case "vip": return chalk.hex('#ffffff').bgHex('#63429f')('🞛 ');
    default: return "";
    }
};
