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

// Original world-book sticker presets. These are catalog entries, NOT user uploads.
// Kept separate so an update can never overwrite a user's custom stickers.
const PRESET_STICKERS = [["喜欢你","egvwqb.jpg"],["好喜欢你","9cz4he.jpg"],["爱你","gpffv3.jpg"],["超爱你","so921g.jpg"],["大大的爱","wabm2j.jpg"],["给你爱心","o3boww.jpg"],["你好美你长得像我爱人","hmpkra.jpg"],["你太可爱我喜欢你","ubhai8.jpg"],["脸红星星眼","dsfs7o.jpg"],["只有我是真心的","rhdqdp.jpg"],["你是我老婆","8nn1lj.jpg"],["直接求婚","x1dfxb.jpg"],["把你老公删了我要当你老公","ibo6zd.gif"],["裤裆掏玫瑰","l7q8yz.gif"],["小猫伸爪","f6nqiq.gif"],["小狗摇尾巴","hmdj2k.gif"],["摇尾巴","nvv03u.gif"],["蹭蹭","wnp9jl.gif"],["狗鼻子拱拱你","kip4fo.gif"],["狗舔舔","esw5e2.gif"],["狗狗舔小猫","vj1714.gif"],["爱你舔舔你","ola7gd.jpg"],["我是你的小狗","gnna86.gif"],["乖乖当狗","bgid0b.jpg"],["乖乖跟着","ydtn6e.jpg"],["揉揉你","qqkv1z.gif"],["想被摸头","m8qcef.jpg"],["抱抱","qt4qzg.jpg"],["抱抱","iu31o0.png"],["抱抱","x0ayyd.jpg"],["紧紧抱住","2hon5k.jpg"],["想抱抱","xk1xyb.jpg"],["扑过来","czdmyn.jpg"],["小狗飞扑","9yz8nz.jpg"],["宠爱地亲","wqn5ki.jpg"],["偷亲一口","1jgvb1.gif"],["亲你的手","nls3gm.jpg"],["亲我","jb6xww.jpg"],["想亲亲","2fnd9p.jpg"],["要亲亲吗不许拒绝","umvaji.jpg"],["想跟你说话","ao6ug3.jpg"],["快理我","jqkk07.jpg"],["想见你","xpx0ef.jpg"],["没见到你就没精神","7loj5f.jpg"],["早点回来","i0jpf0.jpg"],["老婆你回来吧","ge0bjd.jpg"],["我来咯","r9cix2.gif"],["蹦蹦跳跳","q6bahb.jpg"],["开心","9242jm.jpg"],["开心开心","gmsu65.jpg"],["高兴","slcf6y.gif"],["高兴地转圈","26rwpc.jpg"],["高兴地被喂饭","8uz920.jpg"],["好耶","h0jeiw.gif"],["哦耶","nff4qi.jpg"],["耶","rneasm.gif"],["惊喜","9rexzn.gif"],["小期待小惊喜","335fzr.gif"],["骄傲","6vjw8z.jpg"],["满脸骄傲","h1mf7j.jpg"],["得意","iroajh.jpg"],["嘚瑟","5df7q9.jpg"],["贱笑","jgicqw.png"],["对不起帅到你了","7yez84.jpeg"],["人生易如反掌","2gn0b9.jpg"],["快说我好","h46pk8.png"],["你说我什么都特别好快说啊","y7kaf2.jpg"],["可怜巴巴","3nvu7b.gif"],["装可怜","lcglz1.jpg"],["孤独低落狗","z09102.jpg"],["伤心","mm64gb.jpg"],["有点伤心","6dr5zw.jpg"],["失望","eug1e6.jpeg"],["忍眼泪","td0cz7.gif"],["要掉眼泪了","cdaxhk.jpg"],["要哭了","tnilep.jpg"],["想哭","yzroz7.jpg"],["哽咽","0cmn6h.jpg"],["泪","blnrmg.jpeg"],["擦眼泪","9gno7e.jpg"],["我在哭","t343od.jpg"],["丑猫哭哭","4ybcj1.jpg"],["大哭","3ox1j2.gif"],["大哭","auylzr.jpg"],["大哭","d8804d.png"],["超大声哭哭","186h5v.jpg"],["痛哭","v4g8v6.jpg"],["被揍了哭哭","81x5zq.jpg"],["被骂饱了","vpixr4.jpg"],["你嫌我丢人","8d71mm.jpg"],["笑不出来","xkop14.jpg"],["我是败犬","czova4.jpg"],["落魄","qcxnbl.gif"],["真倒霉","xvi105.gif"],["我做错什么了","bfukx4.jpeg"],["害羞","rqtdfm.jpg"],["拘谨扭捏","2vejqs.jpg"],["扭捏","9pon3x.jpeg"],["蹑手蹑脚","7mdkef.jpg"],["犯错后心虚","rejhsf.jpg"],["超级心虚","k3xk40.jpg"],["冷汗心虚笑","nj0i5e.png"],["装无辜","pdjeef.jpg"],["目移","69jgvg.jpg"],["我没事","0q0gb4.gif"],["别难为狗了","gopu17.jpg"],["我老实了","i3ws7s.jpg"],["已老实","rv76c1.jpg"],["已老实","7i0klk.jpeg"],["反省中","1ran24.jpg"],["想道歉","ghmrah.jpg"],["心虚讨好","mxtaj7.jpg"],["没问题领导","l9uwyy.jpg"],["恳求脸","i5etcm.jpg"],["拜托拜托","ia901u.jpg"],["求求你","nkpkcv.jpg"],["我真的求你了","utc5vd.jpg"],["厚脸皮","5yoguw.jpg"],["朕何罪之有啊","vlw07l.jpg"],["不高兴","x6lv1t.jpg"],["有点生气","evzdkv.jpg"],["皱眉","nibd87.gif"],["生气瞪你","mzoekx.jpg"],["翻白眼","fl2qbd.png"],["任性","wyt6z7.jpg"],["我忍","ftwaba.jpg"],["记仇","co9rcr.gif"],["战斗小狗","c5ccwc.jpg"],["咬咬咬咬","ogs4t5.jpg"],["狂犬病发作","xb3naz.jpg"],["枪毙你","ntikzr.png"],["如何呢打死我","cwlm5y.png"],["打到你性功能障碍","bx3848.jpg"],["在全世界头上拉屎","jeawjx.png"],["希望我讨厌的人都死掉","gzs6fh.jpg"],["路过吐口痰纯恶意","qeosjj.jpeg"],["零元即可拉黑脑残","jfdy3i.jpg"],["问号","buuins.jpg"],["没理解","br6rc0.jpg"],["大眼睛小老鼠看着你","zs7e0o.jpg"],["震惊","v5n2ve.jpg"],["惊吓","tp9uvd.jpg"],["震惊害怕","muc86m.jpg"],["看呆","mqnepo.jpg"],["目瞪口呆","2yegj0.jpg"],["严肃","jsn2r2.png"],["沉默无言","mzyapz.jpg"],["一笑了之","9llb46.jpg"],["已读不回","wsppsj.jpg"],["没一句我爱听的","rlulyv.jpg"],["懒得喷","wgzlm7.jpg"],["懒得喷","9h7ku8.png"],["我真服了","2uz6xq.gif"],["我操","klwqm3.jpg"],["我操","xjhzy5.jpg"],["我操恶俗啊","c3mpnq.jpg"],["卧槽恶俗啊","ynsp7x.jpg"],["真是被看扁了","osdyqi.jpg"],["他妈的真是被看扁了","ime5rz.jpg"],["被看扁","kwaivy.png"],["我是狗吗","ma9azs.jpg"],["你们好会装逼啊","u218ys.jpg"],["上面的人是同性恋","4d1wex.jpg"],["你自首吧","dfz8rj.jpg"],["我想报警","vfqvm7.jpg"],["你出精神病院的时候是怎么跟我保证的","epecjr.jpg"],["抽象爆炸猫猫","0ua95a.jpg"],["神经抽象旋转猫","6pqpk0.jpg"],["神经弹跳猫","ft35m5.jpg"],["神经猫猫跳舞","07cv2p.jpg"],["打滚耍赖","tje9am.jpg"],["弱智兔头","6svelp.jpg"],["我的理性在远去","t9e065.jpg"],["网络毁了我","1ppjfe.jpg"],["给社会添乱","ncbsf4.jpg"],["我放弃做人了","06u90w.jpg"],["文盲又在歹毒的学习","vwn5kd.jpg"],["不干活就没饭吃","2qnrgh.jpg"],["呜呜不想工作想要钱","i0nutw.jpg"],["给我钱","qkx81f.jpg"],["我萎了","r3ry3s.jpg"],["晕倒","tzmus0.gif"],["瘫","lt2u3s.png"],["拼尽全力倒下了","6gt4sn.jpg"],["死了灵魂出窍","71mnww.jpg"],["上天","dm5ejw.png"],["叫救护车","e4fqlk.png"],["卖掉了","vbiei1.png"],["被逮捕了","uzeywu.jpg"],["告到小狗法庭","iaordo.jpg"],["谢谢宝贝我现在那里好硬","862o48.jpg"],["我会勃起","qyyd9g.jpg"],["好棒我勃起了","ewen85.jpg"],["不好意思勃起了","oobfl0.png"],["鸡巴梆硬去趟厕所","pbxrqh.jpg"],["我兴奋起来了","ejuvde.jpg"],["上钩了","cormmk.jpg"],["反正我就是变态","qgha72.jpg"],["听不懂想亲嘴","ehcmdc.jpg"],["现在强烈地想做爱","oqh283.jpg"],["我们只是在做爱的朋友啊","vevudb.jpg"],["我要草你","5neozi.jpg"],["心情不好见人就操","o2jwl1.jpg"],["你骂我不怕我是抖爱慕吗","qlbdzk.jpg"],["对不良诱惑说都要","nmoc9l.jpg"],["阿弥陀佛","9cwm60.jpg"],["菩萨喜欢坚强的孩子","1ezbfz.jpg"],["悠闲","wnp9jl.gif"],["饿了","w0cx8k.jpg"],["小狗吃饭","43inr1.jpg"],["嗨有时间吗","3tc5bv.jpg"],["收到","ldqwqr.jpg"],["了解","wm5pcq.jpg"],["探头探脑","6p8w3k.gif"],["探头","wmjn8b.gif"],["盼望","clnev9.jpg"],["盼望","y5c5gi.jpg"],["忍耐中","8mnszb.jpg"],["加油","08pu9k.jpg"],["加油加油","fhkvsl.jpg"],["困了","8ndqhv.jpg"],["晚安","f5qi7r.jpg"],["晚安","vpsd3q.gif"]].map(([name, code], index) => ({
  id: `worldbook_${index}_${code.replace(/\W/g, '_')}`,
  name, code, note: '世界书预设', source: 'url', builtin: true,
  url: `https://files.catbox.moe/${code}`,
}));

const SOURCE = [
  ['char', '冷脸帅气黑发男', 'nbR22Lv.jpg', '此世界书默认CHAR头像'],
  ['char', '骚气吐舌黑发男', 'nb7Bhaj.png', ''],
  ['char', '头上顶着100%笨蛋的小狗', 'nbRZw1n.png', ''],
  ['char', '菠萝猫', 'nb7KkZX.png', ''],
  ['char', '一个菠萝', 'nb7qvrG.jpg', ''],
  ['user', '躺床上睡觉的呆猫八条', 'nb7nMdb.png', '此世界书默认USER头像'],
  ['npc', 'NPC通用', 'Kbc8AXf.jpg', ''],
  ['npc', '沈逾头像', 'nb5LBoP.png', ''],
  ['npc', '花弄雨头像', 'nb5bhPI.png', ''],
  ['npc', '宋知行头像', 'nb5p7YF.png', ''],
  ['npc', '林燃头像', 'nb5ELKJ.png', ''],
];
const base = SOURCE.map(([category, name, code, note]) => ({
  id: `lb_v2_${code.replace(/\W/g, '_')}`, category, name, note, source: 'url',
  url: `https://iili.io/${code}`, pair: '', side: '',
}));
base.push(
  { id: 'lb_v2_couple_1_char', category: 'couple', name: '被少女搂着脖子脸红的黑发少男', note: '动漫情侣男头', source: 'url', url: 'https://iili.io/nb7h9gn.jpg', pair: '被搂脖子脸红', side: 'char' },
  { id: 'lb_v2_couple_1_user', category: 'couple', name: '搂着黑发少男脖子的少女', note: '动漫情侣女头', source: 'url', url: 'https://iili.io/nb7hJJs.jpg', pair: '被搂脖子脸红', side: 'user' },
  { id: 'lb_v2_couple_2_char', category: 'couple', name: '亲吻少女头发的少男', note: '动漫情侣男头', source: 'url', url: 'https://iili.io/nb7Xpft.jpg', pair: '亲吻发间', side: 'char' },
  { id: 'lb_v2_couple_2_user', category: 'couple', name: '被少男亲吻发间的少女', note: '动漫情侣女头', source: 'url', url: 'https://iili.io/nb7Xy0X.jpg', pair: '亲吻发间', side: 'user' },
  { id: 'lb_v2_couple_3_char', category: 'couple', name: '捧着《如何做一位贤惠男人》读书的狗', note: '情侣男头', source: 'url', url: 'https://iili.io/nb7OCjj.png', pair: '贤惠读书狗狗', side: 'char' },
  { id: 'lb_v2_couple_3_user', category: 'couple', name: '捧着《越过越好的女人》读书的狗', note: '情侣女头', source: 'url', url: 'https://iili.io/nb7OnZx.png', pair: '贤惠读书狗狗', side: 'user' },
);
function mergePresetItems(items) {
  // Upgrade existing users in-place without erasing custom uploads or selected avatar IDs.
  const known = new Set(items.map(x => x.id));
  for (const item of base) if (!known.has(item.id)) items.push({ ...item });
  return items;
}

const imgCache = new Map();
const stickerCache = new Map();
let panel, listEl, tab = 'char', speaker = '', currentRequest = 0;
let localDB;
let renderTimer;
let startupDone = false;
let stickerDisplayLimit = 36;
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
  else if (base.some(x => !s.items.some(y => y.id === x.id))) {
    mergePresetItems(s.items);
    c.saveSettingsDebounced?.();
  }
  if (!Array.isArray(s.stickers)) s.stickers = [];
  if (typeof s.allowAiUser !== 'boolean') s.allowAiUser = false;
  return s;
}
function selections() { return ctx()?.chatMetadata?.[KEY]?.selectedByName || {}; }
function saveLibrary() { ctx()?.saveSettingsDebounced?.(); syncLiveAiLibrary(); }
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
  syncLiveAiLibrary();
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
  syncLiveAiLibrary();
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

const AI_PROMPT_KEY = 'light-bubble:live-image-library';
/** Added by the extension to the next generation. Does not edit the world book. */
function liveAiLibraryText() {
  const s = store();
  const installedIds = new Set(base.map(item => item.id));
  const customAvatars = s.items.filter(x => !installedIds.has(x.id)).slice(-80);
  const customStickers = s.stickers.slice(-120);
  const current = Object.entries(selections()).map(([name,id]) => {
    const item = s.items.find(x => x.id === id);
    return item ? `${clean(name,50)} → ${clean(item.name,50)} [头像ID:${clean(item.id,70)}]` : '';
  }).filter(Boolean);
  if (!customAvatars.length && !customStickers.length && !current.length) return '';
  const rows = [
    '[轻量气泡 · 动态素材补充 / 仅用于实际出现的线上聊天]',
    '本段不要求角色主动开始线上聊天。它只补充用户保存的头像和表情包索引，不更改原世界书。',
    'AI只能读取本地图片的名称与文字备注，不能看到图片内容。不可编造不存在的图像ID。',
  ];
  if (current.length) rows.push('当前头像选择：', ...current);
  if (customAvatars.length) {
    rows.push('用户新增头像（ID / 分类 / 名称 / 备注）：');
    for (const x of customAvatars) rows.push(`头像ID:${clean(x.id,70)}；分类:${clean(x.category,12)}；名称:${clean(x.name,40)}；备注:${clean(x.note,120) || '无'}`);
    rows.push('角色/NPC在剧情合理地更换头像时，可在聊天气泡之外输出 <AV_SET>发言昵称|头像ID</AV_SET>。');
  }
  if (customStickers.length) {
    rows.push('用户新增表情包（以下ID可用于L_EMJ或R_EMJ标签的第三段）：');
    for (const x of customStickers) rows.push(`STK:${clean(x.id,80)} = ${clean(x.name,40)}；描述:${clean(x.note,120) || '无'}`);
    rows.push('使用示例：<L_EMJ>发言昵称|头像文件名|STK:真实ID</L_EMJ>。预设表情包仍使用原世界书的Catbox短文件名。');
  }
  if (s.allowAiUser) rows.push('用户已允许按剧情更换USER头像与情侣成套头像。');
  else rows.push('未授权AI自行更换USER头像或成套情侣头像。');
  return rows.join('\n');
}
function syncLiveAiLibrary() {
  const c = ctx();
  if (typeof c?.setExtensionPrompt !== 'function') return false;
  try {
    // SillyTavern IN_CHAT position = 1, near the end of prompt at depth 1,
    // role=0 (system). Empty string removes the stale injection.
    c.setExtensionPrompt(AI_PROMPT_KEY, liveAiLibraryText(), 1, 1, false, 0);
    return true;
  } catch (e) {
    console.warn('[light-bubble] Cannot update dynamic prompt:', e);
    return false;
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
  rows.push('如符合剧情，AI可在消息末尾输出一次 <AV_SET>发言昵称|头像ID</AV_SET> 为CHAR/NPC换头像；情侣成套更换用 <AV_PAIR>配对名称|角色发言昵称|用户发言昵称</AV_PAIR>。这些是控制标签，不是聊天气泡。未经用户明确要求不要更换USER头像；系统默认也会拦截AI改USER头像。');
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

/**
 * Stable device picker for mobile browsers / SillyTavern themes.
 * A visible button opens the native Android file selector. Do not rely on
 * the browser-provided file-input button, which some themes hide entirely.
 */
function createDevicePicker(input, itemLabel = '图片') {
  input.classList.add('lb-file-native');
  input.removeAttribute('hidden');
  input.tabIndex = -1;
  input.setAttribute('aria-label', `选择本地${itemLabel}文件`);

  const wrap = make('div', 'lb-device-picker');
  const button = make('button', 'lb-device-button', '从手机相册 / 文件中选择图片');
  button.type = 'button';
  const feedback = make('div', 'lb-device-feedback', '尚未选择图片');
  feedback.setAttribute('aria-live', 'polite');
  const preview = make('img', 'lb-device-preview');
  preview.alt = '已选择的本地图片预览';
  preview.hidden = true;
  let objectUrl = '';
  button.addEventListener('click', () => {
    // Called synchronously within the trusted click event (required on Android).
    input.click();
  });
  function clearPreview() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = '';
    preview.removeAttribute('src');
    preview.hidden = true;
  }
  function updateFile() {
    clearPreview();
    const file = input.files?.[0];
    if (!file) {
      feedback.textContent = '尚未选择图片';
      return;
    }
    feedback.textContent = `已选择：${file.name}（${Math.max(1, Math.ceil(file.size / 1024))} KB）`;
    if (file.type.startsWith('image/')) {
      objectUrl = URL.createObjectURL(file);
      preview.src = objectUrl;
      preview.hidden = false;
    }
  }
  input.addEventListener('change', updateFile);
  wrap.append(input, button, feedback, preview,
    make('small', 'lb-device-hint', '选完图片后，请继续点击下方的「保存」按钮。'));
  return { wrap, reset() { clearPreview(); feedback.textContent = '尚未选择图片'; } };
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
  // Always open at the top, even after scrolling a long avatar library.
  panel.scrollTop = 0;
  const targetInput = panel.querySelector('#lb-speaker');
  targetInput.value = speaker;
  panel.querySelector('#lb-char-nick').value = currentCharName();
  panel.querySelector('#lb-user-nick').value = currentUserName();
  buildCards();
  const dialog = panel.querySelector('.lb-dialog');
  try { dialog.focus({ preventScroll: true }); } catch { dialog.focus(); }
  panel.scrollTop = 0;
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
  panel.querySelector('#lb-sticker-search-wrap').hidden = !isSticker;
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
  const custom = store().stickers.map(s => ({...s, builtin: false}));
  const all = [...custom, ...PRESET_STICKERS];
  const search = clean(panel.querySelector('#lb-sticker-search')?.value || '', 80).toLowerCase();
  const matches = search ? all.filter(s => `${s.name} ${s.code || ''} ${s.note || ''} ${s.id}`.toLowerCase().includes(search)) : all;
  const count = make('p', 'lb-sticker-count', `世界书预设 ${PRESET_STICKERS.length} 张 · 自定义 ${custom.length} 张 · 当前匹配 ${matches.length} 张`);
  listEl.append(count);
  if (!matches.length) listEl.append(make('p', 'lb-empty', '没有找到匹配的表情包，可以在下方自行添加。'));
  for (const item of matches.slice(0, stickerDisplayLimit)) {
    const card = make('div', 'lb-card');
    const pick = make('button', 'lb-card-pick'); pick.type = 'button';
    pick.title = '点击查看AI使用的表情包代码';
    const preview = make('img', 'lb-card-preview lb-sticker-preview');
    preview.loading = 'lazy'; preview.alt = item.name;
    const src = stickerUrl(item);
    if (src) preview.src = src;
    else if (item.source === 'local') void ensureSticker(item).then(url => { if (url && preview.isConnected) preview.src = url; });
    const name = make('span', 'lb-card-name', item.name);
    const note = make('span', 'lb-card-note', item.builtin ? '原世界书 · Catbox' : (item.note || '用户添加'));
    pick.append(preview, name, note);
    pick.addEventListener('click', () => {
      const code = item.builtin ? item.code : `STK:${item.id}`;
      panel.querySelector('#lb-sticker-code').value = code;
      status(`已选「${item.name}」。发送表情包时使用代码 ${code}。`);
    });
    card.append(pick);
    if (item.builtin) {
      const fixed = make('span', 'lb-card-preset', '世界书预设');
      card.append(fixed);
    } else {
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
      card.append(remove);
    }
    listEl.append(card);
  }
  if (matches.length > stickerDisplayLimit) {
    const more = make('button', 'lb-sticker-more', `显示更多（还有 ${matches.length - stickerDisplayLimit} 张）`);
    more.type = 'button';
    more.addEventListener('click', () => { stickerDisplayLimit += 36; buildCards(); });
    listEl.append(more);
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
  const device = createDevicePicker(file, '表情包');
  const area = make('div', 'lb-source'); area.append(url, device.wrap);
  const updateSource = () => { url.hidden = source.value !== 'url'; device.wrap.hidden = source.value !== 'local'; };
  source.addEventListener('change', updateSource);
  updateSource();
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
      form.reset(); device.reset(); updateSource(); details.open = false; buildCards();
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
  const search = makeInput('searchSticker', 'search', '搜索表情包名称或文件代码');
  search.id = 'lb-sticker-search'; search.setAttribute('aria-label', '搜索表情包');
  const searchWrap = rowLabel('搜索表情包', search);
  searchWrap.id = 'lb-sticker-search-wrap'; box.append(searchWrap);
  search.addEventListener('input', () => { stickerDisplayLimit = 36; if (tab === 'sticker') buildCards(); });
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
  const fileInput = makeInput('file', 'file'); fileInput.id = 'lb-file'; fileInput.accept = 'image/png,image/jpeg,image/webp,image/gif';
  const device = createDevicePicker(fileInput, '头像');
  sourceArea.append(urlInput, device.wrap);
  const pairWrap = make('div', 'lb-pair-settings'); const pairName = makeInput('pair', 'text', '情侣套图名字'); pairName.maxLength = 40;
  const side = make('select'); side.name = 'side';
  for (const [value, label] of [['char', '角色头像'], ['user', '用户头像']]) { const opt = make('option', '', label); opt.value = value; side.append(opt); }
  pairWrap.append(rowLabel('情侣配对组名', pairName), rowLabel('这一张的身份', side)); pairWrap.hidden = true;
  const note = makeInput('note', 'text', '外貌特征、画风等，AI只能看到这里的文字'); note.maxLength = 120;
  form.append(rowLabel('归类', category), rowLabel('图片来源', sourcePicker), sourceArea, pairWrap,
    rowLabel('备注（AI可读）', note));
  const updateAvatarSource = () => {
    urlInput.hidden = sourcePicker.value !== 'url';
    device.wrap.hidden = sourcePicker.value !== 'local';
  };
  sourcePicker.addEventListener('change', updateAvatarSource);
  updateAvatarSource();
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
      setTabForCategory(item.category); details.open = false; form.reset(); device.reset();
      updateAvatarSource(); category.dispatchEvent(new Event('change'));
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
  syncLiveAiLibrary();
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
    if (ev.CHAT_CHANGED) source.on(ev.CHAT_CHANGED, syncLiveAiLibrary);
    if (ev.GENERATION_AFTER_COMMANDS) source.on(ev.GENERATION_AFTER_COMMANDS, syncLiveAiLibrary);
    else if (ev.GENERATION_STARTED) source.on(ev.GENERATION_STARTED, syncLiveAiLibrary);
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

/**
 * SillyTavern calls the `update` lifecycle hook after a successful extension update.
 * Page refresh must happen after update completes so new JS/CSS loads; no polling or
 * reload-on-load is used (which would otherwise create a refresh loop).
 */
let lightBubbleReloadScheduled = false;
export function onUpdate() {
  if (lightBubbleReloadScheduled) return;
  lightBubbleReloadScheduled = true;
  console.info('[light-bubble-library] Extension updated; automatically reloading the page.');
  // Let SillyTavern finish its update completion UI before replacing the document.
  globalThis.setTimeout(() => {
    try {
      globalThis.location.reload();
    } catch (error) {
      console.warn('[light-bubble-library] Reload was blocked:', error);
      lightBubbleReloadScheduled = false;
    }
  }, 1200);
}
