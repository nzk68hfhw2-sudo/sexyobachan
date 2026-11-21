// とても小さなテスト実行係。結果を一覧で出します。
export function runner(title) {
  const rows = [];
  return {
    async t(name, fn) {
      try { await fn(); rows.push([true, name]); console.log('  ✅ ' + name); }
      catch (e) { rows.push([false, name, e]); console.log('  ❌ ' + name + '\n     ' + (e && e.stack || e)); }
    },
    done() {
      const ng = rows.filter((r) => !r[0]).length;
      console.log(`\n${title}: ${rows.length - ng} / ${rows.length} 件 成功` + (ng ? `(失敗 ${ng} 件)` : ''));
      return ng;
    },
  };
}
export function ok(c, msg) { if (!c) throw new Error('確認に失敗: ' + msg); }
export function eq(a, b, msg) { if (a !== b) throw new Error(`確認に失敗: ${msg} (実際=${JSON.stringify(a)} 期待=${JSON.stringify(b)})`); }
