/**
 * Radical + first-level components for HSK 1 glyphs.
 * Kangxi: Wiktionary {{Han char}}. Pieces: Make Me a Hanzi IDS (CC-BY).
 * Objects here are original wording.
 */

export const RADICALS = {
  一: { rn: 1, name: 'one', objects: ['a steel rod', 'a tightrope', 'a ruler edge'] },
  丨: { rn: 2, name: 'line', objects: ['a walking stick', 'a flagpole', 'a chimney brush'] },
  丿: { rn: 4, name: 'slash', objects: ['a ribbon slash', 'a thrown spear', 'a strip of tape'] },
  乙: { rn: 5, name: 'second', objects: ['a fishhook', 'a bent wire hanger', 'a sickle'] },
  亅: { rn: 6, name: 'hook', objects: ['a coat hook', 'a shepherd crook', 'a barb'] },
  二: { rn: 7, name: 'two', objects: ['a pair of chopsticks', 'two stacked books', 'a double step'] },
  亠: { rn: 8, name: 'lid', objects: ['a pot lid', 'a hat', 'a cloche cover'] },
  人: { rn: 9, name: 'person', objects: ['a paper doll', 'a coat on a hanger', 'a stick puppet'] },
  儿: { rn: 10, name: 'legs', objects: ['a pair of tongs', 'walking calipers', 'two pegs'] },
  八: { rn: 12, name: 'eight', objects: ['a split wishbone', 'open shears', 'two diverging planks'] },
  冂: { rn: 13, name: 'box', objects: ['a picture frame', 'a window sash', 'a goal post'] },
  冖: { rn: 14, name: 'cover', objects: ['a cloth cover', 'a shower cap', 'a tray lid'] },
  冫: { rn: 15, name: 'ice', objects: ['an ice cube', 'a popsicle', 'a frost scraper'] },
  几: { rn: 16, name: 'table', objects: ['a side table', 'a tray stand', 'a folding stool'] },
  凵: { rn: 17, name: 'receptacle', objects: ['an open crate', 'a bucket', 'a well mouth'] },
  刀: { rn: 18, name: 'knife', objects: ['a kitchen knife', 'scissors', 'a letter opener'] },
  匕: { rn: 21, name: 'spoon', objects: ['a soup spoon', 'a ladle', 'a small dagger'] },
  匸: { rn: 23, name: 'hiding box', objects: ['a closed chest', 'a doctor’s case', 'a lid that hides'] },
  十: { rn: 24, name: 'ten', objects: ['a cross-staff', 'a plus-shaped tile', 'a bandage cross'] },
  厶: { rn: 28, name: 'private', objects: ['a coiled rope', 'a private seal', 'a snail shell'] },
  又: { rn: 29, name: 'right hand', objects: ['a grasping hand', 'a folding wrench', 'a wishbone'] },
  口: { rn: 30, name: 'mouth', objects: ['a megaphone', 'a teacup', 'a round badge'] },
  囗: { rn: 31, name: 'enclosure', objects: ['a courtyard gate', 'a window frame', 'a boxed tray'] },
  土: { rn: 32, name: 'earth', objects: ['a brick', 'a handful of clay', 'a flowerpot'] },
  夕: { rn: 36, name: 'evening', objects: ['a crescent cookie', 'an evening lantern', 'a moon slice'] },
  大: { rn: 37, name: 'big', objects: ['a spread coat', 'a scarecrow', 'a big kite'] },
  女: { rn: 38, name: 'woman', objects: ['a hairpin', 'a folded fan', 'a dancing ribbon'] },
  子: { rn: 39, name: 'child', objects: ['a swaddled doll', 'a spinning top', 'a rattle'] },
  宀: { rn: 40, name: 'roof', objects: ['a roof tile', 'an umbrella', 'a house gable'] },
  寸: { rn: 41, name: 'inch', objects: ['a measuring tape', 'a tailor’s pin', 'an inch of ribbon'] },
  小: { rn: 42, name: 'small', objects: ['a pebble', 'a thimble', 'a tiny bell'] },
  山: { rn: 46, name: 'mountain', objects: ['a stone paperweight', 'a cairn', 'a folding peak'] },
  工: { rn: 48, name: 'work', objects: ['a set square', 'an I-beam', 'a workbench clamp'] },
  巾: { rn: 50, name: 'cloth', objects: ['a dish towel', 'a headscarf', 'a hanging banner'] },
  干: { rn: 51, name: 'pestle', objects: ['a drying rack', 'a pestle', 'a shield'] },
  广: { rn: 53, name: 'shelter', objects: ['a shop awning', 'a lean-to beam', 'a cliff-house plank'] },
  廾: { rn: 55, name: 'two hands', objects: ['a serving tray', 'a stretcher', 'an offering platter'] },
  彡: { rn: 59, name: 'bristle', objects: ['three paint streaks', 'a mane comb', 'a calligrapher’s whisk'] },
  彳: { rn: 60, name: 'step', objects: ['a single boot', 'a stepping block', 'a left footprint'] },
  心: { rn: 61, name: 'heart', objects: ['a felt heart', 'a locket', 'a pulse-watch'] },
  戈: { rn: 62, name: 'spear', objects: ['a spear', 'a pike', 'a halberd head'] },
  手: { rn: 64, name: 'hand', objects: ['a glove', 'a wooden hand', 'a grabbing claw'] },
  日: { rn: 72, name: 'sun', objects: ['a sun medallion', 'a clock face', 'a round window'] },
  月: { rn: 74, name: 'moon', objects: ['a moon lantern', 'a crescent wrench', 'a meat cleaver'] },
  木: { rn: 75, name: 'tree', objects: ['a twig', 'a chopping board', 'a wooden ruler'] },
  欠: { rn: 76, name: 'yawn', objects: ['a yawning mask', 'a gap-toothed comb', 'a missing brick'] },
  气: { rn: 84, name: 'steam', objects: ['a steam kettle', 'a balloon', 'vapor trapped in a jar'] },
  水: { rn: 85, name: 'water', objects: ['a water bottle', 'a dripping sponge', 'a glass of water'] },
  火: { rn: 86, name: 'fire', objects: ['a matchstick', 'a candle', 'a lighter'] },
  爪: { rn: 87, name: 'claw', objects: ['a meat hook', 'a chicken foot', 'a grappling claw'] },
  父: { rn: 88, name: 'father', objects: ['a walking cane', 'a father’s hat', 'a pipe'] },
  犬: { rn: 94, name: 'dog', objects: ['a dog leash', 'a rubber bone', 'a puppy figurine'] },
  玉: { rn: 96, name: 'jade', objects: ['a jade bead', 'a king’s seal', 'a marble'] },
  生: { rn: 100, name: 'life', objects: ['a sprouting seed pot', 'a fresh shoot', 'an egg'] },
  田: { rn: 102, name: 'field', objects: ['a waffle grid', 'a windowpane', 'a paddy tray'] },
  白: { rn: 106, name: 'white', objects: ['a blank card', 'a white handkerchief', 'a peeled egg'] },
  目: { rn: 109, name: 'eye', objects: ['a monocle', 'a camera lens', 'a watching mask'] },
  禾: { rn: 115, name: 'grain', objects: ['a sheaf of grain', 'a rice stalk', 'a wheat bundle'] },
  米: { rn: 119, name: 'rice', objects: ['a handful of rice', 'a rice sack', 'a grain scoop'] },
  糸: { rn: 120, name: 'silk', objects: ['a spool of silk', 'a knotted thread', 'embroidery floss'] },
  老: { rn: 125, name: 'old', objects: ['a walking stick', 'an old hat', 'a wrinkled map'] },
  肉: { rn: 130, name: 'meat', objects: ['a slab of meat', 'a sausage', 'a cutting board of pork'] },
  艸: { rn: 140, name: 'grass', glyph: '艹', objects: ['a handful of grass', 'a herb sprig', 'a straw hat'] },
  衣: { rn: 145, name: 'clothes', objects: ['a folded shirt', 'a coat', 'a sleeve'] },
  襾: { rn: 146, name: 'cover', objects: ['a box lid', 'a covered tray', 'a west-facing shutter'] },
  见: { rn: 147, name: 'see', objects: ['a seeing-glass', 'a pair of spectacles', 'an eye in a door'] },
  讠: { rn: 149, name: 'speech', objects: ['a folded letter', 'a speech-bubble card', 'a tiny placard'] },
  走: { rn: 156, name: 'run', objects: ['a running shoe', 'a stride-block', 'a dirt-path tile'] },
  车: { rn: 159, name: 'cart', objects: ['a toy cart', 'a wheel', 'a wagon handle'] },
  辵: { rn: 162, name: 'walk', glyph: '辶', objects: ['a winding path tile', 'a rolling suitcase', 'a trail of footprints'] },
  邑: { rn: 163, name: 'city', glyph: '阝', objects: ['a city stamp', 'a village flag', 'a right-side seal'] },
  里: { rn: 166, name: 'village', objects: ['a milepost', 'a village well', 'a distance stone'] },
  钅: { rn: 167, name: 'gold', objects: ['a gold coin', 'a metal ingot', 'a brass key'] },
  阜: { rn: 170, name: 'mound', glyph: '阝', objects: ['a mound of dirt', 'a terrace step', 'a left-side slope'] },
  雨: { rn: 173, name: 'rain', objects: ['an umbrella', 'a raindrop bottle', 'a cloud sponge'] },
  面: { rn: 176, name: 'face', objects: ['a mask', 'a noodle sheet', 'a powder compact'] },
  飞: { rn: 183, name: 'fly', objects: ['a paper airplane', 'a feather', 'a wing'] },
  饣: { rn: 184, name: 'food', objects: ['a rice bowl', 'a dumpling', 'a lunch tin'] },
  高: { rn: 189, name: 'tall', objects: ['a tall ladder', 'a pagoda model', 'a high stool'] },
}

/** Character → Kangxi radical glyph (Wiktionary Han char). */
export const CHAR_RS = {
  一: '一', 七: '一', 三: '一', 上: '一', 下: '一', 不: '一', 东: '一', 个: '丨', 中: '丨', 么: '丿',
  九: '乙', 习: '乙', 书: '乙', 买: '乙', 了: '亅', 二: '二', 五: '二', 些: '二', 京: '亠', 亮: '亠',
  人: '人', 什: '人', 今: '人', 他: '人', 们: '人', 会: '人', 住: '人', 作: '人', 你: '人', 候: '人',
  做: '人', 儿: '儿', 先: '儿', 八: '八', 六: '八', 关: '八', 兴: '八', 再: '冂', 写: '冖', 冷: '冫',
  几: '几', 出: '凵', 分: '刀', 前: '刀', 北: '匕', 医: '匸', 十: '十', 午: '十', 去: '厶', 友: '又',
  叫: '口', 号: '口', 吃: '口', 同: '口', 名: '口', 后: '口', 吗: '口', 听: '口', 呢: '口', 和: '口',
  哪: '口', 商: '口', 喂: '口', 喜: '口', 喝: '口', 四: '囗', 回: '囗', 国: '囗', 在: '土', 坐: '土',
  块: '土', 多: '夕', 大: '大', 天: '大', 太: '大', 女: '女', 她: '女', 好: '女', 妈: '女', 姐: '女',
  子: '子', 字: '子', 学: '子', 客: '宀', 家: '宀', 对: '寸', 小: '小', 少: '小', 岁: '山', 工: '工',
  师: '巾', 年: '干', 店: '广', 开: '廾', 影: '彡', 很: '彳', 怎: '心', 想: '心', 我: '戈', 打: '手',
  时: '日', 明: '日', 星: '日', 昨: '日', 是: '日', 月: '月', 有: '月', 朋: '月', 服: '月', 期: '月',
  本: '木', 机: '木', 来: '木', 杯: '木', 果: '木', 校: '木', 样: '木', 桌: '木', 椅: '木', 欢: '欠',
  气: '气', 水: '水', 汉: '水', 没: '水', 漂: '水', 点: '火', 热: '火', 爱: '爪', 爸: '父', 狗: '犬',
  猫: '犬', 现: '玉', 生: '生', 电: '田', 的: '白', 看: '目', 睡: '目', 租: '禾', 米: '米', 系: '糸',
  老: '老', 能: '肉', 脑: '肉', 苹: '艸', 茶: '艸', 菜: '艸', 衣: '衣', 西: '襾', 见: '见', 视: '见',
  觉: '见', 认: '讠', 识: '讠', 话: '讠', 语: '讠', 说: '讠', 请: '讠', 读: '讠', 谁: '讠', 谢: '讠',
  起: '走', 车: '车', 这: '辵', 那: '邑', 都: '邑', 里: '里', 钟: '钅', 钱: '钅', 院: '阜', 雨: '雨',
  面: '面', 飞: '飞', 饭: '饣', 高: '高',
}

/** Stroke-form aliases → Kangxi / component keys. */
export const ALIAS = {
  亻: '人', 氵: '水', 扌: '手', 忄: '心', 艹: '艸', 辶: '辵', 犭: '犬', 灬: '火',
  爫: '爪', 刂: '刀', '⺼': '肉', 丷: '八', '⺍': '小', '⺊': '卜', 耂: '老', 阝: '邑',
  王: '玉', 礻: '示',
}

/** First-level IDS pieces (Make Me a Hanzi decompositions). */
export const CHAR_PARTS = {
  一: '一', 七: '一乚', 三: '一二', 上: '⺊一', 下: '一卜', 不: '一', 东: '七小', 个: '人丨', 中: '口丨', 么: '丿厶',
  九: '丿乙', 习: '冫', 书: '丨', 买: '乛头', 了: '乛亅', 二: '一', 五: '二', 些: '此二', 京: '亠口小', 亮: '亠口冖几',
  人: '人', 什: '亻十', 今: '人', 他: '亻也', 们: '亻门', 会: '人云', 住: '亻主', 作: '亻乍', 你: '亻尔', 候: '亻矦',
  做: '亻故', 儿: '丿乚', 先: '土儿', 八: '八', 六: '亠八', 关: '丷天', 兴: '⺍一八', 再: '一冉', 写: '冖与', 冷: '冫令',
  几: '丿乙', 出: '屮凵', 分: '八刀', 前: '丷一刖', 北: '匕', 医: '匸矢', 十: '一丨', 午: '丿干', 去: '土厶', 友: '又',
  叫: '口丩', 号: '口丂', 吃: '口乞', 同: '凡口', 名: '夕口', 后: '口', 吗: '口马', 听: '口斤', 呢: '口尼', 和: '禾口',
  哪: '口那', 商: '亠丷冏', 喂: '口畏', 喜: '壴口', 喝: '口曷', 四: '囗儿', 回: '囗口', 国: '囗玉', 在: '才土', 坐: '从土',
  块: '土夬', 多: '夕', 大: '一人', 天: '一大', 太: '大丶', 女: '女', 她: '女也', 好: '女子', 妈: '女马', 姐: '女且',
  子: '了一', 字: '宀子', 学: '⺍冖子', 客: '宀各', 家: '宀豕', 对: '又寸', 小: '亅八', 少: '小丿', 岁: '山夕', 工: '一丄',
  师: '刂帀', 年: '干', 店: '广占', 开: '一廾', 影: '景彡', 很: '彳艮', 怎: '乍心', 想: '相心', 我: '扌戈', 打: '扌丁',
  时: '日寸', 明: '日月', 星: '日生', 昨: '日乍', 是: '日疋', 月: '冂二', 有: '月', 朋: '月', 服: '月卩又', 期: '其月',
  本: '木一', 机: '木几', 来: '未丷', 杯: '木不', 果: '田木', 校: '木交', 样: '木羊', 桌: '卓木', 椅: '木奇', 欢: '又欠',
  气: '亻', 水: '亅', 汉: '氵又', 没: '氵殳', 漂: '氵票', 点: '占灬', 热: '执灬', 爱: '爫冖友', 爸: '父巴', 狗: '犭句',
  猫: '犭苗', 现: '王见', 生: '一土', 电: '曰乚', 的: '白勺', 看: '手目', 睡: '目垂', 租: '禾且', 米: '丷木', 系: '丿糸',
  老: '耂匕', 能: '厶⺼匕', 脑: '⺼亠凶', 苹: '艹平', 茶: '艹人木', 菜: '艹采', 衣: '亠', 西: '兀囗', 见: '冂儿', 视: '礻见',
  觉: '⺍冖见', 认: '讠人', 识: '讠只', 话: '讠舌', 语: '讠吾', 说: '讠兑', 请: '讠青', 读: '讠卖', 谁: '讠隹', 谢: '讠射',
  起: '走己', 车: '七十', 这: '辶文', 那: '阝', 都: '者阝', 里: '田土', 钟: '钅中', 钱: '钅戋', 院: '阝完', 雨: '帀',
  面: '面', 飞: '飞', 饭: '饣反', 高: '亠口冋',
}

/** Pictophonetic sound-hint when it appears in CHAR_PARTS (Make Me a Hanzi). */
export const CHAR_PHON = {
  些: '此', 们: '门', 候: '矦', 冷: '令', 叫: '丩', 号: '丂', 吃: '乞', 吗: '马', 呢: '尼', 和: '禾',
  哪: '那', 喂: '畏', 喝: '曷', 在: '才', 块: '夬', 妈: '马', 姐: '且', 家: '豕', 店: '占', 影: '景',
  很: '艮', 怎: '乍', 想: '相', 打: '丁', 星: '生', 昨: '乍', 期: '其', 杯: '不', 校: '交', 样: '羊',
  椅: '奇', 没: '殳', 漂: '票', 点: '占', 热: '执', 爸: '巴', 狗: '句', 猫: '苗', 睡: '垂', 苹: '平',
  菜: '采', 视: '礻', 觉: '⺍', 认: '人', 识: '只', 语: '吾', 说: '兑', 请: '青', 谁: '隹', 谢: '射',
  起: '己', 都: '者', 钟: '中', 钱: '戋', 院: '完', 饭: '反',
}

/** Non-Kangxi pieces that still need pickup-able objects. */
export const COMPONENTS = {
  丁: { name: 'nail', objects: ['a nail', 'a T-square'] },
  丂: { name: 'breath', objects: ['a steam puff', 'a kettle spout'] },
  七: { name: 'seven', objects: ['a crossed stick', 'a seven-shaped hook'] },
  丄: { name: 'up bar', objects: ['a raised beam', 'a floor threshold'] },
  不: { name: 'not', objects: ['a bird diving', 'a blocked gate bar'] },
  与: { name: 'give', objects: ['a pair of tongs', 'an offering tray'] },
  且: { name: 'shelf', objects: ['a small shelf', 'a stacked box'] },
  丩: { name: 'tangle', objects: ['a twisted vine', 'a knotted cord'] },
  中: { name: 'middle', objects: ['a target', 'a flag through a pole'] },
  丶: { name: 'dot', objects: ['a drop of ink', 'a pinhead'] },
  主: { name: 'lamp', objects: ['an oil lamp', 'a candle on a stand'] },
  乍: { name: 'sudden', objects: ['a snapped stick', 'a jack-in-the-box'] },
  乚: { name: 'twist', objects: ['a fishhook', 'a curled wire'] },
  乛: { name: 'fold', objects: ['a folded strap', 'a corner bracket'] },
  乞: { name: 'beg', objects: ['an empty bowl', 'an outstretched cup'] },
  也: { name: 'also', objects: ['a coiled snake charm', 'a funnel'] },
  了: { name: 'complete', objects: ['a wrapped infant', 'a tied bundle'] },
  云: { name: 'cloud', objects: ['a cloud sponge', 'a puff of cotton'] },
  交: { name: 'cross', objects: ['crossed sticks', 'an X-brace'] },
  从: { name: 'follow', objects: ['two paper dolls', 'a tandem puppet'] },
  令: { name: 'order', objects: ['a seal of office', 'a command baton'] },
  兀: { name: 'blunt', objects: ['a stump', 'a chopped post'] },
  兑: { name: 'exchange', objects: ['a coin purse', 'a split token'] },
  其: { name: 'basket', objects: ['a winnowing basket', 'a grain sieve'] },
  冉: { name: 'growing', objects: ['a climbing plant', 'soft hanging banners'] },
  冋: { name: 'border', objects: ['a window frame', 'a square border'] },
  冏: { name: 'bright window', objects: ['a grated window', 'a lantern pane'] },
  凡: { name: 'sail', objects: ['a small sail', 'a general’s fan'] },
  凶: { name: 'pit', objects: ['an open pit', 'a trap lid'] },
  刖: { name: 'cut', objects: ['a butcher’s cleaver', 'a severed stick'] },
  勺: { name: 'ladle', objects: ['a soup ladle', 'a measuring scoop'] },
  卓: { name: 'tall table', objects: ['a high desk', 'a standing lectern'] },
  卖: { name: 'sell', objects: ['a market stall flag', 'a price tag'] },
  卜: { name: 'crack', objects: ['a cracked turtle shell', 'a divining rod'] },
  占: { name: 'omen', objects: ['a cracked shell shard', 'a fortune stick'] },
  卩: { name: 'seal', objects: ['a stamp', 'a kneeling figurine'] },
  友: { name: 'friend', objects: ['two linked rings', 'a handshake charm'] },
  反: { name: 'flip', objects: ['a flipped board', 'a reversing mirror'] },
  句: { name: 'phrase', objects: ['a hooked cane', 'a speech loop'] },
  只: { name: 'only', objects: ['a single bird', 'a lone cup'] },
  各: { name: 'each', objects: ['a foot at a gate', 'separate name tags'] },
  吾: { name: 'I', objects: ['a five-barred gate', 'a self portrait card'] },
  垂: { name: 'droop', objects: ['a hanging tassel', 'a drooping branch'] },
  壴: { name: 'drum stand', objects: ['a standing drum', 'a drum on legs'] },
  天: { name: 'sky', objects: ['a sky disc', 'an open-armed kite'] },
  夬: { name: 'decide', objects: ['a broken ring', 'a snap decision token'] },
  头: { name: 'head', objects: ['a head-shaped weight', 'a bust charm'] },
  奇: { name: 'odd', objects: ['a lopsided stool', 'a strange key'] },
  完: { name: 'finish', objects: ['a roofed seal', 'a completed stamp'] },
  射: { name: 'shoot', objects: ['an arrow on a string', 'a tiny bow'] },
  尔: { name: 'you', objects: ['a silk loom piece', 'a pointing token'] },
  尼: { name: 'nun', objects: ['a kneeling figure', 'a small cloister bell'] },
  屮: { name: 'sprout', objects: ['a green shoot', 'a seedling pot'] },
  己: { name: 'self', objects: ['a threaded needle', 'a self-named tag'] },
  巴: { name: 'cling', objects: ['a clinging claw', 'a python coil'] },
  帀: { name: 'circuit', objects: ['a wrapping cloth', 'a loop of tape'] },
  平: { name: 'flat', objects: ['a level board', 'a balance scale'] },
  戋: { name: 'small blade', objects: ['two thin blades', 'a pocket knife'] },
  才: { name: 'talent', objects: ['a sprouting post', 'a carved talent charm'] },
  执: { name: 'hold', objects: ['a handful of shackles', 'a gripped baton'] },
  故: { name: 'affair', objects: ['an old document', 'a story scroll'] },
  文: { name: 'writing', objects: ['an inked character card', 'a calligraphy brush'] },
  斤: { name: 'axe', objects: ['a hatchet', 'a splitting axe'] },
  景: { name: 'scenery', objects: ['a sunlit diorama', 'a landscape postcard'] },
  曰: { name: 'say', objects: ['a speaking mouth card', 'a caption plaque'] },
  曷: { name: 'how', objects: ['a questioning placard', 'a why-tag'] },
  未: { name: 'not yet', objects: ['a budding tree', 'an unripe fruit'] },
  此: { name: 'this', objects: ['a pointing stick', 'a this-side marker'] },
  殳: { name: 'haft', objects: ['a spear haft', 'a ceremonial mace'] },
  畏: { name: 'fear', objects: ['a demon mask', 'a trembling bell'] },
  疋: { name: 'bolt', objects: ['a bolt of cloth', 'a rolled fabric'] },
  相: { name: 'mutual', objects: ['a seeing-eye tree', 'a paired spyglass'] },
  矢: { name: 'arrow', objects: ['an arrow', 'a quivered dart'] },
  矦: { name: 'marquis', objects: ['an arrow under a roof', 'a noble’s badge'] },
  票: { name: 'ticket', objects: ['a paper ticket', 'a hanging tag'] },
  羊: { name: 'sheep', objects: ['a wool tuft', 'a ram’s horn'] },
  者: { name: 'one who', objects: ['an old man’s cane', 'a name plaque'] },
  舌: { name: 'tongue', objects: ['a wooden tongue', 'a tasting spoon'] },
  艮: { name: 'stopping', objects: ['a stopping block', 'a firm eye charm'] },
  苗: { name: 'seedling', objects: ['a field of sprouts', 'a seedling tray'] },
  豕: { name: 'pig', objects: ['a clay pig', 'a pork side'] },
  那: { name: 'that', objects: ['a far-side flag', 'a pointing banner'] },
  采: { name: 'pick', objects: ['a picking claw on a tree', 'a fruit-picker'] },
  门: { name: 'gate', objects: ['a saloon door', 'a gate latch'] },
  隹: { name: 'short bird', objects: ['a small stuffed bird', 'a tail-less bird charm'] },
  青: { name: 'green', objects: ['a cake of green pigment', 'a teal tile'] },
  马: { name: 'horse', objects: ['a toy horse', 'a horse-hair switch'] },
  示: { name: 'altar', objects: ['an altar table', 'a spirit tablet'] },
}

export function resolveComp(ch) {
  return ALIAS[ch] || ch
}

export function piecesOf(hz) {
  const seen = new Set()
  const out = []
  const push = (ch) => {
    if (!ch) return
    const k = resolveComp(ch)
    if (seen.has(k)) return
    seen.add(k)
    out.push(k)
  }
  push(CHAR_RS[hz])
  for (const ch of (CHAR_PARTS[hz] || '')) push(ch)
  if (!out.length) push(hz)
  return out
}

export function catalog(ch) {
  const key = resolveComp(ch)
  return RADICALS[key] || RADICALS[ch] || COMPONENTS[ch] || COMPONENTS[key] || null
}

export function defaultObjects(ch) {
  const r = catalog(ch)
  return r && r.objects ? r.objects.slice() : []
}

export function propsFor(ch, maps) {
  const over = maps && maps.p && (maps.p[ch] || maps.p[resolveComp(ch)])
  if (over) {
    const list = String(over).split(',').map((s) => s.trim()).filter(Boolean)
    if (list.length) return list
  }
  return defaultObjects(ch)
}

export function whyRadical(rad, hz) {
  const r = catalog(rad)
  if (!r) return ''
  const glyph = r.glyph || rad
  const who = hz ? ` of ${hz}` : ''
  return `Kangxi ${r.rn || '—'} ${glyph} “${r.name}” is the dictionary radical${who}. Same radical, same object family — pick up objects that read as that shape.`
}

export function whyPart(ch, hz, role, name) {
  if (role === 'radical') return whyRadical(ch, hz)
  if (role === 'sound') {
    return `Sound-hint in ${hz}. This extra piece (“${name}”) is how the syllable is cued — pick it up as its own object so the rhyme has something to hold.`
  }
  return `A building block of ${hz} (“${name}”). Every stroke-group is something the lead can hold, not just the Kangxi radical.`
}

export function hintFor(hz, maps) {
  const rad = CHAR_RS[hz]
  if (!rad) return null
  const r = RADICALS[rad]
  if (!r) return null
  const seen = new Set()
  const order = []
  const push = (ch) => {
    if (!ch) return
    const k = resolveComp(ch)
    if (seen.has(ch) || seen.has(k)) return
    seen.add(ch)
    seen.add(k)
    order.push(ch)
  }
  push(rad)
  const raw = CHAR_PARTS[hz] || ''
  for (const ch of raw) {
    if (resolveComp(ch) === rad) continue
    push(ch)
  }
  const phon = CHAR_PHON[hz]
  const parts = order.map((ch) => {
    const info = catalog(ch) || { name: 'piece', objects: [] }
    const key = resolveComp(ch)
    let role = 'piece'
    if (ch === rad || key === rad) role = 'radical'
    else if (phon && (ch === phon || key === phon || ch === resolveComp(phon))) role = 'sound'
    const glyph = info.glyph || ch
    return {
      ch,
      glyph,
      name: info.name,
      role,
      objects: propsFor(ch, maps),
      why: whyPart(ch, hz, role, info.name),
    }
  })
  return {
    hz,
    rad,
    glyph: r.glyph || rad,
    rn: r.rn,
    name: r.name,
    objects: propsFor(rad, maps),
    why: whyRadical(rad, hz),
    parts,
  }
}
