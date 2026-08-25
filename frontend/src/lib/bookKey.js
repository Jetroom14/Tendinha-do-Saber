export function getBookKey(bookOrKey) {
  if (typeof bookOrKey === "string") return bookOrKey;
  return bookOrKey?.isbn13 || bookOrKey?.slug || bookOrKey?.pe_code || bookOrKey?.id || "";
}
