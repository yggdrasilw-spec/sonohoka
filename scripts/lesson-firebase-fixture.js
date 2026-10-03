/* Offline Firebase fixture for distribution URL connection tests. */
(() => {
  localStorage.setItem('raid_boss_student_name','テスト児童');
  window.fixtureWrites=[]; const values={};
  const session={sessionId:'lesson-test',status:'active',expiresAt:Date.now()+3600000};
  const boss={name:'テストボス',currentHp:100,maxHp:100};
  function value(path){
    if(Object.prototype.hasOwnProperty.call(values,path))return values[path];
    if(path==='.info/connected')return true;
    if(path==='.info/serverTimeOffset')return 0;
    if(path.startsWith('teacherCodes/'))return session;
    if(path==='teacherSessions/lesson-test/status')return 'active';
    if(path==='teacherSessions/lesson-test')return session;
    if(path.startsWith('rooms/'))return {boss,expiresAt:session.expiresAt};
    return null;
  }
  const snap=path=>({val:()=>value(path),exists:()=>value(path)!==null});
  function ref(path){return {key:path.split('/').pop(),child:key=>ref(path+'/'+key),once:()=>Promise.resolve(snap(path)),on:(event,cb)=>{cb(snap(path));return cb;},off:()=>{},set:data=>{values[path]=data;fixtureWrites.push([path,data]);return Promise.resolve();},update:data=>{values[path]=Object.assign({},value(path),data);fixtureWrites.push([path,data]);return Promise.resolve();},remove:()=>Promise.resolve(),onDisconnect:()=>({update:()=>Promise.resolve(),remove:()=>Promise.resolve(),cancel:()=>Promise.resolve()}),transaction:async cb=>{const hp=cb(boss.currentHp);if(hp!==undefined)boss.currentHp=hp;return {committed:hp!==undefined,snapshot:{val:()=>hp}};},push:data=>{fixtureWrites.push([path,data]);return Promise.resolve();}};}
  const db={ref};
  const auth={currentUser:{uid:'lesson-student'},signInAnonymously:()=>Promise.resolve({user:{uid:'lesson-student'}}),onAuthStateChanged:cb=>cb({uid:'lesson-student'})};
  const app={name:'[DEFAULT]',database:()=>db,auth:()=>auth};
  const database=()=>db;database.ServerValue={TIMESTAMP:Date.now()};
  window.firebase={apps:[app],app:()=>app,initializeApp:(config,name)=>{const a=Object.assign({},app,{name:name||'[DEFAULT]'});firebase.apps.push(a);return a;},database,auth:()=>auth};
})();
