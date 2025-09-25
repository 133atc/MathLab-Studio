
const themeBtn = document.getElementById('themeBtn');
themeBtn.addEventListener('click', () => {
  const b = document.body;
  const cur = b.getAttribute('data-theme');
  b.setAttribute('data-theme', cur === 'light' ? 'dark' : 'light');
});

const tabCalc = document.getElementById('tab-calc');
const tabConv  = document.getElementById('tab-conv');
const paneCalc = document.getElementById('pane-calc');
const paneConv = document.getElementById('pane-conv');
let activeTab  = 'calc';

function selectTab(which){
  activeTab = which;
  const isCalc = which === 'calc';
  tabCalc.setAttribute('aria-selected', String(isCalc));
  tabConv.setAttribute('aria-selected', String(!isCalc));
  paneCalc.setAttribute('aria-hidden', String(!isCalc));
  paneConv.setAttribute('aria-hidden', String(isCalc));
}
tabCalc.addEventListener('click', () => selectTab('calc'));
tabConv.addEventListener('click', () => selectTab('conv'));


const kb      = document.getElementById('kbHelp');
const kbClose = kb.querySelector('[data-close]');
function openKB(){
  kb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  kbClose.focus();
}
function closeKB(){
  kb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
kb.addEventListener('click', (e) => { if (e.target === kb) closeKB(); });
kbClose.addEventListener('click', closeKB);

document.getElementById('kbBtn')?.addEventListener('click', openKB);


const Calc = (() => {
  const root     = document.getElementById('calc');
  const pads     = root.querySelector('[data-pads]');
  const exprEl   = root.querySelector('[data-expr]');
  const resultEl = root.querySelector('[data-result]');
  const modeBtn  = root.querySelector('[data-action="mode"]');
  const modeLabel= root.querySelector('[data-mode]');

  let mode = 'DEG';
  modeBtn.addEventListener('click', () => {
    mode = mode === 'DEG' ? 'RAD' : 'DEG';
    modeLabel.textContent = mode;
  });

  
  const tokens = [];
  const OP = { add: '+', subtract: '-', multiply: '*', divide: '/', power: '^' };
  const OP_DISPLAY = { '+': '+', '-': '−', '*': '×', '/': '÷', '^': '^' };
  const PRECEDENCE = { '+':1, '-':1, '*':2, '/':2, '^':3 };
  const RIGHT_ASSOC = { '^': true };

  const last = () => tokens[tokens.length - 1];
  const isAtomic = (t) => t && (t.type === 'number' || t.type === 'const' || t.type === 'rparen');

  function updateDisplay(){
    const parts = tokens.map(t => {
      if (t.type === 'number') return t.value;
      if (t.type === 'op')     return OP_DISPLAY[t.value] ?? t.value;
      if (t.type === 'lparen') return '(';
      if (t.type === 'rparen') return ')';
      if (t.type === 'const')  return t.value === 'pi' ? 'π' : 'e';
      if (t.type === 'func')   return t.value + ' (';
      if (t.type === 'postfix')return t.value;
      return '?';
    });
    exprEl.textContent = parts.join(' ').replace(/\( /g,'(').replace(/ \)/g,')');
    if (!parts.length) resultEl.textContent = '0';
  }

  function pushImplicitMultiplyIfNeeded(nextKind){
    const prev = last();
    const nextIsAtomicStart =
      (nextKind === 'number' || nextKind === 'const' || nextKind === 'lparen' || nextKind === 'func');
    if (isAtomic(prev) && nextIsAtomicStart) tokens.push({ type: 'op', value: '*' });
  }

  
  function clearAll(){ tokens.length = 0; updateDisplay(); }
  function backspace(){
    const t = last();
    if (!t) return;
    if (t.type === 'number') {
      if (t.value.length > 1) t.value = t.value.slice(0, -1); else tokens.pop();
    } else if (t.type === 'func') {
      tokens.pop(); if (last() && last().type === 'lparen') tokens.pop();
    } else { tokens.pop(); }
    updateDisplay();
  }

 
  function inputDigit(d){
    const t = last();
    if (!t || t.type !== 'number') { pushImplicitMultiplyIfNeeded('number'); tokens.push({ type:'number', value:d }); }
    else t.value = (t.value === '0') ? d : (t.value + d);
    updateDisplay();
  }
  function inputDecimal(){
    const t = last();
    if (!t || t.type !== 'number') { pushImplicitMultiplyIfNeeded('number'); tokens.push({ type:'number', value:'0.' }); }
    else if (!t.value.includes('.')) t.value += '.';
    updateDisplay();
  }
  function inputOperator(opKey){
    const symbol = OP[opKey]; if (!symbol) return;
    const t = last();
    if (t && (t.type === 'op' || t.type === 'func')) { if (t.type === 'op') t.value = symbol; }
    else if (t) tokens.push({ type:'op', value:symbol });
    updateDisplay();
  }
  function inputParen(p){
    if (p === '(') { pushImplicitMultiplyIfNeeded('lparen'); tokens.push({type:'lparen', value:'('}); }
    else {
      const opens = tokens.filter(x => x.type === 'lparen').length; // count only '('
      const closes = tokens.filter(x => x.type === 'rparen').length;
      if (opens > closes && isAtomic(last())) tokens.push({type:'rparen', value:')'});
    }
    updateDisplay();
  }
  function inputConst(symbol){
    const value = symbol === 'pi' ? 'pi' : 'e';
    pushImplicitMultiplyIfNeeded('const'); tokens.push({type:'const', value}); updateDisplay();
  }
  function negateLastNumber(){
    const t = last();
    if (t && t.type === 'number') t.value = t.value.startsWith('-') ? t.value.slice(1) : '-' + t.value;
    else { pushImplicitMultiplyIfNeeded('number'); tokens.push({type:'number', value:'-1'},{type:'op', value:'*'}); }
    updateDisplay();
  }
  
  function inputFunction(name){ pushImplicitMultiplyIfNeeded('func'); tokens.push({type:'func', value:name},{type:'lparen', value:'('}); updateDisplay(); }
  function inputPowShortcut(kind){ if (!isAtomic(last())) return; const p = kind==='square'?'2':'3'; tokens.push({type:'op', value:'^'},{type:'number', value:p}); updateDisplay(); }
  function inputInv(){ if (!isAtomic(last())) return; tokens.push({type:'op', value:'^'},{type:'number', value:'-1'}); updateDisplay(); }
  function inputFactorial(){ if (!isAtomic(last())) return; tokens.push({type:'postfix', value:'!'}); updateDisplay(); }
  function inputPercent(){ if (!isAtomic(last())) return; tokens.push({type:'postfix', value:'%'}); updateDisplay(); }

  
  function formatNumber(n){
    if (typeof n !== 'number' || !isFinite(n)) return 'Error';
    const abs = Math.abs(n);
    if (abs !== 0 && (abs < 1e-9 || abs >= 1e12)) return n.toExponential(8).replace(/\.?0+e/,'e');
    return parseFloat(n.toPrecision(12)).toString();
  }
  const constValue = (name) => (name === 'pi' ? Math.PI : Math.E);
  const toRad = (x) => mode === 'DEG' ? (x * Math.PI / 180) : x;
  function factorial(n){
    if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) throw new Error('n! needs a non-negative integer');
    if (n > 170) throw new Error('Overflow'); let r = 1; for (let i=2;i<=n;i++) r*=i; return r;
  }

  
  function toRPN(tok){
    const out=[], stack=[];
    for (const t of tok){
      if (t.type === 'number') out.push({type:'number', value:t.value});
      else if (t.type === 'const') out.push({type:'number', value:String(constValue(t.value))});
      else if (t.type === 'postfix') out.push({type:'postfix', value:t.value});
      else if (t.type === 'func') stack.push(t);
      else if (t.type === 'op'){
        const o1=t.value;
        while (stack.length){
          const top=stack[stack.length-1];
          if (top.type!=='op') break;
          const o2=top.value;
          const higher=PRECEDENCE[o2]>PRECEDENCE[o1];
          const equalLeft=PRECEDENCE[o2]===PRECEDENCE[o1] && !RIGHT_ASSOC[o1];
          if (higher || equalLeft) out.push(stack.pop()); else break;
        }
        stack.push({type:'op', value:o1});
      } else if (t.type === 'lparen') stack.push(t);
      else if (t.type === 'rparen'){
        let found=false;
        while (stack.length){
          const top=stack.pop();
          if (top.type==='lparen'){ found=true; break; }
          out.push(top);
        }
        if (!found) throw new Error('Mismatched parentheses');
        if (stack.length && stack[stack.length-1].type==='func') out.push(stack.pop());
      }
    }
    while (stack.length){
      const top=stack.pop();
      if (top.type==='lparen' || top.type==='rparen') throw new Error('Mismatched parentheses');
      out.push(top);
    }
    return out;
  }
  
  function evalRPN(rpn){
    const st=[];
    for (const t of rpn){
      if (t.type==='number') st.push(parseFloat(t.value));
      else if (t.type==='op'){
        const b=st.pop(), a=st.pop(); if (a===undefined||b===undefined) throw new Error('Invalid expression');
        switch(t.value){
          case '+': st.push(a+b); break;
          case '-': st.push(a-b); break;
          case '*': st.push(a*b); break;
          case '/': if (b===0) throw new Error('Cannot divide by 0'); st.push(a/b); break;
          case '^': st.push(Math.pow(a,b)); break;
          default: throw new Error('Unknown operator');
        }
      } else if (t.type==='postfix'){
        const a=st.pop(); if (a===undefined) throw new Error('Invalid expression');
        if (t.value==='!') st.push(factorial(a));
        else if (t.value==='%') st.push(a/100);
        else throw new Error('Unknown postfix');
      } else if (t.type==='func'){
        const a=st.pop(); if (a===undefined) throw new Error('Invalid expression');
        switch (t.value){
          case 'sin': st.push(Math.sin(toRad(a))); break;
          case 'cos': st.push(Math.cos(toRad(a))); break;
          case 'tan': st.push(Math.tan(toRad(a))); break;
          case 'ln':  if (a<=0) throw new Error('ln domain error'); st.push(Math.log(a)); break;
          case 'log10': if (a<=0) throw new Error('log domain error'); st.push(Math.log10?Math.log10(a):Math.log(a)/Math.log(10)); break;
          case 'sqrt': if (a<0) throw new Error('√ domain error'); st.push(Math.sqrt(a)); break;
          default: throw new Error('Unknown function');
        }
      } else throw new Error('Unexpected token');
    }
    if (st.length!==1) throw new Error('Invalid expression'); return st[0];
  }
  function evaluate(){
    try{
      if (!tokens.length) return;
      const opens = tokens.filter(x => x.type === 'lparen').length; // only '('
      const closes = tokens.filter(x => x.type === 'rparen').length;
      const extra = opens - closes;
      const evalTokens = tokens.slice(); for (let i=0;i<extra;i++) evalTokens.push({type:'rparen', value:')'});
      const rpn = toRPN(evalTokens);
      const value = evalRPN(rpn);
      resultEl.textContent = formatNumber(value);
    } catch(err){ resultEl.textContent = err.message || 'Error'; }
  }

  
  pads.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const { action } = btn.dataset;
    if (action==='digit') return inputDigit(btn.dataset.digit);
    if (action==='decimal') return inputDecimal();
    if (action==='operator') return inputOperator(btn.dataset.operator);
    if (action==='paren') return inputParen(btn.dataset.paren);
    if (action==='const') return inputConst(btn.dataset.symbol);
    if (action==='negate') return negateLastNumber();
    if (action==='backspace') return backspace();
    if (action==='clear') return clearAll();
    if (action==='percent') return inputPercent();
    if (action==='equal') return evaluate();
    if (action==='func'){
      const fn=btn.dataset.fn;
      if (fn==='inv') return inputInv();
      if (fn==='fact') return inputFactorial();
      return inputFunction(fn);
    }
    if (action==='pow') return inputPowShortcut(btn.dataset.op);
  });

  
  function onKeydown(e){
    const k=e.key;
    if (k>='0' && k<='9') return inputDigit(k);
    if (k==='.'){ e.preventDefault(); return inputDecimal(); }
    if (k==='+'||k==='-'||k==='*'||k==='/'||k==='^'){
      e.preventDefault();
      const map={'+':'add','-':'subtract','*':'multiply','/':'divide','^':'power'};
      return inputOperator(map[k]);
    }
    if (k==='('||k===')'){ e.preventDefault(); return inputParen(k); }
    if (k==='Backspace'){ e.preventDefault(); return backspace(); }
    if (k==='Delete'){ e.preventDefault(); return clearAll(); }
    if (k==='Enter' || k==='='){ e.preventDefault(); return evaluate(); }
  }

  updateDisplay();
  return { onKeydown };
})();


const Conv = (() => {
  const root       = document.getElementById('conv');
  const categoryEl = root.querySelector('#category');
  const amountEl   = root.querySelector('#amount');
  const fromEl     = root.querySelector('#fromUnit');
  const toEl       = root.querySelector('#toUnit');
  const resultEl   = root.querySelector('#result');
  const metaEl     = root.querySelector('#meta');
  root.querySelector('#swapBtn').addEventListener('click', () => {
    const a=fromEl.value; fromEl.value = toEl.value; toEl.value = a; recalc();
  });

  const REGISTRY = {
    length: { base:'m', units:{ 'nm':{factor:1e-9}, 'mm':{factor:1e-3}, 'cm':{factor:1e-2}, 'm':{factor:1}, 'km':{factor:1e3}, 'in':{factor:0.0254}, 'ft':{factor:0.3048}, 'yd':{factor:0.9144}, 'mi':{factor:1609.344}, 'nmi':{factor:1852} } },
    mass:   { base:'kg', units:{ 'mg':{factor:1e-6}, 'g':{factor:1e-3}, 'kg':{factor:1}, 't':{factor:1e3}, 'oz':{factor:0.028349523125}, 'lb':{factor:0.45359237} } },
    temperature: { base:'K', units:{ 'C':{toBase:v=>v+273.15, fromBase:v=>v-273.15}, 'K':{toBase:v=>v, fromBase:v=>v}, 'F':{toBase:v=>(v-32)*5/9+273.15, fromBase:v=>(v-273.15)*9/5+32} } },
    speed:  { base:'m/s', units:{ 'm/s':{factor:1}, 'km/h':{factor:1000/3600}, 'mph':{factor:1609.344/3600}, 'knot':{factor:1852/3600} } },
    area:   { base:'m²', units:{ 'mm²':{factor:1e-6}, 'cm²':{factor:1e-4}, 'm²':{factor:1}, 'km²':{factor:1e6}, 'ft²':{factor:0.09290304}, 'in²':{factor:0.00064516}, 'acre':{factor:4046.8564224}, 'ha':{factor:10000} } },
    volume: { base:'m³', units:{ 'mL':{factor:1e-6}, 'L':{factor:1e-3}, 'm³':{factor:1}, 'ft³':{factor:0.028316846592}, 'in³':{factor:0.000016387064}, 'gal(US)':{factor:0.003785411784} } },
    time:   { base:'s', units:{ 'ms':{factor:1e-3}, 's':{factor:1}, 'min':{factor:60}, 'h':{factor:3600}, 'day':{factor:86400}, 'week':{factor:604800} } },
    data:   { base:'B', units:{ 'KB':{factor:1e3}, 'MB':{factor:1e6}, 'GB':{factor:1e9}, 'TB':{factor:1e12}, 'KiB':{factor:1024}, 'MiB':{factor:1024**2}, 'GiB':{factor:1024**3}, 'TiB':{factor:1024**4}, 'B':{factor:1} } },
    energy: { base:'J', units:{ 'J':{factor:1}, 'kJ':{factor:1e3}, 'Wh':{factor:3600}, 'kWh':{factor:3.6e6}, 'cal':{factor:4.184}, 'kcal':{factor:4184}, 'BTU':{factor:1055.05585262} } },
    pressure:{ base:'Pa', units:{ 'Pa':{factor:1}, 'kPa':{factor:1e3}, 'bar':{factor:1e5}, 'atm':{factor:101325}, 'mmHg':{factor:133.3223684211}, 'psi':{factor:6894.757293168} } },
    currency: { base: 'USD', rates: {}, asUnits(){ const u={}; for (const c of Object.keys(this.rates)) u[c]={factor:this.rates[c]}; return u; } }
  };

  
  const FX_CACHE_KEY='fx_rates_v1', FX_DEFAULT_BASE='USD';
  async function loadLiveRates(base=FX_DEFAULT_BASE){
    const url=`https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(base)}`;
    const resp=await fetch(url,{cache:'no-store'}); if(!resp.ok) throw new Error('FX fetch failed');
    const data=await resp.json();
    const rates={...data.rates, [base]:1};
    REGISTRY.currency.base=data.base||base; REGISTRY.currency.rates=rates;
    localStorage.setItem(FX_CACHE_KEY, JSON.stringify({base:REGISTRY.currency.base, date:data.date, rates}));
    return {base:REGISTRY.currency.base, date:data.date, rates, source:'live'};
  }
  function loadCachedRates(){
    const raw=localStorage.getItem(FX_CACHE_KEY); if(!raw) return null;
    try{ const cached=JSON.parse(raw);
         REGISTRY.currency.base=cached.base||FX_DEFAULT_BASE;
         REGISTRY.currency.rates=cached.rates||{};
         return {...cached, source:'cache'};
    } catch{ return null; }
  }
  async function ensureRates(base=FX_DEFAULT_BASE){
    try{ return await loadLiveRates(base); }
    catch(e){ const cached=loadCachedRates(); if(cached) return cached;
      REGISTRY.currency.base=base; REGISTRY.currency.rates={ [base]:1, EUR:0.9, GBP:0.78 };
      return { base, date:'—', rates:REGISTRY.currency.rates, source:'fallback' };
    }
  }

  function populateUnits(category){
    const cfg=REGISTRY[category];
    const units=(category==='currency')?REGISTRY.currency.asUnits():cfg.units;
    fromEl.innerHTML=''; toEl.innerHTML='';
    const keys=Object.keys(units);
    for (const k of keys){
      const a=document.createElement('option'); a.value=k; a.textContent=k;
      const b=document.createElement('option'); b.value=k; b.textContent=k;
      fromEl.appendChild(a); toEl.appendChild(b);
    }
    if (category==='currency'){ fromEl.value=REGISTRY.currency.base; toEl.value='EUR'; }
    else if (category==='length'){ fromEl.value='m'; toEl.value='ft'; }
    else if (category==='temperature'){ fromEl.value='C'; toEl.value='F'; }
    else { fromEl.selectedIndex=0; toEl.selectedIndex=Math.min(1, keys.length-1); }
    root.querySelector('#fromLabel').textContent = 'From ('+(REGISTRY[category].base||'')+')';
    root.querySelector('#toLabel').textContent   = 'To';
  }

  function convert(category, value, from, to){
    if (value==='' || isNaN(Number(value))) return null;
    const v=Number(value);
    if (category==='currency'){
      const rates=REGISTRY.currency.rates;
      if (!(from in rates) || !(to in rates)) return null;
      const baseAmount = v / rates[from];
      return baseAmount * rates[to];
    }
    const cfg=REGISTRY[category]; if(!cfg) return null;
    if (category==='temperature'){
      const uF=cfg.units[from], uT=cfg.units[to]; if(!uF||!uT) return null;
      return uT.fromBase(uF.toBase(v));
    }
    const uF=cfg.units[from], uT=cfg.units[to]; if(!uF||!uT) return null;
    return (v * uF.factor) / uT.factor;
  }

  function formatNumber(n){
    if (n===null) return '—';
    if (!isFinite(n)) return 'Error';
    const abs=Math.abs(n);
    if (abs!==0 && (abs<1e-9 || abs>=1e12)) return n.toExponential(8).replace(/\.?0+e/,'e');
    return parseFloat(n.toPrecision(12)).toString();
  }

  function recalc(){
    const cat=categoryEl.value, val=amountEl.value, from=fromEl.value, to=toEl.value;
    const out=convert(cat, val, from, to);
    resultEl.textContent = formatNumber(out);
    if (cat==='currency'){
      const raw=localStorage.getItem(FX_CACHE_KEY);
      const stamp=raw ? (JSON.parse(raw).date || '—') : '—';
      metaEl.textContent = `Rates source: ${REGISTRY.currency.base} base · date ${stamp} · live or cached`;
    } else {
      metaEl.textContent = `${val || '—'} ${from} → ${to}`;
    }
  }

  categoryEl.addEventListener('change', async () => {
    if (categoryEl.value==='currency' && Object.keys(REGISTRY.currency.rates).length===0){
      metaEl.textContent='Loading live FX rates…';
      await ensureRates(REGISTRY.currency.base);
    }
    populateUnits(categoryEl.value); recalc();
  });
  fromEl.addEventListener('change', recalc);
  toEl.addEventListener('change', recalc);
  amountEl.addEventListener('input', recalc);

  (async function init(){
    metaEl.textContent='Loading live FX rates…';
    await ensureRates(REGISTRY.currency.base);
    populateUnits(categoryEl.value);
    recalc();
  })();

  return {};
})();


document.addEventListener('keydown', (e) => {
  const k = e.key;

  
  if (kb.getAttribute('aria-hidden') === 'false') {
    if (k === 'Escape') { e.preventDefault(); closeKB(); }
    return;
  }

  const mod = e.ctrlKey || e.metaKey; 
  if (mod && k === '1') { e.preventDefault(); selectTab('calc'); return; }
  if (mod && k === '2') { e.preventDefault(); selectTab('conv'); return; }

  if (k === '?' || (k === '/' && e.shiftKey)) { e.preventDefault(); openKB(); return; }
  if (!mod && (k === 't' || k === 'T')) { e.preventDefault(); themeBtn.click(); return; }

  if (activeTab === 'calc') Calc.onKeydown(e);
});


selectTab('calc');
