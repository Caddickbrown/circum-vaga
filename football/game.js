/* Bovril & Glory: engine and interface (v2) */
(function(){
'use strict';
const DATA=window.BG_DATA;
const SAVE_KEY='bovril-glory-save-v1';
let G=null;
const UI={screen:'title',tab:'inbox',div:0,msg:null,modal:null,pick:null,fixView:'mine',cupRound:null,
  tf:{pos:'',div:'',q:'',age:'',fee:'',mode:'all'},start:{div:1,sel:null,name:'',hist:true},resDate:null,live:null,importText:'',note:'',press:null,paper:null,finNote:'',notice:null,sort:{squad:{k:'pos',d:1},tf:{k:'ca',d:-1}}};

/* ---------- utilities ---------- */
const rand=Math.random;
const ri=(a,b)=>a+Math.floor(rand()*(b-a+1));
const rf=(a,b)=>a+rand()*(b-a);
const pick=a=>a[Math.floor(rand()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fixPoss=h=>String(h).replace(/([A-Za-z][a-rt-zA-RT-Z]s)('|&#39;)s\b/g,'$1$2');
function fill(t,o){return t.replace(/\{(\w+)\}/g,(_,k)=>o[k]!=null?o[k]:'');}
function D2(s){const [y,m,d]=s.split('-').map(Number);return new Date(Date.UTC(y,m-1,d));}
const S=dt=>dt.toISOString().slice(0,10);
function addDays(s,n){const d=D2(s);d.setUTCDate(d.getUTCDate()+n);return S(d);}
const dow=s=>D2(s).getUTCDay();
const daysBetween=(a,b)=>Math.round((D2(b)-D2(a))/864e5);
function firstDow(s,w){let d=s;while(dow(d)!==w)d=addDays(d,1);return d;}
const firstSat=s=>firstDow(s,6);
const MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function ord(n){const s=['th','st','nd','rd'],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}
function fmtDate(s,short){const d=D2(s);if(short)return `${DAY[d.getUTCDay()].slice(0,3)} ${d.getUTCDate()} ${MON[d.getUTCMonth()].slice(0,3)}`;return `${DAY[d.getUTCDay()]} ${ord(d.getUTCDate())} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;}
const money=n=>(n<0?'-':'')+'£'+Math.abs(Math.round(n)).toLocaleString('en-GB');
function lsd(p){let d=Math.round(p*240);const sh=Math.floor(d/12);d=d%12;return `${sh}s ${d}d`;}
const seasonLbl=y=>`${y}-${String((y+1)%100).padStart(2,'0')}`;
const DIVN=['Division One','Division Two','Division Three','Division Four'];
const POSN={GK:'Goalkeeper',FB:'Full-back',CH:'Centre-half',WH:'Wing-half',IF:'Inside-forward',WG:'Winger',CF:'Centre-forward'};
const U=()=>G.user.club;
const club=id=>G.clubs[id]||(G.eu&&G.eu.clubs?G.eu.clubs[id]:undefined);
const cn=id=>{const c=club(id);return c?c.n:(id||'');};
const age=p=>G.year-p.b;
const infl=()=>1+0.07*Math.max(0,G.year-1960);
const surname=n=>{const p=String(n).split(' ');return p[p.length-1];};

/* ---------- squads index ---------- */
let SQ=null;
function sq(cid){if(!SQ){SQ={};for(const p of Object.values(G.players)){if(p.c){(SQ[p.c]=SQ[p.c]||[]).push(p);}}}return SQ[cid]||[];}
function userLock(p,c,why){if(why||!G||!G.user||G.autopilot||!p||p.c!==G.user.club||c===G.user.club)return false;
  G.blocked=G.blocked||[];G.blocked.push({d:G.date,n:p.n,to:c||'free',st:(new Error().stack||'').split('\n').slice(2,6).map(x=>x.trim()).join(' < ').slice(0,300)});if(G.blocked.length>30)G.blocked.shift();return true;}
function setClub(p,c,why){if(userLock(p,c,why))return false;if(why&&p.c&&G&&G.user&&p.c===G.user.club&&c!==p.c){p.leftWhy=why;p.leftOn=G.date;}p.c=c;SQ=null;return true;}

/* ---------- staff ---------- */
const STAFF={
 wing:['Wing-play coach','Works with your wide men. Anyone playing on the wing plays better, a wide game pays off more, and the wide roles (touchline winger, cutting inside, overlapping full-back) work better. Helps ball-work training too.'],
 gk:['Goalkeeping coach','Specialist work with the keepers. Your goalkeeper plays better, whether he stays on his line or comes for crosses.'],
 def:['Defensive coach','Drills the back line every morning. Your defence is harder to break down, defending and pressing training go further, and the side learns a new system faster.'],
 att:['Forwards coach','Shooting practice until dark. Your attack is sharper, attacking training goes further, and the side learns a new system faster.'],
 fit:['Trainer','Runs the fitness work and carries the magic sponge. Players recover faster and get injured less, fitness and pressing training go further with fewer knocks, and he puts out the right boots for the pitch.'],
 youth:['Youth coach','Brings on the apprentices. Young players improve faster, the youth intake is better, and ball-work training goes further.'],
 mot:['Man-manager','Keeps the dressing room happy. Morale stays higher, wins lift it further, your shouts from the dugout carry more weight, and game-scenario training goes further.'],
 scout:['Chief scout','Knows every player in the land. Clubs ask less for their players, you see true potential, and the dossier on each opponent is more accurate.'],
 set:['Set-piece coach','Rehearses corners and free kicks. More goals from dead balls, and set-piece rehearsal builds faster and fades more slowly.']
};
const REALSTAFF=[['Bob Paisley','fit',5],['Harold Shepherdson','fit',4],['Les Cocker','fit',4],['Joe Fagan','mot',4],['Reuben Bennett','fit',3],['Jimmy Murphy','youth',5],['Syd Owen','def',4],['Malcolm Allison','att',5],['Dave Sexton','att',4],['Walter Winterbottom','set',4],['Wilf McGuinness','youth',3],['Allen Wade','set',3],['Jack Mansell','wing',3],['Bill Taylor','def',3],['Ronnie Suart','wing',3],['Jimmy Hagan','mot',3]];
function staffQ(t){if(!G||!G.user.staff)return 0;let q=0;for(const s of G.user.staff)if(s.type===t&&s.q>q)q=s.q;return q;}
const staffSlots=()=>club(U()).div===0?3:2;
const staffBill=()=>(G.user.staff||[]).reduce((t,s)=>t+s.w,0);
function mkStaff(n,type,q){return {id:G.sid++,n,type,q,w:Math.round((6+7*q)*(G.wageCap?0.8:1)*infl()),fee:roundFee(q*q*400*infl()),real:false};}
function genStaffPool(){const taken=new Set((G.user.staff||[]).map(s=>s.n));const pool=[];
  shuffle(REALSTAFF.filter(r=>!taken.has(r[0])).slice()).slice(0,4).forEach(([n,t,q])=>{const s=mkStaff(n,t,q);s.real=true;pool.push(s);});
  const types=Object.keys(STAFF);for(let i=0;i<6;i++)pool.push(mkStaff(genName(),pick(types),ri(1,4)));
  return pool.sort((a,b)=>b.q-a.q);}

/* ---------- money and value ---------- */
function roundFee(v){if(v<2000)return Math.round(v/100)*100;if(v<10000)return Math.round(v/250)*250;if(v<50000)return Math.round(v/500)*500;return Math.round(v/1000)*1000;}
function valueOf(p){const a=age(p);let v=100000*Math.exp((p.ca-90)/11);
  let af=a<=21?1.2+Math.max(0,p.pa-p.ca)/40:a<=27?1.1:a<=30?0.85:a<=32?0.55:0.3;
  return roundFee(Math.max(250,v*af*infl()));}
function wageFor(p){if(G.wageCap)return Math.min(G.wageCap,Math.round(8+p.ca/7));
  return Math.round((14+110*Math.exp((p.ca-88)/13))*(1+0.06*Math.max(0,G.year-1961)));}
function askPrice(p,forUser){if(p.c==='ABR')return roundFee(valueOf(p)*(overseas(p)?1.7:1.3)*(forUser?1-0.025*staffQ('scout'):1));const s=sq(p.c).slice().sort((a,b)=>b.ca-a.ca);const i=s.indexOf(p);const key=i>-1&&i<3;
  return roundFee(valueOf(p)*(p.listed?0.85:1.15)*(key?1.35:1)*(forUser?(1-0.025*staffQ('scout'))*mgrDiscount(p.c):1));}
const bigFee=()=>20000*infl();
const wageBill=cid=>sq(cid).reduce((s,p)=>s+p.w,0);
const wageDemand=p=>Math.round(wageFor(p)*(G.wageCap?1:1.15)*(overseas(p)?1.4:1)*(1-(G.user.pull||0)/100)*(upgDone('houses')?0.95:1)*(upgDone('ambassador')?0.98:1));

/* ---------- tactics ---------- */
const FORMS={
 'W-M':{lbl:'W-M (3-2-2-3)',mod:[1.03,1,0.97],desc:'The English standard since the 1920s. Three at the back, two wing-halves, two inside-forwards and a front three. Good going forward, can be opened up.',
  s:[['GK','GK',50,88,1],['FB','RB',78,70,2],['CH','CH',50,73,5],['FB','LB',22,70,3],['WH','RH',68,53,4],['WH','LH',32,53,6],['IF','IR',62,36,8],['IF','IL',38,36,10],['WG','OR',88,16,7],['CF','CF',50,13,9],['WG','OL',12,16,11]]},
 'Revie':{lbl:'Revie Plan (deep centre-forward)',mod:[0.99,1.05,0.98],desc:'Borrowed from the Hungarians and made famous by Don Revie at Manchester City. The number 9 drops deep to drag the centre-half out, and the inside-forwards run beyond him.',
  s:[['GK','GK',50,88,1],['FB','RB',78,70,2],['CH','CH',50,73,5],['FB','LB',22,70,3],['WH','RH',68,53,4],['WH','LH',32,53,6],['IF','IR',62,22,8],['IF','IL',38,22,10],['WG','OR',88,16,7],['IF','DCF',50,36,9],['WG','OL',12,16,11]]},
 '3-3-4':{lbl:'3-3-4',mod:[1.06,0.98,0.95],desc:'An early-Sixties hybrid on the way from the W-M to four at the back. Three defenders, three across the middle, four forwards. Goals at both ends.',
  s:[['GK','GK',50,88,1],['FB','RB',78,70,2],['CH','CH',50,73,5],['FB','LB',22,70,3],['WH','RH',72,50,4],['IF','IF',50,44,8],['WH','LH',28,50,6],['WG','OR',88,16,7],['CF','CF',62,14,9],['CF','CF',38,14,10],['WG','OL',12,16,11]]},
 '4-2-4':{lbl:'4-2-4',mod:[1.05,0.96,1.0],desc:"Brazil's 1958 system. Four at the back and four up top. Plenty of goals, thin in midfield.",
  s:[['GK','GK',50,88,1],['FB','RB',85,68,2],['CH','CH',62,73,5],['CH','CH',38,73,6],['FB','LB',15,68,3],['WH','RH',62,48,4],['IF','LH',38,48,8],['WG','OR',88,16,7],['CF','CF',60,13,9],['CF','CF',40,13,10],['WG','OL',12,16,11]]},
 '4-3-3':{lbl:'4-3-3',mod:[1.0,1.03,1.01],desc:'The modern way of the mid-Sixties. An extra man in midfield for control, wingers still out wide.',
  s:[['GK','GK',50,88,1],['FB','RB',85,68,2],['CH','CH',62,73,5],['CH','CH',38,73,6],['FB','LB',15,68,3],['WH','RH',72,50,4],['WH','LH',28,50,8],['IF','IF',50,40,10],['WG','OR',85,16,7],['CF','CF',50,13,9],['WG','OL',15,16,11]]},
 '4-4-2':{lbl:'4-4-2 (Wingless)',mod:[0.96,1.04,1.04],desc:"Ramsey's Wingless Wonders. Solid and very hard to beat, a little short of attacking width.",
  s:[['GK','GK',50,88,1],['FB','RB',85,68,2],['CH','CH',62,73,5],['CH','CH',38,73,6],['FB','LB',15,68,3],['WH','RM',86,44,7],['IF','RC',62,50,4],['IF','LC',38,50,8],['WH','LM',14,44,11],['CF','CF',60,14,9],['CF','CF',40,14,10]]},
 'Cat':{lbl:'Catenaccio (sweeper)',mod:[0.9,0.99,1.1],desc:"Helenio Herrera's Italian door-bolt. A sweeper behind the back four. Very hard to score against, and very hard to watch.",
  s:[['GK','GK',50,90,1],['CH','SW',50,76,6],['FB','RB',90,63,2],['CH','CH',70,67,5],['CH','CH',30,67,4],['FB','LB',10,63,3],['WH','RH',70,47,8],['WH','LH',30,47,10],['IF','IF',50,35,7],['CF','CF',62,15,9],['CF','CF',38,15,11]]}
};
const SUIT={FB:{CH:.85,WH:.8},CH:{FB:.85,WH:.82},WH:{IF:.88,FB:.8,CH:.8},IF:{WH:.88,CF:.88,WG:.85},WG:{IF:.85,CF:.8},CF:{IF:.88,WG:.8}};
function suit(pos,role){if(pos===role)return 1;if(pos==='GK'||role==='GK')return .3;return (SUIT[pos]&&SUIT[pos][role])||.65;}
function eff(p,role){return p.ca*suitP(p,role)*(0.72+0.28*p.fit/100)*(0.97+0.06*p.mor/100);}
const ORD={GK:0,CF:1,CH:2,WG:3,FB:4,WH:5,IF:6};
const UW={GK:[0,0,0],FB:[0,.2,.8],CH:[0,0,1],WH:[.1,.55,.35],IF:[.45,.55,0],WG:[.7,.3,0],CF:[1,0,0]};
const MENT=['Defensive','Balanced','Attacking'];
const DEFTAC={pass:1,width:1,tempo:1,tackle:1,trap:0};
const TACOPT={
 pass:{lbl:'Passing',opts:['Long ball','Mixed','Short passing'],tips:['Hit the big man early. Stronger attack if your centre-forward is good, but you give the ball away in midfield.','A bit of both.','Push and run, keep the ball on the deck. Better control of midfield, and the better your players the better it works.']},
 width:{lbl:'Width',opts:['Narrow','Normal','Wide'],tips:['Cut inside and crowd the middle. Tighter at the back, wingers matter less.','Standard shape.','Hug the touchline. Your wingers count for more and you attack better, but you leave gaps.']},
 tempo:{lbl:'Tempo',opts:['Patient','Normal','Up and at them'],tips:['Slow it down. Fewer chances for either side, slightly steadier defence.','Normal pace.','Fast and direct. More chances at both ends, and the players tire more.']},
 tackle:{lbl:'Tackling',opts:['Stay on your feet','Normal','Get stuck in'],tips:['Fewer injuries caused, a softer defence.','Honest challenges.','Harder to play against, but more names in the referee\'s notebook, the odd sending-off, and more injuries on both sides.']},
 trap:{lbl:'Offside trap',opts:['No','Play it'],tips:['Defenders drop off.','Step up together. The opposition get fewer chances, but when a forward beats it he is clean through. Risky with a weak defence.']}
};
const TEMPO=[0.94,1,1.07],TKL=[0.7,1,1.6];

/* the optimal assignment of players to positions (the Hungarian method), so a versatile man is not wasted */
function hungarian(a){const n=a.length,m=a[0].length,INF=1e18;const u=new Array(n+1).fill(0),v=new Array(m+1).fill(0),p=new Array(m+1).fill(0),way=new Array(m+1).fill(0);
  for(let i=1;i<=n;i++){p[0]=i;let j0=0;const minv=new Array(m+1).fill(INF),used=new Array(m+1).fill(false);
    do{used[j0]=true;const i0=p[j0];let delta=INF,j1=0;for(let j=1;j<=m;j++)if(!used[j]){const cur=a[i0-1][j-1]-u[i0]-v[j];if(cur<minv[j]){minv[j]=cur;way[j]=j0;}if(minv[j]<delta){delta=minv[j];j1=j;}}
      for(let j=0;j<=m;j++){if(used[j]){u[p[j]]+=delta;v[j]-=delta;}else minv[j]-=delta;}j0=j1;}while(p[j0]!==0);
    do{const j1=way[j0];p[j0]=p[j1];j0=j1;}while(j0);}
  const res=new Array(n).fill(-1);for(let j=1;j<=m;j++)if(p[j])res[p[j]-1]=j-1;return res;}
const pickVal=(p,role)=>eff(p,role)*(p.fit<60?0.82:1)*(p.form&&p.form.length>=2?1+clamp((avgForm(p)-6.6)*0.02,-0.03,0.03):1);
function assignXI(roles,pool){if(!roles.length)return [];if(!pool.length)return roles.map(()=>null);const m=Math.max(pool.length,roles.length);
  const cost=roles.map(r=>{const row=[];for(let j=0;j<m;j++)row.push(j<pool.length?-pickVal(pool[j],r):1e6);return row;});return hungarian(cost).map(j=>j>=0&&j<pool.length?pool[j]:null);}
function bestSub(pool,used){let sub=null,bv=-1;for(const p of pool){if(used.has(p.id)||p.pos==='GK')continue;const v=p.ca*(p.fit/100)*(1+0.04*altOf(p).length);if(v>bv){bv=v;sub=p.id;}}return sub;}
function bestXI(cid,form,exclude){const slots=FORMS[form].s;const pool=sq(cid).filter(p=>!p.acad&&p.inj===0&&!(p.drop&&p.drop>=G.date)&&!(exclude&&exclude.has(p.id)));
  const as=assignXI(slots.map(s=>s[0]),pool);const xi=as.map(p=>p?p.id:null);const used=new Set(xi.filter(Boolean));return {xi,sub:bestSub(pool,used)};}
function teamRating(cid){const c=club(cid);const b=bestXI(cid,c.id===U()?G.user.form:c.form);let s=0;b.xi.forEach(id=>{if(id)s+=G.players[id].ca;});return s?s/11:30;}
function histBoost(cid,cup){
  if(!G.hist||cid===U())return 1;const r=DATA.real[G.year];if(!r)return 1;
  if(cup)return r.fa===cid?1.08:1;
  if(r.d1===cid)return 1.07;if(r.d2===cid)return 1.06;if(r.d3===cid||r.d4===cid)return 1.05;if(r.d1r===cid||r.d2r===cid)return 1.04;return 1;
}
function strength(s){
  const slots=FORMS[s.form].s;const tac=s.tac||DEFTAC;const isU=s.cid===U();const Q=t=>isU?staffQ(t):0;
  const wW=[.8,1,1.2][tac.width],iW=[1.15,1,.92][tac.width];
  let a=0,aw=0,m=0,mw=0,d=0,dw=0,gk=35,cf=0,cfn=0,tot=0,n=0;
  slots.forEach((sl,i)=>{const pid=s.xi[i];const p=pid&&G.players[pid];let r=p?eff(p,sl[0]):30;if(p&&p.form&&p.form.length>=2)r*=1+clamp((avgForm(p)-6.6)*0.02,-0.03,0.03);
    if(p&&s.hob[pid])r*=0.45;if(p&&s.off[pid])r=0;
    if(sl[0]==='GK'){gk=r*(1+0.015*Q('gk'));return;}
    if(sl[0]==='WG')r*=1+0.012*Q('wing');
    tot+=r;n++;if(sl[0]==='CF'){cf+=r;cfn++;}
    const k=sl[0]==='WG'?wW:sl[0]==='IF'?iW:1;const w=UW[sl[0]];
    a+=r*w[0]*k;aw+=w[0]*k;m+=r*w[1]*k;mw+=w[1]*k;d+=r*w[2]*k;dw+=w[2]*k;});
  let A=a/aw,M=m/mw,D=0.35*gk+0.65*(d/dw);const avg=n?tot/n:50;
  if(tac.pass===0){M*=.97;A*=1.015+clamp(cfn?(cf/cfn-A)/300:0,-.02,.03);}else if(tac.pass===2){M*=1.015+clamp((avg-60)/2000,-.015,.012);A*=.99;}
  if(tac.width===0){M*=1.01;D*=1.01;}else if(tac.width===2){A*=1.01;D*=.98;}
  if(tac.tempo===0){A*=.98;D*=1.01;}else if(tac.tempo===2){A*=1.02;D*=.99;}
  if(tac.tackle===0)D*=.98;else if(tac.tackle===2)D*=1.03;
  if(tac.trap)D*=1.02;
  A*=1+0.008*Q('att');D*=1+0.008*Q('def');if(isU&&upgDone('tr_film')){A*=1.008;M*=1.008;D*=1.008;}
  {const X=tacFx(s);A*=X.A;M*=X.M;D*=X.D;}
  const f=FORMS[s.form].mod;A*=f[0];M*=f[1];D*=f[2];
  if(s.ment===0){A*=.93;D*=1.06;}else if(s.ment===2){A*=1.07;D*=.94;}
  const k=histBoost(s.cid,s.cup)*(s.tt||1)*(s.pm||1)*(1-(s.tire||0))*(isU?1:1+(mq(s.cid)-3)*0.012);
  return {A:A*k,M:M*k,D:D*k,gk:gk*k};
}
function aiTac(cid){const t={...DEFTAC};const r=()=>rand();
  if(r()<.2)t.pass=0;else if(r()<.2)t.pass=2;if(r()<.15)t.width=pick([0,2]);if(r()<.15)t.tempo=pick([0,2]);if(r()<.15)t.tackle=pick([0,2]);if(r()<.08)t.trap=1;if(r()<.12)t.line=pick([0,2]);if(r()<.12&&G.year>=1963)t.press=pick([0,2]);if(r()<.1)t.counter=1;t.waste=pick([0,0,1,1,2]);t.lthrow=1;if(r()<.15)t.focus=pick([1,2]);
  const fam={WOL:{pass:0,tempo:2},TOT:{pass:2,tempo:2},BRN:{pass:2},MUN:{pass:2,width:2},LEE:{tackle:2,trap:1,press:G.year>=1963?2:1,waste:3},IPS:{width:0},BLP:{width:2},ARS:{trap:1,line:2},LIV:{tempo:2,tackle:2,press:G.year>=1963?2:1},EVE:{pass:2},WHU:{pass:2}};
  return Object.assign(t,fam[cid]||{});}

/* ---------- commentary ---------- */
const T={
 goal:["GOAL! {p} hammers it past {k}!","{p} rises above everyone and powers a header in!","It's in! {p} with a low drive into the bottom corner.","{p} scrambles it over the line after a goalmouth melee!","A lovely flowing move, and {p} finishes it off!","{p} lobs the stranded {k}. Cheeky, and brilliant!","A thunderbolt from {p}! {k} never saw it.","{p} rounds {k} and walks it into the net.","{p} volleys it home! The rattles are going on the terraces!","{p} gets the vital touch at the near post!","{p} beats two men and slots it past {k}. Quite superb."],
 header:["From the corner... {p} meets it with a bullet header! That one came off the training ground!","The free kick is floated in and {p} nods it home. Rehearsed to perfection."],
 trap:"The offside trap is sprung too late! {p} is clean through and makes no mistake.",
 pen:"Penalty! {p} sends {k} the wrong way.",penMiss:"Penalty! {p} steps up... and {k} saves it!",
 og:"Oh dear. {p} turns it into his own net under pressure.",
 save:["{k} flings himself full length to keep out {p}'s shot.","Smashing save by {k}, tipping {p}'s effort over the bar.","{p} lets fly, but {k} gathers it safely.","{k} comes off his line bravely to smother at {p}'s feet.","{p} forces {k} into a save at the foot of the post."],
 miss:["{p} blazes it high over the bar. The crowd groan.","{p} drags his shot wide from the edge of the area.","{p} heads just over from a corner.","{p} rattles the crossbar! So close!","{p} snatches at it and slices wide.","{p} finds only the side netting."],
 inj:["{p} is down after a crunching tackle. On comes the trainer with the magic sponge.","{p} is limping badly after that challenge.","{p} has taken a knock and is clutching his ankle."],
 hobble:"No substitutes, so {p} carries on as a passenger out on the wing.",
 book:["The referee takes the name of {p} after a late one.","{p} goes into the book. The crowd let the referee know what they think.","A wild lunge from {p}. Out comes the notebook."],
 off:"{p} is sent off! A shocking tackle, and the referee points to the tunnel. Ten men.",
 flav:["The rattles are going on the terraces.","The ball has gone into the crowd. A lad in a school cap throws it back.","Pipe smoke drifts across {g}.","The half-time scores are being hung on the board at the far end.","A policeman strolls along the touchline.","The referee has stern words with both captains.","\"{s}! {s}!\" rings out from the terraces.","Somebody in the crowd has brought a bugle.","The trainer blows on his hands down by the dugout.","A rosette-wearing lad has climbed the floodlight pylon. The police are not amused."],
 ko:"And we're under way here at {g}. {h} get us started.",
 ht:"Half-time. Time for a hot Bovril and a meat pie. {h} {hs}, {a} {as}.",
 ft:"Full time at {g}! {h} {hs}, {a} {as}.",
 et:"All square after ninety minutes. We go to extra time.",
 sub:"Substitution for {c}: {on} comes on for {off}.",

};
const nm=pid=>{const p=G.players[pid];if(!p)return 'a trialist';const parts=p.n.split(' ');return parts.length>1?parts.slice(1).join(' '):p.n;};

/* ---------- match engine ---------- */
const isSusp=p=>!!p&&p.drop&&p.drop>=G.date&&(/^Suspended/.test(p.dropWhy||'')||(!p.dropWhy&&!!p.susp));
function availWhy(p){if(!p)return '';if(p.inj)return `Injured (${p.injN||'an injury'}), out for ${p.inj} day${p.inj===1?'':'s'}`;if(p.drop&&p.drop>=G.date)return `${p.dropWhy||(p.susp?'Suspended':'Left out')} until ${fmtDate(p.drop,true)}`;return '';}
function validateUserXI(){const u=G.user;u.held=u.held||{};const form=u.form;const ok=p=>p&&p.c===U()&&!p.acad&&!p.inj&&!(p.drop&&p.drop>=G.date);
  let xi=(u.xi||[]).slice(0,11);while(xi.length<11)xi.push(null);
  Object.entries(u.held).forEach(([i,pid])=>{const p=G.players[pid];if(!p||p.c!==U()){delete u.held[i];return;}if(ok(p)&&!xi.includes(pid)){xi[+i]=pid;delete u.held[i];}});
  const used=new Set();const fixed=[];const out=[];
  xi=xi.map((pid,i)=>{const p=G.players[pid];if(pid&&ok(p)&&!used.has(pid)){used.add(pid);return pid;}if(pid&&p&&p.c===U()&&!used.has(pid)){u.held[i]=pid;out.push({pid,i,why:availWhy(p)});}if(pid)fixed.push(i);return null;});
  const slots=FORMS[form].s;const gaps=xi.map((x,i)=>x?null:i).filter(i=>i!==null);
  if(gaps.length){const pool=sq(U()).filter(p=>ok(p)&&!used.has(p.id));const as=assignXI(gaps.map(i=>slots[i][0]),pool);gaps.forEach((i,k)=>{if(as[k]){xi[i]=as[k].id;used.add(as[k].id);}});}
  let sub=u.sub;const sp=G.players[sub];if(!sub||!ok(sp)||used.has(sub))sub=bestSub(sq(U()).filter(ok),used);
  u.xi=xi;u.sub=sub;u.out=Object.entries(u.held).map(([i,pid])=>({pid,i:+i,why:availWhy(G.players[pid])})).filter(o=>o.why);return {xi,sub,fixed,out:u.out};}
function mkSide(cid,fx){
  const c=club(cid);let form=c.form,ment=c.ment,xi,sub,tac;
  if(cid===U()){applyVenuePlan(fx);const v=validateUserXI();spStandIns();form=G.user.form;ment=G.user.ment??1;xi=v.xi;sub=v.sub;tac={...DEFTAC};Object.entries(G.user.tac||{}).forEach(([k,x])=>{if(x!=null)tac[k]=x;});}
  else{const b=bestXI(cid,form);xi=b.xi;sub=b.sub;tac={...(c.tac||DEFTAC)};}
  const pf=G.pressFx&&G.pressFx[fx.id];const pm=pf?(cid===U()?pf.me:pf.opp):1;
  const s={cid,form,ment,tac,xi:xi.slice(),sub,subUsed:false,hob:{},off:{},shots:0,sot:0,corners:0,cup:fx.comp==='FA',rt:{},played:xi.filter(Boolean),tt:1,pm:pm*(cid===U()&&G.user.whip?1.02:1)*(cid===U()&&fx.a===U()&&upgDone('coach')?1.005:1)*(cid===U()&&!G.wageCap?1+(G.user.winb||0)*0.003:1)*(cid===U()&&fx.comp==='L'&&(G.user.spirit||0)>0?1.01:1)*(cid===U()&&fx.subs?1.015:1),roles:{},subMin:{}};
  xi.forEach((pid,i)=>{if(pid){s.rt[pid]=6.4;s.roles[pid]=FORMS[form].s[i][0];}});const fx0=xi.filter(Boolean).map(id=>G.players[id].fit);s.fitAvg=fx0.length?fx0.reduce((t,v)=>t+v,0)/fx0.length:90;s.tire=0;return s;
}
function newMatch(fx,live){
  const m={fx,min:0,max:90,sc:[0,0],sides:[mkSide(fx.h,fx),mkSide(fx.a,fx)],ev:[],goals:[],inj:[],neutral:!!fx.neutral,done:false,live:!!live,aet:false,shotLog:[],mom:[],terr:[0,0],pH:.5};
  m.us=fx.h===U()?0:fx.a===U()?1:-1;
  m.ground=fx.venue||(m.neutral?(fx.r===7&&fx.comp==='FA'?'Wembley':'a neutral ground'):club(fx.h).g);
  m.att=attendance(fx);
  addEv(m,-1,'ko',fill(T.ko,{g:m.ground,h:cn(fx.h)}));
  linkSides(m);m.sides.forEach(s=>s.str=strength(s));
  return m;
}
function addEv(m,side,k,t){m.ev.push({min:m.min,side,k,t});}
function pickScorer(s,header,kind){const W=header?{CF:3,CH:2,IF:1,WG:.6,WH:.8,FB:.4,GK:0}:{CF:3.2,IF:2.4,WG:1.7,WH:.7,CH:.25,FB:.15,GK:0};const slots=FORMS[s.form].s;let tot=0;const arr=[];const X=s.fx||{};const cr=kind==='cor'?s.cornerRoutine:null;
  s.xi.forEach((pid,i)=>{if(!pid||s.off[pid])return;const p=G.players[pid];const ty=slots[i][0];let w=W[ty]*Math.pow(p.ca/70,1.5)*(s.hob[pid]?.2:1)*((X.scW&&X.scW[i])||1);
    if(header){if(hasT(p,'header'))w*=1.8;w*=(X.hW&&X.hW[i])||1;if(cr==='far'&&(ty==='CH'||(hasT(p,'header')&&ty!=='CF')))w*=2;if(cr==='near'&&(ty==='CF'||ty==='IF'))w*=1.4;}
    else{if(hasT(p,'poacher'))w*=1.35;if(kind==='cnt'&&hasT(p,'pace'))w*=1.6;}
    arr.push([pid,w]);tot+=w;});
  let r=rand()*tot;for(const [pid,w] of arr){r-=w;if(r<=0)return pid;}return arr.length?arr[0][0]:null;}
function mStep(m){
  if(m.done)return;m.min++;const [H,A]=m.sides;tacMinute(m);
  let pH=Math.pow(H.str.M,2.2)/(Math.pow(H.str.M,2.2)+Math.pow(A.str.M,2.2));if(!m.neutral)pH+=0.045;pH+=tacPH(m);pH=clamp(pH,.15,.85);
  m.pH=pH;m.terr[0]+=pH;m.terr[1]+=1-pH;let mom=(pH-.5)*2;
  for(let i=0;i<2;i++){const s=m.sides[i],o=m.sides[1-i];const share=i?1-pH:pH;
    let rate=0.215*share*Math.pow(s.str.A/o.str.D,1.0)*TEMPO[s.tac.tempo]*TEMPO[o.tac.tempo];if(o.tac.trap)rate*=0.9;rate*=tacRate(m,i);
    if(!m.neutral)rate*=i===0?1.11:0.91;const diff=m.sc[i]-m.sc[1-i];if(m.min>=55&&diff)rate*=diff<0?1.15:0.85;else if(m.min>=75&&!diff)rate*=0.8;
    if(rand()<rate){chance(m,i);mom+=i?-1.2:1.2;}}
  extraChances(m);m.mom.push(mom);
  if(m.min>50)m.sides.forEach(s=>{s.tire=Math.min(0.06,(s.tire||0)+0.0006*[0.8,1,1.4][s.tac.tempo]*((s.fx&&s.fx.tire)||1)*Math.max(0.3,1.6-(s.fitAvg||90)/100));if(m.min%5===0)s.str=strength(s);});
  for(let i=0;i<2;i++){const s=m.sides[i],o=m.sides[1-i];const fitQ=s.cid===U()?(1-0.08*staffQ('fit'))*(upgDone('tr_gym')?0.9:1):1;
    if(rand()<0.0007*TKL[o.tac.tackle]*fitQ*injM(m,i))injury(m,i);
    const bk=[0.0008,0.0025,0.006][s.tac.tackle],so=[0.00002,0.00008,0.00035][s.tac.tackle];
    if(rand()<bk*bookM(m,i)){const c=s.xi.filter((p,j)=>p&&j>0&&!s.off[p]);if(c.length){const p=bookPick(c);s.bk=s.bk||{};s.bk[p]=(s.bk[p]||0)+1;s.rt[p]=(s.rt[p]??6.4)-0.2;if(m.live)addEv(m,i,'book',fill(pick(T.book),{p:nm(p)}));}}
    if(rand()<so*bookM(m,i)){const c=s.xi.filter((p,j)=>p&&j>0&&!s.off[p]);if(c.length){const p=bookPick(c);s.off[p]=true;s.rt[p]=(s.rt[p]??6.4)-1.5;addEv(m,i,'off',fill(T.off,{p:nm(p)}));s.str=strength(s);}}}
  if(G.subs===2&&m.min>=60&&m.min<=80)for(let i=0;i<2;i++){if(i===m.us&&m.live)continue;const s=m.sides[i];
    if(!s.subUsed&&s.sub&&m.sc[i]<m.sc[1-i]&&rand()<0.08){let worst=-1,wr=99;s.xi.forEach((pid,k)=>{if(k>0&&pid&&!s.off[pid]&&(s.rt[pid]??6.4)<wr){wr=s.rt[pid]??6.4;worst=k;}});if(worst>0)doSub(m,i,worst);}}
  if(m.live&&rand()<0.025){const c=club(m.fx.h);addEv(m,-1,'flav',fill(pick(flavList(m)),{g:m.ground,s:c.s.toUpperCase()}));}
  if(m.min===45)addEv(m,-1,'ht',fill(T.ht,{h:cn(m.fx.h),a:cn(m.fx.a),hs:m.sc[0],as:m.sc[1]}));
  stoppage(m);if(m.min>=m.max){m.done=true;addEv(m,-1,'ft',fill(T.ft,{g:m.ground,h:cn(m.fx.h),a:cn(m.fx.a),hs:m.sc[0],as:m.sc[1]})+(m.aet?' (after extra time)':''));}
}
function gkOf(s){return s.xi[0];}
function logShot(m,i,res){if(m.live){const c=m._ck||{};m.shotLog.push({side:i,res,min:m.min,d:rf(.05,.19),y:rf(.24,.76),kind:c.kind,hdr:c.hdr,pid:c.pid});}}
function chance(m,i,header,kind){
  const s=m.sides[i],o=m.sides[1-i];s.shots++;const X=s.fx||{};
  if(!header&&!kind){const sp=s.spr||SPDEF;if(rand()<(X.penP||0.03))kind='pen';else if(rand()<0.06)kind=sp.fk==='cross'?'fkx':sp.fk==='rehearsed'?'rfk':'fk';else if(rand()<(X.hdr||0.07)){header=true;kind='cross';}else kind='open';if(kind==='fkx')header=true;}
  let sh=kind==='pen'?spTaker(s,'pen'):kind==='fk'?spTaker(s,'fk'):null;if(!sh)sh=pickScorer(s,header,kind);if(!sh)return;
  const k=gkOf(o);const shp=G.players[sh];const names={p:nm(sh),k:nm(k)};const rec=res=>anLog(m,i,sh,kind,res);m._ck={kind,hdr:!!header,pid:sh};
  if(kind==='pen'){s.sot++;let cv=0.76+(hasT(shp,'penalty')?0.08:0)+(hasT(shp,'ice')?0.04:0)+(shp?(shp.ca-72)/400:0)-(k&&hasT(G.players[k],'shotstopper')?0.04:0);
    if((m.aet||m.min>=80)&&Math.abs(m.sc[0]-m.sc[1])<=1&&!hasT(shp,'ice'))cv-=0.04;
    if(rand()<clamp(cv,0.55,0.92)){goal(m,i,sh,'pen','pen');logShot(m,i,'goal');rec('goal');}else{addEv(m,i,'save',fill(T.penMiss,names));if(k)o.rt[k]=(o.rt[k]??6.4)+0.6;logShot(m,i,'save');rec('save');}return;}
  const onT=kind==='fk'?0.36+(hasT(shp,'deadball')?0.16:0)+(hasT(shp,'shot')?0.05:0):kind==='rfk'?0.4+(s.drill||0)*0.0015:kind==='cnt'?0.5:header?0.55:0.46;
  if(rand()>onT){
    if(rand()<0.35){s.corners++;if(!header){const ck=cornerKind(m,i);if(ck){logShot(m,i,'miss');rec('miss');chance(m,i,ck==='cor',ck);return;}}}
    if(m.live&&rand()<0.5)addEv(m,i,'miss',fill(pick(kind==='fk'||kind==='rfk'?T2.fkMiss:T.miss),names));s.rt[sh]=(s.rt[sh]??6.4)-0.05;logShot(m,i,'miss');rec('miss');return;}
  s.sot++;const q=s.str.A/(o.str.D*0.6+o.str.gk*0.4);let gp=clamp(0.24*Math.pow(q,1.4),0.1,0.46);if(header)gp*=0.9;if(shp)gp*=clamp(Math.pow(shp.ca*(0.72+0.28*shp.fit/100)/Math.max(30,s.str.A),0.6),0.8,1.2);
  gp*=shotMod(m,s,o,shp,header,kind);
  let trapped=false;if(o.tac.trap&&kind!=='fk'&&kind!=='rfk'){gp*=o.str.D<58?1.25:1.12;trapped=rand()<0.25;}
  if(rand()<gp){if(kind!=='fk'&&rand()<0.025){const defs=o.xi.filter((pid,j)=>pid&&j>0&&j<6);const og=defs.length?pick(defs):sh;goal(m,i,og,'og','og');}else goal(m,i,sh,header?'hdr':trapped?'trap':'',kind);logShot(m,i,'goal');rec('goal');}
  else{if(k)o.rt[k]=(o.rt[k]??6.4)+0.15;if(m.live&&rand()<0.65)addEv(m,i,'save',fill(pick(T.save),names));logShot(m,i,'save');rec('save');}
}
function goal(m,i,pid,flag,kind){
  const s=m.sides[i],o=m.sides[1-i];m.sc[i]++;const gk=gkOf(o);const v={p:nm(pid),k:nm(gk)};
  const txt=flag==='og'?fill(T.og,v):flag==='pen'?fill(T.pen,v):kind==='fk'?fill(pick(T2.fk),v):kind==='cnt'?fill(pick(T2.cnt),v):kind==='lt'?fill(pick(T2.lt),v):kind==='cor'?fill(pick(T2.cor),v):kind==='fkx'?fill(T.header[1],v):flag==='hdr'?fill(T.goal[1],v):flag==='trap'?fill(T.trap,v):fill(pick(T.goal),v);
  if(flag==='og'){o.rt[pid]=(o.rt[pid]??6.4)-0.8;}else{s.rt[pid]=(s.rt[pid]??6.4)+1.0;}
  if(gk)o.rt[gk]=(o.rt[gk]??6.4)-0.3;o.xi.forEach((p,j)=>{if(p&&j>0&&j<5)o.rt[p]=(o.rt[p]??6.4)-0.08;});
  let ast=null;if(flag!=='og'&&flag!=='pen'&&kind!=='fk'&&rand()<0.75){const AW={WG:3,IF:2.6,WH:1.6,CF:1.2,FB:.8,CH:.5,GK:.05};let tot=0;const arr=s.xi.filter(p=>p&&p!==pid&&!s.off[p]).map(p=>{const w=(AW[s.roles[p]]||1)*((s.fx&&s.fx.asW&&s.fx.asW[s.xi.indexOf(p)])||1);tot+=w;return [p,w];});let r=rand()*tot;for(const [p,w] of arr){r-=w;if(r<=0){ast=p;break;}}}
  if(kind==='cor'||kind==='lt'||kind==='fkx'){const tk=spTaker(s,kind==='lt'?'lt':kind==='cor'?'cor':'fk');if(tk&&tk!==pid)ast=tk;}
  if(ast)s.rt[ast]=(s.rt[ast]??6.4)+0.4;
  addEv(m,i,'goal',txt+(ast&&m.live?` Set up by ${nm(ast)}.`:''));m.goals.push({min:m.min,side:i,pid,ast,name:G.players[pid]?G.players[pid].n:'Trialist',flag:flag==='hdr'||flag==='trap'?'':flag,kind:kind||''});
}
function injury(m,i){
  const s=m.sides[i];const cands=s.xi.map((pid,k)=>[pid,k]).filter(([pid,k])=>pid&&k>0&&!s.hob[pid]&&!s.off[pid]);if(!cands.length)return;
  const [pid,slot]=injPick(cands);const ip=hasT(G.players[pid],'injprone');const days=Math.round((rand()<(ip?0.24:0.15)?ri(28,90):ri(3,21))*(ip?1.25:1));m.inj.push({pid,days});
  addEv(m,i,'inj',fill(pick(T.inj),{p:nm(pid)}));
  if(G.subs>=1&&s.sub&&!s.subUsed){doSub(m,i,slot);}
  else{s.hob[pid]=true;if(m.live)addEv(m,i,'inj',fill(T.hobble,{p:nm(pid)}));s.str=strength(s);}
}
function doSub(m,i,slot){
  const s=m.sides[i];const off=s.xi[slot];const on=s.sub;if(!on||s.subUsed)return;
  s.xi[slot]=on;s.subUsed=true;s.played.push(on);s.rt[on]=6.3;s.roles[on]=FORMS[s.form].s[slot][0];s.subMin[on]=m.min;s.str=strength(s);
  addEv(m,i,'sub',fill(T.sub,{c:club(s.cid).s,on:nm(on),off:nm(off)}));
}
function runToEnd(m,et){while(!m.done)mStep(m);if(et&&m.sc[0]===m.sc[1]){const fi=m.ev.findIndex(e=>e.k==='ft');if(fi>-1)m.ev.splice(fi,1);addEv(m,-1,'et',T.et);m.max=120;m.done=false;m.aet=true;while(!m.done)mStep(m);}return m;}

/* ---------- gates ---------- */
const PRICEM=[0.8,1,1.25],ATTM=[1.12,1,0.85],PRICEL=['Cheap','Standard','Dear'];
const UPG={
 lottery:{n:"Supporters' club lottery",cost:1500,wk:2,inc:120,desc:"A weekly draw run by the supporters' club. Steady money every week."},
 shop:{n:'Programme and club shop',cost:5000,wk:4,inc:90,desc:'Better programmes, scarves and rosettes on sale. More money every week.'},
 lights:{n:'New floodlight pylons',cost:12000,wk:6,att:.03,desc:'Brighter lights for midweek matches. Home crowds up about 3%.'},
 cover:{n:'Roof over the terrace',cost:25000,wk:8,att:.06,desc:'Keeps the rain off the regulars. Home crowds up about 6%.'},
 stand:{n:'New main stand',cost:90000,wk:20,att:.12,rep:3,desc:"A proper modern stand with seats. Home crowds up about 12%, and the club's standing rises."},
 tr_pitch:{n:'Training pitches',cost:8000,wk:6,cat:'train',desc:'Two proper pitches of your own. Players under 28 improve a little faster and recover their fitness quicker.'},
 tr_gym:{n:'Gymnasium and treatment room',cost:15000,wk:8,cat:'train',desc:"Weights, a heat lamp and a physio's couch. Fewer injuries, and quicker recovery from them."},
 tr_digs:{n:"Apprentices' hostel",cost:12000,wk:10,cat:'train',desc:'Proper digs for the young lads. A better youth intake, with an extra apprentice every summer.'},
 tr_court:{n:'Indoor ball court',cost:20000,wk:10,cat:'train',desc:'Five-a-side all winter long, whatever the weather. Players under 24 develop faster.'}
};
const upgDone=k=>{const c=G&&G.clubs&&G.clubs[G.user.club];const u=c&&c.upg;return !!(u&&u[k]&&u[k].done<=G.date);};
function upgAtt(){return Object.keys(UPG).reduce((t,k)=>t+(upgDone(k)?(UPG[k].att||0):0),0);}
function upgWeekly(){return Object.keys(UPG).reduce((t,k)=>t+(upgDone(k)?(UPG[k].inc||0)*infl():0),0);}
const otherWeekly=cid=>club(cid).rep*5*infl()+(cid===U()?upgWeekly():0)+tvFee(cid);
const runCost=cid=>Math.round(Math.pow(club(cid).rep,1.5)*0.85*infl()*(G.user&&cid===G.user.club&&upgDone('freehold')?0.85:1));
function attendance(fx,est){if(fx.comp==='EU')return euAtt(fx,est);if(fx.comp==='LC'&&fx.venue==='Wembley')return est?97000:Math.round(rf(94000,100000)/10)*10;
  const h=club(fx.h),a=club(fx.a);const d=h.div;const base=[26000,15000,8500,5500][d];const avg=[78,56,43,35][d];
  let att=base*Math.pow(h.rep/avg,1.6)*Math.pow(a.rep/60,0.3)*(1-0.012*(G.year-1960)+(G.year>=1966?0.08:0))*(est?1:rf(.85,1.15));
  if(fx.comp==='FA')att*=1.25+fx.r*0.1;
  if(fx.comp==='LC')att*=fx.r>=5?1.25:0.62+fx.r*0.1;
  if(fx.h===U()&&!fx.neutral){att*=ATTM[G.user.price]*(1+upgAtt())*(0.8+fans()/250)*(1+(G.user.fever||0)*0.015);att=Math.min(att,capacity(U()));}
  if(fx.r===7)att=100000;else if(fx.neutral)att=est?62000:rf(55000,70000);
  return Math.round(clamp(att,1500,fx.r===7?100000:72000)/10)*10;
}
const price=()=>0.125*(1+0.05*(G.year-1960));
const priceFor=cid=>price()*(cid===U()?PRICEM[G.user.price]:1);
function gate(fx,att){
  fx.att=att;const inc=att*priceFor(fx.neutral?'':fx.h);
  const give=(cid,v,cup)=>{club(cid).bal+=v;if(cid===U()){G.user.fin.gate+=v;G.user.fin[cup?'gateC':'gateL']+=v;if(cup&&!G.autopilot){const o=fx.h===U()?fx.a:fx.h;(G.user.cupLog=G.user.cupLog||[]).push({d:G.date,comp:fx.comp,eu:fx.eu,r:fx.r,leg:fx.leg||0,opp:o,att,share:Math.round(v),total:Math.round(inc),split:v<inc,replay:!!fx.rpl||fx.id<0,venue:fx.venue||(fx.neutral?'a neutral ground':fx.h===U()?club(U()).g:club(fx.h).g)});}}};
  if(fx.comp==='FA'||fx.comp==='LC'||(fx.comp==='EU'&&fx.neutral)){give(fx.h,inc*.45,1);give(fx.a,inc*.45,1);}else give(fx.h,inc,fx.comp!=='L');
}
function mdayRestore(){const md=G.user.mday;if(!md)return false;const k={...md};delete k.day;Object.assign(G.user,k);G.user.mday=null;UI.mdBack=true;return true;}
function finalize(m,noGate){if(m.us>=0&&G.user.mday)mdayRestore();
  const fx=m.fx;fx.hg=m.sc[0];fx.ag=m.sc[1];fx.p=true;fx.aet=m.aet;
  fx.ev=m.goals.map(g=>[g.min,g.side,g.name,g.flag]);
  const res=[Math.sign(fx.hg-fx.ag),Math.sign(fx.ag-fx.hg)];
  m.sides.forEach((s,i)=>{const extra=(s.tac.tempo===2?3:0)+(s.tac.tackle===2?2:0);const motQ=s.cid===U()?staffQ('mot'):0;
    s.played.forEach(pid=>{const p=G.players[pid];if(!p)return;const TB={GK:.3,FB:3.2,CH:3.6,WH:3,IF:1.4,WG:.8,CF:.5};const osh=m.terr[1-i]/Math.max(1,m.terr[0]+m.terr[1]);const mins=s.subMin[pid]!=null?(m.max-s.subMin[pid])/m.max:1;const tk=Math.max(0,Math.round((TB[s.roles[pid]]||1)*osh*2*[.8,1,1.25][s.tac.tackle]*(p.ca/70)*mins*rf(.5,1.5)));p.tkl=(p.tkl||0)+tk;let r=(s.rt[pid]??6.4)+tk*0.05+res[i]*0.35+(rand()-.5)*0.8;r=Math.round(clamp(r,3.5,10)*10)/10;s.rt[pid]=r;
    p.apps++;p.car.a++;p.rs+=r;p.form.push(r);if(fx.comp==='L'){p.mr=(p.mr||0)+r;p.ma=(p.ma||0)+1;}if(p.form.length>5)p.form.shift();
    p.fit=Math.max(30,p.fit-ri(12,20)-(age(p)>31?4:0)-extra+(s.cid===U()&&fx.a===U()&&upgDone('coach')?4:0));p.mor=clamp(p.mor+(res[i]>0?5+motQ/2:res[i]<0?-4:1)+(r>=7.5?3:r<5.5?-3:0),10,100);});});
  m.goals.forEach(g=>{if(g.flag!=='og'){const p=G.players[g.pid];if(p){p.gls++;p.car.g++;}}if(g.ast){const a=G.players[g.ast];if(a)a.ast=(a.ast||0)+1;}});
  milestones(m,fx);discipline(m);
  m.inj.forEach(({pid,days})=>{const p=G.players[pid];if(!p)return;p.inj=Math.max(p.inj,days);hurt(p,p.inj,`against ${cn(p.c===fx.h?fx.a:fx.h)}`);});
  if(!noGate)gate(fx,m.att);
  if(m.us>=0){tacAfter(m);fx.urt=m.sides[m.us].rt;if(fx.id>0)G.user.whip=false;if(fx.comp==='L')boardAfter(fx);
    const pf=G.pressFx&&G.pressFx[fx.id];if(pf){if(pf.bet){const r=res[m.us];if(r>0){G.user.conf=clamp(G.user.conf+3,0,100);}else if(r<0){G.user.conf=clamp(G.user.conf-4,0,100);sq(U()).forEach(p=>p.mor=clamp(p.mor-4,5,100));}}delete G.pressFx[fx.id];}
    if(fx.id>0){recordMatch(fx,m);staffMatch(fx,m);fansAfter(fx);storyMatch(fx,m);scoutMatch(fx);crowdTrouble(fx);if(res[m.us]>0)winBonusPay();if(fx.comp==='L'&&G.user.spirit>0)G.user.spirit--;captainMatch(fx,m.sides[m.us].played);if(fx.comp==='L')secondString(fx,m.sides[m.us].played);const my=m.sc[m.us],th=m.sc[1-m.us];if(fx.comp==='L'&&chairT()==='show'){if(my>=3)bumpConf(1);else if(my===0&&th===0)bumpConf(-1.5);}}
    if(fx.id>0&&!(fx.comp!=='L'&&!fx.leg&&fx.hg===fx.ag))matchPaper(fx,m);}
}
/* a drawn tie gets a real replay: midweek, at the other ground, on the fixture list */
function rplLimit(f){const D=f.comp==='FA'?(G.cup&&G.cup.dates):f.comp==='LC'?(G.lc&&G.lc.dates):(G.eu&&G.eu.dates);const x=D&&D[f.r+1];return x?(Array.isArray(x)?x[0]:x):null;}
function replayDate(f,base){const lim=rplLimit(f);const busy=d=>G.fx.some(x=>x.date===d&&(x.h===f.h||x.a===f.h||x.h===f.a||x.a===f.a));let any=null;
  for(let k=2;k<=13;k++){const d=addDays(base,k);if(lim&&d>=lim)break;if(busy(d))continue;const wd=new Date(d+'T12:00:00Z').getUTCDay();if(wd===2||wd===3)return d;if(!any&&wd!==6&&wd!==0)any=d;}return any;}
function scheduleReplay(P,n,h,a,neutral,base){const d=replayDate(P,base||P.date);if(!d)return null;
  const f={id:G.fxid++,date:d,comp:P.comp,r:P.r,eu:P.eu,div:P.div,h,a,p:false,neutral:!!neutral,rpl:n,par:P.id};if(neutral)f.venue=P.comp==='FA'&&P.r===7?'Old Trafford':'a neutral ground';
  if(isUserFx(f)&&typeof clearClash==='function')clearClash(U(),d,f);G.fx.push(f);sortFx();P.pend=true;
  if(isUserFx(P)){const opp=P.h===U()?P.a:P.h;msg('club',`${compShort(P)} ${P.comp==='FA'?'replay':'play-off'} fixed`,`We meet ${cn(opp)} again on ${fmtDate(d)}, ${neutral?'at a neutral ground':f.h===U()?'at home':`at ${club(f.h).g}`}. ${P.comp==='FA'?'If it is still level after ninety minutes, there will be extra time.':'Extra time if needed.'}`);}
  return f;}
function resolveReplay(f){const P=G.fx.find(x=>x.id===f.par);if(!P)return;const lbl=f.comp==='FA'?['','Replay','Second replay','Third replay'][f.rpl]:['','Play-off','Second play-off'][f.rpl];
  const note=`${lbl}: ${cn(f.h)} ${f.hg}-${f.ag} ${cn(f.a)}${f.aet?' (a.e.t.)':''}`;P.notes=(P.notes||[]).concat([note]);f.rep=note;
  const done=w=>{P.w=w;P.pend=false;P.rep=(P.aggNote?P.aggNote+' · ':'')+P.notes.join(' · ');f.w=w;
    if(P.comp==='FA'){cupHook(P);if(isUserFx(P))msg('club',w===U()?'Through after a replay':'Out of the Cup after a replay',P.rep,null,w===U()?U():true);}else koHook(P);};
  if(f.hg!==f.ag){done(f.hg>f.ag?f.h:f.a);return;}
  const nf=f.rpl<(f.comp==='FA'?3:2)?scheduleReplay(P,f.rpl+1,f.a,f.h,true,f.date):null;
  if(nf){P.rep=(P.aggNote?P.aggNote+' · ':'')+P.notes.join(' · ')+` · Another ${f.comp==='FA'?'replay':'play-off'} on ${fmtDate(nf.date,true)}`;return;}
  P.notes.push('');const w=rand()<.5?P.h:P.a;P.notes[P.notes.length-1]=`${cn(w)} go through on the toss of a coin.`;done(w);}
function resolveCup(fx){if(fx.rpl)return resolveReplay(fx);
  if(fx.hg!==fx.ag){fx.w=fx.hg>fx.ag?fx.h:fx.a;cupHook(fx);return;}
  const rf=scheduleReplay(fx,1,fx.a,fx.h,!!fx.neutral);if(rf){fx.rep=`Replay on ${fmtDate(rf.date,true)}`;return;}
  return resolveCupNow(fx);}
function resolveCupNow(fx){
  const notes=[];let h=fx.a,a=fx.h,neutral=fx.neutral;
  for(let k=0;k<3;k++){
    const rfx={id:-1,comp:'FA',r:fx.r,h,a,neutral,date:fx.date};const m=runToEnd(newMatch(rfx,false),true);finalize(m,k>0);
    notes.push(`${k?'Second replay':'Replay'}: ${cn(h)} ${m.sc[0]}-${m.sc[1]} ${cn(a)}${m.aet?' (a.e.t.)':''}`);
    if(m.sc[0]!==m.sc[1]){fx.w=m.sc[0]>m.sc[1]?h:a;break;}
    [h,a]=[a,h];neutral=true;
  }
  if(!fx.w){fx.w=rand()<.5?fx.h:fx.a;notes.push(`${cn(fx.w)} go through on the toss of a coin.`);}
  fx.rep=notes.join(' · ');cupHook(fx);
  if(fx.h===U()||fx.a===U())msg('club',fx.w===U()?'Through after a replay':'Out of the Cup after a replay',fx.rep,null,fx.w===U()?U():true);
}

/* ---------- inbox and newspapers ---------- */
function msg(type,title,body,act,paper,front){const m={id:G.iid++,date:G.date,type,title,body,act:act||null,read:false,paper:!!paper,cid:typeof paper==='string'&&paper!=='big'?paper:null,big:!!front||paper==='big'||(!!G.user&&paper===G.user.club)};
  G.inbox.unshift(m);if(G.inbox.length>220)G.inbox.length=220;if(paper&&G.paperQ){G.paperQ.push(m.id);if(G.paperQ.length>8)G.paperQ.shift();}return m;}
const DERBY=[['MUN','MCI'],['LIV','EVE'],['ARS','TOT'],['ARS','CHE'],['TOT','CHE'],['SHW','SHU'],['NEW','SUN'],['AVL','BIR'],['WBA','WOL'],['AVL','WBA'],['BRC','BRR'],['NFO','NCO'],['POR','SOU'],['CHE','FUL'],['BLB','BRN'],['BOL','BLP'],['PNE','BLP'],['LEE','HUD'],['MID','SUN'],['NOR','IPS'],['STK','PVA'],['WHU','MIL'],['CAR','SWA'],['BRA','BPA'],['CRY','CHA'],['ORI','WHU'],['LEI','NFO'],['COV','BIR'],['DER','NFO'],['HUL','GRI'],['BAR','ROT'],['CRE','CHS'],['WRE','CHS'],['OLD','ROC'],['DAR','HAR'],['WOR','CRL'],['EXE','PLY'],['BOU','SOU'],['WAL','WOL'],['PET','NTN'],['DON','ROT'],['SHU','ROT'],['ACC','BLB'],['BRY','BOL'],['LEE','SHW'],['MID','NEW']];
const isDerby=(a,b)=>DERBY.some(([x,y])=>(x===a&&y===b)||(x===b&&y===a));
function matchPaper(fx,m){
  const me=U(),home=fx.h===me,opp=home?fx.a:fx.h;const my=home?fx.hg:fx.ag,th=home?fx.ag:fx.hg;const C=club(me).s.toUpperCase(),O=club(opp).s.toUpperCase(),M=surname(G.user.name).toUpperCase();
  const gap=teamRating(opp)-teamRating(me);const u=m.us;const cnt={};m.goals.filter(g=>g.side===u&&g.flag!=='og').forEach(g=>cnt[g.pid]=(cnt[g.pid]||0)+1);
  const hat=Object.entries(cnt).find(([,n])=>n>=3);let head=null;
  const cup=fx.comp!=='L',derby=isDerby(me,opp);
  if(hat)head=`${surname(G.players[hat[0]].n).toUpperCase()} HAT-TRICK SINKS ${O}`;
  else if(cup&&my>th&&gap>=6)head=`GIANT-KILLERS! ${C} DUMP ${O} OUT OF THE CUP`;
  else if(cup&&my<th&&gap<=-6)head=`CUP SHOCK: ${O} KNOCK OUT ${C}`;
  else if(derby&&my>th)head=`${C} RULE THE ROOST`;
  else if(derby&&my<th)head=`DERBY MISERY FOR ${M}`;
  else if(my>th&&gap>=6)head=`${C} STUN ${O}`;
  else if(my-th>=4)head=`${C} RUN RIOT`;
  else if(th-my>=4)head=`${C} HUMBLED BY ${O}`;
  if(!head)return;
  const sc=fx.ev.filter(e=>e[1]===u).map(e=>`${e[2]} (${e[0]}${e[3]==='pen'?', pen':e[3]==='og'?', o.g.':''})`).join(', ');
  msg('press',head,`${cn(fx.h)} ${fx.hg}, ${cn(fx.a)} ${fx.ag}. ${fx.att?`A crowd of ${fx.att.toLocaleString('en-GB')} saw it at ${m.ground}. `:''}${sc?`Scorers for ${club(me).s}: ${sc}.`:''}`,null,me);
}

/* ---------- press conferences ---------- */
const PRESS={
 season:[
  {q:"A new season, boss. What should the supporters expect from {C} this year?",a:[
   {t:"We'll be up there at the end. Mark my words, we'll be the talk of the League.",fx:{mor:5,pull:4,conf:3,boast:1},res:"The lads walk a little taller. The board like the ambition, but they will hold you to it.",head:"'MARK MY WORDS' SAYS {M}"},
   {t:"Steady progress. We'll take each game as it comes.",fx:{mor:2,conf:2},res:"A sensible answer. Nobody's front page, but the directors nod along.",head:"{M} PROMISES STEADY PROGRESS"},
   {t:"Honestly? It'll be a hard season. Don't expect miracles.",fx:{mor:-3,conf:-2,pull:-2,modest:1},res:"The dressing room is a bit flat, but you have lowered expectations. Beat them and you'll get the credit.",head:"'NO MIRACLES,' WARNS {M}"}]},
  {q:"The fans want to know if there's money to spend. Are you in the market?",a:[
   {t:"The chequebook is open. Any player worth his salt, we'll go and get him.",fx:{pull:5,conf:-2},res:"Agents and players all over the country prick up their ears. The chairman winces.",head:"{M}: CHEQUEBOOK IS OPEN"},
   {t:"If the right man becomes available, we'll be there.",fx:{pull:2},res:"A few players will have noticed.",head:"{C} READY TO STRENGTHEN"},
   {t:"I've every faith in the lads I've got.",fx:{mor:5,pull:-2},res:"The squad appreciates the vote of confidence.",head:"{M} BACKS HIS PLAYERS"}]}],
 cup:[
  {q:"{CUP}, boss. Could this be the year for {C}?",a:[
   {t:"We're going to Wembley. Write it down.",fx:{me:1.02,mor:3,bet:1},res:"The players are fired up. Now they have to deliver, or the papers will remind everyone.",head:"'WE'RE GOING TO WEMBLEY'"},
   {t:"Every tie's a Cup final. We'll respect {O} and do our job.",fx:{me:1.01},res:"Measured, professional. The squad knows what is expected.",head:"{M} WARY OF {O}"},
   {t:"{O} are a fine side. We'll just see how we go.",fx:{opp:.99},res:"You have talked them up. Perhaps they'll believe their own press.",head:"{M} PRAISES {O}"}]},
  {q:"{O} are saying they'll knock you out. What do you make of that?",a:[
   {t:"Talk is cheap. We'll do our talking on the pitch.",fx:{me:1.015},res:"The dressing room enjoyed that one.",head:"{M} HITS BACK AT {O}"},
   {t:"They're welcome to their opinion. I hope their boots fit on the day.",fx:{me:1.01,opp:1.02,mor:4},res:"Your lads love it. So will {O}: it'll be pinned on their dressing-room wall.",head:"WAR OF WORDS AHEAD OF CUP TIE"},
   {t:"Fair play to them. We'll be ready.",fx:{mor:1},res:"Nothing for the headline writers.",head:"CALM {M} READY FOR {O}"}]}],
 derby:[
  {q:"Derby day, boss. The whole town is talking about nothing else. What's your message?",a:[
   {t:"This town is ours. It always has been and it always will be.",fx:{me:1.03,opp:1.03,mor:5,bet:1},res:"Both dressing rooms are now at boiling point. Win and you're a hero.",head:"'THIS TOWN IS OURS!'"},
   {t:"Two points, same as any other game.",fx:{me:1.01},res:"The fans wanted more fire, but the players stay level-headed.",head:"COOL {M} PLAYS DOWN DERBY"},
   {t:"They've a good side. We'll show them some respect.",fx:{opp:.99,mor:-1},res:"The opposition might relax a touch. Some of your own supporters are not happy.",head:"{M} RESPECTFUL AHEAD OF DERBY"}]}],
 top:[
  {q:"Top-of-the-table clash on Saturday. Can {C} last the pace?",a:[
   {t:"We're the best side in this division, and Saturday will prove it.",fx:{me:1.02,mor:3,pull:2,bet:1},res:"Bold. The players believe it. Now go and prove it.",head:"'WE'RE THE BEST' CLAIMS {M}"},
   {t:"There's a long way to go. Feet on the ground.",fx:{conf:2},res:"The board like a manager who keeps his head.",head:"{M} KEEPS FEET ON THE GROUND"},
   {t:"All the pressure is on {O}.",fx:{opp:.98,mor:1},res:"A little mind game. {O} might just feel it.",head:"PRESSURE ON {O}, SAYS {M}"}]}],
 hot:[
  {q:"That's three wins on the bounce, boss. What's changed?",a:[
   {t:"Nothing. We've been playing like this all season. The results have caught up.",fx:{mor:3,pull:1},res:"The players like hearing it. Confidence is high.",head:"'NOTHING'S CHANGED' SAYS {M}"},
   {t:"The lads have worked hard for this. It's all down to them.",fx:{mor:4},res:"The dressing room glows. The players feel appreciated.",head:"{M} HAILS HIS PLAYERS"},
   {t:"Three wins means nothing if we lose on Saturday.",fx:{me:1.01,conf:1},res:"A sensible answer. Nobody gets carried away.",head:"NO COMPLACENCY FROM {M}"}]},
  {q:"{C} are flying. Are you the side to beat now?",a:[
   {t:"Anyone who wants to beat us had better bring their best.",fx:{me:1.02,opp:1.02,mor:2,bet:1},res:"Bold words. {O} will have read them.",head:"'BRING YOUR BEST' WARNS {M}"},
   {t:"Ask me again in April.",fx:{conf:2},res:"The board like a manager who keeps his counsel.",head:"{M} REFUSES TO GET CARRIED AWAY"},
   {t:"We're not the finished article. Not yet.",fx:{mor:-1,conf:1},res:"Some of the players wanted more credit than that.",head:"'NOT FINISHED YET' SAYS {M}"}]}],
 cold:[
  {q:"Three defeats in a row. What's gone wrong?",a:[
   {t:"I'll take the blame. It's on me to put it right.",fx:{mor:3,conf:-1},res:"The players appreciate you shielding them. The board are less sure.",head:"{M} TAKES THE BLAME"},
   {t:"Some of them need to look at themselves. It isn't good enough.",fx:{mor:-4,me:1.02},res:"A few players are stung. It might fire them up. It might not.",head:"'NOT GOOD ENOUGH' BLASTS {M}"},
   {t:"We've been unlucky. The performances have been better than the results.",fx:{pull:-1},res:"Nobody in the room quite believes it.",head:"{M} BLAMES BAD LUCK"}]},
  {q:"The supporters are getting restless. What do you say to them?",a:[
   {t:"Stick with us. We'll turn this round.",fx:{fans:3},res:"A plea the terraces seem willing to hear, for now.",head:"'STICK WITH US' PLEADS {M}"},
   {t:"I understand their frustration. I feel it too.",fx:{fans:2,mor:1},res:"An honest answer. It goes down well.",head:"{M} SHARES FANS' PAIN"},
   {t:"They should get behind the team, not on its back.",fx:{fans:-4,mor:2},res:"The players like it. The terraces do not.",head:"{M} HITS BACK AT CRITICS"}]}],
 week:[
  {q:"What do you make of {O}, boss?",a:[
   {t:"A decent side, but we'll beat them.",fx:{me:1.01,opp:1.01,mor:2},res:"Confident. {O} will have something to prove.",head:"{M} EXPECTS TO BEAT {O}"},
   {t:"Every side in this league can hurt you. We'll be ready.",fx:{me:1.01},res:"A safe answer. Nobody learns anything, which is how you like it.",head:"{M} WARY OF {O}"},
   {t:"I haven't given them a thought. I'm only worried about us.",fx:{opp:.99,mor:1},res:"A little dismissive. {O} may take that as an insult.",head:"{M} SNUBS {O}"}]},
  {q:"Any team news for Saturday?",a:[
   {t:"You'll find out at three o'clock like everyone else.",fx:{pull:-1,opp:.99},res:"The reporters groan. {O} are none the wiser.",head:"{M} KEEPS HIS CARDS CLOSE"},
   {t:"Same eleven, if they're all fit. They've earned it.",fx:{mor:2},res:"The regulars are pleased. The reserves less so.",head:"{M} STICKS WITH HIS MEN"},
   {t:"One or two might be looking over their shoulder.",fx:{mor:-1,me:1.01},res:"The squad sharpen up in training this week.",head:"{M} WARNS HIS PLAYERS"}]},
  {q:"The crowds are down across the League. Is the game losing its way?",a:[
   {t:"Give people exciting football and they'll come. We intend to.",fx:{fans:2,pull:1},res:"The supporters like the sound of that.",head:"{M} PROMISES ENTERTAINMENT"},
   {t:"It's the television. People would rather stay in.",fx:{pull:1},res:"A few older reporters nod along.",head:"{M} BLAMES THE TELLY"},
   {t:"Not at {C}. Our supporters are the best in the country.",fx:{fans:3,bet:1},res:"That will be pinned up in a few pubs near the ground.",head:"'BEST FANS IN THE COUNTRY' SAYS {M}"}]}],
 pressure:[
  {q:"Results haven't been good. Is your job on the line?",a:[
   {t:"I'll turn this round. Judge me in May.",fx:{conf:4,mor:2,bet:1},res:"The board give you a little breathing space. Saturday matters now.",head:"'JUDGE ME IN MAY'"},
   {t:"Some of the players have let me down, and they know who they are.",fx:{mor:-7,conf:2,rnd:[{me:1.03},{me:.97}]},res:"That will either shake them up or lose you the dressing room.",head:"{M} SLAMS HIS PLAYERS"},
   {t:"I take full responsibility. The buck stops with me.",fx:{conf:-2,mor:5},res:"The players rally round you. The board are less impressed.",head:"{M}: BUCK STOPS WITH ME"}]}]
};
function pressCheck(f){
  if(!G.press||G.press.done[f.id])return null;const ctxs=[];const opp=f.h===U()?f.a:f.h;
  const lp=G.fx.filter(x=>x.comp==='L'&&x.p&&isUserFx(x)).length;
  if(!PRESS.euro)PRESS.euro=PRESS_EURO;if(f.comp==='L'&&lp===0)ctxs.push('season');
  if(G.press.count<7){
    if(f.comp==='EU')ctxs.push('euro');if((f.comp==='FA'&&f.r>=2)||(f.comp==='LC'&&f.r>=4))ctxs.push('cup');
    if(isDerby(U(),opp))ctxs.push('derby');
    if(f.comp==='L'&&G.user.games>=10){const t=table(f.div);const pos=id=>t.findIndex(r=>r.id===id);if(pos(U())<4&&pos(opp)<4)ctxs.push('top');}
    if(G.user.conf<30&&G.user.games>=6&&rand()<.5)ctxs.push('pressure');
    const fm=formOf(U()).slice(-3);if(fm.length===3&&rand()<.13){if(fm.every(r=>r==='W'))ctxs.push('hot');else if(fm.every(r=>r==='L'))ctxs.push('cold');}
    if(f.comp==='L'&&lp>0&&rand()<.008)ctxs.push('week');}
  if(!ctxs.length)return null;const ctx=ctxs[0];G.press.done[f.id]=true;G.press.count++;
  if(!PRESS.euro)PRESS.euro=PRESS_EURO;const q=pick(PRESS[ctx]);const rep=nextRep();return {ctx,fx:f.id,opp,qi:PRESS[ctx].indexOf(q),rep,ans:null,cup:compShort(f)};
}
function pressVars(opp){return {C:club(U()).s,O:club(opp).s,M:surname(G.user.name),CUP:(UI.press&&UI.press.cup)||'The Cup'};}
function applyPress(P,ai){if(!PRESS.euro)PRESS.euro=PRESS_EURO;
  const q=PRESS[P.ctx][P.qi];const a=q.a[ai];const e={...a.fx};const u=G.user;
  if(e.rnd){Object.assign(e,pick(e.rnd));}
  if(e.mor)sq(U()).forEach(p=>p.mor=clamp(p.mor+e.mor,5,100));
  if(e.conf)u.conf=clamp(u.conf+e.conf,0,100);
  if(e.pull)u.pull=clamp((u.pull||0)+e.pull,-10,10);
  if(e.fans){const c=club(U());c.fans=clamp(fans()+e.fans,0,100);}
  if(e.me||e.opp||e.bet)G.pressFx[P.fx]={me:e.me||1,opp:e.opp||1,bet:!!e.bet};
  if(e.boast)u.boast=true;if(e.modest)u.modest=true;
  const v=pressVars(P.opp);const V={C:v.C.toUpperCase(),O:v.O.toUpperCase(),M:v.M.toUpperCase()};
  const VO=voiceOf(P.rep);const pm=msg('press',fill(a.head,V),VO?VO.story(G.user.name,club(P.opp).n,fill(a.t,v)):`${G.user.name} told ${P.rep.n} of ${P.rep.o}: "${fill(a.t,v)}"`,null,U());pm.pic='rep:'+P.rep.look;P.react=pick(REACT[P.rep.look]||['He writes it all down.']);
  const chips=[];if(e.mor>0)chips.push(['up','Dressing room lifted']);if(e.mor<0)chips.push(['down','Dressing room unsettled']);
  if(e.conf>0)chips.push(['up','Board approve']);if(e.conf<0)chips.push(['down','Board unimpressed']);
  if(e.pull>0)chips.push(['up','Players keener to join']);if(e.pull<0)chips.push(['down','Players less keen to join']);
  if(e.me>1)chips.push(['up','Your side fired up for this match']);if(e.me<1)chips.push(['down','Your side a little flat']);
  if(e.opp>1)chips.push(['down','Opponents riled']);if(e.opp<1)chips.push(['up','Opponents lulled']);if(e.bet)chips.push(['warn','You have to deliver now']);
  P.ans=ai;P.chips=chips;P.res=fill(a.res,v);
}

/* ---------- new game ---------- */
const NM={
 eng:{old:['Stan','Reg','Cyril','Wilf','Len','Alf','Sid','Harold','Walter','Albert','Ernie','Arthur','Bernard','Fred','Harry','Jack','Ted','Les','Eric','Norman','Ron','Bill','George','Tom','Frank','Jim','Joe','Charlie','Dennis','Ken','Roy','Horace','Cliff','Doug','Vic'],
  mid:['John','Brian','Peter','David','Alan','Tony','Ken','Terry','Colin','Roy','Ron','Derek','Barry','Keith','Graham','Jimmy','Tommy','Bobby','Mick','Malcolm','Gordon','Ian','Trevor','Clive','Maurice','Mike','Roger','Bill','Dave','Geoff','Ray','Dennis','Eddie','Bernard','Stuart','Eric','Frank','George','Harry','Jack','Les','Norman','Ron','Ted'],
  young:['Steve','Gary','Paul','Kevin','Phil','Martin','Mick','Alan','Trevor','Tony','Dave','Ian','Keith','Barry','Terry','Colin','Roger','Graham','Peter','John','David','Brian','Chris','Mike','Neil','Robert','Billy','Jimmy','Tommy','Derek','Geoff','Malcolm','Les','Glen'],
  last:['Smith','Taylor','Brown','Wilson','Robinson','Wright','Walker','Thompson','White','Hughes','Edwards','Green','Hall','Wood','Harris','Martin','Jackson','Clarke','Turner','Hill','Scott','Cooper','Morris','Ward','Moore','King','Watson','Baker','Harrison','Young','Allen','Mitchell','Phillips','Lee','Bell','Parker','Roberts','Shaw','Holmes','Barker','Dixon','Bradley','Atkinson','Marsden','Pickering','Hodgson','Ramsbottom','Entwistle','Sutcliffe','Greenwood','Crossley','Haworth','Pilling','Whittaker','Bottomley','Fairclough','Ackroyd','Butterworth','Holroyd','Lomax','Heap','Duckworth','Ormerod','Spencer','Cartwright','Tranter','Hammond','Kitchen','Cheetham','Oldroyd','Dobson','Stringer','Fletcher','Gibbons','Pearce','Mellor','Swift','Bentley','Buckley','Firth','Horsfall','Tattersall','Lister','Varley','Gill','Chapman','Lowe','Webb','Kirby','Rowley','Simpson','Marshall','Hunt','Knight','Cox','Mason','Wells','Barnes','Hart','Bird','Booth','Dawson','Frost','Gregory','Hope','Lambert','Nicholls','Peacock','Sharp','Tipton','Weston','Wheeler']},
 sco:{old:['Willie','Jimmy','Sandy','Hughie','Archie','Alex','Jock','Tam','Bobby','Jim','Hugh','Dougie','Davie','Andy'],mid:['Willie','Jimmy','Sandy','Hughie','Archie','Alex','Jackie','Tommy','Bobby','Ian','Billy','Davie','Jim','Hugh','Dougie','Eddie','George','John','Bill'],young:['Kenny','Alistair','Jimmy','Billy','Tommy','Ian','Davie','Willie','John','Gordon','Eddie','Peter','Alex','Graeme'],
  last:['McLeod','Cameron','Ferguson','McKay','Stewart','Reid','Murray','Fraser','Campbell','McDonald','Robertson','Wallace','Hamilton','Ross','Gray','Duncan','Munro','McIntosh','Baird','Crawford','Kerr','Morrison','Gillies','Sinclair','McBride','Anderson','Paterson','McLean','Henderson','Kinnear','Cowan','Rennie']},
 wal:{old:['Dai','Ivor','Gwyn','Trevor','Emlyn','Cliff','Ron','Ken','Mel','Glyn','Wyn','Idris'],mid:['Dai','Glyn','Gwyn','Ivor','Mel','Cliff','Terry','Ron','Ken','Alan','John','Graham','Trevor','Dilwyn','Barrie','Huw'],young:['Gareth','Huw','Alan','John','Terry','Phil','Leighton','Dai','Wyn','Keith','Graham','Peter'],
  last:['Jones','Davies','Evans','Williams','Rees','Price','Pritchard','Powell','Probert','Llewellyn','Vaughan','Hopkins','Griffiths','Morgan','Lewis','Thomas','Bowen','Jenkins','Howells','Parry','Owen','Rowlands']},
 iri:{old:['Paddy','Pat','Mick','Johnny','Jimmy','Tommy','Danny','Peter','Frank'],mid:['Pat','Mick','Tony','Jimmy','Johnny','Noel','Brendan','Eamonn','Kevin','Danny','Liam','Paddy','Terry'],young:['Liam','Kevin','Pat','Mick','Tony','Gerry','Sean','Eamonn','Noel','Brendan','Martin','Paddy'],
  last:['Doyle','Byrne','Kelly','Ryan','Walsh','Nolan','Murphy','O\'Neill','Brennan','Kennedy','Quinn','Flynn','Brady','Kavanagh','Dunne','Lynch','Moran','Hegarty','McGrath','Connolly','Fitzpatrick','Carroll']}};
const WELSHC=['CAR','SWA','NPT','WRE'];
/* a name that fits the man's birth and background: never a real player's, and never one already at the same club. Common names may turn up at other clubs, as they did. */
const FAMOUSN=new Set(['Bernard Shaw','Clive Swift','John Lennon','Paul McCartney','George Harrison','Harold Wilson','Ted Heath','Edward Heath','Alan Bennett','Peter Cook','Jack Hawkins','David Frost','John Major','Tony Hancock','Sid James','Ron Moody','Frank Ifield','Cliff Richard','Bobby Charlton','Jimmy Hill','Tommy Steele','Billy Fury','Alf Ramsey','Stan Laurel','Charlie Chaplin','John Steed','Fred Perry','Graham Hill','Jim Clark','Stirling Moss','David Hemmings','Terry Thomas','Kenneth Williams','Brian Clough','Peter Taylor','Tommy Cooper','Les Dawson','Arthur Askey','Arthur Lowe','Dick Emery','Harry Secombe','Peter Sellers','Michael Caine','Roger Moore','Sean Connery','Alan Ball','Martin Peters','George Best','Denis Law','John Charles','Bobby Moore','Jack Charlton','Ray Wilson','Roger Hunt','Geoff Hurst','Nobby Stiles','Gordon Banks','George Cohen','Ian Smith','Ian Paisley','Kevin Keegan','Joe Mercer','Matt Busby','Bill Shankly','Don Revie','Tommy Docherty','Ron Greenwood','Bill Nicholson','Harry Catterick','Walter Winterbottom','Stanley Matthews','Tom Finney','Billy Wright','Nat Lofthouse']);
function genName(b,cid){const yb=b||1938;const era=yb<1935?'old':yb>=1945?'young':'mid';const r=rand();const wel=cid&&WELSHC.includes(cid);
  const nat=wel?(r<0.55?'wal':r<0.85?'eng':r<0.93?'sco':'iri'):(r<0.72?'eng':r<0.86?'sco':r<0.93?'wal':'iri');const N=NM[nat];
  let n='';for(let k=0;k<40;k++){n=pick(N[era])+' '+pick(N.last);if(realNames().has(n)||FAMOUSN.has(n))continue;if(cid&&G&&G.players&&sq(cid).some(p=>p.n===n))continue;return n;}return n;}
function mkPlayer(o){const id=G.pid++;const p={id,n:o.n,pos:o.pos,b:o.b,ca:o.ca,pa:Math.max(o.pa||o.ca,o.ca),c:o.c||null,fit:100,mor:65,inj:0,w:0,apps:0,gls:0,ast:0,tkl:0,rs:0,form:[],car:{a:0,g:0},real:!!o.real,listed:false,hist:[]};
  p.w=wageFor(p);p.until=G?G.year+ri(0,3):1960;G.players[id]=p;SQ=null;return p;}
const DIVBASE=[64,56,49,43],DIVREP=[78,56,43,35];
function genPlayer(cid,pos,young){const c=club(cid);const d=c.div;let ca=Math.round(DIVBASE[d]+(c.rep-DIVREP[d])/3+ri(-6,4));
  const b=young?G.year-ri(15,17):G.year-ri(18,33);const a=G.year-b;if(young)ca=Math.round(ca*0.82);ca=clamp(ca,28,80);
  let pa=a<=22?clamp(ca+ri(0,young?22:12),ca,90):ca;if(young&&cid===U())pa=clamp(pa+2*staffQ('youth')+(upgDone('tr_digs')?4:0),ca,92);const gp=mkPlayer({n:genName(b,cid),pos,b,ca,pa,c:cid});if(young){gp.acad=true;gp.w=Math.min(gp.w,8);}return gp;}
function fillSquad(cid){const need={GK:2,FB:4,CH:2,WH:3,IF:3,WG:3,CF:2};const have={};sq(cid).forEach(p=>{if(!p.acad)have[p.pos]=(have[p.pos]||0)+1;});
  for(const [pos,n] of Object.entries(need))for(let k=have[pos]||0;k<n;k++)genPlayer(cid,pos);
  while(sq(cid).filter(p=>!p.acad).length<20)genPlayer(cid,pick(['FB','WH','IF','WG','CF','CH']));}
function aiForm(y){const r=rand();if(y<1962)return r<.65?'W-M':r<.8?'4-2-4':r<.9?'3-3-4':'Revie';if(y<1965)return r<.35?'W-M':r<.75?'4-2-4':r<.88?'4-3-3':r<.95?'3-3-4':'Cat';
  if(y<1967)return r<.12?'W-M':r<.45?'4-2-4':r<.8?'4-3-3':r<.93?'4-4-2':'Cat';return r<.05?'W-M':r<.22?'4-2-4':r<.65?'4-3-3':r<.93?'4-4-2':'Cat';}
function ensureState(){
  const u=G.user;u.tac=u.tac||{...DEFTAC};u.staff=u.staff||[];u.price=u.price==null?1:u.price;u.upg=u.upg||{};u.pull=u.pull||0;u.bh=u.bh||[];
  u.lastFriendly=u.lastFriendly||'1900-01-01';u.lastAsk=u.lastAsk||'1900-01-01';
  G.sid=G.sid||1;G.settings=G.settings||{papers:'auto'};if(G.settings.papers===true)G.settings.papers='auto';if(G.settings.papers===false)G.settings.papers='off';G.paperQ=G.paperQ||[];G.press=G.press||{count:0,done:{}};G.pressFx=G.pressFx||{};
  ['gate','gateL','gateC','sales','buys','wages','other','staff','friend','build','run'].forEach(k=>u.fin[k]=u.fin[k]||0);
  Object.values(G.clubs).forEach(c=>{if(!c.tac)c.tac=aiTac(c.id);});
  if(!G.staffPool)G.staffPool=genStaffPool();
  if(!u.budget)setBudgets();if(u.budget.rec==null)u.budget.rec=u.budget.transfer/Math.max(1,u.budget.transfer+u.budget.wage*52);
  if(!u.cab)u.cab=migrateCab(u.trophies||[]);
  if(u.upg&&Object.keys(u.upg).length){const c=club(U());c.upg=Object.assign(c.upg||{},u.upg);u.upg={};}
  if(G.foreignY==null){(DATA.foreign||[]).filter(f=>f[7]<=G.year).forEach(addForeign);G.foreignY=G.year;}
  if(!u.souvenirs)u.souvenirs=G.inbox.filter(m=>m.special).reverse().map(m=>({title:m.title,body:m.body,date:m.date,type:'press',cid:m.cid,special:m.special}));
  DATA.hist.forEach((e,i)=>{if(MARKERS.includes(e)&&e.d<G.date&&!G.histDone[i])G.histDone[i]=true;});if(G.tv==null)G.tv=G.date>='1968-08-03'?3:G.date>='1967-07-02'?2:G.date>='1964-08-22'?1:0;
  if(G.lc===undefined)G.lc=null;if(G.eu===undefined)G.eu=null;if(!u.obj&&G.fx&&G.fx.length&&G.clubs[u.club])objGen();if(!u.scrap){u.scrap=[];(u.souvenirs||[]).forEach(sv=>scrap('Souvenir',sv.title,sv.body,sv.date,{doc:sv}));u.scrapId=0;}
  if(!u.contract)newContract(U(),2);if(u.earn==null)u.earn=0;fans();G.recs=G.recs||{};
  Object.values(G.players).forEach(p=>{if(p.ast==null){p.ast=0;p.tkl=0;}if(p.until==null&&p.c&&p.c!=='ABR')p.until=G.year+ri(0,3);if(p.miles&&p.miles.length>8)p.miles=p.miles.slice(-8);});
  tacInit();acadInit();
}
function migrateCab(list){const byName=n=>{const c=Object.values(G.clubs).find(c=>c.n===n);return c?c.id:U();};const out=[];
  list.forEach(t=>{const par=(t.match(/\(([^)]+)\)\s*$/)||[])[1];let m=t.match(/^(Division \w+) Champions (\d{4})/);if(m){out.push({k:'league',div:DIVN.indexOf(m[1]),y:+m[2],club:byName(par)});return;}m=t.match(/^FA Cup (\d{4})/);if(m)out.push({k:'cup',y:+m[1],club:byName(par)});});return out;}
function newGame(cid,name,hist){
  G={v:2,year:1960,date:'1960-08-01',hist,user:{club:cid,name,form:'W-M',ment:1,xi:[],sub:null,conf:60,career:[],trophies:[],fin:{},games:0},
    clubs:{},players:{},divs:[[],[],[],[]],fx:[],fxid:1,pid:1,iid:1,sid:1,inbox:[],histDone:{},wageCap:20,subs:0,deadline:false,record:[],expect:{},cup:null,summary:null,over:false,sacked:false};
  SQ=null;
  for(const c of DATA.clubs){G.clubs[c.id]={id:c.id,n:c.n,s:c.s,div:c.d-1,c1:c.c1,c2:c.c2,m:c.m,g:c.g,rep:c.r,bal:Math.round(c.r*c.r*14/100)*100,form:'W-M',ment:1,hon:[]};G.divs[c.d-1].push(c.id);
    if(c.p)c.p.split(';').forEach(s=>{const [n,pos,b,ca,pa]=s.split(',');const bb=+b,cc=+ca;const a=1960-bb;mkPlayer({n,pos,b:bb,ca:cc,pa:pa?+pa:(a<=23?cc+ri(2,8):cc),c:c.id,real:true});});}
  for(const id of Object.keys(G.clubs))fillSquad(id);
  (DATA.foreign||[]).filter(f=>f[7]<=1960).forEach(addForeign);G.foreignY=1960;G.euNext=[{cid:'BRN',comp:'EC'},{cid:'WOL',comp:'CWC'},{cid:'BIR',comp:'FC'}];
  const uc=club(cid);uc.m=name;
  ensureState();
  buildSeason(1960);
  G.user.form=uc.form;const b=bestXI(cid,G.user.form);G.user.xi=b.xi;G.user.sub=b.sub;
  const exp=expFor(cid),n=G.divs[uc.div].length;
  msg('board',`Welcome to ${uc.g}`,`The directors of ${uc.n} welcome you as manager for the ${seasonLbl(1960)} season.\n\n${chairOf(cid).n}: "${chairSay('welcome',cid)}"\n\n${boardTarget(exp,n,uc.div)}\n\nThe club has ${money(uc.bal)} in the bank, and the board have set a transfer budget of ${money(G.user.budget.transfer)}. Players are on the League's maximum wage of £20 a week, so for now, transfer fees are where the money goes.\n\nHave a look at the Backroom tab: a good trainer or coach can make all the difference. The new season kicks off on ${fmtDate(firstFixtureDate())}.`);
  msg('press','FOOTBALL IS BACK','Tottenham, Wolves and Burnley are fancied for the title. The new Football League Cup starts this autumn, and the PFA, led by Fulham\'s Jimmy Hill, is campaigning to scrap the maximum wage.',null,true);
}
function boardTarget(exp,n,div){
  if(div===0&&exp<=3)return 'The board expect a serious challenge for the League Championship.';
  if(div>0&&exp<=3)return 'The board expect promotion.';
  if(exp<=Math.ceil(n/2))return 'The board expect a finish in the top half of the table.';
  if(exp>n-4)return 'The board would accept a battle against relegation, but expect you to survive.';
  return 'The board expect a respectable mid-table finish.';
}
const firstFixtureDate=()=>G.fx.filter(f=>!f.p).reduce((m,f)=>f.date<m?f.date:m,'9999');

/* ---------- budgets ---------- */
function estWeeklyIncome(){const att=attendance({h:U(),a:U(),comp:'L'},true);return att*priceFor(U())*0.55+otherWeekly(U());}
function setBudgets(){const c=club(U());G.user.budget={transfer:Math.max(0,roundFee(c.bal*0.5)),wage:Math.max(Math.round((wageBill(U())+staffBill())*1.12),Math.round(estWeeklyIncome()*0.6))};const b=G.user.budget;const ct=chairOf(U()).t;if(ct==='amb')b.transfer=roundFee(b.transfer*1.25);if(ct==='acct')b.transfer=roundFee(b.transfer*0.85);b.rec=b.transfer/Math.max(1,b.transfer+b.wage*52);}
function seasonEnd(){return G.fx.filter(f=>f.comp==='L').reduce((m,f)=>f.date>m?f.date:m,G.date);}
function forecast(){const c=club(U());const end=seasonEnd();const weeks=Math.max(0,Math.ceil(daysBetween(G.date,end)/7));
  const homes=G.fx.filter(f=>!f.p&&f.h===U()&&f.comp==='L').length;const played=G.fx.filter(f=>f.p&&f.h===U()&&f.comp==='L'&&f.att);
  const perGate=played.length?played.reduce((t,f)=>t+f.att,0)/played.length*priceFor(U()):attendance({h:U(),a:U(),comp:'L'},true)*priceFor(U());
  const other=otherWeekly(U()),out=wageBill(U())+staffBill()+runCost(U())+(G.user.contract?G.user.contract.wage:0);
  return {weeks,homes,perGate,other,out,gates:homes*perGate,end:c.bal+homes*perGate+weeks*(other-out),end_date:end};}

/* ---------- season structure ---------- */
function cupDates(y){return [firstSat(`${y}-11-04`),firstSat(`${y}-11-25`),firstSat(`${y+1}-01-06`),firstSat(`${y+1}-01-27`),firstSat(`${y+1}-02-17`),firstSat(`${y+1}-03-09`),firstSat(`${y+1}-03-23`),firstSat(`${y+1}-05-05`)];}
const CUPR=['First Round','Second Round','Third Round','Fourth Round','Fifth Round','Sixth Round','Semi-final','Final'];
function leagueDates(y,div){
  const cd=cupDates(y);const skip=new Set(div<2?cd.slice(2):cd.slice(0,7));
  let d=firstSat(`${y}-08-19`);const end=`${y+1}-04-30`;const out=new Set();
  while(d<=end){if(!skip.has(d))out.add(d);d=addDays(d,7);}
  const box=`${y}-12-26`;if(dow(box)!==6&&dow(box)!==0)out.add(box);
  const N=div<2?42:46;let need=N-out.size;
  if(need>0){const weds=[];let w=firstDow(`${y}-08-23`,3);while(w<=`${y+1}-04-27`){if(!(w>=`${y}-12-18`&&w<=`${y+1}-01-04`)&&!out.has(w))weds.push(w);w=addDays(w,7);}
    const step=weds.length/need;for(let k=0;k<need;k++)out.add(weds[Math.min(weds.length-1,Math.floor(k*step+step/2))]);}
  let arr=[...out].sort();let extra=`${y+1}-05-02`;while(arr.length<N){arr.push(extra);extra=addDays(extra,1);}arr.sort();
  return arr.slice(0,N);
}
function roundRobin(ids){const t=shuffle(ids.slice());const n=t.length;const rounds=[];
  /* home and away alternate: whoever has had more home games, or was at home last time, goes away */
  const H={},last={};ids.forEach(id=>{H[id]=0;last[id]=0;});const bal=(a,b)=>{let h=H[a]<H[b]||(H[a]===H[b]&&(last[a]<last[b]||(last[a]===last[b]&&rand()<.5)))?a:b;const w=h===a?b:a;H[h]++;H[w]--;last[h]=1;last[w]=-1;return [h,w];};
  for(let r=0;r<n-1;r++){const rd=[];for(let i=0;i<n/2;i++){const a=t[i],b=t[n-1-i];rd.push(bal(a,b));}rounds.push(rd);t.splice(1,0,t.pop());}
  return rounds.concat(rounds.map(rd=>rd.map(([a,b])=>[b,a])));}
function sortFx(){G.fx.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.id-b.id);}
function buildSeason(y){
  G.year=y;G.fx=[];G.deadline=false;
  for(let d=0;d<4;d++){const rr=roundRobin(G.divs[d]);const dates=leagueDates(y,d);rr.forEach((rd,k)=>rd.forEach(([h,a])=>G.fx.push({id:G.fxid++,date:dates[k],comp:'L',div:d,h,a,p:false})));}
  G.cup={round:0,alive:G.divs[2].concat(G.divs[3]),byes:[],dates:cupDates(y),winner:null,final:null};
  Object.values(G.clubs).forEach(c=>{c.div=G.divs.findIndex(dv=>dv.includes(c.id));if(c.id!==U()){c.form=aiForm(y);c.ment=1;if(rand()<.3)c.tac=aiTac(c.id);}});
  for(const p of Object.values(G.players)){p.bks=0;p.bkBan=false;p.apps=0;p.gls=0;p.ast=0;p.tkl=0;p.rapps=0;p.rgls=0;p.yapps=0;p.ygls=0;p.rs=0;p.form=[];if(p.c&&p.c!=='ABR'&&p.c!==U())p.w=wageFor(p);}
  G.expect={};for(let d=0;d<4;d++){G.divs[d].map(id=>[id,teamRating(id)]).sort((a,b)=>b[1]-a[1]).forEach(([id],k)=>G.expect[id]=k+1);}
  G.user.cupLog=[];G.user.fin={gate:0,gateL:0,gateC:0,sales:0,buys:0,wages:0,other:0,staff:0,friend:0,build:0,run:0,mgr:0};G.user.games=0;G.user.bal0=club(U()).bal;G.user.rsv=[];G.user.yth=[];G.user.boast=false;G.user.modest=false;
  G.press={count:0,done:{}};G.pressFx={};
  G.staffPool=genStaffPool();G.user.staff.forEach(s=>s.w=Math.round((6+7*s.q)*(G.wageCap?0.8:1)*infl()*(s.raise||1)));
  setBudgets();
  cupDraw();lcStart(y);euStart(y);sortFx();objGen();newProjects(y);if(G.user.xi.length)storySeason();
}
function cupDraw(){
  const c=G.cup;let teams=c.alive.slice();if(c.round===2)teams=teams.concat(G.divs[0],G.divs[1]);
  shuffle(teams);const n=teams.length;let ties;
  if(c.round<2)ties=Math.floor(n/2);else{let p=1;while(p*2<=n)p*=2;ties=n===p?n/2:n-p;}
  const playing=teams.slice(0,ties*2);c.byes=teams.slice(ties*2);c.alive=[];
  for(let i=0;i<ties;i++)G.fx.push({id:G.fxid++,date:c.dates[c.round],comp:'FA',r:c.round,h:playing[2*i],a:playing[2*i+1],p:false,neutral:c.round>=6});
  const mine=G.fx.find(f=>f.comp==='FA'&&f.r===c.round&&(f.h===U()||f.a===U()));
  if((mine&&c.round>=2)||c.round>=5)wireDraw('FA',CUPR[c.round],G.fx.filter(f=>f.comp==='FA'&&f.r===c.round),mine||null,null,{full:c.round>=5});
  if(mine){const home=mine.h===U();msg('club',`FA Cup ${CUPR[c.round]} draw`,`The draw has been made. ${mine.neutral?`We meet ${cn(home?mine.a:mine.h)} at ${c.round===7?'Wembley':'a neutral ground'}`:home?`We are at home to ${cn(mine.a)}`:`We travel to ${cn(mine.h)}`} on ${fmtDate(mine.date)}.`);}
  else if(c.byes.includes(U()))msg('club',`FA Cup ${CUPR[c.round]}`,`We have been given a bye into the next round.`);
  sortFx();
}
function cupAdvance(){
  const c=G.cup;if(c.winner)return;const ties=G.fx.filter(f=>f.comp==='FA'&&f.r===c.round&&!f.rpl);if(!ties.length||ties.some(f=>!f.p||!f.w))return;
  c.alive=ties.map(f=>f.w).concat(c.byes);c.byes=[];
  if(c.round===7){c.winner=c.alive[0];c.final=ties[0].id;const w=club(c.winner);w.hon.push(`FA Cup ${seasonLbl(G.year)}`);w.rep=Math.min(95,w.rep+3);
    msg('press',`${w.s.toUpperCase()} WIN THE CUP`,`${w.n} lift the FA Cup at Wembley in front of 100,000. ${cupLine(ties[0])}`,null,c.winner);wireResult('FA',ties[0]);
    if(c.winner===U()){trophyPaper('cup',null,ties[0]);G.user.cab.push({k:'cup',y:G.year,club:U()});G.user.trophies.push(`FA Cup ${seasonLbl(G.year)} (${w.n})`);G.user.conf=clamp(G.user.conf+15,0,100);}
    return;}
  c.round++;cupDraw();
}
function cupLine(f){return `${cn(f.h)} ${f.hg}-${f.ag} ${cn(f.a)}${f.aet?' (a.e.t.)':''}${f.rep?'. '+f.rep:''}`;}

/* ---------- tables ---------- */
const gavg=r=>r.a===0?(r.f>0?99:0):r.f/r.a;
function table(d){const rows={};for(const id of G.divs[d])rows[id]={id,p:0,w:0,dr:0,l:0,f:0,a:0,pts:0,fm:[]};
  for(const f of G.fx){if(f.comp!=='L'||f.div!==d||!f.p)continue;const H=rows[f.h],A=rows[f.a];if(!H||!A)continue;
    H.p++;A.p++;H.f+=f.hg;H.a+=f.ag;A.f+=f.ag;A.a+=f.hg;
    if(f.hg>f.ag){H.w++;A.l++;H.pts+=2;H.fm.push('W');A.fm.push('L');}else if(f.hg<f.ag){A.w++;H.l++;A.pts+=2;A.fm.push('W');H.fm.push('L');}else{H.dr++;A.dr++;H.pts++;A.pts++;H.fm.push('D');A.fm.push('D');}}
  return Object.values(rows).sort((x,y)=>y.pts-x.pts||gavg(y)-gavg(x)||y.f-x.f||cn(x.id).localeCompare(cn(y.id)));}
function zones(d,i,n){if(d===0)return i>=n-2?'down':i===0?'top':'';if(d===1)return i<2?'up':i>=n-2?'down':'';if(d===2)return i<2?'up':i>=n-4?'down':'';return i<4?'up':i>=n-4?'reel':'';}
function scorers(d,n){return Object.values(G.players).filter(p=>p.c&&p.c!=='ABR'&&club(p.c)&&club(p.c).div===d&&p.gls>0).sort((a,b)=>b.gls-a.gls||a.apps-b.apps).slice(0,n||10);}

/* ---------- board ---------- */
function boardAfter(fx){
  const me=U(),home=fx.h===me,opp=home?fx.a:fx.h;const my=home?fx.hg:fx.ag,th=home?fx.ag:fx.hg;const pts=my>th?2:my===th?1:0;
  const exp=clamp(1+(teamRating(me)-teamRating(opp))/20+(home?.2:-.2),.2,1.8);G.user.conf=clamp(G.user.conf+(pts-exp)*2,0,100);G.user.games++;
}
function confText(c){return c>=80?'Delighted':c>=60?'Content':c>=40?'Uneasy':c>=20?'Worried':'Losing patience';}

/* ---------- the treatment room ---------- */
const INJN=[[6,['a dead leg','a knock on the shin','a bruised ankle','a tight calf']],[14,['a twisted ankle','a pulled hamstring','a groin strain','a jarred knee']],[35,['torn ankle ligaments','a thigh strain','a cracked rib','a bad back']],[999,['cartilage trouble','a broken leg','a broken ankle','torn knee ligaments']]];
function injName(days){return pick(INJN.find(([d])=>days<=d)[1]);}
const outFor=d=>d>13?`about ${Math.round(d/7)} weeks`:`${d} day${d===1?'':'s'}`;
function hurt(p,days,where){if(p.c===U()&&upgDone('doctor')&&days>14){days=Math.round(days*0.85);p.inj=days;}p.injN=injName(days);p.injOn=G.date;p.injLen=days;
  if(p.c!==U())return;const u=G.user;(u.injLog||(u.injLog=[])).unshift({pid:p.id,n:p.n,what:p.injN,days,date:G.date,s:G.year,where});if(u.injLog.length>60)u.injLog.length=60;
  msg('med',`${p.n} injured: ${p.injN}`,`${p.n} picked up ${p.injN} ${where}. The trainer expects him to be out for ${outFor(days)}, back around ${fmtDate(addDays(G.date,days))}.${days>35?' It is a bad one. He will need time to get his fitness back.':''}`);}
/* ---------- day-to-day ---------- */
/* how quickly a man gets his legs back: young ones bounce, veterans take their time */
function recRate(p){const a=G.year-p.b;return a<=23?1.1:a<=29?1:a<=31?0.9:a<=33?0.8:0.7;}
const shirtFit=p=>{const f=Math.round(p.fit);return `<i class="sfit ${f<75?'f-lo':f<88?'f-mid':'f-ok'}" title="Fitness ${f}%">${f}%</i>`;};
const fitTag=p=>{const f=Math.round(p.fit);return `<em class="fitp ${f<75?'f-lo':f<88?'f-mid':'f-ok'}" title="Fitness ${f}%${G.year-p.b>=31?'. An older player: he takes longer to recover between matches':''}">${f}%</em>`;};
function dailyTick(d){
  G.date=d;fixClashes(d);const fitQ=staffQ('fit'),motQ=staffQ('mot');
  for(const p of Object.values(G.players)){if(!p.c||p.c==='ABR')continue;const mine=p.c===U();if(p.fit<100)p.fit=Math.min(100,p.fit+(4+(mine?fitQ*0.5+(upgDone('tr_pitch')?0.5:0)+(upgDone('tr_sauna')?0.8:0):0))*recRate(p));
    if(p.inj>0){p.inj--;if(mine&&fitQ&&p.inj>0&&rand()<fitQ*0.04){p.inj--;staffImp('fit',1);}if(mine&&p.inj>0&&upgDone('tr_gym')&&rand()<0.08)p.inj--;if(mine&&p.inj>0&&upgDone('tr_medical')&&rand()<0.1)p.inj--;if(!p.inj&&mine){p.injBack=G.date;if((p.injLen||0)>45){p.comeback=true;p.comebackDays=daysBetween(p.injOn||G.date,G.date);p.comebackWhat=p.injN||'injury';}msg('med',`${p.n} back in training`,`${p.n} has recovered from ${p.injN||'his injury'}${p.injOn?` after ${plu(daysBetween(p.injOn,G.date),'day')} out`:''} and is available for selection.`);}if(!p.inj)p.injN=null;}
    p.mor+=((mine?(p.moodT??(65+3*motQ)):65)-p.mor)*(mine?0.02:0.01);}
  histTick(d);euDaily(d);dealTick(d);squareBudget();monthAwards(d);deadlineDay(d);mindGames(d);trialDay(d);acadMonth(d);ycTick(d);contractMemo(d);takeoverTick(d);scrapSweep();
  {const ff=G.fx.filter(f=>f.comp==='L'&&isUserFx(f)).reduce((m,f)=>f.date<m?f.date:m,'9999');if(ff!=='9999'&&d>=addDays(ff,-4)&&d<ff)radioStart();}
  Object.keys(UPGS()).forEach(k=>{const u=UPGS()[k];if(u.done===d){msg('club',`${UPG[k].n} complete`,`The work is finished. ${UPG[k].desc}`,null,U());openingNight(k);if(UPG[k].rep)club(U()).rep=Math.min(95,club(U()).rep+UPG[k].rep);}});
  if(d===`${G.year+1}-01-02`){const ex=sq(U()).filter(p=>p.until!=null&&p.until<=G.year);if(ex.length)msg('club','Contracts running out',`These players are out of contract in the summer: ${ex.map(p=>`${p.n} (£${p.w} a week)`).join(', ')}.\n\nOpen a player's card in the Squad to offer him a new contract.${G.year<1963?' Under the retain-and-transfer system you can keep anyone you do not re-sign, though he will not be happy.':' Anyone you do not re-sign will leave on a free transfer.'}`);}
  if(dow(d)===1)weekly();
  if(!G.deadline&&d>=`${G.year+1}-03-16`){G.deadline=true;msg('press','Transfer deadline passes','Players signed from now on cannot play in League matches this season, so the clubs have closed their books until the summer.');}
  G.inbox.forEach(mm=>{if(mm.act&&!mm.act.done&&mm.act.exp&&d>mm.act.exp){if(mm.act.k==='poach'){poachReply(mm,false);return;}if(mm.act.k==='trial'){trialClose(mm);return;}mm.act.done=true;mm.act.res='Expired';}});
}
function weekly(){
  for(const c of Object.values(G.clubs)){const wb=wageBill(c.id);const rc=runCost(c.id);c.bal-=wb+rc;const oth=otherWeekly(c.id);c.bal+=oth;
    if(c.id===U()){G.user.fin.wages+=wb;G.user.fin.run+=rc;G.user.fin.other+=oth;const sb=staffBill();c.bal-=sb;G.user.fin.staff+=sb;const k=G.user.contract;if(k){c.bal-=k.wage;G.user.fin.mgr=(G.user.fin.mgr||0)+k.wage;G.user.earn=(G.user.earn||0)+k.wage;}
      moodWeekly();tacWeekly();rumWeekly();staffWeekly();fansWeekly();feverWeekly();objWeekly();captainWeekly();storyWeekly();poachCheck();scoutWeekly();bankWatch();moneyStories();approachCheck();if(chairT()==='acct')bumpConf(c.bal<0?-1.5:0.15);}else if(c.bal<-5000)sellToSurvive(c);}
  mktWeekly();
  if(!G.deadline)for(let k=0;k<3;k++)aiTransfer();
  userBids();
  const u=G.user;u.bh.push([G.date,Math.round(club(U()).bal)]);if(u.bh.length>200)u.bh.shift();
  if(club(U()).bal<-25000*infl())u.conf=clamp(u.conf-1,0,100);
}
function sellToSurvive(c){const s=sq(c.id).filter(p=>p.inj===0).sort((a,b)=>b.ca-a.ca);if(s.length<18)return;const p=s[ri(1,4)];
  const buyers=Object.values(G.clubs).filter(b=>b.id!==c.id&&b.id!==U()&&b.bal>valueOf(p)*1.2&&b.rep>=c.rep-8);if(!buyers.length)return;transfer(p,pick(buyers).id,valueOf(p));}
function aiTransfer(){
  const all=Object.values(G.clubs).filter(c=>G.autopilot||c.id!==U());const buyer=pick(all);const budget=buyer.bal*0.6;if(budget<300)return;
  const slots=FORMS[buyer.form].s;const bx=bestXI(buyer.id,buyer.form);let worst=0,wv=1e9;
  bx.xi.forEach((pid,i)=>{const v=pid?eff(G.players[pid],slots[i][0]):0;if(v<wv){wv=v;worst=i;}});const role=slots[worst][0];
  let best=null,bs=-1,bfee=0;
  for(const p of Object.values(G.players)){
    if(p.pos!==role||p.ret||p.ban||p.eu||p.trial||p.rum||p.acad||p.c===buyer.id||p.c===U()||p.c==='ABR')continue;const a=age(p);if(a>31||p.ca<wv+3)continue;
    let fee=0;if(p.c){const sel=club(p.c);if(sel.rep>buyer.rep+4||sq(p.c).length<=17)continue;fee=askPrice(p);}
    if(fee>budget)continue;const sc=p.ca-a*0.3+(p.listed?5:0)+rand()*6;if(sc>bs){bs=sc;best=p;bfee=fee;}}
  if(!best)return;transfer(best,buyer.id,best.c?roundFee(bfee*rf(1,1.12)):0);
  if(sq(buyer.id).length>26)releaseWorst(buyer.id);
}
function releaseWorst(cid){const s=sq(cid).filter(p=>!p.acad).sort((a,b)=>(a.ca-(age(a)>29?5:0))-(b.ca-(age(b)>29?5:0)));const p=s[0];if(p){setClub(p,null);p.listed=false;}}
function transfer(p,to,fee,why){
  if(userLock(p,to,why))return false;
  const from=p.c;const wasKey=from===U()&&sq(U()).slice().sort((a,b)=>b.ca-a.ca).indexOf(p)<3;const fc=from&&from!=='ABR'?club(from):null,tc=club(to);
  if(fc){fc.bal+=fee;if(from===U()){G.user.fin.sales+=fee;G.user.budget.transfer+=Math.round(fee*0.75);}}
  if(tc){tc.bal-=fee;if(to===U()){G.user.fin.buys+=fee;G.user.budget.transfer=Math.max(0,G.user.budget.transfer-fee);}}
  if(G.clubs[from]&&G.clubs[to]&&fee>(G.recFee||55000)){G.recFee=fee;if(from===U()||to===U())achGive('record');}
  p.hist.push({y:G.year,from,to,fee});setClub(p,to,why||'sold');p.listed=false;p.mor=75;p.w=wageFor(p);p.until=G.year+ri(1,3);
  if(from===U()){removeFromUser(p);const R=REC(U());if(!R.recSale||fee>R.recSale.fee)R.recSale={n:p.n,club:to,fee,y:G.year};G.user.lastSale={n:p.n,d:G.date};if(wasKey)club(U()).fans=clamp(fans()-5,0,100);
    msg('press',`${surname(p.n).toUpperCase()} SOLD TO ${tc.s.toUpperCase()}`,`${cn(from)} have sold ${p.n} to ${tc.n}${fee?` for ${money(fee)}`:''}.`,null,U());}
  else if(to===U()){const R=REC(U());if(fee&&(!R.recBuy||fee>R.recBuy.fee))R.recBuy={n:p.n,club:from,fee,y:G.year};}
  else if(isStory(fee,p))msg('press',`${p.n.toUpperCase()} JOINS ${tc.s.toUpperCase()}`,`${tc.n} have signed ${p.n} from ${fc?fc.n:'abroad'} for ${money(fee)}.`,null,storyPaper(p,to,from));
}
function userBids(){
  if(G.deadline)return;const mine=sq(U()).slice().sort((a,b)=>b.ca-a.ca);const pending=new Set(G.inbox.filter(m=>m.act&&m.act.k==='offer'&&!m.act.done).map(m=>m.act.pid));
  mine.forEach((p,i)=>{if(pending.has(p.id))return;const ch=p.listed?0.35:i<4?0.03:0;if(rand()>=ch)return;
    const v=valueOf(p);const buyers=Object.values(G.clubs).filter(c=>c.id!==U()&&c.bal>v*0.9&&c.rep>=club(U()).rep-15);if(!buyers.length)return;
    const b=pick(buyers);const fee=roundFee(v*(p.listed?rf(.75,1.05):rf(1.05,1.5)));offer(b.id,p.id,fee);});
  if(G.year<1966){const star=mine.find(p=>p.ca>=80&&age(p)<=29&&!pending.has(p.id));if(star&&rand()<0.02){const to=pick(G.year<1962?['Juventus','AC Milan','Internazionale','Torino','Real Madrid','Barcelona']:['Juventus','AC Milan','Internazionale','Torino','Roma']);const fee=roundFee(valueOf(star)*rf(1.3,1.7));
    bidQ(msg('transfer',`${to} want ${star.n}`,`${to} have flown a director over with an offer of ${money(fee)} for ${star.n}, and a salary he could only dream of here. The offer stands for ten days.`,{k:'abroad',pid:star.id,fee,to,exp:addDays(G.date,10)}));}}
}
function offer(cid,pid,fee,note){const p=G.players[pid];bidQ(msg('transfer',`${club(cid).n} bid for ${p.n}`,`${club(cid).n} have offered ${money(fee)} for ${p.n}.${note?' '+note:''} The offer stands for a week.`,{k:'offer',club:cid,pid,fee,exp:addDays(G.date,7)}));}

/* ---------- the chairman writes when the rules change ---------- */
const RULE_LETTERS={
 maxwage:{t:'The maximum wage',n:["You will have read in this morning's papers that the Football League has abolished the maximum wage. The £20 ceiling is gone. From today, players may be paid whatever a club believes they are worth.","I need hardly tell you that this changes everything. The best men will want paying, and the clubs with money will pay them. The board has raised your wage budget to cover the rises already agreed.","Spend it wisely. Every pound on the wage bill is a pound that cannot go on the ground or into the transfer market."],
  p:["One has read, with some alarm, that the maximum wage has been abolished. Footballers may now be paid whatever they can extract from us.","The board has raised your wage budget to cover what has already been agreed. One expects prudence, dear boy. This club is not a charity for footballers, however gifted.","Any player who arrives at your door demanding a fortune is to be reminded of the privilege of wearing claret and blue. This behaviour would be most unbecoming."]},
 subs1:{t:'Substitutes',n:["From this season the League permits one substitute in each match, to replace an injured player.","No longer will we finish a match with ten men and a passenger limping on the wing. Name your twelfth man with care on the team sheet. He may well be needed.","I trust you will not use this as an excuse to pick a player who is only half fit."],
  p:["One is informed that the League now permits a substitute, to replace a man who is injured. How very modern.","Do name a sensible twelfth man, dear boy. One does not wish to see a Villa player hobbling about the wing like a wounded pheasant.","Naturally, one expects the substitute to be a gentleman, and to sit quietly until called."]},
 subs2:{t:'Tactical substitutes',n:["The rules have changed again. A substitute may now be used for any reason, not only for injury.","A fresh pair of legs in the last twenty minutes can win a match, and a tired man can be taken off before he costs us one. Use the change well.","The board will be watching how you use it."],
  p:["The rules have changed once more. One may now replace a player simply because he is playing badly. One can think of several occasions this season when that would have been welcome.","Use it with discretion, dear boy. A change for the sake of a change is most unbecoming."]},
 eastham:{t:'The Eastham judgement',n:["Mr Justice Wilberforce has found for George Eastham against Newcastle United. The old retain-and-transfer system has been ruled an unreasonable restraint of trade.","A club can no longer hold a player for ever. When a man's contract runs out, he is far freer to leave. Contracts matter more than they ever have.","Keep a close eye on who is coming to the end of his agreement, and renew the ones we cannot afford to lose before someone else comes knocking."],
  p:["One gathers the High Court has sided with young Eastham, and that clubs may no longer keep a player simply because they wish to.","Do keep an eye on the contracts, dear boy. One would be most put out to lose a good man for nothing because nobody thought to renew his agreement.","This whole business is most unbecoming, but one must move with the times."]}};
function ruleLetter(k){if(G.autopilot)return;const L=RULE_LETTERS[k];if(!L)return;const ch=chairOf(U());const paras=ch.pearsey?L.p:L.n;
  const m=msg('board',`A letter from the chairman: ${L.t}`,paras.join('\n'));m.letter={k,from:ch.n,pearsey:!!ch.pearsey};(G.letterQ=G.letterQ||[]).push(m.id);}
function letterHTML(N){const m=G.inbox.find(x=>x.id===N.mid);if(!m||!m.letter){UI.notice=null;return '';}const c=club(U());
  return `<div class="scrim" data-a="noticeclose"></div><article class="chairletter" role="dialog" aria-modal="true" aria-label="${m.letter.bank?'Letter from the bank':'Letter from the chairman'}">
   ${m.letter.bank?`<header class="lt-head bank"><div class="bank-mark" aria-hidden="true">M</div><div><strong>Midland Bank Limited</strong><small>${esc(c.s)} branch · Private and confidential</small></div></header>`:`<header class="lt-head">${crest(U(),'lg')}<div><strong>${esc(c.n)} Football Club</strong><small>${esc(c.g)} · From the office of the Chairman</small></div></header>`}
   <p class="lt-date">${fmtDate(m.date)}</p><p>Dear ${m.letter.pearsey||m.letter.bank?'Mr '+esc(surname(G.user.name)):esc(G.user.name.split(' ')[0])},</p>
   ${esc(m.body).split('\n').filter(Boolean).map(p=>`<p>${p}</p>`).join('')}
   <p class="lt-close">${m.letter.pearsey?'With the warmest regards, and a stern eye upon the accounts,':m.letter.bank?'I remain, sir, your obedient servant,':'Yours sincerely,'}</p><p class="lt-sig">${esc(m.letter.from)}</p><p class="lt-role">${esc(m.letter.role||'Chairman')}</p>
   <footer class="lt-foot"><button class="btn go" data-a="noticeclose">Put it in the drawer</button></footer></article>`;}
/* ---------- history ---------- */
function findByName(n){return Object.values(G.players).find(p=>p.n===n&&!p.ret);}
function histTick(d){DATA.hist.forEach((e,i)=>{if(G.histDone[i]||e.d>d)return;G.histDone[i]=true;applyHist(e);});}
function applyHist(e){if(e.h==='MATCH OF THE DAY')G.tv=Math.max(G.tv||0,1);if(e.h==='TELEVISION IN COLOUR')G.tv=Math.max(G.tv||0,2);if(e.k==='tv3')G.tv=3;if(e.k==='wcfx'&&G.clubs[G.user.club]){const c=club(U());c.fans=clamp(fans()+3,0,100);}
  const H=G.hist;const P=e.c||true;
  if(e.t==='world'){const mm=msg('world',e.h,e.b,null,'big');mm.force=true;if(e.pic)mm.pic=e.pic;return;}
  if(e.t==='news'){const mm=msg('press',e.h,e.b,null,'big');if(e.pic)mm.pic=e.pic;if(/EASTHAM/.test(e.h))ruleLetter('eastham');return;}
  if(e.t==='rule'){
    if(e.k==='maxwage'){G.wageCap=null;Object.values(G.players).forEach(p=>{if(p.c&&p.c!=='ABR')p.w=p.c===U()?Math.max(p.w,wageFor(p)):wageFor(p);});G.user.budget.wage=Math.max(G.user.budget.wage,Math.round((wageBill(U())+staffBill())*1.1));msg('press',e.h,e.b+' Your wage bill rises accordingly, and the board have raised your wage budget to match.',null,'big');ruleLetter('maxwage');}
    else if(e.k==='subs1'){G.subs=1;msg('press',e.h,e.b,null,'big');ruleLetter('subs1');}
    else if(e.k==='subs2'){G.subs=2;msg('press',e.h,e.b,null,'big');ruleLetter('subs2');}
    else if(e.k==='wc66'){msg('world',e.h,e.b,null,'big');WC66.forEach(n=>{const p=findByName(n);if(p){p.mor=100;p.ca=Math.min(99,p.ca+1);}});if(WC66.filter(n=>{const p=findByName(n);return p&&p.c===U();}).length>=3)achGive('wc66');
      Object.values(G.clubs).forEach(c=>c.rep=Math.min(95,c.rep+1));}
    return;}
  if(!H)return;
  if(e.t==='mgr'){if(e.c===U())return;club(e.c).m=e.m;club(e.c).mq=null;delete club(e.c).vac;msg('press',e.h,e.b,null,e.c,true);return;}
  if(e.t==='arrive'){const ex=findByName(e.p[0]);if(ex){if(ex.c!=='ABR')return;
      if(e.c===U()){ex.listed=true;msg('transfer',`${ex.n} is available`,`In real life ${ex.n} joined ${cn(e.c)} from ${ex.abroad||e.from} around now. That is your club, so the deal is yours to make: find him in Transfers under Abroad.`);return;}
      ex.hist.push({y:G.year,from:'ABR',to:e.c,fee:e.fee});setClub(ex,e.c);ex.abroad=null;ex.w=wageFor(ex);ex.mor=80;club(e.c).bal-=e.fee;if(isStory(e.fee,ex))msg('press',e.h,e.b,null,storyPaper(ex,e.c,null));return;}
    const [n,pos,b,ca,pa]=e.p;
    if(e.c===U()){mkPlayer({n,pos,b,ca,pa,c:null,real:true});msg('transfer',`${n} is available`,`In real life ${n} left ${e.from} to join ${cn(e.c)} around now. That is your club, so the deal is yours to make. He is waiting on your call: find him in Transfers under free agents.`);return;}
    mkPlayer({n,pos,b,ca,pa,c:e.c,real:true});club(e.c).bal-=e.fee;if(isStory(e.fee,{ca}))msg('press',e.h,e.b,null,storyPaper({ca},e.c,null));return;}
  const names=Array.isArray(e.n)?e.n:[e.n];
  if(e.t==='ban'){names.forEach(n=>{const p=findByName(n);if(p){if(p.c===U())removeFromUser(p);setClub(p,null,'banned');p.ban=true;p.ret=true;}});msg('press',e.h,e.b,null,'big');return;}
  const p=findByName(names[0]);if(!p)return;
  if(e.t==='retire'){if(p.c===U())removeFromUser(p);setClub(p,null,'retired');p.ret=true;msg('press',e.h,e.b,null,'big');return;}
  if(e.t==='leave'){
    if(p.c===U()){msg('transfer',`${e.to} want ${p.n}`,`${e.to} have offered ${money(e.fee)} for ${p.n}. In real life he went. Your call, boss.`,{k:'abroad',pid:p.id,fee:e.fee,to:e.to,exp:addDays(G.date,10)});return;}
    if(!p.c||p.c==='ABR'||!club(p.c))return;const fc=club(p.c);fc.bal+=e.fee;p.hist.push({y:G.year,from:p.c,to:'ABR',fee:e.fee});setClub(p,'ABR');p.abroad=e.to;if(isStory(e.fee,p))msg('press',e.h,e.b,null,storyPaper(p,true,null));return;}
  if(e.t==='move'){
    if(p.c===e.c)return;
    if(p.c===U()&&!G.autopilot){offer(e.c,p.id,e.fee,'This is the move that happened in real life.');return;}
    if(e.c===U()&&!G.autopilot){msg('transfer',`${p.n} could be yours`,`In real life ${p.n} moved to ${cn(e.c)} for ${money(e.fee)} around now. His club would listen to offers. Find him in Transfers.`);if(p.c&&p.c!=='ABR'){p.listed=true;}return;}
    if(!p.c&&p.ret)return;
    const from=p.c;if(from==='ABR'){club(e.c).bal-=e.fee;p.hist.push({y:G.year,from:'ABR',to:e.c,fee:e.fee});setClub(p,e.c);p.abroad=null;p.w=wageFor(p);p.mor=80;}
    else transferQuiet(p,e.c,e.fee);
    if(isStory(e.fee,p))msg('press',e.h,e.b,null,storyPaper(p,e.c,null));
  }
}
function transferQuiet(p,to,fee,why){if(userLock(p,to,why))return false;const from=p.c;if(from&&club(from))club(from).bal+=fee;club(to).bal-=fee;p.hist.push({y:G.year,from,to,fee});setClub(p,to,why||'sold');p.listed=false;p.w=wageFor(p);p.mor=80;}
function removeFromUser(p){G.user.xi=G.user.xi.map(x=>x===p.id?null:x);if(G.user.sub===p.id)G.user.sub=null;}

/* ---------- friendlies ---------- */
const FRIENDLY=[['Santos','Brazil, with Pelé',2.4,8000,90,'#ffffff','#111111'],['Real Madrid','Spain',2.2,6000,88,'#ffffff','#5b3b8c'],['Benfica','Portugal',1.8,3500,84,'#d4002a','#ffffff'],['Honvéd','Hungary',1.5,1500,80,'#c8102e','#111111'],['Dynamo Moscow','the Soviet Union',1.7,3000,78,'#ffffff','#1d4f9f'],['Celtic','Scotland',1.6,1500,78,'#1b7a3e','#ffffff'],['Rapid Vienna','Austria',1.3,1200,72,'#1b7a3e','#f6f1e1'],['a local amateur XI','down the road',0.45,0,38,'#8a7a58','#f1ead6']];
function friendlyReady(){const u=G.user;const pre=preSeason();const cup=cupWeekendFree();
  if(!pre&&!cup)return 'Friendlies can only be arranged in pre-season, or on an FA Cup Saturday once we are out of the Cup.';
  if(pre&&((u.preF||{})[G.year]||0)>=3)return 'Three pre-season friendlies is plenty. Any more, says the trainer, and the players will be dead on their feet.';
  if(!pre&&u.lastFriendly===G.date)return 'One friendly per Cup weekend.';return '';}
function playFriendly(i,free){
  const [n,from,draw,fee,str,c1,c2]=FRIENDLY[i];const c=club(U());const my=teamRating(U());
  const att=Math.round(clamp(attendance({h:U(),a:U(),comp:'L'},true)*draw*rf(.9,1.1),800,70000)/10)*10;
  const pay=free?0:Math.round(fee*infl());const inc=Math.round(att*priceFor(U()));const net=Math.round(inc-pay);
  const lamb=(a,b)=>clamp(1.35*Math.pow(a/b,2.2),0.2,5);let g1=0,g2=0;for(let k=0;k<90;k++){if(rand()<lamb(my,str)/90)g1++;if(rand()<lamb(str,my)/90)g2++;}
  c.bal+=net;G.user.fin.friend+=net;if(!free){G.user.lastFriendly=G.date;if(preSeason()){const P=G.user.preF=G.user.preF||{};P[G.year]=(P[G.year]||0)+1;}}
  const top=sq(U()).filter(p=>!p.inj).sort((a,b)=>b.ca-a.ca).slice(0,14);top.forEach(p=>{p.fit=Math.max(40,p.fit-8);});
  let injTxt='';if(rand()<.08&&top.length){const p=pick(top);p.inj=ri(5,20);hurt(p,p.inj,'in the friendly');injTxt=`${p.n} picked up ${p.injN} and will miss ${plu(p.inj,'day')}.`;}
  if(g1>g2&&str>=78)top.forEach(p=>p.mor=clamp(p.mor+4,5,100));
  const head=str>=78?(g1>g2?`${c.s.toUpperCase()} BEAT THE MIGHTY ${n.toUpperCase()}`:`${n.toUpperCase()} DAZZLE UNDER THE LIGHTS`):`FRIENDLY AT ${c.g.toUpperCase()}`;
  const mm=msg('club',head,`${c.n} ${g1}, ${n} ${g2}. A floodlit friendly against the visitors from ${from} drew ${att.toLocaleString('en-GB')} spectators. Gate receipts ${money(inc)}${pay?`, less an appearance fee of ${money(pay)}`:''}: the club made ${money(net)}.${injTxt?' '+injTxt:''}`,null,str>=78?true:false);
  mm.pic='goal';
  return {g1,g2,att,net,n,from,inc,pay,injTxt,c1,c2,date:G.date};
}
/* ---------- matchdays ---------- */
const isUserFx=f=>f.h===U()||f.a===U();
function playDay(date){
  for(const f of G.fx.filter(x=>x.date===date&&!x.p)){const m=runToEnd(newMatch(f,false),!!f.rpl);finalize(m);if(f.comp!=='L')resolveTie(f);}
  cupAdvance();lcAdvance();
  if(!G.sacked&&G.user.conf<10&&G.user.games>=15)sackUser();
  save();
}
function nextDate(){return G.fx.filter(f=>!f.p).reduce((m,f)=>f.date<m?f.date:m,'9999');}
function cont(){
  if(!G||UI.modal||UI.press)return;
  if(G.user.mday&&!G.fx.some(f=>f.date===G.date&&!f.p&&isUserFx(f)))mdayRestore();
  if(G.sacked){UI.screen='sacked';render();return;}
  fixClashes(G.date);const today=G.date;const todays=G.fx.filter(f=>f.date===today&&!f.p);
  if(todays.length){const uf=todays.find(isUserFx);if(uf){if(setupGate())return;UI.gateNote=false;applyVenuePlan(uf);UI.screen='prematch';UI.press=pressCheck(uf);render();return;}
    playDay(today);UI.resDate=today;UI.screen=G.sacked?'sacked':'results';render();window.scrollTo(0,0);return;}
  const nd=nextDate();
  if(nd==='9999'){endSeason();return;}
  let d=today;while(d<nd){d=addDays(d,1);dailyTick(d);if(G.holdDay){G.holdDay=false;break;}}
  UI.screen='game';save();render();
}

/* ---------- season end ---------- */
function develop(p){const a=age(p);let d;if(a<=20)d=ri(2,7);else if(a<=23)d=ri(1,5);else if(a<=27)d=ri(-1,3);else if(a<=30)d=ri(-2,1);else if(a<=32)d=ri(-4,0);else d=ri(-7,-2);
  if(p.c===U()&&a<=21){const yb=ri(0,staffQ('youth'));d+=yb;staffImp('youth',yb);}if(p.c===U()){if(a<=21&&((p.rapps||0)+(p.yapps||0))>=(upgDone('reserves')?10:15))d+=1+(upgDone('reserves')&&rand()<0.4?1:0);if(upgDone('tr_lights')&&a<=25&&rand()<0.5)d+=1;if(upgDone('tr_pitch')&&a<=27)d+=ri(0,1);if(upgDone('tr_court')&&a<=23)d+=1;}
  if(p.c===U())d+=trainDev(p,a);
  if(p.mg){if(p.c===U()&&p.acad)d=Math.max(0,d-Math.floor(p.mg*0.6));p.mg=0;}
  if(p.c===U()&&p.acad){const m=mentorOf(p);if(m){if(rand()<0.5)d+=1;const mine=traitsOf(p);if(mine.length<3){const give=traitsOf(m).filter(k=>!mine.includes(k)&&k!=='oldpro'&&k!=='injprone'&&(TRAITS[k].pos==='*'||TRAITS[k].pos.split(' ').includes(p.pos)));const k=give.length?pick(give):null;
    if(k&&rand()<(TRAITS[k].neg?0.25:0.18)){mine.push(k);msg('club',`${p.n} takes after ${surname(m.n)}`,TRAITS[k].neg?`A year in ${m.n}'s company has rubbed off on young ${p.n}, and not in a good way: the coaches say he has picked up his mentor's temper (${TRAITS[k].n.toLowerCase()}).`:`A year at ${m.n}'s shoulder has rubbed off on young ${p.n}. He has picked up one of his mentor's strengths: ${TRAITS[k].n.toLowerCase()}.`);}}}}
  if(d>0)p.ca=Math.min(p.pa,p.ca+d);else p.ca=Math.max(25,p.ca+d);if(a>29)p.pa=Math.max(p.ca,Math.min(p.pa,p.ca+2));}
function retireCheck(p){if(p.retireAtEnd)return true;const stun=p.apps>=10&&p.rs/p.apps>=7.3;if(p.noRetire===G.year-1)return false;if(p.n==='Stanley Matthews'&&G.hist&&G.year<1965)return false;const a=age(p);let ch=0;if(a>=38)ch=1;else if(a>=35)ch=.5;else if(a>=33)ch=.22;else if(a>=31&&p.ca<48)ch=.15;if(stun)ch*=0.25;return rand()<ch;}
function endSeason(){euPurge();
  const y=G.year;const T=[0,1,2,3].map(table);const ud=club(U()).div;const upos=T[ud].findIndex(r=>r.id===U())+1;
  const summ={y,champs:T.map(t=>t[0].id),runners:T.map(t=>t[1].id),cup:G.cup.winner,final:G.fx.find(f=>f.id===G.cup.final),scor:[0,1,2,3].map(d=>scorers(d,1)[0]).map(p=>p?{n:p.n,c:p.c,g:p.gls}:null),
    user:{club:U(),div:ud,pos:upos,exp:expFor(U()),pts:T[ud][upos-1].pts},moves:[]};
  const up12=T[1].slice(0,2).map(r=>r.id),dn12=T[0].slice(-2).map(r=>r.id),up23=T[2].slice(0,2).map(r=>r.id),dn23=T[1].slice(-2).map(r=>r.id),up34=T[3].slice(0,4).map(r=>r.id),dn34=T[2].slice(-4).map(r=>r.id),reel=T[3].slice(-4).map(r=>r.id);
  summ.promoted=[up12,up23,up34];summ.relegated=[dn12,dn23,dn34];summ.reel=reel;const RVD=G.autopilot?null:reviewData(summ,T);
  G.divs=[G.divs[0].filter(id=>!dn12.includes(id)).concat(up12),G.divs[1].filter(id=>!up12.includes(id)&&!dn23.includes(id)).concat(dn12,up23),
    G.divs[2].filter(id=>!up23.includes(id)&&!dn34.includes(id)).concat(dn23,up34),G.divs[3].filter(id=>!up34.includes(id)).concat(dn34)];
  summ.champs.forEach((id,d)=>{club(id).hon.push(`${DIVN[d]} Champions ${seasonLbl(y)}`);club(id).rep=Math.min(95,club(id).rep+(d===0?4:3));});
  T.forEach((t,d)=>t.slice(1,6).forEach((r,i)=>{const c=club(r.id);const add=(d===0?[3,2,1.5,1,1]:[1.5,1,1,0.5,0.5])[i];c.rep=Math.min(95,c.rep+add);if(r.id===U()&&!G.autopilot)summ.repUp=add;}));
  [].concat(up12,up23,up34).forEach(id=>club(id).rep=Math.min(95,club(id).rep+5));[].concat(dn12,dn23,dn34).forEach(id=>club(id).rep=Math.max(25,club(id).rep-5));
  if(summ.champs[0]!==U())msg('press',`${club(summ.champs[0]).s.toUpperCase()} ARE CHAMPIONS`,`${cn(summ.champs[0])} are champions of the Football League for ${seasonLbl(y)}. ${cn(summ.runners[0])} finish second.`,null,summ.champs[0]);
  const me=U();let dc=(summ.user.exp-upos)*2.5+objJudge();const promoted=[].concat(up12,up23,up34).includes(me),relegated=[].concat(dn12,dn23,dn34).includes(me);
  if(summ.champs[ud]===me){dc+=25;trophyPaper('league',ud,undefined,T[ud]);G.user.cab.push({k:'league',div:ud,y,club:me});G.user.trophies.push(`${DIVN[ud]} Champions ${seasonLbl(y)} (${cn(me)})`);}
  if(promoted)dc+=20;if(relegated)dc-=25;
  if(G.user.boast&&upos>summ.user.exp){dc-=10;msg('press',`${surname(G.user.name).toUpperCase()} EATS HIS WORDS`,`Back in August, ${G.user.name} promised great things. ${cn(me)} finished ${ord(upos)}.`,null,me);}
  if(G.user.modest&&upos<=summ.user.exp){dc+=5;}
  sq(me).forEach(p=>{if(p.promise&&p.promise.k==='raise'){if(p.w<=p.promise.w){p.mor=clamp(p.mor-10,5,100);msg('club',`${p.n} feels let down`,`${p.n} says you promised to look at his wages in the summer, and nothing has changed.`);}p.promise=null;}});
  {const ct=chairT();if(ct==='youth'){const ya=sq(me).filter(p=>age(p)<=21).reduce((t,p)=>t+p.apps,0);dc+=ya>=60?5:ya<15?-5:0;}
   if(ct==='acct')dc+=club(me).bal>=(G.user.bal0??club(me).bal)?5:-5;
   if(ct==='cup'){const cr=cupReached(me);dc+=cr==='Winners'?8:/Fifth|Sixth|Semi|Final/.test(cr)?5:/Third/.test(cr)?-3:0;}}
  G.user.conf=clamp(G.user.conf+dc,0,100);
  let ended=false;const ck=G.user.contract;if(ck&&ck.until<=y){if(G.user.conf>=40){const rs=G.user.conf>=70?1.15:1.05;ck.wage=Math.round(ck.wage*rs);ck.until=y+2;ck.since=G.date;msg('board','A new contract',`Your contract was up this summer. The board have offered a new two-year deal on £${ck.wage} a week${rs>1.1?', a handsome rise':''}. You sign it on the spot.`);}else ended=true;}
  const cupExit=cupReached(me);
  G.user.career.push({y,club:me,div:ud,pos:upos,cup:cupExit,lc:G.lc?lcReached(me):null,eu:euReached()});euQualify(summ,T);summ.lc=G.lc&&G.lc.winner;summ.eu=G.eu?{...G.eu.winners}:{};
  try{achSeason({y,me,ud,upos,promoted,relegated,ended,T});}catch(e){}
  summ.user.promoted=promoted;summ.user.relegated=relegated;summ.user.cup=cupExit;summ.user.conf=G.user.conf;
  G.record.push({y,champs:summ.champs.slice(),cup:summ.cup,scor:summ.scor,lc:summ.lc||null,mgrs:summ.champs.map((id,d)=>[id===U()?G.user.name:club(id).m,DIVN[d]]).concat([[summ.cup===U()?G.user.name:club(summ.cup).m,'FA Cup']]).concat(summ.lc?[[summ.lc===U()?G.user.name:club(summ.lc).m,'League Cup']]:[])});mrepSeason(summ);supportersPOY();staffSeason();dynSeason(summ,T);
  G.year=y+1;const retired=[];
  for(const p of Object.values(G.players)){if(p.ret)continue;if(!p.c){if(age(p)>=31||rand()<.3){hofCheck(p);p.ret=true;}else develop(p);continue;}if(p.c==='ABR'){develop(p);if(retireCheck(p)){setClub(p,null);p.ret=true;}continue;}
    develop(p);if(p.c&&G.clubs[p.c]&&p.c!==U()&&age(p)<=23&&mq(p.c)>=4&&rand()<0.5)p.ca=Math.min(p.pa,p.ca+1);if(retireCheck(p)){hofCheck(p);if(p.coachOffer&&p.c===U()){if(G.user.staff.length<staffSlots()){const type={GK:'gk',FB:'def',CH:'def',WH:'mot',IF:'att',WG:'wing',CF:'att'}[p.pos];const s=mkStaff(p.n,type,clamp(Math.round((p.ca-50)/8),1,4));s.real=p.real;G.user.staff.push(s);msg('club',`${p.n} joins the backroom`,`${p.n} has hung up his boots and joins your staff as ${STAFF[type][0].toLowerCase()}.`);}else msg('club',`No room for ${p.n}`,`${p.n} has retired, but your backroom is full, so there was no coaching job for him after all.`);}if(p.c===U())removeFromUser(p);if(p.real&&(p.car.a>50||p.ca>=65))retired.push(`${p.n} (${cn(p.c)})`);setClub(p,null,'retired');p.ret=true;}}
  if(retired.length)msg('press','Hanging up their boots',`Among those retiring this summer: ${retired.slice(0,14).join(', ')}.`);
  {const kept=[],gone=[];for(const p of Object.values(G.players)){if(!p.c||p.c==='ABR'||p.ret||p.until==null||p.until>=G.year)continue;
    if(p.c===U()){if(y<1963){p.until=G.year;p.mor=clamp(p.mor-10,5,100);kept.push(p.n);}else{removeFromUser(p);gone.push(p.n);setClub(p,null,'contract');p.listed=false;}}
    else{if(y<1963||rand()<0.75)p.until=G.year+ri(0,2);else{setClub(p,null);p.listed=false;}}}
   if(kept.length)msg('club','Players retained',`Under the retain-and-transfer system, you have retained ${kept.join(', ')} on their old terms. They cannot leave without your say-so, and they are not happy about it.`);
   if(gone.length)msg('club','Out of contract',`${gone.join(', ')} ${gone.length===1?'has':'have'} left the club on a free transfer after ${gone.length===1?'his contract':'their contracts'} ran out.`,null,U());}
  const mineY=[],upY=[],relY=[];
  if(!G.autopilot)sq(U()).filter(p=>p.acad&&p.yform==='rel').forEach(p=>{removeFromUser(p);setClub(p,null,'released');p.acad=false;p.relBy=U();p.relY=G.year;relY.push(p.n);});
  DATA.youth.forEach(r=>{const [n,pos,b,ca,pa,c,y]=r;const ex=findByName(n);
    if(y===G.year){if(ex&&ex.acad){ex.acad=false;ex.w=wageFor(ex);if(ex.c===U()){upY.push(ex.n);ex.gradOf=U();ex.grad=G.year;}}else if(!ex){const p=mkPlayer({n,pos,b,ca,pa,c,real:true});if(c===U())mineY.push(p.n);}}
    else if(y>G.year&&youthJoin(r)===G.year&&!ex){acadReal(r);if(c===U())mineY.push(n);}});
  const waitY=[];Object.values(G.players).forEach(p=>{if(p.acad&&p.c&&(G.year-p.b>=18||(p.acadReal&&p.acadReal<=G.year))){if(p.c===U()&&!G.autopilot&&ftSize()>=FTMAX){if(!waitY.includes(p.n))waitY.push(p.n);return;}p.acad=false;p.w=wageFor(p);if(p.c===U()){p.gradOf=U();p.grad=G.year;}if(p.c===U()&&!upY.includes(p.n))upY.push(p.n);}});
  Object.keys(G.clubs).forEach(cid=>{genPlayer(cid,pick(['GK','FB','CH','WH','IF','WG','CF']),true);if(rand()<.5||(cid===U()&&(staffQ('youth')>=3||upgDone('tr_digs'))))genPlayer(cid,pick(['FB','WH','IF','WG','CF']),true);});
  sq(U()).forEach(p=>{if(p.acad&&!p.yfrom)p.yfrom=`Summer intake, ${G.year}`;if(p.acad)delete p.yform;});
  const away=Object.values(G.players).filter(p=>p.relBy===U()&&!p.gotAway&&p.c&&p.c!==U()&&G.clubs[p.c]&&p.ca>=62);away.forEach(p=>p.gotAway=true);
  if(away.length&&!G.autopilot){const p=away[0];msg('press','The one that got away',`${p.n} was ${p.relWhy==='home'?'homesick and went home':p.relWhy==='tap'?'lured away':'let go'} by ${club(U()).n} as a lad in ${p.relY}. Now he is a regular for ${club(p.c).n}, and one of the better ${POSN[p.pos].toLowerCase()}s in the ${DIVN[club(p.c).div]}. Somebody at ${club(U()).g} must be kicking himself.`,null,U());}
  msg('club','Youth intake',`The new apprentices have reported to the academy.${mineY.length?` The coaches rate ${andList(mineY)} very highly indeed.`:''}${upY.length?`\n\n${andList(upY)} ${upY.length===1?'has':'have'} signed professional forms and joined the first-team squad.`:''}${waitY.length?`\n\n${andList(waitY)} ${waitY.length===1?'is':'are'} ready for professional forms, but the first-team squad is full. ${waitY.length===1?'He waits':'They wait'} in the academy until you make room and promote ${waitY.length===1?'him':'them'}.`:''}${relY.length?`\n\n${andList(relY)} ${relY.length===1?'has':'have'} been let go, as you decided in the spring.`:''} You will find the academy on the Squad tab.`);
  Object.keys(G.clubs).forEach(cid=>{if(cid===U()&&!G.autopilot)return;while(sq(cid).filter(p=>!p.acad).length>27)releaseWorst(cid);fillSquad(cid);});pruneOld();
  if(sq(U()).filter(p=>!p.acad).length<16)fillSquad(U());
  (DATA.foreign||[]).filter(f=>f[7]===G.year).forEach(addForeign);G.foreignY=G.year;italianRaid();
  mktSummer();
  for(let k=0;k<45;k++)aiTransfer();
  const uc=club(U());
  if(G.user.conf<15||ended){buildSeason(G.year);sackUser(ended?'contract':'');G.summary=summ;G.review=RVD?{data:RVD,i:0}:null;UI.screen=RVD?'review':'season';save();render();return;}
  if((upos<=summ.user.exp-4||summ.champs[ud]===me||promoted)&&rand()<0.6){const cands=Object.values(G.clubs).filter(c=>c.id!==me&&c.rep>uc.rep+4&&c.rep<=uc.rep+22);
    if(cands.length){const c=pick(cands);msg('board',`${c.n} want to talk`,`The chairman of ${c.n} (${DIVN[G.divs.findIndex(d=>d.includes(c.id))]}) has asked permission to speak to you about their vacant manager's job.`,{k:'job',club:c.id,exp:addDays(G.date,40)});}}
  buildSeason(G.year);
  const b=bestXI(U(),G.user.form);G.user.xi=b.xi;G.user.sub=b.sub;
  msg('board',`The ${seasonLbl(G.year)} season`,`${uc.n} will play in ${DIVN[uc.div]}. ${boardTarget(expFor(U()),G.divs[uc.div].length,uc.div)} The bank balance stands at ${money(uc.bal)}. Your transfer budget is ${money(G.user.budget.transfer)} and your wage budget ${money(G.user.budget.wage)} a week. A fresh list of coaches is available in the Backroom.`);
  if(y===1969)decadeFinale();scrapSweep();
  G.summary=summ;G.review=RVD?{data:RVD,i:0}:null;UI.screen=RVD?'review':'season';save();render();
}
function cupReached(cid){const ties=G.fx.filter(f=>f.comp==='FA'&&(f.h===cid||f.a===cid));if(!ties.length)return 'Did not take part';
  const last=ties[ties.length-1];if(G.cup.winner===cid)return 'Winners';return last.w&&last.w!==cid?`Lost in the ${CUPR[last.r]}`:CUPR[last.r];}

/* ---------- jobs ---------- */
function hofCheck(p){const R=G.recs&&G.recs[U()];if(R&&(R.ap[p.id]||0)>=40&&!R.hof.some(h=>h.pid===p.id)){const y=R.yrs[p.id]||[G.year,G.year];
  msg('club',`Hall of Fame: ${p.n}`,`${p.n} has retired. For ${club(U()).n} under you he played ${plu(R.ap[p.id],'time')} and scored ${plu(R.gl[p.id]||0,'goal')}, between ${seasonLbl(y[0])} and ${seasonLbl(y[1])}.\n\nShall we put him in the club's Hall of Fame?`,{k:'hof',pid:p.id});}}
function sackUser(reason){G.sacked=true;const old=U();const k=G.user.contract;
  if(reason==='contract')msg('board','Contract not renewed',`Your contract with ${cn(old)} has run out and the board have decided not to offer you a new one. You leave the club.`);
  else{let comp=0;if(k){const wk=Math.max(4,daysBetween(G.date,`${k.until+1}-05-31`)/7);comp=Math.round(wk*k.wage*0.5);club(old).bal-=comp;G.user.earn=(G.user.earn||0)+comp;}
    msg('board','Relieved of your duties',`The board of ${cn(old)} have decided that a change is needed. Your contract has been terminated with immediate effect.${comp?` You receive ${money(comp)} in compensation.`:''}\n\n${chairOf(old).n}: "${chairSay('sack',old)}"`);}
  msg('press',`${surname(G.user.name).toUpperCase()} ${reason==='contract'?'LEAVES':'SACKED'}`,`${cn(old)} have parted company with their manager ${G.user.name}.`,null,old);
  const cur=club(old).rep;let pool=Object.values(G.clubs).filter(c=>c.id!==old&&c.rep<cur-3);if(pool.length<3)pool=Object.values(G.clubs).filter(c=>c.id!==old&&c.div===3);
  G.jobOffers=shuffle(pool).slice(0,3).map(c=>c.id);mktSack(old,'sacked');Object.values(G.clubs).filter(c=>c.vac&&!c.eu&&c.id!==old&&mktChance(c.id)>=0.5&&!G.jobOffers.includes(c.id)).slice(0,3).forEach(c=>G.jobOffers.push(c.id));}
function takeJob(cid){const old=U();euAbandon(old);G.user.capt=null;const oc=club(old);const oldName=G.user.name;oc.m=oldName;G.user.club=cid;mktSack(old,'left');const c=club(cid);if(c.vac){delete c.vac;}if(c.m&&!/caretaker/.test(c.m)&&c.m!==G.user.name)MKT().pool.push({n:c.m,rep:c.rep,from:cid,y:G.year});c.m=G.user.name;c.mq=null;mktLog(`${c.n}: ${G.user.name} appointed.`);G.user.conf=55;G.user.form=c.form;G.user.tac={...(c.tac||DEFTAC)};G.sacked=false;G.jobOffers=null;
  G.user.staff=[];G.user.price=1;newContract(cid,2);setBudgets();G.user.bal0=c.bal;objGen();
  const b=bestXI(cid,G.user.form);G.user.xi=b.xi;G.user.sub=b.sub;G.user.games=0;
  msg('board',`Welcome to ${c.g}`,`You are the new manager of ${c.n}. ${chairOf(cid).n}: "${chairSay('welcome',cid)}" ${boardTarget(expFor(cid),G.divs[c.div].length,c.div)} Your old backroom staff stayed behind, so you'll need to hire new coaches.`);
  msg('press',`${surname(G.user.name).toUpperCase()} TAKES OVER AT ${c.s.toUpperCase()}`,`${c.n} have appointed ${G.user.name} as manager.`,null,cid);}

/* ---------- players abroad ---------- */
const UKN=['England','Scotland','Wales','Northern Ireland','Republic of Ireland'];
const FREP={'Real Madrid':96,'Benfica':92,'Santos':94,'Internazionale':93,'AC Milan':92,'Juventus':88,'Barcelona':90,'Botafogo':86,'Palmeiras':82,'Corinthians':80,'Cruzeiro':78,'Fiorentina':82,'Cagliari':72,'Mantova':62,'Torino':80,'Roma':80,'Athletic Bilbao':78,'Hamburger SV':80,'Bayern Munich':82,'1. FC Köln':78,'Dynamo Moscow':82,'Torpedo Moscow':76,'Ferencváros':78,'Dukla Prague':80,'Stade de Reims':80,'Ajax':80,'Rangers':80,'Celtic':80,'Hibernian':68,'Dundee':70,'Dundee United':60,'Motherwell':60,'Aberdeen':65,'Inter Milan':93};
const frep=p=>{let r=FREP[p.abroad]||75;if(p.abroad==='Celtic'&&G.year>=1966)r=90;if(p.abroad==='Ajax'&&G.year>=1967)r=88;return r;};
const overseas=p=>p.c==='ABR'&&!!p.nat&&!UKN.includes(p.nat);
const sellerN=p=>p.c==='ABR'?(p.abroad||'his club abroad'):club(p.c).n;
function abroadBlock(p){if(p.c!=='ABR')return null;
  if(['Soviet Union','Hungary','Czechoslovakia'].includes(p.nat))return `The authorities behind the Iron Curtain will not allow ${p.n} to leave the country. The telegram comes back unanswered.`;
  if(p.n==='Pelé')return 'The Brazilian government has declared Pelé an official national treasure. He will never be sold abroad, and Santos laugh down a very crackly telephone line at the very idea.';
  return null;}
function addForeign(f){const [n,pos,b,ca,pa,cl,nat]=f;if(findByName(n))return;const p=mkPlayer({n,pos,b,ca,pa,c:'ABR',real:true});p.abroad=cl;p.nat=nat;}
function italianRaid(){if(G.year>=1966||rand()>0.45)return;const stars=Object.values(G.players).filter(p=>p.c&&p.c!=='ABR'&&p.c!==U()&&p.ca>=80&&age(p)<=28);if(!stars.length)return;
  const p=pick(stars);const to=pick(G.year<1962?['Juventus','AC Milan','Internazionale','Torino','Roma','Real Madrid','Barcelona']:['Juventus','AC Milan','Internazionale','Torino','Roma']);const fee=roundFee(valueOf(p)*1.3);const from=p.c;
  club(from).bal+=fee;p.hist.push({y:G.year,from,to:'ABR',fee});setClub(p,'ABR');p.abroad=to;
  if(isStory(fee,p))msg('press',`${surname(p.n).toUpperCase()} FOR ${to.toUpperCase()}`,`${p.n} leaves ${cn(from)} for ${to} in a ${money(fee)} deal. The lure of the lira is proving hard to resist.`,null,storyPaper(p,true,from));}

/* ---------- club life: records, supporters, boardroom, reserves, contract ---------- */
const storyFee=()=>30000*Math.pow(1.07,Math.max(0,G.year-1960));
const isStory=(fee,p)=>fee>=storyFee()*1.6||(!!p&&p.ca>=85);
/* only the very best (85 and over) make the papers; other big moves go to the intray */
const storyPaper=(p,z,from)=>(from&&from===U())||(p&&p.ca>=85)?z:null;
const UPGS=()=>{const c=club(U());return c.upg||(c.upg={});};
function REC(cid){G.recs=G.recs||{};return G.recs[cid]||(G.recs[cid]={bigWin:null,bigLoss:null,hiGate:null,recBuy:null,recSale:null,gl:{},ap:{},yrs:{},unb:{cur:0,best:0},h2h:{},hof:[],since:G.year});}
function recordMatch(fx,m){const me=U();const home=fx.h===me;const opp=home?fx.a:fx.h;const my=home?fx.hg:fx.ag,th=home?fx.ag:fx.hg;const R=REC(me);
  const res={score:`${my}-${th}`,opp,date:fx.date,comp:fx.comp,home};const d=my-th;
  if(d>0&&(!R.bigWin||d>R.bigWin.d||(d===R.bigWin.d&&my>R.bigWin.my)))R.bigWin={...res,d,my};
  if(d<0&&(!R.bigLoss||-d>R.bigLoss.d||(-d===R.bigLoss.d&&th>R.bigLoss.th)))R.bigLoss={...res,d:-d,th};
  if(home&&fx.att&&!fx.neutral&&(!R.hiGate||fx.att>R.hiGate.att))R.hiGate={att:fx.att,opp,date:fx.date};
  if(d>=0){R.unb.cur++;if(R.unb.cur>R.unb.best)R.unb.best=R.unb.cur;}else R.unb.cur=0;
  const h=R.h2h[opp]=R.h2h[opp]||{w:0,d:0,l:0,f:0,a:0,last:null};if(d>0)h.w++;else if(d<0)h.l++;else h.d++;h.f+=my;h.a+=th;h.last=res;
  m.sides[m.us].played.forEach(pid=>{R.ap[pid]=(R.ap[pid]||0)+1;const y=R.yrs[pid]=R.yrs[pid]||[G.year,G.year];y[1]=G.year;});
  m.goals.forEach(g=>{if(g.side===m.us&&g.flag!=='og')R.gl[g.pid]=(R.gl[g.pid]||0)+1;});}
const fans=()=>{const c=club(U());if(c.fans==null)c.fans=55;return c.fans;};
const moodWord=f=>f>=80?'Ecstatic':f>=65?'Happy':f>=45?'Hopeful':f>=30?'Restless':f>=20?'Angry':'In uproar';
const fanNature=()=>{const c=club(U());return clamp(0.55+c.rep/100+(c.div===0?0.1:0),0.8,1.65);};
function fansAfter(fx){const me=U();const c=club(me);const home=fx.h===me;const opp=home?fx.a:fx.h;const my=home?fx.hg:fx.ag,th=home?fx.ag:fx.hg;const e=fanNature();
  c.fstreak=c.fstreak||0;const gap=clamp((teamRating(opp)-teamRating(me))/10,-1.5,1.5);let d;
  if(my>th){c.fstreak=c.fstreak>0?c.fstreak+1:1;d=0.7*(1+0.25*(Math.min(c.fstreak,8)-1))*(1+Math.max(0,gap)*0.5)/Math.sqrt(e);}
  else if(my<th){c.fstreak=c.fstreak<0?c.fstreak-1:-1;const n=Math.min(-c.fstreak,12);d=-0.9*(1+0.4*(n-1))*e*(1+Math.max(0,-gap)*0.5);}
  else{c.fstreak=0;d=(1.1-e)*0.8+Math.max(0,gap)*0.4;}
  if(isDerby(me,opp))d*=2;if((fx.comp==='FA'&&fx.r>=2)||(fx.comp==='LC'&&fx.r>=4))d*=1.5;if(fx.comp==='EU')d*=1.6;if(my-th>=4)d+=1;
  const before=fans();c.fans=clamp(before+d,0,100);fanStories(before,c.fans);}
const MGRQ=["I'm proud of every one of them. They've run through brick walls for this club all season.","The lads deserve all the credit. I just pick the team and make the tea.","I said in August we could do something special. Nobody believed me except the players.","This one is for the supporters. They've stood in the rain for years waiting for a day like this."];
function trophyPaper(kind,div,f,finalT){const c=club(U());const ch=chairOf(U());const sqd=sq(U()).slice();const C=c.s.toUpperCase();
  const heroes=sqd.filter(p=>p.apps>0).sort((a,b)=>b.apps-a.apps).slice(0,12).map(p=>[p.n,p.pos,p.apps,p.gls]);
  const top=sqd.slice().sort((a,b)=>b.gls-a.gls)[0];const star=sqd.filter(p=>p.apps>=10).sort((a,b)=>b.rs/b.apps-a.rs/a.apps)[0];let head,kick;const L=[];
  if(kind==='league'){const t=finalT||table(div);const r=t.find(x=>x.id===U());const gap=r.pts-t[1].pts;kick=div===0?'Champions of England':`${DIVN[div]} Champions`;head=div===0?`${C} ARE CHAMPIONS OF ENGLAND`:`${C} WIN ${DIVN[div].toUpperCase()}`;
    L.push(`${c.n} are ${div===0?'champions of the Football League':'champions of '+DIVN[div]} for ${seasonLbl(G.year)}. They won ${r.w} of their ${r.p} matches, drew ${r.dr} and lost ${r.l}, scoring ${r.f} goals and conceding ${r.a}, and finished ${gap>0?`${gap} point${gap===1?'':'s'} clear of ${cn(t[1].id)}`:`level on points with ${cn(t[1].id)}, but ahead on goal average`}.`);}
  else{const mine=f.h===U();const opp=mine?f.a:f.h;const nm0=kind==='lc'?'the Football League Cup':kind==='eu'?`the ${EUN[f.eu]}`:'the FA Cup';kick=kind==='lc'?'League Cup Winners':kind==='eu'?`${EUN[f.eu]} Winners`:'FA Cup Winners';head=kind==='eu'?`${C} CONQUER EUROPE!`:kind==='lc'?`${C} LIFT THE LEAGUE CUP`:`THE CUP IS ${C}'S!`;const ven=f.venue||(kind==='cup'?'Wembley':null);
    L.push(`${c.n} have won ${nm0}, beating ${cn(opp)} ${mine?f.hg:f.ag}-${mine?f.ag:f.hg}${ven?` at ${ven}`:''}${ven==='Wembley'?' in front of 100,000':''}${f.aet?' after extra time':''}${f.agg?`, ${f.agg[mine?0:1]}-${f.agg[mine?1:0]} on aggregate`:''}.${f.rep&&!f.agg?' '+f.rep+'.':''}`);
    const sc=(f.ev||[]).filter(e=>(e[1]===0)===mine&&e[3]!=='og').map(e=>`${e[2]} (${e[0]} min${e[3]==='pen'?', pen':''})`);if(sc.length)L.push(`The goals came from ${sc.join(', ')}.`);}
  if(top&&top.gls)L.push(`${top.n} led the way with ${plu(top.gls,'goal')} this season.`);
  if(star)L.push(`The star of the show has been ${star.n}, whose average match rating of ${(star.rs/star.apps).toFixed(2)} was the best in the side.`);
  L.push(`The manager, ${G.user.name}, said: "${pick(MGRQ)}"`);L.push(`The chairman, ${ch.n}, said: "${chairSay('trophy')}"`);
  const m=msg('press',head,L.join('\n'),null,U());m.special={kind,div,kick,heroes,club:U(),y:G.year,comp:f&&f.eu};(G.user.souvenirs=G.user.souvenirs||[]).push({title:m.title,body:m.body,date:m.date,type:'press',cid:U(),special:m.special});return m;}
function trophyPaperHTML(m,P){const sp=m.special;const t={k:sp.kind==='league'?'league':sp.kind,div:sp.div,y:sp.y,club:sp.club,comp:sp.comp};const paras=esc(m.body).split('\n').filter(Boolean);
  return `<div class="scrim" data-a="paperclose"></div><article class="paper souvenir ${P.spin?'spin':''}" role="dialog" aria-modal="true" aria-label="Souvenir edition">${TROPHY_DEFS}
   <header class="np-mast"><span class="np-side">Souvenir edition<br>Keep this copy</span><h2>The Sporting Chronicle</h2><span class="np-side r">Price <span class="np-price">${6+Math.floor(Math.max(0,G.year-1960)/4)}d</span><br>${esc(fmtDate(m.date))}</span></header>
   <div class="sv-kicker">${esc(sp.kick)}</div><h3 class="np-head sv-head">${esc(m.title)}</h3>
   <div class="sv-cols"><figure class="sv-photo"><div class="sv-tro">${trophySVG(t)}</div><div class="sv-crest">${crest(sp.club,'xl')}</div><figcaption>${esc(cn(sp.club))}, ${seasonLbl(sp.y)}</figcaption></figure>
    <div class="np-text">${paras.map((p,i)=>`<p class="${i?'':'np-lede'}">${p}</p>`).join('')}<p class="np-by">By our football correspondent</p></div>
    <aside class="np-stop sv-heroes"><b>The team that did it</b><table><thead><tr><th></th><th>Apps</th><th>Gls</th></tr></thead><tbody>${sp.heroes.map(h=>`<tr><td>${esc(h[0])}</td><td>${h[2]}</td><td>${h[3]}</td></tr>`).join('')}</tbody></table></aside></div>
   <footer class="np-foot"><span>Page ${P.i+1} of ${P.ids.length}</span><div class="row gap">${P.i<P.ids.length-1?'<button class="btn" data-a="papernext">Turn the page</button>':''}<button class="btn go" data-a="paperclose">Put the paper down</button></div></footer></article>`;}
/* ---------- the chairman in the papers: what he says depends on what is happening, and on the man ---------- */
const CHS={
 good:{
  top:["Top of the League. I have been on this board a good many years and I have never had a view like it.","I have the League table pinned to the boardroom door, and I read it from the top these days.","Top of the table. I have told my wife not to expect me home early on a Saturday for some time.","They can say what they like in the papers. The table does not lie, and the table says {C} are top.","Top of the League in {mon}. I keep looking at it in case somebody has made a mistake."],
  race:["{ord} in the table, and nobody is going to frighten us now.","We are in with a shout, and the whole town knows it. My barber talks of nothing else.","{ord} and climbing. I would not swap places with anybody in the League.","A few more results like Saturday's and we shall see who is laughing in May.","The race is on and we are in it. I have not felt like this since I was a boy on the terraces."],
  streak:["{s} wins on the bounce. I have stopped changing my tie because I am frightened of breaking the spell.","{s} in a row. The lads are playing with their chests out, and so am I.","I have watched football for forty years and I do not remember a run like this one.","Win, win, win. I could get used to it, and I am trying very hard not to.","{s} wins running. The bookmakers in the town have stopped taking bets on us, I am told."],
  bigwin:["Did you see Saturday? {sc}. I had to sit down at half-time.","{sc}! My hands were sore from clapping. I shall need new gloves.","That was football as it ought to be played. {sc}, and it could have been more.","{sc}. I have kept the programme, and I shall have it framed."],
  cup:["We are still in the Cup, and in this town that is all anybody talks about.","There is a Cup run on, and the gate receipts are telling their own story.","I listened to the Cup draw on the wireless with my hands over my eyes. Then I listened to it again.","The Cup brings out the best in a town. Look at the queues for tickets."],
  crowds:["The turnstiles are clicking like I have never heard them. The supporters have voted with their feet.","Full houses, singing from the first whistle. That is what we are here for.","I counted the crowd from the directors' box on Saturday. Then I gave up and simply enjoyed it."],
  money:["And the bank manager is smiling, which is more than he did when I came onto the board.","We are paying our way, and that is not a small thing at a club like this.","The books balance and the side is winning. A chairman cannot ask for more."],
  kids:["And look at the young lads coming through. Our own boys, in our own shirts.","Half the side are lads from round here. You cannot buy that, and I would not want to."]},
 bad:{
  bottom:["{ord} in the table. I do not need to tell anybody that is not good enough.","We are down among the dead men, and I will not pretend otherwise.","I look at the table on a Saturday night and I have to put it down again.","Relegation is not a word I want to hear in this boardroom. I am hearing it."],
  slide:["{n} defeats on the trot. Something has gone badly wrong, and I want to know what.","Lose, lose, lose. I have stopped reading the Monday papers.","I have sat through {n} defeats in a row and I have no intention of sitting through many more.","{n} on the bounce, and every one of them a kick in the teeth."],
  thrashed:["{sc}. I left before the end, and I have never done that in my life.","Saturday was a disgrace. {sc}. The supporters deserved better, and so did I.","{sc}. I have had better afternoons at the dentist."],
  fans:["The supporters are unhappy and I do not blame them. I get the letters.","The crowd are drifting away. Empty terraces do not pay wages.","I heard what the terraces were singing on Saturday. I am not going to repeat it."],
  debt:["The money is going out faster than it is coming in. That cannot go on.","I have had the bank on the telephone twice this week. That is twice too many.","We are in the red, and I am not a man who likes the colour red."],
  expect:["We were told this side would challenge. It is not challenging anybody.","The board set a target in the summer. We are nowhere near it.","I expected better. I expected a great deal better."]}};
const CHV={
 show:{good:["Goals, goals and more goals. That is what people pay their money for, and that is what they are getting!","This is entertainment. Tell your friends, tell your neighbours, and bring them on Saturday.","I want the whole town talking about us, and from what I hear in the pubs, they are."],bad:["Nobody pays to watch this. I would not pay to watch it, and I am the chairman.","Where are the goals? Where is the excitement? The crowd want a show, and so do I."]},
 acct:{good:["Every win is worth hundreds at the gate. I have the ledger open in front of me as we speak.","I have run the figures and they please me. So does the football, as it happens."],bad:["I have done the sums. Defeats are expensive.","I have asked for a full breakdown of the wage bill. I want to know what we are paying for."]},
 cup:{good:["A side in this form is a danger to anybody in the Cup. Anybody at all.","I have already made enquiries about a charabanc to Wembley. Purely in case."],bad:["Even a Cup run would do. Just give the supporters something to sing about."]},
 youth:{good:["What pleases me most is the lads we have brought through ourselves.","When I see a local boy pull on our shirt and win, that is my reward."],bad:["Too many old legs and not enough young ones. I have said so to the manager."]},
 amb:{good:["This is only the start. I want Europe, and I want it soon.","One day they will talk about this side in Madrid and Milan. Mark my words."],bad:["I did not open the chequebook for this. I expect a return on my money."]}};
const CHSET=["spoke to our reporter at {G}","was speaking at the club's annual dinner","spoke outside the boardroom after Saturday's match","was speaking at the Rotary Club lunch","took our reporter's call at his office on Monday morning","spoke in the directors' box at half-time","was in expansive mood at the supporters' club dance","spoke to us briefly before catching the train to London","was speaking at the opening of the new club shop","spoke to our reporter over a pint in the Railway Hotel"];
const CHSETP=["spoke to our reporter from the back seat of his Bentley","was speaking at his club in St James's","took our reporter's call between rounds of golf","spoke to us at a point-to-point in Warwickshire, between races"];
const CHHEAD={good:{top:["{C} TOP, AND THE CHAIRMAN LOVES IT","\"THE TABLE DOES NOT LIE\" SAYS {CHS}"],race:["\"NOBODY WILL FRIGHTEN US NOW\": {CHS}","{C} CHAIRMAN SCENTS GLORY"],streak:["{s} IN A ROW: CHAIRMAN DARE NOT CHANGE HIS TIE","WINNING RUN DELIGHTS {CHS}"],bigwin:["\"I HAD TO SIT DOWN\" SAYS {C} CHAIRMAN","{CHS} SAVOURS THE GOALS"],cup:["CUP FEVER IN THE {C} BOARDROOM","{CHS}: \"THIS TOWN IS CUP-MAD\""],crowds:["FULL HOUSES DELIGHT {CHS}","\"THE SUPPORTERS HAVE VOTED\" SAYS {C} CHIEF"],money:["{C} IN THE BLACK, AND WINNING","CHAIRMAN'S HAPPY SUMS"],kids:["{CHS} HAILS THE LOCAL LADS"],any:["CHAIRMAN: {C} ARE GOING PLACES","\"WE WILL TAKE SOME STOPPING\" SAYS {CHS}","{C} CHIEF IN DREAMLAND","ALL SMILES IN THE {C} BOARDROOM","{CHS} PRAISES {M}"]},
 bad:{bottom:["{C} CHAIRMAN FEARS THE DROP","\"DOWN AMONG THE DEAD MEN\": {CHS}"],slide:["{n} DEFEATS: CHAIRMAN WANTS ANSWERS","{CHS}: \"SOMETHING HAS GONE BADLY WRONG\""],thrashed:["\"A DISGRACE\" SAYS {C} CHAIRMAN","{CHS} WALKED OUT EARLY"],fans:["CHAIRMAN HEARS THE TERRACES","\"I GET THE LETTERS\" SAYS {CHS}"],debt:["{C} IN THE RED: CHAIRMAN WORRIED","MONEY WORRIES AT {G}"],expect:["\"NOT WHAT WE WERE PROMISED\": {CHS}"],any:["CHAIRMAN'S WARNING TO {M}","{C} BOARD LOSING PATIENCE","\"NOT GOOD ENOUGH\" SAYS {CHS}","STORM CLOUDS AT {G}","{M} ON NOTICE?","BOARDROOM GLOOM AT {C}"]}};
const CHHEADP={good:["\"SPLENDID!\" SAYS PEARSEY","PEARSEY: \"TOP HOLE\"","CLARET FLOWS AT VILLA PARK","PEARSEY \"FRIGHTFULLY PLEASED\""],bad:["\"UNBECOMING!\" FUMES PEARSEY","PEARSEY DISPLEASED","\"SIMPLY BEASTLY\": PEARSEY","PEARSEY SUMMONS THE MANAGER"]};
const CHEND={good:["Asked about the manager, {CH} said he had \"every confidence\" in {MN}.","He described {MN} as \"the best appointment this board has made in years\".","Of the manager, he said simply: \"Leave him alone and let him get on with it.\"","He added that a new contract for {MN} was \"something the board would be glad to discuss\".","He would not be drawn on transfer funds, but he smiled broadly when asked."],
 bad:["Asked whether {MN} still had the backing of the board, {CH} declined to comment.","He would not say whether the board had discussed the manager's position.","\"The manager knows what is expected of him,\" he said, and left it at that.","Asked about {MN}'s future, he said only: \"We shall see.\"","He confirmed that the board would meet on Thursday. He would not say what about."]};
const NUMW=['no','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
const numW=n=>NUMW[n]||String(n);
const CHSP={good:{top:["One finds Aston Villa at the top of the League, which is precisely where one has always felt the club belongs.","Top of the table, dear boy. One had the butler read it out twice."],race:["Aston Villa are among the leaders, as is only proper.","One senses something in the air. Possibly the scent of a championship. Possibly the gasworks."],streak:["{s} victories on the trot. One has quite run out of the good claret.","{s} wins in a row. One has taken to wearing the same cravat, purely as a precaution."],bigwin:["{sc}. One rather enjoyed that. One may have stood up at one point, which is not like one at all."],any:["Jolly good show. The chaps are playing like gentlemen and winning like professionals."]},
 bad:{bottom:["Aston Villa, near the foot of the table. One does not care to say it twice."],slide:["{n} defeats. One is not accustomed to this sort of thing, and one does not intend to become so."],thrashed:["{sc}. One left at half-time and went to the club. One needed a stiff one."],any:["This behaviour is unbecoming."]}};
function chairFresh(pool){const u=G.user;u.chairSaid=u.chairSaid||[];const fresh=pool.filter(x=>!u.chairSaid.includes(x));const q=pick(fresh.length?fresh:pool);u.chairSaid.push(q);if(u.chairSaid.length>60)u.chairSaid.shift();return q;}
function chairMoods(){const u=G.user;const c=club(U());const s=c.fstreak||0;const t=table(c.div);const pos=t.findIndex(r=>r.id===U())+1;const n=t.length;
  const last=G.fx.filter(f=>f.p&&isUserFx(f)&&f.id>0).slice(-1)[0];const lm=last?(last.h===U()?last.hg-last.ag:last.ag-last.hg):0;const sc=last?`${cn(last.h)} ${last.hg}, ${cn(last.a)} ${last.ag}`:'';
  const exp=expFor(U());const youngXI=(u.xi||[]).map(id=>G.players[id]).filter(p=>p&&G.year-p.b<=21).length;
  const inCup=(G.cup&&G.fx.some(f=>f.comp==='FA'&&isUserFx(f)&&f.r>=4&&(!f.p||f.w===U())))||(G.eu&&G.eu.entries&&G.eu.entries.some(e=>e.cid===U()&&e.alive));
  const promo=c.div===0?pos<=3:pos<=(c.div===3?4:2)+1;
  const good=[],bad=[];
  if(u.games>=8&&pos===1)good.push('top');else if(u.games>=10&&promo)good.push('race');
  if(s>=3)good.push('streak');if(lm>=3)good.push('bigwin');if(inCup)good.push('cup');if(fans()>=70)good.push('crowds');if(c.bal>15000*infl())good.push('money');if(youngXI>=3)good.push('kids');
  if(u.games>=10&&pos>=n-2)bad.push('bottom');if(s<=-3)bad.push('slide');if(lm<=-3)bad.push('thrashed');if(fans()<35)bad.push('fans');if(c.bal<0)bad.push('debt');if(u.games>=12&&pos>=exp+5)bad.push('expect');
  return {good,bad,pos,s,sc,n};}
function chairPaper(){const u=G.user;const c=club(U());const ch=chairOf(U());if(daysBetween(u.lastChairPaper||'1900-01-01',G.date)<70||u.games<6)return;
  const M=chairMoods();const s=c.fstreak||0;
  const isGood=u.conf>=80||s>=4||M.good.includes('top')||(M.good.includes('bigwin')&&u.conf>=55);const isBad=u.conf<=25||s<=-4||fans()<25||M.bad.includes('bottom')||M.bad.includes('thrashed')&&u.conf<45;
  if((!isGood&&!isBad)||rand()>0.5)return;u.lastChairPaper=G.date;const kind=isGood?'good':'bad';
  const tags=(isGood?M.good:M.bad);const main=tags.length?pick(tags.slice(0,2)):null;const extra=tags.filter(x=>x!==main);
  const CHn=ch.n;const CHS_=surname(ch.n).toUpperCase();const V={C:c.s.toUpperCase(),CHS:CHS_,M:surname(u.name).toUpperCase(),G:c.g,s:numW(Math.abs(s)),n:numW(Math.abs(s)),ord:ord(M.pos),sc:M.sc,mon:MON[+G.date.slice(5,7)-1],CH:CHn,MN:u.name};
  const v=x=>fill(x,V).replace(/^(\w)/,m=>m.toUpperCase());
  let head,quotes=[],setting;
  if(ch.pearsey){head=chairFresh(CHHEADP[kind]);setting=chairFresh(CHSETP);const own=main&&CHSP[kind][main]?CHSP[kind][main]:CHSP[kind].any;quotes.push(v(chairFresh(own)));quotes.push(chairFresh((typeof CQP_MORE!=='undefined'&&CQP_MORE[kind]?CQP[kind].concat(CQP_MORE[kind]):CQP[kind]).filter(q=>!quotes.includes(q))));if(rand()<0.5)quotes.push(chairFresh(CQP[kind].filter(q=>!quotes.includes(q))));}
  else{const hp=main&&CHHEAD[kind][main]?CHHEAD[kind][main].filter(x=>!(u.chairSaid||[]).includes(x)):[];head=v(chairFresh(hp.length&&rand()<0.7?hp:CHHEAD[kind].any)).toUpperCase();setting=fill(chairFresh(CHSET),V);
    if(main)quotes.push(v(chairFresh(CHS[kind][main])));
    const voice=(CHV[ch.t]||{})[kind]||[];const tq=(CQT[ch.t]||{})[kind]||[];if(voice.length||tq.length)quotes.push(v(chairFresh(voice.concat(tq))));
    if(extra.length&&rand()<0.7)quotes.push(v(chairFresh(CHS[kind][pick(extra)])));
    if(quotes.length<2)quotes.push(chairFresh(CQ[kind]));}
  quotes=[...new Set(quotes)].slice(0,3);
  const run=s>=3?`, with ${numW(s)} wins in a row`:s<=-3?`, after ${numW(-s)} defeats in a row`:'';
  const ctx=pick(kind==='good'?[`${c.n} are ${ord(M.pos)} in ${DIVN[c.div]}${run}.`,`It is a happy time at ${c.g}. ${c.n} sit ${ord(M.pos)} in ${DIVN[c.div]}${run}.`,`Spirits are high at ${c.g}, where ${c.n} are ${ord(M.pos)} in ${DIVN[c.div]}${run}.`]:[`${c.n} are ${ord(M.pos)} in ${DIVN[c.div]}${run}.`,`All is not well at ${c.g}. ${c.n} are ${ord(M.pos)} in ${DIVN[c.div]}${run}.`,`The mood is grim at ${c.g}, where ${c.n} are ${ord(M.pos)} in ${DIVN[c.div]}${run}.`]);
  const end=ch.pearsey?(kind==='good'?`Asked about ${u.name}, Pearsey said: "A thoroughly sound fellow. One approves."`:`Asked about ${u.name}'s future, Pearsey said only: "One shall see, dear boy. One shall see."`):fill(chairFresh(CHEND[kind]),V);
  const mm=msg('press',head,`${ctx} ${pick([`The chairman, ${CHn}, ${setting}.`,`${CHn}, the chairman, ${setting}.`])}\n\n${quotes.map(q=>`"${q}"`).join('\n\n')}\n\n${end}`,null,U());mm.pic='chair:'+U();if(ch.pearsey)achPearsey(kind);}
function fansWeekly(){chairPaper();talkTick();const c=club(U());const e=fanNature();let d=[0.3,0,-0.35][G.user.price]+(55-fans())*0.01+(upgDone('magazine')?0.05:0)+(upgDone('ambassador')?0.03:0);if(upgDone('friends'))bumpConf(0.08);
  if(G.user.games>=5){const t=table(c.div);const pos=t.findIndex(r=>r.id===U())+1;const diff=expFor(U())-pos;d+=diff>0?0.06*diff:0.09*diff*e;}
  const before=fans();c.fans=clamp(before+d,0,100);fanStories(before,c.fans);
  bumpConf((fans()-50)/400+(fans()<20?-0.5:0));}
function fanStories(a,b){const c=club(U());const M=surname(G.user.name).toUpperCase(),C=c.s.toUpperCase();
  if(a>=20&&b<20)msg('press',`FANS TURN ON ${M}`,`Several hundred ${c.s} supporters gathered outside ${c.g} after the match, chanting for the manager to go. Seat cushions were thrown on to the pitch.`,null,U());
  else if(a>=35&&b<35)msg('club','The supporters are restless','The mood on the terraces has turned sour. The chairman has noticed the empty spaces and the letters in the local paper.');
  else if(a<85&&b>=85)msg('press',`${C} FANS IN DREAMLAND`,`The terraces at ${c.g} have not been this happy in years. The songs for ${G.user.name} went on long after the final whistle.`,null,U());}
const streakTxt=()=>{const s=club(U()).fstreak||0;return s>1?`Won ${s} in a row`:s<-1?`Lost ${-s} in a row`:s===1?'Won the last match':s===-1?'Lost the last match':'Drew the last match';};
const membership=()=>{const c=club(U());return Math.round(c.rep*45*(0.6+fans()/100)/10)*10;};
const CHAIRS={FUL:['Tommy Trinder','comedian and entertainer','show'],EVE:['John Moores','football pools magnate','amb'],BRN:['Bob Lord','master butcher','acct'],MUN:['Harold Hardman','solicitor','youth'],IPS:['John Cobbold','brewer','cup'],COV:['Derrick Robins','businessman','show'],WHU:['Reg Pratt','timber merchant','youth'],CHE:['Joe Mears','businessman','acct'],LEE:['Harry Reynolds','steel stockholder','amb'],TOT:['Fred Bearman','businessman','cup']};
const CHAIRT={cup:['The Cup romantic','Cup runs matter more than anything.',['A good FA Cup run earns real credit with him.','An early Cup exit hurts twice as much.','He likes a giant-killing, either way round.']],
 acct:['The accountant','Balance the books.',['He watches the bank balance every week. Being in the red costs you.','He is pleased by a profit at the end of the season.','He winces at big transfer fees.']],
 youth:['The youth man','Play the kids.',['He wants young players (21 and under) in the first team. Plenty of appearances for them earns credit at the end of the season.','Signing players over 30 annoys him.']],
 show:['The showman','Entertain the crowd.',['Three goals or more in a League match pleases him.','A goalless draw puts him in a foul mood.','He loves full houses, so keep the supporters happy.']],
 amb:['The big spender','Ambition.',['He gives you a bigger transfer budget than most chairmen would.','In return he expects a finish two places higher than the squad deserves.','A big signing puts a smile on his face.']]};
const JOBS=['brewery owner','builder','haulage contractor','department store owner','mill owner','solicitor','bookmaker','motor dealer','butcher','scrap merchant','hotelier','coal merchant','printer','bus company owner','shipping agent'];
const TITLES=['Mr','Mr','Mr','Alderman','Councillor','Major','Mr','Dr'];
const genPerson=()=>`${pick(TITLES)} ${pick(DATA.first)} ${pick(DATA.last)}`;
function chairOf(cid){const c=club(cid);if(cid==='AVL'&&!(c.chair&&c.chair.pearsey)){c.chair={n:'Pearsey',job:'gentleman of independent means',t:'amb',look:'pearsey',pearsey:true,real:false,dirs:(c.chair&&c.chair.dirs)||[0,1,2].map(()=>({n:genPerson(),job:pick(JOBS)}))};}if(!c.chair){const r=CHAIRS[cid];c.chair={n:r?r[0]:genPerson(),job:r?r[1]:pick(JOBS),t:r?r[2]:pick(Object.keys(CHAIRT)),real:!!r,dirs:[0,1,2].map(()=>({n:genPerson(),job:pick(JOBS)}))};}return c.chair;}
const chairT=()=>chairOf(U()).t;
function expFor(cid){const e=G.expect[cid]||10;return cid===U()&&chairOf(cid).t==='amb'?Math.max(1,e-2):e;}
const bumpConf=v=>{G.user.conf=clamp(G.user.conf+v,0,100);};
function cupHook(fx){if(!(fx.h===U()||fx.a===U())||!fx.w)return;const won=fx.w===U();if(chairT()==='cup')bumpConf(won?2+fx.r*0.5:-4);if(won&&fx.r>=2)feverUp(0.6+fx.r*0.45);}
const SOUTH=['ARS','TOT','CHE','FUL','WHU','ORI','CHA','MIL','CRY','QPR','BRE','WAT','LUT','NOR','IPS','SOU','POR','BHA','REA','SWI','BRC','BRR','PLY','EXE','TOR','BOU','ALD','GIL','SOE','COL','NTN','PET','CAR','SWA','NPT'];
function reserveLeague(){const c=club(U());if(c.div>=2)return 'the regional reserve league';return SOUTH.includes(c.id)?'the Football Combination':'the Central League';}
function sideMatch(xi,oppAvg,home){const my=xi.reduce((t,p)=>t+p.ca,0)/Math.max(1,xi.length);const lam=(a,b,h)=>clamp(1.45*Math.pow(a/b,2.2)*(h?1.1:0.92),0.2,5);
  let gf=0,ga=0;for(let k=0;k<90;k++){if(rand()<lam(my,oppAvg,home)/90)gf++;if(rand()<lam(oppAvg,my,!home)/90)ga++;}return [gf,ga];}
function pickN(xi,n){const W={CF:4,IF:3,WG:2.4,WH:1,CH:.4,FB:.3,GK:0};const out=[];for(let i=0;i<n;i++){let tot=0;xi.forEach(p=>tot+=W[p.pos]);let r=rand()*tot;for(const p of xi){r-=W[p.pos];if(r<=0){out.push(p);break;}}}return out;}
function secondString(fx,played){const u=G.user;const home=fx.h===U();const opp=home?fx.a:fx.h;
  const res=sq(U()).filter(p=>!p.inj&&!played.includes(p.id)).sort((a,b)=>b.ca-a.ca).slice(0,11);
  if(res.length>=8){const os=sq(opp).slice().sort((a,b)=>b.ca-a.ca).slice(13,24);const oa=os.length?os.reduce((t,p)=>t+p.ca,0)/os.length:40;const [gf,ga]=sideMatch(res,oa,!home);
    const sc=pickN(res,gf);res.forEach(p=>p.rapps=(p.rapps||0)+1);sc.forEach(p=>p.rgls=(p.rgls||0)+1);
    u.rsv=u.rsv||[];u.rsv.unshift({d:fx.date,o:opp,h:!home,gf,ga,sc:sc.map(p=>surname(p.n))});if(u.rsv.length>12)u.rsv.length=12;}
  const yth=sq(U()).filter(p=>!p.inj&&age(p)<=18).sort((a,b)=>b.ca-a.ca);u.ythTick=(u.ythTick||0)+1;
  if(yth.length>=5&&u.ythTick%2===0){const oc=club(opp);const oa=DIVBASE[oc.div]*0.8+(oc.rep-60)/6;const xi=yth.slice(0,11);const [gf,ga]=sideMatch(xi,oa,home);
    const sc=pickN(xi,gf);xi.forEach(p=>p.yapps=(p.yapps||0)+1);sc.forEach(p=>p.ygls=(p.ygls||0)+1);
    u.yth=u.yth||[];u.yth.unshift({d:fx.date,o:opp,h:home,gf,ga,sc:sc.map(p=>surname(p.n))});if(u.yth.length>12)u.yth.length=12;}}
const mgrWage=cid=>Math.round((10+club(cid).rep*0.55)*(1+0.06*Math.max(0,G.year-1960)));
function newContract(cid,years){G.user.contract={wage:mgrWage(cid),until:G.year+years-1,since:G.date};}
function capacity(cid){const c=club(cid);let cap=Math.round((10000+c.rep*560)/500)*500;const u=c.upg||{};if(u.stand&&u.stand.done<=G.date)cap+=4000;return cap;}
const AREAS=['North Stand','the Paddock','Main Stand, Row F','the Popular Side','the Home End','a season ticket holder since 1946',"a supporters' club member",'behind the goal','the Enclosure','the Boys\' Pen'];
function lettersFor(){const u=G.user;if(u.letters&&u.letters.club===U()&&daysBetween(u.letters.d,G.date)<7)return u.letters.l;
  const c=club(U());const f=fans();const sqd=sq(U());const top=sqd.slice().sort((a,b)=>b.gls-a.gls)[0];const goat=sqd.filter(p=>p.apps>=3&&p.pos!=='GK').sort((a,b)=>a.rs/a.apps-b.rs/b.apps)[0];
  const last=G.fx.filter(x=>x.p&&isUserFx(x)).slice(-1)[0];const t=table(c.div);const pos=t.findIndex(r=>r.id===U())+1;const exp=expFor(U());const pool=[];
  if(last){const h=last.h===U();const my=h?last.hg:last.ag,th=h?last.ag:last.hg;const o=cn(h?last.a:last.h);
    if(my>th)pool.push(`What a performance against ${o}! ${my}-${th}, and it could have been more. That is the football we pay our money to see.`);
    else if(my<th)pool.push(`I have followed this club for thirty years and I have rarely seen anything as poor as the ${my}-${th} against ${o}. Something has to change.`);
    else pool.push(`A ${my}-${th} draw with ${o}. Neither one thing nor the other, much like the pies.`);}
  if(top&&top.gls>=3)pool.push(`Can we have a word of praise for ${top.n}? ${top.gls} goals already this season. I have watched football since before the war and I have seen few better.`);
  if(goat&&goat.rs/goat.apps<6.3)pool.push(`With respect to the manager, ${goat.n} is not good enough for this club. He looks a yard off the pace every single week.`);
  if(G.user.price===2)pool.push(`${lsd(priceFor(U()))} to stand on an open terrace in the rain! Does the board think we are made of money? Some of us have families to feed.`);
  if(G.user.price===0)pool.push(`Thank you to the club for keeping admission down. It means I can bring both my lads every other Saturday.`);
  if(G.user.games>=6){if(pos<=Math.max(2,exp-3))pool.push(`${ord(pos)} in the table! I have told everyone at the works that this is our year.`);else if(pos>=exp+4)pool.push(`${ord(pos)} in the League. We were promised better than this, and the manager knows it.`);}
  if(u.lastSale&&daysBetween(u.lastSale.d,G.date)<40)pool.push(`Why was ${u.lastSale.n} sold? He was the heart of the team. Money is all this board cares about.`);
  if(u.lastBuy&&daysBetween(u.lastBuy.d,G.date)<40)pool.push(`At last, some ambition! ${u.lastBuy.n} is just the sort of player we have needed for years. Well done to the manager.`);
  if(f>=75)pool.push('Best atmosphere at the ground I can remember. The rattles have not stopped since August.');
  if(f<=30)pool.push('Crowds are dropping and I cannot blame anyone for staying at home. The heart has gone out of this club.');
  if(upgDone('lights'))pool.push('May I say how much I enjoy the new floodlights? A midweek match under the lights is a real occasion now.');
  pool.push('Could something be done about the queue at the tea bar at half-time? I missed ten minutes of the second half waiting for a Bovril.','Why does the programme cost more every season when it has fewer pages in it?','Please could the club do something about the gentleman with the bugle near me? Some of us come to watch the football.');
  moreLetters().forEach(x=>pool.push(x));const vs=shuffle([...FANLOOKS.keys()]);const l=shuffle(pool).slice(0,3).map((t,i)=>({t,n:pick(SIGNOFFS)(),a:pick(AREAS),v:vs[i]}));u.letters={d:G.date,club:U(),l};return l;}

/* ---------- save ---------- */
/* long decimals (morale, fitness) are cut to two places to keep the save small */
const slim=(k,v)=>typeof v==='number'&&!Number.isInteger(v)&&Math.abs(v)>=1?Math.round(v*100)/100:v;
/* saves and save codes are gzipped (about a tenth of the size) where the browser can; a small separate entry holds
   the name, club and date for the title screen. Older plain saves and codes still load. */
const META_KEY='bovril-glory-save-meta';
const GZ=typeof CompressionStream!=='undefined'&&typeof DecompressionStream!=='undefined';
async function gzip(str){const buf=new Uint8Array(await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  let bin='';for(let i=0;i<buf.length;i+=32768)bin+=String.fromCharCode.apply(null,buf.subarray(i,i+32768));return btoa(bin);}
async function gunzip(b64){const bin=atob(b64),buf=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)buf[i]=bin.charCodeAt(i);
  return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).text();}
async function pack(json){if(GZ){try{return 'gz:'+await gzip(json);}catch(e){}}return json;}
async function unpack(s){s=String(s||'').trim();return JSON.parse(s.startsWith('gz:')?await gunzip(s.slice(3)):s);}
/* only the newest snapshot is ever written: saves made while one is being compressed replace each other */
let saveFail=false,saveQ=Promise.resolve(),pendingSave=null,saving=false;
function save(){if(!G)return;if(!G.autopilot)try{achScan();}catch(e){}let json,meta;try{json=JSON.stringify(G,slim);meta=JSON.stringify({name:G.user.name,club:cn(U()),date:G.date});}catch(e){return;}
  pendingSave={json,meta};if(!saving)saveQ=flushSaves();}
async function flushSaves(){saving=true;try{while(pendingSave){const s=pendingSave;pendingSave=null;await writeSave(s.json,s.meta);}}catch(e){}saving=false;}
/* closing the tab mid-save: write the newest snapshot uncompressed there and then (it still loads) */
if(typeof window!=='undefined'&&window.addEventListener)window.addEventListener('pagehide',()=>{if(!G||!(saving||pendingSave))return;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(G,slim));localStorage.setItem(META_KEY,JSON.stringify({name:G.user.name,club:cn(U()),date:G.date}));}catch(e){}});
async function writeSave(json,meta){const was=saveFail;
  try{localStorage.setItem(SAVE_KEY,await pack(json));localStorage.setItem(META_KEY,meta);saveFail=false;}
  catch(e){try{if(G){pruneOld();localStorage.setItem(SAVE_KEY,await pack(JSON.stringify(G,slim)));localStorage.setItem(META_KEY,meta);saveFail=false;}else saveFail=true;}catch(e2){saveFail=true;}}
  if(saveFail!==was&&UI.screen!=='live')render();}
function saveWarnHTML(){return saveFail?`<div class="savewarn" role="alert"><strong>Your progress could not be saved.</strong> This browser is not letting the game store your career, perhaps because its storage for this site is full or blocked. Keep this tab open, and use <em>Show save code</em> in the Office to keep a copy.</div>`:'';}
async function loadSave(){try{const s=localStorage.getItem(SAVE_KEY);if(!s)return null;return await unpack(s);}catch(e){return null;}}
function savedInfo(){try{if(!localStorage.getItem(SAVE_KEY))return null;const m=localStorage.getItem(META_KEY);if(m)return JSON.parse(m);
  const s=JSON.parse(localStorage.getItem(SAVE_KEY));return s&&s.user?{name:s.user.name,club:s.clubs[s.user.club].n,date:s.date}:null;}catch(e){return null;}}

/* =================== INTERFACE =================== */
const $=s=>document.querySelector(s);
function crest(cid,size){const c=G?club(cid):null;const d=c||DATA.clubs.find(x=>x.id===cid);if(!d)return '';
  return `<span class="crest ${size||''}" style="--c1:${d.c1};--c2:${d.c2}" aria-hidden="true"><b>${esc(d.code||cid)}</b></span>`;}
function bar(v){return `<span class="abil"><i style="width:${clamp(v,0,100)*0.6}px"></i><em>${v}</em></span>`;}
function stars(pa){const n=clamp(Math.round((pa-40)/10),1,5);return `<span class="stars" title="Potential">${'★'.repeat(n)}${'☆'.repeat(5-n)}</span>`;}
function potHTML(p){return staffQ('scout')>=3?`${stars(p.pa)} <small class="muted">${p.pa}</small>`:stars(p.pa);}
const avgR=p=>p.apps?(p.rs/p.apps).toFixed(2):'-';
function sqTreat(){const S=sq(U());const inj=S.filter(p=>p.inj>0).sort((a,b)=>b.inj-a.inj);const tired=S.filter(p=>!p.inj&&p.fit<85).sort((a,b)=>a.fit-b.fit);
  const dropped=S.filter(p=>p.drop&&p.drop>=G.date);const back=S.filter(p=>!p.inj&&p.injBack&&daysBetween(p.injBack,G.date)<=14);
  const log=(G.user.injLog||[]).filter(x=>x.s===G.year);const fq=staffQ('fit');const lost=log.reduce((t,x)=>t+x.days,0);
  const row=p=>`<tr class="click" data-a="player" data-id="${p.id}"><td><span class="pos p-${p.pos}">${p.pos}</span></td><td class="l nm">${esc(p.n)}</td><td class="l">${esc(p.injN||'an injury')}</td><td>${p.inj}d</td><td class="l">${fmtDate(addDays(G.date,p.inj),true)}</td><td class="l">${p.injOn?fmtDate(p.injOn,true):'-'}</td></tr>`;
  return `<div class="clubv"><section class="panel"><div class="ph"><div><h2 class="h1">The treatment room</h2><p class="muted">The trainer, the magic sponge, and a bench that smells of liniment.</p></div></div>
   ${inj.length?`<div class="tw"><table class="tbl"><thead><tr><th>Pos</th><th class="l">Name</th><th class="l">Injury</th><th>Out</th><th class="l">Back around</th><th class="l">Since</th></tr></thead><tbody>${inj.map(row).join('')}</tbody></table></div>`:'<p class="stamp">The treatment room is empty. Everyone is fit.</p>'}
   <p class="muted sm">${fq?`Your fitness coach (${'★'.repeat(fq)}) gets men back sooner.`:'A fitness coach from the Backroom tab would get men back sooner.'}${upgDone('tr_gym')?' The club gymnasium helps too.':''}</p></section>
  <section class="panel"><h3 class="h2 first">Needs a rest</h3>${tired.length?`<ul class="rts">${tired.map(p=>`<li><span>${esc(p.n)} <small class="muted">${POSN[p.pos]}</small></span><b class="${p.fit<70?'lo':''}">${Math.round(p.fit)}%</b></li>`).join('')}</ul><p class="muted sm">Fitness comes back a little every day. Tired men play worse and fade late in games.</p>`:'<p class="muted">Everyone is fresh.</p>'}
   ${back.length?`<h3 class="h2">Back in training</h3><ul class="rts">${back.map(p=>`<li><span>${esc(p.n)}</span><small>${fmtDate(p.injBack,true)}</small></li>`).join('')}</ul>`:''}
   ${dropped.length?`<h3 class="h2">Suspended or left out</h3><ul class="rts">${dropped.map(p=>`<li><span>${esc(p.n)}</span><small>${isSusp(p)?'Suspended':esc(p.dropWhy||'Left out')} until ${fmtDate(p.drop,true)}</small></li>`).join('')}</ul>`:''}
   <h3 class="h2">This season's casualty list</h3>${log.length?`<p class="muted sm">${log.length} injur${log.length===1?'y':'ies'}, ${plu(lost,'day')} lost.</p><ul class="rts">${log.slice(0,12).map(x=>`<li><span>${esc(x.n)}: ${esc(x.what)} <small class="muted">${esc(x.where||'')}</small></span><small>${fmtDate(x.date,true)} · ${outFor(x.days)}</small></li>`).join('')}</ul>`:'<p class="muted">No injuries yet this season.</p>'}</section></div>`;}
function sqForm(){const me=U();const R=G.fx.filter(f=>f.p&&(f.h===me||f.a===me)).sort((a,b)=>a.date<b.date?1:-1);
  const res=f=>{const h=f.h===me;const us=h?f.hg:f.ag,th=h?f.ag:f.hg;return {h,us,th,r:us>th?'W':us<th?'L':'D',opp:h?f.a:f.h,sc:(f.ev||[]).filter(e=>e[1]===(h?0:1)&&e[3]!=='og').map(e=>surname(e[2]))};};
  const rec=list=>{const o={p:0,w:0,d:0,l:0,f:0,a:0};list.forEach(f=>{const x=res(f);o.p++;o.f+=x.us;o.a+=x.th;o[x.r==='W'?'w':x.r==='D'?'d':'l']++;});return o;};
  const L=R.filter(f=>f.comp==='L');const all=rec(L),hm=rec(L.filter(f=>f.h===me)),aw=rec(L.filter(f=>f.a===me));
  const recRow=(l,o)=>`<tr><td class="l">${l}</td><td>${o.p}</td><td>${o.w}</td><td>${o.d}</td><td>${o.l}</td><td>${o.f}</td><td>${o.a}</td></tr>`;
  const S=sq(me);const top=(k,n)=>S.filter(p=>(p[k]||0)>0).sort((a,b)=>(b[k]||0)-(a[k]||0)).slice(0,n||5);
  const best=S.filter(p=>p.apps>=5).sort((a,b)=>b.rs/b.apps-a.rs/a.apps).slice(0,5);
  const hot=S.filter(p=>p.form.length>=3).sort((a,b)=>avgForm(b)-avgForm(a));
  const li=(p,v)=>`<li class="click" data-a="player" data-id="${p.id}"><span>${esc(p.n)}</span><b>${v}</b></li>`;
  return `<div class="clubv"><section class="panel"><div class="ph"><div><h2 class="h1">Form guide</h2><p class="muted">Every result this season, newest first.</p></div></div>
   ${R.length?`<div class="tw"><table class="tbl"><thead><tr><th class="l">Date</th><th class="l">Comp</th><th></th><th class="l">Opponent</th><th>Score</th><th></th><th class="l">Our scorers</th></tr></thead><tbody>${R.slice(0,12).map(f=>{const x=res(f);return `<tr><td class="l">${fmtDate(f.date,true)}</td><td class="l">${compShort(f)}</td><td>${x.h?'H':'A'}</td><td class="l">${crest(x.opp,'sm')} ${esc(cn(x.opp))}</td><td><b>${x.us}-${x.th}</b></td><td><span class="fmrow"><i class="fm-${x.r}">${x.r}</i></span></td><td class="l sm wrapc">${esc(Object.entries(x.sc.reduce((o,n)=>(o[n]=(o[n]||0)+1,o),{})).map(([n,c])=>c>1?`${n} ${c}`:n).join(', '))||'-'}</td></tr>`;}).join('')}</tbody></table></div>`:'<p class="muted">No matches played yet this season.</p>'}
   <h3 class="h2">League record</h3><div class="tw"><table class="tbl mini"><thead><tr><th></th><th>P</th><th>W</th><th>D</th><th>L</th><th>F</th><th>A</th></tr></thead><tbody>${recRow('Overall',all)}${recRow('Home',hm)}${recRow('Away',aw)}</tbody></table></div></section>
  <section class="panel"><h3 class="h2 first">Top scorers</h3>${top('gls').length?`<ul class="rts">${top('gls').map(p=>li(p,p.gls)).join('')}</ul>`:'<p class="muted">Nobody has scored yet.</p>'}
   <h3 class="h2">Most assists</h3>${top('ast').length?`<ul class="rts">${top('ast').map(p=>li(p,p.ast)).join('')}</ul>`:'<p class="muted">None yet.</p>'}
   <h3 class="h2">Best average rating</h3>${best.length?`<ul class="rts">${best.map(p=>li(p,(p.rs/p.apps).toFixed(2))).join('')}</ul>`:'<p class="muted">Five games needed to qualify.</p>'}
   ${hot.length>=6?`<h3 class="h2">In form</h3><ul class="rts">${hot.slice(0,3).map(p=>li(p,avgForm(p).toFixed(1))).join('')}</ul><h3 class="h2">Out of form</h3><ul class="rts">${hot.slice(-3).reverse().map(p=>li(p,avgForm(p).toFixed(1))).join('')}</ul>`:''}</section></div>`;}
function formDots(fm){return `<span class="fdots">${fm.slice(-5).map(r=>`<i class="${r>=7.5?'hi':r<6?'lo':'mid'}">${r.toFixed(1)}</i>`).join('')}</span>`;}

function render(){
  if(typeof document==='undefined')return;
  const app=$('#app');if(!app)return;
  if(UI.screen==='title'){app.innerHTML=vTitle();renderOverlay();return;}
  if(UI.screen==='setup'){app.innerHTML=vSetup();renderOverlay();return;}
  if(!G){UI.screen='title';app.innerHTML=vTitle();return;}
  let body='';
  switch(UI.screen){case 'prematch':body=vPrematch();break;case 'live':body=vLive();break;case 'results':body=vResults();break;case 'season':body=vSeason();break;case 'sacked':body=vSacked();break;case 'review':body=vReview();break;case 'simrun':body=vSimRun();break;case 'sim':body=vSim();break;case 'retired':body=vRetired();break;default:body=vTab();}
  if(UI.screen==='game'&&!UI.modal&&!UI.press&&!UI.notice&&(G.ddQ||[]).length){G.ddQ=[];UI.paper=null;UI.notice={k:'dday'};}
  if(UI.screen==='game'&&!UI.modal&&!UI.press&&!UI.paper&&!UI.notice&&(G.talkQ||[]).length){const id=G.talkQ.shift();const tm=G.inbox.find(x=>x.id===id);if(tm&&!tm.act.done)UI.notice={k:'talk',mid:id};}
  if(UI.screen==='game'&&!UI.modal&&!UI.press&&!UI.paper&&!UI.notice&&(G.bidQ||[]).length){const id=G.bidQ.shift();const bm=G.inbox.find(x=>x.id===id);if(bm&&bm.act&&!bm.act.done)UI.notice={k:'bid',mid:id};}
  if(UI.screen==='game'&&!UI.modal&&!UI.press&&!UI.paper&&!UI.notice&&G.paperQ.length){const fq=G.paperQ.map(id=>G.inbox.find(x=>x.id===id)).filter(x=>x&&x.force);
    if(fq.length){const ids=fq.map(x=>x.id);G.paperQ=G.paperQ.filter(id=>!ids.includes(id));UI.paper={ids:ids.reverse().slice(0,4),i:0,spin:true};}}
  if(UI.screen==='game'&&!UI.modal&&!UI.press&&!UI.paper&&!UI.notice&&G.paperQ.length){const mode=G.settings.papers;
    if(mode==='off')G.paperQ=[];else if(mode==='auto'){const q=G.paperQ.map(id=>G.inbox.find(x=>x.id===id)).filter(Boolean);
      const due=q.length&&(q.length>=2||daysBetween(q[0].date,G.date)>=5)&&daysBetween(G.lastPaperPop||'1900-01-01',G.date)>=4;
      if(q.some(x=>x.big)||due){const ids=q.filter(x=>x.big).reverse().concat(q.filter(x=>!x.big).reverse()).map(x=>x.id).slice(0,4);G.paperQ=[];G.lastPaperPop=G.date;UI.paper={ids,i:0,spin:true};}}}
  const keep=app.querySelectorAll?[...app.querySelectorAll('[data-keep]')].map(el=>[el.dataset.keep,el.scrollTop]):[];const vk=UI.screen+'|'+UI.tab;const wy=typeof window!=='undefined'&&window.scrollY!=null?window.scrollY:0;
  if(UI.screen==='game'&&!UI.modal&&!UI.press&&!UI.paper&&!UI.notice&&(G.letterQ||[]).length){UI.notice={k:'letter',mid:G.letterQ.shift()};}
  if(UI.screen==='game'&&!UI.modal&&!UI.press&&!UI.paper&&!UI.notice&&(G.radioQ||[]).length){G.radioQ=[];UI.notice={k:'radio'};}
  if(UI.screen==='game'&&!UI.modal&&!UI.press&&!UI.paper&&!UI.notice&&(G.wireQ||[]).length){UI.notice={k:'wire',mid:G.wireQ.shift()};}
  app.innerHTML=fixPoss(vMast()+saveWarnHTML()+`<main class="main${UI.screen==='game'&&['squad','transfers'].includes(UI.tab)?' wide':''}">${body}</main>`+paperboyHTML());
  keep.forEach(([k,t])=>{const el=app.querySelector(`[data-keep="${k}"]`);if(el)el.scrollTop=t;});if(UI._vk===vk&&window.scrollTo&&Math.abs((window.scrollY||0)-wy)>1)window.scrollTo(0,wy);UI._vk=vk;
  renderModal();renderOverlay();
  if(UI.screen==='results')startPrinter();
  if(UI.screen==='live'){updateLive(true);startViz();}
  if(UI.screen==='game'&&UI.tab==='finances')bindChart();
}
function vMast(){
  const c=club(U());const inGame=UI.screen==='game';const today=G.fx.filter(f=>f.date===G.date&&!f.p);
  const lbl=G.sacked?'Find a new club':today.some(isUserFx)?'To the match':today.length?'Play matchday':nextDate()==='9999'?'End of season':'Continue';
  const tabs=[['inbox','Intray'],['squad','Squad'],['tactics','Tactics'],['staff','Backroom'],['fixtures','Fixtures'],['calendar','Calendar'],['tables','Tables'],['cup','Cups'],['transfers','Transfers'],['scout','Scouting'],['finances','Finances'],['club','Club'],['history','History'],['howto','How to play'],['office','Office']];
  const unread=G.inbox.filter(m=>!m.read).length;const busy=['live','prematch','results','season','sacked','retired','sim','simrun','review'].includes(UI.screen);
  return `<header class="mast"><div class="mast-in">
    <div class="brand"><span>Bovril</span><i>&amp;</i><span>Glory</span></div>
    <div class="mclub">${crest(U())}<div><strong>${esc(c.n)}</strong><small>${DIVN[c.div]} · ${esc(G.user.name)}</small></div></div>
    <div class="mdate"><strong>${fmtDate(G.date)}</strong><small>Season ${seasonLbl(G.year)} · Bank ${money(c.bal)}</small></div>
    ${busy?'':`<div class="contbox"><button class="btn sm simahead" data-a="tab" data-k="calendar" title="Open the calendar to sim forward">Sim ahead ▸▸</button><button class="btn go" data-a="cont" id="btn-cont">${lbl} <span aria-hidden="true">▸</span></button></div>`}
  </div>
  ${busy?'':`<nav class="tabs" aria-label="Sections">${tabs.map(([k,l])=>`<button class="tab ${inGame&&UI.tab===k?'on':''}" data-a="tab" data-k="${k}">${l}${k==='inbox'&&unread?`<sup>${unread}</sup>`:''}${k==='transfers'&&pendingBids().length?`<sup class="bidsup" title="Offers for your players, waiting for an answer">${pendingBids().length}</sup>`:''}</button>`).join('')}</nav>`}
  </header>`;
}
function vTab(){switch(UI.tab){case 'squad':return vSquad();case 'tactics':return vTactics();case 'staff':return vStaff();case 'fixtures':return vFixtures();case 'calendar':return vCalendar();case 'tables':return vTables();case 'cup':return vCups();case 'scout':return vScout();case 'transfers':return vTransfers();case 'finances':return vFinances();case 'club':return vClub();case 'history':return vHistory();case 'howto':return vHow();case 'office':return vOffice();default:return vInbox();}}

/* ---- title & setup ---- */
function vTitle(){const s=savedInfo();
  return `<div class="poster"><div class="poster-in">
   <p class="eyebrow">The Football League · 1960 to 1970</p>
   <h1 class="title"><span>Bovril</span> <i>&amp;</i> <span>Glory</span></h1>
   <p class="lede">Ninety-two clubs. Real squads, real managers, real history. Two points for a win, goal average, the maximum wage, and a transfer deadline in March. Take a job and see how far you can go before the Seventies arrive.</p>
   <div class="row gap wrap">
    ${s?`<button class="btn go big" data-a="resume">Resume: ${esc(s.name)}, ${esc(s.club)} <small>${fmtDate(s.date,true)} ${s.date.slice(0,4)}</small></button>`:''}
    <button class="btn ${s?'':'go'} big" data-a="setup">New career</button>
   </div>
   <div class="ticket"><span>ADMIT ONE</span><span>Ground · Terrace</span><span>Price 2s 0d</span></div>
   <p class="browsernote"><strong>Note:</strong> This is a browser game. Your career is saved in this browser, on this device, and nowhere else. It will not follow you to another device or browser, and clearing your browsing data or playing in a private window will lose it.</p>
  </div></div>${s&&UI.confirmNew?`<div class="confirmnew"><div class="scrim" data-a="newno"></div><div class="card" role="dialog" aria-modal="true" aria-labelledby="cn-h">
   <h2 class="h1" id="cn-h">Are you sure?</h2>
   <p>Starting a new career will <strong>permanently delete your current save</strong>: ${esc(s.name)}, ${esc(s.club)}, ${fmtDate(s.date,true)} ${s.date.slice(0,4)}.</p>
   <p>This cannot be undone. To keep a copy, resume it and use <em>Show save code</em> in the Office first.</p>
   <div class="row gap wrap"><button class="btn go" data-a="newno">Keep my career</button><button class="btn danger" data-a="newyes">Yes, delete it and start again</button></div>
  </div></div>`:''}`;}
function vSetup(){const st=UI.start;const list=DATA.clubs.filter(c=>c.d===st.div);const sel=st.sel?DATA.clubs.find(c=>c.id===st.sel):null;
  return `<div class="setup"><header class="setup-h"><h1 class="title sm"><span>Bovril</span> <i>&amp;</i> <span>Glory</span></h1><p class="eyebrow">Situations vacant · Season 1960-61</p></header>
  <div class="setup-grid">
   <section class="panel">
    <h2 class="h2">Your name</h2>
    <label class="lbl" for="mgr-name">Manager's name, as it will appear in the papers</label>
    <input id="mgr-name" class="inp" maxlength="30" value="${esc(st.name)}" placeholder="e.g. Harry Ashworth" data-in="mname">
    <label class="lbl" for="start-year">Start in season</label><select id="start-year" class="inp" data-c="syear">${Array.from({length:10},(_,i)=>1960+i).map(y=>`<option value="${y}" ${(st.year||1960)===y?'selected':''}>${seasonLbl(y)}${y===1960?' (the beginning)':y===1966?' (after the World Cup)':''}</option>`).join('')}</select>${(st.year||1960)>1960?`<p class="muted sm">The seasons from 1960 are played out first, so the squads, transfers and history are right when you arrive. Divisions below are as of 1960: clubs may have gone up or down by then. It takes a little while.</p>`:''}
    <label class="chk"><input type="checkbox" id="hist-mode" ${st.hist?'checked':''} data-c="hist"> <span><strong>History mode.</strong> Real transfers and managerial changes happen through the decade, and the clubs who really won things get a lift in form. Turn off for a free-running world.</span></label>
    ${sel?`<div class="jobcard">${crestD(sel,'lg')}<div><h3>${esc(sel.n)}</h3><p>${DIVN[sel.d-1]} · ${esc(sel.g)}</p><p>You replace <strong>${esc(sel.m)}</strong>.</p><p>Reputation ${'●'.repeat(Math.round(sel.r/20))}${'○'.repeat(5-Math.round(sel.r/20))} · Funds about ${money(Math.round(sel.r*sel.r*14/100)*100)}</p></div></div>
      <button class="btn go big wide" data-a="begin">Take the job at ${esc(sel.s)}</button>`:`<p class="muted">Choose a club from the list. Big clubs have money and expectations. Fourth Division clubs have neither.</p>`}
   </section>
   <section class="panel">
    <div class="chips">${[1,2,3,4].map(d=>`<button class="chip ${st.div===d?'on':''}" data-a="sdiv" data-d="${d}">${DIVN[d-1]}</button>`).join('')}</div>
    <div class="clubgrid">${list.map(c=>`<button class="clubbtn ${st.sel===c.id?'on':''}" data-a="spick" data-id="${c.id}">${crestD(c)}<span><strong>${esc(c.n)}</strong><small>${esc(c.m)} · ${esc(c.g)}</small></span></button>`).join('')}</div>
   </section>
  </div></div>`;}
function crestD(d,size){return `<span class="crest ${size||''}" style="--c1:${d.c1};--c2:${d.c2}" aria-hidden="true"><b>${esc(d.id)}</b></span>`;}

/* ---- a pop-up note ---- */
let toastT=null;
function toast(t){if(typeof document==='undefined'||!document.body)return;let el=document.getElementById('toast');
  if(!el||!el.isConnected){el=document.createElement('div');el.id='toast';el.className='toast';el.setAttribute('role','status');document.body.appendChild(el);}
  el.innerHTML=t;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),3800);}
function noFunds(){const ch=chairOf(U());return ch.pearsey?`<strong>Pearsey:</strong> "One does not have the funds, dear boy."`:`<strong>You do not have the funds.</strong>`;}
/* ---- intray ---- */
const TYPEL={club:'Club',press:'Press',world:'Wireless',board:'Board',transfer:'Transfer',med:'Medical'};
function vInbox(){const F=UI.inF||'all';const nUn=G.inbox.filter(m=>!m.read).length;
  const list=F==='unread'?G.inbox.filter(m=>!m.read||m.id===UI.msg):G.inbox;
  const sel=list.find(m=>m.id===UI.msg)||(F==='unread'?null:G.inbox[0]);if(sel)sel.read=true;
  const nextF=G.fx.filter(f=>!f.p&&isUserFx(f))[0];
  return `<div class="inbox">
   <section class="panel list" data-keep="intray"><div class="inf" role="group" aria-label="Show"><button class="${F==='all'?'on':''}" data-a="inf" data-k="all">All</button><button class="${F==='unread'?'on':''}" data-a="inf" data-k="unread">Unread${nUn?` <sup>${nUn}</sup>`:''}</button>${nUn?'<button class="inf-mark" data-a="markread">Mark all read</button>':''}</div>
    <ul class="msgs">${list.length?'':'<li class="muted inf-empty">Nothing unread. The intray is clear.</li>'}${list.map(m=>`<li><button class="msg ${sel&&m.id===sel.id?'on':''} ${m.read?'':'unread'}" data-a="msg" data-id="${m.id}"><span class="tag t-${m.type}">${TYPEL[m.type]}</span><strong>${esc(m.title)}</strong><small>${fmtDate(m.date,true)} ${m.date.slice(0,4)}${m.act&&!m.act.done?' · Awaiting reply':''}</small></button></li>`).join('')}</ul></section>
   <div class="stack"><article class="panel reader">${sel?`<p class="eyebrow">${TYPEL[sel.type]} · ${fmtDate(sel.date)}</p><h2 class="h1">${esc(sel.title)}</h2>${esc(sel.body).split('\n').filter(Boolean).map(p=>`<p>${p}</p>`).join('')}${sel.act&&sel.act.place?`<figure class="dd-art">${meetArt(sel.act.place,sel.act.club)}</figure>`:''}${sel.paper?`<button class="btn ghost sm" data-a="openpaper" data-id="${sel.id}">Read it in the paper</button>`:''}${sel.letter?`<button class="btn ghost sm" data-a="openletter" data-id="${sel.id}">Read the letter</button>`:''}${sel.wire?`<button class="btn ghost sm" data-a="openwire" data-id="${sel.id}">Listen again</button>`:''}${msgActions(sel)}`:`<p class="muted">${F==='unread'?'Pick a letter from the pile.':'No post today.'}</p>`}</article>
   ${nextFxBox(nextF)}${runInHTML()}${tableSnap()}<div class="deskpair">${boardBox()}${terraceBox()}</div></div>
  </div>`;}
function tableSnap(){const c=club(U());const d=c.div;const t=table(d);const i=t.findIndex(r=>r.id===U());if(i<0)return '';const n=t.length;
  const a=clamp(i-2,0,n-5);const rows=t.slice(a,a+5);const pts=t[i].pts;
  const top=i===0?(n>1?`Top of the table, ${pts-t[1].pts} point${pts-t[1].pts===1?'':'s'} clear`:'Top of the table'):`${t[0].pts-pts} point${t[0].pts-pts===1?'':'s'} behind the leaders`;
  const dz=d===0||d===1?n-2:n-4;const dzl=d===3?'the re-election places':'the drop zone';
  const bot=i>=dz?`In ${dzl}, ${t[dz-1].pts-pts} point${t[dz-1].pts-pts===1?'':'s'} from safety`:`${pts-t[dz].pts} point${pts-t[dz].pts===1?'':'s'} above ${dzl}`;
  return `<section class="panel tsnap"><div class="nb-top"><p class="eyebrow">${DIVN[d]} · the view from ${ord(i+1)}</p><button class="btn ghost sm" data-a="tab" data-k="tables">Full table</button></div>
   <table class="tbl mini"><thead><tr><th>Pos</th><th class="l">Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Av.</th><th>Pts</th></tr></thead><tbody>${rows.map((r,k)=>{const z=zones(d,a+k,n);return `<tr class="${r.id===U()?'me':''} ${z?'z-'+z:''}"><td>${a+k+1}</td><td class="l">${crest(r.id,'sm')} ${esc(cn(r.id))}</td><td>${r.p}</td><td>${r.w}</td><td>${r.dr}</td><td>${r.l}</td><td>${r.a?(r.f/r.a).toFixed(2):r.f?'-':'0.00'}</td><td><b>${r.pts}</b></td></tr>`;}).join('')}</tbody></table>
   <p class="nb-foot">${top} · ${bot}</p></section>`;}
function boardBox(){const ch=chairOf(U());const conf=Math.round(G.user.conf);const kind=conf>=70?'good':conf<35?'bad':'neutral';
  const pool=(ch.pearsey?CQP:CQ)[kind]||CQ.neutral;const q=pool[hashStr(G.date.slice(0,7)+kind)%pool.length];
  const w=conf>=75?'Delighted':conf>=55?'Content':conf>=35?'Uneasy':conf>=20?'Losing patience':'On thin ice';
  return `<section class="panel meterbox"><p class="eyebrow">The boardroom</p><div class="meter"><i style="width:${conf}%" class="${conf<35?'lo':conf>=70?'hi':''}"></i></div><p class="mword"><strong>${w}</strong> <small class="muted">${conf} out of 100</small></p>${objHTML(true)}<blockquote class="mquote">"${esc(q)}"<cite>${esc(ch.n)}, chairman</cite></blockquote></section>`;}
function terraceBox(){const f=Math.round(fans());const homes=G.fx.filter(x=>x.p&&x.h===U()&&x.att).sort((a,b)=>a.date<b.date?1:-1);const last=homes[0];
  const lg=homes.filter(x=>x.comp==='L');const avg=lg.length?Math.round(lg.reduce((t,x)=>t+x.att,0)/lg.length):0;const R=REC(U());
  return `<section class="panel meterbox"><p class="eyebrow">On the terraces</p><div class="meter"><i style="width:${f}%" class="${f<30?'lo':f>=65?'hi':''}"></i></div><p class="mword"><strong>${moodWord(f)}</strong> <small class="muted">${f} out of 100</small></p>
   <ul class="gates">${last?`<li><span>Last home gate</span><b>${last.att.toLocaleString('en-GB')}</b></li>`:''}${avg?`<li><span>League average</span><b>${avg.toLocaleString('en-GB')}</b></li>`:''}${R&&R.hiGate?`<li><span>Your best gate</span><b>${R.hiGate.att.toLocaleString('en-GB')}</b></li>`:''}${!last?'<li><span>No home games yet this season</span></li>':''}</ul></section>`;}
function formOf(cid){return G.fx.filter(f=>f.p&&(f.h===cid||f.a===cid)).sort((a,b)=>a.date<b.date?1:-1).slice(0,5).reverse().map(f=>{const us=f.h===cid?f.hg:f.ag,them=f.h===cid?f.ag:f.hg;return us>them?'W':us<them?'L':'D';});}
function nextFxBox(f){if(!f)return `<section class="panel nextbox"><p class="eyebrow">Next fixture</p><p class="muted">No more fixtures this season.</p></section>`;
  const d=daysBetween(G.date,f.date);const when=d<=0?'Today':d===1?'Tomorrow':d<14?`In ${d} days`:`In ${Math.round(d/7)} weeks`;
  const opp=f.h===U()?f.a:f.h;const home=f.h===U();const comp=compLbl(f);
  const ground=f.venue?(f.venue==='Wembley'?'Empire Stadium, Wembley':f.venue):f.neutral?(f.r===7?'Empire Stadium, Wembley':'a neutral ground'):club(f.h).g;
  const t=f.comp==='L'?table(f.div):null;const at=id=>{if(!t)return '';const i=t.findIndex(r=>r.id===id);return i<0?'':ord(i+1);};
  const fm=cid=>{const x=formOf(cid);return x.length?`<span class="fmrow">${x.map(r=>`<i class="fm-${r}">${r}</i>`).join('')}</span>`:'<span class="muted sm">No games yet</span>';};
  return `<section class="panel nextbox"><div class="nb-top"><p class="eyebrow">Next fixture · ${esc(comp)}</p><strong class="nb-when">${when}</strong></div>
   <div class="nb-teams"><div>${crest(f.h,'lg')}<strong>${esc(cn(f.h))}</strong>${t?`<small>${at(f.h)}</small>`:''}${fm(f.h)}</div><span class="nb-v">v</span><div>${crest(f.a,'lg')}<strong>${esc(cn(f.a))}</strong>${t?`<small>${at(f.a)}</small>`:''}${fm(f.a)}</div></div>
   <p class="nb-foot">${fmtDate(f.date)} · ${esc(ground)} · ${home?'At home':'Away from home'} to ${esc(cn(opp))}</p></section>`;}
function msgActions(m){const a=m.act;if(!a)return '';if(a.k==='setup'&&!a.done)setupCheck();if(a.done)return `<p class="stamp">${esc(a.k==='talk'?'Dealt with':a.res||'Dealt with')}</p>${a.k==='talk'?`<button class="btn ghost sm" data-a="talkopen" data-id="${m.id}">See what was said</button>`:''}`;
  if(a.k==='setup')return `<div class="row gap wrap"><button class="btn go" data-a="tab" data-k="tactics">Go to Tactics</button></div>`;
  if(a.k==='terms'){const p=G.players[a.pid];return p?`<div class="row gap wrap"><button class="btn go" data-a="opendeal" data-id="${p.id}">Open talks with ${esc(p.n)}</button></div><small class="muted">The agreed fee stands until ${fmtDate(a.exp,true)}.</small>`:'';}
  if(a.k==='talk')return `<div class="row gap wrap"><button class="btn go" data-a="talkopen" data-id="${m.id}">Speak to him</button></div>`;
  if(a.k==='offer'||a.k==='abroad')return `<div class="row gap wrap"><button class="btn go" data-a="acc" data-id="${m.id}">Accept ${money(a.fee)}</button>${a.held?'':`<button class="btn" data-a="holdout" data-id="${m.id}">Hold out for more</button>`}<button class="btn" data-a="rej" data-id="${m.id}">Turn it down</button><button class="btn ghost" data-a="player" data-id="${a.pid}">View player</button></div>`;
  if(a.k==='benef')return `<div class="row gap wrap"><button class="btn go" data-a="benef" data-id="${m.id}" data-k="1">Take his money</button><button class="btn" data-a="benef" data-id="${m.id}" data-k="0">Politely decline</button></div>`;
  if(a.k==='trial')return trialHTML(m);
  if(a.k==='yforms')return yformsHTML(m);
  if(a.k==='contracts')return contractsHTML(m);
  if(a.k==='yhome'){const p=G.players[a.pid];const can=p&&mentorPool(p).length;return `<div class="row gap wrap"><button class="btn go" data-a="yhome" data-id="${m.id}" data-k="home">Send him home for the weekend</button>${can?`<button class="btn" data-a="yhome" data-id="${m.id}" data-k="mentor">Put ${esc(surname(mentorPool(p)[0].n))} in charge of him</button>`:''}<button class="btn" data-a="yhome" data-id="${m.id}" data-k="tough">Tell him to toughen up</button></div>`;}
  if(a.k==='ytap')return `<div class="row gap wrap"><button class="btn go" data-a="ytap" data-id="${m.id}" data-k="pay">Look after the family ourselves (${money(a.sum)})</button><button class="btn" data-a="ytap" data-id="${m.id}" data-k="report">Report them to the League</button><button class="btn" data-a="ytap" data-id="${m.id}" data-k="go">Let him go, for compensation</button></div>`;
  if(a.k==='mind')return `<div class="row gap wrap"><button class="btn go" data-a="mindr" data-id="${m.id}" data-i="0">Fire back</button><button class="btn" data-a="mindr" data-id="${m.id}" data-i="1">Laugh it off</button><button class="btn" data-a="mindr" data-id="${m.id}" data-i="2">Say nothing</button></div>`;
  if(a.k==='poach')return `<div class="row gap wrap"><button class="btn go" data-a="poachr" data-id="${m.id}" data-k="1">Match the offer (30% rise)</button><button class="btn" data-a="poachr" data-id="${m.id}" data-k="0">Let him go, for compensation</button></div>`;
  if(a.k==='ddbuy')return `<div class="row gap wrap"><button class="btn go" data-a="ddacc" data-id="${m.id}">Get in the car: sign him for ${money(a.fee)}</button><button class="btn" data-a="rej" data-id="${m.id}">Not for us</button><button class="btn ghost" data-a="player" data-id="${a.pid}">View player</button></div>`;
  if(a.k==='hof')return `<div class="row gap wrap"><button class="btn go" data-a="hofacc" data-id="${m.id}">Induct him</button><button class="btn" data-a="rej" data-id="${m.id}">Not this time</button></div>`;
  if(a.k==='job')return `<div class="row gap wrap"><button class="btn go" data-a="jobacc" data-id="${m.id}">Take the job at ${esc(club(a.club).s)}</button><button class="btn" data-a="rej" data-id="${m.id}">Stay where I am</button></div>`;
  return '';}

/* ---- squad ---- */
const ORD2={GK:0,FB:1,CH:2,WH:3,IF:4,WG:5,CF:6};
const moraleWord=m=>m>=85?'Superb':m>=70?'Good':m>=50?'Fair':m>=30?'Poor':'Low';
const starN=pa=>clamp(Math.round((pa-40)/10),1,5);
const SORTS={
 squad:{pos:p=>ORD2[p.pos],n:p=>p.n,age:p=>age(p),ca:p=>p.ca,pot:p=>starN(p.pa)*1000+p.ca,fit:p=>p.fit,mor:p=>p.mor,apps:p=>p.apps,gls:p=>p.gls,ast:p=>p.ast||0,tkl:p=>p.tkl||0,avg:p=>p.apps?p.rs/p.apps:0,val:p=>valueOf(p),w:p=>p.w,con:p=>p.until==null?99:p.until},
 tf:{pos:p=>ORD2[p.pos],n:p=>p.n,age:p=>age(p),club:p=>p.c==='ABR'?(p.abroad||'~'):p.c?club(p.c).n:'~',ca:p=>estOf(p).mid,pot:p=>(knowOf(p)>=55?starN(p.pa)*1000:0)+estOf(p).mid,val:p=>valueOf(p),w:p=>wageFor(p)}};
function sortBy(list,t){const s=UI.sort[t];const f=SORTS[t][s.k]||SORTS[t].ca;
  return list.sort((a,b)=>{const x=f(a),y=f(b);const c=typeof x==='string'?x.localeCompare(y):x-y;return c*s.d||b.ca-a.ca;});}
function sth(t,k,label,cls){const s=UI.sort[t];const on=s.k===k;
  return `<th class="${cls||''} srt ${on?'on':''}" aria-sort="${on?(s.d>0?'ascending':'descending'):'none'}"><button data-a="sort" data-t="${t}" data-k="${k}" title="Sort by ${label}">${label}<span class="sa" aria-hidden="true">${on?(s.d>0?'▲':'▼'):'↕'}</span></button></th>`;}
const SQSEC=[['squad','First team'],['acad','Academy'],['treat','Treatment room'],['form','Form guide'],['gone','Departures']];
function vSquad(){const sec=UI.sqSec||'squad';const inj=sq(U()).filter(p=>p.inj>0).length;
  return `<div class="stack"><nav class="panel clubnav" aria-label="Squad sections"><div class="chips">${SQSEC.map(([k,l])=>`<button class="chip ${sec===k?'on':''}" data-a="sqsec" data-k="${k}">${l}${k==='treat'&&inj?` <sup class="chipn">${inj}</sup>`:''}${k==='acad'&&acSize()?` <sup class="chipn">${acSize()}</sup>`:''}</button>`).join('')}</div></nav>${sec==='treat'?sqTreat():sec==='form'?sqForm():sec==='acad'?sqAcad():sec==='gone'?sqGone():sqList()}</div>`;}
function conBar(){const L=expiringNow();if(!L.length)return '';return `<div class="fullbar" role="note"><strong>Contracts ending this summer</strong><span>${esc(andList(L.map(p=>p.n)))}. ${G.year+1>=1964?'They leave on a free transfer when the season ends unless they sign new terms.':'Offer new terms, or retain them on their old ones.'} Click a player and choose "Offer a new contract".</span></div>`;}
function sqList(){validateUserXI();const s=sortBy(sq(U()).filter(p=>!p.acad),'squad');const wb=wageBill(U());const inXI=new Set(G.user.xi);const T=(k,l,c)=>sth('squad',k,l,c);
  return `${fullBar()}${conBar()}<section class="panel"><div class="ph"><h2 class="h1">First-team squad</h2><p class="muted">${s.length} of ${FTMAX} players${acSize()?` (and ${acSize()} in the academy, who do not count)`:''} · Wage bill ${money(wb)} a week${G.wageCap?' (maximum wage £20)':''} · Click a column heading to sort</p></div>
  <div class="tw"><table class="tbl"><thead><tr>${T('pos','Pos')}${T('n','Name','l')}${T('age','Age')}${T('ca','Ability','l')}${T('pot','Pot.')}${T('fit','Fit')}${T('mor','Morale')}${T('apps','Apps')}${T('gls','Gls')}${T('ast','Ast')}${T('tkl','Tkl')}${T('avg','Avg')}<th class="l">Form</th>${T('val','Value','r')}${T('w','Wage','r')}${T('con','Contract')}</tr></thead>
  <tbody>${s.map(p=>`<tr class="click ${p.inj?'injr':''}" data-a="player" data-id="${p.id}"><td><span class="pos p-${p.pos}">${p.pos}</span></td><td class="l nm">${esc(p.n)}${traitMini(p)}${G.user.capt===p.id?' <span class="xi capt" title="Captain">C</span>':''}${inXI.has(p.id)?' <span class="xi">XI</span>':''}${G.user.sub===p.id?' <span class="xi">12</span>':''}${p.inj?` <span class="inj" title="${esc(availWhy(p))}">Inj ${p.inj}d</span>`:p.drop&&p.drop>=G.date?` <span class="inj" title="${esc(availWhy(p))}">${isSusp(p)?'Suspended':'Left out'} to ${fmtDate(p.drop,true)}</span>`:''}${Object.values(G.user.held||{}).includes(p.id)?' <span class="lst" title="Picked, and back in the side as soon as he is available">Picked</span>':''}${p.listed?' <span class="lst">Listed</span>':''}</td><td>${age(p)}</td><td class="l">${bar(p.ca)}</td><td>${potHTML(p)}</td><td>${fitTag(p)}</td><td>${moraleWord(p.mor)}</td><td>${p.apps}</td><td>${p.gls}</td><td>${p.ast||0}</td><td>${p.tkl||0}</td><td>${avgR(p)}</td><td class="l">${formDots(p.form)}</td><td class="r">${money(valueOf(p))}</td><td class="r">£${p.w}</td><td>${p.until!=null?`<span class="${p.until<=G.year?'expiring':''}">${conEnds(p)}</span>`:'-'}</td></tr>`).join('')}</tbody></table></div></section>`;}
/* ---- tactics ---- */
function tacControls(t,act){return Object.entries(TACOPT).map(([k,o])=>`<div class="tacrow"><span class="lbl">${o.lbl}</span><div class="seg" role="group" aria-label="${o.lbl}">${o.opts.map((l,i)=>`<button class="${t[k]===i?'on':''}" data-a="${act}" data-k="${k}" data-v="${i}">${l}</button>`).join('')}</div><small class="muted">${o.tips[t[k]]}</small></div>`).join('');}
function staffLine(){const st=G.user.staff;if(!st.length)return '<p class="muted sm">No coaches on the staff. The Backroom tab has a list of men looking for work.</p>';
  return `<p class="muted sm">Backroom: ${st.map(s=>`${esc(s.n)} (${STAFF[s.type][0]}, ${'★'.repeat(s.q)})`).join(', ')}.</p>`;}
/* ---- backroom ---- */
function staffStatus(s){staffInit(s);const v=staffValue(s);const yrs=Math.max(0,G.year-+s.since.slice(0,4));
  return `<div class="sc-status"><div class="sc-xp" title="Experience towards his next star"><span>${s.q<5?'Next star':'At the top of his trade'}</span>${s.q<5?`<i><b style="width:${Math.round(s.xp)}%"></b></i>`:''}</div><dl><div><dt>Age</dt><dd>${s.age}${s.age>=60?' <small class="muted">(slowing down)</small>':''}</dd></div><div><dt>With you</dt><dd>${yrs?`${yrs} season${yrs===1?'':'s'}`:'This season'}</dd></div><div><dt>Value</dt><dd class="${v.w==='Expensive'?'neg':''}">${v.w}${s.w>v.fair?` <small class="muted">(a ${'★'.repeat(s.q)} coach usually earns £${v.fair})</small>`:''}</dd></div><div><dt>This season</dt><dd>${s.imp?IMPTXT[s.type](s.imp):'Early days'}</dd></div>${s.last?`<div><dt>Last season</dt><dd>${esc(s.last)}</dd></div>`:''}</dl></div>`;}
function staffCard(s,mine){const [t,d]=STAFF[s.type];
  return `<div class="staffcard ${mine?'mine':''}"><div class="sc-h"><span class="sc-badge t-${s.type}">${esc(t)}</span><span class="stars">${'★'.repeat(s.q)}${'☆'.repeat(5-s.q)}</span></div>
  <strong class="sc-n">${esc(s.n)}</strong>${s.real?'<small class="muted">A coach of the period</small>':''}<p class="sm">${esc(d)}</p>
  <p class="sm muted">Wage £${s.w} a week${mine?'':` · Signing-on fee ${money(s.fee)}`}</p>${mine?staffStatus(s):''}
  ${mine?`<button class="btn sm ghost" data-a="sackstaff" data-id="${s.id}">${UI.confirmStaff===s.id?'Yes, let him go (4 weeks\' pay)':'Let him go'}</button>`:`<button class="btn sm" data-a="hire" data-id="${s.id}">Hire him</button>`}</div>`;}
function vStaff(){const mine=G.user.staff;const slots=staffSlots();
  return `<div class="stack"><section class="panel"><div class="ph"><div><h2 class="h1">The backroom</h2><p class="muted">${mine.length} of ${slots} places filled${club(U()).div===0?'':'. First Division clubs can afford a third coach'}. Staff wages come out of the wage budget: ${money(wageBill(U())+staffBill())} of ${money(G.user.budget.wage)} a week used.</p></div></div>
   ${UI.staffNote?`<p class="stamp">${esc(UI.staffNote)}</p>`:''}
   <div class="staffgrid">${mine.map(s=>staffCard(s,true)).join('')}${Array.from({length:Math.max(0,slots-mine.length)},()=>`<div class="staffcard empty"><strong>Vacancy</strong><p class="sm muted">Hire a coach from the list below.</p></div>`).join('')}</div></section>
  <section class="panel"><h3 class="h2 first">Coaches looking for work</h3><p class="muted sm">The list changes every summer. Stars show quality: a five-star coach does roughly five times the good of a one-star man. Two coaches of the same kind do not add up; only the better one counts. Your best coach also acts as your assistant: the better he is, the more he spots in the dossier before a match and on the chalkboard after it.</p>
   <div class="staffgrid">${G.staffPool.map(s=>staffCard(s,false)).join('')}</div></section></div>`;}

/* ---- fixtures ---- */
function resFor(f,cid){if(!f.p)return '';const mine=f.h===cid?f.hg:f.ag,th=f.h===cid?f.ag:f.hg;let r=mine>th?'W':mine<th?'L':'D';if(f.comp!=='L'&&f.w)r=f.w===cid?(mine===th?'D':'W'):'L';return r;}
function friendliesHTML(){const fr=friendlyReady();const log=(G.user.friendlies||[]);
  return `<h3 class="h2 first">Floodlit friendlies</h3><p class="sm">In pre-season, or on an FA Cup Saturday once you are out of the Cup, invite a glamour side for a friendly. Big names draw big crowds, but they want an appearance fee, and your players will be a little tired afterwards.</p>${fr?`<p class="warn">${esc(fr)}</p>`:''}
   <div class="tw"><table class="tbl"><thead><tr><th class="l">Opponents</th><th class="l">From</th><th class="r">Appearance fee</th><th class="r">Likely crowd</th><th></th></tr></thead><tbody>${FRIENDLY.map(([n,from,draw,fee,str,c1,c2],i)=>`<tr><td class="l nm">${vcrest(n,c1,c2,'sm')} ${esc(n)}</td><td class="l">${esc(from)}</td><td class="r">${money(fee*infl())}</td><td class="r">${(Math.round(attendance({h:U(),a:U(),comp:'L'},true)*draw/100)*100).toLocaleString('en-GB')}</td><td><button class="btn sm" data-a="friendly" data-i="${i}" ${fr?'disabled':''}>Invite</button></td></tr>`).join('')}</tbody></table></div>${log.length?`<h3 class="h2">Friendlies played</h3><ul class="rts">${log.map(r=>`<li><span>${fmtDate(r.date,true)} v ${esc(r.n)}</span><b>${r.g1}-${r.g2}</b></li>`).join('')}</ul>`:''}`;}
function vFixtures(){
  const mode=UI.fixView;let body='';
  if(mode==='friendlies')body=friendliesHTML();
  else if(mode==='mine'){const list=G.fx.filter(isUserFx);
    body=`<div class="tw"><table class="tbl"><thead><tr><th class="l">Date</th><th class="l">Competition</th><th>H/A</th><th class="l">Opponents</th><th>Result</th><th class="r">Crowd</th></tr></thead><tbody>
    ${list.map(f=>{const h=f.h===U();const o=h?f.a:f.h;const r=resFor(f,U());return `<tr class="${f.date===G.date?'today':''}"><td class="l">${fmtDate(f.date,true)}</td><td class="l">${compLbl(f)}${isDerby(U(),o)?' <span class="lst">Derby</span>':''}</td><td>${f.neutral?'N':h?'H':'A'}</td><td class="l">${crest(o,'sm')} ${esc(cn(o))}</td><td>${f.p?`<span class="res r${r}">${r} ${h?f.hg:f.ag}-${h?f.ag:f.hg}</span>${f.rep?`<small class="rep">${esc(f.rep)}</small>`:''}`:'<span class="muted">3.00 pm</span>'}</td><td class="r">${f.att?f.att.toLocaleString('en-GB'):''}</td></tr>`;}).join('')}</tbody></table></div>`;}
  else{const dates=[...new Set(G.fx.filter(f=>f.p).map(f=>f.date))];const d=UI.resDateView&&dates.includes(UI.resDateView)?UI.resDateView:dates[dates.length-1];
    body=dates.length?`<div class="row gap wrap"><label class="lbl" for="rd-sel">Results from</label><select class="inp sm" id="rd-sel" data-c="rdate">${dates.map(x=>`<option value="${x}" ${x===d?'selected':''}>${fmtDate(x)}</option>`).join('')}</select></div>${classified(d,false)}`:'<p class="muted">No matches played yet this season.</p>';}
  return `<section class="panel"><div class="ph"><h2 class="h1">Fixtures &amp; results</h2><div class="chips"><button class="chip ${mode==='mine'?'on':''}" data-a="fixv" data-k="mine">${esc(club(U()).s)}</button><button class="chip ${mode==='all'?'on':''}" data-a="fixv" data-k="all">Classified results</button><button class="chip ${mode==='friendlies'?'on':''}" data-a="fixv" data-k="friendlies">Friendlies</button></div></div>${body}</section>`;}

/* ---- tables ---- */
function vTables(){const d=UI.div;const t=table(d);const sc=scorers(d,12);
  return `<div class="tables"><section class="panel"><div class="ph"><h2 class="h1">Football League ${DIVN[d]}</h2><div class="chips">${DIVN.map((n,i)=>`<button class="chip ${d===i?'on':''}" data-a="div" data-d="${i}">${n.replace('Division ','Div. ')}</button>`).join('')}</div></div>
  <div class="tw"><table class="tbl lt"><thead><tr><th></th><th class="l">Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>F</th><th>A</th><th title="Goal average">Avg</th><th>Pts</th><th class="l">Form</th></tr></thead><tbody>
  ${t.map((r,i)=>`<tr class="z-${zones(d,i,t.length)} ${r.id===U()?'me':''}"><td>${i+1}</td><td class="l">${crest(r.id,'sm')} ${esc(cn(r.id))}</td><td>${r.p}</td><td>${r.w}</td><td>${r.dr}</td><td>${r.l}</td><td>${r.f}</td><td>${r.a}</td><td>${r.a?(r.f/r.a).toFixed(3):'-'}</td><td><strong>${r.pts}</strong></td><td class="l">${r.fm.slice(-5).map(x=>`<i class="fm f-${x}">${x}</i>`).join('')}</td></tr>`).join('')}
  </tbody></table></div><p class="legend">${d===0?'<span class="k z-top"></span>Champions <span class="k z-down"></span>Relegated':d===3?'<span class="k z-up"></span>Promoted <span class="k z-reel"></span>Must apply for re-election':'<span class="k z-up"></span>Promoted <span class="k z-down"></span>Relegated'} · Two points for a win. Level clubs are split by goal average (goals for divided by goals against).</p></section>
  <section class="panel"><h3 class="h2 first">Leading scorers</h3>${sc.length?`<ol class="scorers">${sc.map(p=>`<li><button class="lnk" data-a="player" data-id="${p.id}">${esc(p.n)}</button> <small>${esc(club(p.c).s)}</small><b>${p.gls}</b></li>`).join('')}</ol>`:'<p class="muted">Nobody has scored yet.</p>'}</section></div>`;}

/* ---- cup ---- */
function vCup(){const c=G.cup;const rounds=[...new Set(G.fx.filter(f=>f.comp==='FA').map(f=>f.r))];const r=UI.cupRound!=null&&rounds.includes(UI.cupRound)?UI.cupRound:rounds[rounds.length-1];
  const ties=G.fx.filter(f=>f.comp==='FA'&&f.r===r);
  return `<section class="panel fapanel"><div class="ph"><h2 class="h1">The FA Cup ${seasonLbl(G.year)}</h2><div class="chips">${rounds.map(x=>`<button class="chip ${x===r?'on':''}" data-a="cupr" data-r="${x}">${CUPR[x]}</button>`).join('')}</div></div>
  ${c.winner?`<p class="banner">${crest(c.winner)} <strong>${esc(cn(c.winner))}</strong> are the holders.</p>`:''}
  <p class="muted">${CUPR[r]} · ${fmtDate(c.dates[r])}${r===2?' · First and Second Division clubs enter':''}${r<2?' · Third and Fourth Division clubs only':''}</p>
  <div class="ties">${ties.map(f=>`<div class="tie ${isUserFx(f)?'me':''}"><span class="th ${f.w===f.h?'win':''}">${esc(cn(f.h))} ${crest(f.h,'sm')}</span><span class="ts">${f.p?`${f.hg} - ${f.ag}`:'v'}</span><span class="ta ${f.w===f.a?'win':''}">${crest(f.a,'sm')} ${esc(cn(f.a))}</span>${f.rep?`<small class="rep">${esc(f.rep)}</small>`:''}</div>`).join('')}</div>
  ${c.byes.length&&r===c.round&&!c.winner?`<p class="muted sm">Byes: ${c.byes.map(cn).map(esc).join(', ')}</p>`:''}</section>`;}

/* ---- transfers ---- */
function vTransfers(){const f=UI.tf;if(f.mode==='offers'){const h=vTransfers0();return h.slice(0,h.indexOf('</section>')+10);}return vTransfers0();}
function vTransfers0(){const f=UI.tf;const b=G.user.budget;return `${fullBar()}<section class="panel"><div class="ph"><h2 class="h1">Transfer market</h2><p class="muted">${G.deadline?'The deadline has passed. Deals are closed until the end of the season.':`Deadline: ${fmtDate(`${G.year+1}-03-16`)}. Transfer budget ${money(b.transfer)} · Wage budget ${money(b.wage)} a week.`}</p></div>
  <div class="filters">
   <div class="chips">${[['all','All players'],['listed','Transfer list'],['free','Free agents'],['abroad','Abroad'],['offers','Offers for your players']].map(([k,l])=>`<button class="chip ${f.mode===k?'on':''} ${k==='offers'?'chip-off':''}" data-a="tfm" data-k="${k}">${l}${k==='offers'&&pendingBids().length?` <sup class="chipn">${pendingBids().length}</sup>`:''}</button>`).join('')}</div>${f.mode==='offers'?`</div>${offersHTML()}</section>`:''}
   ${f.mode==='offers'?'':''}<div class="frow"><input class="inp sm" id="tf-q" placeholder="Search by name" value="${esc(f.q)}" data-in="tfq">
   <select class="inp sm" id="tf-pos" data-c="tfpos"><option value="">Any position</option>${Object.entries(POSN).map(([k,v])=>`<option value="${k}" ${f.pos===k?'selected':''}>${v}</option>`).join('')}</select>
   <select class="inp sm" id="tf-div" data-c="tfdiv"><option value="">Any division</option>${DIVN.map((n,i)=>`<option value="${i}" ${String(f.div)===String(i)?'selected':''}>${n}</option>`).join('')}</select>
   <select class="inp sm" id="tf-age" data-c="tfage"><option value="">Any age</option>${[21,23,25,28,31].map(a=>`<option value="${a}" ${String(f.age)===String(a)?'selected':''}>${a} or under</option>`).join('')}</select>
   <select class="inp sm" id="tf-fee" data-c="tffee"><option value="">Any value</option>${Array.from({length:40},(_,k)=>(k+1)*5000).map(v=>`<option value="${v}" ${String(f.fee)===String(v)?'selected':''}>Up to ${money(v)}</option>`).join('')}</select><select class="inp sm" id="tf-trait" data-c="tftrait" aria-label="Trait"><option value="">Any trait</option>${Object.entries(TRAITS).filter(([k,t])=>!t.neg).map(([k,t])=>`<option value="${k}" ${f.trait===k?'selected':''}>${t.n}</option>`).join('')}</select></div>
  </div><div id="tf-res">${tfResults()}</div></section>`;}
function tfResults(){const f=UI.tf;const q=f.q.trim().toLowerCase();
  let list=Object.values(G.players).filter(p=>{if(p.ret||p.ban||p.eu||p.trial||p.n==='Pelé'||p.c===U())return false;if(f.mode==='abroad'){if(p.c!=='ABR')return false;}else if(p.c==='ABR')return false;else if(f.mode==='free'){if(p.c)return false;}else{if(!p.c)return false;if(f.mode==='listed'&&!p.listed)return false;}
    if(f.pos&&p.pos!==f.pos)return false;if(f.div!==''&&p.c&&p.c!=='ABR'&&String(club(p.c).div)!==String(f.div))return false;if(f.age&&age(p)>+f.age)return false;if(f.fee&&valueOf(p)>+f.fee)return false;if(q&&!p.n.toLowerCase().includes(q))return false;if(f.trait&&!knownTraits(p).includes(f.trait))return false;return true;});
  sortBy(list,'tf');const n=list.length;list=list.slice(0,80);const T=(k,l,c)=>sth('tf',k,l,c);
  if(!n)return '<p class="muted">Nobody matches. Try widening the search.</p>';
  return `<p class="muted sm">${n} player${n===1?'':'s'}${n>80?', showing the first 80':''} · Click a column heading to sort</p><div class="tw"><table class="tbl"><thead><tr>${T('pos','Pos')}${T('n','Name','l')}${T('age','Age')}${T('club','Club','l')}${T('ca','Ability','l')}${T('pot','Pot.')}${T('val','Value','r')}${T('w','Wage','r')}</tr></thead><tbody>
  ${list.map(p=>`<tr class="click" data-a="player" data-id="${p.id}"><td><span class="pos p-${p.pos}">${p.pos}</span></td><td class="l nm">${esc(p.n)}${p.listed?' <span class="lst">Listed</span>':''}${traitMini(p)}</td><td>${age(p)}</td><td class="l">${p.c==='ABR'?`${esc(p.abroad||'Abroad')} <small class="muted">${esc(p.nat||'')}</small>`:p.c?`${crest(p.c,'sm')} ${esc(club(p.c).s)}`:'<span class="muted">Free agent</span>'}</td><td class="l">${barK(p)}</td><td>${potK(p)}</td><td class="r">${money(valueOf(p))}</td><td class="r">£${wageFor(p)}</td></tr>`).join('')}</tbody></table></div>`;}
/* ---- finances ---- */
const WR=52;
const committed=()=>wageBill(U())+staffBill();
const bpot=()=>{const b=G.user.budget;return b.transfer+b.wage*WR;};
function splitMax(){const p=bpot();if(!(p>0))return 0;const cash=Math.max(0,club(U()).bal);return clamp(Math.min((p-committed()*WR)/p,cash/p),0,1);}
/* if the bank falls below the transfer budget, the budget comes down to meet it; the difference goes back into wages so the pot stays the same */
function squareBudget(){if(!G||!G.user||!G.user.budget||G.autopilot)return;const b=G.user.budget;const cash=Math.max(0,Math.floor(club(U()).bal));if(b.transfer>cash){const diff=b.transfer-cash;b.transfer=cash;b.wage=Math.round(b.wage+diff/WR);}}
function splitCalc(pct){const p=bpot();const t=Math.round(p*clamp(pct,0,splitMax()));return {transfer:t,wage:Math.round((p-t)/WR)};}
function arrow(v,label){const up=v>=0;return `<span class="ar ${up?'up':'down'}"><span aria-hidden="true">${up?'▲':'▼'}</span>${label!=null?` ${label}`:''}</span>`;}
function tile(lbl,val,sub,cls){return `<div class="kpi ${cls||''}"><small>${lbl}</small><strong>${val}</strong>${sub?`<span>${sub}</span>`:''}</div>`;}
function hbars(rows,dir){const mx=Math.max(1,...rows.map(r=>Math.abs(r[1])));return `<ul class="hbars ${dir}">${rows.map(([l,v])=>`<li><span>${esc(l)}</span><i><b style="width:${Math.abs(v)/mx*100}%"></b></i><em>${v?`<span class="ar ${dir==='in'?'up':'down'}" aria-hidden="true">${dir==='in'?'▲':'▼'}</span> `:''}${money(v)}</em></li>`).join('')}</ul>`;}
function balanceChart(){const y0=`${G.year}-07-01`;const pts=G.user.bh.filter(p=>p[0]>=y0);
  if(pts.length<2)return '<p class="muted sm">The chart fills in week by week as the season goes on.</p>';
  const W=640,H=210,pl=64,pr=14,pt=12,pb=26;const vs=pts.map(p=>p[1]);let lo=Math.min(...vs),hi=Math.max(...vs);if(lo>0)lo=Math.min(lo,hi*0.8);if(hi===lo)hi=lo+1000;
  const step=niceStep((hi-lo)/4);lo=Math.floor(lo/step)*step;hi=Math.ceil(hi/step)*step;
  const X=i=>pl+(i/(pts.length-1))*(W-pl-pr),Y=v=>pt+(1-(v-lo)/(hi-lo))*(H-pt-pb);
  let grid='';for(let v=lo;v<=hi+1e-6;v+=step)grid+=`<line x1="${pl}" x2="${W-pr}" y1="${Y(v)}" y2="${Y(v)}" class="${v===0?'zero':'grid'}"/><text x="${pl-8}" y="${Y(v)+4}" text-anchor="end" class="axis">${v<0?'-':''}£${Math.abs(v)>=1000?Math.round(Math.abs(v)/1000)+'k':Math.abs(v)}</text>`;
  const mons=[];pts.forEach((p,i)=>{const m=p[0].slice(0,7);if(!mons.length||mons[mons.length-1][0]!==m)mons.push([m,i]);});
  const xl=mons.map(([m,i])=>`<text x="${X(i)}" y="${H-8}" class="axis" text-anchor="middle">${MON[+m.slice(5)-1].slice(0,3)}</text>`).join('');
  const line=pts.map((p,i)=>`${i?'L':'M'}${X(i).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('');const base=Y(Math.max(lo,Math.min(0,hi)));
  const last=pts[pts.length-1];
  return `<div class="chartwrap"><svg class="balchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bank balance by week" data-pts='${JSON.stringify(pts)}' data-geo='${JSON.stringify({W,pl,pr,pt,pb,H,lo,hi})}'>${grid}${xl}
   <path d="${line}L${X(pts.length-1)},${base}L${X(0)},${base}Z" class="area"/><path d="${line}" class="ln"/><circle cx="${X(pts.length-1)}" cy="${Y(last[1])}" r="4.5" class="dot"/>
   <line class="xh" x1="0" x2="0" y1="${pt}" y2="${H-pb}" visibility="hidden"/><circle class="hv" r="4" visibility="hidden"/><rect class="hit" x="${pl}" y="${pt}" width="${W-pl-pr}" height="${H-pt-pb}"/></svg><div class="tip" hidden></div></div>`;}
function niceStep(r){const p=Math.pow(10,Math.floor(Math.log10(Math.max(1,r))));const n=r/p;return (n<=1?1:n<=2?2:n<=5?5:10)*p;}
function bindChart(){const svg=document.querySelector('.balchart');if(!svg||!svg.dataset||!svg.dataset.pts)return;const pts=JSON.parse(svg.dataset.pts),g=JSON.parse(svg.dataset.geo);const tip=svg.parentNode.querySelector('.tip');
  const xh=svg.querySelector('.xh'),hv=svg.querySelector('.hv');
  const X=i=>g.pl+(i/(pts.length-1))*(g.W-g.pl-g.pr),Y=v=>g.pt+(1-(v-g.lo)/(g.hi-g.lo))*(g.H-g.pt-g.pb);
  const move=e=>{const r=svg.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*g.W;const i=clamp(Math.round((x-g.pl)/(g.W-g.pl-g.pr)*(pts.length-1)),0,pts.length-1);
    xh.setAttribute('x1',X(i));xh.setAttribute('x2',X(i));xh.setAttribute('visibility','visible');hv.setAttribute('cx',X(i));hv.setAttribute('cy',Y(pts[i][1]));hv.setAttribute('visibility','visible');
    const prev=i?pts[i-1][1]:pts[i][1];const d=pts[i][1]-prev;
    tip.hidden=false;tip.innerHTML=`<small>${fmtDate(pts[i][0],true)} ${pts[i][0].slice(0,4)}</small><strong>${money(pts[i][1])}</strong>${i?`<small>${d>=0?'▲':'▼'} ${money(Math.abs(d))} on the week</small>`:''}`;const px=X(i)/g.W*r.width;tip.style.left=Math.min(r.width-140,Math.max(0,px-60))+'px';};
  const out=()=>{tip.hidden=true;xh.setAttribute('visibility','hidden');hv.setAttribute('visibility','hidden');};
  svg.addEventListener('pointermove',move);svg.addEventListener('pointerleave',out);}
function splitHTML(){const b=G.user.budget;const p=bpot();const pct=p?Math.round(b.transfer/p*100):0;const mx=Math.floor(splitMax()*100);const rec=Math.round((b.rec||0)*100);
  return `<div class="split"><div class="split-lbls"><span class="sw1">Transfer budget<strong id="sp-t">${money(b.transfer)}</strong><small>to spend</small></span><span class="r sw2">Wage budget<strong id="sp-w">${money(b.wage)}</strong><small>a week</small></span></div>
   <input type="range" id="split" class="range" min="0" max="100" step="1" value="${pct}" data-in="split" data-c="split" style="--rec:${rec}%;--max:${mx}%;--val:${pct}%" aria-label="Share of the budget for transfers" aria-valuetext="${pct}% on transfers">
   <div class="split-foot"><small><span class="recmark" aria-hidden="true"></span>Board's recommended split: ${rec}% on transfers. Slide right for more transfer money, left for more wages. The hatched end is off limits: you can't cut wages below the ${money(committed())} a week you already pay, and you can't set a transfer budget bigger than the ${money(Math.max(0,club(U()).bal))} in the bank. If the bank falls below your transfer budget, the budget comes down with it and the difference goes back into wages.</small><button class="btn sm ghost" data-a="splitreset">Reset to the board's split</button></div></div>`;}
function vFinances(){squareBudget();const c=club(U());const f=G.user.fin;const b=G.user.budget;const fc=forecast();const wb=wageBill(U()),sb=staffBill();
  const income=[['Gates: League',f.gateL],['Gates: cup ties',f.gateC],['Lottery, programmes and other',f.other],['Friendlies (net)',f.friend],['Players sold',f.sales]];
  const spend=[['Player wages',f.wages],['Backroom staff',f.staff],['Running costs',f.run],["Manager's salary",f.mgr||0],['Players bought',f.buys],['Building work',f.build]];
  const tin=income.reduce((t,r)=>t+r[1],0),tout=spend.reduce((t,r)=>t+r[1],0);const fr=friendlyReady();const dEnd=fc.end-c.bal;const net=fc.other-fc.out;
  return `<div class="stack"><section class="panel"><div class="ph"><div><h2 class="h1">Club finances</h2><p class="muted">${esc(c.n)} · Season ${seasonLbl(G.year)}</p></div></div>
   ${UI.finNote?`<p class="stamp">${esc(UI.finNote)}</p>`:''}<div class="asknote"><p>Need more to spend? You may be able to get more money for transfers by asking the chairman directly, in his office.</p><button class="btn sm" data-a="gochair">Go and see the chairman</button></div>
   <div class="kpis">${tile('Bank balance',money(c.bal),c.bal<0?'Overdrawn: the bank manager is watching':'In the black',c.bal<0?'neg':'')}${tile('Transfer budget',money(b.transfer),'Rises by 75% of any fee you receive')}${tile('Wage budget',`${money(b.wage)} a week`,`Using ${money(wb+sb)} (${Math.round((wb+sb)/Math.max(1,b.wage)*100)}%)`,(wb+sb)>b.wage?'neg':'')}${tile('Forecast at season end',money(fc.end),`${arrow(dEnd,money(Math.abs(dEnd)))} ${dEnd>=0?'up on':'down on'} today`,fc.end<0?'neg':'')}</div>
   <h3 class="h2">Budget split</h3><p class="muted sm">The board set the total. Slide it to move money between the two: every £${WR} of transfer budget is worth £1 a week in wages. Buying a cheap player with a small wage? Slide right. Keeping a squad of stars happy? Slide left.</p>${splitHTML()}
   <h3 class="h2">Bank balance, week by week</h3>${balanceChart()}</section>
  <div class="two"><section class="panel"><h3 class="h2 first">Money in this season <span class="tot">${arrow(1,money(tin))}</span></h3>${hbars(income,'in')}
   <h3 class="h2">Money out this season <span class="tot">${arrow(-1,money(tout))}</span></h3>${hbars(spend,'out')}</section>
  <section class="panel"><h3 class="h2 first">Forecast to ${fmtDate(fc.end_date,true)}</h3>
   <ul class="fcast"><li><span>Home League gates to come</span><em>${fc.homes} × ${money(fc.perGate)}</em>${arrow(1,money(fc.gates))}</li><li><span>Other income each week</span><em>${plu(fc.weeks,'week')}</em>${arrow(1,money(fc.other))}</li><li><span>Wages, staff and running costs each week</span><em>${plu(fc.weeks,'week')}</em>${arrow(-1,money(fc.out))}</li><li><span>Net each week before gates</span><em></em>${arrow(net,money(Math.abs(net)))}</li><li class="fc-tot"><span>Projected balance</span><em>now ${money(c.bal)}</em>${arrow(dEnd,money(fc.end))}</li></ul>
   <p class="muted sm">Cup runs, transfers and friendlies are not in the forecast. They come on top.</p>
   <h3 class="h2">Admission prices</h3><div class="seg" role="group" aria-label="Admission prices">${PRICEL.map((l,i)=>`<button class="${G.user.price===i?'on':''}" data-a="price" data-v="${i}">${l} · ${lsd(price()*PRICEM[i])}</button>`).join('')}</div>
   <p class="muted sm">${['Cheap: about 12% more people through the turnstiles, but each pays less.','Standard terrace admission for the League.','Dear: more money per head, about 15% fewer spectators.'][G.user.price]}</p></section></div>
${cupMoneyHTML()}
  <section class="panel"><h3 class="h2 first">Ground and commercial projects</h3><div class="staffgrid">${Object.entries(UPG).filter(([k,u])=>!u.cat&&upgOpen(k,u)).map(([k,u])=>projCard(k,u)).join('')}</div></section>
  <section class="panel"><h3 class="h2 first">Spending on the squad</h3>${spendHTML()}</section>
  <section class="panel"><h3 class="h2 first">The club: people and services</h3><p class="sm muted">Some of these cost a little every week once they are up and running.</p><div class="staffgrid">${Object.entries(UPG).filter(([k,u])=>u.cat==='club'&&upgOpen(k,u)).map(([k,u])=>projCard(k,u)).join('')}</div></section>
  <section class="panel asknote"><p>Floodlit friendlies are now arranged on the Fixtures tab.</p><button class="btn sm" data-a="gofriendly">Arrange a friendly</button></section></div>`;}
/* ---- club ---- */
const TROPHY_DEFS=`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="slv" x1="0" x2="1"><stop offset="0" stop-color="#858c92"/><stop offset=".35" stop-color="#f5f7f8"/><stop offset=".6" stop-color="#c4c9cd"/><stop offset="1" stop-color="#737a80"/></linearGradient><linearGradient id="wd" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6a4524"/><stop offset="1" stop-color="#3b2512"/></linearGradient></defs></svg>`;
function trophySVG(t){const O='stroke="#2f3438" stroke-width="2.5" stroke-linejoin="round"';const S='url(#slv)';const cl=club(t.club)||{c1:'#c42b1c',c2:'#ffffff'};
  const handle=(x,flip)=>`<path d="M${x} 46 Q${x+flip*-20} 48 ${x+flip*-16} 68 Q${x+flip*-12} 84 ${x+flip*6} 82" fill="none" stroke="#2f3438" stroke-width="7"/><path d="M${x} 46 Q${x+flip*-20} 48 ${x+flip*-16} 68 Q${x+flip*-12} 84 ${x+flip*6} 82" fill="none" stroke="#e1e5e8" stroke-width="3.5"/>`;
  if(t.k==='cup')return `<svg viewBox="0 0 120 160" class="tro" role="img" aria-label="FA Cup"><path d="M16 60 L8 104 L16 99 L21 108 L24 64Z" fill="${cl.c1}" ${O}/><path d="M104 60 L112 104 L104 99 L99 108 L96 64Z" fill="${cl.c2}" ${O}/>${handle(30,1)}${handle(90,-1)}<path d="M34 132 L86 132 L92 154 L28 154Z" fill="url(#wd)" ${O}/><path d="M44 120 L76 120 L82 132 L38 132Z" fill="${S}" ${O}/><rect x="54" y="96" width="12" height="24" fill="${S}" ${O}/><path d="M28 38 Q28 88 60 98 Q92 88 92 38Z" fill="${S}" ${O}/><ellipse cx="60" cy="38" rx="32" ry="6" fill="${S}" ${O}/><path d="M36 34 Q60 14 84 34Z" fill="${S}" ${O}/><circle cx="60" cy="14" r="5" fill="${S}" ${O}/><path d="M40 46 Q40 78 56 90" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/></svg>`;
  if(t.k==='motm')return `<svg viewBox="0 0 80 160" class="tro sm" role="img" aria-label="Manager of the Month"><rect x="8" y="128" width="64" height="22" fill="url(#wd)" ${O}/><rect x="18" y="133" width="44" height="12" fill="#d9a52e" stroke="#2f3438" stroke-width="1.5"/><path d="M30 30 L30 18 L50 18 L50 30 Q62 40 62 60 L62 124 Q62 128 58 128 L22 128 Q18 128 18 124 L18 60 Q18 40 30 30Z" fill="#b5651d" ${O}/><rect x="28" y="10" width="24" height="10" fill="#1c1b19" ${O}/><rect x="22" y="70" width="36" height="36" fill="#f6efd9" stroke="#2f3438" stroke-width="2"/><text x="40" y="86" text-anchor="middle" font-size="8" font-family="Georgia" font-weight="700" fill="#1c1b19">SCOTCH</text><text x="40" y="98" text-anchor="middle" font-size="6" font-family="Georgia" fill="#1c1b19">WHISKY</text><path d="M24 50 Q24 90 26 118" stroke="#fff" stroke-width="3" opacity=".4" fill="none"/></svg>`;
  if(t.k==='lc')return `<svg viewBox="0 0 120 160" class="tro" role="img" aria-label="League Cup"><path d="M36 138 L84 138 L90 156 L30 156Z" fill="url(#wd)" ${O}/><path d="M48 126 L72 126 L78 138 L42 138Z" fill="${S}" ${O}/><rect x="55" y="92" width="10" height="34" fill="${S}" ${O}/><path d="M24 30 Q24 84 60 94 Q96 84 96 30Z" fill="${S}" ${O}/>${handle(26,1)}${handle(94,-1)}<path d="M60 22 Q74 26 78 12 Q88 22 74 34" fill="none" stroke="#2f3438" stroke-width="6"/><path d="M60 22 Q74 26 78 12 Q88 22 74 34" fill="none" stroke="#e1e5e8" stroke-width="3"/><ellipse cx="60" cy="30" rx="36" ry="6" fill="${S}" ${O}/><path d="M28 40 Q30 70 50 84" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/><path d="M60 50 L60 70" stroke="${cl.c1}" stroke-width="6"/></svg>`;
  if(t.k==='eu')return `<svg viewBox="0 0 140 170" class="tro big" role="img" aria-label="${EUN[t.comp]||'European'} trophy"><path d="M38 146 L102 146 L108 166 L32 166Z" fill="url(#wd)" ${O}/><path d="M50 132 L90 132 L96 146 L44 146Z" fill="${S}" ${O}/><rect x="63" y="104" width="14" height="28" fill="${S}" ${O}/><path d="M34 26 Q32 92 70 106 Q108 92 106 26Z" fill="${S}" ${O}/><path d="M36 34 Q4 28 6 60 Q8 92 44 88" fill="none" stroke="#2f3438" stroke-width="9"/><path d="M36 34 Q4 28 6 60 Q8 92 44 88" fill="none" stroke="#e1e5e8" stroke-width="5"/><path d="M104 34 Q136 28 134 60 Q132 92 96 88" fill="none" stroke="#2f3438" stroke-width="9"/><path d="M104 34 Q136 28 134 60 Q132 92 96 88" fill="none" stroke="#e1e5e8" stroke-width="5"/><ellipse cx="70" cy="26" rx="36" ry="7" fill="${S}" ${O}/><path d="M44 38 Q44 78 62 98" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/><circle cx="70" cy="60" r="12" fill="#1d3f9a" stroke="#f2c14e" stroke-width="2"/><text x="70" y="65" text-anchor="middle" font-size="13" fill="#f2c14e">★</text></svg>`;
  if(t.k==='league'&&t.div===0)return `<svg viewBox="0 0 120 180" class="tro big" role="img" aria-label="League Championship trophy"><path d="M26 156 L94 156 L100 176 L20 176Z" fill="url(#wd)" ${O}/><path d="M34 140 L86 140 L90 156 L30 156Z" fill="url(#wd)" ${O}/><path d="M42 128 L78 128 L84 140 L36 140Z" fill="${S}" ${O}/><rect x="53" y="110" width="14" height="18" fill="${S}" ${O}/><path d="M32 58 Q28 104 60 116 Q92 104 88 58Z" fill="${S}" ${O}/><path d="M32 58 Q20 40 30 30 Q36 44 38 56" fill="${S}" ${O}/><path d="M88 58 Q100 40 90 30 Q84 44 82 56" fill="${S}" ${O}/><ellipse cx="60" cy="58" rx="28" ry="6" fill="${S}" ${O}/><path d="M40 54 Q60 36 80 54Z" fill="${S}" ${O}/><circle cx="60" cy="30" r="5" fill="${S}" ${O}/><path d="M60 35 L60 46 M54 40 L66 40" stroke="#2f3438" stroke-width="3"/><path d="M42 66 Q42 96 56 108" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/></svg>`;
  if(t.k==='league'&&t.div===1)return `<svg viewBox="0 0 120 160" class="tro" role="img" aria-label="Division Two trophy"><path d="M30 138 L90 138 L90 156 L30 156Z" fill="url(#wd)" ${O}/><path d="M46 126 L74 126 L80 138 L40 138Z" fill="${S}" ${O}/><rect x="56" y="84" width="8" height="42" fill="${S}" ${O}/><path d="M32 28 Q32 78 60 86 Q88 78 88 28Z" fill="${S}" ${O}/><ellipse cx="60" cy="28" rx="28" ry="5" fill="${S}" ${O}/><path d="M42 36 Q42 66 56 78" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/></svg>`;
  return `<svg viewBox="0 0 120 160" class="tro" role="img" aria-label="${DIVN[t.div]} shield"><rect x="14" y="20" width="92" height="132" rx="6" fill="url(#wd)" ${O}/><path d="M30 40 L90 40 L90 84 Q90 116 60 132 Q30 116 30 84Z" fill="${S}" ${O}/><circle cx="60" cy="80" r="18" fill="none" stroke="#2f3438" stroke-width="2"/><text x="60" y="87" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="20" fill="#2f3438">${t.div===2?'III':'IV'}</text></svg>`;}
function cabinetHTML(){const cab=G.user.cab||[];const per=4;const shelves=[];for(let i=0;i<Math.max(2,Math.ceil(cab.length/per));i++)shelves.push(cab.slice(i*per,i*per+per));
  const lbl=t=>t.k==='cup'?`FA Cup ${seasonLbl(t.y)}`:t.k==='lc'?`League Cup ${seasonLbl(t.y)}`:t.k==='eu'?`${EUN[t.comp]||'European trophy'} ${seasonLbl(t.y)}`:t.k==='motm'?`Manager of the Month, ${t.m}`:`${DIVN[t.div]} Champions ${seasonLbl(t.y)}`;
  return `${TROPHY_DEFS}<div class="cabinet" aria-label="Trophy cabinet"><div class="cab-top">The trophy cabinet</div>${shelves.map((sh,si)=>`<div class="shelf">${sh.length?sh.map(t=>`<figure class="trophy">${trophySVG(t)}<figcaption class="brass">${esc(lbl(t))}<br><small>${esc(cn(t.club))}</small></figcaption></figure>`).join(''):`<span class="cab-empty">${si===0&&!cab.length?'Polished, dusted and waiting. Win something and it goes here.':''}</span>`}</div>`).join('')}</div>`;}
const CLUBSEC=[['over','Overview'],['trophy','Trophy room'],['ground','Ground'],['records','Records'],['hof','Hall of Fame'],['rivals','Rivals'],['board','Boardroom'],['fans','Supporters'],['res','Reserves & youth'],['kit','Kit'],['train','Training ground'],['market',"Manager's market"],['contract','Your contract'],['mgrs','Other managers']];
function vClub(){const sec=UI.clubSec||'over';const F={over:cOver,ground:cGround,records:cRecords,hof:cHof,rivals:cRivals,board:cBoard,fans:cFans,res:cRes,kit:cKit,train:cTrain,contract:cContract,mgrs:cMgrs,trophy:cScrap,market:cMarket};
  return `<div class="stack"><nav class="panel clubnav" aria-label="Club sections"><div class="chips">${CLUBSEC.map(([k,l])=>`<button class="chip ${sec===k?'on':''}" data-a="clubsec" data-k="${k}">${l}</button>`).join('')}</div></nav>${UI.clubNote?`<p class="stamp">${esc(UI.clubNote)}</p>`:''}${(F[sec]||cOver)()}</div>`;}
function cOver(){const c=club(U());const conf=Math.round(G.user.conf);
  const homes=G.fx.filter(x=>x.p&&x.h===U()&&x.comp==='L');const avgAtt=homes.length?Math.round(homes.reduce((t,x)=>t+x.att,0)/homes.length):0;
  return `<div class="clubv"><section class="panel"><div class="ph">${crest(U(),'lg')}<div><h2 class="h1">${esc(c.n)}</h2><p class="muted">${esc(c.g)} · Manager ${esc(G.user.name)} · Reputation ${c.rep}</p></div></div>
   <h3 class="h2">The board</h3><div class="meter" role="meter" aria-valuenow="${conf}" aria-valuemin="0" aria-valuemax="100" aria-label="Board confidence"><i style="width:${conf}%"></i></div>
   <p><strong>${confText(conf)}</strong> (${conf}/100). ${boardTarget(expFor(U()),G.divs[c.div].length,c.div)}</p>
   <h3 class="h2">At a glance</h3>
   <dl class="dl"><div><dt>Bank balance</dt><dd>${money(c.bal)}</dd></div><div><dt>Transfer budget</dt><dd>${money(G.user.budget.transfer)}</dd></div><div><dt>Supporters</dt><dd>${moodWord(fans())}</dd></div><div><dt>Average home gate</dt><dd>${avgAtt?avgAtt.toLocaleString('en-GB'):'-'}</dd></div><div><dt>Chairman</dt><dd>${esc(chairOf(U()).n)}</dd></div><div><dt>Standing with players</dt><dd>${G.user.pull>2?'Players are keen to come here':G.user.pull<-2?'Players are wary of you':'Neutral'}</dd></div></dl>
   <button class="btn sm" data-a="tab" data-k="finances">Open the finances</button></section>
  <section class="panel"><h3 class="h2 first">Honours</h3><p>${(G.user.cab||[]).filter(t=>t.k!=='motm').length} trophies in the cabinet, and ${(G.user.scrap||[]).length} cuttings in the scrapbook.</p><button class="btn sm" data-a="clubsec" data-k="trophy">Go to the trophy room</button>
  ${c.hon.length?`<h3 class="h2">Club honours in your time</h3><ul class="hon">${c.hon.map(h=>`<li>${esc(h)}</li>`).join('')}</ul>`:''}
  ${G.user.career.length?`<h3 class="h2">Your record</h3><div class="tw"><table class="tbl"><thead><tr><th class="l">Season</th><th class="l">Club</th><th class="l">Division</th><th>Pos</th><th class="l">FA Cup</th></tr></thead><tbody>${G.user.career.map(r=>`<tr><td class="l">${seasonLbl(r.y)}</td><td class="l">${esc(cn(r.club))}</td><td class="l">${DIVN[r.div]}</td><td>${ord(r.pos)}</td><td class="l">${esc(r.cup)}</td></tr>`).join('')}</tbody></table></div>`:''}</section></div>`;}

/* ground: aerial drawing built from each club's real stand names and layout */
const groundOf=cid=>(DATA.grounds&&DATA.grounds[cid])||{t:'Popular Side',l:'Home End',r:'Town End',b:'Main Stand',f:{}};
function stadiumSVG(cid){cid=cid||U();const c=club(cid);const Gd=groundOf(cid);const F=Gd.f||{};const up=c.upg||{};const on=k=>!!(up[k]&&up[k].done<=G.date);
  const S=on('stand'),C=on('cover'),Lt=on('lights'),Sh=on('shop'),Lo=on('lottery');const ink='#1c1b19',terr='#c3bdac',step='#8e8878';
  const txt=(x,y,s,rot,fill)=>`<text x="${x}" y="${y}" font-size="7.2" text-anchor="middle" fill="${fill||ink}" font-family="Arial,sans-serif" font-weight="700"${rot?` transform="rotate(${rot} ${x} ${y})"`:''}>${esc(s.toUpperCase())}</text>`;
  const steps=(x,y,w,h,vert,n)=>{let s='';n=n||7;for(let i=1;i<n;i++)s+=vert?`<line x1="${x+w*i/n}" y1="${y}" x2="${x+w*i/n}" y2="${y+h}" stroke="${step}" stroke-width="1.2"/>`:`<line x1="${x}" y1="${y+h*i/n}" x2="${x+w}" y2="${y+h*i/n}" stroke="${step}" stroke-width="1.2"/>`;return s;};
  const roofV=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#5b5f63" stroke="${ink}" stroke-width="2"/>${[...Array(Math.floor(h/20))].map((_,i)=>`<line x1="${x}" y1="${y+12+i*20}" x2="${x+w}" y2="${y+12+i*20}" stroke="#7b8085" stroke-width="2"/>`).join('')}`;
  const pylon=(x,y)=>`${Lt?`<circle cx="${x}" cy="${y}" r="22" fill="#fff6c8" opacity=".35"/>`:''}<rect x="${x-(Lt?7:5)}" y="${y-(Lt?7:5)}" width="${Lt?14:10}" height="${Lt?14:10}" fill="${ink}"/>${Lt?`<rect x="${x-5}" y="${y-5}" width="10" height="10" fill="#f2c14e"/>`:''}`;
  const modern=(x,y,w,h,label)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c.c1}" stroke="${ink}" stroke-width="2"/>${[0,1,2,3].map(i=>`<line x1="${x+4}" y1="${y+8+i*(h-12)/4}" x2="${x+w-4}" y2="${y+8+i*(h-12)/4}" stroke="${c.c2}" stroke-width="2" opacity=".85"/>`).join('')}<rect x="${x}" y="${y}" width="${w}" height="7" fill="#2f3235"/>`;
  const wooden=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#7a5a3a" stroke="${ink}" stroke-width="2"/>${[...Array(Math.floor(w/28))].map((_,i)=>`<line x1="${x+14+i*28}" y1="${y}" x2="${x+14+i*28}" y2="${y+h}" stroke="#5a4028" stroke-width="2"/>`).join('')}<path d="${`M${x+w/2-10} ${y} L${x+w/2} ${y-8} L${x+w/2+10} ${y}`}" fill="#7a5a3a" stroke="${ink}" stroke-width="2"/>`;
  const deco=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ece5d2" stroke="${ink}" stroke-width="2"/>${[...Array(Math.floor(w/16))].map((_,i)=>`<line x1="${x+8+i*16}" y1="${y+4}" x2="${x+8+i*16}" y2="${y+h-4}" stroke="#9a927c" stroke-width="2"/>`).join('')}<rect x="${x}" y="${y}" width="${w}" height="6" fill="${c.c1}"/>`;
  const two=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#8f8a7c" stroke="${ink}" stroke-width="2"/><rect x="${x}" y="${y}" width="${w}" height="${h/2}" fill="#6e6a60"/>${steps(x,y+h/2,w,h/2,false,4)}<line x1="${x}" y1="${y+h/2}" x2="${x+w}" y2="${y+h/2}" stroke="${ink}" stroke-width="2"/>`;
  const kop=F.kop||[];const kopRoof=kop[1]&&G.year>=kop[1];
  const endW=side=>kop[0]===side?56:48;
  let stripes='';for(let i=0;i<10;i++)stripes+=`<rect x="${70+i*26}" y="64" width="26" height="142" fill="${i%2?'#3f7d45':'#468a4c'}"/>`;
  let out=`<rect width="400" height="270" fill="#a7b38e"/><rect x="0" y="258" width="400" height="12" fill="#6f6a60"/>`;
  // top side
  if(F.cricket){out+=`<rect x="30" y="0" width="340" height="60" rx="30" fill="#9cc083" stroke="${ink}" stroke-width="1.5"/><rect x="190" y="18" width="20" height="30" fill="#d8c79a" stroke="${ink}" stroke-width="1"/><rect x="40" y="6" width="44" height="22" fill="#f3efe6" stroke="${ink}" stroke-width="2"/><path d="M38 6 L62 -4 L86 6Z" fill="#c8202f" stroke="${ink}" stroke-width="2"/>${txt(200,56,Gd.t)}`;}
  else if(F.river){const rn=typeof F.river==='string'?F.river:'R. Thames';out+=`<rect x="0" y="0" width="400" height="30" fill="#5a86b0"/>${[0,1,2].map(i=>`<path d="M${10+i*120} ${10+i*6} q15 -6 30 0 t30 0 t30 0" stroke="#cfe0ee" stroke-width="2" fill="none"/>`).join('')}<text x="352" y="20" font-size="8" fill="#e8f0ff" font-family="Georgia,serif" font-style="italic">${rn}</text><rect x="66" y="34" width="268" height="24" fill="${terr}" stroke="${ink}" stroke-width="2"/>${steps(66,34,268,24,false,4)}${txt(200,50,Gd.t)}`;}
  else{const top=F.deep==='t'?2:14;const h=58-top;
    if(F.cant&&F.cant[0]==='t'&&G.year>=F.cant[1])out+=modern(66,top,268,h)+txt(200,top+h-6,Gd.t+' (cantilever)','','#f6f1e1');
    else if(F.deco&&F.deco.includes('t'))out+=deco(66,top,268,h)+txt(200,top+h-8,Gd.t);
    else if(F.double)out+=two(66,top,268,h)+txt(200,top+10,Gd.t,'','#f6f1e1');
    else if(F.shelf)out+=`<rect x="66" y="${top}" width="268" height="${h*0.55}" fill="#6e6a60" stroke="${ink}" stroke-width="2"/><rect x="66" y="${top+h*0.55}" width="268" height="${h*0.45}" fill="${terr}" stroke="${ink}" stroke-width="2"/>${steps(66,top+h*0.55,268,h*0.45,false,3)}${txt(200,top+10,Gd.t,'','#f6f1e1')}`;
    else if(F.gables)out+=`<rect x="66" y="${top}" width="268" height="${h}" fill="#8a8378" stroke="${ink}" stroke-width="2"/>${[...Array(9)].map((_,i)=>`<path d="M${66+i*29.8} ${top+h} L${81+i*29.8} ${top+4} L${96+i*29.8} ${top+h}" fill="#6e5a44" stroke="${ink}" stroke-width="1.6"/>`).join('')}${txt(200,top+h-4,Gd.t,'','#f6f1e1')}`;
    else if(F.rainbow)out+=`<rect x="66" y="${top}" width="268" height="${h}" fill="${terr}" stroke="${ink}" stroke-width="2"/>${['#c8202f','#e8692a','#e8c22e','#3f8a45','#1f4fb0'].map((col,i)=>`<rect x="67" y="${top+1+i*(h-2)/5}" width="266" height="${(h-2)/5}" fill="${col}" opacity=".8"/>`).join('')}${txt(200,top+h/2+3,Gd.t,'','#fff')}`;
    else out+=`<rect x="66" y="${top}" width="268" height="${h}" fill="${terr}" stroke="${ink}" stroke-width="2"/>${steps(66,top,268,h,false)}${F.roofTop?`<rect x="66" y="${top}" width="268" height="${h}" fill="#5b5f63" stroke="${ink}" stroke-width="2"/>${[...Array(13)].map((_,i)=>`<line x1="${80+i*20}" y1="${top}" x2="${80+i*20}" y2="${top+h}" stroke="#7b8085" stroke-width="2"/>`).join('')}`:''}${txt(200,top+h/2+3,Gd.t,'',F.roofTop?'#f6f1e1':ink)}`;
    if(F.cockerel)out+=`<g transform="translate(200 ${top-2})"><circle cx="0" cy="6" r="5" fill="#f6f1e1" stroke="${ink}" stroke-width="1.6"/><path d="M-6 -2 Q-2 -12 4 -8 Q8 -14 10 -6 Q6 -4 4 0 Q0 2 -6 -2Z" fill="${ink}"/><path d="M4 -10 L6 -14 L8 -10" fill="#c8202f"/></g>`;
    if(F.clock==='t')out+=`<circle cx="200" cy="${top+2}" r="8" fill="#f6f1e1" stroke="${ink}" stroke-width="2"/><path d="M200 ${top+2} L200 ${top-3} M200 ${top+2} L204 ${top+2}" stroke="${ink}" stroke-width="1.6"/>`;}
  // ends
  const end=(side)=>{const w=endW(side);const x=side==='l'?62-w:338;const name=side==='l'?Gd.l:Gd.r;const roof=(kop[0]===side&&kopRoof)||(side==='r'&&C);
    let s=F.double?two(x,62,w,146):`<rect x="${x}" y="62" width="${w}" height="146" fill="${terr}" stroke="${ink}" stroke-width="2"/>${steps(x,62,w,146,true,kop[0]===side?9:7)}`;
    if(roof)s+=roofV(x-2,58,w+4,154);
    if(F.clock===side)s+=`<circle cx="${x+w/2}" cy="70" r="9" fill="#f6f1e1" stroke="${ink}" stroke-width="2"/><path d="M${x+w/2} 70 L${x+w/2} 64 M${x+w/2} 70 L${x+w/2+4} 70" stroke="${ink}" stroke-width="1.6"/>`;
    return s+txt(x+w/2,135,name+(side==='r'&&C&&kop[0]!=='r'?' (covered)':''),side==='l'?-90:90,roof?'#f6f1e1':ink);};
  out+=end('l')+end('r');
  if(F.riverL)out+=`<rect x="0" y="30" width="11" height="210" fill="#5a86b0"/><text x="7" y="135" font-size="7" fill="#e8f0ff" font-family="Georgia,serif" font-style="italic" text-anchor="middle" transform="rotate(-90 7 135)">${esc(F.riverL)}</text>`;
  if(F.cricketR)out+=`<ellipse cx="412" cy="135" rx="26" ry="70" fill="#9cc083" stroke="${ink}" stroke-width="1.5"/><rect x="392" y="126" width="6" height="18" fill="#d8c79a"/>`;
  if(F.tower)out+=`<path d="M358 2 L350 56 L366 56Z" fill="#8a3a2a" stroke="${ink}" stroke-width="1.6"/><path d="M352 44 L364 44 M354 32 L362 32 M355 22 L361 22" stroke="${ink}" stroke-width="1.4"/><rect x="348" y="54" width="20" height="6" fill="#8a3a2a" stroke="${ink}" stroke-width="1.4"/>`;
  if(F.houses){for(let i=0;i<13;i++)out+=`<path d="M${70+i*20} 12 L${70+i*20} 5 L${78+i*20} 1 L${86+i*20} 5 L${86+i*20} 12Z" fill="#9a5a3e" stroke="${ink}" stroke-width="1"/>`;for(let i=0;i<7;i++)out+=`<rect x="1" y="${66+i*20}" width="10" height="14" fill="#9a5a3e" stroke="${ink}" stroke-width="1"/><rect x="389" y="${66+i*20}" width="10" height="14" fill="#9a5a3e" stroke="${ink}" stroke-width="1"/>`;}
  if(F.railway){const x=F.railway==='l'?0:392;out+=`<rect x="${x}" y="40" width="8" height="200" fill="#6f6a60"/>${[...Array(20)].map((_,i)=>`<line x1="${x-1}" y1="${44+i*10}" x2="${x+9}" y2="${44+i*10}" stroke="#3a3632" stroke-width="2"/>`).join('')}`;}
  if(F.gas)out+=`<circle cx="44" cy="40" r="15" fill="#8d949a" stroke="${ink}" stroke-width="2"/>${[0,1,2].map(i=>`<circle cx="44" cy="40" r="${4+i*4}" fill="none" stroke="#6d7378" stroke-width="1.2"/>`).join('')}`;
  // pitch and track
  if(F.track)out+=`<rect x="64" y="60" width="272" height="150" rx="36" fill="#b5654a" stroke="${ink}" stroke-width="1.5"/><rect x="70" y="64" width="260" height="142" rx="32" fill="#9e5540"/>`;
  out+=stripes+`<g fill="none" stroke="#f6f1e1" stroke-width="1.6"><rect x="74" y="68" width="252" height="134"/><line x1="200" y1="68" x2="200" y2="202"/><circle cx="200" cy="135" r="18"/><rect x="74" y="104" width="34" height="62"/><rect x="292" y="104" width="34" height="62"/></g>`;
  // main stand
  if(S)out+=modern(72,210,256,44)+txt(200,266,'New '+Gd.b,'','#f6f1e1');
  else if(F.deco&&F.deco.includes('b'))out+=deco(96,210,208,40)+txt(200,266,Gd.b,'','#f6f1e1');
  else if(F.double)out+=two(96,210,208,40)+txt(200,266,Gd.b,'','#f6f1e1');
  else if(F.cant&&F.cant[0]==='b'&&G.year>=F.cant[1])out+=modern(72,210,256,44)+txt(200,266,Gd.b,'','#f6f1e1');
  else out+=wooden(116,212,168,36)+txt(200,266,Gd.b,'','#f6f1e1');
  if(F.castle)out+=`<rect x="18" y="218" width="36" height="30" fill="#d9c9a3" stroke="${ink}" stroke-width="2"/>${[18,44].map(x=>`<rect x="${x}" y="206" width="10" height="42" fill="#cdbb92" stroke="${ink}" stroke-width="2"/><path d="M${x} 206 l0 -4 l3 0 l0 4 l4 0 l0 -4 l3 0 l0 4" fill="none" stroke="${ink}" stroke-width="1.4"/>`).join('')}<rect x="32" y="234" width="8" height="14" fill="#5a3418"/>`;
  if(F.pavilion)out+=`<path d="M180 212 L200 196 L220 212Z" fill="#ece5d2" stroke="${ink}" stroke-width="2"/><circle cx="200" cy="206" r="4" fill="#f6f1e1" stroke="${ink}" stroke-width="1.4"/>`;
  if(F.cottage)out+=`<rect x="16" y="214" width="42" height="30" fill="#f3efe6" stroke="${ink}" stroke-width="2"/><path d="M12 214 L37 196 L62 214Z" fill="#c8202f" stroke="${ink}" stroke-width="2"/><rect x="31" y="228" width="10" height="16" fill="#5a3418"/>${[20,46].map(x=>`<rect x="${x}" y="220" width="8" height="8" fill="#9ec0d8" stroke="${ink}" stroke-width="1"/>`).join('')}`;
  out+=pylon(20,20)+pylon(380,20)+pylon(20,250)+pylon(380,250);
  if(Sh&&!F.cottage&&!F.castle)out+=`<rect x="12" y="212" width="52" height="22" fill="#e6dcc2" stroke="${ink}" stroke-width="2"/><text x="38" y="226" font-size="7" text-anchor="middle" fill="${ink}" font-family="Arial,sans-serif" font-weight="700">SHOP</text>`;
  if(Lo)out+=`<rect x="336" y="212" width="52" height="22" fill="#e6dcc2" stroke="${ink}" stroke-width="2"/><text x="362" y="226" font-size="6" text-anchor="middle" fill="${ink}" font-family="Arial,sans-serif" font-weight="700">LOTTERY</text>`;
  return `<svg viewBox="0 0 400 270" class="stadium" role="img" aria-label="Aerial view of ${esc(c.g)}">${out}</svg>`;}
const groundNotes={WOL:'The great South Bank terrace holds some thirty thousand, and the gabled Molineux Street Stand looks down on it. Wolves made their name here under the floodlights against Honvéd and Spartak.',BRN:'The Longside, roofed since 1954, runs the length of the pitch. Burnley Cricket Club sit just beyond the Cricket Field End.',LEI:'Filbert Street is hemmed in by terraced streets on every side.',BLB:'The River Darwen runs behind the Riverside.',WBA:'The Rainbow Stand is named for its brightly painted sections.',BIR:'A vast Spion Kop along one side, and the railway behind the Railway End.',BLP:'You can see the Tower from the Spion Kop.',NFO:'The River Trent flows right behind the Trent End.',CAR:'The Bob Bank is named for the shilling it once cost to stand there.',NEW:'The roofed Leazes End faces the open Gallowgate terrace.',PNE:'The ornate old Pavilion Stand has watched over Deepdale since the Invincibles.',TOT:'The famous cockerel on its ball stands on the roof of the East Stand.',WHU:'The Boleyn Castle stands next to the ground, and the Chicken Run is a rickety wooden terrace along the east side.',MCI:'The Kippax is the biggest terrace in Manchester, roofed since 1957.',SUN:'The Roker End is a huge open bank, and the Clock Stand keeps time along the side.',LEE:'The Gelderd End, the home of the Kop choir, was roofed in 1968.',SOU:'The Dell is the smallest ground in the First Division, squeezed in among the houses.',DER:'The Baseball Ground is boxed in by terraced streets and foundries.',FUL:'The cottage in the corner and the Thames behind the terrace.',SHU:'Three sides of football and one of cricket: Yorkshire play here in the summer.',NTN:'Shared with Northamptonshire County Cricket Club, so one side stays open.',CHE:'The pitch sits inside a running track, which keeps the crowd a long way back.',BRR:'Greyhounds race around the pitch, and the gasworks loom over the ground.',ARS:'The art deco East and West Stands, and the famous clock.',MUN:'The new cantilever stand on United Road was built for the 1966 World Cup.',SHW:'The North Stand of 1961 was one of the first cantilever stands in Britain.',LIV:'The Spion Kop, roofed since 1928, holds getting on for thirty thousand.',EVE:'Goodison was the first English ground with double-decker stands on all four sides.',BOL:'The railway runs right along the top of the Embankment.',AVL:'The Holte End was roofed in 1962. The Trinity Road Stand is the grandest in the land.'};

function cGround(){const c=club(U());const R=REC(U());const homes=G.fx.filter(x=>x.p&&x.h===U()&&x.comp==='L'&&x.att);const hi=homes.reduce((m,x)=>x.att>(m?m.att:0)?x:m,null);
  const avg=homes.length?Math.round(homes.reduce((t,x)=>t+x.att,0)/homes.length):0;const built=Object.keys(UPG).filter(k=>upgDone(k)).map(k=>UPG[k].n);
  return `<section class="panel"><div class="ph"><div><h2 class="h1">${esc(c.g)}</h2><p class="muted">Home of ${esc(c.n)}. The picture changes as you build.</p></div></div>
   <div class="stadwrap">${stadiumSVG()}</div>${groundNotes[U()]?`<p class="groundnote">${esc(groundNotes[U()])}</p>`:''}
   <dl class="dl"><div><dt>Main stand</dt><dd>${esc(groundOf(U()).b)}</dd></div><div><dt>Opposite</dt><dd>${esc(groundOf(U()).t)}</dd></div><div><dt>The ends</dt><dd>${esc(groundOf(U()).l)} and ${esc(groundOf(U()).r)}</dd></div><div><dt>Capacity</dt><dd>${capacity(U()).toLocaleString('en-GB')}</dd></div><div><dt>Average gate this season</dt><dd>${avg?avg.toLocaleString('en-GB'):'-'}</dd></div><div><dt>Biggest gate this season</dt><dd>${hi?`${hi.att.toLocaleString('en-GB')} v ${esc(club(hi.a).s)}`:'-'}</dd></div><div><dt>Record gate in your time</dt><dd>${R.hiGate?`${R.hiGate.att.toLocaleString('en-GB')} v ${esc(cn(R.hiGate.opp))}, ${fmtDate(R.hiGate.date,true)} ${R.hiGate.date.slice(0,4)}`:'-'}</dd></div><div><dt>Terrace admission</dt><dd>${lsd(priceFor(U()))}</dd></div><div><dt>Improvements</dt><dd>${built.length?built.map(esc).join(', '):'None yet'}</dd></div></dl>
   <p class="muted sm">Build on the Finances tab (ground and commercial projects) and the Training ground section here.</p></section>`;}

/* records */
function recLine(r,win){if(!r)return '-';return `${r.score} ${r.home?'v':'at'} ${esc(cn(r.opp))} · ${compShort({comp:r.comp})} · ${fmtDate(r.date,true)} ${r.date.slice(0,4)}`;}
function topOf(map){let best=null,bv=0;for(const [pid,v] of Object.entries(map)){if(v>bv){bv=v;best=pid;}}return best?{p:G.players[best],v:bv}:null;}
function cRecords(){const R=REC(U());const ts=topOf(R.gl),ma=topOf(R.ap);const nm2=o=>o&&o.p?esc(o.p.n):'?';
  const lead=(map,n)=>Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([pid,v])=>({p:G.players[pid],v})).filter(x=>x.p);
  return `<div class="two"><section class="panel"><h2 class="h1">Club records</h2><p class="muted sm">Kept since you took charge in ${seasonLbl(R.since)}.</p>
   <dl class="dl wide recs"><div><dt>Biggest win</dt><dd>${recLine(R.bigWin)}</dd></div><div><dt>Heaviest defeat</dt><dd>${recLine(R.bigLoss)}</dd></div><div><dt>Record home gate</dt><dd>${R.hiGate?`${R.hiGate.att.toLocaleString('en-GB')} v ${esc(cn(R.hiGate.opp))}`:'-'}</dd></div><div><dt>Longest unbeaten run</dt><dd>${R.unb.best} match${R.unb.best===1?'':'es'} (current run ${R.unb.cur})</dd></div><div><dt>Record signing</dt><dd>${R.recBuy?`${esc(R.recBuy.n)} from ${esc(cn(R.recBuy.club)||'abroad')}, ${money(R.recBuy.fee)} (${R.recBuy.y})`:'-'}</dd></div><div><dt>Record sale</dt><dd>${R.recSale?`${esc(R.recSale.n)} to ${esc(cn(R.recSale.club))}, ${money(R.recSale.fee)} (${R.recSale.y})`:'-'}</dd></div><div><dt>Top scorer</dt><dd>${ts?`${nm2(ts)}, ${plu(ts.v,'goal')}`:'-'}</dd></div><div><dt>Most appearances</dt><dd>${ma?`${nm2(ma)}, ${ma.v}`:'-'}</dd></div></dl></section>
  <section class="panel"><h3 class="h2 first">Leading goalscorers</h3>${lead(R.gl,8).length?`<ol class="scorers">${lead(R.gl,8).map(x=>`<li><span>${esc(x.p.n)}</span><b>${x.v}</b></li>`).join('')}</ol>`:'<p class="muted">No goals yet.</p>'}
   <h3 class="h2">Most appearances</h3>${lead(R.ap,8).length?`<ol class="scorers">${lead(R.ap,8).map(x=>`<li><span>${esc(x.p.n)}</span><b>${x.v}</b></li>`).join('')}</ol>`:'<p class="muted">No matches yet.</p>'}</section></div>`;}

/* hall of fame */
function cHof(){const R=REC(U());
  return `<section class="panel"><div class="ph"><div><h2 class="h1">Hall of Fame</h2><p class="muted">When a player who made 40 or more appearances for ${esc(club(U()).s)} under you retires, you decide whether he goes in.</p></div></div>
   ${R.hof.length?`<div class="hofgrid">${R.hof.map(h=>`<figure class="plaque"><div class="pl-frame"><span class="pl-pos">${POSN[h.pos]||''}</span><strong>${esc(h.n)}</strong><span class="pl-yrs">${seasonLbl(h.from).slice(0,4)} to ${seasonLbl(h.to).slice(0,4)}</span><span class="pl-stats">${plu(h.apps,'appearance')} · ${plu(h.g,'goal')}</span>${h.tro?`<span class="pl-tro">${h.tro} trophy${h.tro===1?'':'ies'} won</span>`:''}</div><figcaption>Inducted ${h.ind}</figcaption></figure>`).join('')}</div>`
   :`<div class="hofempty"><p>The Hall of Fame is empty for now. Loyal servants will be nominated here when they hang up their boots.</p></div>`}</section>`;}

/* rivals */
function cRivals(){const R=REC(U());const riv=[...new Set(DERBY.filter(([a,b])=>a===U()||b===U()).map(([a,b])=>a===U()?b:a))];
  const all=Object.entries(R.h2h).filter(([,h])=>h.w+h.d+h.l>=2);const pts=h=>(h.w*2+h.d)/(h.w+h.d+h.l);
  const bogey=all.slice().sort((a,b)=>pts(a[1])-pts(b[1]))[0],fav=all.slice().sort((a,b)=>pts(b[1])-pts(a[1]))[0];
  const card=(id,h,tag)=>`<div class="rivcard"><div class="rv-h">${crest(U(),'lg')}<span class="rv-v">v</span>${crest(id,'lg')}</div><strong>${esc(cn(id))}</strong><small class="muted">${tag||DIVN[club(id).div]}</small>
    ${h?`<div class="rv-rec"><span><b>${h.w}</b>W</span><span><b>${h.d}</b>D</span><span><b>${h.l}</b>L</span></div><p class="sm">Goals ${h.f}-${h.a}. Last time: ${h.last.score} ${h.last.home?'at home':'away'}, ${fmtDate(h.last.date,true)} ${h.last.date.slice(0,4)}.</p>`:'<p class="sm muted">Not met yet under you.</p>'}</div>`;
  return `<section class="panel"><div class="ph"><div><h2 class="h1">Rivals</h2><p class="muted">Local derbies count double with the supporters, and the press will want a word before each one.</p></div></div>
   <div class="rivgrid">${riv.length?riv.map(id=>card(id,R.h2h[id],'Derby rivals')).join(''):'<p class="muted">No traditional derby rival in the League. The supporters make do with hating everyone equally.</p>'}</div>
   ${bogey||fav?`<h3 class="h2">Head to head</h3><div class="rivgrid">${bogey?card(bogey[0],bogey[1],'Bogey side'):''}${fav&&(!bogey||fav[0]!==bogey[0])?card(fav[0],fav[1],'Favourite opponents'):''}</div>`:''}</section>`;}

/* boardroom */
function cBoard(){const ch=chairOf(U());const T=CHAIRT[ch.t];const conf=Math.round(G.user.conf);const look=chairLook(U());
  return `<div class="two"><section class="panel boardcard"><div class="chairart">${portrait(look)}</div><div><p class="eyebrow">The chairman</p><h2 class="h1">${esc(ch.n)}</h2><p class="muted">${esc(ch.job)}${ch.real?' · the real chairman of the period':''}${ch.pearsey?' · Aston Villa, and only Aston Villa':''}</p>
    <div class="petdemand"><small>His creed</small><strong>${esc(T[0])}</strong><span>"${esc(T[1])}"</span></div>
    <blockquote class="chairquote">"${esc(chairSay(G.user.conf>=70?'good':G.user.conf<35?'bad':'neutral'))}"</blockquote><h3 class="h2">How he judges you</h3><ul class="rules">${T[2].map(t=>`<li>${esc(t)}</li>`).join('')}<li>Like every chairman, he expects a finish of ${ord(expFor(U()))} or better.</li></ul>
    <div class="askbox"><h3 class="h2">Ask for more money</h3><p class="sm">Knock on his door and ask for a bigger transfer budget. He is more generous when the board has confidence in you and the bank balance is healthy, and he will not discuss it more than once a month. Asking when results are poor costs you a little of his confidence.</p>
     <p class="sm muted">Transfer budget now ${money(G.user.budget.transfer)} · wage budget ${money(G.user.budget.wage)} a week · board confidence ${Math.round(G.user.conf)}/100${daysBetween(G.user.lastAsk||'1900-01-01',G.date)<30?` · you last asked on ${fmtDate(G.user.lastAsk,true)}`:''}</p>
     ${UI.finNote&&UI.clubSec==='board'?`<p class="stamp">${esc(UI.finNote)}</p>`:''}<button class="btn go" data-a="askboard">Ask for more transfer money</button></div></div></section>
   <section class="panel"><h3 class="h2 first">Board confidence</h3><div class="meter" role="meter" aria-valuenow="${conf}" aria-valuemin="0" aria-valuemax="100" aria-label="Board confidence"><i style="width:${conf}%"></i></div><p><strong>${confText(conf)}</strong> (${conf}/100)</p>
    <h3 class="h2">This season's objectives</h3>${objHTML()||'<p class="muted">None set.</p>'}<p class="muted sm">Each one met is worth a little credit with the board at the end of the season. Each one missed costs a little, but not much.</p>
    <h3 class="h2">The directors</h3><ul class="dirs"><li><strong>${esc(ch.n)}</strong><span>Chairman · ${esc(ch.job)}</span></li>${ch.dirs.map(d=>`<li><strong>${esc(d.n)}</strong><span>Director · ${esc(d.job)}</span></li>`).join('')}<li><strong>${esc(G.user.name)}</strong><span>Manager (not on the board, and never allowed to forget it)</span></li></ul></section></div>`;}

/* supporters */
function cFans(){const f=Math.round(fans());const L=lettersFor();const na=nextAway();const sec=secretaryOf();const fz=fanzine();
  return `<div class="stack"><section class="panel"><h2 class="h1">The supporters' club</h2><dl class="dl"><div><dt>Secretary</dt><dd>${esc(sec.n)}, since ${sec.since}</dd></div><div><dt>Members</dt><dd>${membership().toLocaleString('en-GB')}</dd></div>${na?`<div><dt>Next away trip</dt><dd>${esc(cn(na.h))}, ${fmtDate(na.date,true)}: ${plu(coachesFor(na),'coach','coaches')} booked${na.subs?' · <strong>subsidised by the club</strong>':''}</dd></div>`:''}${(G.user.fever||0)>=1?`<div><dt>Cup fever</dt><dd>${feverWord()}. Rosettes and scarves are flying out of the club shop.</dd></div>`:''}</dl>
   ${na&&!na.subs?`<button class="btn sm" data-a="subsid">Pay for the coaches to ${esc(cn(na.h))} (${money(coachesFor(na)*14*infl())})</button> <small class="muted">The supporters love it, and a big away following is worth a goal now and then.</small>`:''}
   ${fz?`<div class="fanzine"><p class="fz-t">${esc(fz.t)}</p><p class="fz-s">The supporters' own magazine · 6d · on sale outside the ground</p><ul>${fz.heads.map(h=>`<li>${esc(h)}</li>`).join('')}</ul></div>`:''}</section>
  <div class="two"><section class="panel"><h2 class="h1">The supporters</h2><div class="meter" role="meter" aria-valuenow="${f}" aria-valuemin="0" aria-valuemax="100" aria-label="Supporters' mood"><i style="width:${f}%"></i></div>
   <p><strong>${moodWord(f)}</strong> (${f}/100)</p>
   <dl class="dl"><div><dt>Supporters' club members</dt><dd>${membership().toLocaleString('en-GB')}</dd></div><div><dt>Effect on crowds</dt><dd>${arrow(f-50,`${Math.abs(Math.round((f-50)*0.4))}%`)}</dd></div><div><dt>Recent form</dt><dd>${streakTxt()}</dd></div><div><dt>Expectations</dt><dd>${fanNature()>=1.35?'Sky high. Anything less than winning is failure.':fanNature()>=1.05?'High. They expect to be near the top.':'Modest. They are grateful for what they get.'}</dd></div></dl>
   <h3 class="h2">What moves them</h3><ul class="rules"><li>One bad result barely registers. A run of them snowballs: each defeat in a row hurts more than the last, and ten on the trot will have them in uproar. Winning runs build the same way.</li><li>Supporters of big, successful clubs expect more. They take defeats harder, shrug at wins and grumble at draws. At a small club, a draw is often welcome.</li><li>Beating a better side delights them. Losing to a worse one hurts twice.</li><li>Derbies count double, and Cup ties from the Third Round count one and a half times.</li><li>Every week they compare the league table with what they expected.</li><li>Four goals or more sends them home singing.</li><li>Cheap tickets win them over week by week. Dear ones grate.</li><li>Signing a star delights them. Selling one of your three best players infuriates them.</li><li>A happy crowd means gates up to 20% bigger, and it nudges the board your way. A crowd in uproar means gates down by as much, and the board start to listen to them.</li></ul></section>
  <section class="panel letters"><p class="eyebrow">From the ${esc(club(U()).s)} programme</p><h3 class="lt-head">Terrace Talk</h3><p class="lt-sub">Letters from supporters. The editor reserves the right to shorten them.</p>
   ${L.map((l,i)=>{if(l.v==null)l.v=(i+hashStr(l.n))%FANLOOKS.length;return `<blockquote class="letter"><div class="lt-por">${supporterArt(l.v,i)}</div><div><p>${esc(l.t)}</p><footer>${esc(l.n)}, ${esc(l.a)}</footer></div></blockquote>`;}).join('')}</section></div></div>`;}

/* reserves & youth */
function pathVerdict(p){const slots=FORMS[G.user.form].s;const xi=G.user.xi.map(id=>G.players[id]).filter(Boolean);const same=xi.filter(x=>x.pos===p.pos);const bar=same.length?Math.min(...same.map(x=>x.ca)):Math.min(...xi.map(x=>x.ca));
  if(p.ca>=bar-2)return ['now','Ready now'];if(p.pa-p.ca>=8&&p.ca>=bar-10)return ['soon','A season away'];return ['later','One for the future'];}
function cRes(){const u=G.user;const rs=u.rsv||[],ys=u.yth||[];const acad=sq(U()).filter(p=>p.acad).sort((a,b)=>b.pa-a.pa||b.ca-a.ca);
  const tbl=(list,lbl)=>list.length?`<div class="tw"><table class="tbl"><thead><tr><th class="l">Date</th><th class="l">Opponents</th><th>Result</th><th class="l">Scorers</th></tr></thead><tbody>${list.map(r=>{const w=r.gf>r.ga?'W':r.gf<r.ga?'L':'D';return `<tr><td class="l">${fmtDate(r.d,true)}</td><td class="l">${crest(r.o,'sm')} ${esc(club(r.o).s)} ${lbl} (${r.h?'H':'A'})</td><td><span class="res r${w}">${w} ${r.gf}-${r.ga}</span></td><td class="l sm">${esc(r.sc.join(', '))}</td></tr>`;}).join('')}</tbody></table></div>`:'<p class="muted">No matches yet this season.</p>';
  return `<div class="stack"><section class="panel"><h2 class="h1">Reserves and youth</h2><p class="muted">The reserves play in ${reserveLeague()} on the same day as the first team, using everyone who didn't make the first-team sheet. The youth team plays every other week once you have five or more lads of 18 and under. Young players who get 15 or more games for the second string or the youth team improve a little faster.</p></section>
   <div class="two"><section class="panel"><h3 class="h2 first">Reserves</h3>${tbl(rs,'Res.')}</section><section class="panel"><h3 class="h2 first">Youth team</h3>${tbl(ys,'Youth')}</section></div>
   <section class="panel"><h3 class="h2 first">The academy</h3><p>${acSize()?`${plu(acSize(),'lad','lads')} in the academy.`:'Nobody in the academy at the moment.'} The academy has its own page now, on the Squad tab: the lads, their mentors, the youth coach\'s verdicts, professional forms, the FA Youth Cup and the old boys.</p><button class="btn go" data-a="goacad">Go to the academy</button></section></div>`;}

/* kit */
const KITPAT={NEW:'stripes',SUN:'stripes',STK:'stripes',SHU:'stripes',SHW:'stripes',BRE:'stripes',SOU:'stripes',GRI:'stripes',LIN:'stripes',EXE:'stripes',NCO:'stripes',BRA:'stripes',HUD:'stripes',WBA:'stripes',BLB:'halves',BRR:'quarters',QPR:'hoops',ARS:'sleeves',AVL:'sleeves',BRN:'sleeves',WHU:'sleeves',SCU:'sleeves'};
const AWAYK=[['White','#ffffff','#1c1b19'],['Gold','#f2c14e','#1c1b19'],['Sky blue','#6cabdd','#ffffff'],['Red','#c8102e','#ffffff'],['Royal blue','#1d4fb0','#ffffff'],['Black','#1c1b19','#f2c14e'],['Tangerine','#f68712','#1c1b19']];
const hexRGB=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const hexDist=(a,b)=>{const x=hexRGB(a),y=hexRGB(b);return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2]);};
const lightOf=h=>{const [r,g,b]=hexRGB(h);return (0.299*r+0.587*g+0.114*b)/255;};
function kitOf(cid){const c=club(cid);if(!c.kit){let away=AWAYK.findIndex(k=>hexDist(k[1],c.c1)>160&&hexDist(k[1],c.c2)>60);if(away<0)away=0;c.kit={collar:0,shorts:0,socks:0,away};}return c.kit;}
function kitColours(cid,away){const c=club(cid);const k=kitOf(cid);return away?[AWAYK[k.away][1],AWAYK[k.away][2]]:[c.c1,c.c2];}
function kitSVG(cid,away){const c=club(cid);const k=kitOf(cid);const pat=away?'plain':(KITPAT[cid]||'plain');const [c1,c2]=kitColours(cid,away);const ink='#1c1b19';
  const shortsC=[lightOf(c1)>0.8?(lightOf(c2)<0.5?c2:ink):'#ffffff','#ffffff',ink,'#1f2a52'][k.shorts];const sockC=k.socks===1?'#ffffff':c1;const trim=k.socks===1?c1:c2;
  const id=`k${cid}${away?'a':'h'}`;const body='M58 30 L34 38 L10 116 L28 122 L44 76 L44 166 L116 166 L116 76 L132 122 L150 116 L126 38 L102 30 Q80 46 58 30Z';
  let fillL=`<rect width="170" height="180" fill="${c1}"/>`;
  if(pat==='stripes')fillL+=[...Array(10)].map((_,i)=>i%2?'':`<rect x="${10+i*15}" y="0" width="15" height="180" fill="${c2}"/>`).join('');
  if(pat==='hoops')fillL+=[...Array(9)].map((_,i)=>i%2?'':`<rect x="0" y="${30+i*16}" width="170" height="16" fill="${c2}"/>`).join('');
  if(pat==='halves')fillL+=`<rect x="80" y="0" width="90" height="180" fill="${c2}"/>`;
  if(pat==='quarters')fillL+=`<rect x="80" y="0" width="90" height="98" fill="${c2}"/><rect x="0" y="98" width="80" height="82" fill="${c2}"/>`;
  if(pat==='sleeves')fillL+=`<path d="M44 38 L34 38 L10 116 L28 122 L44 76Z M116 38 L126 38 L150 116 L132 122 L116 76Z" fill="${c2}"/>`;
  const collar=k.collar===0?`<path d="M58 30 Q80 46 102 30" fill="none" stroke="${c2}" stroke-width="7"/>`:k.collar===1?`<path d="M60 31 L80 58 L100 31" fill="none" stroke="${c2}" stroke-width="7" stroke-linejoin="round"/>`:`<path d="M58 30 L66 52 L80 40Z M102 30 L94 52 L80 40Z" fill="${c2}" stroke="${ink}" stroke-width="2"/><line x1="80" y1="40" x2="80" y2="70" stroke="${ink}" stroke-width="2"/><circle cx="80" cy="52" r="2" fill="${ink}"/><circle cx="80" cy="63" r="2" fill="${ink}"/>`;
  return `<svg viewBox="0 0 170 262" class="kitsvg" role="img" aria-label="${away?'Away':'Home'} kit"><defs><clipPath id="${id}c"><path d="${body}"/></clipPath></defs>
   <path d="M80 2 Q90 2 90 11 Q90 18 80 20 L80 27" fill="none" stroke="#8d949a" stroke-width="3" stroke-linecap="round"/><path d="M36 38 L80 24 L124 38" fill="none" stroke="#6b4a2a" stroke-width="6" stroke-linecap="round"/>
   <g clip-path="url(#${id}c)">${fillL}</g><path d="M10 116 L28 122" stroke="${c2}" stroke-width="7"/><path d="M150 116 L132 122" stroke="${c2}" stroke-width="7"/>
   <path d="${body}" fill="none" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>${collar}
   <path d="M44 176 L108 176 L112 226 L84 226 L76 200 L68 226 L40 226Z" fill="${shortsC}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
   ${[118,142].map(x=>`<path d="M${x} 178 L${x+14} 178 L${x+14} 240 Q${x+14} 252 ${x+2} 252 L${x-6} 252 Q${x-8} 244 ${x} 240Z" fill="${sockC}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/><rect x="${x}" y="178" width="14" height="10" fill="${trim}" stroke="${ink}" stroke-width="2"/>${k.socks===2?`<rect x="${x}" y="200" width="14" height="6" fill="${c2}"/><rect x="${x}" y="214" width="14" height="6" fill="${c2}"/>`:''}`).join('')}
  </svg>`;}
function cKit(){const k=kitOf(U());const seg=(f,opts)=>`<div class="seg" role="group">${opts.map((l,i)=>`<button class="${k[f]===i?'on':''}" data-a="kit" data-f="${f}" data-v="${i}">${l}</button>`).join('')}</div>`;const [c1]=kitColours(U(),false);
  return `<div class="two"><section class="panel"><h2 class="h1">The kit</h2><p class="muted">Hanging in the home dressing room at ${esc(club(U()).g)}.</p>
   <div class="kitpeg"><figure>${kitSVG(U(),false)}<figcaption>Home</figcaption></figure><figure>${kitSVG(U(),true)}<figcaption>Away</figcaption></figure></div></section>
   <section class="panel"><h3 class="h2 first">Kit details</h3><p class="muted sm">The club colours are the club colours. The supporters would riot if you changed them. You can choose the details, and the away strip.</p>
    <div class="tacrow"><span class="lbl">Neck</span>${seg('collar',['Crew neck','V-neck','Button collar'])}</div>
    <div class="tacrow"><span class="lbl">Shorts</span>${seg('shorts',['Traditional','White','Black','Navy'])}</div>
    <div class="tacrow"><span class="lbl">Socks</span>${seg('socks',['Club colours','White','Hooped'])}</div>
    <div class="tacrow"><span class="lbl">Away strip</span><div class="swatches">${AWAYK.map((a,i)=>{const clash=hexDist(a[1],c1)<110;return `<button class="swatch ${k.away===i?'on':''}" data-a="kit" data-f="away" data-v="${i}" ${clash?'disabled title="Too close to the home colours"':''}><i style="background:${a[1]};border-color:${a[2]}"></i>${a[0]}</button>`;}).join('')}</div></div>
    <p class="muted sm">Shirts carry no badge. In the early Sixties most League clubs wore plain shirts and only stitched a crest on for a Cup Final. On the live pitch, the away side switches to its change strip when the colours clash.</p></section></div>`;}

/* training ground */
function spendHTML(){const u=G.user;const pre=preSeason();const lvl=u.winb||0;
  return `<div class="spend"><div><h4>Pre-season tour</h4>${pre&&u.tourY!==G.year?`<p class="sm">Take the squad abroad before the season. Everyone comes back fit and together, and the first few matches go a little better.</p><div class="row gap wrap">${TOURS.map(([w,c,g],i)=>`<button class="btn sm" data-a="tour" data-i="${i}">${esc(w)} <small>(${g>=c?'clears about '+money((g-c)*infl()):'costs about '+money((c-g)*infl())})</small></button>`).join('')}</div>`:`<p class="sm muted">${u.tourY===G.year?'Done for this summer.':'Only in pre-season.'}</p>`}</div>
   <div><h4>Win bonus</h4>${G.wageCap?'<p class="sm muted">Under the maximum wage, the League fixes the bonuses.</p>':`<div class="seg">${WINB.map((b,i)=>`<button class="${lvl===i?'on':''}" data-a="winb" data-k="${i}">${b?'£'+Math.round(b*infl())+' a man':'None'}</button>`).join('')}</div><p class="sm muted">Paid to the eleven for every win. It lifts morale and the players try a little harder.</p>`}</div>
   <div><h4>Loyalty bonus</h4>${u.loyY!==G.year?`<button class="btn sm" data-a="loyalty">Pay it to everyone with three seasons at the club</button>`:'<p class="sm muted">Paid this season.</p>'}</div>
   <div><h4>Charity match</h4>${u.charY!==G.year?`<button class="btn sm" data-a="charity">Play one on a Sunday</button><p class="sm muted">No money in it, but the town, the board and the papers love it.</p>`:'<p class="sm muted">Played this season.</p>'}</div></div>${UI.spendNote?`<p class="stamp">${esc(UI.spendNote)}</p>`:''}`;}
function projCard(k,u){const st=UPGS()[k];const cost=Math.round(u.cost*infl());let status='';
  if(st){const start=st.start||addDays(st.done,-u.wk*7);const pct=st.done<=G.date?100:clamp(Math.round(daysBetween(start,G.date)/Math.max(1,daysBetween(start,st.done))*100),0,99);
    status=pct>=100?`<p class="built">✔ Open for business</p>`:`<div class="buildbar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Building progress"><i style="width:${pct}%"></i></div><p class="sm muted">Builders in: ${pct}% done. Ready ${fmtDate(st.done,true)}.</p>`;}
  return `<div class="staffcard proj ${st?(st.done<=G.date?'done':'wip'):''}"><div class="bp-mini" aria-hidden="true">${bpSVG(k)}</div><strong class="sc-n">${esc(u.n)}</strong><p class="sm">${esc(u.desc)}</p>${st?status:`<p class="sm muted">Cost ${money(cost)} · takes ${plu(u.wk,'week')}${u.inc>0?` · about ${money(u.inc*infl())} a week`:u.inc<0?` · then ${money(-u.inc*infl())} a week to run`:''}</p><button class="btn sm" data-a="build" data-k="${k}">Commission it</button>`}</div>`;}
function cTrain(){return `<section class="panel"><div class="ph"><div><h2 class="h1">The training ground</h2><p class="muted">Most clubs train on a car park and a borrowed school field. Better facilities make better players.</p></div></div>
  <div class="staffgrid">${Object.entries(UPG).filter(([k,u])=>u.cat==='train'&&upgOpen(k,u)).map(([k,u])=>projCard(k,u)).join('')}</div></section>`;}

/* contract */
function cContract(){const k=G.user.contract;const conf=Math.round(G.user.conf);
  return `<div class="two"><section class="panel"><h2 class="h1">Your contract</h2><p class="muted">With ${esc(chairOf(U()).n)} and the board of ${esc(club(U()).n)}.</p>
   <dl class="dl"><div><dt>Salary</dt><dd>£${k.wage} a week (${money(k.wage*52)} a year)</dd></div><div><dt>Runs until</dt><dd>End of ${seasonLbl(k.until)}</dd></div><div><dt>Signed</dt><dd>${fmtDate(k.since,true)} ${k.since.slice(0,4)}</dd></div><div><dt>Career earnings</dt><dd>${money(G.user.earn||0)}</dd></div><div><dt>Your reputation</dt><dd>${mrepWord(mrepOf())} (${Math.round(mrepOf())}/100)</dd></div></dl><p class="muted sm">Your reputation grows with trophies, promotions and beating expectations, and shrinks with relegations. Bigger clubs come calling when it outgrows your own.</p>
   <p class="muted sm">When a contract runs out, the board offer a new one if they are happy with you (confidence 40 or more), with a rise if they are delighted. If not, you leave. If you are sacked, you are paid half of what is left on your contract.</p></section>
  <section class="panel"><h3 class="h2 first">Knock on the chairman's door</h3><p>Board confidence: <strong>${confText(conf)}</strong> (${conf}/100). The chairman will only discuss terms if the board are content, and not more than once every two months.</p>
   <div class="row gap wrap"><button class="btn" data-a="contract" data-k="money">Ask for more money</button><button class="btn" data-a="contract" data-k="years">Ask for a longer contract</button></div></section></div>`;}

/* ---- history ---- */
function rn(x){return x?(G.clubs[x]?G.clubs[x].n:x):'-';}
function vHistory(){const yrs=Object.keys(DATA.real).map(Number);const extra=G.record.filter(r=>!DATA.real[r.y]).map(r=>r.y);
  return `<section class="panel"><div class="ph"><h2 class="h1">The decade: real and yours</h2><p class="muted">What actually happened, set against what is happening in your world.</p></div>
  <div class="tw"><table class="tbl hist"><thead><tr><th class="l">Season</th><th class="l">Real champions</th><th class="l">Your world</th><th class="l">Real FA Cup</th><th class="l">Your world</th><th class="l">Real League Cup</th></tr></thead><tbody>
  ${yrs.concat(extra).map(y=>{const r=DATA.real[y];const g=G.record.find(x=>x.y===y);return `<tr class="${y===G.year?'today':''}"><td class="l">${seasonLbl(y)}</td><td class="l">${r?esc(rn(r.d1)):'-'}</td><td class="l">${g?`<strong>${esc(cn(g.champs[0]))}</strong>`:'<span class="muted">to be decided</span>'}</td><td class="l">${r?esc(rn(r.fa)):'-'}</td><td class="l">${g?`<strong>${esc(cn(g.cup))}</strong>`:'<span class="muted">to be decided</span>'}</td><td class="l">${r?esc(r.lc):'-'}</td></tr>${r?`<tr class="note"><td></td><td class="l" colspan="5"><small>${esc(r.note)}</small></td></tr>`:''}`;}).join('')}
  </tbody></table></div>
  ${G.record.length?`<h3 class="h2">Champions of every division in your world</h3><div class="tw"><table class="tbl"><thead><tr><th class="l">Season</th>${DIVN.map(d=>`<th class="l">${d}</th>`).join('')}<th class="l">Top scorer, Div. One</th></tr></thead><tbody>${G.record.map(g=>`<tr><td class="l">${seasonLbl(g.y)}</td>${g.champs.map(id=>`<td class="l">${esc(cn(id))}</td>`).join('')}<td class="l">${g.scor[0]?`${esc(g.scor[0].n)} (${g.scor[0].g})`:'-'}</td></tr>`).join('')}</tbody></table></div>`:''}${managerHall()}${dynHTML()}</section>`;}

/* ---- how to play ---- */
function vHow(){const sec=(id,t,body)=>`<section class="howsec" id="${id}"><h3 class="h2 first">${t}</h3>${body}</section>`;
  const toc=[['h-start','Getting started'],['h-controls','Everything you can change'],['h-cal','The calendar'],['h-team','Picking the team'],['h-form','Formations'],['h-tac','Team instructions'],['h-depth','Roles, set pieces and the conditions'],['h-staff','The backroom'],['h-match','Match day'],['h-press','The press'],['h-talk','Players at your door'],['h-trans','Transfers'],['h-money','Finances and making money'],['h-club','The club'],['h-board','The board and your job'],['h-hist','History mode'],['h-season','The season around you'],['h-save','Saving']];
  return `<div class="how"><nav class="panel howtoc" aria-label="Contents"><p class="eyebrow">The manager's handbook</p><ol>${toc.map(([id,t])=>`<li><a href="#${id}">${t}</a></li>`).join('')}</ol></nav>
  <article class="panel howbody">
  <h2 class="h1 big">How to play</h2><p class="lede-sm">You are the manager. You pick the team, set the tactics, hire the coaches, buy and sell players, keep the bank manager happy and talk to the press. The directors judge you on results. Everything below is how the game really works under the bonnet.</p>
  ${sec('h-start','Getting started',`<p>Pick a club on the setup screen. Big clubs have money, good players and high expectations. Small clubs have none of the three, which makes success sweeter. You begin in August 1960. The game follows the real calendar to the end of the 1969-70 season, and you can carry on after that.</p><p><strong>Before your first match</strong> you have to tell the side how to play. A new save starts with nothing chosen: no formation, no approach, no instructions, no set-piece takers and no training. A task in the intray lists what is needed, the Tactics tab marks anything still to choose in red, and no match can start until it is all done.</p><p>The <strong>Intray</strong> is your desk. Board messages, injury news, transfer bids and the newspapers all land there. Bids and job offers have buttons to accept or turn them down, and most expire after a week.</p>`)}
  ${sec('h-controls','Everything you can change',`<p>Stories from a reporter's press conference run in his own paper, under his byline. Everything else appears in The Sporting Chronicle.</p><p>A quick reference to every decision in the game and where to make it.</p><div class="tw"><table class="tbl ctl"><thead><tr><th class="l">Where</th><th class="l">What you can change</th></tr></thead><tbody>
   <tr><td class="l"><strong>Tactics</strong></td><td class="l">Formation (eleven systems of the period), the starting eleven and the substitute, Pick the best XI, and a role for every position. The pitch and the squad list stay side by side while you scroll through the rest. Team instructions: approach, passing, width, tempo, where you attack, counter-attacking, tackling, closing down, the defensive line, the offside trap, time-wasting and long throws. Set-piece takers (you must choose each one) and routines. Home and away plans and quick plans. A main and a secondary training focus.</td></tr>
   <tr><td class="l"><strong>Programme page</strong></td><td class="l">Before each match: read the dossier on the opposition, take or leave your assistant's advice, check the weather and the pitch, choose the boots, change the team, watch the match live, or skip straight to the result. In a second leg, it shows the first-leg score and where the aggregate stands.</td></tr>
   <tr><td class="l"><strong>Live match</strong></td><td class="l">Speed (slow, normal, fast), pause, skip to full time. Approach and every team instruction, changed on the touchline, or a quick plan in one go. Three shouts from the dugout a match. Substitutions once the rules allow them. The half-time team talk: calm, encourage or the hairdryer. After the final whistle, the chalkboard report if you want it.</td></tr>
   <tr><td class="l"><strong>Office door</strong></td><td class="l">Your answer when a player, or the trainer, comes to see you.</td></tr><tr><td class="l"><strong>Negotiations</strong></td><td class="l">Your fee offer, accepting or beating a club's counter-offer, the contract length and your wage offer, accepting a player's counter, offering your own players new contracts, and holding out for more when a club bids for your player.</td></tr><tr><td class="l"><strong>Press room</strong></td><td class="l">Your answer to each question (A, B or C), or "No comment".</td></tr>
   <tr><td class="l"><strong>Squad</strong></td><td class="l">Sort by any column. Open a player to put him on the transfer list, take him off it, or release him on a free.</td></tr>
   <tr><td class="l"><strong>Backroom</strong></td><td class="l">Hire coaches from the list and let them go.</td></tr>
   <tr><td class="l"><strong>Transfers</strong></td><td class="l">Search all players, the transfer list, free agents or players abroad, filtered by position, division, age, value and trait, and sorted by any column. Make an offer, haggle, agree his wages.</td></tr>
   <tr><td class="l"><strong>Intray</strong></td><td class="l">Accept or turn down bids for your players and job offers. Induct retired servants into the Hall of Fame. Reopen any story in the newspaper.</td></tr>
   <tr><td class="l"><strong>Chairman's office</strong></td><td class="l">Club tab, Boardroom: ask the chairman for a bigger transfer budget, once a month.</td></tr><tr><td class="l"><strong>Finances</strong></td><td class="l">The budget split slider between transfers and wages. Admission prices (cheap, standard, dear). Commission ground and commercial projects. Invite a glamour side for a floodlit friendly, from the Friendlies section of the Fixtures tab.</td></tr>
   <tr><td class="l"><strong>Club: Kit</strong></td><td class="l">Neck style, shorts, socks and the colour of the away strip. The club colours themselves are fixed.</td></tr>
   <tr><td class="l"><strong>Club: Training ground</strong></td><td class="l">Build training pitches, a gymnasium, an apprentices' hostel and an indoor ball court.</td></tr>
   <tr><td class="l"><strong>Club: Your contract</strong></td><td class="l">Ask the chairman for more money or a longer contract.</td></tr>
   <tr><td class="l"><strong>Office</strong></td><td class="l">Save now, copy a save code, load a save code. Choose how the newspapers arrive: big stories open by themselves, everything waits in the corner, or intray only.</td></tr>
   <tr><td class="l"><strong>Setup</strong></td><td class="l">Your name, your club, and history mode on or off.</td></tr></tbody></table></div>`)}
  ${sec('h-cal','The calendar',`<p>The big button at the top right moves time on. It says <strong>Continue</strong> on an ordinary day and jumps you to the next day with a match. On a match day it says <strong>To the match</strong> and takes you to the programme page. If only other clubs are playing that day, it says <strong>Play matchday</strong>.</p><p>League matches are on Saturdays, with some midweek and Boxing Day fixtures. FA Cup rounds take whole Saturdays: the First and Second Rounds in November and December for Third and Fourth Division clubs, then the big clubs join in the Third Round in January. The Final is at Wembley in early May.</p><p>The <strong>transfer deadline</strong> is 16 March. After that nobody buys or sells until the season ends.</p>`)}
  ${sec('h-team','Picking the team',`<p>On the <strong>Tactics</strong> tab, tap a shirt on the pitch, then tap a player in the list to put him there. The list sorts itself by how well each man would play in that position. A shirt label turns yellow if a player is out of position: he still plays, but not as well. <strong>Pick the best XI</strong> does the job for you. The small word under each shirt is that man's role: tap the shirt to change it (see <a href="#h-depth">Roles, set pieces and the conditions</a>).</p><p>The <strong>Squad</strong> tab shows each man's season: appearances, goals, assists, tackles and average match rating. Click any column heading, on the Squad or Transfers tab, to sort by it. Click again to reverse the order.</p><p>A player's performance comes from his <strong>ability</strong> (the red bar, 1 to 100), how well he suits the position, his <strong>fitness</strong> and his <strong>morale</strong>. Fitness drops after every match and comes back at about 4% a day. Tired players play worse, so rotate in busy weeks. Morale rises with wins and good performances and falls with defeats.</p><p>Young players improve towards their <strong>potential</strong> (the stars), fastest before 21. Players peak in their mid-twenties and decline after 30. Substitutes arrive in 1965-66 (injuries only) and 1966-67 (any reason). Before that, an injured player limps on as a passenger.</p>`)}
  ${sec('h-form','Formations',`<dl class="dl wide">${Object.values(FORMS).map(f=>`<div><dt>${esc(f.lbl)}</dt><dd>${esc(f.desc)}</dd></div>`).join('')}</dl><p>Each formation shifts the balance between attack, midfield and defence by a few per cent, and asks for different players: the W-M needs two good wingers, the 4-4-2 needs four solid midfielders. Pick the shape that suits the men you have.</p><p>Some systems had not been thought of in 1960: the 4-1-3-2 arrives in 1965, and the formation list shows when. Your side also has to <strong>learn</strong> a system. The list shows how well they know each one, from <em>all at sea</em> to <em>second nature</em>. Change systems every week and they will never settle.</p>`)}
  ${sec('h-tac','Team instructions',`<p>These sit under the pitch on the Tactics tab, and you can change them during a match from the touchline panel. They are grouped into in possession, out of possession, game management and set pieces. Each one nudges the match engine by a few per cent. Small on their own, they add up across a season, and none of them is right for every match: what works depends on the opposition, your players, the score and the conditions. The dossier and the chalkboard help you judge it.</p><dl class="dl wide"><div><dt>Approach</dt><dd>Defensive trades attack for defence by about 6 to 7%. Attacking does the reverse.</dd></div>${Object.values(TACOPT).map(o=>`<div><dt>${o.lbl}</dt><dd>${o.opts.map((l,i)=>`<strong>${l}:</strong> ${o.tips[i]}`).join(' ')}</dd></div>`).join('')}</dl>`)}
  ${sec('h-depth','Roles, set pieces and the conditions',`<p><strong>Roles.</strong> Tap a shirt on the Tactics screen and choose how that man plays: an overlapping full-back or one who stays at home, a stopper or a ball-playing centre-half, a destroyer or an attacking wing-half, a schemer or a goal-getter, a touchline winger or one who cuts inside, a target man, a poacher or a deep-lying centre-forward. Some roles only exist in some systems, and some only arrive later in the decade. A role works best for a man with the right traits.</p>
  <p><strong>Traits.</strong> Players have gifts and flaws, up to three each. You can see them on the player's card, in the squad list and in the transfer market, where you can also search by trait. For a player your scouts have not watched properly, you only see some, or none. The great players of the period carry what they were famous for, and on their card those traits have a gold star (★). Traits change what happens on the pitch:</p><dl class="dl wide howtraits">${Object.values(TRAITS).map(t=>`<div><dt>${esc(t.n)}${t.neg?' <small class="muted">(a flaw)</small>':''}</dt><dd>${esc(t.d)}</dd></div>`).join('')}</dl>
  <p><strong>Matching up.</strong> Nothing is best everywhere. Closing down murders a side that passes it short and does little against the long ball. A high line is asking for trouble against quick forwards unless you have a sweeper or an organiser. The counter-attack needs the other side to come at you. Attacking their weakest full-back depends on how weak he is and who you put against him. The dossier on the programme page tells you what you are up against, and your assistant suggests changes you can take or leave.</p>
  <p><strong>Set pieces.</strong> Choose your penalty, free-kick and corner takers, and a long-throw taker if you use long throws. You must pick each one: the lists show every man's position, ability and set-piece gifts, with the specialists first. Then aim corners at the near post, the far post or short, and choose free-kick routines. Set-piece training rehearses them; without it, they fade.</p>
  <p><strong>Familiarity and training.</strong> A side plays below itself in a system it does not know. Every week of training and every match in a system helps, quick learners speed it up and old pros set in their ways slow it down. Choose a <strong>main focus</strong> and a <strong>secondary focus</strong> for training on the Tactics tab, and change them about through the season. The main focus improves quickly and all the way to the top; the secondary improves at half the speed and only to a decent level; an edge you stop working on wears off over about half a season. These are boosts on top of the players' normal ability: letting one lapse never makes them worse than usual. The bars show how sharp the side is in each area.</p><ul class="rules"><li><strong>Fitness:</strong> the side tires less in matches. Expect the odd knock in training, injury-prone men first, and grumbling from the veterans.</li><li><strong>Ball work:</strong> a better touch, short passing works better, and young players come on faster.</li><li><strong>Tactics:</strong> the side learns its system much faster.</li><li><strong>Defending:</strong> harder to break down, and a high line or an offside trap holds up better.</li><li><strong>Pressing:</strong> closing down bites harder and costs less in the legs.</li><li><strong>Attacking:</strong> sharper in front of goal.</li><li><strong>Game scenarios:</strong> calmer and sharper in the last quarter of an hour of a tight game.</li><li><strong>Set pieces:</strong> rehearsed corners, free kicks and long throws.</li><li><strong>Rest:</strong> fresh legs and happy players, but a little rusty.</li></ul><p><strong>Match plans.</strong> Tick <em>Separate plans for home and away</em> and you keep two complete set-ups: formation, roles, approach and instructions. Switch between them to edit, and the right one goes in before every match (neutral grounds use the home plan). The six <strong>quick plans</strong> set several instructions at once: Keep it tight away, Cup-tie siege, Protect a lead, All-out attack, Mud and bullets, and The Continental way.</p>
  <p><strong>The conditions.</strong> The weather is the same over every ground in a region on a given day, and pitches remember the week's rain. Mud, frost, wind, fog and the size of the ground all change what works. Pick your boots on the programme page: long studs for mud or a heavy pitch, rubber pimples for frost and snow, moulded studs otherwise. Your trainer picks the right pair more often the better he is; without one, the kit man puts out the usual. The home side knows every bump of its own pitch, which counts for more in the mud and on unusual grounds.</p>
  <p><strong>The touchline.</strong> During a match you have three shouts from the dugout, each lasting ten minutes, and you can switch to a quick plan or change any instruction. After the match, the chalkboard shows where the chances came from and how the plan worked, if you want to look. More in <a href="#h-match">Match day</a>.</p>`)}
  ${sec('h-staff','The backroom',`<p>Every coach now plays a part in the tactical side too: the trainer and the defensive, forwards, set-piece, wing-play, youth and man-manager coaches each make their own kind of training go further (and the trainer cuts knocks in fitness work and picks the boots); the wing-play and goalkeeping coaches make the matching roles work better; the man-manager makes your shouts from the dugout carry; and the chief scout sharpens the dossier. Your best coach is also your assistant, and the better he is, the more he spots before and after a match. Hire coaches on the <strong>Backroom</strong> tab: two places, three in the First Division. Each has a speciality and a quality from one to five stars. They cost a signing-on fee and a weekly wage, which counts against your wage budget.</p><dl class="dl wide">${Object.values(STAFF).map(([t,d])=>`<div><dt>${t}</dt><dd>${d}</dd></div>`).join('')}</dl><p>Only the best coach of each kind counts, so hire different specialists. A new list of coaches is available every summer.</p>`)}
  ${sec('h-match','Match day',`<p>Before each match you see the programme page: both team sheets and the <strong>dossier</strong> on the opposition, compiled by your chief scout or, without one, the trainer. It covers their system (a poor scout sometimes gets it wrong), how they play, their danger men and their traits, the weak link in their back line, their set-piece threat, their keeper, and the weather and pitch. Your assistant gives his view, and <strong>Do as he says</strong> applies his changes for that match only. Choose the <strong>boots</strong> here too. In a second leg, the cover shows the first-leg score and the aggregate. <strong>Kick off</strong> to watch it live, or <strong>Just the result</strong> to skip.</p><p>In the live match, the pitch shows the game as it happens: passing, dribbling, long balls in the air, tackles, pressing and runs into the box. Every attack that ends in a shot is played out in full, built from what really happened (a wing run and cross, a one-two, a long ball, a counter-attack, a shot from distance), and you only find out how it ends when the ball is struck: in the net, saved, tipped behind, off the post, blocked, wide or over. Set pieces are shown too: corners with the box crowded, free kicks with a wall, penalties, long throws and goal kicks. Some attacks come to nothing: a tackle, an offside flag, the keeper claiming a cross. Every shot is marked on the pitch: a filled disc for a goal, a cross for a save, an open ring for a miss. The stadium clock runs from 3 o'clock. The <strong>pressure bar</strong> shows who has been on top over the last ten minutes. From the touchline panel you can change the speed, your approach and every team instruction, switch to a quick plan, and make a substitution when the rules allow. You also get <strong>three shouts from the dugout</strong> a match: Get it forward, Keep it tight, Get stuck in, Calm down, Push up, and Waste some time. Each lasts ten minutes and works best at the right moment: Get it forward when chasing the game, Keep it tight when in front, Calm down after a goal against. At a big away ground the crowd can drown you out. In a two-legged tie the scoreboard shows the aggregate.</p><p>After the final whistle you can open the <strong>chalkboard</strong> from the button at full time or on the results screen. It is entirely optional. It shows where the chances came from down each flank and the middle, the shots, corners, territory and counter-attacks, how the goals were scored, how each part of your plan worked (including the boots and every shout), and your coach's advice for next time. The last twelve matches are kept.</p><p>At half-time the match pauses for your <strong>team talk</strong>. Keep it calm when you are ahead, encourage them when it is level. Give them the hairdryer when you are losing: it usually works, but it can backfire.</p><p>FA Cup draws go to a replay at the other ground, with extra time. A drawn replay goes to a second replay at a neutral ground.</p>`)}
  ${sec('h-press','The press',`<p>Before big games (the season opener, FA Cup ties from the Third Round, derbies, top-of-the-table clashes) and when your job is under threat, the reporters want a word. What you say has real effects:</p><ul class="rules"><li><strong>Morale:</strong> rousing answers lift the dressing room, criticism flattens it.</li><li><strong>Match form:</strong> some answers fire your side up for that one match by 1 to 3%, or wind the opposition up.</li><li><strong>Recruitment:</strong> talking big about spending makes players keener to join you. They are less likely to turn you down and ask for lower wages.</li><li><strong>Board confidence:</strong> the directors like ambition and hate excuses.</li><li><strong>Promises:</strong> bold predictions have to be kept. Lose after promising a win and the board and players remember it. Promise a great season and finish below expectations, and you will be eating your words in May.</li></ul><p>Your answers, and your biggest results, make the newspapers. Stories about your own club and landmark events open by themselves when you are back at your desk. Everything else waits as a folded paper in the corner of the screen until you fancy a read. You can change this in the Office.</p>`)}
  ${sec('h-talk','Players at your door',`<p>Every few weeks someone knocks on the office door. A player wants first-team football, or a rise. A star is unsettled because you turned down a bid for him from a bigger club. An overseas signing is homesick. A veteran of 34 or more is thinking of retiring, though a man in stunning form rarely thinks that way. The dressing room needs lifting after a bad run. Or the trainer has heard that someone was at the dog track at two in the morning. An old pro set in his ways may come to tell you he does not understand your new system.</p><p>Each time you get three answers, and each one has consequences: morale, transfer requests, wages, even a new coach for the backroom if you persuade a retiring veteran to stay on. Promises are remembered. Break one and the player will ask to leave, unless you have a good relationship that goes back three seasons or more, in which case he gives you one more chance. Your relationship with each player, shown on his card, grows with the games he plays for you and the years you spend together, and with how you treat him when he knocks on the door. You can also say "not now", and deal with it later from the intray.</p>`)}
  ${sec('h-trans','Transfers',`<p>Search the whole Football League on the <strong>Transfers</strong> tab. <strong>Offers for your players</strong>, the last section there, lists every live bid for one of your men, with the fee, his value and when the offer runs out, so you can accept, hold out or turn it down. The number on the Transfers tab counts these offers. Open a player and <strong>make an approach</strong>. Buying a player is two separate negotiations. First you sit down with the selling club's manager and agree a fee. Once they accept, that stage is over, and the fee stands for ten days. Then you sit down with the player and his adviser (or his father, if he is young) and agree his wages and the length of his contract. You can talk terms straight away, or leave it while you sort out the money: the intray keeps a reminder with a button to open talks, and if the ten days run out, or the transfer deadline passes, the agreed fee lapses. Free agents skip the first stage. Clubs value their best three players very highly and want at least 80% of their valuation to negotiate. Offer too little four times and they will stop talking. Players on the <strong>transfer list</strong> are cheaper. <strong>Free agents</strong> cost no fee at all. Your own players are safe under contract: they only leave if you accept a bid, release them, let their contract run out, or let a homesick player go home, or if they retire. The club secretary reminds you about contracts ending that summer on 2 January, 1 March and 15 April, and the squad list flags them too. The Departures page on the Squad tab shows who has left and how. The <strong>Abroad</strong> list covers the Scottish League and the great clubs of Europe and South America, plus anyone who has moved abroad. Foreign clubs ask more, and overseas players want higher wages. Some can never be bought: the Iron Curtain countries will not let their players leave, and Brazil declared Pelé a national treasure. Until 1966, Italian clubs may also come for your stars.</p><p><strong>Negotiation.</strong> A club will usually take a little less than its valuation, but it won't tell you how much. Offer under the price and they come back with a counter-offer, meeting you part of the way. Keep chipping away and they lose patience, shown by the three dots. Offer something insulting and they may put the phone down. Players haggle over wages the same way: offer less than he asks and he may sign anyway, grumble and counter, or walk out. When a club bids for one of your players, you can hold out for more, but they might pull out.</p><p><strong>Contracts.</strong> Every player is on a contract, shown in the last column of the Squad. When you sign a player you choose the length, one to five years. Young players like a long deal and veterans want security, so offering a length he doesn't fancy puts his wage demand up. In January the club secretary lists who is out of contract that summer. Open a player's card to offer him a new deal, haggling over wages in the same way. A player on the transfer list, or one who is miserable, won't talk. Until the Eastham ruling of 1963, the retain-and-transfer system lets you keep anyone you don't re-sign, on his old terms and unhappy about it. After that, out-of-contract players walk away on a free, and other clubs release players too, so the free-agent list fills up every summer.</p><p>Once a fee is agreed, the player names his wage. Stars at much bigger clubs may refuse to drop down to yours, unless they are on the transfer list or your standing with players is high. A chief scout lowers asking prices and, at three stars or better, shows a player's true potential as a number.</p><p>To sell, put a player on the transfer list from his card and wait for bids. Other clubs also bid now and then for your best players without being asked. From January 1961 the maximum wage is abolished and wages climb every year. Keep an eye on the wage bill.</p>`)}
  ${sec('h-money','Finances and making money',`<p>The <strong>Finances</strong> tab shows your bank balance, your transfer and wage budgets, everything that has come in and gone out this season, a forecast of where the balance will be in May, and a week-by-week chart.</p><h4 class="h4">Money in</h4><ul class="rules"><li><strong>Gate receipts</strong> are the lifeblood. Every home League match brings in the crowd multiplied by the admission price. Crowds depend on your club's reputation and division, the opposition, how the season is going, and the ground itself. The 1966 World Cup gives crowds a lift everywhere.</li><li><strong>FA Cup gates</strong> are shared: each club takes 45% of the takings, home or away. A cup run, especially a replay at a big club, can pay for a new player.</li><li><strong>Weekly income</strong> from pools, programmes and the like, based on your reputation. The supporters' club lottery and a club shop add to it.</li><li><strong>Selling players.</strong> The fee goes into the bank, and 75% of it is added to your transfer budget.</li><li><strong>Floodlit friendlies</strong> against glamour sides like Santos, Real Madrid or Benfica draw huge crowds. They charge an appearance fee, your players tire, and there is a small injury risk. One every four weeks.</li><li><strong>Ground projects</strong> start with a works order and show a progress bar on the Finances tab until the ribbon is cut.</li></ul><h4 class="h4">Money out</h4><ul class="rules"><li><strong>Wages</strong> every Monday: players plus backroom staff.</li><li><strong>Running costs</strong> every Monday: groundstaff, travel, kit, the laundry, the tea lady. Bigger clubs spend more.</li><li><strong>Transfer fees</strong> and coaches' signing-on fees.</li><li><strong>Building work</strong> on the ground.</li></ul><h4 class="h4">Ways to grow the club</h4><ul class="rules"><li><strong>Admission prices.</strong> Cheap tickets bring about 12% more people but take less per head. Dear tickets take 25% more per head from about 15% fewer. Dear usually makes a little more money, and cheap fills the ground.</li><li><strong>Ground projects</strong> pay back over years. A terrace roof or a new stand means bigger crowds for every home match from then on. A new stand also raises the club's reputation, which lifts crowds and weekly income again.</li><li><strong>Winning</strong> is the best business plan. Promotion and trophies raise reputation, and reputation raises everything.</li><li><strong>Buy young, sell high.</strong> Young players with high potential rise in value as they improve.</li></ul><h4 class="h4">Budgets</h4><p>Each summer the board set a <strong>transfer budget</strong> (about half the bank balance) and a <strong>wage budget</strong> (what they think the club can afford each week). You cannot sign a player or coach who takes you over either. The board set the total, but you decide the split: the slider on the Finances tab moves money between the two, with every £52 of transfer budget worth £1 a week in wages. You can't cut the wage budget below the wages you already pay. If the board are happy with you, <strong>Ask the board for more money</strong> may loosen the purse strings. Ask when they are unhappy and they will say no, and like you a little less. Go deep into the red and the board lose patience.</p>`)}
  ${sec('h-club','The club',`<p>The <strong>Club</strong> tab is the club's life outside the first team:</p><ul class="rules"><li><strong>Ground:</strong> an aerial drawing of your stadium that changes as you build, with capacity and gates. Crowds can never be bigger than the capacity.</li><li><strong>Overview:</strong> the trophy cabinet, and beside it a framed copy of every souvenir edition printed for your trophies. Tap one to read it again.</li><li><strong>Records</strong> and the <strong>Hall of Fame:</strong> kept from the day you arrive. When a player with 40 or more appearances for you retires, you decide whether he goes in.</li><li><strong>Rivals:</strong> your record in the derbies, plus your bogey side and favourite opponents.</li><li><strong>Boardroom:</strong> every chairman has a creed. The Cup romantic cares about the FA Cup, the accountant watches the books, the youth man wants young players, the showman wants goals, and the big spender gives you more money but expects more. It shapes how board confidence moves.</li><li><strong>Supporters:</strong> single results barely move them, but runs of results snowball. Supporters of big clubs expect more than those of small ones. A happy crowd means bigger gates and a warmer board. Their letters appear in the programme.</li><li><strong>Reserves and youth:</strong> the second string plays alongside the first team. Youngsters with 15 or more games there improve faster. The pathway shows who is ready to step up.</li><li><strong>Kit:</strong> the club colours are fixed, but you choose the neck, the shorts, the socks and the away strip.</li><li><strong>Training ground:</strong> pitches, a gym, a hostel for the apprentices and an indoor court, each improving players in a different way.</li><li><strong>Your contract:</strong> your salary, how long it runs, and the chance to ask for more.</li></ul>`)}
  ${sec('h-board','The board and your job',`<p><strong>The manager's market</strong> (Club tab) lists every vacant job in the League, why it is vacant, what the board expect and your chances of getting it. Managers are sacked when their clubs fall well short, and some move on in the summer; a caretaker takes over until the board appoint someone. You can apply for any vacancy: the chairman replies within a week or so, though your own board sometimes hear that you have been looking. Clubs that rate you may also come to you unasked. Every offer spells out the wage, the division, the board's expectation and the money to spend, and stands for ten days. Turning one down earns a little credit with your own chairman. The board expect a certain finish, based on how your squad compares with the rest of the division. The Club tab shows their confidence. After every League match it rises or falls by how the result compares with what they expected. At the end of the season your final position against their target counts heavily. Promotion and trophies earn a lot of credit, and relegation costs a lot.</p><p>Chairmen talk. When things go very well, or very badly, your chairman will give the papers a few quotes, and you will hear his views whenever you ask for money or a new contract. Each chairman has his own look and his own way of speaking.</p><p>Win a trophy and the paper prints a souvenir edition: the trophy, the season's record, the goals, and the team that did it.</p><p>Let confidence sink too low and you will be sacked, and have to take a job at a smaller club. Do well and bigger clubs will ask to speak to you in the summer.</p>`)}
  ${sec('h-hist','History mode',`<p>With history mode on, the real decade happens around you: transfers, managerial changes, rule changes and world events on the dates they really happened. The clubs who really won each title and cup get a small boost that season, so the real story tends to repeat itself, but not always. If a real transfer involves your player, the bid comes to you and you decide. The History tab sets the real honours beside what happens in your game.</p>`)}
  ${sec('h-season','The season around you',`<ul>
 <li><strong>Start year.</strong> Start in any season from 1960-61 to 1969-70. The years before you arrive are played out first, so squads and history are right.</li>
 <li><strong>Three cups.</strong> The FA Cup, the League Cup (midweek, two-legged semi-finals, and a two-legged final until 1966, then Wembley) and Europe: the European Cup for champions, the Cup Winners' Cup for the FA Cup winners and the Fairs Cup for the best of the rest. Each has its own colours on match day, blue for Europe.</li>
 <li><strong>The wireless.</strong> ${WIRE.n} of the BBC reads the draws when you are still in a cup, reports the finals, and interviews you before every season: three questions, live.</li>
 <li><strong>Cup fever.</strong> Every cup win lifts the town: bigger gates, happier supporters and rosettes flying out of the club shop.</li>
 <li><strong>The board's objectives.</strong> Three extra targets each season, set by your chairman's creed. Each one met earns a little credit; each one missed costs a little.</li>
 <li><strong>Awards and milestones.</strong> Manager and Player of the Month every month; milestones like 100 appearances, 50 goals, a debut goal or a hat-trick are kept on each player's card for the rest of his career.</li>
 <li><strong>The run-in.</strong> With eight games left, if you are in a race for the title, promotion or survival, the intray shows who is still to play whom and exactly what you need.</li>
 <li><strong>Deadline day.</strong> In mid-March the telephone rings: late bids for your players, and chairmen who need cash and will meet you somewhere unlikely before five o'clock.</li>
 <li><strong>The captain.</strong> Pick one from a player's card. A natural leader lifts the dressing room and sorts out grumbles before they reach your door; leave him out and he will let you know.</li>
 <li><strong>Other managers.</strong> Each has a character. Some will try to wind you up in the papers before a game, and how you reply matters. They may try to poach your coaches, and a manager who likes you will do a slightly better deal.</li>
 <li><strong>Scouting.</strong> You do not know exactly how good a player is until someone has watched him: his ability shows as a range. Send scouts to a region, keep a shortlist, and you learn about every side you play against. You can watch one region to begin with. A chief scout adds a second (and a third at four stars), and the <em>A second scout</em> project on the Club tab adds one more.</li>
 <li><strong>Young players.</strong> Apprentices arrive every summer, and there is a trial day in October and schoolboy signings in February. Every lad you sign goes into the <strong>academy</strong> (Squad tab, Academy), where he plays for the youth team, in the FA Youth Cup and in the reserves but not the first team. Pair a lad with a senior pro as his mentor and he comes on faster, and may pick up his mentor's habits, good or bad. The youth coach reports in October, December and February. Watch for lads who get homesick, and for bigger clubs tapping up your best boy's parents. Every April you decide on the lads turning 18: offer professional forms or let them go. Promote a lad early when you think he is ready. The Old Boys list shows how everyone who came through, or who you let go, got on. Many of the lads coming through are real: George Best, Norman Hunter, Peter Shilton and a hundred more join the academy of the club they really joined, a couple of years before they really broke through. The schools are worth scouting too.</li>
 <li><strong>Money.</strong> Go overdrawn and the bank manager writes, and charges interest. Local businessmen may offer money for a seat on the board, and now and then someone tries to buy the club.</li>
 <li><strong>Your reputation.</strong> It grows with success. When it outgrows your club, bigger clubs come calling. You can retire from the Office tab and find out what became of you.</li>
 <li><strong>The trophy room and scrapbook.</strong> Every trophy, souvenir edition, letter and big headline about your club is kept on the Club tab.</li></ul>`)}
  ${sec('h-save','Saving',`<p>The game saves in your browser after every match day. Clearing your browser data deletes it, so from time to time copy a save code from the <strong>Office</strong> tab and keep it somewhere safe. Paste it back in to restore your career on any computer.</p>`)}
  </article></div>`;}

/* ---- office ---- */
function vOffice(){const mode=G.settings.papers;return `<section class="panel narrow"><h2 class="h1">The manager's office</h2>
  <p>Your career saves itself in this browser after every matchday. If you clear your browser data it goes with it, so copy out a save code now and then.</p>
  <div class="row gap wrap"><button class="btn go" data-a="saveNow">Save now</button><button class="btn" data-a="export">Show save code</button><button class="btn" data-a="toTitle">Title screen</button></div>
  <h3 class="h2">Newspapers</h3><div class="seg" role="group" aria-label="Newspapers">${[['auto','Big stories open by themselves'],['corner','Everything waits in the corner'],['off','Intray only']].map(([k,l])=>`<button class="${mode===k?'on':''}" data-a="papermode" data-k="${k}">${l}</button>`).join('')}</div>
  <p class="muted sm">${mode==='auto'?'Stories about your club, and landmark events like the World Cup, open by themselves. Everything else waits as a folded paper in the corner of the screen.':mode==='corner'?'All stories wait as a folded paper in the corner. Tap it when you fancy a read.':'No papers. Every story still lands in your intray.'}</p>
  ${UI.note?`<p class="stamp">${esc(UI.note)}</p>`:''}
  ${UI.exportCode?`<label class="lbl" for="exp-code">Save code (copy and keep it somewhere safe)</label><textarea id="exp-code" class="inp code" readonly rows="5">${esc(UI.exportCode)}</textarea><button class="btn" data-a="copy">Copy code</button>`:''}
  <h3 class="h2">Load a save code</h3><label class="lbl" for="imp-code">Paste a code here</label><textarea id="imp-code" class="inp code" rows="4" data-in="imp">${esc(UI.importText)}</textarea><button class="btn" data-a="import">Load this career</button>
  ${achHTML()}
  <h3 class="h2">Retirement</h3><p class="muted sm">Hang up the sheepskin coat and find out what became of you.</p><button class="btn ghost" data-a="retire">${UI.confirmRetire?'Yes, I really am retiring':'Retire from management'}</button>
  <p class="muted sm office-foot">History mode: ${G.hist?'on':'off'}. The full rules are in How to play.</p></section>`;}
/* ---- prematch ---- */
function tacSummary(t){const out=['pass','width','tempo','tackle'].filter(k=>t[k]!==1).map(k=>TACOPT[k].opts[t[k]]);if(t.trap)out.push('offside trap');return out.join(', ')||'standard instructions';}
function vPrematch(){const f=G.fx.find(x=>x.date===G.date&&!x.p&&isUserFx(x));if(!f){UI.screen='game';return vTab();}
  const v=validateUserXI();const F=FORMS[G.user.form];const opp=f.h===U()?f.a:f.h;const oc=club(opp);const ob=bestXI(opp,oc.form);
  const oppXI=ob.xi.filter(Boolean).map(id=>G.players[id]).sort((a,b)=>b.ca-a.ca);const oppTop=oppXI.slice(0,3);
  const comp=compLbl(f);const ground=f.venue?(f.venue==='Wembley'?'Empire Stadium, Wembley':f.venue):f.neutral?(f.r===7?'Empire Stadium, Wembley':'Neutral ground'):club(f.h).g;
  const t=f.comp==='L'?table(f.div):null;const pos=id=>t?ord(t.findIndex(r=>r.id===id)+1):'';const pf=G.pressFx[f.id];
  return `<div class="prog ${cupClass(f)}">${cupBanner(f)}<div class="prog-cover"><p class="eyebrow">Official programme · Price 6d</p><h2 class="prog-comp">${esc(comp)}${isDerby(U(),opp)?' · Derby day':''}</h2>
   <div class="vs">${crest(f.h,'xl')}<span class="vsn ${cn(f.h).length>16?'vlong':cn(f.h).length>11?'vmid':''}">${esc(cn(f.h))}</span><span class="vsv">v</span><span class="vsn ${cn(f.a).length>16?'vlong':cn(f.a).length>11?'vmid':''}">${esc(cn(f.a))}</span>${crest(f.a,'xl')}</div>
   <p class="prog-meta">${esc(ground)} · ${fmtDate(f.date)} · Kick-off 3.00 p.m.</p>${aggHTML(f)}</div>
  <div class="prog-grid"><section class="panel"><h3 class="h2 first">${esc(club(U()).s)} team sheet</h3><p class="muted sm">${F.lbl} · ${MENT[G.user.ment]} · ${tacSummary(G.user.tac)}</p>${G.user.plan&&G.user.plan.on?`<p class="muted sm">Your ${f.a===U()&&!f.neutral?'away':'home'} plan is in place.</p>`:''}
   <ol class="sheet">${v.xi.map((pid,i)=>{const p=G.players[pid];return `<li><b>${F.s[i][4]}</b><span>${p?esc(p.n):'Nobody'}${p&&G.year-p.b>=31?' <small class="muted">('+(G.year-p.b)+')</small>':''}</span><small>${F.s[i][1]}${p&&suitP(p,F.s[i][0])<.9?' (out of position)':''}</small>${p?fitTag(p):'<em></em>'}</li>`;}).join('')}
   ${G.subs&&v.sub?`<li><b>12</b><span>${esc(G.players[v.sub].n)}</span><small>Sub</small>${fitTag(G.players[v.sub])}</li>`:''}</ol>${(()=>{const tired=v.xi.map(id=>G.players[id]).filter(p=>p&&p.fit<85).sort((a,b)=>a.fit-b.fit);if(!tired.length)return '';return `<div class="fitwarn"><strong>Fitness</strong> ${tired.map(p=>`${esc(p.n)} is at ${Math.round(p.fit)}%${G.year-p.b>=31?' (and at '+(G.year-p.b)+' he is slow to recover)':''}`).join('; ')}. A tired man plays below his best: at ${Math.round(tired[0].fit)}% fitness he is about ${Math.round((1-(0.72+0.28*tired[0].fit/100))*100)}% down. You may want to rest ${tired.length===1?'him':'some of them'}: use Change the team.</div>`;})()}
   ${v.fixed.length?`<p class="warn">Injured or departed players were replaced automatically.</p>`:''}${pf?`<p class="muted sm">After your press conference: ${pf.me>1?'your side is fired up. ':pf.me<1?'your side is a little flat. ':''}${pf.opp>1?'The opposition are riled. ':pf.opp<1?'The opposition may be complacent. ':''}${pf.bet?'You have promised a result.':''}</p>`:''}</section>
  <section class="panel"><h3 class="h2 first">About ${esc(oc.n)}</h3><p>Manager: ${esc(oc.m)}${t?` · ${pos(opp)} in ${DIVN[f.div]}`:''}</p><p>Players to watch:</p><ul class="watch">${oppTop.map(p=>`<li>${esc(p.n)} <small>${POSN[p.pos]}, ${caK(p)}</small></li>`).join('')}</ul>
   <p class="muted sm">Your side rated ${Math.round(teamRating(U()))}, theirs ${Math.round(teamRating(opp))}.</p></section></div>${dossierHTML(f,opp)}
  <div class="row gap center wrap"><button class="btn" data-a="toTactics">Change the team</button><button class="btn" data-a="quickres">Just the result</button><button class="btn go big" data-a="kickoff">Kick off</button></div></div>`;}

/* ---- live ---- */
function clockSVG(){const hand=(id,len,w)=>`<line id="${id}" x1="50" y1="50" x2="50" y2="${50-len}" stroke-width="${w}" stroke-linecap="round"/>`;
  let ticks='';for(let i=0;i<60;i++){const a=i*6*Math.PI/180,r1=i%5?42:38;ticks+=`<line x1="${50+r1*Math.sin(a)}" y1="${50-r1*Math.cos(a)}" x2="${50+45*Math.sin(a)}" y2="${50-45*Math.cos(a)}" stroke-width="${i%5?1:2.5}"/>`;}
  return `<svg class="clock" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" class="face"/><g class="ticks">${ticks}</g><g class="hands">${hand('ch-h',24,4)}${hand('ch-m',36,2.5)}</g><circle cx="50" cy="50" r="3" class="pin"/></svg>`;}
function clockSVG(){const hand=(id,len,w)=>`<line id="${id}" x1="50" y1="50" x2="50" y2="${50-len}" stroke-width="${w}" stroke-linecap="round"/>`;
  let ticks='';for(let i=0;i<60;i++){const a=i*6*Math.PI/180,r1=i%5?42:38;ticks+=`<line x1="${(50+r1*Math.sin(a)).toFixed(1)}" y1="${(50-r1*Math.cos(a)).toFixed(1)}" x2="${(50+45*Math.sin(a)).toFixed(1)}" y2="${(50-45*Math.cos(a)).toFixed(1)}" stroke-width="${i%5?1:2.5}"/>`;}
  return `<svg class="clock" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" class="face"/><g class="ticks">${ticks}</g><g class="hands">${hand('ch-h',24,4)}${hand('ch-m',36,2.5)}</g><circle cx="50" cy="50" r="3" class="pin"/></svg>`;}
function vLive(){const L=UI.live;if(!L)return '';const m=L.m;const f=m.fx;const hc=club(f.h),ac=club(f.a);
  return `<div class="live ${cupClass(f)}">${cupBanner(f)}<div class="board" id="board" aria-live="polite"><div class="bt">${crest(f.h,'lg')}<span class="bn">${esc(hc.s)}</span></div>
   <div class="bs"><span id="sc-h">0</span><span class="dash">-</span><span id="sc-a">0</span><small id="sc-min">0'</small><small id="sc-agg" class="aggl"></small></div>
   <div class="bt">${crest(f.a,'lg')}<span class="bn">${esc(ac.s)}</span></div><div class="goalflash" id="gflash">GOAL!</div></div>
  <div class="underboard"><div class="clockbox">${clockSVG()}<small id="clk-t">3.00</small></div>
   <div class="mombox"><small>Pressure, last ten minutes</small><div class="mom"><i id="mom-h" style="--c:${hc.c1}"></i><i id="mom-a" style="--c:${ac.c1}"></i></div><div class="scorers-line" id="gl"></div></div>
   <div class="crowdbox"><small>Crowd</small><strong>${m.att.toLocaleString('en-GB')}</strong><small>${esc(m.ground)}</small><small class="wxl">${esc(WXN[m.cond.wx])}, ${esc(PITN[m.cond.pitch].toLowerCase())}</small></div></div>
  <div class="live-grid"><div class="stack"><section class="panel pitchp"><canvas id="pitchcv" aria-label="Pitch view showing the players, the ball and every shot"></canvas>
    <p class="plegend"><span><i class="lg-goal"></i>Goal</span><span><i class="lg-save"></i>Saved</span><span><i class="lg-miss"></i>Missed</span><span>${esc(hc.s)} attack to the right</span></p></section>
   <section class="panel feedp"><h3 class="h2 first">Commentary</h3><ol class="feed" id="feed"></ol></section></div>
  <aside class="panel side"><div id="side-ctrl"></div><div id="side-stats"></div></aside></div></div>`;}
function sideCtrl(){const L=UI.live;const m=L.m;const u=m.sides[m.us];let h='';
  if(m.done&&!L.pend)return `<button class="btn go big wide first" data-a="afterlive">The classified results ▸</button>${m.fx.an?`<button class="btn wide" data-a="chalk" data-id="${m.fx.id}">View the match report on the chalkboard</button>`:''}`;
  if(L.ht){const d=m.sc[m.us]-m.sc[1-m.us];
    return `<div class="talk"><h3 class="h2">Half-time team talk</h3><p class="sm">${d>0?'You are in front. How do you keep them going?':d<0?'You are behind. The dressing room is quiet.':'All square. What do you tell them?'}</p>
    <div class="talkbtns"><button class="btn" data-a="talk" data-k="calm">Keep it calm</button><button class="btn" data-a="talk" data-k="enc">Encourage them</button><button class="btn go" data-a="talk" data-k="hair">The hairdryer</button></div></div>`;}
  h+=`<h3 class="h2 first">Touchline</h3><div class="tacrow"><span class="lbl">Speed</span><div class="seg">${['Slow','Normal','Fast'].map((s,i)=>`<button class="${L.speed===i?'on':''}" data-a="spd" data-k="${i}">${s}</button>`).join('')}</div></div>
    <div class="tacrow"><span class="lbl">Approach</span><div class="seg">${MENT.map((s,i)=>`<button class="${u.ment===i?'on':''}" data-a="lment" data-k="${i}">${s}</button>`).join('')}</div></div>
    ${liveTacHTML(u)}`;
  if(G.subs&&u.sub&&!u.subUsed){const canAny=G.subs===2;const opts=u.xi.map((pid,i)=>[pid,i]).filter(([pid,i])=>pid&&!u.off[pid]&&(canAny||u.hob[pid]));
    h+=opts.length?`<div class="row gap wrap"><label class="lbl" for="suboff">Bring on ${esc(nm(u.sub))} for</label><select id="suboff" class="inp sm">${opts.map(([pid,i])=>`<option value="${i}">${esc(G.players[pid].n)}${u.hob[pid]?' (injured)':''}</option>`).join('')}</select><button class="btn sm" data-a="lsub">Make change</button></div>`:`<p class="muted sm">Substitute ${esc(nm(u.sub))} is ready if anyone gets injured.</p>`;}
  h+=`<div class="row gap wrap"><button class="btn" data-a="lpause">${L.paused?'Resume':'Pause'}</button><button class="btn" data-a="lskip">Skip to full time</button></div>`;
  return h;}
function sideStats(){const L=UI.live,m=L.m;const u=m.sides[m.us];const tot=m.terr[0]+m.terr[1]||1;const P=L.pend;const val=(i,k)=>P&&!P.shotShown?P.snap.st[i][k]:m.sides[i][k];
  const st=(k,l)=>`<tr><td>${val(0,k)}</td><td class="l">${l}</td><td>${val(1,k)}</td></tr>`;
  return `<h3 class="h2">Match</h3><table class="tbl mini"><tbody>${st('shots','Shots')}${st('sot','On target')}${st('corners','Corners')}<tr><td>${Object.values(m.sides[0].bk||{}).reduce((a,b)=>a+b,0)}</td><td class="l">Names taken</td><td>${Object.values(m.sides[1].bk||{}).reduce((a,b)=>a+b,0)}</td></tr><tr><td>${Object.keys(m.sides[0].off||{}).length}</td><td class="l">Sent off</td><td>${Object.keys(m.sides[1].off||{}).length}</td></tr><tr><td>${Math.round(m.terr[0]/tot*100)}%</td><td class="l">Territory</td><td>${Math.round(m.terr[1]/tot*100)}%</td></tr></tbody></table>
  <h3 class="h2">${esc(club(u.cid).s)} ratings</h3><ul class="rts">${u.played.map(pid=>{const p=G.players[pid];const r=u.rt[pid]??6.4;return `<li><span>${esc(p?p.n:'?')}${u.hob[pid]?' <span class="inj">Inj</span>':''}${u.off[pid]?' <span class="inj">Sent off</span>':''}${u.bk&&u.bk[pid]?' <span class="bkt" title="Name taken by the referee">Booked</span>':''}</span><b class="${r>=7.5?'hi':r<5.8?'lo':''}">${r.toFixed(1)}</b></li>`;}).join('')}</ul>`;}
function updateLive(full){const L=UI.live;if(!L)return;const m=L.m;const a=$('#sc-h');if(!a)return;const D=L.pend?L.pend.snap:null;const sc=D?D.sc:m.sc,evN=D?D.ev:m.ev.length,gN=D?D.goals:m.goals.length;
  a.textContent=sc[0];$('#sc-a').textContent=sc[1];{const ag=$('#sc-agg');if(ag){const A=aggNow(m.fx,sc);ag.textContent=A?`Agg ${A[0]}-${A[1]}`:'';}}$('#sc-min').textContent=m.done&&!D?'FT':L.ht?'HT':m.min+"'";
  const feed=$('#feed');if(full){feed.innerHTML='';L.shown=0;L.goalsSeen=m.goals.length;L.ckey=null;}
  for(let i=L.shown;i<evN;i++){const e=m.ev[i];const li=document.createElement('li');li.className=`ev k-${e.k} s${e.side}`;li.innerHTML=fixPoss(`<b>${e.min?e.min+"'":''}</b><span>${e.side>=0?crest(m.sides[e.side].cid,'sm')+' ':''}${esc(e.t)}</span>`);feed.prepend(li);}
  L.shown=evN;
  if(!full&&gN>(L.goalsSeen||0)){L.goalsSeen=gN;const b=$('#board');if(b){b.classList.remove('flash');void b.offsetWidth;b.classList.add('flash');}}
  $('#gl').innerHTML=[0,1].map(i=>`<div>${m.goals.slice(0,gN).filter(g=>g.side===i).map(g=>`${esc(surname(g.name))} ${g.min}'${g.flag==='pen'?' (pen)':g.flag==='og'?' (o.g.)':''}`).join(', ')}</div>`).join('');
  const mins=Math.min(m.min,120)+(m.min>45?15:0)+(m.min>90?5:0);const hA=((3*60+mins)/720)*360,mA=mins*6;
  const hh=$('#ch-h'),mh=$('#ch-m');if(hh){hh.setAttribute('transform',`rotate(${hA} 50 50)`);mh.setAttribute('transform',`rotate(${mA} 50 50)`);}
  const tm=180+mins;$('#clk-t').textContent=`${Math.floor(tm/60)-12>0?Math.floor(tm/60)-12:Math.floor(tm/60)}.${String(tm%60).padStart(2,'0')}`;
  const last=m.mom.slice(-10);const mv=last.length?clamp(last.reduce((t,v)=>t+v,0)/last.length/1.2,-1,1):0;
  $('#mom-h').style.width=(50+mv*50)+'%';$('#mom-a').style.width=(50-mv*50)+'%';
  const u=m.sides[m.us];const key=[L.ht,m.done&&!D,L.paused,L.speed,u.ment,u.subUsed,Object.keys(u.hob).length,Object.keys(u.off).length,JSON.stringify(u.tac),u.shout?u.shout.k+u.shout.until:'',(u.shoutLog||[]).length].join('|');
  if(key!==L.ckey){L.ckey=key;const so=$('#suboff'),sv=so?so.value:null;$('#side-ctrl').innerHTML=sideCtrl();const sn=$('#suboff');if(sn&&sv!=null&&[...sn.options].some(o=>o.value===sv))sn.value=sv;}
  $('#side-stats').innerHTML=sideStats();}

/* pitch view: every attack is played out, and you only learn how it ends when the ball is struck */
let vizRAF=null;
function baseXY(s,si,i){const sl=FORMS[s.form].s[i];const bx=5+(88-sl[3])*0.62;return si===0?[bx,sl[2]]:[100-bx,100-sl[2]];}
const reduceMotion=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const vsf=L=>[0.75,1.3,2.3][L.speed];
const VSP=L=>[0.62,1,1.75][L.speed];
/* the attack frame of a side: it always attacks towards x=100. The same function converts both ways. */
const fr=(si,x,y)=>si===0?[x,y]:[100-x,100-y];
function startViz(){cancelAnimationFrame(vizRAF);const L=UI.live;if(!L)return;
  if(!L.viz){const v={t:0,last:performance.now(),ball:{x:50,y:50,z:0},fl:null,car:null,flash:0,net:0,netSide:1,cap:'',capUntil:0,P:[[],[]],next:0,pos:0,play:null};
    L.m.sides.forEach((s,si)=>{for(let i=0;i<11;i++){const [x,y]=baseXY(s,si,i);v.P[si][i]={x:si===0?Math.min(x,46):Math.max(x,54),y,rx:0,ry:0,rt:0};}});L.viz=v;kickoff(L,0,0,1400);}
  const loop=()=>{const cv=$('#pitchcv');if(!cv||!UI.live)return;stepViz(UI.live);drawPitch(cv,UI.live);vizRAF=requestAnimationFrame(loop);};loop();}
/* the ball goes on the centre spot and one side kicks off. `wait` lets a goal be celebrated first. */
function kickoff(L,side,wait,hold){const v=L.viz;if(!v)return;v.kick={side,at:v.t+(wait||0),until:v.t+(wait||0)+(hold||1100),placed:false};v.fl=null;v.car=null;v.play=null;}
function placeBall(L){const v=L.viz;v.ball={x:50,y:50,z:0};v.fl=null;v.pos=v.kick.side;v.kick.placed=true;v.car={si:v.kick.side,i:kickerOf(L.m.sides[v.kick.side])};}
function kickerOf(s){const sl=FORMS[s.form].s;let k=sl.findIndex(x=>x[0]==='CF');if(k<0)k=sl.findIndex(x=>x[0]==='IF');return k<0?10:k;}
function vzCap(v,t,ms){v.cap=t;v.capUntil=v.t+(ms||1600);}
/* ---- the ball ---- */
function fly(v,to,ms,z,then){v.fl={fx:v.ball.x,fy:v.ball.y,tx:to[0],ty:to[1],t0:v.t,dur:Math.max(120,ms),z:z||0,then};v.car=null;}
function ballStep(v){if(v.fl){const F=v.fl;let k=(v.t-F.t0)/F.dur;if(k>=1)k=1;const e=F.z?k:1-Math.pow(1-k,1.7);v.ball.x=F.fx+(F.tx-F.fx)*e;v.ball.y=F.fy+(F.ty-F.fy)*e;v.ball.z=F.z*4*k*(1-k);
    if(k>=1){v.fl=null;v.ball.z=0;if(F.then)F.then();}}
  else if(v.car){const p=v.P[v.car.si][v.car.i];const d=v.car.si===0?1:-1;v.ball.x+=(p.x+d*1.2-v.ball.x)*0.45;v.ball.y+=(p.y-v.ball.y)*0.45;v.ball.z=0;}}
/* ---- who is where ---- */
function vzIdx(s,roles,lane,not){const F=FORMS[s.form].s;let c=[];F.forEach((sl,i)=>{if(i>0&&(!roles||roles.includes(sl[0]))&&s.xi[i]&&!s.off[s.xi[i]]&&!(not||[]).includes(i))c.push(i);});
  if(!c.length)for(let i=1;i<11;i++)if(s.xi[i]&&!s.off[s.xi[i]]&&!(not||[]).includes(i))c.push(i);if(!c.length)return 1;
  if(lane){const want=lane==='L'?0:lane==='R'?100:50;c.sort((a,b)=>Math.abs(F[a][2]-want)-Math.abs(F[b][2]-want));return rand()<0.75?c[0]:pick(c);}return pick(c);}
function vzLaneOf(s,i){if(i<0)return 'C';const x=FORMS[s.form].s[i][2];return x<38?'L':x>62?'R':'C';}
const edgeY=lane=>lane==='L'?rf(5,14):lane==='R'?rf(86,95):rf(30,70);
function wpick2(W){const t=W.reduce((a,[,w])=>a+w,0);let r=rand()*t;for(const [k,w] of W){r-=w;if(r<=0)return k;}return W[0][0];}
/* ---- the director: turns what the match engine decided into a passage of play ---- */
function vzPlan(L,sh){const m=L.m,a=sh.side,s=m.sides[a];const kind=sh.kind||'open';const T=[];
  const fi=sh.pid?s.xi.indexOf(sh.pid):-1;const f=fi>0?fi:vzIdx(s,['CF','IF']);const lane=vzLaneOf(s,f);const hdr=!!sh.hdr;
  const pass=(to,at,z,ms)=>T.push({t:'pass',to,at,z:z||0,ms:ms||(z?rf(760,980):rf(430,700))});
  const run=(who,at,ms)=>T.push({t:'run',who,at,ms:ms||rf(560,980)});
  const shot=(who,hd)=>T.push({t:'shot',who,hdr:hd,ms:950});
  const box=(n,not)=>{const spots=[[94,43],[91.5,57],[88.5,50],[86,40],[86,61]];const out={};const ex=(not||[]).slice();const list=[];if(!ex.includes(f)){list.push(f);ex.push(f);}
    for(let k=0;k<8&&list.length<n;k++){const c=vzIdx(s,['CF','IF','WG','CH','WH'],null,ex);if(ex.includes(c))break;list.push(c);ex.push(c);}
    list.forEach((i,k)=>{out[i]=spots[k]||[rf(84,90),rf(40,60)];});return out;};
  if(kind==='pen'){const w=vzIdx(s,['WG','IF','CF'],lane);const y=clamp(edgeY(lane),28,72);T.push({t:'start',who:w,at:[rf(64,72),y],box:box(3,[w])});run(w,[85.5,clamp(y,36,64)],rf(700,950));
    T.push({t:'foul',cap:'Penalty!',ms:1000});T.push({t:'setup',mode:'pen',at:[89.5,50],taker:f,cap:'Penalty',ms:1700});shot(f,false);return T;}
  if(kind==='cor'||kind==='short'){const top=rand()<0.5;const tk=vzIdx(s,['WG','IF','WH'],top?'L':'R',[f]);
    T.push({t:'setup',mode:'corner',at:[99.5,top?0.6:99.4],taker:tk,box:box(5,[tk]),cap:kind==='short'?'Short corner':'Corner',ms:rf(1400,1800)});
    if(kind==='short'){const w2=vzIdx(s,['IF','WH','WG'],top?'L':'R',[tk,f]);pass(w2,[93,top?13:87],0,420);run(w2,[86,top?22:78],650);pass(f,[rf(80,86),rf(42,58)],0,480);shot(f,false);return T;}
    const near=s.cornerRoutine==='near'||(s.cornerRoutine!=='far'&&rand()<0.5);const at=near?[94,top?43:57]:[91,top?58:42];pass(f,at,1.15,rf(860,1000));shot(f,true);return T;}
  if(kind==='lt'){const top=lane==='L'||(lane==='C'&&rand()<0.5);const tk=vzIdx(s,['FB','WH','IF'],top?'L':'R',[f]);
    T.push({t:'setup',mode:'throw',at:[rf(80,88),top?0.4:99.6],taker:tk,box:box(4,[tk]),cap:'Long throw',ms:1500});const at=[93.5,top?44:56];pass(f,at,0.95,900);shot(f,true);return T;}
  if(kind==='fk'||kind==='fkx'||kind==='rfk'){const at=[rf(70,79),rf(30,70)];const tk=kind==='fk'?f:vzIdx(s,['IF','WH','WG'],null,[f]);const w=vzIdx(s,['IF','WG','CF'],lane,[tk]);
    T.push({t:'start',who:w,at:[rf(56,62),at[1]+rf(-8,8)]});run(w,[at[0]-1,at[1]],rf(650,850));T.push({t:'foul',cap:'Free kick',ms:850});
    T.push({t:'setup',mode:'fk',at,taker:tk,box:box(4,[tk]),cap:'Free kick',ms:rf(1500,1900)});
    if(kind==='fkx'){const tg=[rf(89,93),rf(42,58)];pass(f,tg,1.0,900);shot(f,true);}
    else if(kind==='rfk'){const w2=vzIdx(s,['IF','WH'],null,[tk,f]);pass(w2,[at[0]+rf(-1,2),at[1]+rf(-9,9)],0,380);pass(f,[at[0]+rf(3,6),at[1]+rf(-7,7)],0,380);shot(f,false);}
    else shot(tk,false);return T;}
  /* open play: the style follows the kind of chance, the flank and the side's instructions */
  const t=s.tac||{};let style=kind==='cnt'?'counter':(kind==='cross'||hdr)?'wing':wpick2([['build',3],['cutin',lane==='C'?0.4:2],['onetwo',2],['long',t.pass===0?3:0.8],['longshot',1.1],['switch',t.width===2?2:0.8],['wing',t.width===2?2.4:1.1],['dribble',1]]);
  const startX=style==='counter'?rf(20,34):style==='long'?rf(12,20):rf(30,46);
  const deep=vzIdx(s,style==='long'?['CH','FB']:['WH','CH','FB'],null,[f]);
  T.push({t:'start',who:deep,at:[startX,rf(22,78)],box:box(style==='wing'||style==='switch'?3:2,[deep]),cap:style==='counter'?'On the break':''});
  let cx=startX;const rec=style==='build'?ri(1,3):style==='counter'?0:ri(0,2);
  for(let r=0;r<rec;r++){const w=vzIdx(s,['WH','IF','FB','CH'],null,[f]);cx=clamp(cx+rf(-8,12),22,60);pass(w,[cx,rf(15,85)]);if(rand()<0.35)run(w,[cx+rf(3,9),rf(18,82)]);}
  const wl=lane==='C'?(rand()<0.5?'L':'R'):lane;const wide=vzIdx(s,['WG','FB','WH'],wl,[f]);const mid=vzIdx(s,['IF','WH'],null,[f]);
  if(style==='build'){pass(mid,[rf(58,68),rf(32,68)]);if(rand()<0.6)run(mid,[rf(68,75),rf(32,68)]);const sp=[rf(82,88),rf(38,62)];pass(f,sp,0,rf(500,660));shot(f,false);}
  else if(style==='onetwo'){pass(f,[rf(66,72),rf(32,68)]);pass(mid,[rf(62,68),rf(32,68)],0,380);const sp=[rf(83,88),rf(40,60)];pass(f,sp,0,480);shot(f,false);}
  else if(style==='cutin'){const w=f;pass(w,[rf(58,64),edgeY(wl)]);run(w,[rf(70,75),wl==='L'?rf(20,28):rf(72,80)],rf(800,1100));run(w,[rf(78,82),wl==='L'?rf(32,38):rf(62,68)],rf(500,700));shot(w,false);}
  else if(style==='wing'){pass(wide,[rf(56,64),edgeY(wl)]);const byline=rand()<0.6;run(wide,[byline?rf(88,92):rf(74,80),wl==='L'?rf(5,12):rf(88,95)],rf(900,1250));
    const at=byline?[rf(90,94),rf(42,58)]:[rf(88,92),rf(40,60)];pass(f,at,byline?0.6:1.05,rf(700,900));shot(f,hdr||rand()<0.6);}
  else if(style==='long'){const cf=vzIdx(s,['CF'],null,[]);pass(cf,[rf(68,74),rf(35,65)],1.3,rf(1000,1200));
    if(cf===f){run(f,[rf(78,84),rf(38,62)],rf(600,800));shot(f,false);}else{const sp=[rf(80,86),rf(36,64)];pass(f,sp,0.35,520);shot(f,false);}}
  else if(style==='longshot'){pass(f,[rf(66,70),rf(36,64)]);run(f,[rf(71,75),rf(36,64)],rf(500,800));shot(f,false);}
  else if(style==='switch'){const other=wl==='L'?'R':'L';const w1=vzIdx(s,['WG','FB','WH'],other,[f]);const w2=vzIdx(s,['WG','FB','WH'],wl,[f,w1]);
    pass(w1,[rf(52,60),edgeY(other)]);pass(w2,[rf(64,70),edgeY(wl)],1.0,rf(1000,1200));run(w2,[rf(82,88),wl==='L'?rf(10,18):rf(82,90)]);const sp=[rf(84,88),rf(44,56)];pass(f,sp,0,420);shot(f,false);}
  else if(style==='dribble'){pass(f,[rf(56,62),rf(30,70)]);run(f,[rf(66,70),rf(25,75)],rf(700,900));run(f,[rf(74,78),rf(35,65)],rf(500,700));run(f,[rf(80,84),rf(40,60)],rf(400,600));shot(f,false);}
  else{const fw=vzIdx(s,['WG','CF','IF'],wl,[f]);pass(fw,[rf(52,60),rf(20,80)],0.5,rf(650,800));run(fw,[rf(70,78),rf(25,75)],rf(700,900));if(fw!==f){const sp=[rf(82,88),rf(38,62)];pass(f,sp,0,420);}shot(f,false);}
  return T;}
/* ---- running the plays ---- */
function vzArm(L){const P=L.pend;clearTimeout(P.fail);const arm=()=>{P.fail=setTimeout(()=>{if(UI.live!==L||L.pend!==P)return;if(L.paused){arm();return;}vzFinish(L);},30000);};arm();}
function vzStart(L,snap,n0){const m=L.m;const q=[];for(let k=n0;k<m.shotLog.length;k++)q.push(k);
  [0,1].forEach(si=>{const won=m.sides[si].corners-snap.st[si].corners;const shown=m.shotLog.slice(n0).filter(x=>x.side===si&&(x.kind==='cor'||x.kind==='short')).length;for(let c=0;c<won-shown;c++){const at=q.findIndex(k=>typeof k==='number'&&m.shotLog[k].side===si&&m.shotLog[k].res!=='goal');q.splice(at<0?q.length:at+1,0,{corner:si});}});
  L.pend={snap,n0,queue:q,cur:null};vzArm(L);vzNext(L);}
function vzDecoy(L,snap){const m=L.m,v=L.viz;const a=rand()<m.pH?0:1;L.pend={snap,n0:m.shotLog.length,queue:[],cur:null,decoy:true};vzArm(L);
  const steps=vzPlan(L,{side:a,res:'none',kind:'open'});steps.pop();steps.push({t:'end',k:pick(['tackle','tackle','offside','claim','clear','intercept']),ms:900});L.pend.cur={steps,i:-1,a,sh:null};L.pend.cur.next=v.t;}
function vzNext(L){const P=L.pend,m=L.m,v=L.viz;if(!P.queue.length){vzAfter(L);return;}const k=P.queue.shift();
  if(typeof k==='object'){const a=k.corner;const steps=vzPlan(L,{side:a,kind:'cor',res:'none'});steps.pop();steps.push({t:'end',k:rand()<0.6?'clear':'claim',ms:1200});P.cur={sh:null,steps,i:-1,a,next:v.t};return;}
  const sh=m.shotLog[k];P.cur={sh,steps:vzPlan(L,sh),i:-1,a:sh.side,next:v.t};}
/* once the last shot of the minute has been seen: the restart, then the clock moves on */
function vzAfter(L){const P=L.pend,v=L.viz;const last=P.cur&&P.cur.sh;const out=P.cur&&P.cur.out;
  if(P.goalSide!=null||!last||!out){vzFinish(L);return;}
  if(out==='wide'||out==='over'){const d=1-last.side;P.cur={steps:[{t:'gkick',ms:1300}],i:-1,a:last.side,next:v.t,sh:null};return;}
  if(out==='catch'){P.cur={steps:[{t:'throwout',ms:900}],i:-1,a:last.side,next:v.t,sh:null};return;}
  vzFinish(L);}
function vzFinish(L){const P=L.pend;if(!P)return;clearTimeout(P.fail);const m=L.m;for(let k=P.n0;k<m.shotLog.length;k++)m.shotLog[k].shown=true;L.pend=null;const v=L.viz;
  if(v){v.play=null;if(P.goalSide!=null)kickoff(L,1-P.goalSide,300,1100);else{v.next=v.t+300;}}
  if(UI.live===L)afterStep(L);}
function vzExec(L,st){const v=L.viz,m=L.m,P=L.pend,C=P.cur,a=C.a,d=1-a;const s=m.sides[a],o=m.sides[d];const to=(x,y)=>fr(a,x,y);
  v.play=v.play||{a,mode:'open'};const PL=v.play;PL.a=a;PL.runT=null;let ms=st.ms||600;
  if(st.t==='start'){PL.mode='open';PL.box=st.box||null;PL.wall=null;PL.taker=null;PL.dive=null;v.pos=a;if(st.cap)vzCap(v,st.cap,1400);
    const at=to(st.at[0],st.at[1]);const far=Math.hypot(v.ball.x-at[0],v.ball.y-at[1]);
    if(v.car&&v.car.si===a&&far<14){PL.rcvT={i:st.who,at:st.at};fly(v,at,rf(380,520),0,()=>{v.car={si:a,i:st.who};PL.rcvT=null;});}
    else{fly(v,at,far>30?rf(520,700):rf(300,450),far>30?0.5:0,()=>{v.car={si:a,i:st.who};PL.rcvT=null;});PL.rcvT={i:st.who,at:st.at};}ms=Math.max(ms,560);}
  else if(st.t==='pass'){PL.rcvT={i:st.to,at:st.at};fly(v,to(st.at[0],st.at[1]),st.ms,st.z,()=>{v.car={si:a,i:st.to};PL.rcvT=null;});}
  else if(st.t==='run'){v.car={si:a,i:st.who};PL.runT={i:st.who,at:st.at};}
  else if(st.t==='foul'){v.car=null;v.fl=null;vzCap(v,st.cap,1300);}
  else if(st.t==='setup'){PL.mode=st.mode;PL.taker=st.taker;PL.box=st.box||PL.box;PL.setAt=st.at;v.fl=null;v.car=null;const at=to(st.at[0],st.at[1]);v.ball={x:at[0],y:at[1],z:0};vzCap(v,st.cap,ms+400);
    if(st.mode==='fk'){const gx=100,gy=50;const dx=gx-st.at[0],dy=gy-st.at[1],dl=Math.hypot(dx,dy);const wx=st.at[0]+dx/dl*8.5,wy=st.at[1]+dy/dl*8.5;const nx=-dy/dl,ny=dx/dl;
      const cands=[];for(let i=1;i<11;i++)if(o.xi[i]&&!o.off[o.xi[i]])cands.push(i);cands.sort((p1,p2)=>{const A=v.P[d][p1],B=v.P[d][p2];return Math.hypot(A.x-at[0],A.y-at[1])-Math.hypot(B.x-at[0],B.y-at[1]);});
      PL.wall={};cands.slice(0,ri(3,4)).forEach((i,k)=>{PL.wall[i]=[wx+nx*(k-1.5)*1.7,wy+ny*(k-1.5)*1.7];});}}
  else if(st.t==='shot'){vzShot(L,st);ms=C.wait||ms;}
  else if(st.t==='end'){vzEnd(L,st);}
  else if(st.t==='gkick'){PL.mode='gkick';const gkAt=to(94.5,rf(38,62));v.car=null;v.fl=null;v.ball={x:gkAt[0],y:gkAt[1],z:0};PL.gkHold=true;vzCap(v,'Goal kick',1200);
    C.steps.splice(C.i+1,0,{t:'punt',ms:1100});}
  else if(st.t==='punt'){PL.gkHold=false;const tgt=to(rf(40,58),rf(20,80));fly(v,tgt,1050,1.4,()=>{const ix=vzNear(v,d,v.ball.x,v.ball.y);v.car={si:d,i:ix};v.pos=d;});PL.mode='open';PL.a=a;}
  else if(st.t==='throwout'){const gk={si:d,i:0};v.car=gk;const tgt=to(rf(70,82),rf(20,80));C.steps.splice(C.i+1,0,{t:'roll',at:tgt,ms:800});}
  else if(st.t==='roll'){const tgt=st.at;fly(v,tgt,700,0.3,()=>{const ix=vzNear(v,d,v.ball.x,v.ball.y);v.car={si:d,i:ix};v.pos=d;});}
  C.next=v.t+ms;}
function vzNear(v,si,x,y,not){let b=1,bd=1e9;v.P[si].forEach((p,i)=>{if(i===0||(not&&not.includes(i)))return;const dd=Math.hypot(p.x-x,p.y-y);if(dd<bd){bd=dd;b=i;}});return b;}
/* the moment of truth */
function vzShot(L,st){const v=L.viz,P=L.pend,C=P.cur,a=C.a,d=1-a,m=L.m;const sh=C.sh;const PL=v.play;const to=(x,y)=>fr(a,x,y);
  const shooter=st.who;const sp=v.P[a][shooter];const [fx,fy]=fr(a,v.ball.x,v.ball.y);
  sh.d=clamp((100-fx)/100,0.02,0.4);const py=to(fx,fy)[1];sh.y=clamp(py/100,0.08,0.92);
  const hd=!!st.hdr;const res=sh.res;let gy=50+rf(-4.4,4.4);let tgt,z=hd?0.12:rf(0,0.3),out='';const dist=Math.hypot(100-fx,50-fy);let dur=Math.max(260,dist/(hd?40:68)*1000);
  if(res==='goal'){tgt=[100.8,clamp(gy,45.4,54.6)];out='goal';}
  else if(res==='save'){tgt=[99,gy];PL.dive={y:gy,from:v.t+dur*0.35};const cn=P.queue.length&&typeof P.queue[0]==='object'&&P.queue[0].corner===a;out=cn?'tipped':rand()<0.55?'catch':'parry';}
  else if(P.queue.length&&(typeof P.queue[0]==='object'?P.queue[0].corner===a:(m.shotLog[P.queue[0]]&&m.shotLog[P.queue[0]].side===a&&['cor','short'].includes(m.shotLog[P.queue[0]].kind)))){out='behind';tgt=[101.5,rand()<0.5?rf(30,42):rf(58,70)];z=rf(0.2,0.6);}
  else{const r=rand();if(r<0.2){out='block';tgt=[fx+(100-fx)*0.25,fy+rf(-3,3)];dur*=0.3;}else if(r<0.3){out='post';tgt=[99.7,rand()<0.5?44.6:55.4];}else if(r<0.6){out='over';tgt=[101.5,rf(45,55)];z=hd?0.4:rf(0.7,1.1);}else{out='wide';tgt=[101.5,rand()<0.5?rf(36,43.4):rf(56.6,64)];}}
  C.out=out;
  fly(v,to(tgt[0],tgt[1]),dur,z,()=>{sh.shown=true;P.shotShown=true;
    if(out==='goal'){v.flash=1;v.net=1;v.netSide=a===0?1:0;P.goalSide=a;C.wait=0;updateLive(false);}
    else if(out==='catch'){v.car={si:d,i:0};}
    else if(out==='tipped'){fly(v,to(101.5,gy<50?rf(38,43):rf(57,62)),380,0.5);vzCap(v,'Tipped behind',1000);}
    else if(out==='parry'){fly(v,to(rf(93,97),gy<50?rf(24,34):rf(66,76)),420,0.35,()=>{const ix=vzNear(v,d,v.ball.x,v.ball.y);v.car={si:d,i:ix};});}
    else if(out==='post'){fly(v,to(rf(88,93),rf(35,65)),480,0.2,()=>{const ix=vzNear(v,d,v.ball.x,v.ball.y);v.car={si:d,i:ix};});}
    else if(out==='block'){const ix=vzNear(v,d,v.ball.x,v.ball.y);fly(v,to(rf(72,80),rand()<0.5?rf(4,15):rf(85,96)),520,0.4);v.P[d][ix].x=v.ball.x;}
    updateLive(false);});
  C.wait=dur+(out==='goal'?1400:out==='catch'?700:600);}
/* attacks that come to nothing */
function vzEnd(L,st){const v=L.viz,P=L.pend,C=P.cur,a=C.a,d=1-a;const to=(x,y)=>fr(a,x,y);const [bx,by]=fr(a,v.ball.x,v.ball.y);
  if(st.k==='offside'){vzCap(v,'Offside',1400);v.fl=null;const ix=vzNear(v,d,v.ball.x,v.ball.y);v.car={si:d,i:ix};v.pos=d;}
  else if(st.k==='claim'){const tg=to(rf(92,95),rf(42,58));fly(v,tg,800,1.0,()=>{v.car={si:d,i:0};v.pos=d;});v.play.dive={y:fr(a,tg[0],tg[1])[1],from:v.t+300};vzCap(v,'',0);}
  else if(st.k==='clear'){const tg=to(rf(86,92),rf(38,62));fly(v,tg,700,0.9,()=>{fly(v,to(rf(55,70),rand()<0.5?rf(2,8):rf(92,98)),700,1.2,()=>{const ix=vzNear(v,d,v.ball.x,v.ball.y);v.car={si:d,i:ix};v.pos=d;});});}
  else if(st.k==='intercept'){const ix=vzNear(v,d,v.ball.x,v.ball.y);const p=v.P[d][ix];fly(v,[p.x,p.y],350,0,()=>{v.car={si:d,i:ix};v.pos=d;});}
  else{const ix=vzNear(v,d,v.ball.x,v.ball.y);v.car={si:d,i:ix};v.pos=d;}
  st.ms=Math.max(st.ms||0,st.k==='clear'?1500:900);}
/* ---- general play between the big moments ---- */
function vzGeneral(L){const v=L.viz,m=L.m;if(v.t<v.next||v.fl)return;const a=v.pos;const s=m.sides[a];v.play=v.play&&v.play.gen?v.play:{a,mode:'open',gen:true};v.play.a=a;
  let car=v.car&&v.car.si===a?v.car.i:null;if(car==null){car=vzNear(v,a,v.ball.x,v.ball.y);v.car={si:a,i:car};v.next=v.t+300;return;}
  const [bx,by]=fr(a,v.ball.x,v.ball.y);const share=a===0?m.pH:1-m.pH;const turn=0.11+(1-share)*0.12+(bx>68?0.25:0);const r=rand();
  if(r<turn){const d=1-a;const ix=vzNear(v,d,v.ball.x,v.ball.y);const p=v.P[d][ix];if(rand()<0.5){v.car={si:d,i:ix};}else fly(v,[p.x,p.y],rf(250,380),0,()=>{v.car={si:d,i:ix};});v.pos=d;v.play={a:d,mode:'open',gen:true};v.next=v.t+rf(350,650);return;}
  if(r<turn+0.28&&bx<74){const at=[clamp(bx+rf(3,11),4,80),clamp(by+rf(-9,9),4,96)];v.play.runT={i:car,at};v.next=v.t+rf(550,1050);return;}
  let best=null,bw=0;v.P[a].forEach((p,i)=>{if(i===car)return;const pid=s.xi[i];if(!pid||s.off[pid])return;const [px,py]=fr(a,p.x,p.y);const dd=Math.hypot(p.x-v.ball.x,p.y-v.ball.y);if(dd<6||dd>48)return;const fw=px-bx;
    let w=(fw>0?1.2+fw/20:0.6)*(i===0?0.1:1)*(px>74?0.25:1)*(0.35+rand());if(dd>28)w*=0.7;if(w>bw){bw=w;best=i;}});
  if(best==null){v.next=v.t+300;return;}const p=v.P[a][best];const [px,py]=fr(a,p.x,p.y);const lead=[clamp(px+rf(1,5),3,82),clamp(py+rf(-4,4),3,97)];const dd=Math.hypot(p.x-v.ball.x,p.y-v.ball.y);const lofted=dd>26&&rand()<0.6;
  v.play.rcvT={i:best,at:lead};const ms=lofted?rf(800,1050):clamp(dd*22,280,800);fly(v,fr(a,lead[0],lead[1]),ms,lofted?rf(0.6,1.1):0,()=>{v.car={si:a,i:best};if(v.play)v.play.rcvT=null;});v.next=v.t+ms+rf(120,420);}
/* ---- where everybody should be ---- */
function vzTargets(L){const v=L.viz,m=L.m,PL=v.play||{a:v.pos,mode:'open'};const a=PL.a,d=1-a;const [bfx,bfy]=fr(a,v.ball.x,v.ball.y);const mode=v.kick?'kick':PL.mode;
  const T=[[],[]];const sA=m.sides[a],sD=m.sides[d];const kickSide=v.kick?v.kick.side:null;
  for(const si of [a,d]){const s=m.sides[si];for(let i=0;i<11;i++){const [px,py]=baseXY(s,si,i);let [x,y]=fr(a,px,py);const att=si===a;const role=FORMS[s.form].s[i][0];let sprint=false;
    if(mode==='kick'){const [kx,ky]=fr(a,px,py);x=kx;y=ky;const own=si===a?Math.min(x,46):Math.max(x,54);x=own;if(si===kickSide&&i===kickerOf(s)){x=si===a?48.5:51.5;y=50;}T[si][i]=[...fr(a,x,y),false];continue;}
    if(att){
      if(i===0){x=5+Math.max(0,bfx-50)*0.2;y=50+(bfy-50)*0.1;}
      else if(mode==='pen'){x=rf(0,0)+80.5;y=20+i*5.5;if(i===PL.taker){x=86.5;y=50;}}
      else if(mode==='corner'||mode==='throw'||mode==='fk'){if(i===PL.taker){const sa=PL.setAt;x=sa[0]-(mode==='fk'?1.5:0.6);y=sa[1]+(sa[1]<50?-0.8:0.8)*(mode==='fk'?0:1);}else if(PL.box&&PL.box[i]){[x,y]=PL.box[i];if(mode==='fk'){x=Math.min(x,87);}sprint=true;}else{x=role==='FB'||role==='CH'?rf(0,0)+52+(i%3)*4:76+(i%4)*1.5;}}
      else if(mode==='gkick'){x=x*0.55+18;}
      else{x=x+(bfx-45)*0.62+4;y=y+(bfy-50)*0.24;if(bfx>66&&PL.box&&PL.box[i]){[x,y]=PL.box[i];sprint=true;}x=Math.min(x,94);}
    }else{
      if(i===0){x=99-(bfx>85?(bfx-85)*0.12:0);y=50+(bfy-50)*(mode==='pen'?0:0.16);if(PL.dive&&v.t>=PL.dive.from){x=99.1;y=PL.dive.y;sprint='dive';}if(mode==='gkick'&&PL.gkHold){[x,y]=[bfx-0.8,bfy];}}
      else if(mode==='pen'){x=81;y=22+i*5.6;}
      else if(PL.wall&&PL.wall[i]){[x,y]=PL.wall[i];sprint=true;}
      else{x=Math.max(x+(bfx-50)*0.45,mode==='corner'||mode==='throw'?82:0);y=y+(bfy-y)*0.25;if(['FB','CH'].includes(role))x=Math.min(97,Math.max(x,bfx+2));}
    }
    if(!att&&i>0&&!(PL.wall&&PL.wall[i])&&mode!=='pen'){/* marking the runners */
      if(PL.box&&(bfx>66||mode==='corner'||mode==='throw'||mode==='fk')){const keys=Object.keys(PL.box).map(Number);const mk=keys[i%Math.max(1,keys.length)];if(['CH','FB','WH'].includes(FORMS[sD.form].s[i][0])&&mk!=null&&v.P[a][mk]){const [rx,ry]=fr(a,v.P[a][mk].x,v.P[a][mk].y);x=rx+1.3;y=ry+(i%2?0.9:-0.9);sprint=true;}}}
    if(mode==='corner'&&!att&&(i===2||i===3)){x=99.3;y=i===2?45:55;}
    x=clamp(x,1,99.6);y=clamp(y,1,99);T[si][i]=[...fr(a,x,y),sprint];}}
  /* the man on the ball, the man running onto it, and the one closing him down */
  if(mode!=='kick'&&mode!=='pen'&&mode!=='corner'&&mode!=='fk'&&mode!=='throw'){
    if(PL.runT){const t2=PL.runT;T[a][t2.i]=[...fr(a,t2.at[0],t2.at[1]),true];}
    if(PL.rcvT){const t2=PL.rcvT;T[a][t2.i]=[...fr(a,t2.at[0],t2.at[1]),true];}
    if(v.car){const c=v.car;if(!(PL.runT&&PL.runT.i===c.i&&c.si===a)){const p=v.P[c.si][c.i];T[c.si][c.i]=[p.x,p.y,false];}
      const opp=1-c.si;const pr=vzNear(v,opp,v.ball.x,v.ball.y);const dir=c.si===0?1:-1;T[opp][pr]=[v.ball.x+dir*1.6,v.ball.y,true];}}
  if(mode==='pen'&&PL.taker!=null){const [tx,ty]=fr(a,86.5,50);T[a][PL.taker]=[tx,ty,false];}
  return T;}
function stepViz(L){const v=L.viz,m=L.m;const now=performance.now();const dt=Math.min(60,now-v.last);v.last=now;if(L.paused)return;const f=dt/16.7*VSP(L);v.t+=dt*VSP(L);
  const K=v.kick;if(K){if(!K.placed&&v.t>=K.at)placeBall(L);if(v.t>=K.until){v.kick=null;v.next=v.t;v.play={a:K.side,mode:'open',gen:true};const s=m.sides[K.side];const back=vzIdx(s,['WH','IF'],null,[]);const at=fr(K.side,rf(38,44),rf(35,65));v.play.rcvT={i:back,at:fr(K.side,at[0],at[1])};fly(v,at,450,0,()=>{v.car={si:K.side,i:back};if(v.play)v.play.rcvT=null;});v.next=v.t+700;}}
  if(L.pend&&L.pend.cur){const C=L.pend.cur;if(v.t>=C.next){C.i++;if(C.i<C.steps.length)vzExec(L,C.steps[C.i]);else vzNext(L);}}
  else if(!L.pend&&!v.kick&&!m.done&&!L.ht)vzGeneral(L);
  if(!L.pend&&(m.done||L.ht)){ballStep(v);return;}
  ballStep(v);
  const T=vzTargets(L);
  m.sides.forEach((s,si)=>{v.P[si].forEach((p,i)=>{const tg=T[si][i];if(!tg)return;let [tx,ty,spr]=tg;
      if(v.t>p.rt){p.rt=v.t+rf(1200,3400);p.rx=rf(-2.5,2.5);p.ry=rf(-4,4);}
      const isCar=v.car&&v.car.si===si&&v.car.i===i;if(!spr&&!isCar&&i>0){tx+=p.rx;ty+=p.ry;}
      tx=clamp(tx,1,99.6);ty=clamp(ty,1,99);const dx=tx-p.x,dy=ty-p.y,dist=Math.hypot(dx,dy);if(dist<0.05)return;
      const tired=1-Math.min(0.25,(s.tire||0)*3);const base=(s.hob[s.xi[i]]?0.12:0.36)*tired;const mx=(spr==='dive'?2.2:spr?0.62:isCar?0.5:base)*f*(v.kick?1.8:1);
      const mv=Math.min(dist,mx,dist*0.12*f+0.03);p.x+=dx/dist*mv;p.y+=dy/dist*mv;});});}
function cssv(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
function drawPitch(cv,L){const dpr=window.devicePixelRatio||1;const W=cv.clientWidth;if(!W)return;const H=Math.round(W*0.6);
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cv.style.height=H+'px';}
  const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);const m=L.m,v=L.viz;
  const pad=W*0.035,pw=W-2*pad,ph=H-2*pad;const X=p=>pad+p/100*pw,Y=p=>pad+p/100*ph;
  const p1=cssv('--pitch')||'#2f6a38',p2=cssv('--pitch2')||'#2a6032';
  for(let i=0;i<12;i++){c.fillStyle=i%2?p1:p2;c.fillRect(W*i/12,0,W/12+1,H);}
  c.strokeStyle='rgba(255,255,255,.72)';c.lineWidth=1.6;c.strokeRect(X(0),Y(0),pw,ph);
  c.beginPath();c.moveTo(X(50),Y(0));c.lineTo(X(50),Y(100));c.stroke();c.beginPath();c.arc(X(50),Y(50),ph*0.14,0,Math.PI*2);c.stroke();
  c.fillStyle='rgba(255,255,255,.8)';[10.5,89.5].forEach(x=>{c.beginPath();c.arc(X(x),Y(50),1.6,0,Math.PI*2);c.fill();});
  [1,-1].forEach(d=>{c.strokeRect(d>0?X(0):X(100-15.7),Y(20.4),pw*0.157,ph*0.592);c.strokeRect(d>0?X(0):X(100-5.2),Y(36.8),pw*0.052,ph*0.264);
    const gx=d>0?X(0)-pad*0.55:X(100);c.fillStyle='rgba(255,255,255,.85)';c.fillRect(gx,Y(44.6),pad*0.55,ph*0.108);
    const side=d>0?0:1;if(v.net>0&&v.netSide===side){c.strokeStyle=`rgba(255,255,255,${0.9*v.net})`;c.lineWidth=1;const bul=pad*0.5*v.net;for(let k=0;k<=6;k++){const yy=Y(44.6)+ph*0.108*k/6;c.beginPath();c.moveTo(d>0?X(0):X(100),yy);c.quadraticCurveTo(d>0?X(0)-pad*0.55-bul:X(100)+pad*0.55+bul,Y(50),d>0?X(0):X(100),yy);c.stroke();}c.strokeStyle='rgba(255,255,255,.72)';c.lineWidth=1.6;}});
  [[0,0,0],[100,0,0.5],[100,100,1],[0,100,1.5]].forEach(([fx,fy,a0])=>{c.strokeStyle='rgba(255,255,255,.6)';c.beginPath();c.arc(X(fx),Y(fy),4,a0*Math.PI,(a0+0.5)*Math.PI,false);c.stroke();});
  if(v.net>0)v.net=Math.max(0,v.net-0.012);
  const r=Math.max(4,W*0.0115);
  m.shotLog.forEach((s,si0)=>{if(L.pend&&si0>=L.pend.n0&&!s.shown)return;const x=X(s.side===0?100-s.d*100:s.d*100),y=Y(s.y*100);c.lineWidth=2;
    if(s.res==='goal'){c.fillStyle='#f2c14e';c.strokeStyle='#151513';c.beginPath();c.arc(x,y,r*0.9,0,Math.PI*2);c.fill();c.stroke();}
    else if(s.res==='save'){c.strokeStyle='rgba(255,255,255,.9)';c.beginPath();c.moveTo(x-r*.7,y-r*.7);c.lineTo(x+r*.7,y+r*.7);c.moveTo(x+r*.7,y-r*.7);c.lineTo(x-r*.7,y+r*.7);c.stroke();}
    else{c.strokeStyle='rgba(255,255,255,.75)';c.beginPath();c.arc(x,y,r*0.7,0,Math.PI*2);c.stroke();}});
  m.sides.forEach((s,si)=>{const cl=club(s.cid);const cols=si===1&&hexDist(club(m.sides[0].cid).c1,cl.c1)<110?kitColours(s.cid,true):[cl.c1,cl.c2];v.P[si].forEach((p,i)=>{const pid=s.xi[i];if(!pid||s.off[pid])return;
    c.globalAlpha=s.hob[pid]?0.5:1;c.fillStyle='rgba(0,0,0,.22)';c.beginPath();c.ellipse(X(p.x)+1.5,Y(p.y)+2.5,r*0.9,r*0.5,0,0,Math.PI*2);c.fill();
    const gk=i===0;c.fillStyle=gk?(si===0?'#2f7d3a':'#d8b225'):cols[0];c.strokeStyle=gk?'#151513':cols[1];c.lineWidth=2.2;c.beginPath();c.arc(X(p.x),Y(p.y),r,0,Math.PI*2);c.fill();c.stroke();c.globalAlpha=1;});});
  const B=v.ball,lift=B.z*ph*0.07;c.fillStyle=`rgba(0,0,0,${0.28-Math.min(0.15,B.z*0.08)})`;c.beginPath();c.ellipse(X(B.x)+2,Y(B.y)+3,r*0.6*(1+B.z*0.15),r*0.35*(1+B.z*0.15),0,0,Math.PI*2);c.fill();
  c.fillStyle='#fffdf5';c.strokeStyle='#151513';c.lineWidth=1.5;c.beginPath();c.arc(X(B.x),Y(B.y)-lift,r*0.62*(1+B.z*0.35),0,Math.PI*2);c.fill();c.stroke();
  if(v.cap&&v.t<v.capUntil){c.font=`700 ${Math.max(11,Math.round(H*0.045))}px 'Archivo Narrow', Arial, sans-serif`;c.textAlign='left';c.textBaseline='top';const tw=c.measureText(v.cap.toUpperCase()).width;
    c.fillStyle='rgba(21,21,19,.82)';c.fillRect(pad+6,pad+6,tw+18,Math.round(H*0.045)+12);c.fillStyle='#f2c14e';c.fillText(v.cap.toUpperCase(),pad+15,pad+12);}
  if(v.flash>0){c.globalAlpha=Math.min(1,v.flash*1.6);c.font=`${Math.round(H*0.2)}px 'Alfa Slab One', Georgia, serif`;c.textAlign='center';c.textBaseline='middle';
    c.lineWidth=6;c.strokeStyle='#151513';c.strokeText('GOAL!',W/2,H/2);c.fillStyle='#f2c14e';c.fillText('GOAL!',W/2,H/2);c.globalAlpha=1;v.flash-=reduceMotion()?0.05:0.01;}
}

function startLive(){const f=G.fx.find(x=>x.date===G.date&&!x.p&&isUserFx(x));if(!f)return;const m=newMatch(f,true);
  UI.live={m,speed:UI.live?UI.live.speed:1,timer:null,paused:false,shown:0,ht:false,htDone:false};UI.screen='live';render();tick();window.scrollTo(0,0);}
function tick(){const L=UI.live;if(!L)return;clearTimeout(L.timer);if(L.pend||L.m.done||L.paused||L.ht)return;
  const kw=L.viz&&L.viz.kick?Math.max(0,(L.viz.kick.until-L.viz.t)/VSP(L)):0;
  L.timer=setTimeout(()=>{if(UI.live!==L||L.pend)return;const m=L.m;const snap=liveSnap(m);const n0=m.shotLog.length;mStep(m);
    const vis=L.viz&&document.getElementById('pitchcv');
    if(vis&&m.shotLog.length>n0){vzStart(L,snap,n0);updateLive(false);return;}
    if(vis&&!m.done&&m.min!==45&&m.min<89&&rand()<0.045){vzDecoy(L,snap);updateLive(false);return;}
    afterStep(L);},[650,260,60][L.speed]+kw);}
function afterStep(L){const m=L.m;if(m.min===45&&!m.done&&!L.htDone){L.ht=true;if(L.viz){const v=L.viz;v.ball={x:50,y:50,z:0};v.fl=null;v.car=null;v.kick=null;v.play=null;}}if(m.done)endLive();updateLive(false);tick();}
function liveSnap(m){return {sc:m.sc.slice(),ev:m.ev.length,goals:m.goals.length,st:m.sides.map(s=>({shots:s.shots,sot:s.sot,corners:s.corners}))};}
const TALK={calm:[[1.02,'Calm heads. The lads go back out composed.'],[1.01,'A steady word. They go out focused.'],[0.99,'Too calm. They look flat going back out.']],
 enc:[[1.01,'Plenty of encouragement. The lads nod along.'],[1.02,'You gee them up. They come out bouncing.'],[1.015,'Heads up, lads. There is a bit more belief about them.']]};
function applyTalk(k){const L=UI.live;const m=L.m;const s=m.sides[m.us];const d=m.sc[m.us]-m.sc[1-m.us];const idx=d>0?0:d===0?1:2;let tt,txt;
  if(k==='hair'){const ok=rand()<[0.3,0.6,0.7][idx];tt=ok?[1.0,1.03,1.04][idx]:[0.98,0.98,0.97][idx];txt=ok?'The teacups fly. The players come out like men possessed.':'You tear strips off them. Heads drop. That may have backfired.';s.played.forEach(p=>{const pl=G.players[p];if(pl)pl.mor=clamp(pl.mor+(ok?3:-5),5,100);});}
  else{[tt,txt]=TALK[k][idx];}
  s.tt=tt;s.str=strength(s);addEv(m,m.us,'talk',`Team talk: ${txt}`);L.ht=false;L.htDone=true;if(L.viz)kickoff(L,1,0,1300);updateLive(false);tick();}
function endLive(){const L=UI.live;if(L.ended)return;
  if(L.m.fx.rpl&&L.m.sc[0]===L.m.sc[1]&&!L.m.aet){const m=L.m;const fi=m.ev.findIndex(e=>e.k==='ft');if(fi>-1)m.ev.splice(fi,1);addEv(m,-1,'et',T.et);m.max=120;m.done=false;m.aet=true;updateLive(false);tick();return;}L.ended=true;clearTimeout(L.timer);L.ht=false;const f=L.m.fx;finalize(L.m);if(f.comp!=='L'){resolveTie(f);if(f.rep)addEv(L.m,-1,'ft',f.rep);}playDay(G.date);updateLive(false);}

/* ---- results (vidiprinter) ---- */
function classified(date,anim){const list=G.fx.filter(f=>f.date===date&&f.p);const groups=[];
  const cup=list.filter(f=>f.comp==='FA');if(cup.length)groups.push([`FA Cup ${CUPR[cup[0].r]}`,cup]);
  const lc=list.filter(f=>f.comp==='LC');if(lc.length)groups.push([`League Cup ${LCR[lc[0].r]}${lc[0].leg?(lc[0].leg===1?' first leg':' second leg'):''}`,lc]);
  const eu=list.filter(f=>f.comp==='EU');if(eu.length)groups.push([`${EUN[eu[0].eu]} ${EUR[eu[0].r]}`,eu]);
  for(let d=0;d<4;d++){const l=list.filter(f=>f.comp==='L'&&f.div===d);if(l.length)groups.push([`League ${DIVN[d]}`,l]);}
  if(!groups.length)return '<p class="muted">No results.</p>';
  return `<div class="vidi ${anim?'anim':''}">${groups.map(([t,l])=>`<div class="vg"><p class="vh">${esc(t.toUpperCase())}</p>${l.map(f=>`<div class="vl ${isUserFx(f)?'me':''}"><span class="vhm">${esc(cn(f.h).toUpperCase())}</span><span class="vs1">${f.hg}</span><span class="vam">${esc(cn(f.a).toUpperCase())}</span><span class="vs2">${f.ag}${f.aet?' AET':''}</span>${f.rep?`<span class="vrep">${esc(f.rep.toUpperCase())}</span>`:''}</div>`).join('')}</div>`).join('')}</div>`;}
function vResults(){const d=UI.resDate||G.date;const my=G.fx.find(f=>f.date===d&&f.p&&isUserFx(f));
  let head='';if(my){const r=resFor(my,U());head=`<p class="banner r${r}">${r==='W'?'A win':r==='L'?'A defeat':'A draw'}: ${esc(cn(my.h))} ${my.hg}-${my.ag} ${esc(cn(my.a))}${my.aet?' (a.e.t.)':''}${my.ev&&my.ev.length?`. <small>${my.ev.map(e=>`${esc(e[2])} ${e[0]}'${e[3]==='og'?' o.g.':e[3]==='pen'?' pen':''}`).join(', ')}</small>`:''}${my.rep?` <small>${esc(my.rep)}</small>`:''}</p>`;}
  const back=UI.mdBack?'<p class="mdback">Your usual team and tactics are back in place after the match-day changes.</p>':'';return `<section class="panel"><div class="ph"><h2 class="h1">Classified results</h2><p class="muted">${fmtDate(d)}</p></div>${head}${back}${classified(d,true)}<div class="row gap center"><button class="btn" data-a="printall" title="Skip the teleprinter and show every result at once">Show all results now ▸▸</button>${my&&my.an?`<button class="btn" data-a="chalk" data-id="${my.id}">View the match report on the chalkboard</button>`:''}<button class="btn go big" data-a="resdone">Back to the office ▸</button></div></section>`;}
let printTimer=null;
function startPrinter(){clearInterval(printTimer);const lines=[...document.querySelectorAll('.vidi.anim .vl, .vidi.anim .vh')];
  const hideBtn=()=>{const b=document.querySelector('[data-a="printall"]');if(b)b.style.visibility='hidden';};if(!lines.length){hideBtn();return;}
  let i=0;printTimer=setInterval(()=>{if(i>=lines.length){clearInterval(printTimer);hideBtn();return;}lines[i++].classList.add('shown');},45);}

/* ---- season summary ---- */
function vSeason(){const s=G.summary;if(!s){UI.screen='game';return vTab();}const u=s.user;const real=DATA.real[s.y];const end=s.y===1969;
  return `<div class="season"><section class="panel"><p class="eyebrow">End of season ${seasonLbl(s.y)}</p><h2 class="h1 big">${esc(cn(s.champs[0]))} are champions</h2>
  ${end?`<p class="banner">That's the Sixties. You managed through the decade of the maximum wage, the Big Freeze and 1966. Carry on into the Seventies if you like: the history book runs out, but the football doesn't.</p>`:''}
  <div class="grid4">${DIVN.map((d,i)=>`<div class="stat"><small>${d}</small><strong>${crest(s.champs[i],'sm')} ${esc(cn(s.champs[i]))}</strong><span>Runners-up: ${esc(cn(s.runners[i]))}</span>${s.scor[i]?`<span>Top scorer: ${esc(s.scor[i].n)} (${s.scor[i].g})</span>`:''}</div>`).join('')}</div>
  ${s.lc?`<p><strong>League Cup:</strong> ${esc(cn(s.lc))}</p>`:''}${s.eu&&Object.keys(s.eu).length?`<p><strong>Europe:</strong> ${Object.entries(s.eu).map(([k,v])=>`${EUN[k]}: ${esc(cn(v)||(EUCLUBS.find(r=>r[0]===v)||[])[1]||v)}`).join(' · ')}</p>`:''}
  <p><strong>FA Cup:</strong> ${esc(cn(s.cup))}${s.final?` beat ${esc(cn(s.final.w===s.final.h?s.final.a:s.final.h))}. ${esc(cupLine(s.final))}`:''}</p>
  <p><strong>Promoted:</strong> ${s.promoted.flat().map(cn).map(esc).join(', ')}.<br><strong>Relegated:</strong> ${s.relegated.flat().map(cn).map(esc).join(', ')}.<br><strong>Re-elected to the League:</strong> ${s.reel.map(cn).map(esc).join(', ')}.</p>
  ${real?`<p class="realnote"><strong>In real life:</strong> ${esc(rn(real.d1))} won the title and ${esc(rn(real.fa))} the Cup. ${esc(real.note)}</p>`:''}</section>
  <section class="panel"><h3 class="h2 first">Your season</h3><p>${esc(cn(u.club))} finished <strong>${ord(u.pos)}</strong> in ${DIVN[u.div]} with ${u.pts} points. The board expected ${ord(u.exp)}.${u.promoted?' <strong>Promoted!</strong>':''}${u.relegated?' <strong>Relegated.</strong>':''} FA Cup: ${esc(u.cup)}.${G.user.career.length&&G.user.career[G.user.career.length-1].lc?` League Cup: ${esc(G.user.career[G.user.career.length-1].lc)}.`:''}${G.user.career.length&&G.user.career[G.user.career.length-1].eu?` ${esc(G.user.career[G.user.career.length-1].eu)}.`:''}</p>
  <p>Board confidence: <strong>${confText(u.conf)}</strong> (${Math.round(u.conf)}/100).${s.repUp?` A high finish has raised the club's standing: reputation up ${s.repUp}, to ${Math.round(club(u.club).rep)}. Bigger crowds and better players will follow.`:''}</p>
  <div class="row gap center"><button class="btn go big" data-a="seasondone">${G.sacked?'Face the music':'On to '+seasonLbl(G.year)} ▸</button></div></section></div>`;}
function vSacked(){const offers=G.jobOffers||[];
  return `<section class="panel narrow"><p class="eyebrow">The Evening Chronicle</p><h2 class="h1 big">SACKED</h2><p>The board of ${esc(cn(U()))} have dispensed with your services. You clear your desk, hand back the keys to the Ford Anglia and go home to wait for the telephone to ring.</p>
  <p>A few clubs have been in touch:</p><div class="clubgrid">${offers.map(id=>`<button class="clubbtn" data-a="takejob" data-id="${id}">${crest(id)}<span><strong>${esc(cn(id))}</strong><small>${DIVN[club(id).div]} · ${esc(club(id).g)}</small></span></button>`).join('')}</div>
  <button class="btn" data-a="toTitle">Retire to the golf club (title screen)</button></section>`;}

/* ---- modal: player ---- */
/* redraw a pop-up without losing your place in it: the scroll positions come back if it is the same pop-up */
const SCROLLSEL='.card,.presscard,.chalk,.blueprint,.fposter,.bidcard,.talkcard,.letter,.chairletter,.newspaper,.np-page,.radiocard,.tw,[data-keep]';
function setBoxHTML(box,h,key){const same=box._k===key;const top=box.scrollTop;const qa=()=>box.querySelectorAll?[...(box.querySelectorAll(SCROLLSEL)||[])]:[];const inner=qa().map(e=>e.scrollTop);
  box.innerHTML=h;box._k=key;if(!same)return;box.scrollTop=top;qa().forEach((e,i)=>{if(inner[i])e.scrollTop=inner[i];});}
function renderModal(){if(typeof document==='undefined')return;const box=$('#modal');if(!box)return;const md=UI.modal;if(!md){box.hidden=true;box.innerHTML='';box._k=null;return;}box.hidden=false;
  const p=G.players[md.pid];if(!p){UI.modal=null;box.hidden=true;return;}
  if(md.view==='club'||md.view==='player'){setBoxHTML(box,fixPoss(negRoomHTML(p,md)),'n'+md.view+md.pid);return;}
  const mine=p.c===U();const c=p.c&&p.c!=='ABR'?club(p.c):null;
  let actions='';
  if(mine&&md.renew){actions=negHTML(p,md);}
  else if(mine&&p.acad){actions=`<p class="muted sm">In the academy. He cannot play for the first team until he is promoted.</p><div class="row gap wrap"><button class="btn go" data-a="promote" data-id="${p.id}">Promote to the first team</button>${md.confirmRel?`<button class="btn ghost" data-a="release" data-id="${p.id}">Yes, let him go</button>`:`<button class="btn ghost" data-a="release" data-id="${p.id}">Let him go</button>`}</div>`;}
  else if(mine){actions=`<div class="row gap wrap"><button class="btn go" data-a="renew" data-id="${p.id}">Offer a new contract</button>${G.user.capt!==p.id?`<button class="btn" data-a="captain" data-id="${p.id}">Make him captain</button>`:''}<button class="btn" data-a="list" data-id="${p.id}">${p.listed?'Take off the list':'Put on the transfer list'}</button>${ftSize()>16?`<button class="btn ghost" data-a="release" data-id="${p.id}">${md.confirmRel?'Yes, release him':'Release on a free'}</button>`:''}</div>`;}
  else if(!p.ret&&!p.ban&&abroadBlock(p)){actions=`<p class="stamp">${esc(abroadBlock(p))}</p>`;}
  else if(!p.ret&&!p.ban){const D=p.c?dealOf(p):null;actions=G.deadline?`<p class="muted">The transfer deadline has passed.</p>`:!p.c?`<div class="row gap wrap"><button class="btn go" data-a="negplayer" data-id="${p.id}">He is a free agent: offer him terms</button></div>`:D?`<div class="negdeal"><p><strong>Fee agreed:</strong> ${money(D.fee)} with ${esc(D.seller)}, until ${fmtDate(D.exp,true)}.</p><button class="btn go" data-a="negplayer" data-id="${p.id}">Talk terms with ${esc(nm(p.id))}</button></div>`:`<div class="row gap wrap"><button class="btn go" data-a="negclub" data-id="${p.id}">Make an approach to ${esc(sellerN(p))}</button></div><small class="muted">Agree a fee with the club first; then talk terms with the player.</small>`;}
  if(!mine&&!p.ret&&!p.eu&&!p.trial&&p.n!=='Pelé')actions=`<p><button class="btn ghost sm" data-a="shortlist" data-id="${p.id}">${(G.user.short||[]).includes(p.id)?'Take off the shortlist':'Add to shortlist'}</button></p>`+actions;
  if(false){const ask=0,dem=0;
    actions=G.deadline?`<p class="muted">The transfer deadline has passed.</p>`:md.stage==='terms'?`<p>${p.c?`Fee agreed at ${money(md.fee)}. `:''}${esc(p.n)} wants <strong>£${dem} a week</strong>.</p><div class="row gap"><button class="btn go" data-a="sign" data-id="${p.id}">Agree terms and sign him</button><button class="btn" data-a="closeModal">Walk away</button></div>`:
    md.stage==='done'?'':
    `<div class="bid"><label class="lbl" for="bid-fee">${p.c?`Your offer to ${esc(sellerN(p))} (they value him at ${money(ask)})`:'He is a free agent. No fee needed.'}</label>${p.c?`<input id="bid-fee" class="inp" type="number" min="0" step="250" value="${md.fee||ask}">`:''}<button class="btn go" data-a="bid" data-id="${p.id}">${p.c?'Make offer':'Offer terms'}</button><small class="muted">Transfer budget ${money(G.user.budget.transfer)}</small></div>`;}
  const hist=p.hist.map(h=>`${h.y}: ${h.from==='ABR'?'from abroad':esc(cn(h.from)||'free')} to ${h.to==='ABR'?'abroad':esc(cn(h.to))}${h.fee?` (${money(h.fee)})`:''}`).join('<br>');
  setBoxHTML(box,fixPoss(`<div class="scrim" data-a="closeModal"></div><div class="card" role="dialog" aria-modal="true" aria-label="${esc(p.n)}">
   <button class="x" data-a="closeModal" aria-label="Close">×</button>
   <div class="card-h">${c?crest(c.id,'lg'):''}<div><p class="eyebrow">${p.acad?'<span class="acadtag">Academy</span> ':''}${POSN[p.pos]}${altOf(p).length?` <span class="alsopl">· also ${altOf(p).map(x=>POSN[x].toLowerCase()).join(', ')}</span>`:''}</p><h2 class="h1">${esc(p.n)}</h2><p class="muted">${c?esc(c.n):p.c==='ABR'?'Playing abroad ('+esc(p.abroad||'')+')':p.ret?(p.ban?'Banned':'Retired'):'Free agent'} · Age ${age(p)} · Born ${p.b}</p></div></div>
   <dl class="dl"><div><dt>Ability</dt><dd>${mine?bar(p.ca):barK(p)}${mine?'':` <small class="muted">scouted ${knowOf(p)}%</small>`}</dd></div><div><dt>Potential</dt><dd>${mine?potHTML(p):potK(p)}</dd></div><div><dt>Value</dt><dd>${money(valueOf(p))}</dd></div><div><dt>Wage</dt><dd>£${p.c?p.w:wageFor(p)} a week</dd></div>${mine&&G.user.capt===p.id?`<div><dt>Role</dt><dd>Club captain${isLeader(p)?', and a natural leader':''}</dd></div>`:''}${mine?`<div><dt>Relationship with you</dt><dd>${relWord(relOf(p))}</dd></div>`:''}${p.c&&p.c!=='ABR'&&p.until!=null?`<div><dt>Contract</dt><dd>Until summer ${conEnds(p)}${p.until<=G.year?' <span class="inj">Expiring</span>':''}</dd></div>`:''}<div><dt>Fitness</dt><dd>${Math.round(p.fit)}%</dd></div>${availWhy(p)?`<div><dt>Unavailable</dt><dd class="neg">${esc(availWhy(p))}</dd></div>`:''}${p.bks||p.offs?`<div><dt>Discipline</dt><dd>${p.bks||0} caution${p.bks===1?'':'s'} this season${p.offs?`, ${p.offs} sending${p.offs===1?'':'s'}-off in his career`:''}${isSusp(p)?` · suspended until ${fmtDate(p.drop,true)}`:''}</dd></div>`:''}<div><dt>Morale</dt><dd>${moraleWord(p.mor)}${mine&&p.moodWhy&&p.moodWhy.length?`<small class="moodwhy">${p.moodWhy.map(esc).join(' · ')}</small>`:''}</dd></div><div><dt>This season</dt><dd>${plu(p.apps,'app')}, ${plu(p.gls,'goal')}, ${plu(p.ast||0,'assist')}, ${plu(p.tkl||0,'tackle')}, avg ${avgR(p)}</dd></div><div><dt>Career (in game)</dt><dd>${plu(p.car.a,'app')}, ${plu(p.car.g,'goal')}</dd></div></dl>${traitFull(p)}
   ${p.real?`<p class="muted sm">A real player of the period${p.nat&&!UKN.includes(p.nat)?`, from ${esc(p.nat)}`:''}.</p>`:''}${overseas(p)?'<p class="muted sm">Strictly, League rules of the day required a foreign player to have lived in Britain for two years before he could play. The game turns a blind eye. Expect him to want higher wages to cope with the weather.</p>':''}${hist?`<p class="sm">${hist}</p>`:''}${honoursHTML(p)}
   ${md.note?`<p class="stamp">${esc(md.note)}</p>`:''}${actions}</div>`),'m'+md.pid);}

/* ---- overlays: press conference and newspaper ---- */
/* people: cel-shaded poster illustrations with heavy ink and hard shadows, in the manner of late-Sixties crime-caper art */
const K='#15120f';
const SW=w=>`stroke="${K}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const mirror=s=>`<g transform="translate(240 0) scale(-1 1)">${s}</g>`;
const FACE={
 normal:'M80 92 C80 58 98 40 120 40 C142 40 160 58 160 92 C161 110 158 124 153 136 C146 154 134 166 120 168 C106 166 94 154 87 136 C82 124 79 110 80 92Z',
 round:'M76 94 C76 58 96 40 120 40 C144 40 164 58 164 94 C166 116 162 132 156 144 C148 160 134 170 120 171 C106 170 92 160 84 144 C78 132 74 116 76 94Z',
 square:'M79 90 C79 56 98 40 120 40 C142 40 161 56 161 90 C162 112 161 128 157 141 C151 157 137 165 120 166 C103 165 89 157 83 141 C79 128 78 112 79 90Z',
 fem:'M83 94 C83 60 100 44 120 44 C140 44 157 60 157 94 C157 114 153 130 146 143 C139 157 130 165 120 166 C110 165 101 157 94 143 C87 130 83 114 83 94Z'};
function panelBG(o,id){const W=240,H=300;
  if(o.bg==='jack'){return `<rect width="${W}" height="${H}" fill="#1f3a8a"/><path d="M0 0 L240 300 M240 0 L0 300" stroke="#f3efe6" stroke-width="46"/><path d="M0 0 L240 300 M240 0 L0 300" stroke="#c8202f" stroke-width="16"/><path d="M120 0 V300 M0 150 H240" stroke="#f3efe6" stroke-width="64"/><path d="M120 0 V300 M0 150 H240" stroke="#c8202f" stroke-width="38"/><rect width="${W}" height="${H}" fill="url(#ht-${id})" opacity=".55"/>`;}
  return `<rect width="${W}" height="${H}" fill="${o.bg}"/><path d="M0 210 L240 60 L240 300 L0 300Z" fill="${o.bg2}"/><rect width="${W}" height="${H}" fill="url(#ht-${id})" opacity=".5"/>`;}
function eyesArt(o,id){const sq=o.eyes==='squint';const h=sq?4.1:5;const iris=o.iris||'#5a7fb5';
  const one=`<clipPath id="ec-${id}"><path d="M93 104 Q104 ${104-h*1.7} 115 104 Q104 ${104+h} 93 104Z"/></clipPath>
   <path d="M93 104 Q104 ${104-h*1.7} 115 104 Q104 ${104+h} 93 104Z" fill="#fbf7ef"/>
   <g clip-path="url(#ec-${id})"><circle cx="105" cy="${sq?103:104}" r="4.6" fill="${iris}"/><circle cx="105" cy="${sq?103:104}" r="2.1" fill="${K}"/><circle cx="106.6" cy="${sq?101.6:102.4}" r="1.1" fill="#fff"/></g>
   <path d="M92 104.6 Q104 ${104-h*2} 116 103.4" fill="none" ${SW(3.4)}/>${sq?`<path d="M95 105.5 Q104 102.5 113 105.5" fill="none" ${SW(1.4)}/><path d="M89 102 L85 100 M89 105 L85 106" ${SW(1.3)}/>`:`<path d="M95 106.5 Q104 ${104+h+1} 113 106.2" fill="none" stroke="${o.skin[2]}" stroke-width="1.4"/>`}`;
  return one+mirror(one.replace(`ec-${id}`,`ec2-${id}`).replace(`url(#ec-${id})`,`url(#ec2-${id})`));}
function browsArt(o){const c=o.browC||o.hair[1];const lift=o.browLift||0;const t=o.browW||1;
  return [0,1].map(i=>{const s=`<path d="M89 ${96-lift} Q101 ${86-lift-t*2} 116 ${91-lift} L116 ${94-lift+t} Q102 ${90-lift} 90 ${99-lift}Z" fill="${c}" ${SW(1.2)}/>`;return i?mirror(s):s;}).join('');}
function noseArt(o){return `<path d="M122 108 C124 118 128 126 129 131 L124 133 C124 124 123 116 122 108Z" fill="${o.skin[1]}"/><path d="M118 106 C117 116 114 124 113 129 C112 134 117 136 120 135 C124 136 128 134 128 130" fill="none" ${SW(2.2)}/><path d="M114 131 Q116 133 118 132 M123 132 Q125 133 127 131" fill="none" ${SW(1.6)}/>`;}
function mouthArt(o){const lip=o.lip||o.skin[2];
  if(o.mouth==='gap')return `<path d="M101 141 Q120 138 139 141 Q136 160 120 163 Q104 160 101 141Z" fill="#5a1a14" ${SW(2.6)}/><path d="M103.5 142 Q120 140 136.5 142 L135 149 Q120 151.5 105 149Z" fill="#fbf7ef"/><rect x="115" y="141" width="10" height="9" fill="#3a120d"/><path d="M109 157 Q120 161 131 157 Q120 159.5 109 157Z" fill="#c9574a"/>`;
  if(o.mouth==='grin')return `<path d="M101 141 Q120 138 139 141 Q136 160 120 163 Q104 160 101 141Z" fill="#5a1a14" ${SW(2.6)}/><path d="M103.5 142 Q120 140 136.5 142 L135 149 Q120 151.5 105 149Z" fill="#fbf7ef"/><path d="M111 142 L111 150 M120 141 L120 151 M129 142 L129 150" stroke="#d8d0c0" stroke-width="1"/><path d="M109 157 Q120 161 131 157 Q120 159.5 109 157Z" fill="#c9574a"/><path d="M96 138 Q99 142 101 141 M144 138 Q141 142 139 141" fill="none" ${SW(2)}/>`;
  if(o.mouth==='smirk')return `<path d="M106 146 Q118 148 136 141" fill="none" ${SW(2.6)}/><path d="M110 150 Q120 153 128 149" fill="none" stroke="${o.skin[1]}" stroke-width="3"/>`;
  if(o.mouth==='lips')return `<path d="M106 146 Q113 140 120 143 Q127 140 134 146 Q120 149 106 146Z" fill="${lip}" ${SW(1.6)}/><path d="M106 146 Q120 158 134 146 Q120 150 106 146Z" fill="${lip}" ${SW(1.6)}/><path d="M112 150 Q116 152 119 151" stroke="#ffffff" stroke-width="1.6" opacity=".7"/>`;
  if(o.mouth==='open')return `<path d="M106 142 Q120 139 134 142 Q131 156 120 158 Q109 156 106 142Z" fill="#5a1a14" ${SW(2.4)}/><path d="M108 143 Q120 141 132 143 L131 147 Q120 148.5 109 147Z" fill="#fbf7ef"/>`;
  return `<path d="M107 146 Q120 149 133 146" fill="none" ${SW(2.6)}/><path d="M111 151 Q120 155 129 151 Q120 153 111 151Z" fill="${o.skin[1]}"/>`;}
function portrait(o){const id=o.id;const [sk,sh,dp]=o.skin;const face=FACE[o.face||'normal'];
  const cheek=o.blush?`<ellipse cx="96" cy="128" rx="10" ry="6" fill="${o.blush}" opacity=".5"/><ellipse cx="144" cy="128" rx="10" ry="6" fill="${o.blush}" opacity=".35"/>`:'';
  const stub=o.stubble?`<path fill="${o.stubC||o.hair[1]}" opacity=".3" d="M97 140 Q108 150 120 150 Q132 150 143 140 Q150 150 142 160 Q132 170 120 171 Q108 170 98 160 Q90 150 97 140Z M104 139 Q112 136 120 137 Q128 136 136 139 Q128 141 120 140 Q112 141 104 139Z"/><path d="M97 140 Q108 150 120 150 Q132 150 143 140 Q150 150 142 160 Q132 170 120 171 Q108 170 98 160 Q90 150 97 140Z M104 139 Q112 136 120 137 Q128 136 136 139 Q128 141 120 140 Q112 141 104 139Z" fill="url(#stb-${id})"/>`:'';
  return `<svg class="reporter" viewBox="0 0 240 300" aria-hidden="true"><defs>
   <pattern id="ht-${id}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3.5" cy="3.5" r="1.5" fill="${K}" opacity=".28"/></pattern>
   <pattern id="stb-${id}" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><circle cx="1.6" cy="1.6" r=".7" fill="${o.stubC||o.hair[1]}" opacity=".7"/></pattern>
   <pattern id="tw-${id}" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6 L6 0 M-1 1 L1 -1 M5 7 L7 5" stroke="rgba(0,0,0,.28)" stroke-width="1.2"/></pattern>
   <clipPath id="pc-${id}"><rect width="240" height="300"/></clipPath>${o.defs||''}</defs><g clip-path="url(#pc-${id})">
   ${o.noPanel?'':panelBG(o,id)}
   <g transform="translate(120 292) scale(${o.zoom||1.12}) translate(-120 -292)">${o.back||''}
   ${o.body||''}
   <path d="M100 148 L98 200 L142 200 L140 148Z" fill="${sk}" ${SW(3)}/><path d="M100 148 L100 182 Q120 190 140 176 L140 148Z" fill="${sh}"/>
   ${o.collar||''}${o.hairBack||''}
   <g transform="translate(${-(o.earDx||0)} 0)"><path d="M82 100 C70 96 67 116 74 125 C78 131 85 129 86 124Z" fill="${sk}" ${SW(2.6)}/></g><g transform="translate(${o.earDx||0} 0)"><path d="M158 100 C170 96 173 116 166 125 C162 131 155 129 154 124Z" fill="${sh}" ${SW(2.6)}/></g>
   <path d="${face}" fill="${sk}" ${SW(3.6)}/>
   <clipPath id="fc-${id}"><path d="${face}"/></clipPath><g clip-path="url(#fc-${id})">
    <path d="M146 50 C162 72 168 102 160 130 C153 152 138 166 120 170 C137 150 146 128 148 104 C149 84 149 66 146 50Z" fill="${sh}"/>
    <path d="M60 148 Q120 186 180 148 L180 190 L60 190Z" fill="${sh}"/>
    <path d="M88 122 Q94 131 101 134" fill="none" stroke="${sh}" stroke-width="3" stroke-linecap="round"/>
    <path d="M90 66 C83 84 83 106 91 124 C88 106 88 86 97 62Z" fill="#ffffff" opacity=".22"/><path d="M92 98 Q104 90 116 97 L116 101 Q104 95 92 101Z M124 97 Q136 90 148 98 L148 101 Q136 95 124 101Z" fill="${dp}" opacity=".35"/>
    ${cheek}${stub}${o.faceExtra||''}</g>
   ${o.beard||''}${o.hair?o.hairFront||'':''}
   ${browsArt(o)}${eyesArt(o,id)}${noseArt(o)}${mouthArt(o)}${o.front||''}</g>
   </g>${o.noPanel?'':`<rect x="3" y="3" width="234" height="294" fill="none" stroke="${K}" stroke-width="6"/>`}</svg>`;}
const suitBody=(c,c2,shirt,tie)=>`<path d="M22 300 C24 236 58 208 100 196 L140 196 C182 208 216 236 218 300Z" fill="${c}" ${SW(3.6)}/><path d="M166 214 C192 230 210 256 216 300 L182 300 C178 266 172 238 166 214Z" fill="${c2}"/><path d="M58 236 C52 256 48 280 48 300" fill="none" stroke="${c2}" stroke-width="3"/>
 <path d="M99 196 L120 258 L141 196Z" fill="${shirt}" ${SW(2.4)}/>${tie?`<path d="M114 204 L126 204 L128 214 L124 268 L120 274 L116 268 L112 214Z" fill="${tie}" ${SW(2)}/><path d="M113 204 L127 204 L124 214 L116 214Z" fill="${tie}" ${SW(2)}/>`:''}
 <path d="M99 196 L84 210 L100 226 L92 236 L117 296 L119 258Z" fill="${c}" ${SW(2.6)}/><path d="M141 196 L156 210 L140 226 L148 236 L123 296 L121 258Z" fill="${c2}" ${SW(2.6)}/>
 <path d="M98 192 L108 212 L120 200 L132 212 L142 192 L138 186 L102 186Z" fill="${shirt}" ${SW(2.4)}/>`;
const flatCap=(c,c2,id,dy)=>`<g transform="translate(0 ${-(dy||0)})"><path d="M74 90 C70 58 94 42 124 44 C150 46 168 58 167 80 C178 83 182 90 176 95 C150 88 116 88 84 96 C78 96 75 94 74 90Z" fill="${c}" ${SW(3.4)}/><path d="M74 90 C70 58 94 42 124 44 C150 46 168 58 167 80 C178 83 182 90 176 95 C150 88 116 88 84 96 C78 96 75 94 74 90Z" fill="url(#tw-${id})"/>
 <path d="M84 96 C116 88 150 88 176 95 C170 101 150 99 124 99 C104 99 90 102 84 96Z" fill="${c2}" ${SW(2.6)}/><path d="M88 74 C110 64 140 63 164 70" fill="none" stroke="${c2}" stroke-width="3"/><circle cx="122" cy="47" r="3.4" fill="${c2}" ${SW(1.6)}/>
 <path d="M86 98 C110 94 140 94 170 99 L170 102 C140 98 110 98 86 102Z" fill="${K}" opacity=".45"/></g>`;
const micArt=(x,y,s,plate,col)=>`<g transform="translate(${x} ${y}) scale(${s})"><rect x="14" y="52" width="12" height="80" fill="#6d7378" ${SW(3)}/><rect x="0" y="0" width="40" height="58" rx="13" fill="#b9bec2" ${SW(3.4)}/><path d="M26 4 Q36 8 36 28 L36 50" stroke="#e8ebed" stroke-width="3" fill="none"/>${[12,20,28,36,44].map(yy=>`<line x1="7" x2="33" y1="${yy}" y2="${yy}" stroke="${K}" stroke-width="2"/>`).join('')}${plate?`<rect x="-3" y="30" width="46" height="16" fill="${col||'#c8202f'}" ${SW(2.4)}/><text x="20" y="42.5" text-anchor="middle" font-size="11" font-weight="900" fill="#fff" font-family="Arial Black,Arial,sans-serif">${plate}</text>`:''}</g>`;
const fist=(x,y,c,c2)=>`<path d="M${x} ${y} q-4 -14 12 -16 l22 0 q12 2 10 16 q0 12 -14 14 l-18 0 q-12 -2 -12 -14Z" fill="${c}" ${SW(3)}/><path d="M${x+10} ${y-12} l0 22 M${x+20} ${y-14} l0 24 M${x+30} ${y-12} l0 22" stroke="${c2}" stroke-width="2"/>`;
const notebook=(x,y,rot,skin)=>`<g transform="rotate(${rot} ${x+22} ${y+30})"><rect x="${x}" y="${y}" width="46" height="60" fill="#f3efe6" ${SW(3)}/><rect x="${x}" y="${y}" width="46" height="9" fill="#c8202f" ${SW(2)}/><path d="M${x+6} ${y+20}h32M${x+6} ${y+30}h32M${x+6} ${y+40}h24M${x+6} ${y+50}h28" stroke="#7a8aa0" stroke-width="1.6"/></g>`;
const SKIN={light:['#f1c7a1','#d09572','#9a5f45'],fair:['#f4cdb0','#dba287','#a86a52'],ruddy:['#eeb896','#cf8a68','#98563f'],warm:['#e3aa7f','#bf7d58','#8a4f36'],olive:['#dfae86','#b78462','#7e5238']};
const LOOKS={
 reg:{id:'reg',skin:SKIN.warm,hair:['#8d8a84','#5f5c57'],iris:'#6b7b5a',bg:'#d9951a',bg2:'#b8770f',face:'square',browW:2.4,browC:'#8d8a84',
  body:suitBody('#b0935a','#8a6f3e','#f3efe6','#6e1a14')+`<path d="M60 222 L80 300 M180 222 L160 300" stroke="#8a6f3e" stroke-width="3"/><path d="M40 240 L30 300" stroke="#8a6f3e" stroke-width="3"/>`,
  faceExtra:`<path d="M92 84 Q104 80 114 83 M126 83 Q136 80 148 84" fill="none" stroke="#9a5f45" stroke-width="1.6"/><path d="M86 116 Q90 126 88 134 M154 116 Q150 126 152 134" fill="none" stroke="#8a4f36" stroke-width="1.6"/>`,
  mouth:'plain',front:`<path d="M100 141 Q110 134 120 138 Q130 134 140 141 Q134 147 120 145 Q106 147 100 141Z" fill="#8d8a84" ${SW(2)}/>
   <path d="M48 78 Q120 56 192 78 Q198 86 186 90 Q120 72 54 90 Q42 86 48 78Z" fill="#4a3a28" ${SW(3.4)}/><path d="M76 78 C74 38 100 30 120 30 C140 30 166 38 164 78 Q120 66 76 78Z" fill="#5e4a33" ${SW(3.4)}/><path d="M104 32 Q120 46 136 32" fill="none" ${SW(2.4)}/><path d="M76 70 Q120 58 164 70 L164 78 Q120 66 76 78Z" fill="${K}"/><path d="M144 36 C154 44 160 56 162 70 L150 68 C150 56 148 46 144 36Z" fill="#46372a"/>
   <g transform="rotate(10 142 58)"><rect x="130" y="50" width="26" height="15" fill="#f3efe6" ${SW(2)}/><text x="143" y="61" text-anchor="middle" font-size="7.5" font-family="Arial Black,Arial,sans-serif" font-weight="900" fill="${K}">PRESS</text></g>
   ${notebook(150,208,-8)}${fist(150,272,'#e3aa7f','#bf7d58')}<path d="M190 250 L214 214" stroke="#d9951a" stroke-width="7" stroke-linecap="round"/><path d="M190 250 L214 214" ${SW(1.6)} opacity=".6"/>`},
 maureen:{id:'mau',skin:SKIN.fair,hair:['#b24a22','#7e2f12','#e07a44'],iris:'#3f7a4a',bg:'#e8692a',bg2:'#c9521a',face:'fem',mouth:'lips',lip:'#c8202f',blush:'#e88a7a',browW:.4,browLift:2,
  hairBack:`<path d="M66 124 C50 70 70 10 120 8 C170 10 190 70 174 124 C166 96 150 78 120 76 C90 78 74 96 66 124Z" fill="#b24a22" ${SW(3.6)}/><path d="M100 18 C124 8 156 20 168 50 C152 30 128 22 100 18Z" fill="#e07a44"/><path d="M150 40 C170 66 174 96 170 116 L164 110 C166 88 160 62 150 40Z" fill="#7e2f12"/>`,
  hairFront:`<path d="M80 98 C80 64 104 50 138 58 C156 64 162 80 160 98 C146 76 118 70 100 82 C92 88 86 94 80 104Z" fill="#b24a22" ${SW(3)}/><path d="M92 82 C104 68 124 64 140 66" fill="none" stroke="#e07a44" stroke-width="4" stroke-linecap="round"/>`,
  body:`<path d="M26 300 C28 240 60 212 100 200 L140 200 C180 212 212 240 214 300Z" fill="#1f8a86" ${SW(3.6)}/><path d="M166 216 C192 232 208 258 212 300 L180 300 C176 266 172 240 166 216Z" fill="#146461"/>`,
  collar:`<path d="M92 196 Q104 222 120 206 Q136 222 148 196 Q134 208 120 204 Q106 208 92 196Z" fill="#f3efe6" ${SW(2.6)}/>`,
  front:`<path d="M84 100 Q84 92 100 93 Q114 93 114 103 Q112 112 101 112 Q88 112 85 104 L74 92Z" fill="rgba(255,255,255,.18)" ${SW(3)}/><path d="M156 100 Q156 92 140 93 Q126 93 126 103 Q128 112 139 112 Q152 112 155 104 L166 92Z" fill="rgba(255,255,255,.18)" ${SW(3)}/><path d="M114 101 Q120 97 126 101" fill="none" ${SW(2.4)}/>
   <circle cx="74" cy="132" r="7" fill="#f2c14e" ${SW(2)}/><circle cx="166" cy="132" r="7" fill="#f2c14e" ${SW(2)}/>${micArt(16,150,1.05,'')}${fist(14,228,'#f4cdb0','#dba287')}`},
 eddie:{id:'edd',skin:SKIN.light,hair:['#3b2a1d','#1f150d','#6b4c33'],iris:'#3b2a1d',bg:'#c8202f',bg2:'#a3141f',face:'normal',mouth:'smirk',
  hairBack:`<path d="M70 118 C58 50 84 26 120 26 C156 26 182 50 170 118 C164 88 150 76 120 76 C90 76 76 88 70 118Z" fill="#3b2a1d" ${SW(3.6)}/>`,
  hairFront:`<path d="M76 102 C70 54 94 34 122 34 C150 34 172 54 164 102 C158 90 150 84 140 90 C132 80 122 78 112 88 C102 80 92 84 86 94 C82 96 78 98 76 102Z" fill="#3b2a1d" ${SW(3.4)}/><path d="M96 46 C112 38 136 38 150 48 C134 44 112 44 96 50Z" fill="#6b4c33"/><path d="M78 104 L80 130 L88 130 L86 100Z" fill="#3b2a1d" ${SW(2)}/><path d="M162 104 L160 130 L152 130 L154 100Z" fill="#3b2a1d" ${SW(2)}/>`,
  body:`<path d="M22 300 C24 236 58 208 100 196 L140 196 C182 208 216 236 218 300Z" fill="#d9a232" ${SW(3.6)}/><path d="M166 214 C192 230 210 256 216 300 L182 300 C178 266 172 238 166 214Z" fill="#a8791e"/><path d="M40 236 L60 300 M70 214 L86 300 M170 214 L154 300 M200 236 L182 300" stroke="#a8791e" stroke-width="2.4"/><path d="M96 196 Q120 214 144 196 L148 300 L92 300Z" fill="#1c1b19" ${SW(3)}/>`,
  collar:`<path d="M98 182 Q120 198 142 182 L144 198 Q120 214 96 198Z" fill="#2c2b29" ${SW(2.8)}/>`,
  front:`<circle cx="104" cy="104" r="13" fill="#1f5e5b" ${SW(3.2)}/><circle cx="136" cy="104" r="13" fill="#1f5e5b" ${SW(3.2)}/><path d="M117 103 Q120 100 123 103" fill="none" ${SW(2.6)}/><path d="M97 98 Q100 94 105 94 M129 98 Q132 94 137 94" stroke="#bfe0da" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M91 102 L80 98 M149 102 L160 98" ${SW(2.4)}/>
   ${notebook(24,214,10)}${fist(30,282,'#f1c7a1','#d09572')}<path d="M160 88 L182 62" stroke="#d9951a" stroke-width="7" stroke-linecap="round"/><path d="M160 88 L182 62" ${SW(1.4)} opacity=".6"/>`},
 pat:{id:'pat',skin:SKIN.ruddy,hair:['#b5562a','#80391a'],iris:'#4a6f9a',bg:'#1f4fb0',bg2:'#153a88',face:'normal',mouth:'open',blush:'#d86a56',browW:2.6,browC:'#b5562a',
  body:`<path d="M22 300 C24 236 58 208 100 196 L140 196 C182 208 216 236 218 300Z" fill="#b8352a" ${SW(3.6)}/><path d="M166 214 C192 230 210 256 216 300 L182 300 C178 266 172 238 166 214Z" fill="#8a2118"/>${[228,250,272].map(y=>`<path d="M44 ${y} Q120 ${y+14} 196 ${y}" fill="none" stroke="#8a2118" stroke-width="2.4" stroke-dasharray="6 4"/>`).join('')}<path d="M100 196 L120 214 L140 196" fill="#f3efe6" ${SW(2.4)}/>`,
  collar:`<path d="M86 196 Q120 232 154 196" fill="none" stroke="${K}" stroke-width="8"/><ellipse cx="84" cy="202" rx="12" ry="15" fill="#2c2b29" ${SW(2.4)}/><ellipse cx="156" cy="202" rx="12" ry="15" fill="#2c2b29" ${SW(2.4)}/>`,
  hairFront:`<path d="M80 100 Q78 86 84 80 L88 108Z M160 100 Q162 86 156 80 L152 108Z" fill="#b5562a" ${SW(2)}/>`,
  front:`${'__CAP_PAT__'}${micArt(150,148,1.18,'NW','#c8202f')}${fist(148,230,'#eeb896','#cf8a68')}`},
 stan:{id:'stn',skin:SKIN.olive,hair:['#a7a39b','#7c7870'],iris:'#5a4a3a',bg:'#5e7a3a',bg2:'#46602a',face:'square',browW:1.4,browC:'#6b675f',
  hairBack:`<path d="M78 112 C74 92 76 80 82 74 L86 114Z M162 112 C166 92 164 80 158 74 L154 114Z" fill="#a7a39b" ${SW(2.4)}/>`,
  faceExtra:`<path d="M94 58 Q112 50 132 54" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45"/><path d="M90 76 Q120 70 150 76" fill="none" stroke="#b78462" stroke-width="1.6"/>`,
  body:suitBody('#4b5058','#353940','#f3efe6',null)+`<path d="M92 222 L92 300 L114 300 L114 244Z M148 222 L148 300 L126 300 L126 244Z" fill="#6b7078" ${SW(2.6)}/><circle cx="108" cy="262" r="2.6" fill="${K}"/><circle cx="108" cy="282" r="2.6" fill="${K}"/>`,
  collar:`<path d="M104 198 L120 206 L104 214Z M136 198 L120 206 L136 214Z" fill="#c8202f" ${SW(2.2)}/><circle cx="120" cy="206" r="4.4" fill="#c8202f" ${SW(2)}/><circle cx="109" cy="203" r="1.6" fill="#fff"/><circle cx="130" cy="209" r="1.6" fill="#fff"/>`,
  front:`<rect x="88" y="94" width="30" height="21" rx="5" fill="rgba(255,255,255,.15)" stroke="#4a2c14" stroke-width="5.5"/><rect x="122" y="94" width="30" height="21" rx="5" fill="rgba(255,255,255,.15)" stroke="#4a2c14" stroke-width="5.5"/><path d="M118 102 L122 102" stroke="#4a2c14" stroke-width="4"/><path d="M88 100 L80 98 M152 100 L160 98" stroke="#4a2c14" stroke-width="4"/>
   <path d="M122 147 L150 152 L150 144 Q162 142 172 146 Q174 166 158 168 Q148 168 148 158 L122 153Z" fill="#5a3418" ${SW(2.4)}/><path d="M166 134 Q156 122 168 112 Q180 102 170 88 Q164 80 172 70" fill="none" stroke="#f3efe6" stroke-width="5" stroke-linecap="round" opacity=".9"/>`},
 liam:{id:'lia',skin:SKIN.fair,hair:['#6b4a30','#43301f','#9a7250'],iris:'#5b8fcf',bg:'jack',face:'round',mouth:'grin',eyes:'squint',blush:'#e07a6a',stubble:true,stubC:'#7a5a3c',faceExtra:`<path d="M104 137 Q112 133 120 135 Q128 133 136 137 Q128 139 120 138 Q112 139 104 137Z" fill="#7a5a3c" opacity=".55"/>`,browW:1.6,browLift:1,
  hairBack:`<path d="M78 120 C74 104 76 92 82 86 L88 122Z M162 120 C166 104 164 92 158 86 L152 122Z" fill="#6b4a30" ${SW(2.4)}/>`,
  body:suitBody('#2b3347','#1c2232','#f3efe6','#20242e')+`<path d="M132 238 L150 232 L152 238 L134 244Z" fill="#f3efe6" ${SW(1.6)}/>`,
  front:`__CAP_LIAM__<path d="M88 100 Q96 88 110 92" fill="none" stroke="#9a7250" stroke-width="0"/>${notebook(20,212,8)}${fist(26,280,'#f4cdb0','#dba287')}`},
 chair:{id:'chr',skin:SKIN.warm,hair:['#c9c5bc','#8e8a82'],iris:'#5a4a3a',bg:'#2d3a52',bg2:'#1f2a3e',face:'square',browW:2.2,browC:'#8e8a82',
  hairBack:`<path d="M78 108 C74 80 84 64 96 60 L90 110Z M162 108 C166 80 156 64 144 60 L150 110Z" fill="#c9c5bc" ${SW(2.4)}/>`,
  hairFront:`<path d="M84 84 C86 58 104 50 120 52 C140 50 156 60 158 84 C150 70 136 64 120 66 C104 66 92 72 84 84Z" fill="#c9c5bc" ${SW(2.6)}/><path d="M96 62 Q118 56 142 62" fill="none" stroke="#8e8a82" stroke-width="2.4"/>`,
  faceExtra:`<path d="M86 118 Q90 128 88 136 M154 118 Q150 128 152 136" fill="none" stroke="#8a4f36" stroke-width="1.6"/><path d="M100 160 Q120 168 140 160" fill="none" stroke="#bf7d58" stroke-width="2"/>`,
  body:suitBody('#23262d','#15171c','#f3efe6','#7a1a2e')+`<path d="M150 232 L166 228 L168 236 L152 240Z" fill="#f3efe6" ${SW(1.6)}/>`,
  front:`<path d="M126 148 L168 158 L166 166 L124 156Z" fill="#6b3f1f" ${SW(2.2)}/><path d="M166 158 L172 160 L170 167 L164 166Z" fill="#e8692a"/><path d="M174 150 Q168 138 178 128 Q188 118 180 106" fill="none" stroke="#f3efe6" stroke-width="4" stroke-linecap="round" opacity=".8"/>`}
};
LOOKS.pat.front=LOOKS.pat.front.replace('__CAP_PAT__',flatCap('#5f6e36','#46532a','pat',5));
LOOKS.liam.front=LOOKS.liam.front.replace('__CAP_LIAM__',flatCap('#7a6247','#5a4632','lia',11)+`<path d="M84 92 C82 78 92 70 104 72 C112 73 118 78 120 84 C112 80 104 80 98 84 C94 87 90 91 88 96Z" fill="#6b4a30" ${SW(2)}/><path d="M92 80 C98 75 106 75 112 78" fill="none" stroke="#9a7250" stroke-width="2.4" stroke-linecap="round"/><path d="M152 88 C156 82 162 84 163 92 L159 98Z" fill="#6b4a30" ${SW(1.6)}/><g transform="translate(0 -11) rotate(-6 150 70)"><rect x="136" y="62" width="30" height="13" fill="#f3efe6" ${SW(1.8)}/><text x="151" y="71.5" text-anchor="middle" font-size="6.6" font-family="Arial Black,Arial,sans-serif" font-weight="900" fill="${K}">PRESS</text></g>`);
const REPORTERS=[{n:'Reg Pollard',o:'The Evening Chronicle',look:'reg'},{n:'Maureen Hollis',o:'The Weekly Clarion',look:'maureen'},{n:'Eddie Nuttall',o:'The Sporting Pink',look:'eddie'},{n:'Pat Kershaw',o:'Northern Wireless',look:'pat'},{n:'Stan Beresford',o:'The Football Echo',look:'stan'},{n:'Liam Tustin',o:'The Telegraph',look:'liam',tag:'Alright, lavvvely.'}];
/* the press pack is random, but whoever asked last time is half as likely to get the first question again */
function nextRep(){const P=G.press;const k=REPORTERS.indexOf(wpick(REPORTERS,r=>REPORTERS.indexOf(r)===P.lastRep?0.5:1));P.lastRep=k;delete P.deck;return REPORTERS[k];}
const reporterArt=r=>portrait(LOOKS[r.look]||LOOKS.reg);
const VOICE={
 reg:{pre:['Reg Pollard, Evening Chronicle. ','Good afternoon, Mr {M}. Reg Pollard, Chronicle. '],post:[' If you would be so kind.',' For the record, if you please.'],
  story:(M,O,q)=>`Speaking to the Evening Chronicle ahead of the visit of ${O}, ${M} was measured. "${q}" It remains to be seen whether Saturday bears him out.`,
  sign:['Our correspondent will report from the ground on Saturday.','Full report and pictures in Monday\'s edition.']},
 maureen:{pre:['Maureen Hollis, Clarion. Never mind the platitudes. ','Maureen Hollis, Weekly Clarion. The terraces want a straight answer. '],post:[' The people paying at the gate deserve to know.',' And please, no clichés.'],
  story:(M,O,q)=>`Ask the people on the terraces what they want, and they will tell you. Asked by the Clarion before ${O}, ${M} said: "${q}" The supporters will judge him on that, and so will we.`,
  sign:['The Clarion stands with the terraces, as ever.','Write in and tell us what you think. We print the best letters.']},
 eddie:{pre:['Eddie from the Pink! ','Eddie Nuttall, Sporting Pink! Quick one, boss! '],post:[' Give us a headline!',' Something juicy, go on!'],
  story:(M,O,q)=>`CHEEKY! ${M} had the Pink's notebook buzzing this week. Ahead of ${O}, he told us: "${q}" Cor! You read it here first, folks.`,
  sign:['Get your Pink on the street from six o\'clock Saturday.','More gossip, more goals, more Pink!']},
 pat:{pre:['Pat Kershaw for the Northern Wireless, and we\'re on the air. ','This is Pat Kershaw, Northern Wireless, coming to you live. '],post:[' Over to you.',' Nice and clear for the listeners, please.'],
  story:(M,O,q)=>`Speaking live on the Northern Wireless this week, ${M} told listeners: "${q}" Commentary on the ${O} game follows on Saturday afternoon, from a quarter to three.`,
  sign:['Keep your dial tuned to the Northern Wireless.','Full commentary on the second half, Saturday afternoon.']},
 stan:{pre:['Stan Beresford, Football Echo. ','Stan Beresford. Echo. I\'ll keep it short. '],post:[' I\'ve been watching this game forty years, mind.',' Take your time. I\'ve all afternoon.'],
  story:(M,O,q)=>`Forty years I have been watching this game, and I have heard plenty of managers talk. ${M}, ahead of ${O}, told me: "${q}" We shall see. We shall see.`,
  sign:['The pipe goes back in the pocket, and on we go.','Stan Beresford has covered the League since 1921.']},
 liam:{pre:['Liam Tustin, Telegraph. Lovely to see you, gaffer. ','Tustin, Telegraph. Right then, gaffer. '],post:[' Alright, lavvvely.'],
  story:(M,O,q)=>`Gaffer ${M} was on top form before ${O}, and I mean top form. "${q}" Cracking stuff. Alright, lavvvely.`,
  sign:['Alright, lavvvely.','Top man, that. Alright, lavvvely.']}};
const voiceOf=r=>VOICE[r&&r.look]||null;
const REACT={reg:['Reg licks his pencil and writes it all down.','"That\'ll do nicely," says Reg.'],maureen:['Maureen raises an eyebrow over her glasses.','"The readers will love that," says Maureen.'],eddie:['Eddie grins and scribbles something.','"Fab," says Eddie. "Proper fab."'],pat:['Pat nods to his engineer. "Did you get that?"','"Lovely stuff for the wireless," says Pat.'],stan:['Stan puffs on his pipe and says nothing.','"Hmm," says Stan, through the pipe smoke.'],liam:['Liam Tustin beams and underlines something twice. "Cracking. Alright, lavvvely."','"Oh, that\'s the back page sorted, that is. Alright, lavvvely."','Liam Tustin tips his cap. "Top answer, gaffer. Alright, lavvvely."']};
/* more chairmen: each club keeps its own */
LOOKS.alderman={id:'ald',skin:SKIN.ruddy,hair:['#e6e2da','#a9a59c'],iris:'#5a6a7a',bg:'#7a1a2e',bg2:'#5c1222',face:'round',blush:'#d86a56',browW:2.4,browC:'#c9c5bc',
 hairBack:`<path d="M76 118 C72 96 76 84 84 78 L88 120Z M164 118 C168 96 164 84 156 78 L152 120Z" fill="#e6e2da" ${SW(2.4)}/>`,
 faceExtra:`<path d="M94 60 Q114 52 136 56" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".4"/><path d="M84 150 Q120 176 156 150" fill="none" stroke="#98563f" stroke-width="2"/>`,
 body:suitBody('#1f2330','#14171f','#f3efe6','#1f2330'),
 front:`<circle cx="104" cy="104" r="11" fill="rgba(255,255,255,.15)" ${SW(2.6)}/><circle cx="136" cy="104" r="11" fill="rgba(255,255,255,.15)" ${SW(2.6)}/><path d="M115 103 Q120 100 125 103" fill="none" ${SW(2.2)}/>
  <path d="M70 212 Q120 262 170 212" fill="none" stroke="#d9a52e" stroke-width="7"/><path d="M70 212 Q120 262 170 212" fill="none" stroke="${K}" stroke-width="2" stroke-dasharray="3 6"/>${[0,1,2,3,4,5,6].map(i=>{const t=i/6;const x=70+100*t;const y=212+50*4*t*(1-t)*1.0;return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.4" fill="#f2c14e" ${SW(1.6)}/>`;}).join('')}<circle cx="120" cy="252" r="13" fill="#f2c14e" ${SW(2.4)}/><circle cx="120" cy="252" r="7" fill="#c8202f" ${SW(1.6)}/>`};
LOOKS.gent={id:'gnt',skin:SKIN.warm,hair:['#9a958c','#6b675f'],iris:'#4a6a4a',bg:'#3f5a2a',bg2:'#2f4520',face:'square',browW:2.6,browC:'#8a857c',
 hairBack:`<path d="M80 110 C74 80 86 62 104 58 L90 112Z" fill="#9a958c" ${SW(2.4)}/>`,
 hairFront:`<path d="M84 90 C84 58 106 48 128 50 C148 52 160 64 158 88 C150 72 138 64 122 64 C104 64 94 74 86 92Z" fill="#9a958c" ${SW(2.6)}/><path d="M100 60 C114 54 132 54 146 62" fill="none" stroke="#c9c5bc" stroke-width="3"/>`,
 body:suitBody('#8a6a3e','#6a4f2a','#f3efe6','#3f5a2a')+`<path d="M40 250 L200 250 M34 276 L206 276 M70 214 L70 300 M170 214 L170 300" stroke="#6a4f2a" stroke-width="1.6" opacity=".7"/><circle cx="154" cy="228" r="7" fill="#c8202f" ${SW(1.8)}/><circle cx="154" cy="228" r="3" fill="#f2c14e"/>`,
 front:`<path d="M96 142 Q106 130 120 136 Q134 130 144 142 Q138 150 120 146 Q102 150 96 142Z" fill="#8a857c" ${SW(2)}/>`};
LOOKS.spiv={id:'spv',skin:SKIN.olive,hair:['#1c1a18','#0c0b0a','#4a4640'],iris:'#3a2a1a',bg:'#b8860b',bg2:'#8f6708',face:'normal',mouth:'smirk',browW:1.6,
 hairBack:`<path d="M76 116 C68 70 90 40 120 40 C150 40 172 70 164 116 C158 84 144 70 120 70 C96 70 82 84 76 116Z" fill="#1c1a18" ${SW(3.2)}/>`,
 hairFront:`<path d="M80 96 C78 60 100 44 124 44 C148 44 164 60 160 90 C150 68 134 62 116 64 C98 66 86 78 80 96Z" fill="#1c1a18" ${SW(3)}/><path d="M94 58 C110 48 134 48 150 58" fill="none" stroke="#6a655c" stroke-width="3"/>`,
 body:suitBody('#2a2d38','#1a1c24','#f3efe6','#c8202f')+[60,76,164,180].map(x=>`<line x1="${x}" y1="220" x2="${x}" y2="300" stroke="#5a5f70" stroke-width="1.2"/>`).join('')+`<rect x="116" y="232" width="8" height="3" fill="#f2c14e"/>`,
 front:`<path d="M106 138 Q120 134 134 138" fill="none" stroke="#1c1a18" stroke-width="3"/><path d="M126 148 L170 154 L169 162 L125 156Z" fill="#6b3f1f" ${SW(2.2)}/><path d="M168 154 L174 155 L173 163 L167 162Z" fill="#e8692a"/><circle cx="160" cy="224" r="3" fill="#f2c14e"/>`};
LOOKS.dour={id:'dor',skin:SKIN.fair,hair:['#b8b3aa','#8a857c'],iris:'#5a6a7a',bg:'#4a5a6a',bg2:'#34424f',face:'fem',browW:1.2,browC:'#8a857c',
 hairFront:`<path d="M84 88 C86 60 102 48 122 48 C142 48 156 62 156 86 C148 70 136 62 120 62 C104 62 92 72 84 88Z" fill="#b8b3aa" ${SW(2.4)}/>`,
 faceExtra:`<path d="M92 124 Q96 134 94 142 M148 124 Q144 134 146 142" fill="none" stroke="#a86a52" stroke-width="1.6"/>`,
 body:suitBody('#30343c','#1f2228','#f3efe6','#2a3a5a'),
 front:`<rect x="89" y="95" width="30" height="19" rx="3" fill="rgba(255,255,255,.15)" stroke="${K}" stroke-width="4.6"/><rect x="121" y="95" width="30" height="19" rx="3" fill="rgba(255,255,255,.15)" stroke="${K}" stroke-width="4.6"/><path d="M119 102 L121 102" stroke="${K}" stroke-width="4"/>`,mouth:'plain'};
const CHAIR_LOOKS=['chair','alderman','gent','spiv','dour'];
const hashStr=s=>{let h=0;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))>>>0;return h;};
function chairLook(cid){const ch=chairOf(cid);if(ch.pearsey)return LOOKS.pearsey;if(!ch.look)ch.look=CHAIR_LOOKS[hashStr(cid)%CHAIR_LOOKS.length];return LOOKS[ch.look]||LOOKS.chair;}

/* Pearsey, chairman of Aston Villa, and nobody else */
FACE.broad='M66 98 C66 58 92 38 120 38 C148 38 174 58 174 98 C176 120 172 138 164 150 C155 164 139 174 120 175 C101 174 85 164 76 150 C68 138 64 120 66 98Z';
LOOKS.pearsey={id:'prs',skin:['#f4d0b4','#dca588','#a86a52'],hair:['#33231a','#1e140d','#5a4030'],iris:'#4f6a86',bg:'#7a1a3a',bg2:'#95bfe5',face:'broad',earDx:7,browW:2.8,browC:'#2e2016',mouth:'plain',zoom:1.04,
 hairFront:`<path d="M66 104 C62 64 88 36 120 36 C152 36 178 64 174 104 C172 92 168 82 162 76 C152 66 138 62 120 62 C102 62 88 66 78 76 C72 82 68 92 66 104Z" fill="#33231a" ${SW(3)}/>
  <path d="M66 104 C65 94 67 84 72 78 L76 118 C70 114 67 110 66 104Z M174 104 C175 94 173 84 168 78 L164 118 C170 114 173 110 174 104Z" fill="#33231a" ${SW(2)}/>
  <path d="M90 72 Q98 54 114 44 M106 64 Q110 52 117 42 M134 64 Q130 52 123 42 M150 72 Q142 54 126 44" fill="none" stroke="#5a4030" stroke-width="2.4" stroke-linecap="round"/>
  <ellipse cx="120" cy="34" rx="13" ry="9.5" fill="#33231a" ${SW(2.8)}/><path d="M111 34 Q120 28 129 34" fill="none" stroke="#5a4030" stroke-width="2"/><rect x="114.5" y="41" width="11" height="4" rx="2" fill="#1e140d"/>`,
 beard:`<path d="M68 112 C68 150 92 190 120 193 C148 190 172 150 172 112 C165 128 155 139 144 141 C137 133 127 133 120 135 C113 133 103 133 96 141 C85 139 75 128 68 112Z" fill="#4a2a18" ${SW(3.2)}/>
  <path d="M156 126 C160 158 146 184 120 193 C142 178 154 156 151 130Z" fill="#331c10"/>
  ${[[86,148,90,164],[98,158,100,176],[112,164,112,182],[128,164,128,182],[142,158,140,176],[154,148,150,164],[92,144,94,152],[148,144,146,152]].map(([a,b,c,d])=>`<path d="M${a} ${b} L${c} ${d}" stroke="#6e4228" stroke-width="2" stroke-linecap="round"/>`).join('')}`,
 body:suitBody('#8a6f48','#6a5236','#f3efe6','#5a2a7a')+`<path d="M22 300 C24 236 58 208 100 196 L140 196 C182 208 216 236 218 300Z" fill="url(#tw-prs)"/>
  ${[60,90,150,180].map(x=>`<path d="M${x} 216 L${x} 300" stroke="#b5562a" stroke-width="1.4" opacity=".55"/>`).join('')}${[232,262,290].map(y=>`<path d="M36 ${y} L204 ${y}" stroke="#b5562a" stroke-width="1.4" opacity=".55"/>`).join('')}
  <path d="M101 202 L120 256 L139 202 L145 300 L95 300Z" fill="#7a6040" ${SW(2.4)}/><path d="M101 202 L120 256 L139 202 L145 300 L95 300Z" fill="url(#tw-prs)"/>${[268,282,296].map(y=>`<circle cx="120" cy="${y}" r="2.6" fill="#3a2a1a"/>`).join('')}
  <path d="M104 272 Q120 284 138 270" fill="none" stroke="#d9a52e" stroke-width="2.6"/><circle cx="138" cy="270" r="3" fill="#d9a52e"/>
  <path d="M60 230 L80 224 L82 232Z" fill="#5a2a7a" ${SW(1.6)}/><path d="M64 230 L74 222 L78 230Z" fill="#f3efe6" ${SW(1.4)}/>
  ${[210,222,234,246].map(y=>`<circle cx="120" cy="${y}" r="1.5" fill="#d9c0f0"/>`).join('')}`,
 front:`<path d="M120 135 Q108 129 98 135 Q90 141 85 133 Q82 124 89 121 Q85 131 92 133 Q100 126 110 128 Q116 129 120 131 Q124 129 130 128 Q140 126 148 133 Q155 131 151 121 Q158 124 155 133 Q150 141 142 135 Q132 129 120 135Z" fill="#2e1a0e" ${SW(2.2)}/>
  <circle cx="103" cy="104" r="14" fill="rgba(255,255,255,.12)" stroke="#1c1410" stroke-width="5"/><circle cx="137" cy="104" r="14" fill="rgba(255,255,255,.12)" stroke="#1c1410" stroke-width="5"/><path d="M117 102 Q120 99 123 102" fill="none" stroke="#1c1410" stroke-width="4"/><path d="M89 102 L72 99 M151 102 L168 99" stroke="#1c1410" stroke-width="4"/><path d="M95 97 Q99 94 104 94" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>`};
const CQ={welcome:['Welcome to the club. We expect great things, and we expect them soon.'],neutral:['The board are watching with interest. Results will decide everything.','We have every confidence in the manager, for now.'],
 good:['The board are delighted. The manager has our full backing.','This is the best side this club has had in my time, and I have been on the board since the war.','We are going places, make no mistake. The supporters deserve this.'],
 bad:['Results are not good enough, and the manager knows it.',"The board's patience is not unlimited.",'We are all very disappointed. Something will have to change, and soon.'],
 trophy:['It is the proudest day of my life. The manager and the lads have done this town proud.','We said we would bring a trophy back to this club, and we have.'],
 askYes:['Very well. The board will find the money. Spend it wisely.'],askNo:['The money is not there. You will have to make do.'],
 sack:['It gives the board no pleasure, but results have left us no choice.'],conNo:['We will talk about contracts when the results improve.'],conYes:['The board are happy to reward good work.']};
const CQP={welcome:['Welcome, dear boy. One trusts you will conduct yourself in a manner befitting Aston Villa.'],neutral:['One is watching with interest, dear boy. With the greatest of interest.','Carry on, old chap. One reserves judgement until the claret has breathed.'],
 good:['Splendid. Absolutely splendid. One had rather hoped for this sort of thing, and one is not disappointed.','A frightfully good show by the chaps. I shall have the forty-seven claret brought up from the cellar.','One does so enjoy winning, you know. It is terribly good for the constitution.','Top hole. The manager is a credit to the club, and I do not say that of many people.'],
 bad:['This behaviour is unbecoming.',"One expects rather more of a club of Aston Villa's breeding. This behaviour is unbecoming.",'I have spoken to the manager in the strongest possible terms. This behaviour is unbecoming.','One did not motor up from the country to watch this sort of thing. This behaviour is unbecoming.'],
 trophy:['Magnificent. Quite magnificent. I shall have it polished daily by the under-butler.','Aston Villa has always been a club of breeding, and today, breeding has told.','One is not given to displays of emotion, but I confess I had to dab an eye.'],
 askYes:["Very well, dear boy. Consider the purse strings loosened. Do spend it wisely, there's a good fellow."],askNo:['Money? At a time like this? This behaviour is unbecoming.'],
 sack:['It gives me no pleasure whatsoever, but results have been simply beastly. This behaviour is unbecoming, and it cannot be allowed to continue.'],
 conNo:['One discusses terms with winners, dear boy. This behaviour is unbecoming.'],conYes:['Of course, dear boy. One rewards loyalty and results in equal measure.']};
function chairSay(kind,cid){return chairSay2(kind,cid);}

/* supporters: a rotating cast from the terraces, in the club colours */
function scarfArt(c1,c2,id){return {defs:`<pattern id="sc-${id}" width="14" height="40" patternUnits="userSpaceOnUse"><rect width="7" height="40" fill="${c1}"/><rect x="7" width="7" height="40" fill="${c2}"/></pattern><pattern id="scv-${id}" width="40" height="16" patternUnits="userSpaceOnUse"><rect width="40" height="8" fill="${c1}"/><rect y="8" width="40" height="8" fill="${c2}"/></pattern>`,
  art:`<path d="M84 186 Q120 212 156 186 L160 204 Q120 232 80 204Z" fill="url(#sc-${id})" ${SW(2.8)}/><path d="M98 202 L90 276 L114 278 L118 208Z" fill="url(#scv-${id})" ${SW(2.8)}/>${[93,98,103,108,113].map(x=>`<path d="M${x} 277 l-1 9" ${SW(1.8)}/>`).join('')}`};}
const FANLOOKS=[
 (c1,c2,id)=>{const sc=scarfArt(c1,c2,id);return {id,skin:SKIN.warm,hair:['#9a958c','#6b675f'],iris:'#5a6a5a',bg:'#5b6770',bg2:'#46515a',face:'square',browW:2.4,browC:'#8a857c',defs:sc.defs,
   body:`<path d="M22 300 C24 236 58 208 100 196 L140 196 C182 208 216 236 218 300Z" fill="#5e4a33" ${SW(3.6)}/><path d="M166 214 C192 230 210 256 216 300 L182 300 C178 266 172 238 166 214Z" fill="#46372a"/><path d="M100 196 L84 214 L104 232 L120 300 M140 196 L156 214 L136 232 L120 300" fill="none" stroke="#46372a" stroke-width="3"/>`,
   collar:sc.art,faceExtra:`<path d="M86 118 Q90 128 88 136 M154 118 Q150 128 152 136" fill="none" stroke="#8a4f36" stroke-width="1.6"/>`,
   front:flatCap('#6d6a62','#4f4c45',id,4)+`<path d="M124 146 L150 150 L150 143 Q160 141 168 145 Q170 162 156 164 Q148 164 148 156 L124 152Z" fill="#5a3418" ${SW(2.2)}/>`};},
 (c1,c2,id)=>{const sc=scarfArt(c1,c2,id);return {id,skin:SKIN.fair,hair:['#c98a4a','#9a6030'],iris:'#4a7ab5',bg:'#c8202f',bg2:'#a3141f',face:'round',mouth:'grin',eyes:'squint',blush:'#e8806a',browW:1,browC:'#c98a4a',defs:sc.defs,
   body:`<path d="M22 300 C24 236 58 208 100 196 L140 196 C182 208 216 236 218 300Z" fill="#1f2a52" ${SW(3.6)}/><path d="M166 214 C192 230 210 256 216 300 L182 300 C178 266 172 238 166 214Z" fill="#141c3a"/>${[236,262].map(y=>`<rect x="136" y="${y}" width="16" height="6" rx="3" fill="#d9c9a3" ${SW(1.6)}/>`).join('')}`,
   collar:sc.art,faceExtra:[[96,122],[102,126],[140,122],[146,126],[108,120],[134,120]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.4" fill="#b8683a" opacity=".7"/>`).join(''),
   front:`<path d="M76 98 C72 58 96 38 120 38 C144 38 168 58 164 98Z" fill="${c1}" ${SW(3.4)}/>${[88,100,112,124,136,148].map(x=>`<path d="M${x} 48 L${x-2} 96" stroke="rgba(0,0,0,.18)" stroke-width="2"/>`).join('')}<path d="M76 98 C100 90 140 90 164 98 L164 110 C140 102 100 102 76 110Z" fill="${c2}" ${SW(2.6)}/><circle cx="120" cy="34" r="11" fill="${c2}" ${SW(2.6)}/>`};},
 (c1,c2,id)=>{const sc=scarfArt(c1,c2,id);return {id,skin:SKIN.fair,hair:['#6b4a30','#43301f'],iris:'#5a7a4a',bg:'#2f8a7a',bg2:'#1f6a5c',face:'fem',mouth:'lips',lip:'#b8202f',blush:'#e88a7a',browW:.4,browLift:2,defs:sc.defs+`<pattern id="hs-${id}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#e8d9a8"/><circle cx="6" cy="6" r="2.4" fill="#c8202f"/></pattern>`,
   hairBack:`<path d="M70 124 C60 60 88 30 120 30 C152 30 180 60 170 124 C160 90 144 74 120 74 C96 74 80 90 70 124Z" fill="url(#hs-${id})" ${SW(3.4)}/>`,
   body:`<path d="M22 300 C24 236 58 208 100 196 L140 196 C182 208 216 236 218 300Z" fill="#8a3a4a" ${SW(3.6)}/><path d="M166 214 C192 230 210 256 216 300 L182 300 C178 266 172 238 166 214Z" fill="#6a2a38"/>`,
   collar:sc.art,
   hairFront:`<path d="M80 100 C80 64 100 50 120 50 C140 50 160 64 160 100 C150 80 136 70 120 70 C104 70 90 80 80 100Z" fill="#6b4a30" ${SW(2.6)}/><path d="M74 104 C70 64 94 36 120 36 C146 36 170 64 166 104 C158 74 142 60 120 60 C98 60 82 74 74 104Z" fill="url(#hs-${id})" ${SW(3)}/>`,
   front:`<path d="M100 166 L120 182 L140 166 L134 190 L120 184 L106 190Z" fill="url(#hs-${id})" ${SW(2.4)}/><g transform="translate(160 236)"><circle r="17" fill="${c1}" ${SW(2)}/><circle r="11" fill="${c2}" ${SW(2)}/><circle r="4.5" fill="${c1}" ${SW(1.2)}/><path d="M-6 15 L-12 44 L-4 38 L0 46 L2 17Z" fill="${c2}" ${SW(1.6)}/><path d="M6 15 L13 44 L5 38 L2 17Z" fill="${c1}" ${SW(1.6)}/></g>`};},
 (c1,c2,id)=>{const sc=scarfArt(c1,c2,id);return {id,skin:SKIN.light,hair:['#3b2a1d','#1f150d','#6b4c33'],iris:'#3b2a1d',bg:'#e8692a',bg2:'#c9521a',face:'normal',mouth:'open',defs:sc.defs,
   back:`<path d="M58 210 C44 150 60 70 120 60 C180 70 196 150 182 210Z" fill="#6f7a48" ${SW(3.4)}/><path d="M66 206 C54 156 66 84 120 74 C174 84 186 156 174 206" fill="none" stroke="#a89a78" stroke-width="10" stroke-dasharray="3 3"/>`,
   hairBack:`<path d="M72 118 C60 54 86 30 120 30 C154 30 180 54 168 118 C162 88 148 76 120 76 C92 76 78 88 72 118Z" fill="#3b2a1d" ${SW(3.4)}/>`,
   hairFront:`<path d="M76 102 C70 56 94 38 122 38 C150 38 172 56 164 102 C156 88 146 84 136 90 C128 80 116 80 106 90 C96 82 86 88 76 102Z" fill="#3b2a1d" ${SW(3.2)}/>`,
   body:`<path d="M22 300 C24 236 58 208 100 196 L140 196 C182 208 216 236 218 300Z" fill="#6f7a48" ${SW(3.6)}/><path d="M166 214 C192 230 210 256 216 300 L182 300 C178 266 172 238 166 214Z" fill="#525b33"/><path d="M120 206 L120 300" stroke="#525b33" stroke-width="3"/><circle cx="60" cy="250" r="9" fill="#1f4fb0" ${SW(1.6)}/><circle cx="60" cy="250" r="5" fill="#f3efe6"/><circle cx="60" cy="250" r="2.4" fill="#c8202f"/>`,
   collar:sc.art};},
 (c1,c2,id)=>{const sc=scarfArt(c1,c2,id);return {id,skin:SKIN.ruddy,hair:['#4a3a2a','#2a2018'],iris:'#4a5a7a',bg:'#1f4fb0',bg2:'#153a88',face:'normal',mouth:'grin',blush:'#d86a56',browW:2,browLift:3,defs:sc.defs,
   body:`<path d="M22 300 C24 236 58 208 100 196 L140 196 C182 208 216 236 218 300Z" fill="#b8a888" ${SW(3.6)}/><path d="M166 214 C192 230 210 256 216 300 L182 300 C178 266 172 238 166 214Z" fill="#968866"/><path d="M100 196 L84 214 L104 232 L120 300 M140 196 L156 214 L136 232 L120 300" fill="none" stroke="#968866" stroke-width="3"/>`,
   collar:sc.art,
   front:`<path d="M48 76 Q120 58 192 76 Q198 84 186 88 Q120 72 54 88 Q42 84 48 76Z" fill="#3a3a44" ${SW(3.2)}/><path d="M78 76 C76 40 100 32 120 32 C140 32 164 40 162 76 Q120 66 78 76Z" fill="#4a4a56" ${SW(3.2)}/><path d="M78 68 Q120 58 162 68 L162 76 Q120 66 78 76Z" fill="${c1}"/>
    <g transform="translate(166 160) rotate(-25)"><rect x="0" y="-60" width="16" height="62" fill="#b07a3a" ${SW(2.4)}/><path d="M3 -52 L13 -52 M3 -40 L13 -40 M3 -28 L13 -28" stroke="#7a5020" stroke-width="2"/><rect x="-6" y="0" width="28" height="10" fill="${c1}" ${SW(2)}/><rect x="5" y="10" width="7" height="30" fill="#8a5a2a" ${SW(2)}/></g>${fist(158,200,'#eeb896','#cf8a68')}`};},
 (c1,c2,id)=>{const sc=scarfArt(c1,c2,id);return {id,skin:SKIN.olive,hair:['#5a4636','#3a2c20'],iris:'#4a3a2a',bg:'#5e7a3a',bg2:'#46602a',face:'square',mouth:'open',browW:2.6,defs:sc.defs,
   hairBack:`<path d="M78 124 C74 104 76 90 82 84 L88 126Z M162 124 C166 104 164 90 158 84 L152 126Z" fill="#5a4636" ${SW(2.4)}/>`,
   faceExtra:`<path d="M92 58 Q112 50 134 54" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".4"/><path d="M80 104 L82 138 L90 138 L88 102Z M160 104 L158 138 L150 138 L152 102Z" fill="#5a4636"/>`,
   body:`<path d="M22 300 C24 236 58 208 100 196 L140 196 C182 208 216 236 218 300Z" fill="#23283a" ${SW(3.6)}/><path d="M40 222 C70 204 170 204 200 222 L204 246 C170 230 70 230 36 246Z" fill="#111" ${SW(2.4)}/><path d="M166 214 C192 230 210 256 216 300 L182 300 C178 266 172 238 166 214Z" fill="#161a28"/>`,
   collar:sc.art}}
];
function supporterArt(v,idx){const c=club(U());const f=FANLOOKS[v%FANLOOKS.length];return portrait(f(c.c1,c.c2,`fan${v}x${idx}`));}
/* ---------- player portraits: every player gets his own face, in his club's shirt ---------- */
function seeded(n){let s=(n*9301+49297)%233280;return ()=>{s=(s*9301+49297)%233280;return s/233280;};}
function playerLook(p,cid,tag){const r=seeded(p.id*7+13);const pk=a=>a[Math.floor(r()*a.length)];const c=club(cid||p.c)||{c1:'#8a8f96',c2:'#f3efe6'};
  const RL=realLook(p);const skin=RL?RL.skin:pk([SKIN.light,SKIN.fair,SKIN.ruddy,SKIN.warm,SKIN.olive,SKIN.fair]);const gen=RL?null:genericHair(p,r,pk);
  const hc=RL?RL.hc:gen.hc;const hp=hairParts(RL?RL.style:gen.style,hc,{burns:RL?RL.x.burns:gen.burns});
  const old=age(p)>=31||(RL&&RL.x.old),young=age(p)<=22;
  const bgs=[['#1f4fb0','#153a88'],['#c8202f','#a3141f'],['#e0a21e','#b8770f'],['#2f8f8a','#1f6a64'],['#5e7a3a','#46602a'],['#6e2a5a','#521e44'],['#e8692a','#c9521a']];const bg=pk(bgs);
  const body=`<path d="M22 300 C24 236 58 208 100 196 L140 196 C182 208 216 236 218 300Z" fill="${c.c1}" ${SW(3.6)}/><path d="M166 214 C192 230 210 256 216 300 L182 300 C178 266 172 238 166 214Z" fill="rgba(0,0,0,.2)"/><path d="M60 232 C54 258 50 282 50 300" fill="none" stroke="rgba(0,0,0,.2)" stroke-width="3"/>`;
  const collar=`<path d="M94 192 Q120 214 146 192 L148 204 Q120 228 92 204Z" fill="${c.c2}" ${SW(2.6)}/>`;
  const iris=pk(['#4a6fa5','#5a7a4a','#5a4a3a','#3b2a1d','#4f6a86']);const face=RL?RL.face:pk(['normal','square','round','normal','long']);const mouth=RL&&RL.x.mouth?RL.x.mouth:pk(['plain','plain','smirk']);const browW=RL&&RL.x.browW?RL.x.browW:pk([1,1.6,2.4]);
  const freck=RL&&RL.x.freck?[...Array(14)].map((_,i)=>`<circle cx="${(i%2?132:96)+((i*7)%16)-8}" cy="${118+((i*5)%12)}" r="1.4" fill="#b5652a" opacity=".55"/>`).join(''):'';
  return {id:`pl${p.id}${tag||''}`,zoom:1.0,skin,hair:hc,iris:RL&&skin===SKIN.dark?'#3b2a1d':iris,bg:bg[0],bg2:bg[1],face,mouth,browW,browC:hc===HC.bld||hc===HC.fai?hc[1]:undefined,blush:young&&skin!==SKIN.dark?'#e88a7a':null,stubble:!RL&&!young&&r()<0.2,
    hairBack:hp.back,hairFront:hp.front,body,collar,
    faceExtra:(old?`<path d="M88 118 Q92 128 90 136 M152 118 Q148 128 150 136" fill="none" stroke="${skin[2]}" stroke-width="1.6"/>`:'')+freck};}
const playerArt=(p,cid,tag)=>portrait(playerLook(p,cid,tag));

/* ---------- a knock on the office door ---------- */
function relOf(p){const R=G.recs&&G.recs[U()];const ap=R?(R.ap[p.id]||0):0;const y=R&&R.yrs[p.id]?R.yrs[p.id][1]-R.yrs[p.id][0]+1:0;return clamp(Math.round(ap*0.6+y*8+(p.relAdj||0)),0,100);}
const relWord=v=>v>=75?'Close':v>=50?'Good':v>=25?'Cordial':v>=10?'Cool':'Strained';
function longBond(p){const R=G.recs&&G.recs[U()];const y=R&&R.yrs[p.id]?R.yrs[p.id][1]-R.yrs[p.id][0]:0;return relOf(p)>=55&&y>=2;}
const relAdj=(p,v)=>{p.relAdj=(p.relAdj||0)+v;};
const avgForm=p=>p.form.length?p.form.reduce((t,r)=>t+r,0)/p.form.length:0;
const everyone=(d)=>sq(U()).forEach(q=>q.mor=clamp(q.mor+d,5,100));
const TALKS={
 games:{who:'player',title:p=>`${p.n} wants a word`,q:p=>{const n=p.apps?`${p.apps} game${p.apps===1?'':'s'}`:'not a single game';const t=temper(p);return t==='fiery'?`Boss, I've had ${n} all season. I didn't come here to sit in the stand. I need first-team football.`:t==='calm'?`Have you got a minute, boss? I've had ${n} so far. I'm not complaining, I just want to know where I stand.`:`Boss, I've had ${n} this season. I think I've done enough in training to deserve a chance. Where do I stand?`;},
  opts:[['You will get your chance. I promise you games in the next month.',p=>{p.mor=clamp(p.mor+8,5,100);p.promise={k:'games',until:addDays(G.date,28),apps:p.apps+2};return `He nods slowly. "I'll hold you to that, boss."`;}],
   ['Fight for your place like everyone else.',p=>{const t=temper(p);const xi=new Set(G.user.xi);const st=sq(U()).filter(q=>q.pos===p.pos&&xi.has(q.id));const gap=st.length?p.ca-Math.min(...st.map(q=>q.ca)):0;
    if(t==='fiery'&&gap>=0){p.mor=clamp(p.mor-8,5,100);relAdj(p,-4);return 'He storms out. The office door rattles in its frame.';}
    if(t==='calm'||gap<=-2){p.mor=clamp(p.mor-1,5,100);return `He nods. "Fair enough, boss. I'll show you in training."`;}
    p.mor=clamp(p.mor-4,5,100);relAdj(p,-1);return `"Right," he says, not looking entirely convinced. He goes back out to training.`;}],
   ["If you're not happy, I'll put you on the transfer list.",p=>{p.listed=true;p.mor=clamp(p.mor+2,5,100);return `"Maybe that's for the best," he says quietly. He is on the list.`;}]]},
 raise:{who:'player',title:p=>`${p.n} asks for a rise`,q:p=>`I've been playing out of my skin, boss. I'm on £${p.w} a week, and there are lads at other clubs on a lot more for doing a lot less. I think I've earned a rise.`,
  opts:[['You have earned it. An extra twenty per cent from Monday.',p=>{const nw=Math.min(G.wageCap||1e9,Math.round(p.w*1.2));if(nw<=p.w){p.mor=clamp(p.mor-3,5,100);return `The maximum wage is £${G.wageCap}, and he is already on it. There is nothing more you are allowed to give him.`;}if(wageBill(U())+staffBill()+nw-p.w>G.user.budget.wage){p.promise={k:'raise',w:p.w};return "You'd love to, but the wage budget won't stretch. You promise to look again in the summer, and he takes it well enough.";}p.w=nw;p.mor=clamp(p.mor+10,5,100);relAdj(p,6);return `He shakes your hand. He is now on £${nw} a week.`;}],
   ["Keep this form up and we'll talk in the summer.",p=>{p.promise={k:'raise',w:p.w};p.mor=clamp(p.mor-2,5,100);return `"I'll be back in May, then," he says. He will remember.`;}],
   ['You signed a contract. Honour it.',p=>{p.mor=clamp(p.mor-10,5,100);relAdj(p,-8);if(rand()<0.35){p.listed=true;return 'He goes quiet, then hands in a written transfer request. He is on the list.';}return 'He leaves without a word. He is not happy.';}]]},
 unsettled:{who:'player',title:p=>`${p.n} has heard about the bid`,q:p=>`${cn(p.unsettled)} wanted me, boss. That's a big club. I'd like to talk to them if they come back.`,
  opts:[["You're going nowhere. You're a big part of my plans.",p=>{p.mor=clamp(p.mor-8,5,100);relAdj(p,-4);p.unsettled=null;return 'He shrugs. He will do his job, but his heart is elsewhere for a while.';}],
   ["I'll give you a rise to stay. Twenty-five per cent.",p=>{const nw=Math.min(G.wageCap||1e9,Math.round(p.w*1.25));p.unsettled=null;if(nw<=p.w){p.mor=clamp(p.mor-4,5,100);return 'The maximum wage rules it out. He leaves disappointed.';}if(wageBill(U())+staffBill()+nw-p.w>G.user.budget.wage){p.mor=clamp(p.mor-4,5,100);return "The wage budget won't allow it, and he knows it. He leaves disappointed.";}p.w=nw;p.mor=clamp(p.mor+6,5,100);relAdj(p,4);return `That does the trick. He is now on £${nw} a week and says he is staying.`;}],
   ['All right. If they come back, I will let you talk.',p=>{p.listed=true;p.unsettled=null;p.mor=clamp(p.mor+5,5,100);return 'He thanks you. He is on the transfer list, and the phone will ring.';}]]},
 homesick:{who:'player',title:p=>`${p.n} is homesick`,q:p=>`The weather, boss. The food. The rain comes sideways. My wife has cried every day since we arrived. I don't know if I can stay here.`,
  opts:[['The club will find you a proper house and a car. Give it until Christmas.',p=>{const cost=Math.round(1000*infl());club(U()).bal-=cost;G.user.fin.run+=cost;p.mor=clamp(p.mor+12,5,100);relAdj(p,6);p.homesick=true;return `It costs the club ${money(cost)}, but he looks a different man.`;}],
   ["Chin up. You'll get used to it.",p=>{p.mor=clamp(p.mor-6,5,100);relAdj(p,-3);p.homesick=true;return 'He nods, but he looks at the rain on the window for a long time.';}],
   ["If you want to go home, I won't stand in your way.",p=>{p.homesick=true;const to=p.fromAbroad||'his old club';const fee=roundFee(valueOf(p)*0.8);club(U()).bal+=fee;G.user.fin.sales+=fee;G.user.budget.transfer+=Math.round(fee*0.75);removeFromUser(p);p.hist.push({y:G.year,from:U(),to:'ABR',fee});setClub(p,'ABR','home');p.abroad=to;UI.dealNext={kind:'sell',pid:p.id,fee,w:0,toName:to,fromCid:U()};return `He goes home to ${to}, who pay ${money(fee)} for him.`;}]]},
 veteran:{who:'player',title:p=>`${p.n} is thinking about retiring`,q:p=>`I'm ${age(p)}, boss. The legs aren't what they were, and the mornings are harder. I'm thinking of packing it in this summer.`,
  opts:[['Nonsense. You have another year in you. Stay on.',p=>{p.noRetire=G.year;p.mor=clamp(p.mor+5,5,100);relAdj(p,4);return '"Go on then, one more," he laughs.';}],
   ['Hang them up with pride. You have been a great servant.',p=>{p.retireAtEnd=true;return 'He shakes your hand at the door. He will retire in the summer.';}],
   ['Stay on as a coach. I want you in the backroom.',p=>{p.retireAtEnd=true;p.coachOffer=true;return 'His face lights up. He will join your backroom staff in the summer, if there is a place for him.';}]]},
 dressing:{who:'player',title:p=>`${p.n} speaks for the dressing room`,q:p=>`Boss, the dressing room is on the floor. The lads are frightened to get the ball. They need something from you.`,
  opts:[['Take the lads out tonight. The club is paying.',p=>{const cost=Math.round(200*infl());club(U()).bal-=cost;G.user.fin.run+=cost;everyone(6);G.user.dressDone=true;return `A good night was had by all, at ${money(cost)} to the club. Spirits lift.`;}],
   ['Clear-the-air meeting, tomorrow morning. Everyone says his piece.',p=>{G.user.dressDone=true;if(rand()<0.6){everyone(5);return 'Some hard things are said, but the air is cleared. The lads come out of it together.';}everyone(-3);return 'It turns into a shouting match. Two of them nearly come to blows.';}],
   ['Tell them to stop feeling sorry for themselves.',p=>{G.user.dressDone=true;everyone(-2);G.user.whip=true;return 'He relays the message. The lads are stung, and they will be fired up on Saturday.';}]]},
 discipline:{who:'trainer',title:p=>`The trainer on ${p.n}`,q:p=>`A word, boss. ${p.n} was seen at the dog track at two in the morning before training. Half the town knows about it already.`,
  opts:[["Fine him a week's wages.",p=>{p.mor=clamp(p.mor-6,5,100);everyone(1);return `He pays up, grumbling. The rest of the lads note that you mean business.`;}],
   ['Drop him for the next match.',p=>{p.mor=clamp(p.mor-10,5,100);relAdj(p,-5);p.drop=addDays(G.date,7);p.susp=false;p.dropWhy='Dropped for disciplinary reasons';removeFromUser(p);everyone(2);return 'He is out of the side for the next match. The dressing room approves.';}],
   ['Boys will be boys.',p=>{p.mor=clamp(p.mor+3,5,100);relAdj(p,2);everyone(-2);return 'He thanks you. Some of the senior pros are less impressed.';}]]}
};
/* each man's temperament, fixed for life */
function temper(p){const r=seeded(p.id*13+7)();return r<0.18?'fiery':r<0.5?'calm':'steady';}
/* how strong is his case? 0 means he has none. He must be next in line in his position, close to the man
   picked ahead of him, and a real share of the season must have gone by without him. */
function benchCase(p,S,xi){if(xi.has(p.id)||p.inj||age(p)>31||(p.drop&&p.drop>=G.date))return 0;
  const played=G.fx.filter(f=>f.p&&isUserFx(f)).length;if(played<10)return 0;
  if(p.apps>Math.max(2,played*0.2))return 0;
  const rivals=S.filter(q=>q.pos===p.pos&&q.id!==p.id);const starters=rivals.filter(q=>xi.has(q.id));
  if(rivals.some(q=>!xi.has(q.id)&&!q.inj&&q.ca>p.ca))return 0;
  const gap=starters.length?p.ca-Math.min(...starters.map(q=>q.ca)):p.ca-Math.min(...S.filter(q=>xi.has(q.id)).map(q=>q.ca));
  if(gap<-3)return 0;
  if(p.pos==='GK'&&gap<0)return 0;
  const young=age(p)<=20?0.6:1;const t={fiery:1.3,steady:1,calm:0.7}[temper(p)];
  return clamp((gap+4)/8,0.1,1)*young*t*(p.mor<50?1.2:1);}
function pickTalk(){const u=G.user;const S=sq(U());const xi=new Set(u.xi);const c=club(U());
  const uns=S.find(p=>p.unsettled);if(uns)return ['unsettled',uns];
  if((c.fstreak||0)<=-4&&!u.dressDone){const lead=S.filter(p=>age(p)>=27&&!p.inj).sort((a,b)=>b.ca-a.ca)[0];if(lead)return ['dressing',lead];}
  if((c.fstreak||0)>=0)u.dressDone=false;
  const mo=G.date.slice(5,7);if(mo==='03'||mo==='04'){const v=S.find(p=>age(p)>=34&&p.apps>=8&&p.vetTalk!==G.year&&!(avgForm(p)>=7.3&&rand()>0.2));if(v){v.vetTalk=G.year;return ['veteran',v];}}
  const xs=u.xi.map(id=>G.players[id]).filter(Boolean);const bar=xs.length?Math.min(...xs.map(p=>p.ca)):50;
  {const g=S.find(p=>benchCase(p,S,xi)>0&&p.gamesTalk!==G.year&&!p.promise);if(g&&rand()<0.5+0.5*Math.min(1,benchCase(g,S,xi))){g.gamesTalk=G.year;return ['games',g];}}
  if(!G.wageCap&&rand()<0.45){const r=S.find(p=>wageGrievance(p)&&p.raiseTalk!==G.year&&!p.promise&&p.form.length>=3);if(r){r.raiseTalk=G.year;return ['raise',r];}}
  const h=S.find(p=>p.fromAbroad&&p.nat&&!UKN.includes(p.nat)&&!p.homesick&&p.signed&&daysBetween(p.signed,G.date)>=30);if(h&&rand()<(upgDone('welfare')?0.25:0.5))return ['homesick',h];
  if(rand()<(upgDone('welfare')?0.45:0.75)){const st=pickSitu(S);if(st)return st;}
  return null;}
function talkTick(){const u=G.user;if(G.autopilot)return;
  sq(U()).forEach(p=>{if(p.promise&&p.promise.k==='games'&&G.date>p.promise.until){if(p.apps>=p.promise.apps){p.mor=clamp(p.mor+4,5,100);relAdj(p,8);p.second=false;p.promise=null;msg('club',`${p.n} is happy`,`You kept your word about first-team football, and ${p.n} has noticed.`);}else if(longBond(p)&&!p.second){p.second=true;relAdj(p,-8);p.mor=clamp(p.mor-8,5,100);p.promise={k:'games',until:addDays(G.date,28),apps:p.apps+2};msg('club',`${p.n} gives you another chance`,`${p.n} is hurt that you broke your promise of first-team football. "We've been through a lot together, boss, so I'll give you one more month. Don't let me down again." If he doesn't get his games this time, he will ask to leave.`);}else{p.mor=clamp(p.mor-15,5,100);relAdj(p,-20);p.listed=true;p.second=false;p.promise=null;msg('club',`${p.n} asks for a transfer`,`${p.n} says you broke your promise of first-team football${p.second===false&&longBond(p)?' twice':''}. He has handed in a transfer request and is now on the list.`);}}});
  if((G.talkQ||[]).length||daysBetween(u.lastTalk||'1900-01-01',G.date)<24||rand()>0.45)return;
  const t=pickTalk();if(!t)return;const [type,p]=t;if(captainHandles(type,p)){u.lastTalk=G.date;return;}const D=TALKS[type];u.lastTalk=G.date;
  const qq=D.q(p);const m=msg('club',D.title(p),`${D.who==='trainer'?'The trainer':p.n}: "${qq}"`,{k:'talk',type,pid:p.id,q:qq});(G.talkQ=G.talkQ||[]).push(m.id);}
function talkHTML(N){const m=G.inbox.find(x=>x.id===N.mid);if(!m){UI.notice=null;return '';}const a=m.act;const p=G.players[a.pid];const D=TALKS[a.type];if(!p||!D){UI.notice=null;return '';}
  const trainer=D.who==='trainer';
  return `<div class="scrim"></div><div class="presscard talkcard" role="dialog" aria-modal="true" aria-label="${esc(m.title)}">
   <div class="pc-art talk-art">${playerArt(p,U(),'t')}<p class="pc-rep"><strong>${esc(p.n)}</strong><small>${POSN[p.pos]}, ${age(p)} · Overall ${p.ca} · ${moraleWord(p.mor)} morale</small></p></div>
   <div class="pc-body"><p class="eyebrow">${trainer?'The trainer knocks on your door':'A knock on the office door'}</p>${(()=>{const R=roomOf();return `<p class="talk-ctx"><span><b>${TEMPW[temper(p)]}</b> temperament</span><span>Gets on with you: <b>${relWord(relOf(p))}</b></span><span>Dressing room: <b>${esc(R.word)}</b></span><span>Supporters: <b>${moodWord(fans())}</b></span></p>`;})()}${trainer?`<p class="muted sm">About ${esc(p.n)}:</p>`:''}<blockquote class="pc-q">"${esc(a.q||D.q(p))}"</blockquote>
   ${a.done?`<div class="pc-res"><p class="pc-you">You: "${esc(D.opts[a.choice][0])}"</p><p>${esc(a.res)}</p><button class="btn go" data-a="talkdone">Back to work ▸</button></div>`:
    `<div class="pc-ans">${D.opts.map((o,i)=>`<button class="pc-a" data-a="talkans" data-i="${i}"><span class="pc-num">${'ABC'[i]}</span>"${esc(o[0])}"</button>`).join('')}<button class="btn ghost sm" data-a="talklater">"Not now. Come back later."</button></div>`}</div></div>`;}

/* ---------- negotiation ---------- */
const patDots=n=>`<span class="pat" title="Patience">${[0,1,2].map(i=>`<i class="${i<n?'on':''}"></i>`).join('')}</span>`;
function sellerMin(p,ask){let m=ask*rf(0.84,0.95);if(p.listed)m=ask*rf(0.78,0.9);if(p.c&&p.c!=='ABR'&&club(p.c).bal<0)m*=0.9;if(overseas(p))m=ask*rf(0.9,0.98);return roundFee(m);}
const prefYears=p=>age(p)>=30?3:age(p)<=22?4:3;
const lenMult=(p,y)=>1+0.05*Math.abs(y-prefYears(p))+(age(p)>=33&&y>2?0.1*(y-2):0);
const conEnds=p=>p.until!=null?p.until+1:null;
const renewDemand=p=>Math.max(Math.round(p.w*1.1),wageDemand(p));
function setWageTerms(p,md,base){const me=club(U());const from=p.c&&p.c!=='ABR'?club(p.c):null;const frp=p.c==='ABR'?frep(p):from?from.rep:0;
  let mn=rf(0.82,0.93);if((G.user.pull||0)>3)mn*=0.97;if(!md.renew&&me.rep>frp+10)mn*=0.96;
  md.years=md.years||prefYears(p);md.wn={base,minF:mn,pat:3,c:null};applyYears(p,md);}
function applyYears(p,md){const wn=md.wn;const k=lenMult(p,md.years);let d=Math.round(wn.base*k),mn=Math.round(wn.base*wn.minF*k);
  if(G.wageCap){d=Math.min(d,G.wageCap);mn=Math.min(mn,G.wageCap);}wn.d=Math.max(1,d);wn.min=Math.max(1,mn);if(wn.c)wn.c=Math.max(wn.c,wn.min);}
function enterTerms(p,md,note){const me=club(U());const from=p.c&&p.c!=='ABR'?club(p.c):null;
  const frp=p.c==='ABR'?frep(p):from?from.rep:0;
  if(frp>me.rep+(p.c==='ABR'?8:18)+(G.user.pull||0)*1.5&&p.ca>=70&&!p.listed){md.note=`${p.n} isn't interested in dropping down to ${me.n}. The deal is off.`;md.stage='done';return;}
  setWageTerms(p,md,wageDemand(p));md.stage='terms';md.note=note;}
function enterRenew(p,md){if(p.listed){md.note=`${p.n} is on the transfer list and has no interest in a new contract.`;md.stage='done';return;}
  if(p.mor<30){md.note=`${p.n} says he would rather see out his contract and move on. Try again when he is happier.`;md.stage='done';return;}
  md.renew=true;md.fee=0;setWageTerms(p,md,renewDemand(p));md.stage='terms';md.note='';}
function finishTerms(p,md,w){return md.renew?completeRenewal(p,md,w):completeSigning(p,md,w);}
function completeRenewal(p,md,w){if(wageBill(U())+staffBill()-p.w+w>G.user.budget.wage){md.note=`£${w} a week would take you over the wage budget of ${money(G.user.budget.wage)}.`;return false;}
  p.w=w;p.until=G.year+md.years;p.mor=clamp(p.mor+(w>=md.wn.d?6:2),5,100);p.renewedYear=G.year;
  msg('club',`${p.n} signs a new contract`,`${p.n} has agreed a new ${md.years}-year contract on £${w} a week. It runs until the summer of ${p.until+1}.`);
  UI.modal=null;UI.notice={k:'deal',kind:'renew',pid:p.id,w,years:md.years};save();return true;}
function completeSigning(p,md,w){const me=club(U());const from=p.c&&p.c!=='ABR'?club(p.c):null;
  if(md.fee>me.bal){md.note='Not enough in the bank.';return false;}
  if(md.fee>G.user.budget.transfer){md.note=`That fee is over your transfer budget of ${money(G.user.budget.transfer)}.`;return false;}
  if(wageBill(U())+staffBill()+w>G.user.budget.wage){md.note=`£${w} a week would take you over the wage budget of ${money(G.user.budget.wage)}. Free up some wages first, or move money across on the Finances tab.`;return false;}
  const fromName=p.c==='ABR'?p.abroad:from?from.n:'free agent';const fromCid=from?from.id:null;
  const wasAbroad=p.c==='ABR'?p.abroad:null;if(p.c)transfer(p,U(),md.fee);else{p.hist.push({y:G.year,from:null,to:U(),fee:0});setClub(p,U());}
  p.mor=clamp(75+(w>=md.wn.d?3:-2),5,100);p.w=w;p.signed=G.date;p.until=G.year+md.years-1;
  if(wasAbroad){p.fromAbroad=wasAbroad;p.abroad=null;const R=REC(U());if(R.recBuy&&R.recBuy.n===p.n)R.recBuy.club=wasAbroad;
    msg('press',`${surname(p.n).toUpperCase()} COMES TO ENGLAND`,`${p.n} swaps ${wasAbroad} for ${me.g}. ${me.n} have paid ${money(md.fee)} to bring him to the Football League.`,null,U());}
  msg('club',`${p.n} signs`,`${p.n} puts pen to paper at ${me.g}${md.fee?` after a ${money(md.fee)} transfer`:''}. He signs a ${md.years}-year contract on £${w} a week.`);
  if(!wasAbroad)msg('press',`${surname(p.n).toUpperCase()} SIGNS FOR ${me.s.toUpperCase()}`,`${me.n} manager ${G.user.name} has signed ${p.n}${from?` from ${from.n}`:''}${md.fee?` for ${money(md.fee)}`:' on a free transfer'}.`,null,U());
  G.user.lastBuy={n:p.n,d:G.date};objSigned(p);{const q=staffQ('scout');if(q&&md.fee)staffImp('scout',md.fee*0.025*q/(1-0.025*q));}if(p.ca>=teamRating(U())+3)me.fans=clamp(fans()+4,0,100);{const ct=chairT();if(ct==='amb'&&md.fee>=storyFee())bumpConf(2);if(ct==='acct'&&md.fee>=storyFee())bumpConf(-1.5);if(ct==='youth'&&age(p)>30)bumpConf(-2);}
  if(G.user.deals)delete G.user.deals[p.id];G.inbox.forEach(m=>{if(m.act&&m.act.k==='terms'&&m.act.pid===p.id&&!m.act.done){m.act.done=true;m.act.res=`Signed for ${money(md.fee)}`;}});
  UI.modal=null;UI.notice={k:'deal',kind:'buy',pid:p.id,fee:md.fee,w,years:md.years,fromName,fromCid,ask:md.neg?md.neg.ask:0};save();return true;}
function negHTML(p,md){const ask=p.c&&p.c!==U()?askPrice(p,true):0;const seller=p.c&&p.c!==U()?sellerN(p):'';const n=md.neg,wn=md.wn;
  if(md.stage==='done')return '';
  if(md.stage==='terms'||md.stage==='wcounter'){const cap=G.wageCap;const val=md.stage==='wcounter'?wn.c:(md.wtry||wn.d);const py=prefYears(p);
    return `<div class="bid">${md.renew?`<p class="eyebrow">A new contract</p>`:''}<p>${!md.renew&&p.c?`Fee agreed: <strong>${money(md.fee)}</strong>. `:''}${esc(p.n)} is asking for <strong>£${wn.d} a week</strong> over ${md.years} year${md.years===1?'':'s'}.${cap?` (The maximum wage is £${cap}.)`:''}</p>
     <div class="tacrow"><span class="lbl">Contract length</span><div class="seg" role="group" aria-label="Contract length">${[1,2,3,4,5].map(y=>`<button class="${md.years===y?'on':''}" data-a="setyears" data-v="${y}" data-id="${p.id}">${y} yr${y>1?'s':''}</button>`).join('')}</div><small class="muted">He would like ${plu(py,'year')}. Offer a different length and he will want a little more.</small></div>
     ${md.stage==='wcounter'?`<p class="counter">He'll sign for <strong>£${wn.c} a week</strong>${wn.pat<=0?", and he says that is his last word":''}. ${patDots(wn.pat)}</p><div class="row gap wrap"><button class="btn go" data-a="acceptwage" data-id="${p.id}">Agree £${wn.c} a week</button>${wn.pat>0?'':`<button class="btn" data-a="closeModal">Walk away</button>`}</div>`:''}
     ${md.stage==='terms'||wn.pat>0?`<label class="lbl" for="bid-wage">Your wage offer, per week ${patDots(wn.pat)}</label><div class="row gap wrap"><input id="bid-wage" class="inp sm" type="number" min="1" ${cap?`max="${cap}"`:''} step="1" value="${val}"><button class="btn ${md.stage==='terms'?'go':''}" data-a="offerwage" data-id="${p.id}">Offer terms</button></div>`:''}
     <small class="muted">Wage budget ${money(G.user.budget.wage)} a week, ${money(wageBill(U())+staffBill())} used</small></div>`;}
  if(md.stage==='counter')return `<div class="bid"><p class="counter">${esc(seller)} come back with <strong>${money(n.c)}</strong>${n.pat<=0?'. "And that is our final word."':'.'} ${patDots(n.pat)}</p>
     <div class="row gap wrap"><button class="btn go" data-a="acceptfee" data-id="${p.id}">Accept ${money(n.c)}</button>${n.pat>0?'':'<button class="btn" data-a="closeModal">Walk away</button>'}</div>
     ${n.pat>0?`<label class="lbl" for="bid-fee">Or make another offer</label><div class="row gap wrap"><input id="bid-fee" class="inp sm" type="number" min="0" step="250" value="${md.fee||n.c}"><button class="btn" data-a="bid" data-id="${p.id}">Make offer</button></div>`:''}
     <small class="muted">Transfer budget ${money(G.user.budget.transfer)}</small></div>`;
  return `<div class="bid"><label class="lbl" for="bid-fee">${p.c?`Your offer to ${esc(seller)} (they value him at ${money(ask)})`:'He is a free agent. No fee needed.'} ${n?patDots(n.pat):''}</label>${p.c?`<div class="row gap wrap"><input id="bid-fee" class="inp sm" type="number" min="0" step="250" value="${md.fee||ask}"><button class="btn go" data-a="bid" data-id="${p.id}">Make offer</button></div>`:`<button class="btn go" data-a="bid" data-id="${p.id}">Talk terms</button>`}<small class="muted">Transfer budget ${money(G.user.budget.transfer)}. Clubs will usually take a little less than their valuation, and they will haggle.</small></div>`;}

/* ---------- deal agreed ---------- */
function handshakeSVG(lc,rc){const ink='#1c1b19',sk='#e8b48c',sh='#c07f5c';
  return `<svg viewBox="0 0 400 170" class="shake" aria-hidden="true"><polygon points="${[...Array(24)].map((_,i)=>{const a=i*Math.PI/12,r=i%2?52:80;return `${(200+r*Math.cos(a)).toFixed(1)},${(84+r*Math.sin(a)*0.8).toFixed(1)}`;}).join(' ')}" fill="#f2c14e" stroke="${ink}" stroke-width="3"/>
   <path d="M-4 66 L138 58 L150 104 L-4 114Z" fill="${lc}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/><path d="M128 58 L140 104" stroke="#f3efe6" stroke-width="10"/><path d="M128 58 L140 104" stroke="${ink}" stroke-width="2"/>
   <path d="M404 58 L262 54 L252 98 L404 106Z" fill="${rc}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/><path d="M272 54 L262 98" stroke="#f3efe6" stroke-width="10"/><path d="M272 54 L262 98" stroke="${ink}" stroke-width="2"/>
   <path d="M142 62 C164 54 196 56 212 66 C222 74 218 92 204 96 L150 102Z" fill="${sk}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
   <path d="M260 56 C236 48 204 52 190 62 C180 72 186 90 204 94 L252 98Z" fill="${sh}" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
   <path d="M196 64 C204 70 206 80 200 88 M208 62 C216 70 216 82 210 90 M220 64 C226 72 224 82 220 88" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
   <path d="M60 40 L84 30 M50 128 L80 136 M320 30 L344 40 M322 138 L352 128" stroke="${ink}" stroke-width="4" stroke-linecap="round"/></svg>`;}
function dealHTML(N){const p=G.players[N.pid];if(!p){UI.notice=null;return '';}const me=club(U());const buy=N.kind==='buy',renew=N.kind==='renew';
  const other=N.fromCid?club(N.fromCid):N.toCid?club(N.toCid):null;const grey='#8a8f96';
  const lc=renew?me.c2:buy?(other?other.c1:grey):me.c1,rc=renew||buy?me.c1:(other?other.c1:grey);
  const fromTxt=buy?N.fromName:me.n,toTxt=buy?me.n:(N.toName||(other?other.n:''));
  const rows=renew?`<div><dt>Player</dt><dd>${esc(p.n)} <small>${POSN[p.pos]}, ${age(p)}</small></dd></div><div><dt>Club</dt><dd>${esc(me.n)}</dd></div><div><dt>Wages</dt><dd>£${N.w} a week</dd></div><div><dt>Contract</dt><dd>${N.years} year${N.years===1?'':'s'}, to ${p.until+1}</dd></div>`
   :`<div><dt>Player</dt><dd>${esc(p.n)} <small>${POSN[p.pos]}, ${age(p)}</small></dd></div><div><dt>From</dt><dd>${esc(fromTxt)}</dd></div><div><dt>To</dt><dd>${esc(toTxt)}</dd></div>
     <div><dt>Fee</dt><dd>${N.fee?money(N.fee):'Free transfer'}${buy&&N.ask&&N.fee<N.ask?` <small class="ar up">▲ ${money(N.ask-N.fee)} under their valuation</small>`:''}</dd></div>${buy?`<div><dt>Wages</dt><dd>£${N.w} a week</dd></div><div><dt>Contract</dt><dd>${N.years} year${N.years===1?'':'s'}, to ${p.until+1}</dd></div>`:''}`;
  return `<div class="scrim" data-a="noticeclose"></div><article class="dealcard" role="dialog" aria-modal="true" aria-label="Deal agreed">
   <p class="dc-kicker">${renew?'Staying put':buy?'Here we go':'Deal done'}</p><h2 class="dc-title">${renew?'New contract!':buy?'Deal agreed!':'Sold!'}</h2>${handshakeSVG(lc,rc)}
   <div class="dc-body"><div class="dc-por">${playerArt(p,buy||renew?U():(N.toCid||U()),'d')}</div><dl class="dc-dl">${rows}</dl></div>
   <p class="dc-note">${renew?`${esc(p.n)} commits his future to ${esc(me.n)}.`:buy?`${esc(p.n)} signs on the dotted line in the ${esc(me.g)} boardroom, and the photographers are let in.`:`The paperwork is signed, and ${esc(p.n)} clears out his locker.`}</p>
   <button class="btn go" data-a="noticeclose">${buy?'Welcome aboard ▸':'Back to work ▸'}</button></article>`;}



/* newspaper pictures: woodcut-style ink drawings */
const INK='#1c1b19',PAP='#f1ead6';
const PICS={
 goal:`<g stroke="${INK}" stroke-width="1.6" opacity=".75">${[0,1,2,3,4,5].map(i=>`<line x1="${132+i*10}" y1="34" x2="${132+i*10}" y2="122"/>`).join('')}${[0,1,2,3,4,5,6,7,8].map(i=>`<line x1="132" y1="${34+i*11}" x2="188" y2="${34+i*11}"/>`).join('')}</g><path d="M130 124 L130 30 L190 30" fill="none" stroke="${INK}" stroke-width="6"/><circle cx="160" cy="72" r="10" fill="${PAP}" stroke="${INK}" stroke-width="3"/><path d="M156 68 L164 68 L166 75 L160 79 L154 75Z" fill="${INK}"/><g stroke="${INK}" stroke-width="12" stroke-linecap="round" fill="none"><path d="M66 66 L70 102"/><path d="M66 70 L44 38 M66 70 L92 40"/><path d="M70 102 L52 138 M70 102 L92 134"/></g><circle cx="64" cy="50" r="12" fill="${INK}"/>`,
 trophy:`<path d="M70 32 Q70 90 100 100 Q130 90 130 32Z" fill="${INK}"/><path d="M72 40 Q44 44 50 66 Q56 82 76 80 M128 40 Q156 44 150 66 Q144 82 124 80" fill="none" stroke="${INK}" stroke-width="7"/><rect x="94" y="100" width="12" height="18" fill="${INK}"/><path d="M76 118 L124 118 L132 142 L68 142Z" fill="${INK}"/><ellipse cx="100" cy="30" rx="32" ry="6" fill="${INK}"/><circle cx="100" cy="16" r="6" fill="${INK}"/><path d="M84 42 Q84 76 98 88" stroke="${PAP}" stroke-width="4" fill="none" opacity=".7"/>`,
 sign:`<g transform="rotate(-4 100 120)"><rect x="40" y="96" width="120" height="54" fill="${PAP}" stroke="${INK}" stroke-width="3"/><path d="M52 110h96M52 120h96M52 130h60" stroke="${INK}" stroke-width="2"/><path d="M110 140 q8 -10 16 0 t16 0" fill="none" stroke="${INK}" stroke-width="2.5"/></g><path d="M0 58 L64 52 L70 76 L0 86Z M200 54 L136 48 L130 72 L200 82Z" fill="${INK}"/><ellipse cx="100" cy="64" rx="42" ry="17" fill="${INK}"/><path d="M84 56 L84 72 M94 54 L94 74 M104 54 L104 74 M114 56 L114 72" stroke="${PAP}" stroke-width="2" opacity=".6"/><path d="M150 96 L176 136" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`,
 manager:`<rect x="20" y="104" width="160" height="12" fill="${INK}"/><rect x="30" y="116" width="10" height="38" fill="${INK}"/><rect x="160" y="116" width="10" height="38" fill="${INK}"/><circle cx="96" cy="48" r="18" fill="${INK}"/><path d="M54 104 Q56 70 96 68 Q136 70 138 104Z" fill="${INK}"/><path d="M92 70 L100 70 L96 94Z" fill="${PAP}"/><path d="M134 104 Q134 92 150 92 Q166 92 166 104Z" fill="${INK}"/><path d="M130 88 Q150 76 170 88" stroke="${INK}" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="40" y="94" width="36" height="10" fill="${PAP}" stroke="${INK}" stroke-width="2"/>`,
 stand:`<rect x="0" y="132" width="200" height="28" fill="${INK}" opacity=".3"/><path d="M18 132 L18 70 L176 58 L176 132Z" fill="${INK}"/><path d="M8 70 L186 50 L186 58 L8 78Z" fill="${INK}"/>${[0,1,2,3,4,5].map(i=>`<path d="M24 ${86+i*8} L170 ${74+i*8}" stroke="${PAP}" stroke-width="2" opacity=".6"/>`).join('')}<path d="M186 132 L191 22 L196 132" stroke="${INK}" stroke-width="3" fill="none"/><path d="M188 110 L194 90 M188 80 L194 60 M188 50 L194 34" stroke="${INK}" stroke-width="2"/><rect x="178" y="8" width="26" height="16" fill="${INK}"/>${[0,1,2].map(i=>`<circle cx="${184+i*7}" cy="16" r="2" fill="${PAP}"/>`).join('')}`,
 rocket:`${[[30,30],[50,110],[160,40],[170,120],[20,80],[140,14]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.5" fill="${INK}"/>`).join('')}<path d="M100 18 Q122 50 117 106 L83 106 Q78 50 100 18Z" fill="${INK}"/><path d="M84 90 L64 124 L86 110Z M116 90 L136 124 L114 110Z" fill="${INK}"/><circle cx="100" cy="56" r="9" fill="${PAP}" stroke="${INK}" stroke-width="3"/><path d="M88 110 Q100 152 112 110Z" fill="${INK}" opacity=".55"/>`,
 moon:`<path d="M140 16 A36 36 0 1 0 178 76 A28 28 0 1 1 140 16Z" fill="${INK}"/><path d="M0 128 Q50 114 100 126 T200 122 L200 160 L0 160Z" fill="${INK}"/><path d="M62 126 L62 76" stroke="${INK}" stroke-width="3"/><rect x="62" y="76" width="32" height="20" fill="${INK}"/>${[[110,140],[124,146],[138,140],[152,146]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="5" ry="3" fill="${PAP}"/>`).join('')}`,
 tv:`<rect x="40" y="34" width="120" height="98" rx="12" fill="${INK}"/><rect x="52" y="46" width="82" height="66" rx="10" fill="${PAP}"/><path d="M60 80 L126 80 M93 50 L93 108" stroke="${INK}" stroke-width="1.5" opacity=".5"/><circle cx="93" cy="80" r="10" fill="none" stroke="${INK}" stroke-width="1.5" opacity=".5"/><circle cx="104" cy="70" r="5" fill="${INK}"/><circle cx="147" cy="58" r="5" fill="${PAP}"/><circle cx="147" cy="80" r="5" fill="${PAP}"/><path d="M100 34 L76 6 M100 34 L128 4" stroke="${INK}" stroke-width="3"/><path d="M56 132 L50 150 M144 132 L150 150" stroke="${INK}" stroke-width="6"/>`,
 record:`<circle cx="92" cy="82" r="58" fill="${INK}"/>${[50,42,34].map(r=>`<circle cx="92" cy="82" r="${r}" fill="none" stroke="${PAP}" stroke-width="1" opacity=".3"/>`).join('')}<circle cx="92" cy="82" r="17" fill="${PAP}"/><circle cx="92" cy="82" r="3" fill="${INK}"/><ellipse cx="164" cy="56" rx="8" ry="6" fill="${INK}"/><path d="M171 56 L171 20 L186 26" stroke="${INK}" stroke-width="3" fill="none"/><ellipse cx="170" cy="110" rx="8" ry="6" fill="${INK}"/><path d="M177 110 L177 78" stroke="${INK}" stroke-width="3"/>`,
 plane:`<ellipse cx="50" cy="40" rx="30" ry="10" fill="${PAP}" stroke="${INK}" stroke-width="2"/><ellipse cx="160" cy="128" rx="34" ry="11" fill="${PAP}" stroke="${INK}" stroke-width="2"/><path d="M18 92 L150 70 Q182 66 188 76 Q184 86 152 88 L30 104Z" fill="${INK}"/><path d="M92 82 L122 40 L136 42 L116 84Z M98 96 L120 132 L134 130 L112 92Z" fill="${INK}"/><path d="M30 96 L20 66 L32 66 L46 92Z" fill="${INK}"/>${[70,84,98,112,126,140].map(x=>`<circle cx="${x}" cy="${86-(x-70)*0.12}" r="2.2" fill="${PAP}"/>`).join('')}`,
 gavel:`<g transform="rotate(-30 110 60)"><rect x="70" y="40" width="76" height="32" rx="6" fill="${INK}"/><rect x="66" y="44" width="8" height="24" fill="${INK}"/><rect x="142" y="44" width="8" height="24" fill="${INK}"/></g><path d="M112 72 L158 134" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><rect x="36" y="124" width="76" height="20" rx="4" fill="${INK}"/>`,
 whistle:`<path d="M50 70 Q50 50 72 50 L150 50 L150 74 L100 74 Q100 100 76 100 Q50 100 50 76Z" fill="${INK}"/><circle cx="76" cy="75" r="8" fill="${PAP}"/><path d="M52 60 Q20 20 60 14 Q120 10 160 32" stroke="${INK}" stroke-width="3" fill="none"/><rect x="124" y="96" width="46" height="56" fill="${PAP}" stroke="${INK}" stroke-width="3"/><path d="M132 112h30M132 122h30M132 132h20" stroke="${INK}" stroke-width="2"/>`,
 mic:`<rect x="74" y="16" width="52" height="78" rx="18" fill="${INK}"/>${[30,42,54,66,78].map(y=>`<line x1="82" x2="118" y1="${y}" y2="${y}" stroke="${PAP}" stroke-width="2.5" opacity=".7"/>`).join('')}<rect x="94" y="94" width="12" height="44" fill="${INK}"/><path d="M60 150 L140 150 L128 138 L72 138Z" fill="${INK}"/>`,
 dog:`<ellipse cx="96" cy="96" rx="48" ry="22" fill="${INK}"/><circle cx="150" cy="74" r="20" fill="${INK}"/><path d="M138 60 L128 40 L146 56Z" fill="${INK}"/><path d="M166 80 L182 84 L168 90Z" fill="${INK}"/><rect x="62" y="108" width="10" height="34" fill="${INK}"/><rect x="118" y="108" width="10" height="34" fill="${INK}"/><path d="M48 90 Q26 72 36 58" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="156" cy="70" r="3" fill="${PAP}"/><path d="M168 96 Q176 108 170 128 L186 128 Q192 108 180 96Z" fill="${PAP}" stroke="${INK}" stroke-width="2"/>`,
 coins:`${[[70,90,'10p'],[112,96,'5p'],[140,70,'10p']].map(([x,y,t])=>`<circle cx="${x}" cy="${y}" r="30" fill="${INK}"/><circle cx="${x}" cy="${y}" r="24" fill="none" stroke="${PAP}" stroke-width="2"/><text x="${x}" y="${y+7}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="18" fill="${PAP}">${t}</text>`).join('')}`,
 ballot:`<rect x="50" y="72" width="100" height="72" fill="${INK}"/><rect x="80" y="72" width="40" height="6" fill="${PAP}"/><g transform="rotate(-10 102 50)"><rect x="84" y="24" width="38" height="46" fill="${PAP}" stroke="${INK}" stroke-width="3"/><path d="M94 38 L112 56 M112 38 L94 56" stroke="${INK}" stroke-width="4"/></g>`,
 snow:`<path d="M0 136 Q60 118 120 132 T200 128 L200 160 L0 160Z" fill="${PAP}" stroke="${INK}" stroke-width="2"/><path d="M40 136 L40 58 L160 58 L160 136" stroke="${INK}" stroke-width="7" fill="none"/>${[[70,30],[120,90],[170,24],[24,96],[100,40]].map(([x,y])=>`<g stroke="${INK}" stroke-width="2.5"><line x1="${x-8}" y1="${y}" x2="${x+8}" y2="${y}"/><line x1="${x}" y1="${y-8}" x2="${x}" y2="${y+8}"/><line x1="${x-6}" y1="${y-6}" x2="${x+6}" y2="${y+6}"/><line x1="${x+6}" y1="${y-6}" x2="${x-6}" y2="${y+6}"/></g>`).join('')}`,
 flag:`<path d="M60 150 L60 14" stroke="${INK}" stroke-width="5"/><path d="M62 60 L140 60 L128 76 L140 92 L62 92Z" fill="${INK}"/><circle cx="130" cy="126" r="22" fill="none" stroke="${INK}" stroke-width="7" stroke-dasharray="6 3"/>`,
 boots:`<circle cx="100" cy="16" r="6" fill="${INK}"/><path d="M100 18 L70 60 M100 18 L130 60" stroke="${INK}" stroke-width="2.5"/><path d="M58 60 L58 108 Q58 122 78 122 L112 122 Q122 122 120 110 L90 102 L90 60Z" fill="${INK}"/><path d="M110 60 L110 108 Q110 122 130 122 L164 122 Q174 122 172 110 L142 102 L142 60Z" fill="${INK}"/>${[66,80,94,118,132,146].map(x=>`<rect x="${x}" y="122" width="6" height="8" fill="${INK}"/>`).join('')}`,
 car:`<path d="M14 112 Q22 90 62 84 L104 80 Q122 60 146 62 Q170 64 182 90 L188 112Z" fill="${INK}"/><path d="M112 80 Q126 66 144 67 Q160 68 168 84Z" fill="${PAP}"/><circle cx="50" cy="114" r="15" fill="${INK}"/><circle cx="50" cy="114" r="8" fill="${PAP}"/><circle cx="156" cy="114" r="15" fill="${INK}"/><circle cx="156" cy="114" r="8" fill="${PAP}"/><path d="M0 130 L200 130" stroke="${INK}" stroke-width="3"/><ellipse cx="22" cy="100" rx="5" ry="3" fill="${PAP}"/>`,
 train:`<rect x="40" y="64" width="90" height="40" rx="6" fill="${INK}"/><rect x="126" y="44" width="44" height="60" fill="${INK}"/><rect x="134" y="54" width="16" height="16" fill="${PAP}"/><rect x="56" y="40" width="14" height="26" fill="${INK}"/><path d="M40 104 L30 118 L176 118 L176 104Z" fill="${INK}"/>${[60,92,124,156].map(x=>`<circle cx="${x}" cy="122" r="12" fill="${PAP}" stroke="${INK}" stroke-width="5"/>`).join('')}<circle cx="64" cy="26" r="10" fill="${PAP}" stroke="${INK}" stroke-width="2"/><circle cx="82" cy="16" r="8" fill="${PAP}" stroke="${INK}" stroke-width="2"/><path d="M0 140 L200 140" stroke="${INK}" stroke-width="4"/>`,
 ship:`<path d="M16 96 L184 96 L166 128 L30 128Z" fill="${INK}"/><rect x="50" y="76" width="96" height="20" fill="${INK}"/><rect x="74" y="44" width="20" height="34" fill="${INK}"/><rect x="104" y="50" width="20" height="28" fill="${INK}"/>${[58,72,86,100,114,128].map(x=>`<circle cx="${x}" cy="86" r="3" fill="${PAP}"/>`).join('')}<path d="M0 138 q12 -8 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0" fill="none" stroke="${INK}" stroke-width="3"/><path d="M84 40 Q76 26 90 20 Q104 14 96 4" fill="none" stroke="${INK}" stroke-width="3"/>`,
 scooter:`<path d="M52 110 Q50 80 80 76 L118 76 Q140 76 146 100 L150 110Z" fill="${INK}"/><path d="M146 100 L150 58 L166 50" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M150 58 L138 40 M158 54 L170 34 M144 50 L128 30 M162 50 L182 36" stroke="${INK}" stroke-width="2.5"/>${[[138,40],[170,34],[128,30],[182,36]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5" fill="${PAP}" stroke="${INK}" stroke-width="2"/>`).join('')}<circle cx="64" cy="118" r="14" fill="${PAP}" stroke="${INK}" stroke-width="6"/><circle cx="148" cy="118" r="14" fill="${PAP}" stroke="${INK}" stroke-width="6"/><rect x="80" y="66" width="36" height="10" rx="4" fill="${INK}"/>`,
 film:`<circle cx="70" cy="60" r="36" fill="${INK}"/><circle cx="140" cy="60" r="28" fill="${INK}"/>${[[70,40],[88,60],[70,80],[52,60]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="${PAP}"/>`).join('')}${[[140,46],[154,60],[140,74],[126,60]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5" fill="${PAP}"/>`).join('')}<rect x="60" y="100" width="90" height="36" fill="${INK}"/><path d="M150 108 L184 94 L184 142 L150 128Z" fill="${INK}"/><rect x="70" y="138" width="10" height="16" fill="${INK}"/><rect x="128" y="138" width="10" height="16" fill="${INK}"/>`,
 tower:`<rect x="88" y="30" width="24" height="128" fill="${INK}"/>${[44,52,60,90,98].map(y=>`<rect x="80" y="${y}" width="40" height="6" fill="${INK}"/>`).join('')}<path d="M100 30 L100 6" stroke="${INK}" stroke-width="3"/>${[[74,70],[126,70],[76,80],[124,80]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="${PAP}" stroke="${INK}" stroke-width="3"/>`).join('')}<path d="M0 158 L60 158 L60 128 L76 128 L76 158 L124 158 L124 120 L146 120 L146 158 L200 158" fill="${INK}"/>`,
 crowd:`${[0,1,2].map(r=>[...Array(7)].map((_,k)=>{const x=18+k*28+(r%2)*14,y=50+r*34;return `<circle cx="${x}" cy="${y}" r="9" fill="${INK}"/><path d="M${x-12} ${y+30} Q${x-12} ${y+11} ${x} ${y+11} Q${x+12} ${y+11} ${x+12} ${y+30}Z" fill="${INK}"/>`;}).join('')).join('')}<path d="M46 40 L58 16" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><rect x="54" y="8" width="16" height="9" fill="${INK}"/><path d="M130 38 Q150 22 172 36" stroke="${INK}" stroke-width="6" fill="none" stroke-dasharray="8 5"/>`
};
function pickPic(m){if(m.pic)return m.pic;const t=(m.title+' '+m.body).toUpperCase();const h=m.title.toUpperCase();
  if(/MOON|ARMSTRONG/.test(t))return 'moon';if(/SPACE|GAGARIN/.test(t))return 'rocket';if(/MATCH OF THE DAY|TELEVISION/.test(t))return 'tv';
  if(/BEATLES|LOVE ME DO|PEPPER/.test(t))return 'record';if(/ELECTION|WILSON WINS/.test(t))return 'ballot';if(/PENCE|DECIMAL/.test(t))return 'coins';
  if(/PICKLES/.test(t))return 'dog';if(/FREEZE/.test(t))return 'snow';if(/KENNEDY|CHURCHILL/.test(t))return 'flag';
  if(/BAN|COURT|SCANDAL|JAILED/.test(h))return 'gavel';if(/SUBSTITUTE|WAGE|DEADLINE/.test(h))return 'whistle';
  if(/HANGING UP|RETIR|GOODBYE|FORCED TO QUIT/.test(t))return 'boots';
  if(/CONCORDE|MILAN|TORINO|INTER|ITALY|ABROAD| OFF TO /.test(t))return 'plane';
  if(/CUP|CHAMPIONS|LIONS|TROPHY/.test(h))return 'trophy';
  if(/SACKED|TAKES OVER|IN CHARGE|APPOINTED|SUCCEEDS|STEPS UP|TO GOODISON|FOR WEST HAM|AT HILLSBOROUGH|AT CHELSEA|TO MAINE ROAD|TO DERBY|YOUNGEST MANAGER|TO COVENTRY/.test(t))return 'manager';
  if(/STAND|FLOODLIGHT|ROOF|BUILD|LOTTERY|SHOP|COMPLETE/.test(h))return 'stand';
  if(/SIGN|JOINS|SOLD|FEE|TO SPURS|TRANSFER|RECORD|COMES HOME|FOR CITY|TO LEEDS|TO STOKE|TO ARSENAL|TO ANFIELD|TO ROKER|GOES HOME/.test(t))return 'sign';
  if(/HAT-TRICK|STUN|RIOT|GIANT|SHOCK|DERBY|ROOST|HUMBLED|BEAT|DAZZLE|FRIENDLY/.test(h))return 'goal';
  return 'crowd';}
const picSVG=k=>k&&k.startsWith('chair:')?`<span class="np-mug">${portrait(chairLook(k.slice(6)))}</span>`:k&&k.startsWith('rep:')?`<span class="np-mug">${portrait(LOOKS[k.slice(4)]||LOOKS.reg)}</span>`:`<svg viewBox="0 0 200 160" class="np-pic" aria-hidden="true">${PICS[k]||PICS.crowd}</svg>`;

function renderOverlay(){if(typeof document==='undefined')return;const box=$('#overlay');if(!box)return;
  if(UI.press&&G){box.hidden=false;const k='press'+UI.press.fx+'.'+UI.press.qi;const h=pressHTML();if(UI.press){setBoxHTML(box,fixPoss(h),k);return;}}
  if(UI.notice&&G){box.hidden=false;const N=UI.notice;const k='n'+N.k+'.'+(N.mid||N.fx||N.pid||N.key||'');const h=noticeHTML();if(UI.notice){setBoxHTML(box,fixPoss(h),k);return;}}
  if(UI.paper&&G){box.hidden=false;const k='pa'+UI.paper.i+'.'+(UI.paper.ids||[]).join(',');const h=paperHTML();if(UI.paper&&h){setBoxHTML(box,fixPoss(h),k);return;}UI.paper=null;}
  box.hidden=true;box.innerHTML='';box._k=null;}
function pressHTML(){const P=UI.press;if(!PRESS.euro)PRESS.euro=PRESS_EURO;const q=PRESS[P.ctx][P.qi];const v=pressVars(P.opp);
  const ctxL={season:'Pre-season press call',cup:'FA Cup press conference',derby:'Derby-day press conference',top:'Top-of-the-table press conference',pressure:'Press conference',euro:'European press conference',hot:'Press conference: the winning run',cold:'Press conference: the losing run',week:'Midweek press call'}[P.ctx]||'Press conference';
  return `<div class="scrim"></div><div class="presscard" role="dialog" aria-modal="true" aria-label="${ctxL}"><div class="flashbulb" aria-hidden="true"></div>
   <div class="pc-art">${reporterArt(P.rep)}<p class="pc-rep"><strong>${esc(P.rep.n)}</strong><small>${esc(P.rep.o)}</small></p></div>
   <div class="pc-body"><p class="eyebrow">${ctxL}</p><blockquote class="pc-q">"${(()=>{const V=voiceOf(P.rep);const h=hashStr(String(P.fx));return esc(V?fill(V.pre[h%V.pre.length],v)+fill(q.q,v)+V.post[h%V.post.length]:fill(q.q,v)+(P.rep.tag?' '+P.rep.tag:''));})()}"</blockquote>
   ${P.ans==null?`<div class="pc-ans">${q.a.map((a,i)=>`<button class="pc-a" data-a="pressans" data-i="${i}"><span class="pc-num">${'ABC'[i]}</span>"${esc(fill(a.t,v))}"</button>`).join('')}<button class="btn ghost sm" data-a="pressskip">"No comment, gentlemen."</button></div>`:
   `<div class="pc-res"><p class="pc-you">You: "${esc(fill(q.a[P.ans].t,v))}"</p><p>${esc(P.res)}</p>${P.react?`<p class="pc-react">${esc(P.react)}</p>`:''}<ul class="chips pc-chips">${P.chips.map(([k,t])=>`<li class="fxchip fx-${k}">${k==='up'?'▲':k==='down'?'▼':'!'} ${esc(t)}</li>`).join('')}</ul><button class="btn go" data-a="pressdone">Leave the press room ▸</button></div>`}
   </div></div>`;}
const PAPERSTYLE={std:{price:3,ed:'Late Final',rule:'All the League results inside'},
 reg:{price:3,ed:'Late Night Final',rule:'Every result, every scorer, every town'},
 maureen:{price:4,ed:'Every Thursday',rule:'The paper that stands up for the terraces'},
 eddie:{price:3,ed:'Saturday Classified',rule:'Printed pink, read by everybody'},
 pat:{price:6,ed:'Programmes for the week',rule:'Football on the wireless, all the week\'s listings'},
 stan:{price:3,ed:'Saturday Special',rule:'Green \'Un: the scores as they happen'},
 liam:{price:4,ed:'Established 1855',rule:'Association Football, from our correspondent'}};
function paperHTML(){const P=UI.paper;if(P.docs)P.ids=P.docs.map((_,k)=>k);const m=P.docs?P.docs[P.i]:G.inbox.find(x=>x.id===P.ids[P.i]);if(!m){UI.paper=null;return '';}if(m.special)return trophyPaperHTML(m,P);const pk0=pickPic(m);const rp0=pk0.startsWith('rep:')?REPORTERS.find(r=>r.look===pk0.slice(4)):null;const mast=rp0?rp0.o:'The Sporting Chronicle';const PS=PAPERSTYLE[rp0?rp0.look:'std']||PAPERSTYLE.std;if(!P.docs&&!m.read){m.read=true;}
  const others=P.ids.map(id=>G.inbox.find(x=>x.id===id)).filter(x=>x&&x.id!==m.id).slice(0,4);const paras=esc(m.body).split('\n').filter(Boolean);
  const no=4000+daysBetween('1960-01-01',m.date);
  return `<div class="scrim" data-a="paperclose"></div><article class="paper np-${rp0?rp0.look:'std'} ${P.spin?'spin':''}" role="dialog" aria-modal="true" aria-label="${esc(mast)}">
   <header class="np-mast"><span class="np-side">${esc(PS.ed)}<br>No. ${no.toLocaleString('en-GB')}</span><h2>${esc(mast)}</h2><span class="np-side r">Price <span class="np-price">${PS.price+Math.floor(Math.max(0,G.year-1960)/4)}d</span><br>${esc(fmtDate(m.date))}</span></header>
   <div class="np-rule"><span>${m.type==='world'?'World news':m.type==='press'?'Football':'Club news'}</span><span>${esc(PS.rule)}</span></div>
   <h3 class="np-head">${esc(m.title.toUpperCase())}</h3>
   <div class="np-cols">${(()=>{const pk=pickPic(m);const rp=pk.startsWith('rep:')?REPORTERS.find(r=>r.look===pk.slice(4)):null;const chp=pk.startsWith('chair:')?chairOf(pk.slice(6)):null;return `<figure class="np-photo">${picSVG2(pk)}${m.cid&&!rp&&!chp?`<span class="np-inset">${crest(m.cid,'lg')}</span>`:''}<figcaption>${chp?`${esc(chp.n)}, chairman`:rp?`${esc(rp.n)}, ${esc(rp.o)}`:m.cid?esc(cn(m.cid)):'From our own correspondent'}</figcaption></figure>`;})()}
    <div class="np-text">${paras.map((p,i)=>`<p class="${i?'':'np-lede'}">${p}</p>`).join('')}${rp0&&voiceOf(rp0)?`<p class="np-sign">${esc(voiceOf(rp0).sign[m.id%voiceOf(rp0).sign.length])}</p>`:''}<p class="np-by">${rp0?`By ${esc(rp0.n)}`:'By our football correspondent'}</p></div>
    ${others.length?`<aside class="np-stop"><b>Stop press</b>${others.map(o=>`<p>${esc(o.title)}</p>`).join('')}</aside>`:''}</div>
   <footer class="np-foot"><span>Page ${P.i+1} of ${P.ids.length}</span><div class="row gap">${P.i<P.ids.length-1?'<button class="btn" data-a="papernext">Turn the page</button>':''}<button class="btn go" data-a="paperclose">Put the paper down</button></div></footer></article>`;}
function paperboyHTML(){if(!G||UI.screen!=='game'||G.settings.papers==='off'||!G.paperQ.length||UI.paper)return '';
  const ms=G.paperQ.map(id=>G.inbox.find(x=>x.id===id)).filter(Boolean);if(!ms.length)return '';const top=ms[ms.length-1];
  return `<div class="paperboy" role="status"><button class="pb-open" data-a="readq"><span class="pb-icon" aria-hidden="true"></span><span class="pb-txt"><small>Late Extra${ms.length>1?` · ${ms.length} stories`:''}</small><strong>${esc(top.title)}</strong></span></button><button class="pb-x" data-a="dismissq" aria-label="Dismiss the papers">×</button></div>`;}

/* notices: friendly poster and works order */
function vcrest(n,c1,c2,size){const ini=n.replace(/^a /,'').split(/\s+/).map(w=>w[0]).join('').slice(0,3).toUpperCase();return `<span class="crest ${size||''}" style="--c1:${c1};--c2:${c2}" aria-hidden="true"><b>${esc(ini)}</b></span>`;}
function bpSVG(k){const L='fill="none" stroke="#e8f0ff" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';const D='fill="none" stroke="#e8f0ff" stroke-width="1" stroke-dasharray="4 3" opacity=".7"';const T=(x,y,s)=>`<text x="${x}" y="${y}" fill="#e8f0ff" font-family="Courier Prime,Courier,monospace" font-size="9" text-anchor="middle">${s}</text>`;
  const g={
   stand:`<path d="M20 118 L20 56 L180 46 L180 118Z" ${L}/><path d="M10 58 L190 38 L190 46 L10 66Z" ${L}/>${[0,1,2,3,4].map(i=>`<path d="M26 ${74+i*9} L174 ${64+i*9}" ${L} stroke-width="1.4"/>`).join('')}<path d="M20 128 L180 128" ${D}/>${T(100,140,'240 FT')}<path d="M188 118 L188 56" ${D}/>`,
   cover:`${[0,1,2,3,4,5].map(i=>`<path d="M${20+i*26} ${118-i*10} L${46+i*26} ${118-i*10} L${46+i*26} ${108-i*10}" ${L}/>`).join('')}<path d="M14 40 L186 30" ${L}/>${[24,80,136,180].map(x=>`<path d="M${x} ${40-(x-14)*0.058} L${x} 120" ${L} stroke-width="1.6"/>`).join('')}${T(100,140,'COVERED TERRACE')}`,
   lights:`<path d="M80 130 L96 30 L104 30 L120 130" ${L}/>${[0,1,2,3,4].map(i=>`<path d="M${82+i*3} ${118-i*20} L${118-i*3} ${98-i*20} M${118-i*3} ${118-i*20} L${82+i*3} ${98-i*20}" ${L} stroke-width="1.2"/>`).join('')}<rect x="76" y="8" width="48" height="24" ${L}/>${[0,1,2,3].map(i=>[0,1].map(j=>`<circle cx="${84+i*11}" cy="${15+j*10}" r="3" ${L} stroke-width="1.4"/>`).join('')).join('')}${T(150,70,'120 FT')}<path d="M138 30 L138 130" ${D}/>`,
   lottery:`<rect x="30" y="40" width="140" height="72" rx="4" ${L}/><path d="M130 40 L130 112" ${D}/>${T(80,62,'SUPPORTERS CLUB')}${T(80,80,'GRAND DRAW')}${T(80,98,'No. 00417')}${T(150,80,'6d')}`,
   tr_pitch:`<rect x="24" y="30" width="152" height="94" ${L}/><path d="M100 30 L100 124" ${L} stroke-width="1.4"/><circle cx="100" cy="77" r="14" ${L} stroke-width="1.4"/>${[[50,56],[64,72],[50,88],[140,60],[150,90]].map(([x,y])=>`<path d="M${x-5} ${y+6} L${x} ${y-6} L${x+5} ${y+6}Z" ${L} stroke-width="1.6"/>`).join('')}${T(100,142,'TRAINING PITCHES')}`,
   tr_gym:`<rect x="20" y="96" width="80" height="12" ${L}/><path d="M28 108 L28 126 M92 108 L92 126" ${L}/><path d="M112 70 L176 70" ${L}/><rect x="104" y="58" width="10" height="24" ${L}/><rect x="174" y="58" width="10" height="24" ${L}/><circle cx="60" cy="60" r="16" ${L}/><path d="M52 60 L68 60 M60 52 L60 68" ${L}/>${T(100,142,'GYMNASIUM')}`,
   tr_digs:`<path d="M40 60 L100 26 L160 60 L160 126 L40 126Z" ${L}/><rect x="90" y="92" width="20" height="34" ${L}/>${[[56,70],[124,70],[56,98],[124,98]].map(([x,y])=>`<rect x="${x}" y="${y}" width="20" height="16" ${L} stroke-width="1.4"/>`).join('')}<path d="M136 44 L136 24 L148 24 L148 52" ${L}/>${T(100,142,'APPRENTICES HOSTEL')}`,
   tr_court:`<rect x="24" y="36" width="152" height="90" ${L}/><path d="M24 36 L100 16 L176 36" ${L}/>${[48,76,124,152].map(x=>`<path d="M${x} 50 L${x} 112" ${L} stroke-width="1" stroke-dasharray="4 3"/>`).join('')}<circle cx="100" cy="86" r="12" ${L}/><path d="M92 82 L108 82 L104 94 L96 94Z" ${L} stroke-width="1.2"/>${T(100,142,'INDOOR BALL COURT')}`,
   shop:`<rect x="30" y="50" width="140" height="80" ${L}/><path d="M24 50 L176 50 L176 36 L24 36Z" ${L}/>${[0,1,2,3,4,5,6].map(i=>`<path d="M${24+i*21.7} 50 q10.8 12 21.7 0" ${L} stroke-width="1.4"/>`).join('')}<rect x="44" y="66" width="60" height="50" ${L} stroke-width="1.4"/><rect x="118" y="66" width="36" height="64" ${L} stroke-width="1.4"/><circle cx="74" cy="84" r="10" ${L}/><path d="M68 96 L64 112 M80 96 L84 112" ${L}/>${T(100,30,'CLUB SHOP')}`};
  Object.assign(g,bpMore(L,D,T));
  return `<svg viewBox="0 0 200 150" class="bp-svg" preserveAspectRatio="xMidYMid meet"><defs><pattern id="bpg" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0 L0 0 0 12" fill="none" stroke="#e8f0ff" stroke-width=".4" opacity=".35"/></pattern></defs><rect width="200" height="150" fill="#1d4f8f"/><rect width="200" height="150" fill="url(#bpg)"/>${g[k]||g.stand}</svg>`;}
function noticeHTML(){const N=UI.notice;if(N.k==='chalk')return chalkHTML(N);if(N.k==='talk')return talkHTML(N);if(N.k==='letter')return letterHTML(N);if(N.k==='bid')return bidHTML(N);if(N.k==='wire')return wireHTML(N);if(N.k==='dday')return ddHTML();if(N.k==='radio')return radioHTML();if(N.k==='deal')return dealHTML(N);
  if(N.k==='friendly'){const r=N.r;const c=club(U());const inj=r.injTxt;
    return `<div class="scrim" data-a="noticeclose"></div><article class="fposter" role="dialog" aria-modal="true" aria-label="Friendly result"><div class="fp-beams" aria-hidden="true"></div>
     <p class="fp-eye">${r.opening?`To ${esc(r.opening)}`:'Under the floodlights'} · ${esc(fmtDate(r.date))}</p><h2 class="fp-title">${r.opening?'Opening Night':'Floodlit Friendly'}</h2>
     <div class="fp-vs">${crest(U(),'xl')}<div class="fp-score"><span>${r.g1}</span><i>-</i><span>${r.g2}</span></div>${vcrest(r.n,r.c1,r.c2,'xl')}</div>
     <p class="fp-names"><strong>${esc(c.n)}</strong> v <strong>${esc(r.n)}</strong> <small>(${esc(r.from)})</small></p>
     <dl class="fp-ledger"><div><dt>Attendance</dt><dd>${r.att.toLocaleString('en-GB')}</dd></div><div><dt>Gate receipts</dt><dd>${arrow(1,money(r.inc))}</dd></div><div><dt>Appearance fee</dt><dd>${r.pay?arrow(-1,money(r.pay)):'None'}</dd></div><div class="fp-tot"><dt>${r.net>=0?'Profit':'Loss'}</dt><dd>${arrow(r.net,money(Math.abs(r.net)))}</dd></div></dl>
     ${inj?`<p class="fp-inj">${esc(inj)}</p>`:''}<p class="fp-note">The players are a little leg-weary after a hard night's work.</p>
     <button class="btn go" data-a="noticeclose">Back to the office</button></article>`;}
  if(N.k==='build'){const u=UPG[N.key];const st=UPGS()[N.key];
    return `<div class="scrim" data-a="noticeclose"></div><article class="blueprint" role="dialog" aria-modal="true" aria-label="Works order"><p class="bp-eye">Works order No. ${400+Object.keys(UPGS()).length} · ${esc(club(U()).g)}</p><h2 class="bp-title">Work begins</h2>
     <div class="bp-draw">${bpSVG(N.key)}</div><h3 class="bp-name">${esc(u.n)}</h3>
     <dl class="bp-dl"><div><dt>Cost</dt><dd>${money(N.cost)}</dd></div><div><dt>Started</dt><dd>${esc(fmtDate(st.start||G.date,true))}</dd></div><div><dt>Ready by</dt><dd>${esc(fmtDate(st.done,true))}</dd></div><div><dt>What it does</dt><dd>${esc(u.desc)}</dd></div></dl>
     <div class="buildbar"><i style="width:3%"></i></div><p class="bp-note">Foreman's estimate: ${plu(u.wk,'week')}, weather permitting. You'll hear when the ribbon is ready to cut.</p>
     <button class="btn go" data-a="noticeclose">Right, carry on</button></article>`;}
  return '';}
/* ---------- actions ---------- */
/* ---------- more cups: the League Cup and Europe ---------- */
const LCR=['First Round','Second Round','Third Round','Fourth Round','Fifth Round','Semi-final','Final'];
const LC_OUT=['ARS','SHW','TOT','WBA','WOL'];
const EUN={EC:"European Cup",CWC:"Cup Winners' Cup",FC:"Inter-Cities Fairs Cup"};
const EUR=['First Round','Second Round','Quarter-final','Semi-final','Final'];
const isCupFx=f=>f.comp!=='L';
function compShort(f){return f.comp==='FA'?'FA Cup':f.comp==='LC'?'League Cup':f.comp==='EU'?(EUN[f.eu]||'Europe'):f.comp==='F'?'Friendly':'League';}
function compLbl(f){const leg=(f.leg?` (${f.leg===1?'first':'second'} leg)`:'')+(f.rpl?(f.comp==='FA'?[' replay',' replay',' second replay',' third replay'][f.rpl]:' play-off'):'');
  if(f.comp==='FA')return `FA Cup, ${CUPR[f.r]}`;if(f.comp==='LC')return `League Cup, ${LCR[f.r]}${leg}`;if(f.comp==='EU')return `${EUN[f.eu]||'Europe'}, ${EUR[f.r]}${leg}`;return `League, ${DIVN[f.div]}`;}
const cupClass=f=>f.comp==='FA'?'cupday':f.comp==='LC'?'cupday lcday':f.comp==='EU'?'cupday euday':'';
const cupRoundName=f=>f.comp==='FA'?CUPR[f.r]:f.comp==='LC'?LCR[f.r]:f.comp==='EU'?EUR[f.r]:'';
function isFinalFx(f){return (f.comp==='FA'&&f.r===7)||(f.comp==='LC'&&f.r===6)||(f.comp==='EU'&&f.r===4);}

/* move a club's League match off a date it now needs for a cup tie */
const fxPri=f=>(f.venue==='Wembley'||(f.comp==='FA'&&f.r===7)||(f.comp==='EU'&&f.neutral))?5:f.comp==='EU'?4:f.comp==='FA'?3:f.comp==='LC'?2:1;
const FXNM={FA:'FA Cup',LC:'League Cup',EU:'European',L:'League'};
function cupSlot(f,date){const ids=[f.h,f.a];const busy=d=>G.fx.some(x=>x!==f&&!x.p&&x.date===d&&(ids.includes(x.h)||ids.includes(x.a)));
  let lim=rplLimit(f);if(f.leg===1){const o=G.fx.find(x=>x.tie===f.tie&&x.leg===2);if(o&&(!lim||o.date<lim))lim=o.date;}
  const ok=(d,mid)=>{const wd=dow(d);return !busy(d)&&(mid?(wd===2||wd===3):(wd!==6&&wd!==0));};
  for(const mid of [true,false]){for(let k=1;k<=12;k++){const d=addDays(date,k);if(lim&&d>=lim)break;if(ok(d,mid))return d;}
    for(let k=1;k<=12;k++){const d=addDays(date,-k);if(d<=G.date)break;if(ok(d,mid))return d;}}
  return freeDate(ids,date);}
function fixClashes(from){if(!G||!G.fx)return;const to=addDays(from,35);
  for(let guard=0;guard<40;guard++){const up=G.fx.filter(f=>!f.p&&f.date>=from&&f.date<=to);let hit=null;
    for(let i=0;i<up.length&&!hit;i++)for(let j=i+1;j<up.length;j++){const a=up[i],b=up[j];if(a.date!==b.date)continue;if([a.h,a.a].some(c=>c===b.h||c===b.a)){hit=fxPri(a)>=fxPri(b)?[a,b]:[b,a];break;}}
    if(!hit)return;const [keep,mv]=hit;const old=mv.date;mv.date=mv.comp==='L'?freeDate([mv.h,mv.a],old):cupSlot(mv,old);sortFx();
    if(isUserFx(mv))msg('club','Fixture moved',`Our ${FXNM[mv.comp]||''} match with ${cn(mv.h===U()?mv.a:mv.h)} has been moved from ${fmtDate(old)} to ${fmtDate(mv.date)}, because ${isUserFx(keep)?'we':cn(keep.h===mv.h||keep.a===mv.h?mv.h:mv.a)} ${isUserFx(keep)?'have':'has'} a ${FXNM[keep.comp]||'cup'} ${fxPri(keep)===5?'final':'tie'} that day.`);}}
function freeDate(ids,after){let d=addDays(after,1);const end=`${G.year+1}-05-31`;
  while(d<=end){if((dow(d)===2||dow(d)===3)&&!G.fx.some(f=>f.date===d&&(ids.includes(f.h)||ids.includes(f.a))))return d;d=addDays(d,1);}return addDays(end,1);}
function clearClash(cid,date,keep){G.fx.filter(f=>f!==keep&&!f.p&&f.date===date&&(f.h===cid||f.a===cid)&&f.comp==='L').forEach(f=>{const nd=freeDate([f.h,f.a],date);f.date=nd;
  if(isUserFx(f))msg('club','Fixture moved',`Our League match with ${cn(f.h===U()?f.a:f.h)} has been moved to ${fmtDate(nd)} because of the cup.`);});sortFx();}

/* ---- the Football League Cup ---- */
function lcDates(y){const T=s=>firstDow(s,2);const d=[T(`${y}-09-20`),T(`${y}-10-11`),T(`${y}-11-01`),T(`${y}-11-22`),T(`${y}-12-13`),[T(`${y+1}-01-17`),T(`${y+1}-02-07`)]];
  let fin=firstSat(`${y+1}-03-04`);if(fin===cupDates(y)[5])fin=addDays(fin,-7);
  d.push(y<1966?[T(`${y+1}-04-25`),T(`${y+1}-05-09`)]:fin);return d;}
function lcStart(y){const all=Object.keys(G.clubs);const out=y<1966?LC_OUT.filter(id=>id!==U()):[];const ent=all.filter(id=>!out.includes(id));
  G.lc={round:0,alive:ent,byes:[],dates:lcDates(y),winner:null,final:null,out};
  if(y===1960)msg('press','NEW LEAGUE CUP: FIVE CLUBS SAY NO THANKS',`The new Football League Cup kicks off this autumn, with ties played midweek under the floodlights. ${out.map(cn).join(', ')} have declined to take part. The semi-finals and the final will be played over two legs.`,null,true);
  if(y===1966)msg('press','WEMBLEY FOR THE LEAGUE CUP FINAL','The League Cup final will be a single match at Wembley from this season, and the winners will be offered a place in the Fairs Cup if they are a First Division club. Every League club has entered.',null,'big');
  lcDraw();}
function lcDraw(){const c=G.lc;const teams=shuffle(c.alive.slice());const n=teams.length;let ties;
  if(c.round===0)ties=n>64?n-64:Math.floor(n/2);else{let p=1;while(p*2<=n)p*=2;ties=n===p?n/2:n-p;}
  const playing=teams.slice(0,ties*2);c.byes=teams.slice(ties*2);c.alive=[];const dt=c.dates[c.round];const two=Array.isArray(dt);
  for(let i=0;i<ties;i++){const h=playing[2*i],a=playing[2*i+1];
    if(two){const tie=G.fxid;G.fx.push({id:G.fxid++,date:dt[0],comp:'LC',r:c.round,h,a,p:false,leg:1,tie});G.fx.push({id:G.fxid++,date:dt[1],comp:'LC',r:c.round,h:a,a:h,p:false,leg:2,tie});}
    else{const fin=c.round===6;const f={id:G.fxid++,date:dt,comp:'LC',r:c.round,h,a,p:false,neutral:fin};if(fin){f.venue='Wembley';clearClash(h,dt,f);clearClash(a,dt,f);}G.fx.push(f);}}
  sortFx();
  const mine=G.fx.filter(f=>f.comp==='LC'&&f.r===c.round&&isUserFx(f));
  if(mine.length){const f=mine[0];const opp=f.h===U()?f.a:f.h;msg('club',`League Cup ${LCR[c.round]} draw`,two?`We play ${cn(opp)} over two legs: ${f.h===U()?'at home first':'away first'}, on ${fmtDate(mine[0].date)} and ${fmtDate(mine[1].date)}.`:`${f.neutral?`We meet ${cn(opp)} at Wembley`:f.h===U()?`We are at home to ${cn(opp)}`:`We travel to ${cn(opp)}`} on ${fmtDate(f.date)}.`);
    if(c.round>=2)wireDraw('LC',LCR[c.round],G.fx.filter(x=>x.comp==='LC'&&x.r===c.round&&(!x.leg||x.leg===1)),f,null,{full:c.round>=4});}
  else{if(c.byes.includes(U()))msg('club',`League Cup ${LCR[c.round]}`,'We have been given a bye into the next round.');else if(c.round>=4)wireDraw('LC',LCR[c.round],G.fx.filter(x=>x.comp==='LC'&&x.r===c.round&&(!x.leg||x.leg===1)),null,null,{full:true});}}
function lcAdvance(){const c=G.lc;if(!c||c.winner)return;const ties=G.fx.filter(f=>f.comp==='LC'&&f.r===c.round&&!f.rpl);if(!ties.length||ties.some(f=>!f.p)||G.fx.some(f=>f.comp==='LC'&&f.r===c.round&&f.rpl&&!f.p))return;
  const won=ties.filter(f=>f.w);if(won.length<ties.filter(f=>!f.leg||f.leg===2).length)return;
  c.alive=won.map(f=>f.w).concat(c.byes);c.byes=[];
  if(c.round===6){c.winner=c.alive[0];const fin=won[won.length-1];c.final=fin.id;const w=club(c.winner);w.hon.push(`League Cup ${seasonLbl(G.year)}`);w.rep=Math.min(95,w.rep+2);
    msg('press',`${w.s.toUpperCase()} WIN THE LEAGUE CUP`,`${w.n} have won the Football League Cup. ${cupLine(fin)}`,null,c.winner);wireResult('LC',fin);
    if(c.winner===U()){trophyPaper('lc',null,fin);G.user.cab.push({k:'lc',y:G.year,club:U()});G.user.trophies.push(`League Cup ${seasonLbl(G.year)} (${w.n})`);bumpConf(8);}
    return;}
  c.round++;lcDraw();}
function lcReached(cid){const ties=G.fx.filter(f=>f.comp==='LC'&&(f.h===cid||f.a===cid));if(!ties.length)return G.lc&&G.lc.out.includes(cid)?'Did not enter':'Did not take part';
  if(G.lc.winner===cid)return 'Winners';const last=ties[ties.length-1];return last.w&&last.w!==cid?`Lost in the ${LCR[last.r]}`:LCR[last.r];}

/* ---- a tie is settled: replays, second legs and play-offs ---- */
function resolveTie(f){if(f.comp==='FA')return resolveCup(f);if(f.comp==='LC'||f.comp==='EU')return resolveKO(f);}
function resolveKO(f){if(f.rpl)return resolveReplay(f);if(f.leg===1||f.w)return;let hg=f.hg,ag=f.ag;
  if(f.leg===2){const l1=G.fx.find(x=>x.comp===f.comp&&x.tie===f.tie&&x.leg===1);if(l1){hg+=l1.ag;ag+=l1.hg;}f.agg=[hg,ag];}
  if(hg!==ag)f.w=hg>ag?f.h:f.a;
  else if(!f.pend&&(()=>{const rf=scheduleReplay(f,1,f.a,f.h,!!(f.leg===2||f.neutral));if(!rf)return false;if(f.agg)f.aggNote=`Aggregate: ${cn(f.h)} ${f.agg[0]}, ${cn(f.a)} ${f.agg[1]}`;f.rep=(f.aggNote?f.aggNote+' · ':'')+`${f.leg===2||f.comp!=='FA'?'Play-off':'Replay'} on ${fmtDate(rf.date,true)}`;return true;})())return;
  else{const notes=[];let h=f.a,a=f.h,neutral=!!(f.leg===2||f.neutral);
    for(let k=0;k<2;k++){const rfx={id:-1,comp:f.comp,r:f.r,eu:f.eu,h,a,neutral,date:f.date,venue:neutral?'a neutral ground':null};const m=runToEnd(newMatch(rfx,false),true);finalize(m,k>0);
      notes.push(`${f.leg===2?(k?'Second play-off':'Play-off'):(k?'Second replay':'Replay')}: ${cn(h)} ${m.sc[0]}-${m.sc[1]} ${cn(a)}${m.aet?' (a.e.t.)':''}`);
      if(m.sc[0]!==m.sc[1]){f.w=m.sc[0]>m.sc[1]?h:a;break;}[h,a]=[a,h];neutral=true;}
    if(!f.w){f.w=rand()<.5?f.h:f.a;notes.push(`${cn(f.w)} go through on the toss of a coin.`);}f.rep=notes.join(' · ');}
  if(f.agg)f.rep=`Aggregate: ${cn(f.h)} ${f.agg[0]}, ${cn(f.a)} ${f.agg[1]}`+(f.rep?' · '+f.rep:'');
  koHook(f);}
function koHook(f){if(!isUserFx(f)||!f.w)return;const won=f.w===U();const nm_=compShort(f);
  if(chairT()==='cup')bumpConf(won?1.5+f.r*0.4:-3);
  if(won){feverUp(f.comp==='EU'?1.5+f.r*0.5:f.comp==='LC'?(f.r>=3?0.6+f.r*0.3:0):0);}
  if(f.rep&&(f.leg===2||/Replay|Play-off/.test(f.rep)))msg('club',won?`Through in the ${nm_}`:`Out of the ${nm_}`,f.rep,null,won?U():true);
  if(f.comp==='EU')euUserResult(f,won);}

/* ---- Europe ---- */
/* [code,name,short,country,c1,c2,ground,crowd,[s1960,s1965,s1970],manager,from,to] */
const EUCLUBS=[
 ['RMA','Real Madrid','Real Madrid','Spain','#ffffff','#d4af37','the Estadio Santiago Bernabéu',95000,[88,82,77],'Miguel Muñoz',1960,1970],
 ['BEN','Benfica','Benfica','Portugal','#c8102e','#ffffff','the Estádio da Luz',70000,[82,85,78],'Béla Guttmann',1960,1970],
 ['INT','Internazionale','Inter','Italy','#1b3a8c','#111111','San Siro',80000,[76,86,79],'Helenio Herrera',1960,1970],
 ['MIL','AC Milan','Milan','Italy','#c8102e','#111111','San Siro',75000,[80,79,82],'Nereo Rocco',1960,1970],
 ['BAR','CF Barcelona','Barcelona','Spain','#a50044','#004d98','the Nou Camp',90000,[82,76,76],'Enrique Orizaola',1960,1970],
 ['JUV','Juventus','Juventus','Italy','#ffffff','#111111','the Stadio Comunale',60000,[80,76,76],'Heriberto Herrera',1960,1970],
 ['ATM','Atlético Madrid','Atlético','Spain','#c8102e','#ffffff','the Estadio Metropolitano',60000,[78,76,74],'José Villalonga',1960,1970],
 ['VAL','Valencia','Valencia','Spain','#ffffff','#111111','the Mestalla',50000,[74,76,72],'Alejandro Scopelli',1960,1970],
 ['ZAR','Real Zaragoza','Zaragoza','Spain','#ffffff','#1d4fb0','La Romareda',35000,[70,77,70],'Roque Olsen',1960,1970],
 ['FIO','Fiorentina','Fiorentina','Italy','#5b2a86','#ffffff','the Stadio Comunale',45000,[78,74,74],'Nándor Hidegkuti',1960,1970],
 ['ROM','AS Roma','Roma','Italy','#8e1f2f','#f0bc42','the Stadio Olimpico',60000,[76,72,72],'Alfredo Foni',1960,1970],
 ['CEL','Celtic','Celtic','Scotland','#1a8c4a','#ffffff','Celtic Park',75000,[66,80,84],'Jock Stein',1960,1970],
 ['RAN','Rangers','Rangers','Scotland','#1d4fb0','#ffffff','Ibrox Park',80000,[76,76,76],'Scot Symon',1960,1970],
 ['HIB','Hibernian','Hibs','Scotland','#1a8c4a','#ffffff','Easter Road',40000,[66,68,68],'Jock Stein',1960,1970],
 ['DUN','Dundee','Dundee','Scotland','#1d3a8c','#ffffff','Dens Park',30000,[64,70,64],'Bob Shankly',1960,1970],
 ['KIL','Kilmarnock','Killie','Scotland','#1d3a8c','#ffffff','Rugby Park',25000,[64,68,64],'Willie Waddell',1960,1970],
 ['AJA','Ajax','Ajax','Netherlands','#ffffff','#d2122e','the Olympic Stadium, Amsterdam',50000,[64,70,84],'Rinus Michels',1960,1970],
 ['FEY','Feyenoord','Feyenoord','Netherlands','#d2122e','#ffffff','De Kuip',60000,[68,74,82],'Ernst Happel',1960,1970],
 ['BAY','Bayern Munich','Bayern','West Germany','#dc052d','#ffffff','the Grünwalder Stadion',40000,[58,70,80],'Zlatko Čajkovski',1960,1970],
 ['DOR','Borussia Dortmund','Dortmund','West Germany','#fde100','#111111','the Stadion Rote Erde',40000,[70,76,70],'Willi Multhaup',1960,1970],
 ['HSV','Hamburger SV','Hamburg','West Germany','#ffffff','#1d4fb0','the Volksparkstadion',60000,[74,74,72],'Georg Knöpfle',1960,1970],
 ['EFR','Eintracht Frankfurt','Eintracht','West Germany','#d2122e','#111111','the Waldstadion',70000,[78,72,70],'Paul Oßwald',1960,1970],
 ['DUK','Dukla Prague','Dukla','Czechoslovakia','#8e1f2f','#f2c14e','Juliska',30000,[76,76,70],'Jaroslav Vejvoda',1960,1970],
 ['SLO','Slovan Bratislava','Slovan','Czechoslovakia','#6cabdd','#ffffff','Tehelné pole',35000,[70,70,74],'Michal Vičan',1960,1970],
 ['FER','Ferencváros','Ferencváros','Hungary','#1a8c4a','#ffffff','the Üllői út',40000,[74,78,74],'Károly Lakat',1960,1970],
 ['VAS','Vasas','Vasas','Hungary','#d2122e','#1d4fb0','the Illovszky Stadium',30000,[74,72,70],'Rudolf Illovszky',1960,1970],
 ['PAR','Partizan Belgrade','Partizan','Yugoslavia','#111111','#ffffff','the JNA Stadium',55000,[74,76,72],'Abdulah Gegić',1960,1970],
 ['RSB','Red Star Belgrade','Red Star','Yugoslavia','#d2122e','#ffffff','the Marakana',70000,[74,72,76],'Miljan Miljanić',1960,1970],
 ['DZG','Dinamo Zagreb','Dinamo','Yugoslavia','#1d4fb0','#ffffff','Maksimir',50000,[70,76,72],'Ivan Horvat',1960,1970],
 ['SPO','Sporting Lisbon','Sporting','Portugal','#1a8c4a','#ffffff','the José Alvalade',50000,[74,76,72],'Anselmo Fernández',1960,1970],
 ['STL','Standard Liège','Standard','Belgium','#d2122e','#ffffff','Sclessin',35000,[74,72,72],'Michel Pavić',1960,1970],
 ['AND','Anderlecht','Anderlecht','Belgium','#5b2a86','#ffffff','the Parc Astrid',35000,[72,76,74],'Pierre Sinibaldi',1960,1970],
 ['REI','Stade de Reims','Reims','France','#d2122e','#ffffff','the Stade Auguste-Delaune',25000,[76,66,62],'Albert Batteux',1960,1970],
 ['STE','Saint-Étienne','Saint-Étienne','France','#1a8c4a','#ffffff','Geoffroy-Guichard',35000,[62,70,74],'Albert Batteux',1960,1970],
 ['RAP','Rapid Vienna','Rapid','Austria','#1a8c4a','#ffffff','the Pfarrwiese',25000,[70,68,66],'Robert Körner',1960,1970],
 ['GOR','Górnik Zabrze','Górnik','Poland','#1d4fb0','#ffffff','the Stadion Śląski',90000,[64,70,74],'Michal Matyas',1960,1970],
 ['CSK','CSKA Sofia','CSKA','Bulgaria','#d2122e','#ffffff','the Vasil Levski',45000,[68,68,68],'Krum Milev',1960,1970],
 ['GAL','Galatasaray','Galatasaray','Turkey','#f2a900','#a90432','Mithatpaşa',35000,[64,64,64],'Gündüz Kılıç',1960,1970],
 ['OLY','Olympiacos','Olympiacos','Greece','#d2122e','#ffffff','the Karaiskakis',35000,[62,62,64],'Ljubiša Spajić',1960,1970],
 ['SER','Servette','Servette','Switzerland','#8e1f2f','#ffffff','the Charmilles',25000,[64,64,62],'Jean Snella',1960,1970],
 ['GOT','IFK Göteborg','Göteborg','Sweden','#1d4fb0','#ffffff','the Nya Ullevi',35000,[62,58,58],'Nils Andersson',1960,1970],
 ['LYN','Lyn Oslo','Lyn','Norway','#d2122e','#ffffff','Ullevaal',20000,[54,58,58],'Knut Osnes',1960,1970],
 ['AGF','AGF Aarhus','Aarhus','Denmark','#ffffff','#1d4fb0','the Aarhus Stadion',20000,[58,58,56],'Henry From',1960,1970],
 ['GLE','Glentoran','Glentoran','Northern Ireland','#1a8c4a','#d2122e','The Oval',20000,[54,54,54],'Isaac McDowell',1960,1970],
 ['LIN','Linfield','Linfield','Northern Ireland','#1d4fb0','#ffffff','Windsor Park',30000,[56,56,56],'Tommy Leishman',1960,1970],
 ['SHR','Shamrock Rovers','Shamrock Rovers','Republic of Ireland','#1a8c4a','#ffffff','Milltown',25000,[54,56,54],'Liam Tuohy',1960,1970],
 ['WAT','Waterford','Waterford','Republic of Ireland','#1d4fb0','#ffffff','Kilcohan Park',12000,[50,52,54],'Paddy Coad',1960,1970],
 ['VLT','Valletta','Valletta','Malta','#ffffff','#d2122e','the Empire Stadium, Gżira',15000,[42,44,46],'Carmel Busuttil',1960,1970],
 ['JEU','Jeunesse Esch','Jeunesse','Luxembourg','#111111','#f2c14e','the Stade de la Frontière',6000,[44,44,46],'Ernest Mathias',1960,1970],
 ['KRR','KR Reykjavík','KR','Iceland','#111111','#ffffff','Laugardalsvöllur',8000,[40,42,44],'Óli B. Jónsson',1960,1970]];
const EUSTARS={RMA:[['Alfredo Di Stéfano','CF',1926,1960,1964,12],['Ferenc Puskás','IF',1927,1960,1966,12],['Francisco Gento','WG',1933,1960,1970,9],['José Santamaría','CH',1929,1960,1966,6],['Amancio','WG',1939,1964,1970,8],['Pirri','WH',1945,1965,1970,6]],
 BEN:[['Eusébio','IF',1942,1961,1970,14],['Mário Coluna','WH',1935,1960,1970,8],['José Águas','CF',1930,1960,1963,6],['José Torres','CF',1938,1964,1970,6],['António Simões','WG',1943,1962,1970,6],['Costa Pereira','GK',1929,1960,1966,5]],
 INT:[['Luis Suárez','IF',1935,1961,1970,11],['Sandro Mazzola','IF',1942,1962,1970,10],['Giacinto Facchetti','FB',1942,1962,1970,9],['Jair','WG',1941,1962,1967,6],['Armando Picchi','CH',1935,1960,1967,6]],
 MIL:[['Gianni Rivera','IF',1943,1960,1970,11],['José Altafini','CF',1938,1960,1965,9],['Cesare Maldini','CH',1932,1960,1966,6],['Kurt Hamrin','WG',1934,1967,1969,7],['Pierino Prati','CF',1946,1967,1970,7]],
 BAR:[['Sándor Kocsis','IF',1929,1960,1965,8],['Zoltán Czibor','WG',1929,1960,1961,7],['Chus Pereda','IF',1938,1961,1969,6]],
 JUV:[['John Charles','CF',1931,1960,1962,10],['Omar Sívori','IF',1935,1960,1965,10]],
 FIO:[['Kurt Hamrin','WG',1934,1960,1966,9]],
 CEL:[['Jimmy Johnstone','WG',1944,1963,1970,10],['Billy McNeill','CH',1940,1960,1970,7],['Bobby Murdoch','WH',1944,1963,1970,7],['Tommy Gemmell','FB',1943,1963,1970,6],['Stevie Chalmers','CF',1936,1960,1970,5],['Bobby Lennox','WG',1943,1962,1970,5]],
 RAN:[['John Greig','WH',1942,1961,1970,7],['Ralph Brand','IF',1936,1960,1965,5],['Jimmy Millar','CF',1934,1960,1967,5]],
 AJA:[['Johan Cruyff','CF',1947,1965,1970,14],['Piet Keizer','WG',1943,1961,1970,8],['Sjaak Swart','WG',1938,1960,1970,5]],
 FEY:[['Coen Moulijn','WG',1937,1960,1970,7],['Wim van Hanegem','WH',1944,1968,1970,8],['Ove Kindvall','CF',1943,1966,1970,7]],
 BAY:[['Franz Beckenbauer','WH',1945,1964,1970,13],['Gerd Müller','CF',1945,1964,1970,13],['Sepp Maier','GK',1944,1964,1970,8]],
 DOR:[['Lothar Emmerich','CF',1941,1963,1969,7],['Siggi Held','WG',1942,1965,1970,5]],
 HSV:[['Uwe Seeler','CF',1936,1960,1970,11]],EFR:[['Alfred Pfaff','IF',1926,1960,1962,6]],DUK:[['Josef Masopust','WH',1931,1960,1968,10]],
 FER:[['Flórián Albert','CF',1941,1960,1970,11]],AND:[['Paul Van Himst','IF',1943,1960,1970,9]],PAR:[['Milutin Šoškić','GK',1937,1960,1966,6]],REI:[['Just Fontaine','CF',1933,1960,1962,9],['Raymond Kopa','IF',1931,1960,1967,8]]};
const EUNAMES={
 Spain:[['José','Luis','Juan','Francisco','Antonio','Manuel','Enrique','Carlos','Joaquín','Pedro'],['García','Martínez','López','Sánchez','Pérez','Gómez','Martín','Ruiz','Díaz','Moreno','Herrera','Iglesias']],
 Portugal:[['José','António','Manuel','João','Joaquim','Fernando','Mário','Jorge','Alberto','Rui'],['Silva','Santos','Ferreira','Pereira','Costa','Oliveira','Rodrigues','Martins','Sousa','Fernandes','Gonçalves','Cruz']],
 Italy:[['Giovanni','Giuseppe','Mario','Luigi','Franco','Bruno','Sergio','Angelo','Carlo','Giorgio'],['Rossi','Russo','Ferrari','Bianchi','Romano','Colombo','Ricci','Marino','Greco','Bruno','Gallo','Conti']],
 Scotland:[['John','Willie','Jim','Tommy','Bobby','Alex','Davie','Jimmy','George','Billy'],['Smith','Brown','Wilson','Campbell','Stewart','Thomson','Robertson','Anderson','McDonald','Scott','Reid','Murray']],
 Netherlands:[['Jan','Piet','Kees','Wim','Henk','Gerrit','Theo','Frits','Bennie','Jaap'],['de Jong','Jansen','de Vries','van den Berg','Bakker','Visser','Smit','Meijer','de Boer','Mulder','Bos','Vos']],
 'West Germany':[['Hans','Karl','Werner','Heinz','Günter','Helmut','Wolfgang','Klaus','Dieter','Horst'],['Müller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Schulz','Hoffmann','Koch','Richter']],
 Czechoslovakia:[['Jan','Josef','Jiří','Václav','Karel','Ladislav','Pavel','Svatopluk','Andrej','Titus'],['Novák','Svoboda','Novotný','Dvořák','Černý','Procházka','Kučera','Veselý','Horák','Kvašňák','Pluskal','Scherer']],
 Hungary:[['László','József','János','István','Zoltán','Sándor','Ferenc','Gyula','Lajos','Tibor'],['Nagy','Kovács','Tóth','Szabó','Horváth','Varga','Kiss','Molnár','Németh','Farkas','Balogh','Papp']],
 Yugoslavia:[['Milan','Dragan','Vladimir','Josip','Ivica','Zoran','Dušan','Branko','Petar','Velibor'],['Jovanović','Petrović','Nikolić','Marković','Horvat','Kovačević','Babić','Perić','Galić','Vasović','Šekularac','Zebec']],
 Belgium:[['Jean','Jef','Pierre','Paul','Wilfried','Léon','Marcel','Roger','Georges','Jacques'],['Peeters','Janssens','Maes','Jacobs','Mertens','Dubois','Lambert','Dupont','Claes','Hanon','Puis','Stockman']],
 France:[['Jean','Pierre','Michel','André','Robert','Roger','Jacques','Bernard','Guy','Lucien'],['Martin','Bernard','Dubois','Thomas','Robert','Richard','Petit','Durand','Leroy','Moreau','Laurent','Simon']],
 Austria:[['Franz','Josef','Karl','Walter','Ernst','Rudolf','Johann','Gerhard','Erich','Anton'],['Gruber','Huber','Bauer','Wagner','Pichler','Steiner','Moser','Mayer','Hofer','Leitner','Berger','Fuchs']],
 Poland:[['Jan','Stanisław','Andrzej','Józef','Tadeusz','Jerzy','Zbigniew','Włodzimierz','Henryk','Ryszard'],['Nowak','Kowalski','Wiśniewski','Wójcik','Kowalczyk','Kamiński','Lewandowski','Zieliński','Szymański','Woźniak','Lubański','Oślizło']],
 Bulgaria:[['Georgi','Ivan','Dimitar','Petar','Nikola','Hristo','Stefan','Todor','Aleksandar','Dinko'],['Ivanov','Georgiev','Dimitrov','Petrov','Nikolov','Hristov','Stoyanov','Todorov','Iliev','Yakimov','Kolev','Asparuhov']],
 Turkey:[['Mehmet','Ahmet','Mustafa','Ali','Hüseyin','Metin','Fatih','Turgay','Ayhan','Uğur'],['Yılmaz','Kaya','Demir','Şahin','Çelik','Yıldız','Öztürk','Aydın','Özdemir','Arslan','Doğan','Kılıç']],
 Greece:[['Giorgos','Dimitris','Nikos','Kostas','Giannis','Vasilis','Christos','Panagiotis','Thanasis','Michalis'],['Papadopoulos','Pappas','Georgiou','Oikonomou','Dimitriou','Nikolaidis','Karagiannis','Vlachos','Angelopoulos','Sideris','Botinos','Gaitatzis']],
 Switzerland:[['Hans','Peter','René','Jean','Kurt','Heinz','Rolf','Fritz','Werner','Charles'],['Müller','Meier','Schmid','Keller','Weber','Huber','Frei','Fatton','Allemann','Wüthrich','Rey','Pottier']],
 Sweden:[['Lars','Sven','Bengt','Kurt','Agne','Gunnar','Nils','Bo','Åke','Olle'],['Andersson','Johansson','Karlsson','Nilsson','Eriksson','Larsson','Olsson','Persson','Svensson','Gustavsson','Pettersson','Lindberg']],
 Norway:[['Ole','Per','Arne','Knut','Kjell','Olav','Harald','Terje','Svein','Tor'],['Hansen','Johansen','Olsen','Larsen','Andersen','Pedersen','Nilsen','Kristiansen','Jensen','Karlsen','Berg','Haugen']],
 Denmark:[['Jens','Niels','Poul','Henning','Ole','Finn','Erik','Bent','Kaj','John'],['Jensen','Nielsen','Hansen','Pedersen','Andersen','Christensen','Larsen','Sørensen','Rasmussen','Petersen','Madsen','Kristensen']],
 'Northern Ireland':[['Billy','Sammy','Jackie','Tommy','Harry','Eric','Bertie','Alex','Jimmy','Roy'],['Wilson','Campbell','Johnston','Moore','Thompson','Patterson','Irvine','Stewart','Craig','McKeag','Hamilton','Bingham']],
 'Republic of Ireland':[['Paddy','Liam','Michael','Johnny','Noel','Frank','Eamonn','Seán','Tommy','Pat'],['Murphy','Kelly','O\'Sullivan','Walsh','Byrne','Ryan','O\'Brien','Doyle','Brady','Keogh','Dunne','Nolan']],
 Malta:[['Joe','Carmel','Tony','Charles','Emanuel','Edwin','Ronnie','Alfred','Frank','Salvinu'],['Borg','Camilleri','Vella','Farrugia','Zammit','Galea','Micallef','Grech','Attard','Spiteri','Azzopardi','Cassar']],
 Luxembourg:[['Jean','Nico','Paul','Camille','Fernand','Louis','René','Marcel','Johny','Ady'],['Schmit','Müller','Weber','Wagner','Hoffmann','Thill','Klein','Schmitz','Kremer','Reiter','Theis','May']],
 Iceland:[['Jón','Sigurður','Guðmundur','Gunnar','Ólafur','Einar','Kristinn','Helgi','Þórður','Ellert'],['Jónsson','Sigurðsson','Guðmundsson','Gunnarsson','Ólafsson','Einarsson','Kristjánsson','Magnússon','Stefánsson','Pétursson','Schram','Halldórsson']]};
const EUVENUE={EC:{1961:'Bern',1962:'Amsterdam',1963:'Wembley',1964:'Vienna',1965:'Milan',1966:'Brussels',1967:'Lisbon',1968:'Wembley',1969:'Madrid',1970:'Milan'},
 CWC:{1961:'Florence',1962:'Glasgow',1963:'Rotterdam',1964:'Brussels',1965:'Wembley',1966:'Glasgow',1967:'Nuremberg',1968:'Rotterdam',1969:'Basel',1970:'Vienna'},
 FC:{1961:'Rome',1962:'Barcelona',1963:'Zagreb',1964:'Barcelona',1965:'Turin',1966:'Barcelona',1967:'Zagreb',1968:'Leeds',1969:'Newcastle',1970:'Brussels'}};
const EUWIN={EC:{1961:'BEN',1962:'BEN',1963:'MIL',1964:'INT',1965:'INT',1966:'RMA',1967:'CEL',1968:'BEN',1969:'MIL',1970:'FEY'},
 CWC:{1961:'FIO',1962:'ATM',1963:'ATM',1964:'SPO',1965:'MIL',1966:'DOR',1967:'BAY',1968:'MIL',1969:'SLO',1970:'GOR'},
 FC:{1961:'ROM',1962:'VAL',1963:'VAL',1964:'ZAR',1965:'FER',1966:'BAR',1967:'DZG',1968:'FER',1969:'AND',1970:'AND'}};
const euStr=(row,y)=>{const s=row[8];const t=clamp(y,1960,1970);return t<=1965?s[0]+(s[1]-s[0])*(t-1960)/5:s[1]+(s[2]-s[1])*(t-1965)/5;};
function euDates(y){const W=s=>firstDow(s,3);return [[W(`${y}-09-13`),W(`${y}-09-27`)],[W(`${y}-11-08`),W(`${y}-11-22`)],[W(`${y+1}-03-01`),W(`${y+1}-03-15`)],[W(`${y+1}-04-12`),W(`${y+1}-04-26`)],W(`${y+1}-05-24`)];}
/* a foreign club, with a squad that only exists while we are drawn against them */
function euClub(code){G.eu.clubs=G.eu.clubs||{};const row=EUCLUBS.find(r=>r[0]===code);const y=G.year;const str=euStr(row,y);
  const c=G.eu.clubs[code]||(G.eu.clubs[code]={id:code,code,n:row[1],s:row[2],country:row[3],c1:row[4],c2:row[5],g:row[6],crowd:row[7],m:row[9],eu:true,hon:[],bal:500000,div:-1});
  c.rep=Math.round(str);c.form=row[3]==='Italy'&&y>=1962?'Cat':aiForm(y);c.ment=1;c.tac={...DEFTAC,...(row[3]==='Italy'&&y>=1962?{tackle:2,tempo:0}:{})};
  if(!sq(code).length){const [F,L]=EUNAMES[row[3]]||EUNAMES.France;const used=new Set();const nameOf=()=>{let n;do{n=pick(F)+' '+pick(L);}while(used.has(n));used.add(n);return n;};
    const stars=(EUSTARS[code]||[]).filter(s=>y>=s[3]&&y<=s[4]);
    stars.forEach(([n,pos,b,,,bonus])=>{used.add(n);const p=mkPlayer({n,pos,b,ca:clamp(Math.round(str+bonus),40,95),c:code,real:true});p.eu=true;p.nat=row[3];});
    const need={GK:2,FB:3,CH:2,WH:3,IF:2,WG:2,CF:2};stars.forEach(s=>need[s[1]]=Math.max(0,need[s[1]]-1));
    for(const [pos,k] of Object.entries(need))for(let i=0;i<k;i++){const p=mkPlayer({n:nameOf(),pos,b:y-ri(20,31),ca:clamp(Math.round(str+ri(-7,3)),30,92),c:code});p.eu=true;p.nat=row[3];}}
  return c;}
function euPurge(keep){Object.values(G.players).forEach(p=>{if(p.eu&&p.c!==keep){delete G.players[p.id];}});SQ=null;}
function euStart(y){const old=G.eu||{};euPurge();G.eu={y,clubs:old.clubs||{},entries:(G.euNext||[]).map(e=>({...e,alive:true,round:0,met:[]})),dates:euDates(y),done:{},winners:{}};G.euNext=null;
  const me=G.eu.entries.find(e=>e.cid===U());
  G.eu.entries.filter(e=>e.cid!==U()).forEach(e=>{if(y>1960)msg('press',`${club(e.cid).s.toUpperCase()} IN EUROPE`,`${cn(e.cid)} will play in the ${EUN[e.comp]} this season.`);});
  if(me){msg('board',`Into Europe: the ${EUN[me.comp]}`,`${cn(U())} will play in the ${EUN[me.comp]} this season. Floodlit nights against the best on the Continent: the supporters can hardly wait, and neither can the treasurer.`,null,'big');euDraw();}}
function euEntry(){return G.eu&&G.eu.entries.find(e=>e.cid===U()&&e.alive);}
function euDraw(){if(G.autopilot&&!euEntry())return;const e=euEntry();if(!e)return;const r=e.round;const tgt=[58,67,73,77,80][r]+(e.comp==='EC'?2:e.comp==='CWC'?-1:0);const y=G.year;
  const pool=EUCLUBS.filter(row=>!e.met.includes(row[0]));let tot=0;const w=pool.map(row=>{const v=Math.exp(-Math.abs(euStr(row,y)-tgt)/5);tot+=v;return v;});let x=rand()*tot,row=pool[0];for(let i=0;i<pool.length;i++){x-=w[i];if(x<=0){row=pool[i];break;}}
  const br=G.eu.br&&G.eu.br.comp===e.comp&&G.eu.br.r===r-1?G.eu.br:null;let winners=null;
  if(br){winners=br.ties.map(([a,b])=>{const sa=euStr(a,y)+rf(-6,6),sb=euStr(b,y)+rf(-6,6);return sa>=sb?a:b;});row=winners.splice(ri(0,winners.length-1),1)[0];}
  const oc=euClub(row[0]);e.met.push(oc.id);e.opp=oc.id;const dt=G.eu.dates[r];
  if(Array.isArray(dt)){const homeFirst=rand()<.5;const tie=G.fxid;const a=homeFirst?U():oc.id,b=homeFirst?oc.id:U();
    const f1={id:G.fxid++,date:dt[0],comp:'EU',eu:e.comp,r,h:a,a:b,p:false,leg:1,tie},f2={id:G.fxid++,date:dt[1],comp:'EU',eu:e.comp,r,h:b,a:a,p:false,leg:2,tie};
    clearClash(U(),dt[0],f1);clearClash(U(),dt[1],f2);G.fx.push(f1,f2);}
  else{const f={id:G.fxid++,date:dt,comp:'EU',eu:e.comp,r,h:U(),a:oc.id,p:false,neutral:true,venue:(EUVENUE[e.comp]||{})[y+1]||'a neutral ground'};clearClash(U(),dt,f);G.fx.push(f);}
  sortFx();const mine=G.fx.filter(f=>f.comp==='EU'&&f.r===r&&isUserFx(f));
  msg('club',`${EUN[e.comp]} ${EUR[r]} draw`,`We have been drawn against ${oc.n} of ${oc.country}. ${mine.length>1?`The first leg is ${mine[0].h===U()?'at home':`away, at ${oc.g}`} on ${fmtDate(mine[0].date)}, and the second on ${fmtDate(mine[1].date)}.`:`The final is in ${mine[0].venue} on ${fmtDate(mine[0].date)}.`}`,null,U());
  let others=[];if(r>=2&&r<4){const rest=winners||(()=>{const used=new Set(['England',row[3]]);const p2=pool.filter(rw=>rw[0]!==row[0]&&(e.comp==='FC'||!used.has(rw[3])));const out=[];for(let k=0;k<6&&p2.length;k++){let t2=0;const w2=p2.map(rw=>{const vv=Math.exp(-Math.abs(euStr(rw,y)-tgt)/6);t2+=vv;return vv;});let x2=rand()*t2,ix=0;for(let q=0;q<p2.length;q++){x2-=w2[q];if(x2<=0){ix=q;break;}}const pk=p2.splice(ix,1)[0];out.push(pk);if(e.comp!=='FC'){used.add(pk[3]);for(let q=p2.length-1;q>=0;q--)if(used.has(p2[q][3]))p2.splice(q,1);}}return out;})();
    const need=r===2?6:2;const L2=shuffle(rest.slice()).slice(0,need);for(let k=0;k+1<L2.length;k+=2)others.push([L2[k],L2[k+1]]);G.eu.br={comp:e.comp,r,ties:others};}
  wireDraw('EU',`${EUN[e.comp]}, ${EUR[r]}`,mine.slice(0,1),mine[0],oc,{eu:others});}
function euUserResult(f,won){const e=G.eu.entries.find(x=>x.cid===U());if(!e)return;const oc=club(e.opp);
  if(!won){e.alive=false;e.out=f.r;G.eu.purge=true;if(f.r===4)G.eu.winners[e.comp]=e.opp;msg('press',`${club(U()).s.toUpperCase()} OUT OF EUROPE`,`${cn(U())} are out of the ${EUN[e.comp]}, beaten by ${oc.n}. ${f.rep||''}`,null,U());return;}
  if(f.r===4||(f.r===4&&f.leg===2)){e.alive=false;e.won=true;G.eu.winners[e.comp]=U();G.eu.purge=true;const w=club(U());w.hon.push(`${EUN[e.comp]} ${seasonLbl(G.year)}`);w.rep=Math.min(95,w.rep+5);
    wireResult('EU',f);trophyPaper('eu',null,f);G.user.cab.push({k:'eu',comp:e.comp,y:G.year,club:U()});G.user.trophies.push(`${EUN[e.comp]} ${seasonLbl(G.year)} (${w.n})`);bumpConf(15);return;}
  e.round++;G.eu.purge=true;euDraw();}
/* the other English clubs in Europe are followed from the papers */
function euDaily(d){const E=G.eu;if(!E)return;if(E.purge){E.purge=false;const e=euEntry();euPurge(e?e.opp:null);}
  E.dates.forEach((dt,r)=>{const last=Array.isArray(dt)?dt[1]:dt;if(E.done[r]||d<=last)return;E.done[r]=true;
    E.entries.filter(x=>x.alive&&x.cid!==U()&&x.round===r).forEach(x=>{const str=[60,68,74,78,81][r]+(x.comp==='EC'?2:0);const p=clamp(0.52+(teamRating(x.cid)-str)/22,0.08,0.9);
      const pool=EUCLUBS.filter(row=>Math.abs(euStr(row,G.year)-str)<8);const opp=pick(pool.length?pool:EUCLUBS);
      if(rand()<p){x.round++;if(r===4){x.alive=false;x.won=true;E.winners[x.comp]=x.cid;const w=club(x.cid);w.hon.push(`${EUN[x.comp]} ${seasonLbl(G.year)}`);w.rep=Math.min(95,w.rep+4);
          msg('press',`${w.s.toUpperCase()} WIN THE ${EUN[x.comp].toUpperCase()}`,`${w.n} have won the ${EUN[x.comp]}, beating ${opp[1]} in the final in ${(EUVENUE[x.comp]||{})[G.year+1]||'Europe'}.`,null,'big');wireText(`${EUN[x.comp]} final`,[`Good evening. Tremendous news from ${(EUVENUE[x.comp]||{})[G.year+1]||'the Continent'}.`,`${w.n} have won the ${EUN[x.comp]}, beating ${opp[1]} of ${opp[3]}.`,'A great night for English football. And now, the shipping forecast.']);}
        else if(r>=2)msg('press',`${w_(x.cid)} MARCH ON IN EUROPE`,`${cn(x.cid)} are through to the ${EUR[r+1].toLowerCase()} of the ${EUN[x.comp]} after beating ${opp[1]} of ${opp[3]}.`);}
      else{x.alive=false;x.out=r;msg('press',`${w_(x.cid)} OUT OF EUROPE`,`${cn(x.cid)} have gone out of the ${EUN[x.comp]} in the ${EUR[r].toLowerCase()}, beaten by ${opp[1]} of ${opp[3]}.`);}});
    if(r===4)Object.keys(EUN).forEach(k=>{if(E.winners[k]||E.entries.some(e=>e.cid===U()&&e.comp===k&&e.alive))return;let code=(EUWIN[k]||{})[G.year+1];if(!code||!EUCLUBS.find(x=>x[0]===code))code=pick(EUCLUBS.filter(x=>euStr(x,G.year)>=76))[0];const row=EUCLUBS.find(x=>x[0]===code);E.winners[k]=code;
      msg('world',`${row[2].toUpperCase()} WIN THE ${EUN[k].toUpperCase()}`,`${row[1]} of ${row[3]} have won the ${EUN[k]}${EUVENUE[k]&&EUVENUE[k][G.year+1]?` in ${EUVENUE[k][G.year+1]}`:''}.`,null,k==='EC'?'big':true);});});}
const w_=cid=>club(cid).s.toUpperCase();
function euQualify(summ,T){const y=summ.y;const out=[];const taken=new Set();const add=(cid,comp)=>{if(!cid||taken.has(cid))return;taken.add(cid);out.push({cid,comp});};
  add(summ.champs[0],'EC');const E=G.eu;if(E&&E.winners.EC&&G.clubs[E.winners.EC])add(E.winners.EC,'EC');
  let cw=summ.cup;if(taken.has(cw)&&summ.final)cw=summ.final.w===summ.final.h?summ.final.a:summ.final.h;add(cw,'CWC');
  if(E&&E.winners.CWC&&G.clubs[E.winners.CWC])add(E.winners.CWC,'CWC');
  const CITY={ARS:'L',TOT:'L',CHE:'L',WHU:'L',FUL:'L',QPR:'L',CRY:'L',LIV:'M',EVE:'M',MUN:'Mc',MCI:'Mc',SHW:'S',SHU:'S',AVL:'B',BIR:'B',NFO:'N',NCO:'N',BRC:'Br',BRR:'Br'};const cities=new Set(out.map(o=>CITY[o.cid]).filter(Boolean));
  if(G.lc&&G.lc.winner&&y>=1966&&T[0].some(r=>r.id===G.lc.winner)){add(G.lc.winner,'FC');if(CITY[G.lc.winner])cities.add(CITY[G.lc.winner]);}
  let n=out.filter(o=>o.comp==='FC').length;const max=y>=1965?3:2;
  for(const r of T[0].slice(1,8)){if(n>=max)break;if(taken.has(r.id))continue;const ct=CITY[r.id];if(ct&&cities.has(ct))continue;add(r.id,'FC');if(ct)cities.add(ct);n++;}
  G.euNext=out;const me=out.find(o=>o.cid===U());if(me)msg('board','We are in Europe next season',`${cn(U())} have qualified for the ${EUN[me.comp]}. The chairman is already pricing up the floodlit gates.`);}
function euReached(){const E=G.eu;const e=E&&E.entries.find(x=>x.cid===U());if(!e)return null;return e.won?`${EUN[e.comp]}: Winners`:`${EUN[e.comp]}: ${e.out!=null?'out in the '+EUR[e.out].toLowerCase():EUR[e.round]}`;}
function euAtt(fx,est){if(fx.neutral)return est?45000:Math.round(rf(35000,65000)/10)*10;const h=club(fx.h);
  if(fx.h===U())return Math.round(Math.min(capacity(U()),[30000,20000,14000,10000][h.div]*Math.pow(h.rep/60,1.2)*1.6*(0.8+fans()/250)*(est?1:rf(.92,1.08)))/10)*10;
  return Math.round((h.crowd||30000)*(est?0.8:rf(.6,1))/10)*10;}

/* ---- cup fever ---- */
function feverUp(v){if(!v)return;const u=G.user;const before=u.fever||0;u.fever=clamp(before+v,0,10);const c=club(U());c.fans=clamp(fans()+v*1.2,0,100);
  if(before<5&&u.fever>=5)msg('press',`CUP FEVER GRIPS ${c.s.toUpperCase()}`,`Rosettes in every shop window, scarves on every lamp-post and queues round the ground for tickets. ${c.n} supporters have not been this excited in years.`,null,U());}
function feverWeekly(){const u=G.user;if(!u.fever)return;const inc=Math.round(u.fever*35*infl());club(U()).bal+=inc;u.fin.other+=inc;u.fever=u.fever<0.3?0:u.fever*0.9;}
function feverWord(){const f=G.user.fever||0;return f>=7?'Delirious':f>=4?'Running high':f>=1.5?'Building':f>0.3?'Faint':'';}

/* ---- the BBC on the wireless ---- */
const WIRE={n:'Mr Lionel Fanshawe',o:'BBC Light Programme'};
function wireQ(title,lines,hl){if(G.autopilot)return {wire:{}};const body=lines.join('\n');const m=msg('world',title,body);m.wire={hl:hl==null?-1:hl};(G.wireQ=G.wireQ||[]).push(m.id);return m;}
function wireText(title,lines){return wireQ(title,lines);}
function wireDraw(comp,rnd,ties,mine,oc,opt){opt=opt||{};const nm0=comp==='FA'?'the Football Association Challenge Cup':comp==='LC'?'the Football League Cup':'';const lines=[];
  if(comp==='EU'&&/Final$/.test(rnd)){lines.push(`Good evening. The final of the ${rnd.split(',')[0]} is set.`);lines.push(`${cn(U())} will meet ${oc.n} of ${oc.country}, in ${mine&&mine.venue&&mine.venue!=='a neutral ground'?mine.venue:'a neutral city'}, on ${mine?fmtDate(mine.date):'the appointed day'}.`);lines.push(oc.rep>=78?'They are one of the great sides of the Continent. It will take a performance for the ages.':'A great night in prospect, and a chance to make history.');lines.push('We shall bring you commentary on the night. And now, the news.');return wireQ(`The wireless: ${rnd.split(',')[0]} final`,lines,1);}
  if(comp==='EU'){lines.push(`Good evening. From Zürich comes news of the draw for the ${rnd}.`);lines.push(`${cn(U())} are paired with ${oc.n} of ${oc.country}.`);
    lines.push(oc.rep>=78?'A formidable opponent. The Continental gentlemen are said to play the game at a quite remarkable tempo.':oc.rep<=52?'On paper, a kindly draw. But one has learnt never to trust paper.':'A stern examination, one suspects, and a fascinating one.');
    if(opt.eu&&opt.eu.length){lines.push(opt.eu.length===1?'In the other tie:':'The other ties are as follows.');opt.eu.forEach(([a,b])=>lines.push(`${a[1]} of ${a[3]} will play ${b[1]} of ${b[3]}.`));}
    lines.push('We shall of course bring you commentary from both legs. And now, the news.');return wireQ(`The wireless: ${rnd} draw`,lines,1);}
  lines.push(`Good afternoon. This is the BBC Light Programme, and here is the draw for the ${rnd} of ${nm0}.`);
  const list=opt.full?shuffle(ties.slice()):shuffle(ties.filter(f=>f!==mine).slice(0,5).concat(mine?[mine]:[]));let hl=-1;
  if(opt.full&&ties.length>1)lines.push(`${ties.length===2?'Both ties':`All ${numW(ties.length)} ties`}, in the order they come out of the bag.`);
  list.forEach(f=>{if(f===mine)hl=lines.length;lines.push(`${cn(f.h)}${f.neutral?'':' will play'} ${f.neutral?'versus':''} ${cn(f.a)}.`.replace(/\s+/g,' '));});
  if(mine)lines.push(`I shall repeat the tie of interest to listeners in ${club(U()).s}: ${cn(mine.h)} against ${cn(mine.a)}.`);
  else lines.push(`There is no tie for listeners in ${club(U()).s} this time, but a fine round of matches in prospect.`);
  if(mine&&(G.user.fever||0)>=4)lines.push(`I am told there is considerable excitement in ${club(U()).s}. The rosette makers are working through the night.`);
  const d0=(mine||list[0]);lines.push(`That concludes the draw. The ties will be played on ${fmtDate(d0.date)}. And now, Sports Report.`);
  return wireQ(`The wireless: ${compShort({comp})} ${rnd} draw`,lines,hl);}
function wireResult(comp,f){const w=f.w||(f.hg>f.ag?f.h:f.a);const l=w===f.h?f.a:f.h;
  wireText(`The wireless: ${compShort(f)} final`,[`Good evening. Here is the result of the ${compShort(f)} final${f.venue?` at ${f.venue}`:''}.`,`${cn(f.h)} ${f.hg}, ${cn(f.a)} ${f.ag}${f.aet?', after extra time':''}${f.agg?`, and ${cn(w)} win on aggregate`:''}.`,`So ${cn(w)} take the trophy, and our commiserations to ${cn(l)}.`,'And now, the weather.']);}
function wireHTML(N){const m=G.inbox.find(x=>x.id===N.mid);if(!m){UI.notice=null;return '';}const lines=m.body.split('\n');
  return `<div class="scrim" data-a="noticeclose"></div><article class="wireless" role="dialog" aria-modal="true" aria-label="On the wireless">
   <div class="wl-set" aria-hidden="true"><div class="wl-grille"></div><div class="wl-dial"><span>LONG</span><span>MEDIUM</span><span>LIGHT</span><i></i></div><div class="wl-knobs"><b></b><b></b></div></div>
   <div class="wl-body"><div class="wl-por">${portrait(LOOKS.bbc)}<p class="pc-rep"><strong>${esc(WIRE.n)}</strong><small>${esc(WIRE.o)}</small></p></div>
    <div class="wl-text"><p class="eyebrow">On the wireless · ${esc(fmtDate(m.date))}</p><h2 class="h2 first">${esc(m.title.replace('The wireless: ',''))}</h2>${lines.map((l,i)=>`<p class="${i===m.wire.hl?'wl-hl':''}">${esc(l)}</p>`).join('')}</div></div>
   <footer class="wl-foot"><button class="btn go" data-a="noticeclose">Switch off the wireless</button></footer></article>`;}

/* ---- the Cups tab ---- */
function vCups(){const k=UI.cupTab||'FA';const E=G.eu;const inEu=E&&E.entries.length;
  const chips=[['FA','FA Cup'],['LC','League Cup'],['EU','Europe']];
  return `<div class="stack"><nav class="panel clubnav" aria-label="Competitions"><div class="chips">${chips.map(([x,l])=>`<button class="chip ${k===x?'on':''} ${x==='EU'?'chip-eu':x==='LC'?'chip-lc':'chip-fa'}" data-a="cuptab" data-k="${x}">${l}</button>`).join('')}</div></nav>${k==='LC'?vLC():k==='EU'?vEU():vCup()}</div>`;}
function tieRows(ties){return `<div class="ties">${ties.map(f=>`<div class="tie ${isUserFx(f)?'me':''}"><span class="th ${f.w===f.h?'win':''}">${esc(cn(f.h))} ${crest(f.h,'sm')}</span><span class="ts">${f.p?`${f.hg} - ${f.ag}`:'v'}</span><span class="ta ${f.w===f.a?'win':''}">${crest(f.a,'sm')} ${esc(cn(f.a))}</span>${f.leg?`<small class="rep">${f.leg===1?'First':'Second'} leg · ${fmtDate(f.date,true)}</small>`:''}${f.rep?`<small class="rep">${esc(f.rep)}</small>`:''}</div>`).join('')}</div>`;}
function vLC(){const c=G.lc;if(!c)return '<section class="panel"><p class="muted">No League Cup this season.</p></section>';const rounds=[...new Set(G.fx.filter(f=>f.comp==='LC').map(f=>f.r))];const r=UI.lcRound!=null&&rounds.includes(UI.lcRound)?UI.lcRound:rounds[rounds.length-1];
  const ties=G.fx.filter(f=>f.comp==='LC'&&f.r===r);
  return `<section class="panel lcpanel"><div class="ph"><h2 class="h1">The Football League Cup ${seasonLbl(G.year)}</h2><div class="chips">${rounds.map(x=>`<button class="chip ${x===r?'on':''}" data-a="lcr" data-r="${x}">${LCR[x]}</button>`).join('')}</div></div>
  ${c.winner?`<p class="banner">${crest(c.winner)} <strong>${esc(cn(c.winner))}</strong> have won the League Cup.</p>`:''}
  <p class="muted">${LCR[r]}${Array.isArray(c.dates[r])?' · two legs':''} · ${c.out.length?`Not taking part: ${c.out.map(cn).map(esc).join(', ')}. `:''}Midweek ties under the floodlights.${G.year<1966?' The final is played over two legs.':' The final is at Wembley.'}</p>
  ${tieRows(ties)}${c.byes.length&&r===c.round&&!c.winner?`<p class="muted sm">Byes: ${c.byes.map(cn).map(esc).join(', ')}</p>`:''}</section>`;}
function vEU(){const E=G.eu;const me=E&&E.entries.find(e=>e.cid===U());const mine=G.fx.filter(f=>f.comp==='EU');
  return `<section class="panel eupanel"><div class="ph"><h2 class="h1">Europe ${seasonLbl(G.year)}</h2><p class="muted">The Champions' Cup for the League champions, the Cup Winners' Cup for the FA Cup winners, and the Fairs Cup for the best of the rest.</p></div>
   ${me?`<h3 class="h2">Our campaign: the ${EUN[me.comp]}</h3>${mine.length?tieRows(mine):''}<p class="muted sm">${me.won?'Winners!':me.alive?`Next: the ${EUR[me.round].toLowerCase()}.`:`Out in the ${EUR[me.out].toLowerCase()}.`}</p>`:`<p class="muted">We are not in Europe this season. Win the League, win the FA Cup${G.year>=1965?', win the League Cup':''}, or finish near the top of the First Division to get there.</p>`}
   <h3 class="h2">English clubs in Europe</h3>${E&&E.entries.length?`<ul class="rts">${E.entries.map(e=>`<li><span>${crest(e.cid,'sm')} ${esc(cn(e.cid))} <small class="muted">${EUN[e.comp]}</small></span><small>${e.won?'<b>Winners</b>':e.alive?`In the ${EUR[e.round].toLowerCase()}`:`Out in the ${EUR[e.out||0].toLowerCase()}`}</small></li>`).join('')}</ul>`:'<p class="muted">None this season.</p>'}
   ${E&&Object.keys(E.winners).length?`<h3 class="h2">This season's winners</h3><ul class="rts">${Object.entries(E.winners).map(([k,v])=>`<li><span>${EUN[k]}</span><small>${esc(cn(v)||(EUCLUBS.find(r=>r[0]===v)||[])[1]||v)}</small></li>`).join('')}</ul>`:''}</section>`;}

function euAbandon(old){const E=G.eu;if(!E)return;const e=E.entries.find(x=>x.cid===old&&x.alive);if(!e)return;G.fx=G.fx.filter(f=>!(f.comp==='EU'&&!f.p));e.alive=false;e.out=e.round;euPurge();}
function cupBanner(f){if(!f||f.comp==='L'||!f.comp)return '';const rnd=cupRoundName(f)+(f.leg?` · ${f.leg===1?'First':'Second'} leg`:'');
  const t=f.comp==='FA'?'The FA Cup':f.comp==='LC'?'The League Cup':EUN[f.eu]||'Europe';
  const sub=f.comp==='EU'?(f.r>=4?`The final${f.venue?' in '+f.venue:''}. All of Europe is watching`:'A floodlit night against the Continent'):f.comp==='LC'?(isFinalFx(f)?'The final at Wembley':'Midweek, under the floodlights'):(f.r>=6?'Win or bust, and the whole country is watching':'Win or bust. No second chances');
  return `<div class="cupbanner ${f.comp==='LC'?'lc':f.comp==='EU'?'eu':''}" role="note"><span class="cb-rib" aria-hidden="true"></span><strong>${esc(t)}</strong><em>${esc(rnd)}${f.neutral&&f.comp==='FA'?' · Neutral ground':''}</em><small>${esc(sub)}</small><span class="cb-rib r" aria-hidden="true"></span></div>`;}
LOOKS.bbc={id:'bbc',skin:SKIN.fair,hair:['#1f1a16','#0e0b09','#4a3f36'],iris:'#4a5a7a',bg:'#23395d',bg2:'#172841',face:'normal',browW:1.6,browC:'#1f1a16',mouth:'plain',
 hairFront:`<path d="M80 98 C74 56 100 38 124 38 C150 38 168 58 162 98 C156 76 142 64 120 64 C104 64 94 70 88 78 C84 84 82 90 80 98Z" fill="#1f1a16" ${SW(3)}/><path d="M98 52 Q122 40 152 52" fill="none" stroke="#4a3f36" stroke-width="3" stroke-linecap="round"/><path d="M108 42 L102 66" stroke="#4a3f36" stroke-width="2.4"/>`,
 body:suitBody('#1c1b22','#101016','#f3efe6',null)+`<path d="M60 240 Q66 236 72 240" stroke="#f3efe6" stroke-width="3" fill="none"/>`,
 collar:`<path d="M102 198 L120 206 L102 216Z M138 198 L120 206 L138 216Z" fill="#101016" ${SW(2.2)}/><circle cx="120" cy="206" r="4.4" fill="#101016" ${SW(1.6)}/>`,
 front:`<path d="M102 139 Q111 134 120 137 Q129 134 138 139 Q129 141 120 139.5 Q111 141 102 139Z" fill="#1f1a16"/>${micArt(150,150,1.1,'BBC','#1c1b22')}`};
const PRESS_EURO=[
  {q:"A European night, boss. What do you know about {O}?",a:[
   {t:"Enough. We've done our homework, and we fear nobody.",fx:{me:1.02,mor:3,bet:1},res:"The players stand a little taller. Now they have to back it up.",head:"'WE FEAR NOBODY' SAYS {M}"},
   {t:"They're a fine side. We'll respect them and play our game.",fx:{me:1.01},res:"Sensible. The Continental press will find nothing to pin up.",head:"{M} RESPECTS {O}"},
   {t:"Not a great deal, if I'm honest. We'll find out on the night.",fx:{opp:1.01,mor:-1},res:"The reporters exchange looks. That may have been a little too honest.",head:"{M} IN THE DARK OVER {O}"}]},
  {q:"The Continental sides play a very different game. Can English football cope?",a:[
   {t:"English football can cope with anything. Ask anyone who's been to Burnden Park in January.",fx:{me:1.015,mor:2},res:"That one goes down well in the dressing room, and in the pubs.",head:"'ENGLISH FOOTBALL CAN COPE' - {M}"},
   {t:"We'll learn from them, and they'll learn from us.",fx:{conf:1},res:"The chairman enjoys a statesmanlike answer.",head:"{M}: WE WILL LEARN FROM EUROPE"},
   {t:"We'll soon know. That's the beauty of it.",fx:{},res:"Nothing much for the headline writers.",head:"{M} RELISHES EUROPEAN TEST"}]}];

/* ---------- the board's objectives for the season ---------- */
const OBJW={cup:{fa:3,lc:2,youth:1,profit:1,wages:1,gate:1,goals:1,sign:1,derby:2,home:1},acct:{fa:1,lc:1,youth:1,profit:4,wages:4,gate:2,goals:1,sign:0.5,derby:1,home:1},
 youth:{fa:1,lc:1,youth:5,profit:1,wages:2,gate:1,goals:1,sign:0.5,derby:1,home:1},show:{fa:1,lc:1,youth:1,profit:1,wages:1,gate:3,goals:4,sign:1,derby:2,home:2},amb:{fa:2,lc:1,youth:1,profit:0.5,wages:0.5,gate:1,goals:2,sign:4,derby:2,home:2}};
function objGen(){if(G.autopilot)return;const u=G.user;const c=club(U());const d=c.div;const ct=chairT();const W={...(OBJW[ct]||OBJW.amb)};
  const rival=DERBY.map(([a,b])=>a===U()?b:b===U()?a:null).find(x=>x&&G.divs[d].includes(x));if(!rival)delete W.derby;if(!G.lc||!G.lc.alive.concat(G.lc.byes).includes(U()))delete W.lc;
  const est=attendance({h:U(),a:U(),comp:'L'},true);const games=G.divs[d].length*2-2;
  const make={fa:()=>{const r=[4,3,2,2][d];return {k:'fa',r,t:`Reach the FA Cup ${CUPR[r]}`};},
   lc:()=>{const r=d<=1?4:2;return {k:'lc',r,t:`Reach the League Cup ${LCR[r]}`};},
   youth:()=>{const n=d===0?30:40;return {k:'youth',n,t:`Give ${n} first-team appearances to players aged 21 or under`};},
   profit:()=>({k:'profit',t:'Finish the season with more money in the bank than we started with'}),
   wages:()=>({k:'wages',t:'Keep the wage bill inside the budget all season'}),
   gate:()=>{const n=Math.round(est*1.06/500)*500;return {k:'gate',n,t:`Average a home League gate of ${n.toLocaleString('en-GB')}`};},
   goals:()=>{const n=Math.round(games*[1.65,1.6,1.6,1.55][d]);return {k:'goals',n,t:`Score ${n} League goals`};},
   sign:()=>{const n=[76,68,60,55][d];return {k:'sign',n,t:`Sign a player rated ${n} or more`};},
   derby:()=>({k:'derby',opp:rival,t:`Beat ${cn(rival)} in the League`}),
   home:()=>({k:'home',n:4,t:'Lose no more than four home League matches'})};
  const keys=Object.keys(W);const out=[];while(out.length<3&&keys.length){let tot=0;keys.forEach(k=>tot+=W[k]);let x=rand()*tot;let i=0;for(;i<keys.length;i++){x-=W[keys[i]];if(x<=0)break;}const k=keys.splice(Math.min(i,keys.length-1),1)[0];out.push(make[k]());}
  u.obj={y:G.year,club:U(),list:out,judged:false};
  const ch=chairOf(U());const body=[ch.pearsey?'One has discussed the coming season with the other directors, and we should like the following from you, dear boy:':'The directors met last night to discuss the coming season. Beyond the League position, we should like the following from you:']
    .concat(out.map((o,i)=>`${i+1}. ${o.t}.`)).concat([ch.pearsey?'Deliver these and one will be suitably grateful. Fail, and one will be disappointed, though not, I think, unreasonably so.':'Meet them and the board will be grateful. Miss one or two and we will not hang you for it, but we will notice.']);
  const m=msg('board','A letter from the chairman: the season ahead',body.join('\n'));m.letter={k:'obj',from:ch.n,pearsey:!!ch.pearsey};(G.letterQ=G.letterQ||[]).push(m.id);}
function objState(o){const me=U();const L=G.fx.filter(f=>f.p&&f.comp==='L'&&isUserFx(f));const left=G.fx.some(f=>!f.p&&f.comp==='L'&&isUserFx(f));
  switch(o.k){
   case 'fa':{const ties=G.fx.filter(f=>f.comp==='FA'&&isUserFx(f));const best=ties.reduce((m,f)=>Math.max(m,f.r),-1);const out=ties.some(f=>f.w&&f.w!==me);return {done:best>=o.r||G.cup.winner===me,fail:out&&best<o.r,txt:best>=0?`Reached the ${CUPR[best]}`:'Not started yet'};}
   case 'lc':{const ties=G.fx.filter(f=>f.comp==='LC'&&isUserFx(f));const best=ties.reduce((m,f)=>Math.max(m,f.r),-1);const out=ties.some(f=>f.w&&f.w!==me);return {done:best>=o.r,fail:out&&best<o.r,txt:best>=0?`Reached the ${LCR[best]}`:'Not started yet'};}
   case 'youth':{const n=sq(me).filter(p=>age(p)<=21).reduce((t,p)=>t+p.apps,0);return {done:n>=o.n,fail:!left&&n<o.n,txt:`${n} of ${o.n} so far`};}
   case 'profit':{const b=club(me).bal,b0=G.user.bal0??b;return {done:!left&&b>=b0,fail:!left&&b<b0,txt:`${b>=b0?'Up':'Down'} ${money(Math.abs(b-b0))} on the start of the season`};}
   case 'wages':return {done:!left&&!o.broke,fail:!!o.broke,txt:o.broke?'Gone over the budget':'Inside the budget so far'};
   case 'gate':{const h=L.filter(f=>f.h===me&&f.att);const avg=h.length?Math.round(h.reduce((t,f)=>t+f.att,0)/h.length):0;return {done:!left&&avg>=o.n,fail:!left&&avg<o.n,txt:avg?`Averaging ${avg.toLocaleString('en-GB')}`:'No home games yet'};}
   case 'goals':{const g=L.reduce((t,f)=>t+(f.h===me?f.hg:f.ag),0);return {done:g>=o.n,fail:!left&&g<o.n,txt:`${g} scored`};}
   case 'sign':return {done:!!o.met,fail:G.deadline&&!o.met,txt:o.met?`Signed ${o.met}`:G.deadline?'The deadline has passed':'Not yet'};
   case 'derby':{const w=L.some(f=>(f.h===o.opp||f.a===o.opp)&&(f.h===me?f.hg>f.ag:f.ag>f.hg));const played=L.filter(f=>f.h===o.opp||f.a===o.opp).length;return {done:w,fail:!w&&played>=2,txt:w?'Done':`${played} of 2 played`};}
   case 'home':{const l=L.filter(f=>f.h===me&&f.hg<f.ag).length;return {done:!left&&l<=o.n,fail:l>o.n,txt:`${l} home defeat${l===1?'':'s'}`};}}
  return {done:false,fail:false,txt:''};}
function objJudge(){const u=G.user;const O=u.obj;if(!O||O.judged||O.club!==U())return 0;O.judged=true;let dc=0;const lines=[];
  O.list.forEach(o=>{const s=objState(o);const ok=s.done&&!s.fail;o.res=ok?'met':'missed';dc+=ok?4:-2;lines.push(`${ok?'Met':'Missed'}: ${o.t}. ${s.txt}.`);});
  const met=O.list.filter(o=>o.res==='met').length;const ch=chairOf(U());
  msg('board',`The board's verdict: ${met} of ${O.list.length} objectives met`,`${lines.join('\n')}\n\n${ch.n}: "${met===O.list.length?(ch.pearsey?'Splendid, dear boy. Quite splendid.':'Everything we asked for. The board are delighted.'):met?(ch.pearsey?'Some progress. One had hoped for rather more.':'Some of it, not all of it. We will build on that.'):(ch.pearsey?'This is most disappointing. Unbecoming, in fact.':'None of it. The board expect better next season.')}"`);return dc;}
function objWeekly(){const O=G.user.obj;if(!O||O.club!==U())return;const w=O.list.find(o=>o.k==='wages');if(w&&!w.broke&&wageBill(U())+staffBill()>G.user.budget.wage*1.02)w.broke=true;}
function objSigned(p){const O=G.user.obj;if(!O||O.club!==U())return;const s=O.list.find(o=>o.k==='sign');if(s&&!s.met&&p.ca>=s.n)s.met=p.n;}
function objHTML(small){const O=G.user.obj;if(!O||O.club!==U())return '';const st=O.list.map(o=>({o,s:objState(o)}));
  return `<ul class="objs ${small?'sm':''}">${st.map(({o,s})=>`<li class="${s.done&&!s.fail?'ok':s.fail?'no':''}"><span class="ob-mark" aria-hidden="true">${s.done&&!s.fail?'✔':s.fail?'✘':'•'}</span><span><strong>${esc(o.t)}</strong><small>${esc(s.txt)}</small></span></li>`).join('')}</ul>`;}

/* ---------- awards: manager and player of the month ---------- */
function monthAwards(d){if(d.slice(8)!=='01')return;const mo=+d.slice(5,7);if(mo===8||mo===7||mo===6)return;
  const pm=addDays(d,-1).slice(0,7);const mname=`${MON[+pm.slice(5,7)-1]} ${pm.slice(0,4)}`;const u=G.user;
  for(let dv=0;dv<4;dv++){const fx=G.fx.filter(f=>f.p&&f.comp==='L'&&f.div===dv&&f.date.slice(0,7)===pm);if(fx.length<10)continue;const t={};
    fx.forEach(f=>{[[f.h,f.hg,f.ag],[f.a,f.ag,f.hg]].forEach(([c,a,b])=>{const r=t[c]||(t[c]={c,p:0,g:0,n:0});r.n++;r.p+=a>b?2:a===b?1:0;r.g+=a-b;});});
    const best=Object.values(t).filter(r=>r.n>=3).sort((a,b)=>b.p/b.n-a.p/a.n||b.g-a.g)[0];
    if(best){const mine=best.c===U();const who=mine?u.name:club(best.c).m;
      if(mine){(u.cab=u.cab||[]).push({k:'motm',m:mname,y:G.year,div:dv,club:U()});u.awards=(u.awards||[]);u.awards.push(`Manager of the Month, ${DIVN[dv]}, ${mname}`);bumpConf(2);
        msg('press',`${surname(u.name).toUpperCase()} IS MANAGER OF THE MONTH`,`${u.name} of ${cn(U())} has been named ${DIVN[dv]} Manager of the Month for ${mname}, after ${plu(best.p,'point')} from ${plu(best.n,'match','matches')}. He receives a gallon bottle of whisky and a handsome plaque, both of which are now in the manager's office.`,null,U());}
      else if(dv===club(U()).div)msg('press',`${club(best.c).s.toUpperCase()} MANAGER HONOURED`,`${who} of ${cn(best.c)} is the ${DIVN[dv]} Manager of the Month for ${mname}.`);}
    const ps=Object.values(G.players).filter(p=>p.c&&!p.eu&&p.c!=='ABR'&&G.clubs[p.c]&&G.clubs[p.c].div===dv&&(p.ma||0)>=3).sort((a,b)=>b.mr/b.ma-a.mr/a.ma);const pw=ps[0];
    if(pw){(pw.awards=pw.awards||[]).push({t:`Player of the Month, ${DIVN[dv]}`,m:mname,y:G.year,c:pw.c});
      if(pw.c===U()){pw.mor=clamp(pw.mor+8,5,100);relAdj(pw,3);msg('press',`${surname(pw.n).toUpperCase()} IS PLAYER OF THE MONTH`,`${pw.n} has been named ${DIVN[dv]} Player of the Month for ${mname}, with an average match rating of ${(pw.mr/pw.ma).toFixed(2)} from ${plu(pw.ma,'game')}. The award will sit on his mantelpiece; the cheque, he says, has already gone on a new three-piece suite.`,null,U());}
      else if(dv===club(U()).div)msg('press',`PLAYER OF THE MONTH: ${pw.n.toUpperCase()}`,`${pw.n} of ${cn(pw.c)} is the ${DIVN[dv]} Player of the Month for ${mname}.`);}}
  Object.values(G.players).forEach(p=>{if(p.ma){p.mr=0;p.ma=0;}});}

/* ---------- milestones, attached to the player ---------- */
const decade=()=>G.year<1970?'of the Sixties':'since 1960';
function mile(p,t,big){(p.miles=p.miles||[]).push({t,d:G.date,y:G.year,c:p.c});if(p.miles.length>8)p.miles.splice(0,p.miles.length-8);if(p.c===U()){msg('club',`${p.n}: ${t}`,`${p.n} ${t.charAt(0).toLowerCase()+t.slice(1)}. ${pick(['The lads gave him the bumps in the dressing room.','A round of applause from the terraces, and a pint from the chairman.','The programme editor is already planning a special page.'])}`,null,big?U():null);}
  else if(big&&p.ca>=75)msg('press',`${p.n.toUpperCase()}: ${t.toUpperCase()}`,`${p.n} of ${cn(p.c)} ${t.charAt(0).toLowerCase()+t.slice(1)}.`);}
function milestones(m,fx){if(fx.comp==='F')return;m.sides.forEach((s,i)=>{const club_=s.cid;s.played.forEach(pid=>{const p=G.players[pid];if(!p||p.eu)return;
    const g=m.goals.filter(x=>x.pid===pid&&x.flag!=='og'&&x.side===i).length;const gb=p.car.g-g;
    if(p.cc!==p.c){p.cc=p.c;p.cApps=0;}p.cApps=(p.cApps||0)+1;
    if([100,200,300,400,500].includes(p.car.a))mile(p,`Made his ${ord(p.car.a)} appearance ${decade()}`,p.car.a>=200||p.c===U());
    [50,100,150,200,250].forEach(n=>{if(gb<n&&p.car.g>=n)mile(p,`Scored his ${ord(n)} goal ${decade()}`,true);});
    if(p.cApps===1&&g>0&&(p.hist||[]).length)mile(p,`Scored on his debut for ${cn(p.c)}`,p.c===U());
    if(gb===0&&g>0&&age(p)<=19&&(!p.real||p.b>=1942))mile(p,'Scored his first senior goal',false);
    if(g>=3){p.hats=(p.hats||0)+1;mile(p,p.hats===1?`Scored his first hat-trick ${decade()}`:`Scored his ${ord(p.hats)} hat-trick ${decade()}`,false);}});});}
function honoursHTML(p){const aw=(p.awards||[]).map(a=>({t:`${a.t}, ${a.m}`,d:null}));const mi=(p.miles||[]).slice(-8).reverse().map(x=>({t:`${x.t} (${cn(x.c)}, ${fmtDate(x.d,true)} ${x.d.slice(0,4)})`}));
  if(!aw.length&&!mi.length)return '';return `<div class="honours"><h3 class="h2">Milestones and honours</h3><ul>${aw.map(a=>`<li class="aw">🏅 ${esc(a.t)}</li>`).join('')}${mi.map(a=>`<li>${esc(a.t)}</li>`).join('')}</ul></div>`;}

/* ---------- the run-in ---------- */
function runInInfo(){const c=club(U());const d=c.div;const left=G.fx.filter(f=>!f.p&&f.comp==='L'&&isUserFx(f));if(!left.length||left.length>8)return null;
  const t=table(d);const n=t.length;const i=t.findIndex(r=>r.id===U());if(i<0)return null;const tot=G.divs[d].length*2-2;const rem=id=>tot-t.find(r=>r.id===id).p;const maxP=id=>{const r=t.find(x=>x.id===id);return r.pts+2*(tot-r.p);};
  const Z=[1,2,2,4][d];const D=d===3?n-4:n-(d<=1?2:4);const me=t[i];const out=[];
  if(i<Z+3&&(i<Z||t[Z-1].pts-me.pts<=6)){const kind=d===0?'title':'promotion';const inside=i<Z;const threat=inside?t[Z]:t[Z-1];
    let need;if(inside){const x=Math.ceil((maxP(threat.id)-me.pts+1)/2);need=x<=0?`We are mathematically ${d===0?'champions':'promoted'}.`:x>left.length?`It is out of our hands: even winning every game, we need ${cn(threat.id)} to drop points.`:`Win ${x} of our last ${left.length} and nobody can catch us.`;}
    else{const gap=threat.pts-me.pts;need=maxP(U())<threat.pts?`It is over: we cannot catch ${cn(threat.id)}.`:`We are ${gap} point${gap===1?'':'s'} behind ${cn(threat.id)} with ${left.length} to play. Win them all and we reach ${maxP(U())} points.`;}
    out.push({kind,need,rows:t.slice(Math.max(0,Math.min(i,Z)-1),Math.max(i,Z)+2)});}
  if(i>=D-3){const safe=t[D];const x=Math.ceil((maxP(safe.id)-me.pts+1)/2);const rel=d===3?'the re-election places':'relegation';
    const need=i<D&&x<=0?`We are safe. ${d===3?'No re-election application this year.':'We will be in this division next season.'}`:i>=D&&maxP(U())<t[D-1].pts?`We are down. Nothing can save us now.`:x>left.length?`We need others to slip up: even winning every game may not be enough.`:`Win ${Math.max(1,x)} of our last ${left.length} and we avoid ${rel}.`;
    out.push({kind:d===3?'re-election':'survival',need,rows:t.slice(Math.max(0,Math.min(i,D)-2),Math.min(n,Math.max(i,D)+2))});}
  return out.length?{d,t,left,out,rem,maxP}:null;}
function runInHTML(){const R=runInInfo();if(!R)return '';const nextOf=id=>G.fx.filter(f=>!f.p&&f.comp==='L'&&(f.h===id||f.a===id)).slice(0,4).map(f=>{const o=f.h===id?f.a:f.h;return `<span title="${esc(cn(o))} ${f.h===id?'(H)':'(A)'}" class="ri-opp">${crest(o,'sm')}<small>${f.h===id?'H':'A'}</small></span>`;}).join('');
  return R.out.map(o=>`<section class="panel runin"><div class="nb-top"><p class="eyebrow">The run-in · the ${o.kind==='title'?'title race':o.kind==='promotion'?'promotion race':o.kind==='survival'?'fight to stay up':'re-election scrap'}</p><strong class="nb-when">${R.left.length} to play</strong></div>
   <table class="tbl mini"><thead><tr><th>Pos</th><th class="l">Club</th><th>Pts</th><th>Left</th><th>Max</th><th class="l">Still to play</th></tr></thead><tbody>${o.rows.map(r=>`<tr class="${r.id===U()?'me':''}"><td>${R.t.indexOf(r)+1}</td><td class="l">${crest(r.id,'sm')} ${esc(cn(r.id))}</td><td><b>${r.pts}</b></td><td>${R.rem(r.id)}</td><td>${R.maxP(r.id)}</td><td class="l ri-next">${nextOf(r.id)}</td></tr>`).join('')}</tbody></table>
   <p class="nb-foot"><strong>What we need:</strong> ${esc(o.need)}</p></section>`).join('');}

/* ---------- deadline day, the way it was done ---------- */
const DDPLACES=['a smoke-filled snooker room above the Conservative Club in {T}','the lounge bar of the Midland Hotel in {T}','the station buffet at Crewe, halfway between the two of you','a lay-by on the A6, in the back of his Humber','a greasy café opposite {G}, over two mugs of tea','the committee room at {G}, among the stacked chairs','the bar of the golf club, where he is halfway through a large Scotch','his butcher\'s shop, in the back room among the sides of beef'];
function deadlineDay(d){if(G.autopilot)return;const u=G.user;const dd=`${G.year+1}-03-15`;if(d!==dd||u.ddone===G.year)return;u.ddone=G.year;const me=U();const ids=[];const c=club(me);
  // a late bid, only if a club really needs one of ours and can pay for him
  const mine=sq(me).filter(p=>!p.inj&&age(p)<=30);const bids=[];
  Object.values(G.clubs).forEach(b=>{if(b.id===me||b.rep<c.rep-12)return;const bx=bestXI(b.id,b.form).xi.map(id=>G.players[id]).filter(Boolean);
    mine.forEach(p=>{const same=bx.filter(q=>q.pos===p.pos);const weak=same.length?Math.min(...same.map(q=>q.ca)):0;if(p.ca>=weak+4&&b.bal>valueOf(p)*1.2&&(avgForm(p)>=6.7||p.listed))bids.push([b,p]);});});
  if(bids.length&&rand()<0.65){const [b,tgt]=pick(bids);const fee=roundFee(valueOf(tgt)*rf(1.1,1.35));const villa=b.id==='AVL'&&me!=='AVL';
    const body=villa?`A telegram arrives at noon: "UNDERSTAND ${tgt.n.toUpperCase()} MIGHT BE AVAILABLE STOP ${money(fee)} STOP REPLY BEFORE FIVE STOP". ${grouseLine()}`:`The telephone goes at two o'clock. It is ${b.m}, the ${b.n} manager, and he is ringing from a call box. "Three hours to the deadline. ${money(fee)} for ${tgt.n}, cash, and I need an answer before five."`;
    ids.push(msg('transfer',`Deadline day: ${b.n} want ${tgt.n}`,body,{k:'offer',club:b.id,pid:tgt.id,fee,exp:dd,place:villa?'moor':'phone'}).id);}
  // a cut-price sale, only if a club is genuinely short of money
  const skint=Object.values(G.clubs).filter(x=>x.id!==me&&x.bal<0&&sq(x.id).length>17);const floor=Math.min(...G.user.xi.map(id=>G.players[id]).filter(Boolean).map(q=>q.ca));
  const pool=[];skint.forEach(x=>sq(x.id).forEach(p=>{if(!p.inj&&age(p)<=30&&p.ca>=floor-2)pool.push(p);}));
  const p=pool.sort((a,b)=>b.ca-a.ca)[ri(0,Math.min(4,pool.length-1))];
  if(p&&rand()<0.6){const sc=club(p.c);const ch=chairOf(p.c);const fee=roundFee(valueOf(p)*rf(0.72,0.88));const w=G.wageCap?Math.min(G.wageCap,wageDemand(p)):wageDemand(p);
    const pi=pick(DDPLACES.map((x,i)=>i).filter(i=>!/butcher/.test(DDPLACES[i])||/butcher/.test(ch.job||'')));const where=p.c==='AVL'?null:fill(DDPLACES[pi],{T:sc.s,G:sc.g});
    ids.push(msg('transfer',`Deadline day: ${p.n} for ${money(fee)}?`,`A message arrives by the lunchtime post: ${ch.n}, chairman of ${sc.n}, needs money in the bank before the weekend. He will let ${p.n} (${POSN[p.pos]}, ${age(p)}, rated ${caK(p)}) go for ${money(fee)}, well under his value${where?`, if you can meet him in ${where} before five o'clock`:''}.${p.c==='AVL'?' '+grouseLine():''}\n\nThe forms have to reach the Football League's offices in Lytham St Annes by the deadline. There is no time to haggle: it is ${money(fee)}, and he will want £${w} a week.`,{k:'ddbuy',club:p.c,pid:p.id,fee,exp:dd,place:p.c==='AVL'?'moor':DDPLACEK[pi]}).id);}
  // the rumour mill never stops
  const RUM=[(s,to)=>`The Sporting Pink hears that ${to.n} have made a late approach for ${s.n} of ${cn(s.c)}. A taxi was seen outside the ground at noon. ${pick(['Nobody at the club would comment.','The manager said: "No comment. And get off my car."','The player was spotted buying a new suit.'])}`,
    (s,to)=>`Our man at ${club(s.c).g} reports that ${to.n}'s chief scout has been in the stand for the last three home games, and all eyes were on ${s.n}. "He was taking notes in a very small notebook," says a steward.`,
    (s,to)=>`Is ${s.n} on his way? The Sporting Pink understands that ${cn(s.c)} have turned down one offer from ${to.n} this week and are expecting another before five o'clock.`];
  shuffle(Object.values(G.players).filter(q=>q.c&&G.clubs[q.c]&&q.c!==me&&q.ca>=74&&!q.eu)).slice(0,2).forEach((star,k)=>{const to=pick(Object.values(G.clubs).filter(x=>x.id!==star.c&&x.rep>=club(star.c).rep-5));if(!to)return;
    ids.push(msg('press',`DEADLINE DAY: ${surname(star.n).toUpperCase()} TO ${to.s.toUpperCase()}?`,RUM[(k+ri(0,2))%3](star,to)).id);});
  if(ids.length){G.dday={y:G.year,ids};(G.ddQ=G.ddQ||[]).push(1);G.holdDay=true;}}
function ddHTML(){const D=G.dday;if(!D){UI.notice=null;return '';}const ms=D.ids.map(id=>G.inbox.find(x=>x.id===id)).filter(Boolean);
  return `<div class="scrim" data-a="noticeclose"></div><article class="dday" role="dialog" aria-modal="true" aria-label="Deadline day">
   <header class="dd-head"><div><p class="eyebrow">${esc(fmtDate(G.date))}</p><h2>Deadline Day</h2><p class="dd-sub">The forms must be at the League offices in Lytham St Annes by five o'clock.</p></div>
    <div class="dd-clock" aria-hidden="true"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#f6efd9" stroke="#1c1b19" stroke-width="4"/>${[...Array(12)].map((_,i)=>{const a=i*30*Math.PI/180;return `<line x1="${50+38*Math.sin(a)}" y1="${50-38*Math.cos(a)}" x2="${50+44*Math.sin(a)}" y2="${50-44*Math.cos(a)}" stroke="#1c1b19" stroke-width="3"/>`;}).join('')}<line x1="50" y1="50" x2="50" y2="26" stroke="#1c1b19" stroke-width="5" transform="rotate(60 50 50)" stroke-linecap="round"/><line x1="50" y1="50" x2="50" y2="14" stroke="#c42b1c" stroke-width="3" stroke-linecap="round"/></svg><b>3 hours to go</b></div></header>
   ${ms.map(m=>`<section class="dd-item"><h3>${esc(m.title.replace('Deadline day: ',''))}</h3>${m.act&&m.act.place?`<figure class="dd-art">${meetArt(m.act.place,m.act.club)}</figure>`:''}${esc(m.body).split('\n').filter(Boolean).map(p=>`<p>${p}</p>`).join('')}${msgActions(m)}</section>`).join('')}
   <footer class="dd-foot"><button class="btn go" data-a="noticeclose">Back to the office</button><small class="muted">Anything you leave waits in the intray until five o'clock.</small></footer></article>`;}
function ddBuy(m){const a=m.act;const p=G.players[a.pid];const c=club(U());if(!p||p.c!==a.club){a.done=true;a.res='Too late: he has gone elsewhere';return;}
  if(a.fee>c.bal||a.fee>G.user.budget.transfer){toast(`${noFunds()} <span>He costs ${money(a.fee)}. You have ${money(G.user.budget.transfer)} to spend and ${money(c.bal)} in the bank.</span>`);return;}
  if(ftSize()>=FTMAX){toast(`<strong>No room.</strong> <span>${esc(fullMsg())}</span>`);return;}
  {const w=G.wageCap?Math.min(G.wageCap,wageDemand(p)):wageDemand(p);if(wageBill(U())+staffBill()+w>G.user.budget.wage){toast(`<strong>The wages won't stretch.</strong> <span>He wants £${w} a week, which would take you over the wage budget.</span>`);return;}}
  const fromC=a.club;transfer(p,U(),a.fee);p.w=G.wageCap?Math.min(G.wageCap,wageDemand(p)):wageDemand(p);p.until=G.year+2;p.signed=G.date;G.user.lastBuy={n:p.n,d:G.date};objSigned(p);
  a.done=true;a.res=`Done. ${p.n} signs, with minutes to spare.`;UI.notice={k:'deal',kind:'buy',pid:p.id,fee:a.fee,fromCid:a.club,fromName:cn(a.club),w:p.w,years:3};
  msg('press',`LATE DEAL: ${surname(p.n).toUpperCase()} JOINS ${club(U()).s.toUpperCase()}`,`${cn(U())} beat the transfer deadline to sign ${p.n} from ${cn(a.club)} for ${money(a.fee)}. The forms reached Lytham St Annes, it is said, with four minutes to spare.`,null,U());achGive('deadline');}

/* ---------- players who can play more than one position ---------- */
const ALTPOS={'Bobby Charlton':['CF','WG'],'Denis Law':['CF'],'George Best':['IF'],'Jimmy Greaves':['CF','IF'],'Dave Mackay':['CH','IF'],'Bobby Moore':['CH'],'Johnny Haynes':['WH'],'Geoff Hurst':['IF'],'Martin Peters':['IF','WH'],'Alan Ball':['WH'],'Nobby Stiles':['CH'],'Roger Hunt':['CF'],'Ian St John':['IF'],'Cliff Jones':['IF'],'John White':['WH'],'Danny Blanchflower':['IF'],'Bryan Douglas':['IF'],'Peter McParland':['CF'],'Jimmy McIlroy':['WH'],'Johnny Giles':['WG','WH'],'Billy Bremner':['IF'],'Norman Hunter':['CH'],'Colin Bell':['IF'],'Mike Summerbee':['IF'],'Francis Lee':['WG','IF'],'Tony Book':['CH'],'Jimmy Armfield':['WH'],'Dennis Viollet':['IF'],'Albert Quixall':['WG'],'Bobby Collins':['WH'],'Ron Flowers':['CH'],'Peter Swan':['WH'],'Maurice Norman':['FB'],'Tommy Smith':['CH'],'Emlyn Hughes':['FB','CH'],'Terry Venables':['WH'],'Alan Mullery':['IF'],'Mike England':['CF']};
function altOf(p){if(p.alt)return p.alt;const k=ALTPOS[p.n];if(k)return (p.alt=k.slice());const NB={IF:['CF','WH','WG'],CF:['IF'],WG:['IF'],WH:['IF','CH'],CH:['WH','FB'],FB:['WH','CH'],GK:[]};
  const r=seeded(p.id*31+5)();const opts=NB[p.pos]||[];p.alt=r<0.35&&opts.length?[opts[Math.floor(seeded(p.id*17+3)()*opts.length)]]:[];return p.alt;}
function suitP(p,role){const s=suit(p.pos,role);return altOf(p).includes(role)?Math.max(s,0.97):s;}

/* ---------- more things to build, as the decade goes on ---------- */
const UPG_MORE={
 social:{n:"Supporters' social club and bar",cost:6000,wk:6,inc:110,from:1960,desc:'A bar, a dartboard and a Saturday night dance. Steady money every week, and the regulars love it.'},
 scoreboard:{n:'Electric scoreboard',cost:9000,wk:4,att:.01,rep:1,from:1962,desc:'Half-time scores from every ground, lit up in bulbs. Home crowds up a little, and the club looks modern.'},
 tr_medical:{n:'Medical room and physiotherapist',cost:10000,wk:5,cat:'train',from:1962,desc:'A proper physio with a heat lamp and an ultrasound machine. Injured players come back quicker.'},
 undersoil:{n:'Under-soil heating',cost:30000,wk:10,rep:2,att:.02,from:1963,desc:'After the Big Freeze, never again. Your pitch stays playable through the winter, and the grass is the envy of the League.'},
 tr_sauna:{n:'Sauna and plunge bath',cost:9000,wk:5,cat:'train',from:1964,desc:'The Continental way of recovering. Players get their fitness back faster between matches.'},
 tv:{n:'Television gantry',cost:15000,wk:6,inc:140,rep:1,from:1964,desc:'A proper platform for the BBC cameras now that Match of the Day is on. A fee every week, and the club is seen up and down the country.'},
 carpark:{n:'Supporters\' car park',cost:14000,wk:6,att:.025,from:1965,desc:'More people own cars every year. Give them somewhere to leave them, and they will come. Home crowds up about 2%.'},
 seats:{n:'Seats on the paddock',cost:40000,wk:12,att:.04,rep:2,from:1966,desc:'After the World Cup, the grounds are being brought up to date. Seats sell for more, and more people come.'},
 tr_film:{n:'Film and tactics room',cost:12000,wk:6,cat:'train',from:1966,desc:'A projector and reels of opposition matches. Your side is a little better prepared for every game.'},
 boxes:{n:'Executive boxes',cost:60000,wk:16,inc:420,rep:1,from:1967,desc:'Private boxes for local businessmen, with a waiter and a drinks cabinet. Serious money every week.'},
 shop2:{n:'Club shop with replica shirts',cost:12000,wk:5,inc:160,from:1968,desc:'Scarves, badges, rosettes and, the latest idea, shirts just like the players wear. The children all want one.'}};
Object.assign(UPG,UPG_MORE);
const upgOpen=(k,u)=>!u.from||G.year>=u.from;
function newProjects(y){const fresh=Object.entries(UPG).filter(([,u])=>u.from===y&&y>1960);if(fresh.length)msg('club','New projects available',`New ideas for the club this season: ${fresh.map(([,u])=>u.n.toLowerCase()).join(', ')}. See the Finances tab${fresh.some(([,u])=>u.cat)?' and the Training ground':''}.`);}

/* ---------- the BBC come to talk before the season starts ---------- */
const RADIOQ=[
 {q:"Good evening, Mr {M}. Listeners will wish to know: what are {C}'s ambitions for the season ahead?",a:[
   {t:"{AMB}, nothing less. I believe we have the players.",fx:{fans:3,conf:1,boast:1},res:"Bold words on the national wireless. The supporters will hold you to them."},
   {t:"To be better than last season. Steady progress.",fx:{conf:2},res:"A careful, sensible answer. The board approve."},
   {t:"To entertain the people who pay their money on a Saturday.",fx:{fans:2},res:"The terraces like the sound of that."}]},
 {q:"Your supporters have been most patient. Is there a message for them?",a:[
   {t:"Stick with us. Good days are coming, I promise you.",fx:{fans:3},res:"A promise made in front of millions. It goes down well, for now."},
   {t:"Keep singing. The players hear every word.",fx:{fans:2,mor:2},res:"The dressing room enjoyed that."},
   {t:"Judge us in May, not in August.",fx:{conf:1},res:"Fair enough, though the supporters wanted a little more warmth."}]},
 {q:"The game is changing, Mr {M}. New tactics, new money. Is the English game keeping up?",a:[
   {t:"We can learn a great deal from the Continentals. I intend to.",fx:{conf:1,pull:1},res:"A thoughtful answer. A few players' agents, such as they are, take note."},
   {t:"English football is the best in the world, and always will be.",fx:{fans:2,pull:-1},res:"Popular in the pubs. Less so among the forward-thinking."},
   {t:"Good players win matches. That will never change.",fx:{},res:"Hard to argue with."}]},
 {q:"How would you describe your own style of management, for our listeners?",a:[
   {t:"Firm but fair. The players know where they stand.",fx:{mor:1,conf:1},res:"The players listening at home nod along."},
   {t:"I'm one of the lads. My door is always open.",fx:{mor:3,conf:-1},res:"The players like it. The chairman raises an eyebrow."},
   {t:"I leave the talking to the players. On the pitch.",fx:{pull:1},res:"Brief, and rather good."}]},
 {q:"And finally, Mr {M}: which of your players should listeners keep an eye on this season?",pick:true,a:[
   {t:"{STAR}. The best player at the club, and he knows it.",fx:{star:5},res:"{STAR} will be delighted. One or two others may be less so."},
   {t:"Young {KID}. Remember the name.",fx:{kid:8},res:"The youngster is walking on air. The pressure is on him now."},
   {t:"All of them. We win and lose as a team.",fx:{mor:2},res:"Diplomatic. Nobody is upset, and nobody is especially thrilled."}]}];
function radioStart(){const u=G.user;if(G.autopilot)return;if(u.radioY===G.year)return;u.radioY=G.year;const idx=shuffle([0,1,2,3]).slice(0,2).concat([4]);G.radio={qs:idx,i:0,log:[],y:G.year};(G.radioQ=G.radioQ||[]).push(1);}
function radioVars(){const S=sq(U()).slice().sort((a,b)=>b.ca-a.ca);const kid=sq(U()).filter(p=>age(p)<=20).sort((a,b)=>b.pa-a.pa)[0]||S[S.length-1];const c=club(U());
  return {M:surname(G.user.name),C:c.s,STAR:S[0]?S[0].n:'The captain',KID:kid?surname(kid.n):'the youngster',AMB:c.div===0?(expFor(U())<=4?'The championship':'A place near the top'):expFor(U())<=4?'Promotion':'A good season',sid:S[0]&&S[0].id,kid:kid&&kid.id};}
function radioHTML(){const R=G.radio;if(!R){UI.notice=null;return '';}const v=radioVars();const done=R.i>=R.qs.length;const Q=!done&&RADIOQ[R.qs[R.i]];
  return `<div class="scrim"></div><article class="wireless radio" role="dialog" aria-modal="true" aria-label="BBC radio interview">
   <div class="wl-set" aria-hidden="true"><div class="wl-grille"></div><div class="wl-dial"><span>LONG</span><span>MEDIUM</span><span>LIGHT</span><i></i></div><div class="wl-knobs"><b></b><b></b></div></div>
   <div class="wl-body"><div class="wl-por">${portrait(LOOKS.bbc)}<p class="pc-rep"><strong>${esc(WIRE.n)}</strong><small>${esc(WIRE.o)} · Sports Report</small></p></div>
    <div class="wl-text"><p class="eyebrow">Live on the wireless · the season preview · question ${Math.min(R.i+1,R.qs.length)} of ${R.qs.length}</p>
    ${R.log.map(l=>`<p class="rd-q">${esc(l.q)}</p><p class="rd-a">"${esc(l.a)}"</p><p class="muted sm">${esc(l.r)}</p>`).join('')}
    ${done?`<p class="wl-hl">"Mr ${esc(v.M)}, thank you, and the very best of luck to ${esc(v.C)}. And now, the classified football results from Scotland."</p>`:`<p class="rd-q">${esc(fill(Q.q,v))}</p><div class="talkbtns">${Q.a.map((a,i)=>`<button class="btn" data-a="radioans" data-i="${i}">${esc(fill(a.t,v))}</button>`).join('')}</div>`}</div></div>
   <footer class="wl-foot">${done?'<button class="btn go" data-a="radiodone">Off air</button>':''}</footer></article>`;}
function radioAns(i){const R=G.radio;const Q=RADIOQ[R.qs[R.i]];const a=Q.a[i];const v=radioVars();const e=a.fx;const u=G.user;const c=club(U());
  if(e.fans)c.fans=clamp(fans()+e.fans,0,100);if(e.conf)bumpConf(e.conf);if(e.pull)u.pull=clamp((u.pull||0)+e.pull,-10,10);if(e.mor)sq(U()).forEach(p=>p.mor=clamp(p.mor+e.mor,5,100));if(e.boast)u.boast=true;
  if(e.star&&v.sid){const p=G.players[v.sid];p.mor=clamp(p.mor+e.star,5,100);relAdj(p,3);sq(U()).filter(q=>q!==p&&q.ca>=p.ca-6).forEach(q=>q.mor=clamp(q.mor-2,5,100));}
  if(e.kid&&v.kid){const p=G.players[v.kid];p.mor=clamp(p.mor+e.kid,5,100);relAdj(p,4);}
  R.log.push({q:fill(Q.q,v),a:fill(a.t,v),r:fill(a.res,v)});R.i++;
  if(R.i>=R.qs.length){const m=msg('world',`On the wireless: ${G.user.name} talks to the BBC`,R.log.map(l=>`${WIRE.n}: ${l.q}\n${G.user.name}: "${l.a}"`).join('\n'));}}

/* ---------- the captain ---------- */
function captain(){const u=G.user;let p=u.capt&&G.players[u.capt];if(p&&p.c===U())return p;
  const S=sq(U()).filter(q=>age(q)>=24).sort((a,b)=>(b.ca+Math.min(age(b),31)-(temper(b)==='fiery'?6:0))-(a.ca+Math.min(age(a),31)-(temper(a)==='fiery'?6:0)));p=S[0]||sq(U())[0];u.capt=p?p.id:null;u.captOut=0;return p;}
const isLeader=p=>p&&age(p)>=26&&temper(p)!=='fiery';
function makeCaptain(p){const u=G.user;const old=captain();if(old===p)return;u.capt=p.id;u.captOut=0;p.mor=clamp(p.mor+8,5,100);relAdj(p,5);
  if(old&&old.c===U()){old.mor=clamp(old.mor-(isLeader(old)?8:4),5,100);relAdj(old,-4);}
  msg('club',`${p.n} is the new captain`,`${p.n} will lead the side out from now on.${old&&old.c===U()?` ${old.n} takes it ${isLeader(old)?'badly: he had worn the armband with pride':'well enough'}.`:''}${isLeader(p)?' The dressing room respects him.':temper(p)==='fiery'?' A fiery choice. He will lead by example, but the referees had better watch out.':' Some of the senior pros are not sure about him yet.'}`);}
function captainWeekly(){const p=captain();if(!p)return;const inXI=G.user.xi.includes(p.id);const lead=isLeader(p)&&relOf(p)>=35;
  if(inXI&&lead)sq(U()).forEach(q=>{if(q!==p)q.mor=clamp(q.mor+0.4,5,100);});}
function captainMatch(fx,played){const u=G.user;const p=captain();if(!p||fx.comp!=='L')return;if(played.includes(p.id)){u.captOut=0;return;}
  if(p.inj)return;u.captOut=(u.captOut||0)+1;if(u.captOut===3){p.mor=clamp(p.mor-8,5,100);relAdj(p,-4);sq(U()).forEach(q=>q.mor=clamp(q.mor-1,5,100));
    msg('club',`The captain is unhappy`,`${p.n} has been left out for three League matches in a row. "How can I captain the side from the stand, boss?" Pick him, or give the armband to someone else.`);}}
/* a good captain sorts out a grumble before it reaches your door */
function captainHandles(type,q){const p=captain();if(!p||p===q||type!=='games'||!isLeader(p)||relOf(p)<40||rand()>0.4)return false;
  q.mor=clamp(q.mor+2,5,100);msg('club',`${p.n} has a word`,`${q.n} was set to knock on your door about his lack of games. The captain, ${p.n}, took him aside in the dressing room first. "Keep your head down and your chance will come." The matter is closed, for now.`);return true;}

/* ---------- storylines ---------- */
const NEWX={GK:'Frank Swift',FB:'Roger Byrne',CH:'Billy Wright',WH:'Duncan Edwards',IF:'Wilf Mannion',WG:'Tom Finney',CF:'Tommy Lawton'};
TALKS.wayward={who:'trainer',title:p=>`Trouble with ${p.n}`,q:p=>pick([`${p.n} was an hour late for training again this morning, boss, and smelling of beer. Something has to be done.`,`There's a picture of ${p.n} in the Sunday papers, coming out of a nightclub at three in the morning. The chairman has seen it.`,`${p.n} had a stand-up row with me in front of the whole squad. I won't have it, boss.`,`${p.n} has written off his new sports car on the ring road. He's not hurt, but the papers are all over it.`]),
 opts:[['Fine him a week\'s wages. Rules are rules.',p=>{p.mor=clamp(p.mor-5,5,100);relAdj(p,-3);p.story.firm=(p.story.firm||0)+1;return 'He pays up, sulking. The rest of the squad take note.';}],
  ['Drop him for the next match.',p=>{p.drop=addDays(G.date,7);p.susp=false;p.dropWhy='Dropped for disciplinary reasons';p.mor=clamp(p.mor-8,5,100);relAdj(p,-4);p.story.firm=(p.story.firm||0)+1;return 'He is out of the side. He slams the door on the way out.';}],
  ['Put an arm round him. Find out what is wrong.',p=>{p.mor=clamp(p.mor+3,5,100);relAdj(p,4);p.story.soft=(p.story.soft||0)+1;return 'He opens up a little. Whether he changes his ways is another matter.';}]]};
function storyWeekly(){if(G.autopilot)return;const u=G.user;const S=sq(U());
  // the tearaway
  if(!S.some(p=>p.story&&p.story.k==='wayward'&&!p.story.done)&&rand()<0.03){const w=S.find(p=>temper(p)==='fiery'&&age(p)<=28&&p.ca>=62&&!p.storyY);
    if(w){w.storyY=G.year;w.story={k:'wayward',n:0};}}
  S.forEach(p=>{const s=p.story;if(!s||s.done)return;
    if(s.k==='wayward'&&rand()<(0.04+(p.mor<50?0.05:0)+(G.user.xi.includes(p.id)?0:0.02))*(upgDone('welfare')?0.5:1)&&!(G.talkQ||[]).length){s.n++;if(s.n>3){s.done=true;
        if((s.firm||0)>=2){p.ca=Math.min(p.pa,p.ca+1);p.mor=clamp(p.mor+6,5,100);msg('press',`${surname(p.n).toUpperCase()}: I'M A CHANGED MAN`,`${p.n} says the manager's firm hand has turned his career round. "I was going off the rails. The boss wouldn't have it, and he was right."`,null,U());}
        else if((s.soft||0)>=2){p.mor=clamp(p.mor+4,5,100);msg('press',`${surname(p.n).toUpperCase()} THANKS HIS MANAGER`,`${p.n} credits his manager's patience for getting him through a difficult spell. "He stuck by me when nobody else would."`,null,U());}
        else{p.listed=true;msg('club',`${p.n} wants a fresh start`,`After a troubled season, ${p.n} has asked for a transfer. He is on the list.`);}return;}
      const m=msg('club',TALKS.wayward.title(p),`The trainer: "${TALKS.wayward.q(p)}"`,{k:'talk',type:'wayward',pid:p.id});(G.talkQ=G.talkQ||[]).push(m.id);}});}
function storyMatch(fx,m){if(fx.comp==='F'||m.us<0)return;const s=m.sides[m.us];const me=U();
  s.played.forEach(pid=>{const p=G.players[pid];if(!p)return;const r=s.rt[pid]??6.4;
    // the youngster breaking through
    if(age(p)<=19&&p.pa>=74&&!p.kid){p.kid={apps:0,rs:0};if(r>=7&&rand()<0.6)msg('press',`A STAR IS BORN AT ${club(me).g.toUpperCase()}?`,`On his first-team debut, ${p.n} had the crowd on its feet. The ${age(p)}-year-old ${POSN[p.pos].toLowerCase()} finished with a rating of ${r.toFixed(1)}.`,null,me);}
    if(p.kid&&!p.kid.done){p.kid.apps++;p.kid.rs+=r;if(p.kid.apps===6){p.kid.done=true;const avg=p.kid.rs/6;
      if(avg>=7.0&&rand()<0.55){p.pa=Math.min(95,p.pa+2);p.mor=clamp(p.mor+8,5,100);msg('press',`THE NEW ${NEWX[p.pos].toUpperCase()}?`,`Six games into his career, ${p.n} is being talked about in the same breath as ${NEWX[p.pos]}. "He has everything," says one old pro. "Just leave him alone and let him play." The big clubs are said to be watching.`,null,me);}
      else if(avg<6.3&&rand()<0.5)msg('club',`${p.n} finding his feet`,`${p.n} has found the first team hard going. The coaches say he will be better for the experience.`);}}
    // back from a long injury
    if(p.comeback){p.comeback=false;p.mor=clamp(p.mor+6,5,100);if(p.ca>=teamRating(U())-4&&rand()<0.7)msg('press',`${surname(p.n).toUpperCase()} IS BACK`,`${p.n} made his first appearance in ${p.comebackDays} days after ${p.comebackWhat}, and was given a standing ovation when his name was read out.`,null,me);}});
  // the veteran's farewell
  const home=fx.h===me&&fx.comp==='L';if(home&&!G.fx.some(f=>!f.p&&f.comp==='L'&&f.h===me)){sq(me).filter(p=>p.retireAtEnd&&s.played.includes(p.id)).forEach(p=>{club(me).fans=clamp(fans()+3,0,100);
    msg('press',`FAREWELL, ${p.n.toUpperCase()}`,`${p.n} played his last match at ${club(me).g} today. The whole ground stood to applaud him off, and the players formed a guard of honour. ${p.car.a} appearances this decade; memories that will last a good deal longer.`,null,me);});}}
function storySeason(){if(G.autopilot)return;sq(U()).forEach(p=>{if(age(p)>=33&&p.apps>=15&&!p.retireAtEnd&&rand()<0.25){p.retireAtEnd=true;
  msg('club',`${p.n}: "This will be my last season"`,`${p.n} has told you, and then the local paper, that this season will be his last. "I want to go out while people still remember me as a player." The supporters will want to give him a proper send-off at the last home match.`,null,U());}});}

/* ---------- the other managers ---------- */
const MGRP={'Bill Shankly':['fiery','Fiery, funny and fiercely proud. He will say anything to get under your skin.'],'Tommy Docherty':['fiery','Quick with a quip and quicker with a temper.'],'Brian Clough':['fiery','Young, brilliant and never, ever quiet.'],
 'Matt Busby':['paternal','Kindly, wise and quietly ruthless. The father of the game.'],'Joe Mercer':['paternal','Warm, avuncular and loved by everybody in the game.'],'Harry Potts':['paternal','A gentleman of the old school.'],
 'Don Revie':['gamesman','Superstitious, meticulous and not above a little gamesmanship. He keeps a dossier on everybody.'],'Harry Catterick':['gamesman','Secretive. He trusts nobody, least of all the press.'],'Stan Cullis':['dour','A disciplinarian. His teams run through walls.'],
 'Bill Nicholson':['dour','A perfectionist who rarely smiles. Praise from him is praise indeed.'],'Alf Ramsey':['dour','Formal, tight-lipped and utterly single-minded.'],'Ron Greenwood':['purist','A thinker. He believes football should be played the right way.'],
 'Jimmy Hill':['purist','Full of new ideas. He wants to change the whole game, not just his own club.'],'Bertie Mee':['dour','A physio turned manager. Organised to the last detail.'],'Malcolm Allison':['fiery','Flamboyant, cigar in hand, and convinced he is always right.'],'Alec Stock':['paternal','Charming and shrewd, a master of lower-league football.'],'Vic Buckingham':['purist','A cultured coach with Continental ideas.'],'Dave Sexton':['purist','Thoughtful and quiet. A coach first, a manager second.']};
const MGRT={fiery:'Fiery',paternal:'Paternal',gamesman:'Gamesman',dour:'Dour',purist:'Purist',gent:'Gentleman'};
function mgrOf(cid){const c=club(cid);const n=c.m;const r=MGRP[n];if(r)return {n,type:r[0],blurb:r[1],real:true};const ts=['gent','gent','dour','fiery','paternal','gamesman','purist'];const t=ts[hashStr(n||cid)%ts.length];
  const B={gent:'A decent sort who keeps himself to himself.',dour:'A hard man from the old school.',fiery:'Short-tempered and quick to blame the referee.',paternal:'Looks after his players like his own sons.',gamesman:'Will try any trick in the book.',purist:'Likes his football played on the grass.'};return {n,type:t,blurb:B[t],real:false};}
const mrel=n=>(G.user.mrel||{})[n]||0;const mrelAdj=(n,v)=>{const R=G.user.mrel=G.user.mrel||{};R[n]=clamp((R[n]||0)+v,-10,10);};
const mrelWord=v=>v>=6?'Good friends':v>=2?'Friendly':v<=-6?'Bitter rivals':v<=-2?'Frosty':'Cordial';
const MIND={fiery:[`"{O} have got nothing to fear from {C}. I've seen better sides in the Sunday league."`,`"If {M} thinks his lads can live with us, he's been at the sherry."`,`"We'll beat {C}. I'd put my house on it, if the wife would let me."`],
 gamesman:[`"I hear {C} have one or two injuries. It would be a shame if they didn't all recover in time."`,`"{C}? A fine side. Mind you, I hear the referee on Saturday gives a lot of penalties to the home side."`,`"We've studied {C} very closely. Very closely indeed."`],
 dour:[`"We don't talk about other teams. We talk about ourselves."`,`"{C} are a physical side. We'll be ready for that."`],paternal:[`"{M} is doing a grand job. I'll shake his hand after the game, whatever happens."`],purist:[`"{C} play a very direct style. We shall try to keep the ball on the ground."`],gent:[`"A tough game, and we'll respect {C}."`]};
function mindGames(d){if(G.autopilot)return;const f=G.fx.find(x=>!x.p&&isUserFx(x)&&x.comp==='L'&&x.date===addDays(d,1));if(!f||f.mind)return;f.mind=true;const opp=f.h===U()?f.a:f.h;const M=mgrOf(opp);
  const big=club(opp).rep>=club(U()).rep-8||isDerby(U(),opp);const odds={fiery:0.6,gamesman:0.5,dour:0.15,paternal:0.1,purist:0.14,gent:0.1}[M.type];if(!big||rand()>odds)return;
  const q=fill(pick(MIND[M.type]),{O:club(opp).s,C:club(U()).s,M:surname(G.user.name)});
  msg('press',`${surname(M.n).toUpperCase()}: ${q.replace(/"/g,'').split('.')[0].toUpperCase().slice(0,60)}`,`${M.n}, the ${cn(opp)} manager, has had his say before tomorrow's game: ${q}\n\nThe reporters want your reply.`,{k:'mind',opp,mgr:M.n,fx:f.id,exp:f.date},U());}
function mindReply(m,i){const a=m.act;const pf=G.pressFx[a.fx]||(G.pressFx[a.fx]={me:1,opp:1,bet:false});const v={M:surname(a.mgr)};let res;
  if(i===0){pf.me*=1.02;pf.opp*=1.02;mrelAdj(a.mgr,-2);club(U()).fans=clamp(fans()+1,0,100);res=`You fired back. The terraces loved it, and ${a.mgr}'s side will be fired up too.`;msg('press',`${surname(G.user.name).toUpperCase()} HITS BACK AT ${surname(a.mgr).toUpperCase()}`,`"${a.mgr} can say what he likes. We'll see who's talking at a quarter to five."`,null,U());}
  else if(i===1){pf.me*=1.01;res='You laughed it off. The players liked your calm.';}
  else{mrelAdj(a.mgr,1);res=`You said nothing. ${a.mgr} is a little disappointed not to have got a rise out of you.`;}
  a.done=true;a.res=res;}
function poachCheck(){if(G.autopilot)return;const u=G.user;if(rand()>0.06)return;const s=u.staff.filter(x=>x.q>=3)[0];if(!s||G.inbox.some(m=>m.act&&m.act.k==='poach'&&!m.act.done))return;
  const c=pick(Object.values(G.clubs).filter(x=>x.id!==U()&&x.rep>club(U()).rep));if(!c)return;const M=mgrOf(c.id);
  msg('club',`${M.n} wants ${s.n}`,`${M.n} of ${c.n} has been on the telephone to ${s.n}, your ${STAFF[s.type][0].toLowerCase()}, offering him more money to join them. ${s.n} has come to see you. "I'd rather stay, boss, but I have a family to think of."`,{k:'poach',sid:s.id,club:c.id,mgr:M.n,exp:addDays(G.date,7)});}
function poachReply(m,keep){const a=m.act;const s=G.user.staff.find(x=>x.id===a.sid);a.done=true;if(!s){a.res='He has already gone.';return;}
  if(keep){s.raise=(s.raise||1)*1.3;s.w=Math.round(s.w*1.3);mrelAdj(a.mgr,-1);a.res=`You match the offer. ${s.n} stays, on £${s.w} a week.`;}
  else{const comp=roundFee(s.q*s.q*350*infl());club(U()).bal+=comp;G.user.fin.staff-=comp;G.user.staff=G.user.staff.filter(x=>x!==s);mrelAdj(a.mgr,2);a.res=`${s.n} leaves for ${cn(a.club)}. They pay ${money(comp)} in compensation, and ${a.mgr} owes you one.`;}}
/* a friendly manager does a better deal */
const mgrDiscount=cid=>{if(!G.clubs[cid])return 1;const M=mgrOf(cid);return 1-mrel(M.n)*0.012;};
function cMgrs(){const d=club(U()).div;const ids=G.divs[d].filter(id=>id!==U());
  return `<section class="panel"><h2 class="h1">The other managers</h2><p class="muted">Every manager in ${DIVN[d]}, what he is like, and how he gets on with you. A manager who likes you will do a slightly better deal; one who does not will let you know in the papers.</p>
   <div class="tw"><table class="tbl"><thead><tr><th class="l">Manager</th><th class="l">Club</th><th class="l">Style</th><th class="l">With you</th></tr></thead><tbody>${ids.map(id=>{const M=mgrOf(id);return `<tr><td class="l"><strong>${esc(M.n)}</strong>${M.real?' <small class="muted">(real)</small>':''}<br><small class="muted">${esc(M.blurb)}</small></td><td class="l">${crest(id,'sm')} ${esc(cn(id))}</td><td class="l">${MGRT[M.type]}</td><td class="l">${mrelWord(mrel(M.n))}</td></tr>`;}).join('')}</tbody></table></div></section>`;}

/* ---------- opening nights for the big projects ---------- */
const OPENING={lights:'switch on the new floodlights',stand:'open the new main stand',cover:'christen the new roof',seats:'open the new seated paddock',boxes:'open the executive boxes',undersoil:'show off the new pitch',scoreboard:'switch on the electric scoreboard',tv:'welcome the television cameras'};
function openingNight(k){if(k==='ambassador'){const n=ambassadorName();msg('press',`${n.toUpperCase()} IS ${club(U()).s.toUpperCase()}'S NEW AMBASSADOR`,`${n} has agreed to represent ${cn(U())} at dinners, openings and supporters' club evenings. "It is an honour," he said, and signed forty autographs on the way out.`,null,U());return;}if(!OPENING[k])return;const c=club(U());const big=['lights','stand','seats','boxes'].includes(k);const i=big?pick([0,1,2,3,4,5]):pick([3,4,5,6]);
  const r=playFriendly(i,true);r.opening=OPENING[k];if(!UI.notice)UI.notice={k:'friendly',r};
  msg('press',`${c.s.toUpperCase()} ${k==='lights'?'SWITCH ON':'OPEN UP'} IN STYLE`,`${FRIENDLY[i][0]} came to ${c.g} to ${OPENING[k]}. ${r.att.toLocaleString('en-GB')} people were there to see it. ${c.n} ${r.g1}, ${FRIENDLY[i][0]} ${r.g2}.`,null,U());}

/* ---------- scouting: nobody knows exactly how good a player is until they have watched him ---------- */
const REGIONS={NW:['The North West','BRN EVE MUN BLB BOL MCI BLP PNE LIV BRY TRA ACC OLD STO SOP ROC BRW CRL CHS CRE WRE WOR'],NE:['The North East','NEW SUN MID HAR DAR'],
 YK:['Yorkshire and Humberside','SHW SHU LEE HUD ROT BAR HAL BRA BPA YOR DON HUL GRI LIN SCU'],MID:['The Midlands','WOL LEI AVL WBA BIR NFO DER STK WAL NCO PVA SHR COV CHF MAN NTN PET'],
 LON:['London','TOT ARS WHU CHE FUL CHA ORI QPR WAT BRE CRY MIL'],SW:['The South, East Anglia and Wales','SOU POR BHA PLY TOR EXE BRC BRR SWI REA BOU SOE COL GIL ALD LUT NOR IPS CAR SWA NPT'],
 SCO:['Scotland and Ireland',''],EU:['The Continent',''],SCH:['The schools','']};
const regionOf=cid=>Object.keys(REGIONS).find(k=>REGIONS[k][1].split(' ').includes(cid))||'SW';
function knowOf(p){if(!G||p.c===U())return 100;const K=G.user.know||{};let b=p.c==='ABR'?10:p.real&&p.ca>=82?70:p.c&&G.clubs[p.c]&&G.clubs[p.c].div===club(U()).div?30:15;return Math.max(b,K[p.id]||0);}
function learn(p,v){if(!p||p.c===U())return;const K=G.user.know=G.user.know||{};K[p.id]=clamp(Math.max(K[p.id]||0,knowOf(p))+v,0,100);}
function estOf(p){const k=knowOf(p);if(k>=92)return {lo:p.ca,hi:p.ca,mid:p.ca,k};const w=Math.round((100-k)*0.26);const off=(seeded(p.id*7+1)()-0.5)*0.8;const lo=clamp(Math.round(p.ca-w*(0.5+off)),20,99);return {lo,hi:clamp(lo+w,20,99),mid:lo+w/2,k};}
function barK(p){const e=estOf(p);if(e.lo===e.hi)return bar(p.ca);return `<span class="abil est" title="Scouted ${e.k}%"><i style="width:${e.lo*0.6}px"></i><b style="width:${(e.hi-e.lo)*0.6}px"></b><em>${e.lo}-${e.hi}</em></span>`;}
function potK(p){if(p.c===U()||knowOf(p)>=55)return potHTML(p);return `<span class="stars unk" title="Not scouted well enough to say">? ? ?</span>`;}
const caK=p=>{const e=estOf(p);return e.lo===e.hi?String(p.ca):`${e.lo}-${e.hi}`;};
function scoutSlots(){const q=staffQ('scout');return 1+(q>=1?1:0)+(q>=4?1:0)+(upgDone('scout2')?1:0);}
function scoutWeekly(){if(G.autopilot)return;const u=G.user;const S=u.scouting=u.scouting||{on:[],wk:0,found:[]};S.on=S.on.slice(0,scoutSlots());S.wk++;const q=staffQ('scout');const gain=12+4*q;
  S.on.forEach(r=>{let pool;if(r==='SCH'){if(S.wk%5===0)schoolboy();return;}
    if(r==='SCO')pool=Object.values(G.players).filter(p=>p.c==='ABR'&&UKN.includes(p.nat));else if(r==='EU')pool=Object.values(G.players).filter(p=>p.c==='ABR'&&!UKN.includes(p.nat));
    else pool=Object.values(G.players).filter(p=>p.c&&G.clubs[p.c]&&p.c!==U()&&regionOf(p.c)===r);
    shuffle(pool).slice(0,8).forEach(p=>learn(p,gain));});
  (u.short||[]).forEach(id=>{const p=G.players[id];if(p)learn(p,6+2*q);});
  if(S.on.length&&S.wk%4===0){const need=sq(U()).length?Math.min(...G.user.xi.map(id=>G.players[id]).filter(Boolean).map(p=>p.ca)):50;
    const cands=Object.values(G.players).filter(p=>!p.ret&&!p.eu&&!p.trial&&p.n!=='Pelé'&&p.c!==U()&&(u.know||{})[p.id]>=40&&(S.on.includes(p.c==='ABR'?(UKN.includes(p.nat)?'SCO':'EU'):regionOf(p.c))));
    const best=cands.map(p=>({p,e:estOf(p)})).filter(x=>x.e.mid>=need-4||(age(x.p)<=21&&x.p.pa>=need+4)).sort((a,b)=>b.e.mid+(age(b.p)<=21?(b.p.pa-b.p.ca)/2:0)-(a.e.mid+(age(a.p)<=21?(a.p.pa-a.p.ca)/2:0))).slice(0,3);
    if(best.length){S.last={d:G.date,ids:best.map(x=>x.p.id)};msg('club',"The chief scout's report",`Our man has been out and about in ${S.on.map(r=>REGIONS[r][0].toLowerCase()).join(' and ')}. Names worth a look:\n${best.map(x=>`${x.p.n} (${POSN[x.p.pos]}, ${age(x.p)}, ${x.p.c==='ABR'?x.p.abroad:cn(x.p.c)}): he rates him ${caK(x.p)}.${age(x.p)<=21&&x.p.pa-x.p.ca>=8?' Plenty of growing still to do.':''}`).join('\n')}\n\nFind them on the Scouting tab.`);}}}
function scoutMatch(fx){const opp=fx.h===U()?fx.a:fx.h;sq(opp).forEach(p=>learn(p,20));}
function schoolboy(){const b=G.year-15;const q=staffQ('youth'),s=staffQ('scout');const ca=ri(24,34)+q;const pa=clamp(ri(55,78)+2*q+2*s+(upgDone('tr_digs')?3:0),ca+10,94);
  const p=mkPlayer({n:genName(),pos:pick(['GK','FB','CH','WH','IF','WG','CF']),b,ca,pa,c:null});p.trial=true;G.user.know=G.user.know||{};G.user.know[p.id]=60;
  msg('club','A schoolboy worth a look',`Our scout has been standing on the touchline at schools matches. He likes ${p.n}, a ${age(p)}-year-old ${POSN[p.pos].toLowerCase()} from ${pick(['the grammar school','the secondary modern','a colliery village','a council estate on the edge of town','the Catholic school'])}. His parents would let him sign as an apprentice. Sign him and he joins the academy.`,{k:'trial',ids:[p.id],exp:addDays(G.date,14),src:'scout'});}
function vScout(){const u=G.user;const S=u.scouting=u.scouting||{on:[],wk:0};const slots=scoutSlots();const sh=(u.short||[]).map(id=>G.players[id]).filter(p=>p&&!p.ret&&p.c!==U());
  const last=S.last?S.last.ids.map(id=>G.players[id]).filter(Boolean):[];
  const row=p=>`<tr class="click" data-a="player" data-id="${p.id}"><td><span class="pos p-${p.pos}">${p.pos}</span></td><td class="l nm">${esc(p.n)}</td><td>${age(p)}</td><td class="l">${p.c==='ABR'?esc(p.abroad||'Abroad'):p.c?`${crest(p.c,'sm')} ${esc(club(p.c).s)}`:'<span class="muted">Free</span>'}</td><td class="l">${barK(p)}</td><td>${potK(p)}</td><td>${knowOf(p)}%</td><td class="r">${money(valueOf(p))}</td></tr>`;
  const head='<thead><tr><th>Pos</th><th class="l">Name</th><th>Age</th><th class="l">Club</th><th class="l">Ability (scouted)</th><th>Pot.</th><th>Known</th><th class="r">Value</th></tr></thead>';
  return `<div class="stack"><section class="panel"><div class="ph"><div><h2 class="h1">Scouting</h2><p class="muted">Until someone has watched a player, his ability is a guess: the more you know, the narrower the range. Send your scouts to a region and they will fill in the gaps, and report back every four weeks. You learn a lot about a side just by playing them.</p></div></div>
   <h3 class="h2">Where the scouts are (${S.on.length} of ${slots})</h3><div class="chips">${Object.entries(REGIONS).map(([k,[n]])=>`<button class="chip ${S.on.includes(k)?'on':''}" data-a="scoutreg" data-k="${k}">${esc(n)}</button>`).join('')}</div>
   <p class="muted sm">${slots===1?'You can cover one region yourself. A chief scout from the Backroom tab lets you cover two, and a good one three.':`Your chief scout lets you cover ${slots} regions.`} The schools find apprentices; the Continent and Scotland find players at foreign clubs.</p></section>
   <section class="panel"><h3 class="h2 first">The shortlist</h3>${sh.length?`<div class="tw"><table class="tbl">${head}<tbody>${sh.map(row).join('')}</tbody></table></div><p class="muted sm">Players on the shortlist are watched every week, wherever the scouts are.</p>`:'<p class="muted">Empty. Add players from their cards with "Add to shortlist".</p>'}</section>
   ${last.length?`<section class="panel"><h3 class="h2 first">Latest report · ${fmtDate(S.last.d,true)}</h3><div class="tw"><table class="tbl">${head}<tbody>${last.map(row).join('')}</tbody></table></div></section>`:''}</div>`;}

/* ---------- more chances to find young players ---------- */
function trialDay(d){if(G.autopilot)return;if(d!==`${G.year}-10-15`&&d!==`${G.year+1}-02-15`)return;const oct=d.slice(5,7)==='10';const q=staffQ('youth');const n=(oct?4:2)+(upgDone('schools')?1:0);const ids=[];
  for(let i=0;i<n;i++){const ca=ri(28,40)+q;const pa=clamp(ri(50,74)+3*q+(upgDone('tr_digs')?3:0)+(upgDone('schools')?3:0)+(G.user.fever>=4?2:0),ca+6,93);const p=mkPlayer({n:genName(),pos:pick(['GK','FB','CH','WH','IF','WG','CF']),b:G.year-(oct?15:16),ca,pa,c:null});p.trial=true;G.user.know=G.user.know||{};G.user.know[p.id]=q>=3?75:50;ids.push(p.id);}
  msg('club',oct?'Trial day':'Schoolboy signings',oct?`Forty lads turned up at the training ground for the annual trial day. ${q?'The youth coach':'The trainer'} has picked out ${n} worth considering. You can sign up to two as apprentices.`:`${n} local schoolboys are finishing school at Easter and their parents would like them to join the ground staff. You can sign either or both.`+' Anyone you sign joins the academy, on the Squad tab.',{k:'trial',ids,max:oct?2:2,exp:addDays(G.date,14),src:oct?'trial':'school'});}
function trialHTML(m){const a=m.act;const ps=a.ids.map(id=>G.players[id]).filter(Boolean);
  return `<div class="trials">${ps.map(p=>`<div class="trialcard ${p.trial?'':'signed'}"><strong>${esc(p.n)}</strong><small>${POSN[p.pos]}, ${age(p)}</small><span>Now ${barK(p)}</span><span>Could be ${potK(p)}</span>${p.trial&&!a.done?`<button class="btn sm go" data-a="trialsign" data-id="${m.id}" data-p="${p.id}">Sign him</button>`:p.c===U()?`<em>${p.acad?'Signed: in the academy':'Signed'}</em>`:''}</div>`).join('')}</div>${a.done?`<p class="stamp">${esc(a.res||'Done')}</p>`:`<button class="btn sm" data-a="trialdone" data-id="${m.id}">That's enough for this year</button>`}`;}
const ftSize=()=>sq(U()).filter(p=>!p.acad).length,acSize=()=>sq(U()).filter(p=>p.acad).length;
const FTMAX=30;
function fullMsg(){const n=ftSize();const over=n-FTMAX+1;return `Your first-team squad is full: ${n} of a maximum ${FTMAX} players. To sign anyone you need to get down to ${FTMAX-1}: sell or release ${over===1?'one more':plu(over,'more player','more players').replace(/^\d+ /,numW(over)+' ')}. Academy lads do not count.`;}
function fullBar(){const n=ftSize();if(n<FTMAX)return '';return `<div class="fullbar" role="note"><strong>${n>FTMAX?'Squad over the limit':'Squad full'}</strong><span>${esc(fullMsg())}</span></div>`;}
function trialSign(m,pid){const a=m.act;const p=G.players[pid];if(!p||!p.trial||a.done)return;if(G.year-p.b<=17?acSize()>=12:ftSize()>=FTMAX){toast(`<strong>No room.</strong> <span>${G.year-p.b<=17?'The academy is full (12 lads). Promote or release one first.':esc(fullMsg())}</span>`);return;}
  p.trial=false;setClub(p,U());if(G.year-p.b<=17)p.acad=true;p.yfrom=`${{trial:'Trial day',school:'Schoolboy signing',scout:'Spotted at a schools match'}[a.src||'trial']}, ${MON[+G.date.slice(5,7)-1].slice(0,3)} ${G.date.slice(0,4)}`;toast(`<strong>${esc(p.n)} signed.</strong> <span>${p.acad?'He joins the academy: Squad tab, Academy.':'He joins the first-team squad.'}</span>`);p.w=Math.max(3,Math.round(wageFor(p)*0.5));p.until=G.year+2;p.hist.push({y:G.year,from:null,to:U(),fee:0});a.signed=(a.signed||0)+1;
  if(a.signed>=(a.max||2)||!a.ids.some(id=>G.players[id]&&G.players[id].trial))trialClose(m);}
function trialClose(m){const a=m.act;a.done=true;const s=a.ids.filter(id=>G.players[id]&&G.players[id].c===U()).map(id=>G.players[id].n);a.res=s.length?`Signed: ${s.join(', ')}.`:'Nobody signed this time.';a.ids.forEach(id=>{const p=G.players[id];if(p&&p.trial){delete G.players[id];}});SQ=null;}

/* ---------- departures: everyone who has left the club lately, and how ---------- */
const LEFTW={sold:'Sold',released:'Released by you',contract:'Contract ran out',retired:'Retired',home:'Went home',banned:'Banned',tapped:'Lured away as a lad'};
function departures(){const me=U();const out=[];const oc=G.inbox.filter(m=>m.title==='Out of contract').map(m=>m.body).join(' ');
  Object.values(G.players).forEach(p=>{if(p.eu||p.c===me)return;const H=p.hist||[];const i=H.map(h=>h.to).lastIndexOf(me),j=H.map(h=>h.from).lastIndexOf(me);if(i<0&&j<0&&!(p.leftWhy&&p.leftOn))return;const nx=j>i?H[j]:H[i+1];const y=nx?nx.y:(p.leftOn?+p.leftOn.slice(0,4):G.year);if(y<G.year-2&&!(p.leftOn&&p.leftOn>=`${G.year-2}`))return;
    let how=p.leftWhy||null;if(!how){if(nx&&nx.from===me)how='sold';else if(p.relBy===me)how=p.relWhy==='tap'?'tapped':p.relWhy==='home'?'home':'released';else if(p.ret&&!nx)how='retired';else if(oc.includes(p.n))how='contract';}
    out.push({p,how,y,nx});});
  return out.sort((a,b)=>b.y-a.y||b.p.ca-a.p.ca);}
function sqGone(){const L=departures();
  return `<section class="panel"><div class="ph"><div><h2 class="h1">Departures</h2><p class="muted">Everyone who has left the club in the last two seasons, and how. Your players can only leave if you sell them, release them, let their contract run out or let a homesick player go home, or if they retire.</p></div></div>
   ${L.length?`<div class="tw"><table class="tbl"><thead><tr><th>Pos</th><th class="l">Name</th><th>Age</th><th class="l">Ability</th><th class="l">How he left</th><th class="l">Now</th></tr></thead><tbody>${L.map(x=>{const p=x.p;return `<tr><td><span class="pos p-${p.pos}">${p.pos}</span></td><td class="l nm click" data-a="player" data-id="${p.id}">${esc(p.n)}</td><td>${age(p)}</td><td class="l">${bar(p.ca)}</td><td class="l">${x.how?`${LEFTW[x.how]||'Left'}${x.how==='sold'&&x.nx&&x.nx.fee?` (${money(x.nx.fee)})`:''}, ${x.y}`:'Left the club'}</td><td class="l">${p.ret?'<span class="muted">Retired</span>':p.c==='ABR'?esc(p.abroad||'Abroad'):p.c&&G.clubs[p.c]?`${crest(p.c,'sm')} ${esc(club(p.c).s)}`:'<span class="muted">Free agent</span>'}</td></tr>`;}).join('')}</tbody></table></div>`:'<p class="muted">Nobody has left in the last two seasons.</p>'}</section>`;}
/* ---------- the club secretary's contract reminders ---------- */
const expiringNow=()=>sq(U()).filter(p=>!p.acad&&p.until!=null&&p.until<=G.year).sort((a,b)=>b.ca-a.ca);
function contractMemo(d){if(G.autopilot||!G.user)return;const md=d.slice(5);const k={'01-02':'jan','03-01':'mar','04-15':'last'}[md];if(!k)return;
  G.user.cmemo=G.user.cmemo||{};const key=G.year+k;if(G.user.cmemo[key])return;G.user.cmemo[key]=1;const L=expiringNow();if(!L.length)return;
  const free=G.year+1>=1964;const sum=`${G.year+1}`;
  const lines=L.map(p=>`${p.n} (${POSN[p.pos].toLowerCase()}, ${age(p)}, £${p.w} a week)${p.mor<45?': not a happy man':p.ca>=75?': one of our best':''}`).join('\n');
  const head=k==='last'?'Last call: contracts ending':'Contracts running out';
  const body=k==='last'?`A final word from the club secretary. These contracts end with the season, and that is only weeks away:\n\n${lines}\n\n${free?`Unless they sign new terms, they leave on a free transfer the day the season ends, and we get nothing for them.`:`Under the retain-and-transfer system we can keep them on their old terms, but they will not thank us for it.`} Open a player's card and choose "Offer a new contract".`
    :`From the club secretary. ${plu(L.length,'player has','players have').replace(/^\d+/,cap1(numW(L.length)))} ${L.length===1?'a contract that ends':'contracts that end'} in the summer of ${sum}:\n\n${lines}\n\n${free?`If they have not signed new terms by then, they are free to walk out of the door for nothing.`:`We can retain them on their old terms if we must, but a new contract keeps them happy.`} Open a player's card and choose "Offer a new contract".`;
  const m=msg('club',head,body,{k:'contracts',ids:L.map(p=>p.id)});if(k==='last')m.force=true;}
function contractsHTML(m){const a=m.act;const ps=a.ids.map(id=>G.players[id]).filter(p=>p&&p.c===U());const left=ps.filter(p=>p.until<=G.year);
  return left.length?`<div class="row gap wrap">${left.map(p=>`<button class="btn sm" data-a="player" data-id="${p.id}">${esc(p.n)}</button>`).join('')}</div><small class="muted">Click a name to open his card and offer a new contract.${ps.length>left.length?` Already sorted: ${andList(ps.filter(p=>p.until>G.year).map(p=>p.n))}.`:''}</small>`:'<p class="stamp">All sorted</p>';}
/* ---------- the academy: where the lads come from, how they get on, and who decides ---------- */
const YCUPW={1960:'CHE',1961:'NEW',1962:'WHU',1963:'MUN',1964:'EVE',1965:'ARS',1966:'SUN',1967:'BRN',1968:'SUN',1969:'TOT',1970:'ARS'};
const YCR=['First Round','Second Round','Third Round','Fourth Round','Quarter-final','Semi-final','Final'];
const acadLads=()=>sq(U()).filter(p=>p.acad);
function ycoach(){const st=(G.user.staff||[]).filter(s=>s.type==='youth').sort((a,b)=>b.q-a.q)[0];return st?{n:st.n,t:'the youth coach',q:st.q}:{n:null,t:'the trainer',q:0};}
function ycoachName(){const c=ycoach();return c.n?`${c.t}, ${c.n},`:c.t;}
function mentorOf(p){const m=p.mentor&&G.players[p.mentor];return m&&m.c===U()&&!m.acad?m:null;}
function mentorPool(p){const taken=new Set(acadLads().filter(x=>x!==p).map(x=>x.mentor).filter(Boolean));return sq(U()).filter(m=>!m.acad&&age(m)>=26&&!taken.has(m.id)).sort((a,b)=>b.ca-a.ca);}
const formsDue=p=>p.acad&&(G.year+1-p.b>=18||(p.acadReal&&p.acadReal<=G.year+1));
function acadLine(p){const a=age(p),gap=p.pa-p.ca,mg=p.mg||0,ya=p.yapps||0,yg=p.ygls||0,ra=p.rapps||0;const m=mentorOf(p);const mo=+G.date.slice(5,7);const late=mo>=1&&mo<=4;
  if(p.homesick)return `Homesick. ${m?`${surname(m.n)} is keeping an eye on him.`:'He needs someone to look out for him.'}`;
  if(yg>=6&&ya<=yg*2.5)return `Scoring for fun in the youth team: ${yg} in ${ya}.`;
  if(mg>=4)return 'Coming on in leaps and bounds this season.';
  if(ra>=8)return 'Holding his own against grown men in the reserves.';
  if(pathVerdict(p)[0]==='now')return 'Ready for the first team. He is wasted down here.';
  if(late&&mg===0&&p.ca<p.pa)return 'Has stood still this season. He needs a push.';
  if(gap>=30&&a<=16)return 'Raw, but there is a real player in there.';
  if(gap<=6)return 'Not much more to come, I fear.';
  const t=traitsOf(p).find(k=>!TRAITS[k].neg);if(t)return `Has something about him already: ${TRAITS[t].n.toLowerCase()}.`;
  if(m)return `Learning plenty from ${surname(m.n)}.`;
  return ['Works hard, listens, does what he is told.','Good feet. Needs to fill out.','A quiet lad. Lets his football do the talking.','Keen as mustard. First in, last out.','Cleans the boots without being asked.','Needs to learn when to pass.'][hashStr(p.n)%6];}
function acadVerdict(p){const gap=p.pa-p.ca;const v=pathVerdict(p)[0];if(v!=='later'||gap>=14||p.pa>=70)return ['keep','Keep him'];if(gap<=6&&p.ca<DIVBASE[club(U()).div]-10)return ['rel','Let him go'];return ['maybe','Your call'];}
/* the first of every month, September to May */
function acadMonth(d){if(G.autopilot||d.slice(8)!=='01')return;const mo=+d.slice(5,7);if(mo>=6&&mo<=8)return;const L=acadLads();const c=ycoach();
  L.forEach(p=>{const m=mentorOf(p);if(p.ca<p.pa){let ch=0.26+0.05*c.q+(m?0.06+Math.max(0,m.ca-55)/300:0)+(((p.yapps||0)+(p.rapps||0))>=6?0.05:0)+(upgDone('tr_digs')?0.04:0);if(p.homesick)ch*=0.4;if(rand()<ch){p.ca++;p.mg=(p.mg||0)+1;}}
    if(p.homesick){if(m&&rand()<0.5)p.homesick=false;else if(!m&&!G.inbox.some(x=>x.act&&!x.act.done&&x.act.k==='yhome'&&x.act.pid===p.id)&&rand()<0.12){removeFromUser(p);setClub(p,null,'home');p.acad=false;p.homesick=false;p.relBy=U();p.relY=G.year;p.relWhy='home';msg('club',`${p.n} has gone home`,`${p.n} packed his case on Sunday night and caught the train home. His mother rang the club on Monday: he will not be coming back. Nobody had taken him under their wing.`);}}});
  const busy=G.inbox.some(x=>x.act&&!x.act.done&&(x.act.k==='yhome'||x.act.k==='ytap'));const L2=acadLads();
  if(L2.length&&!busy){const hs=L2.filter(p=>!p.homesick&&age(p)<=17&&!mentorOf(p)&&p.hsY!==G.year);
    if(hs.length&&rand()<0.14){const p=pick(hs);p.homesick=true;p.hsY=G.year;
      msg('club',`${p.n} is homesick`,`A word from ${ycoachName()}: young ${p.n} has been in tears in his digs. He wants to go home to his mother, and the landlady says he has hardly touched his tea all week. He is ${age(p)} and a long way from home.\n\nLeave it and he may well get on a train one night.`,{k:'yhome',pid:p.id});}
    else{const st=L2.filter(p=>p.pa>=76&&p.tapY!==G.year).sort((a,b)=>b.pa-a.pa)[0];const big=Object.values(G.clubs).filter(x=>x.id!==U()&&x.div===0&&x.rep>club(U()).rep+4);
      if(st&&big.length&&rand()<0.07){const bc=pick(big);st.tapY=G.year;const sum=Math.round((150+(G.year-1960)*25)/25)*25;
        msg('club',`${bc.s} are after ${st.n}`,`${cap1(ycoachName())} is furious. Somebody from ${bc.n} has been round to see ${st.n}'s parents. Nothing in writing, of course, but there was talk of a new television, a job on the ground staff for his father and an envelope with ${money(sum)} in it.\n\nIt is against the rules, and everybody does it. The lad's head has been turned.`,{k:'ytap',pid:st.id,club:bc.id,sum});}}}
  if(mo===4)formsCall();else if([10,12,2].includes(mo)&&L.length)ycReport();}
const cap1=t=>t.charAt(0).toUpperCase()+t.slice(1);
function ycReport(){const L=acadLads().sort((a,b)=>(b.mg||0)-(a.mg||0)||b.pa-a.pa);if(!L.length)return;const c=ycoach();const best=L[0],slow=L.filter(p=>!(p.mg)&&p.ca<p.pa);
  const lines=L.slice(0,8).map(p=>`${p.n} (${p.pos}, ${age(p)}): ${acadLine(p)}`);
  msg('club','Youth coach\'s report',`${c.n?`From ${c.n}, youth coach.`:'From the trainer, who looks after the lads as well.'}${(best.mg||0)>=2||slow.length>=2?`\n\n${(best.mg||0)>=2?`The one to watch at the moment is ${best.n}. `:''}${slow.length>=2?`${andList(slow.slice(0,3).map(p=>p.n))} have not kicked on this season.`:''}`.trimEnd():''}\n\n${lines.join('\n')}${L.length>8?`\n\nAnd ${plu(L.length-8,'more','more')} besides.`:''}\n\nThe academy is on the Squad tab.`);}
/* April: the lads turning 18 need an answer */
function formsCall(){const L=acadLads().filter(p=>formsDue(p)&&!p.yform);if(!L.length)return;
  msg('club','Professional forms',`${cap1(ycoachName())} needs your decision. ${plu(L.length,'lad turns','lads turn').replace(/^\d+/,cap1(numW(L.length)))} 18 this summer. Offer a lad professional forms and he joins the first-team squad; let him go and he leaves the club when the season ends.\n\nAnyone you have not decided on by the summer will be offered forms.`,{k:'yforms',ids:L.map(p=>p.id)});}
function yformsHTML(m){const a=m.act;const ps=a.ids.map(id=>G.players[id]).filter(p=>p&&p.c===U());
  return `<div class="trials">${ps.map(p=>{const [k,v]=acadVerdict(p);return `<div class="trialcard ${p.yform?'signed':''}"><strong>${esc(p.n)}</strong><small>${POSN[p.pos]}, ${age(p)}</small><span>Now ${bar(p.ca)}</span><span>Could be ${potHTML(p)}</span><small class="muted">${esc(acadLine(p))}</small><span class="verdict v-${k==='keep'?'now':k==='rel'?'later':'soon'}">Coach says: ${v}</span>${p.yform?`<em>${p.yform==='keep'?'Forms offered':'Being let go'}</em><button class="btn sm ghost" data-a="yform" data-id="${p.id}" data-k="none">Change my mind</button>`:`<div class="row gap"><button class="btn sm go" data-a="yform" data-id="${p.id}" data-k="keep">Offer forms</button><button class="btn sm" data-a="yform" data-id="${p.id}" data-k="rel">Let him go</button></div>`}</div>`;}).join('')}</div>${ps.length?'':'<p class="muted">Nobody left to decide on.</p>'}<button class="btn sm" data-a="yformsdone" data-id="${m.id}">Done for now</button>`;}
/* the FA Youth Cup */
function ycDates(y){const W=s=>firstDow(s,3);return [W(`${y}-11-08`),W(`${y}-12-06`),W(`${y+1}-01-17`),W(`${y+1}-02-14`),W(`${y+1}-03-14`),W(`${y+1}-04-04`),[W(`${y+1}-04-22`),W(`${y+1}-05-01`)]];}
function ycStr(cid){const c=club(cid);return DIVBASE[c.div]*0.8+(c.rep-60)/6+(hashStr(cid+G.year)%7)-3+(YCUPW[G.year]===cid?4:0);}
function ycSide(){const xi=sq(U()).filter(p=>!p.inj&&G.year-p.b<=18).sort((a,b)=>b.ca-a.ca).slice(0,11);const pad=[];for(let i=xi.length;i<11;i++)pad.push({n:'a trialist',pos:pick(['FB','WH','CH','WG']),ca:30,pseudo:true});return {xi,team:xi.concat(pad)};}
function ycState(){const u=G.user;if(!u.ycup||u.ycup.y!==G.year)u.ycup={y:G.year,r:0,out:false,res:[],won:false,dates:ycDates(G.year),met:[]};return u.ycup;}
function ycDraw(Y){const met=new Set(Y.met);const md=club(U()).div;let pool=Object.values(G.clubs).filter(c=>c.id!==U()&&!met.has(c.id)&&(Y.r<=1?Math.abs(c.div-md)<=1:c.div<=Math.max(0,3-Math.max(0,Y.r-1))));if(!pool.length)pool=Object.values(G.clubs).filter(c=>c.id!==U()&&!met.has(c.id));const rw=YCUPW[G.year];
  let o=null;if(Y.r>=5&&rw&&rw!==U()&&!met.has(rw)&&G.clubs[rw]&&rand()<0.6)o=rw;if(!o){let tot=0;pool.forEach(c=>tot+=c.rep);let r=rand()*tot;for(const c of pool){r-=c.rep;if(r<=0){o=c.id;break;}}if(!o)o=pool[0].id;}
  Y.opp=o;Y.home=rand()<0.5;Y.met.push(o);}
function ycWinner(Y){if(Y.winner)return;const rw=YCUPW[G.year];const ok=id=>id&&id!==U()&&G.clubs[id];Y.winner=ok(rw)?rw:pick(Object.values(G.clubs).filter(c=>c.id!==U()&&c.div===0)).id;G.ycHist=G.ycHist||{};G.ycHist[G.year]=Y.winner;}
function ycTick(d){if(G.autopilot||!G.user)return;const Y=ycState();if(Y.won)return;
  const fin=Y.dates[6][1];if(Y.out){if(d===fin)ycWinner(Y);return;}
  if(d===addDays(Array.isArray(Y.dates[Y.r])?Y.dates[Y.r][0]:Y.dates[Y.r],-10)&&!Y.opp){const {xi}=ycSide();if(xi.length<5){if(Y.r===0){Y.out=true;Y.none=true;msg('club','FA Youth Cup',`We have not been able to enter the FA Youth Cup this season: there are only ${numW(xi.length)} lads of 18 and under at the club, and you need at least five. Sign a few more apprentices.`);}return;}
    ycDraw(Y);const dt=Y.dates[Y.r];msg('club',`FA Youth Cup ${YCR[Y.r]} draw`,Y.r===6?`Our lads are in the FA Youth Cup Final! It is over two legs against ${cn(Y.opp)}: ${Y.home?'home':'away'} on ${fmtDate(dt[0])}, ${Y.home?'away':'home'} on ${fmtDate(dt[1])}.`:`Our youth team ${Y.home?'are at home to':'travel to'} ${cn(Y.opp)} on ${fmtDate(dt)}, under the floodlights.`);return;}
  const dt=Y.dates[Y.r];const legs=Array.isArray(dt)?dt:[dt];const li=legs.indexOf(d);if(li<0||!Y.opp)return;
  const {xi,team}=ycSide();if(xi.length<5){Y.out=true;msg('club','FA Youth Cup',`We could not raise a side for the FA Youth Cup tie with ${cn(Y.opp)} and have had to scratch.`);return;}
  const home=li===0?Y.home:!Y.home;const oa=ycStr(Y.opp)+Y.r*0.6-ycoach().q*0.8;let [gf,ga]=sideMatch(team,oa,home);let note='';
  const sc=pickN(team,gf);xi.forEach(p=>p.yapps=(p.yapps||0)+1);sc.forEach(p=>{if(!p.pseudo)p.ygls=(p.ygls||0)+1;});const scN=sc.map(p=>p.pseudo?'a trialist':surname(p.n));
  if(Y.r<6&&gf===ga){let [g2,a2]=sideMatch(team,oa,!home);if(g2===a2){note=rand()<0.5?' We won the replay on the toss of a coin.':' We lost the replay on the toss of a coin.';if(note.includes('won'))g2++;else a2++;}else note=` ${g2>a2?'We won':'We lost'} the replay ${Math.max(g2,a2)}-${Math.min(g2,a2)}.`;Y.res.push({r:Y.r,o:Y.opp,h:home,gf,ga,sc:scN,note});gf=g2;ga=a2;}
  else Y.res.push({r:Y.r,o:Y.opp,h:home,gf,ga,sc:scN,leg:Y.r===6?li+1:0});
  let through=null;if(Y.r<6)through=gf>ga;else if(li===1){const L=Y.res.filter(x=>x.r===6);const F=L.reduce((t,x)=>t+x.gf,0),A=L.reduce((t,x)=>t+x.ga,0);through=F>A||(F===A&&rand()<0.5);if(F===A)note=` Level on aggregate: ${through?'we won':'we lost'} the play-off.`;Y.agg=[F,A];}
  const lbl=Y.r===6?`FA Youth Cup Final, ${li?'second':'first'} leg`:`FA Youth Cup ${YCR[Y.r]}`;const r0=Y.res[Y.res.length-1];
  const body=`${r0.gf>r0.ga?'Our youngsters beat':r0.gf<r0.ga?'Our youngsters lost to':'Our youngsters drew with'} ${cn(Y.opp)} ${r0.gf}-${r0.ga} ${home?'at home':'away'}.${scN.length?` Scorers: ${scN.join(', ')}.`:''}${note}`;
  if(through===null){msg('club',lbl,body);return;}
  if(!through){Y.out=true;msg('club',lbl,`${body}${Y.r===6?` ${cn(Y.opp)} win the FA Youth Cup${Y.agg?` ${Math.max(...Y.agg)}-${Math.min(...Y.agg)} on aggregate`:''}.`:' That is the end of the road this season.'}`);if(Y.r===6){Y.winner=Y.opp;G.ycHist=G.ycHist||{};G.ycHist[G.year]=Y.opp;}return;}
  if(Y.r===6){Y.won=true;Y.winner=U();G.ycHist=G.ycHist||{};G.ycHist[G.year]=U();G.user.ycWins=(G.user.ycWins||[]).concat([G.year]);xi.forEach(p=>{if(p.ca<p.pa){p.ca++;p.mg=(p.mg||0)+1;}});
    msg('club','The FA Youth Cup is ours!',`${body} The FA Youth Cup comes to ${club(U()).g}${Y.agg?`, ${Y.agg[0]}-${Y.agg[1]} on aggregate`:''}. Every lad in the side will be the better for it.`,null,'big');return;}
  msg('club',lbl,`${body} We are through to the ${YCR[Y.r+1]}.`);Y.r++;Y.opp=null;}
/* the Squad tab's academy page */
function sqAcad(){const L=acadLads().sort((a,b)=>b.pa-a.pa||b.ca-a.ca);const c=ycoach();const u=G.user;const Y=ycState();const ys=u.yth||[];
  const nxt=(md)=>{let d=`${G.year}-${md}`;if(d<G.date)d=`${G.year+1}-${md}`;return fmtDate(d,true);};const trialD=`${G.year}-10-15`>=G.date?fmtDate(`${G.year}-10-15`,true):null;const schD=`${G.year+1}-02-15`>=G.date?fmtDate(`${G.year+1}-02-15`,true):null;
  const pend=G.inbox.filter(m=>m.act&&!m.act.done&&['trial','yforms','yhome','ytap'].includes(m.act.k));
  const formsCell=p=>{if(!formsDue(p)){const y=18-(G.year+1-p.b);return `<span class="muted sm">${y<=0?'This summer':`${plu(y,'more year','more years')}`}</span>`;}
    if(p.yform)return `<span class="verdict v-${p.yform==='keep'?'now':'later'}">${p.yform==='keep'?'Forms offered':'Being let go'}</span> <button class="btn sm ghost" data-a="yform" data-id="${p.id}" data-k="none" title="Change your mind">Undo</button>`;
    return `<div class="row gap"><button class="btn sm go" data-a="yform" data-id="${p.id}" data-k="keep">Forms</button><button class="btn sm" data-a="yform" data-id="${p.id}" data-k="rel">Let go</button></div>`;};
  const mentorCell=p=>{const pool=mentorPool(p);const m=mentorOf(p);return `<select class="inp sm" data-c="mentor" data-id="${p.id}" aria-label="Mentor for ${esc(p.n)}"><option value="">Nobody</option>${pool.map(x=>`<option value="${x.id}" ${m&&m.id===x.id?'selected':''}>${esc(surname(x.n))} (${x.pos}, ${age(x)})</option>`).join('')}</select>`;};
  const grads=Object.values(G.players).filter(p=>(p.gradOf===U()||p.relBy===U())&&!(p.acad&&p.c===U())).sort((a,b)=>(b.grad||b.relY||0)-(a.grad||a.relY||0)||b.ca-a.ca).slice(0,20);
  const ycRows=Y.res.map(r=>{const w=r.gf>r.ga?'W':r.gf<r.ga?'L':'D';return `<tr><td class="l">${YCR[r.r]}${r.leg?`, leg ${r.leg}`:''}</td><td class="l">${crest(r.o,'sm')} ${esc(club(r.o).s)} (${r.h?'H':'A'})</td><td><span class="res r${w}">${w} ${r.gf}-${r.ga}</span></td><td class="l sm">${esc(r.sc.join(', '))}${r.note?` <span class="muted">${esc(r.note.trim())}</span>`:''}</td></tr>`;}).join('');
  const hist=Object.entries(G.ycHist||{}).sort((a,b)=>b[0]-a[0]).slice(0,6);
  const ycNext=!Y.out&&!Y.won&&Y.opp?`Next: ${YCR[Y.r]} ${Y.r===6?'(two legs) ':''}${Y.home?'at home to':'away to'} ${esc(cn(Y.opp))}, ${fmtDate(Array.isArray(Y.dates[Y.r])?Y.dates[Y.r][0]:Y.dates[Y.r],true)}.`:!Y.out&&!Y.won?`The ${YCR[Y.r]} is on ${fmtDate(Array.isArray(Y.dates[Y.r])?Y.dates[Y.r][0]:Y.dates[Y.r],true)}; the draw is ten days before.`:Y.won?'Winners this season!':Y.none?'Not entered this season: you need five lads of 18 and under.':'Knocked out this season.';
  return `<section class="panel"><div class="ph"><div><h2 class="h1">The academy</h2><p class="muted">Apprentices and schoolboys who have not yet signed professional forms. They play for the youth team, in the FA Youth Cup and in the reserves, but never for the first team until you promote them. <strong>${acSize()} of 12 places taken.</strong> ${c.n?`Youth coach: ${esc(c.n)} ${'★'.repeat(c.q)}.`:'No youth coach: the trainer looks after the lads. The Backroom tab has youth coaches looking for work.'}</p></div></div>
   ${pend.length?`<div class="fullbar" role="note"><strong>Waiting for you</strong><span>${andList(pend.map(m=>m.title))}: see the intray.</span></div>`:''}
   <div class="two"><div><h3 class="h2">Where the lads come from</h3><ul class="rules"><li><strong>The summer intake.</strong> One or two apprentices report every July, more with a good youth coach or the apprentices' hostel.</li><li><strong>Trial day</strong>, 15 October${trialD?` (next: ${trialD})`:''}. Forty hopefuls turn up and the best few are put in front of you. Sign up to two.</li><li><strong>Schoolboy signings</strong>, 15 February${schD?` (next: ${schD})`:''}. Local lads leaving school at Easter whose parents want them on the ground staff.</li><li><strong>The scouts.</strong> Send a scout to the Schools region (Transfers, Scouting) and he turns up a promising lad every few weeks.</li></ul><p class="muted sm">Every lad you sign from any of these comes here, to the academy, if he is 17 or under.</p></div>
   <div><h3 class="h2">Bringing them on</h3><ul class="rules"><li><strong>A mentor.</strong> Pair a lad with a senior pro (26 or over). He comes on faster, settles quicker, and may pick up his mentor's habits, good or bad. Each senior looks after one lad.</li><li><strong>Games.</strong> Fifteen or more for the youth team and the reserves (ten with a reserve team coach) is worth an extra step each summer.</li><li><strong>The youth coach</strong> and the apprentices' hostel help every lad, every month. The coach reports in October, December and February.</li><li><strong>Professional forms.</strong> Every April you decide on the lads turning 18: offer forms, or let them go. Anyone you leave undecided is kept.</li></ul></div></div></section>
   <section class="panel"><h3 class="h2 first">The lads</h3>${L.length?`<div class="tw"><table class="tbl"><thead><tr><th>Pos</th><th class="l">Name</th><th>Age</th><th class="l">Ability</th><th>Pot.</th><th title="Ability gained since the summer">Season</th><th>Youth</th><th>Res.</th><th class="l">Mentor</th><th class="l">Coach says</th><th class="l">Pro forms</th><th></th></tr></thead><tbody>${L.map(p=>`<tr><td><span class="pos p-${p.pos}">${p.pos}</span></td><td class="l nm click" data-a="player" data-id="${p.id}">${esc(p.n)}${traitMini(p)}${p.homesick?' <span class="inj">Homesick</span>':''}${p.real?' <small class="muted">real</small>':''}<br><small class="muted">${esc(p.yfrom||'On the ground staff')}</small></td><td>${age(p)}</td><td class="l">${bar(p.ca)}</td><td>${potHTML(p)}</td><td>${p.mg?`<span class="pos-n">+${p.mg}</span>`:'<span class="muted">0</span>'}</td><td>${p.yapps||0} / ${p.ygls||0}</td><td>${p.rapps||0} / ${p.rgls||0}</td><td class="l">${mentorCell(p)}</td><td class="l sm">${esc(acadLine(p))}</td><td class="l">${formsCell(p)}</td><td><button class="btn sm" data-a="promote" data-id="${p.id}">Promote</button></td></tr>`).join('')}</tbody></table></div><p class="muted sm">Youth and Res.: appearances / goals. Click a name for his card, where you can also let him go.</p>`:'<p class="muted">Nobody in the academy at the moment. The next lads arrive with the summer intake, on trial day and at the February schoolboy signings.</p>'}</section>
   <div class="two"><section class="panel"><h3 class="h2 first">FA Youth Cup ${seasonLbl(G.year)}</h3><p class="muted sm">For lads of 18 and under, first-teamers included. Midweek ties under the floodlights, a two-legged final in the spring. Winning it gives every lad in the side a lift.</p>${ycRows?`<div class="tw"><table class="tbl"><tbody>${ycRows}</tbody></table></div>`:''}<p>${ycNext}</p>${(u.ycWins||[]).length?`<p><strong>Our wins:</strong> ${u.ycWins.map(y=>seasonLbl(y)).join(', ')}</p>`:''}${hist.length?`<p class="muted sm">Recent winners: ${hist.map(([y,id])=>`${seasonLbl(+y)} ${esc(club(id).s)}`).join(' · ')}</p>`:''}</section>
   <section class="panel"><h3 class="h2 first">Youth team</h3>${ys.length?`<div class="tw"><table class="tbl"><tbody>${ys.map(r=>{const w=r.gf>r.ga?'W':r.gf<r.ga?'L':'D';return `<tr><td class="l">${fmtDate(r.d,true)}</td><td class="l">${crest(r.o,'sm')} ${esc(club(r.o).s)} (${r.h?'H':'A'})</td><td><span class="res r${w}">${w} ${r.gf}-${r.ga}</span></td><td class="l sm">${esc(r.sc.join(', '))}</td></tr>`;}).join('')}</tbody></table></div>`:'<p class="muted">No youth matches yet this season. The youth team plays every other week once you have five lads of 18 and under.</p>'}</section></div>
   <section class="panel"><h3 class="h2 first">Old boys</h3>${grads.length?`<div class="tw"><table class="tbl"><thead><tr><th>Pos</th><th class="l">Name</th><th>Age</th><th class="l">Left the academy</th><th class="l">Now</th><th class="l">Ability</th></tr></thead><tbody>${grads.map(p=>`<tr class="click" data-a="player" data-id="${p.id}"><td><span class="pos p-${p.pos}">${p.pos}</span></td><td class="l nm">${esc(p.n)}</td><td>${age(p)}</td><td class="l">${p.gradOf===U()?`Signed pro, ${p.grad}`:p.relWhy==='home'?`Went home, ${p.relY}`:p.relWhy==='tap'?`Lured away, ${p.relY}`:`Let go, ${p.relY}`}</td><td class="l">${p.ret?'<span class="muted">Retired</span>':p.c===U()?'<strong>With us</strong>':p.c==='ABR'?esc(p.abroad||'Abroad'):p.c?`${crest(p.c,'sm')} ${esc(club(p.c).s)}`:'<span class="muted">Out of the game</span>'}</td><td class="l">${barK(p)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Lads who come through your academy, or who you let go, are listed here, so you can see how they got on.</p>'}</section>`;}
/* ---------- the supporters' club ---------- */
const FEM=['Doris','Edna','Vera','Joan','Margaret','Betty','Irene','Hilda','Marjorie','Elsie','Winifred','Gladys','Muriel','Dorothy'];
function secretaryOf(){const c=club(U());if(c.sec&&/^(Mrs|Miss) /.test(c.sec.n)&&DATA.first.includes(c.sec.n.split(' ')[1]))c.sec.n=c.sec.n.replace(/^(Mrs|Miss) /,'Mr ');
  if(!c.sec){const f=rand()<0.4;c.sec={n:f?`${pick(['Mrs','Miss'])} ${pick(FEM)} ${pick(DATA.last)}`:`Mr ${pick(DATA.first)} ${pick(DATA.last)}`,since:1950-ri(0,12)};}return c.sec;}
function coachesFor(f){return Math.max(1,Math.round((membership()/400)*(0.6+fans()/100)*(isDerby(f.h,f.a)?2:1)*(f.comp!=='L'?1.5:1)));}
function nextAway(){return G.fx.find(f=>!f.p&&f.a===U()&&!f.neutral);}
function supportersPOY(){const S=sq(U()).filter(p=>p.apps>=18).sort((a,b)=>b.rs/b.apps-a.rs/a.apps);const p=S[0];if(!p)return;(p.awards=p.awards||[]).push({t:"Supporters' Player of the Year",m:seasonLbl(G.year),y:G.year,c:U()});p.mor=clamp(p.mor+8,5,100);
  msg('press',`${surname(p.n).toUpperCase()} IS SUPPORTERS' PLAYER OF THE YEAR`,`At the supporters' club annual dinner, ${secretaryOf().n} handed ${p.n} the Player of the Year trophy, voted for by the members. "He's given everything, every week," she said. The band played until midnight.`.replace('she said',secretaryOf().n.startsWith('Mr ')?'he said':'she said'),null,U());}
function fanzine(){if(G.year<1967)return null;const c=club(U());const t=`The ${c.s} Roar`;const f=fans();const s=c.fstreak||0;
  const heads=[f>=70?'WE ARE GOING UP (OR AT LEAST NOT DOWN)':f<35?'IS ANYONE AT THE CLUB LISTENING?':'STEADY AS SHE GOES',s>=3?`${s} WINS ON THE BOUNCE: WHO SAID WHAT?`:s<=-3?'OUR SURVIVAL GUIDE TO THE WINTER':'THE PIE REVIEW: A SPECIAL INVESTIGATION',`THE BOARD: ${G.user.conf>=60?'NOT AS BAD AS WE THOUGHT':'TIME FOR SOME ANSWERS'}`,`BADGE SWAPS, PEN PALS AND A ${c.s.toUpperCase()} CROSSWORD`];return {t,heads};}

/* ---------- money: the bank, the benefactor and the men in camel coats ---------- */
function bankWatch(){if(G.autopilot)return;const u=G.user;const c=club(U());if(c.bal>=0){u.bankWarn=0;return;}
  const intr=Math.round(-c.bal*0.0012);c.bal-=intr;u.fin.other-=intr;
  const lvl=c.bal<-40000*infl()?2:1;if((u.bankWarn||0)>=lvl)return;u.bankWarn=lvl;const who='Mr H. G. Pargeter';
  const body=lvl===1?[`I note that the club's account is now overdrawn, to the sum of ${money(-c.bal)}.`,'The bank is of course happy to support the club through a temporary difficulty. Interest will be charged on the overdraft at the usual rate.','I should be grateful, however, if the account could be returned to credit at the earliest opportunity. Perhaps the sale of a player might be considered.']
    :[`The club's overdraft now stands at ${money(-c.bal)}, which is well beyond anything the bank would regard as prudent.`,'I must ask, most seriously, that steps are taken at once. The directors have been informed.','Should the position not improve, the bank will have no alternative but to review the facility.'];
  if(lvl===2)bumpConf(-4);const m=msg('board','A letter from the bank',body.join('\n'));m.letter={k:'bank',from:who,role:`Branch Manager, Midland Bank, ${c.s}`,bank:true};(G.letterQ=G.letterQ||[]).push(m.id);}
function moneyStories(){if(G.autopilot)return;const u=G.user;const c=club(U());if(u.moneyY===G.year)return;if(rand()>0.03)return;u.moneyY=G.year;const ch=chairOf(U());
  if(rand()<0.7){const who=`${pick(['Mr','Mr','Alderman','Mr'])} ${pick(DATA.first)} ${pick(DATA.last)}`;const job=pick(['a scrap metal millionaire','who owns half the mills in town','the local bus company owner','a holiday camp proprietor','who made his fortune in frozen peas','a builder with half the council contracts']);const amt=roundFee(rf(20000,60000)*infl());
    msg('board',`${who} wants to invest`,`${who}, ${job}, has offered the club ${money(amt)} in return for a seat on the board. ${ch.pearsey?'Pearsey has let it be known that he finds the man "a little loud".':'The chairman is keen.'} Men like this sometimes want a say in who plays.`,{k:'benef',who,amt,exp:addDays(G.date,14)});}
  else if(!ch.pearsey){const amt=roundFee(rf(150000,300000)*infl());msg('press',`TAKEOVER BID FOR ${c.s.toUpperCase()}`,`A consortium of local businessmen has made a ${money(amt)} bid to take control of ${c.n}. ${ch.n} is said to be considering it. The supporters are split.`,null,U());u.takeover={d:addDays(G.date,28),amt};}
  else msg('press','PEARSEY: VILLA ARE NOT FOR SALE',`A group of Birmingham businessmen enquired about buying Aston Villa this week. Pearsey sent them away. "This behaviour is most unbecoming. The club is not a biscuit tin to be passed round the room."`,null,U());}
function takeoverTick(d){const u=G.user;const T=u.takeover;if(!T||d<T.d)return;u.takeover=null;const c=club(U());
  if(rand()<0.5){const old=chairOf(U());const n=`${pick(['Mr','Mr','Sir'])} ${pick(DATA.first)} ${pick(DATA.last)}`;c.chair={n,job:'businessman',t:pick(['amb','show']),real:false,dirs:[0,1,2].map(()=>({n:genPerson(),job:pick(JOBS)}))};const inj=roundFee(rf(30000,80000)*infl());c.bal+=inj;u.budget.transfer+=Math.round(inj*0.7);
    msg('press',`${c.s.toUpperCase()} TAKEN OVER`,`The takeover is done. ${old.n} steps down, and ${n} is the new chairman of ${c.n}. He has put ${money(inj)} into the club at once, most of it for new players. "I want to win things," he says. "Quickly."`,null,'big');}
  else msg('press','TAKEOVER COLLAPSES',`The bid for ${c.n} has fallen through. ${chairOf(U()).n} remains in charge.`,null,U());}

/* ---------- your reputation ---------- */
function mrepOf(){const u=G.user;if(u.mrep==null)u.mrep=clamp(Math.round(club(U()).rep*0.55),20,60);return u.mrep;}
const mrepWord=v=>v>=85?'A legend of the game':v>=70?'One of the best in the country':v>=55?'Highly regarded':v>=40?'Respected':v>=25?'Making a name':'Unknown outside the town';
function mrepSeason(s){const u=G.user;let d=0;const U_=s.user;d+=(U_.exp-U_.pos)*0.8;if(s.champs[U_.div]===U())d+=U_.div===0?15:8;if(U_.promoted)d+=5;if(U_.relegated)d-=8;if(s.cup===U())d+=10;if(s.lc===U())d+=5;if(s.eu&&Object.values(s.eu).includes(U()))d+=15;
  u.mrep=clamp(mrepOf()+d,0,100);}
function approachCheck(){if(G.autopilot)return;const u=G.user;if(rand()>0.05||u.games<10)return;const my=club(U());if(mrepOf()<my.rep+8)return;const pool=Object.values(G.clubs).filter(c=>c.id!==U()&&c.rep>my.rep+4&&c.rep<=mrepOf()+15);if(!pool.length)return;
  if(G.inbox.some(m=>m.act&&m.act.k==='job'&&!m.act.done))return;const c=pick(pool);msg('board',`${c.n} want to talk`,`The chairman of ${c.n} has been on the telephone. Your work has not gone unnoticed, and they would like you to be their next manager. Your own board do not yet know.`,{k:'job',club:c.id,exp:addDays(G.date,21)});}
function epilogue(){const u=G.user;const r=mrepOf();const tro=(u.cab||[]).filter(t=>t.k!=='motm').length;const lines=[];
  if(r>=80&&tro>=3)lines.push('The Football Association came calling within the year. You managed England for five years, and the nation still argues about the team you picked for Mexico.');
  else if(r>=65)lines.push(G.year>=1968?'ITV snapped you up for The Big Match, where your sheepskin coat and your opinions became as famous as anything you won.':'The BBC offered you a seat on the Saturday panel, and you became the voice of reason on Grandstand.');
  else if(r>=45)lines.push('You went upstairs as general manager, and spent the Seventies telling your successor how it used to be done.');
  else lines.push('You took over a pub near the ground. The regulars still bring you the programme every other Saturday, and you still think you would have picked a different team.');
  lines.push(`Your record: ${u.career.length} season${u.career.length===1?'':'s'}, ${tro} major trophie${tro===1?'':'s'}, and a reputation as "${mrepWord(r).toLowerCase()}".`);return lines;}

/* ---------- the other clubs rise and fall ---------- */
const MGRQ5={'Bill Shankly':5,'Matt Busby':5,'Don Revie':5,'Bill Nicholson':5,'Alf Ramsey':5,'Brian Clough':5,'Harry Catterick':4,'Joe Mercer':4,'Stan Cullis':4,'Ron Greenwood':4,'Jimmy Hill':4,'Tommy Docherty':4,'Bertie Mee':4,'Malcolm Allison':4,'Harry Potts':4,'Alec Stock':3,'Vic Buckingham':3,'Dave Sexton':4};
function mq(cid){const c=club(cid);if(!c||cid===U())return 3;if(MGRQ5[c.m])return MGRQ5[c.m];if(c.mq==null)c.mq=1+Math.floor(seeded(hashStr(c.m||cid))()*4);return c.mq;}
function dynSeason(summ,T){G.dyn=G.dyn||{};const y=summ.y;
  T.forEach((t,d)=>t.forEach((r,i)=>{(G.dyn[r.id]=G.dyn[r.id]||[]).push([y,d,i+1]);if(G.dyn[r.id].length>12)G.dyn[r.id].shift();}));
  Object.values(G.clubs).forEach(c=>{if(c.id===U())return;const H=G.dyn[c.id];if(!H)return;const last=H[H.length-1];const exp=G.expect[c.id]||10;const pos=last[2];
    c.rep=clamp(c.rep+(exp-pos)*0.25,25,95);
    // managers who fall short go
    if(pos>=exp+6&&rand()<0.45&&!(G.hist&&MGRP[c.m])){const old=c.m;c.m=genName();c.mq=ri(1,4);msg('press',`${c.s.toUpperCase()} SACK ${surname(old).toUpperCase()}`,`${cn(c.id)} have dismissed ${old} after a disappointing season. ${c.m} is the new manager.`);}
    // money from somewhere
    if(c.rep<70&&rand()<0.04){const amt=roundFee(rf(60000,150000)*infl());c.bal+=amt;c.rep=Math.min(95,c.rep+4);msg('press',`MILLIONAIRE BACKS ${c.s.toUpperCase()}`,`A local millionaire has put ${money(amt)} into ${cn(c.id)}. "I want First Division football here within five years," he says.`);}
    // a golden generation
    if(rand()<0.04){for(let k=0;k<2;k++){const p=genPlayer(c.id,pick(['IF','WG','CF','WH','CH']),true);p.pa=clamp(p.pa+ri(8,15),p.ca,94);}}
    // rises and falls worth a headline
    if(H.length>=4){const was=H[H.length-4],now=last;const sc=x=>x[1]*25+x[2];const delta=sc(was)-sc(now);
      if(delta>=40&&!c.miracle){c.miracle=y;msg('press',`THE ${c.s.toUpperCase()} MIRACLE`,`Four seasons ago ${cn(c.id)} were ${ord(was[2])} in ${DIVN[was[1]]}. Now they are ${ord(now[2])} in ${DIVN[now[1]]}. Nobody in the game has come further, faster.`,null,true);}
      if(delta<=-40&&H.some(x=>x[1]===0&&x[2]<=4)&&!c.fallen){c.fallen=y;msg('press','FALLEN GIANTS',`Not long ago ${cn(c.id)} were challenging for the title. Now they are ${ord(now[2])} in ${DIVN[now[1]]}. How did it come to this?`,null,true);}}});}
function dynHTML(){const D=G.dyn;if(!D)return '';const rows=Object.entries(D).filter(([,h])=>h.length>=2).map(([id,h])=>{const a=h[0],b=h[h.length-1];return {id,from:a,to:b,delta:(a[1]*25+a[2])-(b[1]*25+b[2])};});
  const up=rows.slice().sort((a,b)=>b.delta-a.delta).slice(0,5),dn=rows.slice().sort((a,b)=>a.delta-b.delta).slice(0,5);const f=x=>`${ord(x[2])} in ${DIVN[x[1]].replace('Division ','Div. ')}`;
  const li=r=>`<li><span>${crest(r.id,'sm')} ${esc(cn(r.id))}</span><small>${f(r.from)} (${seasonLbl(r.from[0])}) → ${f(r.to)}</small></li>`;
  return `<h3 class="h2">Rise and fall</h3><div class="two"><div><p class="eyebrow">Going up in the world</p><ul class="rts">${up.map(li).join('')}</ul></div><div><p class="eyebrow">Going the other way</p><ul class="rts">${dn.map(li).join('')}</ul></div></div>`;}
function managerHall(){const tally={};const add=(n,t)=>{if(!n)return;(tally[n]=tally[n]||{n,t:[]}).t.push(t);};
  (G.record||[]).forEach(r=>{(r.mgrs||[]).forEach(([n,t])=>add(n,t));});(G.user.cab||[]).filter(t=>t.k!=='motm').forEach(t=>add(G.user.name,t.k==='cup'?'FA Cup':t.k==='lc'?'League Cup':t.k==='eu'?'Europe':`${DIVN[t.div]}`));
  const list=Object.values(tally).sort((a,b)=>b.t.length-a.t.length).slice(0,12);if(!list.length)return '';
  return `<h3 class="h2">The managers of the decade</h3><div class="tw"><table class="tbl"><thead><tr><th class="l">Manager</th><th>Honours</th><th class="l">What they won</th></tr></thead><tbody>${list.map(x=>`<tr class="${x.n===G.user.name?'me':''}"><td class="l">${esc(x.n)}</td><td>${x.t.length}</td><td class="l sm">${esc(x.t.join(', '))}</td></tr>`).join('')}</tbody></table></div>`;}

/* ---------- the end of the decade ---------- */
function decadeFinale(){if(G.autopilot)return;const u=G.user;if(u.finale)return;u.finale=true;const all=Object.values(G.players).filter(p=>!p.eu&&p.car&&p.car.a>=60);
  const XI=[['GK',1],['FB',2],['CH',2],['WH',2],['IF',2],['WG',1],['CF',1]];const team=[];XI.forEach(([pos,n])=>{all.filter(p=>p.pos===pos&&!team.includes(p)).sort((a,b)=>(b.ca*0.6+b.car.a*0.05+b.car.g*0.08)-(a.ca*0.6+a.car.a*0.05+a.car.g*0.08)).slice(0,n).forEach(p=>team.push(p));});
  const topG=all.slice().sort((a,b)=>b.car.g-a.car.g)[0],topA=all.slice().sort((a,b)=>b.car.a-a.car.a)[0];const champs=(G.record||[]).map(r=>`${seasonLbl(r.y)}: ${cn(r.champs[0])}, and ${cn(r.cup)} won the Cup`);
  const docs=[{title:'THE SIXTIES: A DECADE IN FOOTBALL',date:G.date,type:'press',cid:U(),body:[`Ten years ago the maximum wage was £20 a week, a substitute was something you had at the butcher's, and nobody had heard of 4-4-2. Here is how the decade looked in your world.`].concat(champs).join('\n')},
    {title:'THE TEAM OF THE DECADE',date:G.date,type:'press',cid:U(),body:[`Chosen by our correspondents from every man who played 60 games or more in the Sixties:`].concat(team.map(p=>`${POSN[p.pos]}: ${p.n} (${p.c&&G.clubs[p.c]?cn(p.c):'retired'}), ${plu(p.car.a,'game')}, ${plu(p.car.g,'goal')}`)).concat([topG?`Top scorer of the decade: ${topG.n}, ${plu(topG.car.g,'goal')}.`:'',topA?`Most appearances: ${topA.n}, ${topA.car.a}.`:'']).filter(Boolean).join('\n')},
    {title:`${surname(u.name).toUpperCase()}'S SIXTIES`,date:G.date,type:'press',cid:U(),body:[`${u.name} managed through the decade: ${u.career.map(c=>`${seasonLbl(c.y)} ${cn(c.club)}, ${ord(c.pos)} in ${DIVN[c.div]}`).join('; ')}.`,`Reputation: ${mrepWord(mrepOf())}.`,`${(u.cab||[]).filter(t=>t.k!=='motm').length} major trophies.`].join('\n')}];
  docs.forEach(dc=>{(u.souvenirs=u.souvenirs||[]).push(dc);scrap('Souvenir',dc.title,dc.body,dc.date,{doc:dc});});UI.paper={docs,i:0,spin:true};}

/* ---------- the scrapbook ---------- */
function scrap(kind,title,body,date,ref){const u=G.user;const S=u.scrap=u.scrap||[];if(S.some(x=>x.title===title&&x.date===date))return;S.push({kind,title,body:String(body||'').slice(0,600),date:date||G.date,y:G.year,ref:ref||null,rot:(rand()*4-2).toFixed(1)});if(S.length>400)S.shift();}
function scrapMsg(m){if(!m)return;const me=U();if(m.special){scrap('Souvenir',m.title,m.body,m.date,{mid:m.id});return;}if(m.letter){scrap('Letter',m.title,m.body,m.date,{mid:m.id});return;}
  if(m.paper&&m.cid===me&&/[A-Z]{4}/.test(m.title)&&m.title===m.title.toUpperCase())scrap('Cutting',m.title,m.body,m.date,{mid:m.id});}
function cScrap(){const u=G.user;const S=(u.scrap||[]).slice().reverse();const per=6;const pages=Math.max(1,Math.ceil(S.length/per));const pg=clamp(UI.scrapPg||0,0,pages-1);const view=S.slice(pg*per,pg*per+per);
  return `<div class="stack"><section class="panel"><h2 class="h1">The trophy room</h2>${cabinetHTML()}</section>
   <section class="panel album"><div class="alb-cover"><span>Scrapbook</span><small>${esc(G.user.name)} · ${esc(club(U()).n)}</small></div>
   ${S.length?`<div class="alb-spread">${view.map((x,i)=>`<button class="cutting k-${x.kind.toLowerCase()}" style="--rot:${x.rot}deg" data-a="scrapopen" data-i="${S.length-1-(pg*per+i)}"><small>${esc(x.kind)} · ${esc(fmtDate(x.date,true))} ${x.date.slice(0,4)}</small><strong>${esc(x.title)}</strong><span>${esc(x.body.split('\n')[0].slice(0,140))}${x.body.length>140?'…':''}</span></button>`).join('')}</div>
    <div class="alb-nav"><button class="btn sm" data-a="scrappg" data-k="${pg-1}" ${pg<=0?'disabled':''}>◂ Previous page</button><span>Page ${pg+1} of ${pages}</span><button class="btn sm" data-a="scrappg" data-k="${pg+1}" ${pg>=pages-1?'disabled':''}>Next page ▸</button></div>`:'<p class="muted">Empty for now. Headlines about the club, letters from the chairman, souvenir editions and milestones will be pasted in as they happen.</p>'}</section></div>`;}
function scrapOpen(i){const x=(G.user.scrap||[])[i];if(!x)return;const r=x.ref||{};const m=r.mid&&G.inbox.find(y=>y.id===r.mid);
  if(m&&m.letter){UI.notice={k:'letter',mid:m.id};return;}if(m&&m.wire){UI.notice={k:'wire',mid:m.id};return;}
  const doc=r.doc||(m?{title:m.title,body:m.body,date:m.date,type:m.type,cid:m.cid,pic:m.pic,special:m.special}:{title:x.title,body:x.body,date:x.date,type:'press',cid:U()});UI.paper={docs:[doc],i:0,spin:false};}

function scrapSweep(){const u=G.user;const from=u.scrapId||0;G.inbox.filter(m=>m.id>from).forEach(scrapMsg);u.scrapId=G.iid-1;}
function vRetired(){const L=epilogue();return `<section class="panel narrow retired"><p class="eyebrow">${esc(fmtDate(G.date))}</p><h2 class="h1 big">${esc(G.user.name)} retires</h2>${L.map(l=>`<p>${esc(l)}</p>`).join('')}${managerHall()}<div class="row gap wrap"><button class="btn" data-a="unretire">Actually, one more season</button><button class="btn go" data-a="toTitle">To the title screen</button></div></section>`;}
/* ---------- starting later in the decade: the years before are played out first ---------- */
function simSeason(){const ap=G.autopilot;let guard=0;while(guard++<500){const u=G.user;u.conf=60;if(u.contract)u.contract.until=Math.max(u.contract.until,ap.to);
    const nd=nextDate();if(nd==='9999'){endSeason();return;}let d=G.date;while(d<nd){d=addDays(d,1);dailyTick(d);}
    const b=bestXI(U(),club(U()).form);u.form=club(U()).form;u.xi=b.xi;u.sub=b.sub;u.tac={...(club(U()).tac||DEFTAC)};playDay(nd);}}
function handover(){const u=G.user;const c=club(U());G.autopilot=null;c.m=u.name;
  G.inbox=[];G.paperQ=[];G.talkQ=[];G.letterQ=[];G.wireQ=[];G.radioQ=[];G.ddQ=[];G.dday=null;G.radio=null;G.summary=null;G.jobOffers=null;G.sacked=false;
  Object.assign(u,{career:[],cab:[],trophies:[],souvenirs:[],scrap:[],awards:[],know:{},short:[],injLog:[],conf:60,mrep:null,fever:0,games:0,capt:null,boast:false,modest:false,obj:null,mrel:{},scouting:{on:[],wk:0}});u.scrapId=G.iid-1;
  if(G.recs)delete G.recs[U()];sq(U()).forEach(p=>{if(p.until==null||p.until<=G.year)p.until=G.year+ri(0,2);p.mor=65;});newContract(U(),3);setBudgets();u.bal0=c.bal;u.form=c.form;u.tac={...(c.tac||DEFTAC)};const b=bestXI(U(),u.form);u.xi=b.xi;u.sub=b.sub;
  msg('board',`Welcome to ${c.g}`,`The directors of ${c.n} welcome you as manager for the ${seasonLbl(G.year)} season.\n\n${chairOf(U()).n}: "${chairSay('welcome',U())}"\n\n${boardTarget(expFor(U()),G.divs[c.div].length,c.div)}\n\n${c.n} are in ${DIVN[c.div]}. The club has ${money(c.bal)} in the bank, and the board have set a transfer budget of ${money(u.budget.transfer)}.${G.wageCap?'':' The maximum wage is long gone, so watch the wage bill.'}\n\nHave a look at the Backroom tab, and the Scouting tab: you do not know these players yet.`);
  const last=G.record[G.record.length-1];if(last)msg('press','THE STORY SO FAR',`Last season ${cn(last.champs[0])} were champions and ${cn(last.cup)} won the FA Cup.${last.lc?` ${cn(last.lc)} took the League Cup.`:''} The History tab has every season since 1960.`,null,true);
  objGen();G.lastPaperPop=null;}
function startLater(to){G.autopilot={to};UI.screen='sim';UI.sim={to,from:G.year};render();
  const step=()=>{if(!G.autopilot)return;simSeason();UI.screen='sim';if(G.year>=to){handover();UI.screen='game';UI.tab='inbox';UI.msg=null;save();render();return;}render();setTimeout(step,30);};setTimeout(step,60);}
function vSim(){const S=UI.sim;const n=S.to-S.from;const done=G.year-S.from;return `<section class="panel narrow simbox"><p class="eyebrow">Getting the decade ready</p><h2 class="h1">Playing out ${seasonLbl(G.year)}</h2><div class="simbar" role="progressbar" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${n}"><i style="width:${Math.round(done/n*100)}%"></i></div><p class="muted">Season ${done+1} of ${n}. The transfers, the retirements and the history of the years before you arrive are being played out, so the squads are right when you walk through the door.</p></section>`;}
/* retired players are dropped from the save unless something still needs them: anyone who played for or left one of
   your clubs, the hall of fame, award winners, anyone the save still points at by id, and (until the decade finale)
   the few retired men who could make its team of the decade */
function playerRefs(){const out=new Set();
  const walk=v=>{if(v==null)return;if(typeof v==='number'){if(Number.isInteger(v))out.add(v);return;}
    if(typeof v==='string'){if(v.indexOf('data-id')>=0)v.replace(/data-id="(\d+)"/g,(m,n)=>{out.add(+n);return m;});return;}
    if(typeof v!=='object')return;if(Array.isArray(v)){for(const x of v)walk(x);return;}
    for(const k in v){if(v===G.user&&k==='know')continue;if(/^\d+$/.test(k))out.add(+k);walk(v[k]);}};
  for(const k in G)if(k!=='players')walk(G[k]);return out;}
function pruneOld(){const recs=G.recs||{},mine=new Set([U(),...Object.keys(recs)]);const keep=new Set();
  Object.values(recs).forEach(R=>{Object.keys(R.ap||{}).forEach(id=>keep.add(String(id)));(R.hof||[]).forEach(h=>keep.add(String(h.pid)));});
  const ret=Object.values(G.players).filter(p=>p.ret);
  if(!G.user.finale&&G.year<1970){const c=ret.filter(p=>!p.eu&&p.car&&p.car.a>=60),sc=p=>p.ca*0.6+p.car.a*0.05+p.car.g*0.08;
    ['GK','FB','CH','WH','IF','WG','CF'].forEach(pos=>c.filter(p=>p.pos===pos).sort((a,b)=>sc(b)-sc(a)).slice(0,3).forEach(p=>keep.add(String(p.id))));
    [c.slice().sort((a,b)=>b.car.g-a.car.g)[0],c.slice().sort((a,b)=>b.car.a-a.car.a)[0]].forEach(p=>{if(p)keep.add(String(p.id));});}
  const refs=playerRefs();
  ret.forEach(p=>{if(keep.has(String(p.id))||refs.has(p.id)||(p.awards&&p.awards.length)||(p.hist||[]).some(h=>mine.has(h.to)||mine.has(h.from)))return;
    delete G.players[p.id];if(G.user.know)delete G.user.know[p.id];});SQ=null;}
/* ---------- what a player thinks of his lot ---------- */
/* his standing decides what he feels he is worth: a star wants top money, a lad on the fringes knows his place */
function standing(p){const S=sq(U());const played=G.fx.filter(f=>f.p&&isUserFx(f)&&f.comp!=='F').length;const share=played?p.apps/played:0;const rank=S.slice().sort((a,b)=>b.ca-a.ca).indexOf(p);
  if(rank>-1&&rank<3&&(played<6||share>=0.5))return {k:'star',f:1.15};
  if(age(p)<=23&&p.apps>=8&&avgForm(p)>=6.9)return {k:'rising',f:1.05};
  if(played>=8&&share>=0.5)return {k:'regular',f:1};
  if(played>=10&&share<0.2)return {k:'fringe',f:p.apps?0.8:0.65};
  return {k:'squad',f:0.92};}
function wageRatio(p){const st=standing(p);return p.w/Math.max(1,wageFor(p)*st.f);}
function wageGrievance(p){if(G.wageCap)return false;const st=standing(p);if(st.k==='fringe'||st.k==='squad')return false;return wageRatio(p)<0.88&&(st.k!=='regular'||avgForm(p)>=6.8);}
function moodCalc(p){const why=[];let t=65+3*staffQ('mot');const st=standing(p);
  if(!G.wageCap){const r=wageRatio(p);if(r<0.88&&(st.k==='star'||st.k==='rising'||st.k==='regular')){const d=clamp((1-r)*45,3,14);t-=d;why.push(st.k==='star'?'Feels he should be among the best paid at the club':st.k==='rising'?'Thinks his form deserves a pay rise':'Feels underpaid');}
    else if(r>=1.15){t+=3;why.push('Well paid, and he knows it');}}
  const xi=G.user.xi.includes(p.id);const played=G.fx.filter(f=>f.p&&isUserFx(f)&&f.comp!=='F').length;
  if(xi&&played>=4){t+=3;why.push('Enjoying his football');}
  else if(!xi&&played>=10&&benchCase(p,sq(U()),new Set(G.user.xi))>0){t-=7;why.push('Frustrated at not playing');}
  else if(!xi&&st.k==='fringe'){why.push('Knows his place in the pecking order');}
  if(p.until!=null&&p.until<=G.year&&G.date>=`${G.year+1}-01-01`){t-=3;why.push('Unsettled: his contract is running out');}
  const rel=relOf(p);if(rel>=60){t+=2;why.push('Gets on well with you');}else if(rel<15&&p.apps>=10){t-=2;}
  if(G.user.capt===p.id){t+=3;why.push('Proud to be captain');}
  if(p.inj>20){t-=4;why.push('Fed up with his injury');}
  if(p.listed){t-=4;why.push('Knows he is on the transfer list');}
  return {t:clamp(t,20,92),why};}
function moodWeekly(){sq(U()).forEach(p=>{const m=moodCalc(p);p.moodT=m.t;p.moodWhy=m.why;});}
/* ---------- Pearsey does business on the moors ---------- */
function grouseLine(){return `Pearsey, the Aston Villa chairman, insists on discussing it out on his grouse moor, guns and all. As the first covey gets up he leans over: "I know it's out of season, old boy, but this is just a game. Now, about this fee..."`;}

/* ---------- friendlies only when there is room for them ---------- */
function preSeason(){return !G.fx.some(f=>f.p&&f.comp==='L')&&G.date<firstFixtureDate();}
function cupWeekendFree(){const today=G.fx.filter(f=>f.date===G.date&&f.comp==='FA'&&!f.p);if(!today.length||today.some(isUserFx))return false;
  const mine=G.fx.filter(f=>f.comp==='FA'&&isUserFx(f));return mine.some(f=>f.w&&f.w!==U())||(!mine.length&&G.cup.round>=2&&!G.cup.alive.concat(G.cup.byes).includes(U()));}

/* ---------- spending on the squad ---------- */
const TOURS=[['Holland and Belgium',2000,3500,0,'A fortnight of friendlies against Dutch and Belgian sides, and a canal trip on the day off.'],['Scandinavia',4000,6000,0,'Midnight sun, long runs through the pine forests, and friendlies in front of polite, enormous crowds.'],['South America',12000,9000,1,'Buenos Aires, Montevideo and São Paulo. Hard games, harder tackles, and a reputation for the club on another continent.']];
function tourGo(i){const u=G.user;const [where,cost,gate,rep,desc]=TOURS[i];const c=club(U());const net=Math.round((gate-cost)*infl());
  c.bal+=net;u.fin.friend+=net;u.tourY=G.year;u.spirit=5;sq(U()).forEach(p=>{p.fit=100;p.mor=clamp(p.mor+5,5,100);});if(rep)c.rep=Math.min(95,c.rep+1);
  let inj='';if(i===2&&rand()<0.4){const p=pick(sq(U()).filter(q=>!q.inj));if(p){p.inj=ri(7,25);hurt(p,p.inj,'in a bruising tour match');inj=` ${p.n} came home injured.`;}}
  msg('press',`${c.s.toUpperCase()} OFF TO ${where.toUpperCase()}`,`${c.n} have set off on a pre-season tour of ${where}. ${desc} The club expects to ${net>=0?`clear ${money(net)}`:`lose ${money(-net)}`} on the trip.${inj}`,null,U());
  return `${where}: the squad comes home fit, happy and together.${inj}`;}
const WINB=[0,5,10,20];
function winBonusPay(){const u=G.user;const lvl=u.winb||0;if(!lvl||G.wageCap)return;const amt=Math.round(WINB[lvl]*13*infl());club(U()).bal-=amt;u.fin.wages+=amt;sq(U()).forEach(p=>{if(G.user.xi.includes(p.id))p.mor=clamp(p.mor+lvl,5,100);});}
function loyaltyPay(){const u=G.user;const R=REC(U());const who=sq(U()).filter(p=>R.yrs[p.id]&&G.year-R.yrs[p.id][0]>=3);if(!who.length)return 'Nobody has been here three seasons yet.';
  const amt=Math.round(who.length*100*infl());const c=club(U());if(c.bal<amt){toast(`${noFunds()} <span>The loyalty bonuses would cost ${money(amt)}.</span>`);return '';}
  c.bal-=amt;u.fin.wages+=amt;u.loyY=G.year;who.forEach(p=>{p.mor=clamp(p.mor+6,5,100);relAdj(p,3);});return `${who.length} long-serving players receive a loyalty bonus of ${money(100*infl())} each.`;}
function charityMatch(){const u=G.user;const c=club(U());u.charY=G.year;c.rep=Math.min(95,c.rep+1);bumpConf(2);c.fans=clamp(fans()+2,0,100);sq(U()).slice().sort((a,b)=>b.ca-a.ca).slice(0,12).forEach(p=>p.fit=Math.max(50,p.fit-5));
  const cause=pick(['the local hospital\'s new children\'s ward','the Aberfan disaster fund','a widows\' and orphans\' fund for the colliery','the St John Ambulance brigade','a new minibus for the old people\'s home']);const att=Math.round(attendance({h:U(),a:U(),comp:'L'},true)*0.6/10)*10;
  msg('press',`${c.s.toUpperCase()} PLAY FOR CHARITY`,`${att.toLocaleString('en-GB')} people turned out on a Sunday afternoon to watch ${c.n} play a charity match, with every penny going to ${cause}. The players signed autographs for an hour afterwards.`,null,U());
  return 'A charity match on Sunday afternoon: the town thinks the world of the club this week.';}
const AMBASSADORS=['Tom Finney','Nat Lofthouse','Billy Wright','Stanley Matthews','Stan Mortensen','Wilf Mannion','Tommy Lawton','Raich Carter','Jackie Milburn','Stan Cullis','Joe Mercer','Frank Swift'];
function ambassadorName(){const c=club(U());if(!c.amb){const R=REC(U());const hof=(R.hof||[])[0];c.amb=hof?hof.n:pick(AMBASSADORS.filter(n=>!(n==='Stanley Matthews'&&G.year<1965)));}return c.amb;}
const UPG_CLUB={
 coach:{n:'Luxury team coach',cost:7000,wk:3,cat:'club',inc:-12,from:1960,desc:'Reclining seats, a card table and a kettle. The players arrive for away games fresher.'},
 houses:{n:'Club houses for new signings',cost:20000,wk:8,cat:'club',from:1960,desc:'A row of club houses near the ground. Players are keener to sign, and ask for a little less.'},
 schools:{n:'Schools coaching scheme',cost:4000,wk:3,cat:'club',inc:-10,from:1960,desc:'Your coaches run sessions in the local schools. Better lads at the trial day, and more schoolboys come your way.'},
 reserves:{n:'Reserve team coach',cost:6000,wk:3,cat:'club',inc:-18,from:1960,desc:'A proper coach for the second string. Young players in the reserves come on faster.'},
 doctor:{n:'Club doctor on retainer',cost:1500,wk:1,cat:'club',inc:-15,from:1960,desc:'A doctor on call every day, not just on match days. Long injuries heal quicker.'},
 magazine:{n:'Glossy club magazine',cost:5000,wk:4,cat:'club',inc:70,from:1962,desc:'A monthly magazine with colour photographs. Money every week, and the supporters feel closer to the club.'},
 friends:{n:'"Friends of the Club" society',cost:2000,wk:3,cat:'club',inc:40,from:1960,desc:'Dinners, raffles and a dance every Christmas for the local great and good. A little money, and the board like it.'},
 freehold:{n:'Buy the ground from the council',cost:120000,wk:12,cat:'club',rep:1,from:1962,desc:'Own the freehold, instead of renting from the corporation. Running costs fall by about 15%, for good.'},
 welfare:{n:'Player welfare officer',cost:1000,wk:1,cat:'club',inc:-14,from:1964,desc:'Somebody to find the lads digs, sort out their bank accounts and keep them out of trouble. Fewer discipline problems, and new signings settle quicker.'},
 ambassador:{n:'A club ambassador',cost:5000,wk:1,cat:'club',inc:-25,rep:1,from:1960,desc:'A famous old player on the payroll, to shake hands with sponsors and turn up at the supporters\' club. The club\'s standing rises, and players like the idea of joining.'},
 tr_lights:{n:'Floodlit training pitch',cost:10000,wk:5,cat:'train',from:1961,desc:'Proper sessions on winter evenings. Players under 26 develop a little faster.'},
 fences:{n:'Segregation fences',cost:8000,wk:4,from:1967,desc:'Fences and a police pen to keep rival supporters apart. Less trouble at home matches.'}};
Object.assign(UPG,UPG_CLUB);

/* ---------- a little trouble on the terraces, late in the decade ---------- */
function crowdTrouble(fx){if(G.year<1965||fx.comp==='F')return;const me=U();const opp=fx.h===me?fx.a:fx.h;const derby=isDerby(me,opp);const big=club(opp).rep>=70;
  let ch=(derby?0.07:big?0.025:0.01)*(G.year>=1967?1.3:1);if(fx.h===me&&upgDone('fences'))ch*=0.4;if(rand()>ch)return;const home=fx.h===me;const c=club(me);
  const fine=home&&rand()<0.35?Math.round(300*infl()):0;if(fine){c.bal-=fine;G.user.fin.other-=fine;}
  msg('press',pick([`TROUBLE AT ${club(fx.h).g.toUpperCase()}`,'FANS CLASH AFTER THE GAME','POLICE BUSY AS RIVALS MEET']),`There were scuffles between rival supporters ${home?`outside ${c.g}`:`at ${club(fx.h).g}`} after ${cn(fx.h)} v ${cn(fx.a)}. ${pick(['Several arrests were made.','A shop window was broken on the way to the station.','Mounted police cleared the road.'])}${fine?` The club has been fined ${money(fine)} by the FA.`:''}`,null,true);}

/* ---------- television and the real world, with a little effect on the game ---------- */
const TVFEE=[[0,0,0,0],[20,0,0,0],[30,8,0,0],[45,12,4,0]];
const tvFee=cid=>{const c=club(cid);const t=G.tv||0;return c&&c.div>=0?(TVFEE[t][c.div]||0)*infl():0;};
const MARKERS=[{d:'1965-02-06',t:'news',h:'SIR STANLEY SAYS GOODBYE',b:'Sir Stanley Matthews plays his last First Division match at the age of 50. Stoke win, the crowd sings, and the game loses the greatest winger it has known.'},
 {d:'1966-07-11',t:'news',h:'THE WORLD CUP KICKS OFF AT WEMBLEY',b:'The Queen opens the World Cup at Wembley. England draw 0-0 with Uruguay. Alf Ramsey still insists England will win it.'},
 {d:'1966-08-27',t:'news',h:'THE WORLD CUP EFFECT',b:'Crowds are up across the Football League after England\'s triumph. Clubs report queues at the turnstiles that have not been seen since the Fifties.',k:'wcfx'},
 {d:'1968-08-03',t:'news',h:'THE BIG MATCH',b:'London Weekend Television launches The Big Match, with Brian Moore in the chair. There is now football on ITV on a Sunday afternoon, and more television money for the League.',k:'tv3'},
 {d:'1970-06-14',t:'news',h:'ENGLAND OUT IN LEÓN',b:'England lead West Germany 2-0 and lose 3-2 after extra time. Peter Bonetti, standing in for the sick Gordon Banks, has a day he will never forget.'},
 {d:'1970-06-21',t:'news',h:'BRAZIL KEEP THE JULES RIMET',b:'Pelé, Jairzinho, Gérson and Carlos Alberto beat Italy 4-1 in Mexico City. Brazil win the World Cup for the third time and keep the trophy for good.'}];
MARKERS.forEach(e=>{if(!DATA.hist.some(x=>x.h===e.h))DATA.hist.push(e);});

/* ---------- achievements, listed in the Office. A fourth value of true keeps one secret until it is earned. ---------- */
const WC66=['Gordon Banks','George Cohen','Ray Wilson','Bobby Moore','Jack Charlton','Nobby Stiles','Alan Ball','Roger Hunt','Bobby Charlton','Geoff Hurst','Martin Peters'];
const ACHIEVEMENTS=[
 ['div1','Champions of England','Win the First Division'],['div2','Second to none','Win the Second Division'],['div3','Top of the Third','Win the Third Division'],['div4','Kings of the Fourth','Win the Fourth Division'],
 ['facup','Cup Final day','Win the FA Cup'],['lcup','The new cup','Win the League Cup'],['europe','Champions of Europe','Win the European Cup'],['cwc','Across the Channel',"Win the Cup Winners' Cup"],['fairs','A fair result','Win the Inter-Cities Fairs Cup'],
 ['fullset','The full set','Win the League, the FA Cup, the League Cup and all three European trophies'],
 ['double','The Double','Win the League and the FA Cup in the same season'],['treble','A domestic treble','Win the League, the FA Cup and the League Cup in one season'],['eurotreble','A European treble','Win two domestic trophies and a European trophy in the same season'],
 ['basement','From the basement','Win the League with a club that started your career in the Fourth Division'],
 ['fortress','Fortress','Go a whole League season unbeaten at home'],['invincible','Invincible','Go a whole League season unbeaten'],['giantkiller','Giant-killer','Knock a First Division side out of the FA Cup with a Fourth Division club'],
 ['clean','Keep it tight','Keep 20 clean sheets in a League season'],['goals100','A hundred up','Score 100 League goals in a season'],
 ['loyal','One-club man','Manage the same club for the whole decade'],['journey','Have boots, will travel','Manage in all four divisions'],['youth','Our lads','Win a trophy with seven or more players aged 21 or under in the final eleven'],
 ['nobuy','Home-grown','Win promotion without paying a transfer fee all season'],['record','Record breaker','Break the British transfer record'],['sold','Top dollar','Sell a player abroad for more than £100,000'],
 ['freeze','Frozen out','Play in the Big Freeze of 1963'],['wc66','Our boys','Have three of your players in the 1966 World Cup winning side'],['pearsey','Splendid, dear boy','Earn Pearsey\'s highest praise at Aston Villa',true],
 ['unbecoming','Most unbecoming','Be told off by Pearsey three times in one season',true],['bbc','On the wireless','Give ten BBC interviews'],['scrapbook','Full scrapbook','Fill 100 cuttings in the scrapbook'],
 ['monthly','Whisky cabinet','Win Manager of the Month five times'],['comeback','Great escape','Avoid relegation after being bottom at Christmas'],['holdout','Hard bargain','Hold out for more and get a final offer 50% above the first bid'],
 ['deadline','Four minutes to spare','Sign a player on deadline day'],['captain','Born leader','Keep the same captain for five seasons'],['decade','Man of the Sixties','Manage every season from 1960-61 to 1969-70'],
 ['tv','Match of the Day','Win a First Division match by three clear goals in 1964-65, the first season of Match of the Day'],['wembley3','Wembley regulars','Reach three Wembley finals'],['saved','Saved by the bell','Survive a vote of no confidence (board confidence below 10) and finish the season']];
const ACHK=Object.fromEntries(ACHIEVEMENTS.map(a=>[a[0],a]));
function achGive(k){if(!G||G.autopilot||!ACHK[k])return;const u=G.user;u.ach=u.ach||{};if(u.ach[k])return;u.ach[k]={d:G.date,c:U()};const a=ACHK[k];
  msg('club',`Achievement: ${a[1]}`,`${a[2]}.\n\nIt has gone in the cabinet. Every achievement is listed in the Office.`);toast(`<strong>Achievement: ${esc(a[1])}</strong> <span>${esc(a[2])}.</span>`);}
/* everything that can be read straight from the save; runs before every save */
function achScan(){const u=G.user;if(!u||!G.clubs[u.club])return;u.ach=u.ach||{};const me=U(),c=club(me),y=G.year,cab=u.cab||[],has=f=>cab.some(f);
  if(!u.ach0)u.ach0=u.career&&u.career[0]?{club:u.career[0].club,div:u.career[0].div}:{club:me,div:c.div};
  if(u.achClub!==me){const held=(u.career||[]).length&&u.career[u.career.length-1].club===me;u.achClub=me;u.achJoin=held?'1900-01-01':G.date;}
  ['div1','div2','div3','div4'].forEach((k,d)=>{if(has(t=>t.k==='league'&&t.div===d))achGive(k);});
  if(has(t=>t.k==='cup'))achGive('facup');if(has(t=>t.k==='lc'))achGive('lcup');
  [['EC','europe'],['CWC','cwc'],['FC','fairs']].forEach(([cp,k])=>{if(has(t=>t.k==='eu'&&t.comp===cp))achGive(k);});
  if(['div1','facup','lcup','europe','cwc','fairs'].every(k=>u.ach[k]))achGive('fullset');
  const byS={};cab.forEach(t=>{if(t.k!=='motm')(byS[t.y+'|'+t.club]=byS[t.y+'|'+t.club]||[]).push(t);});
  Object.values(byS).forEach(L=>{const lg=L.some(t=>t.k==='league'&&t.div===0),fa=L.some(t=>t.k==='cup'),lc=L.some(t=>t.k==='lc'),eu=L.some(t=>t.k==='eu'),dom=L.filter(t=>t.k!=='eu').length;
    if(lg&&fa)achGive('double');if(lg&&fa&&lc)achGive('treble');if(dom>=2&&eu)achGive('eurotreble');});
  if(u.ach0.div===3&&has(t=>t.k==='league'&&t.div===0&&t.club===u.ach0.club))achGive('basement');
  if(cab.filter(t=>t.k==='motm').length>=5)achGive('monthly');
  if(u.achCab==null)u.achCab=cab.length;
  for(;u.achCab<cab.length;u.achCab++){if(cab[u.achCab].k!=='motm'&&(u.xi||[]).filter(id=>{const p=G.players[id];return p&&age(p)<=21;}).length>=7)achGive('youth');}
  if((u.scrap||[]).length>=100)achGive('scrapbook');if((u.bbc||0)>=10)achGive('bbc');
  if(new Set((u.career||[]).map(e=>e.div).concat(c.div)).size>=4)achGive('journey');
  if(u.capt){if(!u.captSince||u.captSince.id!==u.capt)u.captSince={id:u.capt,y};else if(y-u.captSince.y>=5)achGive('captain');}else u.captSince=null;
  if(u.conf<10)u.lowConfY=y;
  if(G.date.slice(0,4)===String(y)&&G.date.slice(5)>='12-25'&&u.xmasY!==y){u.xmasY=y;const t=table(c.div);u.xmasBot=t.length&&t[t.length-1].id===me?me:null;}
  const mine=f=>f.p&&(f.h===me||f.a===me);
  if(y===1962&&!u.ach.freeze&&G.fx.some(f=>mine(f)&&f.date>='1962-12-22'&&f.date<='1963-03-09'))achGive('freeze');
  if(y===1964&&!u.ach.tv&&G.fx.some(f=>f.comp==='L'&&f.div===0&&mine(f)&&(f.h===me?f.hg-f.ag:f.ag-f.hg)>=3))achGive('tv');
  if(c.div===3&&!u.ach.giantkiller&&G.fx.some(f=>f.comp==='FA'&&f.w===me&&mine(f)&&(G.clubs[f.h===me?f.a:f.h]||{}).div===0))achGive('giantkiller');}
/* the season's League record, Christmas, the board and Wembley: checked once the season is over */
function achSeason(o){if(G.autopilot)return;const u=G.user;achScan();const {y,me,ud,upos,promoted,relegated,ended,T}=o;
  const L=G.fx.filter(f=>f.comp==='L'&&f.p&&(f.h===me||f.a===me));const whole=L.length&&(u.achJoin||'9999')<=L.reduce((m,f)=>f.date<m?f.date:m,'9999');
  if(whole){const R=L.map(f=>f.h===me?[f.hg,f.ag,1]:[f.ag,f.hg,0]);
    if(!R.some(r=>r[2]&&r[0]<r[1]))achGive('fortress');if(!R.some(r=>r[0]<r[1]))achGive('invincible');
    if(R.filter(r=>r[1]===0).length>=20)achGive('clean');if(R.reduce((t,r)=>t+r[0],0)>=100)achGive('goals100');
    if(promoted&&!(u.fin.buys>0))achGive('nobuy');}
  if(u.xmasY===y&&u.xmasBot===me&&(ud<3?!relegated:upos<=T[ud].length-4))achGive('comeback');
  if(u.lowConfY===y&&u.conf>=15&&!ended)achGive('saved');
  const fin=r=>r==='Winners'||r==='Lost in the Final';let w=0;
  if(fin(cupReached(me)))w++;if(y>=1966&&G.lc&&fin(lcReached(me)))w++;
  const e=G.eu&&G.eu.entries.find(x=>x.cid===me);if(e&&(e.won||e.out===4)&&/Wembley/.test((EUVENUE[e.comp]||{})[y+1]||''))w++;
  if(w){u.wemb=(u.wemb||0)+w;if(u.wemb>=3)achGive('wembley3');}
  if(y===1969){const C=(u.career||[]).filter(x=>x.y>=1960&&x.y<=1969);if(new Set(C.map(x=>x.y)).size===10){achGive('decade');if(new Set(C.map(x=>x.club)).size===1)achGive('loyal');}}}
function achPearsey(kind){const u=G.user;if(kind==='good'){achGive('pearsey');return;}
  if(u.pBadY!==G.year){u.pBadY=G.year;u.pBad=0;}if(++u.pBad>=3)achGive('unbecoming');}
const medal=on=>`<svg viewBox="0 0 32 40" class="medal" aria-hidden="true"><path d="M9 0h6l3 14h-6zM17 0h6l-3 14h-6z" fill="${on?'#c42b1c':'#8a8576'}"/><circle cx="16" cy="25" r="11" fill="${on?'#d4a020':'#b8b3a3'}" stroke="${on?'#8a6410':'#8a8576'}" stroke-width="2"/><path d="M16 18l2 4.3 4.7.5-3.5 3.2 1 4.6L16 28.3l-4.2 2.3 1-4.6-3.5-3.2 4.7-.5z" fill="${on?'#fff3c4':'#d9d5c8'}"/></svg>`;
function achHTML(){const got=G.user.ach||{};const n=ACHIEVEMENTS.filter(a=>got[a[0]]).length;
  return `<h3 class="h2">Achievements</h3><p class="muted sm">${n} of ${ACHIEVEMENTS.length} earned. The secret ones show their names once you have them.</p><ul class="achs">${ACHIEVEMENTS.map(([k,t,d,secret])=>{const g=got[k];
    return g?`<li class="ach on">${medal(true)}<div><b>${esc(t)}</b><span>${esc(d)}.</span><small>${fmtDate(g.d,true)} ${g.d.slice(0,4)}, ${esc(cn(g.c))}</small></div></li>`
     :`<li class="ach">${medal(false)}<div><b>${secret?'A secret':esc(t)}</b><span>${secret?'Keep managing and you may find out.':esc(d)+'.'}</span></div></li>`;}).join('')}</ul>`;}

let MEETN=0;
/* ---------- deadline-day meetings, drawn like the portraits: inked, cel-shaded, halftoned ---------- */
/* the manager (you), and the managers on the other end of the telephone */
const slickHair=(c,c2,c3)=>`<path d="M80 98 C74 56 100 38 124 38 C150 38 168 58 162 98 C156 76 142 64 120 64 C104 64 94 70 88 78 C84 84 82 90 80 98Z" fill="${c}" ${SW(3)}/><path d="M98 52 Q122 40 152 52" fill="none" stroke="${c3}" stroke-width="3" stroke-linecap="round"/><path d="M108 42 L102 66" stroke="${c3}" stroke-width="2.4"/><path d="M150 56 C158 66 162 80 162 96 L156 84 C156 74 154 64 150 56Z" fill="${c2}"/>`;
LOOKS.you={id:'you',skin:SKIN.light,hair:['#4a3324','#2a1c12','#7a5a40'],iris:'#4a6a8a',bg:'#2d3a52',bg2:'#1f2a3e',face:'square',browW:2,browC:'#3b2a1d',mouth:'plain',
 hairFront:slickHair('#4a3324','#2a1c12','#7a5a40'),
 body:`<path d="M14 300 C16 232 54 202 98 192 L142 192 C186 202 224 232 226 300Z" fill="#b08a5a" ${SW(3.6)}/><path d="M168 210 C196 228 214 256 222 300 L186 300 C182 266 176 236 168 210Z" fill="#8a6a3e"/>
  <path d="M98 192 L72 214 L96 236 L86 248 L112 300 L120 252Z" fill="#c9a26e" ${SW(2.6)}/><path d="M142 192 L168 214 L144 236 L154 248 L128 300 L120 252Z" fill="#a8844f" ${SW(2.6)}/>
  <path d="M100 196 L120 250 L140 196Z" fill="#f3efe6" ${SW(2.2)}/><path d="M114 204 L126 204 L128 214 L124 262 L120 268 L116 262 L112 214Z" fill="#1f3a6e" ${SW(2)}/><path d="M113 204 L127 204 L124 214 L116 214Z" fill="#1f3a6e" ${SW(2)}/>
  <path d="M60 250 L66 290 M180 250 L174 290" stroke="#8a6a3e" stroke-width="2.4"/>`,
 collar:`<path d="M98 188 L108 210 L120 198 L132 210 L142 188 L138 182 L102 182Z" fill="#f3efe6" ${SW(2.4)}/>`};
const youCap={...LOOKS.you,id:'yoc',front:flatCap('#6b6a4a','#4f4e34','yoc',8)};
LOOKS.mgrA={id:'mga',skin:SKIN.ruddy,hair:['#2a2420','#151210','#5a4f45'],iris:'#4a5a3a',bg:'#7a1a1a',bg2:'#5a1010',face:'square',browW:2.6,browC:'#2a2420',mouth:'plain',blush:'#d86a56',
 hairFront:`<path d="M82 86 C84 56 104 46 124 46 C146 46 158 58 158 84 C150 70 140 64 124 64 C108 64 96 70 82 86Z" fill="#2a2420" ${SW(2.6)}/>`,
 body:`<path d="M18 300 C20 236 56 206 100 196 L140 196 C184 206 220 236 222 300Z" fill="#b8202a" ${SW(3.6)}/><path d="M166 214 C192 230 210 256 216 300 L182 300 C178 266 172 238 166 214Z" fill="#8a1820"/><path d="M118 196 L118 300 M122 196 L122 300" stroke="#f3efe6" stroke-width="3"/><path d="M40 236 L40 300 M200 236 L200 300" stroke="#f3efe6" stroke-width="4"/>`,
 collar:`<path d="M96 186 Q120 206 144 186 L146 200 Q120 216 94 200Z" fill="#b8202a" ${SW(2.6)}/>`};
LOOKS.mgrB={id:'mgb',skin:SKIN.fair,hair:['#8a857c','#5f5c57'],iris:'#4a6a8a',bg:'#3a4a2a',bg2:'#2a3a1e',face:'normal',browW:2.2,browC:'#6b675f',mouth:'smirk',
 hairBack:`<path d="M78 112 C74 92 76 80 82 74 L86 114Z M162 112 C166 92 164 80 158 74 L154 114Z" fill="#8a857c" ${SW(2.4)}/>`,
 faceExtra:`<path d="M94 58 Q112 50 132 54" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45"/>`,
 body:`<path d="M10 300 C12 228 52 198 98 190 L142 190 C188 198 228 228 230 300Z" fill="#7a5a3a" ${SW(3.6)}/><path d="M22 300 C26 250 52 222 84 210 L96 300Z M218 300 C214 250 188 222 156 210 L144 300Z" fill="#f1e6cf" ${SW(2.6)}/>${[0,1,2,3,4,5].map(i=>`<path d="M${28+i*8} ${250+i*8} q4 -3 8 0" fill="none" stroke="#c9b48f" stroke-width="2"/>`).join('')}<path d="M100 196 L120 246 L140 196Z" fill="#f3efe6" ${SW(2.2)}/><path d="M115 204 L125 204 L126 250 L120 256 L114 250Z" fill="#3f5a2a" ${SW(1.8)}/>`};
LOOKS.mgrC={id:'mgc',skin:SKIN.warm,hair:['#1c1a18','#0c0b0a','#4a4640'],iris:'#3a2a1a',bg:'#2a3a5a',bg2:'#1c2a44',face:'round',browW:2,browC:'#1c1a18',mouth:'open',
 hairFront:slickHair('#1c1a18','#0c0b0a','#4a4640'),body:suitBody('#30343c','#1f2228','#f3efe6','#8a1f1f')};
const MGRLOOKS=['mgrA','mgrB','mgrC'];
const mgrLook=cid=>LOOKS[MGRLOOKS[hashStr((club(cid)||{}).m||cid)%3]];
/* a portrait figure placed in a scene */
function sceneFig(o,x,y,s,flip){const p=portrait({...o,noPanel:true}).replace('<svg class="reporter" viewBox="0 0 240 300" aria-hidden="true">',`<svg x="0" y="0" width="240" height="300" viewBox="0 0 240 300" overflow="visible">`);
  return `<g transform="translate(${flip?x+240*s:x} ${y}) scale(${flip?-s:s} ${s})">${p}</g>`;}
const HTP=id=>`<pattern id="mh-${id}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3.5" cy="3.5" r="1.5" fill="${K}" opacity=".28"/></pattern>`;
const ink=w=>SW(w||3);
const hi=(d,w)=>`<path d="${d}" fill="none" stroke="#fff" stroke-width="${w||4}" stroke-linecap="round" opacity=".28"/>`;
const smk=(x,y,s)=>`<path d="M${x} ${y} c-12 -16 6 -26 -2 -40 c-8 -14 10 -22 2 -36" fill="none" stroke="#f3efe6" stroke-width="${8*s}" stroke-linecap="round" opacity=".22"/><path d="M${x} ${y} c-12 -16 6 -26 -2 -40 c-8 -14 10 -22 2 -36" fill="none" stroke="#f3efe6" stroke-width="${3*s}" stroke-linecap="round" opacity=".35"/>`;
const tumbler=(x,y)=>`<path d="M${x} ${y} L${x+3} ${y+22} L${x+19} ${y+22} L${x+22} ${y}Z" fill="#d9e6ec" ${ink(2.4)}/><path d="M${x+2} ${y+10} L${x+4} ${y+20} L${x+18} ${y+20} L${x+20} ${y+10}Z" fill="#d9952a"/>${hi(`M${x+5} ${y+3} L${x+6} ${y+18}`,2.4)}`;
const cup=(x,y)=>`<path d="M${x} ${y} L${x+3} ${y+16} Q${x+11} ${y+20} ${x+19} ${y+16} L${x+22} ${y}Z" fill="#f3efe6" ${ink(2.4)}/><path d="M${x+22} ${y+4} q8 1 6 7 q-2 4 -7 3" fill="none" ${ink(2.2)}/><ellipse cx="${x+11}" cy="${y+1}" rx="11" ry="3" fill="#8a5a2a" ${ink(1.6)}/><path d="M${x-6} ${y+18} Q${x+11} ${y+26} ${x+28} ${y+18}" fill="#e8e2d0" ${ink(2)}/>`;
function meetBG(kind,id){switch(kind){
 case 'moor':return `<rect width="480" height="300" fill="#9cc3dd"/><path d="M0 60 L480 20 L480 0 L0 0Z" fill="#b8d4e6"/>
  <path d="M0 132 Q70 96 150 118 Q230 82 320 112 Q400 84 480 104 L480 300 L0 300Z" fill="#7a6a96" ${ink(3)}/><path d="M300 112 Q400 84 480 104 L480 150 Q400 130 320 140Z" fill="#5f5280"/>
  <path d="M0 170 Q100 140 220 162 Q340 136 480 158 L480 300 L0 300Z" fill="#8e3f6a" ${ink(3)}/>${hi('M30 168 Q120 146 210 164',5)}
  ${[...Array(44)].map((_,i)=>{const x=(i*53)%480,y=176+((i*37)%110),r=8+(i%3)*4;return `<path d="M${x-r} ${y} q${r} -${r*1.4} ${2*r} 0Z" fill="${i%2?'#a64f80':'#6e2f52'}" ${ink(1.6)}/>`;}).join('')}
  
  ${[[250,56],[284,40],[312,62],[340,36],[372,54],[228,72]].map(([x,y])=>`<g transform="translate(${x} ${y})"><path d="M-12 0 Q0 -8 12 0 Q4 6 -12 0Z" fill="#7a4a24" ${ink(2)}/><path d="M-4 -2 L-18 -16 L-6 -6 M4 -2 L16 -18 L6 -6" fill="#5a3418" ${ink(1.8)}/><circle cx="10" cy="-1" r="2" fill="#c8202f"/></g>`).join('')}
  <path d="M410 150 L418 112" stroke="#e8e2d0" stroke-width="4"/><path d="M418 112 L438 118 L420 126Z" fill="#f3efe6" ${ink(1.8)}/>`;
 case 'snooker':return `<rect width="480" height="300" fill="#4a3022"/><path d="M0 0 L480 0 L480 300 L300 300Z" fill="#3a2418"/>${[0,1,2,3,4,5].map(i=>`<rect x="${i*80}" y="40" width="80" height="120" fill="none" ${ink(2)} opacity=".55"/>`).join('')}
  <rect x="150" y="10" width="180" height="30" fill="#2a3a2a" ${ink(2.6)}/><text x="240" y="31" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="14" fill="#e8d9a8">CONSERVATIVE CLUB</text>
  <path d="M240 40 L240 56" stroke="${K}" stroke-width="3"/><path d="M180 56 L300 56 L326 82 L154 82Z" fill="#1f6a3a" ${ink(3)}/><path d="M180 56 L300 56 L306 64 L174 64Z" fill="#2f8a4a"/><path d="M154 82 L326 82 L420 300 L60 300Z" fill="#f2e3a0" opacity=".14"/>
  ${smk(200,170,1.2)}${smk(290,150,1)}${smk(120,120,0.8)}`;
 case 'hotel':return `<rect width="480" height="300" fill="#6e2e2e"/>${[...Array(48)].map((_,i)=>`<path d="M${(i%8)*62+20} ${Math.floor(i/8)*50+10} q8 -12 16 0 q-8 12 -16 0Z" fill="#5a2424"/>`).join('')}<path d="M0 0 L200 0 L0 220Z" fill="#7e3a3a" opacity=".5"/>
  <rect x="196" y="60" width="96" height="120" fill="#3b2a1d" ${ink(3)}/>${[0,1,2,3].map(i=>`<path d="M${204+i*22} 100 L${204+i*22} 78 Q${210+i*22} 70 ${216+i*22} 78 L${216+i*22} 100Z" fill="${['#c8a24a','#6b8a3a','#a8402a','#e8d9a8','#3a5a8a','#c8a24a','#8a3a6a'][i]}" ${ink(1.8)}/>`).join('')}<rect x="196" y="100" width="96" height="8" fill="#6b4a2c" ${ink(2)}/><rect x="196" y="140" width="96" height="8" fill="#6b4a2c" ${ink(2)}/>
  <rect x="150" y="10" width="180" height="30" fill="#3b2a1d" ${ink(2.6)}/><text x="240" y="31" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="14" fill="#f2c14e">MIDLAND HOTEL</text>`;
 case 'station':return `<rect width="480" height="300" fill="#e8dfc4"/>${[...Array(60)].map((_,i)=>`<rect x="${(i%12)*40}" y="${Math.floor(i/12)*30+150}" width="40" height="30" fill="none" stroke="#c9bf9f" stroke-width="2"/>`).join('')}<rect x="0" y="0" width="480" height="24" fill="#2f4a3a" ${ink(2)}/>
  <rect x="150" y="56" width="180" height="76" fill="#a8c0d0" ${ink(3.4)}/><path d="M150 96 L330 96" stroke="${K}" stroke-width="3"/><rect x="160" y="70" width="160" height="26" fill="#2f4a3a" ${ink(2)}/>${[0,1,2,3].map(i=>`<rect x="${170+i*38}" y="75" width="22" height="13" fill="#f2e3a0" ${ink(1.4)}/>`).join('')}${smk(180,70,1)}
  <circle cx="240" cy="168" r="22" fill="#f3efe6" ${ink(3.4)}/><path d="M240 168 L240 152 M240 168 L251 172" stroke="${K}" stroke-width="3" stroke-linecap="round"/>
  <rect x="160" y="28" width="160" height="22" fill="#2f4a3a" ${ink(2.4)}/><text x="240" y="43" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="10" fill="#f2e3a0">CREWE · REFRESHMENTS</text>`;
 case 'layby':return `<rect width="480" height="300" fill="#4f5f70"/>${[...Array(60)].map((_,i)=>`<path d="M${(i*37)%480} ${(i*29)%300} l-5 16" stroke="#c9d3dc" stroke-width="2" opacity=".55"/>`).join('')}
  <path d="M0 190 L480 176 L480 300 L0 300Z" fill="#3b3f42"/><path d="M0 214 L480 200" stroke="#e8e2d0" stroke-width="4" stroke-dasharray="28 18"/><rect x="380" y="110" width="50" height="34" fill="#1f4fb0" ${ink(2.6)}/><text x="405" y="134" text-anchor="middle" font-family="Arial" font-weight="900" font-size="18" fill="#f3efe6">A6</text><path d="M405 144 L405 190" stroke="${K}" stroke-width="4"/>`;
 case 'cafe':return `<rect width="480" height="300" fill="#ecdcae"/><rect x="20" y="48" width="440" height="150" fill="#b9cbd6" ${ink(3.4)}/><rect x="20" y="48" width="440" height="150" fill="#fff" opacity=".25"/><path d="M80 166 L94 46 M128 166 L120 56" stroke="#5a6a7a" stroke-width="4"/><path d="M220 166 L236 34 L252 166" fill="none" stroke="#4a4f58" stroke-width="4"/><rect x="220" y="24" width="34" height="16" fill="#f3efe6" ${ink(1.6)}/>
  <rect x="150" y="10" width="180" height="30" fill="#c8202f" ${ink(2.6)}/><text x="240" y="31" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="14" fill="#fff6e6">CAFÉ · TEAS · SNACKS</text><rect x="196" y="58" width="88" height="96" fill="#2a2a2a" ${ink(3)}/>${['EGG+CHIPS 2/-','PIE+PEAS 1/9','BUTTY 1/-','TEA 4d'].map((t,i)=>`<text x="240" y="${80+i*19}" text-anchor="middle" font-family="Courier New" font-weight="700" font-size="10" fill="#f3efe6">${esc(t)}</text>`).join('')}`;
 case 'committee':return `<rect width="480" height="300" fill="#8a6a42"/>${[0,1,2,3,4,5,6,7].map(i=>`<rect x="${i*60}" y="0" width="60" height="300" fill="${i%2?'#7e6038':'#8a6a42'}"/><path d="M${i*60} 0 L${i*60} 300" stroke="${K}" stroke-width="1.6" opacity=".5"/>`).join('')}
  <rect x="150" y="20" width="180" height="104" fill="#3b2a1d" ${ink(3)}/><text x="240" y="44" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="12" fill="#f2c14e">CLUB PRESIDENTS</text>${[0,1,2,3].map(i=>`<path d="M174 ${60+i*16} L306 ${60+i*16}" stroke="#d9a52e" stroke-width="2.4" stroke-dasharray="${30+i*6} 8"/>`).join('')}
  <rect x="380" y="30" width="80" height="110" fill="#5b3b22" ${ink(3)}/><rect x="388" y="38" width="64" height="94" fill="#b9cbd6" opacity=".55"/><path d="M408 120 Q406 82 420 76 Q434 82 432 120Z" fill="#d8dde0" ${ink(2)}/>
  ${[0,1,2,3].map(i=>`<g transform="translate(${18+i*4} ${210-i*30})"><path d="M8 0 L8 -34" stroke="#5b3b22" stroke-width="6"/><rect x="4" y="-3" width="46" height="7" fill="#9a7a4a" ${ink(2)}/><path d="M10 4 L8 24 M46 4 L48 24" stroke="${K}" stroke-width="2.4"/></g>`).join('')}`;
 case 'golf':return `<rect width="480" height="300" fill="#5b3b22"/><path d="M0 0 L240 0 L0 260Z" fill="#6b4a2c" opacity=".6"/><rect x="120" y="24" width="240" height="120" fill="#a9d4e8" ${ink(3.4)}/><path d="M120 112 Q240 88 360 104 L360 144 L120 144Z" fill="#4a9a3a" ${ink(2)}/><path d="M244 104 L244 64" stroke="${K}" stroke-width="2.4"/><path d="M244 64 L264 72 L244 80Z" fill="#c8202f" ${ink(1.4)}/><path d="M120 84 L360 84" stroke="${K}" stroke-width="2.4"/><path d="M240 24 L240 144" stroke="${K}" stroke-width="2.4"/>
  <text x="240" y="16" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="13" fill="#f2c14e">THE NINETEENTH HOLE</text>`;
 case 'butcher':return `<rect width="480" height="300" fill="#ece6d4"/>${[...Array(80)].map((_,i)=>`<rect x="${(i%10)*48}" y="${Math.floor(i/10)*40}" width="48" height="40" fill="none" stroke="#d2cab4" stroke-width="2"/>`).join('')}<path d="M0 46 L480 46" stroke="#6d7378" stroke-width="6"/><path d="M0 46 L480 46" ${ink(1.4)}/>
  ${[240].map(x=>`<path d="M${x} 46 L${x} 54 q6 4 0 8" fill="none" stroke="${K}" stroke-width="2.4"/><path d="M${x-22} 52 Q${x} 44 ${x+22} 52 L${x+28} 150 Q${x} 168 ${x-28} 150Z" fill="#c8403a" ${ink(3)}/><path d="M${x+10} 56 Q${x+24} 100 ${x+16} 150" fill="none" stroke="#9a2a24" stroke-width="10"/><path d="M${x-12} 62 Q${x} 96 ${x-10} 144" fill="none" stroke="#f3e6d6" stroke-width="7"/>`).join('')}
  <rect x="150" y="10" width="180" height="30" fill="#1f4d2b" ${ink(2.6)}/><text x="240" y="31" text-anchor="middle" font-family="Georgia" font-weight="700" font-size="14" fill="#f2c14e">FAMILY BUTCHER</text>`;
 case 'phone':return `<rect width="480" height="300" fill="#34404e"/>${[...Array(70)].map((_,i)=>`<path d="M${(i*41)%480} ${(i*23)%300} l-5 16" stroke="#c9d3dc" stroke-width="2" opacity=".5"/>`).join('')}<path d="M0 270 L480 270 L480 300 L0 300Z" fill="#23282e"/><circle cx="420" cy="50" r="24" fill="#f2e3a0" opacity=".55"/><path d="M420 50 L420 270" stroke="#2a2f35" stroke-width="6"/>`;}
  return '';}
function meetFront(kind){switch(kind){
 case 'moor':return `<g><path d="M40 300 L150 236" stroke="#4a2c14" stroke-width="13" stroke-linecap="round"/><path d="M40 300 L150 236" ${ink(2.4)}/><path d="M140 242 L214 200" stroke="#6d7378" stroke-width="7" stroke-linecap="round"/><path d="M140 242 L214 200" ${ink(2)}/>${hi('M150 236 L208 203',2)}</g>`;
 case 'snooker':return `<path d="M-10 262 L490 252 L490 300 L-10 300Z" fill="#1d7a40" ${ink(3.4)}/><path d="M-10 252 L490 242 L490 256 L-10 266Z" fill="#6b3f1f" ${ink(3)}/>${[[200,276,'#c8202f'],[214,282,'#c8202f'],[226,274,'#c8202f'],[290,280,'#f3efe6'],[150,286,'#1c1b19'],[340,278,'#e8c02a']].map(([x,y,c])=>`<circle cx="${x}" cy="${y}" r="8" fill="${c}" ${ink(2)}/><circle cx="${x-2.5}" cy="${y-2.5}" r="2" fill="#fff" opacity=".7"/>`).join('')}<path d="M40 296 L250 236" stroke="#c9944e" stroke-width="7" stroke-linecap="round"/><path d="M40 296 L250 236" ${ink(1.6)}/>`;
 case 'hotel':return `<path d="M150 272 L330 272 L344 300 L136 300Z" fill="#4a2e1d" ${ink(3)}/><path d="M150 272 L330 272 L332 278 L148 278Z" fill="#6b4a2c"/>${tumbler(196,248)}${tumbler(262,248)}<rect x="226" y="262" width="26" height="10" rx="4" fill="#9aa0a6" ${ink(1.8)}/>`;
 case 'station':return `<rect x="100" y="270" width="280" height="12" fill="#e05a4a" ${ink(3)}/><path d="M100 282 L380 282 L380 300 L100 300Z" fill="#9a3a2a"/>${cup(184,250)}${cup(268,250)}<path d="M214 262 Q236 236 258 262Z" fill="#d9e6ec" opacity=".8" ${ink(2)}/><rect x="222" y="254" width="28" height="8" fill="#e8c47a" ${ink(1.4)}/>`;
 case 'layby':return `<path d="M0 0 L480 0 L480 300 L0 300Z M60 40 Q60 26 76 24 L404 24 Q420 26 420 40 L428 230 L52 230Z" fill="#2a3a52" fill-rule="evenodd" ${ink(3.4)}/><path d="M232 24 L248 24 L252 230 L228 230Z" fill="#22304a" ${ink(2.6)}/><path d="M0 230 L480 230 L480 300 L0 300Z" fill="#6b3f2a" ${ink(3)}/>${[0,1,2,3,4,5,6,7].map(i=>`<path d="M${20+i*60} 236 L${20+i*60} 300" stroke="#5a3220" stroke-width="3"/>`).join('')}<text x="440" y="270" text-anchor="middle" font-family="Georgia" font-style="italic" font-size="12" fill="#c9a26e">Humber</text>${[...Array(18)].map((_,i)=>`<path d="M${70+(i*23)%340} ${40+(i*37)%180} l2 8" stroke="#dfe8ef" stroke-width="2" opacity=".6"/>`).join('')}`;
 case 'cafe':return `<rect x="90" y="268" width="300" height="14" fill="#d9493a" ${ink(3)}/><path d="M90 282 L390 282 L390 300 L90 300Z" fill="#a83428"/><ellipse cx="240" cy="266" rx="34" ry="8" fill="#f3efe6" ${ink(2.4)}/><ellipse cx="232" cy="263" rx="9" ry="5" fill="#f2c14e" ${ink(1.4)}/>${[0,1,2,3,4].map(i=>`<rect x="${242+i*5}" y="258" width="4" height="9" fill="#e8b45a" ${ink(1)}/>`).join('')}${cup(160,246)}${cup(300,246)}<path d="M200 270 L200 236 Q206 228 212 236 L212 270Z" fill="#c8202f" ${ink(2)}/>`;
 case 'committee':return `<path d="M60 262 L420 262 L440 300 L40 300Z" fill="#4a2a18" ${ink(3.4)}/><path d="M60 262 L420 262 L424 270 L56 270Z" fill="#6b4024"/><rect x="200" y="250" width="42" height="14" fill="#f3efe6" ${ink(2)} transform="rotate(-4 220 256)"/><ellipse cx="290" cy="262" rx="16" ry="5" fill="#9aa0a6" ${ink(2)}/><path d="M282 260 L298 254" stroke="#f3efe6" stroke-width="2.4"/>${smk(296,252,0.6)}`;
 case 'golf':return `<path d="M-10 266 L490 266 L490 300 L-10 300Z" fill="#4a2e1d" ${ink(3.4)}/><path d="M-10 266 L490 266 L490 274 L-10 274Z" fill="#6b4a2c"/>${tumbler(190,242)}${tumbler(270,242)}`;
 case 'butcher':return `<path d="M160 256 L320 256 L330 300 L150 300Z" fill="#b5884e" ${ink(3.4)}/>${[0,1,2,3].map(i=>`<path d="M${170+i*40} 262 L${172+i*40} 296" stroke="#8a6438" stroke-width="2"/>`).join('')}<path d="M210 254 L262 226 L272 240 L222 262Z" fill="#c4c9cd" ${ink(2.4)}/><path d="M222 262 L210 272" stroke="#4a2c14" stroke-width="7" stroke-linecap="round"/>`;
 case 'phone':return `<path d="M0 0 L480 0 L480 300 L0 300Z M150 40 L330 40 L330 270 L150 270Z" fill="#c8202f" fill-rule="evenodd" ${ink(3.4)}/><path d="M150 236 L330 236 M150 270 L330 270" stroke="#a8161f" stroke-width="7"/><path d="M150 236 L330 236" ${ink(1.6)}/><path d="M180 40 L180 236 M300 40 L300 236" stroke="#a8161f" stroke-width="6"/><path d="M180 40 L180 236 M300 40 L300 236" ${ink(1.4)}/><rect x="168" y="6" width="144" height="26" rx="5" fill="#a8161f" ${ink(3)}/><rect x="190" y="10" width="100" height="16" fill="#f3efe6" ${ink(1.6)}/><text x="240" y="23" text-anchor="middle" font-family="Arial" font-weight="900" font-size="12" fill="${K}">TELEPHONE</text>`;}
  return '';}
const SCENEW={moor:'one',snooker:'two',hotel:'two',station:'two',layby:'car',cafe:'two',committee:'two',golf:'two',butcher:'two',phone:'phone'};
function meetArt(kind,cid){const id='ms'+(MEETN++);const W=480,H=300;
  const host=kind==='moor'?LOOKS.pearsey:kind==='phone'?mgrLook(cid):cid?chairLook(cid):LOOKS.chair;
  const butch=kind==='butcher'?{...host,id:host.id+'b',body:(host.body||'')+`<path d="M72 214 L168 214 L176 300 L64 300Z" fill="#f3efe6" ${SW(2.6)}/>${[0,1,2,3,4].map(i=>`<path d="M${70+i*24} 214 L${68+i*26} 300" stroke="#2a6fd6" stroke-width="3"/>`).join('')}<path d="M92 214 Q120 196 148 214" fill="none" ${SW(2)}/>`}:host;
  const me=kind==='moor'?youCap:LOOKS.you;let figs;
  if(SCENEW[kind]==='phone')figs=sceneFig(host,126,40,0.95,false)+`<path d="M196 170 Q184 200 200 236" fill="none" stroke="#1c1b19" stroke-width="5" stroke-linecap="round"/><rect x="184" y="122" width="22" height="50" rx="10" fill="#1c1b19" ${SW(2)} transform="rotate(-10 195 147)"/><path d="M190 130 L198 128" stroke="#5a5a5a" stroke-width="2"/>`;
  else if(SCENEW[kind]==='car')figs=sceneFig(butch,70,58,0.78,false)+sceneFig(me,224,58,0.78,true);
  else figs=sceneFig(kind==='butcher'?butch:host,2,42,0.9,false)+sceneFig(me,262,42,0.9,true);
  return `<svg class="meetart" viewBox="0 0 ${W} ${H}" role="img" aria-label="The meeting"><defs>${HTP(id)}<clipPath id="mc-${id}"><rect width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#mc-${id})">${meetBG(kind,id)}<rect width="${W}" height="${H}" fill="url(#mh-${id})" opacity=".5"/>${figs}${meetFront(kind)}</g><rect x="3" y="3" width="${W-6}" height="${H-6}" fill="none" stroke="${K}" stroke-width="6"/></svg>`;}

const DDPLACEK=['snooker','hotel','station','layby','cafe','committee','golf','butcher'];

/* ---------- the calendar, and simming forward ---------- */
function seasonLastDate(){return G.fx.reduce((m,f)=>f.date>m?f.date:m,G.date);}
function calMarks(){const y=G.year;const M={};const add=(d,t,k)=>{(M[d]=M[d]||[]).push({t,k});};
  if(G.cup)G.cup.dates.forEach((d,r)=>{if(!G.fx.some(f=>f.date===d&&f.comp==='FA'&&isUserFx(f)))add(d,`FA Cup ${CUPR[r].replace(' Round','')}`,'fa');});
  if(G.lc)G.lc.dates.forEach((d,r)=>{(Array.isArray(d)?d:[d]).forEach(x=>{if(!G.fx.some(f=>f.date===x&&f.comp==='LC'&&isUserFx(f)))add(x,`League Cup ${LCR[r].replace(' Round','')}`,'lc');});});
  add(`${y+1}-03-15`,'Deadline day','dd');add(`${y+1}-03-16`,'Transfers close','dd');add(`${y}-10-15`,'Trial day','yt');add(`${y+1}-02-15`,'Schoolboy signings','yt');
  const ld=G.fx.filter(f=>f.comp==='L').reduce((m,f)=>f.date>m?f.date:m,'');if(ld)add(ld,'Last League Saturday','end');
  const ff=G.fx.filter(f=>f.comp==='L').reduce((m,f)=>f.date<m?f.date:m,'9999');if(ff!=='9999')add(ff,'Season kicks off','end');
  [9,10,11,12,1,2,3,4,5].forEach(m=>{const yy=m>=8?y:y+1;add(`${yy}-${String(m).padStart(2,'0')}-01`,'Awards','aw');});return M;}
function vCalendar(){const ym=UI.calYM||G.date.slice(0,7);const [Y,Mo]=ym.split('-').map(Number);const first=`${ym}-01`;const start=addDays(first,-((dow(first)+6)%7));
  const mine={};G.fx.filter(isUserFx).forEach(f=>{(mine[f.date]=mine[f.date]||[]).push(f);});const marks=calMarks();const sel=UI.calSel;const last=seasonLastDate();
  const cells=[];for(let i=0;i<42;i++){const d=addDays(start,i);const inM=d.slice(0,7)===ym;const fs=mine[d]||[];const mk=marks[d]||[];
    cells.push(`<button class="cal-d ${inM?'':'out'} ${d===G.date?'today':''} ${d===sel?'sel':''} ${d<G.date?'past':''}" data-a="calsel" data-k="${d}" ${d<=G.date||d>last?'disabled':''}><span class="cal-n">${+d.slice(8)}</span>
      ${fs.map(f=>{const h=f.h===U();const o=h?f.a:f.h;const r=f.p?resFor(f,U()):'';return `<span class="cal-fx c-${f.comp}">${crest(o,'sm')}<b>${h?'H':'A'}</b><em>${esc(club(o)?club(o).s:'')}</em>${f.p?`<i class="res r${r}">${h?f.hg:f.ag}-${h?f.ag:f.hg}</i>`:''}</span>`;}).join('')}
      ${mk.slice(0,2).map(x=>`<span class="cal-mk k-${x.k}">${esc(x.t)}</span>`).join('')}</button>`);}
  const nm=addDays(`${ym}-28`,5).slice(0,7),pm=addDays(first,-1).slice(0,7);const nextMine=G.fx.filter(f=>!f.p&&isUserFx(f)).map(f=>f.date).sort()[0];
  const eom=(()=>{let d=addDays(`${G.date.slice(0,7)}-28`,5).slice(0,7)+'-01';return addDays(d,-1);})();const auto=UI.simAuto!==false;
  return `<section class="panel"><div class="ph"><div><h2 class="h1">The calendar</h2><p class="muted">Your fixtures, and the dates that matter. Pick a day to sim forward to it.</p></div>
   <div class="row gap"><button class="btn sm" data-a="calm" data-k="${pm}">◂ ${MON[(Mo+10)%12].slice(0,3)}</button><strong class="cal-title">${MON[Mo-1]} ${Y}</strong><button class="btn sm" data-a="calm" data-k="${nm}">${MON[Mo%12].slice(0,3)} ▸</button></div></div>
   <div class="cal-grid">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<span class="cal-h">${d}</span>`).join('')}${cells.join('')}</div>
   <p class="legend cal-leg"><span class="cal-fx c-L">League</span><span class="cal-fx c-FA">FA Cup</span><span class="cal-fx c-LC">League Cup</span><span class="cal-fx c-EU">Europe</span><span class="cal-mk k-dd">Transfers</span><span class="cal-mk k-yt">Young players</span></p></section>
  <section class="panel simpanel"><h3 class="h2 first">Sim forward</h3>
   <div class="row gap wrap">${nextMine&&nextMine>G.date?`<button class="btn" data-a="simto" data-k="${addDays(nextMine,-1)}">To the eve of my next match</button>`:''}<button class="btn" data-a="simto" data-k="${eom>G.date?eom:addDays(G.date,1)}">To the end of the month</button><button class="btn" data-a="simto" data-k="${last}">To the end of the season</button>${sel&&sel>G.date?`<button class="btn go" data-a="simto" data-k="${sel}">To ${fmtDate(sel,true)}</button>`:''}</div>
   <label class="chk"><input type="checkbox" data-c="simauto" ${auto?'checked':''}> <span>Play my matches automatically. Untick to stop on each of my matchdays and pick the team yourself.</span></label>
   <label class="chk"><input type="checkbox" data-c="simstop" ${simStops()?'checked':''}> <span>Stop for transfer business and the big news: deadline day, a bid for one of your players, and any major news story. Untick to sim straight through: they wait in the intray instead, with no newspapers or wireless popping up at the end.</span></label>
   <p class="muted sm">Whatever you choose, the sim always stops for a job offer or the sack. With matches played automatically, your best eleven is picked for you.</p></section>`;}
/* one step of the world, the same as pressing Continue, but nobody waits for you */
function simOne(target){const today=G.date;const todays=G.fx.filter(f=>f.date===today&&!f.p);
  if(todays.length){const uf=todays.find(isUserFx);if(uf){if(UI.simAuto===false)return 'match';pressCheck(uf);validateUserXI();const m=runToEnd(newMatch(uf,false),!!uf.rpl);finalize(m);if(uf.comp!=='L')resolveTie(uf);const R=UI.simrun;if(R){const r=resFor(uf,U());R.res[r]=(R.res[r]||0)+1;}}
    playDay(today);return 'played';}
  const nd=nextDate();if(nd==='9999')return 'end';
  if(nd>target){let d=today;while(d<target){d=addDays(d,1);dailyTick(d);if(G.holdDay){G.holdDay=false;return 'moved';}}return 'reached';}
  let d=today;while(d<nd){d=addDays(d,1);dailyTick(d);if(G.holdDay){G.holdDay=false;break;}}return 'moved';}
function simStart(target){if(setupGate())return;const jobs0=G.inbox.filter(m=>m.act&&m.act.k==='job'&&!m.act.done).length;UI.simrun={target,from:G.date,res:{},jobs0,stop:false,dd0:G.user.ddone,iid0:G.iid};UI.press=null;UI.notice=null;UI.paper=null;UI.screen='simrun';render();
  const tick=()=>{const R=UI.simrun;if(!R)return;let why='';
    for(let k=0;k<4&&!why;k++){if(R.stop){why='stopped';break;}const r=simOne(R.target);
      if(G.sacked)why='sacked';else if(r==='end')why='end';else if(r==='reached'||G.date>=R.target&&!G.fx.some(f=>f.date===G.date&&!f.p))why='reached';else if(r==='match')why='match';
      else if(G.inbox.filter(m=>m.act&&m.act.k==='job'&&!m.act.done).length>R.jobs0)why='job';
      else if(simStops()){if(G.user.ddone!==R.dd0)why='deadline';else if(G.inbox.some(m=>m.id>=R.iid0&&m.act&&(m.act.k==='offer'||m.act.k==='abroad')&&!m.act.done))why='bid';else if(G.inbox.some(m=>m.id>=R.iid0&&m.force))why='news';}}
    if(why){simEnd(why);return;}render();setTimeout(tick,20);};setTimeout(tick,30);}
const simStops=()=>!(G.settings&&G.settings.simStop===false);
function simEnd(why){const R=UI.simrun;UI.simrun=null;if(!simStops()){/* sim straight through: the news and the bids wait quietly in the intray */G.paperQ=[];G.wireQ=[];G.bidQ=[];G.radioQ=[];G.lastPaperPop=G.date;}save();const r=R.res;const n=(r.W||0)+(r.D||0)+(r.L||0);
  const msgs={sacked:'',end:'The season is over.',reached:'',match:'Your next match is today.',deadline:'Deadline day: the telephone is ringing.',job:'A club wants to talk to you.',bid:'A club has made a bid for one of your players.',news:'Big news in the papers.',stopped:'Stopped.'};
  UI.screen=G.sacked?'sacked':why==='match'?'prematch':'game';if(UI.screen==='game')UI.tab=why==='deadline'||why==='job'||why==='bid'?'inbox':UI.tab;if(why==='match'){UI.press=pressCheck(G.fx.find(f=>f.date===G.date&&!f.p&&isUserFx(f)));}
  render();toast(`<strong>Simmed to ${fmtDate(G.date,true)}</strong> <span>${n?`Played ${n}: won ${r.W||0}, drew ${r.D||0}, lost ${r.L||0}. `:''}${msgs[why]||''}</span>`);}
function vSimRun(){const R=UI.simrun;const tot=Math.max(1,daysBetween(R.from,R.target));const done=clamp(daysBetween(R.from,G.date),0,tot);const r=R.res;
  return `<section class="panel narrow simbox"><p class="eyebrow">Simming forward</p><h2 class="h1">${fmtDate(G.date)}</h2><div class="simbar"><i style="width:${Math.round(done/tot*100)}%"></i></div>
   <p class="muted">To ${fmtDate(R.target)}. ${(r.W||0)+(r.D||0)+(r.L||0)?`So far: won ${r.W||0}, drew ${r.D||0}, lost ${r.L||0}.`:''}</p><button class="btn" data-a="simstop">Stop</button></section>`;}

/* ---------- more for the chairman to say ---------- */
const CQ_MORE={welcome:['The last man left us in a fine mess. We are counting on you to tidy it up.','You will find the board supportive, as long as the results are.','This is a proud club with a long memory. Give the supporters something to remember.','The job is yours. Do not make us regret it.','We have high hopes for you. Most of them are reasonable.','My door is always open, though I would rather you were on the training ground than in my office.'],
 neutral:['It has been a season of ups and downs. The board would like rather more ups.','We are neither delighted nor disappointed. Let us call it watchful.','I have known worse spells, and I have known better ones.','The directors had a long talk about the team last night. Then we talked about the price of coal.','Steady progress is all we ask. Steady, and progress.','The board judge a manager in May, not in October.','I am told it is a transitional season. I have heard that before.','Nobody is panicking. Least of all me.'],
 good:['When I go into the bank these days, the manager stands up.','I have not enjoyed my football this much since before the war.','The supporters are singing, the turnstiles are clicking and my wife has stopped complaining. What more could I ask?','We had a board meeting this week and nobody raised their voice once. That is unheard of.','The manager has done a grand job. I told him so, and then I told the newspapers.','People stop me in the street to shake my hand. I tell them to shake the manager\'s.','If this carries on, I may even buy a new hat.','Success suits this club. We should have tried it years ago.'],
 bad:['I did not put my own money into this club to watch that.','The directors are asking questions, and I am running out of answers.','My telephone has not stopped ringing, and none of the callers are happy.','We are better than this. We had better start showing it.','I was booed in the car park on Saturday. That has not happened since 1951.','One more performance like that and I shall be picking the team myself.','The board have been very patient. Do not mistake patience for a blank cheque.','Even the tea lady has an opinion, and it is not a good one.'],
 trophy:['I have waited my whole life for this, and it was worth every minute.','Somebody fetch the champagne. And somebody else fetch the bank manager, so he can see it.','The whole town is out on the streets, and I intend to join them.','My father was on this board, and his father before him. I wish they were here to see this.','There will be a civic reception, and I have already ordered a new suit for it.'],
 askYes:['Go on, then. But I want to see it on the pitch, not in the papers.','The board have found a little more. Do not make us look foolish.','I have spoken to the treasurer. He was not pleased, but he agreed.','Very well. But the next time you ask, bring results with you.'],
 askNo:['There is no more money. I have looked under every cushion in the boardroom.','You have had your budget. Make it work.','The bank manager would have my head, and then he would have yours.','Not this month. Ask me again when we are winning.'],
 sack:['We thank you for your efforts. They were not enough.','The board have decided that a fresh start is in everybody\'s interests, mostly ours.','It is a cruel business. We did not make the rules.'],
 conNo:['A new contract? Let us see where we finish first.','The board do not discuss contracts in the middle of a bad run.','Win something, and then come and see me.'],
 conYes:['You have earned it. Sign here, and here.','The board are pleased with your work, and we want you here for a long time.','Consider it done. Do not let it go to your head.']};
Object.keys(CQ_MORE).forEach(k=>{CQ[k]=(CQ[k]||[]).concat(CQ_MORE[k]);});
const CQP_MORE={welcome:['One trusts you have brought a decent suit. We dine in the boardroom after home matches.','Splendid to have you aboard, dear boy. Do try not to embarrass us.','The previous fellow was frightfully common. One expects better from you.'],
 neutral:['Middling, dear boy. Rather like a Tuesday.','One is neither elated nor dismayed. One is simply waiting.','Keep calm and carry on, as my late father used to say, usually about the gardener.','One reserves judgement, as one does with a new butler.','A curate\'s egg of a season, dear boy. Good in parts.'],
 good:['One has not been this content since Henley.','Jolly good show. The chaps are playing like gentlemen and winning like professionals.','I have told the members of my club all about it. They are frightfully jealous.','Capital, dear boy. Simply capital.','One raised a glass at breakfast. Unheard of.','The Holte End is in fine voice. One rather enjoys it from a safe distance.'],
 bad:['Frightful. Simply frightful. This behaviour is unbecoming.','One left at half-time to see to the dogs. They at least know how to behave. This behaviour is unbecoming.','The second eleven at my old school could do better. This behaviour is unbecoming.','My valet asked me how we got on. I could not bring myself to tell him. This behaviour is unbecoming.','One expected a contest and got a shambles. This behaviour is unbecoming.'],
 trophy:['One has had the trophy placed beside the family silver. It looks rather at home.','Breeding, dear boy. It always tells in the end.','A day for the history books, and for the second-best claret.','One shall be insufferable at the club for weeks. Quite insufferable.'],
 askYes:['Very well. One shall sell a minor Constable.','The money is yours, dear boy. Do not squander it on anyone from Birmingham City.'],
 askNo:['Certainly not. One has already paid for the new pavilion roof. This behaviour is unbecoming.','Money does not grow on trees, dear boy. It grows on estates, and the estate is resting.'],
 conNo:['Terms? One has seen the league table, dear boy. This behaviour is unbecoming.'],
 conYes:['But of course, old chap. Do have a cigar.']};
Object.keys(CQP_MORE).forEach(k=>{CQP[k]=(CQP[k]||[]).concat(CQP_MORE[k]);});
/* and each chairman speaks through his own creed now and then */
const CQT={cup:{good:['Wait until the Cup comes round. That is when this club comes alive.','Form like this wins Cup ties. I can smell Wembley.','The League is all very well, but this is a Cup side if ever I saw one.'],bad:['If the League is beyond us, at least give me a Cup run.','A good Cup run would cure all of this. Mark my words.','I can forgive a lot for a giant-killing. We have not had one lately.'],neutral:['I dream about Wembley every night. My wife says I talk in my sleep about the Fifth Round.','Third Round day is the best day of the year. Everything else is waiting for it.','Give me ninety minutes and a muddy pitch against a First Division side, and I am a happy man.']},
 acct:{good:['The accounts are in the black and the team is winning. I may frame this balance sheet.','Gates up, wages under control. I have not slept this well in years.','Winning is cheaper than losing. I have the figures to prove it.'],bad:['We are losing matches and losing money. One of those must stop.','Every defeat costs us at the turnstile. I can show you the column.','I have been through the books twice. There is nothing in them to cheer me up.'],neutral:['Every penny counts. I count them personally, on Monday mornings.','A sound club is a solvent club. Remember that.','I do not mind spending money. I mind wasting it.']},
 youth:{good:['Half that side came through our own youth team. That is what makes me proudest.','Local lads in our shirts, winning matches. That is what a football club is for.','The youth coach deserves a medal. I may give him one.'],bad:['Where are the young lads? I want to see them in the first team, not the stand.','We are paying old men to lose. I would rather young men did it, and learned something.','Our youth team is the best thing about this club. Why are they not playing?'],neutral:['Give the boys a chance. They will repay you.','I went to watch the youth team on Saturday morning. Some of those lads are ready now.','A club that does not grow its own will always be buying other people\'s.']},
 show:{good:['Goals, goals, goals. This is what people pay their money for.','The crowd were on their feet all afternoon. That is what I call value for money.','I want to see the net bulge, and lately it has been bulging nicely.'],bad:['Nil-nil at home. I nearly asked for my money back, and it is my club.','Dull, dull, dull. People will stay at home and watch the wrestling.','Football should be a night out at the theatre. Lately it has been a wet afternoon in a bus shelter.'],neutral:['Entertain them. A full house is the best tonic in the world.','Win if you can, but whatever you do, do not be boring.','I measure a season in goals and gates, in that order.']},
 amb:{good:['This is just the start. I want the title, and then I want Europe.','We are on our way, and I intend to make sure nobody stops us.','Keep this up and there will be money for whoever you want.'],bad:['I did not spend this money to finish halfway down the table.','Ambition without results is just a bill.','I expect a return on my investment, and so far I am not getting one.'],neutral:['Ambition costs money, and I have the money. Show me the ambition.','Second best is first loser. I want this club at the top.','Tell me who you want, and tell me how he wins us the League.']}};
function chairSay2(kind,cid){const ch=chairOf(cid||U());if(!ch.pearsey&&CQT[ch.t]&&CQT[ch.t][kind]&&rand()<0.22)return pick(CQT[ch.t][kind]);const pool=(ch.pearsey?CQP:CQ)[kind]||CQ[kind]||CQ.neutral;return pick(pool);}

/* ---------- more from the terraces ---------- */
function moreLetters(){const c=club(U());const u=G.user;const out=[];const S=sq(U());const t=table(c.div);const pos=t.findIndex(r=>r.id===U())+1;const f=fans();const mo=+G.date.slice(5,7);
  const rival=DERBY.map(([a,b])=>a===U()?b:b===U()?a:null).find(Boolean);const kid=S.filter(p=>age(p)<=20&&p.apps>0).sort((a,b)=>b.apps-a.apps)[0];const gk=S.find(p=>G.user.xi[0]===p.id);
  const capt=u.capt&&G.players[u.capt];const last=G.fx.filter(x=>x.p&&isUserFx(x)).slice(-1)[0];const away=G.fx.filter(x=>x.p&&x.a===U()).slice(-1)[0];
  if(rival)out.push(`Whatever else happens this season, we must beat ${cn(rival)}. My brother-in-law supports them and I shall never hear the end of it.`,`I see ${cn(rival)} are crowing again. They have not won anything worth having since the old King died.`);
  if(kid)out.push(`What a find young ${kid.n} is. ${age(kid)} years old and already playing like a veteran. Do not sell him, whatever they offer.`,`I went to school with ${surname(kid.n)}'s father. The lad gets his footballing brains from his mother's side.`);
  if(gk)out.push(`A word for ${gk.n} in goal. ${gk.form.length&&avgForm(gk)>=6.8?'Safe hands all season. I would trust him with my wages.':'He looks nervous on crosses. Somebody needs to tell him to come and catch the ball.'}`);
  if(capt)out.push(`${capt.n} leads by example. You can hear him shouting from the back of the Kop end, or whatever we are calling it this week.`);
  if(away)out.push(`I travelled to ${club(away.h).g} on the supporters' coach. ${away.ag>away.hg?'A grand day out, and a win to cap it.':away.ag<away.hg?'Six hours on a coach to watch that. The pies were better than the football.':'A point, a puncture on the way home and a sing-song. Not a bad day.'}`);
  if(last&&last.comp==='FA')out.push(`The Cup brings out the best in this town. I have not seen so many rosettes since the Coronation.`);
  if((u.fever||0)>=4)out.push(`My wife has knitted a bobble hat in the club colours for the whole family, including the dog. That is cup fever for you.`,`There were queues round the block for Cup tickets at seven in the morning. I was there at five.`);
  if(pos&&pos<=3&&u.games>=8)out.push(`Top three! I have taped the league table to the inside of my cupboard door at the works.`,`Do not get carried away, lads. We have been here before and we know how it ends. But this time, just maybe.`);
  if(pos&&t.length-pos<3&&u.games>=8)out.push(`Relegation does not bear thinking about. I have supported this club through thick and thin, and this is very thin.`,`Stick with the lads. It is when things are hard that they need us most.`);
  if(G.wageCap==null&&G.year>=1961)out.push(`These players earn more in a week than I earn in a month now. They could at least run about a bit.`);
  if(G.tv)out.push(`My neighbour watched the highlights on the television and said it looked a cracking game. I was there, and it was not.`);
  if(G.year>=1966)out.push(`Since the World Cup, my two lads want to be Bobby Moore. I tell them to be ${S[0]?S[0].n:'one of ours'} instead.`);
  if(G.year<1963)out.push(`When I was a lad you could get in for a tanner and still have change for a pie. Now look at it.`);
  if(upgDone('cover'))out.push(`Thank you for the new roof over the terrace. For the first time in thirty years I went home dry.`);
  if(upgDone('stand'))out.push(`The new stand is a palace. I took my mother and she said it was nicer than the Odeon.`);
  if(upgDone('scoreboard'))out.push(`That electric scoreboard is a marvel. My grandson watches the half-time scores more than the football.`);
  if(G.lc&&G.lc.alive&&G.lc.alive.includes(U()))out.push(`People sneer at the League Cup, but a trophy is a trophy. Let us win it and see who is sneering then.`);
  if(G.eu&&G.eu.entries&&G.eu.entries.some(e=>e.cid===U()))out.push(`A European night under the floodlights. I never thought I would live to see it. I have bought a phrase book.`);
  if(mo===12||mo===1)out.push(`Could the club please do something about the frost on the terraces? My feet did not thaw out until Wednesday.`,`Boxing Day football, a flask of tea and the whole family together. There is nothing like it.`);
  if(mo>=8&&mo<=9)out.push(`A new season, a new hope. I have paid my season ticket and bought a new scarf. The rest is up to the lads.`);
  if(mo>=4&&mo<=5)out.push(`Whatever happens in the last few weeks, thank you to the players for a season of memories. Mostly good ones.`);
  if(f<35)out.push(`The atmosphere at the ground has gone flat. Somebody needs to give us something to shout about.`);
  if(f>=70)out.push(`I have never heard the ground so loud. My ears were ringing until Tuesday.`);
  out.push(`The man behind me in the paddock has shouted "get rid of it" every time we have had the ball for eleven years. Could somebody please get rid of him?`,
    `Why is it always raining when we play at home? I have written to the council about it.`,
    `My little girl, aged eight, asks why the referee wears black. I told her he is in mourning for his eyesight.`,
    `I have supported this club for fifty-two years and missed three home games, two for funerals and one for my own wedding. My wife has not forgiven me for being late to that one.`,
    `Could the man who borrowed my umbrella in the Enclosure on Saturday please return it? It has a duck's head handle and great sentimental value.`,
    `The half-time scores are put up so slowly that the second half is often over before we find out how Bury got on.`,
    `I would like to thank the club for the free programme they gave my son on his birthday. He has read it eleven times.`,
    `Is there any truth in the rumour that the club is going to paint the stand? It has been the same colour since Lloyd George.`,
    `The referee on Saturday must have left his spectacles in the dressing room. I have sent him a spare pair care of the Football League.`,
    `We need a proper centre-forward. Somebody who can head a ball and a door down if he has to.`,
    `My husband thinks more of this club than he does of me. On reflection, I can understand why, after Saturday.`,
    `Please could we have more mustard at the hot dog stall? A hot dog without mustard is just a sad sausage.`,
    `To the gentleman who threw an orange at the linesman: you missed, and it was a waste of a good orange.`,
    `The new floodlights are very fine, but they attract every moth in the county.`,
    `I counted the crowd on Saturday and made it about four thousand more than the club announced. Is somebody keeping the difference?`,
    `My grandfather saw this club play in the 1890s. He said the football was better then, but he also said that about the beer.`,
    `I am nine years old and I want to be a goalkeeper. Please can I have a trial? I am very good at falling over.`,
    `The tea at half-time is now so weak you can read the programme through it.`,
    `Well done to the groundsman. The pitch looked a picture on Saturday, until the players got on it.`,
    `Why do we always concede just before half-time? I have started leaving for the tea bar on 44 minutes as a protest.`,
    `Our club song needs a new verse. I have written eleven. Please find them enclosed.`,
    `Could the man with the rattle in the North Stand be asked to rattle in time with the singing? It is putting the rest of us off.`,
    `My dog has started barking every time the radio says our name. He is a better supporter than some on the terraces.`,
    `A word for the St John Ambulance men, who stand in the rain every week and never see a goal because they are watching us.`,
    `I see the club has put the prices up again. I shall be writing to my MP, and if that fails, to the Sporting Pink.`,
    `Never mind the forwards. The best player at the club is the man who sells the hot Bovril. He never misses.`);
  return out;}
const SIGNOFFS=[()=>`${pick(DATA.first)} ${pick(DATA.last)}`,()=>`Mrs ${pick(FEM)[0]}. ${pick(DATA.last)}`,()=>`${pick(DATA.first)[0]}. ${pick(DATA.first)[0]}. ${pick(DATA.last)}`,()=>`${pick(DATA.first)} ${pick(DATA.last)} (aged ${ri(8,13)})`,()=>`"Disgusted", ${pick(['a regular','a season ticket holder','a long-suffering supporter'])}`,()=>`${pick(FEM)} ${pick(DATA.last)}`,()=>`${pick(['Old','A loyal','A worried','A happy'])} supporter`];

/* ---------- bids for our players: impossible to miss ---------- */
const pendingBids=()=>G.inbox.filter(m=>{const a=m.act;if(!a||(a.k!=='offer'&&a.k!=='abroad')||a.done)return false;const p=G.players[a.pid];if(!p||p.c!==U()){a.done=true;a.res='He has left the club';return false;}return true;});
function bidQ(m){if(G.autopilot||!m)return;(G.bidQ=G.bidQ||[]).push(m.id);}
function bidHTML(N){const m=G.inbox.find(x=>x.id===N.mid);if(!m||!m.act){UI.notice=null;return '';}const a=m.act;const p=G.players[a.pid];if(!p){UI.notice=null;return '';}
  const buyer=a.k==='abroad'?a.to:club(a.club).n;const v=valueOf(p);const pct=Math.round((a.fee/v-1)*100);const lines=esc(m.body).split('\n').filter(Boolean);
  return `<div class="scrim" data-a="noticeclose"></div><article class="bidcard" role="dialog" aria-modal="true" aria-label="A bid for ${esc(p.n)}">
   <header class="bid-head"><span class="bid-stamp">Transfer bid</span><div>${a.k==='abroad'?'':crest(a.club,'lg')}<h2>${esc(buyer)} want ${esc(p.n)}</h2></div></header>
   <div class="bid-body"><div class="bid-por">${playerArt(p,U(),'b')}</div>
    <div><dl class="dl"><div><dt>The offer</dt><dd><strong class="bid-fee">${money(a.fee)}</strong></dd></div><div><dt>His value to us</dt><dd>${money(v)} <small class="${pct>=0?'up':'down'}">${pct>=0?`${pct}% above`:`${-pct}% below`}</small></dd></div><div><dt>Player</dt><dd>${POSN[p.pos]}, ${age(p)}, rated ${p.ca}${p.listed?' · on the list':''}</dd></div><div><dt>Offer open until</dt><dd>${a.exp?fmtDate(a.exp,true):'-'}</dd></div></dl>
     ${lines.slice(1).map(l=>`<p class="sm">${l}</p>`).join('')}
     ${a.done?`<p class="stamp">${esc(a.res||'Dealt with')}</p>`:msgActions(m)}</div></div>
   <footer class="bid-foot"><button class="btn ${a.done?'go':''}" data-a="noticeclose">${a.done?'Back to the office':'Decide later (it waits in the intray)'}</button></footer></article>`;}

/* ---------- names in the notebook, and early baths ---------- */
function discipline(m){m.sides.forEach((s,i)=>{Object.entries(s.bk||{}).forEach(([pid,n])=>{const p=G.players[pid];if(!p||p.eu)return;p.bks=(p.bks||0)+n;
      if(p.bks>=4&&!p.bkBan){p.bkBan=true;p.drop=addDays(G.date,7);p.susp=true;p.dropWhy='Suspended: four cautions';if(p.c===U())msg('club',`${p.n} suspended`,`${p.n} has had his name taken four times this season. The FA disciplinary committee have suspended him for seven days.`);}});
    Object.keys(s.off||{}).forEach(pid=>{if(s.hob&&s.hob[pid])return;const p=G.players[pid];if(!p||p.eu)return;p.offs=(p.offs||0)+1;p.drop=addDays(G.date,14);p.susp=true;p.dropWhy='Suspended: sent off';
      if(p.c===U())msg('club',`${p.n} suspended for 14 days`,`After his sending-off against ${cn(m.fx.h===U()?m.fx.a:m.fx.h)}, ${p.n} has been suspended for fourteen days by the FA disciplinary committee. ${pick(['He says the referee never had a good view.','He has apologised to the dressing room.','The chairman is not amused.'])}`);});});}

/* ---------- the backroom staff grow into their jobs, or don't ---------- */
const staffBest=t=>(G.user.staff||[]).filter(s=>s.type===t).sort((a,b)=>b.q-a.q)[0];
function staffImp(t,v){const s=staffBest(t);if(s)s.imp=(s.imp||0)+v;}
const IMPTXT={fit:v=>`${plu(Math.round(v),'injury day')} saved`,youth:v=>`${plu(Math.round(v),'point')} of improvement in the young players`,mot:v=>`${plu(Math.round(v),'week')} keeping the dressing room happy`,att:v=>`${plu(Math.round(v),'goal')} scored with him on the staff`,def:v=>`${plu(Math.round(v),'clean sheet')} with him on the staff`,gk:v=>`${plu(Math.round(v),'clean sheet')} for the goalkeepers`,wing:v=>`${plu(Math.round(v),'goal')} from the wide men`,set:v=>`${plu(Math.round(v),'goal')} from set pieces`,scout:v=>`${money(v)} saved on transfer fees`};
function staffInit(s){if(s.age==null)s.age=s.real?ri(40,55):ri(34,58);if(s.xp==null)s.xp=ri(0,40);if(!s.since)s.since=G.date;if(s.imp==null)s.imp=0;if(s.raise==null)s.raise=1;}
function staffWeekly(){(G.user.staff||[]).forEach(s=>{staffInit(s);s.xp=Math.min(100,s.xp+0.55+(s.q<3?0.35:0)+((club(U()).fstreak||0)>0?0.25:0)-(s.age>=60?0.4:0));});staffImp('mot',1);}
function staffMatch(fx,m){if(m.us<0)return;const us=m.us,my=m.sc[us],th=m.sc[1-us];staffImp('att',my);if(th===0){staffImp('def',1);staffImp('gk',1);}
  m.goals.filter(g=>g.side===us).forEach(g=>{const p=G.players[g.pid];if(p&&p.pos==='WG')staffImp('wing',1);if(g.flag===''&&rand()<0.12)staffImp('set',1);});}
function staffSeason(){(G.user.staff||[]).forEach(s=>{staffInit(s);s.age++;const line=s.imp?IMPTXT[s.type](s.imp):'';s.last=line;s.imp=0;
  if(s.xp>=100&&s.q<5){s.q++;s.xp=0;msg('club',`${s.n} has grown into the job`,`${s.n} has learned a great deal this season. Your ${STAFF[s.type][0].toLowerCase()} is now a ${'★'.repeat(s.q)} coach.${line?` Last season: ${line}.`:''} He will expect his wages to reflect it.`);}
  else if(s.age>=61&&rand()<0.3&&s.q>1){s.q--;msg('club',`${s.n} is slowing down`,`${s.n} is ${s.age} now, and the trainer says he is not the force he was. He has dropped to ${'★'.repeat(s.q)}. It may be time for a younger man.`);}
  if(s.age>=66){G.user.staff=G.user.staff.filter(x=>x!==s);msg('club',`${s.n} retires`,`${s.n} has decided to retire at ${s.age}. He leaves with the thanks of everyone at the club.`);}});}
function staffValue(s){const fair=Math.round((6+7*s.q)*(G.wageCap?0.8:1)*infl());const r=s.w/fair;return {fair,w:r<=1.05?'Good value':r<=1.25?'Fair':'Expensive'};}

/* ---------- the photographs in the papers: grey tones and a halftone screen ---------- */
const PD='#2a2722',PM='#6b665c',PL='#a8a296',PP='#e6dfcc';
const PICS2={
 goal:`<rect width="200" height="160" fill="${PL}"/>${[0,1,2,3].map(r=>`<g>${[...Array(12)].map((_,k)=>`<circle cx="${8+k*17+(r%2)*8}" cy="${10+r*12}" r="5" fill="${r%2?PM:'#7b766c'}"/>`).join('')}</g>`).join('')}<rect x="0" y="54" width="200" height="6" fill="${PD}"/><path d="M0 60 L200 60 L200 160 L0 160Z" fill="#8f8a7e"/>
  <g stroke="${PP}" stroke-width="1" opacity=".55">${[...Array(10)].map((_,i)=>`<path d="M${108+i*9} 66 L${112+i*8} 132"/>`).join('')}${[...Array(7)].map((_,i)=>`<path d="M108 ${72+i*10} L196 ${70+i*10}"/>`).join('')}</g><path d="M106 134 L106 64 L198 62 L198 134" fill="none" stroke="${PP}" stroke-width="5"/><path d="M106 134 L106 64 L198 62" fill="none" stroke="${PD}" stroke-width="1.4"/>
  <g transform="rotate(-28 150 92)"><rect x="128" y="84" width="44" height="14" rx="6" fill="${PD}"/><circle cx="178" cy="90" r="7" fill="#d9cfb4" stroke="${PD}" stroke-width="1.6"/><path d="M128 88 L112 80 M130 96 L114 104" stroke="${PD}" stroke-width="6" stroke-linecap="round"/><path d="M170 86 L188 74 M170 94 L190 100" stroke="${PD}" stroke-width="5" stroke-linecap="round"/></g>
  <circle cx="186" cy="74" r="6" fill="${PP}" stroke="${PD}" stroke-width="1.6"/><path d="M183 71 L189 71 L190 76 L186 79 L182 76Z" fill="${PD}"/>
  <g><path d="M54 70 L58 108" stroke="${PD}" stroke-width="13" stroke-linecap="round"/><path d="M56 76 L36 54 M56 76 L80 60" stroke="${PD}" stroke-width="7" stroke-linecap="round"/><path d="M58 108 L44 140 M58 108 L84 128" stroke="${PD}" stroke-width="8" stroke-linecap="round"/><path d="M82 128 L92 126" stroke="${PD}" stroke-width="6" stroke-linecap="round"/><circle cx="52" cy="56" r="9" fill="#5a554c" stroke="${PD}" stroke-width="2"/><path d="M48 76 L64 76 L64 98 L50 98Z" fill="${PP}" opacity=".85"/><text x="56" y="92" text-anchor="middle" font-size="9" font-family="Arial" font-weight="900" fill="${PD}">9</text></g>
  <path d="M96 116 Q130 92 182 76" fill="none" stroke="${PP}" stroke-width="1.6" stroke-dasharray="3 4" opacity=".8"/>`,
 crowd:`<rect width="200" height="160" fill="#8f8a7e"/><path d="M150 0 L156 0 L164 60 L144 60Z" fill="${PD}"/><rect x="138" y="0" width="34" height="14" fill="${PD}"/>${[0,1,2,3].map(i=>`<circle cx="${143+i*8}" cy="7" r="2.4" fill="${PP}"/>`).join('')}
  ${[0,1,2,3,4].map(r=>[...Array(10)].map((_,k)=>{const x=6+k*20+(r%2)*10,y=34+r*26;const cap=(k+r)%3===0;return `<path d="M${x-10} ${y+26} Q${x-10} ${y+9} ${x} ${y+9} Q${x+10} ${y+9} ${x+10} ${y+26}Z" fill="${(k+r)%2?PD:'#3e3a33'}"/>${(k*7+r)%4===0?`<path d="M${x-8} ${y+12} L${x+8} ${y+12} L${x+8} ${y+16} L${x-8} ${y+16}Z" fill="${PP}"/><path d="M${x-4} ${y+12} L${x-4} ${y+16} M${x+2} ${y+12} L${x+2} ${y+16}" stroke="${PD}" stroke-width="2"/>`:''}<circle cx="${x}" cy="${y+3}" r="6.5" fill="#d9cfb4" stroke="${PD}" stroke-width="1.2"/>${cap?`<path d="M${x-7} ${y+1} Q${x} ${y-7} ${x+7} ${y+1} L${x+9} ${y+2} L${x-7} ${y+2}Z" fill="${PD}"/>`:''}`;}).join('')).join('')}
  <path d="M0 96 L200 92" stroke="${PP}" stroke-width="3"/><path d="M40 92 L40 104 M120 90 L120 104" stroke="${PP}" stroke-width="3"/><path d="M60 30 L72 4" stroke="${PD}" stroke-width="3"/><rect x="68" y="0" width="14" height="8" fill="${PD}"/><path d="M118 34 Q132 18 150 30" fill="none" stroke="${PP}" stroke-width="4" stroke-dasharray="6 4"/>`,
 trophy:`<rect width="200" height="160" fill="#8f8a7e"/>${[...Array(30)].map((_,i)=>`<circle cx="${(i*37)%200}" cy="${110+((i*23)%50)}" r="${7+(i%3)}" fill="${i%2?PM:'#5a554c'}"/>`).join('')}
  <path d="M60 160 L64 96 Q100 82 136 96 L140 160Z" fill="#3e3a33"/><path d="M92 92 L92 72 L108 72 L108 92" fill="#d9cfb4"/><circle cx="100" cy="64" r="14" fill="#d9cfb4" stroke="${PD}" stroke-width="2"/><path d="M88 58 Q100 44 112 58" fill="${PD}"/><path d="M93 70 Q100 76 107 70" fill="none" stroke="${PD}" stroke-width="2"/>
  <path d="M64 100 L52 54 M136 100 L148 54" stroke="#3e3a33" stroke-width="12" stroke-linecap="round"/><circle cx="52" cy="50" r="6" fill="#d9cfb4"/><circle cx="148" cy="50" r="6" fill="#d9cfb4"/>
  <path d="M74 10 Q74 46 100 52 Q126 46 126 10Z" fill="${PP}" stroke="${PD}" stroke-width="2.4"/><path d="M80 14 Q80 40 96 48" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/><path d="M74 14 Q52 16 54 32 Q56 44 74 42 M126 14 Q148 16 146 32 Q144 44 126 42" fill="none" stroke="${PD}" stroke-width="4"/><ellipse cx="100" cy="10" rx="26" ry="4" fill="${PP}" stroke="${PD}" stroke-width="2"/>`,
 manager:`<rect width="200" height="160" fill="#8f8a7e"/><rect x="120" y="10" width="70" height="60" fill="${PL}" stroke="${PD}" stroke-width="3"/><path d="M155 10 L155 70 M120 40 L190 40" stroke="${PD}" stroke-width="2"/><rect x="14" y="14" width="44" height="58" fill="#5a554c" stroke="${PD}" stroke-width="2"/><rect x="20" y="20" width="32" height="40" fill="${PL}"/>
  <path d="M0 108 L200 108 L200 160 L0 160Z" fill="#4a463e"/><path d="M0 108 L200 108 L200 114 L0 114Z" fill="#3a362f"/><path d="M52 108 Q54 74 94 70 Q134 74 136 108Z" fill="${PD}"/><path d="M88 72 L100 72 L94 96Z" fill="${PP}"/><path d="M92 76 L96 76 L95 94 L93 94Z" fill="#5a554c"/>
  <circle cx="94" cy="50" r="17" fill="#d9cfb4" stroke="${PD}" stroke-width="2"/><path d="M78 46 Q80 30 96 30 Q110 30 111 44 Q102 38 90 40 Q82 42 78 46Z" fill="${PD}"/><path d="M88 58 Q94 62 100 58" fill="none" stroke="${PD}" stroke-width="2"/><circle cx="88" cy="50" r="1.8" fill="${PD}"/><circle cx="100" cy="50" r="1.8" fill="${PD}"/>
  <path d="M134 104 Q134 92 152 92 Q170 92 170 104Z" fill="${PD}"/><path d="M128 88 Q152 74 176 88" stroke="${PD}" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="30" y="98" width="40" height="10" fill="${PP}" stroke="${PD}" stroke-width="1.6"/><path d="M118 76 Q126 60 138 66" fill="none" stroke="${PP}" stroke-width="2" opacity=".5"/>`,
 sign:`<rect width="200" height="160" fill="#8f8a7e"/><rect x="0" y="0" width="200" height="52" fill="#7b766c"/><rect x="70" y="6" width="60" height="38" fill="#5a554c" stroke="${PD}" stroke-width="2"/><path d="M84 36 Q84 14 100 12 Q116 14 116 36Z" fill="${PL}"/>
  <path d="M0 112 L200 112 L200 160 L0 160Z" fill="#3e3a33"/><path d="M0 112 L200 112 L200 118 L0 118Z" fill="${PD}"/>
  ${[[30,'#3e3a33'],[100,PD],[170,'#4a463e']].map(([x,c],i)=>`<path d="M${x-30} 112 Q${x-28} 76 ${x} 72 Q${x+28} 76 ${x+30} 112Z" fill="${c}"/><circle cx="${x}" cy="56" r="14" fill="#d9cfb4" stroke="${PD}" stroke-width="2"/><path d="M${x-14} 52 Q${x} 34 ${x+14} 52" fill="${i===1?'#5a554c':PD}"/>${i!==1?`<path d="M${x-6} 76 L${x+6} 76 L${x} 92Z" fill="${PP}"/>`:''}`).join('')}
  <g transform="rotate(-4 100 128)"><rect x="66" y="114" width="70" height="40" fill="${PP}" stroke="${PD}" stroke-width="1.6"/><path d="M72 124h58M72 132h58M72 140h34" stroke="${PM}" stroke-width="1.4"/><path d="M108 146 q6 -8 12 0 t12 0" fill="none" stroke="${PD}" stroke-width="1.8"/></g><path d="M118 112 L134 136" stroke="${PD}" stroke-width="5" stroke-linecap="round"/>`,
 stand:`<rect width="200" height="160" fill="${PL}"/><path d="M0 0 L200 0 L200 40 Q100 24 0 44Z" fill="#c4bead"/><path d="M8 54 L192 34 L192 46 L8 66Z" fill="${PD}"/><path d="M14 66 L186 46 L186 128 L14 128Z" fill="#5a554c"/>
  ${[...Array(7)].map((_,r)=>`<path d="M16 ${74+r*8} L184 ${56+r*8}" stroke="${PL}" stroke-width="1.4" opacity=".7"/>${[...Array(16)].map((_,k)=>`<circle cx="${22+k*10.5}" cy="${71+r*8-k*1.1}" r="2.6" fill="${(k+r)%3?PD:'#d9cfb4'}"/>`).join('')}`).join('')}
  ${[30,70,110,150].map(x=>`<path d="M${x} 62 L${x} 128" stroke="${PD}" stroke-width="2.4"/>`).join('')}<path d="M0 128 L200 128 L200 160 L0 160Z" fill="#7b766c"/><path d="M0 134 L200 134" stroke="${PP}" stroke-width="2"/>
  <path d="M186 128 L193 6 L198 128" stroke="${PD}" stroke-width="3" fill="none"/><rect x="180" y="0" width="22" height="12" fill="${PD}"/>${[0,1].map(i=>`<circle cx="${186+i*8}" cy="6" r="2.4" fill="${PP}"/>`).join('')}`};
function picSVG2(k){if(k&&(k.startsWith('chair:')||k.startsWith('rep:')))return picSVG(k);{const ph=newsPhoto(k);if(ph)return ph;}const id='np'+(MEETN++);
  const inner=PICS2[k]||`<rect width="200" height="160" fill="#c9c2b0"/><path d="M0 120 Q100 100 200 120 L200 160 L0 160Z" fill="#a8a296"/><g opacity=".92">${(PICS[k]||PICS.crowd).replace(/#1c1b19/g,'#2e2b26')}</g>`;
  return `<svg viewBox="0 0 200 160" class="np-pic photo" aria-hidden="true"><defs><pattern id="hs-${id}" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="1.6" cy="1.6" r=".8" fill="#1c1b19" opacity=".35"/></pattern><radialGradient id="vg-${id}" cx="50%" cy="50%" r="70%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".35"/></radialGradient></defs>${inner}<rect width="200" height="160" fill="url(#hs-${id})"/><rect width="200" height="160" fill="url(#vg-${id})"/></svg>`;}

/* ---------- hair that sits on the head properly, in a dozen styles ---------- */
SKIN.brown=['#b07a52','#8c5a38','#5e3a22'];SKIN.dark=['#8a5636','#6a3e24','#462614'];
FACE.long='M82 90 C82 54 99 38 120 38 C141 38 158 54 158 90 C159 114 157 132 152 146 C146 164 134 178 120 180 C106 178 94 164 88 146 C83 132 81 114 82 90Z';
const HC={blk:['#1c1a18','#0c0b0a','#4a4640'],dbr:['#3b2a1d','#1f150d','#6b4c33'],mbr:['#6b4a30','#43301f','#9a7250'],lbr:['#8a6a48','#5e4630','#b89470'],gin:['#b5562a','#80391a','#d8804a'],str:['#c9773a','#9a5424','#e8a066'],bld:['#d9b45a','#a8862e','#f0d890'],fai:['#b89a6a','#8a7048','#d8c094'],gry:['#a7a39b','#7c7870','#d0ccc4'],sal:['#7c7870','#55524c','#a7a39b']};
function hairParts(style,hc,x){const [a,b,c]=hc;const S=SW(3);const mir=d=>`<g transform="translate(240 0) scale(-1 1)">${d}</g>`;
  const backFull=`<path d="M68 124 C58 70 82 28 120 26 C158 28 182 70 172 124 L160 124 L160 104 L80 104 L80 124Z" fill="${b}" ${S}/>`;
  const backShort=`<path d="M72 114 C64 70 86 32 120 30 C154 32 176 70 168 114 L160 114 L160 100 L80 100 L80 114Z" fill="${b}" ${S}/>`;
  const sides=`<path d="M74 120 C70 104 72 90 80 82 L86 118Z" fill="${a}" ${SW(2)}/>`+mir(`<path d="M74 120 C70 104 72 90 80 82 L86 118Z" fill="${a}" ${SW(2)}/>`);
  let back=backFull,front='';
  switch(style){
   case 'side':front=`<path d="M72 104 C66 58 90 30 122 30 C156 30 178 58 168 104 L162 104 C160 88 156 76 150 68 C134 76 114 76 96 70 C88 76 82 88 80 104Z" fill="${a}" ${S}/><path d="M150 40 C164 56 168 80 166 100 L162 100 C160 82 156 70 150 62Z" fill="${b}"/><path d="M100 33 Q98 48 95 66" fill="none" stroke="${b}" stroke-width="2.4"/><path d="M108 40 Q132 36 152 54" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M112 50 Q130 48 146 62" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" opacity=".7"/>`;break;
   case 'slick':front=`<path d="M72 100 C68 56 92 30 122 30 C152 30 174 56 168 100 L162 100 C160 84 154 72 146 66 Q132 58 120 64 Q108 58 94 66 C86 72 80 84 78 100Z" fill="${a}" ${S}/><path d="M90 52 Q120 36 152 52" fill="none" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/><path d="M88 62 Q118 48 148 60" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round" opacity=".8"/><path d="M152 44 C164 58 166 78 165 96 L161 96 C160 80 156 68 150 60Z" fill="${b}"/>`;break;
   case 'crop':back=backShort;front=`<path d="M76 96 C72 54 94 34 122 34 C150 34 170 54 166 96 C162 84 156 76 148 72 Q122 66 94 72 C86 76 80 86 76 96Z" fill="${a}" ${S}/>${[...Array(14)].map((_,i)=>`<circle cx="${90+(i*13)%60}" cy="${44+(i*7)%22}" r="1.2" fill="${c}"/>`).join('')}<path d="M150 44 C162 56 166 76 165 92 L161 92 C160 78 156 68 150 62Z" fill="${b}"/>`;break;
   case 'quiff':front=`<path d="M72 100 C66 56 84 22 118 18 C152 16 176 40 168 100 L162 100 C160 84 154 74 146 70 Q124 62 100 68 C90 72 82 84 78 100Z" fill="${a}" ${S}/><path d="M100 28 Q118 12 142 22" fill="none" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/><path d="M96 40 Q116 28 146 36" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" opacity=".7"/><path d="M152 34 C166 50 168 76 166 96 L162 96 C160 80 156 66 150 58Z" fill="${b}"/>`;break;
   case 'wavy':front=`<path d="M72 104 C64 60 82 36 98 34 Q106 22 118 28 Q128 18 140 28 Q152 24 158 38 C174 52 176 78 168 104 L162 104 C160 88 156 76 150 70 C134 76 114 76 96 70 C88 76 82 88 80 104Z" fill="${a}" ${S}/>${[[96,46],[116,40],[136,42],[106,58],[128,56],[148,54]].map(([x,y])=>`<path d="M${x-6} ${y} q6 -6 12 0" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`).join('')}<path d="M154 48 C166 62 168 82 166 100 L162 100 C160 84 156 72 150 64Z" fill="${b}"/>`;break;
   case 'spiky':back=backShort;front=`<path d="M74 98 C70 62 78 46 86 40 L78 20 L98 32 L100 8 L116 28 L124 4 L134 28 L148 10 L146 34 L164 26 L156 46 C166 58 170 74 166 98 C162 84 156 74 148 70 Q122 62 96 70 C86 74 80 84 74 98Z" fill="${a}" ${S}/><path d="M104 32 L108 18 M124 30 L130 18 M142 36 L150 26" stroke="${c}" stroke-width="2.4" stroke-linecap="round"/>`;break;
   case 'mop':front=`<path d="M66 118 C56 58 88 26 122 26 C158 26 186 58 174 118 C170 104 164 94 158 90 C150 94 142 94 134 88 C124 94 112 94 104 88 C96 94 88 94 82 90 C76 96 70 106 66 118Z" fill="${a}" ${S}/><path d="M96 40 C112 32 136 32 152 42" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>${[96,112,128,144].map(x=>`<path d="M${x} 56 Q${x+2} 72 ${x-2} 86" fill="none" stroke="${b}" stroke-width="2"/>`).join('')}`;break;
   case 'long':back=`<path d="M62 178 C40 80 80 22 120 22 C160 22 200 80 178 178 L158 178 L158 110 L82 110 L82 178Z" fill="${b}" ${S}/>`;
     front=`<path d="M60 160 C44 70 86 24 122 24 C160 24 198 70 180 160 C176 130 170 108 162 96 C150 96 138 90 128 80 Q120 92 112 80 C102 90 90 96 78 96 C70 108 64 130 60 160Z" fill="${a}" ${S}/><path d="M120 28 Q118 50 120 78" fill="none" stroke="${b}" stroke-width="2.4"/>${[84,100,140,156].map(x=>`<path d="M${x} 50 Q${x+(x<120?-6:6)} 90 ${x+(x<120?-10:10)} 130" fill="none" stroke="${c}" stroke-width="2" opacity=".7"/>`).join('')}`;break;
   case 'curly':front=`<path d="M74 100 C66 56 92 30 122 30 C152 30 176 56 168 100 C160 86 150 78 140 76 Q120 70 100 76 C88 80 80 88 74 100Z" fill="${a}" ${SW(2.6)}/>${[[78,90],[78,76],[82,62],[90,50],[100,40],[112,34],[124,32],[136,34],[148,40],[156,50],[162,62],[164,76],[162,90],[98,58],[112,50],[126,48],[140,52],[150,62],[106,70],[120,64],[134,66],[92,72],[146,74]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7.5" fill="${a}" ${SW(1.8)}/><path d="M${x-5} ${y-2} q5 -5 10 0" fill="none" stroke="${c}" stroke-width="2"/>`).join('')}`;break;
   case 'afro':back=`<path d="M64 112 C54 54 88 18 120 18 C152 18 186 54 176 112 L160 112 L160 100 L80 100 L80 112Z" fill="${b}" ${S}/>`;front=`<path d="M70 98 C62 50 92 22 120 22 C148 22 178 50 170 98 C164 86 156 78 150 74 Q120 66 90 74 C84 78 76 86 70 98Z" fill="${a}" ${S}/>${[...Array(40)].map((_,i)=>`<circle cx="${80+(i*17)%80}" cy="${32+(i*11)%42}" r="1.6" fill="${c}" opacity=".8"/>`).join('')}`;break;
   case 'recede':back=backShort;front=`<path d="M74 98 C70 54 94 32 122 32 C150 32 170 54 166 98 C162 84 158 70 152 60 Q140 66 128 58 Q120 64 112 58 Q100 66 88 60 C82 70 78 84 74 98Z" fill="${a}" ${S}/><path d="M96 44 Q120 36 146 46" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`;break;
   case 'flat':back=backShort;front=`<path d="M80 88 C78 52 96 36 120 36 C144 36 162 52 160 88 C152 76 140 70 120 68 C100 70 88 76 80 88Z" fill="${a}" ${SW(2.4)} opacity=".9"/>${[...Array(18)].map((_,i)=>`<circle cx="${88+(i*11)%64}" cy="${44+(i*7)%22}" r="1" fill="${b}"/>`).join('')}`;break;
   case 'combover':back=sides;front=sides+`<path d="M84 60 Q116 38 158 56" fill="none" stroke="${a}" stroke-width="3.4" stroke-linecap="round"/><path d="M86 66 Q118 46 156 62" fill="none" stroke="${a}" stroke-width="2.6" stroke-linecap="round"/><path d="M90 72 Q120 54 152 68" fill="none" stroke="${a}" stroke-width="2" stroke-linecap="round" opacity=".8"/><path d="M104 46 Q114 42 124 44" fill="none" stroke="#fff" stroke-width="3" opacity=".35"/>`;break;
   case 'bald':back=sides;front=sides+`<path d="M100 48 Q114 42 128 46" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".35"/>`;break;}
  if(x&&x.burns)front+=`<path d="M80 96 L80 126 L87 126 L87 98Z" fill="${a}" ${SW(1.6)}/>`+mir(`<path d="M80 96 L80 126 L87 126 L87 98Z" fill="${a}" ${SW(1.6)}/>`);
  return {back,front};}
/* the famous faces of the decade: [skin, hair colour, style (or [[from year, style],...]), face, extras] */
const REALLOOK={
 'Denis Law':['fair','bld','spiky','normal',{mouth:'grin'}],'Bobby Moore':['light','bld','wavy','square',{}],'Bobby Charlton':['fair','lbr','combover','normal',{}],
 'Jimmy Greaves':['light','blk','slick','normal',{mouth:'smirk'}],'Gordon Banks':['ruddy','dbr','side','square',{}],'Dave Mackay':['ruddy','dbr','crop','square',{browW:2.8}],
 'Danny Blanchflower':['fair','dbr','wavy','long',{}],'John White':['fair','mbr','side','normal',{}],'Geoff Hurst':['light','dbr','side','square',{}],
 'Peter Bonetti':['light','dbr','slick','long',{}],'Johnny Haynes':['light','blk','slick','normal',{mouth:'smirk'}],'Billy Bremner':['fair','gin','curly','normal',{freck:1}],
 'Cliff Jones':['light','dbr','side','normal',{}],'Jimmy McIlroy':['fair','dbr','recede','normal',{}],'Johnny Giles':['fair','lbr','recede','normal',{}],
 'Francis Lee':['ruddy','mbr',[[1960,'side'],[1967,'wavy']],'round',{burns:1967}],'Alan Mullery':['light','dbr','side','square',{}],'Roger Hunt':['fair','dbr','crop','normal',{}],
 'Nobby Stiles':['fair','lbr','flat','normal',{mouth:'gap'}],'George Cohen':['fair','fai','recede','square',{}],'Jimmy Armfield':['light','dbr','slick','long',{}],
 'Ray Wilson':['fair','fai','recede','normal',{}],'Jack Charlton':['fair','mbr','recede','long',{}],'Brian Clough':['light','dbr','side','normal',{mouth:'smirk'}],
 'Terry Venables':['light','blk','slick','normal',{mouth:'grin'}],'Stanley Matthews':['ruddy','sal','bald','long',{old:1}],
 'George Best':['light','blk',[[1960,'mop'],[1967,'long']],'normal',{burns:1968}],'Martin Peters':['light','dbr','slick','normal',{}],'Alan Ball':['fair','str','side','normal',{freck:1}],
 'Colin Bell':['light','dbr','mop','normal',{}],'Jim Baxter':['fair','dbr','side','normal',{mouth:'smirk'}],'Peter Osgood':['light','dbr',[[1960,'mop'],[1968,'long']],'long',{burns:1967}],
 'Pat Jennings':['light','blk','side','long',{}],'Ian St John':['ruddy','blk','crop','normal',{}],'Ron Yeats':['ruddy','fai','crop','square',{}],
 'Tommy Smith':['ruddy','dbr','crop','square',{}],'Norman Hunter':['light','mbr','side','normal',{}],'Mike Summerbee':['light','dbr','mop','normal',{}],
 'Peter Lorimer':['light','dbr','side','normal',{}],'Albert Johanneson':['dark','blk','afro','normal',{}],'Kevin Keegan':['fair','mbr','curly','normal',{}],
 'Alan Gilzean':['fair','dbr','recede','long',{}],'Alex Young':['fair','bld','side','normal',{}],'Bert Trautmann':['light','bld','slick','square',{old:1}],
 'Harry Gregg':['ruddy','dbr','recede','square',{}],'Bobby Robson':['light','dbr','side','normal',{}],'Ian Callaghan':['fair','mbr','side','normal',{}],
 'Peter Thompson':['light','dbr','mop','normal',{}],'Howard Kendall':['light','mbr','mop','normal',{}],'Brian Kidd':['light','dbr','mop','normal',{burns:1968}],
 'Frank McLintock':['fair','dbr','side','square',{}],'Mike England':['fair','dbr','side','long',{}],'Brian Labone':['fair','fai','side','long',{}],
 'Bobby Tambling':['light','dbr','side','normal',{}],'George Eastham':['light','dbr','slick','long',{}],'Ron Springett':['light','dbr','slick','normal',{}],
 'Eusébio':['dark','blk','afro','normal',{}],'Mário Coluna':['dark','blk','afro','long',{}],'Alfredo Di Stéfano':['olive','dbr','recede','long',{}],
 'Ferenc Puskás':['olive','blk','slick','round',{}],'Francisco Gento':['olive','blk','slick','normal',{}],'Gianni Rivera':['olive','blk','slick','normal',{}],
 'Sandro Mazzola':['olive','blk','side','long',{}],'Giacinto Facchetti':['olive','blk','side','long',{}],'Luis Suárez':['olive','blk','slick','normal',{}],
 'Franz Beckenbauer':['light','mbr','side','normal',{}],'Gerd Müller':['fair','blk','mop','round',{}],'Johan Cruyff':['light','dbr',[[1960,'mop'],[1968,'long']],'long',{}],
 'Uwe Seeler':['ruddy','fai','recede','round',{}],'Jimmy Johnstone':['fair','gin','curly','round',{freck:1}],'Billy McNeill':['fair','fai','side','square',{}],
 'John Charles':['ruddy','dbr','side','square',{}],'Josef Masopust':['light','dbr','recede','normal',{}],'Flórián Albert':['olive','blk','side','normal',{}],
 'José Altafini':['olive','blk','slick','round',{}],'Omar Sívori':['olive','blk','mop','normal',{}],'Kurt Hamrin':['fair','bld','side','normal',{}],
 'Paul Van Himst':['fair','fai','side','normal',{}],'Raymond Kopa':['olive','blk','slick','normal',{}],'Just Fontaine':['olive','blk','slick','normal',{}],
 'Amancio':['olive','blk','side','normal',{}],'José Santamaría':['olive','blk','slick','square',{}],'Sepp Maier':['light','mbr','side','normal',{}],'Coen Moulijn':['fair','mbr','slick','normal',{}]};
function realLook(p){const R=REALLOOK[p.n];if(!R||!p.real)return null;const [sk,hcK,st,face,x]=R;const style=Array.isArray(st)?st.filter(([y])=>G.year>=y).pop()[1]:st;
  return {skin:SKIN[sk],hc:HC[hcK],style,face,x:{...x,burns:x.burns&&G.year>=x.burns}};}
function genericHair(p,r,pk){const a=age(p);const y=G.year;const hcK=pk(['dbr','dbr','dbr','blk','blk','mbr','mbr','lbr','fai','bld','gin','str']);
  let style;if(a>=33)style=pk(['recede','recede','slick','side','combover','bald','crop']);else if(a>=29)style=pk(['recede','slick','side','side','crop','wavy']);
  else if(y>=1967&&a<=26)style=pk(['long','mop','mop','side','curly','wavy']);else if(y>=1964&&a<=27)style=pk(['mop','mop','side','slick','quiff','crop','wavy']);else style=pk(['side','side','slick','slick','crop','quiff','wavy','curly','spiky']);
  return {hc:HC[a>=36&&r()<0.4?'sal':hcK],style,burns:y>=1966&&a<=28&&r()<0.35};}

/* ---------- the season in review: the papers, the wireless, the chairman and the terraces ---------- */
const scoreLine=f=>`${cn(f.h)} ${f.hg}-${f.ag} ${cn(f.a)}`;
function reviewData(summ,T){const me=U();const d=summ.user.div;const t=T[d];const pos=summ.user.pos;const n=t.length;
  const lg=G.fx.filter(f=>f.comp==='L'&&f.div===d);const lastDate=lg.reduce((m,f)=>f.date>m?f.date:m,'');
  const rows={};G.divs[d].forEach(id=>rows[id]={id,pts:0,f:0,a:0});lg.filter(f=>f.p&&f.date<lastDate).forEach(f=>{const H=rows[f.h],A=rows[f.a];if(!H||!A)return;H.f+=f.hg;H.a+=f.ag;A.f+=f.ag;A.a+=f.hg;if(f.hg>f.ag)H.pts+=2;else if(f.hg<f.ag)A.pts+=2;else{H.pts++;A.pts++;}});
  const before=Object.values(rows).sort((x,y)=>y.pts-x.pts||gavg(y)-gavg(x)||y.f-x.f);const posB=before.findIndex(r=>r.id===me)+1;
  const myLast=lg.find(f=>f.date===lastDate&&(f.h===me||f.a===me));const Z=[1,2,2,4][d];const D=d===3?n-4:n-(d<=1?2:4);const drop=x=>x>D;let final=null;
  if(d===0){if(pos===1&&posB>1)final='title_won';else if(posB===1&&pos>1)final='title_lost';}else{if(pos<=Z&&posB>Z)final='promo_won';else if(posB<=Z&&pos>Z)final='promo_lost';}
  if(!final){if(!drop(pos)&&drop(posB))final='escape';else if(drop(pos)&&!drop(posB))final='doomed';}
  if(!final&&d===0&&pos===2&&t[0].pts-t[1].pts<=1)final='title_close';
  const S=sq(me);const top=S.slice().sort((a,b)=>b.gls-a.gls)[0];const star=S.filter(p=>p.apps>=15).sort((a,b)=>b.rs/b.apps-a.rs/a.apps)[0];
  const mine=G.fx.filter(f=>f.p&&isUserFx(f));const marg=f=>{const h=f.h===me;return (h?f.hg:f.ag)-(h?f.ag:f.hg);};
  const best=mine.slice().sort((a,b)=>marg(b)-marg(a))[0],worst=mine.slice().sort((a,b)=>marg(a)-marg(b))[0];
  return {y:summ.y,club:me,div:d,pos,posB,exp:summ.user.exp,pts:summ.user.pts,final,last:myLast&&myLast.p?scoreLine(myLast):null,lastWon:myLast&&myLast.p?marg(myLast)>0:false,lastLost:myLast&&myLast.p?marg(myLast)<0:false,
    top:top&&top.gls?{n:top.n,g:top.gls}:null,star:star?{n:star.n,r:(star.rs/star.apps).toFixed(2)}:null,best:best&&marg(best)>0?scoreLine(best):null,worst:worst&&marg(worst)<0?scoreLine(worst):null,
    promoted:[].concat(...summ.promoted).includes(me),relegated:[].concat(...summ.relegated).includes(me),champ:summ.champs[d]===me,
    fa:cupReached(me),lc:G.lc?lcReached(me):null,eu:euReached(),won:[summ.cup===me?'the FA Cup':'',G.lc&&G.lc.winner===me?'the League Cup':'',/Winners/.test(euReached()||'')?'the '+(euReached()||'').split(':')[0]:''].filter(Boolean),lostFinal:[cupReached(me)==='Lost in the Final'?'the FA Cup final':'',G.lc&&lcReached(me)==='Lost in the Final'?'the League Cup final':''].filter(Boolean),champs:summ.champs.slice(),cup:summ.cup,lcw:G.lc&&G.lc.winner,scor:summ.scor[0],down:summ.relegated[0].slice(),leader:t[0].id,gap:t[0].pts-t[1].pts};}
function rvHead(R){const C=club(R.club).s.toUpperCase();return {title_lost:`HEARTBREAK FOR ${C}`,title_won:`${C} SNATCH THE TITLE!`,promo_won:`${C} UP ON THE FINAL DAY`,promo_lost:`${C} MISS OUT AT THE DEATH`,escape:'THE GREAT ESCAPE',doomed:`${C} GO DOWN ON THE LAST DAY`,title_close:`SO NEAR FOR ${C}`}[R.final]
  ||(R.champ&&R.won.length?`${C} DO THE DOUBLE!`:R.champ?`${C} ARE CHAMPIONS`:R.won.length?`${C} LIFT ${R.won[0].replace('the ','THE ').toUpperCase()}`:R.promoted?`${C} ARE GOING UP`:R.relegated?`${C} RELEGATED`:R.pos<=R.exp-3?`${C} BEAT ALL EXPECTATIONS`:R.pos>=R.exp+4?`A SEASON TO FORGET AT ${club(R.club).g.toUpperCase()}`:`${C}: THE SEASON IN REVIEW`);}
function rvLede(R){const c=club(R.club);const lead=cn(R.leader);const by=R.gap?`by ${R.gap} point${R.gap===1?'':'s'}`:'on goal average';const L=R.last?` ${R.last}.`:'';
  return {title_lost:`${c.n} went into the final day of the season top of ${DIVN[R.div]}, and came away with nothing.${L} ${lead} are champions ${by}, and a town that had the bunting ready has put it quietly back in the loft.`,
   title_won:`Nobody gave them a chance this morning. ${c.n} started the final day ${ord(R.posB)} and finished it as champions of ${DIVN[R.div]}.${L} The celebrations will go on for some time.`,
   promo_won:`${c.n} began the last afternoon outside the promotion places and ended it going up.${L} The terraces emptied on to the pitch at the final whistle.`,
   promo_lost:`It was in their hands. ${c.n} began the final day in the promotion places and finished it ${ord(R.pos)}.${L} There were tears on the terraces.`,
   escape:`They were as good as down. ${c.n} started the final day in the relegation places and survived.${L} Nobody who was there will forget it.`,
   doomed:`${c.n} went into the last match clear of danger and came out of it relegated.${L} A cruel end to a long, hard season.`,
   title_close:`${c.n} finished second in ${DIVN[R.div]}, ${R.gap?`${R.gap} point${R.gap===1?'':'s'}`:'on goal average'} behind ${lead}. So near, and yet so far.`}[R.final]
  ||(R.champ?`${c.n} are champions of ${DIVN[R.div]}, and deservedly so.`:R.promoted?`${c.n} will play in ${DIVN[R.div-1]} next season, and not before time.`:R.relegated?`${c.n} have been relegated from ${DIVN[R.div]}. It has been a long, unhappy winter.`:`${c.n} finished ${ord(R.pos)} in ${DIVN[R.div]} with ${R.pts} points.`)+(R.won.length?` And there is silverware: ${c.s} won ${R.won.join(' and ')}.`:'')+(R.lostFinal.length?` They reached ${R.lostFinal.join(' and ')}, and lost it.`:'');}
function rvPaper(R){const rp=REPORTERS[R.y%REPORTERS.length];const PS=PAPERSTYLE[rp.look]||PAPERSTYLE.std;const V=voiceOf(rp);const c=club(R.club);
  const paras=[rvLede(R),`The board expected ${ord(R.exp)}. ${c.s} finished ${ord(R.pos)}, with ${R.pts} points. ${R.champ||R.promoted?'Exactly what the board asked for.':R.pos<=R.exp-2?'Nobody in the boardroom is complaining.':R.pos>=R.exp+3?'The directors will want to know why.':'About what was expected, give or take.'}`,
    R.top?`${R.top.n} was top scorer with ${R.top.g} goal${R.top.g===1?'':'s'}${R.star&&R.star.n!==R.top.n?`, and ${R.star.n} was the pick of the side, with an average rating of ${R.star.r}`:R.star?`, and the best player in the side all season`:''}.`:'',
    [R.best?`The high point: ${R.best}.`:'',R.worst?`The low point: ${R.worst}.`:''].filter(Boolean).join(' '),
    `In the FA Cup: ${R.fa.toLowerCase()}.${R.lc?` In the League Cup: ${R.lc.toLowerCase()}.`:''}${R.eu?` In Europe: ${R.eu.replace(/^[^:]*: /,'').toLowerCase()}.`:''}`].filter(Boolean);
  const pk=R.champ||R.final==='title_won'?'trophy':R.final==='title_lost'||R.final==='promo_lost'||R.relegated?'crowd':'goal';
  const stop=[`${cn(R.champs[0])} are League champions`,`${cn(R.cup)} won the FA Cup`,R.lcw?`${cn(R.lcw)} took the League Cup`:'',`Going down: ${R.down.map(cn).join(' and ')}`,R.scor?`Top scorer: ${R.scor.n} (${R.scor.g})`:''].filter(Boolean);
  return `<article class="paper np-${rp.look} rv-paper"><header class="np-mast"><span class="np-side">End of season special<br>${seasonLbl(R.y)}</span><h2>${esc(rp.o)}</h2><span class="np-side r">Price <span class="np-price">${PS.price+Math.floor(Math.max(0,G.year-1960)/4)}d</span><br>${esc(fmtDate(G.date))}</span></header>
   <div class="np-rule"><span>The season in review</span><span>${esc(PS.rule)}</span></div><h3 class="np-head">${esc(rvHead(R))}</h3>
   <div class="np-cols"><figure class="np-photo">${picSVG2(pk)}<figcaption>${esc(cn(R.club))}, ${seasonLbl(R.y)}</figcaption></figure>
    <div class="np-text">${paras.map((p,i)=>`<p class="${i?'':'np-lede'}">${esc(p)}</p>`).join('')}${V?`<p class="np-sign">${esc(V.sign[R.y%V.sign.length])}</p>`:''}<p class="np-by">By ${esc(rp.n)}</p></div>
    <aside class="np-stop"><b>Around the League</b>${stop.map(s=>`<p>${esc(s)}</p>`).join('')}</aside></div></article>`;}
function rvWire(R){const c=club(R.club);const M=G.user.name;
  const mine={title_lost:`And spare a thought for ${c.n}, who were top of the table at three o'clock and finished the afternoon ${ord(R.pos)}. Football can be a cruel game.`,title_won:`What a day for ${c.n}, champions on the very last afternoon. ${M} will not be buying his own drinks for some time.`,
   promo_won:`${c.n} are promoted at the last, and ${M} has been carried shoulder-high from the pitch.`,promo_lost:`Disappointment for ${c.n}, who slipped out of the promotion places on the final day.`,escape:`${c.n} have escaped relegation on the final afternoon. One imagines the manager will need a quiet summer.`,
   doomed:`${c.n} are relegated, having started the day in safety. A bitter blow.`,title_close:`${c.n} finish runners-up, so very close to the championship.`}[R.final]
   ||(R.champ?`Congratulations to ${c.n}, champions of ${DIVN[R.div]}.`:R.promoted?`${c.n} are promoted, and deservedly so.`:R.relegated?`${c.n} go down. They will hope to be back before long.`:(R.won.length?`${c.n} finish ${ord(R.pos)} and take home ${R.won.join(' and ')}. A season to remember for ${M}.`:null)||`${c.n} finish ${ord(R.pos)}. ${R.pos<=R.exp-2?'A season of real progress for '+M+'.':R.pos>=R.exp+3?M+' will be glad to see the back of this one.':'A steady season.'}`);
  return [`Good evening. The football season is over, and here is Sports Report's look back.`,`${cn(R.champs[0])} are champions of the Football League, and ${cn(R.cup)} have won the FA Cup.${R.lcw?` The League Cup went to ${cn(R.lcw)}.`:''}`,`Going down from the First Division: ${R.down.map(cn).join(' and ')}.`,mine,'That is all from Sports Report for another season. Good night.'];}
function rvChairOpen(R,ch){const P=ch.pearsey;return {title_lost:P?'To come so close, dear boy. One has hardly slept. This behaviour, I am afraid, was unbecoming at the very last.':'To come so close and lose it on the last day. I have hardly slept.',title_won:P?'Champions. One shall say it again, quietly, over the port: champions.':'Champions. I shall keep saying it until somebody stops me.',
  promo_won:P?'Promoted, and at the last gasp. Splendid theatre, dear boy, though one\'s heart is not what it was.':'Promoted, on the last afternoon. My heart will never be the same.',promo_lost:'We had it, and we let it go. That is the hardest part.',escape:P?'One was rather hoping not to need the smelling salts this season.':'We survived. Just. Let us never do that again.',doomed:'Relegation. I never thought I would see it, and certainly not like that.'}[R.final]
  ||(R.won.length?`${R.won.join(' and ').replace(/^t/,'T')} in the boardroom cabinet. That is what this club is about.`:R.champ?'Champions. Exactly what this club deserves.':R.promoted?'Promotion. Well done.':R.relegated?'Relegation. I am bitterly disappointed.':R.pos<=R.exp-2?'A fine season, better than we hoped.':R.pos>=R.exp+3?'Not good enough. We expected far more.':'A steady season.');}
const RVCHAIR=[['I need more money to compete next season.',R=>{const u=G.user;if(u.conf>=60){const add=roundFee(u.budget.transfer*0.12);u.budget.transfer+=add;return `He nods slowly. "Very well. Another ${money(add)} for transfers. Do not waste it."`;}bumpConf(-2);return '"Money? After a season like that?" The temperature in the room drops a few degrees.';}],
 ['We will do better next season. You have my word.',R=>{bumpConf(R.pos>=R.exp?2:0.5);return 'He shakes your hand. "I shall hold you to that."';}],
 ['Thank you for your support, Mr Chairman.',R=>{bumpConf(1);return '"That is what a board is for," he says, and offers you a cigar.';}]];
function rvLetters(R){const pool={title_lost:['I cried on the way home from the ground, and I am not ashamed to say it. We will be back.','Thank you, lads, for the best season in years. The last day will hurt for a long time, but I would not swap it.','We had one hand on the trophy. My wife says I have not said a word since Saturday.'],
  title_won:['Champions! I have waited forty years to write that word in a letter.','I was on the pitch at the final whistle and I have still got a bit of the goalmouth in a jam jar.','Thank you to every one of the lads. They have given this town a season it will never forget.'],
  promo_won:['Up! And on the last day too. My nerves are in tatters, but who cares?','I am going to every away game next season, starting with the biggest grounds I can find.'],
  promo_lost:['So close. We will go up next year, mark my words.','Missing out on the last day is the cruellest thing in football. Chin up, lads.'],
  escape:['My nerves will never recover from that last afternoon. What a finish.','I had my head in my hands at half-time and my hat in the air at full-time. That is football.'],
  doomed:['Down, on the last day. I shall be there in August all the same.','I do not know what to say. I have supported this club through thick and thin, and this is very thin.']};
  if(R.final==='title_won')pool.title_won=pool.title_won.concat(['Never in my life have I seen a finish like it. Thank you, thank you, thank you.']);
  pool.cup=['A trophy! I have never been prouder to wear my scarf.','I was there when we lifted it, and I shall tell my grandchildren about it.','What a day out. The coach home took six hours and nobody stopped singing.'];pool.final=['To lose in the final hurts, but what a run it was. Thank you, lads.'];
  const gen=R.won.length?pool.cup:R.champ?pool.title_won:R.promoted?pool.promo_won:R.relegated?pool.doomed:R.pos<=R.exp-2?['What a season. The best I can remember, and I have been coming since before the war.','Well done to the manager. He has done more with this lot than anybody thought possible.']:R.pos>=R.exp+3?['A poor season, and the manager knows it. Things must improve.','I have paid my money all season to watch that. Something has to change.']:['A middling season. Neither one thing nor the other, much like the pies.','Steady enough. Next year, let us have a proper go at something.'];
  const extra=['Whatever happens next season, I shall be there in August with my flask and my rattle.','A word for the tea ladies, who kept us going through the coldest winter I can remember.','Roll on August.'];
  const ls=shuffle((pool[R.final]||[]).concat(gen,R.lostFinal.length?pool.final:[])).slice(0,3);while(ls.length<3)ls.push(extra[ls.length]);return ls.map(t=>({t,n:pick(SIGNOFFS)(),a:pick(AREAS)}));}
function vReview(){const RV=G.review;if(!RV){UI.screen='season';return vSeason();}const R=RV.data;const ch=chairOf(U());const steps=['paper','wire','chair','fans'];const st=steps[RV.i]||'done';const sack=G.sacked;
  const nav=(lbl)=>`<div class="row gap center rv-nav"><span class="muted sm">${RV.i+1} of ${steps.length}</span><button class="btn go big" data-a="rvnext">${lbl} ▸</button></div>`;let body='';
  if(st==='paper')body=rvPaper(R)+nav('Turn on the wireless');
  else if(st==='wire')body=`<article class="wireless rv-wire"><div class="wl-set" aria-hidden="true"><div class="wl-grille"></div><div class="wl-dial"><span>LONG</span><span>MEDIUM</span><span>LIGHT</span><i></i></div><div class="wl-knobs"><b></b><b></b></div></div>
    <div class="wl-body"><div class="wl-por">${portrait(LOOKS.bbc)}<p class="pc-rep"><strong>${esc(WIRE.n)}</strong><small>${esc(WIRE.o)} · Sports Report</small></p></div><div class="wl-text"><p class="eyebrow">On the wireless · the season round-up</p>${rvWire(R).map((l,i)=>`<p class="${i===3?'wl-hl':''}">${esc(l)}</p>`).join('')}</div></div></article>`+nav(sack?'Face the board':'Go and see the chairman');
  else if(st==='chair'){const open=rvChairOpen(R,ch);const mood=chairSay(G.user.conf>=70?'good':G.user.conf<35?'bad':'neutral');
    body=`<section class="panel rv-chair"><div class="rv-chair-por">${portrait(chairLook(U()))}</div><div><p class="eyebrow">The chairman's office · ${esc(club(U()).g)}</p><h2 class="h1">${esc(ch.n)}</h2>
      <blockquote class="chairquote">"${esc(open)}"</blockquote>${sack?`<p>${esc(chairSay('sack'))}</p>`:`<blockquote class="chairquote">"${esc(mood)}"</blockquote>
      ${G.user.obj&&G.user.obj.y===R.y?'':''}<p>${ch.pearsey?'"Your budget for next season, dear boy:':'"The board have set your budget for next season:'} ${money(G.user.budget.transfer)} for transfers and ${money(G.user.budget.wage)} a week in wages."</p>
      ${RV.chairRes?`<p class="stamp">${esc(RV.chairRes)}</p>`:`<div class="talkbtns">${RVCHAIR.map(([t],i)=>`<button class="btn" data-a="rvchair" data-i="${i}">${esc(t)}</button>`).join('')}</div>`}`}</div></section>`+((RV.chairRes||sack)?nav('Hear from the supporters'):'');}
  else if(st==='fans'){const sec=secretaryOf();const poy=sq(U()).concat(Object.values(G.players).filter(p=>p.c!==U())).find(p=>(p.awards||[]).some(a=>/Supporters' Player/.test(a.t)&&a.y===R.y&&a.c===R.club));const L=rvLetters(R);
    body=`<section class="panel letters rv-fans"><p class="eyebrow">The supporters' verdict · ${seasonLbl(R.y)}</p><h2 class="h1">${moodWord(fans())}</h2><p>${esc(sec.n)}, secretary of the supporters' club: "${esc(fans()>=65?'The members are proud of this team, and proud of this club.':fans()<35?'The members are angry, and I cannot say I blame them.':'The members have seen better seasons and worse ones. Most of them have already renewed.')}"</p>
     ${poy?`<p class="rv-poy">🏅 <strong>Supporters' Player of the Year: ${esc(poy.n)}</strong></p>`:''}
     ${L.map((l,i)=>`<blockquote class="letter"><div class="lt-por">${supporterArt((i+R.y)%FANLOOKS.length,i)}</div><div><p>${esc(l.t)}</p><footer>${esc(l.n)}, ${esc(l.a)}</footer></div></blockquote>`).join('')}</section>`+nav('On to the season summary');}
  return `<div class="review">${body}</div>`;}

function cupMoneyHTML(){const L=G.user.cupLog||[];const tot=L.reduce((t,x)=>t+x.share,0);
  return `<section class="panel"><h3 class="h2 first">Cup money</h3>${L.length?`<p class="sm">This season's cup runs have brought in <strong>${money(tot)}</strong>. In the FA Cup and the League Cup the gate is split between the two clubs, 45% each, with the rest going to the competition. In Europe the home club keeps its gate.</p>
   <div class="tw"><table class="tbl"><thead><tr><th class="l">Date</th><th class="l">Tie</th><th class="l">Opponents</th><th class="l">Ground</th><th class="r">Crowd</th><th class="r">Gate</th><th class="r">Our share</th></tr></thead><tbody>${L.map(x=>`<tr><td class="l">${fmtDate(x.d,true)}</td><td class="l">${esc(compLbl({comp:x.comp,eu:x.eu,r:x.r,leg:x.leg}))}${x.replay?' (replay)':''}</td><td class="l">${crest(x.opp,'sm')} ${esc(cn(x.opp))}</td><td class="l">${esc(x.venue)}</td><td class="r">${x.att.toLocaleString('en-GB')}</td><td class="r">${money(x.total)}</td><td class="r"><strong>${money(x.share)}</strong></td></tr>`).join('')}<tr class="me"><td class="l" colspan="6">Total this season</td><td class="r"><strong>${money(tot)}</strong></td></tr></tbody></table></div>`:'<p class="muted">No cup money yet this season. A good run, and especially a final at Wembley, is worth a great deal.</p>'}</section>`;}
/* ---------- the dressing room, and how a decision lands ---------- */
function roomOf(){const S=sq(U());const xi=G.user.xi.map(id=>G.players[id]).filter(Boolean);const avgA=xi.reduce((t,p)=>t+age(p),0)/Math.max(1,xi.length);const mor=S.reduce((t,p)=>t+p.mor,0)/Math.max(1,S.length);const cap=captain();
  const type=cap&&isLeader(cap)&&avgA>=26.5?'strict':avgA<=24.5?'young':'mixed';
  return {type,mor,word:`${type==='strict'?'Old heads, run by the captain':type==='young'?'Young and lively':'A mix of old and young'}${mor>=75?', in good heart':mor<50?', low':''}`};}
const TEMPW={fiery:'Fiery',steady:'Steady',calm:'Calm'};
/* kind: firm, soft or deal. sev: 1 a slap on the wrist, 3 a scandal. pub: the papers have it */
function settle(p,kind,sev,pub){const T=temper(p),rel=relOf(p),room=roomOf(),f=fans();const out=[];const ev=everyone;
  if(kind==='firm'){let m=-4*sev;if(T==='calm')m+=2;if(rel>=60){m=Math.round(m/2);out.push(pick(['He takes it on the chin. "Fair enough, boss. I let you down."','He nods. He knows you are right, and he respects you for it.']));}
      else if(T==='fiery'){m-=4;relAdj(p,-4);if(rel<40&&rand()<0.3){p.listed=true;out.push('He goes red in the face, slams the door and puts in a written transfer request. He is on the list.');}else out.push(pick(['He tells you exactly what he thinks of that, at some length.','He storms out. You hear him kick a bucket across the boot room.']));}
      else out.push(T==='calm'?'He accepts it quietly. "It won\'t happen again."':'He is not happy, but he takes it.');
      p.mor=clamp(p.mor+m,5,100);
      if(room.type==='strict'){ev(1.5);out.push('The senior pros nod. That is how a club should be run.');}else if(room.type==='young'&&sev===1){ev(-1);out.push('Some of the younger lads think you have gone over the top.');}else ev(0.5);
      if(pub){const c=club(U());c.fans=clamp(f+(f<45?2:1),0,100);out.push(f<45?'The terraces approve: at last, a manager who stands for no nonsense.':'The papers report that the manager has dealt with it.');}}
  else if(kind==='soft'){p.mor=clamp(p.mor+4,5,100);relAdj(p,T==='calm'?6:4);
      if(T==='fiery'&&rel<40){p.repeat=(p.repeat||0)+1;out.push('He grins and thanks you. You have a feeling you will be having this conversation again.');}else out.push(T==='calm'?'He is genuinely grateful, and it shows in training.':'He thanks you, and means it.');
      if(room.type==='strict'&&sev>=2){ev(-2);out.push('The senior pros think he has got away with it, and they are not pleased.');}else if(room.type==='young'){ev(1);out.push('The young lads like a manager who sticks by his players.');}
      if(pub){const c=club(U());if(f<45){c.fans=clamp(f-3,0,100);out.push('The letters page is furious. The supporters think the club has gone soft.');}else if(f>=65)out.push('The supporters are in a forgiving mood. Nobody makes much of it.');else{c.fans=clamp(f-1,0,100);out.push('One or two letters in the paper grumble about it.');}}}
  else{if(rel>=45||T==='calm'){p.mor=clamp(p.mor+1,5,100);relAdj(p,2);out.push('A sensible compromise, and he sees it that way too.');}else{p.mor=clamp(p.mor-2,5,100);out.push(T==='fiery'?'He goes along with it, but makes it clear he thinks it is nonsense.':'He agrees, without much enthusiasm.');}
      if(room.type==='strict'&&sev>=3){ev(-1);out.push('The senior pros would have liked something stronger.');}}
  return out.join(' ');}
const sq2=(p,n)=>pick(sq(U()).filter(q=>q!==p&&!q.inj))||{n:'one of the lads',id:-1};
/* twelve things that can happen to a football club in the Sixties */
const SITU={
 dogtrack:{who:'trainer',sev:1,pub:1,ok:p=>age(p)<=31,title:p=>`The trainer on ${p.n}`,
  q:p=>pick([`A word, boss. ${p.n} was seen at the dog track at two in the morning before training. Half the town knows about it already.`,`${p.n} was at the greyhounds again last night, boss. Somebody saw him putting a week's wages on a dog called Lucky Lad. It came last.`]),
  opts:[["Fine him a week's wages.",'firm'],['Have a quiet word. It is his own time.','soft'],['No more weeknights out. Fridays only, and in by ten.','deal']]},
 nightclub:{who:'trainer',sev:1,pub:1,ok:p=>age(p)<=26,title:p=>`${p.n} in the papers`,
  q:p=>pick([`Have you seen the Sunday papers, boss? There is a picture of ${p.n} dancing at the Locarno with a girl from a television programme, two nights before a match.`,`${p.n} was in a nightclub in town until four on Thursday, boss. The photographers got him coming out.`]),
  opts:[['Drop him for Saturday. He knows the rules.','firm'],['Leave it. He is young, and he played well.','soft'],['No nightclubs in the two days before a match. That goes for everyone.','deal']]},
 betting:{who:'trainer',sev:2,pub:0,ok:p=>age(p)>=21,title:p=>`${p.n} and the bookmakers`,
  q:p=>`This is delicate, boss. ${p.n} owes a bookmaker a fair bit of money, and the bookmaker has been asking for it at the players' entrance.${G.year>=1964?' After the betting scandal, the FA will not look kindly on anything like this.':''}`,
  opts:[['Report it to the board and fine him. He brings the club into disrepute.','firm'],['The club will settle his debt quietly. He pays us back from his wages.','soft'],['Sort it privately, and he stops betting altogether. Today.','deal']],
  extra:(p,k)=>{if(k==='soft'){const c=Math.round(300*infl());club(U()).bal-=c;G.user.fin.other-=c;return ` It costs the club ${money(c)} for now.`;}if(k==='firm'&&G.year>=1964){bumpConf(1);return ' The chairman is relieved you acted.';}return '';}},
 drink:{who:'trainer',sev:2,pub:0,ok:p=>age(p)>=23,title:p=>`${p.n} and the drink`,
  q:p=>`${p.n} came in for training this morning smelling like a brewery, boss. He could barely do a lap. I sent him home.`,
  opts:[['Fine him and warn him. Next time he is on the list.','firm'],['Find out what is wrong. Something must be.','soft'],['He trains on his own with me for a fortnight. Extra running, every day.','deal']],
  extra:(p,k)=>{if(k==='deal'){p.fit=Math.min(100,p.fit+5);return ' He is sick as a dog after the first session, but fitter for it.';}if(k==='soft'&&rand()<0.5){p.mor=clamp(p.mor+4,5,100);return ' It turns out his father is ill. He is grateful you asked.';}return '';}},
 papers:{who:'player',sev:2,pub:1,ok:p=>p.apps<=G.user.games/2||avgForm(p)<6.4,title:p=>`${p.n} has been talking to the papers`,
  q:p=>`The Sporting Pink quotes ${p.n} today: "I don't know what the manager wants from me. Nobody at this club tells you anything." He is waiting outside your office.`,
  opts:[['Drop him and fine him. You do not go to the papers.','firm'],['Clear the air with him, man to man.','soft'],['He makes a public apology in the programme, and we move on.','deal']]},
 fight:{who:'trainer',sev:2,pub:0,ok:p=>age(p)<=32,title:p=>`A fight at the training ground`,
  q:p=>{const q=sq2(p);p._foe=q.id;return `There was a punch-up at training this morning, boss. ${p.n} and ${q.n}. It took three of us to pull them apart. One of them has a black eye and the other is not saying anything.`;},
  opts:[['Fine them both. I will not have it.','firm'],['Take them both for a pint and sort it out.','soft'],['They shake hands in front of the whole squad, then it is forgotten.','deal']],
  extra:(p,k)=>{const q=G.players[p._foe];if(!q)return '';if(k==='firm')q.mor=clamp(q.mor-6,5,100);if(k==='soft'){q.mor=clamp(q.mor+2,5,100);relAdj(q,2);}if(k==='deal'&&rand()<0.7){everyone(1);return ` ${q.n} and ${p.n} shake hands. By Friday they are sharing a lift to the ground.`;}return k==='deal'?` The handshake is a limp one. It may not be over.`:'';}},
 adviser:{who:'player',sev:1,pub:0,ok:p=>!G.wageCap&&p.ca>=teamRating(U())&&age(p)<=29,title:p=>`${p.n} brings an adviser`,
  q:p=>`${p.n} has brought his brother-in-law to see you. "I look after the lad's affairs now," he says, lighting a cigar in your office. "We think he's worth twenty per cent more."`,
  opts:[['Show the brother-in-law the door.','firm'],['Give the lad his rise. He has earned it.','soft'],['Ten per cent, and the brother-in-law stays out of my office.','deal']],
  extra:(p,k)=>{const r=k==='soft'?1.2:k==='deal'?1.1:1;if(r>1){p.w=Math.round(p.w*r);return ` He is now on £${p.w} a week.`;}return '';}},
 wedding:{who:'player',sev:1,pub:0,ok:p=>age(p)>=20&&age(p)<=29&&!p.wed,title:p=>`${p.n} is getting married`,
  q:p=>{p.wed=true;return `Good news, boss: I'm getting married. Bad news: her mother has booked the church for a Saturday, at three o'clock. On a matchday.`;},
  opts:[['A matchday? Absolutely not. Move the wedding.','firm'],['Congratulations. Go and get married. We will manage without you.','soft'],['Move it to the Sunday, and the club will pay for the reception.','deal']],
  extra:(p,k)=>{if(k==='soft'){p.drop=addDays(G.date,6);p.susp=false;p.dropWhy='Away at his wedding';return ' He misses one match, and sends the lads a piece of wedding cake each.';}if(k==='deal'){const c=Math.round(150*infl());club(U()).bal-=c;G.user.fin.other-=c;p.mor=clamp(p.mor+5,5,100);return ` The reception costs the club ${money(c)}. The whole squad is invited, and the photographs make the local paper.`;}return '';}},
 advert:{who:'player',sev:1,pub:1,ok:p=>p.ca>=teamRating(U())+3&&G.year>=1961,title:p=>`${p.n} has been offered an advert`,
  q:p=>`${p.n} has been asked to advertise ${pick(['Brylcreem','Bovril','a brand of shaving soap','football boots','a new motor scooter'])}. Photographs in all the magazines, and good money. He wants your blessing.`,
  opts:[['No. His mind should be on football.','firm'],['Of course. Good luck to him.','soft'],['He can do it, but the club takes a cut for the use of the shirt.','deal']],
  extra:(p,k)=>{if(k==='deal'){const c=Math.round(250*infl());club(U()).bal+=c;G.user.fin.other+=c;return ` The club pockets ${money(c)}.`;}if(k==='soft'){club(U()).rep=Math.min(95,club(U()).rep+0.5);return ' His face is on every hoarding in town, and the club looks modern.';}return '';}},
 business:{who:'player',sev:1,pub:0,ok:p=>age(p)>=26,title:p=>`${p.n} has a business idea`,
  q:p=>`${p.n} wants to take on ${pick(['a pub near the ground','a sports shop on the high street','a newsagent\'s','a garage and petrol station'])}. "Something for when I finish, boss. I'd only be there in the evenings."`,
  opts:[['Not while you are playing for me.','firm'],['Good idea. A footballer needs something for later.','soft'],['Wait until the summer, and we will talk again.','deal']],
  extra:(p,k)=>{if(k==='soft'&&rand()<0.4){p.fit=Math.max(50,p.fit-10);return ' His evenings get very busy, and he looks tired in training.';}return '';}},
 barracked:{who:'player',sev:1,pub:1,ok:p=>fans()<50&&p.apps>=5&&avgForm(p)<6.5,title:p=>`${p.n} has had enough of the crowd`,
  q:p=>`The crowd were on at ${p.n} all through Saturday's match, boss. Every time he touched the ball. He came in afterwards and sat with his head in his hands. He says he wants to leave.`,
  opts:[['Tell him to toughen up. It comes with the job.','firm'],['Back him in public. Say he is my player and he stays.','soft'],['Leave him out for a few weeks, out of the firing line.','deal']],
  extra:(p,k)=>{if(k==='soft'){p.mor=clamp(p.mor+6,5,100);return ' Your words are printed in the programme. He reads them three times.';}if(k==='deal'){p.drop=addDays(G.date,20);p.susp=false;p.dropWhy='Rested, out of the firing line';return ' He is out of the side for three weeks, and grateful for it.';}if(k==='firm'&&temper(p)!=='calm'&&rand()<0.4){p.listed=true;return ' He goes home and writes out a transfer request. He is on the list.';}return '';}},
 hiding:{who:'trainer',sev:2,pub:0,ok:p=>p.apps>=6&&age(p)>=24&&!p.inj,title:p=>`${p.n} is hiding an injury`,
  q:p=>`I think ${p.n} is playing through an injury, boss. He is strapping his ankle himself before matches and he will not let me look at it. He is frightened of losing his place.`,
  opts:[['If he says he is fit, he is fit. He plays.','firm'],['Rest him. I would rather lose him for a week than a season.','soft'],['Send him to a specialist in town, at the club\'s expense.','deal']],
  extra:(p,k)=>{if(k==='firm'){if(rand()<0.45){p.inj=ri(20,45);hurt(p,p.inj,'after playing through the pain');return ' He breaks down in the next match. He is out for weeks.';}return ' He gets away with it, this time.';}if(k==='soft'){p.drop=addDays(G.date,7);p.susp=false;p.dropWhy='Resting an injury';p.fit=100;return ' A week of rest, and the swelling goes down.';}const c=Math.round(120*infl());club(U()).bal-=c;G.user.fin.other-=c;p.fit=100;return ` The specialist straps it properly and charges the club ${money(c)}. He is right as rain.`;}}};
Object.entries(SITU).forEach(([k,S])=>{TALKS['s_'+k]={who:S.who,title:S.title,q:S.q,opts:S.opts.map(([lbl,kind])=>[lbl,p=>{const sev=S.sev+(p.repeat?1:0);const base=settle(p,kind,Math.min(3,sev),S.pub);return base+(S.extra?S.extra(p,kind):'');}])};});
TALKS.discipline=TALKS.s_dogtrack;
function pickSitu(S){const u=G.user;u.situY=u.situY||{};const opts=[];
  Object.entries(SITU).forEach(([k,D])=>{if(u.situY[k]===G.year)return;const c=S.filter(p=>!p.inj&&age(p)>=18&&D.ok(p));if(!c.length)return;
    const w=c.map(p=>({p,w:(temper(p)==='fiery'?2:1)*(p.mor<50?1.5:1)*(p.repeat?1.5:1)}));opts.push([k,w]);});
  if(!opts.length)return null;const [k,w]=pick(opts);let tot=0;w.forEach(x=>tot+=x.w);let r=rand()*tot;let who=w[0].p;for(const x of w){r-=x.w;if(r<=0){who=x.p;break;}}
  u.situY[k]=G.year;return ['s_'+k,who];}

/* =====================================================================
   TACTICAL DEPTH: traits, roles, set pieces, match plans, familiarity and
   training, touchline shouts, the dossier, weather and pitches, new systems
   and the chalkboard. Everything here feeds the match engine.
   ===================================================================== */

/* ---- player traits ---- */
const TRAITS={
 longthrow:{n:'Long throw',s:'Long throw',d:'Can hurl a throw-in into the six-yard box like a corner. Makes the long-throw instruction worth having.',pos:'FB WH CH IF WG',r:.035},
 deadball:{n:'Dead-ball specialist',s:'Dead ball',d:'Bends free kicks and whips in corners. Your set pieces are more dangerous with him on them.',pos:'IF WH WG FB',r:.07},
 penalty:{n:'Penalty king',s:'Penalties',d:'Cool from twelve yards. Put him on penalties.',pos:'IF CF WH FB CH WG',r:.05},
 header:{n:'Power header',s:'Header',d:'Attacks the ball in the air. More goals from crosses and corners, and a nuisance at the back.',pos:'CF CH IF',r:.12},
 shot:{n:'Power shot',s:'Power shot',d:'Hits them like a cannonball. Dangerous from a distance and from free kicks.',pos:'IF CF WH WG',r:.08},
 ice:{n:'Ice in his veins',s:'Ice',d:'The tighter it gets, the calmer he gets. Better in the last quarter of an hour, in finals and from the spot.',pos:'*',r:.045},
 poacher:{n:'Fox in the box',s:'Fox',d:'Always in the right place. Gets on the end of more chances, and finishes them.',pos:'CF IF',r:.12},
 dribbler:{n:'Tricky dribbler',s:'Dribbler',d:'Beats his man for fun. Wins free kicks and penalties, and loves a wide game. Less use in the mud.',pos:'WG IF',r:.15},
 pace:{n:'Pace to burn',s:'Pace',d:'Quick over the ground. Deadly on the break, and a menace against a high back line.',pos:'WG FB CF IF',r:.11},
 playmaker:{n:'Schemer',s:'Schemer',d:'Sees passes others do not. Makes short passing and attacking through the middle work.',pos:'IF WH',r:.12},
 engine:{n:'Engine',s:'Engine',d:'Runs all day. The side tires less, and pressing works better with him in it.',pos:'WH IF FB',r:.10},
 hardman:{n:'Hard man',s:'Hard man',d:'Takes no prisoners. Wins the ball back, makes pressing bite, and goes in the book.',pos:'WH CH FB',r:.12},
 leader:{n:'Organiser',s:'Organiser',d:'Talks the back line through the game. A high line and an offside trap are safer with him there.',pos:'CH WH FB GK',r:.08},
 bigmatch:{n:'Big-game player',s:'Big game',d:'Rises to the occasion in cup ties and derbies.',pos:'*',r:.04},
 shotstopper:{n:'Shot-stopper',s:'Shot-stopper',d:'Quick reflexes. Saves shots other keepers would not reach.',pos:'GK',r:.25},
 commands:{n:'Commands his area',s:'Commands',d:'Comes for every cross. Fewer goals conceded from corners, crosses and long throws.',pos:'GK',r:.2},
 quick:{n:'Quick learner',s:'Learner',d:'Picks up a new system in no time, and helps the side learn it faster.',pos:'*',r:.15,young:1},
 oldpro:{n:'Set in his ways',s:'Set in ways',d:'Played one way all his life and does not see why he should change. Slows the side down learning a new system, and grumbles about it.',pos:'*',r:.18,old:1,neg:1},
 hothead:{n:'Hot-head',s:'Hot-head',d:'A short fuse. More bookings, and the odd early bath.',pos:'*',r:.06,neg:1},
 injprone:{n:'Injury-prone',s:'Injury-prone',d:'Gets hurt more often than most, takes longer to come back, and is the first to pull up in hard training.',pos:'*',r:.05,neg:1}
};
/* the famous ones, as they were */
const REALTR={'Bobby Charlton':['shot','engine'],'Jimmy Greaves':['poacher','ice'],'Denis Law':['poacher','header'],'George Best':['dribbler','pace'],'Bobby Moore':['leader','ice'],'Gordon Banks':['shotstopper','commands'],
 'Nobby Stiles':['hardman','engine'],'Norman Hunter':['hardman'],'Ron Harris':['hardman'],'Dave Mackay':['hardman','leader','bigmatch'],'Danny Blanchflower':['playmaker','leader'],'John White':['playmaker','engine'],
 'Johnny Haynes':['playmaker','deadball'],'Jack Charlton':['header','leader'],'Geoff Hurst':['header','shot','bigmatch'],'Martin Peters':['quick','playmaker'],'Alan Ball':['engine','quick'],'Billy Bremner':['hardman','engine','bigmatch'],
 'Johnny Giles':['playmaker','deadball'],'John Giles':['playmaker','deadball'],'Peter Lorimer':['shot','deadball'],'Ian Hutchinson':['longthrow','header'],'Martin Chivers':['longthrow','header'],'Ron Yeats':['header','leader'],'Roger Hunt':['poacher','engine'],
 'Ian St John':['header','bigmatch'],'Tommy Smith':['hardman'],'Jimmy Armfield':['leader','pace'],'Stanley Matthews':['dribbler','oldpro'],'Tom Finney':['dribbler'],'Jim Baxter':['playmaker'],'Pat Jennings':['shotstopper','commands'],
 'Peter Bonetti':['shotstopper'],'Cliff Jones':['pace','dribbler'],'Bobby Smith':['header','hardman'],'Jimmy McIlroy':['playmaker'],'Bobby Tambling':['poacher'],'Peter Osgood':['bigmatch','poacher'],'Francis Lee':['penalty','pace'],
 'Colin Bell':['engine'],'Mike Summerbee':['dribbler'],'Tony Hateley':['header'],'Wyn Davies':['header'],'Alan Gilzean':['header'],'Brian Clough':['poacher'],'Jeff Astle':['header'],'Derek Dougan':['header'],
 'Peter Thompson':['dribbler'],'Willie Henderson':['dribbler'],'Ray Wilson':['pace'],'George Cohen':['pace','engine'],'Maurice Norman':['header'],'Bert Trautmann':['shotstopper','commands','oldpro'],'Ron Springett':['shotstopper'],
 'John Charles':['header','leader'],'Alex Young':['playmaker'],'Roy Vernon':['penalty'],'Bobby Collins':['hardman','playmaker'],'Frank McLintock':['leader'],'Tony Kay':['hardman'],'Mike England':['header','leader'],
 'Allan Clarke':['poacher','ice'],'Rodney Marsh':['dribbler'],'Ron Flowers':['penalty'],'Andy Lochhead':['header'],'Ray Pointer':['pace'],'Alan Mullery':['engine'],'Terry Venables':['playmaker'],'Johnny Byrne':['playmaker'],
 'Peter Swan':['leader'],'Brian Labone':['leader'],'Gordon West':['commands'],'Tommy Lawrence':['commands'],'Gerry Byrne':['hardman'],'Charlie Cooke':['dribbler'],'Eddie Gray':['dribbler'],'Paddy Crerand':['playmaker'],
 'Nat Lofthouse':['header','oldpro'],'Joe Baker':['pace','poacher'],'Jimmy Adamson':['leader'],'Bill Slater':['leader'],'Ron Davies':['header'],'Mick Jones':['header','engine'],'Jimmy Robson':['poacher'],'Bobby Robson':['playmaker'],
 'Ray Crawford':['poacher'],'Ted Phillips':['shot'],'Roger Byrne':['pace'],'Bill Foulkes':['header','hardman'],'Pat Crerand':['playmaker'],'Bobby Gould':['poacher'],'Jimmy Melia':['playmaker'],'Ian Callaghan':['engine'],'Emlyn Hughes':['engine','hardman'],
 'Tommy Docherty':['hardman'],'Graham Williams':['hardman'],'Cyril Knowles':['pace'],'Ray Kennedy':['header'],'Howard Kendall':['engine'],'Colin Harvey':['playmaker'],'Joe Royle':['header'],'Peter Shilton':['shotstopper'],
 'Frank Saul':['pace'],'Jimmy Hill':['engine'],'Ron Burgess':['leader']};
function traitsOf(p){if(!p)return [];if(p.trt)return p.trt;const R=REALTR[p.n];if(R){p.trt=R.slice();return p.trt;}
  const rng=seeded(hashStr(p.n+'|'+(p.b||0)+'|'+p.pos)%233280);const a=G?age(p):25;const k=0.55+p.ca/110;const out=[];
  for(const [key,t] of Object.entries(TRAITS)){if(out.length>=3)break;const roll=rng();if(t.pos!=='*'&&!t.pos.split(' ').includes(p.pos))continue;if(t.young&&a>23)continue;if(t.old&&a<29)continue;
    if(p.pos==='GK'&&['ice','hothead'].includes(key))continue;
    let r=t.r*(t.neg?1:k);if(key==='header'&&p.pos==='CF')r*=2;if(key==='dribbler'&&p.pos==='WG')r*=2;if(key==='poacher'&&p.pos==='CF')r*=1.8;if(key==='leader'&&a>=28)r*=1.8;if(key==='pace'&&a>=31)r*=0.4;
    if(roll<r)out.push(key);}
  p.trt=out;return out;}
const hasT=(p,k)=>!!p&&traitsOf(p).includes(k);
function knownTraits(p){const t=traitsOf(p);if(!G||!p.c||p.c===U()||p.real)return t;const k=knowOf(p);return k>=45?t:k>=25?t.slice(0,1):[];}
function traitMini(p){return knownTraits(p).map(k=>`<span class="trt ${TRAITS[k].neg?'neg':''}" title="${esc(TRAITS[k].n+': '+TRAITS[k].d)}">${esc(TRAITS[k].s)}</span>`).join('');}
const ownT=(p,k)=>!!(REALTR[p.n]&&REALTR[p.n].includes(k));
function traitFull(p){const t=knownTraits(p);const hidden=traitsOf(p).length>t.length;const anyOwn=t.some(k=>ownT(p,k));
  return `<div class="trtbox"><h3 class="h2">Traits</h3>${t.length?`<ul class="trtlist">${t.map(k=>`<li class="${TRAITS[k].neg?'neg':''}"><strong>${esc(TRAITS[k].n)}${ownT(p,k)?' <span class="trtstar" title="His own: what he was famous for" aria-label="His own trait">★</span>':''}</strong><span>${esc(TRAITS[k].d)}</span></li>`).join('')}</ul>${anyOwn?`<p class="muted sm"><span class="trtstar" aria-hidden="true">★</span> His own: what ${esc(p.n)} was famous for.</p>`:''}`:hidden?'':'<p class="muted sm">Nothing out of the ordinary. A solid professional.</p>'}${hidden?'<p class="muted sm">Your scouts have not seen enough of him to say more. Send them to watch him.</p>':''}</div>`;}

/* ---- more systems of the period ---- */
Object.assign(FORMS,{
 'Pyr':{lbl:'Pyramid (2-3-5)',mod:[1.08,0.98,0.91],desc:'The Victorian system, still played by a few old-fashioned clubs at the start of the decade. Two full-backs, three half-backs and five forwards. Goals galore, at both ends.',
  s:[['GK','GK',50,88,1],['FB','RB',68,72,2],['FB','LB',32,72,3],['WH','RH',80,52,4],['CH','CH',50,55,5],['WH','LH',20,52,6],['WG','OR',90,16,7],['IF','IR',68,22,8],['CF','CF',50,13,9],['IF','IL',32,22,10],['WG','OL',10,16,11]]},
 'WW':{lbl:'W-W (Hungarian 3-2-1-4)',mod:[1.05,1.03,0.93],desc:'The system of the Mighty Magyars who took England apart at Wembley in 1953. The centre-forward drops deep and the two inside-forwards play as the strikers. Clever, and thin at the back.',
  s:[['GK','GK',50,88,1],['FB','RB',75,71,2],['CH','CH',50,73,5],['FB','LB',25,71,3],['WH','RH',68,52,4],['WH','LH',32,52,6],['IF','DCF',50,35,9],['WG','OR',88,22,7],['IF','IR',62,14,8],['IF','IL',38,14,10],['WG','OL',12,22,11]]},
 'Bolt':{lbl:'Swiss bolt (verrou)',mod:[0.96,0.99,1.07],desc:"Karl Rappan's verrou, the forerunner of catenaccio. A free defender, the verrouilleur, bolts the door behind the back line. Solid, and slow to get going.",
  s:[['GK','GK',50,89,1],['CH','VR',50,79,5],['FB','RB',82,67,2],['CH','CH',50,67,6],['FB','LB',18,67,3],['WH','RH',72,48,4],['IF','IF',50,44,8],['WH','LH',28,48,10],['WG','OR',86,18,7],['CF','CF',50,14,9],['WG','OL',14,18,11]]},
 '4132':{lbl:'4-1-3-2 (Ramsey diamond)',from:1965,mod:[0.99,1.06,1.01],desc:"Alf Ramsey's 1966 shape: a holding man in front of the back four, two runners either side and a schemer behind two strikers. No wingers at all.",
  s:[['GK','GK',50,88,1],['FB','RB',85,68,2],['CH','CH',62,73,5],['CH','CH',38,73,6],['FB','LB',15,68,3],['WH','DM',50,57,4],['WH','RM',76,44,7],['IF','AM',50,35,8],['WH','LM',24,44,11],['CF','CF',60,14,9],['CF','CF',40,14,10]]}
});
const formLock=k=>FORMS[k]&&FORMS[k].from&&G.year<FORMS[k].from?`Nobody has thought of it yet. It arrives in about ${FORMS[k].from}.`:'';

/* ---- player roles ---- */
const ROLES={
 GK:{line:{n:'Stays on his line',s:'Line',d:'Rarely leaves his six-yard box. Better against shots, less help against crosses.'},claim:{n:'Comes for crosses',s:'Claims',d:'Claims everything in the air. Fewer goals from corners, crosses and long throws, but the odd shot gets past him.'}},
 FB:{home:{n:'Stays at home',s:'Home',d:'A defender first. Marks his winger and leaves the attacking to others.'},overlap:{n:'Overlapping full-back',s:'Overlap',d:'Bombs on outside his winger. Extra width, crosses and the odd goal, but space behind him. Pace and stamina help.',from:1964}},
 CH:{stopper:{n:'Stopper',s:'Stopper',d:'Heads it, kicks it, wins it. Solid, and at his best against a big centre-forward.'},ball:{n:'Ball-playing centre-half',s:'Ball-player',d:'Brings it out from the back. Better use of the ball, a little less solid.'},libero:{n:'Sweeper (libero)',s:'Sweeper',d:'Free behind the back line, mopping up. Covers for a high line and quick forwards. Only in a system with a sweeper.',only:['SW','VR']}},
 WH:{attack:{n:'Attacking wing-half',s:'Attacking',d:'Joins the attack and arrives late in the box.'},link:{n:'Link man',s:'Link',d:'Box to box, a bit of everything.'},hold:{n:'Destroyer',s:'Destroyer',d:'Sits in front of the back line and breaks up play, the Nobby Stiles job. Best against a side with a schemer to snuff out. Hard men excel at it.'}},
 IF:{schemer:{n:'Schemer',s:'Schemer',d:'Makes the play. More control, and more chances made for others.'},goals:{n:'Goal-getting inside-forward',s:'Goals',d:'Gets into the box and shoots. More goals, less help in midfield.'},deep:{n:'Deep-lying centre-forward',s:'Deep',d:'The Hidegkuti role: drops off and drags the centre-half out of position so the inside men can run beyond. Murder on a side with a single stopper.',only:['DCF']}},
 WG:{byline:{n:'Touchline winger',s:'Touchline',d:'Hugs the line, beats his full-back and crosses. More headed chances for the men in the middle.'},inside:{n:'Cuts inside',s:'Inside',d:'Comes in off the wing and shoots. More goals for the winger himself, fewer crosses.'}},
 CF:{target:{n:'Target man',s:'Target',d:'A battering ram. Wins the ball in the air and brings others in. Made for crosses and the long ball, and a handful for a small centre-half.'},poacher:{n:'Poacher',s:'Poacher',d:'Lives in the six-yard box. More goals, very little else.'},deep:{n:'Deep-lying centre-forward',s:'Deep',d:'Drops into midfield to link play. More control, fewer goals of his own.'}}
};
const ROLESYN={line:['shotstopper'],claim:['commands'],home:['hardman','leader'],overlap:['pace','engine'],stopper:['header','hardman'],ball:['playmaker'],libero:['leader','playmaker'],attack:['shot','engine'],link:['engine'],hold:['hardman','engine'],
 schemer:['playmaker'],goals:['poacher','shot'],deep:['playmaker'],byline:['dribbler','pace'],inside:['shot','dribbler'],target:['header'],poacher:['poacher','pace']};
const ROLEDEF={GK:'line',FB:'home',CH:'stopper',WH:'link',IF:'schemer',WG:'byline',CF:'target'};
function roleLock(sl,k){const r=ROLES[sl[0]][k];if(!r)return 'No such role';if(r.only&&!r.only.includes(sl[1]))return r.only.includes('DCF')?'Only for the deep centre-forward of the Revie Plan or the W-W.':'Only in a system with a sweeper (catenaccio or the Swiss bolt).';if(r.from&&G.year<r.from)return `Nobody plays it like that yet. It arrives in about ${r.from}.`;return '';}
function defRole(sl){if(sl[1]==='SW'||sl[1]==='VR')return 'libero';if(sl[1]==='DCF')return 'deep';if(sl[1]==='DM')return 'hold';if(sl[0]==='IF'&&['IR','RC'].includes(sl[1]))return 'goals';return ROLEDEF[sl[0]];}
function slotRoles(form,store){return FORMS[form].s.map((sl,i)=>{const k=store&&store[i];return k&&ROLES[sl[0]][k]&&!roleLock(sl,k)?k:defRole(sl);});}
const synOf=(p,role)=>1+0.5*Math.min(2,(ROLESYN[role]||[]).filter(t=>hasT(p,t)).length);
function roleFitLine(p,role){const t=(ROLESYN[role]||[]).filter(k=>hasT(p,k));return t.length?`Suits ${esc(nm(p.id))}: ${t.map(k=>TRAITS[k].n.toLowerCase()).join(' and ')}.`:`${esc(nm(p.id))} has none of the traits that make this role sing (${(ROLESYN[role]||[]).map(k=>TRAITS[k].n.toLowerCase()).join(', ')}).`;}

/* ---- new team instructions ---- */
Object.assign(DEFTAC,{line:1,press:1,focus:0,counter:0,waste:0,lthrow:0});
Object.assign(TACOPT,{
 line:{lbl:'Defensive line',grp:'out',opts:['Sit deep','Normal','Push up high'],tips:['Drop off and protect the box. Quick forwards have no room to run into, but you give up ground and the ball.','Standard.','Squeeze the play up the pitch. More of the ball, but quick forwards and the long ball over the top will hurt you, unless you have a sweeper or an organiser.']},
 press:{lbl:'Closing down',grp:'out',opts:['Stand off','Normal','Harry them'],from:[0,0,1963],tips:['Let them have the ball in front of you. Saves the legs, but a neat passing side will enjoy it.','Standard.','Close every man down, the Leeds and Liverpool way. Murder on a side that likes to pass it short, little use against the long ball, and tiring. Engines and hard men make it bite.']},
 focus:{lbl:'Attack through',grp:'in',opts:['Wherever it is on','The flanks','The middle','Their weakest full-back'],tips:['Take what the game gives you.','Get it wide and get crosses in. Best against weak full-backs and a narrow side, with a big man in the middle.','Through the inside-forwards and the centre-forward. Best against a single centre-half, poor against a packed middle.','Find their slowest man at the back and run at him all afternoon. Only as good as the gap between your winger and him.']},
 counter:{lbl:'Counter-attack',grp:'in',opts:['No','Yes'],tips:['Build normally.','Soak it up and hit them on the break. Deadly against a side that comes at you or pushes up, especially with quick forwards. Little use against a side that sits back, or when you are chasing the game.']},
 waste:{lbl:'Time-wasting when in front',grp:'gm',opts:['Never','A touch','Some','Plenty','Shameless'],tips:['Play the game the right way.','Take your time over the odd throw-in.','Slow down the goal kicks and keep it in the corner.','The ball goes into the crowd a lot, and somebody always needs the trainer.','Every trick in the book. It kills a game, but the referee books your men and adds time on, and an away crowd will howl.']},
 lthrow:{lbl:'Long throws',grp:'sp',opts:['No','Yes'],tips:['Take throw-ins short.','Hurl them into the box. Only works with a long-throw specialist on the pitch, and best on a tight ground.']}
});
['pass','width','tempo'].forEach(k=>TACOPT[k].grp='in');['tackle','trap'].forEach(k=>TACOPT[k].grp='out');
const optLock=(o,i)=>{const y=o.from&&o.from[i];return y&&G.year<y?`Nobody plays this way yet. It arrives in about ${y}.`:'';};
const TACGRP={in:'In possession',out:'Out of possession',gm:'Game management',sp:'Set pieces'};
function throwerXI(){return (G.user.xi||[]).some(id=>hasT(G.players[id],'longthrow'));}
function tacControls(t,act){return Object.entries(TACGRP).map(([g,l])=>{const rows=Object.entries(TACOPT).filter(([k,o])=>o.grp===g);if(!rows.length)return '';
  return `<h4 class="tacgrp">${l}</h4>`+rows.map(([k,o])=>`<div class="tacrow ${t[k]==null?'need':''}"><span class="lbl">${o.lbl}</span><div class="seg ${o.opts.length>3?'seg5':''}" role="group" aria-label="${o.lbl}">${o.opts.map((lb,i)=>{const lock=optLock(o,i);return `<button class="${t[k]===i?'on':''}" data-a="${act}" data-k="${k}" data-v="${i}" ${lock?`disabled title="${esc(lock)}"`:''}>${lb}</button>`;}).join('')}</div><small class="muted">${t[k]==null?'Choose one.':o.tips[t[k]]||''}${k==='lthrow'&&t[k]&&!throwerXI()?' <strong class="neg">Nobody in the side has a long throw.</strong>':''}</small></div>`).join('');}).join('');}
function tacSummary(t){const out=['pass','width','tempo','tackle','line','press','focus'].filter(k=>t[k]!=null&&t[k]!==DEFTAC[k]&&TACOPT[k].opts[t[k]]).map(k=>k==='focus'?'attack through '+TACOPT.focus.opts[t.focus].toLowerCase():TACOPT[k].opts[t[k]].toLowerCase());
  if(t.trap)out.push('offside trap');if(t.counter)out.push('on the counter');if(t.waste)out.push('time-wasting: '+TACOPT.waste.opts[t.waste].toLowerCase());if(t.lthrow)out.push('long throws');const s=out.join(', ');return s?s[0].toUpperCase()+s.slice(1):'Standard instructions';}
const PRESETS=[
 {k:'tight',n:'Keep it tight away',d:'Sit deep, stand off, hit them on the break, and run the clock down if you get in front.',ment:0,tac:{line:0,press:0,tempo:0,counter:1,waste:2,focus:0}},
 {k:'siege',n:'Cup-tie siege',d:'Everything forward: wide, fast and pressing high. For when you must win.',ment:2,tac:{tempo:2,width:2,press:2,line:2,counter:0,waste:0,focus:1}},
 {k:'protect',n:'Protect a lead',d:'Drop deeper, slow it down and keep the ball in the corner.',ment:0,tac:{line:0,tempo:0,waste:3,counter:1,press:1}},
 {k:'allout',n:'All-out attack',d:'Push up, harry them, get bodies in the box.',ment:2,tac:{tempo:2,line:2,press:2,width:2,counter:0,waste:0}},
 {k:'mud',n:'Mud and bullets',d:'Long ball, get stuck in, up and at them. Made for a winter afternoon.',ment:1,tac:{pass:0,tempo:2,tackle:2,width:1,focus:0}},
 {k:'cont',n:'The Continental way',d:'Short passing, patient build-up through the middle.',ment:1,tac:{pass:2,tempo:0,press:1,width:1,focus:2}}];
function applyPreset(tgt,P){if(P.ment!=null)tgt.ment=P.ment;Object.entries(P.tac).forEach(([k,v])=>{const o=TACOPT[k];if(o&&!optLock(o,v))tgt.tac[k]=v;});}

/* ---- set pieces ---- */
const SPDEF={cor:'mix',fk:'shoot'};
const CORT={mix:'A bit of everything.',near:'Whipped to the near post for a flick-on. Needs a forward who is good in the air.',far:'Floated over everyone to the big men coming up from the back. Needs somebody who can head it.',short:'Played short and worked for a shot. Fewer headers, more shots; better the more you rehearse it.'};
const FKT={shoot:'Your taker has a go. Lethal with a dead-ball specialist, a waste without one.',cross:'Float it in for the big men to attack.',rehearsed:'A routine off the training ground. Only as good as the hours put in on set-piece training.'};
function onPitch(s,pid){return pid&&s.xi.includes(pid)&&!s.off[pid]&&!s.hob[pid];}
function spTaker(s,k){if(s.cid===U()){const id=(G.user.sp||{})[k];if(onPitch(s,id)&&(k!=='lt'||hasT(G.players[id],'longthrow')))return id;}
  const tk={pen:'penalty',fk:'deadball',cor:'deadball',lt:'longthrow'}[k];let best=null,bv=-1;
  s.xi.forEach((pid,j)=>{if(j===0||!onPitch(s,pid))return;const p=G.players[pid];if(k==='lt'&&!hasT(p,'longthrow'))return;const v=p.ca+(hasT(p,tk)?25:0)+(k==='pen'&&hasT(p,'ice')?8:0);if(v>bv){bv=v;best=pid;}});return best;}
function nearTarget(s){const F=FORMS[s.form].s;return s.xi.some((pid,i)=>onPitch(s,pid)&&['CF','IF'].includes(F[i][0])&&(hasT(G.players[pid],'header')||s.rl&&s.rl[i]==='target'));}
function farTarget(s){const F=FORMS[s.form].s;return s.xi.some((pid,i)=>onPitch(s,pid)&&i>0&&F[i][0]!=='CF'&&hasT(G.players[pid],'header'));}

/* ---- the weather and the pitch: the same sky over every ground in a region on a given day ---- */
const WXK=['fine','warm','cold','drizzle','rain','wind','fog','frost','snow'];
const WXM=[[8,0,28,8,15,10,7,15,9],[10,0,28,10,16,12,5,12,7],[22,0,20,12,18,20,2,5,1],[40,5,10,15,18,12,0,0,0],[45,15,0,15,15,10,0,0,0],[45,20,0,15,10,10,0,0,0],[40,25,0,10,15,10,0,0,0],[40,25,0,10,15,10,0,0,0],[45,10,0,15,18,12,0,0,0],[30,0,12,18,22,13,5,0,0],[15,0,25,15,22,10,10,3,0],[8,0,30,10,18,10,8,11,5]];
const WARMC=['Spain','Portugal','Italy','Greece','Turkey','Malta','Cyprus','Yugoslavia','Albania'];
const COLDC=['Soviet Union','Sweden','Norway','Finland','Poland','Czechoslovakia','Hungary','East Germany','Romania','Bulgaria','Denmark','Iceland','Austria','Switzerland','West Germany'];
const COAST=new Set('BLP SOU POR BHA BOU SOE PLY TOR GRI HAR SOP BRW WOR SWA SUN HUL CAR EXE NPT'.split(' '));
const GROUNDF={DER:{mud:1.7,note:'The Baseball Ground turns to mud at the first sign of rain.'},SOU:{size:'small',note:'The Dell is tight and narrow.'},MIL:{size:'small',note:'The Den is tight, and the crowd are right on top of the players.'},GIL:{size:'small'},HAL:{size:'small',cold:1.3},
 MCI:{size:'large',note:'Maine Road has the widest pitch in the League.'},PVA:{size:'large',note:'Vale Park was built to be the Wembley of the North, and the pitch is enormous.'},OLD:{cold:1.6,note:'Boundary Park is the coldest ground in England.'},BRN:{cold:1.3},HUD:{cold:1.3},BPA:{cold:1.2},BRA:{cold:1.2},
 WEM:{size:'large',note:'The Wembley turf is lush and wide, and it saps the legs.'}};
const WXN={fine:'Fine and dry',warm:'Warm sunshine',cold:'Cold and grey',drizzle:'Drizzle',rain:'Heavy rain',wind:'Blowing a gale',fog:'Thick fog',frost:'A hard frost',snow:'Snow'};
const PITN={good:'Good',lush:'Lush',hard:'Hard and bumpy',worn:'Worn and bare in the middle',heavy:'Heavy',mud:'A mudbath',frozen:'Frozen solid',snow:'Covered in snow'};
const CONDTIP={mud:'Short passing gets stuck in the mud. The long ball and strong runners come into their own, tricky players are wasted, and legs go early.',heavy:'Hard going. Neat passing suffers a little, the long ball does better, and it is tiring.',
 frozen:'Like an ice rink. The right boots matter more than anything, and expect mistakes at both ends.',snow:'The ball holds up in the snow. The right boots matter, and so does luck.',hard:'The ball bobbles. Quick men like it; neat passing suffers a touch.',
 lush:'Big, beautiful and tiring. A passing side will enjoy it.',worn:'Bare in the middle. Nothing much to choose between the teams.',good:'A good surface. Nothing to worry about.',
 wind:'Crosses and long balls go astray, headers are a lottery and corners cause chaos.',rain:'A greasy surface: shots skid off it and keepers struggle.',drizzle:'A damp, greasy afternoon. Shots skid.',fog:'Nobody can see much. Fewer chances at either end.',warm:'Legs tire quickly. Pressing and a high tempo cost more.',frost:'',snow2:'',cold:'',fine:''};
const BOOTS={moulded:'Moulded rubber studs',studs:'Long screw-in studs',pimples:'Rubber pimples'};
const BOOTM={mud:{moulded:.975,studs:1.012,pimples:.96},heavy:{moulded:.99,studs:1.008,pimples:.97},frozen:{moulded:.97,studs:.95,pimples:1.02},snow:{moulded:.975,studs:.96,pimples:1.015},hard:{moulded:1.004,studs:.98,pimples:.995},def:{moulded:1,studs:.99,pimples:.99}};
const bestBoots=pitch=>pitch==='mud'||pitch==='heavy'?'studs':pitch==='frozen'||pitch==='snow'?'pimples':'moulded';
function wxDay(date,reg){const mo=+date.slice(5,7)-1;let w=WXM[mo].slice();
  if(/^X:/.test(reg)){const cty=reg.slice(2);if(WARMC.includes(cty))w=mo>=4&&mo<=8?[55,35,0,5,5,0,0,0,0]:[45,10,10,10,15,10,0,0,0];else if(COLDC.includes(cty)&&(mo>=10||mo<=2))w=[10,0,30,0,10,10,5,20,15];}
  else if(date>='1962-12-22'&&date<='1963-03-04')w=[0,0,15,0,2,5,5,45,28];
  else{if(['NW','NE','YK'].includes(reg)){w[7]*=1.4;w[8]*=1.5;w[2]*=1.1;}if(reg==='NW'){w[4]*=1.35;w[3]*=1.2;}if(reg==='LON')w[6]*=1.6;if(reg==='SW'){w[5]*=1.2;w[7]*=0.7;w[8]*=0.6;}}
  const r=seeded(hashStr(date+'|'+reg)%233280)()*w.reduce((a,b)=>a+b,0);let acc=0;for(let k=0;k<w.length;k++){acc+=w[k];if(r<acc)return WXK[k];}return 'fine';}
function venueKey(fx){if(fx.venue==='Wembley')return 'WEM';if(fx.venue||fx.neutral)return 'NEU';return fx.h;}
function condOf(fx){const hc=club(fx.h)||{};const reg=fx.venue==='Wembley'?'LON':hc.country?'X:'+hc.country:regionOf(fx.h);const vk=venueKey(fx);const g=GROUNDF[vk]||{};
  let wx=wxDay(fx.date,reg);const lr=seeded(hashStr(fx.date+'#'+vk)%233280)();
  if(COAST.has(vk)&&(wx==='fine'||wx==='cold'||wx==='drizzle')&&lr<0.35)wx='wind';
  if(g.cold&&wx==='cold'&&lr<0.25*g.cold)wx='frost';
  const mo=+fx.date.slice(5,7)-1;const winter=mo>=10||mo<=1;let wet=0;
  for(let k=1;k<=4;k++){const p=wxDay(addDays(fx.date,-k),reg);wet+=(p==='rain'?1.2:p==='drizzle'||p==='snow'?0.5:0)/k;}
  wet+=wx==='rain'?1.6:wx==='drizzle'?0.7:0;wet*=(g.mud||1)*(winter?1.35:mo===2||mo===9?1:0.6);
  let pitch;if(wx==='snow')pitch='snow';else if(wx==='frost')pitch='frozen';else if(vk==='WEM')pitch=wet>=2.4?'heavy':'lush';
  else if(wet>=2.3)pitch='mud';else if(wet>=1.1||(winter&&wet>=0.4))pitch='heavy';else if(mo>=2&&mo<=4&&lr>0.5)pitch=mo===4?'hard':'worn';else if((mo===7||mo===8||mo===4)&&(wx==='fine'||wx==='warm'))pitch='hard';else pitch='good';
  if(wx==='rain'&&['good','hard','worn'].includes(pitch))pitch='heavy';
  if(vk===U()&&upgDone('undersoil')&&(pitch==='frozen'||pitch==='snow'))pitch=wx==='snow'?'heavy':'good';
  return {wx,pitch,size:g.size||'',note:g.note||'',vk};}
function condLine(c){return `${WXN[c.wx]}. Pitch: ${PITN[c.pitch].toLowerCase()}.${c.size==='small'?' A small, tight pitch.':c.size==='large'?' A big, wide pitch.':''}`;}
function trainerBoots(fx,c){const q=staffQ('fit');const best=bestBoots(c.pitch);if(best==='moulded')return 'moulded';return q&&seeded(hashStr('bt'+fx.id)%233280)()<0.55+0.1*q?best:'moulded';}
function bootsFor(cid,fx,c){if(cid===U()){const b=(G.user.bootsFx||{})[fx.id];return b||trainerBoots(fx,c);}const best=bestBoots(c.pitch);return seeded(hashStr(fx.id+'|'+cid)%233280)()<0.5+0.1*mq(cid)?best:'moulded';}
const WXFLAV={rain:['The rain is coming down in sheets at {g}.','The ball skids off the wet surface.','Umbrellas up in the stand; the terraces just get wet.'],drizzle:['A fine drizzle drifts across {g}.'],wind:['The wind is swirling around {g}. A goal kick has just blown back over the halfway line.','That cross was heading for the corner flag before the wind took it out of play.'],
 fog:['The fog is so thick the press box can barely see the far goal.','A roar from the far end. Nobody up here can see what happened.'],frost:['The players are sliding about on the frost.','Breath hangs in the air on the terraces.'],snow:['The lines have been swept clear, and the ball is orange today.','The snow is falling again at {g}.'],warm:['A warm afternoon. Shirts are sticking to backs.'],cold:['A raw, grey afternoon at {g}.','The crowd stamp their feet to keep warm.'],fine:['A lovely afternoon for it.']};
const PITFLAV={mud:['The mud is clinging to the boots. Every tackle sends up a spray.','The ball has stopped dead in a puddle.'],heavy:['A heavy pitch. The legs are starting to go.'],frozen:['The pitch is rock hard and treacherous.'],hard:['The ball is bobbling about on the hard ground.'],lush:['The famous turf is soaking up the legs.']};
function flavList(m){const c=m.cond||{};return T.flav.concat(WXFLAV[c.wx]||[],PITFLAV[c.pitch]||[]);}

/* ---- familiarity and training ---- */
const FAMBASE=f=>f==='W-M'?(G.year<1964?70:50):f==='4-2-4'&&G.year>=1962?35:f==='Pyr'?(G.year<1962?40:20):25;
function famOf(f){const F=G.user.fam=G.user.fam||{};return F[f]!=null?F[f]:FAMBASE(f);}
function famEff(s){let fe=famOf(s.form);s.xi.forEach(pid=>{const p=G.players[pid];if(!p)return;if(hasT(p,'quick'))fe+=3;if(hasT(p,'oldpro'))fe-=4;});return clamp(fe,0,100);}
const famWord=v=>v>=90?'Second nature':v>=75?'Well drilled':v>=55?'Getting there':v>=35?'Still learning':'All at sea';
const TRAINF={fit:['Fitness','Lapping, sand dunes and the medicine ball. The side tires less in matches, but expect the odd knock in training and grumbling from the older men.'],
 ball:['Ball work','Five-a-sides and ball skills, the Continental way. A sharper touch, short passing works better, and young players come on faster.'],
 tac:['Tactics','The blackboard and walk-throughs. The side learns its system much faster. Dull, mind.'],
 def:['Defending','Back-four drills, heading clearances and holding the line. Harder to break down, and a high line or an offside trap holds up better.'],
 press:['Pressing','Hunting the ball in packs. Closing down bites harder and costs less in the legs.'],
 att:['Attacking','Shooting practice and attacking patterns until dark. Sharper in front of goal.'],
 late:['Game scenarios','The last ten minutes of a tight game, over and over: one up, one down, all square. Calmer and sharper when it matters most.'],
 sp:['Set pieces','Corners, free kicks and long throws, over and over. Rehearsed routines become deadly.'],
 rest:['Rest','Golf on Tuesday, a light jog on Thursday. Fresh legs and happy players, but the side goes a little rusty.']};
const TRL=[['fit','Fitness'],['ball','Ball skills'],['def','Defending'],['press','Pressing'],['att','Attacking'],['late','Game scenarios']];
const trW=k=>G.user.trainM===k?1:G.user.trainS===k?0.5:0;
const TRCOACH={fit:()=>staffQ('fit'),ball:()=>Math.max(staffQ('wing'),staffQ('youth')),def:()=>staffQ('def'),press:()=>Math.max(staffQ('fit'),staffQ('def')),att:()=>staffQ('att'),late:()=>staffQ('mot')};
function tacWeekly(){const u=G.user;if(!u.trw||u.trw.y!==G.year)u.trw={y:G.year};[u.trainM,u.trainS].forEach((k,j)=>{if(k)u.trw[k]=(u.trw[k]||0)+(j?0.5:1);});
  const S=sq(U());const xi=(u.xi||[]).map(id=>G.players[id]).filter(Boolean);const quick=xi.filter(p=>hasT(p,'quick')).length,old=xi.filter(p=>hasT(p,'oldpro')).length;
  const coach=Math.max(staffQ('def'),staffQ('att'));const gain=(4+0.6*coach)*(1+trW('tac')-0.5*trW('rest'))*(1+0.08*quick-0.08*old)+(upgDone('tr_film')?1:0);
  u.fam=u.fam||{};Object.keys(FORMS).forEach(f=>{const v=famOf(f),b=FAMBASE(f);if(f===u.form)u.fam[f]=clamp(v+gain,0,100);else u.fam[f]=v>b?Math.max(b,v-1):v;});
  /* the main focus climbs all the way; the secondary one only to a decent level; the rest fade */
  u.trl=u.trl||{};TRL.forEach(([k])=>{const w=trW(k),v=u.trl[k]||0;const cq=TRCOACH[k]();const cap2=60+4*cq;u.trl[k]=w===1?Math.min(100,v+16*(1+0.1*cq)):w?(v<cap2?Math.min(cap2,v+8*(1+0.1*cq)):Math.max(cap2,v-2)):Math.max(0,v-4-(trW('rest')?2:0));});
  const ws=trW('sp');const sq_=staffQ('set');const dc=60+4*sq_;u.drill=ws===1?Math.min(100,(u.drill||0)+14*(1+0.1*sq_)):ws?((u.drill||0)<dc?Math.min(dc,(u.drill||0)+7*(1+0.1*sq_)):Math.max(dc,(u.drill||0)-2)):Math.max(0,(u.drill||0)-(3-0.4*sq_));
  const wf=trW('fit');if(wf){S.forEach(p=>{p.fit=Math.min(100,p.fit+5*wf);if(age(p)>=31&&wf===1)p.mor=clamp(p.mor-1,5,100);});if(rand()<0.12*wf*(1-0.12*staffQ('fit'))){const p=wpick(S.filter(x=>!x.inj),x=>hasT(x,'injprone')?3:1);if(p){p.inj=ri(2,6);hurt(p,p.inj,'on the cross-country run in training');}}}
  const wr=trW('rest');if(wr)S.forEach(p=>{p.fit=Math.min(100,p.fit+8*wr);if(wr===1||rand()<0.5)p.mor=clamp(p.mor+1,5,100);});
  if(trW('tac')===1&&u.trw.tac%4===0)S.forEach(p=>p.mor=clamp(p.mor-1,5,100));
  if(famOf(u.form)<55)xi.filter(p=>hasT(p,'oldpro')).forEach(p=>p.mor=clamp(p.mor-1,5,100));}
function trainDev(p,a){const w=G.user.trw&&G.user.trw.y===G.year?G.user.trw:{};let d=0;if(a<=24&&(w.ball||0)>=6&&rand()<Math.min(0.6,(w.ball||0)/35))d+=1;if(a>=29&&(w.fit||0)>=6&&rand()<0.35)d+=1;return d;}

/* ---- match plans ---- */
function planSnap(){const u=G.user;return {form:u.form,ment:u.ment,tac:{...u.tac},roles:{...((u.roles||{})[u.form]||{})}};}
function setForm(f){const u=G.user;if(!FORMS[f]||u.form===f)return;const keep=(u.xi||[]).map(id=>G.players[id]).filter(p=>p&&p.c===U());u.form=f;
  const as=assignXI(FORMS[f].s.map(s=>s[0]),keep);u.xi=as.map(p=>p?p.id:null);u.held={};UI.pick=null;validateUserXI();}
function planLoad(P){const u=G.user;if(!P)return;if(P.form!==u.form&&!formLock(P.form))setForm(P.form);u.ment=P.ment;u.tac={...DEFTAC,...P.tac};u.roles=u.roles||{};u.roles[u.form]={...(P.roles||{})};}
function applyVenuePlan(f){const P=G.user.plan;if(!P||!P.on||G.user.mday)return;const want=f.a===U()&&!f.neutral?'A':'H';P[P.ed]=planSnap();if(P.ed!==want){P.ed=want;planLoad(P[want]);}}

/* ---- touchline shouts ---- */
const SHOUTMAX=3;
const SHOUTS={fwd:['Get it forward!','More attacks, more gaps. Best when you are chasing it.'],tight:['Keep it tight!','Everyone behind the ball. Best when you are in front.'],stuck:['Get stuck in!','More bite, more names in the book. Best against a passing side.'],
 calm:['Calm down!','Fewer silly fouls, and the ball gets played. Best after a goal against or a booking or two.'],push:['Push up!','Squeeze up for ten minutes. More of the ball, more room behind you.'],waste:['Waste some time!','Take it to the corner flag. Only any use when you are in front.']};
function doShout(k){const L=UI.live;if(!L)return;const m=L.m;const s=m.sides[m.us];if(m.done||L.ht)return;
  const used=(s.shoutLog||[]).length;if(used>=SHOUTMAX)return;let pow=1;const d=m.sc[m.us]-m.sc[1-m.us];let note='';
  if(pow>0&&m.att>40000&&!s.home&&rand()<0.3*(1-0.12*staffQ('mot'))){pow*=0.3;note=' Nobody can hear you over the crowd.';}
  if(used+1===SHOUTMAX)note+=' That is your last shout of the afternoon.';
  let ctx=1;const conc=m.goals.some(g=>g.side!==m.us&&m.min-g.min<=6);
  if(k==='fwd')ctx=d<0||(d===0&&m.min>=70)?1.5:d>0?0.5:1;else if(k==='tight')ctx=d>0?1.4:d<0?0.4:1;else if(k==='stuck')ctx=s.o.tac.pass===2?1.3:s.o.tac.pass===0?0.8:1;
  else if(k==='calm')ctx=conc||Object.keys(s.bk||{}).length>=2?1.5:0.8;else if(k==='push')ctx=d<0?1.2:1;else if(k==='waste')ctx=d>0?1:0;
  const P=pow*ctx*(1+0.06*staffQ('mot'));s.shout={k,from:m.min,until:m.min+10,pow:P};(s.shoutLog=s.shoutLog||[]).push({k,min:m.min,pow:P,sc:m.sc.slice()});
  addEv(m,m.us,'shout',`From the dugout: "${SHOUTS[k][0]}"${note||(k==='waste'&&d<=0?' The trainer looks at you. "Waste time, boss? We are not in front."':P>=1.2?' The players respond at once.':P<=0.5?' It barely registers.':'')}`);
  s.str=strength(s);updateLive(false);}

/* ---- linking the two sides and the conditions at the start of a match ---- */
function weakFB(o){const F=FORMS[o.form].s;let w=null,sum=0,n=0;F.forEach((sl,i)=>{const p=o.xi[i]&&G.players[o.xi[i]];if(!p||i===0)return;const v=eff(p,sl[0]);sum+=v;n++;if(sl[0]==='FB'&&(!w||v<w.v))w={pid:p.id,v,lane:sl[2]<50?'R':'L',side:sl[2]<50?'left':'right'};});
  if(w)w.gap=n?((sum/n)-w.v)/Math.max(30,sum/n):0;return w;}
function linkSides(m){const fx=m.fx;m.cond=condOf(fx);
  m.sides.forEach((s,i)=>{Object.defineProperty(s,'o',{value:m.sides[1-i],configurable:true,writable:true});Object.defineProperty(s,'m',{value:m,configurable:true,writable:true});
    const isU=s.cid===U();s.tac={...DEFTAC,...s.tac};s.home=i===0&&!m.neutral;s.big=fx.comp!=='L'||isDerby(fx.h,fx.a);
    s.rl=slotRoles(s.form,isU?((G.user.roles||{})[s.form]):null);s.boots=bootsFor(s.cid,fx,m.cond);s.spr=isU?{...SPDEF,...(G.user.spr||{})}:{...SPDEF};
    s.drill=isU?(G.user.drill||0):0;s.famE=isU?famEff(s):95;});
  m.sides.forEach((s,i)=>{s.weak=weakFB(m.sides[1-i]);});}
function paceOf(s){const F=FORMS[s.form].s;let n=0;s.xi.forEach((pid,i)=>{if(i&&onPitch(s,pid)&&['WG','CF','IF'].includes(F[i][0])&&hasT(G.players[pid],'pace'))n++;});return n;}

/* ---- what the roles, instructions, players, conditions and shouts do to a side ---- */
function tacFx(s){const X={A:1,M:1,D:1,gk:1};const meta={hdr:0.07,scW:new Array(11).fill(1),hW:new Array(11).fill(1),asW:new Array(11).fill(1),rate:1,oppRate:1,pH:0,gkShot:1,gkHdr:1,tire:1,book:1,cover:0,paceN:0,penP:0.03};s.fx=meta;
  const o=s.o,m=s.m;if(!o||!m||!s.rl)return X;const F=FORMS[s.form].s;const t=s.tac,ot=o.tac||DEFTAC;const c=m.cond||{};const isU=s.cid===U();
  const P=i=>{const pid=s.xi[i];return onPitch(s,pid)?G.players[pid]:null;};
  let avg=0,n=0;for(let i=1;i<11;i++){const p=P(i);if(p){avg+=p.ca;n++;}}avg=n?avg/n:60;const q=p=>clamp(p.ca/avg,0.85,1.15);
  const cnt=k=>{let c2=0;for(let i=1;i<11;i++)if(hasT(P(i),k))c2++;return c2;};
  const muddy=['mud','heavy','frozen','snow'].includes(c.pitch);const trick=muddy?0.5:c.pitch==='hard'?1.2:1;
  meta.paceN=paceOf(s);const opPace=paceOf(o);const oF=FORMS[o.form].s;const oCH=oF.filter(sl=>sl[0]==='CH').length;
  const oRole=k=>(o.rl||[]).some((r,j)=>r===k&&onPitch(o,o.xi[j]));
  /* goalkeeper traits */
  const gk=P(0);if(gk){if(hasT(gk,'shotstopper'))meta.gkShot*=0.94;if(hasT(gk,'commands'))meta.gkHdr*=0.88;}
  /* roles */
  for(let i=0;i<11;i++){const p=P(i);if(!p)continue;const r=s.rl[i];const k=q(p)*synOf(p,r)*(isU&&['byline','inside','overlap'].includes(r)?1+0.08*staffQ('wing'):1)*(isU&&(r==='line'||r==='claim')?1+0.06*staffQ('gk'):1);
    switch(r){
     case 'line':meta.gkShot*=0.98;meta.gkHdr*=1.05;break;
     case 'claim':meta.gkShot*=1.02;meta.gkHdr*=hasT(p,'commands')?0.86:0.9;break;
     case 'home':X.D*=1+0.005*k;break;
     case 'overlap':X.A*=1+0.011*k*(t.width===2?1.25:1)*(c.size==='small'?0.7:c.size==='large'?1.2:1);X.D*=1-0.01/Math.max(1,k*0.8);meta.hdr+=0.01;meta.scW[i]=3;meta.asW[i]=2;meta.exposed=(meta.exposed||0)+1;break;
     case 'stopper':X.D*=1+0.005*k*(oRole('target')||o.xi.some(pid=>hasT(G.players[pid],'header')&&onPitch(o,pid))?1.8:1);break;
     case 'ball':X.M*=1+0.009*k;X.D*=0.994;break;
     case 'libero':X.D*=1+0.011*k;X.M*=1.003;meta.cover++;break;
     case 'attack':X.A*=1+0.009*k;X.D*=0.993;meta.scW[i]=2.2;break;
     case 'link':X.M*=1+0.004*k;break;
     case 'hold':X.D*=1+0.006*k*(1+0.5*Math.min(2,(o.rl||[]).filter((r2,j)=>(r2==='schemer'||r2==='deep')&&onPitch(o,o.xi[j])).length));X.A*=0.995;meta.scW[i]=0.4;break;
     case 'schemer':X.M*=1+0.009*k*(t.pass===2?1.2:1);meta.scW[i]=0.75;meta.asW[i]=1.7;break;
     case 'goals':X.A*=1+0.009*k;X.M*=0.995;meta.scW[i]=1.45;break;
     case 'deep':X.M*=1+0.01*k;if(F[i][0]==='CF'){X.A*=0.996;meta.scW[i]=0.7;}else{meta.scW[i]=0.8;}if(oCH===1&&oRole('stopper'))X.A*=1+0.012*k;F.forEach((sl,j)=>{if(j!==i&&sl[0]==='IF')meta.scW[j]*=1.15;});break;
     case 'byline':meta.hdr+=0.018*(t.width===2?1.3:t.width===0?0.6:1);X.A*=1+0.004*k*trick;break;
     case 'inside':meta.scW[i]=1.7;X.A*=1+0.006*k*trick;meta.hdr-=0.008;break;
     case 'target':meta.hdr+=0.028*(hasT(p,'header')?1.5:0.7);meta.hW[i]=1.4;if(t.pass===0)X.A*=1+0.01*(hasT(p,'header')?1:0.5);break;
     case 'poacher':meta.scW[i]=1.35;X.M*=0.996;break;}}
  /* the players' own gifts */
  const pm=cnt('playmaker'),dr=cnt('dribbler'),en=cnt('engine'),hm=cnt('hardman'),ld=cnt('leader'),hh=cnt('hothead');
  if(t.pass===2)X.M*=1+0.005*pm*(muddy?0.5:1);if(t.focus===2)X.A*=1+0.005*pm;
  if(t.width===2)X.A*=1+0.004*dr*trick;meta.penP=0.03*(1+0.12*dr*trick);
  meta.tire*=1-0.06*Math.min(3,en);meta.book*=1+0.15*hh+0.06*hm;
  if(t.line===2||t.trap)X.D*=1+0.006*Math.min(2,ld);
  if(s.big){const bg=cnt('bigmatch');X.A*=1+0.006*bg;X.M*=1+0.004*bg;X.D*=1+0.004*bg;}
  /* the defensive line */
  const cover=meta.cover+Math.min(2,ld)*0.5;
  if(t.line===0){meta.pH-=0.02;X.D*=1.012;meta.oppRate*=0.97;meta.rate*=0.98;if(t.trap)X.D*=0.99;}
  else if(t.line===2){meta.pH+=0.02;X.M*=1.008;meta.oppRate*=1+(0.03+0.045*opPace+(ot.pass===0?0.02:0)+(ot.counter?0.03:0))/(1+0.6*cover);}
  /* closing down */
  const pz=c.size==='small'?1.3:c.size==='large'?0.8:1;
  if(t.press===2){meta.pH+=0.02*(1+0.15*en+0.1*hm)*pz*(ot.pass===2?1.5:ot.pass===0?0.15:1);X.M*=1+0.008*(ot.pass===0?0:1);if(ot.pass===0)meta.oppRate*=1.04;meta.tire*=1.3*(muddy?1.15:1)*(c.wx==='warm'?1.15:1);meta.book*=1.2;}
  else if(t.press===0){meta.pH-=0.015*(ot.pass===2?1.4:1);meta.tire*=0.88;X.D*=1.005;}
  /* where the attacks go */
  if(t.focus===1){meta.hdr+=0.015;F.forEach((sl,i)=>{if(sl[0]==='WG'||sl[0]==='FB')meta.scW[i]*=1.2;});
    let mine=0,mn=0,theirs=0,tn=0;F.forEach((sl,i)=>{const p=P(i);if(p&&(sl[0]==='WG'||s.rl[i]==='overlap')){mine+=eff(p,sl[0]);mn++;}});oF.forEach((sl,i)=>{const p=o.xi[i]&&G.players[o.xi[i]];if(p&&sl[0]==='FB'){theirs+=eff(p,'FB');tn++;}});
    const edge=mn&&tn?(mine/mn-theirs/tn)/Math.max(30,theirs/tn):0;X.A*=1+clamp(edge*0.25,-0.012,0.02)+(ot.width===0?0.006:0)+(oRole('overlap')?0.006:0)+(oCH>=3?0.01:0);}
  else if(t.focus===2){meta.hdr-=0.015;F.forEach((sl,i)=>{if(sl[0]==='IF'||sl[0]==='CF')meta.scW[i]*=1.15;});X.A*=1+(oCH<=1?0.02:oCH>=3?-0.02:0)+(o.rl||[]).filter(r=>r==='hold').length*-0.004;}
  else if(t.focus===3&&s.weak){let best=0;F.forEach((sl,i)=>{const ln=sl[2]<38?'L':sl[2]>62?'R':'C';if(ln===s.weak.lane){meta.scW[i]*=1.35;const p=P(i);if(p&&(sl[0]==='WG'||sl[0]==='FB'||sl[0]==='WH'))best=Math.max(best,eff(p,sl[0])*(hasT(p,'pace')||hasT(p,'dribbler')?1.08*trick:1));}});
    const edge=(best-s.weak.v)/Math.max(30,s.weak.v);X.A*=1+clamp(edge*0.3+s.weak.gap*0.15,-0.012,0.035);}
  /* on the break */
  if(t.counter){meta.pH-=0.02;meta.rate*=0.95;meta.oppRate*=0.93;}
  /* the conditions */
  if(c.pitch==='mud'){if(t.pass===2)X.M*=0.97;if(t.pass===0)X.A*=1.015;meta.tire*=1.25;}
  else if(c.pitch==='heavy'){if(t.pass===2)X.M*=0.985;if(t.pass===0)X.A*=1.008;meta.tire*=1.12;}
  else if(c.pitch==='hard'){if(t.pass===2)X.M*=0.99;X.A*=1+0.004*meta.paceN;}
  else if(c.pitch==='lush'){if(t.pass===2)X.M*=1.01;meta.tire*=1.12;}
  if(c.wx==='wind'&&t.pass===0)X.A*=0.985;if(c.wx==='warm')meta.tire*=1.25;if(c.size==='large'){meta.tire*=1.1;if(t.width===2)X.A*=1.008;}if(c.size==='small'&&t.width===2)X.A*=0.99;
  const bm=(BOOTM[c.pitch]||BOOTM.def)[s.boots||'moulded'];X.A*=bm;X.M*=bm;X.D*=bm;
  if(s.home&&(muddy||c.size))X.M*=1.007;
  /* how well they know the system */
  const fe=s.famE==null?95:s.famE;X.M*=0.95+0.05*fe/100;X.D*=0.95+0.05*fe/100;X.A*=0.97+0.03*fe/100;
  /* the week's training */
  if(isU){const L=G.user.trl||{};const lv=k=>(L[k]||0)/100;
    meta.tire*=1-0.18*lv('fit');X.M*=1+0.005*lv('ball')+(t.pass===2?0.01*lv('ball'):0);X.D*=1+0.016*lv('def')+((t.line===2||t.trap)?0.006*lv('def'):0);X.A*=1+0.016*lv('att');
    if(t.press===2){meta.pH+=0.012*lv('press');meta.tire*=1-0.15*lv('press');}else X.M*=1+0.003*lv('press');
    if(m.min>=75&&Math.abs(m.sc[0]-m.sc[1])<=1){const lk=1+0.03*lv('late');X.A*=lk;X.D*=lk;}
    if(G.user.trainM==='rest'){X.A*=0.996;X.M*=0.996;X.D*=0.996;}}
  /* the shout from the dugout */
  const sh=s.shout;if(sh&&sh.pow>0){const k=sh.pow;
    if(sh.k==='fwd'){X.A*=1+0.05*k;X.D*=1-0.025*k;meta.rate*=1+0.06*k;}
    else if(sh.k==='tight'){X.D*=1+0.05*k;X.A*=1-0.04*k;meta.oppRate*=1-0.06*k;meta.rate*=1-0.05*k;}
    else if(sh.k==='stuck'){X.D*=1+0.02*k;X.M*=1+0.025*k;}
    else if(sh.k==='calm'){X.M*=1+0.015*k;}
    else if(sh.k==='push'){meta.pH+=0.04*k;meta.oppRate*=1+0.04*k*(1+0.25*opPace);meta.rate*=1.03;}}
  meta.hdr=clamp(meta.hdr*(c.wx==='wind'?0.85:1),0.02,0.25);
  return X;}

/* ---- in the match ---- */
function condRate(m){const c=m.cond||{};return (c.wx==='fog'?0.92:1)*(c.pitch==='mud'?0.95:c.pitch==='snow'?0.95:c.pitch==='frozen'?0.97:1);}
const wasteLvl=s=>s.shout&&s.shout.k==='waste'&&s.shout.pow>0?4:(s.tac.waste||0);
function wasteM(m,i){if(m.min<60)return 1;const s=m.sides[i],o=m.sides[1-i];const d=m.sc[i]-m.sc[1-i];
  if(d>0)return 1-0.06*wasteLvl(s);if(d<0){const w=wasteLvl(o);let k=1-0.07*w;if(w>=2&&s.home&&!o.home)k*=1+0.03*w;return k;}return 1;}
const TACCAL=0.975;
function tacRate(m,i){const s=m.sides[i],o=m.sides[1-i];return ((s.fx&&s.fx.rate)||1)*((o.fx&&o.fx.oppRate)||1)*wasteM(m,i)*condRate(m)*TACCAL;}
function tacPH(m){const [H,A]=m.sides;return ((H.fx&&H.fx.pH)||0)-((A.fx&&A.fx.pH)||0);}
function bookM(m,i){const s=m.sides[i];let k=(s.fx&&s.fx.book)||1;if(m.min>=60&&m.sc[i]>m.sc[1-i])k*=1+0.25*wasteLvl(s);const sh=s.shout;if(sh){if(sh.k==='stuck')k*=1+sh.pow;if(sh.k==='calm')k*=1-0.45*sh.pow;}return k;}
function wpick(arr,wf){let tot=0;const w=arr.map(x=>{const v=wf(x);tot+=v;return v;});let r=rand()*tot;for(let k=0;k<arr.length;k++){r-=w[k];if(r<=0)return arr[k];}return arr[arr.length-1];}
const bookPick=c=>wpick(c,pid=>{const p=G.players[pid];return (hasT(p,'hothead')?2.6:1)*(hasT(p,'hardman')?1.7:1);});
function injM(m,i){const o=m.sides[1-i];const c=m.cond||{};let k=c.pitch==='frozen'||c.pitch==='snow'?1.3:c.pitch==='hard'?1.1:1;if(o.shout&&o.shout.k==='stuck')k*=1+0.3*o.shout.pow;if(o.tac.press===2)k*=1.1;return k;}
const injPick=c=>wpick(c,([pid])=>hasT(G.players[pid],'injprone')?2.2:1);
function stoppage(m){if(m.min===90&&m.max===90&&!m.addOn){const w=Math.round(((m.sides[0].wasted||0)+(m.sides[1].wasted||0))/5);if(w>0){m.addOn=Math.min(4,w);m.max+=m.addOn;addEv(m,-1,'flav',`The referee has been looking at his watch. He plays on: ${m.addOn} minute${m.addOn===1?'':'s'} added for time-wasting.`);}}}
const T2={counter:['{c} break at speed! {p} is away.','Caught upfield! {c} pour forward on the counter.','A quick break from {c}, and suddenly it is three against two.'],lthrow:['{p} wipes the ball on his shirt and hurls a long throw into the box.','Another long throw from {p}. It is like a corner.'],
 fk:['{p} curls the free kick... and it is in! The wall did not move.','A thunderbolt of a free kick from {p}!'],fkMiss:['{p} curls the free kick just over.','The free kick from {p} smacks into the wall.','{p} goes for goal from the free kick. Wide.'],
 cnt:['{p} finishes the break off coolly.','{p} outpaces everyone and slots it home on the counter!'],lt:['From the long throw, {p} gets his head to it. In!'],cor:['From the corner... {p} meets it with a bullet header! That one came off the training ground!','The corner is whipped in, and {p} nods it home.'],
 react:['{c} change things on the bench: they are throwing men forward.','{c} are going for it now. Everybody up.'],sitback:['{c} have pulled everybody back behind the ball.']};
function tacMinute(m){m.sides.forEach((s,i)=>{
    if(s.shout&&m.min>=s.shout.until){s.shout=null;s.str=strength(s);}
    if(s.cid!==U()&&(m.min===66||m.min===78)){const d=m.sc[i]-m.sc[1-i];const q=mq(s.cid);let ch='';
      if(d<0&&s.ment<2&&rand()<0.35+0.08*q){s.ment=2;if(m.min===78&&rand()<0.5)s.tac.tempo=2;ch='react';}
      else if(d===1&&m.min===78&&s.ment>0&&rand()<0.2+0.07*q){s.ment=0;s.tac.waste=Math.max(s.tac.waste||0,2);ch='sitback';}
      if(ch){s.str=strength(s);if(m.live)addEv(m,i,'flav',fill(pick(T2[ch]),{c:club(s.cid).s}));}}});
  if(m.min>=60)m.sides.forEach((s,i)=>{if(m.sc[i]>m.sc[1-i]&&wasteLvl(s)>0)s.wasted=(s.wasted||0)+wasteLvl(s)*0.25;});}
function extraChances(m){for(let i=0;i<2;i++){const s=m.sides[i],o=m.sides[1-i];const X=s.fx||{};const share=i?1-m.pH:m.pH;const c=m.cond||{};
  if(s.tac.counter){let p=0.016*(1-share)*(o.ment===2?2.3:o.ment===0?0.4:1)*(o.tac.line===2?1.4:o.tac.line===0?0.7:1)*(1+0.22*(X.paceN||0))*((o.fx&&o.fx.cover)?0.8:1)*((o.fx&&o.fx.exposed)?1+0.1*o.fx.exposed:1);
    if(m.min>=70&&m.sc[i]<m.sc[1-i])p*=0.5;if(c.pitch==='mud')p*=0.8;
    if(rand()<p){(m.cnt=m.cnt||[0,0])[i]++;if(m.live&&rand()<0.6)addEv(m,i,'flav',fill(pick(T2.counter),{c:club(s.cid).s}));chance(m,i,false,'cnt');}}
  if(s.tac.lthrow){const tk=spTaker(s,'lt');if(tk&&rand()<0.008*share*(c.size==='small'?1.4:c.size==='large'?0.8:1)*(c.wx==='wind'?0.8:1)){(m.lts=m.lts||[0,0])[i]++;if(m.live)addEv(m,i,'flav',fill(pick(T2.lthrow),{p:nm(tk)}));chance(m,i,true,'lt');}}}}
function shotMod(m,s,o,p,header,kind){const c=m.cond||{};let g=1;const OX=o.fx||{};const late=m.min>=76||m.aet;
  if(header){g*=OX.gkHdr||1;if(hasT(p,'header'))g*=1.15;if(c.wx==='wind')g*=0.92;}
  else{g*=OX.gkShot||1;if(hasT(p,'shot'))g*=1.07;if(hasT(p,'poacher'))g*=1.04;if(c.wx==='rain'||c.wx==='drizzle')g*=1.05;if(c.pitch==='frozen'||c.pitch==='snow')g*=1.06;if(c.pitch==='mud')g*=1.04;}
  if(late&&Math.abs(m.sc[0]-m.sc[1])<=1){if(hasT(p,'ice'))g*=1.12;else if(s.big)g*=0.97;if(s.cid===U())g*=1+0.06*((G.user.trl||{}).late||0)/100;}
  if(kind==='fk')g*=(hasT(p,'deadball')?1.5:0.85)*(hasT(p,'shot')?1.15:1)*0.85;
  if(kind==='rfk')g*=1+0.003*(s.drill||0);
  if(kind==='cnt')g*=(o.ment===2||o.tac.line===2?1.3:1.1)*(hasT(p,'pace')?1.08:1);
  if(kind==='cor'||kind==='lt'||kind==='fkx')g*=1+0.0015*(s.drill||0);
  return g;}
function cornerKind(m,i){const s=m.sides[i],o=m.sides[1-i];const q=s.cid===U()?staffQ('set'):0;const tk=spTaker(s,'cor');
  let p=0.04+0.05*q+(hasT(G.players[tk],'deadball')?0.012:0)+(s.drill||0)*0.0002-((o.fx&&o.fx.gkHdr<0.9)?0.01:0)+((m.cond||{}).wx==='wind'?0.006:0);
  const r=(s.spr||SPDEF).cor;if(r==='near')p+=nearTarget(s)?0.014:-0.008;else if(r==='far')p+=farTarget(s)?0.014:-0.008;
  else if(r==='short'){if(rand()<0.03+(s.drill||0)*0.0003){s.cornerRoutine=r;return 'short';}p*=0.55;}
  if(rand()<p){s.cornerRoutine=r;return 'cor';}return null;}
function anLog(m,i,pid,kind,res){if(m.us<0)return;const s=m.sides[i];const j=s.xi.indexOf(pid);const x=j>-1?FORMS[s.form].s[j][2]:50;(m.an=m.an||[]).push([i,x<38?'L':x>62?'R':'C',kind||'open',res,m.min]);}

/* ---- the second leg: where the tie stands ---- */
function firstLeg(f){return f.leg===2?G.fx.find(x=>x.comp===f.comp&&x.tie===f.tie&&x.leg===1&&x.p&&(f.comp!=='EU'||x.eu===f.eu)):null;}
function aggNow(f,sc){const l1=firstLeg(f);if(!l1)return null;const g=cid=>(l1.h===cid?l1.hg:l1.ag);return [g(f.h)+(sc?sc[0]:0),g(f.a)+(sc?sc[1]:0)];}
function aggHTML(f){const l1=firstLeg(f);if(!l1)return '';const a=aggNow(f);const us=f.h===U()?0:1;const me=a[us],th=a[1-us];const d=me-th;
  return `<div class="aggbox"><p class="eyebrow">Second leg</p><p><strong>First leg:</strong> ${esc(cn(l1.h))} ${l1.hg}-${l1.ag} ${esc(cn(l1.a))}</p><p class="aggline">${d>0?`${esc(cn(U()))} lead ${me}-${th} on aggregate. A draw tonight will do.`:d<0?`${esc(cn(U()))} trail ${me}-${th} on aggregate. It needs ${-d===1?'a win by one to force a play-off, or two clear to go through':`a win by ${-d+1} to go through`}.`:`All square at ${me}-${th} on aggregate. Whoever wins tonight goes through.`}</p></div>`;}

/* ---- the chalkboard ---- */
const KIND1={open:'open play',cross:'a cross',cor:'a corner',fk:'a free kick',fkx:'a free kick',rfk:'a free-kick routine',pen:'a penalty',lt:'a long throw',cnt:'a counter-attack',short:'a short corner'};
const KINDN={open:'Open play',cross:'Crosses',cor:'Corners',fk:'Direct free kicks',fkx:'Free kicks into the box',rfk:'Rehearsed free kicks',pen:'Penalties',lt:'Long throws',cnt:'Counter-attacks',short:'Short corners'};
function buildAn(m){const fx=m.fx;const us=m.us;const S=m.sides;const tot=m.terr[0]+m.terr[1]||1;const s=S[us],o=S[1-us];
  let best=null;s.played.forEach(pid=>{const r=s.rt[pid]??6.4;if(!best||r>best.r)best={n:G.players[pid]?G.players[pid].n:'?',r};});
  const a={us,ch:(m.an||[]),cnt:m.cnt||[0,0],lts:m.lts||[0,0],sh:S.map(x=>x.shots),sot:S.map(x=>x.sot),cor:S.map(x=>x.corners),terr:Math.round(m.terr[us]/tot*100),
    bk:S.map(x=>Object.values(x.bk||{}).reduce((t,v)=>t+v,0)),off:S.map(x=>Object.keys(x.off||{}).length),cond:m.cond,boots:s.boots,obboots:o.boots,fam:Math.round(s.famE||95),form:s.form,oform:o.form,
    tac:{...s.tac},ment:s.ment,oment:o.ment,otac:{...o.tac},weak:s.weak?{n:G.players[s.weak.pid]?G.players[s.weak.pid].n:'',side:s.weak.side,lane:s.weak.lane,gap:s.weak.gap}:null,tire:[S[0].tire||0,S[1].tire||0],
    wasted:Math.round(s.wasted||0),add:m.addOn||0,best,shouts:(s.shoutLog||[]).map(x=>[x.k,x.min,Math.round(x.pow*100)/100,x.sc]),goals:m.goals.map(g=>[g.min,g.side,g.name,g.kind||(g.flag==='pen'?'pen':'open'),g.flag]),
    train:G.user.trainM||'',rl:s.rl.slice(),sc:m.sc.slice()};
  fx.an=a;const ids=G.user.anIds=(G.user.anIds||[]).filter(id=>id!==fx.id);ids.push(fx.id);while(ids.length>12){const old=ids.shift();const f0=G.fx.find(x=>x.id===old);if(f0)delete f0.an;}}
function anNotes(a){const us=a.us,th=1-us;const plan=[],adv=[];const lanes=side=>{const r={L:0,C:0,R:0},g={L:0,C:0,R:0};a.ch.forEach(([i,ln,k,res])=>{if(i===side){r[ln]++;if(res==='goal')g[ln]++;}});return {r,g};};
  const mine=lanes(us),theirs=lanes(th);const LN={L:'left',C:'middle',R:'right'};const kinds=side=>{const r={};a.ch.forEach(([i,ln,k,res])=>{if(i===side){r[k]=r[k]||[0,0];r[k][0]++;if(res==='goal')r[k][1]++;}});return r;};const KM=kinds(us),KT=kinds(th);
  const t=a.tac;const myG=a.sc[us],thG=a.sc[th];
  if(t.focus===3&&a.weak)plan.push(`We went at their ${a.weak.side}-back, ${a.weak.n}: ${mine.r[a.weak.lane]} chance${mine.r[a.weak.lane]===1?'':'s'} down that side, ${mine.g[a.weak.lane]} goal${mine.g[a.weak.lane]===1?'':'s'}.${a.weak.gap>0.08?' He was there for the taking.':' He was not as slow as we thought.'}`);
  if(t.focus===1)plan.push(`Down the flanks: ${plu(mine.r.L+mine.r.R,'chance')} from the wings, ${mine.r.C} through the middle.`);
  if(t.focus===2)plan.push(`Through the middle: ${plu(mine.r.C,'chance')} there, ${mine.r.L+mine.r.R} from wide.`);
  if(t.counter)plan.push(a.cnt[us]?`On the break: ${a.cnt[us]} counter-attack${a.cnt[us]===1?'':'s'}, ${(KM.cnt||[0,0])[1]} goal${(KM.cnt||[0,0])[1]===1?'':'s'}.${a.oment===0?' They sat back, so there was little room to break into.':''}`:`We set up to counter, but they never gave us the room.${a.oment===0?' They sat deep all afternoon.':''}`);
  if(a.cnt[th])plan.push(`They caught us on the break ${a.cnt[th]} time${a.cnt[th]===1?'':'s'}.${t.line===2?' The high line left room behind.':''}`);
  if(t.lthrow)plan.push(a.lts[us]?`Long throws: ${a.lts[us]} into the box, ${(KM.lt||[0,0])[1]} goal${(KM.lt||[0,0])[1]===1?'':'s'}.`:'Long throws were on, but nobody on the pitch could throw it far enough.');
  if((KM.cor||KM.short))plan.push(`Corners: ${a.cor[us]} won, ${(KM.cor||[0,0])[0]+(KM.short||[0,0])[0]} turned into a chance, ${(KM.cor||[0,0])[1]+(KM.short||[0,0])[1]} goal${((KM.cor||[0,0])[1]+(KM.short||[0,0])[1])===1?'':'s'}.`);
  if(KM.fk||KM.fkx||KM.rfk){const f=[KM.fk,KM.fkx,KM.rfk].reduce((s2,x)=>[s2[0]+(x?x[0]:0),s2[1]+(x?x[1]:0)],[0,0]);plan.push(`Free kicks in range: ${f[0]}, ${f[1]} scored.`);}
  if(t.press===2)plan.push(`Harrying them: we had ${a.terr}% of the territory.${a.tire[us]>0.035?' The legs had gone by the last twenty minutes.':''}${a.otac.pass===0?' They went long over the top of it, which took the sting out.':''}`);
  if(t.waste&&a.wasted)plan.push(`Time-wasting: ${plu(a.wasted,'minute')} slowed down${a.add?`, and the referee added ${a.add} on`:''}${a.bk[us]>=3?`. ${a.bk[us]} names in the book`:''}.`);
  const c=a.cond;if(c){const bb=bestBoots(c.pitch);plan.push(`Conditions: ${condLine(c)} ${a.boots===bb?`We had the right boots on (${BOOTS[a.boots].toLowerCase()}).`:`We wore ${BOOTS[a.boots].toLowerCase()}; ${BOOTS[bb].toLowerCase()} were the thing for it.`}${a.obboots!==bb&&a.boots===bb?' They got it wrong, and it showed.':''}`);}
  if(a.fam<60)plan.push(`The lads still look unsure of the ${FORMS[a.form].lbl} (${famWord(a.fam).toLowerCase()}).`);
  a.shouts.forEach(([k,min,pow,sc])=>{const after=a.goals.filter(g=>g[0]>=min&&g[0]<min+11);const f=after.filter(g=>g[1]===us).length,ag=after.filter(g=>g[1]===th).length;plan.push(`${min}': "${SHOUTS[k][0]}" ${pow<=0.3?'Nobody could hear it over the crowd.':f&&!ag?`We scored in the next ten minutes.`:ag&&!f?'We conceded in the next ten minutes.':pow>=1.2?'It landed.':pow<=0.5?'It barely registered.':'No harm done.'}`);});
  /* the coach's advice */
  if(a.terr<42)adv.push(`We were overrun in the middle (${a.terr}% of the territory). An extra man in midfield, a destroyer, or closing them down would help.`);
  const wide=['L','R'].sort((x,y)=>theirs.r[y]-theirs.r[x])[0];if(theirs.r[wide]>=4&&theirs.r[wide]>=theirs.r.C+2)adv.push(`They got a lot of joy down our ${LN[wide==='L'?'R':'L']} side (${theirs.r[wide]} chances). Our full-back there needs help, or to stay at home.`);
  const bestL=['L','C','R'].sort((x,y)=>mine.r[y]-mine.r[x])[0];if(mine.r[bestL]>=4)adv.push(`Most of our good stuff came down the ${LN[bestL]}. Keep feeding it.`);
  if(a.sh[us]>=10&&a.sot[us]<=a.sh[us]*0.35)adv.push(`${a.sh[us]} shots and only ${a.sot[us]} on target. Shooting practice this week.`);
  if((KT.cor||[0,0])[1]+(KT.lt||[0,0])[1]+(KT.fkx||[0,0])[1]>=1)adv.push('We conceded from a set piece. A week of set-piece work, or a keeper who comes for crosses, would help.');
  if(a.tire[us]>0.04)adv.push('We were dead on our feet at the end. A lighter week, or less running, before the next one.');
  if(a.cnt[th]>=2&&t.line===2)adv.push('Their quick men kept getting in behind. Drop the line a touch, or play a sweeper.');
  if(myG>thG&&!adv.length)adv.push('Same again next week, boss. That is how it is done.');
  if(myG<thG&&!adv.length)adv.push('Nothing much wrong with the plan. On another day they go in.');
  if(!adv.length)adv.push(myG===0?'A point, but we never really got at them. More men in the box next time.':'A fair point. Nothing much to choose between the sides.');
  return {plan,adv:adv.slice(0,2+Math.min(2,bestCoachQ())),mine,theirs,KM,KT};}
function chalkHTML(N){const f=G.fx.find(x=>x.id===N.fx);if(!f||!f.an)return `<div class="scrim" data-a="noticeclose"></div><div class="chalk" role="dialog" aria-modal="true" aria-label="The chalkboard"><p class="ck-t">The board has been wiped.</p><button class="btn" data-a="noticeclose">Close</button></div>`;
  const a=f.an;const us=a.us,th=1-us;const N2=anNotes(a);const me=us===0?f.h:f.a,op=us===0?f.a:f.h;
  /* the pitch: we attack left to right, so our left flank is at the top */
  const W=320,H=210;const laneY={L:42,C:105,R:168},laneYt={L:168,C:105,R:42};
  const arrow=(x1,x2,y,n,g,col)=>{if(!n)return '';const w=Math.min(12,2+n*1.6);const dir=x2>x1?1:-1;return `<g class="ck-arr" style="color:${col}"><path d="M${x1} ${y} C${(x1+x2)/2} ${y-14*dir} ${(x1+x2)/2} ${y+14*dir} ${x2} ${y}" stroke="currentColor" stroke-width="${w}" fill="none" stroke-linecap="round" opacity=".85"/><path d="M${x2} ${y} l${-10*dir} -8 M${x2} ${y} l${-10*dir} 8" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><text x="${(x1+x2)/2}" y="${y-12}" text-anchor="middle">${n}${g?` (${g})`:''}</text></g>`;};
  const svg=`<svg viewBox="0 0 ${W} ${H}" class="ck-pitch" role="img" aria-label="Where the chances came from"><g fill="none" stroke="currentColor" stroke-width="2" opacity=".75"><rect x="6" y="6" width="${W-12}" height="${H-12}" rx="3"/><path d="M${W/2} 6 V${H-6}"/><circle cx="${W/2}" cy="${H/2}" r="26"/><rect x="6" y="${H/2-44}" width="40" height="88"/><rect x="${W-46}" y="${H/2-44}" width="40" height="88"/><rect x="6" y="${H/2-18}" width="14" height="36"/><rect x="${W-20}" y="${H/2-18}" width="14" height="36"/></g>
    ${['L','C','R'].map(l=>arrow(W/2+8,W-56,laneY[l],N2.mine.r[l],N2.mine.g[l],'#f4f1e8')).join('')}${['L','C','R'].map(l=>arrow(W/2-8,56,laneYt[l],N2.theirs.r[l],N2.theirs.g[l],'#f2d46b')).join('')}</svg>`;
  const row=(l,a0,a1)=>`<tr><td>${a0}</td><td class="l">${l}</td><td>${a1}</td></tr>`;
  const gl=a.goals.map(g=>`<li><span>${g[0]}'</span> ${esc(g[2])} <small>(${g[1]===us?'us':'them'}, ${esc(KIND1[g[3]]||'open play')})</small></li>`).join('');
  return `<div class="scrim" data-a="noticeclose"></div><div class="chalk" role="dialog" aria-modal="true" aria-label="The chalkboard: match analysis"><button class="x" data-a="noticeclose" aria-label="Close">×</button>
   <div class="ck-head"><p class="ck-t">The chalkboard</p><p class="ck-s">${esc(cn(f.h))} ${f.hg}-${f.ag} ${esc(cn(f.a))}${f.aet?' (a.e.t.)':''} · ${fmtDate(f.date,true)}</p></div>
   <div class="ck-grid"><div><p class="ck-h">Where the chances came from</p>${svg}<p class="ck-key"><span class="ck-us">${esc(club(me).s)}: white chalk, attacking left to right</span><span class="ck-them">${esc(club(op).s)}: yellow chalk</span>Goals in brackets.</p>
     <table class="ck-tbl"><thead><tr><th>${esc(club(me).s)}</th><th></th><th>${esc(club(op).s)}</th></tr></thead><tbody>${row('Shots',a.sh[us],a.sh[th])}${row('On target',a.sot[us],a.sot[th])}${row('Corners',a.cor[us],a.cor[th])}${row('Territory',a.terr+'%',(100-a.terr)+'%')}${row('Counter-attacks',a.cnt[us],a.cnt[th])}${row('Names taken',a.bk[us],a.bk[th])}</tbody></table>
     ${gl?`<p class="ck-h">The goals</p><ul class="ck-goals">${gl}</ul>`:''}${a.best?`<p class="ck-h">Our best man</p><p>${esc(a.best.n)}, ${a.best.r.toFixed(1)}</p>`:''}</div>
    <div><p class="ck-h">How the plan worked</p><p class="ck-sm">${esc(FORMS[a.form].lbl)}, ${MENT[a.ment].toLowerCase()}. ${esc(tacSummary(a.tac))}. They played ${esc(FORMS[a.oform].lbl)}.</p><ul class="ck-list">${N2.plan.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
     <p class="ck-h">${esc(assistantName())} says</p><ul class="ck-list ck-adv">${N2.adv.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div>
   <div class="row center"><button class="btn" data-a="noticeclose">Wipe the board</button></div></div>`;}
function bestCoachQ(){return (G.user.staff||[]).reduce((m,s)=>Math.max(m,s.q),0);}
function assistantName(){const st=(G.user.staff||[]).slice().sort((a,b)=>b.q-a.q)[0];return st?st.n:'The trainer';}

/* ---- the dossier and the assistant's view ---- */
function dossierData(f,opp){const oc=club(opp);const ob=bestXI(opp,oc.form);const F=FORMS[oc.form];const xi=ob.xi.map(id=>id&&G.players[id]);
  const q=staffQ('scout')+(upgDone('tr_film')?1:0);const acc=Math.min(0.97,0.72+0.06*q);const fr=seeded(hashStr('dos'+f.id)%233280)();
  const keys=Object.keys(FORMS).filter(k=>k!==oc.form&&!formLock(k));const formShown=fr<acc?oc.form:keys[hashStr('df'+f.id)%keys.length];
  let weak=null,sum=0,n=0;F.s.forEach((sl,i)=>{const p=xi[i];if(!p||i===0)return;const v=eff(p,sl[0]);sum+=v;n++;if(sl[0]==='FB'&&(!weak||v<weak.v))weak={p,v,side:sl[2]<50?'left':'right',lane:sl[2]<50?'R':'L'};});
  if(weak){weak.gap=((sum/n)-weak.v)/Math.max(30,sum/n);const mineXI=G.user.xi.map(id=>G.players[id]);const MF=FORMS[G.user.form].s;let opp2=null;MF.forEach((sl,i)=>{const ln=sl[2]<38?'L':sl[2]>62?'R':'C';const pr={WG:3,WH:2,IF:2,FB:1}[sl[0]]||0;if(ln===weak.lane&&mineXI[i]&&pr&&(!opp2||pr>opp2.pr||(pr===opp2.pr&&eff(mineXI[i],sl[0])>opp2.v)))opp2={p:mineXI[i],v:eff(mineXI[i],sl[0]),pr};});weak.mine=opp2;}
  const key=xi.filter(Boolean).filter(p=>p.pos!=='GK').sort((a,b)=>b.ca-a.ca).slice(0,3);
  const spT=xi.filter(p=>p&&knownTraits(p).some(k=>['header','deadball','longthrow'].includes(k)));
  const gk=xi[0];const oCH=F.s.filter(sl=>sl[0]==='CH').length;const pace=xi.filter((p,i)=>p&&i&&['WG','CF','IF'].includes(F.s[i][0])&&knownTraits(p).includes('pace'));
  return {oc,xi,formShown,acc,weak,key,spT,gk,oCH,pace,t:{...DEFTAC,...(oc.tac||{})},c:condOf(f),q};}
function advice(f,opp){const D=dossierData(f,opp);const u=G.user;const out=[];const t=D.t;const ch={tac:{}};const mine=(u.xi||[]).map(id=>G.players[id]).filter(Boolean);
  const myPace=mine.filter(p=>hasT(p,'pace')&&['WG','CF','IF'].includes(p.pos)).length;const rd=teamRating(opp)-teamRating(U());const away=f.a===U()&&!f.neutral;
  const bb=bestBoots(D.c.pitch);const curB=(u.bootsFx||{})[f.id]||trainerBoots(f,D.c);if(curB!==bb){out.push(`Put the ${BOOTS[bb].toLowerCase()} on. On a pitch like that, nothing else will do.`);ch.boots=bb;}
  if((D.c.pitch==='mud'||D.c.pitch==='heavy')&&u.tac.pass===2){out.push('Forget the short stuff in that mud. Mix it up, or go long.');ch.tac.pass=D.c.pitch==='mud'?0:1;}
  if((t.line===2||club(opp).ment===2)&&myPace&&!u.tac.counter){out.push(`They push up and come at you. With ${myPace===1?'one quick man':'quick men'} up front, hit them on the break.`);ch.tac.counter=1;}
  else if(club(opp).ment===0&&u.tac.counter){out.push('They will sit back, so there will be no room to counter. Take the game to them.');ch.tac.counter=0;}
  if(D.weak&&D.weak.mine&&D.weak.mine.v-D.weak.v>=5&&u.tac.focus!==3){out.push(`Their ${D.weak.side}-back, ${D.weak.p.n}, is the weak link. ${D.weak.mine.p.n} should eat him alive. Go at him.`);ch.tac.focus=3;}
  else if(D.oCH<=1&&u.tac.focus!==2&&mine.some(p=>hasT(p,'playmaker')||p.pos==='IF'&&p.ca>=teamRating(U())+3)){out.push('They have one centre-half. Get through the middle and pull him about.');ch.tac.focus=2;}
  else if(D.oCH>=3&&u.tac.focus===2){out.push('The middle will be packed with defenders. Go round them, down the flanks.');ch.tac.focus=1;}
  if(t.pass===2&&u.tac.press!==2&&G.year>=1963){out.push('They like to pass it short. Close them down and they will not know what has hit them.');ch.tac.press=2;}
  else if(t.pass===0&&u.tac.press===2){out.push('They go long, so harrying their back four is wasted effort.');ch.tac.press=1;}
  if(D.pace.length>=2&&u.tac.line===2){out.push(`${D.pace.map(p=>p.n).join(' and ')} are quick. A high line is asking for trouble.`);ch.tac.line=1;}
  if(rd>=5&&away&&u.ment!==0){out.push('They are the better side, and we are away. Keep it tight and take a point.');ch.ment=0;}
  else if(rd<=-5&&!away&&u.ment!==2){out.push('We are the better side and at home. Go for them.');ch.ment=2;}
  const thrower=sq(U()).some(p=>hasT(p,'longthrow')&&(u.xi||[]).includes(p.id));if(thrower&&!u.tac.lthrow){out.push('We have a man with a long throw in the side. Use him.');ch.tac.lthrow=1;}
  if(D.gk&&knownTraits(D.gk).includes('commands')&&(u.spr||SPDEF).cor!=='short'){out.push(`${D.gk.n} comes for everything in the air. Play the corners short.`);ch.cor='short';}
  return {D,lines:out.slice(0,2+Math.min(3,bestCoachQ())),ch};}
function dossierHTML(f,opp){const A=advice(f,opp);const D=A.D;const oc=D.oc;const t=D.t;const tl=[];
  tl.push(`${MENT[oc.ment]} approach`);if(t.pass!==1)tl.push(TACOPT.pass.opts[t.pass].toLowerCase());if(t.press===2)tl.push('they harry you all over the pitch');if(t.press===0)tl.push('they stand off');if(t.line===2)tl.push('a high line');if(t.line===0)tl.push('they sit deep');if(t.trap)tl.push('an offside trap');if(t.tackle===2)tl.push('they get stuck in');if(t.counter)tl.push('they like to break');if(t.waste>=2)tl.push('they waste time when in front');
  const t0=tl.join(', ');
  return `<section class="panel dossier"><div class="ph"><div><h3 class="h2 first">The dossier on ${esc(oc.n)}</h3><p class="muted sm">Compiled by ${staffQ('scout')?'your chief scout':'the trainer, who went to watch them'}${D.acc<0.85?'. He is not always right':''}.</p></div></div>
   <div class="dos-grid"><dl class="dl"><div><dt>System</dt><dd>${esc(FORMS[D.formShown].lbl)}${D.formShown!==oc.form?' <small class="muted">(we think)</small>':''}</dd></div><div><dt>How they play</dt><dd>${esc(t0[0].toUpperCase()+t0.slice(1))}.</dd></div>
    <div><dt>Danger men</dt><dd>${D.key.map(p=>`${esc(p.n)} <small class="muted">${POSN[p.pos].toLowerCase()}, ${caK(p)}</small> ${traitMini(p)}`).join('<br>')}</dd></div>
    ${D.weak?`<div><dt>The weak link</dt><dd>${esc(D.weak.p.n)}, their ${D.weak.side}-back <small class="muted">(${caK(D.weak.p)})</small>${D.weak.mine?`. Up against ${esc(D.weak.mine.p.n)}.`:''}</dd></div>`:''}
    <div><dt>Set pieces</dt><dd>${D.spT.length?D.spT.map(p=>`${esc(p.n)} ${traitMini(p)}`).join(', '):'Nothing special. No great threat from dead balls.'}</dd></div>
    ${D.gk?`<div><dt>Their keeper</dt><dd>${esc(D.gk.n)} ${traitMini(D.gk)||'<small class="muted">nothing out of the ordinary</small>'}</dd></div>`:''}
    <div><dt>Conditions</dt><dd>${esc(condLine(D.c))}${D.c.note?` <small class="muted">${esc(D.c.note)}</small>`:''}<br><small class="muted">${esc(CONDTIP[D.c.pitch]||'')} ${esc(CONDTIP[D.c.wx]||'')}</small></dd></div></dl>
   <div class="assist"><p class="eyebrow">${esc(assistantName())}'s view</p>${A.lines.length?`<ul>${A.lines.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><button class="btn sm go" data-a="advise">Do as he says, for this match</button>`:'<p>"Nothing to change, boss. The plan is right for this one."</p>'}
    <div class="bootsel"><span class="lbl">Boots</span><div class="seg">${Object.entries(BOOTS).map(([k,l])=>`<button class="${((G.user.bootsFx||{})[f.id]||trainerBoots(f,D.c))===k?'on':''}" data-a="bootsel" data-k="${k}">${l}</button>`).join('')}</div><small class="muted">${(G.user.bootsFx||{})[f.id]?'Your choice.':staffQ('fit')?'The trainer has put these out.':'The kit man has put out the usual pair.'}</small></div></div></div></section>`;}

/* ---- the panels on the Tactics screen ---- */
function rolePicker(i){const F=FORMS[G.user.form];const sl=F.s[i];const R=ROLES[sl[0]];const cur=slotRoles(G.user.form,(G.user.roles||{})[G.user.form])[i];const p=G.players[G.user.xi[i]];
  return `<div class="rolepick"><span class="lbl">Role for the ${esc(sl[1])}</span><div class="seg" role="group" aria-label="Role">${Object.entries(R).map(([k,r])=>{const lock=roleLock(sl,k);if(lock&&r.only)return '';return `<button class="${cur===k?'on':''}" data-a="setrole" data-i="${i}" data-k="${k}" ${lock?`disabled title="${esc(lock)}"`:''}>${esc(r.n)}</button>`;}).join('')}</div><small class="muted">${esc(R[cur].d)}${p?' '+roleFitLine(p,cur):''}</small></div>`;}
function planPanel(){const P=G.user.plan=G.user.plan||{on:false,ed:'H'};
  return `<section class="panel"><h3 class="h2 first">Match plans</h3><label class="chk"><input type="checkbox" data-c="planon" ${P.on?'checked':''}> <span>Separate plans for home and away. The right one goes in before each match.</span></label>
   ${P.on?`<div class="tacrow"><span class="lbl">Now editing</span><div class="seg">${[['H','Home plan'],['A','Away plan']].map(([k,l])=>`<button class="${P.ed===k?'on':''}" data-a="planed" data-k="${k}">${l}</button>`).join('')}</div><small class="muted">Formation, roles, approach and instructions all belong to the plan. Neutral grounds use the home plan.</small></div>`:''}
   <p class="lbl">Quick plans</p><div class="chips">${PRESETS.map(p=>`<button class="chip" data-a="preset" data-k="${p.k}" title="${esc(p.d)}">${esc(p.n)}</button>`).join('')}</div></section>`;}
const SPREL={pen:['penalty','ice','shot'],fk:['deadball','shot'],cor:['deadball'],lt:['longthrow']};
const SPTR=['penalty','deadball','longthrow','ice','shot','header'];
function spOpt(p,k,cur){const rel=SPREL[k];const tr=traitsOf(p).filter(t=>SPTR.includes(t));const spec=tr.sort((a,b)=>rel.includes(b)-rel.includes(a)).map(t=>(rel.includes(t)?'★ ':'')+TRAITS[t].n).join(', ');
  return `<option value="${p.id}" ${cur===p.id?'selected':''}>${esc(p.n)} · ${POSN[p.pos].toLowerCase()} · ability ${p.ca}${spec?' · '+esc(spec):''}</option>`;}
function spPanel(){const u=G.user;u.sp=u.sp||{};u.spr=u.spr||{cor:null,fk:null};const own=id=>id&&G.players[id]&&G.players[id].c===U();
  const S=(u.xi||[]).map(id=>G.players[id]).filter(p=>p&&p.pos!=='GK'&&p.c===U());
  const sel=(k,lbl,list,need)=>{const rel=SPREL[k];const L=list.slice().sort((a,b)=>(rel.some(t=>hasT(b,t))-rel.some(t=>hasT(a,t)))||b.ca-a.ca);
    return `<div class="sprow ${need&&!inXI(u.sp[k])?'need':''}"><label class="lbl" for="sp-${k}">${lbl}</label>${L.length?`<select id="sp-${k}" class="inp sm" data-c="sptk" data-k="${k}"><option value="" disabled ${inXI(u.sp[k])?'':'selected'}>Choose a taker</option>${L.map(p=>spOpt(p,k,u.sp[k])).join('')}</select>`:'<span class="muted sm">Nobody in the side has a long throw.</span>'}${(u.spNote||{})[k]?`<small class="muted spnote">${esc(u.spNote[k].txt)}</small>`:''}</div>`;};
  const xiS={id:'u',xi:u.xi||[],off:{},hob:{},form:u.form,rl:slotRoles(u.form,(u.roles||{})[u.form])};
  const st=u.spr.cor==='near'?(nearTarget(xiS)?' You have the man for it.':' Nobody up front is much in the air.'):u.spr.cor==='far'?(farTarget(xiS)?' You have the men for it.':' Nobody coming up from the back can head it.'):'';
  const dr=u.drill||0;const thrower=S.some(p=>hasT(p,'longthrow'));
  return `<section class="panel"><h3 class="h2 first">Set pieces</h3><p class="muted sm">Only men in your starting eleven are listed. Each list shows his position and ability, and any set-piece gifts he has: ★ marks the one that matters for that job, and specialists come first. If your man drops out of the side, the best man in it stands in, and your man takes over again when he is back.</p>
   ${sel('pen','Penalties',S,1)}${sel('fk','Free kicks',S,1)}${sel('cor','Corners',S,1)}${sel('lt','Long throws',S.filter(p=>hasT(p,'longthrow')),u.tac.lthrow===1&&thrower)}
   <div class="tacrow ${u.spr.cor?'':'need'}"><span class="lbl">Corners</span><div class="seg">${[['mix','Mixed'],['near','Near post'],['far','Far post'],['short','Short']].map(([k,l])=>`<button class="${u.spr.cor===k?'on':''}" data-a="spr" data-k="cor" data-v="${k}">${l}</button>`).join('')}</div><small class="muted">${u.spr.cor?CORT[u.spr.cor]+st:'Choose one.'}</small></div>
   <div class="tacrow ${u.spr.fk?'':'need'}"><span class="lbl">Free kicks in range</span><div class="seg">${[['shoot','Shoot'],['cross','Cross it in'],['rehearsed','Rehearsed routine']].map(([k,l])=>`<button class="${u.spr.fk===k?'on':''}" data-a="spr" data-k="fk" data-v="${k}">${l}</button>`).join('')}</div><small class="muted">${u.spr.fk?FKT[u.spr.fk]:'Choose one.'}</small></div>
   <div class="famrow"><span>Rehearsal</span><i class="fambar"><b style="width:${dr}%"></b></i><strong>${dr>=75?'Drilled to perfection':dr>=45?'Well rehearsed':dr>=20?'Some work done':'Barely practised'}</strong></div>
   <p class="muted sm">Set-piece training builds this up; it fades without practice.${staffQ('set')?' Your set-piece coach adds to every corner.':''}</p></section>`;}
function trainPanel(){const u=G.user;const fe=famOf(u.form);const xi=(u.xi||[]).map(id=>G.players[id]).filter(Boolean);
  const old=xi.filter(p=>hasT(p,'oldpro')),qk=xi.filter(p=>hasT(p,'quick'));const L=u.trl||{};
  const seg=(key,lbl,act,other)=>`<div class="tacrow ${u[key]?'':'need'}"><span class="lbl">${lbl}</span><div class="seg seg5" role="group" aria-label="${lbl}">${Object.entries(TRAINF).map(([k,[l]])=>`<button class="${u[key]===k?'on':''}" data-a="${act}" data-k="${k}" ${u[other]===k?'disabled title="Already the other focus"':''}>${l}</button>`).join('')}</div><small class="muted">${u[key]?TRAINF[u[key]][1]:'Choose one.'}</small></div>`;
  const bar=(l,v,w)=>`<div class="famrow"><span>${l}</span><i class="fambar"><b style="width:${Math.round(v)}%"></b></i><strong>${w}</strong></div>`;
  const lw=v=>v>=85?'Sharp':v>=60?'Good':v>=30?'Some work done':v>0?'Rusty':'Untouched';
  return `<section class="panel"><h3 class="h2 first">Training and familiarity</h3>
   ${seg('trainM','Main focus','trainm','trainS')}${seg('trainS','Secondary focus','trains','trainM')}
   <p class="muted sm">Training gives the side an edge on top of its normal ability. The main focus builds that edge fast and all the way; the secondary at half the speed, and only so far. An edge you stop working on wears off over about half a season, but the players never drop below their usual level.</p>
   ${bar(esc(FORMS[u.form].lbl),fe,famWord(fe))}${TRL.map(([k,l])=>bar(l,L[k]||0,lw(L[k]||0))).join('')}${bar('Set pieces',u.drill||0,lw(u.drill||0))}
   ${old.length?`<p class="sm">Set in their ways: ${old.map(p=>esc(p.n)).join(', ')}. They slow the learning down.</p>`:''}${qk.length?`<p class="sm">Quick learners: ${qk.map(p=>esc(p.n)).join(', ')}. They help it along.</p>`:''}
   <details class="famother"><summary>Other systems</summary><ul class="famlist">${Object.entries(FORMS).filter(([k])=>k!==u.form).map(([k,f])=>`<li><span>${esc(f.lbl)}</span><i class="fambar"><b style="width:${famOf(k)}%"></b></i></li>`).join('')}</ul></details></section>`;}
function liveTacHTML(u){const sh=u.shout;const left=SHOUTMAX-(u.shoutLog||[]).length;
  return `<div class="shouts"><span class="lbl">Shout from the dugout <small class="muted">(${left} of ${SHOUTMAX} left)</small></span><div class="chips">${Object.entries(SHOUTS).map(([k,[l,d]])=>`<button class="chip ${sh&&sh.k===k?'on':''}" data-a="shout" data-k="${k}" title="${esc(d)}" ${left<=0?'disabled':''}>${esc(l)}</button>`).join('')}</div>${sh?`<small class="muted">"${esc(SHOUTS[sh.k][0])}" until the ${ord(sh.until)} minute.</small>`:left<=0?'<small class="muted">You have used all three shouts. Anything else will have to wait for the dressing room.</small>':''}</div>
   <div class="row gap wrap"><label class="lbl" for="lpreset">Quick plan</label><select id="lpreset" class="inp sm" data-c="lpreset"><option value="">Choose...</option>${PRESETS.map(p=>`<option value="${p.k}">${esc(p.n)}</option>`).join('')}</select></div>
   <details class="ltacd"><summary>Team instructions</summary><div class="ltac">${Object.entries(TACOPT).map(([k,o])=>`<label class="lbl" for="lt-${k}">${o.lbl}</label><select id="lt-${k}" class="inp sm" data-c="ltac" data-k="${k}">${o.opts.map((l,i)=>`<option value="${i}" ${u.tac[k]===i?'selected':''} ${optLock(o,i)?'disabled':''}>${l}</option>`).join('')}</select>`).join('')}</div></details>`;}

/* ---- a man who will not learn the new system ---- */
SITU.newsystem={who:'player',sev:1,pub:0,ok:p=>hasT(p,'oldpro')&&(G.user.xi||[]).includes(p.id)&&famOf(G.user.form)<55,title:p=>`${p.n} and the new system`,
  q:p=>pick([`I have played the game one way for ${Math.max(8,age(p)-17)} years, boss. Now it is all chalk and arrows. With respect, it is not football, it is homework.`,`In my day you knew your man and you marked him. I do not understand what you want from me in this ${FORMS[G.user.form].lbl}, and I am not the only one.`]),
  opts:[['Learn it or sit it out. Nobody is bigger than the system.','firm'],['Play it your way for now. We will ease you in.','soft'],['Extra sessions on the blackboard, just you and me.','deal']],
  extra:(p,k)=>{const u=G.user;if(k==='firm'){if(relOf(p)>=50){u.fam[u.form]=clamp(famOf(u.form)+4,0,100);return ' The others saw that. They knuckle down, and the side picks the system up quicker.';}return '';}
   if(k==='soft'){u.fam[u.form]=clamp(famOf(u.form)-4,0,100);return ' He is happier, but the side is a little less sure of its shape.';}
   u.fam[u.form]=clamp(famOf(u.form)+3,0,100);if(rand()<0.5){p.trt=traitsOf(p).filter(t=>t!=='oldpro');return ' It takes three evenings and a great deal of tea, but the penny drops. He is not set in his ways any more.';}return ' He grumbles, but he gets it, more or less.';}};
TALKS.s_newsystem={who:'player',title:SITU.newsystem.title,q:SITU.newsystem.q,opts:SITU.newsystem.opts.map(([lbl,kind])=>[lbl,p=>{const S=SITU.newsystem;const base=settle(p,kind,Math.min(3,S.sev+(p.repeat?1:0)),S.pub);return base+S.extra(p,kind);}])};

/* ---- after the match ---- */
function tacAfter(m){if(m.us<0||m.fx.id<=0)return;const s=m.sides[m.us];const u=G.user;u.fam=u.fam||{};u.fam[s.form]=clamp(famOf(s.form)+2,0,100);
  buildAn(m);if(s.home&&wasteLvl(s)>=3&&(s.wasted||0)>5){const c=club(U());c.fans=clamp(fans()-1,0,100);}
  if(u.bootsFx){Object.keys(u.bootsFx).forEach(id=>{if(+id<=m.fx.id)delete u.bootsFx[id];});}}
function tacInit(){const u=G.user;
  if(u.tacV==null){u.tacV=1;
    if(!u.games&&!(u.career||[]).length&&G.date.slice(5)<='08-20'){u.tac=Object.fromEntries(Object.keys(DEFTAC).map(k=>[k,null]));u.ment=null;u.formSet=false;u.sp={};u.spr={cor:null,fk:null};u.trainM=null;u.trainS=null;u.fam={};u.fam[u.form]=90;}
    else{u.formSet=true;u.tac={...DEFTAC,...u.tac};u.spr={...SPDEF,...(u.spr||{})};}}
  u.tac=u.tac||{};Object.keys(DEFTAC).forEach(k=>{if(u.tac[k]===undefined)u.tac[k]=DEFTAC[k];});
  u.roles=u.roles||{};u.sp=u.sp||{};u.spr=u.spr||{cor:null,fk:null};u.plan=u.plan||{on:false,ed:'H'};if(u.drill==null)u.drill=0;u.trl=u.trl||{};
  if(u.trainM===undefined){u.trainM=u.train&&u.train!=='bal'?u.train:'tac';u.trainS=u.trainM==='fit'?'ball':'fit';}
  if(!u.fam){u.fam={};u.fam[u.form]=90;if(u.form!=='W-M')u.fam['W-M']=FAMBASE('W-M');}
  if(!u.nameFix){u.nameFix=1;Object.values(G.players).forEach(p=>{if(!p.real&&realNames().has(p.n))p.n=genName();});}
  if(tacMissing().length)setupMsg();
  Object.values(G.clubs).forEach(c=>{if(c.tac&&c.tac.line==null){const t=aiTac(c.id);['line','press','focus','counter','waste','lthrow'].forEach(k=>c.tac[k]=t[k]);}});}
const TAC_ACT={
 setrole(d){const u=G.user;u.roles=u.roles||{};const r=u.roles[u.form]=u.roles[u.form]||{};r[+d.i]=d.k;render();},
 spr(d){G.user.spr=G.user.spr||{cor:null,fk:null};G.user.spr[d.k]=d.v;render();},
 trainm(d){if(G.user.trainS===d.k)return;G.user.trainM=d.k;render();},
 trains(d){if(G.user.trainM===d.k)return;G.user.trainS=d.k;render();},
 planed(d){const P=G.user.plan;if(!P||P.ed===d.k)return;P[P.ed]=planSnap();P.ed=d.k;planLoad(P[d.k]||planSnap());render();},
 preset(d){const P=PRESETS.find(x=>x.k===d.k);if(P){applyPreset(G.user,P);UI.note=`${P.n}: ${P.d}`;}render();},
 shout(d){doShout(d.k);},
 chalk(d){UI.notice={k:'chalk',fx:+d.id};render();},
 bootsel(d){const f=G.fx.find(x=>x.date===G.date&&!x.p&&isUserFx(x));if(!f)return;G.user.bootsFx=G.user.bootsFx||{};G.user.bootsFx[f.id]=d.k;render();},
 advise(){const f=G.fx.find(x=>x.date===G.date&&!x.p&&isUserFx(x));if(!f)return;const u=G.user;const A=advice(f,f.h===U()?f.a:f.h);
  if(!u.mday)u.mday={xi:u.xi.slice(),sub:u.sub,form:u.form,ment:u.ment,tac:{...u.tac},roles:JSON.parse(JSON.stringify(u.roles||{})),spr:{...(u.spr||SPDEF)},held:{...(u.held||{})},sp:{...(u.sp||{})},spNote:JSON.parse(JSON.stringify(u.spNote||{})),formSet:u.formSet,day:G.date};
  Object.assign(u.tac,A.ch.tac);if(A.ch.ment!=null)u.ment=A.ch.ment;if(A.ch.boots){u.bootsFx=u.bootsFx||{};u.bootsFx[f.id]=A.ch.boots;}if(A.ch.cor){u.spr={...SPDEF,...(u.spr||{}),cor:A.ch.cor};}render();}
};
const TAC_CHG={
 sptk(v,d){G.user.sp=G.user.sp||{};if(v)G.user.sp[d.k]=+v;else delete G.user.sp[d.k];render();},
 planon(v,d,el){const P=G.user.plan=G.user.plan||{on:false,ed:'H'};P.on=!!el.checked;if(P.on){P.H=planSnap();P.A=planSnap();P.ed='H';}render();},
 lpreset(v){const L=UI.live;if(!L||!v)return;const m=L.m;const s=m.sides[m.us];const P=PRESETS.find(x=>x.k===v);if(!P)return;applyPreset(s,P);s.str=strength(s);addEv(m,m.us,'talk',`Change of plan from the bench: ${P.n.toLowerCase()}.`);updateLive(false);},
 tftrait(v){UI.tf.trait=v;const r=$('#tf-res');if(r)r.innerHTML=tfResults();}
};

/* ---- small helpers: plurals and lists ---- */
const plu=(n,w,p)=>`${n} ${n===1?w:(p||w+'s')}`;
const andList=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1];

/* ---- a new manager sets the side up before the first match ---- */
const MISSLBL={pass:'how you pass the ball',width:'how wide you play',tempo:'the tempo',tackle:'how hard you tackle',trap:'whether to play the offside trap',line:'how high your defensive line is',press:'how much you close down',focus:'where you attack',counter:'whether you counter-attack',waste:'how much time-wasting you allow',lthrow:'whether you take long throws'};
function tacMissing(){const u=G&&G.user;if(!u||u.tacV==null)return [];const out=[];if(!u.formSet)out.push('a formation');if(u.ment==null)out.push('an approach');
  Object.entries(TACOPT).forEach(([k,o])=>{if(u.tac[k]==null)out.push(MISSLBL[k]||o.lbl.toLowerCase());});
  const own=id=>id&&G.players[id]&&G.players[id].c===U();const sp=u.sp||{};
  if(!sp.pen)out.push('a penalty taker');if(!sp.fk)out.push('a free-kick taker');if(!sp.cor)out.push('a corner taker');
  if(u.tac.lthrow===1&&sq(U()).some(p=>!p.acad&&hasT(p,'longthrow'))&&!own(sp.lt))out.push('a long-throw taker');
  const spr=u.spr||{};if(!spr.cor)out.push('where corners are aimed');if(!spr.fk)out.push('what to do with free kicks');
  if(!u.trainM)out.push('a main training focus');if(!u.trainS)out.push('a secondary training focus');return out;}
function setupCheck(){const miss=tacMissing();if(!miss.length)G.inbox.forEach(m=>{if(m.act&&m.act.k==='setup'&&!m.act.done){m.act.done=true;m.act.res='Done. The side knows how it will play.';}});return miss;}
function setupMsg(){if(G.autopilot||G.inbox.some(m=>m.act&&m.act.k==='setup'&&!m.act.done))return;const miss=tacMissing();if(!miss.length)return;const first=!G.user.formSet;
  msg('club',first?'Set up your tactics before the first match':'Your tactics need finishing',`${first?'The chairman wants to know how the side will play. ':''}Before the next match you need to choose ${andList(miss)}.\n\nEverything is on the Tactics tab, where anything still to choose is marked in red. No match can start until it is done.`,{k:'setup'});}
function autoSetup(){const u=G.user;if(!u.formSet)u.formSet=true;if(u.ment==null)u.ment=1;Object.keys(DEFTAC).forEach(k=>{if(u.tac[k]==null)u.tac[k]=DEFTAC[k];});
  const S=(G.user.xi||[]).map(id=>G.players[id]).filter(p=>p&&p.pos!=='GK');const best=k=>{const rel=SPREL[k];return S.slice().sort((a,b)=>(rel.some(t=>hasT(b,t))-rel.some(t=>hasT(a,t)))||b.ca-a.ca)[0];};
  const own=id=>id&&G.players[id]&&G.players[id].c===U();['pen','fk','cor'].forEach(k=>{if(!own(u.sp[k])){const p=best(k);if(p)u.sp[k]=p.id;}});
  const lt=S.find(p=>hasT(p,'longthrow'));if(lt&&!own(u.sp.lt))u.sp.lt=lt.id;u.spr={cor:u.spr.cor||'mix',fk:u.spr.fk||'shoot'};if(!u.trainM)u.trainM='tac';if(!u.trainS)u.trainS='fit';setupCheck();}
function setupGate(){if(G.autopilot)return false;if(globalThis.__BG_AUTOSETUP)autoSetup();if(!tacMissing().length)return false;setupMsg();UI.screen='game';UI.tab='tactics';UI.gateNote=true;save();render();return true;}

/* ---- the Tactics screen: the pitch and the squad side by side, the instructions alongside ---- */
function vTactics(){validateUserXI();const u=G.user;const F=FORMS[u.form];const xi=u.xi;const c=club(U());const pickI=UI.pick;const RL=slotRoles(u.form,(u.roles||{})[u.form]);
  const role=pickI==null||pickI===11?null:F.s[pickI][0];
  const s0=sq(U()).filter(p=>!p.acad);const s=UI.sort.tac.k==='auto'?s0.sort((a,b)=>role?eff(b,role)-eff(a,role):(ORD2[a.pos]-ORD2[b.pos]||b.ca-a.ca)):sortBy(s0,'tac');spStandIns();const miss=setupCheck();
  return `${u.mday?`<div class="mdaybar" role="note"><div><strong>Match-day changes</strong><span>These apply to today's match only. Your usual team and tactics come back after the final whistle.</span></div><div class="row gap wrap"><button class="btn sm" data-a="mdkeep">Keep them for good</button><button class="btn go sm" data-a="toProg">Back to the programme</button></div></div>`:''}
  ${miss.length?`<div class="setupbar" role="alert"><strong>${UI.gateNote?'The match cannot start yet':'Still to choose'}</strong><span>Choose ${esc(andList(miss))}. Everything still to choose is marked in red.</span></div>`:UI.gateNote?`<div class="setupbar ok" role="status"><strong>All set</strong><span>Everything is chosen. Press Continue to go to the match.</span></div>`:''}
  <div class="tactics"><div class="tac-left" data-keep="tacl">
  <section class="panel"><div class="ph"><h2 class="h1">Team selection</h2><p class="muted">Tap a shirt, then tap a player in the list below to put him in that position.</p></div>${(u.out||[]).length?`<div class="outlist"><strong>Picked but unavailable</strong>${u.out.map(o=>`<p>${esc(G.players[o.pid].n)}: ${esc(o.why)}. Stood down for now; he goes straight back in when he is available.</p>`).join('')}</div>`:''}
   <div class="row gap wrap ${u.formSet?'':'need'}"><label class="lbl" for="f-sel">Formation</label><select id="f-sel" class="inp sm" data-c="form">${u.formSet?'':'<option value="" selected disabled>Choose a formation</option>'}${Object.entries(FORMS).map(([k,f])=>`<option value="${k}" ${u.formSet&&u.form===k?'selected':''} ${formLock(k)?'disabled':''}>${f.lbl}${formLock(k)?` (from ${f.from})`:''} · ${famWord(famOf(k)).toLowerCase()}</option>`).join('')}</select>
    <button class="btn sm" data-a="autopick">Pick the best XI</button></div>
   <p class="formdesc">${u.formSet?esc(F.desc):'Choose a formation. The pitch shows the W-M until you do.'}</p>
   <div class="pitch" role="group" aria-label="Pitch"><i class="pl pl-half"></i><i class="pl pl-circ"></i><i class="pl pl-b1"></i><i class="pl pl-b2"></i>${F.s.map((sl,i)=>{const p=xi[i]&&G.players[xi[i]];const su=p?suitP(p,sl[0]):0;
     return `<button class="shirt ${pickI===i?'on':''} ${p&&su<.9?'odd':''}" style="left:${sl[2]}%;top:${sl[3]}%;--c1:${c.c1};--c2:${c.c2}" data-a="slot" data-i="${i}"><span class="jersey">${sl[4]}</span><span class="sn">${p?esc(nm(p.id)):'Empty'}</span><small>${sl[1]}${p?' · '+Math.round(eff(p,sl[0])):''}</small><em class="rtag">${ROLES[sl[0]][RL[i]].s}</em>${p?shirtFit(p):''}</button>`;}).join('')}
   </div>${pickI!=null&&pickI<11?rolePicker(pickI):''}
   <div class="benchrow"><button class="shirt bench ${pickI===11?'on':''}" style="--c1:${c.c1};--c2:${c.c2}" data-a="slot" data-i="11"><span class="jersey">12</span><span class="sn">${u.sub?esc(nm(u.sub)):'None'}</span><small>Substitute${G.subs?'':' (not yet allowed)'}</small>${u.sub&&G.players[u.sub]?shirtFit(G.players[u.sub]):''}</button>
   <p class="muted sm">${G.subs===0?'Substitutes are not permitted in the League until 1965. If a man gets injured, he limps on.':G.subs===1?'One substitute, for injuries only.':'One substitute, for any reason.'}</p></div>
  </section>
  <section class="panel tac-squad" data-keep="tacsq"><div class="ph"><h3 class="h2 first">${pickI==null?'Squad':pickI===11?'Choose a substitute':`Choose a ${F.s[pickI][1]}`}</h3>${pickI!=null?'<p class="muted sm">Sorted by how well each man would play there.</p>':''}</div>
   <div class="tw"><table class="tbl"><thead><tr>${sth('tac','pos','Pos')}${sth('tac','n','Name','l')}${sth('tac','ca','Ability')}${role?sth('tac','role','In role'):''}${sth('tac','fit','Fit')}${sth('tac','form','Form','l')}</tr></thead><tbody>
   ${s.map(p=>{const where=xi.indexOf(p.id);return `<tr class="click ${p.inj?'injr':''} ${where>-1||u.sub===p.id?'sel':''}" data-a="${pickI==null?'player':'place'}" data-id="${p.id}"><td><span class="pos p-${p.pos}">${p.pos}</span></td><td class="l nm">${esc(p.n)}${traitMini(p)}${where>-1?` <span class="xi">${F.s[where][4]}</span>`:''}${u.sub===p.id?' <span class="xi">12</span>':''}${p.inj?` <span class="inj">Inj</span>`:''}</td><td>${p.ca}</td>${role?`<td>${Math.round(eff(p,role))}</td>`:''}<td>${fitTag(p)}</td><td class="l">${formDots(p.form)}</td></tr>`;}).join('')}
   </tbody></table></div></section></div>
  <div class="stack">${planPanel()}
  <section class="panel"><h3 class="h2 first">Team instructions</h3>
   <div class="tacrow ${u.ment==null?'need':''}"><span class="lbl">Approach</span><div class="seg" role="group" aria-label="Approach">${MENT.map((m,i)=>`<button class="${u.ment===i?'on':''}" data-a="setment" data-v="${i}">${m}</button>`).join('')}</div><small class="muted">${u.ment==null?'Choose one.':['Sit deep. Harder to score against, fewer goals at the other end.','Balanced.','Go for the throat. More goals, more gaps.'][u.ment]}</small></div>
   ${tacControls(u.tac,'tac')}${staffLine()}</section>${spPanel()}${trainPanel()}</div></div>`;}

/* ---- offers for your players ---- */
function offersHTML(){const L=pendingBids();
  return `<div class="offers">${L.length?L.map(m=>{const a=m.act;const p=G.players[a.pid];const buyer=a.k==='abroad'?a.to:club(a.club).n;
    return `<article class="offercard"><div class="oc-h">${a.k==='abroad'?'':crest(a.club,'lg')}<div class="oc-who"><strong>${esc(buyer)}</strong><span>want <button class="lnk" data-a="player" data-id="${p.id}">${esc(p.n)}</button></span><small class="muted">${POSN[p.pos]}, ${age(p)} · valued at ${money(valueOf(p))} · on £${p.w} a week${p.listed?' · on the transfer list':''}</small></div><div class="oc-fee"><small>Their offer</small><strong>${money(a.fee)}</strong></div></div>
     <p class="muted sm">Received ${fmtDate(m.date,true)}${a.exp?` · the offer stands until ${fmtDate(a.exp,true)}`:''}${a.held?' · they have said that is their final offer':''}</p>${msgActions(m)}</article>`;}).join(''):'<p class="muted">No offers for your players at the moment. Put a player on the transfer list to invite bids.</p>'}</div>`;}

/* ---- blueprints for every project ---- */
function bpMore(L,D,T){return {
 social:`<rect x="30" y="56" width="140" height="70" ${L}/><path d="M24 56 L100 30 L176 56" ${L}/><rect x="88" y="94" width="24" height="32" ${L}/><path d="M44 72 L52 112 L68 112 L76 72Z" ${L}/><path d="M44 80 L76 80" ${D}/><path d="M76 82 q10 4 0 16" ${L} stroke-width="1.6"/><rect x="128" y="70" width="28" height="18" ${L} stroke-width="1.4"/>${T(142,82,'BAR')}${T(100,142,'SOCIAL CLUB')}`,
 scoreboard:`<rect x="20" y="28" width="160" height="72" ${L}/><path d="M50 100 L50 128 M150 100 L150 128" ${L}/>${T(60,44,'HOME')}${T(140,44,'AWAY')}${[0,1,2,3,4].map(r=>[0,1,2].map(c=>`<circle cx="${51+c*9}" cy="${56+r*8}" r="2.2" ${L} stroke-width="1"/><circle cx="${131+c*9}" cy="${56+r*8}" r="2.2" ${L} stroke-width="1"/>`).join('')).join('')}${T(100,142,'ELECTRIC SCOREBOARD')}`,
 tr_medical:`<rect x="30" y="92" width="100" height="14" ${L}/><path d="M36 106 L36 124 M124 106 L124 124" ${L}/><path d="M150 124 L150 40 L130 40" ${L}/><path d="M118 40 L142 40 L136 54 L124 54Z" ${L}/><path d="M124 58 L118 74 M130 58 L130 76 M136 58 L142 74" ${D}/><rect x="56" y="34" width="36" height="36" ${L}/><path d="M74 40 L74 64 M62 52 L86 52" ${L} stroke-width="4"/>${T(100,142,'MEDICAL ROOM')}`,
 undersoil:`<path d="M14 50 L186 50" ${L}/>${[20,36,52,68,84,100,116,132,148,164,180].map(x=>`<path d="M${x-3} 50 l3 -8 l3 8" ${L} stroke-width="1.2"/>`).join('')}<path d="M14 70 L186 70 M14 108 L186 108" ${D}/>${[30,62,94,126,158].map(x=>`<circle cx="${x}" cy="90" r="7" ${L}/><path d="M${x} 81 q4 -4 0 -8 q-4 -4 0 -8" ${L} stroke-width="1"/>`).join('')}${T(100,124,'PIPES 12 IN. BELOW THE TURF')}${T(100,142,'UNDER-SOIL HEATING')}`,
 tr_sauna:`<rect x="24" y="44" width="90" height="80" ${L}/>${[56,68,80,92,104].map(y=>`<path d="M24 ${y} L114 ${y}" ${D}/>`).join('')}<rect x="40" y="96" width="58" height="10" ${L} stroke-width="1.4"/><path d="M50 40 q6 -8 0 -16 q-6 -8 0 -14 M70 40 q6 -8 0 -16 q-6 -8 0 -14 M90 40 q6 -8 0 -16" ${L} stroke-width="1.4"/><path d="M126 96 L186 96 L180 124 L132 124Z" ${L}/><path d="M132 106 q8 -4 16 0 q8 4 16 0 q8 -4 14 0" ${L} stroke-width="1.2"/>${T(156,90,'PLUNGE')}${T(100,142,'SAUNA AND PLUNGE BATH')}`,
 tv:`<path d="M60 128 L60 64 L140 64 L140 128" ${L}/>${[0,1,2].map(i=>`<path d="M60 ${128-i*21} L140 ${107-i*21} M140 ${128-i*21} L60 ${107-i*21}" ${L} stroke-width="1"/>`).join('')}<rect x="78" y="34" width="44" height="22" rx="3" ${L}/><circle cx="72" cy="28" r="9" ${L}/><circle cx="92" cy="24" r="9" ${L}/><path d="M122 40 L142 34 L142 54 L122 50" ${L}/><path d="M100 56 L100 64" ${L}/>${T(100,142,'TELEVISION GANTRY')}`,
 carpark:`<rect x="20" y="30" width="160" height="96" ${L}/>${[40,60,80,100,120,140,160].map(x=>`<path d="M${x} 30 L${x} 62 M${x} 94 L${x} 126" ${L} stroke-width="1.2"/>`).join('')}<path d="M20 78 L180 78" ${D}/>${[[30,46],[70,46],[130,46],[50,110],[110,110],[170,110]].map(([x,y])=>`<rect x="${x-7}" y="${y-12}" width="14" height="24" rx="4" ${L} stroke-width="1.4"/>`).join('')}${T(100,142,'SUPPORTERS CAR PARK')}`,
 seats:`${[0,1,2,3].map(r=>[0,1,2,3,4,5,6].map(c=>`<path d="M${26+c*22+r*4} ${112-r*20} l0 -12 M${26+c*22+r*4} ${112-r*20} l12 0 l2 -4" ${L} stroke-width="1.4"/>`).join('')).join('')}<path d="M18 120 L190 44" ${D}/>${T(100,142,'PADDOCK SEATING')}`,
 tr_film:`<rect x="110" y="30" width="76" height="56" ${L}/>${T(148,62,'REEL 3')}<rect x="24" y="80" width="44" height="26" ${L}/><circle cx="34" cy="70" r="11" ${L}/><circle cx="58" cy="70" r="11" ${L}/><path d="M68 88 L110 32 M68 96 L110 86" ${D}/><path d="M36 106 L30 124 M56 106 L62 124" ${L}/>${T(100,142,'FILM AND TACTICS ROOM')}`,
 boxes:`<path d="M14 120 L14 40 L186 40 L186 120" ${L}/>${[0,1,2,3,4].map(i=>`<rect x="${22+i*33}" y="52" width="28" height="26" ${L} stroke-width="1.4"/><path d="M${22+i*33} 66 L${50+i*33} 66" ${D}/>`).join('')}<path d="M14 86 L186 86" ${L}/>${[0,1,2].map(i=>`<path d="M14 ${96+i*9} L186 ${96+i*9}" ${L} stroke-width="1"/>`).join('')}${T(100,142,'EXECUTIVE BOXES')}`,
 shop2:`<path d="M70 30 L56 38 L36 52 L48 70 L62 62 L62 126 L138 126 L138 62 L152 70 L164 52 L144 38 L130 30 Q100 44 70 30Z" ${L}/><path d="M86 36 Q100 46 114 36" ${L} stroke-width="1.4"/><path d="M76 70 L94 70 L94 88 Q85 96 76 88Z" ${D}/>${T(116,104,'No. 9')}${T(100,142,'REPLICA SHIRTS')}`,
 coach:`<path d="M16 110 L16 52 Q16 40 30 40 L176 40 Q186 40 186 52 L186 110Z" ${L}/>${[0,1,2,3,4,5].map(i=>`<rect x="${28+i*22}" y="50" width="17" height="22" ${L} stroke-width="1.3"/>`).join('')}<rect x="164" y="50" width="14" height="44" ${L} stroke-width="1.3"/><circle cx="50" cy="112" r="11" ${L}/><circle cx="152" cy="112" r="11" ${L}/><path d="M28 84 L156 84" ${D}/>${T(92,98,'FIRST TEAM')}${T(100,142,'TEAM COACH')}`,
 houses:`${[24,104].map(x=>`<path d="M${x} 70 L${x+36} 38 L${x+72} 70 L${x+72} 124 L${x} 124Z" ${L}/><rect x="${x+28}" y="98" width="16" height="26" ${L} stroke-width="1.4"/><rect x="${x+8}" y="78" width="14" height="12" ${L} stroke-width="1.2"/><rect x="${x+50}" y="78" width="14" height="12" ${L} stroke-width="1.2"/><path d="M${x+52} 52 L${x+52} 36 L${x+60} 36 L${x+60} 59" ${L} stroke-width="1.2"/>`).join('')}${T(100,142,'CLUB HOUSES')}`,
 schools:`<path d="M24 70 L100 40 L176 70 L176 124 L24 124Z" ${L}/><path d="M92 40 L92 24 L108 24 L108 40" ${L}/><circle cx="100" cy="32" r="4" ${L} stroke-width="1.2"/><rect x="90" y="96" width="20" height="28" ${L}/>${[36,58,128,150].map(x=>`<rect x="${x}" y="80" width="14" height="18" ${L} stroke-width="1.2"/>`).join('')}<circle cx="64" cy="116" r="6" ${L} stroke-width="1.4"/><path d="M58 116 L70 116 M64 110 L64 122" ${L} stroke-width="1"/>${T(100,142,'SCHOOLS COACHING SCHEME')}`,
 reserves:`<path d="M30 110 L30 60 L120 60 L150 80 L170 84 L170 110Z" ${L}/><rect x="40" y="68" width="22" height="16" ${L} stroke-width="1.3"/><rect x="70" y="68" width="22" height="16" ${L} stroke-width="1.3"/><path d="M122 64 L144 82 L122 82Z" ${L} stroke-width="1.3"/><circle cx="60" cy="112" r="10" ${L}/><circle cx="144" cy="112" r="10" ${L}/>${T(76,100,'RESERVES')}${T(100,142,'RESERVE TEAM COACH')}`,
 doctor:`<path d="M50 60 L150 60 L160 124 L40 124Z" ${L}/><path d="M80 60 Q80 40 100 40 Q120 40 120 60" ${L}/><path d="M100 76 L100 108 M84 92 L116 92" ${L} stroke-width="4"/><path d="M164 34 Q188 58 172 88 Q162 106 176 118" ${L} stroke-width="1.6"/><circle cx="176" cy="124" r="5" ${L}/>${T(100,142,'CLUB DOCTOR')}`,
 magazine:`<rect x="56" y="16" width="88" height="114" ${L}/>${T(100,32,'CLUB MAGAZINE')}<circle cx="100" cy="68" r="20" ${L}/><path d="M78 108 Q100 86 122 108" ${L}/><path d="M64 116 L136 116" ${D}/>${T(100,126,'1s 6d')}${T(100,142,'GLOSSY MAGAZINE')}`,
 friends:`<rect x="30" y="40" width="140" height="80" rx="6" ${L}/>${T(112,62,'FRIENDS OF THE CLUB')}${T(112,80,'MEMBER No. 211')}<path d="M86 104 L160 104" ${D}/><circle cx="56" cy="70" r="14" ${L}/><circle cx="56" cy="70" r="6" ${L} stroke-width="1.2"/><path d="M50 84 L44 104 L54 98 L56 106 M62 84 L68 104 L58 98" ${L} stroke-width="1.4"/>${T(100,142,'FRIENDS OF THE CLUB')}`,
 freehold:`<path d="M40 30 L160 30 Q170 30 170 40 L170 120 L40 120 Q30 120 30 110 L30 40 Q30 30 40 30Z" ${L}/>${T(100,50,'DEED OF CONVEYANCE')}${[64,74,84,94].map(y=>`<path d="M48 ${y} L152 ${y}" ${D}/>`).join('')}<circle cx="140" cy="106" r="11" ${L}/><path d="M134 116 L130 128 M146 116 L150 128" ${L} stroke-width="1.4"/>${T(100,142,'THE FREEHOLD')}`,
 welfare:`<rect x="30" y="80" width="140" height="10" ${L}/><path d="M40 90 L40 126 M160 90 L160 126" ${L}/><rect x="48" y="62" width="34" height="18" rx="4" ${L}/><path d="M56 62 Q65 50 74 62" ${L}/><path d="M120 64 L120 80 L140 80 L140 64Z" ${L}/><path d="M140 68 q8 2 0 8" ${L} stroke-width="1.4"/><path d="M126 58 q3 -6 0 -12 M134 58 q3 -6 0 -12" ${L} stroke-width="1.2"/>${T(100,142,'WELFARE OFFICE')}`,
 ambassador:`<path d="M60 30 L80 26 L100 44 L120 26 L140 30 L156 56 L150 126 L50 126 L44 56Z" ${L}/><path d="M80 26 L100 80 L120 26" ${L} stroke-width="1.4"/><path d="M100 80 L100 126" ${L} stroke-width="1.2"/><path d="M118 70 L132 70 L132 82 Q125 90 118 82Z" ${L} stroke-width="1.3"/><circle cx="100" cy="94" r="2" ${L}/><circle cx="100" cy="108" r="2" ${L}/>${T(100,142,'CLUB AMBASSADOR')}`,
 tr_lights:`<rect x="30" y="60" width="140" height="64" ${L}/><path d="M100 60 L100 124" ${L} stroke-width="1.2"/>${[30,170].map(x=>`<path d="M${x} 60 L${x} 22" ${L}/><rect x="${x-8}" y="14" width="16" height="10" ${L} stroke-width="1.4"/><path d="M${x} 24 L${x<100?x+50:x-50} 74 M${x} 24 L${x<100?x+22:x-22} 96" ${D}/>`).join('')}${T(100,142,'FLOODLIT TRAINING PITCH')}`,
 fences:`<path d="M14 120 L186 120 M14 44 L186 44 M14 60 L186 60" ${L}/>${Array.from({length:18},(_,i)=>`<path d="M${18+i*10} 120 L${18+i*10} 40 l-3 -6 M${18+i*10} 40 l3 -6" ${L} stroke-width="1.2"/>`).join('')}<path d="M100 44 L100 120" ${L} stroke-width="3"/>${T(56,96,'HOME')}${T(144,96,'AWAY')}${T(100,142,'SEGREGATION FENCES')}`,
 scout2:`<circle cx="72" cy="80" r="22" ${L}/><circle cx="128" cy="80" r="22" ${L}/><circle cx="72" cy="80" r="12" ${L} stroke-width="1.2"/><circle cx="128" cy="80" r="12" ${L} stroke-width="1.2"/><path d="M90 66 L110 66 L110 76 L90 76Z" ${L}/><path d="M58 62 L66 40 L84 40 L90 62 M142 62 L134 40 L116 40 L110 62" ${L}/><rect x="152" y="98" width="32" height="28" ${L} stroke-width="1.4"/>${[106,112,118].map(y=>`<path d="M156 ${y} L180 ${y}" ${D}/>`).join('')}${T(100,142,'A SECOND SCOUT')}`};}
UPG.scout2={n:'A second scout',cost:4000,wk:2,cat:'club',inc:-20,from:1960,desc:'A second man with a car and a notebook. Your scouts can watch one more region at the same time.'};

/* ---- no made-up player is ever given a real player's name ---- */
let REALN=null;
function realNames(){if(REALN)return REALN;REALN=new Set();(DATA.clubs||[]).forEach(c=>String(c.p||'').split(';').forEach(x=>{const n=x.split(',')[0];if(n)REALN.add(n);}));(DATA.youth||[]).forEach(r=>REALN.add(r[0]));
  (DATA.foreign||[]).forEach(f=>{if(Array.isArray(f)&&typeof f[0]==='string')REALN.add(f[0]);});Object.keys(REALTR).forEach(n=>REALN.add(n));if(G)Object.values(G.players).forEach(p=>{if(p.real)REALN.add(p.n);});return REALN;}

/* ---------- newspaper photographs: monochrome, tonal, grained and screened, like a 1960s press print ---------- */
const NPP={
 stand:{Hd:[0,-90],N:[0,-77],H:[0,-45],E1:[-9,-60],A1:[-10,-44],E2:[9,-60],A2:[10,-44],K1:[-5,-22],F1:[-6,0],K2:[5,-22],F2:[6,0]},
 run:{Hd:[5,-89],N:[3,-77],H:[-1,-46],E1:[-11,-63],A1:[-18,-53],E2:[12,-64],A2:[18,-74],K1:[11,-27],F1:[5,-7],K2:[-9,-24],F2:[-23,-13]},
 kick:{Hd:[-7,-89],N:[-4,-77],H:[0,-46],E1:[-21,-73],A1:[-33,-70],E2:[13,-69],A2:[23,-61],K1:[-4,-22],F1:[-6,0],K2:[18,-34],F2:[37,-45]},
 dive:{Hd:[42,-52],N:[31,-49],H:[0,-41],E1:[45,-61],A1:[59,-70],E2:[47,-45],A2:[62,-52],K1:[-18,-36],F1:[-37,-30],K2:[-16,-45],F2:[-35,-48]},
 up:{Hd:[0,-90],N:[0,-77],H:[0,-45],E1:[-12,-90],A1:[-15,-108],E2:[12,-90],A2:[15,-108],K1:[-5,-22],F1:[-7,0],K2:[5,-22],F2:[7,0]},
 sit:{Hd:[0,-66],N:[0,-53],H:[0,-23],E1:[-9,-37],A1:[6,-30],E2:[10,-37],A2:[19,-31],K1:[17,-23],F1:[17,0],K2:[15,-21],F2:[15,0]},
 walk:{Hd:[2,-90],N:[1,-77],H:[0,-45],E1:[-6,-61],A1:[-11,-46],E2:[7,-61],A2:[12,-47],K1:[6,-22],F1:[11,0],K2:[-4,-22],F2:[-10,0]},
 dig:{Hd:[15,-79],N:[10,-69],H:[-2,-42],E1:[18,-55],A1:[27,-44],E2:[22,-60],A2:[35,-52],K1:[5,-22],F1:[7,0],K2:[-8,-20],F2:[-11,0]},
 blow:{Hd:[0,-90],N:[0,-77],H:[0,-45],E1:[-11,-66],A1:[-3,-86],E2:[18,-73],A2:[34,-79],K1:[-5,-22],F1:[-6,0],K2:[5,-22],F2:[6,0]},
 sign:{Hd:[6,-63],N:[3,-51],H:[0,-23],E1:[14,-38],A1:[28,-34],E2:[10,-36],A2:[24,-30],K1:[17,-23],F1:[17,0],K2:[15,-21],F2:[15,0]},
 lift:{Hd:[0,-90],N:[0,-77],H:[0,-45],E1:[-10,-92],A1:[-8,-110],E2:[10,-92],A2:[8,-110],K1:[-5,-22],F1:[-7,0],K2:[5,-22],F2:[7,0]},
 chair:{Hd:[0,-68],N:[0,-55],H:[0,-24],E1:[-11,-70],A1:[-9,-88],E2:[11,-70],A2:[9,-88],K1:[-14,-14],F1:[-15,8],K2:[14,-14],F2:[15,8]},
 sing:{Hd:[2,-90],N:[1,-77],H:[0,-45],E1:[-9,-62],A1:[2,-56],E2:[9,-62],A2:[12,-52],K1:[-6,-22],F1:[-9,0],K2:[6,-22],F2:[9,0]}};
function npFig(x,y,s,pose,o){o=o||{};const P=NPP[pose]||NPP.stand;const t=o.t||'#262421',sh=o.shirt||t,lg=o.legs||t,sk=o.skin||'#7d766a',hr=o.hair||'#1d1b18';const fl=o.flip?-1:1;
  const p=k=>[x+P[k][0]*s*fl,y+P[k][1]*s];const lerp=(A,B,f)=>[A[0]+(B[0]-A[0])*f,A[1]+(B[1]-A[1])*f];const f1=n=>n.toFixed(1);
  /* a tapered limb: wide at one end, narrower at the other, with rounded joints */
  const tp=(A,B,w1,w2,c)=>{const dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,a=w1*s/2,b=w2*s/2;
    return `<path d="M${f1(A[0]+nx*a)} ${f1(A[1]+ny*a)} L${f1(B[0]+nx*b)} ${f1(B[1]+ny*b)} L${f1(B[0]-nx*b)} ${f1(B[1]-ny*b)} L${f1(A[0]-nx*a)} ${f1(A[1]-ny*a)}Z" fill="${c}"/><circle cx="${f1(A[0])}" cy="${f1(A[1])}" r="${f1(a)}" fill="${c}"/><circle cx="${f1(B[0])}" cy="${f1(B[1])}" r="${f1(b)}" fill="${c}"/>`;};
  const N=p('N'),H=p('H');const dx=H[0]-N[0],dy=H[1]-N[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
  const torso=`<path d="M${f1(N[0]+nx*10*s)} ${f1(N[1]+ny*10*s)} Q${f1(lerp(N,H,0.5)[0]+nx*9.5*s)} ${f1(lerp(N,H,0.5)[1]+ny*9.5*s)} ${f1(H[0]+nx*7.5*s)} ${f1(H[1]+ny*7.5*s)} L${f1(H[0]-nx*7.5*s)} ${f1(H[1]-ny*7.5*s)} Q${f1(lerp(N,H,0.5)[0]-nx*9.5*s)} ${f1(lerp(N,H,0.5)[1]-ny*9.5*s)} ${f1(N[0]-nx*10*s)} ${f1(N[1]-ny*10*s)} Q${f1(N[0])} ${f1(N[1]-3*s)} ${f1(N[0]+nx*10*s)} ${f1(N[1]+ny*10*s)}Z" fill="${sh}"/>`;
  const boot=F=>`<ellipse cx="${f1(F[0]+3*s*fl)}" cy="${f1(F[1])}" rx="${f1(5*s)}" ry="${f1(2.6*s)}" fill="${o.boots||'#151412'}"/>`;
  const leg=(K,Fk)=>{const Kp=p(K),Fp=p(Fk);return tp(H,Kp,10.5,7.5,lg)+tp(Kp,Fp,7,5,o.socks||lg)+boot(Fp)+(o.shorts?tp(H,lerp(H,Kp,0.48),12.5,11,o.shorts):'');};
  const arm=(E,A)=>{const Ep=p(E),Ap=p(A);return tp(lerp(N,H,0.08),Ep,7.2,5.6,o.sleeve||sh)+tp(Ep,Ap,5.4,4.2,o.arm||o.sleeve||sh)+`<circle cx="${f1(Ap[0])}" cy="${f1(Ap[1])}" r="${f1(2.6*s)}" fill="${o.hand||sk}"/>`;};
  const hd=p('Hd');const neck=tp(N,lerp(N,hd,0.6),5.5,5,sk);
  return `<g${o.f?` filter="${o.f}"`:''}${o.op?` opacity="${o.op}"`:''}>${leg('K2','F2')}${arm('E2','A2')}${neck}${torso}${o.tie?tp(N,lerp(N,H,0.55),2.6,2.2,o.tie):''}${o.collar?`<path d="M${f1(N[0]-5*s)} ${f1(N[1])} L${f1(N[0])} ${f1(N[1]+5*s)} L${f1(N[0]+5*s)} ${f1(N[1])}" stroke="${o.collar}" stroke-width="${f1(1.6*s)}" fill="none"/>`:''}${leg('K1','F1')}${arm('E1','A1')}
   <ellipse cx="${f1(hd[0])}" cy="${f1(hd[1])}" rx="${f1(7.4*s)}" ry="${f1(8.6*s)}" fill="${sk}"/><ellipse cx="${f1(hd[0]-2.5*s*fl)}" cy="${f1(hd[1]+1*s)}" rx="${f1(4*s)}" ry="${f1(6.5*s)}" fill="#fff" opacity=".1"/><path d="M${f1(hd[0]-7.6*s)} ${f1(hd[1]-0.5*s)} Q${f1(hd[0]-7*s)} ${f1(hd[1]-10.5*s)} ${f1(hd[0])} ${f1(hd[1]-9.6*s)} Q${f1(hd[0]+7.4*s)} ${f1(hd[1]-10*s)} ${f1(hd[0]+7.6*s)} ${f1(hd[1]-0.5*s)} Q${f1(hd[0]+3*s*fl)} ${f1(hd[1]-6.5*s)} ${f1(hd[0]-7.6*s)} ${f1(hd[1]-0.5*s)}Z" fill="${hr}"/>${o.hat?`<path d="M${f1(hd[0]-10.5*s)} ${f1(hd[1]-4.5*s)} L${f1(hd[0]+10.5*s)} ${f1(hd[1]-4.5*s)} L${f1(hd[0]+7*s)} ${f1(hd[1]-8.5*s)} Q${f1(hd[0])} ${f1(hd[1]-14*s)} ${f1(hd[0]-7*s)} ${f1(hd[1]-8.5*s)}Z" fill="${o.hat}"/>`:''}</g>`;}
/* a deterministic scatter, so a picture is the same every time */
function npR(seed){let x=seed*9301+49297;return ()=>{x=(x*9301+49297)%233280;return x/233280;};}
function npCrowd(y0,y1,rows,seed,o){o=o||{};const r=npR(seed);let h='';for(let k=0;k<rows;k++){const f=k/(Math.max(1,rows-1));const y=y0+(y1-y0)*f;const sz=(o.s0||3)+((o.s1||6)-(o.s0||3))*f;const n=Math.ceil(210/(sz*2.1));
  for(let i=0;i<n;i++){const x=i*sz*2.1+(k%2)*sz+r()*sz*0.8-4;const tn=Math.round(40+r()*70+(1-f)*55);const c=`rgb(${tn},${tn-3},${tn-8})`;const sk=Math.round(95+r()*45+(1-f)*40);
    h+=`<path d="M${(x-sz*1.25).toFixed(1)} ${(y+sz*2.6).toFixed(1)} Q${(x-sz*1.2).toFixed(1)} ${(y+sz*0.9).toFixed(1)} ${x.toFixed(1)} ${(y+sz*0.8).toFixed(1)} Q${(x+sz*1.2).toFixed(1)} ${(y+sz*0.9).toFixed(1)} ${(x+sz*1.25).toFixed(1)} ${(y+sz*2.6).toFixed(1)}Z" fill="${c}"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(sz*0.62).toFixed(2)}" fill="rgb(${sk},${sk-4},${sk-10})"/>${r()<(o.caps||0.25)?`<path d="M${(x-sz*0.7).toFixed(1)} ${(y-sz*0.15).toFixed(1)} Q${x.toFixed(1)} ${(y-sz*0.95).toFixed(1)} ${(x+sz*0.75).toFixed(1)} ${(y-sz*0.1).toFixed(1)}Z" fill="#2b2925"/>`:''}`;}}return h;}
function npDefs(id){return `<defs><filter id="gr${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.15" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .44  0 0 0 0 .42  0 0 0 .6 0"/></filter>
 <filter id="b1${id}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.1"/></filter><filter id="b2${id}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.4"/></filter><filter id="b3${id}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="4.5"/></filter><filter id="s${id}"><feGaussianBlur stdDeviation=".45"/></filter><filter id="mb${id}" x="-20%" y="-10%" width="140%" height="120%"><feGaussianBlur stdDeviation="3.2 .3"/></filter>
 <radialGradient id="vg${id}" cx="50%" cy="46%" r="74%"><stop offset="52%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".6"/></radialGradient>
 <radialGradient id="glow${id}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fbf8ef" stop-opacity=".95"/><stop offset="1" stop-color="#fbf8ef" stop-opacity="0"/></radialGradient>
 <linearGradient id="sky${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9c978b"/><stop offset="1" stop-color="#d9d4c6"/></linearGradient><linearGradient id="dsk${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1b19"/><stop offset="1" stop-color="#4c4840"/></linearGradient>
 <linearGradient id="turf${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7e796d"/><stop offset="1" stop-color="#5a564d"/></linearGradient><linearGradient id="wall${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfc9ba"/><stop offset="1" stop-color="#8e897d"/></linearGradient>
 <pattern id="hs${id}" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="1.2" cy="1.2" r=".5" fill="#000" opacity=".2"/></pattern></defs>`;}
function npNet(x,y,w,h,c){let s='';for(let i=0;i<=w;i+=5)s+=`<path d="M${x+i} ${y} L${x+i+3} ${y+h}"/>`;for(let j=0;j<=h;j+=5)s+=`<path d="M${x} ${y+j} L${x+w} ${y+j+1}"/>`;return `<g stroke="${c}" stroke-width=".55" opacity=".7">${s}</g>`;}
function npScene(k,I){const F=n=>`url(#${n}${I})`;const W='#e9e4d6',D='#22201d';
 const S={
 goal:`<rect width="200" height="160" fill="#6f6b62"/><g filter="${F('b3')}">${npCrowd(4,52,6,11,{s0:3,s1:5})}</g><rect y="56" width="200" height="104" fill="${F('turf')}"/><path d="M0 120 L200 108" stroke="#a8a396" stroke-width="1.2" opacity=".6"/>
  <g filter="${F('s')}"><path d="M112 32 L198 26 L198 104 L112 112Z" fill="#8a857a" opacity=".35"/>${npNet(112,32,86,78,'#e6e1d3')}<path d="M112 112 L112 30 L200 24" stroke="#f2eee3" stroke-width="3.4" fill="none"/></g>
  ${npFig(150,104,0.8,'dive',{shirt:'#2c2a26',legs:'#3a372f',f:F('s')})}<circle cx="176" cy="54" r="4.4" fill="#f1ede2" filter="${F('s')}"/><path d="M118 70 L172 55" stroke="#f1ede2" stroke-width="3" opacity=".35" filter="${F('mb')}"/>
  ${npFig(62,128,0.95,'kick',{shirt:'#ddd7c8',shorts:'#24221f',legs:'#7b7569',socks:'#2a2825'})}`,
 crowd:`<rect width="200" height="160" fill="#5c5850"/><path d="M0 0 L200 0 L200 22 L0 30Z" fill="#3a3731"/><path d="M150 0 L157 0 L166 34 L141 34Z" fill="#2b2925" filter="${F('b1')}"/><g filter="${F('b2')}">${npCrowd(26,60,4,5,{s0:2.6,s1:3.6})}</g><g filter="${F('b1')}">${npCrowd(62,96,3,9,{s0:4.2,s1:6})}</g>${npCrowd(100,150,3,13,{s0:7.4,s1:10.5,caps:.4})}
  <path d="M0 100 L200 94" stroke="#b9b4a6" stroke-width="2.4" opacity=".75"/><g transform="rotate(-24 60 92)"><rect x="40" y="86" width="44" height="7" fill="#e3ddcd"/><rect x="48" y="86" width="8" height="7" fill="#2b2925"/><rect x="64" y="86" width="8" height="7" fill="#2b2925"/></g>`,
 trophy:`<rect width="200" height="160" fill="#4f4b44"/><circle cx="100" cy="20" r="80" fill="${F('glow')}" opacity=".35"/><g filter="${F('b2')}">${npCrowd(66,112,3,21,{s0:5,s1:7.5})}</g>
  ${npFig(72,196,1.25,'stand',{shirt:'#d8d2c3',arm:'#d8d2c3',hand:'#7d766a',f:F('s')})}${npFig(128,196,1.25,'stand',{shirt:'#d0cabb',arm:'#d0cabb',hand:'#7d766a',flip:1,f:F('s')})}${npFig(100,126,1.0,'chair',{shirt:'#ebe6d8',sleeve:'#ebe6d8',arm:'#7d766a',shorts:'#23211e',legs:'#7d766a',socks:'#2b2925',collar:'#3a3731'})}
  <g transform="translate(100 22)"><path d="M-12 0 Q-13 17 0 21 Q13 17 12 0Z" fill="#cbc5b6"/><path d="M-11 2 Q-10 13 -3 18" stroke="#fbf8ef" stroke-width="2" fill="none" opacity=".85"/><path d="M-12 3 Q-22 3 -20 10 Q-17 15 -10 13 M12 3 Q22 3 20 10 Q17 15 10 13" stroke="#b5ae9e" stroke-width="2" fill="none"/><path d="M-3 21 L3 21 L4 27 L-4 27Z" fill="#a49d8d"/><rect x="-7" y="27" width="14" height="4" fill="#8f897b"/></g>
  <rect x="0" y="146" width="200" height="14" fill="#2f2c28" opacity=".6"/>`,
 manager:`<rect width="200" height="160" fill="url(#wall${I})"/><rect x="128" y="8" width="62" height="64" fill="#efebe0"/><path d="M159 8 L159 72 M128 40 L190 40" stroke="#5a564d" stroke-width="3"/><path d="M128 72 L80 160 L200 160 L200 72Z" fill="#fff" opacity=".12"/>
  <rect x="16" y="14" width="36" height="46" fill="#3a3731"/><rect x="20" y="18" width="28" height="38" fill="#8d887c"/><path d="M24 50 L32 30 L44 50Z" fill="#5c584f" opacity=".7"/>
  ${npFig(90,134,1.35,'sit',{shirt:'#3a3731',sleeve:'#3a3731',arm:'#3a3731',tie:'#151412',collar:'#e8e3d6',f:F('s')})}
  <rect x="0" y="104" width="200" height="56" fill="#3b3833"/><rect x="0" y="104" width="200" height="4" fill="#57534a"/><path d="M128 98 Q132 90 146 90 Q160 90 162 98 L166 104 L124 104Z" fill="#191816"/><path d="M134 90 Q132 78 146 80" stroke="#191816" stroke-width="4" fill="none"/><rect x="40" y="96" width="44" height="8" fill="#e9e4d7" transform="rotate(-4 62 100)"/>`,
 sign:`<rect width="200" height="160" fill="#7d786d"/><rect x="66" y="6" width="68" height="44" fill="#4a463f"/><rect x="70" y="10" width="60" height="36" fill="#9e998c"/><circle cx="100" cy="26" r="9" fill="#6b665b"/>
  ${npFig(42,140,0.95,'stand',{shirt:'#2f2d29',tie:'#121110',f:F('b1')})}${npFig(160,140,0.95,'stand',{shirt:'#36332e',tie:'#121110',flip:1,f:F('b1')})}${npFig(92,132,1.05,'sign',{shirt:'#2a2825',sleeve:'#2a2825',tie:'#121110'})}
  <rect x="0" y="112" width="200" height="48" fill="#2f2c28"/><g transform="rotate(-6 128 116)"><rect x="104" y="106" width="48" height="20" fill="#efebe0"/>${[0,1,2,3].map(i=>`<path d="M108 ${110+i*4} L148 ${110+i*4}" stroke="#8a8579" stroke-width=".8"/>`).join('')}</g><path d="M118 98 L126 114" stroke="#0f0e0d" stroke-width="2"/><circle cx="34" cy="20" r="26" fill="${F('glow')}" opacity=".85"/>`,
 stand:`<rect width="200" height="160" fill="url(#sky${I})"/><g filter="${F('s')}"><path d="M0 36 L200 18 L200 30 L0 50Z" fill="#2c2a26"/><path d="M0 50 L200 30 L200 108 L0 116Z" fill="#5e5a51"/>${[...Array(9)].map((_,r)=>`<path d="M0 ${60+r*6.4} L200 ${40+r*7.2}" stroke="#8c877b" stroke-width="1" opacity=".7"/>`).join('')}${[16,56,96,136,176].map(x=>`<path d="M${x} ${48-x*0.1} L${x} ${114-x*0.04}" stroke="#262421" stroke-width="2.2"/>`).join('')}</g><g filter="${F('b1')}">${npCrowd(60,98,4,31,{s0:2,s1:2.8,caps:.1})}</g>
  <path d="M0 116 L200 108 L200 160 L0 160Z" fill="url(#turf${I})"/><path d="M0 132 L200 124" stroke="#d9d4c6" stroke-width="1.4" opacity=".6"/><path d="M182 108 L188 2 L192 2 L192 108" fill="#2a2824"/><rect x="178" y="0" width="22" height="12" fill="#1d1c19"/>`,
 rocket:`<rect width="200" height="160" fill="url(#sky${I})"/><circle cx="100" cy="150" r="120" fill="${F('glow')}" opacity=".5"/><g filter="${F('b3')}"><ellipse cx="100" cy="146" rx="96" ry="26" fill="#f4f0e5"/><ellipse cx="60" cy="140" rx="40" ry="22" fill="#dcd6c8"/><ellipse cx="146" cy="138" rx="44" ry="20" fill="#e6e0d2"/></g>
  <path d="M100 118 Q92 130 96 146 L104 146 Q108 130 100 118Z" fill="#fffdf6" filter="${F('b1')}"/><g filter="${F('s')}"><rect x="94" y="30" width="12" height="88" fill="#e9e4d6"/><rect x="94" y="30" width="5" height="88" fill="#c9c3b4"/><path d="M94 30 L100 10 L106 30Z" fill="#d8d2c3"/>${[50,72,96].map(y=>`<rect x="94" y="${y}" width="12" height="3" fill="#3a3731"/>`).join('')}<path d="M94 108 L86 120 L94 118Z M106 108 L114 120 L106 118Z" fill="#3a3731"/></g><path d="M130 160 L140 60 L150 160" stroke="#3a3731" stroke-width="2" fill="none" opacity=".6" filter="${F('b1')}"/>`,
 moon:`<rect width="200" height="160" fill="#0f0f0e"/>${[...Array(40)].map((_,i)=>`<circle cx="${(i*53)%200}" cy="${(i*29)%90}" r="${i%5?0.5:0.9}" fill="#d8d3c4"/>`).join('')}<circle cx="156" cy="34" r="16" fill="#9a958a"/><path d="M146 26 Q156 34 150 46 Q162 40 166 28Z" fill="#5c584f" opacity=".7"/>
  <path d="M0 110 Q50 96 100 104 Q150 112 200 100 L200 160 L0 160Z" fill="#8d887c"/><g fill="#6f6b61">${[[30,128,10],[120,140,14],[170,124,8]].map(([x,y,r])=>`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*0.35}"/>`).join('')}</g>
  ${npFig(84,130,0.62,'walk',{shirt:'#e9e4d6',legs:'#e1dccd',arm:'#e9e4d6',skin:'#c9c3b4',hair:'#e9e4d6',f:F('s')})}<rect x="72" y="58" width="12" height="14" fill="#cfc9ba" rx="2"/><path d="M120 130 L120 92" stroke="#cfc9ba" stroke-width="1.4"/><rect x="120" y="92" width="18" height="11" fill="#bcb6a7"/><path d="M84 132 l3 1 M76 131 l3 1" stroke="#4c4840" stroke-width="2"/>`,
 tv:`<rect width="200" height="160" fill="#2a2824"/><circle cx="104" cy="70" r="70" fill="${F('glow')}" opacity=".28"/><g filter="${F('s')}"><rect x="66" y="34" width="76" height="62" rx="6" fill="#4a463f"/><rect x="73" y="40" width="54" height="46" rx="8" fill="#d6d1c3"/><g opacity=".55">${npFig(100,84,0.38,'kick',{shirt:'#3a3731'})}</g><circle cx="134" cy="52" r="3" fill="#8d887c"/><circle cx="134" cy="64" r="3" fill="#8d887c"/><path d="M78 96 L72 112 M130 96 L136 112" stroke="#1d1c19" stroke-width="3"/><path d="M96 34 L82 14 M110 34 L124 12" stroke="#5f5b52" stroke-width="1.6"/></g>
  ${npFig(36,176,1.1,'sit',{shirt:'#141312',sleeve:'#141312',arm:'#141312',skin:'#2a2824',hair:'#0c0b0a',f:F('b1')})}${npFig(160,180,1.15,'sit',{shirt:'#181715',sleeve:'#181715',arm:'#181715',skin:'#2c2a26',hair:'#0c0b0a',flip:1,f:F('b1')})}`,
 record:`<rect width="200" height="160" fill="#1d1c19"/><circle cx="100" cy="0" r="110" fill="${F('glow')}" opacity=".35"/><rect x="0" y="118" width="200" height="42" fill="#3d3a34"/><path d="M0 118 L200 118" stroke="#6b665c" stroke-width="2"/>
  ${[[44,'#d9d3c4'],[82,'#cfc9ba'],[120,'#d9d3c4'],[158,'#c9c3b4']].map(([x,c],i)=>npFig(x,120,0.78,i===3?'stand':'sing',{shirt:'#24221f',sleeve:'#24221f',tie:'#0f0e0d',hair:'#0f0e0d',skin:c,f:F('s')})).join('')}${[44,82,120].map(x=>`<path d="M${x+6} 120 L${x+6} 66" stroke="#9a958a" stroke-width="1.4"/><ellipse cx="${x+6}" cy="64" rx="2.2" ry="3.4" fill="#b8b2a3"/>`).join('')}<rect x="146" y="98" width="24" height="16" rx="7" fill="#c9c3b4"/><circle cx="158" cy="106" r="5" fill="#2a2824"/>`,
 plane:`<rect width="200" height="160" fill="url(#sky${I})"/><g filter="${F('b2')}"><ellipse cx="40" cy="30" rx="46" ry="12" fill="#ece8dc"/><ellipse cx="150" cy="22" rx="40" ry="9" fill="#e4dfd1"/></g><rect y="104" width="200" height="56" fill="#6b675e"/>
  <g filter="${F('s')}"><path d="M10 78 Q16 66 40 64 L188 60 Q198 62 196 70 Q192 80 176 82 L30 88 Q12 88 10 78Z" fill="#d9d4c6"/><path d="M10 80 L196 72" stroke="#4a463f" stroke-width="2.4"/>${[...Array(12)].map((_,i)=>`<rect x="${50+i*11}" y="68" width="5" height="5" rx="1" fill="#2e2c28"/>`).join('')}<path d="M170 62 L186 30 L194 30 L188 64Z" fill="#bdb7a8"/><path d="M90 84 L60 112 L80 112 L118 84Z" fill="#a8a294"/><ellipse cx="72" cy="96" rx="9" ry="5" fill="#5a564d"/><path d="M40 88 L40 104 M150 82 L150 104" stroke="#2a2824" stroke-width="3"/></g>
  <path d="M28 104 L52 82 L56 82 L36 106Z" fill="#3a3731"/>${[38,46].map((x,i)=>npFig(x+i*2,106-i*10,0.34,'walk',{shirt:'#2b2925'})).join('')}`,
 gavel:`<rect width="200" height="160" fill="#3a3732"/><circle cx="60" cy="40" r="90" fill="${F('glow')}" opacity=".22"/><rect x="0" y="96" width="200" height="64" fill="#5a554b"/><path d="M0 96 L200 96" stroke="#7d786c" stroke-width="2"/>
  <g filter="${F('b2')}"><rect x="128" y="64" width="54" height="34" fill="#e7e2d4" transform="rotate(8 155 80)"/><rect x="134" y="58" width="54" height="34" fill="#d8d3c5" transform="rotate(-5 160 75)"/></g>
  <g filter="${F('s')}"><ellipse cx="66" cy="112" rx="34" ry="9" fill="#2c2925"/><rect x="34" y="102" width="64" height="10" rx="3" fill="#4a4339"/><g transform="rotate(-28 92 70)"><rect x="56" y="56" width="40" height="22" rx="5" fill="#3b352d"/><rect x="56" y="60" width="40" height="3" fill="#6e665a"/><rect x="92" y="64" width="64" height="6" rx="3" fill="#4a4339"/></g></g>`,
 whistle:`<rect width="200" height="160" fill="#6a665d"/><g filter="${F('b3')}">${npCrowd(0,44,4,41,{s0:3,s1:4.6})}</g><rect y="50" width="200" height="110" fill="url(#turf${I})"/>
  ${npFig(40,150,0.88,'stand',{shirt:'#d5cfc0',shorts:'#24221f',legs:'#7b7569',socks:'#2a2825',f:F('b1')})}${npFig(160,152,0.9,'walk',{shirt:'#2c2a26',shorts:'#e3ddcf',legs:'#7b7569',socks:'#e3ddcf',flip:1,f:F('b1')})}${npFig(100,146,1.08,'blow',{shirt:'#141312',sleeve:'#141312',arm:'#7d766a',shorts:'#141312',legs:'#7d766a',socks:'#141312'})}<circle cx="97" cy="54" r="2.4" fill="#d8d2c3"/>`,
 mic:`<rect width="200" height="160" fill="#2b2925"/><circle cx="100" cy="70" r="80" fill="${F('glow')}" opacity=".18"/><g filter="${F('b2')}">${npFig(150,190,1.35,'sit',{shirt:'#151413',sleeve:'#151413',arm:'#151413',skin:'#3a3732',hair:'#0b0a09',flip:1})}</g>
  <g filter="${F('s')}"><rect x="76" y="34" width="34" height="56" rx="14" fill="#8a857a"/><rect x="80" y="38" width="26" height="48" rx="12" fill="#c9c3b4"/>${[...Array(9)].map((_,i)=>`<path d="M82 ${44+i*4.6} L104 ${44+i*4.6}" stroke="#6e695f" stroke-width="1.4"/>`).join('')}<path d="M93 90 L93 132" stroke="#3a3731" stroke-width="5"/><ellipse cx="93" cy="136" rx="30" ry="7" fill="#1a1917"/><rect x="66" y="56" width="10" height="12" fill="#5a564d"/><rect x="110" y="56" width="10" height="12" fill="#5a564d"/></g><text x="93" y="68" font-family="Archivo Narrow,sans-serif" font-size="7" font-weight="700" text-anchor="middle" fill="#2a2824">BBC</text>`,
 dog:`<rect width="200" height="160" fill="url(#wall${I})"/><path d="M0 110 L200 104 L200 160 L0 160Z" fill="#6c675d"/><path d="M0 110 L200 104" stroke="#8d887c" stroke-width="1.4"/><rect x="146" y="16" width="40" height="88" fill="#4a463f"/><rect x="150" y="20" width="32" height="80" fill="#8d887c"/>
  ${npFig(150,152,1.25,'stand',{shirt:'#3a3731',sleeve:'#3a3731',arm:'#3a3731',tie:'#151412',collar:'#e9e4d6',f:F('b1')})}
  <g filter="${F('s')}"><path d="M42 106 Q36 90 58 88 L96 88 Q108 88 112 96 Q114 106 102 110 L52 112 Q44 112 42 106Z" fill="#1f1d1a"/><path d="M62 92 Q78 100 96 92 Q92 106 76 106 Q64 104 62 92Z" fill="#e6e1d3" opacity=".9"/>
   <path d="M100 92 Q104 78 116 76 Q128 74 132 84 L140 88 Q144 92 138 96 L126 98 Q116 102 108 100Z" fill="#1f1d1a"/><path d="M128 86 L140 89 Q142 93 137 95 L127 96Z" fill="#e6e1d3" opacity=".85"/><circle cx="139" cy="89" r="2" fill="#0d0c0b"/>
   <path d="M112 78 Q106 80 106 92 Q112 90 116 82Z" fill="#141312"/><circle cx="124" cy="83" r="1.5" fill="#e6e1d3"/>
   <path d="M52 108 L48 136 M64 110 L66 138 M92 110 L94 138 M102 106 L106 134" stroke="#1f1d1a" stroke-width="6.5" stroke-linecap="round"/><path d="M44 96 Q30 84 26 94" stroke="#1f1d1a" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M110 98 L138 112" stroke="#a8a294" stroke-width="1.2"/></g>
  <g transform="translate(36 118)" filter="${F('s')}"><path d="M-6 0 Q-8 -14 0 -18 Q8 -14 6 0Z" fill="#d6d0c1"/><path d="M-9 -18 Q0 -26 9 -18" stroke="#bdb7a8" stroke-width="2.2" fill="none"/><rect x="-7" y="0" width="14" height="6" fill="#8d887c"/></g>`,
 coins:`<rect width="200" height="160" fill="#4b4740"/><circle cx="70" cy="40" r="90" fill="${F('glow')}" opacity=".3"/><rect y="90" width="200" height="70" fill="#5f5a50"/>
  <g filter="${F('b1')}"><rect x="118" y="60" width="74" height="40" fill="#cfc9ba" transform="rotate(-10 155 80)"/><rect x="112" y="68" width="74" height="40" fill="#bfb9aa" transform="rotate(6 150 88)"/><text x="148" y="92" font-family="Old Standard TT,serif" font-size="11" text-anchor="middle" fill="#5a564d" transform="rotate(6 150 88)">BANK OF ENGLAND</text></g>
  <g filter="${F('s')}">${[[48,118,7],[72,122,5],[96,116,8]].map(([x,y,n])=>[...Array(n)].map((_,i)=>`<ellipse cx="${x}" cy="${y-i*4}" rx="14" ry="5" fill="${i===n-1?'#d6d0c1':'#a9a395'}"/><path d="M${x-14} ${y-i*4} L${x-14} ${y-i*4+2} Q${x} ${y-i*4+8} ${x+14} ${y-i*4+2} L${x+14} ${y-i*4}" fill="#7f7a6e"/>`).join('')).join('')}<ellipse cx="40" cy="140" rx="12" ry="4.4" fill="#d6d0c1"/></g>`,
 ballot:`<rect width="200" height="160" fill="url(#wall${I})"/><rect x="8" y="10" width="70" height="30" fill="#efebe0"/><text x="43" y="29" font-family="Archivo Narrow,sans-serif" font-size="9" font-weight="700" text-anchor="middle" fill="#2a2824">POLLING STATION</text>
  ${[24,58].map((x,i)=>npFig(x,150,0.9,'stand',{shirt:i?'#4a463f':'#2c2a26',hat:i?'#1d1c19':null,f:F('b1')})).join('')}${npFig(146,150,1.0,'walk',{shirt:'#33302b',hat:'#1a1917',flip:1})}
  <g filter="${F('s')}"><rect x="88" y="94" width="48" height="40" fill="#2a2824"/><rect x="88" y="94" width="48" height="5" fill="#4a463f"/><rect x="104" y="92" width="16" height="2.4" fill="#0f0e0d"/><rect x="98" y="74" width="22" height="18" fill="#efebe0" transform="rotate(-8 109 83)"/><path d="M104 79 L114 89 M114 79 L104 89" stroke="#2a2824" stroke-width="1.8" transform="rotate(-8 109 83)"/><rect x="80" y="134" width="64" height="26" fill="#3a3731"/></g>`,
 snow:`<rect width="200" height="160" fill="#d9d4c6"/><g filter="${F('b2')}"><path d="M0 34 L200 26 L200 52 L0 60Z" fill="#6e6a60"/>${npCrowd(34,52,2,51,{s0:2,s1:2.4,caps:0})}</g><path d="M0 62 L200 54 L200 160 L0 160Z" fill="#efebe0"/>
  <g filter="${F('s')}"><path d="M60 118 L60 64 L150 60 L150 114" stroke="#5a564d" stroke-width="3.4" fill="none"/>${npNet(60,64,90,48,'#9a958a')}</g><path d="M0 132 Q60 122 120 134 T200 128 L200 160 L0 160Z" fill="#f7f4ec"/>
  ${npFig(40,146,0.9,'dig',{shirt:'#2c2a26',hat:'#1a1917'})}<path d="M64 134 L80 146 L86 140" stroke="#2a2824" stroke-width="2.4" fill="none"/>${npFig(170,140,0.7,'dig',{shirt:'#3a3731',flip:1,f:F('b1')})}${[...Array(46)].map((_,i)=>`<circle cx="${(i*41)%200}" cy="${(i*67)%160}" r="${i%3?0.9:1.5}" fill="#fff" opacity=".8"/>`).join('')}`,
 flag:`<rect width="200" height="160" fill="url(#sky${I})"/><g filter="${F('b1')}"><path d="M0 92 L200 80 L200 132 L0 140Z" fill="#4a463f"/><path d="M0 92 L200 80 L200 86 L0 98Z" fill="#2c2a26"/></g><rect y="132" width="200" height="28" fill="#6b675e"/>
  <path d="M60 140 L60 18" stroke="#2c2a26" stroke-width="2.6"/><circle cx="60" cy="16" r="2.4" fill="#2c2a26"/><g filter="${F('s')}"><path d="M61 58 Q84 52 104 58 Q124 64 146 58 L146 92 Q124 98 104 92 Q84 86 61 92Z" fill="#cfc9ba"/><path d="M61 58 L146 92 M61 92 L146 58" stroke="#f1ede2" stroke-width="7"/><path d="M61 58 L146 92 M61 92 L146 58" stroke="#3a3731" stroke-width="2.6"/><path d="M103 56 L103 94 M61 75 L146 75" stroke="#f1ede2" stroke-width="11"/><path d="M103 56 L103 94 M61 75 L146 75" stroke="#3a3731" stroke-width="6"/></g>`,
 boots:`<rect width="200" height="160" fill="url(#wall${I})"/>${[0,1,2,3,4].map(i=>`<path d="M0 ${30+i*28} L200 ${30+i*28}" stroke="#a8a295" stroke-width="1"/>`).join('')}<rect x="0" y="0" width="200" height="12" fill="#5a564d"/><circle cx="100" cy="26" r="3" fill="#2a2824"/>
  <g filter="${F('s')}"><path d="M100 26 L74 60 M100 26 L126 60" stroke="#efebe0" stroke-width="1.6"/><path d="M66 58 L86 58 L88 104 Q90 116 104 120 L106 130 L56 130 Q50 124 56 110 L62 104Z" fill="#26241f"/><path d="M114 58 L134 58 L138 104 Q140 116 154 120 L156 130 L106 130 Q100 124 106 110 L112 104Z" fill="#1d1c19"/>
  ${[60,70,80,92,110,120,130,142].map(x=>`<rect x="${x}" y="130" width="4" height="7" fill="#3a3731"/>`).join('')}<path d="M68 64 L84 68 M68 72 L84 76 M68 80 L84 84 M116 64 L132 68 M116 72 L132 76 M116 80 L132 84" stroke="#e9e4d6" stroke-width="1.2"/></g><rect x="0" y="140" width="200" height="20" fill="#4a463f"/>`,
 car:`<rect width="200" height="160" fill="url(#wall${I})"/><g filter="${F('b2')}"><rect x="0" y="20" width="60" height="76" fill="#6b675e"/><rect x="150" y="10" width="50" height="86" fill="#5a564d"/>${[0,1].map(i=>`<rect x="${10+i*24}" y="34" width="14" height="20" fill="#d9d4c6"/>`).join('')}</g><rect y="96" width="200" height="64" fill="#5f5b52"/><path d="M0 128 L200 128" stroke="#8d887c" stroke-width="2" stroke-dasharray="14 10"/>
  <g filter="${F('s')}"><path d="M22 112 Q24 98 46 96 L66 80 Q74 72 100 72 L130 72 Q146 74 156 90 L174 94 Q184 98 182 112Z" fill="#2f2c28"/><path d="M70 82 Q78 76 98 76 L98 92 L60 92Z M104 76 L128 76 Q140 78 148 92 L104 92Z" fill="#b8b2a3"/><path d="M24 104 L182 104" stroke="#c9c3b4" stroke-width="1.6"/><circle cx="56" cy="114" r="12" fill="#151412"/><circle cx="56" cy="114" r="5" fill="#9a958a"/><circle cx="150" cy="114" r="12" fill="#151412"/><circle cx="150" cy="114" r="5" fill="#9a958a"/><circle cx="178" cy="100" r="3" fill="#ece8dc"/></g>`,
 train:`<rect width="200" height="160" fill="#6e6a60"/><g filter="${F('b3')}"><ellipse cx="70" cy="20" rx="60" ry="22" fill="#dcd7c9"/><ellipse cx="120" cy="10" rx="50" ry="16" fill="#e8e3d6"/></g><path d="M0 0 L200 0 L200 10 L0 30Z" fill="#2f2c28"/><rect y="118" width="200" height="42" fill="#4a463f"/><path d="M0 118 L200 118" stroke="#8d887c" stroke-width="2"/>
  <g filter="${F('s')}"><rect x="30" y="64" width="110" height="46" fill="#1f1d1a"/><rect x="140" y="50" width="44" height="60" fill="#26241f"/><rect x="150" y="58" width="22" height="16" fill="#9a958a"/><rect x="40" y="46" width="12" height="20" fill="#1a1917"/><path d="M26 110 L186 110" stroke="#5a564d" stroke-width="3"/>${[54,84,114,164].map(x=>`<circle cx="${x}" cy="112" r="11" fill="#151412"/><circle cx="${x}" cy="112" r="3" fill="#8d887c"/>`).join('')}<path d="M48 112 L170 112" stroke="#8d887c" stroke-width="2.2"/></g>
  ${[14,190].map((x,i)=>npFig(x,150,0.66,'stand',{shirt:'#2c2a26',hat:'#1a1917',f:F('b1'),flip:i})).join('')}`,
 ship:`<rect width="200" height="160" fill="url(#sky${I})"/><g filter="${F('b3')}"><ellipse cx="130" cy="30" rx="40" ry="12" fill="#ece8dc"/></g><rect y="104" width="200" height="56" fill="#4e4a43"/>${[0,1,2,3,4,5].map(i=>`<path d="M0 ${112+i*8} Q50 ${108+i*8} 100 ${112+i*8} T200 ${112+i*8}" stroke="#7d786d" stroke-width="1" fill="none" opacity=".7"/>`).join('')}
  <g filter="${F('s')}"><path d="M14 80 L186 80 L172 108 L26 108Z" fill="#1f1d1a"/><rect x="40" y="62" width="110" height="18" fill="#e3ddcf"/><rect x="56" y="48" width="72" height="14" fill="#d6d0c1"/>${[...Array(14)].map((_,i)=>`<circle cx="${46+i*7.6}" cy="71" r="1.6" fill="#3a3731"/>`).join('')}<rect x="78" y="24" width="14" height="24" fill="#2a2824"/><rect x="100" y="28" width="14" height="20" fill="#2a2824"/><path d="M80 24 L90 24" stroke="#e3ddcf" stroke-width="3"/></g><g filter="${F('b2')}"><ellipse cx="86" cy="16" rx="10" ry="6" fill="#5a564d"/></g>`,
 scooter:`<rect width="200" height="160" fill="url(#wall${I})"/><g filter="${F('b2')}"><rect x="0" y="0" width="200" height="40" fill="#7d786d"/><rect x="20" y="8" width="40" height="24" fill="#d6d1c3"/><rect x="130" y="8" width="40" height="24" fill="#d6d1c3"/></g><rect y="112" width="200" height="48" fill="#5f5b52"/>
  <g filter="${F('s')}"><path d="M52 112 Q48 92 70 88 L112 88 Q124 86 128 98 L140 104 L140 112Z" fill="#cfc9ba"/><path d="M128 98 L138 58" stroke="#2a2824" stroke-width="4"/><path d="M126 56 L150 52" stroke="#2a2824" stroke-width="3.4"/>${[[130,40],[142,30],[154,38],[146,48]].map(([x,y])=>`<path d="M138 56 L${x} ${y}" stroke="#4a463f" stroke-width="1"/><circle cx="${x}" cy="${y}" r="3.2" fill="#e9e4d6" stroke="#4a463f" stroke-width="1"/>`).join('')}<circle cx="64" cy="116" r="11" fill="#151412"/><circle cx="136" cy="116" r="11" fill="#151412"/><circle cx="64" cy="116" r="4" fill="#8d887c"/><circle cx="136" cy="116" r="4" fill="#8d887c"/></g>
  ${npFig(92,106,0.86,'sit',{shirt:'#4a463f',sleeve:'#4a463f',arm:'#4a463f',legs:'#2a2824'})}`,
 film:`<rect width="200" height="160" fill="#121110"/><path d="M180 30 L0 70 L0 130 L180 44Z" fill="#e9e4d6" opacity=".18" filter="${F('b2')}"/><path d="M180 34 L20 78 L20 112 L180 40Z" fill="#f6f2e8" opacity=".14"/>${[...Array(30)].map((_,i)=>`<circle cx="${30+(i*47)%150}" cy="${60+(i*31)%60}" r=".7" fill="#fff" opacity=".5"/>`).join('')}
  ${[0,1,2].map(r=>[...Array(9)].map((_,i)=>`<path d="M${i*24+r*8-6} ${160-r*20} Q${i*24+r*8} ${136-r*20} ${i*24+r*8+8} ${160-r*20}Z" fill="#0b0a09"/><circle cx="${i*24+r*8+1}" cy="${140-r*20}" r="6" fill="#0b0a09"/>`).join('')).join('')}<g filter="${F('s')}"><rect x="170" y="22" width="24" height="18" fill="#3a3731"/><circle cx="176" cy="18" r="7" fill="#2a2824"/><circle cx="190" cy="18" r="7" fill="#2a2824"/><circle cx="170" cy="31" r="3" fill="#fffdf6"/></g>`,
 tower:`<rect width="200" height="160" fill="url(#sky${I})"/><g filter="${F('b2')}"><ellipse cx="50" cy="40" rx="50" ry="12" fill="#ece8dc"/></g><g filter="${F('b1')}"><path d="M0 120 L0 92 L24 92 L24 84 L52 84 L52 100 L70 100 L70 120Z" fill="#6b675e"/><path d="M130 120 L130 88 L160 88 L160 96 L200 96 L200 120Z" fill="#6b675e"/></g>
  <g filter="${F('s')}"><path d="M96 120 L98 26 L106 26 L108 120Z" fill="#3a3731"/><path d="M98 26 L98 120" stroke="#8d887c" stroke-width="1.4"/>${[44,52,60].map(y=>`<rect x="92" y="${y}" width="20" height="5" rx="2" fill="#26241f"/>`).join('')}${[72,80].map(y=>`<rect x="90" y="${y}" width="24" height="4" fill="#d6d0c1"/>`).join('')}<path d="M101 26 L101 6" stroke="#2a2824" stroke-width="2"/></g><rect y="120" width="200" height="40" fill="#4a463f"/>`
 };
 return S[k];}
function newsPhoto(k){const I='n'+(MEETN++);const body=npScene(k,I);if(!body)return '';
  return `<svg viewBox="0 0 200 160" class="np-pic photo" aria-hidden="true">${npDefs(I)}<g filter="url(#s${I})">${body}</g><rect width="200" height="160" fill="#8a857a" opacity=".08"/><rect width="200" height="160" filter="url(#gr${I})" opacity=".55" style="mix-blend-mode:multiply"/><rect width="200" height="160" fill="url(#hs${I})"/><rect width="200" height="160" fill="url(#vg${I})"/></svg>`;}

/* ---- the academy: real youngsters join two years before their debut, never before 15 ---- */
function youthJoin(r){return Math.max(1960,r[6]-2,r[2]+15);}
function acadReal(r){const [n,pos,b,ca,pa,c,y]=r;if(!G.clubs[c])return null;if(G.year-b>=18){const q=mkPlayer({n,pos,b,ca:Math.max(30,Math.round(ca-4*Math.max(0,y-G.year))),pa,c,real:true});return q;}const yrs=Math.max(0,y-G.year);const p=mkPlayer({n,pos,b,ca:Math.max(30,Math.round(ca-4*yrs)),pa,c,real:true});p.acad=true;p.acadReal=y;p.w=Math.min(p.w,8);return p;}
function acadInit(){if(G.acadV)return;G.acadV=1;
  DATA.youth.forEach(r=>{if(r[6]>G.year&&youthJoin(r)<=G.year&&!findByName(r[0]))acadReal(r);});
  if(G.date.slice(5)<='08-20'&&!G.user.games)Object.keys(G.clubs).forEach(cid=>{if(G.clubs[cid].country)return;const have=sq(cid).filter(p=>p.acad).length;for(let k=have;k<2;k++)genPlayer(cid,pick(['FB','WH','IF','WG','CF','CH','GK']),true);});}

/* ---------- the rumour mill: the stars (85 and over) and the top managers ---------- */
const topMgr=cid=>{const c=G.clubs[cid];return !!c&&!c.eu&&c.div===0&&cid!==U()&&mq(cid)>=4;};
const RUMSRC=["The Sporting Pink hears that","Word in the press box at {G} is that","Talk in the boardrooms this week is that","A little bird tells us that","It is being whispered in the Midland Hotel that","Our football correspondent understands that","They are saying in the pubs around {G} that","Sources close to the club suggest that"];
const RUM1=["{B} have had {P} watched three Saturdays running.","{BM}, the {Bs} manager, was in the stand at {G} on Saturday, and he was not there for the pies. He went to see {P}.","{B} are ready to break their transfer record for {P}.","{P} is unsettled at {PC}, and {B} have noticed.","{BM} has told his directors that {P} is the one man he needs."];
const RUM2=["{B2} have joined the race for {P}. {B} were thought to be favourites.","{BM} and {BM2} are both said to want {P}. {PC} insist he is not for sale.","{B} and {B2} are fighting it out for {P}, and the smart money is on {Bf}.","{B2} have made a late move for {P}. {BM2} is said to have met the player's father."];
const RUM3=["{P} is expected to sign for {Bf} within the week.","{Bf} and {PC} are said to have agreed terms for {P}. All that is left is the paperwork.","{P} has been seen house-hunting near {BG}."];
const RUMU1=["{B} are said to be watching your {P}. {BM} was at the ground on Saturday.","Your {P} has caught the eye of {BM} at {B}. A bid could be on the way.","{B} are lining up an offer for {P}, according to the Pink."];
const RUMTWIST=["So much for the rumours. {P} has signed for {W}, not {L}.","Everybody said {L}. {P} has gone to {W}.","A late twist: {L} were the favourites, but {P} has chosen {W}."];
function rumVars(p,B,B2,fav){const pc=club(p.c);return {P:p.n,PC:pc?pc.n:'his club',G:pc?pc.g:'the ground',B:cn(B),Bs:club(B).s,BM:club(B).m,BG:club(B).g,B2:B2?cn(B2):'',BM2:B2?club(B2).m:'',Bf:cn(fav||B)};}
function rumSay(p,stage,mv){const v=rumVars(p,mv.suitors[0],mv.suitors[1],mv.fav);const src=fill(pick(RUMSRC),v);const pool=stage===1?(mv.user?RUMU1:RUM1):stage===2?RUM2:RUM3;let line=fill(pick(pool),v);
  const title=stage===1?`RUMOUR: ${surname(p.n).toUpperCase()} TO ${club(mv.suitors[0]).s.toUpperCase()}?`:stage===2?`RUMOUR: RACE FOR ${surname(p.n).toUpperCase()}`:`RUMOUR: ${surname(p.n).toUpperCase()} DEAL CLOSE`;
  const m=msg('press',title,`${src} ${line}${stage===1&&!mv.user?' Nothing is official, and the clubs are saying nothing.':''}`,null);m.rumour=true;m.pic='rep:eddie';}
function rumStars(){return Object.values(G.players).filter(p=>p.ca>=85&&p.c&&G.clubs[p.c]&&!G.clubs[p.c].eu&&!p.ret&&!p.eu&&!p.rum&&!p.acad&&G.year-p.b<=31&&daysBetween(p.rumLast||'1900-01-01',G.date)>=120);}
function rumWeekly(){if(G.autopilot)return;const R=G.rum=G.rum||{moves:[],n:1,h:{}};
  R.moves.slice().forEach(mv=>{const p=G.players[mv.pid];if(!p||p.c!==mv.from){if(p)p.rum=null;R.moves.splice(R.moves.indexOf(mv),1);return;}
    if(G.date>=mv.date||G.deadline){rumResolve(mv);return;}
    if(mv.stage===1&&mv.suitors.length>1&&daysBetween(mv.start,G.date)>=10){mv.stage=2;rumSay(p,2,mv);}
    else if(mv.stage<3&&mv.real&&!mv.user&&daysBetween(G.date,mv.date)<=8&&rand()<0.7){mv.stage=3;rumSay(p,3,mv);}});
  /* real moves from history: a rumour or two first, and sometimes the papers back the wrong horse */
  if(G.hist)DATA.hist.forEach((e,i)=>{if(R.h[i]||G.histDone[i])return;if(e.t!=='move'&&e.t!=='arrive')return;const dd=daysBetween(G.date,e.d);if(dd<7||dd>30)return;
    const n=e.t==='move'?e.n:e.p[0];const p=findByName(n);const rating=p?p.ca:(e.p?e.p[3]:0);if(rating<85||!topMgr(e.c))return;R.h[i]=1;
    const others=Object.keys(G.clubs).filter(c=>topMgr(c)&&c!==e.c&&(!p||c!==p.c));const decoy=others.length&&rand()<0.5?pick(others):null;const fav=decoy||e.c;
    const fake={suitors:decoy?[decoy,e.c]:[e.c],fav,user:false};const pp=p||{n,c:null};R.h['f'+i]={fav,n};
    rumSay(pp,1,{...fake,suitors:[fav].concat(decoy?[e.c]:[])});});
  DATA.hist.forEach((e,i)=>{const f=R.h['f'+i];if(!f||!G.histDone[i]||f.done)return;f.done=1;if(f.fav!==e.c){const m=msg('press',`${surname(f.n).toUpperCase()}: THE PAPERS GOT IT WRONG`,fill(pick(RUMTWIST),{P:f.n,W:cn(e.c),L:cn(f.fav)}),null);m.rumour=true;}});
  if(G.deadline||R.moves.length>=3||rand()>0.14)return;
  const mineStars=sq(U()).filter(p=>p.ca>=85&&!p.rum&&!p.acad&&daysBetween(p.rumLast||'1900-01-01',G.date)>=120);const userTurn=mineStars.length&&rand()<0.25;
  const p=userTurn?pick(mineStars):pick(rumStars().filter(x=>x.c!==U()));if(!p)return;
  const pc=club(p.c);const fee=valueOf(p);const suit=Object.keys(G.clubs).filter(c=>topMgr(c)&&c!==p.c&&club(c).rep>=pc.rep-6&&club(c).bal>=fee*0.7);if(!suit.length)return;
  const sh=shuffle(suit.slice());const suitors=sh.slice(0,sh.length>1&&rand()<0.6?2:1);
  const mv={id:R.n++,pid:p.id,from:p.c,suitors,fav:suitors[0],start:G.date,date:addDays(G.date,ri(21,42)),stage:1,real:userTurn?rand()<0.7:rand()<0.55,user:p.c===U()};
  p.rum=mv.id;p.rumLast=G.date;R.moves.push(mv);rumSay(p,1,mv);}
function rumResolve(mv){const R=G.rum;R.moves.splice(R.moves.indexOf(mv),1);const p=G.players[mv.pid];if(!p)return;p.rum=null;
  if(G.deadline||!mv.real){if(mv.stage>=2&&!mv.user){const m=msg('press',`${surname(p.n).toUpperCase()} STAYS PUT`,`${p.n} is going nowhere. ${cn(p.c)} have turned down every approach, and the talk of a move has died down.`,null);m.rumour=true;}return;}
  let win=mv.fav;if(mv.suitors.length>1&&rand()<0.4)win=mv.suitors.find(c=>c!==mv.fav);
  const fee=roundFee(askPrice(p)*rf(1,1.15));if(club(win).bal<fee*0.8){const other=mv.suitors.find(c=>c!==win);if(other&&club(other).bal>=fee*0.8)win=other;else return;}
  if(mv.user){offer(win,p.id,roundFee(Math.max(fee,valueOf(p))),'The rumours were true.');return;}
  transfer(p,win,fee);if(win!==mv.fav){const m=msg('press',`${surname(p.n).toUpperCase()} TWIST`,fill(pick(RUMTWIST),{P:p.n,W:cn(win),L:cn(mv.fav)})+` The fee is ${money(fee)}.`,null);m.rumour=true;}}

/* ---------- the Tactics squad list can be sorted, and set-piece takers come from the eleven ---------- */
SORTS.tac={pos:p=>ORD2[p.pos],n:p=>p.n,ca:p=>p.ca,role:p=>UI.pick!=null&&UI.pick<11?eff(p,FORMS[G.user.form].s[UI.pick][0]):p.ca,fit:p=>p.fit,form:p=>p.form&&p.form.length?avgForm(p):0};
UI.sort.tac=UI.sort.tac||{k:'auto',d:-1};
const inXI=id=>!!id&&(G.user.xi||[]).includes(id);
function spBest(k,not){const rel=SPREL[k];const L=(G.user.xi||[]).map(id=>G.players[id]).filter(p=>p&&p.pos!=='GK'&&(k!=='lt'||hasT(p,'longthrow')));return L.sort((a,b)=>(rel.some(t=>hasT(b,t))-rel.some(t=>hasT(a,t)))||b.ca-a.ca)[0];}
function spStandIns(){const u=G.user;u.sp=u.sp||{};u.spNote=u.spNote||{};['pen','fk','cor','lt'].forEach(k=>{const id=u.sp[k];if(!id)return;if(inXI(id)){if(u.spNote[k]&&u.spNote[k].orig&&inXI(u.spNote[k].orig)){u.sp[k]=u.spNote[k].orig;delete u.spNote[k];}return;}
    const orig=(u.spNote[k]&&u.spNote[k].orig)||id;const b=spBest(k);if(!b){return;}u.sp[k]=b.id;u.spNote[k]={orig,txt:`${G.players[orig]?G.players[orig].n:'Your man'} is not in the side, so ${b.n} stands in.`};});}

/* ---------- transfer talks: first the club, then the player ---------- */
function dealOf(p){const D=(G.user.deals||{})[p.id];if(!D)return null;if(D.exp<G.date||p.c!==D.cid||G.deadline){delete G.user.deals[p.id];return null;}return D;}
function dealTick(d){const D=G.user.deals||{};Object.keys(D).forEach(pid=>{const x=D[pid];const p=G.players[pid];if(!p||x.exp<d||p.c!==x.cid||G.deadline){delete D[pid];
  G.inbox.forEach(m=>{if(m.act&&m.act.k==='terms'&&m.act.pid===+pid&&!m.act.done){m.act.done=true;m.act.res=p&&p.c!==x.cid?'He has gone elsewhere':'The agreed fee has lapsed';}});
  if(p&&p.c===x.cid)msg('transfer',`Deal off: ${p.n}`,`${G.deadline?'The transfer deadline has passed':`We never sat down with ${p.n}`}, and ${x.seller}'s acceptance of our ${money(x.fee)} bid has lapsed. We would have to start again.`);}});}
function clubAgree(p,md,fee,note){const u=G.user;u.deals=u.deals||{};const seller=sellerN(p);const exp=addDays(G.date,10);u.deals[p.id]={cid:p.c,fee,exp,seller,date:G.date};md.fee=fee;md.stage='agreed';md.note=note;
  G.inbox.forEach(m=>{if(m.act&&m.act.k==='terms'&&m.act.pid===p.id&&!m.act.done){m.act.done=true;m.act.res='Superseded';}});
  msg('transfer',`Fee agreed for ${p.n}`,`${seller} have accepted ${money(fee)} for ${p.n}. The offer stands until ${fmtDate(exp)}: now we need to agree personal terms with the player. If you need to sort out the money first, do it before then.`,{k:'terms',pid:p.id,exp});}
function negArt(p,view){const id='ng'+(MEETN++);const W=480,H=300;let figs,bg;
  if(view==='club'){bg='committee';const host=p.c&&p.c!=='ABR'?mgrLook(p.c):(LOOKS.gent||LOOKS.chair);figs=sceneFig(host,2,42,0.9,false)+sceneFig(LOOKS.you,262,42,0.9,true);}
  else{bg='hotel';const adv=G.year-p.b<=20?(LOOKS.dour||LOOKS.chair):(LOOKS[['spiv','gent','spiv','dour'][(p.id*7)%4]]||LOOKS.chair);figs=sceneFig(adv,-34,62,0.74,false)+sceneFig(playerLook(p,p.c&&p.c!=='ABR'?p.c:null,'n'),96,48,0.84,false)+sceneFig(LOOKS.you,272,42,0.9,true);}
  return `<svg class="meetart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${view==='club'?'Talks with the club':'Talks with the player'}"><defs>${HTP(id)}<clipPath id="mc-${id}"><rect width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#mc-${id})">${meetBG(bg,id)}<rect width="${W}" height="${H}" fill="url(#mh-${id})" opacity=".5"/>${figs}${meetFront(bg)}</g><rect x="3" y="3" width="${W-6}" height="${H-6}" fill="none" stroke="${K}" stroke-width="6"/></svg>`;}
function advName(p){const sn=surname(p.n);return G.year-p.b<=20?`his father, Mr ${sn}`:`his adviser, Mr ${DATA.last[(p.id*13)%DATA.last.length]}`;}
function negRoomHTML(p,md){const club_=md.view==='club';const seller=p.c&&p.c!=='ABR'?sellerN(p):p.c==='ABR'?(p.abroad||'his club'):'';const mg=p.c&&p.c!=='ABR'?club(p.c).m:null;
  let body;
  if(club_){if(md.stage==='agreed'){const D=dealOf(p);body=`<div class="bid negok"><p class="eyebrow">Bid accepted</p><p><strong>${esc(seller)}</strong> accept <strong>${money(md.fee)}</strong> for ${esc(p.n)}. Talks with the club are complete.</p><p class="muted sm">The offer stands until ${D?fmtDate(D.exp):'further notice'}. Now ${esc(p.n)} has to agree personal terms.</p>
      <div class="row gap wrap"><button class="btn go" data-a="negplayer" data-id="${p.id}">Talk to the player now</button><button class="btn" data-a="closeModal">Leave it for now</button></div><p class="muted sm">If you need to move money around first, the intray will remind you to go back to him.</p></div>`;}
    else body=negHTML(p,md);}
  else body=md.stage==='done'?'':negHTML(p,md);
  const who=club_?(mg?`${esc(mg)}, manager of ${esc(seller)}`:`The directors of ${esc(seller)}`):`${esc(p.n)}, with ${esc(advName(p))}`;
  return `<div class="scrim" data-a="closeModal"></div><div class="card negroom" role="dialog" aria-modal="true" aria-label="${club_?'Transfer talks':'Personal terms'}"><button class="x" data-a="closeModal" aria-label="Close">×</button>
   <p class="eyebrow">${club_?'Transfer talks · stage one of two: the fee':'Personal terms · stage two of two: the player'}</p><h2 class="h1">${club_?`${esc(p.n)}: talks with ${esc(seller)}`:`${esc(p.n)}: his terms`}</h2>
   <div class="negart">${negArt(p,club_?'club':'player')}</div><p class="negwho">Across the table: ${who}</p>
   ${md.note?`<p class="stamp">${esc(md.note)}</p>`:''}${body}
   <div class="row gap wrap negfoot"><button class="btn ghost sm" data-a="negcard" data-id="${p.id}">Back to his card</button></div></div>`;}
const NEG_ACT={
 negclub(d){const p=G.players[+d.id];const md=UI.modal;if(!p||!md)return;if(G.deadline){md.note='The deadline has passed.';renderModal();return;}md.view='club';if(md.stage!=='counter')md.stage=dealOf(p)?'agreed':md.stage==='agreed'?'agreed':'fee';if(dealOf(p))md.fee=dealOf(p).fee;md.note='';renderModal();},
 negplayer(d){const p=G.players[+d.id];let md=UI.modal;if(!p)return;if(!md||md.pid!==p.id){UI.modal={pid:p.id};md=UI.modal;}
   if(G.deadline){md.note='The deadline has passed.';md.view=null;renderModal();return;}
   if(ftSize()>=FTMAX){md.note=fullMsg();md.view=null;renderModal();return;}
   if(p.c&&p.c!==U()){const D=dealOf(p);if(!D){md.note='There is no agreed fee for him at the moment. Talk to his club first.';md.view=null;renderModal();return;}md.fee=D.fee;}else md.fee=0;
   md.view='player';enterTerms(p,md,'');if(md.stage==='done'&&p.c&&G.user.deals){delete G.user.deals[p.id];G.inbox.forEach(m=>{if(m.act&&m.act.k==='terms'&&m.act.pid===p.id&&!m.act.done){m.act.done=true;m.act.res='He would not come';}});}
   renderModal();},
 negcard(d){const md=UI.modal;if(md){md.view=null;md.note='';}renderModal();},
 opendeal(d){UI.modal={pid:+d.id};NEG_ACT.negplayer(d);}
};

/* ---------- the manager's market: sackings, vacancies, applications and approaches ---------- */
const MKT=()=>G.mkt=G.mkt||{log:[],pool:[]};
function mktLog(t){const M=MKT();M.log.unshift({d:G.date,t});if(M.log.length>24)M.log.length=24;}
function mktPos(cid){const c=club(cid);if(!c||c.div<0||c.eu)return 0;const t=table(c.div);return t.findIndex(r=>r.id===cid)+1;}
/* how a board rates you for their job: your standing against the size of the club */
function mktChance(cid){const c=club(cid);const need=c.rep*0.8-12;const v=clamp((mrepOf()-need)/22+0.15,0,0.95);return v;}
const mktWord=v=>v>=0.8?'Favourite':v>=0.6?'Strong candidate':v>=0.4?'In with a shout':v>=0.2?'Long shot':'No chance';
function mktSack(cid,why){const c=club(cid);if(!c||c.vac||cid===U())return;const old=c.m;const me=old===G.user.name;if(old&&!me&&!/caretaker/.test(old))MKT().pool.push({n:old,rep:c.rep,from:cid,y:G.year});
  const ct=genName(1925,cid);c.vac={since:G.date,why,old,care:ct};c.m=`${ct} (caretaker)`;c.mq=null;
  const head=why==='left'?`${surname(old||'').toUpperCase()} LEAVES ${c.s.toUpperCase()}`:why==='summer'?`${surname(old||'').toUpperCase()} STEPS DOWN AT ${c.s.toUpperCase()}`:`${c.s.toUpperCase()} SACK ${surname(old||'').toUpperCase()}`;
  const body=why==='left'?`${old} has left ${c.n}. ${ct} takes charge for now while the board look for a successor.`:why==='summer'?`${old} has stepped down as manager of ${c.n}. ${ct} will look after the side until a new man is appointed.`:`${c.n} have dismissed their manager, ${old}, after a disappointing run. ${ct} takes temporary charge.`;
  if(!G.autopilot){if(!me){const m=msg('press',head,body,null,cid);m.mkt=true;}mktLog(`${c.n}: ${why==='sacked'?`${old} sacked`:`${old} leaves`}.`);}}
function mktAppoint(cid,name){const c=club(cid);if(!c||!c.vac)return;const M=MKT();c.m=name;c.mq=null;delete c.vac;M.pool=M.pool.filter(x=>x.n!==name);
  if(!G.autopilot){const m=msg('press',`${c.s.toUpperCase()} APPOINT ${surname(name).toUpperCase()}`,`${c.n} have appointed ${name} as their new manager.`,null,cid);m.mkt=true;mktLog(`${c.n}: ${name} appointed.`);}}
function mktOffer(cid,applied){const c=club(cid);if(!c||!c.vac||c.vac.offered)return;c.vac.offered=G.date;G.inbox.forEach(m=>{if(m.act&&m.act.k==='applied'&&m.act.club===cid&&!m.act.done){m.act.done=true;m.act.res='Offered the job';}});const exp=expFor(cid);const est=Math.max(0,roundFee(c.bal*0.5));
  msg('board',applied?`${c.n} offer you the job`:`${c.n} want you`,`${applied?`Your application has gone down well. `:`The chairman of ${c.n} has been in touch, very discreetly. `}${chairOf(cid).n} would like you to be the new manager of ${c.n}.\n\nThe job: ${DIVN[c.div]}${G.fx.some(f=>f.comp==='L'&&f.p&&(f.h===cid||f.a===cid))?`, ${ord(mktPos(cid)||1)} in the table at the moment`:', before a ball has been kicked'}. A two-year contract at £${mgrWage(cid)} a week. The board would expect a finish of ${ord(exp)} or better, and there is about ${money(est)} to spend on players.\n\nThe offer stands for ten days.`,{k:'job',club:cid,exp:addDays(G.date,10),mkt:1});}
function mktWeekly(){const M=MKT();const md=G.date.slice(5);const inSeason=md>='09-15'||md<='04-30';
  Object.values(G.clubs).forEach(c=>{if(c.eu||c.div<0||c.id===U())return;
    if(!c.vac&&inSeason){const pl=G.fx.filter(f=>f.comp==='L'&&f.p&&(f.h===c.id||f.a===c.id)).length;if(pl<8)return;const gap=mktPos(c.id)-expFor(c.id);const st=c.fstreak||0;
      let p=0.004*Math.max(0,gap-3)+(st<=-4?0.02:0);if(MGRQ5[c.m]>=5)p*=0.1;else if(MGRQ5[c.m])p*=0.4;if(G.hist)p*=0.5;if(rand()<Math.min(0.06,p))mktSack(c.id,'sacked');return;}
    if(c.vac&&!c.vac.offered&&daysBetween(c.vac.since,G.date)>=14&&rand()<0.3){
      if(c.vac.applied&&!G.autopilot&&rand()<mktChance(c.id)){mktOffer(c.id,true);return;}
      const cands=M.pool.filter(x=>x.from!==c.id&&Math.abs(x.rep-c.rep)<18);const pickN=cands.length&&rand()<0.6?pick(cands).n:genName(1925,c.id);mktAppoint(c.id,pickN);
      if(c.vac===undefined&&!G.autopilot&&G.inbox.some(m=>m.act&&m.act.k==='applied'&&m.act.club===c.id&&!m.act.done)){G.inbox.forEach(m=>{if(m.act&&m.act.k==='applied'&&m.act.club===c.id&&!m.act.done){m.act.done=true;m.act.res='Someone else got the job';}});}}
    if(c.vac&&c.vac.offered&&daysBetween(c.vac.offered,G.date)>12){const pickN=genName(1925,c.id);mktAppoint(c.id,pickN);}});
  if(G.autopilot||G.sacked)return;
  /* applications are answered within a week or so */
  G.inbox.forEach(m=>{const a=m.act;if(!a||a.k!=='applied'||a.done||G.date<a.reply)return;const c=club(a.club);a.done=true;if(!c.vac){a.res='The job has gone';return;}
    if(rand()<mktChance(a.club)){a.res='Offered the job';mktOffer(a.club,true);}else{a.res='Turned down';msg('board',`${c.n}: thanks, but no`,`${chairOf(a.club).n} has written to thank you for your interest in the ${c.n} job. The board have decided to look elsewhere.`);}});
  /* clubs who rate you come knocking */
  if(rand()<0.12){const v=Object.values(G.clubs).filter(c=>c.vac&&!c.vac.offered&&!c.vac.applied&&mktChance(c.id)>=0.6&&daysBetween(c.vac.since,G.date)>=7);if(v.length)mktOffer(pick(v).id,false);}}
function mktSummer(){if(G.autopilot)return;Object.values(G.clubs).forEach(c=>{if(c.eu||c.div<0||c.id===U()||c.vac)return;if(MGRQ5[c.m]>=5)return;if(rand()<(G.hist?0.02:0.04))mktSack(c.id,'summer');});}
function cMarket(){const v=Object.values(G.clubs).filter(c=>c.vac&&!c.eu).sort((a,b)=>a.div-b.div||b.rep-a.rep);const M=MKT();const r=mrepOf();
  const applied=id=>G.inbox.some(m=>m.act&&m.act.k==='applied'&&m.act.club===id&&!m.act.done);const offered=id=>G.inbox.some(m=>m.act&&m.act.k==='job'&&m.act.club===id&&!m.act.done);
  const k=G.user.contract;
  return `<div class="stack"><section class="panel"><div class="ph"><div><h2 class="h1">The manager's market</h2><p class="muted">Who has a job, who has lost one, and who might want you.</p></div></div>
   <dl class="dl"><div><dt>Your standing</dt><dd>${esc(mrepWord(r))} <small class="muted">(${Math.round(r)}/100)</small></dd></div><div><dt>Your contract</dt><dd>${k?`£${k.wage} a week, until the end of ${seasonLbl(k.until)}`:'None'}</dd></div><div><dt>Board confidence</dt><dd>${confText(G.user.conf)}</dd></div></dl>
   <p class="muted sm">Your standing grows with results, trophies and promotions, and with doing better than your club's size suggests. The bigger the club, the higher the standing they look for. Applying is discreet, but your own board sometimes hear about it.</p></section>
   <section class="panel"><h3 class="h2 first">Vacancies</h3>${v.length?`<div class="tw"><table class="tbl"><thead><tr><th class="l">Club</th><th class="l">Division</th><th class="l">Vacant since</th><th class="l">Board expects</th><th class="l">Your chances</th><th></th></tr></thead><tbody>${v.map(c=>{const ch=mktChance(c.id);return `<tr><td class="l nm">${crest(c.id,'sm')} ${esc(c.n)}<br><small class="muted">${esc(c.vac.why==='sacked'?`${c.vac.old||'The manager'} sacked`:`${c.vac.old||'The manager'} left`)}; ${esc(c.vac.care)} in caretaker charge</small></td><td class="l">${DIVN[c.div]} <small class="muted">(${ord(mktPos(c.id)||1)})</small></td><td class="l">${fmtDate(c.vac.since,true)}</td><td class="l">${ord(expFor(c.id))} or better</td><td class="l"><span class="mk mk-${Math.round(ch*4)}">${mktWord(ch)}</span></td><td>${offered(c.id)?'<span class="lst">Offer in the intray</span>':applied(c.id)||c.vac.applied?'<span class="muted sm">Applied</span>':G.sacked?'':`<button class="btn sm" data-a="mktapply" data-id="${c.id}">Apply</button>`}</td></tr>`;}).join('')}</tbody></table></div>`:'<p class="muted">No vacancies at the moment. Every club in the League has a manager, for now.</p>'}</section>
   <section class="panel"><h3 class="h2 first">Comings and goings</h3>${M.log.length?`<ul class="rts">${M.log.slice(0,14).map(x=>`<li><span>${esc(x.t)}</span><small>${fmtDate(x.d,true)}</small></li>`).join('')}</ul>`:'<p class="muted">All quiet on the managerial front.</p>'}
   ${M.pool.length?`<p class="muted sm">Out of work and looking: ${esc(M.pool.slice(-6).map(x=>x.n).join(', '))}.</p>`:''}</section></div>`;}
const MKT_ACT={mktapply(d){const c=club(d.id);if(!c||!c.vac||c.vac.applied)return;c.vac.applied=G.date;
  msg('board',`Application sent to ${c.n}`,`You have written to ${chairOf(d.id).n}, chairman of ${c.n}, about their vacant manager's job. You should hear within a week or so.`,{k:'applied',club:d.id,reply:addDays(G.date,ri(5,10))});
  if(rand()<0.3){bumpConf(-4);msg('board','Word gets back',`${chairOf(U()).n} has heard that you have applied for the ${c.n} job. He is not pleased. "We expect loyalty at this club."`);}
  UI.clubNote='';save();render();}};

const ACT={
 setup(){if(UI.screen==='title'&&savedInfo()){UI.confirmNew=true;render();const b=$('.confirmnew [data-a="newno"].btn');if(b)b.focus();return;}UI.screen='setup';render();},
 newno(){UI.confirmNew=false;render();},
 newyes(){UI.confirmNew=false;UI.screen='setup';render();},
 resume(){loadSave().then(s=>{if(s){G=s;SQ=null;ensureState();UI.screen='game';UI.tab='inbox';render();}else{UI.note='That save could not be read.';render();}});},
 sdiv(d){UI.start.div=+d.d;render();},
 spick(d){UI.start.sel=d.id;UI.start.div=DATA.clubs.find(c=>c.id===d.id).d;render();},
 begin(){const st=UI.start;const name=(st.name||'').trim()||'Harry Ashworth';newGame(st.sel,name,st.hist);const to=+(st.year||1960);if(to>1960){startLater(to);return;}UI.screen='game';UI.tab='inbox';UI.msg=null;save();render();},
 cont(){cont();},
 tab(d){UI.tab=d.k;UI.screen='game';UI.pick=null;UI.finNote='';UI.spendNote='';UI.staffNote='';UI.clubNote='';render();window.scrollTo(0,0);},
 msg(d){UI.msg=+d.id;render();},
 inf(d){UI.inF=d.k;UI.msg=null;render();},
 markread(){G.inbox.forEach(m=>m.read=true);render();},
 openpaper(d){UI.paper={ids:[+d.id],i:0,spin:false};renderOverlay();},
 papernext(){UI.paper.i++;UI.paper.spin=false;renderOverlay();},
 paperclose(){UI.paper=null;if(UI.screen==='game')render();else renderOverlay();},
 player(d){UI.modal={pid:+d.id,stage:'fee'};renderModal();},
 closeModal(){UI.modal=null;renderModal();if(UI.screen==='game')render();},
 div(d){UI.div=+d.d;render();},
 fixv(d){UI.fixView=d.k;render();},
 cupr(d){UI.cupRound=+d.r;render();},
 cuptab(d){UI.cupTab=d.k;render();},
 lcr(d){UI.lcRound=+d.r;render();},
 tfm(d){UI.tf.mode=d.k;render();},
 autopick(){const b=bestXI(U(),G.user.form);G.user.xi=b.xi;G.user.sub=b.sub;G.user.held={};UI.pick=null;render();},
 slot(d){const i=+d.i;UI.pick=UI.pick===i?null:i;render();},
 place(d){const pid=+d.id;const i=UI.pick;if(i==null)return;const xi=G.user.xi;if(G.user.held){delete G.user.held[i];Object.keys(G.user.held).forEach(k=>{if(G.user.held[k]===pid)delete G.user.held[k];});}
   if(i===11){const w=xi.indexOf(pid);if(w>-1)xi[w]=G.user.sub;G.user.sub=pid;}
   else{const w=xi.indexOf(pid);if(w>-1){xi[w]=xi[i];}else if(G.user.sub===pid){G.user.sub=xi[i];}xi[i]=pid;}
   UI.pick=null;render();},
 tac(d){const o=TACOPT[d.k];if(o&&optLock(o,+d.v))return;G.user.tac[d.k]=+d.v;render();},
 setment(d){G.user.ment=+d.v;render();},
 toTactics(){const u=G.user;if(!u.mday)u.mday={xi:u.xi.slice(),sub:u.sub,form:u.form,ment:u.ment,tac:{...u.tac},roles:JSON.parse(JSON.stringify(u.roles||{})),spr:{...(u.spr||SPDEF)},held:{...(u.held||{})},sp:{...(u.sp||{})},spNote:JSON.parse(JSON.stringify(u.spNote||{})),formSet:u.formSet,day:G.date};UI.screen='game';UI.tab='tactics';render();},
 toProg(){UI.screen='prematch';render();window.scrollTo(0,0);},
 mdkeep(){G.user.mday=null;render();},
 kickoff(){startLive();},
 quickres(){const f=G.fx.find(x=>x.date===G.date&&!x.p&&isUserFx(x));if(!f)return;const m=runToEnd(newMatch(f,false),!!f.rpl);finalize(m);if(f.comp!=='L')resolveTie(f);playDay(G.date);UI.resDate=G.date;UI.screen=G.sacked?'sacked':'results';render();window.scrollTo(0,0);},
 spd(d){UI.live.speed=+d.k;tick();updateLive(false);},
 lment(d){const m=UI.live.m;const s=m.sides[m.us];s.ment=+d.k;s.str=strength(s);updateLive(false);},
 lsub(){const m=UI.live.m;const sel=$('#suboff');if(!sel)return;doSub(m,m.us,+sel.value);updateLive(false);},
 lpause(){const L=UI.live;L.paused=!L.paused;tick();updateLive(false);},
 lskip(){const L=UI.live;clearTimeout(L.timer);if(L.pend){clearTimeout(L.pend.fail);L.pend=null;}if(L.viz){L.viz.play=null;L.viz.fl=null;}L.ht=false;L.htDone=true;while(!L.m.done)mStep(L.m);endLive();updateLive(false);},
 talk(d){applyTalk(d.k);},
 afterlive(){cancelAnimationFrame(vizRAF);UI.resDate=G.date;UI.live=null;UI.screen=G.sacked?'sacked':'results';render();window.scrollTo(0,0);},
 printall(){clearInterval(printTimer);document.querySelectorAll('.vidi .vl,.vidi .vh').forEach(l=>l.classList.add('shown'));{const b=document.querySelector('[data-a="printall"]');if(b)b.style.visibility='hidden';}},
 resdone(){UI.mdBack=false;UI.screen=G.sacked?'sacked':'game';UI.tab='inbox';UI.msg=null;render();window.scrollTo(0,0);},
 seasondone(){UI.screen=G.sacked?'sacked':'game';UI.tab='inbox';UI.msg=null;render();window.scrollTo(0,0);},
 takejob(d){takeJob(d.id);UI.screen='game';UI.tab='inbox';UI.msg=null;save();render();},
 pressans(d){applyPress(UI.press,+d.i);save();renderOverlay();},
 pressskip(){G.user.pull=clamp((G.user.pull||0)-1,-10,10);UI.press=null;render();},
 pressdone(){UI.press=null;render();},
 acc(d){const m=G.inbox.find(x=>x.id===+d.id);if(!m||!m.act||m.act.done)return;const a=m.act;const p=G.players[a.pid];
   if(!p||p.c!==U()){a.done=true;a.res='No longer possible';render();return;}
   if(a.k==='offer'){if(G.deadline){a.done=true;a.res='Too late: the deadline has passed';render();return;}transfer(p,a.club,a.fee,'sold');a.res=`Accepted. ${p.n} has joined ${club(a.club).n}.`;UI.notice={k:'deal',kind:'sell',pid:p.id,fee:a.fee,toCid:a.club};}
   else if(a.k==='abroad'){club(U()).bal+=a.fee;G.user.fin.sales+=a.fee;G.user.budget.transfer+=Math.round(a.fee*0.75);removeFromUser(p);p.hist.push({y:G.year,from:U(),to:'ABR',fee:a.fee});setClub(p,'ABR','sold');p.abroad=a.to;a.res=`Accepted. ${p.n} is off to ${a.to}.`;UI.notice={k:'deal',kind:'sell',pid:p.id,fee:a.fee,toName:a.to};msg('press',`${surname(p.n).toUpperCase()} OFF TO ${a.to.toUpperCase()}`,`${p.n} leaves ${cn(U())} for ${a.to} in a ${money(a.fee)} deal.`,null,U());if(a.fee>100000)achGive('sold');}
   a.done=true;save();render();},
 rej(d){const m=G.inbox.find(x=>x.id===+d.id);if(!m||!m.act)return;m.act.done=true;m.act.res='Turned down';if(m.act.k==='job'){const jc=club(m.act.club);if(jc&&jc.vac)jc.vac.offered=null;if(!G.sacked){bumpConf(2);}}if(m.act.k!=='job'&&m.act.k!=='talk'){const p=G.players[m.act.pid];if(p){p.mor=clamp(p.mor-(p.listed?8:2),0,100);if(m.act.k==='offer'&&club(m.act.club).rep>club(U()).rep+5&&!p.listed)p.unsettled=m.act.club;}}save();render();},
 jobacc(d){const m=G.inbox.find(x=>x.id===+d.id);if(!m||!m.act||m.act.done)return;m.act.done=true;m.act.res='Accepted';takeJob(m.act.club);save();render();},
 list(d){const p=G.players[+d.id];p.listed=!p.listed;UI.modal.note=p.listed?`${p.n} is on the transfer list. Offers will come in the post.`:'Taken off the list.';renderModal();},
 release(d){const md=UI.modal;const p=G.players[+d.id];if(!md.confirmRel){md.confirmRel=true;renderModal();return;}removeFromUser(p);setClub(p,null,'released');p.listed=false;UI.modal=null;renderModal();render();},
 bid(d){const p=G.players[+d.id];const md=UI.modal;if(G.deadline){md.note='The deadline has passed.';renderModal();return;}
   if(ftSize()>=FTMAX){md.note=fullMsg();renderModal();return;}
   {const blk=abroadBlock(p);if(blk){md.note=blk;renderModal();return;}}
   if(!p.c){md.fee=0;md.view='player';enterTerms(p,md,'');renderModal();return;}
   const inp=$('#bid-fee');const fee=Math.max(0,Math.round(+(inp&&inp.value)||0));md.fee=fee;
   if(fee>club(U()).bal){md.note=`${chairOf(U()).pearsey?'Pearsey: "One does not have the funds, dear boy." ':'The bank won\'t stand it. '}You have ${money(club(U()).bal)}.`;renderModal();return;}
   if(fee>G.user.budget.transfer){md.note=`That is over your transfer budget of ${money(G.user.budget.transfer)}. Sell someone, or move money across on the Finances tab.`;renderModal();return;}
   if(p.c!=='ABR'&&sq(p.c).length<=16){md.note=`${sellerN(p)} can't spare anyone. Their squad is down to the bare bones.`;renderModal();return;}
   const seller=sellerN(p);if(!md.neg){const ask=askPrice(p,true);md.neg={ask,min:sellerMin(p,ask),pat:3,c:null};}const n=md.neg;
   if(fee>=n.min){clubAgree(p,md,fee,fee<n.ask?`${seller} accept. That's ${money(n.ask-fee)} less than their valuation.`:`${seller} accept your offer.`);}
   else if(fee<n.ask*0.55){n.pat-=2;if(n.pat<=0){md.stage='done';md.note=`${seller} put the phone down on you. Talks are over.`;}else{md.stage=n.c?'counter':'fee';md.note=`${seller} are insulted by ${money(fee)}. Their patience is wearing thin.`;}}
   else{n.pat-=1;const c=roundFee(Math.max(n.min,(n.c||n.ask)*0.55+fee*0.45));n.c=c;md.stage='counter';md.note='';}
   renderModal();},
 acceptfee(d){const p=G.players[+d.id];const md=UI.modal;const n=md.neg;if(!n||!n.c)return;md.fee=n.c;
   if(md.fee>club(U()).bal||md.fee>G.user.budget.transfer){md.note=`${chairOf(U()).pearsey?'Pearsey: "One does not have the funds, dear boy." ':''}You can't afford ${money(md.fee)} within your transfer budget.`;renderModal();return;}
   clubAgree(p,md,md.fee,`Fee agreed with ${sellerN(p)}.`);renderModal();},
 offerwage(d){const p=G.players[+d.id];const md=UI.modal;const wn=md.wn;if(!wn)return;const inp=$('#bid-wage');let w=Math.max(1,Math.round(+(inp&&inp.value)||0));md.wtry=w;
   if(G.wageCap&&w>G.wageCap){md.note=`The maximum wage is £${G.wageCap} a week. Nobody can pay more.`;renderModal();return;}
   if(w>=wn.d){md.note='';if(finishTerms(p,md,w))render();else renderModal();return;}
   if(w>=wn.min){md.note=`He'd hoped for more, but he'll sign.`;if(finishTerms(p,md,w))render();else renderModal();return;}
   if(w<wn.d*0.6){wn.pat-=2;if(wn.pat<=0){md.stage='done';md.note=`${p.n} walks out of the room. "I'm worth more than that." The deal is off.`;}else md.note=`${p.n} laughs at £${w} a week. He is not amused.`;renderModal();return;}
   wn.pat-=1;wn.c=Math.round(Math.max(wn.min,(wn.c||wn.d)*0.55+w*0.45));if(G.wageCap)wn.c=Math.min(wn.c,G.wageCap);md.stage='wcounter';md.note='';renderModal();},
 acceptwage(d){const p=G.players[+d.id];const md=UI.modal;if(!md.wn||!md.wn.c)return;md.note='';if(finishTerms(p,md,md.wn.c))render();else renderModal();},
 setyears(d){const p=G.players[+d.id];const md=UI.modal;if(!md.wn)return;md.years=+d.v;applyYears(p,md);md.wtry=null;renderModal();},
 renew(d){const p=G.players[+d.id];const md=UI.modal;enterRenew(p,md);renderModal();},
 talkans(d){const N=UI.notice;const m=G.inbox.find(x=>x.id===N.mid);if(!m||m.act.done)return;const p=G.players[m.act.pid];const o=TALKS[m.act.type].opts[+d.i];
   m.act.res=o[1](p);m.act.choice=+d.i;m.act.done=true;m.read=true;save();renderOverlay();},
 talkdone(){UI.notice=UI.dealNext?{k:'deal',...UI.dealNext}:null;UI.dealNext=null;render();},
 talklater(){UI.notice=null;render();},
 talkopen(d){UI.notice={k:'talk',mid:+d.id};renderOverlay();},
 holdout(d){const m=G.inbox.find(x=>x.id===+d.id);if(!m||!m.act||m.act.done||m.act.held)return;const a=m.act;if(a.fee0==null)a.fee0=a.fee;const p=G.players[a.pid];const buyer=a.k==='abroad'?a.to:club(a.club).n;
   const gen=a.fee/(valueOf(p)*(p.listed?0.85:1));
   if(a.max==null){a.max=roundFee(Math.max(a.fee*(gen>=1.3?1:rf(1.05,1.25)),valueOf(p)*rf(1.15,1.45)*(p.listed?0.85:1)));a.pat=gen>=1.3?1:ri(2,4);
     if(gen>=1.3&&rand()<(gen>=1.45?0.75:0.45)){a.done=true;a.res=`${money(a.fee)} was already a big offer. ${buyer} were insulted that you wanted more, and have pulled out.`;save();render();return;}}
   const ask=roundFee(a.fee*1.15);let line;
   if(ask<=a.max){const nf=roundFee(a.fee+(ask-a.fee)*rf(0.55,1));a.fee=nf;a.pat--;line=`You held out for more. ${buyer} have come back with ${money(nf)}.`;}
   else if(a.fee<a.max&&!a.final){a.fee=a.max;a.final=true;a.pat-=1;line=`You held out again. ${buyer} have gone to ${money(a.max)}, and say that is their final offer.`;}
   else if(rand()<(a.final?0.7:0.4)){a.done=true;a.res=`You pushed too far. ${buyer} have pulled out.`;save();render();return;}
   else{a.final=true;a.pat--;line=`${buyer} will not go a penny higher than ${money(a.fee)}. Take it or leave it.`;}
   if(a.pat<=0)a.held=true;a.exp=addDays(G.date,5);if(a.fee>=a.fee0*1.5)achGive('holdout');m.body+=`\n\n${line}`;save();render();},
 hire(d){const s=G.staffPool.find(x=>x.id===+d.id);if(!s)return;const c=club(U());
   if(G.user.staff.length>=staffSlots()){UI.staffNote=`No room. You have ${staffSlots()} backroom places. Let someone go first.`;render();return;}
   if(s.fee>c.bal){toast(`${noFunds()} <span>His signing-on fee is ${money(s.fee)}, and there is ${money(c.bal)} in the bank.</span>`);return;}
   if(wageBill(U())+staffBill()+s.w>G.user.budget.wage){UI.staffNote=`His £${s.w} a week would take you over the wage budget.`;render();return;}
   c.bal-=s.fee;G.user.fin.staff+=s.fee;G.user.staff.push(s);G.staffPool=G.staffPool.filter(x=>x!==s);UI.staffNote=`${s.n} joins as ${STAFF[s.type][0].toLowerCase()}.`;
   msg('club',`${s.n} joins the backroom`,`${s.n} starts work as ${STAFF[s.type][0].toLowerCase()} on £${s.w} a week. ${STAFF[s.type][1]}`);save();render();},
 sackstaff(d){const id=+d.id;if(UI.confirmStaff!==id){UI.confirmStaff=id;render();return;}const s=G.user.staff.find(x=>x.id===id);if(!s)return;const pay=s.w*4;club(U()).bal-=pay;G.user.fin.staff+=pay;
   G.user.staff=G.user.staff.filter(x=>x!==s);UI.confirmStaff=null;UI.staffNote=`${s.n} has gone, with ${money(pay)} in lieu of notice.`;save();render();},
 price(d){G.user.price=+d.v;render();},
 build(d){const u=UPG[d.k];const cost=Math.round(u.cost*infl());const c=club(U());if(c.bal<cost){toast(`${noFunds()} <span>The ${esc(u.n.toLowerCase())} costs ${money(cost)}, and there is ${money(c.bal)} in the bank.</span>`);return;}
   c.bal-=cost;G.user.fin.build+=cost;UPGS()[d.k]={start:G.date,done:addDays(G.date,u.wk*7)};UI.finNote='';UI.notice={k:'build',key:d.k,cost};
   if(cost>=20000)msg('press',`${c.s.toUpperCase()} BUILD FOR THE FUTURE`,`${c.n} have announced a ${money(cost)} scheme: ${u.n.toLowerCase()} at ${c.g}.`,null,true);save();render();},
 friendly(d){if(friendlyReady())return;const r=playFriendly(+d.i);(G.user.friendlies=G.user.friendlies||[]).unshift(r);if(G.user.friendlies.length>12)G.user.friendlies.length=12;UI.finNote='';UI.notice={k:'friendly',r};save();render();},
 goacad(){UI.sqSec='acad';ACT.tab({k:'squad'});},
 yform(d){const p=G.players[+d.id];if(!p||p.c!==U()||!p.acad)return;if(d.k==='none')delete p.yform;else p.yform=d.k;
  G.inbox.filter(m=>m.act&&m.act.k==='yforms'&&!m.act.done).forEach(m=>{const left=m.act.ids.map(id=>G.players[id]).filter(x=>x&&x.c===U()&&x.acad);if(left.length&&left.every(x=>x.yform)){m.act.done=true;m.act.res=`Forms offered: ${andList(left.filter(x=>x.yform==='keep').map(x=>x.n))||'nobody'}. Let go: ${andList(left.filter(x=>x.yform==='rel').map(x=>x.n))||'nobody'}.`;}});save();render();},
 yformsdone(d){const m=G.inbox.find(x=>x.id===+d.id);if(!m||m.act.done)return;const left=m.act.ids.map(id=>G.players[id]).filter(x=>x&&x.c===U()&&x.acad);m.act.done=true;m.act.res=`Forms offered: ${andList(left.filter(x=>x.yform!=='rel').map(x=>x.n))||'nobody'}. Let go: ${andList(left.filter(x=>x.yform==='rel').map(x=>x.n))||'nobody'}.`;save();render();},
 yhome(d){const m=G.inbox.find(x=>x.id===+d.id);if(!m||m.act.done)return;const p=G.players[m.act.pid];m.act.done=true;if(!p||p.c!==U()){m.act.res='Too late: he has gone.';save();render();return;}
  if(d.k==='home'){if(rand()<0.6){p.homesick=false;m.act.res=`A weekend with his mother did the trick. ${surname(p.n)} came back on the Sunday train with a cake tin and a smile.`;}else m.act.res=`He came back, but he was quiet all week. Keep an eye on him.`;}
  else if(d.k==='mentor'){const x=mentorPool(p)[0];if(x){p.mentor=x.id;if(rand()<0.8)p.homesick=false;m.act.res=`${x.n} has taken him under his wing: Sunday dinner at his house, and a lift to training.`;}}
  else{if(rand()<0.45){p.homesick=false;if(p.ca<p.pa)p.ca++;m.act.res=`He took it on the chin and has knuckled down. The coaches say he looks sharper for it.`;}else{removeFromUser(p);setClub(p,null,'home');p.acad=false;p.homesick=false;p.relBy=U();p.relY=G.year;p.relWhy='home';m.act.res=`He went home that night and is not coming back.`;}}
  save();render();},
 ytap(d){const m=G.inbox.find(x=>x.id===+d.id);if(!m||m.act.done)return;const a=m.act;const p=G.players[a.pid];a.done=true;if(!p||p.c!==U()){a.res='Too late.';save();render();return;}const bc=club(a.club);
  const lose=why=>{removeFromUser(p);setClub(p,a.club,'tapped');p.acad=true;p.relBy=U();p.relY=G.year;p.relWhy='tap';p.hist.push({y:G.year,from:U(),to:a.club,fee:why});};
  if(d.k==='pay'){club(U()).bal-=a.sum;p.loyal=true;a.res=`The family have a new television and the lad is staying put. Nobody needs to know.`;}
  else if(d.k==='report'){if(rand()<0.55){a.res=`The League had a quiet word with ${bc.s}, and they have backed off. ${surname(p.n)} stays.`;}else{lose(0);a.res=`The League found nothing they could prove. ${p.n} has gone to ${bc.n}, and we get nothing.`;}}
  else{const fee=Math.max(250,Math.min(1500+(G.year-1960)*150,Math.round(valueOf(p)*0.3/50)*50));club(U()).bal+=fee;lose(fee);a.res=`${p.n} has joined ${bc.n}. They paid ${money(fee)} for the inconvenience.`;}
  SQ=null;save();render();},
 promote(d){const p=G.players[+d.id];if(!p||!p.acad||p.c!==U())return;if(ftSize()>=FTMAX){toast(`<strong>No room.</strong> <span>${esc(fullMsg())}</span>`);return;}p.acad=false;p.gradOf=U();p.grad=G.year;p.w=wageFor(p);msg('club',`${p.n} promoted`,`${p.n} has signed professional forms and joined the first-team squad. He is on £${p.w} a week.`);UI.clubNote='';save();render();},
 gofriendly(){UI.tab='fixtures';UI.fixView='friendlies';UI.screen='game';render();window.scrollTo(0,0);},
 gochair(){UI.tab='club';UI.clubSec='board';UI.screen='game';UI.finNote='';render();window.scrollTo(0,0);},
 askboard(){const u=G.user;if(daysBetween(u.lastAsk,G.date)<30){UI.finNote='You asked the board recently. They will not discuss it again this month.';render();return;}
   u.lastAsk=G.date;const c=club(U());
   if(u.conf>=55&&c.bal>0&&rand()<u.conf/115){const add=roundFee(Math.max(2000*infl(),c.bal*0.15));u.budget.transfer+=add;u.budget.wage=Math.round(u.budget.wage*1.1);UI.finNote=`${chairOf(U()).n}: "${chairSay('askYes')}" Another ${money(add)} for transfers, and the wage budget goes up 10%.`;}
   else{u.conf=clamp(u.conf-2,0,100);UI.finNote=`${chairOf(U()).n}: "${chairSay(u.conf<55?'askNo':'askNo')}" ${u.conf<55?'The board are not happy with results, and not impressed that you asked.':'He is a little irritated that you asked.'}`;}
   save();render();},
 sort(d){const s=UI.sort[d.t];if(s.k===d.k)s.d=-s.d;else{s.k=d.k;s.d=(d.k==='n'||d.k==='pos'||d.k==='club')?1:-1;}if(d.t==='tf'){const r=$('#tf-res');if(r)r.innerHTML=tfResults();}else render();},
 splitreset(){const r=splitCalc(G.user.budget.rec||0);G.user.budget.transfer=r.transfer;G.user.budget.wage=r.wage;save();render();},
 papermode(d){G.settings.papers=d.k;if(d.k==='off')G.paperQ=[];save();render();},
 readq(){const ids=G.paperQ.slice().reverse().slice(0,5);G.paperQ=[];UI.paper={ids,i:0,spin:true};render();},
 dismissq(){G.paperQ=[];render();},
 noticeclose(){UI.notice=null;render();},
 openletter(d){UI.notice={k:'letter',mid:+d.id};renderOverlay();},
 ddacc(d){const m=G.inbox.find(x=>x.id===+d.id);if(!m||!m.act||m.act.done)return;if(G.deadline){m.act.done=true;m.act.res='Too late: the deadline has passed';render();return;}ddBuy(m);save();render();},
 radioans(d){radioAns(+d.i);save();renderOverlay();},
 radiodone(){if(G.radio)G.user.bbc=(G.user.bbc||0)+1;UI.notice=null;G.radio=null;save();render();},
 captain(d){const p=G.players[+d.id];if(!p||p.c!==U())return;makeCaptain(p);UI.modal.note=`${p.n} is your new captain.`;save();renderModal();},
 mindr(d){const m=G.inbox.find(x=>x.id===+d.id);if(!m||!m.act||m.act.done)return;mindReply(m,+d.i);save();render();},
 poachr(d){const m=G.inbox.find(x=>x.id===+d.id);if(!m||!m.act||m.act.done)return;poachReply(m,d.k==='1');save();render();},
 shortlist(d){const u=G.user;const id=+d.id;u.short=u.short||[];if(u.short.includes(id))u.short=u.short.filter(x=>x!==id);else{u.short.push(id);learn(G.players[id],5);}renderModal();},
 scoutreg(d){const u=G.user;const S=u.scouting=u.scouting||{on:[],wk:0};if(S.on.includes(d.k))S.on=S.on.filter(x=>x!==d.k);else{S.on.push(d.k);while(S.on.length>scoutSlots())S.on.shift();}save();render();},
 trialsign(d){const m=G.inbox.find(x=>x.id===+d.id);if(!m)return;trialSign(m,+d.p);save();render();},
 trialdone(d){const m=G.inbox.find(x=>x.id===+d.id);if(!m||m.act.done)return;trialClose(m);save();render();},
 subsid(){const f=nextAway();if(!f||f.subs)return;const cost=Math.round(coachesFor(f)*14*infl());const c=club(U());if(c.bal<cost){toast(`${noFunds()} <span>The coaches would cost ${money(cost)}.</span>`);return;}c.bal-=cost;G.user.fin.other-=cost;f.subs=true;c.fans=clamp(fans()+1.5,0,100);toast(`<strong>Coaches paid for.</strong> <span>${plu(coachesFor(f),'coach','coaches')} will leave the ground at seven on the morning of the match.</span>`);save();render();},
 benef(d){const m=G.inbox.find(x=>x.id===+d.id);if(!m||m.act.done)return;const a=m.act;a.done=true;if(d.k==='1'){const c=club(U());c.bal+=a.amt;G.user.budget.transfer+=Math.round(a.amt*0.8);chairOf(U()).dirs.push({n:a.who,job:'benefactor'});a.res=`${a.who} joins the board, and ${money(a.amt)} lands in the bank.`;msg('press',`${a.who.toUpperCase()} JOINS THE BOARD`,`${a.who} has put ${money(a.amt)} into ${cn(U())} and takes a seat on the board.`,null,U());}else a.res='You thanked him for his interest.';save();render();},
 scrappg(d){UI.scrapPg=+d.k;render();},
 scrapopen(d){scrapOpen(+d.i);renderOverlay();},
 retire(){if(!UI.confirmRetire){UI.confirmRetire=true;render();return;}UI.confirmRetire=false;UI.screen='retired';save();render();window.scrollTo(0,0);},
 unretire(){UI.screen='game';UI.tab='inbox';render();},
 tour(d){const u=G.user;if(!preSeason()||u.tourY===G.year)return;const [w,cost]=TOURS[+d.i];if(club(U()).bal<cost*infl()){toast(`${noFunds()} <span>The tour needs ${money(cost*infl())} up front.</span>`);return;}UI.spendNote=tourGo(+d.i);save();render();},
 winb(d){G.user.winb=+d.k;save();render();},
 loyalty(){if(G.user.loyY===G.year)return;const r=loyaltyPay();if(r)UI.spendNote=r;save();render();},
 charity(){if(G.user.charY===G.year)return;UI.spendNote=charityMatch();save();render();},
 calsel(d){UI.calSel=d.k;render();},
 calm(d){UI.calYM=d.k;render();},
 simto(d){if(!d.k||d.k<=G.date&&!G.fx.some(f=>f.date===G.date&&!f.p))return;simStart(d.k);},
 simstop(){if(UI.simrun)UI.simrun.stop=true;},
 rvnext(){const RV=G.review;if(!RV)return;RV.i++;if(RV.i>=4){G.review=null;UI.screen='season';}save();render();window.scrollTo(0,0);},
 rvchair(d){const RV=G.review;if(!RV||RV.chairRes)return;RV.chairRes=RVCHAIR[+d.i][1](RV.data);save();render();},
 openwire(d){UI.notice={k:'wire',mid:+d.id};renderOverlay();},
 souvenir(d){const sv=(G.user.souvenirs||[])[+d.i];if(!sv)return;UI.paper={docs:[sv],i:0,spin:true};renderOverlay();},
 clubsec(d){UI.clubSec=d.k;UI.clubNote='';render();},
 sqsec(d){UI.sqSec=d.k;render();},
 kit(d){const k=kitOf(U());k[d.f]=+d.v;save();render();},
 hofacc(d){const m=G.inbox.find(x=>x.id===+d.id);if(!m||!m.act||m.act.done)return;const p=G.players[m.act.pid];const R=REC(U());
   if(p){const y=R.yrs[p.id]||[G.year,G.year];const tro=(G.user.cab||[]).filter(t=>t.club===U()&&t.y>=y[0]&&t.y<=y[1]).length;R.hof.push({pid:p.id,n:p.n,pos:p.pos,apps:R.ap[p.id]||0,g:R.gl[p.id]||0,from:y[0],to:y[1],tro,ind:G.year});
     msg('press',`${surname(p.n).toUpperCase()} JOINS THE GREATS`,`${p.n} has been inducted into the ${club(U()).n} Hall of Fame after ${plu(R.ap[p.id]||0,'appearance')} and ${plu(R.gl[p.id]||0,'goal')}.`,null,U());}
   m.act.done=true;m.act.res='Inducted into the Hall of Fame';save();render();},
 contract(d){const u=G.user;const k=u.contract;UI.clubSec='contract';if(daysBetween(u.lastCon||'1900-01-01',G.date)<60){UI.clubNote='The chairman says you discussed terms only recently. Come back in a month or two.';render();return;}u.lastCon=G.date;
   if(u.conf<60){bumpConf(-1);UI.clubNote=`${chairOf(U()).n}: "${chairSay('conNo')}"`;render();return;}
   if(d.k==='money'){if(rand()<u.conf/110){const old=k.wage;k.wage=Math.round(k.wage*rf(1.1,1.25));UI.clubNote=`${chairOf(U()).n}: "${chairSay('conYes')}" Your salary rises from £${old} to £${k.wage} a week.`;}else{bumpConf(-1);UI.clubNote='The chairman says the club cannot stretch to it this year.';}}
   else{if(k.until>=G.year+4){UI.clubNote='You already have as long a contract as this board will give anyone.';}else if(rand()<u.conf/100){k.until=Math.min(G.year+4,k.until+(u.conf>=80?2:1));UI.clubNote=`Done. Your contract now runs until the end of ${seasonLbl(k.until)}.`;}else{UI.clubNote='The board would rather wait and see how the season goes.';}}
   save();render();},
 saveNow(){save();saveQ.then(()=>{UI.note=saveFail?'Could not save. See the warning at the top.':'Saved.';render();});},
 export(){let json;try{json=JSON.stringify(G,slim);}catch(e){UI.exportCode='';UI.note='Could not create a save code.';render();return;}
   (GZ?pack(json):Promise.resolve(btoa(unescape(encodeURIComponent(json))))).then(c=>{UI.exportCode=c;render();},()=>{UI.exportCode='';UI.note='Could not create a save code.';render();});},
 copy(){const t=$('#exp-code');if(!t)return;const done=()=>{UI.note='Copied.';render();};try{navigator.clipboard.writeText(t.value).then(done,()=>{t.select();});}catch(e){t.select();}},
 import(){const t=UI.importText.trim();(t.startsWith('gz:')?unpack(t):Promise.resolve().then(()=>JSON.parse(decodeURIComponent(escape(atob(t))))))
   .then(s=>{if(!s||!s.user||!s.clubs)throw 0;G=s;SQ=null;ensureState();UI.importText='';UI.note='Career loaded.';UI.screen='game';UI.tab='inbox';save();render();})
   .catch(()=>{UI.note='That code did not work. Check you copied all of it.';render();});},
 toTitle(){UI.screen='title';UI.live=null;UI.press=null;UI.paper=null;UI.notice=null;render();}
};
Object.assign(ACT,TAC_ACT);Object.assign(ACT,NEG_ACT);Object.assign(ACT,MKT_ACT);{const t0=ACT.tab;ACT.tab=d=>{if(d.k==='transfers'&&!(UI.screen==='game'&&UI.tab==='transfers')&&pendingBids().length)UI.tf.mode='offers';t0(d);};}
const CHG={
 hist(v,d,el){UI.start.hist=el.checked;},
 simauto(v,d,el){UI.simAuto=el.checked;},
 mentor(v,d){const p=G.players[+d.id];if(!p||p.c!==U()||!p.acad)return;if(v)p.mentor=+v;else delete p.mentor;save();render();},
 simstop(v,d,el){G.settings=G.settings||{};G.settings.simStop=!!el.checked;save();},
 syear(v){UI.start.year=+v;render();},
 papers(v,d,el){G.settings.papers=el.checked;save();},
 form(v){if(!v||formLock(v)){render();return;}setForm(v);G.user.formSet=true;render();},
 split(v,d,el){const r=splitPreview(+v,el);G.user.budget.transfer=r.transfer;G.user.budget.wage=r.wage;save();render();},
 ltac(v,d){const m=UI.live.m;const s=m.sides[m.us];s.tac[d.k]=+v;s.str=strength(s);},
 rdate(v){UI.resDateView=v;render();},
 tfpos(v){UI.tf.pos=v;$('#tf-res').innerHTML=tfResults();},
 tfdiv(v){UI.tf.div=v;$('#tf-res').innerHTML=tfResults();},
 tfage(v){UI.tf.age=v;$('#tf-res').innerHTML=tfResults();},
 tffee(v){UI.tf.fee=v;$('#tf-res').innerHTML=tfResults();}
};
function splitPreview(v,el){const mx=splitMax();let pct=v/100;if(pct>mx){pct=mx;el.value=Math.floor(mx*100);}const r=splitCalc(pct);const w=$('#sp-w'),t=$('#sp-t');if(w)w.textContent=money(r.wage);if(t)t.textContent=money(r.transfer);el.style.setProperty('--val',(pct*100)+'%');return r;}
const INP={split(v,d,el){splitPreview(+v,el);},mname(v){UI.start.name=v;},tfq(v){UI.tf.q=v;$('#tf-res').innerHTML=tfResults();},imp(v){UI.importText=v;}};

function boot(start){
  document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t||t.disabled)return;const fn=ACT[t.dataset.a];if(fn){e.preventDefault();fn(t.dataset,t);}});
  Object.assign(CHG,TAC_CHG);
  document.addEventListener('change',e=>{const t=e.target.closest('[data-c]');if(!t)return;const fn=CHG[t.dataset.c];if(fn)fn(t.value,t.dataset,t);});
  document.addEventListener('input',e=>{const t=e.target.closest('[data-in]');if(!t)return;const fn=INP[t.dataset.in];if(fn)fn(t.value,t.dataset,t);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(UI.confirmNew){UI.confirmNew=false;render();}else if(UI.modal){UI.modal=null;renderModal();}else if(UI.notice){UI.notice=null;render();}else if(UI.paper){UI.paper=null;renderOverlay();}}});
  if(start&&start.G){G=start.G;SQ=null;ensureState();Object.assign(UI,start.UI||{});if(UI.screen==='live'){UI.screen='prematch';UI.live=null;}}
  render();
}
const hot=window.claude&&window.claude.hot;
if(hot&&hot.snapshot)hot.snapshot(()=>({G,UI:{screen:UI.screen==='live'?'prematch':UI.screen,tab:UI.tab,div:UI.div}}));
window.BG_ENGINE={valueOf,achTest:{achScan,achSeason,achPearsey,achGive,ACHIEVEMENTS,dailyTick:d=>dailyTick(d)},reviewData:(s,T)=>reviewData(s,T),picSVG2:k=>picSVG2(k),bidHTML:N=>bidHTML(N),simStart:t=>simStart(t),meetArt:(k,c)=>meetArt(k,c),grouseLine:()=>grouseLine(),ddHTML:()=>ddHTML(),standing:p=>standing(p),moodCalc:p=>moodCalc(p),wageRatio:p=>wageRatio(p),simSeason,handover,startLater,art:{playerArt,letterHTML,cupBanner,dealHTML,talkHTML,TALKS,trophyPaper,chairPaper,vClub,chairSay,supporterArt,chairLook,FANLOOKS,pressHTML,paperHTML,LOOKS,portrait,kitSVG,stadiumSVG,REPORTERS,picSVG,PICS,bpSVG,trophySVG,TROPHY_DEFS},ACT,newGame:(c,n,h)=>newGame(c,n,h),get G(){return G;},cont,playDay,table,endSeason,dailyTick,addDays,nextDate,scorers,UI,nextRepTest:()=>nextRep(),tacTest:{departures,acadMonth,ycTick,msg,formsCall,CHG,transfer,mktSack,mktChance,setClub,tacWeekly,advice,euDraw,euStart:y=>euStart(y),chairPaper,chairOf:c=>chairOf(c),bpSVG,autoSetup,tacMissing,mStep,doShout,endLive,firstLeg,aggHTML,newMatch,runToEnd,strength,condOf,bestXI,validateUserXI,setForm,traitsOf,hasT,slotRoles,buildAn,anNotes,chalkHTML,dossierHTML,advice}};
if(typeof document!=='undefined'&&document.getElementById){if(hot&&hot.ready)hot.ready(boot);else boot(hot&&hot.data?hot.data:null);}
})();
