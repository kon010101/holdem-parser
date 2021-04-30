"use strict";

const ntz = require("ntz");

function trimLine(line: string) {
  return line.trim();
}

function emptyLine(line: string) {
  return line.length;
}

function safeLower(s: string) {
  return typeof s === "undefined" ? undefined : s.toLowerCase();
}

function safeUpper(s: string) {
  return typeof s === "undefined" ? undefined : s.toUpperCase();
}

function safeFirstUpper(s: string) {
  return typeof s === "undefined" || s.length < 1 ? s : s[0].toUpperCase() + s.slice(1);
}

function safeTrim(s: string) {
  return typeof s === "undefined" ? undefined : s.trim();
}

function safeParseInt(s: string) {
  return typeof s === "undefined" ? undefined : parseInt(s);
}

function safeParseFloat(s: string) {
  return typeof s === "undefined" ? undefined : typeof s === "string" ? parseFloat(s.replace(/[, ]/g, "")) : s;
}

function dateInfoFromString(s: string) {
  const d = new Date(ntz(s));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    min: d.getUTCMinutes(),
    sec: d.getUTCSeconds(),
    timezone: "GMT",
  };
}

export {
  trimLine,
  emptyLine,
  safeLower,
  safeUpper,
  safeFirstUpper,
  safeTrim,
  safeParseInt,
  safeParseFloat,
  dateInfoFromString,
};
