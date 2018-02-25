/* eslint-disable no-magic-numbers */
"use strict";

const COLORS = {
    GREY: '#cbc8cf',
    PURPLE: '#c580fd',
    GREEN: '#3ed9b7',
    BLUE: '#49acfd',
    RED: '#ff271e',
    PINK: '#f362b1',
    ORANGE: '#fa872e',
    LIGHT_GREEN: '#25d044',
    YELLOW: '#fbcc1e'
};

exports.textColors = (amount) => {
    if(amount < 10000) {
        return '#292141';
    }
    else if(amount < 25000) {
        return '#5f1806';
    }
    else if(amount < 50000) {
        return '#38202e';
    }
    else if(amount < 75000) {
        return '#432a16';
    }
    else if(amount < 100000) {
        return '#093d0f';
    }
    else if(amount < 200000) {
        return '#830803';
    }
    else if(amount < 300000) {
        return COLORS.GREY;
    }
    else if(amount < 400000) {
        return COLORS.PURPLE;
    }
    else if(amount < 500000) {
        return COLORS.GREEN;
    }
    else if(amount < 600000) {
        return COLORS.BLUE;
    }
    else if(amount < 700000) {
        return COLORS.RED;
    }
    else if(amount < 800000) {
        return COLORS.PINK;
    }
    else if(amount < 900000) {
        return COLORS.ORANGE;
    }
    else if(amount < 1000000) {
        return COLORS.LIGHT_GREEN;
    }
    else if(amount < 1250000) {
        return COLORS.YELLOW;
    }
    return '#a2e6ff';
};

exports.colors = (amount) => {
    if(amount < 100) {
        return COLORS.GREY;
    }
    else if(amount < 1000) {
        return COLORS.PURPLE;
    }
    else if(amount < 5000) {
        return COLORS.GREEN;
    }
    else if(amount < 10000) {
        return COLORS.BLUE;
    }
    else if(amount < 25000) {
        return COLORS.RED;
    }
    else if(amount < 50000) {
        return COLORS.PINK;
    }
    else if(amount < 75000) {
        return COLORS.ORANGE;
    }
    else if(amount < 100000) {
        return COLORS.LIGHT_GREEN;
    }
    else if(amount < 200000) {
        return COLORS.YELLOW;
    }
    else if(amount < 1250000) {
        return '#3a2f59';
    }
    // These in reality have complex background patterns
    else if(amount < 1500000) {
        return '#272139';
    }
    else if(amount < 1750000) {
        return '#6e2aa3';
    }
    else if(amount < 2000000) {
        return '#007153';
    }
    else if(amount < 2500000) {
        return '#1d79d0';
    }
    else if(amount < 3000000) {
        return '#ff221d';
    }
    else if(amount < 3500000) {
        return '#f355a1';
    }
    else if(amount < 4000000) {
        return '#fe7c30';
    }
    else if(amount < 4500000) {
        return '#21c746';
    }
    else if(amount < 5000000) {
        return '#d09d02';
    }
    return '#6da3b3';
};

exports.character = (amount) => {
    if(amount < 100) {
        return '▴'; // triangle
    }
    else if(amount < 1000) {
        return '♦'; // diamond
    }
    else if(amount < 5000) {
        return '⬟'; // pentagon
    }
    else if(amount < 10000) {
        return '⬢'; // hexagon
    }
    else if(amount < 25000) {
        return '✶'; // 6 pointed star
    }
    else if(amount < 100000) {
        return '*'; // 7 pointed star doesn't exist...
    }
    else if(amount < 1250000) {
        return '✸'; // 8 pointed star
    }
    else if(amount < 1500000) {
        return '⮝';
    }
    else if(amount < 1750000) {
        return '◭'; // triangle
    }
    else if(amount < 2000000) {
        return '◆'; // diamond
    }
    else if(amount < 2500000) {
        return '⬟'; // pentagon
    }
    else if(amount < 3000000) {
        return '⬣'; // hexagon (not regular)
    }
    else if(amount < 3500000) {
        return '✶'; // 6 pointed star
    }
    else if(amount < 4000000) {
        return '🟐'; // 10 pointed star doesn't exist...
    }
    else if(amount < 4500000) {
        return '🟒'; // dodecagon doesn't exist...
    }
    return '🟓'; // 12 pointed star
};

/* eslint-enable no-magic-numbers */
