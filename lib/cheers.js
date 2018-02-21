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
    return COLORS.YELLOW;
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
    return '#3a2f59';
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
    return '✸'; // 8 pointed star
};

/* eslint-enable no-magic-numbers */
