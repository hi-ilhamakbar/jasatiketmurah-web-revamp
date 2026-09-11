/*
 * Single source of truth for client-facing translations.
 * Add a locale by adding its BCP-47 code and keys below; never place API keys
 * or credentials in this file.
 */
window.JTM_I18N={
  languageNames:{id:'Bahasa Indonesia',en:'English',km:'ខ្មែរ','zh-Hans':'简体中文','zh-Hant':'繁體中文',ja:'日本語',ko:'한국어',ms:'Bahasa Melayu',my:'မြန်မာ',pt:'Português',fil:'Tagalog',th:'ไทย',tr:'Türkçe',vi:'Tiếng Việt'},
  runtime:{
    id:{departure:'Tanggal pergi',return:'Tanggal pulang',passengers:'Penumpang',bookingClass:'Kelas pemesanan',oneWay:'Sekali jalan',roundTrip:'Pulang-pergi',multiCity:'Multi-kota',direct:'Penerbangan langsung',adult:'dewasa',child:'anak',infant:'bayi',search:'Cari'},
    en:{departure:'Departure date',return:'Return date',passengers:'Passengers',bookingClass:'Booking class',oneWay:'One way',roundTrip:'Round trip',multiCity:'Multi-city',direct:'Direct flights only',adult:'adult',child:'child',infant:'infant',search:'Search'},
    ko:{departure:'출발일',return:'귀국일',passengers:'승객',bookingClass:'좌석 등급',oneWay:'편도',roundTrip:'왕복',multiCity:'다구간',direct:'직항만',adult:'성인',child:'어린이',infant:'유아',search:'검색'},
    ja:{departure:'出発日',return:'帰国日',passengers:'旅行者',bookingClass:'搭乗クラス',oneWay:'片道',roundTrip:'往復',multiCity:'複数都市',direct:'直行便のみ',adult:'大人',child:'子供',infant:'幼児',search:'検索'},
    th:{departure:'วันเดินทาง',return:'วันกลับ',passengers:'ผู้เดินทาง',bookingClass:'ชั้นโดยสาร',oneWay:'เที่ยวเดียว',roundTrip:'ไปกลับ',multiCity:'หลายเมือง',direct:'เที่ยวบินตรงเท่านั้น',adult:'ผู้ใหญ่',child:'เด็ก',infant:'ทารก',search:'ค้นหา'},
    'zh-Hans':{departure:'出发日期',return:'返程日期',passengers:'乘客',bookingClass:'舱位等级',oneWay:'单程',roundTrip:'往返',multiCity:'多城市',direct:'仅限直飞',adult:'成人',child:'儿童',infant:'婴儿',search:'搜索'},
    'zh-Hant':{departure:'出發日期',return:'回程日期',passengers:'旅客',bookingClass:'艙等',oneWay:'單程',roundTrip:'來回',multiCity:'多城市',direct:'僅限直飛',adult:'成人',child:'兒童',infant:'嬰兒',search:'搜尋'}
  },
  t(locale,key){return this.runtime[locale]?.[key]||this.runtime.en[key]||key}
};
