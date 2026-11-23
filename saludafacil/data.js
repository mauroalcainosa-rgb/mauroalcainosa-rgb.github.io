// SaludaFácil — catálogos y generador local (respaldo cuando la IA no responde)
// Sintaxis [tú|usted]: se resuelve según el nivel de formalidad.

export const OCCASIONS = [
  { id: 'navidad', name: 'Navidad', emoji: '🎄', c: ['#0f9d58', '#c62828'], kw: 'navidad pascua 25 diciembre fiestas viejito pascuero' },
  { id: 'cumpleanos', name: 'Cumpleaños', emoji: '🎂', c: ['#ff7a59', '#ffb347'], kw: 'cumple cumpleaños feliz dia años' },
  { id: 'aniversario', name: 'Aniversarios', emoji: '❤️', c: ['#e63946', '#ff8fab'], kw: 'aniversario años juntos pololeo' },
  { id: 'amor', name: 'Amor y amistad', emoji: '💕', c: ['#ff5d8f', '#b388ff'], kw: 'amor amistad san valentin 14 febrero amigo' },
  { id: 'familia', name: 'Familia', emoji: '👨‍👩‍👧', c: ['#43a047', '#9ccc65'], kw: 'familia familiar abuela abuelo primos' },
  { id: 'graduacion', name: 'Graduaciones', emoji: '🎓', c: ['#3949ab', '#5c6bc0'], kw: 'graduacion titulo egreso licenciatura universidad colegio' },
  { id: 'madre', name: 'Día de la Madre', emoji: '💐', c: ['#ec407a', '#f8bbd0'], kw: 'dia de la madre mama mamá' },
  { id: 'padre', name: 'Día del Padre', emoji: '👔', c: ['#1e88e5', '#4fc3f7'], kw: 'dia del padre papa papá' },
  { id: 'anonuevo', name: 'Año Nuevo', emoji: '🥂', c: ['#6a1b9a', '#ffca28'], kw: 'año nuevo fin de año 31 diciembre' },
  { id: 'matrimonio', name: 'Matrimonios', emoji: '💍', c: ['#8d6e63', '#d7ccc8'], kw: 'matrimonio boda casamiento novios' },
  { id: 'mujer', name: 'Día de la Mujer', emoji: '🌷', c: ['#8e24aa', '#f06292'], kw: 'dia de la mujer 8 marzo' },
  { id: 'logros', name: 'Felicitaciones y logros', emoji: '🏆', c: ['#f9a825', '#ff7043'], kw: 'felicitaciones logro ascenso nuevo trabajo exito' },
  { id: 'gracias', name: 'Agradecimientos', emoji: '🙏', c: ['#00897b', '#4db6ac'], kw: 'gracias agradecimiento agradecer' },
  { id: 'condolencias', name: 'Condolencias', emoji: '🕊️', c: ['#546e7a', '#90a4ae'], kw: 'condolencias pesame fallecimiento duelo' },
  { id: 'buenosdias', name: 'Buenos días', emoji: '☀️', c: ['#ffb300', '#ffe082'], kw: 'buenos dias mañana' },
  { id: 'buenasnoches', name: 'Buenas noches', emoji: '🌙', c: ['#283593', '#7986cb'], kw: 'buenas noches dormir' },
  { id: 'otras', name: 'Otras ocasiones', emoji: '🎉', c: ['#00acc1', '#7c4dff'], kw: 'otra ocasion mejorate recuperacion bienvenida despedida jubilacion' },
];

export const RECIPIENTS = [
  { id: 'pareja', name: 'Pareja', term: 'mi amor', formal: false },
  { id: 'esposo', name: 'Esposo/a', term: 'mi amor', formal: false },
  { id: 'novio', name: 'Novio/a', term: 'mi vida', formal: false },
  { id: 'mama', name: 'Mamá', term: 'mamá', formal: false },
  { id: 'papa', name: 'Papá', term: 'papá', formal: false },
  { id: 'hijo', name: 'Hijo/a', term: '', formal: false },
  { id: 'hermano', name: 'Hermano/a', term: '', formal: false },
  { id: 'amigo', name: 'Amigo/a', term: '', formal: false },
  { id: 'colega', name: 'Compañero/a de trabajo', term: '', formal: false },
  { id: 'jefe', name: 'Jefe/a', term: '', formal: true },
  { id: 'cliente', name: 'Cliente', term: '', formal: true },
  { id: 'familiar', name: 'Familiar', term: '', formal: false },
  { id: 'otro', name: 'Otra persona', term: '', formal: false },
];

export const STYLES = [
  { id: 'emotivo', name: 'Emotivo y cariñoso', emoji: '🥹' },
  { id: 'divertido', name: 'Divertido y con humor', emoji: '😂' },
  { id: 'elegante', name: 'Elegante y formal', emoji: '🎩' },
  { id: 'romantico', name: 'Romántico', emoji: '🌹' },
  { id: 'inspirador', name: 'Inspirador', emoji: '✨' },
  { id: 'original', name: 'Original y creativo', emoji: '🎨' },
  { id: 'breve', name: 'Breve y directo', emoji: '⚡' },
  { id: 'espontaneo', name: 'Espontáneo y cercano', emoji: '😊' },
];

export const LENGTHS = [
  { id: 'muycorto', name: 'Muy corto' },
  { id: 'corto', name: 'Corto' },
  { id: 'mediano', name: 'Mediano' },
  { id: 'largo', name: 'Largo y emotivo' },
];

// Núcleos por ocasión: deseo central
const CORE = {
  navidad: [
    'Que esta Navidad [te|le] encuentre con cariño alrededor, mesa llena y cero apuros.',
    '[Te|Le] deseo una Navidad tranquila, con abrazos de verdad y tiempo para lo que importa.',
    'Que la magia de estas fiestas llegue a [tu|su] casa y se quede todo el año.',
    'Feliz Navidad. Que no falte la paz, la buena compañía ni el pan de pascua.',
    'Que esta Nochebuena sea de esas que después se recuerdan con una sonrisa.',
    'En esta Navidad quiero agradecer[te|le] por estar. Que [tu|su] hogar se llene de luz.',
  ],
  cumpleanos: [
    '¡Feliz cumpleaños! Que este nuevo año [te|le] traiga salud, buenas noticias y muchas ganas de celebrar.',
    'Hoy se celebra a alguien que hace mejor la vida de los demás. ¡Feliz cumpleaños!',
    'Que cumplas muchos más, y que cada uno venga con más risas que el anterior.',
    '[Te|Le] deseo un cumpleaños a [tu|su] medida: con la gente que [quieres|quiere] y sin nada pendiente.',
    'Un año más de vida es un año más de historias. Que este venga cargado de las buenas.',
    '¡Feliz día! Que los sueños que [tienes|tiene] en carpeta empiecen a cumplirse este año.',
  ],
  aniversario: [
    'Feliz aniversario. Cada año a [tu|su] lado confirma que elegí bien.',
    'Celebramos un año más de historia juntos, y lo mejor es que seguimos escribiéndola.',
    'Gracias por cada día compartido, por los buenos y por los que sacamos adelante juntos.',
    'Un aniversario más, y sigo con las mismas ganas de verte llegar a casa.',
    'No sé cómo pasó tan rápido el tiempo, pero sé que quiero muchos años más contigo.',
    'Feliz aniversario. Que nunca nos falten las ganas de reírnos juntos.',
  ],
  amor: [
    'Solo quería recordar[te|le] lo importante que [eres|es] para mí.',
    'Hay personas que hacen la vida más liviana. Tú eres una de ellas.',
    'Gracias por estar siempre, incluso cuando no hace falta pedirlo.',
    'Que nunca falte esta amistad: de las que se cuidan y se celebran.',
    'Tenerte cerca es de esas suertes que no se compran.',
    'Hoy es un buen día para decirte que te quiero, así, sin motivo especial.',
  ],
  familia: [
    'La familia es el lugar al que siempre se vuelve. Gracias por ser parte de la mía.',
    'Que nunca nos falten las sobremesas largas ni las ganas de juntarnos.',
    'Qué suerte compartir la vida con una familia como esta.',
    'Aunque la distancia o el tiempo apuren, el cariño de familia no se pierde.',
    'Gracias por las risas, los consejos y hasta los retos. Todo suma.',
    'Un abrazo grande para la familia: lo mejor que tenemos.',
  ],
  graduacion: [
    '¡Felicitaciones por [tu|su] graduación! Todo el esfuerzo valió la pena.',
    'Hoy se cierra una etapa y se abre una llena de oportunidades. ¡A brillar!',
    'Tanto estudio, tantas noches largas… y aquí está el resultado. ¡Felicitaciones!',
    'Este título es [tuyo|suyo], pero el orgullo es compartido. ¡Bien merecido!',
    'Que este logro sea el primero de muchos. El mundo necesita gente como [tú|usted].',
    'Felicitaciones, [profesional|profesional]. Lo que viene será todavía mejor.',
  ],
  madre: [
    'Feliz Día de la Madre. Gracias por cuidarme incluso cuando no me daba cuenta.',
    'Mamá, todo lo bueno que tengo empezó contigo. Feliz día.',
    'Hoy y siempre: gracias por tu amor infinito y tu paciencia de santa.',
    'Para la mujer que me enseñó a levantarme cada vez: feliz Día de la Madre.',
    'No hay regalo que alcance para agradecerte, pero empiezo con un abrazo enorme.',
    'Feliz día a la mejor mamá. Tu cariño es mi lugar seguro.',
  ],
  padre: [
    'Feliz Día del Padre. Gracias por enseñarme con el ejemplo.',
    'Papá, gracias por cada consejo, cada esfuerzo y cada asado. Feliz día.',
    'Hoy celebro al hombre que me enseñó a no rendirme. Feliz Día del Padre.',
    'Gracias por estar siempre, incluso en silencio. Feliz día, papá.',
    'Todo lo que soy tiene un poquito de ti. Feliz Día del Padre.',
    'Para mi primer héroe: feliz día, con todo el cariño del mundo.',
  ],
  anonuevo: [
    '¡Feliz Año Nuevo! Que este año [te|le] traiga salud, calma y muchas alegrías.',
    'Que el año que empieza venga con buenas noticias y metas cumplidas.',
    'Brindo por [ti|usted] y por todo lo bueno que viene. ¡Feliz Año Nuevo!',
    'Doce uvas, doce deseos: que se cumplan todos los [tuyos|suyos].',
    'Que este nuevo año sea más liviano, más alegre y lleno de oportunidades.',
    'Gracias por compartir este año. Que el próximo nos encuentre igual de unidos.',
  ],
  matrimonio: [
    '¡Felicidades a los novios! Que este sea el comienzo de una vida llena de complicidad.',
    'Que el amor que hoy celebran crezca con cada año que pase.',
    'Brindo por un matrimonio con mucha paciencia, mucho humor y mucho amor.',
    'Que nunca les falte el respeto, la ternura ni las ganas de seguir eligiéndose.',
    'Hoy empieza la mejor aventura. ¡Felicidades a los dos!',
    'Que su hogar sea siempre un lugar de paz y alegría. ¡Vivan los novios!',
  ],
  mujer: [
    'Feliz Día de la Mujer. Gracias por [tu|su] fuerza, [tu|su] ejemplo y [tu|su] voz.',
    'Hoy celebro a una mujer admirable que inspira a quienes [la] rodean.',
    'Que nunca falten los espacios para que [brilles|brille] como [te|se] lo merece.',
    'Un saludo afectuoso en este día, con admiración y respeto por todo lo que [haces|hace].',
    '8 de marzo: un día para reconocer, agradecer y seguir avanzando juntas y juntos.',
    'Gracias por demostrar cada día que no hay meta imposible.',
  ],
  logros: [
    '¡Felicitaciones! Este logro es el resultado de [tu|su] esfuerzo y talento.',
    'Qué alegría ver cómo [cosechas|cosecha] lo que [has|ha] sembrado. ¡Bien merecido!',
    'Felicitaciones por este paso tan importante. ¡Vamos por más!',
    'Sabía que lo [ibas|iba] a lograr. Hoy toca celebrar en grande.',
    '[Tu|Su] dedicación tiene premio. Felicitaciones de corazón.',
    'Un aplauso de pie para [ti|usted]: lo [hiciste|hizo] increíble.',
  ],
  gracias: [
    'Muchas gracias por [tu|su] apoyo. Hizo una diferencia enorme.',
    'Quería agradecer[te|le] de corazón por estar cuando más lo necesitaba.',
    'Gracias por [tu|su] generosidad. Gestos así no se olvidan.',
    'No siempre lo digo, pero agradezco mucho todo lo que [haces|hace].',
    'Gracias por [tu|su] tiempo y [tu|su] buena disposición. Lo valoro de verdad.',
    'Mil gracias. [Eres|Es] de esas personas que hacen todo más fácil.',
  ],
  condolencias: [
    'Lamento profundamente [tu|su] pérdida. [Te|Le] acompaño con cariño en este momento.',
    'Mis más sinceras condolencias. Que el recuerdo de quien partió [te|le] dé consuelo.',
    'No hay palabras suficientes, pero quiero que [sepas|sepa] que [cuentas|cuenta] conmigo para lo que sea.',
    'Un abrazo apretado en este momento tan difícil. Aquí estoy para lo que [necesites|necesite].',
    'Que la paz y el amor de quienes [te|le] rodean [te|le] acompañen en estos días.',
    'Sentimos mucho [tu|su] pérdida. Su recuerdo seguirá vivo en quienes lo quisieron.',
  ],
  buenosdias: [
    '¡Buenos días! Que hoy todo [te|le] salga mejor de lo planeado.',
    'Buen día. Café en mano y a conquistar la jornada.',
    'Que esta mañana empiece con energía y termine con una buena noticia.',
    '¡Arriba ese ánimo! Hoy es un buen día para que pasen cosas buenas.',
    'Buenos días. Que el sol de hoy [te|le] contagie su buena onda.',
    'Un saludo para partir bien el día. ¡Éxito en todo!',
  ],
  buenasnoches: [
    'Buenas noches. Que [descanses|descanse] y mañana [despiertes|despierte] con energía.',
    'Que la noche sea tranquila y los sueños bonitos.',
    'Cierra los ojos con calma: hoy lo [hiciste|hizo] bien. Buenas noches.',
    'Dulces sueños. Mañana será otro gran día.',
    'Buenas noches. Gracias por ser parte de mi día.',
    'Que descanses rico. Mañana seguimos.',
  ],
  otras: [
    'Un saludo especial con mucho cariño para [ti|usted].',
    'Quería enviar[te|le] buenos deseos y recordar[te|le] que [te|le] tengo presente.',
    'Que todo lo que viene sea para bien. ¡Un abrazo grande!',
    'Este mensaje es solo para decir[te|le] que [eres|es] importante.',
    'Mucho éxito en esta nueva etapa. ¡Lo mejor está por venir!',
    'Con todo el cariño, para alguien que vale la pena saludar.',
  ],
};

const HUMOR = {
  navidad: ['Que el Viejito Pascuero [te|le] traiga todo lo que pediste… y que la tarjeta de crédito sobreviva a enero.', 'Feliz Navidad. Este año me porté regular, así que el regalo es este mensaje con mucho cariño.', 'Que la cola de mono sea abundante y el pan de pascua no venga sin frutas.'],
  cumpleanos: ['¡Feliz cumpleaños! No estás más grande, estás en edición de colección.', 'Un año más y sigues igual de joven… según la luz y el ángulo correcto.', 'Feliz cumple: hoy se permite comer torta al desayuno, almuerzo y once.'],
  aniversario: ['Feliz aniversario a la única persona que aguanta mis chistes malos y además se ríe.', 'Un año más juntos y todavía no te aburres de mí. Eso merece medalla.', 'Feliz aniversario. Tú tienes paciencia y yo tengo suerte: equipo perfecto.'],
  amor: ['Eres la persona con la que compartiría hasta la última papa frita. Y eso es amor.', 'Amigos como tú no se encuentran, se soportan con cariño.', 'Te quiero más que al wifi cuando anda rápido.'],
  familia: ['Familia: los únicos que conocen todas tus versiones y aun así te invitan al asado.', 'Que nunca falten los almuerzos familiares… ni el tío que opina de todo.', 'Somos una familia normal: ruidosa, querendona y siempre con comida de más.'],
  graduacion: ['¡Te graduaste! Ahora sí: a responder "¿y cuándo empiezas a trabajar?".', 'Felicitaciones: oficialmente se acabaron las excusas de "estoy en pruebas".', 'Tanto estudiar para que ahora te pidan experiencia. ¡Pero lo vas a lograr!'],
  madre: ['Feliz día, mamá: gracias por saber siempre dónde están las cosas que yo no encuentro.', 'Mamá, perdón por todos los "ya voy" que nunca fueron. Feliz día.', 'Feliz Día de la Madre a la única persona que me reta y me cuida en la misma frase.'],
  padre: ['Feliz día, papá: experto en asados, controles remotos y chistes que solo tú entiendes.', 'Gracias, papá, por enseñarme que todo se arregla con cinta adhesiva y paciencia.', 'Feliz Día del Padre al campeón mundial de "pregúntale a tu mamá".'],
  anonuevo: ['Este año sí: dieta, gimnasio y ahorro… a partir del lunes. ¡Feliz Año Nuevo!', 'Que el nuevo año traiga más vacaciones que reuniones.', 'Feliz Año Nuevo. Prometo cumplir al menos uno de mis propósitos.'],
  matrimonio: ['Felicidades: desde hoy, el control remoto se negocia de a dos.', 'Que su matrimonio dure más que la fila del registro civil.', 'Bienvenidos a la vida de casados: compartirlo todo, incluso las frazadas.'],
  mujer: ['Feliz Día de la Mujer a quien hace diez cosas a la vez y todavía se acuerda de los cumpleaños.', 'Hoy y siempre: que nadie [te|le] explique lo que ya [sabes|sabe] de sobra.', 'Feliz día a una mujer con más energía que el café de la mañana.'],
  logros: ['¡Felicitaciones! Ahora te toca invitar a celebrar, son las reglas.', 'Sabía que ibas a lograrlo. Bueno, al menos lo sospechaba fuerte.', 'Tremendo logro. Ya me imagino el post en LinkedIn.'],
  gracias: ['Gracias infinitas. Te debo una… y probablemente otra más adelante.', 'Gracias por salvarme el día. Eres mi superhéroe sin capa.', 'Mil gracias. Te invito un café, o dos si no reclamas.'],
  condolencias: [],
  buenosdias: ['Buenos días. El café ya hizo su parte, ahora te toca a ti.', '¡Arriba! Que el lunes no se vence solo… aunque sea martes.', 'Buen día. Hoy vas a rendir más que el gato del vecino.'],
  buenasnoches: ['Buenas noches. Suelta el celular… después de leer esto.', 'A dormir, que mañana el despertador no perdona.', 'Que sueñes bonito y sin el despertador sonando a las 6.'],
  otras: ['Este mensaje viene con abrazo incluido, sin costo de envío.', 'Pasaba por aquí a dejarte buena onda. Recíbela sin devolución.', 'Saludo especial de alguien que te aprecia más de lo que dice.'],
};

const OPENERS = {
  emotivo: ['{n}, con todo mi cariño:', 'Para ti, {n}:', '{n}, desde el corazón:'],
  divertido: ['¡Atención, {n}!', '{n}, noticia de última hora:', 'Ojo, {n}:'],
  elegante: ['{n}:', 'Para {n}:', 'Con aprecio, {n}:'],
  romantico: ['{n}, amor mío:', 'Para ti, {n}:', '{n}, mi lugar favorito:'],
  inspirador: ['{n}, recuerda esto:', '{n}:', 'Para ti, {n}, que no se rinde:'],
  original: ['{n}, este mensaje viajó directo a ti:', '{n}, una pequeña carta digital:', '{n}, te escribo en clave de buena onda:'],
  breve: ['{n}:', '{n},', ''],
  espontaneo: ['¡Hola, {n}!', '{n}, ¿cómo va todo?', 'Hey, {n}:'],
};

const EXTRAS = {
  emotivo: ['Gracias por todo lo que entregas sin pedir nada a cambio.', 'Ojalá [sientas|sienta] hoy todo el cariño que [te|le] tenemos.', 'Personas como [tú|usted] hacen que la vida valga la pena.'],
  divertido: ['Prometo celebrarlo como corresponde (o al menos intentarlo).', 'Y si alguien pregunta, esto lo escribí sin ayuda.', 'Que la buena onda [te|le] persiga como el olor a empanada en septiembre.'],
  elegante: ['Reciba mis mejores deseos y mi especial consideración.', 'Es un gusto poder expresarle estas palabras.', 'Le hago llegar un afectuoso saludo junto a mis mejores deseos.'],
  romantico: ['Contigo todo tiene más sentido.', 'Eres mi persona favorita, en todos los idiomas.', 'Cada día a tu lado es mi mejor plan.'],
  inspirador: ['Lo mejor todavía está por llegar.', 'Cada paso que das abre un camino nuevo.', 'Que nunca se apague esa fuerza que [te|le] hace especial.'],
  original: ['Si este saludo fuera canción, sería de las que se repiten todo el día.', 'Ingredientes de este mensaje: cariño, buenos deseos y una pizca de nostalgia.', 'Este saludo viene con garantía extendida de buena onda.'],
  breve: ['Un abrazo.', 'Todo lo mejor.', '¡Éxito!'],
  espontaneo: ['Te mando un abrazo apretado.', 'Ojalá nos veamos pronto para celebrarlo.', 'Acá estoy para lo que necesites.'],
};

const CLOSERS = {
  emotivo: ['Con todo mi cariño.', 'Te quiero mucho.', 'Un abrazo enorme.'],
  divertido: ['¡Salud! 🥳', 'Atte.: tu fan número uno.', 'Fin del comunicado. 😄'],
  elegante: ['Afectuosamente.', 'Con mis más cordiales saludos.', 'Atentamente.'],
  romantico: ['Te amo.', 'Siempre contigo.', 'Con todo mi amor.'],
  inspirador: ['¡Vamos con todo!', 'A seguir brillando.', 'El mundo es [tuyo|suyo].'],
  original: ['Firmado con tinta invisible de cariño.', 'Enviado con una sonrisa.', 'Este mensaje se autodestruirá… nunca.'],
  breve: ['', '', ''],
  espontaneo: ['¡Un abrazo!', 'Cuídate mucho.', 'Nos vemos pronto.'],
};

const SAD_EXTRAS = ['Que los buenos recuerdos [te|le] acompañen en estos días.', 'Ojalá [encuentres|encuentre] consuelo en el cariño de quienes [te|le] rodean.', 'Cuenta conmigo para lo que [necesites|necesite], en cualquier momento.'];

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
export const resolveForm = (t, formal) => t.replace(/\[([^|\]]*)\|([^\]]*)\]/g, (_, a, b) => (formal ? b : a));

export function localGenerate(o) {
  const rec = RECIPIENTS.find((r) => r.id === o.recipient) || RECIPIENTS[RECIPIENTS.length - 1];
  const style = o.style || 'espontaneo';
  const formal = rec.formal || style === 'elegante';
  const occ = o.occasion || 'otras';
  const name = (o.nickname || o.name || rec.term || '').trim();
  let pool = CORE[occ] || CORE.otras;
  if (style === 'divertido' && HUMOR[occ] && HUMOR[occ].length) pool = [...HUMOR[occ], ...pool.slice(0, 2)];
  const cores = shuffle(pool).slice(0, 3);
  const sad = occ === 'condolencias';
  const st = sad && style === 'divertido' ? 'emotivo' : style;
  const ext = shuffle(sad ? SAD_EXTRAS : (EXTRAS[st] || EXTRAS.emotivo));
  return cores.map((core, i) => {
    const parts = [];
    const op = rnd(OPENERS[st]);
    const withName = name && op ? op.replace('{n}', name.charAt(0).toUpperCase() + name.slice(1)) : '';
    const len = o.length || 'corto';
    if (len !== 'muycorto' && withName) parts.push(withName);
    parts.push(core);
    if (len === 'mediano' || len === 'largo') parts.push(ext[i % ext.length]);
    if (len === 'largo') {
      if (o.memory) parts.push(sad ? `Siempre llevaré conmigo el recuerdo de ${o.memory.replace(/\.$/, '')}.` : `Todavía me acuerdo de ${o.memory.replace(/\.$/, '')}, y me saca una sonrisa cada vez.`);
      parts.push(ext[(i + 1) % ext.length]);
    } else if (o.memory && len === 'mediano' && i === 0) parts.push(`Y cómo olvidar ${o.memory.replace(/\.$/, '')}.`);
    if (o.phrase) parts.push(o.phrase.trim());
    if (len !== 'muycorto' && len !== 'corto') { const c = sad ? rnd(['Con cariño y respeto.', 'Un abrazo apretado.', 'Aquí estoy.']) : rnd(CLOSERS[st]); if (c) parts.push(c); }
    if (o.signature) parts.push(`— ${o.signature.trim()}`);
    let text = parts.join(len === 'muycorto' || len === 'corto' ? ' ' : '\n\n');
    if (len === 'muycorto' && !o.signature && !o.phrase) text = core;
    return resolveForm(text, formal).replace(/\s+([.,:!?])/g, '$1').replace(/\bde el\b/g, 'del');
  });
}

export function localImprove(text, style = 'emotivo') {
  let t = text.trim().replace(/\s+/g, ' ');
  if (!t) return [];
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.!?…]$/.test(t)) t += '.';
  const st = STYLES.find((s) => s.id === style) ? style : 'emotivo';
  const e = shuffle(EXTRAS[st]);
  const c = shuffle(CLOSERS[st].filter(Boolean).length ? CLOSERS[st] : ['Un abrazo.']);
  return [
    resolveForm(`${t} ${e[0]}`, st === 'elegante'),
    resolveForm(`${t}\n\n${e[1]} ${c[0] || ''}`.trim(), st === 'elegante'),
    resolveForm(`${t.replace(/\.$/, '')}, ${e[2].charAt(0).toLowerCase() + e[2].slice(1)} ${c[1] || ''}`.trim(), st === 'elegante'),
  ];
}

// Plantillas de tarjetas: bg (gradiente), fg, font, pattern, premium
export const TEMPLATES = [
  { id: 'ele1', cat: 'Elegante', name: 'Noche dorada', bg: ['#1b1b2f', '#3a3a5e'], fg: '#f5d77a', font: 'Playfair Display', pattern: 'frame' },
  { id: 'ele2', cat: 'Elegante', name: 'Marfil', bg: ['#fbf7ef', '#efe4cf'], fg: '#5b4636', font: 'Playfair Display', pattern: 'frame' },
  { id: 'min1', cat: 'Minimalista', name: 'Blanco puro', bg: ['#ffffff', '#f3f4f6'], fg: '#111827', font: 'Montserrat', pattern: 'line' },
  { id: 'min2', cat: 'Minimalista', name: 'Salvia', bg: ['#e8efe9', '#d4e2d6'], fg: '#2f4f3a', font: 'Montserrat', pattern: 'none' },
  { id: 'div1', cat: 'Divertido', name: 'Confeti', bg: ['#ffef5c', '#ff9f43'], fg: '#2d1b69', font: 'Baloo 2', pattern: 'confetti' },
  { id: 'div2', cat: 'Divertido', name: 'Pop', bg: ['#00d2ff', '#ff4ecd'], fg: '#ffffff', font: 'Baloo 2', pattern: 'dots' },
  { id: 'rom1', cat: 'Romántico', name: 'Corazones', bg: ['#ff9a9e', '#fecfef'], fg: '#7a1034', font: 'Dancing Script', pattern: 'hearts' },
  { id: 'rom2', cat: 'Romántico', name: 'Vino', bg: ['#5f0a2b', '#a4133c'], fg: '#ffe5ec', font: 'Dancing Script', pattern: 'hearts', premium: true },
  { id: 'inf1', cat: 'Infantil', name: 'Arcoíris', bg: ['#a1ffce', '#faffd1'], fg: '#ff4d6d', font: 'Baloo 2', pattern: 'stars' },
  { id: 'inf2', cat: 'Infantil', name: 'Globos', bg: ['#cdb4db', '#bde0fe'], fg: '#3a0ca3', font: 'Baloo 2', pattern: 'balloons' },
  { id: 'mod1', cat: 'Moderno', name: 'Degradé', bg: ['#7f5af0', '#2cb67d'], fg: '#ffffff', font: 'Montserrat', pattern: 'blobs' },
  { id: 'mod2', cat: 'Moderno', name: 'Coral', bg: ['#ff6b6b', '#feca57'], fg: '#ffffff', font: 'Poppins', pattern: 'blobs' },
  { id: 'vin1', cat: 'Vintage', name: 'Postal', bg: ['#f4e1c1', '#e0c097'], fg: '#6b3e26', font: 'Caveat', pattern: 'stripes' },
  { id: 'vin2', cat: 'Vintage', name: 'Retro', bg: ['#2a9d8f', '#e9c46a'], fg: '#264653', font: 'Caveat', pattern: 'stripes', premium: true },
  { id: 'nav1', cat: 'Navideño', name: 'Nieve', bg: ['#0b3d2e', '#14532d'], fg: '#ffffff', font: 'Playfair Display', pattern: 'snow' },
  { id: 'nav2', cat: 'Navideño', name: 'Rojo pascuero', bg: ['#b71c1c', '#e53935'], fg: '#fff8e1', font: 'Dancing Script', pattern: 'snow' },
  { id: 'pre1', cat: 'Premium', name: 'Mármol', bg: ['#f8f9fa', '#dee2e6'], fg: '#212529', font: 'Playfair Display', pattern: 'marble', premium: true },
  { id: 'pre2', cat: 'Premium', name: 'Galaxia', bg: ['#0f0c29', '#302b63'], fg: '#f8f0ff', font: 'Poppins', pattern: 'stars', premium: true },
  { id: 'ilu1', cat: 'Ilustrado', name: 'Jardín', bg: ['#fdf6e3', '#fde2e4'], fg: '#3d405b', font: 'Caveat', pattern: 'flowers' },
  { id: 'ilu2', cat: 'Ilustrado', name: 'Fiesta', bg: ['#fff1e6', '#ffd6a5'], fg: '#6a040f', font: 'Baloo 2', pattern: 'balloons', premium: true },
];

export const STICKERS = ['🎉', '🎂', '🎁', '❤️', '💕', '🌹', '🌷', '⭐', '✨', '🎈', '🥂', '🎄', '❄️', '🎓', '🏆', '🙏', '🕊️', '☀️', '🌙', '😂', '🥳', '😍', '🐶', '🍰', '☕', '🌈', '🔥', '💐'];
export const FONTS = ['Poppins', 'Montserrat', 'Playfair Display', 'Dancing Script', 'Baloo 2', 'Caveat'];
export const OCC_TEMPLATE = { navidad: 'nav1', cumpleanos: 'div1', aniversario: 'rom1', amor: 'rom1', familia: 'ilu1', graduacion: 'ele1', madre: 'ilu1', padre: 'min2', anonuevo: 'ele1', matrimonio: 'ele2', mujer: 'mod1', logros: 'mod2', gracias: 'min1', condolencias: 'ele2', buenosdias: 'mod2', buenasnoches: 'ele1', otras: 'div2' };
