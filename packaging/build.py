from pathlib import Path
import base64, json

ROOT=Path(__file__).resolve().parents[1]
template=(ROOT/'src/index.html').read_text()
out=template.replace('<!-- INLINE_STYLE -->','<style>\n'+(ROOT/'src/style.css').read_text()+'\n'+(ROOT/'src/analytics.css').read_text()+'\n'+(ROOT/'src/admin.css').read_text()+'\n'+(ROOT/'src/brand.css').read_text()+'\n'+(ROOT/'src/survey-stats.css').read_text()+'\n</style>')
for key,filename in [('DATA','data.js'),('SCORING','scoring.js'),('CHARTS','charts.js'),('ANALYTICS','analytics.js'),('ORGANIZATIONS','organizations.js'),('SUPABASE','supabase.js'),('ADMIN','admin.js'),('STUDENT_REFERENCE','student-reference.js'),('WARMUP','warmup.js'),('APP','app.js')]:
    script=(ROOT/'src'/filename).read_text().replace('</script','<\\/script')
    out=out.replace(f'<!-- INLINE_{key} -->','<script>\n'+script+'\n</script>')
single=out
for name in ['hero','discovery','banner','logo','icon']:
    data=base64.b64encode((ROOT/f'dist/assets/{name}.webp').read_bytes()).decode()
    single=single.replace(f'assets/{name}.webp',f'data:image/webp;base64,{data}')
(ROOT/'dist/index.html').write_text(out)
(ROOT/'dist/ChonNghe.html').write_text(single)
(ROOT/'dist/quantriweb').mkdir(exist_ok=True)
(ROOT/'dist/quantriweb/index.html').write_text(out)
(ROOT/'dist/.app-version').write_text('1.3.2\n')
print('Built v1.3.2: public site, /quantriweb and standalone ChonNghe.html')
