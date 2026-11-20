# 使う字だけのフォント（woff2）を作る。 usage: python3 subset.py <src_dir> <font_src_dir> <out_dir>
import sys, os, re, json
from fontTools import subset
from fontTools.ttLib import TTFont
src, fsrc, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
text = ''.join(open(os.path.join(src, f), encoding='utf8').read() for f in sorted(os.listdir(src)) if f.endswith('.js'))
base = ''.join(chr(c) for c in range(0x20, 0x7f)) + ''.join(chr(c) for c in range(0x3041, 0x3097)) + ''.join(chr(c) for c in range(0x30a1, 0x30fb)) + 'ー・ー〜～、。「」『』（）！？＋－×÷＝％＆＃＠★☆○●◎◆◇■□▲△▼▽←↑→↓…‥　' + ''.join(chr(c) for c in range(0xff01, 0xff5f))
allc = set(base) | set(c for c in text if ord(c) >= 0x80)
m = re.search(r"var CN_GLYPH = '([^']*)'", text); n = re.search(r"var CN_SIMP = '([^']*)'", text)
cn = set((m.group(1) if m else '') + (n.group(1) if n else ''))
jp = ''.join(sorted(c for c in allc if c not in cn or c in m.group(1)))
cfg = json.load(open(os.path.join(os.path.dirname(__file__), 'fonts.json'), encoding='utf8'))
res = {}
for f in cfg:
    chars = ''.join(sorted(cn)) + '0123456789' if f.get('cn') else jp
    font = TTFont(os.path.join(fsrc, f['file']))
    if 'wght' in f:
        from fontTools.varLib import instancer
        font = instancer.instantiateVariableFont(font, {'wght': f['wght']})
    opt = subset.Options(); opt.flavor = 'woff2'; opt.layout_features = ['*']; opt.name_IDs = ['*']; opt.notdef_outline = True; opt.hinting = False; opt.desubroutinize = True
    s = subset.Subsetter(opt); s.populate(text=chars); s.subset(font)
    p = os.path.join(out, f['id'] + '.woff2'); font.flavor = 'woff2'; font.save(p)
    res[f['id']] = os.path.getsize(p)
print(len(jp), 'chars;', json.dumps(res), 'total', sum(res.values()))
