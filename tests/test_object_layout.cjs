const assert=require('node:assert/strict');
const {layout,fields}=require('../web/object-layout.js');
const ref=target=>({kind:'reference',target});
const node=(id,fields={})=>({id,fields});
const tree=layout([node('leaf'),node('root',{a:ref('left'),b:ref('leaf')}),node('left')]);
assert(tree.positions.get('root').y<tree.positions.get('leaf').y);
assert.equal(tree.positions.get('leaf').y,tree.positions.get('left').y);
assert.equal(tree.edges.length,2);
const cycle=layout([node('x',{links:[ref('y')]}),node('y',{back:ref('x')}),node('alone')]);
assert.equal(cycle.positions.size,3);assert.equal(cycle.edges.length,2);
assert.equal(new Set([...cycle.positions.values()].map(p=>`${p.x},${p.y}`)).size,3);
const tall=layout([node('a',Object.fromEntries(Array.from({length:30},(_,i)=>[i,i]))),node('b',{to:ref('a')})]);
assert(tall.height>tall.positions.get('a').y+tall.positions.get('a').height);
assert.deepEqual(fields({children:[ref('x')]}).map(([key])=>key),['children[0]']);
console.log('Topology layout: tree, cycles, disconnected nodes, nested references and bounds passed');

const compact=require('../web/object-layout.js').displayFields({fields:{zero:0,links:[0,0,0,0,0,0]},nullFields:Array.from({length:6},(_,i)=>`links[${i}]`)});
assert.deepEqual(compact,[['zero',0],['其余空引用',6]]);

assert.equal(require('../web/object-layout.js').displayFields({fields:{links:[0,0,0,0,0]},nullFields:['links[0]','links[1]','links[2]','links[3]','links[4]']},false).length,5);

const wide=layout([node('a',{very_long_payload_field_name:1234567890123456789}),node('b',{short:1})]);
const a=wide.positions.get('a'),b=wide.positions.get('b');assert(a.width>205);assert(a.x+a.width<b.x);assert(b.x+b.width<wide.width);

const {fieldText}=require('../web/object-layout.js');
assert.equal(fieldText('alias',{kind:'reference',target:'old',offset:2,dangling:true}),'alias: 悬空 → old [偏移 2]');
const danglingLayout=layout([node('owner',{next:{kind:'reference',target:'old',dangling:true}}),{id:'old',fields:{value:3},freed:true}]);
assert.equal(danglingLayout.edges[0].dangling,true);
assert.equal(layout([node('owner',{next:ref('live')}),node('live')]).edges[0].dangling,false);
console.log('Topology layout: dangling reference status and offsets passed');

assert.equal(fieldText('p',{kind:'reference',target:'node',member:'value'}),'p: → node.value');
assert.equal(layout([node('r',{p:{kind:'reference',target:'n',member:'value'}}),node('n')]).edges[0].targetMember,'value');

const {accessed}=require('../web/object-layout.js');
assert.equal(accessed([{objects:['record1','record2']}],'record2'),true);
assert.equal(accessed([{object:'record1'}],'record1'),true);
assert.equal(accessed([{objects:['record1']}],'unrelated'),false);

const {visibleObjects}=require('../web/object-layout.js');
const lifecycle=[node('live',{next:{kind:'reference',target:'dangling',dangling:true}}),{...node('dangling'),freed:true},{...node('old'),expired:true}];
assert.deepEqual(visibleObjects(lifecycle,{},true).map(o=>o.id),['live','dangling']);
assert.deepEqual(visibleObjects(lifecycle,{alias:{kind:'reference',target:'old'}},true).map(o=>o.id),['live','dangling','old']);
assert.equal(visibleObjects(lifecycle,{},false).length,3);
assert.deepEqual(visibleObjects([{...node('old'),freed:true}],{},true),[]);
