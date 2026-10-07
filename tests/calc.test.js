const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const C = require("../calc.js");

// data.js'i Node'da yükle
const window = {};
new Function("window", fs.readFileSync(path.join(__dirname, "..", "data.js"), "utf8"))(window);
const DATA = window.PEDDOSE_DATA;
const ilac = (id) => DATA.ilaclar.find((d) => d.id === id);
const yakin = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("Zofran IV 20 kg: 3 mg, 1,5 mL, 0,75 ampul", () => {
  const s = C.hesapla(ilac("ondansetron_iv"), 20);
  yakin(s.doz, 3); yakin(s.ml, 1.5); yakin(s.birimSayisi, 0.75); assert.equal(s.etiket, null);
});

test("Zofran IV 60 kg: max 8 mg", () => {
  const s = C.hesapla(ilac("ondansetron_iv"), 60);
  yakin(s.doz, 8); assert.equal(s.etiket, "MAX");
});

test("Parol IV 8 kg: 10 kg altı dozu 7,5 mg/kg", () => {
  const s = C.hesapla(ilac("parasetamol_iv"), 8);
  yakin(s.doz, 60); yakin(s.ml, 6);
});

test("Parol IV 20 kg: günlük max 1200 mg", () => {
  yakin(C.hesapla(ilac("parasetamol_iv"), 20).gunlukMax, 1200);
});

test("Avil 20 kg: 20 mg = 0,88 mL", () => {
  const s = C.hesapla(ilac("feniramin_iv"), 20);
  yakin(s.doz, 20); assert.ok(Math.abs(s.ml - 0.879) < 0.001);
});

test("Brufen şurup 20 kg: 200 mg = 10 mL = 2 ölçek", () => {
  const s = C.hesapla(ilac("ibuprofen_po"), 20);
  yakin(s.doz, 200); yakin(s.ml, 10); yakin(s.birimSayisi, 2);
});

test("Adrenalin IV 20 kg: 0,2 mg = 2 mL sulandırılmış", () => {
  const s = C.hesapla(ilac("epinefrin_iv_arrest"), 20);
  yakin(s.doz, 0.2); yakin(s.ml, 2);
});

test("Atropin 3 kg: min 0,1 mg", () => {
  const s = C.hesapla(ilac("atropin_iv_bradikardi"), 3);
  yakin(s.doz, 0.1); assert.equal(s.etiket, "MIN");
});

test("Dekstroz %10 20 kg: 10 g = 100 mL", () => {
  const s = C.hesapla(ilac("dekstroz_10"), 20);
  yakin(s.doz, 10); yakin(s.ml, 100);
});

test("SF bolus 20 kg: 400 mL, 40 kg: 800 mL, 60 kg: max 1000 mL", () => {
  yakin(C.hesapla(ilac("sf_bolus"), 20).ml, 400);
  yakin(C.hesapla(ilac("sf_bolus"), 40).ml, 800);
  const s = C.hesapla(ilac("sf_bolus"), 60);
  yakin(s.ml, 1000); assert.equal(s.etiket, "MAX");
});

test("Glukagon: 24,9 kg 0,5 mg, 25 kg 1 mg", () => {
  const alt = ilac("glukagon_im_25alti"), ust = ilac("glukagon_im_25ustu");
  assert.ok(C.kiloUygun(alt, 24.9)); assert.ok(!C.kiloUygun(ust, 24.9));
  assert.ok(!C.kiloUygun(alt, 25)); assert.ok(C.kiloUygun(ust, 25));
  yakin(C.hesapla(alt, 10).doz, 0.5); yakin(C.hesapla(ust, 30).doz, 1);
});

test("Morfin 7 kg'da gizli, 8 kg'da görünür", () => {
  assert.ok(!C.kiloUygun(ilac("morfin_iv_im"), 7));
  assert.ok(C.kiloUygun(ilac("morfin_iv_im"), 8));
});

test("Broselow bölgeleri", () => {
  assert.equal(C.broselowBolge(DATA.broselow, 5).renk, "Gri / Pembe");
  assert.equal(C.broselowBolge(DATA.broselow, 14.5).renk, "Kırmızı / Mor / Sarı");
  assert.equal(C.broselowBolge(DATA.broselow, 20).renk, "Mavi");
  assert.equal(C.broselowBolge(DATA.broselow, 40), null);
});

test("Kilo okuma", () => {
  assert.equal(C.kiloOku("12,5"), 12.5);
  assert.equal(C.kiloOku("12.5"), 12.5);
  assert.equal(C.kiloOku("abc"), null);
  assert.equal(C.kiloOku("0"), null);
  assert.equal(C.kiloOku("200"), null);
});

test("Sayı biçimi", () => {
  assert.equal(C.sayi(0.879), "0,88");
  assert.equal(C.sayi(12.5), "12,5");
  assert.equal(C.sayi(1200), "1.200");
});

test("Deksametazon krup 20 kg: 12 mg = 3 mL = 1,5 ampul; 30 kg: max 16 mg", () => {
  const s = C.hesapla(ilac("deksametazon_krup"), 20);
  yakin(s.doz, 12); yakin(s.ml, 3); yakin(s.birimSayisi, 1.5);
  const m = C.hesapla(ilac("deksametazon_krup"), 30);
  yakin(m.doz, 16); assert.equal(m.etiket, "MAX");
});

test("Adrenalin nebül krupta: 6 kg 3 mg = 3 mL; 20 kg max 5 mL", () => {
  const d = ilac("epinefrin_neb");
  assert.ok(d.kategoriler.includes("Krup"));
  yakin(C.hesapla(d, 6).ml, 3);
  yakin(C.hesapla(d, 20).ml, 5);
});

test("İdame (4-2-1): 8 kg 32, 15 kg 50, 25 kg 65 mL/saat; 60 kg 100; 70 kg max 100", () => {
  for (const id of ["idame_sf", "idame_yarim_izomiks"]) {
    const d = ilac(id);
    yakin(C.hesapla(d, 8).doz, 32);
    yakin(C.hesapla(d, 15).doz, 50);
    const s = C.hesapla(d, 25);
    yakin(s.doz, 65); yakin(s.gunlukToplam, 1560); assert.equal(s.etiket, null);
    yakin(C.hesapla(d, 60).doz, 100);
    const m = C.hesapla(d, 70);
    yakin(m.doz, 100); assert.equal(m.etiket, "MAX");
  }
});

test("Antibiyotik şuruplar 20 kg", () => {
  const b = C.hesapla(ilac("amoks_klav_bid"), 20);
  yakin(b.doz, 450); yakin(b.ml, 5.625);
  const es = C.hesapla(ilac("amoks_klav_es"), 20);
  yakin(es.doz, 900); yakin(es.ml, 7.5); yakin(es.birimSayisi, 1.5);
  yakin(C.hesapla(ilac("sefiksim_po"), 20).ml, 8);
  const az = C.hesapla(ilac("azitromisin_po"), 20);
  yakin(az.doz, 200); yakin(az.ml, 5); yakin(az.ikinci.doz, 100); yakin(az.ikinci.ml, 2.5);
  const az60 = C.hesapla(ilac("azitromisin_po"), 60);
  yakin(az60.doz, 500); yakin(az60.ikinci.doz, 250); assert.equal(az60.ikinci.etiket, "MAX");
  yakin(C.hesapla(ilac("tmp_smx_po"), 20).ml, 10);
  yakin(C.hesapla(ilac("klaritromisin_125"), 20).ml, 6);
});

test("Augmentin BID 50 kg: max 875 mg", () => {
  const s = C.hesapla(ilac("amoks_klav_bid"), 50);
  yakin(s.doz, 875); assert.equal(s.etiket, "MAX");
});

test("NAC iki torba 20 kg: 4000 mg/40 mL, sonra 2000 mg/20 mL", () => {
  const s = C.hesapla(ilac("nac_iv_20_50"), 20);
  yakin(s.doz, 4000); yakin(s.ml, 40); yakin(s.ikinci.doz, 2000); yakin(s.ikinci.ml, 20);
  const b = C.hesapla(ilac("nac_iv_50ustu"), 120);
  yakin(b.doz, 22000); yakin(b.ikinci.doz, 11000);
  // Torba hacmi bandı: her kiloda tek NAC satırı görünür
  for (const kg of [5, 19.9, 20, 49.9, 50, 80]) {
    const n = ["nac_iv_20alti", "nac_iv_20_50", "nac_iv_50ustu"].filter((id) => C.kiloUygun(ilac(id), kg));
    assert.equal(n.length, 1, "kg " + kg);
  }
});

test("Astım: salbutamol min/max, ipratropium 20 kg sınırı, prednizolon tablet", () => {
  const s10 = C.hesapla(ilac("salbutamol_neb"), 10);
  yakin(s10.doz, 2.5); assert.equal(s10.etiket, "MIN");
  const s50 = C.hesapla(ilac("salbutamol_neb"), 50);
  yakin(s50.doz, 5); assert.equal(s50.etiket, "MAX");
  assert.ok(C.kiloUygun(ilac("ipratropium_20alti"), 19.9));
  assert.ok(C.kiloUygun(ilac("ipratropium_20ustu"), 20));
  yakin(C.hesapla(ilac("ipratropium_20alti"), 10).ml, 1);
  yakin(C.hesapla(ilac("prednizolon_po"), 20).birimSayisi, 4);
  yakin(C.hesapla(ilac("magnezyum_iv"), 20).ml, 800 / 150);
});

test("RSI ve nöbet örnekleri", () => {
  yakin(C.hesapla(ilac("suksinilkolin_iv"), 8).doz, 16);
  yakin(C.hesapla(ilac("suksinilkolin_iv"), 20).doz, 30);
  yakin(C.hesapla(ilac("fentanil_in"), 20).ml, 0.6);
  yakin(C.hesapla(ilac("levetirasetam_iv"), 20).ml, 12);
  yakin(C.hesapla(ilac("fenitoin_iv"), 20).ml, 8);
  yakin(C.hesapla(ilac("nacl_3"), 60).doz, 250);
  const ca = C.hesapla(ilac("kalsiyum_glukonat"), 20);
  yakin(ca.ml, 12); yakin(ca.birimSayisi, 1.2);
  yakin(C.hesapla(ilac("kalsiyum_glukonat"), 60).ml, 30);
  assert.equal(ilac("fenobarbital_iv"), undefined);
});
