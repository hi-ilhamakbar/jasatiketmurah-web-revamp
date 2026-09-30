(() => {
  const root=document.querySelector('#flight-results');
  const sidebar=document.querySelector('.results-filter');
  if(!root||!sidebar)return;

  document.head.insertAdjacentHTML('beforeend',`<style>
    .results-filter details{border-top:1px solid #e2e8f0;padding:14px 0}.results-filter details:first-of-type{border-top:0}
    .results-filter summary{display:flex;justify-content:space-between;font-weight:800;cursor:pointer;list-style:none}.results-filter summary:after{content:"⌄";color:#64748b}.results-filter details:not([open]) summary:after{transform:rotate(-90deg)}
    .results-filter details>label{display:flex;align-items:center;gap:8px;margin-top:10px;color:#475569;font-size:.82rem}.results-filter input[type=radio],.results-filter input[type=checkbox]{accent-color:#1e3a8a}
    .time-filter{display:grid!important;grid-template-columns:1fr auto;gap:5px 10px!important;align-items:center;margin-top:12px!important}.time-filter>span{font-weight:700;color:#475569}.time-filter output{color:#1e3a8a;font-variant-numeric:tabular-nums}.time-range{grid-column:1/-1;position:relative;height:26px;--start:0%;--end:100%}.time-range:before{content:"";position:absolute;top:10px;right:0;left:0;height:5px;border-radius:999px;background:linear-gradient(to right,#dbe3ec 0 var(--start),#f5c518 var(--start) var(--end),#dbe3ec var(--end) 100%)}
    .time-range input[type=range]{position:absolute;top:0;left:0;width:100%;height:26px;margin:0;appearance:none;background:transparent;pointer-events:none}.time-range input[type=range]::-webkit-slider-runnable-track{height:5px;background:transparent}.time-range input[type=range]::-moz-range-track{height:5px;background:transparent}.time-range input[type=range]::-webkit-slider-thumb{width:17px;height:17px;margin-top:-6px;appearance:none;border:3px solid #fff;border-radius:50%;background:#1e3a8a;box-shadow:0 1px 5px rgba(15,23,42,.28);pointer-events:auto;cursor:grab}.time-range input[type=range]::-moz-range-thumb{width:11px;height:11px;border:3px solid #fff;border-radius:50%;background:#1e3a8a;box-shadow:0 1px 5px rgba(15,23,42,.28);pointer-events:auto;cursor:grab}
    .duration-filter{display:grid!important;gap:7px!important}.duration-filter output{color:#475569}.duration-filter input[type=range]{accent-color:#1e3a8a}.filter-options{display:grid;gap:7px;margin-top:10px;max-height:155px;overflow:auto}.filter-options label{display:flex;align-items:center;gap:7px;margin:0;font-size:.82rem}
  </style>`);

  const pad=value=>String(value).padStart(2,'0');
  const formatRange=(start,end)=>`${pad(start)}:00 – ${pad(end)}:59`;
  const buildTimeFilter=(startId,endId,labelText,outputId)=>{
    const start=document.querySelector(`#${startId}`);if(!start)return null;
    const label=start.closest('label'),output=document.querySelector(outputId),end=document.createElement('input'),range=document.createElement('div');
    end.id=endId;end.type='range';end.min='0';end.max='23';end.value='23';end.setAttribute('aria-label',`${labelText} paling akhir`);
    range.className='time-range';range.append(start,end);
    label.className='time-filter';label.replaceChildren(Object.assign(document.createElement('span'),{textContent:labelText}),output,range);
    start.setAttribute('aria-label',`${labelText} paling awal`);return {start,end,range,output};
  };
  const departure=buildTimeFilter('filter-departure-range','filter-departure-end','Berangkat','#filter-departure-time');
  const arrival=buildTimeFilter('filter-arrival-range','filter-arrival-end','Tiba','#filter-arrival-time');
  document.querySelector('#filter-duration')?.closest('label')?.classList.add('duration-filter');
  const syncRange=pair=>{if(!pair)return;let start=Number(pair.start.value),end=Number(pair.end.value);if(start>end){[start,end]=[end,start];pair.start.value=start;pair.end.value=end;}pair.range.style.setProperty('--start',`${(start/23)*100}%`);pair.range.style.setProperty('--end',`${(end/23)*100}%`);pair.output.textContent=formatRange(start,end);};
  const number=value=>{const match=String(value||'').match(/(\d+) jam(?: (\d+) menit)?|(\d+) menit/);return match?(Number(match[1]||0)*60+Number(match[2]||match[3]||0)):0};
  const hour=value=>{const match=String(value||'').match(/pukul (\d{1,2})\.(\d{2})/);return match?Number(match[1])+Number(match[2])/60:0};
  const state=()=>({stops:document.querySelector('[name="filter-stops"]:checked')?.value||'all',departure:[Number(departure?.start.value||0),Number(departure?.end.value||23)],arrival:[Number(arrival?.start.value||0),Number(arrival?.end.value||23)],duration:Number(document.querySelector('#filter-duration')?.value||2400),airlines:[...document.querySelectorAll('[data-airline-filter]:checked')].map(node=>node.value),layovers:[...document.querySelectorAll('[data-layover-filter]:checked')].map(node=>node.value)});
  const apply=()=>{const filter=state();root.querySelectorAll('.flight-result').forEach(card=>{const stops=(card.querySelector('.flight-details')?.querySelectorAll('.itinerary-leg').length||1)-1,main=card.children[1]?.textContent||'',details=card.querySelector('.flight-details')?.textContent||'',airline=card.querySelector('.airline-brand b')?.textContent||'',departureHour=hour(main),arrivalHour=hour([...card.querySelectorAll('.itinerary-leg strong')].at(-1)?.textContent||''),duration=number(main);card.hidden=!( (filter.stops==='all'||filter.stops==='direct'&&stops===0||filter.stops==='one-stop'&&stops<=1)&&departureHour>=filter.departure[0]&&departureHour<=filter.departure[1]&&arrivalHour>=filter.arrival[0]&&arrivalHour<=filter.arrival[1]&&duration<=filter.duration&&(!filter.airlines.length||filter.airlines.includes(airline))&&(!filter.layovers.length||filter.layovers.some(name=>details.includes(name))) );});};
  const options=()=>{const items=(selector,fn)=>[...new Set([...root.querySelectorAll(selector)].map(fn).filter(Boolean))].sort((a,b)=>a.localeCompare(b));const render=(target,list,attribute)=>{const node=document.querySelector(target);if(!node||node.dataset.ready)return;node.dataset.ready='1';node.innerHTML=list.map(item=>`<label><input type="checkbox" ${attribute} value="${item.replace(/"/g,'&quot;')}"> ${item}</label>`).join('')||'<small>Tidak ada pilihan</small>';};render('#filter-airlines',items('.airline-brand b',node=>node.textContent),'data-airline-filter');render('#filter-layovers',items('.itinerary-leg em',node=>node.textContent.replace(/^Transit\s+/,'').split(' · ')[0]),'data-layover-filter');};
  const update=()=>{syncRange(departure);syncRange(arrival);const duration=document.querySelector('#filter-duration'),output=document.querySelector('#filter-duration-value');if(duration&&output)output.textContent=Number(duration.value)>=2400?'Semua durasi':`Maks. ${Math.floor(Number(duration.value)/60)} jam`;apply();};
  sidebar.addEventListener('input',update);new MutationObserver(()=>{document.querySelectorAll('.filter-options').forEach(node=>delete node.dataset.ready);options();update();}).observe(root,{childList:true,subtree:true});options();update();
})();
