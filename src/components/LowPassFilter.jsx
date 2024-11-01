import React, { useCallback, useEffect, useRef, useState } from 'react';

const LowPassFilter = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const kernelRef = useRef(null);
  const canvasRef1 = useRef(null);
  const canvasRef2 = useRef(null);
  const fileRef = useRef(null);

  const applyGaussFilter = (imageSrc, kernel) => {
    const imgElement = document.createElement('img');
    imgElement.src = imageSrc;
    console.log(imageSrc);
    imgElement.onload = () => {
      const src = cv.imread(imgElement);
      const dst = new cv.Mat();

      cv.GaussianBlur(src, dst, new cv.Size(kernel, kernel), 0, 0, cv.BORDER_DEFAULT);

      cv.imshow(canvasRef1.current, dst);
      src.delete();
      dst.delete();
    };
  };

  const applyMedianFilter = (imageSrc, kernel) => {
    const imgElement = document.createElement('img');
    imgElement.src = imageSrc;
    imgElement.onload = () => {
    const src = cv.imread(imgElement);
    const dst = new cv.Mat();

    cv.medianBlur(src, dst, kernel);

    cv.imshow(canvasRef2.current, dst);
    src.delete();
    dst.delete();
    };
  }

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const kernel = +kernelRef.current.value;
      fileRef.current.value = "";
      setImageSrc(url);
      applyGaussFilter(url, kernel);
      applyMedianFilter(url, kernel);
    }
  };

  return (
    <div>
      <h1>Низкочастотные фильтры</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileRef}/>
      
      <label>Размер ядра</label>
      <input type="number" min={1} max={30} defaultValue={3} ref={kernelRef} step={2}/>
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem"}}>
        <div>
            <h3>Uploaded image</h3>
            {imageSrc && <img src={imageSrc} alt="Uploaded" style={{width: "100%"}}/>}
        </div>
        <div>
            <h3>Gaussian filter</h3>
            <canvas ref={canvasRef1} style={{ width: "100%", border: "none" }} />
        </div>
         <div>
            <h3>Median filter</h3>
            <canvas ref={canvasRef2} style={{ width: "100%", border: "none" }} />
        </div>
      </div>
    </div>
  );
};

export default LowPassFilter;