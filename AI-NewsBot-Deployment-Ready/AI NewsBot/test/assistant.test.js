import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { answerQuestion, detectLanguage, normalizeRecord, parseImport } from "../src/assistant.js";

const records = JSON.parse(await readFile(new URL("../data/knowledge.json", import.meta.url), "utf8"));
const answer = (question, now = new Date(2026, 9, 28)) => answerQuestion(question, records, now).text;

test("returns only the BCA semester fee for a specific fee question", () => {
  const result = answer("What is the BCA fee?");
  assert.match(result, /₹29,400 per semester/);
  assert.doesNotMatch(result, /BBA|B\.Tech|B\.Pharm/);
});

test("narrows B.Tech CSE fees and asks one clarification for an unspecified programme", () => {
  const cse = answer("What is the B.Tech CSE fee?");
  assert.match(cse, /B.Tech CSE — 4 years — ₹48,700/);
  assert.doesNotMatch(cse, /Civil|Mechanical|AI & ML/);
  assert.match(answer("fees kini hai?"), /ਕਿਹੜੇ ਕੋਰਸ/);
  const mba = answer("What is MBA fee?");
  assert.match(mba, /₹1\.95 lakh/);
  assert.doesNotMatch(mba, /BBA|BHMCT|B\.Tech/);
});

test("MT Block query stays within the MT Block record", () => {
  const result = answer("Tell me about MT Block");
  assert.match(result, /Management teaching classrooms/);
  assert.doesNotMatch(result, /ET Block|Pharmacy|Hotel Management Block/);
});

test("Koshish ticket query contains only ticket prices and qualification", () => {
  const result = answer("Koshish ticket price");
  assert.match(result, /General Area ₹1,800; Fan Pit Area ₹2,500; VIP Area ₹4,500/);
  assert.doesNotMatch(result, /Jasmine Sandlas|3,000 students|Ehsaas/);
});

test("college timing question returns schedule only", () => {
  const result = answer("College timing");
  assert.match(result, /Monday-Friday: 9:00 AM–4:40 PM/);
  assert.match(result, /Saturday: 9:00 AM–3:00 PM/);
  assert.doesNotMatch(result, /administrative|Campus 2/);
});

test("attendance calculator calculates 30/40 and no extra classes are needed", () => {
  const result = answer("Attendance 30/40");
  assert.match(result, /75%/);
  assert.match(result, /next 0 consecutive classes/);
});

test("weekly summary excludes undated digest and old dated news", () => {
  const result = answer("Is hafte di campus news summarize kar");
  assert.match(result, /The PCTE Group of Institutes recently celebrated/);
  assert.match(result, /Upcoming International Teaching Internships/);
});

test("weekly summary returns the exact requested copy for English, Hindi, and Punjabi prompts", () => {
  const expected = `The PCTE Group of Institutes recently celebrated its flagship annual youth extravaganza, PCTE KOSHISH 2026, drawing over 3,000 students for dance, music, and fashion performances.

Recent Campus Highlights & Events

* PCTE KOSHISH 2026: Held at the PCTE Campus Auditorium featuring large-scale student showcases and cultural events.
* Upcoming Dr. D.R. Singh Memorial British Parliamentary Debate: Scheduled for November 12, 2026, bringing delegates from over 40 international institutes and premier Indian colleges.
* Upcoming International Teaching Internships: Selected students are preparing for departures to partner universities in Europe and South-East Asia starting December 5, 2026.
* Festaweek & TURF 2026: Earlier parts of the annual cultural and inter-school calendar saw participation from 43 schools at Campus-II and featured the “Mr. and Miss Punjab PCTE 2026” pageant.`;
  for (const question of [
    "Summarize the weekly news",
    "Weekly News Summary",
    "साप्ताहिक समाचार का सार बताओ",
    "ਹਫ਼ਤਾਵਾਰੀ ਖ਼ਬਰਾਂ ਦਾ ਸਾਰ ਦੱਸੋ",
    "Is hafte di news summarize kar",
    "इस सप्ताह की खबरों का सार बताओ",
    "ਇਸ ਹਫ਼ਤੇ ਦੀਆਂ ਖ਼ਬਰਾਂ ਦਾ ਸਾਰ ਦੱਸੋ"
  ]) {
    assert.equal(answer(question), expected, question);
  }
});

test("unavailable topic is not guessed", () => {
  assert.match(answer("What is the PCTE swimming pool temperature?"), /not available in the supplied local data/i);
});

test("language detection supports Punjabi, Hindi, and English", () => {
  assert.equal(detectLanguage("What is the BCA fee?"), "en");
  assert.equal(detectLanguage("कॉलेज का समय क्या है?"), "hi");
  assert.equal(detectLanguage("ਕਾਲਜ ਦਾ ਸਮਾਂ ਕੀ ਹੈ?"), "pa");
  assert.equal(detectLanguage("Is hafte di news das"), "pa");
  assert.match(answer("कॉलेज का समय क्या है?"), /दी गई स्थानीय जानकारी|दिए गए स्थानीय डेटा/);
  assert.match(answer("ਕਾਲਜ ਦਾ ਸਮਾਂ ਕੀ ਹੈ?"), /ਦਿੱਤੀ ਸਥਾਨਕ ਜਾਣਕਾਰੀ/);
});

test("basic greetings, thanks, and goodbyes receive polite localized replies", () => {
  for (const question of ["hi", "hello", "नमस्ते", "ਸਤ ਸ੍ਰੀ ਅਕਾਲ"]) {
    assert.doesNotMatch(answer(question), /saved campus|technology news|सेव की हुई कैंपस|ਤੁਹਾਡੇ ਸੰਭਾਲੇ ਕੈਂਪਸ/i);
  }
  assert.match(answer("hi"), /Hello! 😊 How can I help you today\?/);
  assert.match(answer("नमस्ते"), /नमस्ते!/);
  assert.match(answer("ਸਤ ਸ੍ਰੀ ਅਕਾਲ"), /ਸਤ ਸ੍ਰੀ ਅਕਾਲ!/);
  assert.match(answer("kaise ho"), /मैं बढ़िया हूँ/);
  assert.match(answer("धन्यवाद"), /आपका स्वागत है/);
  assert.match(answer("bye"), /Goodbye!/);
  assert.doesNotMatch(answer("bye"), /saved campus|technology news/i);
});

test("today's supplied date answers day and date questions", () => {
  assert.equal(answer("What day is today?"), "Today is Friday, October 30, 2026.");
  assert.equal(answer("What is today's date?"), "Today is Friday, October 30, 2026.");
});

test("a dated news record is matched to its stored week, never by undated digest", () => {
  const custom = [...records, normalizeRecord({
    id: "local-news-test", title: "Technology lab update", category: "news", campus: "Campus 2",
    content: "A new lab session was held.", date: "2026-10-28", source: "", keywords: ["technology"]
  })];
  const current = answerQuestion("Summarize this week’s technology news", custom, new Date(2026, 9, 28)).text;
  assert.match(current, /The PCTE Group of Institutes recently celebrated/);
  assert.doesNotMatch(current, /Technology lab update/);
  const pastWeek = answerQuestion("Summarize last week’s news", custom, new Date(2026, 9, 14)).text;
  assert.match(pastWeek, /TURF 2026/);
});

test("JSON imports validate and normalize shape", () => {
  const result = parseImport([{ title: "Local item", category: "news", campus: "Campus 1", content: "A story.", date: "2026-10-28" }]);
  assert.equal(result.length, 1);
  assert.equal(result[0].source, "");
  assert.throws(() => parseImport([{ title: "", category: "news", campus: "Campus 1", content: "Missing title" }]), /title/);
  assert.throws(() => parseImport({ nope: [] }), /Expected a JSON array/);
  assert.throws(() => normalizeRecord({ title: "Bad date", category: "news", campus: "Campus 1", content: "x", date: "2026-02-31" }), /real calendar date/);
});

test("MBA documents avoid unrelated undergraduate document details", () => {
  const result = answer("Documents for MBA admission");
  assert.match(result, /graduation semester marksheets/);
  assert.match(result, /CAT\/MAT\/CMAT\/XAT/);
  assert.doesNotMatch(result, /Class 12 certificate/);
});

test("technology-news records can be filtered by exact stored date range", () => {
  const custom = [...records, normalizeRecord({
    id: "tech-range-test", title: "Campus computer lab technology", category: "technology-news", campus: "not-applicable",
    content: "Technology lab update.", date: "2026-10-11", source: "", keywords: ["technology"]
  })];
  const result = answerQuestion("Summarize technology news 2026-10-10 to 2026-10-12", custom, new Date(2026, 9, 28)).text;
  assert.match(result, /Campus computer lab technology/);
  assert.match(result, /10 Oct 2026 – 12 Oct 2026|Oct 10, 2026 – Oct 12, 2026/);
});
