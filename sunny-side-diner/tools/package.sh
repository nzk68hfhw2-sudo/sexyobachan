#!/bin/sh
# builds dist/game.js and deliver/sunny_side_diner.zip
cd "$(dirname "$0")/.." && node tools/build.js && rm -f deliver/sunny_side_diner.zip && (cd dist && zip -q -r -X ../deliver/sunny_side_diner.zip index.html game.js _headers source.txt audio/sunny_side_diner.m4a audio/diner_boogie.m4a audio/warped_diner.m4a audio/jingle_in_reverse.m4a images/face_*.jpg) && unzip -l deliver/sunny_side_diner.zip | tail -3
