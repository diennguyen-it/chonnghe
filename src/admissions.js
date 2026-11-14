/* Đối chiếu theo chương trình, trường và năm; không suy ra từ cả nhóm ngành. */
(function(root){
  'use strict';
  const sources={
    vinh:{school:'Trường Đại học Vinh',year:2026,checked:'2026-11-14',url:'https://tuyensinh.vinhuni.edu.vn/DATA/71/upload/1/documents/2026/06/dieuchinhthongtintuyensinh.pdf',title:'Thông báo điều chỉnh tuyển sinh 2026 (27/6/2026)'},
    hust:{school:'Đại học Bách khoa Hà Nội',year:2026,checked:'2026-11-14',url:'https://hust.edu.vn/uploads/sys/tuyen-sinh/2026_05/danh-muc-chuong-trinh-dao-tao-2026.pdf',title:'Danh mục chương trình và tổ hợp xét tuyển 2026'}
  };
  // Mỗi dòng giữ nguyên tên chương trình và mã xét tuyển của nguồn.
  const rows=[
    ['m001','vinh','7480201','Công nghệ thông tin',['A00','A01']],
    ['m009','vinh','7380101','Luật',['D01','C00']],
    ['m010','vinh','7220201','Ngôn ngữ Anh',['D01','D14']],
    ['m018','vinh','7580101','Kiến trúc',['V01','D01']],
    ['m019','vinh','7580201','Kỹ thuật xây dựng',['A01','D01']],
    ['m024','vinh','7340101','Quản trị kinh doanh',['D01','C01']],
    ['m025','vinh','7340122','Thương mại điện tử',['D01','C01']],
    ['m027','vinh','7340301','Kế toán',['D01','C01']],
    ['m029','vinh','7340201','Tài chính - Ngân hàng',['D01','C01']],
    ['m042','vinh','7760101','Công tác xã hội',['C00','D14']],
    ['m051','vinh','7640101','Thú y',['B03','C03']],
    ['m055','vinh','7620301','Nuôi trồng thuỷ sản',['C02','D01']],
    ['m059','vinh','7720301','Điều dưỡng',['B00','B03']],
    ['m070','vinh','7140201','Giáo dục Mầm non',['M00','M01']],
    ['m072','vinh','7140209','Sư phạm Toán học',['A00','A01']],
    ['m076','vinh','7140217','Sư phạm Ngữ văn',['C00','D14']],
    ['m004','hust','IT2','CNTT: Kỹ thuật Máy tính',['K01','A00','A01']],
    ['m005','hust','EE1','Kỹ thuật điện',['K01','A00','A01']],
    ['m006','hust','EE2','Kỹ thuật điều khiển & Tự động hóa',['K01','A00','A01']],
    ['m007','hust','ME2','Kỹ thuật Cơ khí',['K01','A00','A01']],
    ['m008','hust','TE1','Kỹ thuật Ô tô',['K01','A00','A01']],
    ['m031','hust','EM-E14','Logistics và Quản lý chuỗi cung ứng',['K01','A01','D01','D07']],
    ['m083','hust','IT-E10','Khoa học Dữ liệu và Trí tuệ nhân tạo',['K01','A00','A01']],
    ['m003','hust','IT-E10','Khoa học Dữ liệu và Trí tuệ nhân tạo',['K01','A00','A01']],
    ['m085','hust','ME1','Kỹ thuật Cơ điện tử',['K01','A00','A01']],
    ['m002','hust','IT-E15','An toàn không gian số - Cyber Security',['K01','A00','A01']]
  ].map(([majorId,source,programCode,program,codes])=>({majorId,...sources[source],programCode,program,codes}));
  const records=id=>rows.filter(r=>r.majorId===id);
  const matches=(id,code)=>!code||records(id).some(r=>r.codes.includes(code));
  const codes=[...new Set(rows.flatMap(r=>r.codes))].sort();
  const api={sources,rows,records,matches,codes};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CareerAdmissions=api;
})(typeof globalThis!=='undefined'?globalThis:this);
