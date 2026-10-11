// 短字詞缺乏上下文，Google 翻譯常出錯（例如「施用次數」→「申請件數」），這些改用固定翻譯
export const LABELS = {
  // 使用範圍表頭
  '作物': { en: 'Crop', ja: '作物', ko: '작물', vi: 'Cây trồng', id: 'Tanaman', th: 'พืช', es: 'Cultivo' },
  '病蟲害': { en: 'Pest / disease', ja: '病害虫', ko: '병해충', vi: 'Sâu bệnh', id: 'Hama / penyakit', th: 'ศัตรูพืช / โรคพืช', es: 'Plaga / enfermedad' },
  '每公頃每次用量': { en: 'Dose per ha per application', ja: '1haあたり1回使用量', ko: 'ha당 1회 사용량', vi: 'Liều lượng mỗi ha mỗi lần', id: 'Dosis per ha per aplikasi', th: 'อัตราใช้ต่อเฮกตาร์ต่อครั้ง', es: 'Dosis por ha por aplicación' },
  '稀釋倍數': { en: 'Dilution rate', ja: '希釈倍数', ko: '희석 배수', vi: 'Tỷ lệ pha loãng', id: 'Tingkat pengenceran', th: 'อัตราการเจือจาง', es: 'Dilución' },
  '使用時期': { en: 'Application timing', ja: '使用時期', ko: '사용 시기', vi: 'Thời điểm sử dụng', id: 'Waktu aplikasi', th: 'ช่วงเวลาที่ใช้', es: 'Momento de aplicación' },
  '施藥間隔': { en: 'Application interval', ja: '散布間隔', ko: '살포 간격', vi: 'Khoảng cách giữa các lần phun', id: 'Interval aplikasi', th: 'ระยะห่างการพ่น', es: 'Intervalo entre aplicaciones' },
  '施用次數': { en: 'Number of applications', ja: '使用回数', ko: '살포 횟수', vi: 'Số lần phun', id: 'Jumlah aplikasi', th: 'จำนวนครั้งที่ใช้', es: 'Número de aplicaciones' },
  '安全採收期': { en: 'Pre-harvest interval', ja: '収穫前日数', ko: '수확 전 안전 기간', vi: 'Thời gian cách ly', id: 'Interval pra-panen', th: 'ระยะปลอดภัยก่อนเก็บเกี่ยว', es: 'Plazo de seguridad' },
  '施藥方法': { en: 'Application method', ja: '使用方法', ko: '사용 방법', vi: 'Cách phun', id: 'Cara aplikasi', th: 'วิธีการใช้', es: 'Método de aplicación' },
  '注意事項': { en: 'Precautions', ja: '注意事項', ko: '주의사항', vi: 'Lưu ý', id: 'Catatan', th: 'ข้อควรระวัง', es: 'Precauciones' },
  '說明': { en: 'Note', ja: '備考', ko: '비고', vi: 'Ghi chú', id: 'Keterangan', th: 'หมายเหตุ', es: 'Observación' },
  '核准日期': { en: 'Approval date', ja: '承認日', ko: '승인일', vi: 'Ngày phê duyệt', id: 'Tanggal persetujuan', th: 'วันที่อนุมัติ', es: 'Fecha de aprobación' },
  '原始登記廠商': { en: 'Original registrant', ja: '原登録者', ko: '원 등록업체', vi: 'Đơn vị đăng ký gốc', id: 'Pendaftar asli', th: 'ผู้ขึ้นทะเบียนเดิม', es: 'Registrante original' },
  // 「說明」欄位的值
  '延伸使用': { en: 'Extended use (crop group)', ja: '適用拡大', ko: '사용 확대', vi: 'Mở rộng phạm vi sử dụng', id: 'Perluasan penggunaan', th: 'ขยายขอบเขตการใช้', es: 'Uso extendido' },
  '變更安全劑型': { en: 'Changed to safer formulation', ja: '安全な剤型へ変更', ko: '안전 제형으로 변경', vi: 'Đổi sang dạng thuốc an toàn hơn', id: 'Diubah ke formulasi lebih aman', th: 'เปลี่ยนเป็นสูตรที่ปลอดภัยกว่า', es: 'Cambio a formulación más segura' },
  '緊急防治用藥': { en: 'Emergency use', ja: '緊急防除用', ko: '긴급 방제용', vi: 'Sử dụng khẩn cấp', id: 'Penggunaan darurat', th: 'ใช้ในกรณีฉุกเฉิน', es: 'Uso de emergencia' },
  '公告標示外使用': { en: 'Off-label use (by notice)', ja: '告示によるラベル外使用', ko: '고시에 따른 표시 외 사용', vi: 'Sử dụng ngoài nhãn (theo công bố)', id: 'Penggunaan di luar label (sesuai pengumuman)', th: 'การใช้นอกฉลาก (ตามประกาศ)', es: 'Uso fuera de etiqueta (por aviso)' },
  '無人機施藥': { en: 'Drone application', ja: 'ドローン散布', ko: '드론 살포', vi: 'Phun bằng drone', id: 'Aplikasi dengan drone', th: 'พ่นด้วยโดรน', es: 'Aplicación con dron' },
};
