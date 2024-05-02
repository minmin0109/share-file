(function () {
    let senderID;
    const socket = new WebSocket("ws://localhost:7460"); 
    function downloadBlob(blob, filename) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  
    socket.addEventListener("open", function () {
      console.log("WebSocket connection established.");
    });
  
    socket.addEventListener("error", function (error) {
      console.error("WebSocket error:", error);
    });
  
    let fileShare = {};
    let totalBufferSize = 0;
    socket.addEventListener("message", function (event) {
      const data = JSON.parse(event.data);
  
      switch (data.type) {
        case "fs-meta":
          console.log("Received metadata:", data);
  
          fileShare.metadata = data.metadata;
          fileShare.transmitted = 0;
          fileShare.buffer = [];
          totalBufferSize = data.metadata.total_buffer_size;
  
          let el = document.createElement("div");
          el.classList.add("item");
          el.innerHTML = `
                  <div class="progress" style="width: 150px; height: 150px; border-radius: 0px; gap: 15px; flex-wrap: wrap; position: relative; padding: 15px 0 0 5px; font: bold 40px sans-serif;">0%</div>
                  <div class="filename" style="width: 152px; height: 40px; color: #fffbf5; margin-top: 10px;">${data.metadata.filename}</div>
              `;
          document.querySelector(".file-list").appendChild(el);
          fileShare.progress_node = el.querySelector(".progress");
          break;
        case "fs-share":
          const bufferArr = new Uint8Array(data.buffer);
          console.log(bufferArr)
  
          fileShare.buffer.push(bufferArr);
  
          fileShare.transmitted += bufferArr.byteLength;
  
          const progress = (fileShare.transmitted / totalBufferSize) * 100;
          fileShare.progress_node.innerText = Math.trunc(progress) + "%";
          console.log("fileShare : " , fileShare)
  
  
          if (fileShare.transmitted == totalBufferSize) {
            console.log("File transmission complete. Downloading file...");
  
            const fileBlob = new Blob(fileShare.buffer);
            downloadBlob(fileBlob, fileShare.metadata.filename);
            
            fileShare = {};
          } else {
            console.log("Sending start signal for next chunk.");
            socket.send(JSON.stringify({ type: "fs-start", uid: senderID }));
          }
          break;
        default:
          console.log("Unknown message type:", data.type); 
          break;
      }
    });
  })();