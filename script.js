let base64;
document.querySelector("#file").addEventListener("change", (event) => {
    const selectedfile = event.target.files;
    if (selectedfile.length > 0) {
        const [imageFile] = selectedfile;
        const fileReader = new FileReader();
        fileReader.onload = () => {
            const srcData = fileReader.result;
            base64 = srcData;
            document.querySelector('img').src = base64
        };
        fileReader.readAsDataURL(imageFile);
        (async () => {
            const worker = await Tesseract.createWorker();
            document.querySelector('#result p').innerText = "Initialzing..."
            await worker.loadLanguage(document.querySelector('#lang').value);
            await worker.initialize(document.querySelector('#lang').value);
            const { data: { confidence, text } } = await worker.recognize(base64);
            console.log(confidence);
            console.log(text);
            document.querySelector('#result p').innerText = text
            await worker.terminate();
        })();
    }
});