<?php require_once 'config.php'; checkAuth(); ?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Workspace">
<meta name="mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#030014">
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><rect width='512' height='512' rx='90' fill='%23030014'/><circle cx='256' cy='256' r='160' stroke='%237c3aed' stroke-width='12' fill='none'/><circle cx='256' cy='256' r='80' stroke='%2306b6d4' stroke-width='12' fill='none'/><circle cx='256' cy='256' r='20' fill='%2306b6d4'/></svg>">
<title>Workspace</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#030014;--card:rgba(255,255,255,.02);--border:rgba(255,255,255,.05);--primary:#7c3aed;--primary-soft:rgba(124,58,237,.08);--accent:#06b6d4;--green:#22c55e;--yellow:#eab308;--red:#ef4444;--text:rgba(255,255,255,.6);--muted:rgba(255,255,255,.25);--white:#fff;--font:'Inter',sans-serif;--cyan:#06b6d4}
html.light{--bg:#f5f5f7;--card:rgba(0,0,0,.02);--border:rgba(0,0,0,.08);--text:rgba(0,0,0,.6);--muted:rgba(0,0,0,.3);--white:#111}
html.light body{background:var(--bg);color:var(--text)}
html.light .sidebar{background:rgba(255,255,255,.9);border-right:1px solid var(--border)}
html.light .sidebar__logo{color:#111;border-bottom:1px solid var(--border)}
html.light .nav-item{color:rgba(0,0,0,.4)}
html.light .nav-item:hover{background:rgba(124,58,237,.06);color:rgba(0,0,0,.7)}
html.light .nav-item.active{background:rgba(124,58,237,.1);color:#7c3aed}
html.light .nav-section{color:rgba(0,0,0,.3)}
html.light .page-title{color:#111}
html.light .proj{background:rgba(255,255,255,.8);border:1px solid var(--border)}
html.light .proj__name{color:#111}
html.light .proj:hover{border-color:rgba(124,58,237,.2)}
html.light .creds{background:rgba(0,0,0,.03);border:1px solid var(--border)}
html.light .lead-card{background:rgba(255,255,255,.8);border:1px solid var(--border)}
html.light .lead-stat{background:rgba(0,0,0,.03)}
html.light .lead-stat__num{color:#111}
html.light .lead-method{background:rgba(0,0,0,.03)}
html.light .lead-total{background:rgba(255,255,255,.9);border:1px solid var(--border);box-shadow:0 1px 3px rgba(0,0,0,.04)}
html.light .lead-refresh{background:rgba(124,58,237,.06);border:1px solid rgba(124,58,237,.1)}
html.light .todo,.light .tool-item{background:rgba(255,255,255,.8);border:1px solid var(--border)}
html.light .todo-form input,.light .todo-form select{background:rgba(0,0,0,.03);border:1px solid var(--border);color:#333}
html.light .tools-form input,.light .tools-form select{background:rgba(0,0,0,.03);border:1px solid var(--border);color:#333}
html.light .tools-summary__card{background:rgba(255,255,255,.8);border:1px solid var(--border)}
html.light .cal-wrap{background:rgba(255,255,255,.8);border:1px solid var(--border)}
html.light .cal-day{color:rgba(0,0,0,.4)}
html.light .cal-day:hover{background:rgba(124,58,237,.06);color:rgba(0,0,0,.7)}
html.light .cal-detail{background:rgba(255,255,255,.8);border:1px solid var(--border)}
html.light .cal-task{background:rgba(124,58,237,.04);border:1px solid rgba(124,58,237,.08)}
html.light .note-card{background:rgba(255,255,255,.8);border:1px solid var(--border)}
html.light .note-add{background:rgba(255,255,255,.5);border:2px dashed rgba(0,0,0,.1)}
html.light .loom-card{background:rgba(255,255,255,.8);border:1px solid var(--border)}
html.light .loom-form input{background:rgba(0,0,0,.03);border:1px solid var(--border);color:#333}
html.light .bil-wrap{background:rgba(255,255,255,.8);border:1px solid var(--border)}
html.light .bil-t td:first-child,.light .bil-t th:first-child{background:rgba(245,245,247,.98)}
html.light .bil-t th{background:rgba(0,0,0,.04)}
html.light .bil-t th:last-child{background:rgba(0,0,0,.06)}
html.light .bil-t td.ec:hover{background:rgba(124,58,237,.08)!important}
html.light .bil-bar input,.light .bil-add-col input,.light .bil-add-col select{background:rgba(0,0,0,.03);border:1px solid var(--border);color:#333}
html.light .bil-cell-pop{background:rgba(255,255,255,.98);border:1px solid var(--border)}
html.light .wa-accordion{background:rgba(255,255,255,.5)}
html.light .mob-bar{background:rgba(245,245,247,.95);border-top:1px solid var(--border)}
html.light .mob-more{background:rgba(255,255,255,.98);border:1px solid var(--border)}
html.light .mob-more__item{color:#333}
html.light #cursor-glow,.light .grid-overlay{display:none}
html.light .cal-header h3{color:#111}
html.light .cal-day.today{color:#111;background:rgba(124,58,237,.12)}
html.light .cal-detail__header{color:#111}
html.light .note-modal__inner{background:rgba(255,255,255,.98);border:1px solid var(--border)}
html.light .note-modal__title{color:#111}
html.light .note-modal__body{color:#333}
html.light .note-modal__close{color:#888;background:rgba(0,0,0,.04);border:1px solid var(--border)}
html.light .lead-card__name{color:#111}
html.light .lead-stat__num{color:#111}
html.light .lead-method__num{color:#333}
html.light .proj__desc{color:#666}
html.light .proj__domain{color:var(--primary)}
html.light .cred-val{color:#333;background:rgba(0,0,0,.05)}
html.light .cred-label{color:#888}
html.light .bil-bar button{background:rgba(0,0,0,.04);border:1px solid var(--border);color:#666}
html.light .bil-t .row-tot td{background:rgba(0,0,0,.04);color:#111}
html.light .bil-cell-pop{background:rgba(255,255,255,.98);border:1px solid var(--border);box-shadow:0 8px 32px rgba(0,0,0,.12)}
html.light .bil-cell-pop__title{color:#888}
html.light .bil-cell-pop__item{background:rgba(0,0,0,.03)}
html.light .bil-cell-pop__item-amt{color:#111}
html.light .bil-cell-pop__item-label{color:#333}
html.light .bil-cell-pop__form input{background:rgba(0,0,0,.03);border:1px solid var(--border);color:#333}
html.light .bil-cell-pop__total span{color:#111}
html.light .loom-card__notes textarea{background:rgba(0,0,0,.03);border:1px solid var(--border);color:#333}
html.light .loom-view__name{color:#333}
html.light .cal-task-form input{background:rgba(0,0,0,.03);border:1px solid var(--border);color:#333}
html.light .cal-task{background:rgba(124,58,237,.06);color:#333}
html.light .tool-item__creds code{background:rgba(0,0,0,.05);color:#333}
html.light .tools-summary__num{color:#111}
html.light .bil-add-col input,.light .bil-add-col select{background:rgba(0,0,0,.03);border:1px solid var(--border);color:#333}
html.light .todo__check{border:2px solid rgba(0,0,0,.2)}
html.light .todo__text{color:#333}
html.light .todo-form input,.light .todo-form select{color:#333}
html.light .tools-form input,.light .tools-form select{color:#333}
html.light .loom-form input{color:#333}
html.light .mob-tab{color:rgba(0,0,0,.4)}
html.light .mob-tab.active{color:var(--primary)}
html.light .mob-more__item svg{color:#888}
/* Bilancio light fixes */
html.light .bil-wrap{background:rgba(255,255,255,.8)}
html.light .bil-t{background:#fff}
html.light .bil-t td:first-child{background:rgba(250,250,252,.98)!important}
html.light .bil-t th:first-child{background:rgba(245,245,247,.98)!important}
html.light .bil-t td:last-child{background:rgba(245,245,247,.5)!important}
html.light .bil-t .vz{color:rgba(0,0,0,.15)}
html.light .bil-t .row-tot td{background:rgba(0,0,0,.03)!important;color:#111}
html.light .bil-t .row-tot td.col-e{color:var(--green)!important}
html.light .bil-t .row-tot td.col-u{color:var(--red)!important}
html.light .bil-t td.ec.editing input{background:#fff;border:1px solid var(--primary);color:#111}
html.light .bil-t tr:nth-child(even) td{background:rgba(0,0,0,.015)!important}
html.light .bil-t tr:nth-child(even) td:first-child{background:rgba(248,248,250,.98)!important}
html.light .bil-t th{background:rgba(0,0,0,.04)!important;color:#888}
html.light .bil-t th:last-child{background:rgba(0,0,0,.06)!important}
html.light .bil-t th.col-e{background:rgba(34,197,94,.08)!important;color:var(--green)}
html.light .bil-t th.col-u{background:rgba(239,68,68,.08)!important;color:var(--red)}
html.light .bil-t th.col-tot{background:rgba(124,58,237,.08)!important;color:var(--primary)}
/* Competitor light fixes */
html.light .comp-form input,.light .comp-form textarea{background:rgba(0,0,0,.03);border:1px solid var(--border);color:#333}
html.light .comp-form select,.light #comp-cat{background:rgba(0,0,0,.03)!important;border:1px solid var(--border)!important;color:#333!important}
html.light .comp-item{background:rgba(255,255,255,.8);border:1px solid var(--border)}
html.light .comp-item__url a{color:var(--primary)}
html.light .comp-item__note{color:#555}
/* Calendar light fixes */
html.light .cal-nav button{background:rgba(0,0,0,.03);border:1px solid var(--border);color:#666}
html.light .cal-day{color:rgba(0,0,0,.4)}
html.light .cal-day:hover{color:rgba(0,0,0,.8);background:rgba(124,58,237,.06)}
html.light .cal-day.today{color:#111;background:rgba(124,58,237,.12)}
html.light .cal-task-form input{background:rgba(0,0,0,.03);color:#333}
html.light .cal-task-editing input{background:rgba(0,0,0,.03);border:1px solid var(--border);color:#333}
/* Todo light fixes */
html.light #todo-pri,.light #comp-cat{background:rgba(0,0,0,.03)!important;color:#333!important;border:1px solid var(--border)!important}
html.light .todo-edit-inline input{background:rgba(0,0,0,.03);border:1px solid var(--border);color:#333}
html.light .todo-edit-inline select{background:rgba(0,0,0,.03);border:1px solid var(--border);color:#333}
/* Note expand/card light */
html.light .note-card__expand{background:rgba(0,0,0,.04);border:1px solid var(--border);color:#888}
/* Lead stat bg fix */
html.light .lead-stat{background:rgba(0,0,0,.03)}
html.light .lead-method{background:rgba(0,0,0,.03)}
/* Misc inputs */
html.light .lead-card__ads input{background:rgba(0,0,0,.03);border:1px solid var(--border);color:#333}
body{font-family:var(--font);background:var(--bg);color:var(--text);min-height:100vh;display:flex}
::selection{background:rgba(124,58,237,.4)}
a{text-decoration:none;color:inherit}
input,textarea,select,button{font-family:var(--font)}
#cursor-glow{position:fixed;width:350px;height:350px;border-radius:50%;pointer-events:none;z-index:0;background:radial-gradient(circle,rgba(124,58,237,.06) 0%,transparent 70%);transform:translate(-50%,-50%)}
.grid-overlay{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(124,58,237,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,.02) 1px,transparent 1px);background-size:80px 80px}

/* SIDEBAR */
.sidebar{width:220px;background:rgba(255,255,255,.015);border-right:1px solid var(--border);height:100vh;position:fixed;overflow-y:auto;display:flex;flex-direction:column;backdrop-filter:blur(20px);z-index:10}
.sidebar__logo{padding:20px;font-size:15px;font-weight:700;color:var(--white);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
.sidebar__logo svg{width:22px;height:22px;flex-shrink:0}
.sidebar__nav{padding:12px 8px;flex:1}
.nav-section{font-size:9px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.15em;padding:16px 12px 6px}
.nav-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;font-size:13px;font-weight:500;color:rgba(255,255,255,.35);cursor:pointer;transition:all .2s}
.nav-item:hover{background:rgba(124,58,237,.06);color:rgba(255,255,255,.6)}
.nav-item.active{background:rgba(124,58,237,.1);color:#7c3aed}
.nav-item .dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;display:none}
.nav-item .nav-icon{width:18px;height:18px;flex-shrink:0;opacity:.5;transition:opacity .2s}
.nav-item:hover .nav-icon,.nav-item.active .nav-icon{opacity:.9}
.nav-item .badge{margin-left:auto;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:var(--white);font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px}

/* MAIN */
.main{margin-left:220px;flex:1;padding:24px;min-height:100vh;position:relative;z-index:1}
.main::before{content:'';position:fixed;top:-200px;right:-200px;width:500px;height:500px;background:radial-gradient(circle,rgba(124,58,237,.05),transparent 70%);pointer-events:none;z-index:0}
.page{display:none}.page.active{display:block}
.page-title{font-size:24px;font-weight:800;color:var(--white);margin-bottom:4px}
.page-sub{font-size:13px;color:var(--muted);margin-bottom:16px}

/* PROJECT CARDS */
.projects{display:flex;flex-direction:column;gap:16px}
.proj{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;transition:all .3s;backdrop-filter:blur(10px);position:relative;overflow:hidden}
.proj::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(124,58,237,.04),transparent 60%);opacity:0;transition:opacity .4s;pointer-events:none;z-index:0}
.proj:hover::after{opacity:1}
.proj:hover{border-color:rgba(124,58,237,.15);box-shadow:0 4px 30px rgba(124,58,237,.06)}
.proj>*{position:relative;z-index:1}
.proj__top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px}
.proj__name{font-size:17px;font-weight:700;color:var(--white)}
.tag{padding:3px 12px;border-radius:20px;font-size:10px;font-weight:700}
.tag-live{background:rgba(34,197,94,0.1);color:var(--green);border:1px solid rgba(34,197,94,.15)}
.tag-local{background:rgba(234,179,8,0.1);color:var(--yellow);border:1px solid rgba(234,179,8,.15)}
.panel-toggle{display:inline-flex;align-items:center;gap:8px;font-size:11px;color:var(--muted);cursor:pointer;user-select:none;padding:4px 10px;border-radius:20px;border:1px solid var(--border);background:rgba(255,255,255,.02);transition:all .2s}
.panel-toggle:hover{border-color:rgba(124,58,237,.3);color:var(--white)}
.panel-toggle__switch{position:relative;width:30px;height:16px;background:rgba(255,255,255,.1);border-radius:10px;transition:background .2s;flex-shrink:0}
.panel-toggle__switch::after{content:'';position:absolute;top:2px;left:2px;width:12px;height:12px;background:#fff;border-radius:50%;transition:transform .2s}
.panel-toggle input{display:none}
.panel-toggle input:checked + .panel-toggle__switch{background:#22c55e}
.panel-toggle input:checked + .panel-toggle__switch::after{transform:translateX(14px)}
.panel-toggle.saving{opacity:.5;pointer-events:none}
html.light .panel-toggle{background:rgba(0,0,0,.02)}
html.light .panel-toggle__switch{background:rgba(0,0,0,.1)}
.proj__domain{font-size:12px;color:var(--primary);margin-bottom:12px;word-break:break-all}
.proj__desc{font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:14px}
.proj__links{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.btn-link{padding:6px 14px;border-radius:8px;font-size:11px;font-weight:600;display:inline-flex;align-items:center;gap:5px;transition:all .2s;border:1px solid transparent}
.btn-link:hover{transform:translateY(-1px)}
.btn-site{background:rgba(124,58,237,.08);color:#7c3aed;border-color:rgba(124,58,237,.12)}
.btn-site:hover{background:rgba(124,58,237,.15)}
.btn-admin{background:rgba(234,179,8,.08);color:var(--yellow);border-color:rgba(234,179,8,.12)}
.btn-admin:hover{background:rgba(234,179,8,.15)}
.btn-local{background:rgba(6,182,212,.08);color:#06b6d4;border-color:rgba(6,182,212,.12)}
.btn-local:hover{background:rgba(6,182,212,.15)}
.creds{background:rgba(255,255,255,.015);border:1px solid var(--border);border-radius:10px;padding:12px 16px;display:flex;flex-direction:column;gap:6px}
.cred{display:flex;align-items:center;gap:8px;font-size:11px}
.cred-label{color:var(--muted);min-width:80px;font-weight:600}
.cred-val{color:rgba(255,255,255,.6);font-family:'SF Mono',Menlo,monospace;font-size:12px;background:rgba(124,58,237,.06);border:1px solid rgba(124,58,237,.08);padding:2px 10px;border-radius:6px;user-select:all}
.proj__cmd{margin-top:10px;font-size:11px;color:var(--muted)}
.proj__cmd code{background:var(--border);padding:3px 8px;border-radius:4px;font-size:11px;color:var(--text)}
.proj__drive{margin-top:10px;display:flex;align-items:center;gap:8px}
.proj__drive-icon{width:18px;height:18px;flex-shrink:0}
.proj__drive-link{font-size:12px;color:var(--cyan);text-decoration:none;word-break:break-all;flex:1}
.proj__drive-link:hover{text-decoration:underline}
.proj__drive-edit{display:flex;gap:6px;align-items:center;flex:1}
.proj__drive-edit input{flex:1;padding:6px 10px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:11px;outline:none}
.proj__drive-edit input:focus{border-color:rgba(124,58,237,.3)}
.proj__drive-edit button{padding:6px 10px;border:none;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer}
.proj__drive-btn-save{background:var(--green);color:#fff}
.proj__drive-btn-edit{background:none;border:none!important;color:var(--muted);cursor:pointer;font-size:12px;padding:4px;opacity:.5;transition:opacity .15s}
.proj__drive-btn-edit:hover{opacity:1}
.proj__drive-empty{font-size:11px;color:var(--muted);cursor:pointer;padding:6px 10px;background:rgba(255,255,255,.02);border:1px dashed var(--border);border-radius:6px;transition:border-color .2s;flex:1;text-align:center}
.proj__drive-empty:hover{border-color:rgba(124,58,237,.2)}

/* FILE UPLOADER */
.proj__files{margin-top:14px;border-top:1px solid var(--border);padding-top:12px}
.proj__files-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;font-size:11px;color:var(--muted);font-weight:600;letter-spacing:.02em;text-transform:uppercase}
.proj__files-count{background:var(--border);color:var(--text);padding:1px 8px;border-radius:999px;font-size:10px}
.proj__files-drop{display:block;border:1.5px dashed var(--border);border-radius:8px;padding:14px;text-align:center;color:var(--muted);font-size:12px;cursor:pointer;transition:border-color .2s,background .2s,color .2s;user-select:none}
.proj__files-drop:hover,.proj__files-drop.dragover{border-color:var(--accent);background:rgba(124,58,237,.06);color:var(--accent)}
.proj__files-drop strong{font-weight:700}
.proj__files-list{display:grid;gap:6px;margin-top:10px}
.proj__files-empty{color:var(--muted);font-size:11px;padding:8px;text-align:center;opacity:.6}
.proj__file-row{display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:8px;transition:background .15s,border-color .15s}
.proj__file-row:hover{background:rgba(124,58,237,.04);border-color:rgba(124,58,237,.15)}
.proj__file-icon{font-size:18px;flex-shrink:0;line-height:1}
.proj__file-info{flex:1;min-width:0}
.proj__file-name{color:var(--text);font-weight:600;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}
.proj__file-meta{color:var(--muted);font-size:10px}
.proj__file-actions{display:flex;gap:2px;flex-shrink:0}
.proj__file-btn{background:none;border:0;color:var(--muted);cursor:pointer;padding:5px 8px;border-radius:5px;font-size:14px;line-height:1;text-decoration:none;transition:color .15s,background .15s}
.proj__file-btn:hover{color:var(--text);background:rgba(255,255,255,.06)}
.proj__file-btn--del:hover{color:#ef4444;background:rgba(239,68,68,.1)}
.proj__files-busy{opacity:.6;pointer-events:none}

/* COMPETITOR TRACKER */
.comp-form{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.comp-form input,.comp-form textarea{flex:1;min-width:200px;padding:10px 14px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;color:rgba(255,255,255,.8);font-size:13px;outline:none;transition:border-color .2s}
.comp-form input:focus,.comp-form textarea:focus{border-color:rgba(124,58,237,.3)}
.comp-form button{padding:10px 20px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:var(--white);border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
.comp-form button:hover{box-shadow:0 0 20px rgba(124,58,237,.25)}
.comp-list{display:flex;flex-direction:column;gap:10px}
.comp{background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;gap:14px;align-items:flex-start;backdrop-filter:blur(10px);transition:all .2s}
.comp:hover{border-color:rgba(124,58,237,.12)}
.comp__body{flex:1}
.comp__url{font-size:12px;color:var(--primary);word-break:break-all;margin-bottom:4px}
.comp__note{font-size:13px;color:var(--text);line-height:1.5}
.comp__date{font-size:10px;color:var(--muted);margin-top:4px}
.comp__del{background:none;border:none;color:var(--red);cursor:pointer;font-size:12px;font-weight:600;padding:4px 8px;border-radius:4px}
.comp__del:hover{background:rgba(239,68,68,0.1)}

/* TODO */
.todo-form{display:flex;gap:8px;margin-bottom:20px}
.todo-form input{flex:1;padding:10px 14px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;color:rgba(255,255,255,.8);font-size:13px;outline:none;transition:border-color .2s}
.todo-form input:focus{border-color:rgba(124,58,237,.3)}
.todo-form button{padding:10px 20px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:var(--white);border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
.todo-form button:hover{box-shadow:0 0 20px rgba(124,58,237,.25)}
.todo-list{display:flex;flex-direction:column;gap:6px}
.todo{display:flex;align-items:center;gap:12px;padding:12px 16px;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:12px;backdrop-filter:blur(10px);transition:all .2s}
.todo:hover{border-color:rgba(124,58,237,.12)}
.todo__check{width:20px;height:20px;border-radius:6px;border:2px solid var(--border);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s}
.todo__check.done{background:var(--green);border-color:var(--green)}
.todo__check.done::after{content:'✓';color:#fff;font-size:14px;font-weight:700;line-height:1}
.todo__text{flex:1;font-size:13px;color:var(--text)}
.todo__text.done{text-decoration:line-through;color:var(--muted)}
.todo__date{font-size:10px;color:var(--muted)}
.todo__edit{background:none;border:none;color:var(--cyan);cursor:pointer;font-size:13px;padding:2px 6px;opacity:.5;transition:opacity .2s}
.todo__edit:hover{opacity:1}
.todo__del{background:none;border:none;color:var(--red);cursor:pointer;font-size:16px;padding:2px 6px}
.todo-edit-inline{display:flex;gap:8px;flex:1;align-items:center}
.todo-edit-inline input{flex:1;padding:6px 10px;background:rgba(255,255,255,.05);border:1px solid rgba(124,58,237,.3);border-radius:8px;color:var(--text);font-size:13px;outline:none}
.todo-edit-inline select{padding:6px 8px;background:rgba(255,255,255,.05);border:1px solid rgba(124,58,237,.3);border-radius:8px;color:rgba(255,255,255,.7);font-size:11px}
.todo-edit-inline button{padding:4px 12px;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer}
.todo-edit-inline .btn-save{background:var(--green);color:#fff}
.todo-edit-inline .btn-cancel{background:rgba(255,255,255,.08);color:var(--muted)}
.todo__priority{padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;margin-right:4px}
/* Progetti grid */
.proj-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.proj-card{display:flex;align-items:center;gap:12px;padding:14px 16px;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:12px;cursor:pointer;transition:all .2s;position:relative}
.proj-card:hover{border-color:rgba(124,58,237,.35);transform:translateY(-1px);background:rgba(124,58,237,.04)}
.proj-color{width:10px;align-self:stretch;border-radius:4px;flex-shrink:0}
.proj-info{flex:1;min-width:0}
.proj-name{font-size:14px;font-weight:700;color:var(--text);margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.proj-meta{font-size:11px;color:var(--muted)}
.proj-del{background:none;border:none;color:var(--red);cursor:pointer;font-size:18px;padding:4px 8px;opacity:.4;transition:opacity .2s;line-height:1}
.proj-del:hover{opacity:1}
.proj-count{display:inline-block;min-width:22px;padding:2px 8px;background:rgba(124,58,237,.15);color:#7c3aed;border-radius:10px;font-size:11px;font-weight:700;margin-left:6px}
html.light .proj-card{background:rgba(255,255,255,.8);border:1px solid var(--border)}
html.light .proj-name{color:#333}
.pri-alta{background:rgba(239,68,68,0.12);color:var(--red)}
.pri-media{background:rgba(234,179,8,0.12);color:var(--yellow)}
.pri-bassa{background:rgba(34,197,94,0.12);color:var(--green)}

/* TOOLS */
.tools-summary{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
.tools-summary__card{flex:1;min-width:140px;padding:16px;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:14px;text-align:center}
.tools-summary__num{font-size:22px;font-weight:800;color:var(--cyan)}
.tools-summary__label{font-size:10px;color:var(--muted);text-transform:uppercase;margin-top:4px}
.tools-form{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;align-items:center}
.tools-form input,.tools-form select{padding:10px 14px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;color:rgba(255,255,255,.8);font-size:13px;outline:none;transition:border-color .2s}
.tools-form input:focus{border-color:rgba(124,58,237,.3)}
.tools-form input[type="text"]{flex:2;min-width:150px}
.tools-form input[type="number"]{width:110px}
.tools-form input[type="date"]{width:140px}
.tools-form select{padding:10px;color:rgba(255,255,255,.7)}
.tools-form button{padding:10px 20px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:var(--white);border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
.tools-form button:hover{box-shadow:0 0 20px rgba(124,58,237,.25)}
.tools-list{display:flex;flex-direction:column;gap:6px}
.tool-item{display:flex;align-items:center;gap:12px;padding:14px 16px;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:12px;transition:all .2s}
.tool-item:hover{border-color:rgba(124,58,237,.12)}
.tool-item__name{flex:1;font-size:14px;font-weight:600;color:var(--text)}
.tool-item__amount{font-size:14px;font-weight:700;color:var(--cyan)}
.tool-item__date{font-size:11px;color:var(--muted)}
.tool-item__tag{padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700}
.tag-mensile{background:rgba(124,58,237,.12);color:var(--primary)}
.tag-singolo{background:rgba(34,197,94,.12);color:var(--green)}
.tool-item__del{background:none;border:none;color:var(--red);cursor:pointer;font-size:16px;padding:2px 6px}
.tool-item__creds{display:flex;gap:12px;font-size:11px;color:var(--muted);margin-left:8px}
.tool-item__creds span{display:flex;align-items:center;gap:4px}
.tool-item__creds code{background:rgba(255,255,255,.04);padding:1px 6px;border-radius:4px;color:var(--text);font-size:11px;cursor:pointer}
.tool-item__creds code:hover{background:rgba(255,255,255,.08)}
.tool-item__edit{background:none;border:none;color:var(--cyan);cursor:pointer;font-size:13px;padding:2px 6px;opacity:.5;transition:opacity .2s}
.tool-item__edit:hover{opacity:1}

/* BILANCIO */
.bil-bar{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.bil-bar button{height:30px;padding:0 10px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:6px;color:rgba(255,255,255,.5);cursor:pointer;font-size:12px;transition:all .15s}
.bil-bar button:hover{border-color:rgba(124,58,237,.3);color:var(--primary)}
.bil-bar .bil-label{font-size:16px;font-weight:800;color:var(--white);min-width:140px;text-align:center}
.bil-add-col{display:flex;gap:6px;margin-left:auto;align-items:center}
.bil-add-col input{padding:6px 10px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:12px;outline:none;width:130px}
.bil-add-col input:focus{border-color:rgba(124,58,237,.3)}
.bil-add-col select{padding:6px 8px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:6px;color:rgba(255,255,255,.7);font-size:11px}
.bil-add-col button{padding:6px 12px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer}
.bil-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:8px;background:rgba(0,0,0,.3);max-height:75vh}
.bil-t{width:100%;border-collapse:collapse;font-size:12px}
.bil-t th,.bil-t td{padding:7px 10px;text-align:right;border:1px solid rgba(255,255,255,.04);white-space:nowrap}
.bil-t th{background:rgba(255,255,255,.05);color:var(--muted);font-size:10px;font-weight:700;text-transform:uppercase;position:sticky;top:0;z-index:1}
.bil-t td:first-child,.bil-t th:first-child{text-align:center;position:sticky;left:0;z-index:2;background:rgba(8,4,24,.97);min-width:44px;width:44px;font-weight:700;color:var(--muted)}
.bil-t th:first-child{z-index:3;background:rgba(15,10,35,.98)}
.bil-t .col-e{background:rgba(34,197,94,.03)}
.bil-t .col-u{background:rgba(239,68,68,.03)}
.bil-t th.col-e{background:rgba(34,197,94,.12);color:var(--green)}
.bil-t th.col-u{background:rgba(239,68,68,.12);color:var(--red)}
.bil-t th.col-tot{background:rgba(124,58,237,.12);color:var(--primary)}
.bil-t .col-tot{background:rgba(124,58,237,.04);font-weight:700}
.bil-t th .col-del{cursor:pointer;color:var(--red);font-size:10px;margin-left:4px;opacity:.4}
.bil-t th .col-del:hover{opacity:1}
.bil-t .row-tot td{background:rgba(255,255,255,.04);font-weight:800;color:var(--white);border-top:2px solid rgba(255,255,255,.08);font-size:12px}
.bil-t .row-tot td.col-e{color:var(--green);background:rgba(34,197,94,.06)}
.bil-t .row-tot td.col-u{color:var(--red);background:rgba(239,68,68,.06)}
.bil-t .row-tot td.col-prof{color:var(--cyan);background:rgba(6,182,212,.06)}
.bil-t .vz{color:rgba(255,255,255,.08)}
.bil-t .vp{color:var(--green)}
.bil-t .vn{color:var(--red)}
.bil-t td.ec{cursor:pointer;transition:background .1s}
.bil-t td.ec:hover{background:rgba(124,58,237,.1)!important}
.bil-cell-pop{position:fixed;z-index:100;min-width:260px;background:rgba(15,10,35,.97);border:1px solid rgba(124,58,237,.3);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.6);backdrop-filter:blur(20px);padding:12px;max-height:320px;overflow-y:auto}
.bil-cell-pop__title{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;font-weight:700}
.bil-cell-pop__items{display:flex;flex-direction:column;gap:4px;margin-bottom:8px}
.bil-cell-pop__item{display:flex;align-items:center;gap:6px;padding:5px 8px;background:rgba(255,255,255,.03);border-radius:6px;font-size:12px}
.bil-cell-pop__item-label{flex:1;color:var(--text)}
.bil-cell-pop__item-amt{font-weight:700;color:var(--white)}
.bil-cell-pop__item-del{background:none;border:none;color:var(--red);cursor:pointer;font-size:13px;padding:0 2px;opacity:.4}
.bil-cell-pop__item-del:hover{opacity:1}
.bil-cell-pop__form{display:flex;gap:4px}
.bil-cell-pop__form input{padding:5px 7px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:5px;color:var(--text);font-size:11px;outline:none}
.bil-cell-pop__form input:focus{border-color:rgba(124,58,237,.3)}
.bil-cell-pop__form input:first-child{flex:1;min-width:80px}
.bil-cell-pop__form input:last-of-type{width:70px;text-align:right}
.bil-cell-pop__form button{padding:5px 10px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;border:none;border-radius:5px;font-size:10px;font-weight:700;cursor:pointer}
.bil-cell-pop__close{position:absolute;top:6px;right:8px;background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px}
.bil-cell-pop__close:hover{color:var(--red)}
.bil-cell-pop__total{font-size:11px;color:var(--muted);text-align:right;margin-top:6px;padding-top:6px;border-top:1px solid var(--border)}
.bil-cell-pop__total span{color:var(--white);font-weight:800}
.bil-t tr:nth-child(even) td{background:rgba(255,255,255,.008)}
.bil-t tr:nth-child(even) td:first-child{background:rgba(8,4,24,.95)}
.bil-t tr:nth-child(even) td.col-e{background:rgba(34,197,94,.02)}
.bil-t tr:nth-child(even) td.col-u{background:rgba(239,68,68,.02)}
.bil-t tr:nth-child(even) td.col-tot{background:rgba(124,58,237,.03)}

/* LOOM */
.loom-form{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.loom-form input{padding:10px 14px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;color:rgba(255,255,255,.8);font-size:13px;outline:none;transition:border-color .2s}
.loom-form input:focus{border-color:rgba(168,85,247,.3)}
.loom-form input[type="url"]{flex:2;min-width:200px}
.loom-form input[type="text"]{flex:1;min-width:120px}
.loom-form button{padding:10px 20px;background:linear-gradient(135deg,#a855f7,#7c3aed);color:var(--white);border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer}
.loom-list{display:flex;flex-direction:column;gap:10px}
.loom-card{background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:14px;padding:18px;position:relative;transition:border-color .2s}
.loom-card:hover{border-color:rgba(168,85,247,.15)}
.loom-card__top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
.loom-card__title{font-size:14px;font-weight:700;color:var(--white);flex:1}
.loom-card__title a{color:var(--white);text-decoration:none}
.loom-card__title a:hover{color:#a855f7}
.loom-card__date{font-size:10px;color:var(--muted);margin-top:2px}
.loom-card__del{background:none;border:none;color:var(--red);cursor:pointer;font-size:16px;padding:0 4px;opacity:.4}
.loom-card__del:hover{opacity:1}
.loom-card__link{font-size:11px;color:#a855f7;word-break:break-all;margin-bottom:12px;display:block;text-decoration:none}
.loom-card__link:hover{text-decoration:underline}
.loom-card__views{display:flex;gap:12px;margin-bottom:10px}
.loom-view{display:flex;align-items:center;gap:6px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.loom-view__check{width:18px;height:18px;border-radius:5px;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0}
.loom-view__check.checked{background:#22c55e;border-color:#22c55e}
.loom-view__check.checked::after{content:'\2713';color:#fff;font-size:10px;font-weight:700}
.loom-view__name{font-size:12px;color:var(--text);font-weight:600}
.loom-card__notes{margin-top:8px}
.loom-card__notes textarea{width:100%;padding:8px 12px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12px;font-family:var(--font);outline:none;resize:vertical;min-height:50px;transition:border-color .2s}
.loom-card__notes textarea:focus{border-color:rgba(168,85,247,.3)}
.loom-card__notes-label{font-size:9px;color:var(--muted);text-transform:uppercase;font-weight:700;margin-bottom:4px;letter-spacing:.05em}
@media(max-width:768px){.loom-form{flex-direction:column}.loom-form input{width:100%!important;min-width:0!important}}

/* CALENDAR */
.cal-wrap{background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:20px;padding:28px;backdrop-filter:blur(10px);position:relative;overflow:hidden}
.cal-wrap::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#7c3aed,#06b6d4,transparent)}
.cal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
.cal-header h3{font-size:20px;font-weight:800;color:#fff}
.cal-nav{display:flex;gap:6px}
.cal-nav button{padding:8px 16px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;color:rgba(255,255,255,.4);cursor:pointer;font-size:12px;font-weight:600;transition:all .2s}
.cal-nav button:hover{border-color:rgba(124,58,237,.25);color:#7c3aed;background:rgba(124,58,237,.06)}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.cal-day-label{text-align:center;font-size:10px;font-weight:700;color:rgba(124,58,237,.5);padding:10px 0;text-transform:uppercase;letter-spacing:.1em}
.cal-day{text-align:center;padding:12px 4px;border-radius:12px;font-size:14px;font-weight:500;color:rgba(255,255,255,.25);cursor:pointer;transition:all .25s;min-height:48px;border:1px solid transparent;display:flex;align-items:center;justify-content:center;position:relative}
.cal-day:hover{background:rgba(124,58,237,.06);color:rgba(255,255,255,.7);border-color:rgba(124,58,237,.1)}
.cal-day.today{background:linear-gradient(135deg,rgba(124,58,237,.15),rgba(6,182,212,.1));color:#fff;font-weight:700;border-color:rgba(124,58,237,.25);box-shadow:0 0 20px rgba(124,58,237,.1)}
.cal-day.has-task{position:relative}
.cal-day.has-task::after{content:'';width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#06b6d4);position:absolute;bottom:5px;left:50%;transform:translateX(-50%);box-shadow:0 0 6px rgba(124,58,237,.4)}
.cal-day.selected{background:rgba(6,182,212,.1);border-color:rgba(6,182,212,.2);color:#06b6d4}
.cal-detail{margin-top:24px;background:rgba(255,255,255,.015);border:1px solid var(--border);border-radius:14px;padding:20px}
.cal-detail__header{font-size:15px;font-weight:700;color:#fff;margin-bottom:14px;display:flex;align-items:center;gap:8px}
.cal-detail__header svg{width:16px;height:16px;stroke:#06b6d4;stroke-width:2;fill:none}
.cal-tasks{display:flex;flex-direction:column;gap:8px}
.cal-task{padding:12px 16px;background:rgba(124,58,237,.04);border:1px solid rgba(124,58,237,.08);border-radius:10px;font-size:13px;color:rgba(255,255,255,.6);display:flex;align-items:center;gap:10px}
.cal-task::before{content:'';width:8px;height:8px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#06b6d4);flex-shrink:0}
.cal-task__text{flex:1}
.cal-task__edit{background:none;border:none;color:var(--cyan);cursor:pointer;font-size:13px;padding:2px 6px;opacity:.4;transition:opacity .2s}
.cal-task__edit:hover{opacity:1}
.cal-task__del{background:none;border:none;color:var(--red);cursor:pointer;font-size:15px;padding:2px 6px;opacity:.4;transition:opacity .2s}
.cal-task__del:hover{opacity:1}
.cal-task-editing{display:flex;gap:8px;align-items:center;flex:1}
.cal-task-editing input{flex:1;padding:6px 10px;background:rgba(255,255,255,.05);border:1px solid rgba(124,58,237,.3);border-radius:8px;color:var(--text);font-size:13px;outline:none}
.cal-task-editing button{padding:4px 12px;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer}
.cal-task-editing .btn-save{background:var(--green);color:#fff}
.cal-task-editing .btn-cancel{background:rgba(255,255,255,.08);color:var(--muted)}
.cal-task-form{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
.cal-task-form input{flex:1;min-width:150px;padding:10px 14px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;color:rgba(255,255,255,.8);font-size:13px;outline:none;transition:border-color .2s}
.cal-task-form input:focus{border-color:rgba(124,58,237,.3)}
.cal-task-form button{padding:10px 20px;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:var(--white);border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
.cal-task-form button:hover{box-shadow:0 0 20px rgba(124,58,237,.2)}

/* NOTES */
.notes-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.note-card{background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:14px;padding:18px;cursor:pointer;transition:all .3s;position:relative;backdrop-filter:blur(10px)}
.note-card:hover{border-color:rgba(244,114,182,.2);box-shadow:0 4px 20px rgba(244,114,182,.06)}
.note-card.editing{border-color:#f472b6}
.note-card__title{font-size:14px;font-weight:700;color:var(--white);margin-bottom:6px;outline:none}
.note-card__body{font-size:12px;color:var(--text);line-height:1.6;outline:none;min-height:60px;white-space:pre-wrap}
.note-card__footer{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid var(--border)}
.note-card__date{font-size:10px;color:var(--muted)}
.note-card__color{display:flex;gap:4px}
.note-dot{width:14px;height:14px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:border-color .15s}
.note-dot:hover,.note-dot.active{border-color:var(--white)}
.note-card__del{background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px;padding:2px 6px;border-radius:4px}
.note-card__del:hover{color:var(--red);background:rgba(239,68,68,0.1)}
.note-add{background:rgba(255,255,255,.01);border:2px dashed rgba(124,58,237,.15);border-radius:14px;padding:32px;text-align:center;cursor:pointer;transition:all .3s;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:160px}
.note-add:hover{border-color:rgba(124,58,237,.3);background:rgba(124,58,237,.04)}
.note-add__icon{font-size:28px;color:var(--muted);margin-bottom:6px}
.note-add__text{font-size:13px;color:var(--muted);font-weight:600}

/* NOTE FULLSCREEN MODAL */
.note-modal{display:none;position:fixed;inset:0;z-index:1000;background:rgba(3,0,20,.85);backdrop-filter:blur(20px);padding:40px;align-items:center;justify-content:center}
.note-modal.open{display:flex}
.note-modal__inner{width:100%;max-width:800px;max-height:90vh;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:32px;position:relative;overflow:hidden;display:flex;flex-direction:column}
.note-modal__inner::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#7c3aed,#06b6d4,transparent)}
.note-modal__close{position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);color:rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;transition:all .2s;z-index:1}
.note-modal__close:hover{background:rgba(239,68,68,.1);color:#ef4444;border-color:rgba(239,68,68,.15)}
.note-modal__title{font-size:22px;font-weight:800;color:#fff;outline:none;border:none;background:none;width:100%;margin-bottom:12px;font-family:'Inter',sans-serif;padding-right:40px}
.note-modal__body{flex:1;font-size:15px;color:rgba(255,255,255,.7);outline:none;border:none;background:none;width:100%;resize:none;line-height:1.8;font-family:'Inter',sans-serif;overflow-y:auto;min-height:300px}
.note-card__expand{position:absolute;top:10px;right:10px;width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);color:rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;transition:all .2s;opacity:0}
.note-card:hover .note-card__expand{opacity:1}
.note-card__expand:hover{background:rgba(124,58,237,.1);color:#7c3aed;border-color:rgba(124,58,237,.15)}

/* WA MSG ACCORDION */
.wa-accordion{margin-top:14px;background:rgba(37,211,102,.03);border:1px solid rgba(37,211,102,.08);border-radius:12px;border-left:3px solid #25d366;overflow:hidden}
.wa-accordion__header{padding:12px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center}
.wa-accordion__header span{font-size:11px;font-weight:700;color:#25d366;text-transform:uppercase;letter-spacing:.05em}
.wa-accordion__arrow{color:#25d366;font-size:12px;transition:transform .3s}
.wa-accordion.open .wa-accordion__arrow{transform:rotate(180deg)}
.wa-accordion__body{max-height:0;overflow:hidden;transition:max-height .4s ease}
.wa-accordion.open .wa-accordion__body{max-height:800px}
.wa-accordion__body-inner{padding:0 16px 14px}

/* LEAD OVERVIEW */
.lead-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
@media(max-width:768px){.lead-cards{grid-template-columns:1fr}}
.lead-card{background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:16px;padding:20px;position:relative;overflow:hidden;backdrop-filter:blur(10px);transition:all .3s}
.lead-card:hover{border-color:rgba(124,58,237,.15);box-shadow:0 4px 24px rgba(124,58,237,.06)}
.lead-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.lead-card--seg::before{background:#6366f1}
.lead-card--nails::before{background:#e91e8c}
.lead-card--lash::before{background:#c9a96e}
.lead-card__header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.lead-card__name{font-size:14px;font-weight:700;color:var(--white)}
.lead-card__status{font-size:10px;padding:3px 10px;border-radius:10px;font-weight:600}
.lead-card__status--ok{background:rgba(34,197,94,0.12);color:var(--green)}
.lead-card__status--err{background:rgba(239,68,68,0.12);color:var(--red)}
.lead-card__stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.lead-stat{text-align:center;padding:10px 8px;background:var(--bg);border-radius:8px}
.lead-stat__num{font-size:22px;font-weight:800;color:var(--white)}
.lead-stat__num--new{color:var(--red)}
.lead-stat__num--today{color:var(--yellow)}
.lead-stat__label{font-size:9px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-top:2px}
.lead-card__methods{display:flex;gap:8px;margin-top:12px}
.lead-method{flex:1;padding:8px;background:var(--bg);border-radius:8px;text-align:center}
.lead-method__num{font-size:16px;font-weight:700;color:var(--text)}
.lead-method__label{font-size:9px;color:var(--muted);text-transform:uppercase}
.lead-card__ads{margin-top:12px;display:flex;align-items:center;gap:8px}
.lead-card__ads input{flex:1;padding:7px 10px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;outline:none;transition:border-color .2s}
.lead-card__ads input:focus{border-color:rgba(124,58,237,.3)}
.lead-card__ads .ads-label{font-size:10px;color:var(--muted);white-space:nowrap}
.lead-cpl{margin-top:8px;display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(124,58,237,.08);border-radius:8px}
.lead-cpl__label{font-size:10px;color:var(--muted);text-transform:uppercase}
.lead-cpl__val{font-size:18px;font-weight:800;color:var(--cyan)}
.lead-total-bar .lead-total--cpl .lead-total__num{color:var(--cyan)}
.lead-card__links{display:flex;gap:6px;margin-top:12px}
.lead-refresh{display:flex;align-items:center;justify-content:center;gap:8px;padding:8px;background:rgba(124,58,237,.06);border:1px solid rgba(124,58,237,.1);border-radius:12px;color:#7c3aed;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;margin-bottom:12px}
.lead-refresh:hover{background:rgba(124,58,237,.12);box-shadow:0 0 20px rgba(124,58,237,.1)}
.lead-refresh.loading{opacity:.5;pointer-events:none}
.lead-total-bar{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:10px}
.lead-total-bar--status{grid-template-columns:repeat(5,1fr)}
.lead-total{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:4px;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:12px;padding:12px 14px;text-align:left;backdrop-filter:blur(10px);overflow:hidden;transition:transform .15s,border-color .15s}
.lead-total::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:currentColor;opacity:.6}
.lead-total:hover{transform:translateY(-1px);border-color:rgba(124,58,237,.25)}
.lead-total__num{font-size:24px;font-weight:800;line-height:1.1;letter-spacing:-.5px}
.lead-total__label{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--muted);text-transform:uppercase;font-weight:700;letter-spacing:.4px}
.lt-pct{display:inline-block;padding:1px 6px;background:rgba(255,255,255,.06);border-radius:6px;font-size:9px;font-weight:700;color:var(--muted);opacity:.95}
html.light .lt-pct{background:rgba(0,0,0,.05)}
@media(max-width:1200px){.lead-total-bar,.lead-total-bar--status{grid-template-columns:repeat(3,1fr)}}
.lead-card__conversions{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:8px}
.conv-box{padding:8px 6px;border-radius:10px;text-align:center;border:1px solid transparent}
.conv-box--ok{background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.2)}
.conv-box--ko{background:rgba(239,68,68,.08);border-color:rgba(239,68,68,.2)}
.conv-box--wait{background:rgba(245,158,11,.08);border-color:rgba(245,158,11,.2)}
.conv-box--mute{background:rgba(107,114,128,.08);border-color:rgba(107,114,128,.2)}
.conv-box__num{font-size:18px;font-weight:800}
.conv-box--ok .conv-box__num{color:#22c55e}
.conv-box--ko .conv-box__num{color:#ef4444}
.conv-box--wait .conv-box__num{color:#f59e0b}
.conv-box--mute .conv-box__num{color:#6b7280}
.conv-box__pct{font-size:10px;font-weight:700;opacity:.8;margin-top:1px}
.conv-box__label{font-size:9px;color:var(--muted);text-transform:uppercase;font-weight:700;margin-top:2px}
.lead-last-update{font-size:11px;color:var(--muted);margin-bottom:12px}

/* MOBILE BOTTOM BAR */
.mob-bar{display:none;position:fixed;bottom:0;left:0;right:0;z-index:50;background:rgba(8,4,24,.95);border-top:1px solid var(--border);backdrop-filter:blur(20px);padding:6px 0;padding-bottom:calc(6px + env(safe-area-inset-bottom))}
.mob-bar,.mob-more{-webkit-tap-highlight-color:transparent}
.mob-tab{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 0;cursor:pointer;color:var(--muted);transition:color .2s;flex:1}
.mob-tab svg{width:20px;height:20px}
.mob-tab span{font-size:9px;font-weight:600}
.mob-tab.active{color:var(--primary)}
.mob-more{display:none;position:fixed;bottom:56px;bottom:calc(56px + env(safe-area-inset-bottom));left:8px;right:8px;z-index:999;background:rgba(10,6,30,.98);border:1px solid rgba(124,58,237,.2);border-radius:14px;backdrop-filter:blur(20px);padding:10px;box-shadow:0 -8px 40px rgba(0,0,0,.7)}
.mob-more.open{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
.mob-more__item{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;border-radius:10px;color:var(--text);font-size:11px;font-weight:600;cursor:pointer;transition:background .15s}
.mob-more__item:active{background:rgba(124,58,237,.12)}
.mob-more__item svg{width:22px;height:22px;color:var(--muted)}
.mob-overlay{display:none;position:fixed;inset:0;z-index:998;background:rgba(0,0,0,.5)}
.mob-overlay.open{display:block}

@media(max-width:768px){
  .sidebar{display:none!important;width:0!important;min-width:0!important;overflow:hidden!important;position:absolute!important}
  body{display:block!important}
  .main{margin-left:0!important;padding:10px!important;padding-bottom:calc(80px + env(safe-area-inset-bottom))!important;width:100%!important;max-width:100vw!important;overflow-x:hidden!important}
  .mob-bar{display:flex}
  .page-title{font-size:18px}
  .page-sub{font-size:12px}
  .proj{padding:14px}
  .lead-cards{grid-template-columns:1fr!important}
  .lead-total-bar{grid-template-columns:repeat(2,1fr)!important;gap:8px!important}
  .lead-total__num{font-size:20px!important}
  .bil-bar{gap:6px;flex-wrap:wrap}
  .bil-bar .bil-label{font-size:14px;min-width:auto}
  .bil-add-col{margin-left:0;flex-wrap:wrap;width:100%}
  .bil-add-col input{flex:1;min-width:80px}
  .bil-wrap{-webkit-overflow-scrolling:touch}
  .bil-t th,.bil-t td{padding:6px 8px;font-size:11px;min-width:46px}
  .bil-t td:first-child,.bil-t th:first-child{min-width:36px;padding-left:8px}
  .tools-form{flex-direction:column}
  .tools-form input,.tools-form select{width:100%!important;min-width:0!important}
  .tools-summary{grid-template-columns:repeat(2,1fr)}
  .todo-form{flex-direction:column}
  .todo-form input,.todo-form select,.todo-form button{width:100%}
  .cal-nav{flex-wrap:wrap}
  .notes-grid{grid-template-columns:1fr!important}
  .bil-cell-pop{left:8px!important;right:8px;width:auto!important;min-width:0!important}
  #cursor-glow,.grid-overlay{display:none}
}
/* DOC PAGES (SOP / Script Vendita) */
.doc-back{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border:1px solid var(--border);color:var(--text);padding:8px 14px;border-radius:10px;font-size:12px;cursor:pointer;text-decoration:none;font-family:inherit;transition:all .2s}
.doc-back:hover{background:rgba(124,58,237,.08);border-color:rgba(124,58,237,.3);color:var(--accent)}
.doc-banner{background:linear-gradient(135deg,rgba(124,58,237,.08),rgba(6,182,212,.08));border:1px solid rgba(124,58,237,.2);border-radius:12px;padding:14px 18px;font-size:13px;color:var(--text);margin:14px 0 22px;line-height:1.6}
.doc-banner strong{color:var(--accent);font-weight:700}
.doc-toc{background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:12px;padding:16px 22px;margin-bottom:30px}
.doc-toc strong{display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px}
.doc-toc ol{margin:0;padding-left:20px;color:var(--text);font-size:13px;line-height:1.9}
.doc-toc a{color:var(--text);text-decoration:none;transition:color .15s}
.doc-toc a:hover{color:var(--accent)}
.doc-h2{font-size:18px;font-weight:700;color:var(--white);margin:28px 0 8px;padding-bottom:8px;border-bottom:1px solid var(--border);scroll-margin-top:20px}
.doc-h2 .doc-emoji{font-size:18px;margin-right:6px}
.doc-h3{font-size:14px;font-weight:700;color:var(--white);margin:18px 0 6px}
.doc-h4{font-size:13px;font-weight:600;color:var(--text);margin:12px 0 4px;text-transform:uppercase;letter-spacing:.04em}
.doc-page p{font-size:13px;color:var(--text);line-height:1.7;margin:6px 0 10px}
.doc-page ul,.doc-page ol{font-size:13px;color:var(--text);line-height:1.7;padding-left:22px;margin:6px 0 12px}
.doc-page li{margin-bottom:4px}
.doc-page strong{color:var(--white);font-weight:700}
.doc-page em{color:var(--muted);font-style:normal;background:rgba(255,255,255,.04);padding:1px 6px;border-radius:4px;font-size:12px}
.doc-page code{background:rgba(124,58,237,.1);color:var(--accent);padding:2px 6px;border-radius:4px;font-size:12px;font-family:ui-monospace,Menlo,monospace}
.doc-table{width:100%;border-collapse:collapse;font-size:12px;margin:8px 0 16px;background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:10px;overflow:hidden}
.doc-table th{background:rgba(124,58,237,.08);color:var(--white);text-align:left;padding:10px 12px;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--border)}
.doc-table td{padding:10px 12px;color:var(--text);border-bottom:1px solid var(--border);vertical-align:top}
.doc-table tr:last-child td{border-bottom:0}
.doc-quote{background:rgba(34,197,94,.06);border-left:3px solid #22c55e;padding:10px 16px;margin:10px 0;border-radius:6px;font-size:13px;color:var(--text);line-height:1.6;font-style:italic}
.doc-quote.doc-quote--alert{background:rgba(239,68,68,.06);border-left-color:#ef4444}
.doc-quote.doc-quote--key{background:rgba(124,58,237,.08);border-left-color:#7c3aed;font-style:normal;font-weight:600}
.doc-script{background:rgba(255,255,255,.02);border:1px solid var(--border);border-radius:10px;padding:14px 18px;margin:8px 0 14px}
.doc-script .doc-script__label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:700;margin-bottom:6px;display:block}
.doc-script .doc-script__text{font-size:13px;color:var(--text);line-height:1.7;font-style:italic}
.doc-page hr{border:0;border-top:1px solid var(--border);margin:28px 0}
.doc-badge{display:inline-block;padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700;background:rgba(124,58,237,.15);color:#7c3aed;margin-left:8px}
</style>
</head>
<body>

<div id="cursor-glow"></div>
<div class="grid-overlay"></div>
<div class="sidebar">
  <div class="sidebar__logo"><svg viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" stroke="#7c3aed" stroke-width="1.5"/><circle cx="14" cy="14" r="6" stroke="#06b6d4" stroke-width="1.5"/><circle cx="14" cy="14" r="2" fill="#06b6d4"/></svg>Workspace</div>
  <div class="sidebar__nav">
    <div class="nav-section">Dashboard</div>
    <div class="nav-item active" onclick="showPage('leads',this)"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> Lead Overview <span class="badge" id="badge-total-leads" style="background:var(--red)">...</span></div>
    <div class="nav-section">Progetti</div>
    <div class="nav-item" onclick="showPage('live',this)"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> Progetti Live <span class="badge">8</span></div>
    <div class="nav-section">Strumenti</div>
    <div class="nav-item" onclick="showPage('competitors',this)"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/></svg> Analisi Competitor</div>
    <div class="nav-item" onclick="showPage('todo',this)"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> To-Do List</div>
    <div class="nav-item" onclick="showPage('calendar',this)"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg> Calendario</div>
    <div class="nav-item" onclick="showPage('tools',this)"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> Tool</div>
    <div class="nav-item" onclick="showPage('bilancio',this)"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 9h20"/><path d="M2 15h20"/><path d="M9 3v18"/><path d="M15 3v18"/></svg> Bilancio</div>
    <div class="nav-item" onclick="showPage('simcod',this)"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="12" y1="10" x2="14" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="12" y1="14" x2="14" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="12" y1="18" x2="14" y2="18"/><line x1="16" y1="18" x2="16" y2="18"/></svg> Simulatore COD</div>
    <div class="nav-item" onclick="showPage('loom',this)"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> Loom</div>
    <div class="nav-item" onclick="showPage('notes',this)"><svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="#f472b6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Note</div>
    <div style="padding:12px 14px;margin-top:auto;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:8px">
      <div onclick="toggleTheme()" style="padding:8px 14px;background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:10px;font-size:11px;font-weight:600;cursor:pointer;text-align:center;display:flex;align-items:center;justify-content:center;gap:6px;color:var(--text)" id="theme-toggle">
        <span id="theme-icon">☀️</span> <span id="theme-label">Tema Chiaro</span>
      </div>
      <div onclick="exportData()" style="padding:8px 14px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.15);border-radius:10px;color:#7c3aed;font-size:11px;font-weight:600;cursor:pointer;text-align:center">Esporta Dati</div>
    </div>
  </div>
</div>

<!-- MOBILE BOTTOM BAR -->
<div class="mob-bar" id="mob-bar">
  <div class="mob-tab active" onclick="showPage('leads',this)" data-page="leads">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    <span>Lead</span>
  </div>
  <div class="mob-tab" onclick="showPage('live',this)" data-page="live">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    <span>Progetti</span>
  </div>
  <div class="mob-tab" onclick="showPage('todo',this)" data-page="todo">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
    <span>To-Do</span>
  </div>
  <div class="mob-tab" onclick="showPage('bilancio',this)" data-page="bilancio">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 9h20"/><path d="M2 15h20"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
    <span>Bilancio</span>
  </div>
  <div class="mob-tab" onclick="toggleMobMore()" id="mob-more-btn">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
    <span>Altro</span>
  </div>
</div>

<!-- MOBILE OVERLAY & MORE MENU -->
<div class="mob-overlay" id="mob-overlay" onclick="closeMobMore()"></div>
<div class="mob-more" id="mob-more">
  <div class="mob-more__item" onclick="showPage('competitors',this)">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
    Competitor
  </div>
  <div class="mob-more__item" onclick="showPage('calendar',this)">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
    Calendario
  </div>
  <div class="mob-more__item" onclick="showPage('loom',this)">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
    Loom
  </div>
  <div class="mob-more__item" onclick="showPage('tools',this)">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
    Tool
  </div>
  <div class="mob-more__item" onclick="showPage('notes',this)">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
    Note
  </div>
  <div class="mob-more__item" onclick="showPage('simcod',this)">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="12" y1="10" x2="14" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="12" y1="14" x2="14" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="12" y1="18" x2="14" y2="18"/></svg>
    Simulatore COD
  </div>
</div>

<div class="main">

<!-- ==================== LEAD OVERVIEW ==================== -->
<div class="page active" id="page-leads">
  <div class="page-title">Lead Overview</div>
  <p class="page-sub">Panoramica in tempo reale dei lead ricevuti su tutti i progetti</p>

  <div class="lead-refresh" onclick="fetchAllLeads()">Aggiorna dati</div>
  <div class="lead-last-update" id="lead-last-update"></div>

  <div class="lead-total-bar">
    <div class="lead-total" style="color:#a78bfa"><div class="lead-total__num" id="lt-total">—</div><div class="lead-total__label">Lead Totali</div></div>
    <div class="lead-total" style="color:#ef4444"><div class="lead-total__num" id="lt-nuovi">—</div><div class="lead-total__label">Da Contattare</div></div>
    <div class="lead-total" style="color:#eab308"><div class="lead-total__num" id="lt-oggi">—</div><div class="lead-total__label">Oggi</div></div>
    <div class="lead-total" style="color:#7c3aed"><div class="lead-total__num" id="lt-cod">—</div><div class="lead-total__label">Contrassegno</div></div>
    <div class="lead-total" style="color:#f59e0b"><div class="lead-total__num" id="lt-spesa">€0</div><div class="lead-total__label">Spesa ADS</div></div>
    <div class="lead-total" style="color:#06b6d4"><div class="lead-total__num" id="lt-cpl">—</div><div class="lead-total__label">CPL Medio</div></div>
  </div>

  <div class="lead-total-bar lead-total-bar--status">
    <div class="lead-total" style="color:#22c55e"><div class="lead-total__num" id="lt-confermati">—</div><div class="lead-total__label">Confermati <span id="lt-confermati-pct" class="lt-pct">—</span></div></div>
    <div class="lead-total" style="color:#ef4444"><div class="lead-total__num" id="lt-annullati">—</div><div class="lead-total__label">Annullati <span id="lt-annullati-pct" class="lt-pct">—</span></div></div>
    <div class="lead-total" style="color:#f59e0b"><div class="lead-total__num" id="lt-ricontattare">—</div><div class="lead-total__label">Da Richiamare <span id="lt-ricontattare-pct" class="lt-pct">—</span></div></div>
    <div class="lead-total" style="color:#6b7280"><div class="lead-total__num" id="lt-non-risponde">—</div><div class="lead-total__label">Non Risponde <span id="lt-non-risponde-pct" class="lt-pct">—</span></div></div>
    <div class="lead-total" style="color:#3b82f6"><div class="lead-total__num" id="lt-contattato">—</div><div class="lead-total__label">Contattati <span id="lt-contattato-pct" class="lt-pct">—</span></div></div>
  </div>

  <div class="lead-cards">
    <div class="lead-card lead-card--seg">
      <div class="lead-card__header"><div class="lead-card__name">Funnel Segretarie</div><div class="lead-card__status" id="status-seg">...</div></div>
      <div class="lead-card__stats">
        <div class="lead-stat"><div class="lead-stat__num" id="seg-totali">—</div><div class="lead-stat__label">Totali</div></div>
        <div class="lead-stat"><div class="lead-stat__num lead-stat__num--new" id="seg-nuovi">—</div><div class="lead-stat__label">Nuovi</div></div>
        <div class="lead-stat"><div class="lead-stat__num lead-stat__num--today" id="seg-oggi">—</div><div class="lead-stat__label">Oggi</div></div>
      </div>
      <div class="lead-card__methods">
        <div class="lead-method"><div class="lead-method__num" id="seg-bon">—</div><div class="lead-method__label">Bonifico</div></div>
        <div class="lead-method"><div class="lead-method__num" id="seg-cod">—</div><div class="lead-method__label">Contrassegno</div></div>
      </div>
      <div class="lead-card__conversions">
        <div class="conv-box conv-box--ok"><div class="conv-box__num" id="seg-confermati">—</div><div class="conv-box__pct" id="seg-confermati-pct">—</div><div class="conv-box__label">Confermati</div></div>
        <div class="conv-box conv-box--ko"><div class="conv-box__num" id="seg-annullati">—</div><div class="conv-box__pct" id="seg-annullati-pct">—</div><div class="conv-box__label">Annullati</div></div>
        <div class="conv-box conv-box--wait"><div class="conv-box__num" id="seg-ricontattare">—</div><div class="conv-box__pct" id="seg-ricontattare-pct">—</div><div class="conv-box__label">Da Richiamare</div></div>
        <div class="conv-box conv-box--mute"><div class="conv-box__num" id="seg-nonrisponde">—</div><div class="conv-box__pct" id="seg-nonrisponde-pct">—</div><div class="conv-box__label">Non Risponde</div></div>
      </div>
      <div class="lead-card__ads"><span class="ads-label">Spesa ADS €</span><input type="number" id="ads-seg" placeholder="0.00" step="0.01" min="0" oninput="updateCPL()"></div>
      <div class="lead-cpl"><span class="lead-cpl__label">CPL</span><span class="lead-cpl__val" id="cpl-seg">—</span></div>
      <div class="lead-card__links"><a href="https://aliceblue-dragonfly-326952.hostingersite.com/admin.php" target="_blank" class="btn-link btn-admin" style="flex:1;text-align:center;padding:8px">Apri Admin</a></div>
    </div>

    <div class="lead-card lead-card--nails">
      <div class="lead-card__header"><div class="lead-card__name">Corso Unghie</div><div class="lead-card__status" id="status-nails">...</div></div>
      <div class="lead-card__stats">
        <div class="lead-stat"><div class="lead-stat__num" id="nails-totali">—</div><div class="lead-stat__label">Totali</div></div>
        <div class="lead-stat"><div class="lead-stat__num lead-stat__num--new" id="nails-nuovi">—</div><div class="lead-stat__label">Nuovi</div></div>
        <div class="lead-stat"><div class="lead-stat__num lead-stat__num--today" id="nails-oggi">—</div><div class="lead-stat__label">Oggi</div></div>
      </div>
      <div class="lead-card__methods">
        <div class="lead-method"><div class="lead-method__num" id="nails-bon">—</div><div class="lead-method__label">Bonifico</div></div>
        <div class="lead-method"><div class="lead-method__num" id="nails-cod">—</div><div class="lead-method__label">Contrassegno</div></div>
      </div>
      <div class="lead-card__conversions">
        <div class="conv-box conv-box--ok"><div class="conv-box__num" id="nails-confermati">—</div><div class="conv-box__pct" id="nails-confermati-pct">—</div><div class="conv-box__label">Confermati</div></div>
        <div class="conv-box conv-box--ko"><div class="conv-box__num" id="nails-annullati">—</div><div class="conv-box__pct" id="nails-annullati-pct">—</div><div class="conv-box__label">Annullati</div></div>
        <div class="conv-box conv-box--wait"><div class="conv-box__num" id="nails-ricontattare">—</div><div class="conv-box__pct" id="nails-ricontattare-pct">—</div><div class="conv-box__label">Da Richiamare</div></div>
        <div class="conv-box conv-box--mute"><div class="conv-box__num" id="nails-nonrisponde">—</div><div class="conv-box__pct" id="nails-nonrisponde-pct">—</div><div class="conv-box__label">Non Risponde</div></div>
      </div>
      <div class="lead-card__ads"><span class="ads-label">Spesa ADS €</span><input type="number" id="ads-nails" placeholder="0.00" step="0.01" min="0" oninput="updateCPL()"></div>
      <div class="lead-cpl"><span class="lead-cpl__label">CPL</span><span class="lead-cpl__val" id="cpl-nails">—</span></div>
      <div class="lead-card__links"><a href="https://mediumturquoise-mule-624710.hostingersite.com/admin.php" target="_blank" class="btn-link btn-admin" style="flex:1;text-align:center;padding:8px">Apri Admin</a></div>
    </div>

    <div class="lead-card lead-card--lash">
      <div class="lead-card__header"><div class="lead-card__name">Lash Art Academy</div><div class="lead-card__status" id="status-lash">...</div></div>
      <div class="lead-card__stats">
        <div class="lead-stat"><div class="lead-stat__num" id="lash-totali">—</div><div class="lead-stat__label">Totali</div></div>
        <div class="lead-stat"><div class="lead-stat__num lead-stat__num--new" id="lash-nuovi">—</div><div class="lead-stat__label">Nuovi</div></div>
        <div class="lead-stat"><div class="lead-stat__num lead-stat__num--today" id="lash-oggi">—</div><div class="lead-stat__label">Oggi</div></div>
      </div>
      <div class="lead-card__methods">
        <div class="lead-method"><div class="lead-method__num" id="lash-bon">—</div><div class="lead-method__label">Bonifico</div></div>
        <div class="lead-method"><div class="lead-method__num" id="lash-cod">—</div><div class="lead-method__label">Contrassegno</div></div>
      </div>
      <div class="lead-card__conversions">
        <div class="conv-box conv-box--ok"><div class="conv-box__num" id="lash-confermati">—</div><div class="conv-box__pct" id="lash-confermati-pct">—</div><div class="conv-box__label">Confermati</div></div>
        <div class="conv-box conv-box--ko"><div class="conv-box__num" id="lash-annullati">—</div><div class="conv-box__pct" id="lash-annullati-pct">—</div><div class="conv-box__label">Annullati</div></div>
        <div class="conv-box conv-box--wait"><div class="conv-box__num" id="lash-ricontattare">—</div><div class="conv-box__pct" id="lash-ricontattare-pct">—</div><div class="conv-box__label">Da Richiamare</div></div>
        <div class="conv-box conv-box--mute"><div class="conv-box__num" id="lash-nonrisponde">—</div><div class="conv-box__pct" id="lash-nonrisponde-pct">—</div><div class="conv-box__label">Non Risponde</div></div>
      </div>
      <div class="lead-card__ads"><span class="ads-label">Spesa ADS €</span><input type="number" id="ads-lash" placeholder="0.00" step="0.01" min="0" oninput="updateCPL()"></div>
      <div class="lead-cpl"><span class="lead-cpl__label">CPL</span><span class="lead-cpl__val" id="cpl-lash">—</span></div>
      <div class="lead-card__links"><a href="https://darkred-koala-809285.hostingersite.com/admin.php" target="_blank" class="btn-link btn-admin" style="flex:1;text-align:center;padding:8px">Apri Admin</a></div>
    </div>
  </div>
</div>

<!-- ==================== PROGETTI LIVE ==================== -->
<div class="page" id="page-live">
  <div class="page-title">Progetti Live</div>
  <p class="page-sub">I tuoi funnel e servizi pubblicati su Hostinger</p>
  <div class="projects">

    <div class="proj">
      <div class="proj__top"><div class="proj__name">Funnel Segretarie</div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><label class="panel-toggle" title="Mostra/nascondi nel pannello switcher degli admin"><input type="checkbox" data-admin-host="aliceblue-dragonfly-326952.hostingersite.com" onchange="togglePanelHost(this)"><span class="panel-toggle__switch"></span><span>Pannello</span></label><span class="tag tag-live">LIVE</span></div></div>
      <div class="proj__domain">aliceblue-dragonfly-326952.hostingersite.com</div>
      <div class="proj__desc">Corso Segretaria Professionale + Inserimento Lavorativo. Form candidatura, bonifico/contrassegno, pixel Facebook, WhatsApp.</div>
      <div class="proj__links">
        <a href="https://aliceblue-dragonfly-326952.hostingersite.com" target="_blank" class="btn-link btn-site">Sito</a>
        <a href="https://aliceblue-dragonfly-326952.hostingersite.com/admin.php" target="_blank" class="btn-link btn-admin">Admin</a>
        <a href="https://aliceblue-dragonfly-326952.hostingersite.com/corsi/admin-corsi.php" target="_blank" class="btn-link btn-admin" style="background:rgba(34,197,94,.08);color:#22c55e;border-color:rgba(34,197,94,.15)">Admin Corsi</a>
        <a href="https://aliceblue-dragonfly-326952.hostingersite.com/corsi/" target="_blank" class="btn-link btn-local" style="background:rgba(6,182,212,.08);color:#06b6d4;border-color:rgba(6,182,212,.15)">Portale Studenti</a>
      </div>
      <div class="creds">
        <div class="cred"><span class="cred-label">Password</span><span class="cred-val">Segretarie2026!</span></div>
        <div class="cred"><span class="cred-label">WhatsApp</span><span class="cred-val">+39 334 382 8321</span></div>
        <div class="cred"><span class="cred-label">Pixel FB</span><span class="cred-val">1640258307311235</span></div>
      </div>
      <div class="proj__cmd">Locale: <code>~/funnel-segretarie</code></div>
      <div class="proj__drive" id="drive-seg"></div>
      <div class="proj__files" data-project="seg"></div>
      <div class="wa-accordion" onclick="this.classList.toggle('open')">
        <div class="wa-accordion__header"><span>Messaggio WhatsApp pronto da inviare</span><span class="wa-accordion__arrow">&#9660;</span></div>
        <div class="wa-accordion__body"><div class="wa-accordion__body-inner">
        <div style="font-size:12px;color:var(--text);line-height:1.6;white-space:pre-wrap;user-select:all" id="msg-segretarie">Ciao! Sono Alessandro, molto piacere.

Ti ringrazio per averci scritto.

Ti spiego in breve come funziona il nostro percorso.

Praticamente il corso e' composto da 4 moduli semplici da un'ora ciascuno: Excel, Google Calendar, Word e PowerPoint. Niente di complicato, tutto online e vai al tuo ritmo.

Una volta completato ricevi il certificato e da li noi ti mettiamo direttamente in contatto con le aziende che stanno cercando segretarie da inserire in smartworking.

Il lavoro e' da casa, 4 ore al giorno dal lunedi al venerdi, 1.500 euro al mese con contratto a tempo indeterminato, piu tredicesima e quattordicesima.

Il corso costa solo 89 euro invece di 297 ed e' un'offerta che abbiamo attiva per pochissimi posti, ti dico la verita ne restano davvero pochi.

Se ti interessa e vuoi saperne di piu, posso farti richiamare da una nostra consulente che ti spiega tutto nel dettaglio e risponde a qualsiasi dubbio.

Dimmi pure quando ti fa piu comodo, quale giorno e a che ora preferisci, e organizziamo la chiamata!</div>
        <button onclick="event.stopPropagation();copyMsg('msg-segretarie')" style="margin-top:8px;padding:6px 14px;background:#25d366;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font)">Copia messaggio</button>
        </div></div>
      </div>

      <div class="wa-accordion" onclick="this.classList.toggle('open')" style="border-left-color:#6366f1">
        <div class="wa-accordion__header"><span style="color:#6366f1">Script Call per i Setter</span><span class="wa-accordion__arrow" style="color:#6366f1">&#9660;</span></div>
        <div class="wa-accordion__body"><div class="wa-accordion__body-inner">
        <div style="font-size:12px;color:var(--text);line-height:1.8;white-space:pre-wrap;user-select:all" id="script-call-seg">APERTURA:
"Ciao [Nome], sono [Tuo Nome] del team Segretaria Professionale. Come stai? Ti chiamo perche hai lasciato i tuoi dati per avere informazioni sul nostro corso di Segretaria con inserimento lavorativo, ti ricordi?"

QUALIFICA:
"Perfetto! Dimmi, cosa ti ha spinto a interessarti a questa opportunita? Stai cercando lavoro in questo momento?"

PRESENTAZIONE:
"Bene, allora ti spiego brevemente. Il nostro percorso e' composto da 4 moduli online: Excel, Word, PowerPoint e Google Calendar. Ogni modulo dura circa un'ora, lo fai al tuo ritmo da casa.

Una volta completato ricevi il certificato e da li noi ti mettiamo in contatto diretto con le aziende che cercano segretarie in smartworking. Si parla di 4 ore al giorno, dal lunedi al venerdi, 1.500 euro al mese con contratto a tempo indeterminato."

PREZZO + URGENZA:
"Il corso ha un costo di soli 89 euro invece di 297. E' un'offerta limitata, restano pochissimi posti. Se decidi oggi possiamo bloccarti il posto subito."

CHIUSURA:
"Come preferisci pagare? Bonifico bancario o contrassegno alla consegna del materiale?"

OBIEZIONI:
- "Devo pensarci" → "Capisco, ma ti dico la verita, i posti si esauriscono velocemente. Se aspetti rischi di perdere l'offerta a 89 euro. Cosa ti frena esattamente?"
- "Costa troppo" → "Guarda, sono meno di 90 euro per un corso certificato PIU inserimento lavorativo con stipendio di 1.500 al mese. L'investimento lo recuperi gia il primo mese di lavoro."
- "Non sono sicura" → "E' normale avere dubbi. Ma pensa: tra un mese potresti gia lavorare da casa. Cosa hai da perdere per 89 euro?"</div>
        <button onclick="event.stopPropagation();copyMsg('script-call-seg')" style="margin-top:8px;padding:6px 14px;background:#6366f1;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font)">Copia script</button>
        </div></div>
      </div>

      <div class="wa-accordion" onclick="this.classList.toggle('open')" style="border-left-color:#f59e0b">
        <div class="wa-accordion__header"><span style="color:#f59e0b">Script / Indicazioni Messaggi WhatsApp</span><span class="wa-accordion__arrow" style="color:#f59e0b">&#9660;</span></div>
        <div class="wa-accordion__body"><div class="wa-accordion__body-inner">
        <div style="font-size:12px;color:var(--text);line-height:1.8;white-space:pre-wrap;user-select:all" id="script-wa-seg">REGOLE GENERALI:
- Rispondi ENTRO 5 minuti dal lead. Piu aspetti, piu il lead si raffredda
- Tono amichevole ma professionale, dai del TU
- Non mandare messaggi troppo lunghi, vai per step
- Se non risponde dopo 1 ora, manda un follow-up
- Se non risponde dopo 24h, manda ultimo messaggio

STEP 1 - PRIMO CONTATTO (entro 5 min):
"Ciao [Nome]! Sono [Tuo Nome], piacere. Ti scrivo perche hai lasciato i tuoi dati per il corso di Segretaria Professionale. Posso darti tutte le info, hai un minuto?"

STEP 2 - SE RISPONDE:
Manda il messaggio WhatsApp principale (vedi sopra nella tendina verde)

STEP 3 - FISSARE LA CALL:
"Perfetto! Per spiegarti tutto nel dettaglio posso farti richiamare dalla nostra consulente. Quando ti fa piu comodo? Mattina o pomeriggio?"

STEP 4 - FOLLOW-UP (se non risponde dopo 1h):
"Ciao [Nome], ti avevo scritto prima riguardo al corso di segretaria con inserimento lavorativo. Magari eri occupata! Quando hai un attimo dimmi pure, ti spiego tutto in 2 minuti"

STEP 5 - ULTIMO TENTATIVO (dopo 24h):
"Ciao [Nome], ultimo messaggio cosi non ti disturbo piu. Volevo solo dirti che i posti per il corso a 89 euro stanno finendo. Se ti interessa ancora fammi sapere, altrimenti nessun problema. Buona giornata!"

RISPOSTE RAPIDE:
- "Quanto costa?" → "Solo 89 euro invece di 297, offerta limitata. Vuoi che ti spiego cosa include?"
- "Come funziona il lavoro?" → "Smartworking da casa, 4 ore al giorno lun-ven, 1.500/mese con contratto indeterminato. Ti inserisci dopo il certificato"
- "E' una truffa?" → "Capisco il dubbio! Siamo un ente certificato, puoi verificare sul nostro sito. Abbiamo gia inserito decine di ragazze, posso mostrarti le testimonianze"</div>
        <button onclick="event.stopPropagation();copyMsg('script-wa-seg')" style="margin-top:8px;padding:6px 14px;background:#f59e0b;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font)">Copia script</button>
        </div></div>
      </div>
    </div>

    <div class="proj">
      <div class="proj__top"><div class="proj__name">Funnel Corso Unghie</div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><label class="panel-toggle" title="Mostra/nascondi nel pannello switcher degli admin"><input type="checkbox" data-admin-host="mediumturquoise-mule-624710.hostingersite.com" onchange="togglePanelHost(this)"><span class="panel-toggle__switch"></span><span>Pannello</span></label><span class="tag tag-live">LIVE</span></div></div>
      <div class="proj__domain">mediumturquoise-mule-624710.hostingersite.com</div>
      <div class="proj__desc">Corso Ricostruzione Unghie. Lezioni teoriche/pratiche accordion, certificato, form candidatura.</div>
      <div class="proj__links">
        <a href="https://mediumturquoise-mule-624710.hostingersite.com" target="_blank" class="btn-link btn-site">Sito</a>
        <a href="https://mediumturquoise-mule-624710.hostingersite.com/admin.php" target="_blank" class="btn-link btn-admin">Admin</a>
        <a href="https://mediumturquoise-mule-624710.hostingersite.com/corsi/admin-corsi.php" target="_blank" class="btn-link btn-admin" style="background:rgba(34,197,94,.08);color:#22c55e;border-color:rgba(34,197,94,.15)">Admin Corsi</a>
        <a href="https://mediumturquoise-mule-624710.hostingersite.com/corsi/" target="_blank" class="btn-link btn-local" style="background:rgba(6,182,212,.08);color:#06b6d4;border-color:rgba(6,182,212,.15)">Portale Studenti</a>
      </div>
      <div class="creds">
        <div class="cred"><span class="cred-label">Password</span><span class="cred-val">Nails2026!</span></div>
        <div class="cred"><span class="cred-label">WhatsApp</span><span class="cred-val">+39 334 382 8321</span></div>
        <div class="cred"><span class="cred-label">Pixel FB</span><span class="cred-val">1313613270661919</span></div>
      </div>
      <div class="proj__cmd">Locale: <code>~/funnel-nails</code></div>
      <div class="proj__drive" id="drive-nails"></div>
      <div class="proj__files" data-project="nails"></div>
      <div class="wa-accordion" onclick="this.classList.toggle('open')">
        <div class="wa-accordion__header"><span>Messaggio WhatsApp pronto da inviare</span><span class="wa-accordion__arrow">&#9660;</span></div>
        <div class="wa-accordion__body"><div class="wa-accordion__body-inner">
        <div style="font-size:12px;color:var(--text);line-height:1.6;white-space:pre-wrap;user-select:all" id="msg-nails">Ciao! Sono Marta, molto piacere.

Grazie per averci scritto riguardo al corso di ricostruzione unghie.

Ti spiego velocemente come funziona.

Il corso e' tutto online e copre tutto quello che serve per diventare una nail artist professionista: dalla teoria base come anatomia dell'unghia e igiene, fino alle tecniche pratiche come stesura del gel, french manicure, dual form moderna, refill e 5 tecniche di decorazione.

Vai al tuo ritmo, le lezioni sono in video e puoi rivederle quando vuoi. Alla fine ricevi l'attestato di partecipazione.

E la cosa bella e' che una volta ottenuto l'attestato, ti mettiamo in contatto con i centri estetici della tua zona che cercano nail artist formate. Quindi non solo impari, ma ti aiutiamo anche a trovare lavoro.

Il corso costa solo 50 euro invece di 149, ed e' un'offerta limitata che abbiamo attiva solo per pochi posti.

Se vuoi procedere o vuoi maggiori informazioni, posso farti richiamare da una nostra consulente che ti spiega tutto nel dettaglio.

Dimmi pure quando ti fa piu comodo e organizziamo!</div>
        <button onclick="event.stopPropagation();copyMsg('msg-nails')" style="margin-top:8px;padding:6px 14px;background:#25d366;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font)">Copia messaggio</button>
        </div></div>
      </div>

      <div class="wa-accordion" onclick="this.classList.toggle('open')" style="border-left-color:#6366f1">
        <div class="wa-accordion__header"><span style="color:#6366f1">Script Call per i Setter</span><span class="wa-accordion__arrow" style="color:#6366f1">&#9660;</span></div>
        <div class="wa-accordion__body"><div class="wa-accordion__body-inner">
        <div style="font-size:12px;color:var(--text);line-height:1.8;white-space:pre-wrap;user-select:all" id="script-call-nails">APERTURA:
"Ciao [Nome], sono [Tuo Nome] del team Corso Unghie Professionali. Come stai? Ti chiamo perche hai lasciato i tuoi dati per il corso di ricostruzione unghie, ti ricordi?"

QUALIFICA:
"Perfetto! Dimmi, hai gia esperienza nel settore nails oppure parti da zero? Cosa ti piacerebbe fare dopo il corso?"

PRESENTAZIONE:
"Benissimo. Il nostro corso e' completo: parti dalla teoria - anatomia dell'unghia, igiene, strumenti - e arrivi alle tecniche pratiche: stesura gel, french manicure, dual form moderna, refill e 5 tecniche di decorazione.

Tutto online, video lezioni che puoi rivedere quando vuoi. Alla fine ricevi l'attestato professionale.

E il bello e' che dopo l'attestato ti mettiamo in contatto con i centri estetici della tua zona che cercano nail artist formate."

PREZZO + URGENZA:
"Il corso ha un prezzo lancio di soli 50 euro invece di 149. Ma e' un'offerta super limitata, abbiamo pochissimi posti a questo prezzo."

CHIUSURA:
"Come preferisci pagare? Bonifico o contrassegno alla consegna?"

OBIEZIONI:
- "Devo pensarci" → "Capisco, ma a 50 euro e' un'occasione unica. Il prezzo pieno e' 149. Cosa ti trattiene?"
- "Ho paura di non essere capace" → "Il corso e' pensato anche per chi parte da zero. Le lezioni sono step by step, e puoi rivederle quante volte vuoi. Tante delle nostre studentesse non avevano mai toccato un'unghia!"
- "Non so se trovero lavoro" → "Noi ti aiutiamo proprio in questo. Abbiamo contatti con centri estetici in tutta Italia. E se vuoi, puoi anche lavorare in autonomia da casa come freelance."</div>
        <button onclick="event.stopPropagation();copyMsg('script-call-nails')" style="margin-top:8px;padding:6px 14px;background:#6366f1;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font)">Copia script</button>
        </div></div>
      </div>

      <div class="wa-accordion" onclick="this.classList.toggle('open')" style="border-left-color:#f59e0b">
        <div class="wa-accordion__header"><span style="color:#f59e0b">Script / Indicazioni Messaggi WhatsApp</span><span class="wa-accordion__arrow" style="color:#f59e0b">&#9660;</span></div>
        <div class="wa-accordion__body"><div class="wa-accordion__body-inner">
        <div style="font-size:12px;color:var(--text);line-height:1.8;white-space:pre-wrap;user-select:all" id="script-wa-nails">REGOLE GENERALI:
- Rispondi ENTRO 5 minuti dal lead
- Tono amichevole e appassionato, come un'amica che condivide una passione
- Usa emoji con moderazione (max 1-2 per messaggio)
- Se non risponde dopo 1h → follow-up. Dopo 24h → ultimo tentativo

STEP 1 - PRIMO CONTATTO (entro 5 min):
"Ciao [Nome]! Sono [Tuo Nome], piacere! Ti scrivo per il corso di ricostruzione unghie. Hai un attimo? Ti spiego tutto velocemente"

STEP 2 - SE RISPONDE:
Manda il messaggio WhatsApp principale (tendina verde sopra)

STEP 3 - FISSARE LA CALL:
"Se vuoi posso farti richiamare da una nostra consulente che ti spiega tutto nel dettaglio e risponde a qualsiasi domanda. Quando preferisci?"

STEP 4 - FOLLOW-UP (dopo 1h):
"Ciao [Nome], ti avevo scritto per il corso di unghie! Magari eri impegnata. Quando hai un attimo fammi sapere, ti racconto tutto in 2 minuti"

STEP 5 - ULTIMO TENTATIVO (dopo 24h):
"Ciao [Nome], ultimo messaggio! I posti per il corso a 50 euro stanno finendo. Se ti interessa ancora sono qui, altrimenti nessun problema. In bocca al lupo!"

RISPOSTE RAPIDE:
- "Quanto costa?" → "Solo 50 euro invece di 149! E' un'offerta lancio limitata. Include tutte le tecniche + attestato + aiuto per trovare lavoro"
- "Serve materiale?" → "Per le lezioni teoriche no, guardi solo i video. Per la pratica ti consigliamo un kit base che trovi su Amazon a circa 30 euro, ma non e' obbligatorio subito"
- "Posso lavorare da sola dopo?" → "Assolutamente si! Molte nostre studentesse lavorano come freelance da casa. Ti basta un tavolino e il kit base"</div>
        <button onclick="event.stopPropagation();copyMsg('script-wa-nails')" style="margin-top:8px;padding:6px 14px;background:#f59e0b;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font)">Copia script</button>
        </div></div>
      </div>
    </div>

    <div class="proj">
      <div class="proj__top"><div class="proj__name">Lash Art Academy</div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><label class="panel-toggle" title="Mostra/nascondi nel pannello switcher degli admin"><input type="checkbox" data-admin-host="darkred-koala-809285.hostingersite.com" onchange="togglePanelHost(this)"><span class="panel-toggle__switch"></span><span>Pannello</span></label><span class="tag tag-live">LIVE</span></div></div>
      <div class="proj__domain">darkred-koala-809285.hostingersite.com</div>
      <div class="proj__desc">Corso Extension Ciglia — 4 tecniche. VSL Vimeo, timer 48h, scarcity 3/15 posti, 4 certificati, design luxury nero/oro.</div>
      <div class="proj__links">
        <a href="https://darkred-koala-809285.hostingersite.com" target="_blank" class="btn-link btn-site">Sito</a>
        <a href="https://darkred-koala-809285.hostingersite.com/admin.php" target="_blank" class="btn-link btn-admin">Admin</a>
        <a href="https://darkred-koala-809285.hostingersite.com/corsi/admin-corsi.php" target="_blank" class="btn-link btn-admin" style="background:rgba(34,197,94,.08);color:#22c55e;border-color:rgba(34,197,94,.15)">Admin Corsi</a>
        <a href="https://darkred-koala-809285.hostingersite.com/corsi/" target="_blank" class="btn-link btn-local" style="background:rgba(6,182,212,.08);color:#06b6d4;border-color:rgba(6,182,212,.15)">Portale Studenti</a>
      </div>
      <div class="creds">
        <div class="cred"><span class="cred-label">Password</span><span class="cred-val">LashArt2026!</span></div>
        <div class="cred"><span class="cred-label">WhatsApp</span><span class="cred-val">+39 334 382 8321</span></div>
        <div class="cred"><span class="cred-label">Pixel FB</span><span class="cred-val">1313613270661919</span></div>
      </div>
      <div class="proj__cmd">Locale: <code>~/funnel-lash</code></div>
      <div class="proj__drive" id="drive-lash"></div>
      <div class="proj__files" data-project="lash"></div>
      <div class="wa-accordion" onclick="this.classList.toggle('open')">
        <div class="wa-accordion__header"><span>Messaggio WhatsApp pronto da inviare</span><span class="wa-accordion__arrow">&#9660;</span></div>
        <div class="wa-accordion__body"><div class="wa-accordion__body-inner">
        <div style="font-size:12px;color:var(--text);line-height:1.6;white-space:pre-wrap;user-select:all" id="msg-lash">Ciao! Sono Marta di Lash Art Academy, piacere.

Grazie per il tuo interesse nel corso di extension ciglia.

Ti racconto in breve cosa comprende.

Il corso ti insegna le 4 tecniche piu richieste nel settore: Tecnica One to One, Nastro Brasiliano, Volume Ibrido e Ciglia Lifting Magico. Ogni tecnica ha le sue video lezioni dettagliate con dimostrazioni pratiche step by step.

Alla fine di ogni tecnica ricevi un certificato professionale rilasciato dalla fondatrice Martina Celesti, quindi in totale ricevi 4 certificati.

Il corso e' tutto online, lo segui al tuo ritmo e hai accesso a vita. Costa solo 50 euro invece di 299, ma l'offerta e' limitata ai primi 15 posti e ne restano pochissimi.

Se sei interessata a bloccare il tuo posto, posso farti contattare dalla nostra consulente per completare la registrazione. Come ti dicevo i posti sono limitati a 15 e ne restano davvero pochi.

Fammi sapere se vuoi procedere e dimmi quando ti fa piu comodo essere ricontattata!</div>
        <button onclick="event.stopPropagation();copyMsg('msg-lash')" style="margin-top:8px;padding:6px 14px;background:#25d366;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font)">Copia messaggio</button>
        </div></div>
      </div>

      <div class="wa-accordion" onclick="this.classList.toggle('open')" style="border-left-color:#6366f1">
        <div class="wa-accordion__header"><span style="color:#6366f1">Script Call per i Setter</span><span class="wa-accordion__arrow" style="color:#6366f1">&#9660;</span></div>
        <div class="wa-accordion__body"><div class="wa-accordion__body-inner">
        <div style="font-size:12px;color:var(--text);line-height:1.8;white-space:pre-wrap;user-select:all" id="script-call-lash">APERTURA:
"Ciao [Nome], sono [Tuo Nome] di Lash Art Academy. Come stai? Ti chiamo perche hai mostrato interesse per il nostro corso di extension ciglia, ti ricordi?"

QUALIFICA:
"Perfetto! Dimmi, hai gia esperienza con le extension ciglia o sarebbe la tua prima volta? Cosa ti piacerebbe ottenere dal corso?"

PRESENTAZIONE:
"Fantastico. Il nostro corso e' stato creato dalla fondatrice Martina Celesti ed e' il piu completo che trovi online. Impari 4 tecniche professionali:

1. Tecnica One to One - la base classica
2. Nastro Brasiliano - la tecnica piu richiesta nei saloni
3. Volume Ibrido - per un effetto wow
4. Ciglia Lifting Magico - senza extension, trattamento naturale

Ogni tecnica ha video lezioni dettagliate con dimostrazioni step by step. Alla fine di OGNI tecnica ricevi un certificato professionale, quindi in totale 4 certificati.

Il corso e' tutto online, accesso a vita, lo segui quando vuoi."

PREZZO + URGENZA:
"Il prezzo? Solo 50 euro invece di 299. Ma attenzione: abbiamo un limite massimo di 15 iscritte e ne restano pochissime. Questa offerta non la ripetiamo."

CHIUSURA:
"Vuoi bloccare il tuo posto adesso? Come preferisci pagare, bonifico o contrassegno?"

OBIEZIONI:
- "Devo pensarci" → "Ti capisco, ma con soli 15 posti disponibili rischi di trovare tutto esaurito domani. A 50 euro per 4 certificati professionali e' un investimento minimo con un ritorno enorme"
- "Ce ne sono tanti di corsi" → "Vero, ma quanti ti danno 4 certificati e 4 tecniche diverse a questo prezzo? E con accesso a vita? La nostra fondatrice ha formato centinaia di lash artist professioniste"
- "Non ho tempo" → "Il bello del nostro corso e' che lo fai quando vuoi. Anche 30 minuti al giorno. Hai accesso a vita, nessuna scadenza"</div>
        <button onclick="event.stopPropagation();copyMsg('script-call-lash')" style="margin-top:8px;padding:6px 14px;background:#6366f1;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font)">Copia script</button>
        </div></div>
      </div>

      <div class="wa-accordion" onclick="this.classList.toggle('open')" style="border-left-color:#f59e0b">
        <div class="wa-accordion__header"><span style="color:#f59e0b">Script / Indicazioni Messaggi WhatsApp</span><span class="wa-accordion__arrow" style="color:#f59e0b">&#9660;</span></div>
        <div class="wa-accordion__body"><div class="wa-accordion__body-inner">
        <div style="font-size:12px;color:var(--text);line-height:1.8;white-space:pre-wrap;user-select:all" id="script-wa-lash">REGOLE GENERALI:
- Rispondi ENTRO 5 minuti dal lead
- Tono esclusivo e professionale, come un brand di lusso
- Sottolinea SEMPRE la scarsita (15 posti)
- Se non risponde dopo 1h → follow-up. Dopo 24h → ultimo tentativo

STEP 1 - PRIMO CONTATTO (entro 5 min):
"Ciao [Nome]! Sono [Tuo Nome] di Lash Art Academy. Grazie per il tuo interesse nel corso di extension ciglia! Hai un minuto? Ti racconto tutto"

STEP 2 - SE RISPONDE:
Manda il messaggio WhatsApp principale (tendina verde sopra)

STEP 3 - FISSARE LA CALL:
"Se vuoi ti faccio richiamare dalla nostra consulente che ti spiega tutto nei dettagli e ti aiuta con l'iscrizione. Quando preferisci? Tieni presente che i posti sono limitati a 15"

STEP 4 - FOLLOW-UP (dopo 1h):
"Ciao [Nome], ti avevo scritto per il corso di Lash Art Academy! Solo per dirti che stanno andando via velocemente i posti. Se hai un attimo ti spiego tutto in 2 minuti"

STEP 5 - ULTIMO TENTATIVO (dopo 24h):
"Ciao [Nome], ultimo aggiornamento: restano gli ultimi posti per il corso a 50 euro (prezzo pieno 299). Se sei ancora interessata sono qui, altrimenti ti auguro il meglio!"

RISPOSTE RAPIDE:
- "Quanto costa?" → "Solo 50 euro invece di 299! Include 4 tecniche complete, 4 certificati professionali e accesso a vita. Ma abbiamo solo 15 posti"
- "Che tecniche si imparano?" → "4 tecniche: One to One, Nastro Brasiliano, Volume Ibrido e Ciglia Lifting Magico. Per ognuna ricevi un certificato. Sono le piu richieste nei saloni"
- "Posso lavorare dopo?" → "Assolutamente! Con 4 certificati puoi lavorare in un salone o in autonomia. Molte nostre studentesse hanno aperto il loro studio dopo il corso"
- "E' online?" → "Si, tutto online con video lezioni professionali. Accesso a vita, lo segui al tuo ritmo. Puoi rivedere le lezioni quante volte vuoi"</div>
        <button onclick="event.stopPropagation();copyMsg('script-wa-lash')" style="margin-top:8px;padding:6px 14px;background:#f59e0b;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font)">Copia script</button>
        </div></div>
      </div>
    </div>

    <div class="proj">
      <div class="proj__top"><div class="proj__name">Agente Telefonico AI</div><span class="tag tag-live">LIVE</span></div>
      <div class="proj__domain">agetetel.shop — Server Hetzner 204.168.179.247</div>
      <div class="proj__desc">Agente AI telefonico con Vapi.ai. Dashboard lead, chiamate outbound, knowledge base. Twilio + Claude + ElevenLabs + Deepgram.</div>
      <div class="proj__links">
        <a href="https://agetetel.shop/dashboard" target="_blank" class="btn-link btn-site">Dashboard</a>
        <a href="https://dashboard.vapi.ai" target="_blank" class="btn-link btn-admin">Vapi</a>
      </div>
      <div class="creds">
        <div class="cred"><span class="cred-label">Dashboard</span><span class="cred-val">AgentAI2026!</span></div>
        <div class="cred"><span class="cred-label">Twilio Num</span><span class="cred-val">+17752785917</span></div>
        <div class="cred"><span class="cred-label">SSH</span><span class="cred-val">root@204.168.179.247</span></div>
      </div>
      <div class="proj__cmd">Server: <code>/root/ai-phone-agent</code></div>
      <div class="proj__files" data-project="ai-phone"></div>
    </div>

    <div class="proj">
      <div class="proj__top"><div class="proj__name">Business Assistant AI (SaaS)</div><span class="tag tag-live">LIVE</span></div>
      <div class="proj__domain">agetetel.shop/ba/ — Server Hetzner 204.168.179.247:8082</div>
      <div class="proj__desc">Piattaforma SaaS per assistente business vocale. I clienti si registrano, collegano Facebook/Shopify/CRM, e parlano con Siri o Google per avere dati del business in tempo reale. Multi-utente con token API personale.</div>
      <div class="proj__links">
        <a href="https://agetetel.shop/ba/" target="_blank" class="btn-link btn-site">Landing</a>
        <a href="https://agetetel.shop/ba/register" target="_blank" class="btn-link btn-admin">Registrati</a>
        <a href="https://agetetel.shop/ba/login" target="_blank" class="btn-link btn-local">Login</a>
      </div>
      <div class="creds">
        <div class="cred"><span class="cred-label">Server</span><span class="cred-val">root@204.168.179.247 porta 8082</span></div>
        <div class="cred"><span class="cred-label">API Siri</span><span class="cred-val">/ba/api/siri?q=domanda&t=TOKEN</span></div>
        <div class="cred"><span class="cred-label">API JSON</span><span class="cred-val">/ba/api/ask POST {question, token}</span></div>
      </div>
      <div class="proj__cmd">Server: <code>/root/business-assistant</code></div>
      <div class="proj__files" data-project="ba"></div>
    </div>

    <div class="proj">
      <div class="proj__top"><div class="proj__name">FreshIQ Clone</div><span class="tag tag-live">LIVE</span></div>
      <div class="proj__domain">lightskyblue-tarsier-967570.hostingersite.com</div>
      <div class="proj__desc">Clone landing page FreshIQ (spray rinfrescante per l'alito) — React/Vite con 4 varianti colore, checkout Shopify, i18n, Framer Motion.</div>
      <div class="proj__links">
        <a href="https://lightskyblue-tarsier-967570.hostingersite.com" target="_blank" class="btn-link btn-site">Sito</a>
      </div>
      <div class="proj__cmd">Locale: <code>~/fresh-iq-clone-app</code> — Build: <code>npm run build</code> (deploy via branch <code>deploy</code>)</div>
      <div class="proj__drive" id="drive-fresh"></div>
      <div class="proj__files" data-project="fresh"></div>
    </div>

    <div class="proj">
      <div class="proj__top"><div class="proj__name">ReviewShield</div><span class="tag tag-local">LOCALE</span></div>
      <div class="proj__domain">reviewshieldita.lovable.app (clone locale)</div>
      <div class="proj__desc">Servizio rimozione recensioni negative da Google. Landing page clonata da Lovable. Analisi gratuita, pagamento a risultato.</div>
      <div class="proj__links">
        <a href="http://localhost:8897" target="_blank" class="btn-link btn-site">Locale :8897</a>
        <a href="https://reviewshieldita.lovable.app" target="_blank" class="btn-link btn-admin">Originale</a>
        <a href="https://reviewshieldita.lovable.app/admin/dashboard" target="_blank" class="btn-link btn-admin">Dashboard Lead</a>
        <a href="javascript:void(0)" onclick="showPage('sop-rs')" class="btn-link btn-admin">📋 SOP</a>
        <a href="javascript:void(0)" onclick="showPage('script-rs')" class="btn-link btn-admin">💬 Script Vendita</a>
      </div>
      <div class="proj__cmd">Locale: <code>~/reviewshield</code> — Avvia: <code>cd ~/reviewshield && python3 -m http.server 8897</code></div>
      <div class="proj__files" data-project="rs"></div>
    </div>

    <div class="proj">
      <div class="proj__top"><div class="proj__name">ReviewShield Broad</div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><label class="panel-toggle" title="Mostra/nascondi nel pannello switcher degli admin"><input type="checkbox" data-admin-host="midnightblue-pony-128540.hostingersite.com" onchange="togglePanelHost(this)"><span class="panel-toggle__switch"></span><span>Pannello</span></label><span class="tag tag-local">LOCALE</span></div></div>
      <div class="proj__domain">Versione broad (tutti i settori)</div>
      <div class="proj__desc">Versione generalista di ReviewShield. Rimozione recensioni negative per qualsiasi attività: ristoranti, hotel, studi professionali, negozi, ecc. Immagini generate con Seedream.</div>
      <div class="proj__links">
        <a href="http://localhost:8898" target="_blank" class="btn-link btn-site">Locale :8898</a>
      </div>
      <div class="proj__cmd">Locale: <code>~/reviewshield-broad</code> — Avvia: <code>cd ~/reviewshield-broad && python3 -m http.server 8898</code></div>
      <div class="proj__files" data-project="rs-broad"></div>
    </div>

  </div>
</div>

<!-- ==================== COMPETITOR TRACKER ==================== -->
<div class="page" id="page-competitors">
  <div class="page-title">Analisi Competitor</div>
  <p class="page-sub">Tieni traccia dei competitor, salva link e note</p>
  <div class="comp-form">
    <input type="url" id="comp-url" placeholder="URL del competitor (es. https://...)">
    <input type="text" id="comp-note" placeholder="Note (cosa fanno, cosa copiare, punti deboli...)">
    <select id="comp-cat" style="padding:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:10px;color:rgba(255,255,255,.7);font-size:13px;min-width:120px">
      <option value="facebook">Facebook Ads</option>
      <option value="landing">Landing Page</option>
      <option value="corso">Corso</option>
      <option value="ecommerce">E-commerce</option>
      <option value="altro">Altro</option>
    </select>
    <button onclick="addComp()">Aggiungi</button>
  </div>
  <div class="comp-list" id="comp-list"></div>
</div>

<!-- ==================== TODO LIST (PROGETTI) ==================== -->
<div class="page" id="page-todo">
  <!-- Vista elenco progetti -->
  <div id="todo-projects-view">
    <div class="page-title">To-Do List — Progetti</div>
    <p class="page-sub">Seleziona un progetto oppure creane uno nuovo</p>
    <div class="todo-form">
      <input type="text" id="proj-name" placeholder="Nome nuovo progetto..." onkeydown="if(event.key==='Enter')addProject()">
      <input type="color" id="proj-color" value="#7c3aed" style="width:52px;height:42px;padding:2px;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;cursor:pointer">
      <button onclick="addProject()">+ Progetto</button>
    </div>
    <div class="proj-grid" id="projects-grid"></div>
  </div>
  <!-- Vista dettaglio progetto (todo del progetto) -->
  <div id="todo-project-detail" style="display:none">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap">
      <button onclick="backToProjects()" style="background:none;border:1px solid var(--border);color:var(--text);padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-family:inherit">&larr; Progetti</button>
      <span id="proj-badge" style="padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700;color:#fff"></span>
    </div>
    <div class="page-title" id="proj-title">To-Do List</div>
    <p class="page-sub" id="proj-sub">Le tue attivita da completare</p>
    <div class="todo-form">
      <input type="text" id="todo-text" placeholder="Nuova attivita..." onkeydown="if(event.key==='Enter')addTodo()">
      <select id="todo-pri" style="padding:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);border-radius:10px;color:rgba(255,255,255,.7);font-size:13px">
        <option value="alta">Alta</option>
        <option value="media" selected>Media</option>
        <option value="bassa">Bassa</option>
      </select>
      <button onclick="addTodo()">Aggiungi</button>
    </div>
    <div class="todo-list" id="todo-list"></div>
  </div>
</div>

<!-- ==================== CALENDARIO ==================== -->
<div class="page" id="page-calendar">
  <div class="page-title">Calendario</div>
  <p class="page-sub">Pianifica le tue attivita e organizza il lavoro</p>
  <div class="cal-wrap">
    <div class="cal-header">
      <h3 id="cal-month"></h3>
      <div class="cal-nav">
        <button onclick="calNav(-1)">&larr; Prec</button>
        <button onclick="calNav(0)" style="background:linear-gradient(135deg,rgba(124,58,237,.1),rgba(6,182,212,.08));border-color:rgba(124,58,237,.15);color:#7c3aed">Oggi</button>
        <button onclick="calNav(1)">Succ &rarr;</button>
      </div>
    </div>
    <div class="cal-grid" id="cal-grid"></div>
  </div>
  <div id="cal-detail-wrap" style="display:none">
    <div class="cal-detail">
      <div class="cal-detail__header">
        <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span id="cal-selected-date"></span>
      </div>
      <div class="cal-tasks" id="cal-tasks"></div>
      <div class="cal-task-form" id="cal-task-form">
        <input type="text" id="cal-task-text" placeholder="Aggiungi task per questo giorno..." onkeydown="if(event.key==='Enter')addCalTask()">
        <button onclick="addCalTask()">Aggiungi</button>
      </div>
    </div>
  </div>
</div>

<!-- ==================== NOTE ==================== -->
<div class="page" id="page-tools">
  <div class="page-title">Tool</div>
  <p class="page-sub">Gestisci i tuoi strumenti, abbonamenti e costi</p>

  <div class="tools-summary">
    <div class="tools-summary__card"><div class="tools-summary__num" id="tools-count">0</div><div class="tools-summary__label">Tool Totali</div></div>
    <div class="tools-summary__card"><div class="tools-summary__num" id="tools-mensile">€0</div><div class="tools-summary__label">Costo Mensile</div></div>
    <div class="tools-summary__card"><div class="tools-summary__num" id="tools-singolo">€0</div><div class="tools-summary__label">Pagamenti Singoli</div></div>
    <div class="tools-summary__card"><div class="tools-summary__num" id="tools-totale">€0</div><div class="tools-summary__label">Totale Speso</div></div>
  </div>

  <div class="tools-form">
    <input type="text" id="tool-name" placeholder="Nome tool...">
    <input type="number" id="tool-amount" placeholder="Importo €" step="0.01" min="0">
    <input type="date" id="tool-date">
    <select id="tool-type">
      <option value="mensile">Abbonamento Mensile</option>
      <option value="singolo">Pagamento Singolo</option>
    </select>
    <input type="email" id="tool-email" placeholder="Email accesso" style="min-width:160px">
    <input type="text" id="tool-pw" placeholder="Password" style="min-width:120px">
    <input type="text" id="tool-2fa" placeholder="2FA (opzionale)" style="min-width:120px">
    <button onclick="addTool()">Aggiungi</button>
  </div>

  <div class="tools-list" id="tools-list"></div>
</div>

<div class="page" id="page-bilancio">
  <div class="page-title">Bilancio Aziendale</div>
  <p class="page-sub">Clicca su una cella per inserire l'importo</p>
  <div class="bil-bar">
    <button onclick="bilMo(-1)">&larr;</button>
    <div class="bil-label" id="bil-label">Aprile 2026</div>
    <button onclick="bilMo(1)">&rarr;</button>
    <div class="bil-add-col">
      <input type="text" id="bil-col-name" placeholder="Nome colonna...">
      <select id="bil-col-type"><option value="e">Entrata</option><option value="u">Uscita</option></select>
      <button onclick="bilAddCol()">+ Colonna</button>
    </div>
  </div>
  <div class="bil-wrap">
    <table class="bil-t" id="bil-sheet"></table>
  </div>
</div>

<div class="page" id="page-loom">
  <div class="page-title">Loom</div>
  <p class="page-sub">Video registrati dal team — traccia chi li ha visti</p>
  <div class="loom-form">
    <input type="url" id="loom-url" placeholder="Link Loom (https://www.loom.com/share/...)">
    <input type="text" id="loom-title" placeholder="Titolo video">
    <button onclick="addLoom()">Aggiungi</button>
  </div>
  <div class="loom-list" id="loom-list"></div>
</div>

<div class="page" id="page-notes">
  <div class="page-title">Note</div>
  <p class="page-sub">Appunti, idee e informazioni importanti</p>
  <div class="notes-grid" id="notes-grid"></div>
</div>

<div class="page" id="page-simcod">
  <div class="page-title">Simulatore COD</div>
  <p class="page-sub">Calcolo margini e proiezioni per ordini in contrassegno</p>
  <iframe src="simulatore-cod.html" style="width:100%;height:calc(100vh - 200px);min-height:600px;border:1px solid var(--border);border-radius:14px;background:#fff"></iframe>
</div>

<!-- ==================== SOP REVIEWSHIELD ==================== -->
<div class="page doc-page" id="page-sop-rs">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap">
    <button class="doc-back" onclick="showPage('live')">&larr; Torna a Progetti</button>
    <span class="doc-badge">ReviewShield</span>
  </div>
  <div class="page-title">📋 SOP — ReviewShield</div>
  <p class="page-sub">Procedure operative dal lead alla rimozione e all'incasso. Target: chirurghi plastici, medici estetici, dermatologi.</p>

  <div class="doc-banner">
    <strong>Modello base:</strong> il cliente paga <strong>solo dopo</strong> che la recensione è sparita dal profilo. Mai pagamenti anticipati. Se non riusciamo, costo zero. Questa è la nostra arma di vendita più potente — non si tradisce mai.
  </div>

  <div class="doc-toc">
    <strong>Indice</strong>
    <ol>
      <li><a href="#sop-ruoli">Ruoli</a></li>
      <li><a href="#sop-01">SOP-01 — Assegnazione lead a blocchi</a></li>
      <li><a href="#sop-02">SOP-02 — Pre-qualifica del profilo Google</a></li>
      <li><a href="#sop-03">SOP-03 — Primo contatto (telefono / WhatsApp)</a></li>
      <li><a href="#sop-04">SOP-04 — Registrazione chiamata obbligatoria 🎙</a></li>
      <li><a href="#sop-05">SOP-05 — Demo / Chiamata di vendita</a></li>
      <li><a href="#sop-06">SOP-06 — Chiusura e invio link Stripe</a></li>
      <li><a href="#sop-07">SOP-07 — Passaggio al team operativo</a></li>
      <li><a href="#sop-08">SOP-08 — Lavorazione e aggiornamenti al cliente</a></li>
      <li><a href="#sop-09">SOP-09 — Conferma rimozione + incasso</a></li>
      <li><a href="#sop-10">SOP-10 — Upsell post-vendita</a></li>
      <li><a href="#sop-11">SOP-11 — Casi limite e contestazioni</a></li>
      <li><a href="#sop-12">SOP-12 — Reportistica per venditore 📊</a></li>
      <li><a href="#sop-numeri">Numeri ufficiali da citare</a></li>
    </ol>
  </div>

  <h2 class="doc-h2" id="sop-ruoli">Ruoli</h2>
  <table class="doc-table">
    <thead><tr><th>Ruolo</th><th>Chi</th><th>Cosa fa</th></tr></thead>
    <tbody>
      <tr><td><strong>Owner</strong></td><td>Samuele + Thomas</td><td>Assegna i blocchi di lead, controlla performance, ascolta a campione le chiamate registrate, riceve incassi via Stripe</td></tr>
      <tr><td><strong>Venditore</strong></td><td>Closer esterno</td><td>Riceve i lead già assegnati, contatta, vende, <strong>registra ogni chiamata</strong></td></tr>
      <tr><td><strong>Team Analisti / Legale</strong></td><td>Operatori interni</td><td>Costruiscono il dossier tecnico-legale, segnalano a Google</td></tr>
      <tr><td><strong>Account Manager</strong></td><td>Operatore dedicato</td><td>Aggiorna il cliente ogni 48h, gestisce conferme rimozione</td></tr>
    </tbody>
  </table>
  <p>Sam e Thomas <strong>non parlano mai coi clienti</strong>. Assegnano lead, controllano report, ascoltano a campione chiamate per coaching.</p>

  <h2 class="doc-h2" id="sop-01">SOP-01 — Assegnazione lead a blocchi</h2>
  <p>I lead vengono assegnati <strong>dal proprietario (Sam) a blocchi</strong>, dalla dashboard <code>reviewshieldita.lovable.app/admin/dashboard</code>. Il venditore <strong>non sceglie</strong> — lavora i lead che gli vengono assegnati.</p>

  <h3 class="doc-h3">Procedura assegnazione (lato Sam)</h3>
  <ol>
    <li>Sam apre la dashboard.</li>
    <li>Filtra i lead per priorità:
      <ul>
        <li><strong>ALTA</strong>: rating Google tra <strong>3.5 e 4.3</strong> (zona dove ogni recensione negativa pesa di più).</li>
        <li><strong>MEDIA</strong>: rating tra 4.4 e 4.6, almeno 3 recensioni 1-2 stelle.</li>
        <li><strong>BASSA</strong>: rating ≥ 4.7 (utile per Monitoraggio Continuo).</li>
      </ul>
    </li>
    <li>Seleziona un blocco di <strong>20–50 lead</strong>.</li>
    <li>Assegna il blocco a un venditore specifico.</li>
    <li>Il venditore vedrà nella sua dashboard SOLO i lead a lui assegnati.</li>
  </ol>

  <h3 class="doc-h3">Procedura lavorazione (lato venditore)</h3>
  <ol>
    <li>Il venditore apre la dashboard, vede solo i suoi lead.</li>
    <li>Stati possibili per ogni lead:
      <ul>
        <li><code>Da contattare</code> (default)</li>
        <li><code>Contattato — in attesa risposta</code></li>
        <li><code>Demo fissata</code></li>
        <li><code>Demo fatta — in attesa decisione</code></li>
        <li><code>Chiuso</code> (vendita andata)</li>
        <li><code>Rifiutato</code></li>
        <li><code>Non risponde / Numero errato</code></li>
      </ul>
    </li>
    <li>Il venditore aggiorna lo stato dopo ogni interazione.</li>
    <li><strong>Tempistica</strong>: ogni lead assegnato dev'essere lavorato (almeno primo contatto) entro <strong>48 ore</strong>.</li>
  </ol>

  <h2 class="doc-h2" id="sop-02">SOP-02 — Pre-qualifica del profilo Google</h2>
  <p>Da fare <strong>prima di chiamare</strong>, ogni volta. Tempo: 5–7 minuti per profilo.</p>
  <ol>
    <li>Apri il profilo Google del medico (Maps o Search).</li>
    <li>Conta le recensioni 1 e 2 stelle degli ultimi 12 mesi.</li>
    <li>Per ogni recensione negativa, classifica:
      <ul>
        <li><strong>Prematura</strong> → scritta a giorni/settimane da un intervento che dà risultato a mesi.</li>
        <li><strong>Dati medici esposti</strong> → cita interventi, complicazioni, condizioni → violazione privacy.</li>
        <li><strong>Diffamatoria</strong> → "truffatore", "incompetente", "mi ha rovinato".</li>
        <li><strong>Sospetta competitor</strong> → account creato di recente, una sola recensione, profilo vuoto.</li>
        <li><strong>Aspettativa irrealistica</strong> → "volevo il naso di Belen", lavoro tecnicamente perfetto.</li>
        <li><strong>Altro / non rimovibile</strong> → critiche generiche e fondate.</li>
      </ul>
    </li>
    <li>Calcola il <strong>danno stimato</strong> con la formula sotto.</li>
    <li>Scegli 2–3 recensioni "facili" da mostrare in chiamata come esempio concreto.</li>
    <li>Salva tutto in una nota interna sul lead.</li>
  </ol>

  <h3 class="doc-h3">Formula del danno (da usare in chiamata)</h3>
  <div class="doc-quote doc-quote--key">
    Pazienti persi al mese (stima) × Valore medio paziente × 12 = Danno annuo
  </div>
  <p><strong>Esempio chirurgo plastico</strong>: 2 pazienti/mese × 5.000 € = <strong>10.000 €/mese persi</strong> → 120.000 €/anno → <strong>600.000 € in 5 anni</strong>.</p>
  <p><strong>Esempio medico estetico</strong>: 4 pazienti/mese × 800 € = <strong>3.200 €/mese persi</strong> → 38.400 €/anno.</p>
  <p>👉 Questa è l'arma principale. Il prezzo (€300/recensione) sembra niente confrontato al danno.</p>

  <h2 class="doc-h2" id="sop-03">SOP-03 — Primo contatto (telefono / WhatsApp)</h2>
  <p><strong>Canale preferito</strong>: telefono diretto allo studio. <strong>Orari</strong>: martedì-giovedì, 10:00–12:00 e 15:00–17:00.</p>
  <p><strong>⚠ PRIMA DI CHIAMARE</strong>: premere il bottone <strong>🔴 Registra Chiamata</strong> nella scheda lead (vedi SOP-04).</p>

  <div class="doc-script">
    <span class="doc-script__label">Apertura standard (15 secondi)</span>
    <div class="doc-script__text">"Buongiorno, sono [nome] di ReviewShield. Mi sono permesso di chiamare perché ho appena guardato il profilo Google del Dr. [Cognome] e ho visto che ci sono recensioni che secondo le policy Google sono rimovibili. Posso parlargli 2 minuti o richiamare in un altro momento?"</div>
  </div>

  <div class="doc-script">
    <span class="doc-script__label">Se non passa la segretaria</span>
    <div class="doc-script__text">"Ho letto le recensioni del dottore e ne ho identificate 3 che possono essere rimosse legalmente da Google. Lo dica al dottore. Le lascio il mio numero — sono [nome], +39 XXX. La richiamata è gratuita e di interesse del dottore."</div>
  </div>

  <p>Se risponde direttamente il medico: vai a <strong>SOP-05</strong>. Per WhatsApp ed email: vedi <a href="#" onclick="showPage('script-rs');return false">Script Vendita</a>.</p>

  <h2 class="doc-h2" id="sop-04"><span class="doc-emoji">🎙</span>SOP-04 — Registrazione chiamata obbligatoria</h2>
  <div class="doc-quote doc-quote--alert">
    <strong>TUTTE le chiamate vengono registrate. Senza eccezioni.</strong> Se un venditore aggiorna lo stato senza aver registrato, è imbroglio — verifica immediata.
  </div>

  <h3 class="doc-h3">Come funziona</h3>
  <ol>
    <li>Dentro la scheda di ogni lead, c'è il bottone <strong>🔴 Registra Chiamata</strong>.</li>
    <li>Il venditore lo preme <strong>prima</strong> di chiamare il medico.</li>
    <li>La registrazione parte dal PC: cattura il microfono e l'audio della chiamata (se in conference / VoIP).</li>
    <li>Al termine, click su <strong>⏹ Stop</strong> → il file audio si salva automaticamente collegato al lead.</li>
    <li>Sam e Thomas possono riascoltare quando vogliono per controllo qualità, coaching, verifica fatti.</li>
  </ol>

  <h3 class="doc-h3">Disclosure obbligatoria al cliente (per legge)</h3>
  <div class="doc-script">
    <span class="doc-script__label">Da dire all'inizio di ogni chiamata</span>
    <div class="doc-script__text">"Dottore, le segnalo che questa chiamata può essere registrata per fini di qualità e formazione. Se non è d'accordo me lo dica, fermo la registrazione."</div>
  </div>
  <p>In pratica nessuno dice di no se viene chiesto in modo professionale. Ma va detto sempre — sennò siamo fuori legge.</p>

  <h3 class="doc-h3">File audio</h3>
  <ul>
    <li>Si salvano automaticamente nella scheda del lead.</li>
    <li>Non vanno scaricati, condivisi, mandati a terzi.</li>
    <li>Restano sul server reviewshield per <strong>12 mesi minimo</strong>.</li>
  </ul>

  <h2 class="doc-h2" id="sop-05">SOP-05 — Demo / Chiamata di vendita</h2>
  <p>Durata target: <strong>15–20 minuti</strong>. Struttura completa con script in <a href="#" onclick="showPage('script-rs');return false">Script Vendita</a>.</p>
  <ol>
    <li><strong>Empatia</strong> (2 min) — riconosci il dolore: "Quanto le pesa quella recensione?"</li>
    <li><strong>Calcolo del danno</strong> (3 min) — usa la formula di SOP-02. Il prezzo dopo questo step sembra ridicolo.</li>
    <li><strong>Soluzione</strong> (5 min) — chi siamo, come funzioniamo:
      <ul>
        <li>Team analisti + team legale + account manager dedicato</li>
        <li>88% successo, 10 giorni medi (alcune in 48h)</li>
        <li>900+ recensioni eliminate, 200+ cliniche, 7 anni di attività</li>
        <li>5 policy Google sfruttate</li>
        <li>0 accessi al profilo, 0 credenziali richieste</li>
      </ul>
    </li>
    <li><strong>Garanzia</strong> (1 min):
      <div class="doc-quote doc-quote--key">"Lei paga SOLO dopo che la recensione è sparita. Se non riusciamo, costo zero. Il rischio è tutto nostro."</div>
    </li>
    <li><strong>Prezzi</strong> (3 min) — vai a SOP-06.</li>
    <li><strong>Chiusura</strong> (2 min) — invio link Stripe.</li>
  </ol>
  <p><strong>Mostrare in chiamata</strong> via WhatsApp:</p>
  <ul>
    <li>Case study Bologna: 9 recensioni rimosse, rating 3.6 → 4.7 in 12 giorni.</li>
    <li>Case study Milano: recensione di 2 anni, rimossa in 6 giorni.</li>
  </ul>

  <h2 class="doc-h2" id="sop-06">SOP-06 — Chiusura e invio link Stripe</h2>
  <h3 class="doc-h3">Listino ufficiale</h3>
  <table class="doc-table">
    <thead><tr><th>Pacchetto</th><th>Prezzo</th><th>Quando proporlo</th></tr></thead>
    <tbody>
      <tr><td><strong>Pulizia Singola</strong></td><td>€300 / recensione</td><td>1–3 recensioni da rimuovere</td></tr>
      <tr><td><strong>Pacchetto 10</strong></td><td>€240 / recensione (sconto 20%)</td><td>4+ recensioni</td></tr>
      <tr><td><strong>Monitoraggio Continuo</strong></td><td>€100 / mese</td><td>Sempre, come upsell o per profili "sani" che vogliono prevenzione</td></tr>
    </tbody>
  </table>

  <h3 class="doc-h3">Procedura invio link Stripe</h3>
  <ol>
    <li>Venditore raccoglie: nome esatto attività + URL profilo Google + email + WhatsApp.</li>
    <li>Venditore richiede a Sam/Thomas il <strong>link Stripe corretto</strong> (one-shot per pulizia, subscription per monitoraggio).</li>
    <li>Sam/Thomas generano il link e lo girano al venditore.</li>
    <li>Venditore inoltra al cliente con questo testo:
      <div class="doc-script">
        <div class="doc-script__text">"Dottore, come da accordo le mando il link Stripe. <strong>Non lo paghi adesso</strong> — apriamo il caso, rimuoviamo le recensioni, e quando le vede sparite saldano il link. Se non riusciamo, il link non viene mai pagato. Ci siamo?"</div>
      </div>
    </li>
    <li>Venditore aggiorna stato lead in dashboard: <code>Chiuso — Stripe inviato</code>.</li>
  </ol>

  <div class="doc-quote doc-quote--alert">
    <strong>REGOLA FERREA</strong>: il cliente <strong>non paga prima della rimozione</strong>. Mai. È il nostro principale argomento di vendita — non si tradisce.
  </div>

  <h2 class="doc-h2" id="sop-07">SOP-07 — Passaggio al team operativo</h2>
  <p>Una volta accettato l'accordo e inviato lo Stripe, il venditore prepara il <strong>brief operativo</strong>:</p>
  <pre style="background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:8px;padding:14px;font-size:11.5px;color:var(--text);font-family:ui-monospace,Menlo,monospace;line-height:1.6;overflow-x:auto;white-space:pre-wrap">NUOVO CASO — ReviewShield

Cliente: Dr. [Nome Cognome]
Attività: [Nome esatto attività]
URL Google: [link profilo]
Città: [città]
Email: [email]
WhatsApp: [+39 ...]

Recensioni da rimuovere ([N] totali):
1. [URL recensione] — Autore: [nome] — Motivo: [policy violata] — Screenshot: [link]
2. ...

Pacchetto venduto: [Singola / Pacchetto 10 / Monitoraggio]
Importo: € [totale]
Stripe link: [URL] — stato: inviato, NON pagato

Note venditore: [contesto utile, sensibilità, urgenze]</pre>
  <p>Team operativo prende in carico entro <strong>24 ore</strong> e contatta il cliente con email di benvenuto firmata dall'account manager.</p>

  <h2 class="doc-h2" id="sop-08">SOP-08 — Lavorazione e aggiornamenti al cliente</h2>
  <p>Tempistica standard: <strong>10 giorni lavorativi</strong> (alcune cadono in 48h).</p>
  <h3 class="doc-h3">Checkpoint obbligatori</h3>
  <ul>
    <li><strong>Giorno 0</strong>: email di benvenuto dell'account manager con timeline prevista.</li>
    <li><strong>Giorno 2</strong>: aggiornamento "abbiamo costruito il dossier per recensioni X, Y, Z e abbiamo segnalato".</li>
    <li><strong>Giorno 5</strong>: aggiornamento di stato (anche se "ancora in lavorazione").</li>
    <li><strong>Giorno 10</strong>: aggiornamento finale — quante rimosse, quante in lavorazione, quante non eliminabili.</li>
  </ul>
  <p>Tono: professionale, pacato, mai trionfalistico finché la recensione non è sparita. Quando è sparita: screenshot prima/dopo come prova.</p>
  <p>Se il caso supera i 14 giorni: l'account manager fa una <strong>telefonata</strong> per spiegare lo stato senza far sentire abbandonato il cliente.</p>

  <h2 class="doc-h2" id="sop-09">SOP-09 — Conferma rimozione + incasso</h2>
  <p>Quando una recensione sparisce dal profilo Google:</p>
  <ol>
    <li>Account manager verifica con due controlli a 24h di distanza (cache).</li>
    <li>Salva screenshot <strong>prima</strong> (preso al momento della vendita) e <strong>dopo</strong>.</li>
    <li>Invia email al cliente con prova + sollecito pagamento Stripe.</li>
    <li>Notifica Sam/Thomas: "Cliente X — rimossa, sollecitato pagamento Stripe".</li>
    <li>Sam/Thomas controllano lo Stripe entro <strong>48h</strong>. Se non pagato → SOP-11.</li>
  </ol>
  <p><strong>Subscription Monitoraggio</strong>: il primo addebito parte dal mese successivo alla prima rimozione confermata.</p>

  <h2 class="doc-h2" id="sop-10">SOP-10 — Upsell post-vendita</h2>
  <p>A <strong>7 giorni</strong> dalla rimozione, l'account manager propone:</p>
  <ul>
    <li>Cliente con singole pagate → <strong>Pacchetto 10</strong> scontato per recensioni future.</li>
    <li>Cliente senza Monitoraggio → <strong>Monitoraggio Continuo €100/mese</strong> con questo angolo:
      <div class="doc-quote">"Dottore, oggi lei è pulito. Ma il problema può ripresentarsi: bastano 1–2 recensioni nuove e siamo punto a capo. Con il Monitoraggio le copriamo TUTTE le recensioni future automaticamente, lei non deve nemmeno chiamare. 100 euro al mese e dorme tranquillo."</div>
    </li>
  </ul>
  <p><strong>KPI minimo upsell</strong>: 30% dei clienti pulizia singola deve attivare Monitoraggio entro 30 giorni.</p>

  <h2 class="doc-h2" id="sop-11">SOP-11 — Casi limite e contestazioni</h2>

  <h3 class="doc-h3">Caso A — Cliente non paga lo Stripe dopo rimozione</h3>
  <ol>
    <li>Account manager invia 1° sollecito (giorno +3): "Le ricordo gentilmente il link Stripe ancora aperto."</li>
    <li>Account manager invia 2° sollecito (giorno +7): tono fermo ma cortese.</li>
    <li>Sam/Thomas inviano sollecito formale (giorno +14): via PEC se disponibile.</li>
    <li>Se non paga entro 30 giorni: passaggio a recupero crediti.</li>
  </ol>

  <h3 class="doc-h3">Caso B — Recensione rimossa che riappare</h3>
  <p>La rimuoviamo <strong>gratis</strong> (è dichiarato sulla landing). Apri nuovo dossier, segnala nuovamente, comunica al cliente: "ce ne occupiamo noi senza costi aggiuntivi".</p>

  <h3 class="doc-h3">Caso C — Recensioni che non riusciamo a rimuovere</h3>
  <p>Comunica al cliente con onestà: "questa rientra nelle critiche fondate, Google non la rimuoverà. Possiamo lavorare sulle altre N rimovibili." Costo per quelle non rimosse: <strong>zero</strong>.</p>

  <h3 class="doc-h3">Caso D — Cliente vuole indietro i soldi dopo aver pagato</h3>
  <p>Il pagamento Stripe è dovuto in cambio del risultato già consegnato. Mostrare screenshot prima/dopo, contratto/email di conferma. In caso di chargeback: contestare con la documentazione + audio della chiamata di vendita registrata.</p>

  <h3 class="doc-h3">Caso E — Recensione che il cliente ritiene rimovibile, ma non lo è</h3>
  <p>Fai un'analisi onesta in fase di vendita: meglio dirlo prima che dopo. Se ti accorgi solo dopo: comunica al cliente, non addebitare nulla per quella, lavora solo su quelle effettivamente rimovibili.</p>

  <h2 class="doc-h2" id="sop-12"><span class="doc-emoji">📊</span>SOP-12 — Reportistica per venditore</h2>
  <p>Sam e Thomas controllano la dashboard ogni settimana per vedere come stanno performando i venditori. Ogni venditore vede solo i propri numeri.</p>

  <h3 class="doc-h3">KPI per venditore</h3>
  <table class="doc-table">
    <thead><tr><th>KPI</th><th>Cosa misura</th><th>Target</th></tr></thead>
    <tbody>
      <tr><td><strong>Lead assegnati</strong></td><td>Quanti lead ha avuto in carico nel periodo</td><td>—</td></tr>
      <tr><td><strong>Lead contattati</strong></td><td>Quanti ha effettivamente chiamato</td><td>≥ 90% degli assegnati</td></tr>
      <tr><td><strong>Chiamate registrate</strong></td><td>Quante chiamate ha registrato</td><td>= numero contatti</td></tr>
      <tr><td><strong>Tasso di risposta</strong></td><td>Hanno risposto / contattati</td><td>≥ 40%</td></tr>
      <tr><td><strong>Demo fissate</strong></td><td>Quante chiamate sono diventate appuntamenti</td><td>≥ 25% dei contattati</td></tr>
      <tr><td><strong>Demo fatte</strong></td><td>Quante demo si sono concluse</td><td>≥ 80% delle fissate</td></tr>
      <tr><td><strong>Vendite chiuse</strong></td><td>Quanti accordi conclusi</td><td>≥ 20% delle demo</td></tr>
      <tr><td><strong>Fatturato generato</strong></td><td>Totale € incassati via Stripe</td><td>—</td></tr>
      <tr><td><strong>Tempo medio chiamata</strong></td><td>Durata media (da audio registrato)</td><td>5–12 min</td></tr>
      <tr><td><strong>Lead "freddi"</strong></td><td>Lead in pancia non lavorati &gt; 7 giorni</td><td>0</td></tr>
    </tbody>
  </table>

  <h3 class="doc-h3">Frequenza review</h3>
  <ul>
    <li><strong>Giornaliera</strong>: Sam dà un occhio veloce ai numeri di ieri.</li>
    <li><strong>Settimanale (lunedì)</strong>: review 1-on-1 con ogni venditore. Aprire 2-3 chiamate registrate scelte a caso, ascoltare, dare feedback.</li>
    <li><strong>Mensile</strong>: classifica venditori, premio/bonus al top performer, eventuali tagli di chi è sotto target da 2+ mesi consecutivi.</li>
  </ul>

  <h3 class="doc-h3">Indicatori di allarme (Sam interviene subito)</h3>
  <ul>
    <li>Venditore con &lt; 50% lead contattati su quelli assegnati → <strong>blocco assegnazioni nuove</strong> fino a recupero.</li>
    <li>Venditore con 0 chiamate registrate ma stati aggiornati → <strong>possibile imbroglio</strong>, ascoltare a campione.</li>
    <li>Tasso di rifiuto &gt; 70% → problema di approccio, fare coaching.</li>
    <li>Tempo medio chiamata &lt; 3 min su demo → non sta vendendo, sta scappando dalle obiezioni.</li>
  </ul>

  <h2 class="doc-h2" id="sop-numeri">Numeri ufficiali da citare</h2>
  <p>Da memorizzare e ripetere SEMPRE in chiamata. Sono i numeri della landing — non si inventano.</p>
  <table class="doc-table">
    <thead><tr><th>Metrica</th><th>Valore</th></tr></thead>
    <tbody>
      <tr><td>Tasso di successo</td><td><strong>88%</strong></td></tr>
      <tr><td>Recensioni eliminate (totale storico)</td><td><strong>900+</strong></td></tr>
      <tr><td>Cliniche e studi serviti</td><td><strong>200+</strong></td></tr>
      <tr><td>Tempo medio di rimozione</td><td><strong>10 giorni</strong> lavorativi (alcune in 48h)</td></tr>
      <tr><td>Anni di attività nel settore</td><td><strong>7 anni</strong></td></tr>
      <tr><td>Anni esperienza team legale</td><td><strong>12+ anni</strong></td></tr>
      <tr><td>Risposta entro</td><td><strong>2 ore</strong></td></tr>
      <tr><td>Policy Google sfruttate</td><td><strong>5</strong> (Contenuto Fuorviante, Privacy, Conflitto di Interessi, Diffamazione, Spam)</td></tr>
    </tbody>
  </table>

  <h3 class="doc-h3">Trust badges (da ripetere a chiusura)</h3>
  <ul>
    <li>✅ Paghi solo dopo la rimozione</li>
    <li>✅ Zero pagamenti anticipati</li>
    <li>✅ 100% legale e conforme</li>
    <li>✅ Nessun accesso al profilo</li>
  </ul>

  <hr>
  <p style="font-size:11px;color:var(--muted);text-align:center">Per integrazioni o feedback dal campo: parlare con Samuele o Thomas.</p>
</div>

<!-- ==================== SCRIPT VENDITA REVIEWSHIELD ==================== -->
<div class="page doc-page" id="page-script-rs">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap">
    <button class="doc-back" onclick="showPage('live')">&larr; Torna a Progetti</button>
    <span class="doc-badge">ReviewShield</span>
  </div>
  <div class="page-title">💬 Script Vendita — ReviewShield</div>
  <p class="page-sub">Script operativi per i venditori. Da memorizzare, non da leggere.</p>

  <div class="doc-banner">
    <strong>Regola d'oro</strong>: il cliente paga <strong>solo dopo</strong> la rimozione. Se non riusciamo, costo zero. Va detto in ogni chiamata, almeno <strong>2 volte</strong>.
  </div>

  <div class="doc-quote doc-quote--alert">
    <strong>⚠ Disclosure obbligatoria all'inizio di ogni chiamata</strong> (vedi <a href="#" onclick="showPage('sop-rs');return false">SOP-04</a>):<br>
    "Dottore, le segnalo che questa chiamata può essere registrata per fini di qualità e formazione. Se non è d'accordo me lo dica, fermo la registrazione."
  </div>

  <div class="doc-toc">
    <strong>Indice</strong>
    <ol>
      <li><a href="#scr-1">Script 1 — Cold call (telefonata a freddo)</a></li>
      <li><a href="#scr-2">Script 2 — Apertura WhatsApp</a></li>
      <li><a href="#scr-3">Script 3 — Email di apertura</a></li>
      <li><a href="#scr-4">Script 4 — Demo / Chiamata di vendita (15–20 min)</a></li>
      <li><a href="#scr-5">Script 5 — Gestione obiezioni (10 obiezioni)</a></li>
      <li><a href="#scr-6">Script 6 — Chiusura e invio link Stripe</a></li>
      <li><a href="#scr-7">Script 7 — Follow-up se non risponde</a></li>
      <li><a href="#scr-8">Script 8 — Closing post-rimozione + Upsell</a></li>
      <li><a href="#scr-vietate">Frasi che NON si dicono mai</a></li>
      <li><a href="#scr-cheat">Cheat sheet — i 4 messaggi chiave</a></li>
    </ol>
  </div>

  <h2 class="doc-h2" id="scr-1">Script 1 — Cold call (telefonata a freddo)</h2>
  <p><strong>Tempo target</strong>: 90 secondi per arrivare al "sì" dell'analisi gratuita.</p>
  <p><strong>⚠ Premere 🔴 Registra Chiamata PRIMA di chiamare.</strong></p>

  <h3 class="doc-h3">Apertura (15 secondi)</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Buongiorno dottore, sono <strong>[nome]</strong> di <strong>ReviewShield</strong>. La chiamo perché ho appena dato un'occhiata al suo profilo Google e ho notato qualcosa che vorrei farle vedere — ha 30 secondi?"</div>
  </div>

  <h3 class="doc-h3">Variante segretaria</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Buongiorno, sono [nome] di ReviewShield. Ho un'analisi gratuita da fare al dottore sul suo profilo Google — abbiamo identificato 3 recensioni negative che probabilmente possiamo rimuovere. Quando posso parlargli? Sono [+39 XXX], la richiamata è gratuita."</div>
  </div>

  <h3 class="doc-h3">Hook (20 secondi)</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Ho contato <strong>[N] recensioni</strong> a 1 e 2 stelle sul suo profilo. Una in particolare — quella di <strong>[autore]</strong> del <strong>[data]</strong> — è scritta a <strong>[X] giorni</strong> da un intervento che dà risultato a <strong>[6/12] mesi</strong>. Quella, secondo le policy Google, è rimovibile. E sospetto che ce ne siano almeno altre due nello stesso caso."</div>
  </div>

  <h3 class="doc-h3">Pitch corto (30 secondi)</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Noi siamo specializzati nel settore medico-estetico. Abbiamo <strong>88% di successo</strong>, tempo medio <strong>10 giorni</strong>. E qui sta il punto: <strong>lei paga solo dopo che la recensione è sparita dal profilo</strong>. Se non riusciamo, costo zero. Il rischio è tutto nostro."</div>
  </div>

  <h3 class="doc-h3">Chiusura per analisi gratuita (20 secondi)</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Le faccio un'<strong>analisi gratuita</strong> del suo profilo. Le dico esattamente quali recensioni possiamo togliere e quali no, senza impegno. Le va se le mando un messaggio WhatsApp con i dettagli? A che numero la trovo?"</div>
  </div>

  <h2 class="doc-h2" id="scr-2">Script 2 — Apertura WhatsApp</h2>

  <h3 class="doc-h3">Messaggio 1 — apertura breve</h3>
  <div class="doc-script">
    <div class="doc-script__text">Buongiorno Dr. <strong>[Cognome]</strong>, sono <strong>[nome]</strong> di ReviewShield. Abbiamo analizzato il suo profilo Google e crediamo di poter rimuovere <strong>[N] recensioni negative</strong>. Le mando l'analisi gratuita? Le bastano 2 minuti per leggerla.</div>
  </div>

  <h3 class="doc-h3">Messaggio 2 — analisi (se risponde sì)</h3>
  <div class="doc-script">
    <div class="doc-script__text">
      Perfetto. Le mando l'analisi.<br><br>
      <strong>Recensioni rimovibili</strong> che abbiamo identificato:<br>
      1. <strong>[Autore]</strong> — [data] — <em>Motivo</em>: scritta a [X] giorni dall'intervento, viola policy Google "Contenuto Fuorviante".<br>
      2. <strong>[Autore]</strong> — [data] — <em>Motivo</em>: contiene dettagli medici che violano la privacy.<br>
      3. <strong>[Autore]</strong> — [data] — <em>Motivo</em>: account creato 2 giorni prima, una sola recensione — pattern competitor.<br><br>
      🛡 <strong>88% di successo</strong>, <strong>10 giorni medi</strong>, <strong>paga solo dopo la rimozione</strong>.<br>
      Niente credenziali, niente accessi al suo profilo.<br><br>
      Se vuole, le faccio una chiamata di <strong>15 minuti</strong> in cui le spiego come procediamo. Quando le va bene? Le propongo: <strong>[domani 11:00]</strong> o <strong>[domani 16:00]</strong>?
    </div>
  </div>

  <h3 class="doc-h3">Messaggio 3 — riprova dopo 24h</h3>
  <div class="doc-script">
    <div class="doc-script__text">Dottore, le ho mandato l'analisi ieri. Una sola domanda: vuole che ce ne occupiamo noi o lascia perdere? Mi basta un sì o un no.</div>
  </div>

  <h2 class="doc-h2" id="scr-3">Script 3 — Email di apertura</h2>
  <p><strong>Oggetto</strong>: 3 recensioni rimovibili sul suo profilo Google</p>
  <div class="doc-script">
    <div class="doc-script__text">
      Gentile Dr. <strong>[Cognome]</strong>,<br><br>
      Sono <strong>[nome]</strong> di <strong>ReviewShield</strong>, ci occupiamo esclusivamente di rimozione recensioni negative dal settore medico-estetico.<br><br>
      Ho analizzato il profilo Google del suo studio e ho identificato <strong>[N] recensioni</strong> che, secondo le policy Google ufficiali, sono rimovibili. Le riassumo:<br><br>
      1. <strong>Recensione di [autore]</strong> ([data]) — scritta troppo presto rispetto al risultato definitivo dell'intervento. Violazione "Contenuto Fuorviante".<br>
      2. <strong>Recensione di [autore]</strong> ([data]) — contiene dettagli medici esposti senza consenso. Violazione privacy.<br>
      3. <strong>Recensione di [autore]</strong> ([data]) — pattern tipico da account competitor.<br><br>
      Come funziona:<br>
      • <strong>Analisi gratuita</strong> del profilo, senza impegno<br>
      • Costruzione del <strong>dossier tecnico-legale</strong> da parte del nostro team<br>
      • Segnalazione attraverso i canali ufficiali Google<br>
      • <strong>Lei paga solo dopo che la recensione è sparita</strong>. Se non riusciamo, il costo è zero.<br>
      • <strong>Tasso di successo: 88%</strong>. Tempo medio: 10 giorni lavorativi.<br>
      • <strong>Nessuna credenziale richiesta</strong>, nessun accesso al suo profilo.<br><br>
      Se vuole approfondire, le posso dedicare 15 minuti di chiamata in uno di questi slot:<br>
      • [domani 11:00]<br>
      • [domani 16:00]<br>
      • [dopodomani 10:00]<br><br>
      Cordiali saluti,<br>
      [nome] — ReviewShield
    </div>
  </div>

  <h2 class="doc-h2" id="scr-4">Script 4 — Demo / Chiamata di vendita (15–20 min)</h2>
  <p><strong>Obiettivo</strong>: chiudere l'accordo e inviare lo Stripe entro fine chiamata.</p>

  <h3 class="doc-h3">Step 1 — Empatia (2 min)</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Dottore, prima di tutto le faccio una domanda: <strong>quanto le pesa quella recensione?</strong> Quando la rilegge, cosa pensa?"<br><br>
      <em>[ascolta. Non interrompere.]</em><br><br>
      "Le dico una cosa. I nostri clienti, quando ci chiamano la prima volta, hanno la voce che gli trema. Non è solo la recensione — è la sensazione di essere <strong>ostaggio di uno sconosciuto</strong> che con 3 righe ha distrutto anni di lavoro. La capisco perfettamente. Ed è esattamente per questo che esistiamo noi."</div>
  </div>

  <h3 class="doc-h3">Step 2 — Calcolo del danno (3 min) — ARMA PIÙ POTENTE</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Facciamo un calcolo veloce. <strong>Quanto vale un suo paziente medio</strong>, come fatturato? Una rinoplastica, un'augmentation, un trattamento medio?"<br><br>
      <em>[aspetta risposta. Esempio: €5.000]</em><br><br>
      "Bene. Adesso, <strong>secondo lei</strong>, quante chiamate perde al mese a causa di queste recensioni? Quante persone aprono il suo profilo Google, vedono il 4.0 invece di un 4.7, e vanno dal competitor di fianco?"<br><br>
      <em>[aspetta risposta. Esempio: 2 al mese]</em><br><br>
      "<strong>2 pazienti al mese × 5.000 euro = 10.000 euro persi al mese.</strong> Sono <strong>120.000 all'anno</strong>. <strong>600.000 euro in 5 anni</strong>. E sa qual è la cosa peggiore? Lei sta perdendo questi soldi <strong>adesso</strong>, in questo esatto momento, ogni giorno che quella recensione resta lì. Mentre noi parliamo."</div>
  </div>

  <h3 class="doc-h3">Step 3 — Soluzione (5 min)</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Adesso le spiego chi siamo. Noi <strong>non siamo un software automatico</strong>. Siamo un team di tre figure:<br><br>
      <strong>1. Analisti digitali</strong> — costruiscono il dossier tecnico per ogni recensione: chi è l'autore, quando è stato creato l'account, pattern sospetti. <strong>900 dossier costruiti</strong>.<br><br>
      <strong>2. Team legale</strong> — avvocati specializzati in <strong>diritto digitale e privacy</strong>. Sanno tradurre la violazione in documentazione che Google non può ignorare. <strong>12 anni di esperienza</strong>.<br><br>
      <strong>3. Account manager dedicato</strong> — un riferimento unico che la aggiorna ogni 48 ore. Lei non è un ticket, è un caso seguito personalmente.<br><br>
      Sfruttiamo <strong>5 policy Google</strong>: contenuto fuorviante, privacy, conflitto d'interessi, diffamazione, spam.<br><br>
      Lavoriamo <strong>solo nel settore medico-estetico</strong>. <strong>7 anni di attività. 900+ recensioni eliminate. 200+ cliniche servite. 88% di successo.</strong>"</div>
  </div>

  <h3 class="doc-h3">Step 4 — Garanzia (1 min) — IL PUNTO CHIAVE</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Dottore, qui sta la cosa importante. <strong>Lei non paga niente fino a quando la recensione non è sparita dal profilo.</strong> Niente. Le mando un link Stripe, ma non lo paga subito. Lo paga solo dopo aver visto con i suoi occhi che la recensione è sparita.<br><br>
      <strong>Se non riusciamo, costo zero.</strong> Il rischio è tutto nostro. Sempre. Per questo possiamo permetterci di lavorare in questo modo — perché siamo bravi davvero. Se non lo fossimo, saremmo falliti il primo mese."</div>
  </div>

  <h3 class="doc-h3">Step 5 — Prezzi (3 min)</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Le presento le tre opzioni:<br><br>
      <strong>1. Pulizia Singola — 300 euro a recensione</strong>. Per chi vuole partire piano, magari con 1 o 2 recensioni.<br><br>
      <strong>2. Pacchetto Pulizia Completa — 240 a recensione, sconto 20%, in blocchi da 10</strong>. Per chi ha più recensioni e vuole risparmiare.<br><br>
      <strong>3. Monitoraggio Continuo — 100 euro al mese</strong>. Le copriamo tutte le recensioni future automaticamente. Alert immediato, rimozione automatica.<br><br>
      Per il suo caso, dato che ha [N] recensioni rimovibili, le consiglio <strong>[singole / pacchetto 10]</strong>. Ma decida lei: cosa le sembra più sensato?"</div>
  </div>

  <h2 class="doc-h2" id="scr-5">Script 5 — Gestione obiezioni</h2>
  <div class="doc-quote doc-quote--key">Regola: non si <strong>discute</strong> un'obiezione, si <strong>riconosce e si supera</strong>. Mai dire "non è vero", mai mettere il cliente in difetto.</div>

  <h3 class="doc-h3">Obiezione 1 — "È troppo caro"</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Capisco. Mi fermi se sbaglio: lei fa un intervento medio a <strong>[€5.000]</strong>. Se per colpa di queste recensioni perde <strong>2 pazienti al mese</strong>, sono <strong>10.000 euro persi ogni mese</strong>. La nostra fattura per recensione è <strong>300 euro</strong>. Ne basta una rimossa per rientrare 16 volte. È <strong>l'investimento col ritorno più veloce</strong> che farà mai. E ricorda: paga solo se funziona, sennò zero. Cosa la frena davvero?"</div>
  </div>

  <h3 class="doc-h3">Obiezione 2 — "È legale?"</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Tutto al 100% legale, <strong>canali ufficiali Google</strong>. Abbiamo un team legale dedicato — non è un trucco, non è un bot, non è hacking, non accediamo al suo profilo. Noi segnaliamo a Google le recensioni che <strong>violano le policy</strong> che Google stesso ha pubblicato, e Google le rimuove. Punto. Lei può leggere le policy direttamente sul sito di Google, sono pubbliche."</div>
  </div>

  <h3 class="doc-h3">Obiezione 3 — "Devo darvi le credenziali / password?"</h3>
  <div class="doc-script">
    <div class="doc-script__text">"<strong>Mai.</strong> Mi basta il nome esatto della sua attività. Niente password, niente accessi, niente compromessi. Pensiamo a tutto noi <strong>dall'esterno</strong>. Anzi, è una delle ragioni per cui Google si fida delle nostre segnalazioni — perché vengono da terzi documentati, non dall'interno del profilo."</div>
  </div>

  <h3 class="doc-h3">Obiezione 4 — "Lo posso fare anche io segnalando direttamente a Google"</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Può provare, e gliel'auguro. Le dico la verità però: il <strong>90% delle segnalazioni dirette viene ignorato</strong>. Google non legge ogni segnalazione singolarmente — serve un dossier strutturato che citi la <strong>policy esatta</strong>, mostri le <strong>prove</strong>, sia inviato attraverso i <strong>canali corretti</strong>, e abbia uno <strong>storico di credibilità</strong>. Per questo servono analisti e avvocati. Provi pure: se ci riesce, perfetto, non ci serve. Se non ci riesce nei prossimi 30 giorni, mi richiami."</div>
  </div>

  <h3 class="doc-h3">Obiezione 5 — "Devo pensarci"</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Capisco. Le faccio una sola domanda: <strong>quante recensioni negative ha ricevuto negli ultimi 6 mesi?</strong>"<br><br>
      <em>[aspetta]</em><br><br>
      "Bene. Quante ne riceverà nei prossimi 6 mesi se non fa nulla? <strong>Almeno altrettante</strong>. Ogni giorno che passa, perde pazienti. Non c'è fretta da parte mia, però: io le mando l'<strong>analisi gratuita</strong> stasera, così ce l'ha pronta quando decide. Quando vuole, mi chiama. Le va bene?"<br><br>
      <em>[se ancora "ci penso"]</em><br><br>
      "Ultima cosa: lei rischia zero. Se le manda lo Stripe e non paga finché non vediamo la rimozione, <strong>cosa ha da perdere?</strong> Letteralmente nulla. Cosa la frena davvero, dottore?"</div>
  </div>

  <h3 class="doc-h3">Obiezione 6 — "Il paziente che ha scritto la recensione lo viene a sapere?"</h3>
  <div class="doc-script">
    <div class="doc-script__text">"<strong>No, mai.</strong> Google <strong>non avvisa</strong> mai l'autore quando una recensione viene rimossa. Nessuna mail, nessun alert, niente. La recensione semplicemente <strong>sparisce</strong>. Nel caso rarissimo in cui dovesse riscriverla — ed è successo poche volte in 7 anni — gliela rimuoviamo <strong>gratis</strong>."</div>
  </div>

  <h3 class="doc-h3">Obiezione 7 — "Quanto tempo ci mettete?"</h3>
  <div class="doc-script">
    <div class="doc-script__text">"<strong>Tempo medio 10 giorni lavorativi.</strong> Alcune recensioni cadono in <strong>48 ore</strong>, altre richiedono qualche giorno in più. Le diamo aggiornamenti <strong>ogni 48 ore</strong> dal suo account manager dedicato, così sa sempre a che punto siamo."</div>
  </div>

  <h3 class="doc-h3">Obiezione 8 — "Avete clienti come me?"</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Esclusivamente. È la nostra <strong>unica specializzazione</strong>. Le faccio 2 esempi recenti:<br><br>
      • <strong>Clinica di Chirurgia Plastica a Milano</strong>: aveva una recensione che la perseguitava da 2 anni. Tutti gli avevano detto 'non si può fare niente'. L'abbiamo tolta in <strong>6 giorni</strong>.<br>
      • <strong>Centro Polispecialistico a Bologna</strong>: rating <strong>3.6</strong>. In <strong>12 giorni</strong> abbiamo rimosso <strong>9 recensioni</strong>. Oggi è a <strong>4.7</strong>.<br><br>
      Se mi dà 5 minuti, le mando gli screenshot prima/dopo via WhatsApp adesso."</div>
  </div>

  <h3 class="doc-h3">Obiezione 9 — "E se Google blocca il mio profilo per le segnalazioni?"</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Non succede, perché <strong>non passiamo dal suo profilo</strong>. Le segnalazioni arrivano dai nostri canali, non dal suo account. Google non sa nemmeno che lei esiste fino a quando non rimuove la recensione. <strong>Zero rischi sul suo profilo.</strong> È la prima domanda che ci fanno tutti, ed è il motivo per cui in 7 anni non abbiamo avuto un solo caso di problema."</div>
  </div>

  <h3 class="doc-h3">Obiezione 10 — "Devo parlarne col mio commercialista / collega / socio"</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Certo, ne parli. Le mando intanto l'<strong>analisi gratuita</strong> scritta — così ha qualcosa di concreto da mostrare. Non costa nulla averla. Quando vi siete decisi, mi richiami. <strong>Una sola domanda però</strong>: cosa pensa che le risponderà il commercialista? Probabilmente le dirà 'fai due conti'. Quei due conti glieli ho già fatti io: 300 euro contro 10.000 al mese persi. Comunque, ne parli pure. Le mando l'analisi adesso."</div>
  </div>

  <h2 class="doc-h2" id="scr-6">Script 6 — Chiusura e invio link Stripe</h2>

  <h3 class="doc-h3">Frase di chiusura in chiamata</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Allora dottore, riassumo: partiamo con <strong>[Pulizia Singola / Pacchetto 10 / Monitoraggio]</strong> per <strong>€[importo]</strong>. Le mando ora il link Stripe via WhatsApp. <strong>Non lo paghi adesso</strong> — apriamo il caso, rimuoviamo le recensioni, e quando le vede sparite con i suoi occhi salda il link. Se non riusciamo, il link non viene mai pagato.<br><br>
      Mi serve solo: <strong>nome esatto della sua attività</strong> come appare su Google, e la conferma che le <strong>3 recensioni</strong> che le ho identificato sono quelle che vuole rimuovere. Procediamo?"</div>
  </div>

  <h3 class="doc-h3">Messaggio WhatsApp con il link Stripe</h3>
  <div class="doc-script">
    <div class="doc-script__text">
      Dottore, come da accordo le mando il link per il pagamento.<br><br>
      🔗 <strong>[link Stripe]</strong><br><br>
      🛡 <strong>Importante</strong>: NON lo paghi adesso. Apriamo subito il suo caso, rimuoviamo le recensioni, e quando le vede sparite procede col pagamento. Se non riusciamo, il link non viene mai saldato.<br><br>
      Il suo <strong>account manager</strong> la contatterà entro 24 ore con la timeline e gli aggiornamenti. Tempi medi: 10 giorni.<br><br>
      A presto, [nome] — ReviewShield
    </div>
  </div>

  <h2 class="doc-h2" id="scr-7">Script 7 — Follow-up se non risponde</h2>

  <h3 class="doc-h3">Dopo 24h (WhatsApp)</h3>
  <div class="doc-script">
    <div class="doc-script__text">Buongiorno Dr. <strong>[Cognome]</strong>, ha avuto modo di guardare l'analisi che le ho mandato ieri? Se ha 5 minuti la chiamo io, mi dica quando le va bene.</div>
  </div>

  <h3 class="doc-h3">Dopo 72h (WhatsApp)</h3>
  <div class="doc-script">
    <div class="doc-script__text">Dottore, una sola domanda: la recensione di <strong>[data]</strong> è ancora sul suo profilo. <strong>Vuole che ce la togliamo o lasciamo perdere?</strong> Mi dica solo sì o no, niente lunghi messaggi.</div>
  </div>

  <h3 class="doc-h3">Dopo 7 giorni (chiamata)</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Dottore, sono [nome] di ReviewShield. Volevo solo capire: c'è qualcosa che la frena? Posso chiarire qualche dubbio? La nostra offerta resta valida — paga solo dopo la rimozione, costo zero se non riusciamo. Cosa la trattiene?"</div>
  </div>

  <h3 class="doc-h3">Se non risponde — WhatsApp</h3>
  <div class="doc-script">
    <div class="doc-script__text">Dottore, capisco le mille cose. Le lascio l'offerta aperta. Se cambia idea mi scriva qui, parto subito col caso. Se invece preferisce non sentirmi più, mi mandi un "stop" e non la disturbo più. Buona giornata.</div>
  </div>

  <h3 class="doc-h3">Dopo 30 giorni — riapertura</h3>
  <div class="doc-script">
    <div class="doc-script__text">Buongiorno Dr. <strong>[Cognome]</strong>, controllando il suo profilo ho visto che è arrivata una nuova recensione negativa il [data]. Le riconfermo l'offerta: prima rimuoviamo, poi paga. Le va se ne riparliamo?</div>
  </div>

  <h2 class="doc-h2" id="scr-8">Script 8 — Closing post-rimozione + Upsell Monitoraggio</h2>

  <h3 class="doc-h3">Comunicazione "recensione rimossa" (WhatsApp)</h3>
  <div class="doc-script">
    <div class="doc-script__text">
      Dottore, ottime notizie. La recensione di <strong>[autore]</strong> del <strong>[data]</strong> è stata <strong>rimossa definitivamente</strong> da Google. Le allego screenshot prima/dopo come prova.<br><br>
      📸 [screenshot prima]<br>
      📸 [screenshot dopo]<br><br>
      Come da accordo, può ora completare il pagamento del link Stripe che le ho mandato. Se ha problemi col link mi scriva.
    </div>
  </div>

  <h3 class="doc-h3">Pitch upsell Monitoraggio (a 7 giorni dalla prima rimozione)</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Dottore, le faccio un pensiero. Oggi il suo profilo è pulito grazie a noi. Però — e glielo dico con onestà — il problema <strong>può ripresentarsi</strong>. Bastano 1 o 2 recensioni nuove e siamo punto a capo.<br><br>
      Per i clienti come lei abbiamo il <strong>Monitoraggio Continuo</strong> a <strong>100 euro al mese</strong>:<br>
      • Monitoriamo il suo profilo <strong>24/7</strong><br>
      • <strong>Alert immediato</strong> appena arriva una recensione negativa<br>
      • <strong>Rimozione automatica</strong> se è rimovibile, senza che lei debba fare niente<br>
      • <strong>Account manager dedicato</strong> per qualsiasi cosa<br>
      • <strong>Report mensile</strong> con lo stato della sua reputazione<br><br>
      Sono <strong>100 euro al mese</strong>. Lei dorme tranquillo, noi lavoriamo nel silenzio. Le mando il link?"</div>
  </div>

  <h3 class="doc-h3">Se obiezione "100 al mese sono tanti"</h3>
  <div class="doc-script">
    <div class="doc-script__text">"Dottore, le ricordo i numeri di prima: una sola recensione che le costa 2 pazienti — sono 10.000 euro persi. Il monitoraggio costa <strong>100</strong>. È <strong>l'1% del danno</strong> di una sola recensione lasciata lì. E può cancellarlo in qualsiasi momento."</div>
  </div>

  <h2 class="doc-h2" id="scr-vietate">Frasi che NON si dicono mai</h2>
  <table class="doc-table">
    <thead><tr><th>❌ Da evitare</th><th>✅ Dire invece</th></tr></thead>
    <tbody>
      <tr><td>"Promettiamo di rimuoverla"</td><td><strong>"88% di successo. Se non riusciamo, costo zero."</strong></td></tr>
      <tr><td>"Hackeriamo Google" / "Trucchi"</td><td><strong>"Canali ufficiali Google. Team legale. Tutto trasparente."</strong></td></tr>
      <tr><td>"Bot / automazione / software"</td><td><strong>"Team di analisti, avvocati e account manager. Persone, non software."</strong></td></tr>
      <tr><td>"Mi dia la sua password"</td><td><strong>"Mai. Mi basta il nome dell'attività."</strong></td></tr>
      <tr><td>"Sicuramente la rimuoviamo"</td><td><strong>"Le facciamo l'analisi gratuita e le diciamo cosa è rimovibile."</strong></td></tr>
      <tr><td>"Paga subito, poi rimuoviamo"</td><td><strong>"Prima la rimuoviamo, poi paga. Sempre."</strong></td></tr>
      <tr><td>"È un investimento" <em>(senza numeri)</em></td><td><strong>"[Calcolo del danno specifico col fatturato del cliente]"</strong></td></tr>
      <tr><td>"Domani sparisce"</td><td><strong>"Tempo medio 10 giorni. Alcune in 48 ore, alcune più."</strong></td></tr>
    </tbody>
  </table>

  <h2 class="doc-h2" id="scr-cheat">Cheat sheet — i 4 messaggi chiave da ripetere</h2>
  <p>In ogni chiamata, in ogni messaggio, in ogni email — questi 4 punti devono entrare almeno una volta ciascuno:</p>
  <ol>
    <li><strong>"Paga solo dopo la rimozione."</strong> ← La garanzia. Ripetere 2-3 volte.</li>
    <li><strong>"88% di successo, 10 giorni medi."</strong> ← I numeri.</li>
    <li><strong>"Niente credenziali, niente accessi al suo profilo."</strong> ← Sicurezza.</li>
    <li><strong>"Specializzati nel settore medico-estetico, 7 anni, 900 recensioni eliminate."</strong> ← Autorità.</li>
  </ol>

  <hr>
  <p style="font-size:11px;color:var(--muted);text-align:center">Per integrazioni o feedback dal campo: parlare con Samuele o Thomas.</p>
</div>

</div>

<!-- NOTE FULLSCREEN MODAL -->
<div class="note-modal" id="note-modal" onclick="if(event.target===this)closeNoteModal()">
  <div class="note-modal__inner">
    <div class="note-modal__close" onclick="closeNoteModal()">&#10005;</div>
    <div class="note-modal__title" contenteditable="true" id="modal-note-title"></div>
    <textarea class="note-modal__body" id="modal-note-body"></textarea>
  </div>
</div>

<script>
// LEAD FETCHER
var leadEndpoints = [
  {key:'seg', url:'https://aliceblue-dragonfly-326952.hostingersite.com/api_stats.php', name:'Segretarie'},
  {key:'nails', url:'https://mediumturquoise-mule-624710.hostingersite.com/api_stats.php', name:'Nails'},
  {key:'lash', url:'https://darkred-koala-809285.hostingersite.com/api_stats.php', name:'Lash'}
];

function pct(part,tot){if(!tot||tot<=0)return '—';return Math.round((part/tot)*100)+'%'}

function fetchAllLeads(){
  var btn=document.querySelector('.lead-refresh');
  btn.classList.add('loading');btn.textContent='Caricamento...';
  var agg={totali:0,nuovi:0,oggi:0,contrassegno:0,confermati:0,annullati:0,da_ricontattare:0,non_risponde:0,contattato:0};
  var done=0;

  leadEndpoints.forEach(function(ep){
    var statusEl=document.getElementById('status-'+ep.key);
    statusEl.textContent='...';statusEl.className='lead-card__status';

    fetch(ep.url).then(function(r){return r.json()}).then(function(d){
      var tot=d.totali||0;
      document.getElementById(ep.key+'-totali').textContent=tot;
      document.getElementById(ep.key+'-nuovi').textContent=d.nuovi||0;
      document.getElementById(ep.key+'-oggi').textContent=d.oggi||0;
      document.getElementById(ep.key+'-bon').textContent=d.bonifico||0;
      document.getElementById(ep.key+'-cod').textContent=d.contrassegno||0;
      // Conversioni
      var conf=d.confermati||0,ann=d.annullati||0,ric=d.da_ricontattare||0,nr=d.non_risponde||0;
      document.getElementById(ep.key+'-confermati').textContent=conf;
      document.getElementById(ep.key+'-confermati-pct').textContent=pct(conf,tot);
      document.getElementById(ep.key+'-annullati').textContent=ann;
      document.getElementById(ep.key+'-annullati-pct').textContent=pct(ann,tot);
      document.getElementById(ep.key+'-ricontattare').textContent=ric;
      document.getElementById(ep.key+'-ricontattare-pct').textContent=pct(ric,tot);
      document.getElementById(ep.key+'-nonrisponde').textContent=nr;
      document.getElementById(ep.key+'-nonrisponde-pct').textContent=pct(nr,tot);

      statusEl.textContent='Online';statusEl.className='lead-card__status lead-card__status--ok';
      agg.totali+=tot;agg.nuovi+=(d.nuovi||0);agg.oggi+=(d.oggi||0);agg.contrassegno+=(d.contrassegno||0);
      agg.confermati+=conf;agg.annullati+=ann;agg.da_ricontattare+=ric;
      agg.non_risponde+=(d.non_risponde||0);agg.contattato+=(d.contattato||0);
      done++;
      if(done===leadEndpoints.length) updateTotals(agg,btn);
    }).catch(function(){
      statusEl.textContent='Offline';statusEl.className='lead-card__status lead-card__status--err';
      done++;
      if(done===leadEndpoints.length) updateTotals(agg,btn);
    });
  });
}

function updateTotals(a,btn){
  document.getElementById('lt-total').textContent=a.totali;
  document.getElementById('lt-nuovi').textContent=a.nuovi;
  document.getElementById('lt-oggi').textContent=a.oggi;
  document.getElementById('lt-cod').textContent=a.contrassegno;
  document.getElementById('lt-confermati').textContent=a.confermati;
  document.getElementById('lt-confermati-pct').textContent=pct(a.confermati,a.totali);
  document.getElementById('lt-annullati').textContent=a.annullati;
  document.getElementById('lt-annullati-pct').textContent=pct(a.annullati,a.totali);
  document.getElementById('lt-ricontattare').textContent=a.da_ricontattare;
  document.getElementById('lt-ricontattare-pct').textContent=pct(a.da_ricontattare,a.totali);
  document.getElementById('lt-non-risponde').textContent=a.non_risponde;
  document.getElementById('lt-non-risponde-pct').textContent=pct(a.non_risponde,a.totali);
  document.getElementById('lt-contattato').textContent=a.contattato;
  document.getElementById('lt-contattato-pct').textContent=pct(a.contattato,a.totali);
  document.getElementById('badge-total-leads').textContent=a.nuovi>0?a.nuovi:'0';
  document.getElementById('lead-last-update').textContent='Ultimo aggiornamento: '+new Date().toLocaleTimeString('it-IT');
  btn.classList.remove('loading');btn.textContent='Aggiorna dati';
  localStorage.setItem('lead-cache',JSON.stringify({t:a.totali,n:a.nuovi,o:a.oggi,c:a.contrassegno,conf:a.confermati,ann:a.annullati,ric:a.da_ricontattare,nr:a.non_risponde,cnt:a.contattato,time:Date.now()}));
  if(typeof updateCPL==='function') updateCPL();
}

// Load cache on start
(function(){
  var cache=localStorage.getItem('lead-cache');
  if(cache){
    try{
      var d=JSON.parse(cache);
      document.getElementById('lt-total').textContent=d.t;
      document.getElementById('lt-nuovi').textContent=d.n;
      document.getElementById('lt-oggi').textContent=d.o;
      document.getElementById('lt-cod').textContent=d.c;
      if(d.conf!==undefined){document.getElementById('lt-confermati').textContent=d.conf;document.getElementById('lt-confermati-pct').textContent=pct(d.conf,d.t)}
      if(d.ann!==undefined){document.getElementById('lt-annullati').textContent=d.ann;document.getElementById('lt-annullati-pct').textContent=pct(d.ann,d.t)}
      if(d.ric!==undefined){document.getElementById('lt-ricontattare').textContent=d.ric;document.getElementById('lt-ricontattare-pct').textContent=pct(d.ric,d.t)}
      if(d.nr!==undefined){document.getElementById('lt-non-risponde').textContent=d.nr;document.getElementById('lt-non-risponde-pct').textContent=pct(d.nr,d.t)}
      if(d.cnt!==undefined){document.getElementById('lt-contattato').textContent=d.cnt;document.getElementById('lt-contattato-pct').textContent=pct(d.cnt,d.t)}
      document.getElementById('badge-total-leads').textContent=d.n>0?d.n:'0';
      document.getElementById('lead-last-update').textContent='Cache dal: '+new Date(d.time).toLocaleTimeString('it-IT');
    }catch(e){}
  }
  // Auto fetch on load
  fetchAllLeads();
})();

// BILANCIO
var bilY=2026,bilM=new Date().getMonth();
var bilMonthNames=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
function bilDays(){return new Date(bilY,bilM+1,0).getDate()}
function bilColsKey(){return 'bil-cols'}
function bilDataKey(colId){return 'bil-d-'+bilY+'-'+bilM+'-'+colId}

function bilGetCols(){
  var c=localStorage.getItem(bilColsKey());
  if(c){try{return JSON.parse(c)}catch(e){}}
  return [
    {id:'entrate',name:'Entrate',type:'e'},
    {id:'ads',name:'Advertising',type:'u'},
    {id:'team',name:'Team',type:'u'},
    {id:'prodotti',name:'Prodotti',type:'u'},
    {id:'spedizioni',name:'Spedizioni',type:'u'},
    {id:'altre',name:'Altre Spese',type:'u'}
  ];
}
function bilSaveCols(c){localStorage.setItem(bilColsKey(),JSON.stringify(c));fetch('api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:bilColsKey(),value:c})}).catch(function(){})}
function bilGetData(colId){
  var d=localStorage.getItem(bilDataKey(colId));
  var days=bilDays(),arr=[];
  if(d){try{arr=JSON.parse(d)}catch(e){}}
  while(arr.length<days)arr.push([]);
  // Migrate old format (single numbers) to new format (array of entries)
  for(var i=0;i<arr.length;i++){
    if(typeof arr[i]==='number'){arr[i]=arr[i]?[{label:'',amount:arr[i]}]:[];}
    if(!Array.isArray(arr[i]))arr[i]=[];
  }
  return arr.slice(0,days);
}
function bilSetData(colId,arr){localStorage.setItem(bilDataKey(colId),JSON.stringify(arr));fetch('api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:bilDataKey(colId),value:arr})}).catch(function(){})}
function bilDayTotal(entries){var s=0;entries.forEach(function(e){s+=e.amount});return s}

function bilMo(dir){
  bilM+=dir;
  if(bilM>11){bilM=0;bilY++;if(bilY>2028){bilY=2028;bilM=11}}
  if(bilM<0){bilM=11;bilY--;if(bilY<2024){bilY=2024;bilM=0}}
  bilRender();
}
function bilChangeYear(d){bilY+=d;if(bilY<2024)bilY=2024;if(bilY>2028)bilY=2028;bilRender()}

function bilAddCol(){
  var name=document.getElementById('bil-col-name').value.trim();
  var type=document.getElementById('bil-col-type').value;
  if(!name)return;
  var cols=bilGetCols();
  var id=name.toLowerCase().replace(/[^a-z0-9]/g,'')+'_'+Date.now();
  cols.push({id:id,name:name,type:type});
  bilSaveCols(cols);
  document.getElementById('bil-col-name').value='';
  bilRender();
}
function bilDelCol(idx){
  var cols=bilGetCols();
  cols.splice(idx,1);
  bilSaveCols(cols);
  bilRender();
}

function bilF(v){
  if(!v)return '<span class="vz">—</span>';
  var s=v<0?'-€'+Math.abs(v).toFixed(2):'€'+v.toFixed(2);
  return '<span class="'+(v>0?'vp':v<0?'vn':'')+'">'+s+'</span>';
}

var bilPop=null;
function bilClosePop(){
  if(bilPop){bilPop.remove();bilPop=null}
  document.removeEventListener('mousedown',bilPopOutside);
}
function bilPopOutside(e){
  if(bilPop&&!bilPop.contains(e.target)){bilClosePop();bilRender()}
}
function bilEdit(colId,day){
  bilClosePop();
  var td=document.getElementById('bc-'+colId+'-'+day);
  if(!td)return;
  var rect=td.getBoundingClientRect();
  var arr=bilGetData(colId);
  var entries=arr[day]||[];

  var pop=document.createElement('div');
  pop.className='bil-cell-pop';
  // Position: below cell, shift left if near right edge
  var left=rect.left;
  if(left+270>window.innerWidth)left=window.innerWidth-280;
  var top=rect.bottom+4;
  if(top+300>window.innerHeight)top=rect.top-310;
  pop.style.left=left+'px';pop.style.top=top+'px';

  function renderPop(){
    var tot=0;
    var h='<button class="bil-cell-pop__close" onclick="bilClosePop();bilRender()">&times;</button>';
    h+='<div class="bil-cell-pop__title">Giorno '+(day+1)+'</div>';
    h+='<div class="bil-cell-pop__items">';
    entries.forEach(function(e,i){
      tot+=e.amount;
      h+='<div class="bil-cell-pop__item"><span class="bil-cell-pop__item-label">'+(e.label||'—')+'</span><span class="bil-cell-pop__item-amt">€'+e.amount.toFixed(2)+'</span><button class="bil-cell-pop__item-del" onclick="bilDelEntry(\''+colId+'\','+day+','+i+')">&times;</button></div>';
    });
    if(!entries.length)h+='<div style="color:var(--muted);font-size:11px;padding:4px 0">Nessuna voce</div>';
    h+='</div>';
    h+='<div class="bil-cell-pop__form"><input type="text" id="bil-pop-label" placeholder="Etichetta..." onkeydown="if(event.key===\'Enter\'){event.preventDefault();document.getElementById(\'bil-pop-amt\').focus()}"><input type="number" id="bil-pop-amt" placeholder="€" step="0.01" onkeydown="if(event.key===\'Enter\'){event.preventDefault();bilAddEntry(\''+colId+'\','+day+')}"><button onclick="bilAddEntry(\''+colId+'\','+day+')">+</button></div>';
    if(tot>0)h+='<div class="bil-cell-pop__total">Totale: <span>€'+tot.toFixed(2)+'</span></div>';
    pop.innerHTML=h;
    setTimeout(function(){
      var inp=document.getElementById('bil-pop-label');
      if(inp)inp.focus();
    },30);
  }
  renderPop();
  document.body.appendChild(pop);
  bilPop=pop;
  setTimeout(function(){document.addEventListener('mousedown',bilPopOutside)},10);
}

function bilAddEntry(colId,day){
  var label=document.getElementById('bil-pop-label').value.trim();
  var amt=parseFloat(document.getElementById('bil-pop-amt').value)||0;
  if(!amt)return;
  var arr=bilGetData(colId);
  if(!arr[day])arr[day]=[];
  arr[day].push({label:label||'',amount:amt});
  bilSetData(colId,arr);
  bilClosePop();bilRender();
  setTimeout(function(){bilEdit(colId,day)},50);
}

function bilDelEntry(colId,day,idx){
  var arr=bilGetData(colId);
  arr[day].splice(idx,1);
  bilSetData(colId,arr);
  bilClosePop();bilRender();
  setTimeout(function(){bilEdit(colId,day)},50);
}

function bilRender(){
  var cols=bilGetCols();
  var days=bilDays();
  var label=bilMonthNames[bilM]+' '+bilY;
  document.getElementById('bil-label').textContent=label;

  // Load all data
  var data={};
  cols.forEach(function(c){data[c.id]=bilGetData(c.id)});

  // Tool auto: metti spesa sul giorno corrispondente alla data
  var tools=getStore('tools');
  var toolDays=new Array(days).fill(0);
  var toolTotMese=0;
  tools.forEach(function(t){
    var parts=t.date?t.date.split('-'):[];
    var tY=parseInt(parts[0]),tM=parseInt(parts[1])-1,tD=parseInt(parts[2]);
    if(t.type==='mensile'){
      // mensile: appare ogni mese sullo stesso giorno
      if(tD>=1&&tD<=days){toolDays[tD-1]+=t.amount;toolTotMese+=t.amount}
    } else {
      // singolo: solo nel mese/anno esatto
      if(tY===bilY&&tM===bilM&&tD>=1&&tD<=days){toolDays[tD-1]+=t.amount;toolTotMese+=t.amount}
    }
  });

  // Separate entrate/uscite columns
  var eCols=[],uCols=[];
  cols.forEach(function(c,i){c._idx=i;if(c.type==='e')eCols.push(c);else uCols.push(c)});

  // Header
  var h='<thead><tr><th>GG</th>';
  eCols.forEach(function(c){h+='<th class="col-e">'+c.name+' <span class="col-del" onclick="bilDelCol('+c._idx+')">&times;</span></th>'});
  h+='<th class="col-tot">Tot. Entrate</th>';
  uCols.forEach(function(c){h+='<th class="col-u">'+c.name+' <span class="col-del" onclick="bilDelCol('+c._idx+')">&times;</span></th>'});
  h+='<th class="col-u" style="color:var(--cyan)">Tool <span style="font-size:8px;opacity:.6">(auto)</span></th>';
  h+='<th class="col-tot">Tot. Uscite</th><th class="col-tot">Profitto</th></tr></thead><tbody>';

  // Day rows
  var totE=new Array(eCols.length).fill(0);
  var totU=new Array(uCols.length).fill(0);
  var grandE=0,grandU=0;

  for(var d=0;d<days;d++){
    var dayE=0,dayU=0;
    h+='<tr><td>'+(d+1)+'</td>';
    eCols.forEach(function(c,ci){
      var entries=data[c.id][d]||[];var v=bilDayTotal(entries);dayE+=v;totE[ci]+=v;
      var hint=entries.length>1?' <span style="font-size:8px;color:var(--muted)">('+entries.length+')</span>':'';
      h+='<td class="ec col-e" id="bc-'+c.id+'-'+d+'" onclick="bilEdit(\''+c.id+'\','+d+')">'+bilF(v)+hint+'</td>';
    });
    h+='<td class="col-tot">'+bilF(dayE)+'</td>';
    uCols.forEach(function(c,ci){
      var entries=data[c.id][d]||[];var v=bilDayTotal(entries);dayU+=v;totU[ci]+=v;
      var hint=entries.length>1?' <span style="font-size:8px;color:var(--muted)">('+entries.length+')</span>':'';
      h+='<td class="ec col-u" id="bc-'+c.id+'-'+d+'" onclick="bilEdit(\''+c.id+'\','+d+')">'+bilF(v)+hint+'</td>';
    });
    // Tool auto column - mostra spesa sul giorno della data
    var tv=toolDays[d];dayU+=tv;
    h+='<td class="col-u" style="color:var(--cyan)">'+bilF(tv)+'</td>';
    grandE+=dayE;grandU+=dayU;
    h+='<td class="col-tot">'+bilF(dayU)+'</td>';
    h+='<td class="col-tot">'+bilF(dayE-dayU)+'</td></tr>';
  }

  // Totale row
  h+='<tr class="row-tot"><td>TOT</td>';
  eCols.forEach(function(c,ci){h+='<td class="col-e">'+bilF(totE[ci])+'</td>'});
  h+='<td class="col-e" style="color:var(--green)">'+bilF(grandE)+'</td>';
  uCols.forEach(function(c,ci){h+='<td class="col-u">'+bilF(totU[ci])+'</td>'});
  h+='<td class="col-u" style="color:var(--cyan)">'+bilF(toolTotMese)+'</td>';
  h+='<td class="col-u" style="color:var(--red)">'+bilF(grandU)+'</td>';
  h+='<td class="col-prof" style="color:var(--cyan)">'+bilF(grandE-grandU)+'</td></tr>';

  h+='</tbody>';
  document.getElementById('bil-sheet').innerHTML=h;
}
bilRender();

// TOOLS
function renderTools(){
  var list=getStore('tools'),html='';
  var totalMensile=0,totalSingolo=0;
  list.forEach(function(t,i){
    var tagClass=t.type==='mensile'?'tag-mensile':'tag-singolo';
    var tagLabel=t.type==='mensile'?'Mensile':'Singolo';
    if(t.type==='mensile') totalMensile+=t.amount; else totalSingolo+=t.amount;
    var credsHtml='';
    if(t.email||t.pw||t.tfa){
      credsHtml='<div class="tool-item__creds">';
      if(t.email)credsHtml+='<span>Email: <code onclick="navigator.clipboard.writeText(\''+t.email+'\')">'+t.email+'</code></span>';
      if(t.pw)credsHtml+='<span>PW: <code onclick="navigator.clipboard.writeText(\''+t.pw+'\')">'+t.pw+'</code></span>';
      if(t.tfa)credsHtml+='<span>2FA: <code onclick="navigator.clipboard.writeText(\''+t.tfa+'\')">'+t.tfa+'</code></span>';
      credsHtml+='</div>';
    }
    html+='<div class="tool-item" style="flex-wrap:wrap">'
      +'<span class="tool-item__name">'+t.name+'</span>'
      +'<span class="tool-item__tag '+tagClass+'">'+tagLabel+'</span>'
      +'<span class="tool-item__amount">€'+t.amount.toFixed(2)+'</span>'
      +'<span class="tool-item__date">'+t.date+'</span>'
      +'<button class="tool-item__edit" onclick="editTool('+i+')" title="Modifica">&#9998;</button>'
      +'<button class="tool-item__del" onclick="delTool('+i+')">x</button>'
      +credsHtml
      +'</div>';
  });
  document.getElementById('tools-list').innerHTML=html||'<p style="color:var(--muted);font-size:13px;padding:20px;text-align:center">Nessun tool aggiunto.</p>';
  document.getElementById('tools-count').textContent=list.length;
  document.getElementById('tools-mensile').textContent='€'+totalMensile.toFixed(2);
  document.getElementById('tools-singolo').textContent='€'+totalSingolo.toFixed(2);
  document.getElementById('tools-totale').textContent='€'+(totalMensile+totalSingolo).toFixed(2);
}
function addTool(){
  var name=document.getElementById('tool-name').value.trim();
  var amount=parseFloat(document.getElementById('tool-amount').value)||0;
  var date=document.getElementById('tool-date').value||new Date().toLocaleDateString('it-IT');
  var type=document.getElementById('tool-type').value;
  var email=document.getElementById('tool-email').value.trim();
  var pw=document.getElementById('tool-pw').value.trim();
  var tfa=document.getElementById('tool-2fa').value.trim();
  if(!name)return;
  if(isNaN(amount)||amount<0)amount=0;
  var list=getStore('tools');
  list.unshift({name:name,amount:amount,date:date,type:type,email:email,pw:pw,tfa:tfa});
  setStore('tools',list);
  document.getElementById('tool-name').value='';
  document.getElementById('tool-amount').value='';
  document.getElementById('tool-date').value='';
  document.getElementById('tool-email').value='';
  document.getElementById('tool-pw').value='';
  document.getElementById('tool-2fa').value='';
  renderTools();if(typeof bilRender==='function')bilRender();
}
function delTool(i){var list=getStore('tools');list.splice(i,1);setStore('tools',list);renderTools();if(typeof bilRender==='function')bilRender()}
function editTool(i){
  var list=getStore('tools');var t=list[i];
  var newName=prompt('Nome tool:',t.name);if(newName===null)return;
  var newAmount=prompt('Importo €:',t.amount);if(newAmount===null)return;
  var newType=prompt('Tipo (mensile/singolo):',t.type);if(newType===null)return;
  var newEmail=prompt('Email accesso:',t.email||'');if(newEmail===null)return;
  var newPw=prompt('Password:',t.pw||'');if(newPw===null)return;
  var newTfa=prompt('2FA (opzionale):',t.tfa||'');if(newTfa===null)return;
  if(newType!=='mensile'&&newType!=='singolo')newType=t.type;
  list[i].name=newName.trim()||t.name;
  list[i].amount=parseFloat(newAmount)||t.amount;
  list[i].type=newType;
  list[i].email=newEmail.trim();
  list[i].pw=newPw.trim();
  list[i].tfa=newTfa.trim();
  setStore('tools',list);renderTools();if(typeof bilRender==='function')bilRender();
}
// Set default date to today
document.getElementById('tool-date').valueAsDate=new Date();
renderTools();

// CPL (Cost Per Lead)
function updateCPL(){
  var keys=['seg','nails','lash'];
  var totalAds=0,totalLeads=0;
  keys.forEach(function(k){
    var ads=parseFloat(document.getElementById('ads-'+k).value)||0;
    var leads=parseInt(document.getElementById(k+'-totali').textContent)||0;
    var cpl=leads>0?(ads/leads):0;
    document.getElementById('cpl-'+k).textContent=ads>0?(cpl<1?'€'+cpl.toFixed(3):'€'+cpl.toFixed(2)):'—';
    totalAds+=ads;totalLeads+=leads;
  });
  document.getElementById('lt-spesa').textContent='€'+totalAds.toFixed(2);
  var avgCpl=totalLeads>0?(totalAds/totalLeads):0;
  document.getElementById('lt-cpl').textContent=totalAds>0?(avgCpl<1?'€'+avgCpl.toFixed(3):'€'+avgCpl.toFixed(2)):'—';
  // Save locally + server-sync
  var adsData={};keys.forEach(function(k){adsData[k]=parseFloat(document.getElementById('ads-'+k).value)||0});
  setStore('ads-spend',adsData);
}
function loadAdsFromStore(){
  var saved=getStore('ads-spend');
  if(saved && typeof saved==='object' && !Array.isArray(saved)){
    ['seg','nails','lash'].forEach(function(k){
      if(saved[k]){document.getElementById('ads-'+k).value=saved[k]}
    });
    updateCPL();
  }
}
loadAdsFromStore();

// CURSOR GLOW
var glow=document.getElementById('cursor-glow');
document.addEventListener('mousemove',function(e){glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px'});

// PROJECT CARD MOUSE TRACKING
document.querySelectorAll('.proj').forEach(function(el){
  el.addEventListener('mousemove',function(e){
    var r=el.getBoundingClientRect();
    el.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
    el.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
  });
});

// COPY MESSAGE
function copyMsg(id){
  var text=document.getElementById(id).textContent;
  navigator.clipboard.writeText(text).then(function(){
    var btn=event.target;btn.textContent='Copiato!';btn.style.background='#22c55e';
    setTimeout(function(){btn.textContent='Copia messaggio';btn.style.background='#25d366'},2000);
  });
}

// NAVIGATION
function showPage(id, el){
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active')});
  var page = document.getElementById('page-'+id);
  if(page) page.classList.add('active');
  if(el) el.classList.add('active');
  // Mobile bottom bar active state
  document.querySelectorAll('.mob-tab').forEach(function(t){t.classList.remove('active')});
  var mobTab=document.querySelector('.mob-tab[data-page="'+id+'"]');
  if(mobTab)mobTab.classList.add('active');
  // Close more menu
  closeMobMore();
  // Scroll to top
  window.scrollTo(0,0);
}
function toggleMobMore(){
  var m=document.getElementById('mob-more');
  var o=document.getElementById('mob-overlay');
  if(m.classList.contains('open')){closeMobMore()}
  else{m.classList.add('open');if(o)o.classList.add('open')}
}
function closeMobMore(){
  var m=document.getElementById('mob-more');
  var o=document.getElementById('mob-overlay');
  if(m)m.classList.remove('open');
  if(o)o.classList.remove('open');
}

// LOCAL STORAGE HELPERS
function getStore(key){try{return JSON.parse(localStorage.getItem(key))||[]}catch{return[]}}
function setStore(key,val){localStorage.setItem(key,JSON.stringify(val));fetch('api.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:key,value:val})}).catch(function(){})}

// COMPETITORS
function renderComps(){
  var list=getStore('competitors'),html='';
  list.forEach(function(c,i){
    var catColors={facebook:'#1877f2',landing:'#6366f1',corso:'#22c55e',ecommerce:'#eab308',altro:'#888'};
    html+='<div class="comp"><div class="comp__body"><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;background:'+catColors[c.cat]+'20;color:'+catColors[c.cat]+'">'+c.cat.toUpperCase()+'</span></div><a href="'+c.url+'" target="_blank" class="comp__url">'+c.url+'</a><div class="comp__note">'+c.note+'</div><div class="comp__date">Aggiunto: '+c.date+'</div></div><button class="comp__del" onclick="delComp('+i+')">X</button></div>';
  });
  document.getElementById('comp-list').innerHTML=html||'<p style="color:var(--muted);font-size:13px;padding:20px;text-align:center">Nessun competitor salvato. Aggiungi il primo!</p>';
}
function addComp(){
  var url=document.getElementById('comp-url').value.trim();
  var note=document.getElementById('comp-note').value.trim();
  var cat=document.getElementById('comp-cat').value;
  if(!url)return;
  var list=getStore('competitors');
  list.unshift({url:url,note:note,cat:cat,date:new Date().toLocaleDateString('it-IT')});
  setStore('competitors',list);
  document.getElementById('comp-url').value='';
  document.getElementById('comp-note').value='';
  renderComps();
}
function delComp(i){var list=getStore('competitors');list.splice(i,1);setStore('competitors',list);renderComps()}
renderComps();

// TODOS + PROGETTI
var editingTodo=null; // id della todo in editing
var currentProjectId=null;

function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}

function migrateTodosIfNeeded(){
  var projs=getStore('todo-projects');
  if(!Array.isArray(projs)||projs.length===0){
    projs=[{id:'cod-digital',name:'COD Digital',color:'#7c3aed',created:new Date().toISOString()}];
    setStore('todo-projects',projs);
  }
  var todos=getStore('todos');
  if(!Array.isArray(todos))todos=[];
  var changed=false;
  todos.forEach(function(t){
    if(!t.id){t.id='t_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6);changed=true}
    if(!t.projectId){t.projectId='cod-digital';changed=true}
  });
  if(changed)setStore('todos',todos);
}

function renderProjects(){
  var projs=getStore('todo-projects');
  var todos=getStore('todos');
  var html='';
  projs.forEach(function(p){
    var all=todos.filter(function(t){return t.projectId===p.id});
    var open=all.filter(function(t){return !t.done}).length;
    html+='<div class="proj-card" onclick="openProject(\''+p.id+'\')">'
      +'<div class="proj-color" style="background:'+(p.color||'#7c3aed')+'"></div>'
      +'<div class="proj-info"><div class="proj-name">'+escHtml(p.name)+'</div><div class="proj-meta">'+open+' aperte · '+all.length+' totali</div></div>'
      +'<button onclick="event.stopPropagation();delProject(\''+p.id+'\')" class="proj-del" title="Elimina progetto">&times;</button>'
      +'</div>';
  });
  document.getElementById('projects-grid').innerHTML=html||'<p style="color:var(--muted);font-size:13px;padding:20px;text-align:center">Nessun progetto. Crea il primo!</p>';
}

function addProject(){
  var name=document.getElementById('proj-name').value.trim();
  if(!name)return;
  var color=document.getElementById('proj-color').value||'#7c3aed';
  var projs=getStore('todo-projects');
  projs.unshift({id:'p_'+Date.now().toString(36),name:name,color:color,created:new Date().toISOString()});
  setStore('todo-projects',projs);
  document.getElementById('proj-name').value='';
  renderProjects();
}

function delProject(id){
  if(!confirm('Eliminare il progetto e tutte le sue attivita?'))return;
  var projs=getStore('todo-projects').filter(function(p){return p.id!==id});
  var todos=getStore('todos').filter(function(t){return t.projectId!==id});
  setStore('todo-projects',projs);
  setStore('todos',todos);
  renderProjects();
}

function openProject(id){
  currentProjectId=id;
  var proj=getStore('todo-projects').find(function(p){return p.id===id});
  if(!proj){backToProjects();return}
  document.getElementById('proj-title').textContent=proj.name;
  document.getElementById('proj-sub').textContent='Le tue attivita per questo progetto';
  var badge=document.getElementById('proj-badge');
  badge.textContent=proj.name;
  badge.style.background=proj.color||'#7c3aed';
  document.getElementById('todo-projects-view').style.display='none';
  document.getElementById('todo-project-detail').style.display='block';
  renderTodos();
}

function backToProjects(){
  currentProjectId=null;
  editingTodo=null;
  document.getElementById('todo-projects-view').style.display='block';
  document.getElementById('todo-project-detail').style.display='none';
  renderProjects();
}

function renderTodos(){
  if(!currentProjectId)return;
  var list=getStore('todos').filter(function(t){return t.projectId===currentProjectId});
  var html='';
  list.forEach(function(t){
    var priClass=t.pri==='alta'?'pri-alta':t.pri==='media'?'pri-media':'pri-bassa';
    if(editingTodo===t.id){
      html+='<div class="todo"><div class="todo__check'+(t.done?' done':'')+'" onclick="toggleTodo(\''+t.id+'\')"></div><div class="todo-edit-inline"><input type="text" id="edit-text-'+t.id+'" value="'+escHtml(t.text)+'" onkeydown="if(event.key===\'Enter\')saveTodo(\''+t.id+'\');if(event.key===\'Escape\')cancelEdit()"><select id="edit-pri-'+t.id+'"><option value="alta"'+(t.pri==='alta'?' selected':'')+'>Alta</option><option value="media"'+(t.pri==='media'?' selected':'')+'>Media</option><option value="bassa"'+(t.pri==='bassa'?' selected':'')+'>Bassa</option></select><button class="btn-save" onclick="saveTodo(\''+t.id+'\')">Salva</button><button class="btn-cancel" onclick="cancelEdit()">Annulla</button></div></div>';
    } else {
      html+='<div class="todo"><div class="todo__check'+(t.done?' done':'')+'" onclick="toggleTodo(\''+t.id+'\')"></div><span class="todo__priority '+priClass+'">'+t.pri+'</span><span class="todo__text'+(t.done?' done':'')+'" ondblclick="editTodo(\''+t.id+'\')">'+escHtml(t.text)+'</span><span class="todo__date">'+(t.date||'')+'</span><button class="todo__edit" onclick="editTodo(\''+t.id+'\')" title="Modifica">&#9998;</button><button class="todo__del" onclick="delTodo(\''+t.id+'\')">x</button></div>';
    }
  });
  document.getElementById('todo-list').innerHTML=html||'<p style="color:var(--muted);font-size:13px;padding:20px;text-align:center">Nessuna attivita. Aggiungi la prima!</p>';
  if(editingTodo){var el=document.getElementById('edit-text-'+editingTodo);if(el){el.focus();el.select()}}
}

function addTodo(){
  if(!currentProjectId)return;
  var text=document.getElementById('todo-text').value.trim();
  var pri=document.getElementById('todo-pri').value;
  if(!text)return;
  var list=getStore('todos');
  list.unshift({id:'t_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6),text:text,pri:pri,done:false,date:new Date().toLocaleDateString('it-IT'),projectId:currentProjectId});
  setStore('todos',list);
  document.getElementById('todo-text').value='';
  editingTodo=null;
  renderTodos();
}
function editTodo(id){editingTodo=id;renderTodos()}
function cancelEdit(){editingTodo=null;renderTodos()}
function saveTodo(id){
  var text=document.getElementById('edit-text-'+id).value.trim();
  if(!text){cancelEdit();return}
  var pri=document.getElementById('edit-pri-'+id).value;
  var list=getStore('todos');
  var t=list.find(function(x){return x.id===id});
  if(t){t.text=text;t.pri=pri}
  setStore('todos',list);
  editingTodo=null;renderTodos();
}
function toggleTodo(id){var list=getStore('todos');var t=list.find(function(x){return x.id===id});if(t){t.done=!t.done;setStore('todos',list);renderTodos()}}
function delTodo(id){var list=getStore('todos').filter(function(t){return t.id!==id});setStore('todos',list);renderTodos()}

renderProjects();

// CALENDAR
var calDate=new Date();var calSelected=null;
var months=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
var days=['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
function renderCal(){
  var y=calDate.getFullYear(),m=calDate.getMonth();
  document.getElementById('cal-month').textContent=months[m]+' '+y;
  var first=new Date(y,m,1).getDay();first=first===0?6:first-1;
  var daysInMonth=new Date(y,m+1,0).getDate();
  var today=new Date();var html='';
  days.forEach(function(d){html+='<div class="cal-day-label">'+d+'</div>'});
  for(var i=0;i<first;i++)html+='<div class="cal-day"></div>';
  var tasks=getStore('cal-tasks');
  for(var d=1;d<=daysInMonth;d++){
    var dateStr=y+'-'+(m+1<10?'0'+(m+1):(m+1))+'-'+(d<10?'0'+d:d);
    var isToday=d===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();
    var hasTask=tasks.some(function(t){return t.date===dateStr});
    html+='<div class="cal-day'+(isToday?' today':'')+(hasTask?' has-task':'')+'" data-date="'+dateStr+'" onclick="selectDay(\''+dateStr+'\')">'+d+'</div>';
  }
  document.getElementById('cal-grid').innerHTML=html;
}
function calNav(dir){if(dir===0)calDate=new Date();else calDate.setMonth(calDate.getMonth()+dir);renderCal()}
function selectDay(dateStr){
  calSelected=dateStr;
  document.getElementById('cal-detail-wrap').style.display='block';
  document.getElementById('cal-selected-date').textContent=dateStr.split('-').reverse().join('/');
  // Highlight selected day
  document.querySelectorAll('.cal-day').forEach(function(d){d.classList.remove('selected')});
  document.querySelectorAll('.cal-day').forEach(function(d){if(d.getAttribute('data-date')===dateStr)d.classList.add('selected')});
  var allTasks=getStore('cal-tasks');
  var tasks=[];
  allTasks.forEach(function(t,i){if(t.date===dateStr)tasks.push({text:t.text,idx:i})});
  var html='';
  tasks.forEach(function(t){
    if(calEditingTask===t.idx){
      html+='<div class="cal-task"><div class="cal-task-editing"><input type="text" id="cal-edit-input" value="'+t.text.replace(/"/g,'&quot;')+'" onkeydown="if(event.key===\'Enter\')saveCalTask('+t.idx+');if(event.key===\'Escape\')cancelCalEdit()"><button class="btn-save" onclick="saveCalTask('+t.idx+')">Salva</button><button class="btn-cancel" onclick="cancelCalEdit()">Annulla</button></div></div>';
    } else {
      html+='<div class="cal-task"><span class="cal-task__text" ondblclick="editCalTask('+t.idx+')">'+t.text+'</span><button class="cal-task__edit" onclick="editCalTask('+t.idx+')" title="Modifica">&#9998;</button><button class="cal-task__del" onclick="delCalTask('+t.idx+')">&times;</button></div>';
    }
  });
  document.getElementById('cal-tasks').innerHTML=html||'<p style="color:rgba(255,255,255,.2);font-size:12px">Nessuna task per questo giorno</p>';
  if(calEditingTask>=0){var el=document.getElementById('cal-edit-input');if(el){el.focus();el.select()}}
}
var calEditingTask=-1;
function editCalTask(i){calEditingTask=i;selectDay(calSelected)}
function cancelCalEdit(){calEditingTask=-1;selectDay(calSelected)}
function saveCalTask(i){
  var input=document.getElementById('cal-edit-input');
  var text=input?input.value.trim():'';
  if(!text){cancelCalEdit();return}
  var tasks=getStore('cal-tasks');
  tasks[i].text=text;
  setStore('cal-tasks',tasks);
  calEditingTask=-1;
  selectDay(calSelected);
}
function delCalTask(i){
  var tasks=getStore('cal-tasks');
  tasks.splice(i,1);
  setStore('cal-tasks',tasks);
  calEditingTask=-1;
  selectDay(calSelected);
  renderCal();
}
function addCalTask(){
  if(!calSelected)return;
  var text=document.getElementById('cal-task-text').value.trim();
  if(!text)return;
  var tasks=getStore('cal-tasks');
  tasks.push({date:calSelected,text:text});
  setStore('cal-tasks',tasks);
  document.getElementById('cal-task-text').value='';
  calEditingTask=-1;
  selectDay(calSelected);
  renderCal();
}
renderCal();

// NOTES
var noteColors=['#6366f1','#f472b6','#22c55e','#eab308','#ef4444','#06b6d4'];
function renderNotes(){
  var notes=getStore('notes'),html='';
  html+='<div class="note-add" onclick="addNote()"><div class="note-add__icon">+</div><div class="note-add__text">Nuova nota</div></div>';
  notes.forEach(function(n,i){
    var bg=n.color||noteColors[0];
    html+='<div class="note-card" style="border-left:3px solid '+bg+'">';
    html+='<div class="note-card__expand" onclick="event.stopPropagation();openNoteModal('+i+')" title="Apri a schermo intero">&#x26F6;</div>';
    html+='<div class="note-card__title" contenteditable="true" onblur="updateNote('+i+',\'title\',this.textContent)">'+n.title+'</div>';
    html+='<div class="note-card__body" contenteditable="true" onblur="updateNote('+i+',\'body\',this.textContent)">'+n.body+'</div>';
    html+='<div class="note-card__footer"><div class="note-card__date">'+n.date+'</div><div style="display:flex;gap:6px;align-items:center"><div class="note-card__color">';
    noteColors.forEach(function(c){html+='<div class="note-dot'+(n.color===c?' active':'')+'" style="background:'+c+'" onclick="updateNote('+i+',\'color\',\''+c+'\')"></div>'});
    html+='</div><button class="note-card__del" onclick="delNote('+i+')">x</button></div></div></div>';
  });
  document.getElementById('notes-grid').innerHTML=html;
}

var modalNoteIdx = -1;
function openNoteModal(i){
  modalNoteIdx = i;
  var notes = getStore('notes');
  var n = notes[i];
  document.getElementById('modal-note-title').textContent = n.title;
  document.getElementById('modal-note-body').value = n.body;
  document.getElementById('note-modal').classList.add('open');
  document.getElementById('modal-note-body').focus();
}
function closeNoteModal(){
  if(modalNoteIdx >= 0){
    var notes = getStore('notes');
    notes[modalNoteIdx].title = document.getElementById('modal-note-title').textContent;
    notes[modalNoteIdx].body = document.getElementById('modal-note-body').value;
    setStore('notes', notes);
    renderNotes();
  }
  modalNoteIdx = -1;
  document.getElementById('note-modal').classList.remove('open');
}
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeNoteModal()});
function addNote(){
  var notes=getStore('notes');
  notes.unshift({title:'Nuova nota',body:'Scrivi qui...',color:noteColors[0],date:new Date().toLocaleDateString('it-IT')});
  setStore('notes',notes);renderNotes();
}
function updateNote(i,field,val){
  var notes=getStore('notes');notes[i][field]=val;setStore('notes',notes);
  if(field==='color')renderNotes();
}
function delNote(i){var notes=getStore('notes');notes.splice(i,1);setStore('notes',notes);renderNotes()}
renderNotes();

// LOOM
var loomMembers=['Thomas','Samuele','Luca'];
function renderLooms(){
  var list=getStore('looms');
  var html='';
  list.forEach(function(l,i){
    html+='<div class="loom-card">';
    html+='<div class="loom-card__top"><div><div class="loom-card__title"><a href="'+l.url+'" target="_blank">'+l.title+'</a></div><div class="loom-card__date">'+l.date+'</div></div><button class="loom-card__del" onclick="delLoom('+i+')">&times;</button></div>';
    html+='<a class="loom-card__link" href="'+l.url+'" target="_blank">'+l.url+'</a>';
    html+='<div class="loom-card__views">';
    loomMembers.forEach(function(m){
      var checked=l.views&&l.views[m];
      html+='<div class="loom-view" onclick="toggleLoomView('+i+',\''+m+'\')">';
      html+='<div class="loom-view__check'+(checked?' checked':'')+'"></div>';
      html+='<span class="loom-view__name">'+m+'</span></div>';
    });
    html+='</div>';
    html+='<div class="loom-card__notes"><div class="loom-card__notes-label">Note</div><textarea id="loom-notes-'+i+'" onblur="saveLoomNotes('+i+')" placeholder="Appunti su questo video...">'+(l.notes||'')+'</textarea></div>';
    html+='</div>';
  });
  document.getElementById('loom-list').innerHTML=html||'<p style="color:var(--muted);font-size:13px;padding:20px;text-align:center">Nessun Loom aggiunto</p>';
}
function addLoom(){
  var url=document.getElementById('loom-url').value.trim();
  var title=document.getElementById('loom-title').value.trim()||'Loom senza titolo';
  if(!url)return;
  var list=getStore('looms');
  list.unshift({url:url,title:title,date:new Date().toLocaleDateString('it-IT'),views:{},notes:''});
  setStore('looms',list);
  document.getElementById('loom-url').value='';
  document.getElementById('loom-title').value='';
  renderLooms();
}
function delLoom(i){var list=getStore('looms');list.splice(i,1);setStore('looms',list);renderLooms()}
function toggleLoomView(i,member){
  var list=getStore('looms');
  if(!list[i].views)list[i].views={};
  list[i].views[member]=!list[i].views[member];
  setStore('looms',list);
  renderLooms();
}
function saveLoomNotes(i){
  var list=getStore('looms');
  var el=document.getElementById('loom-notes-'+i);
  if(el)list[i].notes=el.value;
  setStore('looms',list);
}
renderLooms();

// DRIVE LINKS
var driveProjects=['seg','nails','lash','fresh'];
function getDriveUrl(p){
  var raw=localStorage.getItem('drive-'+p);
  if(!raw) return '';
  try{var parsed=JSON.parse(raw);return typeof parsed==='string'?parsed:'';}
  catch(e){return raw;}
}
function renderDriveLinks(){
  var icon='<svg class="proj__drive-icon" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>';
  driveProjects.forEach(function(p){
    var el=document.getElementById('drive-'+p);if(!el)return;
    var url=getDriveUrl(p);
    if(url){
      el.innerHTML=icon+'<a class="proj__drive-link" href="'+url+'" target="_blank">Creative Google Drive</a><button class="proj__drive-btn-edit" onclick="editDriveLink(\''+p+'\')" title="Modifica">&#9998;</button>';
    } else {
      el.innerHTML=icon+'<div class="proj__drive-empty" onclick="editDriveLink(\''+p+'\')">+ Aggiungi link Google Drive Creative</div>';
    }
  });
}
function editDriveLink(p){
  var el=document.getElementById('drive-'+p);
  var url=getDriveUrl(p);
  el.innerHTML='<div class="proj__drive-edit"><input type="url" id="drive-input-'+p+'" value="'+url+'" placeholder="https://drive.google.com/..." onkeydown="if(event.key===\'Enter\')saveDriveLink(\''+p+'\')"><button class="proj__drive-btn-save" onclick="saveDriveLink(\''+p+'\')">Salva</button></div>';
  document.getElementById('drive-input-'+p).focus();
}
function saveDriveLink(p){
  var url=document.getElementById('drive-input-'+p).value.trim();
  setStore('drive-'+p, url);
  renderDriveLinks();
}
function loadDriveUrls(){renderDriveLinks()}
renderDriveLinks();

// FILE UPLOADER (server-side multipart)
(function(){
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function fmtSize(b){
    if(b<1024)return b+' B';
    if(b<1048576)return (b/1024).toFixed(1)+' KB';
    if(b<1073741824)return (b/1048576).toFixed(1)+' MB';
    return (b/1073741824).toFixed(2)+' GB';
  }
  function iconFor(name){
    var ext=(name.split('.').pop()||'').toLowerCase();
    if(['jpg','jpeg','png','gif','webp','svg','heic','avif','bmp','ico'].indexOf(ext)>-1)return '🖼️';
    if(['mp4','mov','avi','webm','mkv','m4v'].indexOf(ext)>-1)return '🎬';
    if(['mp3','wav','ogg','m4a','flac','aac'].indexOf(ext)>-1)return '🎵';
    if(ext==='pdf')return '📕';
    if(['doc','docx','odt','rtf'].indexOf(ext)>-1)return '📝';
    if(['xls','xlsx','csv','ods','numbers'].indexOf(ext)>-1)return '📊';
    if(['ppt','pptx','key','odp'].indexOf(ext)>-1)return '📊';
    if(['zip','rar','7z','tar','gz','bz2'].indexOf(ext)>-1)return '📦';
    if(['txt','md','log','json','yml','yaml','xml'].indexOf(ext)>-1)return '📄';
    if(['js','ts','jsx','tsx','html','htm','css','scss','py','go','rs','java','c','cpp','php','sh'].indexOf(ext)>-1)return '💻';
    if(['ai','psd','sketch','fig','xd'].indexOf(ext)>-1)return '🎨';
    return '📎';
  }
  function render(el, files){
    var key=el.dataset.project;
    var rows=files.length
      ? files.map(function(f){
          return '<div class="proj__file-row">'
            +'<span class="proj__file-icon">'+iconFor(f.name)+'</span>'
            +'<div class="proj__file-info">'
            +'<span class="proj__file-name" title="'+esc(f.name)+'">'+esc(f.name)+'</span>'
            +'<span class="proj__file-meta">'+fmtSize(f.size)+'</span>'
            +'</div>'
            +'<div class="proj__file-actions">'
            +'<a class="proj__file-btn" href="'+f.url+'" target="_blank" title="Apri">↗</a>'
            +'<a class="proj__file-btn" href="'+f.url+'" download="'+esc(f.name)+'" title="Scarica">⬇</a>'
            +'<button class="proj__file-btn proj__file-btn--del" data-del="'+esc(f.file)+'" title="Elimina">🗑</button>'
            +'</div>'
            +'</div>';
        }).join('')
      : '<div class="proj__files-empty">Nessun file caricato</div>';
    el.innerHTML=
      '<div class="proj__files-head"><span>📁 File di lavoro</span><span class="proj__files-count">'+files.length+'</span></div>'
      +'<label class="proj__files-drop"><input type="file" multiple style="display:none">'
      +'<span class="proj__files-drop-text"><strong>+ Carica file</strong> — clicca o trascina qui (immagini, PDF, video, documenti…)</span>'
      +'</label>'
      +'<div class="proj__files-list">'+rows+'</div>';
    var input=el.querySelector('input[type=file]');
    var drop=el.querySelector('.proj__files-drop');
    input.addEventListener('change',function(){ if(input.files.length) upload(el,input.files); });
    drop.addEventListener('dragover',function(e){e.preventDefault();drop.classList.add('dragover');});
    drop.addEventListener('dragleave',function(){drop.classList.remove('dragover');});
    drop.addEventListener('drop',function(e){
      e.preventDefault();drop.classList.remove('dragover');
      if(e.dataTransfer.files.length) upload(el,e.dataTransfer.files);
    });
    el.querySelectorAll('button[data-del]').forEach(function(b){
      b.addEventListener('click',function(){
        var name=b.closest('.proj__file-row').querySelector('.proj__file-name').textContent;
        if(!confirm('Eliminare "'+name+'" ?'))return;
        var fd=new FormData();
        fd.append('_method','DELETE');
        fd.append('project',key);
        fd.append('file',b.dataset.del);
        el.classList.add('proj__files-busy');
        fetch('files.php',{method:'POST',body:fd,credentials:'same-origin'})
          .then(function(){load(el);})
          .catch(function(){load(el);});
      });
    });
  }
  function load(el){
    var key=el.dataset.project;
    fetch('files.php?project='+encodeURIComponent(key),{credentials:'same-origin'})
      .then(function(r){return r.json();})
      .then(function(d){ el.classList.remove('proj__files-busy'); render(el, (d&&d.files)?d.files:[]); })
      .catch(function(){ el.classList.remove('proj__files-busy'); render(el, []); });
  }
  function upload(el, files){
    var key=el.dataset.project;
    var fd=new FormData();
    fd.append('project',key);
    for(var i=0;i<files.length;i++) fd.append('files[]', files[i]);
    var drop=el.querySelector('.proj__files-drop-text');
    if(drop) drop.innerHTML='<strong>Caricamento in corso…</strong>';
    el.classList.add('proj__files-busy');
    fetch('upload.php',{method:'POST',body:fd,credentials:'same-origin'})
      .then(function(r){return r.json();})
      .then(function(d){
        if(d && d.errors && d.errors.length){
          alert('Alcuni file bloccati:\n'+d.errors.map(function(e){return e.name+' ('+e.error+')';}).join('\n'));
        }
        load(el);
      })
      .catch(function(){load(el);});
  }
  document.querySelectorAll('.proj__files').forEach(load);
})();

// THEME TOGGLE
function toggleTheme(){
  var html=document.documentElement;
  var isLight=html.classList.contains('light');
  if(isLight){
    html.classList.remove('light');
    localStorage.setItem('theme','dark');
    document.getElementById('theme-icon').textContent='☀️';
    document.getElementById('theme-label').textContent='Tema Chiaro';
  } else {
    html.classList.add('light');
    localStorage.setItem('theme','light');
    document.getElementById('theme-icon').textContent='🌙';
    document.getElementById('theme-label').textContent='Tema Scuro';
  }
}
// Load saved theme
(function(){
  var saved=localStorage.getItem('theme');
  if(saved==='light'){
    document.documentElement.classList.add('light');
    document.getElementById('theme-icon').textContent='🌙';
    document.getElementById('theme-label').textContent='Tema Scuro';
  }
})();

// PUSH LOCAL STORAGE TO SERVER (recovery helper)
async function pushLocalToServer(btn){
  if(!confirm('Spingo TUTTI i dati di questo browser sul server. Gli altri browser verranno allineati a questi dati al prossimo reload. Continuare?')) return;
  var orig=btn.innerHTML;btn.innerHTML='⏳ Sincronizzando...';btn.style.pointerEvents='none';
  var skip={theme:1,'lead-cache':1,'adminScrollY':1};
  var keys=Object.keys(localStorage),count=0,errors=0,errDetails=[];
  for(var i=0;i<keys.length;i++){
    var k=keys[i];if(skip[k])continue;
    var raw=localStorage.getItem(k);var val;try{val=JSON.parse(raw)}catch(e){val=raw}
    try{
      var r=await fetch('api.php',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:k,value:val})});
      if(r.ok){count++}else{errors++;var body='';try{body=await r.text()}catch(e){}errDetails.push(k+' → HTTP '+r.status+' '+body.substring(0,80))}
    }catch(e){errors++;errDetails.push(k+' → '+(e.message||'network'))}
  }
  btn.innerHTML='✓ '+count+' sincronizzati'+(errors?' ('+errors+' errori)':'');
  btn.style.background='rgba(34,197,94,.15)';btn.style.color='#22c55e';btn.style.borderColor='rgba(34,197,94,.3)';
  if(errors) console.error('Sync errors:', errDetails);
  setTimeout(function(){btn.innerHTML=orig;btn.style.pointerEvents='';btn.style.background='';btn.style.color='';btn.style.borderColor=''},3500);
  if(errors) alert('Errori sincronizzazione (vedi Console):\n\n'+errDetails.slice(0,5).join('\n'));
}

// EXPORT DATA
function exportData(){
  var data={};
  for(var i=0;i<localStorage.length;i++){
    var k=localStorage.key(i);
    data[k]=localStorage.getItem(k);
  }
  var json=JSON.stringify(data,null,2);
  var blob=new Blob([json],{type:'application/json'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='workspace-export.json';
  a.click();
}

// SYNC FROM MYSQL
var __lastSyncHash='';
function pullFromServer(isInitial){
  return fetch('api.php?key=__all__',{credentials:'same-origin'}).then(function(r){return r.json()}).then(function(d){
    if(!d||typeof d!=='object')return;
    var hash=JSON.stringify(d);
    if(!isInitial && hash===__lastSyncHash) return;
    __lastSyncHash=hash;
    // Skip re-render if user is typing in an input/textarea
    var ae=document.activeElement;
    var isEditing=ae && (ae.tagName==='INPUT'||ae.tagName==='TEXTAREA'||ae.isContentEditable);
    Object.keys(d).forEach(function(k){try{localStorage.setItem(k,typeof d[k]==='string'?d[k]:JSON.stringify(d[k]))}catch(e){}});
    if(isInitial && typeof migrateTodosIfNeeded==='function')migrateTodosIfNeeded();
    if(isEditing && !isInitial) return;
    if(typeof renderProjects==='function'){if(currentProjectId){renderTodos()}else{renderProjects()}}
    if(typeof renderTools==='function')renderTools();
    if(typeof bilRender==='function')bilRender();
    if(typeof renderNotes==='function')renderNotes();
    if(typeof renderLooms==='function')renderLooms();
    if(typeof loadAdsFromStore==='function')loadAdsFromStore();
    if(typeof loadDriveUrls==='function')loadDriveUrls();
  }).catch(function(){});
}
pullFromServer(true);
// Live sync: poll server every 5s for changes from other browsers
setInterval(function(){pullFromServer(false)},5000);
// Also pull when tab regains focus (more responsive after context switch)
window.addEventListener('focus',function(){pullFromServer(false)});
// PANEL SWITCHER VISIBILITY
async function loadPanelsHidden(){
  try{
    const res=await fetch('panels-hidden.php?_t='+Date.now(),{cache:'no-store'});
    const data=await res.json();
    const hidden=Array.isArray(data.hidden)?data.hidden:[];
    const hSet={};hidden.forEach(function(h){hSet[String(h).toLowerCase()]=true});
    document.querySelectorAll('input[data-admin-host]').forEach(function(cb){
      cb.checked=!hSet[cb.dataset.adminHost.toLowerCase()];
    });
  }catch(e){}
}
async function togglePanelHost(cb){
  const label=cb.closest('.panel-toggle');
  if(label) label.classList.add('saving');
  const host=cb.dataset.adminHost.toLowerCase();
  const wantHidden=!cb.checked;
  try{
    const res=await fetch('panels-hidden.php?_t='+Date.now(),{cache:'no-store'});
    const data=await res.json();
    let hidden=Array.isArray(data.hidden)?data.hidden:[];
    hidden=hidden.map(function(h){return String(h).toLowerCase()}).filter(function(h){return h!==host});
    if(wantHidden) hidden.push(host);
    const post=await fetch('panels-hidden.php',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({hidden:hidden})});
    if(!post.ok) throw new Error('http '+post.status);
  }catch(e){
    cb.checked=!cb.checked;
    alert('Errore salvataggio: '+e.message);
  }finally{
    if(label) label.classList.remove('saving');
  }
}
loadPanelsHidden();
// SERVICE WORKER
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(function(){})}
</script>
</body>
</html>
