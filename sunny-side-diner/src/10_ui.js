// ---- UI: design tokens, SVG icon set, buttons, HUD, subtitles, choice slips -------
// Icon grid 24x24, stroke 2.2, round caps/joins, no fills (one consistent set).
var ICON_PATHS = {
  pause: 'M9 5v14M15 5v14',
  play: 'M7 5l12 7-12 7z',
  rules: 'M8 4h8l1 2h2v15H5V6h2zM8 4v3h8V4M8 11h8M8 15h8M8 19h5',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  seat: 'M6 4v9h12M6 13v7M18 13v7M10 9h8a2 2 0 0 1 0 4',
  menu: 'M5 3h12a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2zM9 8h6M9 12h6M9 16h3',
  order: 'M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21zM9 8h6M9 12h6M9 16h4',
  pencil: 'M4 20l1-5L16 4l4 4L9 19zM14 6l4 4',
  serve: 'M3 17h18M5 17a7 7 0 0 1 14 0M12 8V6M10 6h4',
  check: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M14 16h1',
  stop: 'M7 11V5a1.5 1.5 0 0 1 3 0v5M10 10V4a1.5 1.5 0 0 1 3 0v6M13 10V5a1.5 1.5 0 0 1 3 0v6M16 11V8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2.5-4.5a1.5 1.5 0 0 1 2.6-1.5L7 14',
  tear: 'M6 3h12v8l-2 1.5 2 1.5V21H6v-7l2-1.5L6 11zM9 7h6M9 17h4',
  cook: 'M4 20l7-7M11 13l2-2 7-7-1-1-8 8M15 4l5 5',
  spatula: 'M5 19l6-6M11 13l1.5-1.5M12.5 11.5L18 6l-2-2-5.5 5.5zM14 8l2 2',
  coffee: 'M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10h2a2 2 0 0 1 0 4h-2M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3',
  record: 'M12 3a9 9 0 1 0 0.01 0zM12 9a3 3 0 1 0 0.01 0zM12 6a6 6 0 0 0-6 6',
  phone: 'M6 3l3 1 1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5 1 3-2 2C11 21 3 13 4 5z',
  snow: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  sign: 'M4 7h16v8H4zM8 15v5M16 15v5M7 11h2M11 11h2M15 11h2',
  door: 'M6 3h10v18H6zM16 5h3v16M13 12h.5',
  exit: 'M10 3H5v18h5M14 8l4 4-4 4M18 12H9',
  hide: 'M3 21V9l9-6 9 6v12M8 21v-7h8v7',
  reply: 'M4 5h16v11H9l-5 4z',
  silent: 'M4 5h16v11H9l-5 4zM9 9l6 4M15 9l-6 4',
  eyeoff: 'M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c5 0 8.5 4 9.5 6a12 12 0 0 1-2.6 3.4M6.5 7.5A12 12 0 0 0 2.5 12C3.5 14 7 18 12 18c1.4 0 2.7-.3 3.8-.8M9.5 9.8a3 3 0 0 0 4.4 4.1',
  eye: 'M2.5 12C3.5 10 7 6 12 6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6zM12 9a3 3 0 1 0 .01 0z',
  gear: 'M12 9a3 3 0 1 0 .01 0zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  archive: 'M3 4h18v5H3zM5 9v11h14V9M10 13h4',
  back: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  skip: 'M5 5l8 7-8 7zM13 5l8 7-8 7',
  close: 'M6 6l12 12M18 6L6 18',
  ok: 'M5 12l5 5L20 7',
  ticket: 'M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4zM14 7v10',
  coin: 'M12 3a9 9 0 1 0 .01 0zM14.5 9c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5M12 6v1.5M12 16.5V18',
  thermo: 'M12 3a2 2 0 0 0-2 2v9.5a4 4 0 1 0 4 0V5a2 2 0 0 0-2-2zM12 10v6',
  walk: 'M13 4a1.5 1.5 0 1 0 .01 0zM9 21l3-7 3 3v4M12 14l-1-5 4 2 3 3M11 9l-3 2-1 3',
  manager: 'M12 3a4 4 0 1 0 .01 0zM4 21a8 8 0 0 1 16 0M10 15l2 2 2-2',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0M12 3v2',
  headphones: 'M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v6H4zM17 15h3v6h-3z',
  speaker: 'M4 9h4l5-4v14l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11',
  restart: 'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4',
  pie: 'M12 3a9 9 0 1 0 9 9h-9zM15 3.5A9 9 0 0 1 20.5 9H15z',
  look: 'M12 5v14M5 12h14M12 5l-2 2M12 5l2 2M12 19l-2-2M12 19l2-2'
};
function icon(name, size) {
  var p = ICON_PATHS[name] || ICON_PATHS.ok, s = size || 24;
  return '<svg class="ic" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + p + '"/></svg>';
}
var PAPER = {}; // data-URL paper textures (built in 11_paper.js)
var UI_CSS = function () {
  return [
    '#ssd-ui{--cream:#F3E6C8;--paper:#FBF3E0;--red:#C8282E;--dred:#7E1418;--mint:#8FD3C1;--dmint:#2F7E6E;--chrome:#D8DDE2;--ink:#22201C;--night:#0B0D12;--pink:#FF4FA3;--cyan:#5BE8FF;--wear:0;',
    ' font-family:"Zen Kaku Gothic New",system-ui,-apple-system,sans-serif;color:var(--cream);}',
    '#ssd-ui .pe{pointer-events:auto;}',
    '#ssd-ui .en{display:block;font-family:Oswald,"Zen Kaku Gothic New",sans-serif;letter-spacing:.04em;}',
    '#ssd-ui .ja{display:block;font-family:"Zen Kaku Gothic New",sans-serif;font-weight:500;letter-spacing:.02em;}',
    // ---- round enamel button with chrome bezel
    '.sb{position:absolute;width:56px;height:56px;border-radius:50%;border:0;padding:0;cursor:pointer;color:var(--cream);',
    ' background:radial-gradient(circle at 35% 28%,#e8444a 0%,#b4161d 45%,#6e0b10 100%) padding-box,linear-gradient(160deg,#ffffff 0%,#9aa3ab 35%,#eef1f3 55%,#6c747c 100%) border-box;',
    ' border:3px solid transparent;box-shadow:0 4px 0 #3b0507,0 8px 16px rgba(0,0,0,.55),inset 0 2px 2px rgba(255,255,255,.35),inset 0 -3px 6px rgba(0,0,0,.35);',
    ' display:flex;align-items:center;justify-content:center;transition:transform .09s ease-out,box-shadow .09s,filter .2s;}',
    '.sb .ic{filter:drop-shadow(0 1px 0 rgba(0,0,0,.5));}',
    '.sb.mint{background:radial-gradient(circle at 35% 28%,#b9eedd 0%,#5fb7a0 45%,#24685a 100%) padding-box,linear-gradient(160deg,#ffffff 0%,#9aa3ab 35%,#eef1f3 55%,#6c747c 100%) border-box;color:#10302a;box-shadow:0 4px 0 #0f3a32,0 8px 16px rgba(0,0,0,.55),inset 0 2px 2px rgba(255,255,255,.45),inset 0 -3px 6px rgba(0,0,0,.25);}',
    '.sb.dark{background:radial-gradient(circle at 35% 28%,#3a3d44 0%,#1c1e23 55%,#0b0c0f 100%) padding-box,linear-gradient(160deg,#ffffff 0%,#9aa3ab 35%,#eef1f3 55%,#6c747c 100%) border-box;box-shadow:0 4px 0 #050506,0 8px 16px rgba(0,0,0,.55),inset 0 2px 2px rgba(255,255,255,.2);}',
    '.sb:active,.sb.down{transform:translateY(3px);box-shadow:0 1px 0 #3b0507,0 3px 8px rgba(0,0,0,.5),inset 0 2px 2px rgba(255,255,255,.3),0 0 18px rgba(255,79,163,.55);}',
    '.sb.off,.mb.off{filter:grayscale(.85) brightness(.45);pointer-events:none;}',
    '.sb .badge{position:absolute;right:-4px;top:-4px;min-width:20px;height:20px;border-radius:10px;background:var(--cyan);color:#062028;font:700 12px/20px Oswald,sans-serif;text-align:center;padding:0 5px;box-shadow:0 0 10px var(--cyan);}',
    '.sb .lbl{position:absolute;top:60px;left:50%;transform:translateX(-50%);font:600 10px/1 Oswald,sans-serif;letter-spacing:.14em;color:rgba(243,230,200,.72);white-space:nowrap;text-shadow:0 1px 2px #000;}',
    // ---- main pill button (enamel sign)
    '.mb{position:absolute;height:64px;min-width:210px;max-width:calc(100% - 180px);padding:0 22px 0 16px;border-radius:999px;border:3px solid transparent;cursor:pointer;',
    ' background:linear-gradient(180deg,#fff8e6 0%,#f1e2bd 60%,#dcc697 100%) padding-box,linear-gradient(160deg,#ffffff 0%,#8e979f 30%,#f4f6f8 52%,#646c74 100%) border-box;',
    ' box-shadow:0 5px 0 #8a7448,0 10px 20px rgba(0,0,0,.55),inset 0 2px 1px #fff,inset 0 -3px 5px rgba(120,90,40,.3);color:var(--dred);',
    ' display:flex;align-items:center;gap:12px;transition:transform .09s ease-out,box-shadow .09s,opacity .25s,filter .2s;transform-origin:50% 100%;}',
    '.mb .ic{flex:0 0 auto;width:30px;height:30px;padding:5px;border-radius:50%;background:var(--red);color:#fff6e0;box-shadow:inset 0 -2px 3px rgba(0,0,0,.35),0 1px 0 #fff;box-sizing:content-box;}',
    '.mb .tx{display:flex;flex-direction:column;align-items:flex-start;min-width:0;}',
    '.mb .en{font-family:"Alfa Slab One",serif;font-size:19px;line-height:1.05;letter-spacing:.03em;color:var(--dred);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}',
    '.mb .ja{font-size:11.5px;color:#6b4a2a;margin-top:2px;white-space:nowrap;}',
    '.mb:active,.mb.down{transform:translateY(4px);box-shadow:0 1px 0 #8a7448,0 4px 10px rgba(0,0,0,.5),inset 0 2px 1px #fff,0 0 26px rgba(91,232,255,.55);}',
    '.mb.glow{animation:mbglow 1.6s ease-in-out infinite;}',
    '@keyframes mbglow{0%,100%{box-shadow:0 5px 0 #8a7448,0 10px 20px rgba(0,0,0,.55),inset 0 2px 1px #fff,0 0 0 rgba(255,79,163,0)}50%{box-shadow:0 5px 0 #8a7448,0 10px 20px rgba(0,0,0,.55),inset 0 2px 1px #fff,0 0 22px rgba(255,79,163,.75)}}',
    '.mb.danger{background:linear-gradient(180deg,#ffe9e6 0%,#f0c2bb 60%,#d99a90 100%) padding-box,linear-gradient(160deg,#ffffff 0%,#8e979f 30%,#f4f6f8 52%,#646c74 100%) border-box;}',
    '.mb.hidden,.sb.hidden{opacity:0;pointer-events:none;transform:translateY(12px) scale(.96);}',
    // wear / grime overlay (grows each night)
    '.sb::after,.mb::after{content:"";position:absolute;inset:-3px;border-radius:inherit;pointer-events:none;opacity:var(--wear);background-image:var(--grime);background-size:cover;mix-blend-mode:multiply;}',
    '#ssd-ui.flick .mb,#ssd-ui.flick .sb{animation:uiflick 7s steps(1) infinite;}',
    '@keyframes uiflick{0%,93%,95%,100%{filter:none}94%{filter:brightness(.4)}96%{filter:brightness(.7)}}',
    // ---- HUD
    '.hud{position:absolute;top:calc(var(--top-safe) + 8px);left:20px;display:flex;flex-direction:column;gap:8px;align-items:flex-start;transition:opacity .4s;}',
    '.clock{display:flex;align-items:center;gap:10px;height:48px;padding:0 16px 0 10px;border-radius:14px;',
    ' background:linear-gradient(180deg,#24262b,#101114) padding-box,linear-gradient(160deg,#fff 0%,#8e979f 35%,#eef1f3 55%,#5a6168 100%) border-box;border:2px solid transparent;box-shadow:0 6px 14px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.12);}',
    '.clock .dial{width:30px;height:30px;border-radius:50%;background:#f6f0df;position:relative;box-shadow:inset 0 0 0 2px #c8282e,inset 0 2px 4px rgba(0,0,0,.4);}',
    '.clock .dial i{position:absolute;left:50%;bottom:50%;width:2px;background:#22201c;transform-origin:50% 100%;border-radius:2px;}',
    '.clock .dial i.h{height:8px;margin-left:-1px}.clock .dial i.m{height:12px;margin-left:-1px;width:1.5px}',
    '.clock .tm{font:600 22px/1 Oswald,sans-serif;letter-spacing:.06em;color:#ffe9b0;text-shadow:0 0 10px rgba(255,190,90,.55);}',
    '.clock .nt{font:600 10px/1.2 Oswald,sans-serif;letter-spacing:.2em;color:rgba(243,230,200,.6);margin-top:3px;}',
    '.chip{display:flex;align-items:center;gap:8px;height:34px;padding:0 12px 0 8px;border-radius:999px;background:rgba(16,17,20,.82);border:1.5px solid rgba(216,221,226,.45);font:600 15px/1 Oswald,sans-serif;letter-spacing:.06em;color:var(--cream);box-shadow:0 4px 10px rgba(0,0,0,.4);transition:opacity .3s,transform .3s;}',
    '.chip .ic{width:18px;height:18px;color:#ffd36a;}',
    '.chip.cold .ic{color:var(--cyan)}.chip .bar{width:90px;height:8px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden}.chip .bar b{display:block;height:100%;width:0;background:linear-gradient(90deg,#5be8ff,#e8fbff);border-radius:4px;transition:width .2s}',
    '.chip.hide{opacity:0;transform:translateX(-10px);}',
    '.pausebtn{top:calc(var(--top-safe) + 4px);right:20px;}',
    '.speedbtn{top:calc(var(--top-safe) + 72px);right:24px;width:48px;height:48px;flex-direction:column;gap:0}',
    '.speedbtn .ic{width:18px;height:18px}.speedbtn b{font:600 13px/1 Oswald,sans-serif;letter-spacing:.04em;margin-top:1px}',
    '.speedbtn.on{box-shadow:0 4px 0 #050506,0 8px 16px rgba(0,0,0,.55),0 0 14px rgba(91,232,255,.65)}.speedbtn.on b{color:#bff4ff}',
    '.speedbtn.hold{filter:brightness(.55)}',
    // ---- bottom bands
    '.shade{position:absolute;left:0;right:0;bottom:0;height:46%;background:linear-gradient(0deg,rgba(5,5,8,.92) 0%,rgba(5,5,8,.7) 38%,rgba(5,5,8,0) 100%);pointer-events:none;transition:opacity .5s;}',
    '.btnband{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);height:76px;}',
    '.btnband .left{left:20px;bottom:14px}.btnband .right{right:20px;bottom:14px}',
    '.btnband .mb{left:50%;bottom:8px;transform:translateX(-50%);}',
    '.btnband .mb:active,.btnband .mb.down{transform:translateX(-50%) translateY(4px);}',
    '.btnband .mb.hidden{transform:translateX(-50%) translateY(12px) scale(.96);}',
    '.subband{position:absolute;left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 16px + 76px + 14px);min-height:84px;pointer-events:none;transition:opacity .25s,transform .25s;}',
    '.subband.hide{opacity:0;transform:translateY(8px);}',
    // while a guest check (choices) is open, the subtitle moves to the top instead of disappearing
    '.subband.top{bottom:auto;top:calc(var(--top-safe) + 64px);z-index:6;padding:8px 12px 10px;border-radius:12px;background:rgba(8,8,11,.78);border:1px solid rgba(216,221,226,.22);}',
    '#ssd-ui.calling .subband.top{top:calc(var(--top-safe) + 196px)}',
    '.subtap.top{bottom:auto;top:calc(var(--top-safe) + 60px);height:110px;z-index:6}',
    '#ssd-ui.calling .subtap.top{top:calc(var(--top-safe) + 192px)}',
    // the ringing phone: its own card, never replaced by other windows
    '.callcard{position:absolute;left:20px;right:84px;top:calc(var(--top-safe) + 64px);max-width:330px;padding:12px 14px;border-radius:14px;z-index:7;pointer-events:auto;',
    ' background:linear-gradient(180deg,#f7a9c6,#e97fa8) padding-box,linear-gradient(160deg,#fff,#8e979f 35%,#eef1f3 55%,#5a6168) border-box;border:2px solid transparent;box-shadow:0 10px 22px rgba(0,0,0,.55);color:#3a0a1c;animation:callin .3s cubic-bezier(.2,.9,.3,1.2) both}',
    '@keyframes callin{0%{opacity:0;transform:translateY(-10px) rotate(-1deg)}100%{opacity:1;transform:none}}',
    '.callcard .ct{display:flex;align-items:center;gap:10px;font:400 17px/1.1 "Alfa Slab One",serif;letter-spacing:.03em}.callcard .ct .ic{width:24px;height:24px;animation:ring .5s ease-in-out infinite}',
    '@keyframes ring{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}',
    '.callcard .cj{font:600 11.5px/1.4 "Zen Kaku Gothic New",sans-serif;margin:2px 0 10px 34px;color:#5a1430}',
    '#ssd-ui.calling .rail{opacity:0;pointer-events:none}',
    '.callcard .cb{display:flex;gap:10px}.callcard button{flex:1;height:46px;border-radius:999px;border:2px solid #fff3f7;font:600 14px/1.1 Oswald,sans-serif;letter-spacing:.06em;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 3px 0 rgba(90,10,40,.5)}',
    '.callcard button small{font:600 10px/1.2 "Zen Kaku Gothic New";letter-spacing:0}.callcard .pick{background:#c8282e;color:#fff4dc}.callcard .let{background:#fbf3e0;color:#3a0a1c}',
    '.callcard button:active{transform:translateY(2px);box-shadow:0 1px 0 rgba(90,10,40,.5)}',
    '.sub{position:relative;padding:4px 4px 2px;}',
    '.sub .who{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 10px;border-radius:999px;background:rgba(200,40,46,.9);color:#fff4dc;font:600 11px/22px Oswald,sans-serif;letter-spacing:.16em;margin-bottom:8px;box-shadow:0 2px 6px rgba(0,0,0,.5);}',
    '.sub .who.sunny{background:linear-gradient(90deg,#ffb21c,#ff7a2e);color:#3a1600}.sub .who.mgr{background:#2f7e6e}.sub .who.odd{background:#3a3d44;color:#cfd6dd}.sub .who.you{background:#5a6c8a}',
    '.sub .l1{font:700 19px/1.32 "Zen Kaku Gothic New",sans-serif;color:#fff8ea;text-shadow:0 1px 2px #000,0 0 12px rgba(0,0,0,.85);letter-spacing:.01em;min-height:25px;}',
    '.sub .l2{font:500 13.5px/1.45 "Zen Kaku Gothic New",sans-serif;color:rgba(243,230,200,.86);text-shadow:0 1px 2px #000,0 0 10px rgba(0,0,0,.9);margin-top:4px;}',
    '.sub .more{position:absolute;right:2px;bottom:-2px;width:18px;height:18px;color:rgba(243,230,200,.7);animation:bob 1s ease-in-out infinite;}',
    '@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}',
    '.subtap{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom,0px) + 16px + 76px + 6px);height:120px;pointer-events:auto;}',
    // ---- choice slip (guest check)
    '.slip{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 16px + 76px + 12px);width:min(340px,calc(100% - 40px));transform:translateX(-50%) rotate(-1.2deg);',
    ' padding:30px 18px 16px;color:#1f3b8a;background-color:#eef3e4;background-image:var(--slipbg);background-size:cover;border-radius:2px;',
    ' box-shadow:0 14px 28px rgba(0,0,0,.55),0 2px 3px rgba(0,0,0,.35);pointer-events:auto;transition:transform .26s cubic-bezier(.2,.9,.3,1.2),opacity .2s;opacity:1;}',
    '.slip.hide{opacity:0;transform:translateX(-50%) translateY(40px) rotate(4deg);pointer-events:none;}',
    '.slip::before{content:"";position:absolute;left:0;right:0;top:-7px;height:8px;background:radial-gradient(circle at 5px -1px,transparent 5px,#eef3e4 5.5px) -1px 0/10px 8px repeat-x;}',
    '.slip .hd{position:absolute;left:18px;right:18px;top:9px;display:flex;justify-content:space-between;font:600 10px/1 Oswald,sans-serif;letter-spacing:.2em;color:#2f7e6e;}',
    '.slip .hd b{color:#c8282e;font-weight:600}',
    '.slip .t{font:400 22px/1.1 "Shadows Into Light",cursive;color:#1d2f6f;margin:2px 0 8px;}',
    '.slip .opt{display:flex;align-items:center;gap:12px;min-height:50px;padding:6px 8px;border-top:1px solid rgba(47,126,110,.35);cursor:pointer;border-radius:4px;transition:background .12s;}',
    '.slip .opt:last-child{border-bottom:1px solid rgba(47,126,110,.35);}',
    '.slip .opt:active,.slip .opt.down{background:rgba(200,40,46,.1);}',
    '.slip .opt .ic{flex:0 0 auto;width:26px;height:26px;color:#c8282e;}',
    '.slip .opt .en{font:400 21px/1.05 "Shadows Into Light",cursive;color:#1d2f6f;letter-spacing:0;}',
    '.slip .opt .ja{font:600 11.5px/1.3 "Klee One","Zen Kaku Gothic New",serif;color:#4a5a7a;}',
    '.slip .opt.o-dim{opacity:.4;pointer-events:none;}',
    '.slip .opt.o-warn .ic{color:#7e1418}',
    '.slip .opt.o-minor{min-height:38px;padding:4px 8px;opacity:.72}',
    '.slip .opt.o-minor .ic{width:20px;height:20px;color:#6a7480}',
    '.slip .opt.o-minor .en{font-size:16px;color:#5a6478}.slip .opt.o-minor .ja{font-size:10.5px;color:#7a8290}',
    // toast / big title
    '.toast{position:absolute;left:50%;top:38%;z-index:8;transform:translateX(-50%);padding:10px 16px;border-radius:12px;background:rgba(12,13,16,.88);border:1.5px solid rgba(216,221,226,.35);text-align:center;font-size:13px;color:var(--cream);box-shadow:0 8px 18px rgba(0,0,0,.5);transition:opacity .3s,transform .3s;max-width:calc(100% - 40px);}',
    '.toast .en{font-size:16px;color:#fff3d6}.toast.hide{opacity:0;transform:translateX(-50%) translateY(-6px)}',
    // hotspot labels (3D markers) — drawn in 3D, label in DOM
    '.hint{position:absolute;transform:translate(-50%,-100%);font:600 11px/1 Oswald,sans-serif;letter-spacing:.14em;color:#e8fbff;text-shadow:0 0 8px #5be8ff,0 1px 2px #000;white-space:nowrap;pointer-events:none;transition:opacity .3s;}',
    // overlays
    '.ov{position:absolute;inset:0;pointer-events:auto;transition:opacity .35s;}',
    '.ov.hide{opacity:0;pointer-events:none;}',
    '.dim{background:radial-gradient(ellipse at 50% 45%,rgba(10,10,14,.55),rgba(0,0,0,.88));}',
    '.flash{position:absolute;inset:0;pointer-events:none;opacity:0;}',
    '.scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;}'
  ].join('\n');
};
// ---- UI state & construction -----------------------------------------------------
var U = {};
function buildUI() {
  var st = document.createElement('style'); st.textContent = UI_CSS(); (document.head || document.documentElement).appendChild(st);
  U.shade = el('div', 'shade', null, UI);
  // HUD
  U.hud = el('div', 'hud', null, UI);
  U.clock = el('div', 'clock', '<div class="dial"><i class="h"></i><i class="m"></i></div><div><div class="tm">10:00 PM</div><div class="nt">NIGHT 1</div></div>', U.hud);
  U.tips = el('div', 'chip hide', icon('coin') + '<span>$0.00</span>', U.hud);
  U.cold = el('div', 'chip cold hide', icon('thermo') + '<div class="bar"><b></b></div>', U.hud);
  U.pause = el('button', 'sb dark pausebtn pe', icon('pause', 24), UI); U.pause.setAttribute('aria-label', 'Pause');
  U.speed = el('button', 'sb dark speedbtn pe', icon('skip', 18) + '<b>×1</b>', UI); U.speed.setAttribute('aria-label', 'Game speed');
  pressFX(U.speed);
  onTap(U.speed, function () { GAME.spd = (GAME.spd || 1) >= 3 ? 1 : (GAME.spd || 1) + 1; sfx('click'); refreshSpeed(); toast('Speed ×' + GAME.spd, GAME.spd > 1 ? '時間を早送り（異変・料理・冷凍庫のあいだは等速）' : 'ふつうの速さ', 1.8); });
  // subtitles
  U.sub = el('div', 'subband hide', '<div class="sub"><div class="who"></div><div class="l1"></div><div class="l2"></div><svg class="more" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg></div>', UI);
  U.subTap = el('div', 'subtap', null, UI); U.subTap.style.display = 'none';
  // slip (choices)
  U.slip = el('div', 'slip hide', '', UI);
  // bottom band
  U.band = el('div', 'btnband', null, UI);
  U.rulesBtn = el('button', 'sb left pe', icon('rules', 24) + '<span class="lbl">RULES</span>', U.band);
  U.mapBtn = el('button', 'sb mint right pe', icon('map', 24) + '<span class="lbl">MAP</span>', U.band);
  U.main = el('button', 'mb pe hidden', '', U.band);
  U.toast = el('div', 'toast hide', '', UI);
  U.flash = el('div', 'flash', null, UI);
  U.layer = el('div', null, null, UI); U.layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
  pressFX(U.pause); pressFX(U.rulesBtn); pressFX(U.mapBtn); pressFX(U.main);
  onTap(U.subTap, function () { subAdvance(); });
  onTap(U.main, function () { if (U.mainAct && U.mainAct.fn) { sfx('click'); U.mainAct.fn(); } });
  setGameHUD(false);
}
function pressFX(b) {
  b.addEventListener('pointerdown', function () { b.classList.add('down'); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { b.addEventListener(n, function () { b.classList.remove('down'); }); });
}
function refreshSpeed() { if (!U.speed) return; var s = GAME.spd || 1; U.speed.querySelector('b').textContent = '×' + s; U.speed.classList.toggle('on', s > 1); U.speed.classList.toggle('hold', s > 1 && !!(GAME.inAnomaly || MINI.active || CAM.inFreezer)); }
function setGameHUD(on) {
  [U.hud, U.pause, U.speed, U.band, U.shade].forEach(function (e) { e.style.display = on ? '' : 'none'; });
}
function layoutUI() { /* CSS handles layout; hook for future */ }
function setMain(act) {
  U.mainAct = act;
  if (!act) { U.main.classList.add('hidden'); return; }
  var key = act.icon + act.en + act.ja + (act.danger ? 'd' : '') + (act.glow ? 'g' : '');
  if (U.main._key !== key) { U.main.innerHTML = icon(act.icon || 'ok', 30) + '<span class="tx"><span class="en">' + act.en + '</span><span class="ja">' + act.ja + '</span></span>'; U.main._key = key; }
  U.main.classList.remove('hidden');
  U.main.classList.toggle('danger', !!act.danger); U.main.classList.toggle('glow', !!act.glow);
}
function setClock(min, night) { // min since 22:00
  var tot = (22 * 60 + Math.floor(min)) % 1440, h = Math.floor(tot / 60), m = tot % 60, ap = h >= 12 ? 'PM' : 'AM', h12 = h % 12 || 12;
  U.clock.querySelector('.tm').textContent = h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + ap;
  U.clock.querySelector('.nt').textContent = 'NIGHT ' + night + (night === 5 ? ' · LAST' : '');
  U.clock.querySelector('.h').style.transform = 'rotate(' + ((h % 12) * 30 + m * 0.5) + 'deg)';
  U.clock.querySelector('.m').style.transform = 'rotate(' + (m * 6) + 'deg)';
}
function setTips(v, show) { U.tips.querySelector('span').textContent = fmtMoney(v); U.tips.classList.toggle('hide', !show); }
function setCold(v, show) { U.cold.querySelector('b').style.width = Math.round(clamp(v, 0, 1) * 100) + '%'; U.cold.classList.toggle('hide', !show); }
var TOAST_T = 0;
function toast(en, ja, sec, tries) {
  // wait while a guest check / phone card / top subtitle is on screen (so nothing overlaps), up to ~6s
  tries = tries || 0;
  if (tries < 10 && (SLIP.open || U.call || (SUBQ.cur && U.sub.classList.contains('top')))) { setTimeout(function () { toast(en, ja, sec, tries + 1); }, 600); return; }
  U.toast.innerHTML = '<span class="en">' + en + '</span>' + (ja ? '<span class="ja">' + ja + '</span>' : '');
  U.toast.classList.remove('hide'); clearTimeout(TOAST_T); TOAST_T = setTimeout(function () { U.toast.classList.add('hide'); }, (sec || 2.4) * 1000);
}
// ---- choice slip ---------------------------------------------------------------------
var SLIP = { open: false, onClose: null };
function showChoices(title, opts, meta) {
  meta = meta || {};
  var h = '<div class="hd"><span>GUEST CHECK</span><b>No. ' + (meta.no || (1000 + Math.floor(Math.random() * 8999))) + '</b><span>' + (meta.table || '') + '</span></div>';
  if (title) h += '<div class="t">' + title + '</div>';
  opts.forEach(function (o, i) { h += '<div class="opt' + (o.dim ? ' o-dim' : '') + (o.warn ? ' o-warn' : '') + (o.minor ? ' o-minor' : '') + '" data-i="' + i + '">' + icon(o.icon || 'ok', o.minor ? 20 : 26) + '<div><span class="en">' + o.en + '</span><span class="ja">' + o.ja + '</span></div></div>'; });
  if (!meta.noCancel) h += '<div class="opt" data-i="-1">' + icon('back', 26) + '<div><span class="en">Never mind</span><span class="ja">やめる</span></div></div>';
  U.slip.innerHTML = h;
  U.slip.style.setProperty('--slipbg', PAPER.slip ? 'url(' + PAPER.slip + ')' : 'none');
  U.slip.style.transform = ''; U.slip.classList.remove('hide'); SLIP.open = true;
  U.sub.classList.add('top'); U.subTap.classList.add('top');
  sfx('paper');
  U.slip.querySelectorAll('.opt').forEach(function (n) {
    pressFX(n);
    onTap(n, function () { var i = +n.getAttribute('data-i'); hideChoices(); sfx('pen'); if (i >= 0 && opts[i].fn) opts[i].fn(); else if (meta.onCancel) meta.onCancel(); });
  });
}
function hideChoices() { U.slip.classList.add('hide'); SLIP.open = false; U.sub.classList.remove('top'); U.subTap.classList.remove('top'); }
// the ringing phone card (independent of the guest check)
function showCall(title, ja, onPick, onLet) {
  hideCall();
  var c = el('div', 'callcard', '<div class="ct">' + icon('phone', 24) + '<span>' + title + '</span></div><div class="cj">' + ja + '</div><div class="cb"><button class="pick">PICK UP<small>電話に出る</small></button><button class="let">LET IT RING<small>出ない</small></button></div>', UI);
  U.call = c; UI.classList.add('calling');
  onTap(c.querySelector('.pick'), function () { sfx('click'); hideCall(); onPick && onPick(); });
  onTap(c.querySelector('.let'), function () { sfx('click'); hideCall(); onLet && onLet(); });
}
function hideCall() { if (U.call && U.call.parentNode) U.call.parentNode.removeChild(U.call); U.call = null; UI.classList.remove('calling'); }
// ---- subtitles --------------------------------------------------------------------------
var SUBQ = { cur: null, queue: [], typing: 0, timer: 0 };
var WHO_CLASS = { SUNNY: 'sunny', MANAGER: 'mgr', DALE: 'mgr', YOU: 'you', '???': 'odd' };
function subShow(line) {
  SUBQ.cur = line; SUBQ.typing = 0; SUBQ.shown = 0; SUBQ.done = false;
  var who = U.sub.querySelector('.who'); who.textContent = line.who || ''; who.style.display = line.who ? '' : 'none';
  who.className = 'who ' + (line.cls || WHO_CLASS[line.who] || '');
  U.sub.querySelector('.l1').textContent = ''; U.sub.querySelector('.l2').textContent = line.ja || '';
  U.sub.querySelector('.more').style.opacity = 0;
  U.sub.classList.remove('hide'); U.subTap.style.display = '';
  U.sub.classList.toggle('top', SLIP.open); U.subTap.classList.toggle('top', SLIP.open);
}
function subUpdate(dt) {
  var L = SUBQ.cur; if (!L) return;
  var full = L.en || '';
  if (SUBQ.shown < full.length) {
    var cps = L.cps || 24;
    // follow TTS word boundaries when we have them
    if (L.boundary != null) SUBQ.shown = Math.max(SUBQ.shown, Math.min(full.length, L.boundary + 1));
    SUBQ.typing += dt * cps; var n = Math.floor(SUBQ.typing);
    if (n > SUBQ.shown) SUBQ.shown = Math.min(full.length, n);
    U.sub.querySelector('.l1').textContent = full.slice(0, SUBQ.shown);
    if (SUBQ.shown >= full.length) SUBQ.typed = true;
  } else if (!SUBQ.done) { U.sub.querySelector('.more').style.opacity = L.wait === false ? 0 : 1; }
}
function subHide() { U.sub.classList.add('hide'); U.subTap.style.display = 'none'; SUBQ.cur = null; }
function subAdvance() {
  var L = SUBQ.cur; if (!L) return;
  if (SUBQ.shown < (L.en || '').length) { SUBQ.shown = L.en.length; SUBQ.typing = 1e9; U.sub.querySelector('.l1').textContent = L.en; return; }
  if (L.onTap) L.onTap();
}
