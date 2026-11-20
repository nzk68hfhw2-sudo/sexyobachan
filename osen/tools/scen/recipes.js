module.exports = { touch: false, run: async (page, shot, logs) => {
  const t = await page.evaluate(() => { const O = __os; return O.RECIPES.map((r, i) => (i + 1) + '. ' + O.itemType(r.a).name + '　＋　' + O.itemType(r.b).name + '　→　' + O.itemType(r.out).name + '\n    ' + O.itemType(r.out).desc + (O.itemType(r.out).special ? '（いじる：' + O.itemType(r.out).special.name + '）' : '')).join('\n'); });
  require('fs').writeFileSync(require('path').join(__dirname, '../../deliver/recipes_spoiler.txt'), '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n 合成の組み合わせ一覧（ネタバレ・作者用）全' + t.split('\n').filter(l => /^\d/.test(l)).length + '種\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n・町で物を「投げる」か「置く」して、ほかの物にぶつけると合成されます。\n・カバンの「合成」ボタンで、２つ選んでも合成できます。\n・同じ結果になる組み合わせが２通りある物もあります。\n\n' + t + '\n');
  logs.push('ok');
} };
