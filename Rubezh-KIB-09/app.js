'use strict';
const key='kib09.rubezh.v1';
const view=document.querySelector('#view');
const message=document.querySelector('#status');
let saved=fresh();
let persistent=true;
try{saved=clean(JSON.parse(localStorage.getItem(key)))}catch{persistent=false}
let demo=fresh();
let mode='demo',page=0,group=0;
function resetDemo(profile){
 demo={...fresh(),profile,answers:[...profiles[profile].demo]};
}
resetDemo(0);
function state(){return mode==='demo'?demo:saved}
function persist(){
 if(mode==='own')try{localStorage.setItem(key,JSON.stringify(saved));persistent=true}catch{persistent=false}
}
const tabs=['Сводка','Самооценка','План улучшений'];
const short=['Копии','Доступ','Устройства','Обновления','Сигналы','Ответ'];
function action(text,cmd,css='',attrs=''){
 return '<button type="button" class="'+css+'" data-action="'+cmd+'" '+attrs+'>'+text+'</button>'
}
function count(s){return s.answers.filter(validAnswer).length}
function segment(s,i){return s.answers.slice(i*3,i*3+3)}
function measure(s,i){const a=segment(s,i);return a.every(validAnswer)?score(a)+'%':'Ответов '+a.filter(validAnswer).length+'/3'}
function plot(s){
 const position=(i,r)=>{const angle=(i*60-90)*Math.PI/180;return [160+r*Math.cos(angle),113+r*Math.sin(angle)]};
 const polygon=r=>sections.map((_,i)=>position(i,r).join(',')).join(' ');
 const mesh=[20,40,60,80].map(r=>'<polygon points="'+polygon(r)+'" fill="none" stroke="#54807a"/>').join('');
 const spokes=sections.map((_,i)=>'<line x1="160" y1="113" x2="'+position(i,80)[0]+'" y2="'+position(i,80)[1]+'" stroke="#54807a"/>').join('');
 const points=sections.map((_,i)=>position(i,80*score(segment(s,i))/100));
 const surface=complete(s)?'<polygon points="'+points.map(p=>p.join(',')).join(' ')+'" fill="#aeecab55" stroke="#b8f5b3" stroke-width="2"/>'+points.map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="3" fill="#d2ffd0"/>').join(''):'';
 const names=short.map((name,i)=>{const [x,y]=position(i,96);return '<text x="'+x+'" y="'+y+'" text-anchor="'+(i===0||i===3?'middle':i<3?'start':'end')+'" dominant-baseline="middle" fill="#d0e7dc" font-size="12">'+name+'</text>'}).join('');
 return '<figure><svg viewBox="0 0 320 225" aria-hidden="true">'+mesh+spokes+surface+names+'</svg><figcaption>'+(complete(s)?'Выполнение мер по шести направлениям':'Карта появится после 18 ответов')+'</figcaption></figure>'
}
function overview(s){
 const done=complete(s), total=count(s);
 return '<div class="hero"><div><p class="meta">'+(mode==='demo'?'ДЕМОНСТРАЦИОННЫЙ АУДИТ':'МОЙ АУДИТ')+'</p><h1>Готовность к вымогателям</h1><p>'+profiles[s.profile].name+' · '+profiles[s.profile].process+'</p><p>'+(done?'По ответам выполнено <strong>'+score(s.answers)+'%</strong> мер. Сравните направления и соберите план в пределах доступного времени.':'Ответов '+total+' из 18. Отметьте, какие меры уже действуют в вашей компании.')+'</p>'+action(done?'Собрать план улучшений':total?'Продолжить оценку':'Начать оценку',done?'plan':'resume','primary')+'</div>'+plot(s)+'</div><h2 class="heading">Профиль готовности</h2><div class="grid">'+sections.map((name,i)=>'<button class="card" data-action="group-'+i+'"><span class="meta"><span>0'+(i+1)+'</span><span>'+measure(s,i)+'</span></span><b>'+name+'</b><span class="track"><i style="width:'+(segment(s,i).every(validAnswer)?score(segment(s,i)):0)+'%"></i></span></button>').join('')+'</div>'
}
function impact(s){
 const rows=dependencies[s.profile].map(([step,indices])=>{
  const missing=indices.filter(i=>s.answers[i]!==2);
  const after=missing.filter(i=>!s.selected.includes(i));
  return '<details class="question"><summary>'+step+' · '+(indices.length-missing.length)+'/3 мер</summary><p>После выполнения плана: '+(indices.length-after.length)+'/3.</p>'+indices.map(i=>'<p>'+action(sections[Math.floor(i/3)]+' · '+labels[s.answers[i]],'group-'+Math.floor(i/3))+' '+controls[i][0]+'</p>').join('')+'</details>'
 });
 return '<section class="panel"><small>КРИТИЧНЫЙ ПРОЦЕСС</small><h2>'+profiles[s.profile].process+'</h2><p>Раскройте этап, чтобы увидеть, на какие меры он опирается и что покроет ваш план.</p>'+rows.join('')+'</section>'
}
function audit(s){
 const a=group*3;
 return '<h1>Самооценка</h1><p>Ответов '+count(s)+' из 18 · '+profiles[s.profile].process+'</p><div class="sectionbar">'+sections.map((n,i)=>action(n,'group-'+i,i===group?'active':'','aria-pressed="'+(i===group)+'"')).join('')+'</div><h2>'+sections[group]+'</h2>'+controls.slice(a,a+3).map(([question,,evidence],j)=>'<article class="question"><small>Мера '+(a+j+1)+' / 18</small><h3>'+question+'</h3><details><summary>Чем подтвердить ответ?</summary><p>'+evidence+'</p></details><div class="actions">'+labels.map((l,k)=>action(l,'answer-'+(a+j)+'-'+k,'answer','aria-pressed="'+(s.answers[a+j]===k)+'"')).join('')+'</div></article>').join('')+'<div class="actions">'+(group>0?action('Назад','group-'+(group-1)):'')+action(group<5?'Следующий раздел':complete(s)?'Посмотреть план':'К пропущенным вопросам',group<5?'group-'+(group+1):complete(s)?'plan':'resume','primary')+'</div>'
}
function metric(title,value){return '<div class="panel"><span>'+title+'</span><div class="metric">'+value+'</div></div>'}
function plan(s){
 if(!complete(s))return '<h1>План улучшений</h1><div class="panel"><h3>Осталось ответить на '+(18-count(s))+' из 18 вопросов</h3><p>Для сравнения текущей оценки и плана нужны ответы по всем направлениям. Если сведений нет, выберите «Не знаю».</p>'+action('Продолжить оценку','resume','primary')+'</div>';
 const candidates=gaps(s), used=effort(s);
 return '<h1>План улучшений</h1><p>'+profiles[s.profile].process+' · Выберите меры, которые команда успеет выполнить.</p><div class="metrics">'+metric('Сейчас',score(s.answers)+'%')+metric('После выполнения',forecast(s)+'%')+metric('Трудозатраты',used/2+' / '+s.budget/2+' дн.')+'</div><div class="actions"><label>Ресурс команды <select id="budget">'+[3,6,10].map(x=>'<option value="'+x+'" '+(s.budget===x?'selected':'')+' '+(used>x?'disabled':'')+'>'+x/2+' чел.-дн.</option>').join('')+'</select></label>'+action('Скачать отчёт (.md)','download')+'</div><p class="note">Прогноз предполагает полное выполнение выбранных мер. Трудозатраты ориентировочные. Снимите меру, чтобы освободить время.</p><h2 class="heading">'+(candidates.length?'Незакрытые меры · '+candidates.length:'Все 18 мер отмечены как выполненные')+'</h2>'+candidates.map(i=>{
 const checked=s.selected.includes(i),cost=controls[i][3],locked=!checked&&used+cost>s.budget;
 return '<article class="task"><div><small>'+sections[Math.floor(i/3)]+' · '+labels[s.answers[i]]+'</small><h3>'+controls[i][1]+'</h3><p>'+(s.answers[i]===3?'Сначала уточните текущее состояние. ':'')+controls[i][2]+'</p></div><label><input type="checkbox" aria-label="'+controls[i][1]+'" data-task="'+i+'" '+(checked?'checked':'')+' '+(locked?'disabled':'')+'>'+cost/2+' чел.-дн.</label></article>'
 }).join('')
}
function report(s){
 return ['# Рубеж — отчёт KIB-09',new Date().toLocaleDateString('ru-RU'),mode==='demo'?'Демонстрационные данные':'Собственная оценка',profiles[s.profile].name+' · '+profiles[s.profile].process,'','Выполнение мер: '+score(s.answers)+'%. После выполнения плана: '+forecast(s)+'%.','Ресурс: '+effort(s)/2+' из '+s.budget/2+' чел.-дн.','','## Ответы',...sections.flatMap((n,g)=>['','### '+n+' · '+measure(s,g),...segment(s,g).map((a,j)=>'- '+controls[g*3+j][0]+' — '+labels[a])]),'','## План',...(s.selected.length?s.selected.map(i=>'- '+controls[i][1]+' ('+controls[i][3]/2+' чел.-дн.). Приёмка: '+controls[i][2]):['Меры пока не выбраны.']),'','## Пробелы вне плана',...gaps(s).filter(i=>!s.selected.includes(i)).map(i=>'- '+controls[i][1]+' — '+labels[s.answers[i]]+'. '+controls[i][2]),'','## Методика','Да = 2, частично = 1, нет и не знаю = 0 подтверждённых баллов. Общая оценка округляется от суммы по 36 баллам. Это самооценка по ответам. Она не определяет вероятность атаки.'].join('\n')
}
function render(focus){
 const s=state();
 document.querySelector('#toolbar').innerHTML='<div class="bar"><div class="seg">'+action('Демо','demo','','aria-pressed="'+(mode==='demo')+'"')+action('Моя оценка','own','','aria-pressed="'+(mode==='own')+'"')+'</div><label>'+(mode==='demo'?'Демо-компания':'Профиль компании')+' <select id="profile">'+profiles.map((p,i)=>'<option value="'+i+'" '+(i===s.profile?'selected':'')+'>'+p.name+'</option>').join('')+'</select></label></div>';
 document.querySelector('#nav').innerHTML=tabs.map((t,i)=>action(t,'tab-'+i,'',i===page?'aria-current="page"':'')).join('');
 view.innerHTML=[overview,audit,plan][page](s)+(complete(s)&&page!==1?impact(s):'')+'<details class="panel"><summary>Как считается готовность?</summary><p>Каждая из 18 мер даёт до двух баллов. «Да» даёт два, «Частично» — один. «Нет» и «Не знаю» дают ноль подтверждённых баллов и различаются в отчёте. У всех мер одинаковый вес. Общий результат — процент от 36 баллов, округлённый до целого. Это оценка выполнения мер по вашим ответам.</p><p>В плане сначала идут меры без подтверждённых баллов, затем частично выполненные. Внутри группы первыми показаны менее трудоёмкие. Ресурс и трудозатраты заданы для учебного сравнения.</p></details>';
 message.textContent=mode==='own'?(persistent?'Ответы сохраняются в этом браузере.':'Браузер ограничил сохранение. Скачайте отчёт перед закрытием.'):'Демо использует вымышленные данные. Собственная оценка хранится отдельно.';
 if(focus)document.querySelector(focus)?.focus({preventScroll:true})
}
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-action]');if(!button)return;
 const [cmd,a,b]=button.dataset.action.split('-'),s=state();
 if(cmd==='download'){
  const url=URL.createObjectURL(new Blob([report(s)],{type:'text/markdown;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='rubezh-'+mode+'.md';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return
 }
 if(cmd==='own'||cmd==='demo'){mode=cmd;page=0;group=0}
 if(cmd==='tab')page=Number(a);
 if(cmd==='plan')page=2;
 if(cmd==='group'){page=1;group=Number(a)}
 if(cmd==='resume'){page=1;group=Math.max(0,Math.floor(s.answers.findIndex(x=>!validAnswer(x))/3))}
 if(cmd==='answer'){s.answers[Number(a)]=Number(b);if(Number(b)===2)s.selected=s.selected.filter(i=>i!==Number(a));persist()}
 render('[data-action="'+button.dataset.action+'"]');
 if(['group','resume','plan','tab'].includes(cmd))view.scrollIntoView({block:'start'})
});
document.addEventListener('change',e=>{
 const s=state(),el=e.target;
 if(el.id==='profile'){if(mode==='demo')resetDemo(Number(el.value));else s.profile=Number(el.value)}
 if(el.id==='budget')s.budget=Number(el.value);
 if(el.hasAttribute('data-task')){
  const i=Number(el.dataset.task);if(el.checked && !s.selected.includes(i)&&effort(s)+controls[i][3]<=s.budget)s.selected.push(i);
  if(!el.checked)s.selected=s.selected.filter(j=>j!==i)
 }
 persist();render(el.id?'#'+el.id:'[data-task="'+el.dataset.task+'"]')
});
render();
