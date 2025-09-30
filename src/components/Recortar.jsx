import React, { useRef, useState, useEffect } from "react";

function Recortar() {
    const [image, setImage] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const [cropped, setCropped] = useState(null);

    const canvasRef = useRef(null);
    const lastTouch = useRef(null);
    const lastDistance = useRef(null);
    const lastAngle = useRef(null);
    const minZoomRef = useRef(0.5);

    const frameRatio = 1.6; // proporción INE
    const [canvasSize, setCanvasSize] = useState({
        width: Math.max(window.innerWidth - 20, 300),
        height: Math.max(window.innerWidth - 20, 300),
    });

    useEffect(() => {
        const handleResize = () => {
            const newWidth = Math.max(window.innerWidth - 20, 300);
            setCanvasSize({ width: newWidth, height: newWidth });
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const img = new Image();
        img.onload = () => {
            setImage(img);
            const frameWidth = canvasSize.width * 0.7;
            const frameHeight = frameWidth / frameRatio;
            const minZoom = Math.max(frameWidth / img.width, frameHeight / img.height);
            minZoomRef.current = minZoom;
            setZoom(minZoom);
            setOffset({ x: 0, y: 0 });
            setRotation(0);
            setCropped(null);
        };
        img.src = URL.createObjectURL(file);
    };

    // Dibuja imagen + máscara + marco
    useEffect(() => {
        if (!image || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        const { width, height } = canvasSize;
        canvasRef.current.width = width;
        canvasRef.current.height = height;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width, height);

        const newWidth = image.width * zoom;
        const newHeight = image.height * zoom;

        ctx.save();
        ctx.translate(width / 2 + offset.x, height / 2 + offset.y);
        ctx.rotate(rotation);
        ctx.drawImage(image, -newWidth / 2, -newHeight / 2, newWidth, newHeight);
        ctx.restore();

        const frameWidth = Math.round(width * 0.7);
        const frameHeight = Math.round(frameWidth / frameRatio);
        const frameX = Math.round((width - frameWidth) / 2);
        const frameY = Math.round((height - frameHeight) / 2);

        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.rect(frameX, frameY, frameWidth, frameHeight);
        ctx.fill("evenodd");

        ctx.strokeStyle = "rgba(255,0,0,0.9)";
        ctx.lineWidth = 3;
        ctx.strokeRect(frameX, frameY, frameWidth, frameHeight);
    }, [image, zoom, offset, rotation, canvasSize]);

    // Recorte exacto
    const getCroppedDataUrl = () => {
        if (!canvasRef.current || !image) return null;

        const { width, height } = canvasSize;
        const frameWidth = Math.round(width * 0.7);
        const frameHeight = Math.round(frameWidth / frameRatio);
        const frameX = Math.round((width - frameWidth) / 2);
        const frameY = Math.round((height - frameHeight) / 2);

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = frameWidth;
        tempCanvas.height = frameHeight;
        const tempCtx = tempCanvas.getContext("2d");

        const newWidth = image.width * zoom;
        const newHeight = image.height * zoom;

        // Dibujamos la imagen en el tempCanvas **con las mismas coordenadas que en el canvas principal**
        // Y recortamos el área del marco usando los parámetros sx, sy, sw, sh
        // Primero creamos un canvas auxiliar del tamaño del canvas principal
        const auxCanvas = document.createElement("canvas");
        auxCanvas.width = width;
        auxCanvas.height = height;
        const auxCtx = auxCanvas.getContext("2d");

        auxCtx.save();
        auxCtx.translate(width / 2 + offset.x, height / 2 + offset.y);
        auxCtx.rotate(rotation);
        auxCtx.drawImage(image, -newWidth / 2, -newHeight / 2, newWidth, newHeight);
        auxCtx.restore();

        // Ahora recortamos solo el área del marco
        tempCtx.drawImage(auxCanvas, frameX, frameY, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);

        return tempCanvas.toDataURL("image/png");
    };


    const handleCrop = () => {
        const dataUrl = getCroppedDataUrl();
        if (dataUrl) setCropped(dataUrl);
    };

    const handleDownload = () => {
        const dataUrl = getCroppedDataUrl() || cropped;
        if (!dataUrl) return alert("Primero recorta la imagen.");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "ine-recorte.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    // Gestos táctiles con zoom y rotación
    const handleTouchStart = (e) => {
        if (e.touches.length === 1) lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastDistance.current = Math.sqrt(dx * dx + dy * dy);
            lastAngle.current = Math.atan2(dy, dx);
        }
    };

    const handleTouchMove = (e) => {
        e.preventDefault();
        if (e.touches.length === 1 && lastTouch.current) {
            const dx = e.touches[0].clientX - lastTouch.current.x;
            const dy = e.touches[0].clientY - lastTouch.current.y;
            setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
            lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2 && lastDistance.current !== null && lastAngle.current !== null) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const newDistance = Math.sqrt(dx * dx + dy * dy);
            const scaleChange = newDistance / lastDistance.current;
            setZoom((prev) => Math.min(Math.max(prev * scaleChange, minZoomRef.current), 4));

            const newAngle = Math.atan2(dy, dx);
            const deltaAngle = newAngle - lastAngle.current;
            setRotation((prev) => prev + deltaAngle);

            lastDistance.current = newDistance;
            lastAngle.current = newAngle;
        }
    };

    const handleTouchEnd = () => {
        lastTouch.current = null;
        lastDistance.current = null;
        lastAngle.current = null;
    };

    return (
        <div style={{ textAlign: "center", padding: 8 }}>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ padding: "8px 12px", background: "#5CE1FF", fontSize: "14px", border: "none", borderRadius: "8px" }} />
            <br />
            <div
                style={{ border: "2px solid #222", display: "inline-block", touchAction: "none", marginTop: 8 }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <canvas ref={canvasRef} style={{ maxWidth: "100%", display: "block" }} />
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "center" }}>
                <button onClick={handleCrop} style={{ padding: "8px 12px", background: "#47ff19ff", fontSize: "20px", border: "none", borderRadius: "8px" }}>Recortar</button>
            </div>

            {cropped && (
                <>
                    <div style={{ marginTop: 12 }}>
                        <img src={cropped} alt="Cropped" style={{ maxWidth: "100%", border: "1px solid #ccc" }} />
                    </div>
                    <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "center" }}>
                        <button onClick={handleDownload} style={{
                            padding: "8px 12px", background: "#5CE1FF", fontSize: "20px", border: "none", borderRadius: "8px"
                        }}>Descargar</button>
                    </div>
                </>

            )}


        </div>
    );
}

export default Recortar;
