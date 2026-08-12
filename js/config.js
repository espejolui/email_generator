const Config = {
  CLAVE: 'generador_email',
  COOKIE_DIAS: 30,

  valoresDefecto: {
    titulo: '',
    empresa: '',
    franja: '',
    desc: '',
    mod: '',
    clases: '',
    dur: '',
    horario: '',
    fecha: '',
    inv: '',
    img: '',
    cta: '',
    boton: 'Escríbeme por WhatsaApp',
    wa: '3224418087',
    msg: '',
    asesor: 'Pepito Perez',
    equipo: '',
    color1: '#41b6e6',
    color2: '#8de1f7'
  },

  requeridos: [
    ['f-empresa', 'Nombre de la empresa'],
    ['f-titulo', 'Título del email'],
    ['f-franja', 'Sede'],
    ['f-desc', 'Descripción'],
    ['f-mod', 'Modalidad'],
    ['f-dur', 'Duración'],
    ['f-horario', 'Horario en vivo'],
    ['f-fecha', 'Fecha de inicio'],
    ['f-inv', 'Inversión'],
    ['f-img', 'Link de la imagen'],
    ['f-asesor', 'Asesor'],
    ['f-equipo', 'Equipo'],
    ['f-wa', 'Número de WhatsApp']
  ],

  opcionesSede: ['Cesap', 'Chapinero', 'Sesiones virtuales'],
  opcionesModalidad: [['Presencial', 'Presencial'], ['Virtual', 'Sesiones virtuales']],
  numeroClases: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],

  DIAS: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  MESES: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],

  DIMENSIONES_IMAGEN: '1376 x 768 píxeles (horizontal, 16:9)'
};

export { Config };
