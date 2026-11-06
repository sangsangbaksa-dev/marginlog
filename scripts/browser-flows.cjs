const assert=require('node:assert/strict'),fs=require('node:fs'),C=require('../app/core.js');
module.exports=async(page,base)=>{
 const c={id:'c',name:'Case',kind:'noise',quiet:[22,7],entries:[],steps:[]};
 for(const [i,at] of ['2026-11-01T08:00','2026-11-02T09:00'].entries()) c.entries.push(await C.seal(c.entries.at(-1)?.hash||'',{id:'e'+i,type:'event',at,rec:Date.now(),text:i?'Other record':'서울 소음 기록'}));
 await page.addInitScript(c=>localStorage.setItem('marginlog:v1',JSON.stringify({v:1,lang:'en',cur:'c',cases:[c]})),c);
 await page.route('**/api/license',r=>r.fulfill({json:{configured:false}}));
 await page.goto(base+'/app/'); await page.fill('#ffrom','2026-11-01'); await page.fill('#fto','2026-11-01');
 assert.equal(await page.locator('.entry').count(),1);
 await page.fill('#fq','서울'); assert.equal(await page.locator('.entry').count(),1);
 const [dl]=await Promise.all([page.waitForEvent('download'),page.click('[data-act="dlfiltered"]')]);
 const text=fs.readFileSync(await dl.path(),'utf8');assert.ok(text.includes('서울 소음 기록'));assert.ok(!text.includes('Other record'));
 await page.click('.filter-actions [data-act="clearf"]');assert.equal(await page.locator('.entry').count(),2);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage['marginlog:v1']).cases[0].entries.length),2);
};
