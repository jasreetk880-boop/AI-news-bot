import { answerQuestion, normalizeRecord, parseImport, validateRecord } from "./assistant.js";

const HISTORY_KEY = "ai-news-bot-conversations-v1";
const KNOWLEDGE_KEY = "ai-news-bot-knowledge-v1";
const quickQuestions = [
  "Summarize the weekly news",
  "Show available dated news",
  "Tell me about Koshish",
  "Tell me about MT Block",
  "Tell me about ET Block",
  "Courses and fees",
  "College timings",
  "Attendance calculator",
  "Transport routes",
  "How do I add news?"
];

const $ = (selector) => document.querySelector(selector);
const elements = {
  sidebar: $("#sidebar"), sidebarToggle: $("#sidebarToggle"), sidebarOpen: $("#sidebarOpen"), backdrop: $("#mobileBackdrop"),
  newChat: $("#newChatButton"), historyList: $("#historyList"), historyEmpty: $("#historyEmpty"),
  quickQuestions: $("#quickQuestions"), chatContent: $("#chatContent"), chatScroll: $("#chatScroll"), chatForm: $("#chatForm"),
  questionInput: $("#questionInput"), manage: $("#manageButton"), topManage: $("#topManageButton"), dataPanel: $("#dataPanel"),
  closePanel: $("#closePanel"), recordList: $("#recordList"), recordCount: $("#recordCount"), recordSearch: $("#recordSearch"),
  categoryFilter: $("#categoryFilter"), addRecord: $("#addRecordButton"), exportButton: $("#exportButton"), jsonImport: $("#jsonImport"),
  textImport: $("#textImport"), modalBackdrop: $("#modalBackdrop"), recordForm: $("#recordForm"), modalTitle: $("#recordModalTitle"),
  recordId: $("#recordId"), recordTitle: $("#recordTitle"), recordCategory: $("#recordCategory"), recordCampus: $("#recordCampus"),
  recordDate: $("#recordDate"), recordContent: $("#recordContent"), recordSource: $("#recordSource"), recordKeywords: $("#recordKeywords"),
  cancelRecord: $("#cancelRecord"), formError: $("#formError"), toast: $("#toast")
};

let conversations = [];
let currentConversationId = null;
let records = [];
let toastTimer;

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.classList.toggle("error", isError);
  elements.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 3200);
}

function saveConversations() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(conversations));
  } catch (error) {
    showToast(`Could not save chat history: ${error.message}`, true);
  }
}

function saveKnowledge() {
  try {
    localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(records));
    renderRecords();
  } catch (error) {
    showToast(`Could not save knowledge data: ${error.message}`, true);
  }
}

function loadConversations() {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    if (!Array.isArray(stored)) throw new Error("Saved chat history is not a list.");
    conversations = stored.filter((chat) => chat && typeof chat.id === "string" && Array.isArray(chat.messages));
  } catch (error) {
    conversations = [];
    showToast(`Saved chat history could not be read and was ignored: ${error.message}`, true);
  }
}

async function loadKnowledge() {
  try {
    const stored = localStorage.getItem(KNOWLEDGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) throw new Error("Saved knowledge data is not a list.");
      records = parseImport(parsed);
      return;
    }
    const response = await fetch("./data/knowledge.json");
    if (!response.ok) throw new Error(`Could not load starter knowledge (HTTP ${response.status}).`);
    records = parseImport(await response.json());
  } catch (error) {
    records = [];
    showToast(`Knowledge data could not be loaded: ${error.message}`, true);
  }
}

function getCurrentConversation() {
  return conversations.find((chat) => chat.id === currentConversationId) || null;
}

function saveMessage(role, text) {
  let conversation = getCurrentConversation();
  if (!conversation) {
    conversation = { id: crypto.randomUUID(), title: "New conversation", updatedAt: new Date().toISOString(), messages: [] };
    conversations.unshift(conversation);
    currentConversationId = conversation.id;
  }
  conversation.messages.push({ role, text, timestamp: new Date().toISOString() });
  if (role === "user" && conversation.title === "New conversation") {
    conversation.title = text.trim().replace(/\s+/g, " ").slice(0, 42) || "New conversation";
  }
  conversation.updatedAt = new Date().toISOString();
  conversations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  saveConversations();
  renderHistory();
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function renderMessage(message) {
  const wrapper = makeElement("article", `message ${message.role === "user" ? "user" : "assistant"}`);
  const avatar = makeElement("div", "message-avatar", message.role === "user" ? "You" : "✦");
  avatar.setAttribute("aria-hidden", "true");
  const body = makeElement("div", "message-body");
  const text = makeElement("div", "message-text", message.text);
  body.append(text);
  const meta = makeElement("div", "message-meta", formatTime(message.timestamp));
  if (message.role !== "user") {
    const copy = makeElement("button", "copy-button", "Copy answer");
    copy.type = "button";
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(message.text);
        showToast("Answer copied.");
      } catch {
        showToast("Clipboard access is unavailable in this browser.", true);
      }
    });
    meta.append(copy);
  }
  body.append(meta);
  wrapper.append(avatar, body);
  return wrapper;
}

function renderWelcome() {
  const welcome = makeElement("div", "welcome");
  const kicker = makeElement("div", "welcome-kicker", "✦  YOUR OFFLINE CAMPUS ASSISTANT");
  const heading = makeElement("h1");
  heading.append(document.createTextNode("Welcome to "));
  heading.append(makeElement("span", "", "AI News Bot"));
  const description = makeElement("p", "welcome-copy", "Ask about PCTE programmes, campus facilities, events and your saved news. Answers come only from the local information you provide—no internet search or external AI service.");
  const label = makeElement("p", "suggestions-label", "Try a question");
  const chips = makeElement("div", "suggestions");
  quickQuestions.filter((question) => question !== "Summarize the weekly news").forEach((question) => {
    const button = makeElement("button", "suggestion-chip", question);
    button.type = "button";
    button.addEventListener("click", () => submitQuestion(question));
    chips.append(button);
  });
  welcome.append(kicker, heading, description, label, chips);
  return welcome;
}

function renderChat() {
  elements.chatContent.replaceChildren();
  const conversation = getCurrentConversation();
  if (!conversation || conversation.messages.length === 0) elements.chatContent.append(renderWelcome());
  else {
    const messages = makeElement("div", "messages");
    conversation.messages.forEach((message) => messages.append(renderMessage(message)));
    elements.chatContent.append(messages);
  }
  requestAnimationFrame(() => { elements.chatScroll.scrollTop = elements.chatScroll.scrollHeight; });
}

function renderHistory() {
  const visible = conversations;
  elements.historyList.replaceChildren();
  elements.historyEmpty.hidden = visible.length > 0;
  elements.historyEmpty.textContent = "Your saved chats will appear here.";
  visible.forEach((chat) => {
    const row = makeElement("div", `history-item${chat.id === currentConversationId ? " active" : ""}`);
    const open = makeElement("button", "history-title", chat.title);
    open.type = "button";
    open.title = chat.title;
    open.addEventListener("click", () => {
      currentConversationId = chat.id;
      renderHistory();
      renderChat();
      closeSidebar();
    });
    const remove = makeElement("button", "history-delete", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", `Delete conversation ${chat.title}`);
    remove.title = "Delete conversation";
    remove.addEventListener("click", () => {
      if (!confirm(`Delete “${chat.title}”? This cannot be undone.`)) return;
      conversations = conversations.filter((item) => item.id !== chat.id);
      if (currentConversationId === chat.id) currentConversationId = null;
      saveConversations();
      renderHistory();
      renderChat();
    });
    row.append(open, remove);
    elements.historyList.append(row);
  });
}

function renderQuickQuestions() {
  quickQuestions.forEach((question, index) => {
    const button = makeElement("button", "quick-link");
    button.type = "button";
    const icon = makeElement("span", "quick-icon", ["◷", "▤", "✦", "▦", "▦", "◇", "◷", "％", "↔", "＋"][index]);
    icon.setAttribute("aria-hidden", "true");
    button.append(icon, document.createTextNode(question));
    button.addEventListener("click", () => {
      submitQuestion(question);
      closeSidebar();
    });
    elements.quickQuestions.append(button);
  });
}

function submitQuestion(rawQuestion) {
  const question = rawQuestion.trim();
  if (!question) return;
  saveMessage("user", question);
  renderChat();
  const loading = makeElement("div", "message assistant");
  const loadingAvatar = makeElement("div", "message-avatar", "✦");
  const loadingText = makeElement("div", "loading");
  loadingText.append(makeElement("span", "loading-dot"), document.createTextNode("Searching local records…"));
  loading.append(loadingAvatar, loadingText);
  elements.chatContent.querySelector(".messages")?.append(loading);
  requestAnimationFrame(() => {
    setTimeout(() => {
      const result = answerQuestion(question, records);
      loading.remove();
      saveMessage("assistant", result.text);
      renderChat();
    }, 40);
  });
}

function openNewChat() {
  currentConversationId = null;
  renderHistory();
  renderChat();
  elements.questionInput.focus();
}

function openPanel() {
  elements.dataPanel.classList.add("open");
  elements.dataPanel.setAttribute("aria-hidden", "false");
  renderRecords();
  elements.closePanel.focus();
}

function closePanel() {
  elements.dataPanel.classList.remove("open");
  elements.dataPanel.setAttribute("aria-hidden", "true");
}

function openSidebar() {
  elements.sidebar.classList.add("open");
  elements.backdrop.classList.add("show");
}

function closeSidebar() {
  elements.sidebar.classList.remove("open");
  elements.backdrop.classList.remove("show");
}

function renderRecords() {
  const filter = elements.recordSearch.value.trim().toLocaleLowerCase();
  const category = elements.categoryFilter.value;
  const visible = records.filter((record) => (!category || record.category === category) && `${record.title} ${record.content} ${record.keywords.join(" ")}`.toLocaleLowerCase().includes(filter));
  const categories = [...new Set(records.map((record) => record.category))].sort();
  const selected = elements.categoryFilter.value;
  elements.categoryFilter.replaceChildren(new Option("All categories", ""));
  categories.forEach((item) => elements.categoryFilter.add(new Option(item, item)));
  if (categories.includes(selected)) elements.categoryFilter.value = selected;
  elements.recordCount.textContent = `${visible.length} of ${records.length} records`;
  elements.recordList.replaceChildren();
  if (!visible.length) {
    elements.recordList.append(makeElement("p", "muted", records.length ? "No records match this search." : "No local records yet. Add a record or import data."));
    return;
  }
  visible.forEach((record) => {
    const card = makeElement("article", "record-card");
    const main = makeElement("div", "record-card-main");
    main.append(makeElement("p", "record-card-title", record.title));
    main.append(makeElement("div", "record-card-meta", `${record.category} · ${record.campus}${record.date ? ` · ${record.date}` : ""}`));
    const actions = makeElement("div", "record-actions");
    const edit = makeElement("button", "", "Edit");
    edit.type = "button";
    edit.addEventListener("click", () => showRecordForm(record));
    const remove = makeElement("button", "", "Delete");
    remove.type = "button";
    remove.addEventListener("click", () => {
      if (!confirm(`Delete “${record.title}”?`)) return;
      records = records.filter((item) => item.id !== record.id);
      saveKnowledge();
      showToast("Record deleted.");
    });
    actions.append(edit, remove);
    card.append(main, actions);
    elements.recordList.append(card);
  });
}

function showRecordForm(record = null, defaults = {}) {
  elements.recordForm.reset();
  elements.recordId.value = record?.id || "";
  elements.recordTitle.value = record?.title || defaults.title || "";
  elements.recordCategory.value = record?.category || defaults.category || "campus";
  elements.recordCampus.value = record?.campus || defaults.campus || "not-applicable";
  elements.recordDate.value = record?.date || defaults.date || "";
  elements.recordContent.value = record?.content || defaults.content || "";
  elements.recordSource.value = record?.source || defaults.source || "";
  elements.recordKeywords.value = (record?.keywords || defaults.keywords || []).join(", ");
  elements.modalTitle.textContent = record ? "Edit record" : (defaults.category === "news" ? "Add news entry" : "Add record");
  elements.formError.textContent = "";
  elements.modalBackdrop.hidden = false;
  elements.recordTitle.focus();
}

function closeRecordForm() {
  elements.modalBackdrop.hidden = true;
}

function makeUniqueRecords(items) {
  const ids = new Set();
  return items.map((record) => {
    let candidate = record;
    while (ids.has(candidate.id)) candidate = { ...candidate, id: crypto.randomUUID() };
    ids.add(candidate.id);
    return candidate;
  });
}

async function importJson(file) {
  try {
    const imported = parseImport(JSON.parse(await file.text()));
    if (!confirm(`Replace your ${records.length} current records with ${imported.length} imported records? Export a backup first if needed.`)) return;
    records = makeUniqueRecords(imported);
    saveKnowledge();
    showToast(`${records.length} knowledge records imported.`);
  } catch (error) {
    showToast(`Import failed: ${error.message}`, true);
  } finally {
    elements.jsonImport.value = "";
  }
}

async function importText(file) {
  try {
    const content = (await file.text()).trim();
    if (!content) throw new Error("The text file is empty.");
    const title = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "Imported text";
    const record = normalizeRecord({ title, category: "other", campus: "not-applicable", content, date: null, source: file.name, keywords: [] });
    records = makeUniqueRecords([...records, record]);
    saveKnowledge();
    showToast("Text imported as one knowledge record.");
  } catch (error) {
    showToast(`Text import failed: ${error.message}`, true);
  } finally {
    elements.textImport.value = "";
  }
}

function exportJson() {
  try {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ai-news-bot-knowledge-backup.json";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Knowledge backup downloaded.");
  } catch (error) {
    showToast(`Export failed: ${error.message}`, true);
  }
}

function sendForm() {
  submitQuestion(elements.questionInput.value);
  elements.questionInput.value = "";
  elements.questionInput.style.height = "auto";
}

elements.chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendForm();
});
elements.questionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendForm();
  }
});
elements.questionInput.addEventListener("input", () => {
  elements.questionInput.style.height = "auto";
  elements.questionInput.style.height = `${Math.min(elements.questionInput.scrollHeight, 145)}px`;
});
elements.newChat.addEventListener("click", openNewChat);
elements.manage.addEventListener("click", openPanel);
elements.topManage.addEventListener("click", openPanel);
elements.closePanel.addEventListener("click", closePanel);
elements.addRecord.addEventListener("click", () => showRecordForm());
elements.exportButton.addEventListener("click", exportJson);
elements.jsonImport.addEventListener("change", (event) => { if (event.target.files?.[0]) importJson(event.target.files[0]); });
elements.textImport.addEventListener("change", (event) => { if (event.target.files?.[0]) importText(event.target.files[0]); });
elements.recordSearch.addEventListener("input", renderRecords);
elements.categoryFilter.addEventListener("change", renderRecords);
elements.cancelRecord.addEventListener("click", closeRecordForm);
$("#cancelRecordTop").addEventListener("click", closeRecordForm);
elements.modalBackdrop.addEventListener("click", (event) => { if (event.target === elements.modalBackdrop) closeRecordForm(); });
elements.sidebarToggle.addEventListener("click", closeSidebar);
elements.sidebarOpen.addEventListener("click", openSidebar);
elements.backdrop.addEventListener("click", closeSidebar);

elements.recordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const item = {
    id: elements.recordId.value || crypto.randomUUID(),
    title: elements.recordTitle.value,
    category: elements.recordCategory.value,
    campus: elements.recordCampus.value,
    date: elements.recordDate.value || null,
    content: elements.recordContent.value,
    source: elements.recordSource.value,
    keywords: elements.recordKeywords.value.split(",").map((keyword) => keyword.trim()).filter(Boolean)
  };
  const error = validateRecord(item);
  if (error) {
    elements.formError.textContent = error;
    return;
  }
  const normalized = normalizeRecord(item);
  if (records.some((record) => record.id === normalized.id)) records = records.map((record) => record.id === normalized.id ? normalized : record);
  else records = [...records, normalized];
  saveKnowledge();
  closeRecordForm();
  showToast("Knowledge record saved.");
});

renderQuickQuestions();
loadConversations();
renderHistory();
loadKnowledge().then(() => renderRecords());
renderChat();
