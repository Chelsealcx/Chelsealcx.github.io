const recordsKey = "minimal-journal-records";
const tagsKey = "minimal-journal-tags";

const moods = [
  { id: "happy", label: "开心", icon: "😊", color: "#d8b26e" },
  { id: "calm", label: "平静", icon: "😌", color: "#a6b69c" },
  { id: "tired", label: "疲惫", icon: "😮‍💨", color: "#c7b9a3" },
  { id: "anxious", label: "焦虑", icon: "😬", color: "#c9a3a3" },
  { id: "low", label: "低落", icon: "😔", color: "#a8a9b8" },
  { id: "excited", label: "兴奋", icon: "🤩", color: "#d6a87c" },
  { id: "peaceful", label: "放松", icon: "🫧", color: "#a7b7b0" },
  { id: "sad", label: "难过", icon: "😢", color: "#a2a9c1" },
  { id: "stressed", label: "压力大", icon: "😵‍💫", color: "#b9a9a0" },
  { id: "motivated", label: "有动力", icon: "💪", color: "#b2b28a" },
  { id: "grateful", label: "感激", icon: "🙏", color: "#c9b39f" },
  { id: "confident", label: "自信", icon: "😎", color: "#b3a089" }
];

const state = {
  records: [],
  tags: [],
  activeTab: "records",
  range: "week",
  filter: null,
  editingId: null,
  search: "",
  aiSummary: null,
  aiStatus: "idle",
  chat: []
};

const dom = {
  pageTitle: document.getElementById("pageTitle"),
  pageSubtitle: document.getElementById("pageSubtitle"),
  searchToggle: document.getElementById("searchToggle"),
  searchRow: document.getElementById("searchRow"),
  searchInput: document.getElementById("searchInput"),
  recordsList: document.getElementById("recordsList"),
  chatTab: document.getElementById("chatTab"),
  chatMessages: document.getElementById("chatMessages"),
  chatInput: document.getElementById("chatInput"),
  chatSend: document.getElementById("chatSend"),
  generateRecordBtn: document.getElementById("generateRecordBtn"),
  recordModal: document.getElementById("recordModal"),
  detailModal: document.getElementById("detailModal"),
  detailBody: document.getElementById("detailBody"),
  detailEdit: document.getElementById("detailEdit"),
  detailDelete: document.getElementById("detailDelete"),
  newRecordBtn: document.getElementById("newRecordBtn"),
  cancelRecord: document.getElementById("cancelRecord"),
  saveRecord: document.getElementById("saveRecord"),
  recordText: document.getElementById("recordText"),
  recordImages: document.getElementById("recordImages"),
  imagePreview: document.getElementById("imagePreview"),
  moodOptions: document.getElementById("moodOptions"),
  addCustomMood: document.getElementById("addCustomMood"),
  tagInput: document.getElementById("tagInput"),
  tagSuggestions: document.getElementById("tagSuggestions"),
  rangeActions: document.getElementById("rangeActions"),
  customRange: document.getElementById("customRange"),
  customStart: document.getElementById("customStart"),
  customEnd: document.getElementById("customEnd"),
  generateBtn: document.getElementById("generateBtn"),
  summaryText: document.getElementById("summaryText"),
  editSummary: document.getElementById("editSummary"),
  stopSummary: document.getElementById("stopSummary"),
  pieChart: document.getElementById("pieChart"),
  pieLegend: document.getElementById("pieLegend"),
  tagCloud: document.getElementById("tagCloud"),
  moodFilterRow: document.getElementById("moodFilterRow"),
  tagFilterRow: document.getElementById("tagFilterRow"),
  recordsTab: document.getElementById("recordsTab"),
  reviewTab: document.getElementById("reviewTab"),
  navItems: document.querySelectorAll(".nav-item"),
  cardTemplate: document.getElementById("cardTemplate"),
  closeDetail: document.getElementById("closeDetail")
};

function loadState() {
  const storedRecords = localStorage.getItem(recordsKey);
  const storedTags = localStorage.getItem(tagsKey);
  state.records = storedRecords ? JSON.parse(storedRecords) : seedRecords();
  state.tags = storedTags ? JSON.parse(storedTags) : collectTags(state.records);
}

function saveState() {
  localStorage.setItem(recordsKey, JSON.stringify(state.records));
  localStorage.setItem(tagsKey, JSON.stringify(state.tags));
}

function seedRecords() {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  return [
    makeRecord("今天完成了一个小迭代，心情稳稳的。", "calm", ["工作", "节奏"], ["https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80"], new Date(now - day)),
    makeRecord("午后有点疲惫，但散步之后好多了。", "tired", ["身体", "散步"], [], new Date(now - day * 2)),
    makeRecord("焦虑的情绪出现了一阵，不过写下来就轻了一点。", "anxious", ["情绪", "记录"], [], new Date(now - day * 4)),
    makeRecord("和朋友聊天，开心值回升。", "happy", ["朋友", "轻松"], [], new Date(now - day * 7)),
    makeRecord("今天有点低落，想休息。", "low", ["自我", "休息"], [], new Date(now - day * 10))
  ];
}

function makeRecord(text, moodId, tags, images, date) {
  return {
    id: crypto.randomUUID(),
    text,
    moodId,
    tags,
    images,
    date: date.toISOString()
  };
}

function collectTags(records) {
  const set = new Set();
  records.forEach((record) => record.tags.forEach((tag) => set.add(tag)));
  return Array.from(set);
}

function renderMoodOptions(selectedId) {
  dom.moodOptions.innerHTML = "";
  moods.forEach((mood) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mood-option" + (selectedId === mood.id ? " active" : "");
    btn.textContent = `${mood.icon} ${mood.label}`;
    btn.dataset.id = mood.id;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mood-option").forEach((el) => el.classList.remove("active"));
      btn.classList.add("active");
    });
    dom.moodOptions.appendChild(btn);
  });
}

function renderTagSuggestions() {
  dom.tagSuggestions.innerHTML = "";
  state.tags.forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    dom.tagSuggestions.appendChild(option);
  });
}

function renderRecords() {
  dom.recordsList.innerHTML = "";
  const filtered = applySearch(sortByDate(state.records));
  filtered.forEach((record) => {
    dom.recordsList.appendChild(buildCard(record));
  });
}

function renderChat() {
  dom.chatMessages.innerHTML = "";
  if (state.chat.length === 0) {
    appendChatBubble("ai", "你好，我在这里陪你聊聊。可以说说今天发生了什么吗？");
    return;
  }
  state.chat.forEach((msg) => appendChatBubble(msg.role, msg.content));
}

function appendChatBubble(role, content) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = content;
  dom.chatMessages.appendChild(bubble);
  dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}

function renderReview() {
  const rangeRecords = applyRange(state.records);
  const filteredRecords = applyReviewFilter(rangeRecords);
  renderSummary(rangeRecords, filteredRecords);
}

function buildCard(record) {
  const card = dom.cardTemplate.content.firstElementChild.cloneNode(true);
  const mood = moods.find((m) => m.id === record.moodId);
  card.querySelector(".mood").textContent = mood ? mood.icon : "🙂";
  card.querySelector(".text").textContent = record.text;
  const tagRow = card.querySelector(".tag-row");
  record.tags.slice(0, 3).forEach((tag) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    tagRow.appendChild(span);
  });
  const thumb = card.querySelector(".thumb");
  if (record.images && record.images.length) {
    const img = document.createElement("img");
    img.src = record.images[0];
    thumb.innerHTML = "";
    thumb.appendChild(img);
    card.appendChild(thumb);
  } else {
    thumb.remove();
  }
  card.querySelector(".card-footer").textContent = formatDate(record.date);

  card.addEventListener("click", (event) => {
    if (event.target.closest(".menu-btn") || event.target.closest(".menu")) {
      return;
    }
    openDetail(record);
  });

  const menu = card.querySelector(".card-menu");
  const menuBtn = card.querySelector(".menu-btn");
  menuBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    menu.classList.toggle("open");
  });

  menu.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      menu.classList.remove("open");
      const action = item.dataset.action;
      if (action === "edit") {
        openRecordModal(record);
      } else if (action === "delete") {
        deleteRecord(record.id);
      }
    });
  });

  return card;
}

function formatDate(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function openRecordModal(record, presetText) {
  state.editingId = record ? record.id : null;
  if (record) {
    dom.recordText.value = record.text;
  } else if (presetText) {
    dom.recordText.value = presetText;
  } else {
    dom.recordText.value = "";
  }
  dom.tagInput.value = record ? record.tags.join(" ") : "";
  dom.imagePreview.innerHTML = "";
  dom.recordImages.value = "";
  if (record && record.images) {
    record.images.forEach((src) => addPreviewImage(src));
    dom.recordImages.dataset.images = JSON.stringify(record.images);
  } else {
    dom.recordImages.dataset.images = "[]";
  }
  renderMoodOptions(record ? record.moodId : moods[0].id);
  dom.recordModal.classList.add("open");
  dom.recordModal.setAttribute("aria-hidden", "false");
}

function closeRecordModal() {
  dom.recordModal.classList.remove("open");
  dom.recordModal.setAttribute("aria-hidden", "true");
}

function openDetail(record) {
  state.editingId = record.id;
  const mood = moods.find((m) => m.id === record.moodId);
  dom.detailBody.innerHTML = `
    <div class="detail">
      <div class="detail-head">
        <div class="mood">${mood ? mood.icon : "🙂"}</div>
        <div>
          <div class="detail-date">${formatDate(record.date)}</div>
          <div class="detail-text">${record.text}</div>
        </div>
      </div>
      <div class="detail-tags">${record.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>
      <div class="detail-images">
        ${record.images.map((src) => `<img src="${src}" alt="记录图片">`).join("")}
      </div>
    </div>
  `;
  dom.detailModal.classList.add("open");
  dom.detailModal.setAttribute("aria-hidden", "false");
}

function closeDetailModal() {
  dom.detailModal.classList.remove("open");
  dom.detailModal.setAttribute("aria-hidden", "true");
}

function addPreviewImage(src) {
  const img = document.createElement("img");
  img.src = src;
  dom.imagePreview.appendChild(img);
}

function deleteRecord(id) {
  state.records = state.records.filter((record) => record.id !== id);
  state.tags = collectTags(state.records);
  saveState();
  renderRecords();
  renderReview();
}

function saveRecord() {
  const text = dom.recordText.value.trim();
  if (!text) {
    alert("请先填写记录内容。");
    return;
  }
  const moodBtn = document.querySelector(".mood-option.active");
  const moodId = moodBtn ? moodBtn.dataset.id : moods[0].id;
  const tags = dom.tagInput.value
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);

  const images = JSON.parse(dom.recordImages.dataset.images || "[]");

  if (state.editingId) {
    const record = state.records.find((item) => item.id === state.editingId);
    if (record) {
      record.text = text;
      record.moodId = moodId;
      record.tags = tags;
      record.images = images;
    }
  } else {
    state.records.unshift(makeRecord(text, moodId, tags, images, new Date()));
  }

  state.tags = collectTags(state.records);
  saveState();
  renderTagSuggestions();
  renderRecords();
  renderReview();
  closeRecordModal();
}

function handleImages(files) {
  const readers = Array.from(files).map((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  });

  Promise.all(readers).then((results) => {
    dom.recordImages.dataset.images = JSON.stringify(results);
    dom.imagePreview.innerHTML = "";
    results.forEach((src) => addPreviewImage(src));
  });
}

function sortByDate(records) {
  return [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function applySearch(records) {
  if (!state.search) return records;
  return records.filter((record) => {
    const text = record.text.toLowerCase();
    const tagText = record.tags.join(" ").toLowerCase();
    const q = state.search.toLowerCase();
    return text.includes(q) || tagText.includes(q);
  });
}

function applyRange(records) {
  const now = new Date();
  let start = null;
  let end = new Date();

  if (state.range === "week") {
    const day = now.getDay() || 7;
    start = new Date(now);
    start.setDate(now.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
  } else if (state.range === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (state.range === "year") {
    start = new Date(now.getFullYear(), 0, 1);
  } else if (state.range === "custom") {
    start = dom.customStart.value ? new Date(dom.customStart.value) : null;
    end = dom.customEnd.value ? new Date(dom.customEnd.value) : end;
  }

  return records.filter((record) => {
    const date = new Date(record.date);
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  });
}

function applyRangeToRecords(records, range, startInput, endInput) {
  const now = new Date();
  let start = null;
  let end = new Date();

  if (range === "week") {
    const day = now.getDay() || 7;
    start = new Date(now);
    start.setDate(now.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
  } else if (range === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (range === "custom") {
    start = startInput ? new Date(startInput) : null;
    end = endInput ? new Date(endInput) : end;
  }

  return records.filter((record) => {
    const date = new Date(record.date);
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  });
}

function applyReviewFilter(records) {
  if (!state.filter) return records;
  if (state.filter.type === "mood") {
    return records.filter((record) => record.moodId === state.filter.value);
  }
  if (state.filter.type === "tag") {
    return records.filter((record) => record.tags.includes(state.filter.value));
  }
  return records;
}

function renderSummary(allRecords, filteredRecords) {
  const moodCounts = countByMood(allRecords);
  const tagCounts = countByTag(allRecords);
  renderPie(moodCounts);
  renderTagCloud(tagCounts);
  renderFilters();

  const total = allRecords.length;
  const dominantMood = moodCounts[0] ? moodCounts[0].label : "平稳";
  const topTag = tagCounts[0] ? tagCounts[0].label : "日常";
  const fallbackSummary = total
    ? `这段时间的记录读起来是有脉络的：整体气质偏${dominantMood}，共留下了 ${total} 条片段。围绕「${topTag}」的话题出现得最多，说明它在你的日常里占据了重要位置。读到这些文字，会感觉你在忙碌与喘息之间不断调整节奏，既留意到了压力与疲惫，也没有忽略那些让人踏实的小瞬间。`
    : "这一段时间还没有记录，等你写下第一条，回顾才会真正开始。";

  if (dom.summaryText.dataset.locked !== "true") {
    if (state.aiStatus === "idle" && !state.aiSummary) {
      dom.summaryText.textContent = "可用 AI 生成回顾。点击“生成回顾”开始。";
    } else {
      dom.summaryText.textContent = state.aiSummary || fallbackSummary;
    }
  }

  // 回顾页不展示记录列表
}

function renderFilters() {
  dom.moodFilterRow.innerHTML = "";
  dom.tagFilterRow.innerHTML = "";
  if (!state.filter) return;
  const row = state.filter.type === "mood" ? dom.moodFilterRow : dom.tagFilterRow;
  const label = state.filter.type === "mood" ? "情绪" : "标签";
  const name = state.filter.type === "mood" ? moods.find((m) => m.id === state.filter.value)?.label : state.filter.value;
  const info = document.createElement("div");
  info.textContent = `筛选：${label} = ${name}`;
  const clear = document.createElement("button");
  clear.className = "ghost-btn";
  clear.textContent = "清除";
  clear.addEventListener("click", () => {
    state.filter = null;
    renderReview();
  });
  row.appendChild(info);
  row.appendChild(clear);
}

function countByMood(records) {
  const counts = moods.map((mood) => ({
    id: mood.id,
    label: mood.label,
    color: mood.color,
    count: 0
  }));
  records.forEach((record) => {
    const item = counts.find((m) => m.id === record.moodId);
    if (item) item.count += 1;
  });
  return counts.filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
}

function countByTag(records) {
  const map = new Map();
  records.forEach((record) => {
    record.tags.forEach((tag) => {
      map.set(tag, (map.get(tag) || 0) + 1);
    });
  });
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function renderPie(data) {
  dom.pieChart.innerHTML = "";
  dom.pieLegend.innerHTML = "";
  if (data.length === 0) {
    dom.pieChart.textContent = "暂无数据";
    return;
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const size = 160;
  const radius = size / 2 - 6;
  let angle = 0;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);

  data.forEach((item) => {
    const slice = (item.count / total) * 360;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", describeArc(size / 2, size / 2, radius, angle, angle + slice));
    path.setAttribute("fill", item.color);
    path.style.cursor = "pointer";
    path.addEventListener("click", () => {
      state.filter = { type: "mood", value: item.id };
      renderReview();
    });
    svg.appendChild(path);
    angle += slice;
  });

  dom.pieChart.appendChild(svg);

  data.forEach((item) => {
    const li = document.createElement("li");
    const dot = document.createElement("span");
    dot.style.background = item.color;
    const text = document.createElement("button");
    text.className = "ghost-btn";
    text.textContent = `${item.label} ${(item.count / total * 100).toFixed(0)}%`;
    text.addEventListener("click", () => {
      state.filter = { type: "mood", value: item.id };
      renderReview();
    });
    li.appendChild(dot);
    li.appendChild(text);
    dom.pieLegend.appendChild(li);
  });
}

function renderTagCloud(tags) {
  dom.tagCloud.innerHTML = "";
  if (tags.length === 0) {
    dom.tagCloud.textContent = "暂无标签";
    return;
  }
  const max = tags[0].count || 1;
  tags.forEach((item) => {
    const btn = document.createElement("button");
    const size = 12 + Math.round((item.count / max) * 14);
    const rotate = (Math.random() * 14 - 7).toFixed(1);
    btn.style.fontSize = `${size}px`;
    btn.style.transform = `rotate(${rotate}deg)`;
    btn.classList.add("cloud-item");
    btn.textContent = item.label;
    btn.addEventListener("click", () => {
      state.filter = { type: "tag", value: item.label };
      renderReview();
    });
    dom.tagCloud.appendChild(btn);
  });
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", x, y,
    "L", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "Z"
  ].join(" ");
}

function polarToCartesian(x, y, radius, angle) {
  const radians = (angle - 90) * Math.PI / 180.0;
  return {
    x: x + (radius * Math.cos(radians)),
    y: y + (radius * Math.sin(radians))
  };
}

function setTab(tab) {
  state.activeTab = tab;
  dom.chatTab.classList.toggle("active", tab === "chat");
  dom.recordsTab.classList.toggle("active", tab === "records");
  dom.reviewTab.classList.toggle("active", tab === "review");
  dom.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.tab === tab);
  });
  dom.newRecordBtn.style.display = tab === "records" ? "grid" : "none";
  if (tab === "chat") {
    dom.pageTitle.textContent = "聊天";
    dom.pageSubtitle.textContent = "把今天慢慢说完";
  } else if (tab === "records") {
    dom.pageTitle.textContent = "今天";
    dom.pageSubtitle.textContent = "记录你的一天";
  } else {
    dom.pageTitle.textContent = "回顾";
    dom.pageSubtitle.textContent = "这一段时间我过得怎样";
  }
}

function handleRangeClick(event) {
  if (!event.target.matches(".pill")) return;
  dom.rangeActions.querySelectorAll(".pill").forEach((pill) => pill.classList.remove("active"));
  event.target.classList.add("active");
  state.range = event.target.dataset.range;
  dom.customRange.classList.toggle("active", state.range === "custom");
}

function handleSummaryEdit() {
  const locked = dom.summaryText.dataset.locked === "true";
  dom.summaryText.contentEditable = locked ? "false" : "true";
  dom.summaryText.dataset.locked = locked ? "false" : "true";
  dom.editSummary.textContent = locked ? "编辑" : "完成";
}

async function handleChatSend() {
  const text = dom.chatInput.value.trim();
  if (!text) return;
  dom.chatInput.value = "";
  state.chat.push({ role: "user", content: text });
  renderChat();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: state.chat })
    });
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    if (data.reply) {
      state.chat.push({ role: "ai", content: data.reply });
      renderChat();
    }
  } catch (err) {
    state.chat.push({ role: "ai", content: "我这边有点卡住了，稍后再试试，好吗？" });
    renderChat();
  }
}

async function handleGenerateRecordFromChat() {
  const userMessages = state.chat.filter((m) => m.role === "user").map((m) => m.content);
  if (!userMessages.length) {
    alert("先聊一聊，再生成记录会更准确。");
    return;
  }
  dom.generateRecordBtn.disabled = true;
  dom.generateRecordBtn.textContent = "生成中...";
  try {
    const res = await fetch("/api/chat/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: userMessages })
    });
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    if (data.summary) {
      setTab("records");
      openRecordModal(null, data.summary);
    }
  } catch (err) {
    alert("生成失败，请稍后重试。");
  } finally {
    dom.generateRecordBtn.disabled = false;
    dom.generateRecordBtn.textContent = "生成记录";
  }
}

async function fetchAiSummary() {
  const records = applyRange(state.records);
  if (!records.length) {
    state.aiSummary = "该范围内没有记录，先写一条再生成。";
    state.aiStatus = "empty";
    dom.stopSummary.hidden = true;
    renderReview();
    return;
  }
  if (state.aiController) {
    state.aiController.abort();
  }
  state.aiController = new AbortController();
  state.aiStatus = "loading";
  dom.stopSummary.hidden = false;
  dom.summaryText.textContent = "正在生成回顾...";
  try {
    const payloadRecords = records.map((record) => ({
      text: record.text,
      tags: record.tags,
      moodId: record.moodId,
      date: record.date
    }));
    const res = await fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        range: state.range,
        start: dom.customStart.value || null,
        end: dom.customEnd.value || null,
        records: payloadRecords
      }),
      signal: state.aiController.signal
    });
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    state.aiSummary = data.summary || null;
    
    state.aiStatus = "done";
  } catch (err) {
    if (err.name === "AbortError") {
      state.aiStatus = "idle";
    } else {
      state.aiStatus = "idle";
    }
    state.aiSummary = null;
  }
  dom.stopSummary.hidden = true;
  renderReview();
}

function initEvents() {
  dom.newRecordBtn.addEventListener("click", () => openRecordModal());
  dom.cancelRecord.addEventListener("click", closeRecordModal);
  dom.saveRecord.addEventListener("click", saveRecord);
  dom.recordImages.addEventListener("change", (event) => handleImages(event.target.files));
  dom.chatSend.addEventListener("click", handleChatSend);
  dom.chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleChatSend();
    }
  });
  dom.generateRecordBtn.addEventListener("click", handleGenerateRecordFromChat);
  dom.addCustomMood.addEventListener("click", () => {
    const label = prompt("请输入你的情绪标签");
    if (!label) return;
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = `custom-${Date.now()}`;
    moods.push({ id, label: trimmed, icon: "✨", color: "#bfa98c" });
    renderMoodOptions(id);
  });
  dom.closeDetail.addEventListener("click", closeDetailModal);
  dom.detailEdit.addEventListener("click", () => {
    const record = state.records.find((item) => item.id === state.editingId);
    if (record) {
      closeDetailModal();
      openRecordModal(record);
    }
  });
  dom.detailDelete.addEventListener("click", () => {
    if (!state.editingId) return;
    deleteRecord(state.editingId);
    closeDetailModal();
  });
  dom.searchToggle.addEventListener("click", () => {
    dom.searchRow.classList.toggle("active");
    dom.searchInput.focus();
  });
  dom.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    renderRecords();
  });

  dom.rangeActions.addEventListener("click", handleRangeClick);
  dom.generateBtn.addEventListener("click", () => {
    state.filter = null;
    fetchAiSummary();
  });

  dom.editSummary.addEventListener("click", handleSummaryEdit);
  dom.stopSummary.addEventListener("click", () => {
    if (state.aiController) {
      state.aiController.abort();
    }
    dom.stopSummary.hidden = true;
    state.aiStatus = "idle";
    renderReview();
  });

  dom.navItems.forEach((item) => {
    item.addEventListener("click", () => {
      setTab(item.dataset.tab);
      if (item.dataset.tab === "review") {
        renderReview();
      }
      if (item.dataset.tab === "chat") {
        renderChat();
      }
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".card-menu").forEach((menu) => menu.classList.remove("open"));
  });

  dom.recordModal.addEventListener("click", (event) => {
    if (event.target === dom.recordModal) closeRecordModal();
  });
  dom.detailModal.addEventListener("click", (event) => {
    if (event.target === dom.detailModal) closeDetailModal();
  });
}

function init() {
  loadState();
  renderTagSuggestions();
  renderMoodOptions(moods[0].id);
  renderRecords();
  renderReview();
  renderChat();
  initEvents();
  setTab("chat");
}

init();











