export function pdfDownloadResponse(pdf: Buffer, filename: string) {
  const encodedName = encodeURIComponent(filename).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="unmyeongdaero.pdf"; filename*=UTF-8''${encodedName}`,
      "content-length": String(pdf.length),
      "cache-control": "private, no-store",
    },
  });
}
