function captureScreenshotFromURL(
    url,
    targetDivId,
    callback,
    options = {}
  ) {
    const {
      width = 1024,
      height = 768,
      timeout = 30000,
      html2canvasOptions = {}
    } = options;
  
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.left = "-9999px";
    iframe.style.width = `${width}px`;
    iframe.style.height = `${height}px`;
    iframe.style.border = "none"; // 移除边框
    iframe.sandbox = "allow-scripts allow-same-origin"; // 沙盒限制提升安全性
  
    document.body.appendChild(iframe);
  
    // 超时处理
    const timeoutId = setTimeout(() => {
      cleanup();
      console.error("错误: 加载超时");
      if (typeof callback === "function") callback(null, new Error("加载超时"));
    }, timeout);
  
    const cleanup = () => {
      clearTimeout(timeoutId);
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };
  
    iframe.onload = function () {
      clearTimeout(timeoutId); // 清除超时计时器
  
      try {
        const iframeWindow = iframe.contentWindow;
        const iframeDocument = iframeWindow.document;
  
        // 等待所有资源加载完成（有限等待）
        const resourcesTimeout = setTimeout(() => {
          takeScreenshot();
        }, 2000); // 额外等待2秒，可根据需求调整
  
        const handleResourcesLoaded = () => {
          clearTimeout(resourcesTimeout);
          takeScreenshot();
        };
  
        // 尝试监听资源加载（受跨域限制可能无效）
        iframeWindow.addEventListener("load", handleResourcesLoaded, { once: true });
        iframeDocument.addEventListener("DOMContentLoaded", handleResourcesLoaded, { once: true });
  
      } catch (error) {
        console.error("访问 iframe 失败:", error);
        cleanup();
        if (typeof callback === "function") callback(null, error);
      }
    };
  
    iframe.onerror = function () {
      cleanup();
      console.error("错误: iframe 加载失败");
      if (typeof callback === "function") callback(null, new Error("iframe 加载失败"));
    };
  
    iframe.src = url;
  
    const takeScreenshot = () => {
      try {
        const iframeBody = iframe.contentDocument.body;
  
        html2canvas(iframeBody, {
          useCORS: true,
          allowTaint: false, // 默认禁用，需要时开启但注意污染问题
          scale: window.devicePixelRatio || 1, // 适配高清屏幕
          logging: false, // 关闭日志
          ...html2canvasOptions
        }).then(canvas => {
          const targetDiv = document.getElementById(targetDivId);
          if (targetDiv) {
            targetDiv.appendChild(canvas);
            console.log("截图成功！");
            if (typeof callback === "function") callback(canvas, null);
          } else {
            console.error("目标 div 不存在");
            if (typeof callback === "function") callback(null, new Error("目标 div 不存在"));
          }
          cleanup();
        }).catch(error => {
          console.error("截图失败:", error);
          cleanup();
          if (typeof callback === "function") callback(null, error);
        });
      } catch (error) {
        console.error("截图过程中发生错误:", error);
        cleanup();
        if (typeof callback === "function") callback(null, error);
      }
    };
  }