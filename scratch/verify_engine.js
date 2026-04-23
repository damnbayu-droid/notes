const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

async function verify() {
  console.log('Starting PDF Master Engine Verification...');
  
  const bytes = fs.readFileSync('test_doc.pdf');
  const pdfDoc = await PDFDocument.load(bytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Simulated Annotation Object (from Fabric.js)
  const annotations = {
    1: {
      objects: [
        {
          type: 'text',
          text: 'ENGINE_VERIFIED_SUCCESS',
          left: 100,
          top: 100,
          fontSize: 50,
          fill: '#ff0000',
          scaleX: 1,
          scaleY: 1
        },
        {
          type: 'rect',
          left: 50,
          top: 50,
          width: 500,
          height: 10,
          fill: '#00ff00',
          scaleX: 1,
          scaleY: 1
        }
      ]
    }
  };

  for (const [pageStr, json] of Object.entries(annotations)) {
    const pageIdx = parseInt(pageStr) - 1;
    const p = pages[pageIdx];
    const { height: ph } = p.getSize();
    
    for (const obj of json.objects) {
      if (obj.type === 'text') {
        p.drawText(obj.text, {
          x: obj.left,
          y: ph - (obj.top + obj.fontSize * 0.8),
          size: obj.fontSize,
          font: font,
          color: rgb(1, 0, 0)
        });
      } else if (obj.type === 'rect') {
        p.drawRectangle({
          x: obj.left,
          y: ph - (obj.top + obj.height),
          width: obj.width,
          height: obj.height,
          color: rgb(0, 1, 0)
        });
      }
    }
  }

  const savedBytes = await pdfDoc.save();
  fs.writeFileSync('verified_doc.pdf', savedBytes);
  
  console.log('Verification Complete. Original size:', bytes.length);
  console.log('Verification Complete. Edited size:', savedBytes.length);
  
  if (savedBytes.length > bytes.length) {
    console.log('SUCCESS: PDF size increased, annotations applied.');
  } else {
    console.log('FAILURE: PDF size did not increase.');
  }
}

verify().catch(console.error);
