# ¿Dónde está? Prototip de lecție

Aplicație web pentru o lecție introductivă de limba spaniolă, destinată elevilor români începători. Interfața este în română, iar conținutul exersat este în spaniolă: **encima de, debajo de, dentro de, al lado de**.

Scena este o cameră 3D simplă (Three.js) cu o masă, o cutie și patru obiecte școlare făcute din forme geometrice. Tot textul și toate comenzile sunt în HTML, în afara scenei.

## Pornire

Lecția nu are nevoie de instalare și nici de conexiune la internet (Three.js este inclus în folderul `vendor/`).

1. Deschide un terminal în folderul principal al repository-ului (`hola-mundo-spanish`).
2. Pornește un server local:
   ```
   python3 -m http.server 8000
   ```
   Variantă cu Node.js: `npx serve .`
3. Deschide în browser: <http://localhost:8000/donde-esta/>

Pe GitHub Pages lecția este disponibilă la adresa site-ului urmată de `/donde-esta/`.

**De ce e nevoie de server?** Dacă deschizi `index.html` direct de pe disc (dublu clic), browserele precum Chrome blochează încărcarea modulului Three.js. Lecția observă problema și trece singură în varianta 2D, cu un mesaj explicativ.

**Varianta 2D la cerere:** adaugă `?mod=2d` la adresă (<http://localhost:8000/donde-esta/?mod=2d>). Este utilă pentru testare și pentru calculatoare slabe.

## Fișiere importante

| Fișier | Ce conține |
|---|---|
| `index.html` | Structura paginii și ordinea scripturilor |
| `data/leccion-donde-esta.js` | **Conținutul lecției:** vocabular, prepoziții, zone, sarcini, traduceri și mesaje de feedback |
| `js/scene-layout.js` | Geometria scenei: poziția mesei, a cutiei, a zonelor de plasare și a locurilor din zone (3D și 2D) |
| `js/scene-state.js` | Starea scenei: în ce zonă și în ce loc se află fiecare obiect (singura sursă de adevăr) |
| `js/lesson-logic.js` | Construirea propozițiilor, verificarea răspunsurilor și validarea datelor lecției |
| `js/view-3d.js` | Scena 3D: desenare, selectare, tragere cu fixare în zone, rotirea camerei |
| `js/view-2d.js` | Varianta 2D (SVG), folosită când scena 3D nu poate porni |
| `js/app.js` | Cele patru activități, panoul de comenzi și legătura dintre scenă și interfață |
| `css/donde-esta.css` | Aspectul paginii |
| `tests/logic.test.js` | Teste automate pentru date și pentru verificare |
| `vendor/three.module.min.js` | Three.js r170 (licență MIT, în `vendor/three-LICENSE.txt`) |

## Cum modifici conținutul

Tot ce ține de lecție este în `data/leccion-donde-esta.js`. Poți schimba instrucțiunile, traducerile, mesajele de feedback și sarcinile fără să atingi logica.

- O sarcină de tip `colocar` cere: obiectul (`objeto`), zona corectă (`zona`), instrucțiunea în spaniolă și traducerea.
- O sarcină de tip `elegir` cere: așezarea obiectelor (`escena`), întrebarea și opțiunile. Fiecare opțiune este o pereche obiect + zonă; propoziția spaniolă se construiește automat.
- La pornire, aplicația verifică datele. Dacă o sarcină de tip `elegir` are zero sau două opțiuni adevărate, dacă o zonă nu există sau dacă obiectul este deja în locul cerut, pagina afișează lista de greșeli în loc de lecție.

După orice modificare, rulează testele automate (mai jos).

## Teste automate

```
node donde-esta/tests/logic.test.js
```

Cele 15 teste verifică datele lecției, construirea propozițiilor (inclusiv contracția de + el = del), starea scenei și toate cazurile de feedback.

## Teste manuale

Bifează fiecare punct într-un browser real (ideal Chrome, Firefox, Edge și o tabletă).

**Pornire**
- [ ] Pagina se deschide prin server și scena 3D apare (masă, cutie, carte, creion, radieră, minge).
- [ ] Cu `?mod=2d` apare varianta 2D și mesajul „Varianta 2D este activă”.
- [ ] Deschisă direct de pe disc (fără server), pagina arată mesajul despre scena 3D și lecția funcționează în 2D.
- [ ] Butonul „Încearcă din nou scena 3D” pornește scena 3D (când serverul funcționează).

**1. Explorare**
- [ ] Clic pe un obiect din scenă: panoul arată numele spaniol, traducerea și propoziția „… está …”.
- [ ] Clic pe masă sau pe cutie în scenă: apare denumirea lor.
- [ ] Butoanele din „Ce este în scenă?” fac același lucru; apare „✔ văzut” și contorul crește până la 6 din 6.
- [ ] Butonul unei prepoziții evidențiază zona în scenă și arată explicația; pentru „al lado de” se evidențiază două zone.
- [ ] Mutarea unui obiect (tragere sau buton de poziție) schimbă propoziția afișată.
- [ ] „Resetează scena” readuce obiectele la început.
- [ ] Butonul „Ascultă” citește textul în spaniolă (dacă browserul are sinteză vocală).

**2. Înțelegere**
- [ ] Tragerea unui obiect peste o zonă afișează sub scenă unde va ajunge; la eliberare obiectul se fixează în zonă.
- [ ] Un obiect lăsat în afara zonelor se întoarce la locul lui, cu mesaj explicativ.
- [ ] Fără mouse: selectează obiectul din „Alege obiectul”, apoi alege locul din butoane; totul merge și doar cu tastatura (Tab, Enter).
- [ ] „Verifică” fără mutare: mesaj că obiectul nu a fost mutat.
- [ ] Mutarea altui obiect: mesaj că instrucțiunea se referă la alt obiect.
- [ ] Prepoziție greșită: mesajul explică diferența dintre cele două prepoziții.
- [ ] „al lado de la caja” în loc de „al lado de la mesa”: mesajul spune că prepoziția e bună, dar referința nu.
- [ ] Răspuns corect: casetă cu ✔ și „Corect”, margine continuă; greșit: ✘ și „Încă nu”, margine punctată (diferența se vede și fără culori).
- [ ] „Resetează scena” și „Reia sarcina” readuc obiectele la începutul sarcinii.
- [ ] „Arată traducerea” afișează și ascunde traducerea.

**3. Exprimare**
- [ ] Obiectele nu pot fi trase; camera se poate roti.
- [ ] Alegerea unei propoziții false dă explicația cu poziția reală din scenă.
- [ ] Alegerea propoziției corecte dă „Corect”.
- [ ] Verifică fără alegere: mesajul „Alege mai întâi o propoziție”.

**4. Verificare finală**
- [ ] Cinci sarcini, în ordine, cu o singură verificare pe sarcină; după verificare comenzile se blochează și apare „Continuă”.
- [ ] Fiecare sarcină primește feedback explicativ.
- [ ] La final apare scorul și lista cu toate sarcinile, răspunsul dat și explicația.
- [ ] „Reia verificarea finală” pornește din nou de la sarcina 1.

**General**
- [ ] Filele arată progresul (de exemplu „2/5”).
- [ ] Pe telefon (lățime 390 px) pagina nu are derulare orizontală, iar scena apare deasupra panoului.
- [ ] „Descrierea scenei în cuvinte” listează în română poziția fiecărui obiect și se actualizează după mutări.
- [ ] Butoanele „Rotește spre stânga/dreapta” și „Vedere din față” mișcă și readuc camera.

## Ce funcționează

- Cele patru activități: explorare, înțelegere (5 sarcini), exprimare (4 sarcini), verificare finală (5 sarcini).
- Scena 3D cu forme geometrice, selectare cu clic, tragere cu fixare în cinci zone clare (pe masă, sub masă, lângă masă, în cutie, lângă cutie) și rotirea camerei.
- Alternativă completă fără tragere: selectarea obiectului și butoane de poziționare, utilizabile și de la tastatură.
- Verificarea citește starea reală a scenei (zona în care se află fiecare obiect după fixare), nu ce a apăsat elevul.
- Feedback explicativ pentru fiecare tip de greșeală, cu simbol, text și stil de margine, nu doar culoare.
- Reluarea sarcinii, resetarea scenei și reluarea verificării finale.
- Trecere automată în varianta 2D când WebGL lipsește, când Three.js nu se încarcă sau când contextul grafic se pierde.
- Conținut separat de logică, cu validare automată a datelor la pornire.
- Pronunție prin sinteza vocală a browserului (butonul apare doar dacă browserul o are).

## Ce nu este implementat

- **Progresul nu se salvează.** La reîncărcarea paginii, lecția pornește de la zero.
- **Lecția nu apare în meniul aplicației principale „¡Hola, Mundo!”.** Repository-ul conține doar versiunea compilată a acelei aplicații, fără codul sursă, așa că nu am putut adăuga un link fără să modific fișiere generate. Lecția se deschide direct la `/donde-esta/`.
- **În varianta 2D nu există tragere**, doar selectare și butoane.
- **Camera** se rotește doar stânga-dreapta (maximum 60°); nu are zoom.
- **Sinteza vocală** depinde de vocile instalate. Dacă browserul nu are o voce spaniolă, textul poate fi citit cu altă voce.
- **Editarea conținutului** se face direct în fișierul JavaScript; nu există un editor vizual pentru profesor.
- **Testare:** am verificat automat în Chromium (fără ecran, cu WebGL software): scena 3D, tragerea, butoanele, toate activitățile, varianta 2D, lipsa WebGL și afișarea pe lățime de telefon. Nu am testat pe dispozitive reale cu ecran tactil, în Safari sau în Firefox.
- **Vocabular:** „la goma” (radiera) este forma din Spania; în America Latină se spune și „el borrador”.
