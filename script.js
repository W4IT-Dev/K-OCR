if (!navigator.onLine) go('offline')
let base64, ocrHistory = localStorage.history ? JSON.parse(localStorage.history) : []
const fileInput = document.querySelector('#file')
const app = {
    root: document.querySelector('#app'),
    header: document.querySelector('#header'),
    softkeys: {
        root: document.querySelector('.softkeys'),
        left: document.querySelector('.softkey-left'),
        center: document.querySelector('.softkey-center'),
        right: document.querySelector('.softkey-right')
    },
    home: { root: document.querySelector('#home'), selectButton: document.querySelector('#selectFile'), historyButton: document.querySelector('#historyButton') },
    history: { root: document.querySelector('#history') },
    imageSelected: { root: document.querySelector('#image_selected'), image: document.querySelector('#image_selected img'), languageInput: document.querySelector('#image_selected input'), startButton: document.querySelector('#image_selected #start') },
    load: { root: document.querySelector('#load'), loadProgress: document.querySelector('#load #progress'), loadStatus: document.querySelector('#load #status') },
    result: { root: document.querySelector('#ocr_result'), confidence: document.querySelector('#ocr_result #confidence'), textarea: document.querySelector('#ocr_result textarea'), saveButton: document.querySelector('#ocr_result #save'), shareButton: document.querySelector('#ocr_result #share') },
    offline: { root: document.querySelector('#offline') }
}

fileInput.addEventListener("change", (event) => { const selectedfile = event.target.files; if (selectedfile.length > 0) uploadImage(selectedfile) });

function useTesseract(image) {
    app.load.loadProgress.value = 0.01;
    app.load.loadStatus.innerText = "Initlaizing"
    go('load')
    function updateProgress(data) {
        app.load.loadProgress.value = data.progress * 100
        app.load.loadStatus.innerText = data.status
    }

    return new Promise((resolve, reject) => {
        Tesseract.createWorker(app.imageSelected.languageInput.dataset.value, 0, { logger: (a) => updateProgress(a) }).then(worker => {
            worker.recognize(image).then(({ data: { confidence, text } }) => {
                showResult(text, confidence, image)
                updateHistory({ date: new Date(), text: text, image: image })
                worker.terminate().then(() => resolve()).catch(error => reject(error));
            }).catch(error => reject(error));
        }).catch(error => {
            app.load.loadStatus.innerText = "ERROR!\n Something went wrong..."
            app.load.loadProgress.value = 1;
            app.load.root.innerHTML += `<br> <br><div class="button-container" id="errorButtons">
                    <button tabindex="0" class="button-container__button focusable" style="transform: scale(90%);" onclick="useTesseract(base64); this.parentNode.remove();">Retry</button>
                    <button tabindex="0" class="button-container__button focusable" style="transform: scale(80%);" onclick="go();this.parentNode.remove();">Back</button>
                </div>`
            console.error(error);
            reject(error);
        });
    });
}

function uploadImage(image) {
    const [imageFile] = image;
    const fileReader = new FileReader();
    fileReader.onload = () => { const srcData = fileReader.result; base64 = srcData; app.imageSelected.image.src = base64 };
    fileReader.readAsDataURL(imageFile);
    app.home.root.classList.add('hidden');
    app.imageSelected.root.classList.remove('hidden');
}

function updateHistory(item, deleteItem, time) {
    if (!item) {
        if (!localStorage.history) { app.history.root.innerHTML = `<div class="list-item-indicator focusable" tabindex="0"><p class="list-item-indicator__text">There is no history</p><p class="list-item-indicator__subtext">Start by upload a image</p><span class="list-item-indicator__indicator"></span></div>` } 
        else { for (let i = 0; i < ocrHistory.length; i++) { const element = ocrHistory[i]; app.history.root.innerHTML += `<div class="list-item-icon focusable" tabindex="${history.length - i}"><img src="${element.image}" alt="" class="list-item-icon__icon" /><div class="list-item-icon__text-container"><p class="list-item-icon__text">${new Date(element.date).toLocaleDateString('en-US')}</p><p class="list-item-icon__subtext">${element.text}</p></div></div>` } }
        go('history')
    } else {
        if (deleteItem) {
            if (!time) console.error('Something went wrong')
            ocrHistory = ocrHistory.filter(element => element.time === time)
            localStorage.history = JSON.stringify(ocrHistory)
        } else {
            ocrHistory.unshift(item)
            localStorage.history = JSON.stringify(ocrHistory)
        }
    }
}

function showResult(text, confidence, image) {
    app.result.textarea.value = text;
    app.result.confidence.innerText = confidence + "% " + translate('confidence')
    app.result.textarea.addEventListener('change', () => { ocrHistory[0].text = app.result.textarea.value; localStorage.history = JSON.stringify(ocrHistory); })
    go('result')
}

function setHeader(text) {
    app.header.innerHTML = text;
}

function go(to) {
    const hideAll = () => { ['home', 'history', 'imageSelected', 'load', 'result', 'offline'].forEach(id => app[id].root.classList.add('hidden')) }
    hideAll();
    switch (to) {
        case 'offline': app.offline.root.classList.remove('hidden'); break;
        case 'home': setHeader(translate('image_to_text')); app.softkeys.root.style.display = "flex"; app.load.root.style.height = "calc(100% - 5.8rem)"; app.home.root.classList.remove('hidden'); break;
        case 'history': setHeader(translate('history')); app.history.root.classList.remove('hidden'); break;
        case 'load': setHeader(translate('loading')); app.softkeys.root.style.display = "none"; app.load.root.style.height = "calc(100% - 3rem)"; app.load.root.classList.remove('hidden'); break;
        case 'result': setHeader(translate('result')); app.softkeys.root.style.display = "flex"; app.load.root.style.height = "calc(100% - 5.8rem)"; app.result.root.classList.remove('hidden'); break;
        default: setHeader(translate('image_to_text')); app.softkeys.root.style.display = "flex"; app.load.root.style.height = "calc(100% - 5.8rem)"; app.home.root.classList.remove('hidden'); break;
    }
}

function download() {
    var sdcard = navigator.getDeviceStorage("sdcard");
    var file = new Blob([ocrHistory[0].text], { type: "text/plain" });
    var request = sdcard.addNamed(file, `OCR-file ${ocrHistory[0].date}.txt`);
    request.onsuccess = function () { console.log('File "' + this.result + '" successfully wrote on the sdcard storage area'); }
    request.onerror = function () { console.warn('Unable to write the file: ' + this.error); }
}

function share() {
    let shareText = new MozActivity({ name: "share", data: { type: "text/plain", blobs: [ocrHistory[0].text] } });
}

// AUTOCOMPLETE
function autocomplete(e, a) { var n; function o(e) { if (!e) return !1; (function e(a) { for (var n = 0; n < a.length; n++)a[n].classList.remove("autocomplete-active") })(e), n >= e.length && (n = 0), n < 0 && (n = e.length - 1), e[n].classList.add("autocomplete-active") } function i(a) { for (var n = document.getElementsByClassName("autocomplete-items"), o = 0; o < n.length; o++)a != n[o] && a != e && n[o].parentNode.removeChild(n[o]) } nameArray = a.map(e => e.name), e.addEventListener("input", function (a) { var o, d, c, m = this.value; if (i(), !m) return !1; for (n = -1, (o = document.createElement("DIV")).setAttribute("id", this.id + "autocomplete-list"), o.setAttribute("class", "autocomplete-items"), this.parentNode.appendChild(o), c = 0; c < nameArray.length; c++)nameArray[c].substr(0, m.length).toUpperCase() == m.toUpperCase() && ((d = document.createElement("DIV")).innerHTML = "<strong>" + nameArray[c].substr(0, m.length) + "</strong>", d.innerHTML += nameArray[c].substr(m.length), d.innerHTML += "<input type='hidden' value='" + nameArray[c] + "'>", d.addEventListener("click", function (a) { e.value = this.getElementsByTagName("input")[0].value, e.dataset.value = languages.filter(e => e.name == this.getElementsByTagName("input")[0].value)[0].code, i() }), o.appendChild(d)) }), e.addEventListener("keydown", function (e) { var a = document.getElementById(this.id + "autocomplete-list"); a && (a = a.getElementsByTagName("div")), "ArrowDown" == e.key ? (n++, o(a)) : "ArrowUp" == e.key ? (n--, o(a)) : "Enter" == e.key && (e.preventDefault(), n > -1 && a && a[n].click()) }) } const languages = [{ code: "afr", name: "Afrikaans" }, { code: "amh", name: "Amharic" }, { code: "ara", name: "Arabic" }, { code: "asm", name: "Assamese" }, { code: "aze", name: "Azerbaijani" }, { code: "aze_cyrl", name: "Azerbaijani - Cyrillic" }, { code: "bel", name: "Belarusian" }, { code: "ben", name: "Bengali" }, { code: "bod", name: "Tibetan" }, { code: "bos", name: "Bosnian" }, { code: "bul", name: "Bulgarian" }, { code: "cat", name: "Catalan; Valencian" }, { code: "ceb", name: "Cebuano" }, { code: "ces", name: "Czech" }, { code: "chi_sim", name: "Chinese - Simplified" }, { code: "chi_tra", name: "Chinese - Traditional" }, { code: "chr", name: "Cherokee" }, { code: "cym", name: "Welsh" }, { code: "dan", name: "Danish" }, { code: "deu", name: "German" }, { code: "dzo", name: "Dzongkha" }, { code: "ell", name: "Greek, Modern (1453-)" }, { code: "eng", name: "English" }, { code: "enm", name: "English, Middle (1100-1500)" }, { code: "epo", name: "Esperanto" }, { code: "est", name: "Estonian" }, { code: "eus", name: "Basque" }, { code: "fas", name: "Persian" }, { code: "fin", name: "Finnish" }, { code: "fra", name: "French" }, { code: "frk", name: "German Fraktur" }, { code: "frm", name: "French, Middle (ca. 1400-1600)" }, { code: "gle", name: "Irish" }, { code: "glg", name: "Galician" }, { code: "grc", name: "Greek, Ancient (-1453)" }, { code: "guj", name: "Gujarati" }, { code: "hat", name: "Haitian; Haitian Creole" }, { code: "heb", name: "Hebrew" }, { code: "hin", name: "Hindi" }, { code: "hrv", name: "Croatian" }, { code: "hun", name: "Hungarian" }, { code: "iku", name: "Inuktitut" }, { code: "ind", name: "Indonesian" }, { code: "isl", name: "Icelandic" }, { code: "ita", name: "Italian" }, { code: "ita_old", name: "Italian - Old" }, { code: "jav", name: "Javanese" }, { code: "jpn", name: "Japanese" }, { code: "kan", name: "Kannada" }, { code: "kat", name: "Georgian" }, { code: "kat_old", name: "Georgian - Old" }, { code: "kaz", name: "Kazakh" }, { code: "khm", name: "Central Khmer" }, { code: "kir", name: "Kirghiz; Kyrgyz" }, { code: "kor", name: "Korean" }, { code: "kur", name: "Kurdish" }, { code: "lao", name: "Lao" }, { code: "lat", name: "Latin" }, { code: "lav", name: "Latvian" }, { code: "lit", name: "Lithuanian" }, { code: "mal", name: "Malayalam" }, { code: "mar", name: "Marathi" }, { code: "mkd", name: "Macedonian" }, { code: "mlt", name: "Maltese" }, { code: "msa", name: "Malay" }, { code: "mya", name: "Burmese" }, { code: "nep", name: "Nepali" }, { code: "nld", name: "Dutch; Flemish" }, { code: "nor", name: "Norwegian" }, { code: "ori", name: "Oriya" }, { code: "pan", name: "Panjabi; Punjabi" }, { code: "pol", name: "Polish" }, { code: "por", name: "Portuguese" }, { code: "pus", name: "Pushto; Pashto" }, { code: "ron", name: "Romanian; Moldavian; Moldovan" }, { code: "rus", name: "Russian" }, { code: "san", name: "Sanskrit" }, { code: "sin", name: "Sinhala; Sinhalese" }, { code: "slk", name: "Slovak" }, { code: "slv", name: "Slovenian" }, { code: "spa", name: "Spanish; Castilian" }, { code: "spa_old", name: "Spanish; Castilian - Old" }, { code: "sqi", name: "Albanian" }, { code: "srp", name: "Serbian" }, { code: "srp_latn", name: "Serbian - Latin" }, { code: "swa", name: "Swahili" }, { code: "swe", name: "Swedish" }, { code: "syr", name: "Syriac" }, { code: "tam", name: "Tamil" }, { code: "tel", name: "Telugu" }, { code: "tgk", name: "Tajik" }, { code: "tgl", name: "Tagalog" }, { code: "tha", name: "Thai" }, { code: "tir", name: "Tigrinya" }, { code: "tur", name: "Turkish" }, { code: "uig", name: "Uighur; Uyghur" }, { code: "ukr", name: "Ukrainian" }, { code: "urd", name: "Urdu" }, { code: "uzb", name: "Uzbek" }, { code: "uzb_cyrl", name: "Uzbek - Cyrillic" }, { code: "vie", name: "Vietnamese" }, { code: "yid", name: "Yiddish" }]; autocomplete(app.imageSelected.languageInput, languages);