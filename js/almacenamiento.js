import { Config } from './config.js';

const Almacenamiento = {
  dias: Config.COOKIE_DIAS || 30,

  guardar: function (datos) {
    const valor = encodeURIComponent(JSON.stringify(datos));
    const exp = new Date();
    exp.setTime(exp.getTime() + Almacenamiento.dias * 86400000);
    document.cookie = Config.CLAVE + '=' + valor +
      '; expires=' + exp.toUTCString() +
      '; path=/; SameSite=Lax';
  },

  cargar: function () {
    const partes = document.cookie.split('; ');
    for (let i = 0; i < partes.length; i++) {
      const kv = partes[i].split('=');
      if (kv[0] === Config.CLAVE && kv.length > 1 && kv[1]) {
        try {
          return JSON.parse(decodeURIComponent(kv[1]));
        } catch (err) {
          return null;
        }
      }
    }
    return null;
  },

  borrar: function () {
    document.cookie = Config.CLAVE +
      '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
  }
};

export { Almacenamiento };