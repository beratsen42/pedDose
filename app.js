(function () {
  var DATA = window.PEDDOSE_DATA;
  var C = window.PedCalc;
  var sayi = C.sayi;

  var kiloInput = document.getElementById("kilo");
  var kiloForm = document.getElementById("kiloForm");
  var araInput = document.getElementById("ara");
  var hataEl = document.getElementById("hata");
  var broselowEl = document.getElementById("broselow");
  var icerikEl = document.getElementById("icerik");

  var RENKLER = {
    "Gri": "#9aa0a6", "Pembe": "#f48fb1", "Kırmızı": "#e53935", "Mor": "#8e44ad",
    "Sarı": "#fbc02d", "Beyaz": "#ffffff", "Mavi": "#1e88e5", "Turuncu": "#fb8c00", "Yeşil": "#43a047"
  };

  var kg = null;
  var acikKategoriler = {};
  var acikIlaclar = {};

  // Kategoriler: Resüsitasyon önce, diğerleri alfabetik.
  var kategoriler = {};
  DATA.ilaclar.forEach(function (d) {
    d.kategoriler.forEach(function (k) { (kategoriler[k] = kategoriler[k] || []).push(d); });
  });
  var kategoriSirasi = Object.keys(kategoriler).sort(function (a, b) {
    if (a === "Resüsitasyon") return -1;
    if (b === "Resüsitasyon") return 1;
    return a.localeCompare(b, "tr");
  });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Aramada Türkçe harf farklarını yok sayar: "sulfat" = "sülfat".
  function sade(s) {
    return String(s).toLocaleLowerCase("tr")
      .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
      .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c");
  }

  function broselowCiz() {
    if (kg == null) {
      broselowEl.className = "broselow bos";
      broselowEl.innerHTML = '<div class="broselow-ic">Kilo girince Broselow bölgesi ve dozlar burada görünür.</div>';
      return;
    }
    var z = C.broselowBolge(DATA.broselow, kg);
    if (!z) {
      broselowEl.className = "broselow bos";
      broselowEl.innerHTML = '<div class="broselow-ic">' + sayi(kg) + " kg Broselow aralığının dışında (36 kg üstü).</div>";
      return;
    }
    var bant = z.renk.split("/").map(function (r) {
      var renk = RENKLER[r.trim()] || "#999";
      return '<div style="background:' + renk + '"></div>';
    }).join("");
    broselowEl.className = "broselow";
    broselowEl.innerHTML =
      '<div class="renk-bant">' + bant + "</div>" +
      '<div class="broselow-ic">' +
      "<h2>Broselow: " + esc(z.renk) + ' <span class="sayac">' + esc(z.kilo_araligi) + " · " + esc(z.boy_cm) + " cm</span></h2>" +
      '<div class="broselow-grid">' +
      "<div><small>ET tüp kafsız</small><b>" + esc(z.et_tup_kafsiz_mm) + " mm</b></div>" +
      "<div><small>ET tüp kaflı</small><b>" + esc(z.et_tup_kafli_mm) + " mm</b></div>" +
      "<div><small>Defibrilasyon</small><b>" + esc(z.defib_1_sok) + " → " + esc(z.defib_2_3_sok) + "</b></div>" +
      "<div><small>Kardiyoversiyon</small><b>" + esc(z.kardiyoversiyon_1_sok) + " → " + esc(z.kardiyoversiyon_2_3_sok) + "</b></div>" +
      "<div><small>NG tüp</small><b>" + esc(z.ng_tup) + "</b></div>" +
      "</div>" +
      (z.renk.indexOf("/") > -1 ? '<div class="detay">K: kırmızı, M: mor, S: sarı</div>' : "") +
      "</div>";
  }

  function dozTanimi(d) {
    var b = d.doz_birimi;
    var parca = [];
    if (d.sabit_doz != null) parca.push("Sabit " + sayi(d.sabit_doz) + " " + b);
    else {
      parca.push(sayi(d.doz_per_kg) + " " + b + "/kg");
      if (d.doz_10kg_alti_per_kg != null) parca.push("10 kg altı " + sayi(d.doz_10kg_alti_per_kg) + " " + b + "/kg");
    }
    if (d.tek_doz_min != null) parca.push("min " + sayi(d.tek_doz_min) + " " + b);
    if (d.tek_doz_max != null) parca.push("max " + sayi(d.tek_doz_max) + " " + b);
    if (d.tekrar_araligi) parca.push(d.tekrar_araligi);
    return parca.join(" · ");
  }

  // Mini satırın sağ tarafı: doz ve mL, ya da kilo yoksa kg başına doz.
  function ozet(d, s) {
    var b = esc(d.doz_birimi);
    if (!s) {
      if (d.sabit_doz != null) return sayi(d.sabit_doz) + " " + b;
      return sayi(d.doz_per_kg) + " " + b + "/kg";
    }
    var parca = [];
    if (d.doz_birimi !== "mL") parca.push(sayi(s.doz) + " " + b);
    if (s.ml != null) parca.push(sayi(s.ml) + " mL");
    return parca.join(" · ");
  }

  function kartCiz(d) {
    var s = kg != null ? C.hesapla(d, kg) : null;
    var h = '<details class="ilac" data-id="' + esc(d.id) + '"' + (acikIlaclar[d.id] ? " open" : "") + ">" +
      '<summary class="mini">' +
      '<span class="mini-ad">' + esc(d.ilac_adi) + ' <span class="yol">' + esc(d.yol) + "</span></span>" +
      '<span class="mini-doz">' + (s && s.etiket ? '<span class="etiket ' + s.etiket + '">' + s.etiket + "</span> " : "") +
      ozet(d, s) + "</span>" +
      "</summary>" +
      '<div class="ilac-ic">' +
      '<div class="form">' + esc(d.form_adi) + (d.etken_madde && d.etken_madde !== d.ilac_adi ? " · " + esc(d.etken_madde) : "") + "</div>";

    if (s) {
      h += '<div class="doz-satir">';
      if (d.doz_birimi !== "mL") h += '<span class="ana">' + sayi(s.doz) + "<small>" + esc(d.doz_birimi) + "</small></span>";
      if (s.ml != null) h += '<span class="' + (d.doz_birimi === "mL" ? "ana" : "ek") + '">' + sayi(s.ml) + "<small>mL</small></span>";
      if (s.birimSayisi != null && d.birim_adi) h += '<span class="ek">' + sayi(s.birimSayisi) + "<small>" + esc(d.birim_adi) + "</small></span>";
      if (s.etiket) h += '<span class="etiket ' + s.etiket + '">' + s.etiket + " DOZ</span>";
      h += "</div>";
      h += '<div class="detay">' + esc(dozTanimi(d)) + "</div>";
      if (s.gunlukMax != null) h += '<div class="detay">Günlük max: ' + sayi(s.gunlukMax) + " " + esc(d.doz_birimi) + "</div>";
    } else {
      h += '<div class="bekle">' + esc(dozTanimi(d)) + "</div>";
    }
    if (d.not) h += '<div class="not">' + esc(d.not) + "</div>";
    return h + "</div></details>";
  }

  function gorunurler(liste) {
    return kg == null ? liste : liste.filter(function (d) { return C.kiloUygun(d, kg); });
  }

  function icerikCiz() {
    var q = sade(araInput.value.trim());
    if (q) {
      var bulunan = gorunurler(DATA.ilaclar).filter(function (d) {
        return sade(d.ilac_adi + " " + d.etken_madde + " " + d.markalar).indexOf(q) > -1;
      });
      icerikEl.innerHTML = bulunan.length
        ? '<div class="liste" style="padding:0">' + bulunan.map(kartCiz).join("") + "</div>"
        : '<div class="bos-sonuc">Sonuç yok.</div>';
      return;
    }
    icerikEl.innerHTML = kategoriSirasi.map(function (k) {
      var liste = gorunurler(kategoriler[k]);
      if (!liste.length) return "";
      return '<details class="kat" data-kat="' + esc(k) + '"' + (acikKategoriler[k] ? " open" : "") + ">" +
        "<summary><span>" + esc(k) + '<span class="sayac">' + liste.length + "</span></span></summary>" +
        '<div class="liste">' + liste.map(kartCiz).join("") + "</div></details>";
    }).join("");
  }

  icerikEl.addEventListener("toggle", function (e) {
    var el = e.target;
    if (!el.matches) return;
    if (el.matches("details.kat")) acikKategoriler[el.getAttribute("data-kat")] = el.open;
    else if (el.matches("details.ilac")) acikIlaclar[el.getAttribute("data-id")] = el.open;
  }, true);

  function kiloGuncelle() {
    var metin = kiloInput.value.trim();
    if (metin === "") {
      kg = null;
      hataEl.textContent = "";
    } else {
      var yeni = C.kiloOku(metin);
      if (yeni == null) {
        kg = null;
        hataEl.textContent = "Geçerli bir kilo girin (0,5–150 kg).";
      } else {
        kg = yeni;
        hataEl.textContent = "";
      }
    }
    broselowCiz();
    icerikCiz();
  }

  kiloInput.addEventListener("input", kiloGuncelle);
  kiloForm.addEventListener("submit", function (e) {
    e.preventDefault();
    kiloInput.blur();
  });
  // Arama yapılırken Broselow kutusu gizlenir.
  function aramaGuncelle() {
    broselowEl.hidden = araInput.value.trim() !== "";
    icerikCiz();
  }

  araInput.addEventListener("input", aramaGuncelle);
  araInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") araInput.blur();
  });

  // Kutuların dışına dokununca klavye kapanır.
  document.addEventListener("touchstart", function (e) {
    var a = document.activeElement;
    if ((a === kiloInput || a === araInput) && !e.target.closest(".top")) a.blur();
  }, { passive: true });

  broselowCiz();
  icerikCiz();
})();
