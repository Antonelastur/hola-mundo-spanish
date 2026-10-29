/*
 * Conținutul lecției „¿Dónde está?”
 *
 * Acest fișier conține doar date: vocabular, zone, sarcini și mesaje de feedback.
 * Poate fi editat fără a modifica logica aplicației (folderul js/).
 *
 * Reguli de editare:
 *  - Identificatorii (libro, mesa, encima_mesa etc.) leagă datele între ele.
 *    Dacă schimbi un identificator, schimbă-l peste tot.
 *  - Geometria zonelor (unde se află în scenă) este în js/scene-layout.js.
 *    Aici stabilim doar ce înseamnă fiecare zonă.
 *  - „escena” descrie unde stă fiecare obiect la începutul unei sarcini.
 *    Obiectele care lipsesc din „escena” rămân pe poziția din „escenaInicial”.
 *  - În mesaje, {cuvant} este înlocuit automat (vezi lista de la „mensajes”).
 */
window.DE = window.DE || {};

window.DE.LECCION = {
  id: 'donde-esta',
  titulo: '¿Dónde está?',
  subtitulo: 'Unde se află obiectele? Lecție introductivă de limba spaniolă',
  nivel: 'Începători (A1), clasa a V-a',
  objetivos: [
    'Recunoști denumirea în spaniolă a câtorva obiecte școlare.',
    'Înțelegi și folosești: encima de, debajo de, dentro de, al lado de.',
    'Spui unde se află un obiect: „El libro está encima de la mesa.”'
  ],

  // Prepozițiile exersate. „es” este forma folosită în propoziție.
  preposiciones: {
    encima: {
      es: 'encima de',
      ro: 'pe, deasupra',
      explicacion: '„Encima de” arată că obiectul stă pe partea de sus a altui obiect.'
    },
    debajo: {
      es: 'debajo de',
      ro: 'sub, dedesubt',
      explicacion: '„Debajo de” arată că obiectul se află sub alt obiect.'
    },
    dentro: {
      es: 'dentro de',
      ro: 'în, înăuntru',
      explicacion: '„Dentro de” arată că obiectul este în interiorul altui obiect.'
    },
    al_lado: {
      es: 'al lado de',
      ro: 'lângă, alături de',
      explicacion: '„Al lado de” arată că obiectul stă lângă alt obiect, nu pe el și nici în el.'
    }
  },
  ordenPreposiciones: ['encima', 'debajo', 'dentro', 'al_lado'],

  // Notă de gramatică afișată în activitatea de explorare.
  notaGramatica: 'Atenție: de + el = del. Spunem „al lado de la mesa”, dar „al lado del libro”.',

  // Obiectele fixe din scenă, față de care descriem poziția.
  // „articulo” este folosit pentru contracția de + el = del.
  referencias: {
    mesa: { es: 'la mesa', articulo: 'la', ro: 'masa', roScurt: 'masă' },
    caja: { es: 'la caja', articulo: 'la', ro: 'cutia', roScurt: 'cutie' }
  },

  // Obiectele pe care elevul le poate muta.
  // „forma” și „color” sunt folosite de scena 3D și de varianta 2D.
  objetos: {
    libro:  { es: 'el libro',  ro: 'cartea',  forma: 'libro',  color: '#2f5fb3' },
    lapiz:  { es: 'el lápiz',  ro: 'creionul', forma: 'lapiz',  color: '#e8b923' },
    goma:   { es: 'la goma',   ro: 'radiera', forma: 'goma',   color: '#e07a9a' },
    pelota: { es: 'la pelota', ro: 'mingea',  forma: 'pelota', color: '#2e9e5b' }
  },
  ordenObjetos: ['libro', 'lapiz', 'goma', 'pelota'],

  // Zonele de plasare. Fiecare zonă = o prepoziție + un obiect de referință.
  // „ro” este eticheta butonului de poziționare (în română, ca elevul să
  // înțeleagă instrucțiunea spaniolă, nu doar să copieze cuvintele).
  zonas: {
    encima_mesa: { preposicion: 'encima',  referencia: 'mesa', ro: 'pe masă' },
    debajo_mesa: { preposicion: 'debajo',  referencia: 'mesa', ro: 'sub masă' },
    lado_mesa:   { preposicion: 'al_lado', referencia: 'mesa', ro: 'lângă masă' },
    dentro_caja: { preposicion: 'dentro',  referencia: 'caja', ro: 'în cutie' },
    lado_caja:   { preposicion: 'al_lado', referencia: 'caja', ro: 'lângă cutie' }
  },
  ordenZonas: ['encima_mesa', 'debajo_mesa', 'lado_mesa', 'dentro_caja', 'lado_caja'],

  // Poziția obiectelor la deschiderea lecției.
  escenaInicial: {
    libro: 'encima_mesa',
    lapiz: 'dentro_caja',
    goma: 'debajo_mesa',
    pelota: 'lado_caja'
  },

  actividades: {
    exploracion: {
      titulo: '1. Explorare',
      instrucciones: 'Apasă pe un obiect din scenă sau din listă. Vei vedea cum se numește în spaniolă și unde se află. Poți muta obiectele ca să vezi cum se schimbă propoziția.',
      instruccionesPreposiciones: 'Apasă pe o prepoziție ca să vezi în scenă zona pe care o descrie.'
    },

    comprension: {
      titulo: '2. Înțelegere',
      instrucciones: 'Citește instrucțiunea în spaniolă. Mută obiectul cerut: trage-l cu mouse-ul (sau cu degetul) în scenă ori selectează-l și alege un loc din butoane. Apoi apasă „Verifică”.',
      tareas: [
        {
          id: 'c1', tipo: 'colocar', objeto: 'lapiz', zona: 'encima_mesa',
          instruccion: 'Pon el lápiz encima de la mesa.',
          traduccion: 'Pune creionul pe masă.'
        },
        {
          id: 'c2', tipo: 'colocar', objeto: 'pelota', zona: 'debajo_mesa',
          instruccion: 'Pon la pelota debajo de la mesa.',
          traduccion: 'Pune mingea sub masă.'
        },
        {
          id: 'c3', tipo: 'colocar', objeto: 'goma', zona: 'dentro_caja',
          instruccion: 'Pon la goma dentro de la caja.',
          traduccion: 'Pune radiera în cutie.'
        },
        {
          id: 'c4', tipo: 'colocar', objeto: 'libro', zona: 'lado_caja',
          instruccion: 'Pon el libro al lado de la caja.',
          traduccion: 'Pune cartea lângă cutie.'
        },
        {
          id: 'c5', tipo: 'colocar', objeto: 'pelota', zona: 'lado_mesa',
          escena: { libro: 'encima_mesa', lapiz: 'lado_caja', goma: 'debajo_mesa', pelota: 'dentro_caja' },
          instruccion: 'Pon la pelota al lado de la mesa.',
          traduccion: 'Pune mingea lângă masă.'
        }
      ]
    },

    expresion: {
      titulo: '3. Exprimare',
      instrucciones: 'Privește scena. Alege propoziția care descrie ce vezi, apoi apasă „Verifică”. În această activitate obiectele nu se mută, dar poți roti camera.',
      tareas: [
        {
          id: 'e1', tipo: 'elegir',
          escena: { libro: 'encima_mesa', lapiz: 'lado_mesa', goma: 'lado_caja', pelota: 'dentro_caja' },
          pregunta: '¿Dónde está la pelota?',
          traduccion: 'Unde este mingea?',
          opciones: [
            { objeto: 'pelota', zona: 'encima_mesa' },
            { objeto: 'pelota', zona: 'dentro_caja' },
            { objeto: 'pelota', zona: 'debajo_mesa' }
          ]
        },
        {
          id: 'e2', tipo: 'elegir',
          escena: { libro: 'debajo_mesa', lapiz: 'encima_mesa', goma: 'dentro_caja', pelota: 'lado_caja' },
          pregunta: '¿Dónde está el libro?',
          traduccion: 'Unde este cartea?',
          opciones: [
            { objeto: 'libro', zona: 'encima_mesa' },
            { objeto: 'libro', zona: 'lado_mesa' },
            { objeto: 'libro', zona: 'debajo_mesa' }
          ]
        },
        {
          id: 'e3', tipo: 'elegir',
          escena: { libro: 'lado_caja', lapiz: 'debajo_mesa', goma: 'encima_mesa', pelota: 'lado_mesa' },
          pregunta: '¿Dónde está la goma?',
          traduccion: 'Unde este radiera?',
          opciones: [
            { objeto: 'goma', zona: 'dentro_caja' },
            { objeto: 'goma', zona: 'encima_mesa' },
            { objeto: 'goma', zona: 'lado_caja' }
          ]
        },
        {
          id: 'e4', tipo: 'elegir',
          escena: { libro: 'dentro_caja', lapiz: 'lado_caja', goma: 'debajo_mesa', pelota: 'encima_mesa' },
          pregunta: '¿Qué frase es verdadera?',
          traduccion: 'Care propoziție este adevărată?',
          opciones: [
            { objeto: 'libro', zona: 'encima_mesa' },
            { objeto: 'lapiz', zona: 'lado_caja' },
            { objeto: 'goma', zona: 'dentro_caja' }
          ]
        }
      ]
    },

    final: {
      titulo: '4. Verificare finală',
      instrucciones: 'Rezolvă cele cinci sarcini. La fiecare sarcină ai o singură verificare, apoi primești explicația. La final vezi rezultatul.',
      tareas: [
        {
          id: 'f1', tipo: 'colocar', objeto: 'pelota', zona: 'encima_mesa',
          escena: { libro: 'lado_mesa', lapiz: 'dentro_caja', goma: 'lado_caja', pelota: 'debajo_mesa' },
          instruccion: 'Pon la pelota encima de la mesa.',
          traduccion: 'Pune mingea pe masă.'
        },
        {
          id: 'f2', tipo: 'elegir',
          escena: { libro: 'encima_mesa', lapiz: 'dentro_caja', goma: 'debajo_mesa', pelota: 'lado_caja' },
          pregunta: '¿Dónde está el lápiz?',
          traduccion: 'Unde este creionul?',
          opciones: [
            { objeto: 'lapiz', zona: 'lado_caja' },
            { objeto: 'lapiz', zona: 'encima_mesa' },
            { objeto: 'lapiz', zona: 'dentro_caja' }
          ]
        },
        {
          id: 'f3', tipo: 'colocar', objeto: 'libro', zona: 'debajo_mesa',
          escena: { libro: 'encima_mesa', lapiz: 'lado_caja', goma: 'dentro_caja', pelota: 'lado_mesa' },
          instruccion: 'Pon el libro debajo de la mesa.',
          traduccion: 'Pune cartea sub masă.'
        },
        {
          id: 'f4', tipo: 'elegir',
          escena: { libro: 'dentro_caja', lapiz: 'encima_mesa', goma: 'lado_mesa', pelota: 'debajo_mesa' },
          pregunta: '¿Dónde está la goma?',
          traduccion: 'Unde este radiera?',
          opciones: [
            { objeto: 'goma', zona: 'lado_caja' },
            { objeto: 'goma', zona: 'lado_mesa' },
            { objeto: 'goma', zona: 'debajo_mesa' }
          ]
        },
        {
          id: 'f5', tipo: 'colocar', objeto: 'lapiz', zona: 'dentro_caja',
          escena: { libro: 'lado_caja', lapiz: 'encima_mesa', goma: 'debajo_mesa', pelota: 'lado_mesa' },
          instruccion: 'Pon el lápiz dentro de la caja.',
          traduccion: 'Pune creionul în cutie.'
        }
      ]
    }
  },

  /*
   * Mesaje de feedback. Cuvinte care se înlocuiesc automat:
   *  {objeto}        denumirea spaniolă a obiectului din sarcină (ex.: el lápiz)
   *  {objetoRo}      traducerea (ex.: creionul)
   *  {movido}        obiectul mutat din greșeală
   *  {movidoRo}      traducerea lui
   *  {frase}         propoziția care descrie poziția actuală (ex.: El lápiz está debajo de la mesa.)
   *  {fraseCorrecta} propoziția corectă
   *  {zonaPedida}    locul cerut, în spaniolă (ex.: encima de la mesa)
   *  {zonaActual}    locul unde se află acum obiectul, în spaniolă
   *  {prepPedida} / {prepPedidaRo}  prepoziția cerută și traducerea ei
   *  {prepActual} / {prepActualRo}  prepoziția locului actual și traducerea ei
   *  {refPedida} / {refPedidaRo}    obiectul de referință cerut (la mesa / masa)
   *  {refActual} / {refActualRo}    obiectul de referință al locului actual
   *  {explicacion}   explicația prepoziției cerute (din „preposiciones”)
   */
  mensajes: {
    etiquetaCorrecto: 'Corect',
    etiquetaIncorrecto: 'Încă nu',
    etiquetaIncorrectoFinal: 'Nu este corect',
    colocar: {
      correcto: '{frase} Prepoziția „{prepPedida}” înseamnă „{prepPedidaRo}”.',
      sinMover: '{objeto} ({objetoRo}) este tot unde era la început. Selectează-l și pune-l în locul cerut de instrucțiune.',
      otroObjeto: 'Ai mutat {movido} ({movidoRo}), dar instrucțiunea vorbește despre {objeto} ({objetoRo}).',
      referenciaIncorrecta: 'Prepoziția este bună: „{prepPedida}” ({prepPedidaRo}). Dar instrucțiunea cere „{refPedida}” ({refPedidaRo}), nu „{refActual}” ({refActualRo}). Acum: {frase}',
      preposicionIncorrecta: 'Acum: {frase} Instrucțiunea cere „{zonaPedida}”. {explicacion} Tu ai ales un loc care înseamnă „{prepActualRo}” („{prepActual}”).'
    },
    elegir: {
      sinRespuesta: 'Alege mai întâi o propoziție.',
      correcto: 'Propoziția „{frase}” descrie scena. Prepoziția „{prepPedida}” înseamnă „{prepPedidaRo}”.',
      incorrecto: 'Propoziția aleasă nu descrie scena. În scenă: {fraseCorrecta} {explicacion}'
    },
    final: {
      resultado: 'Ai rezolvat corect {correctas} din {total} sarcini.',
      todoBien: 'Foarte bine! Știi să folosești toate cele patru prepoziții.',
      repasar: 'Recitește explicațiile de mai jos și reia verificarea când vrei.'
    }
  }
};
