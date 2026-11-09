/**
 * 轻量气泡头像库 for SillyTavern.
 * Compatible with the bundled regex that marks speaker avatar <img> tags.
 * Data model: global library in extensionSettings, per-chat selection in chatMetadata,
 * compressed local images in localforage (browser IndexedDB).
 */
const KEY = 'light_bubble_avatar_library_v1';
const IMAGE_KEY = 'lb-avatar-image:';
const STICKER_IMAGE_KEY = 'lb-sticker-image:';
const AVATAR_CATS = [
  ['char', 'CHAR'], ['user', 'USER'], ['npc', 'NPC'], ['couple', '情侣头像'],
];
const CATS = [...AVATAR_CATS, ['sticker', '表情包']];
const SOURCE = [
  ['char', '看雪小猫', 'KbcQEW7.jpg', '原预设默认头像'],
  ['char', '边牧吐舌', 'f9X6tcu.jpg', ''],
  ['char', '弹琴奶牛猫', 'f76RLjj.jpg', ''],
  ['char', '灰色山雀', 'f76lDMJ.jpg', ''],
  ['user', '微笑猫猫', 'Kbcpies.jpg', '原预设默认头像'],
  ['npc', 'NPC通用头像', 'Kbc8AXf.jpg', '通用头像'],
];
const base = SOURCE.map(([category, name, code, note], i) => ({
  id: `preset_${i + 1}`, category, name, note, source: 'url',
  url: `https://iili.io/${code}`, pair: '', side: '',
}));
base.push(
  { id: 'preset_couple_char', category: 'couple', name: '动漫情侣男头', note: '金发少年垂眸看揽住他手臂的白发少女', source: 'url', url: 'https://iili.io/faaU7zN.jpg', pair: '动漫金发×白发', side: 'char' },
  { id: 'preset_couple_user', category: 'couple', name: '动漫情侣女头', note: '白发蓝瞳少女揽住左边少年手臂', source: 'url', url: 'https://iili.io/faa4wLN.jpg', pair: '动漫金发×白发', side: 'user' },
);

const imgCache = new Map();
const stickerCache = new Map();
let panel, listEl, tab = 'char', speaker = '', currentRequest = 0;
let localDB;
let renderTimer;
let startupDone = false;
function ctx() { return globalThis.SillyTavern?.getContext?.(); }
function store() {
  const c = ctx();
  if (!c?.extensionSettings) return { items: base.map(x => ({ ...x })), stickers: [], allowAiUser: false };
  if (!c.extensionSettings[KEY]) {
    c.extensionSettings[KEY] = { items: base.map(x => ({ ...x })), stickers: [], allowAiUser: false };
    c.saveSettingsDebounced?.();
  }
  const s = c.extensionSettings[KEY];
  if (!Array.isArray(s.items)) s.items = base.map(x => ({ ...x }));
  if (!Array.isArray(s.stickers)) s.stickers = [];
  if (typeof s.allowAiUser !== 'boolean') s.allowAiUser = false;
  return s;
}
function selections() { return ctx()?.chatMetadata?.[KEY]?.selectedByName || {}; }
function saveLibrary() { ctx()?.saveSettingsDebounced?.(); }
function status(message, error = false) {
  const node = panel?.querySelector('#lb-status');
  if (node) { node.textContent = message; node.classList.toggle('lb-error', error); }
}
function imgUrl(item) {
  if (!item) return '';
  if (item.source === 'local') return imgCache.get(item.id) || '';
  return item.url || '';
}
async function ensureImage(item) {
  if (!item) return '';
  if (item.source !== 'local') return imgUrl(item);
  if (imgCache.has(item.id)) return imgCache.get(item.id);
  const data = await localDB?.getItem(`${IMAGE_KEY}${item.id}`);
  if (typeof data === 'string' && data.startsWith('data:image/')) imgCache.set(item.id, data);
  return imgCache.get(item.id) || '';
}
function stickerUrl(item) {
  if (!item) return '';
  return item.source === 'local' ? stickerCache.get(item.id) || '' : item.url || '';
}
async function ensureSticker(item) {
  if (!item) return '';
  if (item.source !== 'local') return stickerUrl(item);
  if (stickerCache.has(item.id)) return stickerCache.get(item.id);
  const data = await localDB?.getItem(`${STICKER_IMAGE_KEY}${item.id}`);
  if (typeof data === 'string' && /^data:image\/(png|jpeg|gif|webp);base64,/i.test(data)) {
    stickerCache.set(item.id, data);
  }
  return stickerCache.get(item.id) || '';
}
function findSticker(ref) { return store().stickers.find(s => s.id === ref) || null; }
function findItem(ref) {
  const items = store().items;
  return items.find(x => x.id === ref) ||
    (items.filter(x => x.name === ref).length === 1 ? items.find(x => x.name === ref) : null);
}
function clean(value, max = 100) { return String(value || '').replace(/[\r\n\t|<>]/g, ' ').trim().slice(0, max); }
function currentCharName() {
  const c = ctx();
  return String(c?.name2 || c?.characters?.[c?.characterId]?.name || '{{char}}').trim();
}
function currentUserName() { return String(ctx()?.name1 || '{{user}}').trim(); }
function isUserSpeaker(name) {
  const n = String(name || '').trim();
  return n === currentUserName() || n === '{{user}}' || n === '<user>' || n === '你';
}
async function setSelected(name, id, { fromAi = false } = {}) {
  const n = clean(name, 80), item = findItem(id), c = ctx();
  if (!n || !item || !c?.chatMetadata) return false;
  if (fromAi && isUserSpeaker(n) && !store().allowAiUser) return false;
  if (!c.chatMetadata[KEY]) c.chatMetadata[KEY] = { selectedByName: {} };
  if (!c.chatMetadata[KEY].selectedByName) c.chatMetadata[KEY].selectedByName = {};
  c.chatMetadata[KEY].selectedByName[n] = item.id;
  await c.saveMetadata?.();
  queueRefresh();
  return true;
}
async function setPair(pair, charNick, userNick, { fromAi = false } = {}) {
  const items = store().items.filter(x => x.category === 'couple' && x.pair === pair);
  const a = items.find(x => x.side === 'char'), b = items.find(x => x.side === 'user');
  const cn = clean(charNick, 80), un = clean(userNick, 80);
  if (!a || !b || !cn || !un || cn === un) return false;
  if (fromAi && !store().allowAiUser) return false;
  const c = ctx(); if (!c?.chatMetadata) return false;
  if (!c.chatMetadata[KEY]) c.chatMetadata[KEY] = { selectedByName: {} };
  const sel = c.chatMetadata[KEY].selectedByName ||= {};
  sel[cn] = a.id; sel[un] = b.id;
  await c.saveMetadata?.();
  queueRefresh(); return true;
}
function resolvedName(name) { return clean(name, 80); }
function queueRefresh() {
  if (renderTimer) return;
  renderTimer = setTimeout(() => { renderTimer = undefined; void refreshAvatars(); void refreshStickers(); }, 80);
}
async function refreshAvatars() {
  const request = ++currentRequest;
  const selected = selections();
  const elements = document.querySelectorAll('#chat img.lb-speaker-avatar');
  for (const element of elements) {
    const name = resolvedName(element.dataset.lbName);
    if (!element.dataset.lbOriginal) element.dataset.lbOriginal = element.getAttribute('src') || '';
    element.title = `点击更换「${name}」的头像`;
    element.tabIndex = 0;
    element.setAttribute('role', 'button');
    element.setAttribute('aria-label', `更换${name}的头像`);
    const ref = selected[name];
    const item = findItem(ref);
    if (!item) {
      if (element.getAttribute('src') !== element.dataset.lbOriginal) element.src = element.dataset.lbOriginal;
      element.dataset.lbApplied = '';
      continue;
    }
    if (element.dataset.lbApplied === ref) continue;
    const url = await ensureImage(item);
    if (request !== currentRequest) return;
    if (url && element.isConnected) { element.src = url; element.dataset.lbApplied = ref; }
  }
}
async function refreshStickers() {
  for (const image of document.querySelectorAll('#chat img.lb-sticker-image')) {
    const ref = String(image.dataset.lbSticker || '').trim();
    if (!ref.startsWith('STK:')) continue; // Original Catbox code still renders directly.
    const id = ref.slice(4);
    const sticker = findSticker(id);
    if (!sticker) { image.alt = '表情包已从图库删除'; continue; }
    if (image.dataset.lbApplied === sticker.id) continue;
    try {
      const url = await ensureSticker(sticker);
      if (url && image.isConnected) {
        image.src = url; image.alt = sticker.name; image.title = sticker.name;
        image.dataset.lbApplied = sticker.id;
      }
    } catch (error) { console.warn('[light-bubble] sticker load failed', error); }
  }
}
function macroText() {
  const s = store();
  const current = selections();
  const rows = [
    '[动态头像库：这些是最新可选头像，已与界面联动]',
    `当前角色=${currentCharName()}；当前用户=${currentUserName()}`,
    '头像只按“名称/备注”识别；本地图片的像素内容无法直接被AI看见。',
    '当前头像映射：',
  ];
  const mappings = Object.entries(current).map(([name, id]) => {
    const entry = findItem(id);
    return entry ? `${clean(name, 80)} → ${entry.name} (ID:${entry.id})` : '';
  }).filter(Boolean);
  rows.push(...(mappings.length ? mappings : ['（暂无自定义选择，沿用原聊天格式中的头像代码）']));
  rows.push('可选图库：');
  for (const [category, categoryLabel] of AVATAR_CATS) {
    rows.push(`${categoryLabel}:`);
    for (const item of s.items.filter(x => x.category === category).slice(0, 60)) {
      rows.push(`- ID:${item.id}；名称:${clean(item.name)}；${item.category === 'couple' ? `配对:${clean(item.pair)}；位置:${item.side}；` : ''}备注:${clean(item.note, 120) || '无'}；来源:${item.source === 'local' ? '本地文件(不可直接被AI读取)' : 'URL'}`);
    }
  }
  rows.push('如符合剧情，AI可在消息末尾输出一次 <AV_SET发言昵称|头像ID</AV_SET> 为CHAR/NPC换头像；情侣成套更换用 <AV_PAIR>配对名称|角色发言昵称|用户发言昵称</AV_PAIR>。这些是控制标签，不是聊天气泡。未经用户明确要求不要更换USER头像；系统默认也会拦截AI改USER头像。');
  rows.push('自定义表情包（由用户上传，不是头像；以下 ID 可以在表情消息第三栏使用）：');
  const stickers = s.stickers.slice(0, 100);
  for (const sticker of stickers) {
    rows.push(`- 代码:STK:${sticker.id}；名称:${clean(sticker.name, 40)}；内容描述:${clean(sticker.note, 120) || '无'}`);
  }
  if (!stickers.length) rows.push('（暂无自定义表情包，仍可使用世界书中的传统Catbox表情包代码）');
  if (s.stickers.length > stickers.length) rows.push(`（另外${s.stickers.length - stickers.length}个表情包未展开，避免占用大量上下文）`);
  rows.push('使用自定义表情包：<L_EMJ>发言昵称|头像代码|STK:已存在的ID</L_EMJ>；右侧改用<R_EMJ>。只可调用上方列表中的真实STK代码，不要输出外部URL，也不要编造ID。名称和描述供理解，AI不能自动看到本地图片本身。');
  return rows.join('\n');
}
function make(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function makeInput(name, type = 'text', placeholder = '') {
  const i = document.createElement('input'); i.name = name; i.type = type; i.placeholder = placeholder;
  return i;
}
function rowLabel(label, elem) {
  const wrap = make('label', 'lb-field'); wrap.append(make('span', '', label), elem); return wrap;
}
function safeHref(value, provider = 'iili') {
  let s = String(value || '').trim();
  if (!s) return '';
  if (/^[a-z0-9_-]+\.(?:jpe?g|png|webp|gif)$/i.test(s)) return `https://${provider === 'catbox' ? 'files.catbox.moe' : 'iili.io'}/${s}`;
  if (s.startsWith('/') && !s.startsWith('//') && !/[<>"'\s]/.test(s)) return s;
  try { const u = new URL(s); if (['http:', 'https:'].includes(u.protocol)) return u.href; } catch {}
  return '';
}
async function imageFromFile(file, maxDimension = 360) {
  if (!file || !['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)) throw Error('只接受 PNG / JPG / WebP / GIF 图片。');
  if (file.size > 12 * 1024 * 1024) throw Error('图片超过12MB，请先压缩。');
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(Error('读取本地图片失败')); reader.readAsDataURL(file);
  });
  const img = new Image();
  await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject(Error('无法读取图片')); img.src = source; });
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const g = canvas.getContext('2d'); if (!g) throw Error('浏览器不支持图片压缩');
  g.drawImage(img, 0, 0, canvas.width, canvas.height);
  let encoded = canvas.toDataURL('image/webp', 0.82);
  if (!encoded.startsWith('data:image/webp')) encoded = canvas.toDataURL('image/png');
  return encoded;
}
async function stickerFromFile(file) {
  if (!file || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
    throw Error('只支持 PNG、JPG、WebP、GIF 图片。');
  }
  if (file.size > 10 * 1024 * 1024) throw Error('表情包超过10MB，请先缩小文件。');
  // GIF files must remain uncompressed to preserve animation.
  if (file.type === 'image/gif') {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(Error('读取GIF失败'));
      reader.readAsDataURL(file);
    });
  }
  return imageFromFile(file, 640);
}
function uiTab(value) {
  tab = value;
  panel.querySelectorAll('.lb-tab').forEach(el => el.classList.toggle('is-active', el.dataset.cat === tab));
  buildCards();
}
function setTabForCategory(category) { if (CATS.some(([k]) => k === category)) uiTab(category); }
function showPanel(target = '') {
  speaker = resolvedName(target);
  panel.hidden = false;
  const targetInput = panel.querySelector('#lb-speaker');
  targetInput.value = speaker;
  panel.querySelector('#lb-char-nick').value = currentCharName();
  panel.querySelector('#lb-user-nick').value = currentUserName();
  buildCards();
  panel.querySelector('.lb-dialog').focus();
}
function hidePanel() { panel.hidden = true; }
async function choose(item) {
  const name = clean(panel.querySelector('#lb-speaker').value, 80);
  if (!name) { status('请先填写要换头像的聊天昵称。', true); return; }
  try {
    await setSelected(name, item.id);
    status(`已将「${name}」换为「${item.name}」。`);
    // Keep dialog open to allow browsing more avatars.
  } catch (e) { status(`保存失败：${e.message}`, true); }
}
function buildCards() {
  if (!listEl) return;
  listEl.replaceChildren();
  const isSticker = tab === 'sticker';
  panel.querySelector('#lb-avatar-add').hidden = isSticker;
  panel.querySelector('#lb-sticker-add').hidden = !isSticker;
  panel.querySelector('#lb-speaker-wrap').hidden = isSticker;
  panel.querySelector('#lb-sticker-copy').hidden = !isSticker;
  panel.querySelector('#lb-pair-section').hidden = isSticker || tab !== 'couple';
  if (isSticker) { buildStickerCards(); return; }
  const entries = store().items.filter(x => x.category === tab);
  if (!entries.length) listEl.append(make('p', 'lb-empty', '这个分组还没有头像，可以在下方添加。'));
  for (const item of entries) {
    const card = make('div', 'lb-card');
    const pick = make('button', 'lb-card-pick'); pick.type = 'button';
    const preview = make('img', 'lb-card-preview'); preview.alt = item.name;
    const src = imgUrl(item);
    if (src) preview.src = src;
    else if (item.source === 'local') { void ensureImage(item).then(url => { if (url && preview.isConnected) preview.src = url; }); }
    const name = make('span', 'lb-card-name', item.name);
    const note = make('span', 'lb-card-note', [item.pair, item.side === 'char' ? '角色头' : item.side === 'user' ? '用户头' : '', item.note].filter(Boolean).join(' · '));
    pick.append(preview, name, note);
    pick.addEventListener('click', () => void choose(item));
    const remove = make('button', 'lb-card-delete', '删除'); remove.type = 'button';
    remove.setAttribute('aria-label', `删除${item.name}`);
    remove.addEventListener('click', async () => {
      if (!confirm(`从头像库删除「${item.name}」？`)) return;
      const s = store(); s.items = s.items.filter(x => x.id !== item.id); saveLibrary();
      if (item.source === 'local') { await localDB?.removeItem(`${IMAGE_KEY}${item.id}`); imgCache.delete(item.id); }
      const c = ctx(); const mapping = c?.chatMetadata?.[KEY]?.selectedByName;
      if (mapping) { for (const [name, id] of Object.entries(mapping)) if (id === item.id) delete mapping[name]; await c.saveMetadata?.(); }
      buildCards(); queueRefresh(); status('已删除。');
    });
    card.append(pick, remove); listEl.append(card);
  }
  const pairSection = panel.querySelector('#lb-pair-section');
  pairSection.hidden = tab !== 'couple';
  if (tab === 'couple') {
    const select = panel.querySelector('#lb-pair-select');
    const pairs = [...new Set(entries.map(x => x.pair).filter(Boolean))].filter(p =>
      entries.some(i => i.pair === p && i.side === 'char') && entries.some(i => i.pair === p && i.side === 'user'));
    select.replaceChildren();
    for (const p of pairs) { const o = make('option', '', p); o.value = p; select.append(o); }
  }
}
function buildStickerCards() {
  const entries = store().stickers;
  if (!entries.length) listEl.append(make('p', 'lb-empty', '尚未添加表情包。点下面的「添加表情包」就能从手机相册选择或粘贴图片URL。'));
  for (const item of entries) {
    const card = make('div', 'lb-card');
    const pick = make('button', 'lb-card-pick'); pick.type = 'button';
    pick.title = '点击查看AI使用的表情包代码';
    const preview = make('img', 'lb-card-preview lb-sticker-preview'); preview.alt = item.name;
    const src = stickerUrl(item);
    if (src) preview.src = src;
    else if (item.source === 'local') void ensureSticker(item).then(url => { if (url && preview.isConnected) preview.src = url; });
    const name = make('span', 'lb-card-name', item.name);
    const note = make('span', 'lb-card-note', item.note || '无描述');
    pick.append(preview, name, note);
    pick.addEventListener('click', () => {
      const code = `STK:${item.id}`;
      const input = panel.querySelector('#lb-sticker-code');
      input.value = code;
      status(`已选「${item.name}」。AI可以使用代码 ${code} 发送这张表情包。`);
    });
    const remove = make('button', 'lb-card-delete', '删除'); remove.type = 'button';
    remove.setAttribute('aria-label', `删除表情包${item.name}`);
    remove.addEventListener('click', async () => {
      if (!confirm(`删除表情包「${item.name}」？旧聊天中使用过这张图的消息也将无法继续正常显示。`)) return;
      store().stickers = store().stickers.filter(x => x.id !== item.id); saveLibrary();
      if (item.source === 'local') {
        await localDB?.removeItem(`${STICKER_IMAGE_KEY}${item.id}`);
        stickerCache.delete(item.id);
      }
      buildCards(); status('表情包已删除。'); queueRefresh();
    });
    card.append(pick, remove); listEl.append(card);
  }
}
function addStickerForm(box) {
  const details = make('details', 'lb-add'); details.id = 'lb-sticker-add'; details.hidden = true;
  details.append(make('summary', '', '+ 添加表情包（URL / 手机图片 / GIF）'));
  const form = make('form', 'lb-form');
  const name = makeInput('name', 'text', '例如：小狗飞扑'); name.required = true; name.maxLength = 40;
  const note = makeInput('note', 'text', '给AI看的描述，例如：开心地扑到对方怀里'); note.maxLength = 120;
  const source = make('select');
  for (const [value, label] of [['local','手机本地图片 / 动图'],['url','图片链接 / Catbox短文件名']]) {
    const option = make('option', '', label); option.value = value; source.append(option);
  }
  const url = makeInput('url', 'text', 'https://... 或 q6bahb.jpg'); url.hidden = true;
  const file = makeInput('file', 'file'); file.accept = 'image/png,image/jpeg,image/webp,image/gif';
  const area = make('div', 'lb-source'); area.append(url, file);
  const updateSource = () => { url.hidden = source.value !== 'url'; file.hidden = source.value !== 'local'; };
  source.addEventListener('change', updateSource);
  form.append(rowLabel('表情包名称（AI可读）', name), rowLabel('图片意思/使用场合（AI可读）', note), rowLabel('来源', source), area);
  const submit = make('button', 'lb-primary', '添加到表情包库'); submit.type = 'submit'; form.append(submit);
  form.addEventListener('submit', async e => {
    e.preventDefault(); submit.disabled = true;
    const item = { id: `sticker_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      name: clean(name.value, 40), note: clean(note.value, 120), source: source.value, url: '' };
    try {
      if (!item.name) throw Error('请填写表情包名称。');
      if (item.source === 'url') {
        item.url = safeHref(url.value, 'catbox');
        if (!item.url) throw Error('请粘贴有效图片URL或Catbox短文件名。');
      } else {
        if (!localDB) throw Error('当前浏览器本地图库不可用，请先改用URL。');
        const data = await stickerFromFile(file.files?.[0]);
        await localDB.setItem(`${STICKER_IMAGE_KEY}${item.id}`, data);
        stickerCache.set(item.id, data);
      }
      store().stickers.push(item); saveLibrary();
      form.reset(); updateSource(); details.open = false; buildCards();
      status(`已添加「${item.name}」。AI在下次读取动态表情包库时可以使用它。`);
    } catch (error) { status(`添加失败：${error.message}`, true); }
    finally { submit.disabled = false; }
  });
  details.append(form); box.append(details);
  const copyRow = make('div', 'lb-sticker-copy'); copyRow.id = 'lb-sticker-copy'; copyRow.hidden = true;
  const code = makeInput('stickerCode', 'text', '点击上面的表情包，查看代码'); code.readOnly = true; code.id = 'lb-sticker-code';
  copyRow.append(rowLabel('选中的表情包代码（可复制）', code));
  const copy = make('button', 'lb-open-button', '复制代码'); copy.type = 'button';
  copy.addEventListener('click', async () => {
    if (!code.value) { status('请先点一张表情包。', true); return; }
    try { await navigator.clipboard.writeText(code.value); status('表情包代码已复制。'); }
    catch { code.select(); status('无法自动复制，已选中代码，请长按复制。'); }
  });
  copyRow.append(copy); box.append(copyRow);
}
function addPanelUI() {
  panel = make('div', 'lb-overlay'); panel.hidden = true;
  panel.setAttribute('role', 'presentation');
  const box = make('section', 'lb-dialog'); box.tabIndex = -1;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', '头像与表情包库');
  const top = make('div', 'lb-top'); top.append(make('div', '', '头像与表情包库 / LIBRARY'));
  const close = make('button', 'lb-close', '×'); close.type = 'button'; close.setAttribute('aria-label', '关闭头像库');
  close.addEventListener('click', hidePanel); top.append(close); box.append(top);
  const target = makeInput('speaker', 'text', '例如 大菠萝'); target.id = 'lb-speaker';
  const speakerWrap = rowLabel('当前要更换头像的聊天昵称', target); speakerWrap.id = 'lb-speaker-wrap'; box.append(speakerWrap);
  const tabs = make('div', 'lb-tabs');
  for (const [category, label] of CATS) {
    const b = make('button', 'lb-tab', label); b.type = 'button'; b.dataset.cat = category;
    b.addEventListener('click', () => uiTab(category)); tabs.append(b);
  }
  box.append(tabs);
  listEl = make('div', 'lb-grid'); box.append(listEl);
  const pairs = make('div', 'lb-pair-section'); pairs.id = 'lb-pair-section';
  const pairSelect = make('select'); pairSelect.id = 'lb-pair-select';
  const nickRow = make('div', 'lb-split');
  const charInput = makeInput('charNick', 'text'); charInput.id = 'lb-char-nick';
  const userInput = makeInput('userNick', 'text'); userInput.id = 'lb-user-nick';
  nickRow.append(rowLabel('角色聊天昵称', charInput), rowLabel('用户聊天昵称', userInput));
  const usePair = make('button', 'lb-primary', '整套启用情侣头像'); usePair.type = 'button';
  usePair.addEventListener('click', async () => {
    const ok = await setPair(pairSelect.value, charInput.value, userInput.value);
    status(ok ? '整套情侣头像已切换。' : '请先在情侣组添加同名的一对角色头与用户头。', !ok);
  });
  pairs.append(rowLabel('成套选择情侣头像', pairSelect), nickRow, usePair); box.append(pairs);
  const details = make('details', 'lb-add'); details.id = 'lb-avatar-add'; const summary = make('summary', '', '+ 添加头像（URL / 本地图片）'); details.append(summary);
  const form = make('form', 'lb-form');
  const labelName = makeInput('name', 'text', '例如：大菠萝·黑猫头像'); labelName.required = true; labelName.maxLength = 40;
  form.append(rowLabel('头像名称（供AI识别）', labelName));
  const category = make('select'); category.name = 'category';
  for (const [value, label] of AVATAR_CATS) { const opt = make('option', '', label); opt.value = value; category.append(opt); }
  const sourcePicker = make('select'); sourcePicker.name = 'source';
  for (const [value, label] of [['url', '图片URL / iili.io短文件名'], ['local', '选择手机本地图片']]) {
    const opt = make('option', '', label); opt.value = value; sourcePicker.append(opt);
  }
  const sourceArea = make('div', 'lb-source');
  const urlInput = makeInput('url', 'url', 'https://... 或 KbcQEW7.jpg'); urlInput.type = 'text'; urlInput.id = 'lb-url';
  const fileInput = makeInput('file', 'file'); fileInput.id = 'lb-file'; fileInput.accept = 'image/png,image/jpeg,image/webp,image/gif'; fileInput.hidden = true;
  sourceArea.append(urlInput, fileInput);
  const pairWrap = make('div', 'lb-pair-settings'); const pairName = makeInput('pair', 'text', '情侣套图名字'); pairName.maxLength = 40;
  const side = make('select'); side.name = 'side';
  for (const [value, label] of [['char', '角色头像'], ['user', '用户头像']]) { const opt = make('option', '', label); opt.value = value; side.append(opt); }
  pairWrap.append(rowLabel('情侣配对组名', pairName), rowLabel('这一张的身份', side)); pairWrap.hidden = true;
  const note = makeInput('note', 'text', '外貌特征、画风等，AI只能看到这里的文字'); note.maxLength = 120;
  form.append(rowLabel('归类', category), rowLabel('图片来源', sourcePicker), sourceArea, pairWrap,
    rowLabel('备注（AI可读）', note));
  sourcePicker.addEventListener('change', () => { urlInput.hidden = sourcePicker.value !== 'url'; fileInput.hidden = sourcePicker.value !== 'local'; });
  category.addEventListener('change', () => { pairWrap.hidden = category.value !== 'couple'; });
  const submit = make('button', 'lb-primary', '保存到头像库'); submit.type = 'submit'; form.append(submit);
  form.addEventListener('submit', async e => {
    e.preventDefault(); submit.disabled = true;
    const item = { id: `avatar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      category: category.value, name: clean(labelName.value, 40), note: clean(note.value, 120),
      pair: category.value === 'couple' ? clean(pairName.value, 40) : '',
      side: category.value === 'couple' ? side.value : '', source: sourcePicker.value, url: '' };
    try {
      if (!item.name) throw Error('请填写头像名称。');
      if (item.category === 'couple' && !item.pair) throw Error('情侣头像要填写同一套的配对组名。');
      if (item.source === 'url') {
        item.url = safeHref(urlInput.value);
        if (!item.url) throw Error('请输入有效的 http(s) 地址、同站图片路径或 iili.io 文件名。');
      } else {
        const encoded = await imageFromFile(fileInput.files?.[0]);
        if (!localDB) throw Error('本地图片数据库不可用。');
        await localDB.setItem(`${IMAGE_KEY}${item.id}`, encoded);
        imgCache.set(item.id, encoded);
      }
      store().items.push(item); saveLibrary();
      setTabForCategory(item.category); details.open = false; form.reset();
      sourcePicker.dispatchEvent(new Event('change')); category.dispatchEvent(new Event('change'));
      status(`已添加「${item.name}」；可以点击上方预览来选用。`);
    } catch (err) { status(`添加失败：${err.message}`, true); }
    finally { submit.disabled = false; }
  });
  details.append(form); box.append(details);
  addStickerForm(box);
  const permissions = make('label', 'lb-switch');
  const allow = makeInput('allowAiUser', 'checkbox'); allow.checked = store().allowAiUser;
  allow.addEventListener('change', () => { store().allowAiUser = allow.checked; saveLibrary(); });
  permissions.append(allow, make('span', '', '允许 AI 自动更换 USER / 情侣双人头像（默认关闭）'));
  box.append(permissions, make('div', 'lb-status')); box.lastElementChild.id = 'lb-status';
  const foot = make('p', 'lb-footer', '本地头像和表情包保存在当前浏览器，不自动上传图床；GIF原样保存以保留动图。请保留原图，清除浏览器数据可能导致丢失。AI只读名称与描述，不能直接看见本地图片。'); box.append(foot);
  panel.append(box); document.body.append(panel);
  panel.addEventListener('click', e => { if (e.target === panel) hidePanel(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) hidePanel(); });
  uiTab(tab);
  const settingsRoot = document.querySelector('#extensions_settings2, #extensions_settings');
  if (settingsRoot) {
    const row = make('div', 'lb-settings-row');
    const btn = make('button', 'lb-open-button', '打开「头像库」'); btn.type = 'button';
    btn.addEventListener('click', () => showPanel());
    row.append(make('strong', '', '轻量气泡 · 头像库'), btn);
    settingsRoot.append(row);
  }
}
function handleSpeakerClick(event) {
  const node = event.target?.closest?.('#chat img.lb-speaker-avatar');
  if (!node) return;
  event.preventDefault(); event.stopPropagation();
  const name = resolvedName(node.dataset.lbName);
  if (name) showPanel(name);
}
async function applyAiAvatarTags(data) {
  const c = ctx();
  let text = '';
  if (typeof data === 'number') text = c?.chat?.[data]?.mes || '';
  else if (data && Number.isInteger(data.messageId)) text = c?.chat?.[data.messageId]?.mes || '';
  if (!text) text = c?.chat?.at?.(-1)?.mes || '';
  if (!text) return;
  const tags = [...text.matchAll(/<AV_SET>\s*([^|<>\n]+?)\s*\|\s*([^|<>\n]+?)\s*<\/AV_SET>/gi)];
  for (const m of tags) await setSelected(m[1], m[2], { fromAi: true });
  const pairs = [...text.matchAll(/<AV_PAIR>\s*([^|<>\n]+?)\s*\|\s*([^|<>\n]+?)\s*\|\s*([^|<>\n]+?)\s*<\/AV_PAIR>/gi)];
  for (const m of pairs) await setPair(clean(m[1], 40), m[2], m[3], { fromAi: true });
}
function init() {
  if (startupDone) return; startupDone = true;
  const c = ctx(); if (!c) { startupDone = false; return; }
  try { localDB = (globalThis.SillyTavern?.libs?.localforage || globalThis.localforage)?.createInstance?.({ name: 'sillytavern-light-bubble', storeName: 'avatars_v1' }); }
  catch (e) { console.warn('[lb-avatar] IndexedDB not available:', e); }
  store();
  try { c.macros.register('avatarLibrary', { description: '当前聊天头像及可选表情包、对应名称与AI可读描述', handler: () => macroText() }); }
  catch (e) { console.warn('[lb-avatar] Could not register macro', e); }
  addPanelUI();
  document.addEventListener('click', handleSpeakerClick, true);
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target?.matches?.('#chat img.lb-speaker-avatar')) {
      e.preventDefault(); showPanel(e.target.dataset.lbName);
    }
  });
  const observerTarget = document.querySelector('#chat');
  if (observerTarget) new MutationObserver(queueRefresh).observe(observerTarget, { childList: true, subtree: true });
  const ev = c.event_types, source = c.eventSource;
  if (ev && source) {
    for (const event of [ev.CHAT_CHANGED, ev.USER_MESSAGE_RENDERED, ev.CHARACTER_MESSAGE_RENDERED, ev.MESSAGE_EDITED, ev.MESSAGE_SWIPED])
      if (event) source.on(event, queueRefresh);
    if (ev.MESSAGE_RECEIVED) source.on(ev.MESSAGE_RECEIVED, data => { void applyAiAvatarTags(data); });
  }
  queueRefresh();
}
const ready = () => init();
if (ctx()?.eventSource && ctx()?.event_types?.APP_READY) {
  ctx().eventSource.on(ctx().event_types.APP_READY, ready);
} else {
  const timer = setInterval(() => { if (ctx()?.eventSource) { clearInterval(timer); init(); } }, 250);
  setTimeout(() => clearInterval(timer), 30000);
}
