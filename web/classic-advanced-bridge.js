Object.assign(Classic.code, ClassicAdvanced.code);
for (const [name, value] of Object.entries(ClassicAdvanced)) if (name !== 'code') Classic[name] = value;
Object.assign(Classic.code, ClassicExtra.code);
for (const [name, value] of Object.entries(ClassicExtra)) if (name !== 'code') Classic[name] = value;
Object.assign(Classic.code, ClassicRange.code);
for (const [name, value] of Object.entries(ClassicRange)) if (name !== 'code') Classic[name] = value;
Object.assign(Classic.code, ClassicMath.code);
for (const [name, value] of Object.entries(ClassicMath)) if (name !== 'code') Classic[name] = value;
Object.assign(Classic.code, ClassicGraph2.code);
for (const [name, value] of Object.entries(ClassicGraph2)) if (name !== 'code') Classic[name] = value;
Object.assign(Classic.code, ClassicTreesDP.code);
for (const [name, value] of Object.entries(ClassicTreesDP)) if (name !== 'code') Classic[name] = value;
Object.assign(Classic.code, ClassicMisc.code);
for (const [name, value] of Object.entries(ClassicMisc)) if (name !== 'code') Classic[name] = value;
Object.assign(Classic.code, ClassicFlow.code);
for (const [name, value] of Object.entries(ClassicFlow)) if (name !== 'code') Classic[name] = value;
Object.assign(Classic.code, ClassicStrings.code);
for (const [name, value] of Object.entries(ClassicStrings)) if (name !== 'code') Classic[name] = value;

Object.assign(Classic.code, ClassicDPBatch.code);
for (const [name, value] of Object.entries(ClassicDPBatch)) if (name !== 'code') Classic[name] = value;

Object.assign(Classic.code, ClassicGreedy.code);
for (const [name, value] of Object.entries(ClassicGreedy)) if (name !== 'code') Classic[name] = value;
