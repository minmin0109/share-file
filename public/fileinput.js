(function () {
    let receiverID;
    const socket = new WebSocket("ws://localhost:7460");

    socket.addEventListener("open", function (event) {
        console.log("Connected to WebSocket server");
    });
    document.querySelector("#file-input").addEventListener("change", function (e) {
        let file = e.target.files[0];
        if (!file) {
            return;
        }

        let reader = new FileReader();
        reader.onload = function (e) {
            let buffer = new Uint8Array(reader.result);
            let el = document.createElement("div");
            el.classList.add("item");
            el.innerHTML = `
            <div class="progress" style="width: 150px; height: 150px; border-radius: 0px; gap: 15px; flex-wrap: wrap; position: relative; padding: 15px 0 0 5px; font: bold 40px sans-serif;"> 0% </div>
            <div class="filename" style="width: 152px; height: 40px; color: #fffbf5; margin-top: 10px;"> ${file.name} </div>
`;

            console.log("file name : ", file.name);
            document.querySelector(".inner-box").appendChild(el);
            shareFile({
                filename: file.name,
                total_buffer_size: buffer.length,
                buffer_size: 1024
            }, buffer, el.querySelector(".progress"));
        }
        console.log("send picture success")
        reader.readAsArrayBuffer(file);
    });

    function shareFile(metadata, buffer, progress_node) {
        socket.send(JSON.stringify({ type: "file-meta", uid: receiverID, metadata: metadata }));

        function sendChunk() {
            if (buffer.length === 0) {
                return;
            }

            let chunk = buffer.slice(0, metadata.buffer_size);
            buffer = buffer.slice(metadata.buffer_size);

            console.log('chunk: ', chunk, buffer);

            progress_node.innerText = Math.trunc((metadata.total_buffer_size - buffer.length) / metadata.total_buffer_size * 100) + "%";

            // socket.send(JSON.stringify({ type: "file-raw", uid: receiverID, buffer: chunk }));
            socket.send(JSON.stringify({ type: "file-raw", uid: receiverID, buffer: Array.from(chunk) }));

            setTimeout(sendChunk, 0);
        }
        sendChunk();
    }

})();