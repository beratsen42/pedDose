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

test("SF bolus 20 kg: 400 mL, 40 kg: max 500 mL", () => {
  yakin(C.hesapla(ilac("sf_bolus"), 20).ml, 400);
  const s = C.hesapla(ilac("sf_bolus"), 40);
  yakin(s.ml, 500); assert.equal(s.etiket, "MAX");
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
