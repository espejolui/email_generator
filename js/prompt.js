import { Config } from './config.js';

const Prompt = {
  construir: function (titulo, desc, empresa) {
    const lineas = ['Crea una imagen publicitaria para un email marketing con los estilos: fotografía publicitaria profesional, personas realizando la actividad del curso, luz natural, colores vibrantes, composición equilibrada.'];
    lineas.push('');
    lineas.push('DATOS DEL CURSO:');
    lineas.push('Empresa: "' + (empresa || 'a definir') + '"');
    lineas.push('Título: "' + (titulo || 'a definir') + '"');
    lineas.push('Descripción del curso: "' + (desc || 'a definir') + '"');
    lineas.push('Dimensiones de la imagen: ' + Config.DIMENSIONES_IMAGEN + '.');
    lineas.push('');
    lineas.push('REGLAS IMPORTANTES:');
    lineas.push('1. NO incluyas ningún texto, palabra, letra, número ni marca de agua en la imagen. El título y la descripción van por separado, no se escriben en la imagen.');
    lineas.push('2. Genera la imagen exactamente en las dimensiones indicadas: ancho 1376 píxeles, alto 768 píxeles.');
    return lineas.join('\n');
  }
};

export { Prompt };