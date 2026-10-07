// Doz hesabı. Tarayıcıda window.PedCalc, Node'da module.exports olarak kullanılır.
(function (root) {
  // Kilo sınırı: alt sınır dahil, üst sınır hariç.
  function kiloUygun(drug, kg) {
    if (drug.kilo_min_kg != null && kg < drug.kilo_min_kg) return false;
    if (drug.kilo_max_kg != null && kg >= drug.kilo_max_kg) return false;
    return true;
  }

  function hesapla(drug, kg) {
    var sonuc = { doz: null, etiket: null, ml: null, birimSayisi: null, perKg: null, gunlukMax: null };

    if (drug.sabit_doz != null) {
      sonuc.doz = drug.sabit_doz;
    } else {
      var perKg = drug.doz_per_kg;
      if (kg < 10 && drug.doz_10kg_alti_per_kg != null) perKg = drug.doz_10kg_alti_per_kg;
      sonuc.perKg = perKg;
      var doz = perKg * kg;
      if (drug.tek_doz_min != null && doz < drug.tek_doz_min) {
        doz = drug.tek_doz_min;
        sonuc.etiket = "MIN";
      }
      if (drug.tek_doz_max != null && doz > drug.tek_doz_max) {
        doz = drug.tek_doz_max;
        sonuc.etiket = "MAX";
      }
      sonuc.doz = doz;
    }

    if (drug.doz_birimi === "mL") {
      sonuc.ml = sonuc.doz;
    } else if (drug.konsantrasyon_per_ml) {
      sonuc.ml = sonuc.doz / drug.konsantrasyon_per_ml;
    }

    if (drug.birim_miktar) sonuc.birimSayisi = sonuc.doz / drug.birim_miktar;

    var adaylar = [];
    if (drug.gunluk_max_per_kg != null) adaylar.push(drug.gunluk_max_per_kg * kg);
    if (drug.gunluk_max != null) adaylar.push(drug.gunluk_max);
    if (adaylar.length) sonuc.gunlukMax = Math.min.apply(null, adaylar);

    return sonuc;
  }

  function broselowBolge(zones, kg) {
    for (var i = 0; i < zones.length; i++) {
      if (kg >= zones[i].kilo_min_kg && kg < zones[i].kilo_max_kg) return zones[i];
    }
    return null;
  }

  // Kullanıcının yazdığı kiloyu okur. "12,5" ve "12.5" kabul edilir.
  function kiloOku(metin) {
    var temiz = String(metin).trim().replace(",", ".");
    if (!/^\d+(\.\d+)?$/.test(temiz)) return null;
    var kg = parseFloat(temiz);
    if (!(kg >= 0.5 && kg <= 150)) return null;
    return kg;
  }

  // Sayıyı Türkçe biçimde yazar. Küçük sayılarda daha çok ondalık gösterir.
  function sayi(n) {
    if (n == null || isNaN(n)) return "";
    var basamak = Math.abs(n) < 1 ? 2 : Math.abs(n) < 10 ? 2 : Math.abs(n) < 100 ? 1 : 0;
    var yuvarli = Number(n.toFixed(basamak));
    return yuvarli.toLocaleString("tr-TR", { maximumFractionDigits: basamak });
  }

  var api = { kiloUygun: kiloUygun, hesapla: hesapla, broselowBolge: broselowBolge, kiloOku: kiloOku, sayi: sayi };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PedCalc = api;
})(this);
