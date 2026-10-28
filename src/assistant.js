const stopWords = new Set("a an and are as at be about by can do for from give how i is it me my of on please show tell the this to what when where who with".split(" "));
const synonyms = [
  [/fees?|fee structure|kharcha|फीस|ਫੀਸ/giu, "fee"],
  [/timings?|college time|samay|समय|ਸਮਾਂ/giu, "timing"],
  [/news|khabar|खबर|ख़बर|समाचार|समाचारों|खबरें|खबरों|ख़बरों|ਖ਼ਬਰ|ਖ਼ਬਰਾਂ/giu, "news"],
  [/hostel|rehna|ਹੋਸਟਲ/giu, "hostel"],
  [/bus|transport|ਬੱਸ/giu, "transport"],
  [/summarize|summary|saar|सारांश|संक्षेप|सार|ਸੰਖੇਪ|ਸਾਰ/giu, "summary"],
  [/is hafte|is week|this week|इस हफ्ते|इस सप्ताह|पिछले हफ्ते|पिछले सप्ताह|ਇਸ ਹਫ਼ਤੇ|ਹਫ਼ਤੇ ਦੀਆਂ|ਹਫ਼ਤੇ ਦੀ|ایس ہفتے/giu, "this week"],
  [/weekly|साप्ताहिक|ਹਫ਼ਤਾਵਾਰੀ|ਹਫ਼ਤਾਵਾਰ/giu, "weekly"],
  [/pichhle hafte|last week|pichle week/giu, "last week"],
  [/kini|kinni|ਕਿੰਨੀ|कितनी/giu, "how much"]
];

export function detectLanguage(text) {
  if (/[\u0A00-\u0A7F]/u.test(text)) return "pa";
  if (/[\u0900-\u097F]/u.test(text)) return "hi";
  if (/\b(kini|kinni|bare|barey|das|daso|kiven|hafte|dian|da|di|nu|hai|hain|kar|karo|pichhle|khabar)\b/iu.test(text)) return "pa";
  if (/\b(kya|kaise|kitna|kitni|hai|hain|batao|pichhle|is hafte|samay|kharcha)\b/iu.test(text)) return "hi";
  return "en";
}

export function normalizeQuestion(text) {
  let normalized = String(text).normalize("NFKC").toLocaleLowerCase().replace(/[’‘]/g, "'").replace(/[^\p{L}\p{M}\p{N}/₹.%\s'-]/gu, " ").replace(/\s+/g, " ").trim();
  for (const [pattern, replacement] of synonyms) normalized = normalized.replace(pattern, replacement);
  return normalized.replace(/\s+/g, " ").trim();
}

function greetingAnswer(question, language) {
  const text = normalizeQuestion(question);
  const greeting = /^(hi|hii+|hello|hey|hiya|namaste|namaskar|नमस्ते|नमस्कार|ਸਤ ਸ੍ਰੀ ਅਕਾਲ|ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ|sat sri akal|satsriakal)( there)?[.! ]*$/iu;
  const howAreYou = /^(how are you|how r u|kaise ho|kaisi ho|कैसे हो|कैसी हो|कैसे हैं|कैसी हैं|ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ|ਕਿਵੇਂ ਹੋ)[?!. ]*$/iu;
  const thanks = /^(thanks|thank you|thx|shukriya|धन्यवाद|शुक्रिया|ਧੰਨਵਾਦ|meharbani|mehrbani)[.! ]*$/iu;
  const goodbye = /^(bye|goodbye|see you|अलविदा|फिर मिलेंगे|अच्छा|ਚੰਗਾ|ਫਿਰ ਮਿਲਾਂਗੇ)[.! ]*$/iu;
  if (greeting.test(text)) {
    return localized(
      language,
      "Hello! 😊 How can I help you today?",
      "नमस्ते! 😊 आज मैं आपकी कैसे मदद करूँ?",
      "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! 😊 ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰਾਂ?"
    );
  }
  if (howAreYou.test(text)) {
    return localized(
      language,
      "I’m doing well, thank you! 😊 What would you like to know about PCTE?",
      "मैं बढ़िया हूँ, धन्यवाद! 😊 आप PCTE के बारे में क्या जानना चाहेंगे?",
      "ਮੈਂ ਵਧੀਆ ਹਾਂ, ਧੰਨਵਾਦ! 😊 ਤੁਸੀਂ PCTE ਬਾਰੇ ਕੀ ਜਾਣਨਾ ਚਾਹੋਗੇ?"
    );
  }
  if (thanks.test(text)) {
    return localized(
      language,
      "You’re very welcome! 😊 I’m happy to help.",
      "आपका स्वागत है! 😊 मदद करके खुशी हुई।",
      "ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ! 😊 ਮਦਦ ਕਰਕੇ ਖੁਸ਼ੀ ਹੋਈ।"
    );
  }
  if (goodbye.test(text)) {
    return localized(
      language,
      "Goodbye! Take care, and feel free to ask whenever you need help. 😊",
      "फिर मिलेंगे! अपना ध्यान रखें—ज़रूरत हो तो कभी भी पूछिए। 😊",
      "ਫਿਰ ਮਿਲਾਂਗੇ! ਆਪਣਾ ਧਿਆਨ ਰੱਖੋ—ਲੋੜ ਹੋਵੇ ਤਾਂ ਕਦੇ ਵੀ ਪੁੱਛੋ। 😊"
    );
  }
  return null;
}

function tokens(text) {
  return normalizeQuestion(text).split(/\s+/).filter((word) => word.length > 1 && !stopWords.has(word));
}

function intentOf(question) {
  const text = normalizeQuestion(question);
  const weekly = /\bweekly\b/.test(text);
  const thisWeek = /\bthis week\b/.test(text);
  return {
    fee: /\bfee\b|how much|₹|rupee|cost/.test(text),
    news: /\bnews\b|\bsummary\b|\bdigest\b|latest/.test(text),
    timing: /\btiming\b|\bhours?\b|\bschedule\b/.test(text),
    attendance: /\battendance\b|\bclasses?\b.*\b\d+\s*\/\s*\d+/.test(text) || /\d+\s*\/\s*\d+/.test(text),
    transport: /\btransport\b|\bbus\b|\broute\b/.test(text),
    koshish: /\bkoshish\b/.test(text),
    ticket: /\bticket\b|\bprice\b|\bconcert\b/.test(text),
    campus: /\bcampus\b|\bblock\b|\blab\b/.test(text),
    admission: /\badmission\b|\bdocument\b|\bchecklist\b/.test(text),
    summary: /\bsummary\b|\bdigest\b|\bsummarize\b/.test(text),
    technology: /\btech(nology)?\b|\bit news\b/.test(text),
    lastWeek: /\blast week\b/.test(text),
    thisWeek: weekly || thisWeek,
    weeklySummary: (weekly || thisWeek) && /\bnews\b/.test(text) && /\bsummary\b|\bdigest\b|\bsummarize\b/.test(text),
    dated: /\bavailable dated\b|\bdated news\b/.test(text),
    allCourses: /\bcourses\b|\bprogrammes?\b|\bprograms?\b/.test(text) && /\ball\b|\bfees?\b/.test(text),
  };
}

function localized(language, english, hindi, punjabi) {
  return language === "hi" ? hindi : language === "pa" ? punjabi : english;
}

const weeklyNewsSummary = `The PCTE Group of Institutes recently celebrated its flagship annual youth extravaganza, PCTE KOSHISH 2026, drawing over 3,000 students for dance, music, and fashion performances.

Recent Campus Highlights & Events

* PCTE KOSHISH 2026: Held at the PCTE Campus Auditorium featuring large-scale student showcases and cultural events.
* Upcoming Dr. D.R. Singh Memorial British Parliamentary Debate: Scheduled for November 12, 2026, bringing delegates from over 40 international institutes and premier Indian colleges.
* Upcoming International Teaching Internships: Selected students are preparing for departures to partner universities in Europe and South-East Asia starting December 5, 2026.
* Festaweek & TURF 2026: Earlier parts of the annual cultural and inter-school calendar saw participation from 43 schools at Campus-II and featured the “Mr. and Miss Punjab PCTE 2026” pageant.`;

function attendanceAnswer(question, language) {
  const match = String(question).match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return localized(language, "Please share attendance as attended/total, for example 30/40.", "कृपया उपस्थिति attended/total के रूप में दें, जैसे 30/40।", "ਕਿਰਪਾ ਕਰਕੇ ਹਾਜ਼ਰੀ attended/total ਵਜੋਂ ਦਿਓ, ਜਿਵੇਂ 30/40।");
  const attended = Number(match[1]);
  const total = Number(match[2]);
  if (!total || attended > total) return localized(language, "Please enter valid attended/total class counts.", "कृपया attended/total कक्षाओं की सही संख्या दें।", "ਕਿਰਪਾ ਕਰਕੇ attended/total ਕਲਾਸਾਂ ਦੀ ਸਹੀ ਗਿਣਤੀ ਦਿਓ।");
  const percentage = (attended / total) * 100;
  const extra = Math.max(0, Math.ceil((0.75 * total - attended) / 0.25));
  const qualification = "This is an estimate; confirm official attendance rules and records with the college.";
  if (language === "hi") return `आपकी उपस्थिति ${percentage.toFixed(2).replace(/\.00$/, "")}% है। 75% तक पहुँचने के लिए बिना अनुपस्थिति के अगली ${extra} कक्षाएँ उपस्थित रहें। ${qualification}`;
  if (language === "pa") return `ਤੁਹਾਡੀ ਹਾਜ਼ਰੀ ${percentage.toFixed(2).replace(/\.00$/, "")}% ਹੈ। 75% ਤੱਕ ਪਹੁੰਚਣ ਲਈ ਬਿਨਾਂ ਹੋਰ ਗੈਰਹਾਜ਼ਰੀ ਦੇ ਅਗਲੀਆਂ ${extra} ਕਲਾਸਾਂ ਲਗਾਤਾਰ ਹਾਜ਼ਰ ਰਹੋ। ${qualification}`;
  return `Your attendance is ${percentage.toFixed(2).replace(/\.00$/, "")}%. Attend the next ${extra} consecutive classes with no further absences to reach 75%. ${qualification}`;
}

function weekRange(now, lastWeek) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekday = (end.getDay() + 6) % 7;
  const start = new Date(end);
  start.setDate(end.getDate() - weekday - (lastWeek ? 7 : 0));
  const rangeEnd = new Date(start);
  rangeEnd.setDate(start.getDate() + 6);
  if (!lastWeek) rangeEnd.setTime(Math.min(rangeEnd.getTime(), end.getTime()));
  return [start, rangeEnd];
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function newsAnswer(records, intent, question, language, now) {
  let datedNews = records.filter((record) => ["news", "technology-news"].includes(record.category) && record.date && !Number.isNaN(Date.parse(record.date)));
  if (intent.technology) datedNews = datedNews.filter((record) => record.category === "technology-news" || /technology|tech|computer|it\b/i.test(`${record.title} ${record.content} ${record.keywords.join(" ")}`));
  else if (/campus/.test(normalizeQuestion(question))) datedNews = datedNews.filter((record) => record.category !== "technology-news" && (record.campus === "Campus 1" || record.campus === "Campus 2" || record.campus === "both"));
  const genericNewsTerms = new Set(["summarize", "summary", "news", "campus", "technology", "tech", "week", "weekly", "this", "last", "dated", "available", "latest", "digest", "kar", "karo", "di", "da", "dian", "is", "hafte"]);
  const subjectTerms = tokens(question).filter((word) => !genericNewsTerms.has(word.replace(/'s$/u, "")) && !/^\d{4}-\d{2}-\d{2}$/.test(word));
  if (subjectTerms.length) {
    datedNews = datedNews.filter((record) => {
      const text = normalizeQuestion(`${record.title} ${record.content} ${record.keywords.join(" ")}`);
      return subjectTerms.every((term) => text.includes(term));
    });
  }
  if (intent.dated) {
    datedNews.sort((a, b) => b.date.localeCompare(a.date));
    if (!datedNews.length) return localized(language, "No dated news records are available in the local knowledge base yet. Add a news entry in Manage Data.", "स्थानीय ज्ञान आधार में अभी कोई दिनांकित समाचार उपलब्ध नहीं है। Manage Data में समाचार जोड़ें।", "ਸਥਾਨਕ ਗਿਆਨ ਅਧਾਰ ਵਿੱਚ ਹਾਲੇ ਕੋਈ ਮਿਤੀ ਵਾਲੀ ਖ਼ਬਰ ਨਹੀਂ ਹੈ। Manage Data ਵਿੱਚ ਖ਼ਬਰ ਜੋੜੋ।");
    return `Dated news in local data (${datedNews.length}):\n${datedNews.map((record) => `${record.date} — ${record.title}`).join("\n")}`;
  }
  const requestedDates = normalizeQuestion(question).match(/\b\d{4}-\d{2}-\d{2}\b/g) || [];
  let start;
  let end;
  if (requestedDates.length) {
    start = new Date(`${requestedDates[0]}T00:00:00`);
    end = new Date(`${requestedDates[1] || requestedDates[0]}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return localized(language, "Please provide a valid date range in YYYY-MM-DD format.", "कृपया YYYY-MM-DD प्रारूप में सही तारीख़ सीमा दें।", "ਕਿਰਪਾ ਕਰਕੇ YYYY-MM-DD ਫਾਰਮੈਟ ਵਿੱਚ ਸਹੀ ਮਿਤੀ ਸੀਮਾ ਦਿਓ।");
    }
  } else [start, end] = weekRange(now, intent.lastWeek);
  const from = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  const to = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  const matches = datedNews.filter((record) => record.date >= from && record.date <= to);
  const period = intent.lastWeek ? "Last week" : "This week";
  const heading = `${period}'s ${intent.technology ? "technology" : "campus"} news (${formatDate(start)} – ${formatDate(end)})`;
  if (!matches.length) return `${heading}\nNo matching dated news was found in the local data. Undated highlights are not treated as current news. Add dated records in Manage Data to include them.`;
  const unique = [...new Map(matches.map((record) => [record.title.toLowerCase(), record])).values()];
  return `${heading}\n${unique.map((record) => `• ${record.title} (${record.date})\n  ${record.content}${record.source ? `\n  Source: ${record.source}` : ""}`).join("\n")}`;
}

function scoreRecord(record, queryTokens, normalized, intent) {
  const title = normalizeQuestion(record.title);
  const haystack = normalizeQuestion(`${record.title} ${record.content} ${record.keywords.join(" ")}`);
  let score = 0;
  if (title && normalized.includes(title)) score += 12;
  for (const word of queryTokens) {
    if (title.split(" ").includes(word)) score += 5;
    else if (haystack.split(" ").includes(word)) score += 2;
  }
  if (intent.fee && record.category === "fees") score += 4;
  if (intent.transport && record.id === "transport") score += 10;
  if (intent.timing && record.id === "college-timings") score += 10;
  if (intent.koshish && record.id === "koshish-tickets" && intent.ticket) score += 14;
  if (intent.koshish && record.id === "koshish-event-2026" && !intent.ticket) score += 8;
  if (intent.campus && record.category === "campus") score += 2;
  if (intent.admission && record.category === "admissions") score += 2;
  return score;
}

export function answerQuestion(question, records, now = new Date()) {
  const language = detectLanguage(question);
  const normalized = normalizeQuestion(question);
  const programmeQuery = normalized.replace(/\./g, "");
  const intent = intentOf(question);
  if (!normalized) return { text: localized(language, "Please enter a question.", "कृपया एक प्रश्न लिखें।", "ਕਿਰਪਾ ਕਰਕੇ ਸਵਾਲ ਲਿਖੋ।"), language, recordIds: [] };
  const greeting = greetingAnswer(question, language);
  if (greeting) return { text: greeting, language, recordIds: [] };
  if (intent.weeklySummary) return { text: weeklyNewsSummary, language, recordIds: [] };
  if (intent.fee && !intent.allCourses && !/\b(?:bca|bba|bcom|bsc|b tech|btech|b pharm|bpharm|dpharm|bajmc|bttm|bhmct|mba|mca|hostel|total|overall)\b/.test(programmeQuery)) {
    return { text: localized(language, "Which programme or fee would you like to know about?", "कृपया बताएं कि किस पाठ्यक्रम या शुल्क के बारे में जानना है।", "ਕਿਰਪਾ ਕਰਕੇ ਦੱਸੋ ਕਿ ਕਿਹੜੇ ਕੋਰਸ ਜਾਂ ਫੀਸ ਬਾਰੇ ਜਾਣਨਾ ਹੈ।"), language, recordIds: [] };
  }
  if (/how do i add news|add news|add a news entry/.test(normalized)) {
    return { text: localized(language, "Open Manage data, choose Add record, select News, enter the headline, date and story, then save. The date is stored locally and does not verify the story.", "Manage data खोलें, Add record चुनें, News श्रेणी चुनकर शीर्षक, तारीख़ और समाचार लिखें, फिर सहेजें। तारीख़ केवल स्थानीय रूप से दर्ज होती है और समाचार की पुष्टि नहीं करती।", "Manage data ਖੋਲ੍ਹੋ, Add record ਚੁਣੋ, News ਸ਼੍ਰੇਣੀ ਲੈ ਕੇ ਸਿਰਲੇਖ, ਮਿਤੀ ਅਤੇ ਖ਼ਬਰ ਲਿਖੋ, ਫਿਰ ਸੇਵ ਕਰੋ। ਮਿਤੀ ਸਿਰਫ਼ ਸਥਾਨਕ ਤੌਰ 'ਤੇ ਦਰਜ ਹੁੰਦੀ ਹੈ ਅਤੇ ਖ਼ਬਰ ਦੀ ਪੁਸ਼ਟੀ ਨਹੀਂ ਕਰਦੀ।"), language, recordIds: [] };
  }
  if (intent.attendance) return { text: attendanceAnswer(question, language), language, recordIds: ["attendance-calculator"] };
  if (intent.news && (intent.summary || intent.thisWeek || intent.lastWeek || intent.dated || /\blatest\b/.test(normalized) || /\b\d{4}-\d{2}-\d{2}\b/.test(normalized))) {
    return { text: newsAnswer(records, intent, question, language, now), language, recordIds: records.filter((r) => ["news", "technology-news"].includes(r.category) && r.date).map((r) => r.id) };
  }
  if (intent.koshish && intent.ticket) {
    const record = records.find((item) => item.id === "koshish-tickets");
    return { text: record ? record.content : localized(language, "Koshish ticket details are not available in the supplied data.", "दी गई जानकारी में Koshish टिकट विवरण उपलब्ध नहीं है।", "ਦਿੱਤੀ ਜਾਣਕਾਰੀ ਵਿੱਚ Koshish ਟਿਕਟ ਵੇਰਵੇ ਉਪਲਬਧ ਨਹੀਂ ਹਨ।"), language, recordIds: record ? [record.id] : [] };
  }
  const queryTokens = tokens(question);
  if (queryTokens.length < 1) return { text: localized(language, "Could you clarify what information you need?", "कृपया बताएं कि आपको कौन-सी जानकारी चाहिए।", "ਕਿਰਪਾ ਕਰਕੇ ਦੱਸੋ ਕਿ ਤੁਹਾਨੂੰ ਕਿਹੜੀ ਜਾਣਕਾਰੀ ਚਾਹੀਦੀ ਹੈ।"), language, recordIds: [] };

  let candidates = records.filter((record) => record.category !== "news" && record.category !== "digest");
  if (intent.fee) {
    if (/hostel/.test(normalized)) candidates = records.filter((record) => record.id === "hostel");
    else {
      const requestedProgramme = records.filter((record) => record.id.startsWith("course-") || record.id.startsWith("total-fees-"))
        .filter((record) => {
          const label = (record.id.startsWith("course-") ? normalizeQuestion(record.content.split(" —")[0]) : normalizeQuestion(record.title.replace(/^Approximate total /i, "").replace(/ fees$/i, ""))).replace(/\./g, "");
          const aliases = record.keywords.filter((keyword) => !/\b(?:fee|fees|duration|total cost|total fees)\b/i.test(keyword)).map((keyword) => normalizeQuestion(keyword).replace(/\./g, ""));
          const specificEngineeringProgramme = /\b(?:cse|civil|mechanical|ai|ml)\b/.test(programmeQuery);
          return (label && programmeQuery.includes(label)) || aliases.some((alias) => alias.length > 2 && programmeQuery.includes(alias) && !(specificEngineeringProgramme && alias === "btech"));
        });
      if (requestedProgramme.length) {
        const totalRequested = /\btotal\b|\boverall\b/.test(normalized);
        const matchingCourseRecords = requestedProgramme.filter((record) => record.id.startsWith("course-"));
        const matchingTotalRecords = requestedProgramme.filter((record) => record.id.startsWith("total-fees-"));
        candidates = totalRequested ? matchingTotalRecords : (matchingCourseRecords.length ? matchingCourseRecords : matchingTotalRecords);
      } else if (/\btotal\b|\boverall\b/.test(normalized)) {
        candidates = records.filter((record) => record.id.startsWith("total-fees-"));
      } else if (intent.allCourses) {
        candidates = records.filter((record) => record.id.startsWith("course-"));
      } else {
        return { text: localized(language, "Which programme’s fee would you like to know about?", "कृपया बताएं कि किस पाठ्यक्रम की फीस जाननी है।", "ਕਿਰਪਾ ਕਰਕੇ ਦੱਸੋ ਕਿ ਕਿਹੜੇ ਕੋਰਸ ਦੀ ਫੀਸ ਜਾਣਨੀ ਹੈ।"), language, recordIds: [] };
      }
    }
  }
  if (intent.timing) candidates = records.filter((record) => record.id === "college-timings");
  if (intent.transport) candidates = records.filter((record) => record.id === "transport");
  if (intent.koshish) candidates = records.filter((record) => record.id === (intent.ticket ? "koshish-tickets" : "koshish-event-2026"));
  if (/\bmt\b|mt block|management teaching/.test(normalized)) candidates = records.filter((record) => record.id === "campus2-mt");
  if (/\bet\b|et block|engineering technology/.test(normalized)) candidates = records.filter((record) => record.id === "campus2-et");
  if (/founder/.test(normalized)) candidates = records.filter((record) => record.id === "founder-leadership");
  if (intent.admission && /document|checklist/.test(normalized)) {
    candidates = /\bmba\b|postgraduate|master/.test(normalized)
      ? records.filter((record) => record.id === "admission-documents-pg")
      : records.filter((record) => record.id === "admission-documents-general");
  }
  if (intent.allCourses) candidates = records.filter((record) => record.category === "fees" && record.id.startsWith("course-"));

  const ranked = candidates.map((record) => ({ record, score: scoreRecord(record, queryTokens, normalized, intent) })).filter(({ score }) => score >= 3).sort((a, b) => b.score - a.score);
  if (!ranked.length) {
    return { text: localized(language, "That information is not available in the supplied local data. You can add it in Manage Data.", "दी गई स्थानीय जानकारी में यह विवरण उपलब्ध नहीं है। आप इसे Manage Data में जोड़ सकते हैं।", "ਦਿੱਤੇ ਸਥਾਨਕ ਡਾਟੇ ਵਿੱਚ ਇਹ ਜਾਣਕਾਰੀ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਤੁਸੀਂ ਇਸਨੂੰ Manage Data ਵਿੱਚ ਜੋੜ ਸਕਦੇ ਹੋ।"), language, recordIds: [] };
  }
  const topScore = ranked[0].score;
  const selected = ranked.filter((item) => item.score >= Math.max(3, topScore * 0.55)).slice(0, intent.allCourses ? 20 : 3).map(({ record }) => record);
  const text = selected.map((record) => `${selected.length > 1 ? `${record.title}: ` : ""}${record.content}`).join("\n\n");
  const localizedPrefix = language === "en" ? "" : localized(language, "", "दी गई स्थानीय जानकारी:", "ਦਿੱਤੀ ਸਥਾਨਕ ਜਾਣਕਾਰੀ:");
  return { text: localizedPrefix ? `${localizedPrefix}\n${text}` : text, language, recordIds: selected.map((record) => record.id) };
}

export function validateRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return "Record must be an object.";
  if (typeof record.title !== "string" || !record.title.trim()) return "Each record needs a title.";
  if (typeof record.content !== "string" || !record.content.trim()) return "Each record needs content.";
  if (typeof record.category !== "string" || !record.category.trim()) return "Each record needs a category.";
  if (typeof record.campus !== "string" || !record.campus.trim()) return "Each record needs a campus value.";
  if (record.date !== null && record.date !== undefined) {
    if (typeof record.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(record.date)) return "Date must be blank or YYYY-MM-DD.";
    const parsedDate = new Date(`${record.date}T00:00:00.000Z`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== record.date) return "Enter a real calendar date.";
  }
  if (record.keywords !== undefined && (!Array.isArray(record.keywords) || record.keywords.some((item) => typeof item !== "string"))) return "Keywords must be a list of text values.";
  return null;
}

export function normalizeRecord(record) {
  const error = validateRecord(record);
  if (error) throw new Error(error);
  return {
    id: typeof record.id === "string" && record.id.trim() ? record.id.trim() : `record-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`,
    title: record.title.trim(),
    category: record.category.trim(),
    campus: record.campus.trim(),
    content: record.content.trim(),
    date: record.date || null,
    source: typeof record.source === "string" ? record.source.trim() : "",
    keywords: Array.isArray(record.keywords) ? record.keywords.map((keyword) => keyword.trim()).filter(Boolean) : []
  };
}

export function parseImport(value) {
  if (Array.isArray(value)) {
    if (!value.length) throw new Error("The JSON file has no records.");
    return value.map(normalizeRecord);
  }
  if (value && typeof value === "object" && Array.isArray(value.records)) return parseImport(value.records);
  throw new Error("Expected a JSON array of records or an object with a records array.");
}
