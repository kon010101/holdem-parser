"use strict";
exports.__esModule = true;
exports.dateInfoFromString = exports.safeParseFloat = exports.safeParseInt = exports.safeTrim = exports.safeFirstUpper = exports.safeUpper = exports.safeLower = exports.emptyLine = exports.trimLine = void 0;
var ntz = require("ntz");
function trimLine(line) {
    return line.trim();
}
exports.trimLine = trimLine;
function emptyLine(line) {
    return line.length;
}
exports.emptyLine = emptyLine;
function safeLower(s) {
    return typeof s === "undefined" ? undefined : s.toLowerCase();
}
exports.safeLower = safeLower;
function safeUpper(s) {
    return typeof s === "undefined" ? undefined : s.toUpperCase();
}
exports.safeUpper = safeUpper;
function safeFirstUpper(s) {
    return typeof s === "undefined" || s.length < 1 ? s : s[0].toUpperCase() + s.slice(1);
}
exports.safeFirstUpper = safeFirstUpper;
function safeTrim(s) {
    return typeof s === "undefined" ? undefined : s.trim();
}
exports.safeTrim = safeTrim;
function safeParseInt(s) {
    return typeof s === "undefined" ? undefined : parseInt(s);
}
exports.safeParseInt = safeParseInt;
function safeParseFloat(s) {
    return typeof s === "undefined" ? undefined : typeof s === "string" ? parseFloat(s.replace(/[, ]/g, "")) : s;
}
exports.safeParseFloat = safeParseFloat;
function dateInfoFromString(s) {
    var d = new Date(ntz(s));
    return {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day: d.getUTCDate(),
        hour: d.getUTCHours(),
        min: d.getUTCMinutes(),
        sec: d.getUTCSeconds(),
        timezone: "GMT"
    };
}
exports.dateInfoFromString = dateInfoFromString;
