export async function loadPdfBook(file) {
  const url = URL.createObjectURL(file);
  return {
    id: `pdf-${Date.now()}`,
    type: "pdf",
    title: stripExtension(file.name),
    fileName: file.name,
    pdfUrl: url,
    chapters: [],
  };
}

function stripExtension(name) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? name : name.slice(0, dot);
}

