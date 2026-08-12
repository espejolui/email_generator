import { Config } from './config.js';

const Plantilla = {
  e: function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  colorValido: function (hex) {
    return /^#?[0-9a-fA-F]{6}$/.test(hex);
  },

  normalizarColor: function (hex) {
    if (!Plantilla.colorValido(hex)) return null;
    return (hex[0] === '#' ? hex : '#' + hex).toLowerCase();
  },

  formatoMiles: function (n) {
    return n.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },

  formatearFecha: function (v) {
    if (!v) return '';
    const f = new Date(v + 'T12:00:00');
    if (isNaN(f.getTime())) return v;
    return Config.DIAS[f.getDay()] + ' ' + f.getDate() + ' de ' + Config.MESES[f.getMonth()] + ' de ' + f.getFullYear();
  },

  leerValores: function (campos) {
    const c1 = Plantilla.normalizarColor(campos.color1hex.value) || Plantilla.normalizarColor(campos.color1.value) || '#41b6e6';
    const c2 = Plantilla.normalizarColor(campos.color2hex.value) || Plantilla.normalizarColor(campos.color2.value) || '#8de1f7';
    const invDig = campos.inv.value.replace(/\D/g, '');
    const detalles = [
      ['Modalidad', campos.mod.value],
      ['Número de clases', campos.clases.value],
      ['Duración', campos.dur.value],
      ['Horario en vivo', campos.horario.value],
      ['Fecha de inicio', Plantilla.formatearFecha(campos.fecha.value)],
      ['Inversión', invDig ? '$' + Plantilla.formatoMiles(invDig) : '']
    ]
      .filter(function (d) { return d[1].trim() !== ''; })
      .map(function (d) {
        return '<strong>' + Plantilla.e(d[0]) + ':</strong> ' + Plantilla.e(d[1].trim());
      })
      .join('<br />\n');
    const telefono = '+57' + campos.wa.value.replace(/\D/g, '').slice(-10);
    return {
      titulo: campos.titulo.value,
      empresa: campos.empresa ? campos.empresa.value.trim() : '',
      franja: campos.franja.value,
      desc: campos.desc.value,
      detalles: detalles,
      img: campos.img.value.trim(),
      cta: campos.cta.value,
      boton: campos.boton.value,
      wa: telefono,
      msg: campos.msg.value,
      asesor: campos.asesor.value,
      equipo: campos.equipo.value,
      color1: c1,
      color2: c2
    };
  },

  generar: function (v) {
    const tituloPagina = v.titulo;
    const altImg = [v.titulo, v.empresa].filter(Boolean).join(' ');
    const bloqueMarca = v.empresa
      ? "<p style=\"margin:0 0 22px 0; font-family:'Nunito','Trebuchet MS',sans-serif;\n" +
        '                         font-size:26px; font-weight:900; color:#ffffff; letter-spacing:1px;">\n' +
        '                ' + Plantilla.e(v.empresa) + '\n' +
        '              </p>\n'
      : '';
    const bloqueImagen = v.img
      ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
        '<tr><td align="center" style="border-radius:12px; overflow:hidden; box-shadow:0 3px 16px rgba(65,182,230,0.18);">' +
        '<img src="' + Plantilla.e(v.img) + '" alt="' + Plantilla.e(altImg) + '" width="504" style="width:100%; max-width:504px; border-radius:12px; display:block;" />' +
        '</td></tr></table>'
      : '';
    const bloqueDetalles = v.detalles
      ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef6fb; border-radius:12px; padding:20px 24px; margin:16px 0 20px 0;">' +
        '<tr><td style="padding:0; font-family:\'Nunito\',\'Trebuchet MS\',sans-serif; font-size:15px; color:#444444; line-height:2;">' +
        v.detalles +
        '</td></tr></table>'
      : '';
    const bloqueCta = v.cta
      ? '<p style="margin:0 0 16px 0; font-family:\'Nunito\',\'Trebuchet MS\',sans-serif; font-size:16px; color:#444444; line-height:1.75;">' + Plantilla.e(v.cta) + '</p>'
      : '';
    const enlaceWa = v.wa.length > 3 ? 'https://wa.me/' + v.wa + '?text=' + encodeURIComponent(v.msg) : '#';
    const divisor = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 24px 0;">' +
      '<tr><td><div style="height:3px; background:linear-gradient(90deg,' + v.color1 + ' 0%,' + v.color2 + ' 100%); border-radius:2px;"></div></td></tr></table>';

    return '<!DOCTYPE html>\n' +
      '<html lang="es">\n' +
      '<head>\n' +
      '  <meta charset="UTF-8" />\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>\n' +
      '  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>\n' +
      '  <title>' + Plantilla.e(tituloPagina) + '</title>\n' +
      '  <style>\n' +
      "    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;900&display=swap');\n" +
      '    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }\n' +
      '    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }\n' +
      '    img { -ms-interpolation-mode:bicubic; border:0; display:block; }\n' +
      "    body { margin:0; padding:0; background-color:#f0faff; font-family:'Nunito','Trebuchet MS',sans-serif; }\n" +
      '  </style>\n' +
      '</head>\n' +
      '<body style="margin:0; padding:0; background-color:#f0faff;">\n' +
      '\n' +
      '  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"\n' +
      '    style="background-color:#f0faff; padding:32px 0;">\n' +
      '    <tr>\n' +
      '      <td align="center">\n' +
      '\n' +
      '        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"\n' +
      '          style="max-width:600px; width:100%; background-color:#ffffff;\n' +
      '                 border-radius:16px; overflow:hidden;\n' +
      '                 box-shadow:0 6px 28px rgba(65,182,230,0.15);">\n' +
      '\n' +
      '          <tr>\n' +
      '            <td align="center" style="background-color:' + v.color1 + '; padding:30px 40px 0 40px;">\n' +
      '\n' +
      bloqueMarca + '\n' +
      '\n' +
      '              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">\n' +
      '                <tr>\n' +
      '                  <td align="center"\n' +
      '                    style="background-color:' + v.color2 + '; border-radius:8px 8px 0 0; padding:10px 24px;">\n' +
      "                    <p style=\"margin:0; font-family:'Nunito','Trebuchet MS',sans-serif;\n" +
      '                               font-size:12px; font-weight:700; color:#ffffff;\n' +
      '                               letter-spacing:2px; text-transform:uppercase;">\n' +
      '                      ' + Plantilla.e(v.franja) + '\n' +
      '                    </p>\n' +
      '                  </td>\n' +
      '                </tr>\n' +
      '              </table>\n' +
      '            </td>\n' +
      '          </tr>\n' +
      '\n' +
      '          <tr>\n' +
      '            <td style="padding:36px 48px 32px 48px;">\n' +
      '\n' +
      "              <p style=\"margin:0 0 16px 0; font-family:'Nunito','Trebuchet MS',sans-serif;\n" +
      '                         font-size:19px; color:' + v.color1 + '; line-height:1.35; font-weight:900;">\n' +
      '                ' + Plantilla.e(v.titulo) + '\n' +
      '              </p>\n' +
      '\n' +
      bloqueImagen + '\n' +
      '\n' +
      "              <p style=\"margin:16px 0 0 0; font-family:'Nunito','Trebuchet MS',sans-serif;\n" +
      '                         font-size:16px; color:#444444; line-height:1.75;">\n' +
      '                ' + Plantilla.e(v.desc) + '\n' +
      '              </p>\n' +
      '\n' +
      bloqueDetalles + '\n' +
      '\n' +
      divisor + '\n' +
      '\n' +
      bloqueCta + '\n' +
      '\n' +
      '              <table role="presentation" cellpadding="0" cellspacing="0" border="0"\n' +
      '                style="margin:0 0 24px 0;">\n' +
      '                <tr>\n' +
      '                  <td align="center"\n' +
      '                    style="background-color:#25d366; border-radius:50px;\n' +
      '                           box-shadow:0 4px 14px rgba(37,211,102,0.35);">\n' +
      '                    <a href="' + Plantilla.e(enlaceWa) + '"\n' +
      "                      style=\"display:inline-block; padding:13px 32px;\n" +
      "                             font-family:'Nunito','Trebuchet MS',sans-serif;\n" +
      '                             font-size:15px; font-weight:900;\n' +
      '                             color:#ffffff; text-decoration:none; letter-spacing:0.4px;">\n' +
      '                      ' + Plantilla.e(v.boton) + '\n' +
      '                    </a>\n' +
      '                  </td>\n' +
      '                </tr>\n' +
      '              </table>\n' +
      '\n' +
      "              <p style=\"margin:28px 0 4px 0; font-family:'Nunito','Trebuchet MS',sans-serif;\n" +
      '                         font-size:17px; font-weight:900; color:' + v.color1 + ';">\n' +
      '                ' + Plantilla.e(v.asesor) + '\n' +
      '              </p>\n' +
      "              <p style=\"margin:0; font-family:'Nunito','Trebuchet MS',sans-serif;\n" +
      '                         font-size:14px; color:#888888;">\n' +
      '                ' + Plantilla.e(v.equipo) + '\n' +
      '              </p>\n' +
      '            </td>\n' +
      '          </tr>\n' +
      '        </table>\n' +
      '      </td>\n' +
      '    </tr>\n' +
      '  </table>\n' +
      '</body>\n' +
      '</html>\n';
  }
};

export { Plantilla };