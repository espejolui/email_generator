import { Config } from './config.js';
import { Plantilla } from './plantilla.js';
import { Prompt } from './prompt.js';
import { Almacenamiento } from './almacenamiento.js';

const UI = {
  campos: {},
  imgMini: null,
  iframeVista: null,
  toast: null,
  campoPrompt: null,
  _msgAuto: '',

  referenciar: function () {
    UI.campos = {
      titulo: document.getElementById('f-titulo'),
      empresa: document.getElementById('f-empresa'),
      franja: document.getElementById('f-franja'),
      desc: document.getElementById('f-desc'),
      mod: document.getElementById('f-mod'),
      clases: document.getElementById('f-clases'),
      dur: document.getElementById('f-dur'),
      horario: document.getElementById('f-horario'),
      fecha: document.getElementById('f-fecha'),
      inv: document.getElementById('f-inv'),
      img: document.getElementById('f-img'),
      cta: document.getElementById('f-cta'),
      boton: document.getElementById('f-boton'),
      wa: document.getElementById('f-wa'),
      msg: document.getElementById('f-msg'),
      asesor: document.getElementById('f-asesor'),
      equipo: document.getElementById('f-equipo'),
      color1: document.getElementById('f-color1'),
      color1hex: document.getElementById('f-color1hex'),
      color2: document.getElementById('f-color2'),
      color2hex: document.getElementById('f-color2hex')
    };
    UI.imgMini = document.getElementById('img-mini');
    UI.iframeVista = document.getElementById('vista');
    UI.toast = document.getElementById('toast');
    UI.campoPrompt = document.getElementById('f-prompt');
  },

  guardar: function () {
    const datos = {};
    for (const k in UI.campos) {
      if (UI.campos[k].value !== undefined) datos[k] = UI.campos[k].value;
    }
    Almacenamiento.guardar(datos);
  },

  cargar: function () {
    const origen = Almacenamiento.cargar() || Config.valoresDefecto;
    UI.aplicar(origen);
  },

  aplicar: function (origen) {
    UI.campos.titulo.value = origen.titulo || '';
    UI.campos.empresa.value = origen.empresa || '';
    UI.campos.franja.value = origen.franja || '';
    UI.campos.desc.value = origen.desc || '';
    UI.campos.mod.value = origen.mod || '';
    UI.campos.clases.value = origen.clases || '';
    UI.campos.dur.value = origen.dur || '';
    UI.campos.horario.value = origen.horario || '';
    UI.campos.fecha.value = origen.fecha || '';
    UI.campos.inv.value = origen.inv ? String(origen.inv).replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
    UI.campos.img.value = origen.img || '';
    UI.campos.cta.value = origen.cta || '';
    UI.campos.boton.value = origen.boton || '';
    UI.campos.wa.value = origen.wa ? String(origen.wa).replace(/\D/g, '').slice(-10) : '';
    UI.campos.msg.value = origen.msg || '';
    UI.campos.asesor.value = origen.asesor || '';
    UI.campos.equipo.value = origen.equipo || '';
    const c1 = Plantilla.normalizarColor(origen.color1) || '#41b6e6';
    const c2 = Plantilla.normalizarColor(origen.color2) || '#8de1f7';
    UI.campos.color1.value = c1;
    UI.campos.color1hex.value = c1;
    UI.campos.color2.value = c2;
    UI.campos.color2hex.value = c2;
  },

  autocompletarMsg: function () {
    const msg = UI.campos.msg;
    if (!msg) return;
    const curso = UI.campos.titulo.value.trim();
    const compuesto = curso ? 'Hola, quiero inscribirme al curso de ' + curso : '';
    if (msg.value === compuesto && compuesto !== '') {
      UI._msgAuto = compuesto;
      return;
    }
    if (msg.value.trim() === '' || msg.value === UI._msgAuto) {
      msg.value = compuesto;
      UI._msgAuto = compuesto;
    }
  },

  autocompletarEquipo: function () {
    const equipo = UI.campos.equipo;
    if (!equipo) return;
    const empresa = UI.campos.empresa.value.trim();
    equipo.value = empresa ? 'Equipo ' + empresa : '';
  },

  actualizarMiniatura: function () {
    const url = UI.campos.img.value.trim();
    if (url) {
      UI.imgMini.src = url;
      UI.imgMini.style.display = 'block';
    } else {
      UI.imgMini.removeAttribute('src');
      UI.imgMini.style.display = 'none';
    }
  },

  actualizarVista: function () {
    UI.aplicarVista(Plantilla.generar(Plantilla.leerValores(UI.campos)));
  },

  aplicarVista: function (html) {
    const iframe = UI.iframeVista;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc || doc.readyState !== 'complete' || typeof DOMParser === 'undefined') {
      iframe.srcdoc = html;
      return;
    }
    const nuevo = new DOMParser().parseFromString(html, 'text/html');
    if (!nuevo.documentElement) {
      iframe.srcdoc = html;
      return;
    }
    UI._parchear(doc.documentElement, nuevo.documentElement);
  },

  _parchear: function (viejo, nuevo) {
    if (viejo.nodeName !== nuevo.nodeName) {
      viejo.replaceWith(nuevo.cloneNode(true));
      return;
    }
    if (viejo.nodeType === 3) {
      if (viejo.textContent !== nuevo.textContent) viejo.textContent = nuevo.textContent;
      return;
    }
    if (viejo.attributes) {
      for (let i = 0; i < nuevo.attributes.length; i++) {
        const attrN = nuevo.attributes[i];
        if (viejo.getAttribute(attrN.name) !== attrN.value) viejo.setAttribute(attrN.name, attrN.value);
      }
      const nombres = [];
      for (let i = 0; i < viejo.attributes.length; i++) nombres.push(viejo.attributes[i].name);
      for (const nombre of nombres) {
        if (!nuevo.hasAttribute(nombre)) viejo.removeAttribute(nombre);
      }
    }
    const hijosV = Array.from(viejo.childNodes);
    const hijosN = Array.from(nuevo.childNodes);
    const total = Math.max(hijosV.length, hijosN.length);
    for (let i = 0; i < total; i++) {
      const v = hijosV[i];
      const w = hijosN[i];
      if (!w) { v.remove(); continue; }
      if (!v) { viejo.appendChild(w); continue; }
      UI._parchear(v, w);
    }
  },

  actualizarPrompt: function () {
    UI.campoPrompt.value = Prompt.construir(
      UI.campos.titulo.value.trim(),
      UI.campos.desc.value.trim(),
      UI.campos.empresa.value.trim()
    );
  },

  copiarPrompt: function () {
    const texto = UI.campoPrompt.value;
    function ok() { UI.mostrarToast('Prompt copiado'); }
    function fallback() {
      UI.campoPrompt.removeAttribute('readonly');
      UI.campoPrompt.select();
      try {
        document.execCommand('copy');
        ok();
      } catch (err) {}
      UI.campoPrompt.setAttribute('readonly', '');
      window.getSelection().removeAllRanges();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(ok, fallback);
    } else {
      fallback();
    }
  },

  tomarColorHex: function (entrada, selector, otro) {
    const hex = Plantilla.normalizarColor(entrada.value);
    if (hex) {
      selector.value = hex;
      if (otro) otro.value = hex;
    } else {
      selector.value = selector.value;
      entrada.value = selector.value;
    }
  },

  mostrarToast: function (texto) {
    UI.toast.textContent = texto;
    UI.toast.classList.add('visible');
    clearTimeout(UI.mostrarToast._t);
    UI.mostrarToast._t = setTimeout(function () {
      UI.toast.classList.remove('visible');
    }, 2200);
  },

  slug: function (texto) {
    return (texto || 'email')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'email';
  },

  validar: function () {
    const faltantes = [];
    for (let i = 0; i < Config.requeridos.length; i++) {
      const el = document.getElementById(Config.requeridos[i][0]);
      if (el.value.trim() === '') {
        el.classList.add('falta');
        faltantes.push(Config.requeridos[i][1]);
      } else {
        el.classList.remove('falta');
      }
    }
    return faltantes;
  },

  descargar: function () {
    const faltantes = UI.validar();
    if (faltantes.length > 0) {
      UI.mostrarToast('Completa los campos: ' + faltantes.join(', '));
      return;
    }
    const html = Plantilla.generar(Plantilla.leerValores(UI.campos));
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = UI.slug(UI.campos.titulo.value) + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
    UI.mostrarToast('Email descargado');
  },

  iniciar: function () {
    UI.referenciar();

    document.addEventListener('input', function (evt) {
      if (evt.target.id === 'f-titulo') UI.autocompletarMsg();
      if (evt.target.id === 'f-empresa') UI.autocompletarEquipo();
      const id = evt.target.id;
      if (id === 'f-color1' || id === 'f-color1hex') {
        UI.tomarColorHex(evt.target, UI.campos.color1, UI.campos.color1hex);
      } else if (id === 'f-color2' || id === 'f-color2hex') {
        UI.tomarColorHex(evt.target, UI.campos.color2, UI.campos.color2hex);
      } else if (id === 'f-wa') {
        evt.target.value = evt.target.value.replace(/\D/g, '').slice(-10);
      } else if (id === 'f-inv') {
        evt.target.value = evt.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      }
      if (evt.target.classList) evt.target.classList.remove('falta');
      UI.actualizarMiniatura();
      UI.actualizarVista();
      UI.actualizarPrompt();
      UI.guardar();
    });

    document.getElementById('btnDescargar').addEventListener('click', UI.descargar);
    document.getElementById('btnCopiar').addEventListener('click', UI.copiarPrompt);
    document.getElementById('btnRestaurar').addEventListener('click', function () {
      if (confirm('¿Restaurar todos los valores por defecto?')) {
        Almacenamiento.borrar();
        UI.aplicar(Config.valoresDefecto);
        UI.autocompletarMsg();
        UI.autocompletarEquipo();
        UI.actualizarMiniatura();
        UI.actualizarVista();
        UI.actualizarPrompt();
        UI.mostrarToast('Valores restaurados');
      }
    });

    UI.cargar();
    UI.autocompletarMsg();
    UI.autocompletarEquipo();
    UI.actualizarMiniatura();
    UI.actualizarVista();
    UI.actualizarPrompt();
  }
};

export { UI };

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', UI.iniciar);
  } else {
    UI.iniciar();
  }
}