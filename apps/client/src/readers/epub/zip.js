const SIG_EOCD = 0x06054b50;
const SIG_CDH = 0x02014b50;
const SIG_LFH = 0x04034b50;

export async function openZip(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findEocdOffset(view);
  if (eocdOffset === -1) throw new Error("Invalid EPUB: ZIP end record not found");

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);

  const decoder = new TextDecoder("utf-8");
  const entries = new Map();
  let ptr = cdOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (view.getUint32(ptr, true) !== SIG_CDH) {
      throw new Error("Invalid ZIP: central directory entry not found");
    }

    const compressionMethod = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const uncompressedSize = view.getUint32(ptr + 24, true);
    const fileNameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localHeaderOffset = view.getUint32(ptr + 42, true);

    const nameStart = ptr + 46;
    const nameBytes = bytes.slice(nameStart, nameStart + fileNameLen);
    const fileName = decoder.decode(nameBytes);

    entries.set(fileName, {
      fileName,
      compressionMethod,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
    });

    ptr = nameStart + fileNameLen + extraLen + commentLen;
  }

  async function readBytes(fileName) {
    const entry = entries.get(fileName);
    if (!entry) throw new Error(`EPUB: missing file: ${fileName}`);
    return readEntryBytes(view, bytes, entry);
  }

  async function readText(fileName) {
    const raw = await readBytes(fileName);
    return decoder.decode(raw);
  }

  return {
    list: () => Array.from(entries.keys()),
    readBytes,
    readText,
  };
}

function findEocdOffset(view) {
  // EOCD is max 65,535 bytes from end (comment length max) + record size.
  const len = view.byteLength;
  const min = Math.max(0, len - 0xffff - 22);

  for (let i = len - 22; i >= min; i--) {
    if (view.getUint32(i, true) === SIG_EOCD) return i;
  }
  return -1;
}

async function readEntryBytes(view, bytes, entry) {
  const p = entry.localHeaderOffset;
  if (view.getUint32(p, true) !== SIG_LFH) {
    throw new Error(`Invalid ZIP: local header missing for ${entry.fileName}`);
  }

  const fileNameLen = view.getUint16(p + 26, true);
  const extraLen = view.getUint16(p + 28, true);
  const dataStart = p + 30 + fileNameLen + extraLen;
  const compressed = bytes.slice(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) return compressed;
  if (entry.compressionMethod === 8) return inflateRaw(compressed);

  throw new Error(`Unsupported ZIP compression method: ${entry.compressionMethod}`);
}

async function inflateRaw(compressedBytes) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("EPUB requires DecompressionStream (try Chrome/Edge/Android Chrome)");
  }
  const ds = new DecompressionStream("deflate-raw");
  const decompressedStream = new Blob([compressedBytes]).stream().pipeThrough(ds);
  const ab = await new Response(decompressedStream).arrayBuffer();
  return new Uint8Array(ab);
}

