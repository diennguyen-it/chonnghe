const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../src/data.js'),W=require('../src/warmup.js'),A=require('../src/admissions.js');
const answer={interests:[0],hot:2,abilities:[4],parents:[2]};
test('Bốn gợi ý đại diện cho bốn nhóm; điểm nhóm giữ đúng hồ sơ cao nhất',()=>{
  const rows=W.groups(answer,D),rank=W.rank(answer,D);
  assert.equal(rows.length,11);
  assert.equal(new Set(rows.slice(0,4).map(r=>r.group.id)).size,4);
  for(const row of rows)assert.equal(row.total,Math.max(...rank.filter(r=>r.major.group===row.group.id).map(r=>r.total)));
  assert.ok(W.groups({},D).length===0);
});
test('Đấu trường có hai bán kết và chung kết; chỉ ứng viên trong cặp được giữ',()=>{
  const ids=['a','b','c','d'];
  assert.deepEqual(W.arenaPair(ids),['a','d']);
  assert.deepEqual(W.arenaPair(ids,['d']),['b','c']);
  assert.deepEqual(W.arenaPair(ids,['d','b']),['d','b']);
  assert.deepEqual(W.arenaPair(ids,['d','b','d']),[]);
  assert.deepEqual(W.validPicks(ids,['d','b','d']),['d','b','d']);
  assert.deepEqual(W.validPicks(ids,['d','b','c']),['d','b']);
  assert.deepEqual(W.validPicks(ids,['b','c','b']),[]);
  assert.deepEqual(W.arenaPair(['a','a','c','d']),[]);
});
test('Bộ lọc dùng đúng hồ sơ trường-ngành-năm, không lan tổ hợp sang ngành cùng nhóm',()=>{
  assert.equal(A.matches('m001','A00'),true);
  assert.equal(A.matches('m001','B00'),false);
  assert.equal(A.matches('m012','D01'),false);
  assert.equal(A.matches('m012',''),true);
  assert.equal(A.matches('m059','B00'),true);
  assert.equal(A.records('m001')[0].school,'Trường Đại học Vinh');
  for(const row of A.rows){assert.ok(D.majors.some(m=>m.id===row.majorId));assert.equal(row.year,2026);assert.match(row.url,/^https:\/\/(hust\.edu\.vn|tuyensinh\.vinhuni\.edu\.vn)\//);assert.ok(row.programCode&&row.codes.length);}
});
