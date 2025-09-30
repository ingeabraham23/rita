export const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.setAttribute("crossOrigin", "anonymous");
        image.src = url;
    });

const getRadianAngle = (degreeValue) => (degreeValue * Math.PI) / 180;

export default async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const rotRad = getRadianAngle(rotation);
    const safeArea = Math.max(image.width, image.height) * 2;

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate(rotRad);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
        image,
        safeArea / 2 - image.width / 2,
        safeArea / 2 - image.height / 2
    );

    const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = pixelCrop.width;
    croppedCanvas.height = pixelCrop.height;

    const croppedCtx = croppedCanvas.getContext("2d");
    croppedCtx.putImageData(data, 0, 0);

    return new Promise((resolve) => {
        croppedCanvas.toBlob((file) => {
            resolve(URL.createObjectURL(file));
        }, "image/jpeg");
    });
}
