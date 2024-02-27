let base64;
const fileInput = document.querySelector('#file')
const ocrHistory = localStorage.history ? JSON.parse(localStorage.history) : []

const app = {
    root: document.querySelector('#app'),
    home: {
        root: document.querySelector('#home'),
        selectButton: document.querySelector('#selectFile'),
        historyButton: document.querySelector('#historyButton')
    },
    history: {
        root: document.querySelector('#history'),

    },
    imageSelected: {
        root: document.querySelector('#image_selected'),
        image: document.querySelector('#image_selected img'),
        languageInput: document.querySelector('#image_selected input'),
        startButton: document.querySelector('#image_selected #start')
    },
    load: {
        root: document.querySelector('#load'),
        loadProgress: document.querySelector('#load #progress'),
        loadStatus: document.querySelector('#load #status')
    },
    result: {
        root: document.querySelector('#ocr_result'),
        confidence: document.querySelector('#ocr_result #confidence'),
        textarea: document.querySelector('#ocr_result textarea'),
        saveButton: document.querySelector('#ocr_result #save'),
        shareButton: document.querySelector('#ocr_result #share')
    }
}

// upload image
fileInput.addEventListener("change", (event) => {
    const selectedfile = event.target.files;
    if (selectedfile.length > 0) uploadImage(selectedfile)
});

async function useTesseract(image) {
    //DOM
    app.load.loadProgress.value = 0.01;
    app.load.loadStatus.innerText = "Initlaizing"
    go('load')
    function updateProgress(data) {
        console.log(data)
        app.load.loadProgress.value = data.progress * 100
        app.load.loadStatus.innerText = data.status
    }
    // TESSERACT
    try {


        const worker = await Tesseract.createWorker(app.imageSelected.languageInput.dataset.value, 0, {
            logger: (a) => updateProgress(a)
        });
        const { data: { confidence, text } } = await worker.recognize(image);
        console.log(confidence);
        console.log(text);
        showResult(text, confidence, image)
        updateHistory({ date: new Date(), text: text, image: image })
        await worker.terminate();
    } catch (error) {
        app.load.loadStatus.innerText = "ERROR!\n Something went wrong..."

        app.load.loadProgress.value = 1;
        app.load.root.innerHTML += `
        <br> <br>
        <div class="button-container" id="errorButtons">
                <button tabindex="0" class="button-container__button focusable" style="transform: scale(80%);"
                    onclick="useTesseract(base64); this.parentNode.remove();">Retry</button>
                <button tabindex="0" class="button-container__button focusable" style="transform: scale(80%);"
                    onclick="go();this.parentNode.remove();">Back</button>
            </div>
        `

        console.error(error)
    }

}

function uploadImage(image) {
    const [imageFile] = image;
    const fileReader = new FileReader();
    fileReader.onload = () => {
        const srcData = fileReader.result;
        base64 = srcData;
        app.imageSelected.image.src = base64
    };
    fileReader.readAsDataURL(imageFile);

    app.home.root.classList.add('hidden');
    app.imageSelected.root.classList.remove('hidden');
}

function updateHistory(item, deleteItem, time) {
    if (!item) {
        if (!localStorage.history) {//LOAD EMPTY HISTORY
            app.history.root.innerHTML = `
            <div class="list-item-indicator focusable" tabindex="0">
                <p class="list-item-indicator__text">There is no history</p>
                <p class="list-item-indicator__subtext">Start by upload a image</p>
                <span class="list-item-indicator__indicator"></span>
            </div>`
        } else {//ADD ITEM(S)
            for (let i = 0; i < ocrHistory.length; i++) {
                const element = ocrHistory[i];
                app.history.root.innerHTML += `
                <div class="list-item-icon focusable" tabindex="${history.length - i}">
                    <img src="${element.image}" alt="" class="list-item-icon__icon" />
                    <div class="list-item-icon__text-container">
                        <p class="list-item-icon__text">${new Date(element.date).toLocaleDateString('en-US')}</p>
                        <p class="list-item-icon__subtext">${element.text}</p>
                    </div>
                </div>`
            }
        }
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
    app.result.confidence.innerText = confidence + "% Confidence"
    app.result.textarea.addEventListener('change', e => {
        ocrHistory[0].text = app.result.textarea.value;
    })
    go('result')
}

function go(to) {
    app.home.root.classList.add('hidden');
    app.history.root.classList.add('hidden')
    app.imageSelected.root.classList.add('hidden')
    app.load.root.classList.add('hidden')
    app.result.root.classList.add('hidden')
    switch (to) {
        case 'home':
            app.home.root.classList.remove('hidden');
            break;

        case 'history':
            app.history.root.classList.remove('hidden');
            break;

        case 'load':
            app.load.root.classList.remove('hidden')
            break;

        case 'result':
            app.result.root.classList.remove('hidden');
            break;

        default:
            app.home.root.classList.remove('hidden');

            break;
    }
}



function autocomplete(inp, arr) {
    nameArray = arr.map(lang => lang.name)
    var currentFocus;
    inp.addEventListener("input", function (e) {
        var a, b, i, val = this.value;
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);
        for (i = 0; i < nameArray.length; i++) {
            if (nameArray[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                b = document.createElement("DIV");
                b.innerHTML = "<strong>" + nameArray[i].substr(0, val.length) + "</strong>";
                b.innerHTML += nameArray[i].substr(val.length);
                b.innerHTML += "<input type='hidden' value='" + nameArray[i] + "'>";
                b.addEventListener("click", function (e) {
                    console.log(this.getElementsByTagName("input")[0].value)
                    inp.value = this.getElementsByTagName("input")[0].value;
                    inp.dataset.value = languages.filter(element => element.name == this.getElementsByTagName("input")[0].value)[0].code
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });
    inp.addEventListener("keydown", function (e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.key == "ArrowDown") {
            currentFocus++;
            addActive(x);
        } else if (e.key == "ArrowUp") { //up
            currentFocus--;
            addActive(x);
        } else if (e.key == "Enter") {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

}

/*An array containing all the country names in the world:*/
const languages = [
    { code: 'afr', name: 'Afrikaans' },
    { code: 'amh', name: 'Amharic' },
    { code: 'ara', name: 'Arabic' },
    { code: 'asm', name: 'Assamese' },
    { code: 'aze', name: 'Azerbaijani' },
    { code: 'aze_cyrl', name: 'Azerbaijani - Cyrillic' },
    { code: 'bel', name: 'Belarusian' },
    { code: 'ben', name: 'Bengali' },
    { code: 'bod', name: 'Tibetan' },
    { code: 'bos', name: 'Bosnian' },
    { code: 'bul', name: 'Bulgarian' },
    { code: 'cat', name: 'Catalan; Valencian' },
    { code: 'ceb', name: 'Cebuano' },
    { code: 'ces', name: 'Czech' },
    { code: 'chi_sim', name: 'Chinese - Simplified' },
    { code: 'chi_tra', name: 'Chinese - Traditional' },
    { code: 'chr', name: 'Cherokee' },
    { code: 'cym', name: 'Welsh' },
    { code: 'dan', name: 'Danish' },
    { code: 'deu', name: 'German' },
    { code: 'dzo', name: 'Dzongkha' },
    { code: 'ell', name: 'Greek, Modern (1453-)' },
    { code: 'eng', name: 'English' },
    { code: 'enm', name: 'English, Middle (1100-1500)' },
    { code: 'epo', name: 'Esperanto' },
    { code: 'est', name: 'Estonian' },
    { code: 'eus', name: 'Basque' },
    { code: 'fas', name: 'Persian' },
    { code: 'fin', name: 'Finnish' },
    { code: 'fra', name: 'French' },
    { code: 'frk', name: 'German Fraktur' },
    { code: 'frm', name: 'French, Middle (ca. 1400-1600)' },
    { code: 'gle', name: 'Irish' },
    { code: 'glg', name: 'Galician' },
    { code: 'grc', name: 'Greek, Ancient (-1453)' },
    { code: 'guj', name: 'Gujarati' },
    { code: 'hat', name: 'Haitian; Haitian Creole' },
    { code: 'heb', name: 'Hebrew' },
    { code: 'hin', name: 'Hindi' },
    { code: 'hrv', name: 'Croatian' },
    { code: 'hun', name: 'Hungarian' },
    { code: 'iku', name: 'Inuktitut' },
    { code: 'ind', name: 'Indonesian' },
    { code: 'isl', name: 'Icelandic' },
    { code: 'ita', name: 'Italian' },
    { code: 'ita_old', name: 'Italian - Old' },
    { code: 'jav', name: 'Javanese' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'kan', name: 'Kannada' },
    { code: 'kat', name: 'Georgian' },
    { code: 'kat_old', name: 'Georgian - Old' },
    { code: 'kaz', name: 'Kazakh' },
    { code: 'khm', name: 'Central Khmer' },
    { code: 'kir', name: 'Kirghiz; Kyrgyz' },
    { code: 'kor', name: 'Korean' },
    { code: 'kur', name: 'Kurdish' },
    { code: 'lao', name: 'Lao' },
    { code: 'lat', name: 'Latin' },
    { code: 'lav', name: 'Latvian' },
    { code: 'lit', name: 'Lithuanian' },
    { code: 'mal', name: 'Malayalam' },
    { code: 'mar', name: 'Marathi' },
    { code: 'mkd', name: 'Macedonian' },
    { code: 'mlt', name: 'Maltese' },
    { code: 'msa', name: 'Malay' },
    { code: 'mya', name: 'Burmese' },
    { code: 'nep', name: 'Nepali' },
    { code: 'nld', name: 'Dutch; Flemish' },
    { code: 'nor', name: 'Norwegian' },
    { code: 'ori', name: 'Oriya' },
    { code: 'pan', name: 'Panjabi; Punjabi' },
    { code: 'pol', name: 'Polish' },
    { code: 'por', name: 'Portuguese' },
    { code: 'pus', name: 'Pushto; Pashto' },
    { code: 'ron', name: 'Romanian; Moldavian; Moldovan' },
    { code: 'rus', name: 'Russian' },
    { code: 'san', name: 'Sanskrit' },
    { code: 'sin', name: 'Sinhala; Sinhalese' },
    { code: 'slk', name: 'Slovak' },
    { code: 'slv', name: 'Slovenian' },
    { code: 'spa', name: 'Spanish; Castilian' },
    { code: 'spa_old', name: 'Spanish; Castilian - Old' },
    { code: 'sqi', name: 'Albanian' },
    { code: 'srp', name: 'Serbian' },
    { code: 'srp_latn', name: 'Serbian - Latin' },
    { code: 'swa', name: 'Swahili' },
    { code: 'swe', name: 'Swedish' },
    { code: 'syr', name: 'Syriac' },
    { code: 'tam', name: 'Tamil' },
    { code: 'tel', name: 'Telugu' },
    { code: 'tgk', name: 'Tajik' },
    { code: 'tgl', name: 'Tagalog' },
    { code: 'tha', name: 'Thai' },
    { code: 'tir', name: 'Tigrinya' },
    { code: 'tur', name: 'Turkish' },
    { code: 'uig', name: 'Uighur; Uyghur' },
    { code: 'ukr', name: 'Ukrainian' },
    { code: 'urd', name: 'Urdu' },
    { code: 'uzb', name: 'Uzbek' },
    { code: 'uzb_cyrl', name: 'Uzbek - Cyrillic' },
    { code: 'vie', name: 'Vietnamese' },
    { code: 'yid', name: 'Yiddish' }
];
/*initiate the autocomplete function on the "myInput" element, and pass along the countries array as possible autocomplete values:*/
autocomplete(app.imageSelected.languageInput, languages);
