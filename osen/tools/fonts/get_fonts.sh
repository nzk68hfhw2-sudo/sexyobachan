#!/bin/sh
# フォントの元ファイルを取ってくる（Google Fonts の GitHub。すべて SIL OFL 1.1）  usage: sh get_fonts.sh <保存先>
mkdir -p "$1" && cd "$1" || exit 1
for u in ofl/dotgothic16/DotGothic16-Regular.ttf ofl/bizudgothic/BIZUDGothic-Bold.ttf "ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf" ofl/delagothicone/DelaGothicOne-Regular.ttf ofl/reggaeone/ReggaeOne-Regular.ttf ofl/rocknrollone/RocknRollOne-Regular.ttf ofl/mochiypopone/MochiyPopOne-Regular.ttf ofl/yuseimagic/YuseiMagic-Regular.ttf; do
  [ -f "$(basename "$u")" ] || curl -sfLO "https://raw.githubusercontent.com/google/fonts/main/$u"
done
