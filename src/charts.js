(function(root){
  'use strict';
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const integer=n=>Number(n||0).toLocaleString('vi-VN');
  const colors={teal:'#0F766E',navy:'#183153',mint:'#52A69A',light:'#B7DDD4',grid:'#E2E8F0',text:'#475569'};
  function funnel(stages){
    const max=Math.max(...stages.map(x=>x.count),0);
    if(!max)return '<div class="chart-empty">Chưa có phiên truy cập trong khoảng này.</div>';
    const width=n=>300*n/max;
    let bands='';
    stages.forEach((stage,i)=>{
      const top=width(stage.count),bottom=i<stages.length-1?width(stages[i+1].count):0;
      const y=20+i*57;
      if(top>0)bands+=`<path d="M${180-top/2},${y} L${180+top/2},${y} L${180+bottom/2},${y+53} L${180-bottom/2},${y+53} Z" fill="${[colors.teal,colors.mint,'#2F6B80',colors.navy][i]}"/>`;
    });
    return `<div class="funnel-layout"><svg viewBox="0 0 360 255" role="img" aria-label="Biểu đồ hình nón, phễu theo số phiên: ${escape(stages.map(x=>x.label+' '+x.count).join('; '))}">${bands}</svg><ol class="funnel-legend">${stages.map((x,i)=>`<li><span class="legend-dot" style="background:${[colors.teal,colors.mint,'#2F6B80',colors.navy][i]}"></span><span>${escape(x.label)}<strong>${integer(x.count)} <small>phiên</small></strong></span></li>`).join('')}</ol></div>`;
  }
  function daily(days){
    if(!days.some(d=>d.visits||d.completed))return '<div class="chart-empty">Chưa có dữ liệu theo ngày.</div>';
    const width=Math.max(560,days.length*52),height=260,pad={left:43,right:15,top:22,bottom:36},usable=height-pad.top-pad.bottom;
    const max=Math.max(...days.flatMap(d=>[d.visits,d.completed]),1),top=Math.max(1,Math.ceil(max/4)*4),step=(width-pad.left-pad.right)/days.length;
    let svg='';
    for(let i=0;i<=4;i++){const y=pad.top+usable-usable*i/4;svg+=`<line x1="${pad.left}" x2="${width-pad.right}" y1="${y}" y2="${y}" stroke="${colors.grid}"/><text x="${pad.left-9}" y="${y+4}" text-anchor="end" fill="${colors.text}" font-size="11">${integer(top*i/4)}</text>`;}
    days.forEach((d,i)=>{const x=pad.left+i*step+step/2,w=Math.min(13,step*.24);for(const [key,offset,color,label] of [['visits',-w-2,colors.teal,'Phiên truy cập'],['completed',2,colors.navy,'Phiên gửi bài']]){const h=usable*d[key]/top;svg+=`<rect x="${x+offset}" y="${pad.top+usable-h}" width="${w}" height="${h}" rx="2" fill="${color}"><title>${escape(label+' '+d.date+': '+integer(d[key]))}</title></rect>`;}const bits=d.date.split('-');svg+=`<text x="${x}" y="${height-12}" text-anchor="middle" fill="${colors.text}" font-size="11">${bits[2]}/${bits[1]}</text>`;});
    return `<div class="chart-key"><span><i style="background:${colors.teal}"></i>Phiên truy cập</span><span><i style="background:${colors.navy}"></i>Phiên gửi bài</span></div><div class="chart-scroll" tabindex="0" aria-label="Biểu đồ theo ngày, cuộn ngang nếu cần"><svg width="${width}" height="${height}" style="width:100%;min-width:${Math.max(330,days.length*36)}px;height:auto" viewBox="0 0 ${width} ${height}" role="img" aria-label="Biểu đồ cột truy cập và hoàn thành bài theo ngày">${svg}</svg></div><details class="chart-data"><summary>Xem bảng số liệu</summary><table><thead><tr><th>Ngày</th><th>Truy cập</th><th>Gửi bài</th></tr></thead><tbody>${days.map(d=>`<tr><td>${d.date}</td><td>${integer(d.visits)}</td><td>${integer(d.completed)}</td></tr>`).join('')}</tbody></table></details>`;
  }
  function ranked(rows,metric){
    const sorted=rows.filter(r=>r[metric]>0).sort((a,b)=>b[metric]-a[metric]||a.name.localeCompare(b.name,'vi')).slice(0,10);
    if(!sorted.length)return '<div class="chart-empty">Chưa có dữ liệu cho tiêu chí này. Hãy chọn tiêu chí hoặc khoảng ngày khác.</div>';
    const max=sorted[0][metric];let prior=null,rank=0;
    return `<div class="ranked-bars">${sorted.map(row=>{if(prior!==row[metric]){rank++;prior=row[metric];}return `<div class="ranked-row"><span class="rank-number">${rank}</span><div><div class="ranked-label"><strong>${escape(row.name)}</strong><b>${integer(row[metric])}</b></div><div class="ranked-track"><span style="width:${row[metric]/max*100}%"></span></div><p class="ranked-meta">${integer(row.views)} phiên mở chi tiết · ${integer(row.priority1)} bài ưu tiên 1 · ${integer(row.top3)} bài có trong top 3</p></div></div>`;}).join('')}</div>`;
  }
  function flow(){return `<div class="method-flow"><svg viewBox="0 0 660 335" role="img" aria-label="Sơ đồ: 30 câu hỏi chia thành 18 câu sở thích, 6 câu năng lực và 6 câu giá trị; đối chiếu với hồ sơ ngành theo trọng số 50%, 25%, 25%; tạo ba ngành ưu tiên khám phá"><g fill="none" stroke="#94BDB6" stroke-width="2"><path d="M330 62V82H115V103M330 82V103M330 82H545V103M115 158V184H330V207M330 158V207M545 158V184H330M330 257V282"/></g><rect x="230" y="12" width="200" height="50" rx="10" fill="#183153"/><text x="330" y="43" text-anchor="middle" fill="white" font-size="18">30 câu trắc nghiệm</text>${[[20,'18 câu sở thích','50%'],[235,'6 câu năng lực','25%'],[450,'6 câu giá trị','25%']].map(([x,label,weight])=>`<rect x="${x}" y="103" width="190" height="55" rx="10" fill="#E6F4F1" stroke="#0F766E"/><text x="${Number(x)+95}" y="128" text-anchor="middle" fill="#183153" font-size="16">${label}</text><text x="${Number(x)+95}" y="147" text-anchor="middle" fill="#0F766E" font-size="13">Trọng số ${weight}</text>`).join('')}<rect x="210" y="207" width="240" height="50" rx="10" fill="#F8FAFC" stroke="#64748B"/><text x="330" y="238" text-anchor="middle" fill="#183153" font-size="17">Đối chiếu hồ sơ ngành</text><rect x="205" y="282" width="250" height="44" rx="10" fill="#0F766E"/><text x="330" y="310" text-anchor="middle" fill="white" font-size="17">Ba ngành ưu tiên khám phá</text></svg><p class="small muted">Sơ đồ minh họa phương pháp. Thiếu dữ liệu hoặc đồng hạng được xử lý riêng; trọng số chưa được kiểm định.</p></div>`;}
  const api={funnel,daily,ranked,flow,escape,integer};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CareerCharts=api;
})(typeof globalThis!=='undefined'?globalThis:this);

