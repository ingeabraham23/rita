import React, { useState } from "react";
import jsPDF from "jspdf";
import "./Pdf.css";

function Pdf() {
    const [frontImg, setFrontImg] = useState(null);
    const [backImg, setBackImg] = useState(null);

    const handleFileChange = (e, setter) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setter(reader.result);
        reader.readAsDataURL(file);
    };

    const generatePdf = (orientation) => {
        const pdf = new jsPDF("p", "pt", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 20;

        if (orientation === "horizontal") {
            const imgWidth = (pageWidth - margin * 3) / 2;
            const imgHeight = imgWidth * 0.63;
            if (frontImg) pdf.addImage(frontImg, "PNG", margin, margin, imgWidth, imgHeight);
            if (backImg) pdf.addImage(backImg, "PNG", margin * 2 + imgWidth, margin, imgWidth, imgHeight);
        } else if (orientation === "vertical") {
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = imgWidth * 0.63;
            if (frontImg) pdf.addImage(frontImg, "PNG", margin, margin, imgWidth, imgHeight);
            if (backImg) pdf.addImage(backImg, "PNG", margin, margin * 2 + imgHeight, imgWidth, imgHeight);
        }

        pdf.save(`ine_${orientation}.pdf`);
    };

    const generatePng = (orientation) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (orientation === "horizontal") {
            canvas.width = 1000;
            canvas.height = 400;
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            if (frontImg) {
                const img1 = new Image();
                img1.src = frontImg;
                img1.onload = () => {
                    ctx.drawImage(img1, 20, 20, 450, 280);
                    if (backImg) {
                        const img2 = new Image();
                        img2.src = backImg;
                        img2.onload = () => {
                            ctx.drawImage(img2, 520, 20, 450, 280);
                            downloadCanvasAsPng(canvas, `ine_horizontal.png`);
                        };
                    } else {
                        downloadCanvasAsPng(canvas, `ine_horizontal.png`);
                    }
                };
            }
        } else {
            canvas.width = 600;
            canvas.height = 800;
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            if (frontImg) {
                const img1 = new Image();
                img1.src = frontImg;
                img1.onload = () => {
                    ctx.drawImage(img1, 50, 20, 500, 300);
                    if (backImg) {
                        const img2 = new Image();
                        img2.src = backImg;
                        img2.onload = () => {
                            ctx.drawImage(img2, 50, 360, 500, 300);
                            downloadCanvasAsPng(canvas, `ine_vertical.png`);
                        };
                    } else {
                        downloadCanvasAsPng(canvas, `ine_vertical.png`);
                    }
                };
            }
        }
    };

    const downloadCanvasAsPng = (canvas, filename) => {
        const link = document.createElement("a");
        link.download = filename;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    return (
        <div className="ine-container">
            <h2>Generar PDF / PNG de INE</h2>

            <div className="ine-inputs">
                <div>
                    <label>Subir frente: </label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setFrontImg)} />
                </div>
                <div>
                    <label>Subir reverso: </label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setBackImg)} />
                </div>
            </div>

            <h3>Vista previa Horizontal</h3>
            <div className="preview preview-horizontal">
                {frontImg && <img src={frontImg} alt="Frente" />}
                {backImg && <img src={backImg} alt="Reverso" />}
            </div>

            <h3>Vista previa Vertical</h3>
            <div className="preview preview-vertical">
                {frontImg && <img src={frontImg} alt="Frente" />}
                {backImg && <img src={backImg} alt="Reverso" />}
            </div>

            <div className="buttons">
                <button onClick={() => generatePdf("horizontal")}>Descargar PDF Horizontal</button>
                <button onClick={() => generatePdf("vertical")}>Descargar PDF Vertical</button>
                <button onClick={() => generatePng("horizontal")}>Descargar PNG Horizontal</button>
                <button onClick={() => generatePng("vertical")}>Descargar PNG Vertical</button>
            </div>
        </div>
    );
}

export default Pdf;
