const assert=require('node:assert/strict');const {arrayRows,previousElements}=require('../web/state-view.js');
assert.deepEqual(arrayRows({q:{data:[3,4]},matrix:[[1,2],[3,4]]}).map(([name])=>name),['q.data','matrix[0]','matrix[1]']);
const previous={variables:{owner:{values:[3,4,5]}},arrays:{'owner.values':{id:'A',offset:0}}};
const current={variables:{parameter:{kind:'reference',elements:[4,5]}},arrays:{parameter:{id:'A',offset:1}}};
const before=previousElements(current,previous);assert.equal(before('parameter',0),4);assert.equal(before('parameter',1),5);
assert.equal(previousElements({arrays:{parameter:{id:'B',offset:1}}},previous)('parameter',0),undefined);
console.log('State view: nested paths, renamed aliases, offsets and distinct arrays passed');

const {differences}=require('../web/state-view.js');
assert.deepEqual(differences({variables:{q:{values:[2,8]}}},{variables:{q:{values:[2,4]}}}).changes,[{path:'q.values[1]',before:4,after:8}]);
assert.equal(differences({stack:['main','f'],variables:{argument:3}},{stack:['main'],variables:{local:7}}).changes.length,0);
const freed=differences({objects:[{id:'n',fields:{next:0},freed:true}]},{objects:[{id:'n',fields:{next:0}}]});assert.equal(freed.changes[0].after,'已释放');
assert.equal(differences({variables:{a:Array(100).fill(1)}},{variables:{a:Array(100).fill(0)}},3).truncated,true);

const {nextSourceStep}=require('../web/state-view.js');
const trace=[{line:2,stack:['main']},{line:2,stack:['main']},{line:8,stack:['main','f']},{line:9,stack:['main','f']},{line:2,stack:['main']},{line:3,stack:['main']},{line:3,stack:[],event:'complete'}];
assert.equal(nextSourceStep(trace,0),5);assert.equal(nextSourceStep(trace,2,true),4);assert.equal(nextSourceStep(trace,0,true),6);
assert.equal(nextSourceStep([{line:1,stack:['main']},{line:1,stack:['main'],event:'error'}],0),1);

const {matrices}=require('../web/state-view.js');assert.deepEqual(matrices({object:{grid:[[1,2],[3,4]]},ragged:[[1],[2,3]],plain:[1,2]}).map(([name])=>name),['object.grid']);

assert.equal(differences({objects:[{id:'a',fields:{p:{kind:'reference',target:'b',offset:0,dangling:false}}}]},{objects:[{id:'a',fields:{p:{kind:'reference',target:'b',offset:0,dangling:0}}}]}).changes.length,0);

const {variables}=require('../web/state-view.js');
const structured={node:{value:7,items:[2,4],grid:[[1,2],[3,4]],next:{kind:'reference',target:'other'}}};
assert.deepEqual(variables({variables:structured}),structured);
assert.deepEqual(arrayRows(variables({variables:structured})).map(([name])=>name),['node.items','node.grid[0]','node.grid[1]']);
assert.deepEqual(matrices(variables({variables:structured})).map(([name])=>name),['node.grid']);
assert.deepEqual(variables({variables:[{name:'node',value:structured.node}]}),structured);
assert.deepEqual(differences({variables:[{name:'n',value:2}]},{variables:[{name:'n',value:1}]}).changes,[{path:'n',before:1,after:2}]);
assert.equal(previousElements({arrays:{alias:{id:'L',offset:0}}},{variables:[{name:'data',value:[6]}],arrays:{data:{id:'L',offset:0}}})('alias',0),6);
console.log('State view: value-named struct fields and legacy records passed');

const {indexMarkers}=require('../web/state-view.js');
const marked={variables:{i:0,cursor:2},arrays:{data:{id:'X',offset:0},tail:{id:'X',offset:2}},reads:[{name:'data',array:'X',index:2,index_expression:'cursor'},{name:'data',array:'X',index:3,index_expression:'cursor + 1'},{name:'other',array:'Y',index:2,index_expression:'unrelated'}],writes:[{name:'data',array:'X',index:2,index_expression:'cursor'}]};
assert.deepEqual(indexMarkers(marked,'data',2),['cursor']);
assert.deepEqual(indexMarkers(marked,'tail',0),['cursor']);
assert.deepEqual(indexMarkers(marked,'data',3),['cursor + 1']);
assert.deepEqual(indexMarkers(marked,'data',0),[]);
assert.deepEqual(indexMarkers({reads:[{name:'grid[1]',index:2,index_expression:'column'}]},'grid[1]',2),['column']);
console.log('State view: source-based index markers, expressions and aliases passed');

const {arrayWindow}=require('../web/state-view.js');
assert.deepEqual(arrayWindow({writes:[{name:'a',index:95}]},'a',100),{page:1,pages:2,start:60,end:100});
assert.equal(arrayWindow({reads:[{name:'other',index:95}]},'a',100).start,0);
assert.equal(arrayWindow({arrays:{tail:{id:'A',offset:80}},writes:[{array:'A',index:145}]},'tail',100).start,60);
assert.equal(arrayWindow({writes:[{name:'a',index:95}]},'a',100,0).start,0);
assert.equal(arrayWindow({},'a',100,999).page,1);
assert.equal(arrayWindow({},'a',0).end,0);
console.log('State view: large-array access focus, alias offsets and manual pages passed');

const {matrixWindow}=require('../web/state-view.js');
const largeGrid=Array.from({length:40},()=>Array(45).fill(0));
assert.deepEqual(matrixWindow({arrays:{'g[35]':{id:'R',offset:0}},writes:[{array:'R',index:42}]},'g',largeGrid),{row:1,column:1,rowPages:2,columnPages:2,rowStart:30,rowEnd:40,columnStart:30,columnEnd:45});
assert.equal(matrixWindow({reads:[{name:'g[32]',index:40}]},'g',largeGrid).column,1);
assert.equal(matrixWindow({},'g',largeGrid,{row:99,column:-1}).row,1);

assert.equal(differences({variables:{p:{kind:'reference',target:'n',member:'other'}}},{variables:{p:{kind:'reference',target:'n',member:'value'}}}).changes.length,1);

const {integerBits}=require('../web/state-view.js');
assert.equal(integerBits(-1,8).binary,'11111111');
assert.equal(integerBits('18446744073709551615',64).hex,'ffffffffffffffff');
assert.equal(integerBits(0,32).binary.length,32);
assert.equal(integerBits({kind:'reference'},32),null);

const {integerEntries}=require('../web/state-view.js');
const bitEntries=integerEntries({variables:{node:{flags:3,masks:[7,null,9]},alias:{kind:'reference',elements:[9]}},integers:{'node.flags':{bits:16,unsigned:true},'node.masks':{bits:32,unsigned:true},alias:{bits:32,unsigned:true}}});
assert.deepEqual(Object.keys(bitEntries),['node.flags','node.masks[0]','node.masks[2]','alias[0]']);
assert.equal(bitEntries['alias[0]'].value,9);

const objectBits=integerEntries({objects:[{id:'heap',fields:{flags:'9223372036854775808'},integers:{'heap.flags':{bits:64,unsigned:true}}},{id:'freed',fields:{value:7},freed:true,integers:{'freed.value':{bits:32,unsigned:false}}}]});
assert.deepEqual(Object.keys(objectBits),['heap.flags']);
assert.equal(integerBits(objectBits['heap.flags'].value,64).hex,'8000000000000000');
assert.deepEqual(Object.keys(integerEntries({objects:[{id:'array',array:true,fields:{'0':7},integers:{array:{bits:32,unsigned:true}}}]})),['array[0]']);

const {integerBitChanges}=require('../web/state-view.js');
const bitsStep=value=>({variables:{mask:value},integers:{mask:{bits:8,unsigned:true}},stack:['main']});
assert.deepEqual(integerBitChanges(bitsStep(8),bitsStep(0),'mask'),[{index:4,position:3,before:'0',after:'1'}]);
assert.deepEqual(integerBitChanges(bitsStep(8),bitsStep(8),'mask'),[]);
assert.equal(integerBitChanges({...bitsStep(8),stack:['main','f']},bitsStep(0),'mask'),null);
assert.deepEqual(integerEntries({variables:{p:{kind:'reference',dangling:true,elements:[7]}},integers:{p:{bits:32,unsigned:false}}}),{});

const {arrayKind}=require('../web/state-view.js');
assert.equal(arrayKind({arrays:{slots:{element_kind:'reference'}}},'slots',[0,0]),'reference');
assert.equal(arrayKind({},'zeros',[0,0]),'value');
assert.equal(matrices({links:[[0,{kind:'reference',target:'n'}],[0,0]]}).length,1);

const {nextBreakpoint}=require('../web/state-view.js');
const breakTrace=[{line:2,stack:['main']},{line:2,stack:['main']},{line:3,stack:['main']},{line:2,stack:['main']},{line:2,stack:['main','f']},{line:9,event:'complete'}];
assert.equal(nextBreakpoint(breakTrace,0,[2]),3);
assert.equal(nextBreakpoint(breakTrace,3,[2]),4);
assert.equal(nextBreakpoint(breakTrace,0,[]),5);
assert.equal(nextBreakpoint([{line:1},{line:2,event:'error'},{line:3}],0,[3]),1);

const {watchEntries,nextValueChange}=require('../web/state-view.js');
assert.equal(watchEntries({variables:{n:{items:[3,4]}}})['n.items[1]'],4);
const valueTrace=[{stack:['main'],variables:{n:1}},{stack:['main','f'],variables:{n:99}},{stack:['main'],variables:{n:1}},{stack:['main'],variables:{n:2}}];
assert.equal(nextValueChange(valueTrace,0,'n'),3);
assert.equal(nextValueChange(valueTrace,3,'n'),-1);
const aliasTrace=[{variables:{p:{kind:'reference',label:'a',offset:0}},arrays:{p:{id:'A'}}},{variables:{p:{kind:'reference',label:'alias',offset:0}},arrays:{p:{id:'A'}}}];
assert.equal(nextValueChange(aliasTrace,0,'p'),-1);
assert.equal(nextValueChange([{objects:[{id:'object-1',fields:{value:7}}]},{objects:[{id:'object-1',fields:{value:7},freed:true}]}],0,'object-1.value'),1);

assert.equal(nextValueChange([{stack:['f'],frames:[{id:1}],variables:{n:1}},{stack:['f'],frames:[{id:2}],variables:{n:2}}],0,'n'),-1);

const shadowTrace=[{stack:['main'],bindings:{x:'outer'},variables:{x:1}},{stack:['main'],bindings:{x:'inner'},variables:{x:99}},{stack:['main'],bindings:{x:'outer'},variables:{x:1}},{stack:['main'],bindings:{x:'outer'},variables:{x:2}}];
assert.equal(nextValueChange(shadowTrace,0,'x'),3);
assert.equal(nextValueChange([{stack:['main'],bindings:{x:'global'},variables:{x:1}},{stack:['main','f'],bindings:{x:'global'},variables:{x:2}}],0,'x'),1);
assert.equal(nextValueChange([{stack:['f'],frames:[{id:1}],bindings:{x:'static'},variables:{x:1}},{stack:['f'],frames:[{id:2}],bindings:{x:'static'},variables:{x:2}}],0,'x'),1);

const matrixAlias={rows:{kind:'reference',elements:[[1,2],[3,4]]}};
assert.equal(matrices(matrixAlias)[0][0],'rows');
assert.deepEqual(arrayRows(matrixAlias).map(([name])=>name),['rows[0]','rows[1]']);
assert.equal(arrayRows({rows:{kind:'reference',elements:[{data:[7,8]}]}})[0][0],'rows[0].data');

const {variableChanged}=require('../web/state-view.js');
const beforeReference={variables:{rows:{kind:'reference',label:'matrix',offset:0,elements:[[0,0],[0,0]]}},arrays:{rows:{id:'matrix',offset:0}}};
const afterReference={variables:{rows:{kind:'reference',label:'matrix',offset:0,elements:[[0,0],[0,7]]}},arrays:{rows:{id:'matrix',offset:0}}};
assert.equal(variableChanged(afterReference,beforeReference,'rows'),false);
assert.deepEqual(differences(afterReference,beforeReference).changes.map(x=>x.path),['rows[1][1]']);
assert.equal(variableChanged({variables:{p:{kind:'reference',label:'alias',offset:0}},arrays:{p:{id:'A',offset:0}}},{variables:{p:{kind:'reference',label:'data',offset:0}},arrays:{p:{id:'A',offset:0}}},'p'),false);
assert.equal(variableChanged({...afterReference,variables:{rows:{...afterReference.variables.rows,offset:1}}},beforeReference,'rows'),true);
assert.equal(variableChanged({variables:{record:{pointer:afterReference.variables.rows}}},{variables:{record:{pointer:beforeReference.variables.rows}}},'record'),false);

assert.equal(variableChanged({...beforeReference,arrays:{rows:{id:'other',offset:0}}},beforeReference,'rows'),true);

const {conditionPresentation,branchEntered}=require('../web/state-view.js');
const assertionStep={event:'condition',line:3,result:0,decision:{assertion:true,passed:false,expression:'count < 3'}};
assert.equal(conditionPresentation(assertionStep).label,'断言检查');
assert.equal(conditionPresentation(assertionStep).outcome,'失败，停止执行');
assert.equal(conditionPresentation(assertionStep).note,'检查：count < 3');
assert.equal(branchEntered({...assertionStep,result:1,decision:{...assertionStep.decision,passed:true}},{line:4}),false);
const logicalStep={event:'condition',line:3,result:1,decision:{operator:'||',right_evaluated:false,skipped:'increment()'}};
assert.equal(conditionPresentation(logicalStep).note,'未执行：increment()');
assert.equal(conditionPresentation(logicalStep).outcome,'真');
assert.equal(branchEntered(logicalStep,{line:4}),false);
assert.equal(conditionPresentation({result:0,decision:{operator:'&&',right_evaluated:true}}).note,'右侧已执行');
assert.equal(conditionPresentation({result:1,decision:{selected:'a',skipped:'b'}}).note,'执行：a · 未执行：b');
assert.equal(branchEntered({event:'condition',line:3,result:1},{line:4}),true);
assert.equal(branchEntered({event:'condition',line:3,result:0},{line:4}),false);
assert.equal(branchEntered({event:'condition',line:3,result:1},{line:3}),false);

assert.equal(conditionPresentation({event:'condition',result:0,decision:{comparison:true,operator:'=='}}).label,'比较表达式');
assert.equal(conditionPresentation({event:'condition',result:0,decision:{comparison:true,operator:'=='}}).outcome,'假');
assert.equal(branchEntered({event:'condition',line:3,result:1,decision:{comparison:true,operator:'<'}},{line:4}),false);

const {character}=require('../web/state-view.js');
assert.equal(character(1),'\\x01 (1)');
assert.equal(character(255),'\\xff (255)');
assert.equal(character(-1),'\\xff (-1)');
assert.equal(character(65),'A (65)');
assert.equal(character(0),'\\0 (0)');
assert.equal(character(null),'未初始化');

const {byteAccessText}=require('../web/state-view.js');
assert.equal(byteAccessText({byte_offset:0,byte:0}),' · 字节偏移 0：0 (0x00)');
assert.equal(byteAccessText({byte_offset:3,byte:128}),' · 字节偏移 3：128 (0x80)');
assert.equal(byteAccessText({index:3,value:128}),'');
assert.equal(byteAccessText({byte_offset:1}),'');
