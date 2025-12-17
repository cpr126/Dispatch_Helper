// ==UserScript==
// @name            UniUni Dispatch - Multi-Function Tool v3.2.1
// @namespace       https://tampermonkey.net/
// @version         3.2.1
// @description     Matched button sizes, renamed storage button, and kept font-scaling.
// @match           https://dispatch.uniuni.com/main*
// @run-at          document-idle
// @grant           none
// ==/UserScript==

(function () {
  'use strict';

  let automationActive = false;
  let currentTab = 'parcel';

  /**********************
   * 1) Helpers & Utils
   **********************/
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const rClick = (el) => {
      if (!el) return;
      ['mousedown', 'mouseup', 'click'].forEach(t =>
          el.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window }))
      );
  };

  const getSetting = (key, defaultVal) => {
      const val = localStorage.getItem(key);
      return val === null ? defaultVal : val;
  };

  function showNotification(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 12px 24px; 
        background: ${type === 'success' ? '#10b981' : '#ef4444'}; 
        color: white; border-radius: 8px; z-index: 1000000; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-weight: bold;
        transition: opacity 0.5s ease; font-family: sans-serif;
    `;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 3000);
  }

  function makeDraggable(targetEl, handleEl) {
    let isDragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
    handleEl.style.cursor = 'move';
    const onMouseDown = (e) => {
      if (e.target.closest('button') || e.target.closest('input')) return;
      isDragging = true;
      startX = e.clientX; startY = e.clientY;
      const rect = targetEl.getBoundingClientRect();
      startLeft = rect.left; startTop = rect.top;
      targetEl.style.position = 'fixed';
      targetEl.style.right = 'auto'; targetEl.style.bottom = 'auto';
      targetEl.style.left = `${startLeft}px`; targetEl.style.top = `${startTop}px`;
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    };
    const onMouseMove = (e) => {
      if (!isDragging) return;
      targetEl.style.left = `${Math.min(Math.max(0, startLeft + (e.clientX - startX)), window.innerWidth - targetEl.offsetWidth)}px`;
      targetEl.style.top = `${Math.min(Math.max(0, startTop + (e.clientY - startY)), window.innerHeight - targetEl.offsetHeight)}px`;
    };
    const onMouseUp = () => { isDragging = false; document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); };
    handleEl.addEventListener('mousedown', onMouseDown);
  }

  /**********************
   * 2) Styles
   **********************/
  function injectStyles() {
    if (document.getElementById('amaxoffer-style')) return;
    const style = document.createElement('style');
    style.id = 'amaxoffer-style';
    style.textContent = `
      #amaxoffer-container {
        position: fixed; right: 18px; bottom: 18px; width: 400px; height: 600px;
        z-index: 999999; border-radius: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        background: rgba(20, 20, 22, 0.95); backdrop-filter: blur(10px); color: #fff;
        overflow: hidden; font-family: system-ui, -apple-system, sans-serif;
        border: 1px solid rgba(255,255,255,0.1); resize: both; display: flex; flex-direction: column;
        font-size: ${getSetting('uni_helper_font_size', '14')}px;
      }
      #amaxoffer-header { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.1); user-select: none; }
      .header-controls { display: flex; align-items: center; gap: 8px; }
      .icon-btn { background: rgba(255,255,255,0); border: none; color: white; cursor: pointer; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background 0.2s, opacity 0.2s; opacity: 0.8; }
      .icon-btn:hover { background: rgba(255,255,255,0.15); opacity: 1; }
      .icon-btn svg { width: 18px; height: 18px; fill: currentColor; }
      #amaxoffer-settings-panel { display: none; background: rgba(30, 30, 35, 0.98); padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); }
      .settings-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 0.8em; }
      .settings-input-field { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 4px; padding: 4px 8px; width: 80px; text-align: center; font-size: 1em; }
      #amaxoffer-nav { display: flex; background: rgba(0,0,0,0.2); padding: 5px; gap: 5px; border-bottom: 1px solid rgba(255,255,255,0.1); }
      .nav-btn { flex: 1; padding: 8px 2px; font-size: 0.7em; border-radius: 6px; border: none; background: rgba(255,255,255,0.05); color: #ccc; cursor: pointer; text-transform: uppercase; font-weight: bold; transition: 0.2s; }
      .nav-btn.active { background: #3b82f6; color: white; }
      #amaxoffer-body { flex-grow: 1; padding: 12px; overflow-y: auto; }
      .tab-content { display: none; }
      .tab-content.active { display: block; }
      .amaxoffer-section { border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); border-radius: 12px; padding: 12px; margin-bottom: 10px; }
      .status-highlight { color: #4ade80; font-weight: 700; font-size: 1.1em; margin-top: 2px; display: block; }
      .amaxoffer-btn { width: 100%; display: flex; align-items: center; justify-content: center; border-radius: 10px; border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.10); color: #fff; cursor: pointer; padding: 0.8em; font-weight: 600; font-size: 0.8em; margin-top: 5px; }
      
      /* Shared Mini Button Style */
      .amaxoffer-btn-mini { 
        width: auto; 
        padding: 4px 10px; 
        font-size: 0.65em; 
        background: #8b5cf6; 
        border: none; 
        border-radius: 6px; 
        text-transform: uppercase; 
        margin-top: 0;
        font-weight: bold;
        cursor: pointer;
      }
      
      .amaxoffer-btn-jump { background: #ef4444; border: none; color: white; margin-top: 8px; }
      
      /* CHECK ADDRESS now inherits the same size/style as SEND TO STORAGE */
      .amaxoffer-btn-check { 
        background: #10b981; 
        color: #fff; 
        display: none; 
      }
      
      #amaxoffer-container.amaxoffer-minimized { width: 230px !important; height: 48px !important; min-height: 48px !important; resize: none; }
      #amaxoffer-container.amaxoffer-minimized #amaxoffer-body, #amaxoffer-container.amaxoffer-minimized #amaxoffer-nav, #amaxoffer-container.amaxoffer-minimized #amaxoffer-settings-panel { display: none !important; }
    `;
    document.head.appendChild(style);
  }

  /**********************
   * 3) UI Injection
   **********************/
  function injectUI() {
    if (document.getElementById('amaxoffer-container')) return;
    const currentJumpID = getSetting('uni_jump_id', '196');
    const container = document.createElement('div');
    container.id = 'amaxoffer-container';
    container.innerHTML = `
      <div id="amaxoffer-header">
        <div style="font-weight: 700; font-size: 13px; white-space: nowrap; color: #e5e7eb;">Uni Helper by Peter C.</div>
        <div class="header-controls">
           <button id="settings-btn" class="icon-btn" title="Settings"><svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg></button>
           <button id="toggle-btn" class="icon-btn" title="Minimize/Maximize"><svg id="toggle-svg" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg></button>
        </div>
      </div>
      <div id="amaxoffer-settings-panel">
        <div class="settings-row"><span>Font Size</span><input type="range" id="font-size-slider" min="10" max="30" value="${getSetting('uni_helper_font_size', '14')}"><span id="font-size-value">${getSetting('uni_helper_font_size', '14')}px</span></div>
        <div class="settings-row"><span>Jump Target ID</span><input type="text" id="jump-id-input" class="settings-input-field" value="${currentJumpID}" placeholder="e.g. 196"></div>
        <div class="settings-row"><span>Show Time From 199</span><input type="checkbox" id="toggle-show-199" ${getSetting('uni_show_199', 'true') === 'true' ? 'checked' : ''}></div>
        <div class="settings-row"><span>Show Storage Info</span><input type="checkbox" id="toggle-show-storage" ${getSetting('uni_show_storage', 'true') === 'true' ? 'checked' : ''}></div>
        <div class="settings-row"><span>Show Phone Info</span><input type="checkbox" id="toggle-show-phone" ${getSetting('uni_show_phone', 'true') === 'true' ? 'checked' : ''}></div>
      </div>
      <div id="amaxoffer-nav">
        <button class="nav-btn active" data-tab="parcel">Parcel</button>
        <button class="nav-btn" data-tab="tno">TNO</button>
        <button class="nav-btn" data-tab="complaint">Complaint</button>
        <button class="nav-btn" data-tab="sd">SD Helper</button>
      </div>
      <div id="amaxoffer-body">
        <div id="tab-parcel" class="tab-content active">
          <button class="amaxoffer-btn" id="btn-edit-parcel" style="background: #3b82f6;">Edit Parcel Status</button>
          <div class="amaxoffer-section" style="margin-top:10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                 <span style="font-size: 0.7em; text-transform: uppercase; opacity: 0.5;">Active Tracking</span>
                 <button class="amaxoffer-btn-mini amaxoffer-btn-check" id="btn-check-address">CHECK ADDRESS</button>
              </div>
              <div id="gui-tracking-number" style="font-family: monospace; color: #60a5fa; font-weight: bold;">None</div>
              <div id="latest-status-area" style="margin-top: 12px; display: none;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-size: 0.7em; text-transform: uppercase; opacity: 0.5;">Latest Status</span>
                      <button class="amaxoffer-btn amaxoffer-btn-mini" id="btn-send-storage">SEND TO STORAGE</button>
                  </div>
                  <span id="gui-parcel-status" class="status-highlight">No Data</span>
                  <span id="gui-parcel-time" style="font-size: 0.8em; color: #cbd5e1; display: block; margin-top: 4px;"></span>
                  
                  <div id="box-time-199" style="display: none; margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05);"><span style="font-size: 0.7em; opacity: 0.5; text-transform: uppercase;">Time From 199</span><span id="gui-time-199" style="font-weight: 600; display: block;">N/A</span></div>
                  
                  <div id="box-storage-info" style="display: none; margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05);"><span style="font-size: 0.7em; opacity: 0.5; text-transform: uppercase;">Storage Info</span><span id="gui-storage-info" style="color: #facc15; font-weight: 600; display: block;">N/A</span></div>
                  
                  <div id="box-phone-info" style="display: none; margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05);">
                    <span style="font-size: 0.7em; opacity: 0.5; text-transform: uppercase;">Phone</span>
                    <span id="gui-phone-number" style="font-weight: 600; display: block;">N/A</span>
                    <span style="font-size: 0.7em; opacity: 0.5; text-transform: uppercase; margin-top: 4px; display: block;">Calls</span>
                    <span id="gui-calls-count" style="font-weight: 600; display: block;">N/A</span>
                  </div>

                  <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05);"><span style="font-size: 0.7em; opacity: 0.5; text-transform: uppercase;">Driver ID</span><span id="gui-driver-id" style="color: #facc15; font-weight: bold; display: block;">Searching...</span><button class="amaxoffer-btn amaxoffer-btn-jump" id="btn-jump-config">Jump to ${currentJumpID}</button></div>
              </div>
          </div>
          <button class="amaxoffer-btn" id="btn-refresh">Refresh Page</button>
        </div>
      </div>
    `;
    document.body.appendChild(container);
    makeDraggable(container, document.getElementById('amaxoffer-header'));
  }

  /**********************
   * 4) Logic
   **********************/
  const checkAddressLogic = () => {
    const pTags = document.querySelectorAll('p.MuiTypography-body2');
    let foundText = "";
    pTags.forEach(p => { if (p.textContent.includes("Address:")) foundText = p.textContent.replace("Address:", "").trim(); });
    if (foundText) { window.open(`https://www.google.com/search?q=${encodeURIComponent(foundText)}`, '_blank'); } 
    else { showNotification("Address not found in dialog", "error"); }
  };

  const scrapePage = () => {
    const paperCards = document.querySelectorAll('.MuiTimelineContent-root .MuiPaper-root');
    const driverRows = document.querySelectorAll('tr.MuiTableRow-root');
    const pTags = document.querySelectorAll('p.MuiTypography-body2');
    let data = { driver: "N/A", status: "N/A", time: "", ts: 0, storage: "N/A", t199: "N/A", tColor: "#4ade80", phone: "N/A", calls: "N/A" };

    driverRows.forEach(r => { if (r.querySelector('th')?.textContent.trim() === "Driver ID") data.driver = r.querySelector('td.MuiTableCell-alignLeft')?.textContent.trim() || "N/A"; });

    pTags.forEach(p => {
      const txt = p.textContent.trim();
      if (txt.includes("Storage Info:")) data.storage = txt.replace("Storage Info:", "").trim();
      if (txt.includes("Phone:")) data.phone = txt.replace("Phone:", "").trim();
      if (txt.includes("Calls:")) data.calls = txt.replace("Calls:", "").trim();
      if (txt.includes("Time From 199:")) {
          data.t199 = txt.replace("Time From 199:", "").trim();
          const days = parseInt(data.t199.match(/(\d+)\s*Day\(s\)/)?.[1] || 0);
          data.tColor = days >= 14 ? "#f87171" : (days >= 10 ? "#fb923c" : "#4ade80");
      }
    });

    paperCards.forEach(card => {
      const pElements = Array.from(card.querySelectorAll('p.MuiTypography-body2'));
      let cardStatus = null, cardTimeStr = null, cardTs = 0;
      pElements.forEach(p => {
        const text = p.textContent.trim();
        if (/^\d{3}:/.test(text)) cardStatus = text;
        if (/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(text)) {
            cardTimeStr = text;
            cardTs = new Date(text.replace(/-/g, '/')).getTime();
        }
      });
      if (cardStatus && cardTs > 0) {
        const cCode = cardStatus.split(':')[0];
        const oCode = data.status.split(':')[0];
        let shouldUpdate = false;
        if (data.status === "N/A") shouldUpdate = true;
        else if (cCode === "199" && oCode === "190") shouldUpdate = true;
        else if (cCode === "190" && oCode === "199") shouldUpdate = false;
        else if (cardTs > data.ts) shouldUpdate = true;
        else if (cardTs === data.ts && ((cCode === "202" && oCode === "200") || (cCode === "199" && oCode === "190"))) shouldUpdate = true;
        
        if (shouldUpdate) {
          data.ts = cardTs;
          data.time = cardTimeStr + (cardTimeStr.includes("UTC-8") ? "" : " (UTC-8)");
          data.status = cardStatus;
        }
      }
    });
    return data;
  };

  const jumpToConfigID = async () => {
    const targetID = getSetting('uni_jump_id', '196');
    const S1 = 'body > div.MuiDialog-root > div.MuiDialog-container.MuiDialog-scrollBody > div > div.MuiDialogContent-root.jss41.MuiDialogContent-dividers > form:nth-child(3) > div:nth-child(1) > div > div.MuiCollapse-container.MuiCollapse-entered > div > div > div > div > div > table > tbody > tr:nth-child(1) > td.MuiTableCell-root.MuiTableCell-body.MuiTableCell-alignRight > button';
    const S2 = 'body > div.MuiDialog-root.jss72 > div.MuiDialog-container.MuiDialog-scrollPaper > div > div.MuiDialogContent-root > span > span.MuiIconButton-label > input';
    try {
      const btn = document.querySelector(S1);
      if (!btn) { alert("Edit Parcel dialog must be open first."); return; }
      rClick(btn);
      let cb = null; for (let i = 0; i < 10; i++) { await sleep(200); cb = document.querySelector(S2); if (cb) break; }
      if (cb) { rClick(cb); await sleep(500); }
      const inp = document.querySelector('.jss50 .MuiInputBase-input') || document.querySelector('input[aria-invalid="false"]');
      if (inp) {
          inp.focus();
          Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(inp, targetID);
          ['input', 'change', 'blur'].forEach(ev => inp.dispatchEvent(new Event(ev, { bubbles: true })));
          await sleep(300);
      }
      const sub = document.querySelector('button.MuiButton-root.MuiButton-text.MuiButton-textPrimary');
      if (sub) { rClick(sub); showNotification(`Jump to ${targetID} completed!`); }
    } catch (e) { showNotification("Jump Sequence Failed", "error"); }
  };

  const handleStorageAutomation = async () => {
    if (automationActive) return;
    automationActive = true;
    const statusText = document.getElementById('gui-parcel-status').textContent;
    try {
        const trigger = document.querySelector('#nextTransition');
        if (!trigger) { automationActive = false; return; }
        rClick(trigger); await sleep(500);
        let childIdx = 0;
        if (statusText.includes("199:")) childIdx = 9;
        else if (statusText.includes("211:")) childIdx = 6;
        else if (statusText.includes("231:")) childIdx = 7;
        else if (statusText.includes("212:")) childIdx = 2;
        else childIdx = 8;
        const opt = document.querySelector(`#menu- ul > option:nth-child(${childIdx})`);
        if (opt) {
            rClick(opt); await sleep(400);
            rClick(document.querySelector('#nexttrasition_submit_timeout_button'));
            if (statusText.includes("211:")) {
                const reason = prompt("Storage Reason:");
                const textArea = document.querySelector('#nexttrasition_add_operationmemo_textfield');
                if (textArea && reason) {
                    textArea.focus();
                    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(textArea, reason);
                    ['input', 'change', 'blur'].forEach(ev => textArea.dispatchEvent(new Event(ev, { bubbles: true })));
                    await sleep(400); rClick(document.querySelector('#nexttrasition_submit_timeout_button'));
                }
            } else if (!statusText.includes("199:") && !statusText.includes("200:")) {
                await sleep(500);
                const confirm = document.querySelector('body > div.MuiDialog-root.jss72 button.MuiButton-textPrimary');
                if (confirm) rClick(confirm);
            }
        }
    } catch (e) { console.error('Storage Automation Failed', e); }
    automationActive = false;
  };

  function boot() {
    injectStyles(); injectUI();
    const container = document.getElementById('amaxoffer-container');
    const toggleSvg = document.getElementById('toggle-svg');
    const jumpBtn = document.getElementById('btn-jump-config');
    const checkBtn = document.getElementById('btn-check-address');
    const jumpInput = document.getElementById('jump-id-input');

    document.getElementById('toggle-btn').onclick = () => {
        container.classList.toggle('amaxoffer-minimized');
        const isMin = container.classList.contains('amaxoffer-minimized');
        toggleSvg.innerHTML = isMin ? '<path d="M4 4h16v16H4V4zm2 2v12h12V6H6z"/>' : '<path d="M19 13H5v-2h14v2z"/>';
    };

    document.getElementById('settings-btn').onclick = () => {
        const panel = document.getElementById('amaxoffer-settings-panel');
        panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    };

    document.getElementById('font-size-slider').oninput = (e) => {
        const size = e.target.value;
        container.style.fontSize = size + 'px';
        document.getElementById('font-size-value').textContent = size + 'px';
        localStorage.setItem('uni_helper_font_size', size);
    };

    document.getElementById('toggle-show-199').onchange = (e) => localStorage.setItem('uni_show_199', e.target.checked);
    document.getElementById('toggle-show-storage').onchange = (e) => localStorage.setItem('uni_show_storage', e.target.checked);
    document.getElementById('toggle-show-phone').onchange = (e) => localStorage.setItem('uni_show_phone', e.target.checked);

    jumpInput.oninput = (e) => {
        const val = e.target.value.trim();
        localStorage.setItem('uni_jump_id', val);
        jumpBtn.textContent = `Jump to ${val || '???'}`;
    };

    document.getElementById('btn-edit-parcel').onclick = () => {
        document.querySelector('#menu-edit-order > .MuiButton-label')?.click();
        setTimeout(() => { const snInput = document.querySelector('input#searchSN'); if (snInput) { snInput.focus(); snInput.select(); } }, 100);
    };

    checkBtn.onclick = checkAddressLogic;
    document.getElementById('btn-refresh').onclick = () => location.reload();
    document.getElementById('btn-send-storage').onclick = handleStorageAutomation;
    jumpBtn.onclick = jumpToConfigID;

    setInterval(() => {
      const sInp = document.querySelector('#searchSN');
      const targetID = getSetting('uni_jump_id', '196').trim();
      if (sInp && sInp.value.trim() && currentTab === 'parcel') {
        const d = scrapePage();
        document.getElementById('gui-tracking-number').textContent = sInp.value.trim();
        document.getElementById('gui-parcel-status').textContent = d.status;
        document.getElementById('gui-parcel-time').textContent = d.time;
        document.getElementById('gui-driver-id').textContent = d.driver;

        checkBtn.style.display = (d.status === "N/A" || d.status === "No Data") ? "none" : "block";

        const show199 = getSetting('uni_show_199', 'true') === 'true';
        const showStor = getSetting('uni_show_storage', 'true') === 'true';
        const showPhone = getSetting('uni_show_phone', 'true') === 'true';

        const tBox = document.getElementById('box-time-199');
        const sBox = document.getElementById('box-storage-info');
        const pBox = document.getElementById('box-phone-info');

        if (show199 && d.t199 !== "N/A") {
            document.getElementById('gui-time-199').textContent = d.t199;
            document.getElementById('gui-time-199').style.color = d.tColor;
            tBox.style.display = 'block';
        } else tBox.style.display = 'none';

        if (showStor && d.storage !== "N/A") {
            document.getElementById('gui-storage-info').textContent = d.storage;
            sBox.style.display = 'block';
        } else sBox.style.display = 'none';

        if (showPhone && d.phone !== "N/A") {
            document.getElementById('gui-phone-number').textContent = d.phone;
            const callVal = parseInt(d.calls) || 0;
            const callEl = document.getElementById('gui-calls-count');
            callEl.textContent = `${callVal} time(s)`;
            callEl.style.color = (callVal === 0) ? "#f87171" : "#fff";
            pBox.style.display = 'block';
        } else pBox.style.display = 'none';

        const showBtn = ["211", "212", "231", "202", "200", "199", "190"].some(code => d.status.includes(code));
        document.getElementById('btn-send-storage').style.display = showBtn ? "block" : "none";

        const driverClean = d.driver.trim();
        const isAlreadyMatched = driverClean !== "N/A" && driverClean.includes(targetID);
        jumpBtn.textContent = `Jump to ${targetID}`;
        jumpBtn.style.display = (driverClean !== "N/A" && !isAlreadyMatched) ? "flex" : "none";
        document.getElementById('latest-status-area').style.display = 'block';
      }
    }, 1000);
  }

  if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot);
})();
