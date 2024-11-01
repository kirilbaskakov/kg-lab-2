import React, { useRef, useState } from 'react';

const HistogramAndContrast = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const canvasRef = useRef(null);
  const histogramBeforeCanvasRef = useRef(null);
  const histogramAfterCanvasRef = useRef(null);
  const fileRef = useRef(null);
  const contrastRef = useRef(null);

  const drawHistogram = (src, canvasRef) => {
    const histogram = new Uint32Array(256);
    const channels = new cv.MatVector();
    cv.split(src, channels);
    const gray = channels.get(0);
    
    for (let i = 0; i < gray.rows; i++) {
      for (let j = 0; j < gray.cols; j++) {
        const pixelValue = gray.data[i * gray.cols + j];
        histogram[pixelValue]++;
      }
    }

    const histCanvas = canvasRef.current;
    const histCtx = histCanvas.getContext('2d');
    histCtx.clearRect(0, 0, histCanvas.width, histCanvas.height);

    // Нормируем и рисуем гистограмму
    const maxCount = Math.max(...histogram);
    for (let i = 0; i < 256; i++) {
      const height = (histogram[i] / maxCount) * histCanvas.height;
      histCtx.fillStyle = 'black';
      histCtx.fillRect(i, histCanvas.height - height, 1, height);
    }

    gray.delete();
    channels.delete();
  };

  const applyEqualization = (src) => {
    const dst = new cv.Mat();
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    cv.equalizeHist(dst, dst);
    return dst;
  };

   const clamp = (value) => {
        return Math.max(0, Math.min(255, Math.round(value))); // Ограничиваем значения от 0 до 255
    };

  const applyContrast = (imageSrc, contrast) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            // минимальные и максимальные значения для каждого канала
            let minR = 255, minG = 255, minB = 255;
            let maxR = 0, maxG = 0, maxB = 0;

            for (let i = 0; i < data.length; i += 4) {
                minR = Math.min(minR, data[i]);
                maxR = Math.max(maxR, data[i]);
                minG = Math.min(minG, data[i + 1]);
                maxG = Math.max(maxG, data[i + 1]);
                minB = Math.min(minB, data[i + 2]);
                maxB = Math.max(maxB, data[i + 2]);
            }

            // Применяем контрастирование
            for (let i = 0; i < data.length; i += 4) {
                data[i]     = clamp((data[i] - minR) * (255 / (maxR - minR)) * contrast);     // Красный
                data[i + 1] = clamp((data[i + 1] - minG) * (255 / (maxG - minG)) * contrast); // Зеленый
                data[i + 2] = clamp((data[i + 2] - minB) * (255 / (maxB - minB)) * contrast); // Синий
            }
            ctx.putImageData(imageData, 0, 0);
        };
    };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const src = cv.imread(img);
        setImageSrc(img.src);
        fileRef.current.value = "";
        // Построение гистограммы
        drawHistogram(src, histogramBeforeCanvasRef);

        // Эквализация гистограммы
        const equalized = applyEqualization(src);
        cv.imshow(canvasRef.current, equalized);
        equalized.delete();

        const contrast = +contrastRef.current.value;
        // Линейное контрастирование
        applyContrast(img.src, contrast);

        setTimeout(() => {
          const srcNew = cv.imread(canvasRef.current);

          drawHistogram(srcNew, histogramAfterCanvasRef);
        }, 1000)

        src.delete();
      };
    }
  };

  return (
    <div>
      <h1>Эквализация гистограммы и линейное контрастирование</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileRef}/>
      <label>Контраст</label>
      <input type="number" min={0.1} max={5} defaultValue={1.3} ref={contrastRef} step={0.1} />
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem"}}>
        <div>
            <h3>Uploaded image</h3>
            {imageSrc && <img src={imageSrc} alt="Uploaded" style={{ border: "none", width: "100%" }} />}
        </div>
        <div>
            <h3>Linear constrast</h3>
            <canvas ref={canvasRef} style={{ border: "none", width: "100%" }} />
        </div>
        <div>
            <h3>Histogram before</h3>
             <canvas ref={histogramBeforeCanvasRef} width={256} height={100} style={{ border: "none", width: "100%" }} />
        </div>     
         <div>
            <h3>Histogram after</h3>
            <canvas ref={histogramAfterCanvasRef} width={256} height={100} style={{ border: "none", width: "100%" }} />
        </div>       
      </div>
    </div>
  );
};

export default HistogramAndContrast;