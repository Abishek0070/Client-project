// ---------- helpers ----------
const $ = (id) => document.getElementById(id);
const FIELD_IDS = [
  'f_date','f_pickuptime','f_droptime','f_sno','f_custname','f_contact',
  'f_pickup','f_drop','f_round','f_rental','f_from','f_to','f_days','f_vehicle',
  'f_drivername','f_licence','f_openkm','f_closekm','f_totalkm',
  'f_amount','f_waiting','f_toll','f_parking','f_permit','f_totalamt'
];
const CHECKBOX_IDS = ['f_pickup','f_drop','f_round','f_rental'];

function todayStr(){
  const d = new Date();
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  return `${d.getFullYear()}-${mm}-${dd}`; // ISO format required by <input type="date">
}

// Converts the date input's ISO value (YYYY-MM-DD) to DD/MM/YYYY for display on the printed receipt/PDF.
function formatDateDisplay(iso){
  if(!iso) return '';
  const parts = iso.split('-');
  if(parts.length !== 3) return iso;
  const [y,m,d] = parts;
  return `${d}/${m}/${y}`;
}

function nextSerial(){
  let n = parseInt(localStorage.getItem('sivalayas_sno_counter') || '0', 10);
  n = n + 1;
  return n;
}

function loadDraft(){
  try{
    const raw = localStorage.getItem('sivalayas_draft');
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){ return null; }
}

function saveDraft(){
  const data = {};
  FIELD_IDS.forEach(id=>{
    const el = $(id);
    if(!el) return;
    data[id] = CHECKBOX_IDS.includes(id) ? el.checked : el.value;
  });
  localStorage.setItem('sivalayas_draft', JSON.stringify(data));
}

function applyData(data){
  if(!data) return;
  FIELD_IDS.forEach(id=>{
    const el = $(id);
    if(!el || !(id in data)) return;
    if(CHECKBOX_IDS.includes(id)) el.checked = data[id];
    else el.value = data[id];
  });
}

function initForm(){
  const draft = loadDraft();
  if(draft){
    applyData(draft);
  }
  if(!$('f_date').value) $('f_date').value = todayStr();
  if(!$('f_sno').value) $('f_sno').value = String(nextSerial()).padStart(4,'0');

  FIELD_IDS.forEach(id=>{
    const el = $(id);
    if(!el) return;
    el.addEventListener('input', saveDraft);
    el.addEventListener('change', saveDraft);
  });
}

function clearForm(){
  const keepSno = String(nextSerial()).padStart(4,'0');
  FIELD_IDS.forEach(id=>{
    const el = $(id);
    if(!el) return;
    if(CHECKBOX_IDS.includes(id)) el.checked = false;
    else el.value = '';
  });
  $('f_date').value = todayStr();
  $('f_sno').value = keepSno;
  localStorage.setItem('sivalayas_sno_counter', String(parseInt(keepSno,10)));
  saveDraft();
}

// ---------- PDF generation (matches the printed receipt layout) ----------
function buildPdf(){
  const { jsPDF } = window.jspdf;
  const W = 280, H = 183; // mm, ratio close to the physical receipt
  const doc = new jsPDF({ unit:'mm', format:[W,H], orientation:'landscape' });

  const NAVY = [22,51,110];
  const m = 6; // outer margin
  const x0 = m, y0 = m, x1 = W-m, y1 = H-m;

  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.6);
  doc.rect(x0,y0,x1-x0,y1-y0);

  // Column boundaries (left / right)
  const leftW = (x1-x0) * 0.63;
  const midW = (x1-x0) * 0.21;
  const xLeft = x0, xMid = x0+leftW, xNarrow = xMid+midW;
  doc.line(xMid, y0, xMid, y1);
  // xNarrow is only used inside the top block (to separate S.No/Drop from Date/Pickup);
  // in the body it merges with the mid column so there's no empty strip.

  // Top block (company + date/pickup + s.no/drop)
  const topH = 30;
  const yTop0 = y0, yTop1 = yTop0+topH;
  doc.line(x0, yTop1, x1, yTop1);
  doc.line(xNarrow, yTop0, xNarrow, yTop1);

  // Company text
  doc.setFont('helvetica','bold');
  doc.setFontSize(15);
  doc.setTextColor(...NAVY);
  doc.text('SIVALAYAS TRAVELS', xLeft+5, yTop0+9);
  doc.setFontSize(9.5);
  doc.text('Samanna Nagar, Vellalore Road,', xLeft+5, yTop0+15);
  doc.text('Podanur, CBE-- 641-023', xLeft+5, yTop0+20);
  doc.text('97514 56854, 98949 66225', xLeft+5, yTop0+25);

  // Date / Pickup mid cells
  const midRowH = topH/2;
  doc.line(xMid, yTop0+midRowH, xNarrow, yTop0+midRowH);
  labelValue(doc, 'Date', formatDateDisplay($('f_date').value), xMid+3, yTop0+2, xMid+3, yTop0+8);
  labelValue(doc, 'Pickup', $('f_pickuptime').value, xMid+3, yTop0+midRowH+2, xMid+3, yTop0+midRowH+8);

  // S.No / Drop narrow cells (parallel to Date / Pickup)
  doc.line(xNarrow, yTop0+midRowH, x1, yTop0+midRowH);
  labelValue(doc, 'S. No', $('f_sno').value, xNarrow+3, yTop0+2, xNarrow+3, yTop0+8);
  labelValue(doc, 'Drop', $('f_droptime').value, xNarrow+3, yTop0+midRowH+2, xNarrow+3, yTop0+midRowH+8);

  // ---- LEFT column rows ----
  let ly = yTop1;
  const leftRows = [
    {h:8, draw:(y)=> labelValue(doc,'Customer Name:', $('f_custname').value, xLeft+3, y+1.5, xLeft+34, y+5.5, true)},
    {h:8, draw:(y)=> labelValue(doc,'Contact Number:', $('f_contact').value, xLeft+3, y+1.5, xLeft+34, y+5.5, true)},
    {h:8, draw:(y)=> tripRow(y)},
    {h:20, draw:(y)=> { doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.text('FROM:', xLeft+3, y+5);
      doc.setFont('helvetica','normal'); doc.setFontSize(9);
      wrapText(doc, $('f_from').value, xLeft+3, y+10, leftW-8, 4); } },
    {h:14, draw:(y)=> { doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.text('TO:', xLeft+3, y+5);
      doc.setFont('helvetica','normal'); doc.setFontSize(9);
      wrapText(doc, $('f_to').value, xLeft+3, y+9.5, leftW-8, 3.5); } },
    {h:8, draw:(y)=> labelValue(doc,'No. of days:', $('f_days').value, xLeft+3, y+1.3, xLeft+28, y+5, true)},
    {h:8, draw:(y)=> labelValue(doc,'Vehicle Reg No:', $('f_vehicle').value, xLeft+3, y+1.3, xLeft+34, y+5, true)},
    {h:8, draw:(y)=> labelValue(doc,'Driver Name:', $('f_drivername').value, xLeft+3, y+1.3, xLeft+30, y+5, true)},
    {h:8, draw:(y)=> labelValue(doc,'Licence/Badge Number:', $('f_licence').value, xLeft+3, y+1.3, xLeft+45, y+5, true)},
  ];
  leftRows.forEach(r=>{
    doc.line(xLeft, ly, xMid, ly);
    r.draw(ly);
    ly += r.h;
  });
  doc.line(xLeft, ly, xMid, ly);
  if(ly < y1) doc.line(xLeft, y1, xMid, y1);

  function tripRow(y){
    const boxes = [
      {label:'Pick Up', on: $('f_pickup').checked},
      {label:'Drop', on: $('f_drop').checked},
      {label:'Round Trip', on: $('f_round').checked},
      {label:'Rental', on: $('f_rental').checked},
    ];
    let bx = xLeft+3;
    boxes.forEach(b=>{
      doc.setDrawColor(...NAVY);
      doc.rect(bx, y+1.5, 3, 3);
      if(b.on){
        doc.setFont('helvetica','bold');
        doc.text('X', bx+0.5, y+4);
      }
      doc.setFont('helvetica','normal');
      doc.setFontSize(9);
      doc.text(b.label, bx+4.5, y+4.2);
      bx += 4.5 + doc.getTextWidth(b.label) + 6;
    });
  }

  // ---- RIGHT column rows (mid + former narrow column merged, no empty strip) ----
  let my = yTop1;
  const rightW = x1 - xMid;
  const midRows = [
    {label:'Opening KM', val:$('f_openkm').value},
    {label:'Closing KM', val:$('f_closekm').value},
    {label:'Total KM', val:$('f_totalkm').value},
    {label:'Amount', val:$('f_amount').value},
    {label:'Waiting Time', val:$('f_waiting').value},
    {label:'Toll Gate:', val:$('f_toll').value},
    {label:'Parking:', val:$('f_parking').value},
    {label:'Permit:', val:$('f_permit').value},
    {label:'Total Amount', val:$('f_totalamt').value},
  ];
  const rowH = (y1 - yTop1) / midRows.length;
  midRows.forEach(r=>{
    doc.line(xMid, my, x1, my);
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
    doc.text(r.label, xMid+3, my+4);
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    doc.text(String(r.val||''), xMid+3, my+rowH-2);
    my += rowH;
  });
  doc.line(xMid, my, x1, my);
  void rightW;

  doc.save(`Sivalayas_Receipt_${$('f_sno').value || 'draft'}.pdf`);
  return doc;
}

function labelValue(doc, label, value, lx, ly, vx, vy, sameLine){
  doc.setFont('helvetica','bold');
  doc.setFontSize(8.5);
  doc.text(label, lx, ly+3.5);
  doc.setFont('helvetica','normal');
  doc.setFontSize(9);
  doc.text(String(value||''), vx, vy);
}

function wrapText(doc, text, x, y, maxW, lineH){
  if(!text) return;
  const lines = doc.splitTextToSize(text, maxW);
  lines.slice(0,3).forEach((line,i)=> doc.text(line, x, y+i*lineH));
}

// ---------- events ----------
window.addEventListener('DOMContentLoaded', ()=>{
  initForm();

  $('newBillBtn').addEventListener('click', ()=>{
    if(confirm('Start a new bill? This clears the current form (a new S.No will be assigned).')){
      clearForm();
    }
  });

  $('downloadBtn').addEventListener('click', ()=>{
    saveDraft();
    localStorage.setItem('sivalayas_sno_counter', String(parseInt($('f_sno').value,10) || nextSerial()));
    buildPdf();
  });

  const shareBtn = $('shareBtn');
  if(navigator.share){
    shareBtn.style.display = 'flex';
    shareBtn.addEventListener('click', async ()=>{
      try{
        const doc = buildPdfBlobOnly();
        const blob = doc.output('blob');
        const file = new File([blob], `Sivalayas_Receipt_${$('f_sno').value||'draft'}.pdf`, {type:'application/pdf'});
        if(navigator.canShare && navigator.canShare({files:[file]})){
          await navigator.share({files:[file], title:'Sivalayas Travels Receipt'});
        } else {
          buildPdf();
        }
      }catch(e){ /* user cancelled share or unsupported */ }
    });
  }

  function buildPdfBlobOnly(){
    return buildPdfNoSave();
  }

  // Install tip: show if not already installed/standalone
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if(!isStandalone){
    $('installTip').classList.add('show');
  }

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
});

// A non-saving variant of buildPdf, sharing the same drawing code.
function buildPdfNoSave(){
  const savedFn = window.jspdf.jsPDF.prototype.save;
  window.jspdf.jsPDF.prototype.save = function(){ return this; };
  const doc = buildPdf();
  window.jspdf.jsPDF.prototype.save = savedFn;
  return doc;
}