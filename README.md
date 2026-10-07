# PedDose

Pediatrik acil için kiloya göre ilaç dozu ve Broselow bilgisi. Telefon öncelikli, tek sayfa.

## Açmak

`index.html` dosyasını tarayıcıda açın. İnternet gerekmez.

## Veriyi güncellemek

Ana kaynak Google Sheets'teki "PedDose İlaç Listesi" tablosudur.

1. Her sekmeyi "Dosya > İndir > Virgülle ayrılmış değerler (.csv)" ile indirin.
   - `Ilaclar` → `data/ilaclar.csv`
   - `Broselow` → `data/broselow.csv`
2. `python3 tools/build_data.py` çalıştırın. Bu komut `data.js` dosyasını yeniden üretir.

## Hesap kuralları

- Doz = `doz_per_kg` × kilo. 10 kg altında `doz_10kg_alti_per_kg` varsa o kullanılır.
- `sabit_doz` varsa kiloya bakılmaz.
- Doz `tek_doz_min` altındaysa min, `tek_doz_max` üstündeyse max kullanılır ve etiket gösterilir.
- mL = doz / `konsantrasyon_per_ml`. `doz_birimi` mL ise doz zaten mL'dir.
- Birim sayısı (ampul, ölçek, flakon) = doz / `birim_miktar`.
- `hesap_tipi` = `holliday_segar`: idame sıvı, 4-2-1 kuralı (mL/saat). Max `tek_doz_max`.
- Kilo sınırı: `kilo_min_kg` dahil, `kilo_max_kg` hariç. Sınır dışındaki satırlar gizlenir.

## Test

`node --test tests/calc.test.js`

Bu araç klinik değerlendirmenin yerini tutmaz.
