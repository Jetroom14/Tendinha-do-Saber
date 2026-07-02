import json
import urllib.request
import urllib.error

ISBNs = [
    "9789897078811",  # Porto Editora sample
    "9789897078920",  # Porto Editora sample
    "9781234567897",  # likely non-existent
]

HEADERS = {"User-Agent": "TendinhaDoSaber/1.0"}


def http_get(url, headers=None, timeout=10):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            content = r.read()
            info = r.info()
            status = r.getcode()
            return True, status, dict(info.items()), content
    except urllib.error.HTTPError as e:
        try:
            content = e.read()
        except Exception:
            content = b""
        return False, e.code, {}, content
    except Exception as e:
        return False, str(e), {}, b""


def image_ok(url):
    ok, status, headers, content = http_get(url, headers=HEADERS)
    ctype = headers.get("Content-Type", "") if headers else ""
    size = len(content or b"")
    return ok and status == 200 and ctype.startswith("image") and size > 1500, status, ctype, size


for isbn in ISBNs:
    print(f"\n=== Testing ISBN: {isbn} ===")
    # Google Books by ISBN
    gb_url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}&country=PT"
    ok, status, headers, content = http_get(gb_url, headers=HEADERS)
    print("Google Books (ISBN) reachable:", ok, "status:", status)
    if ok:
        try:
            data = json.loads(content.decode())
            print("totalItems:", data.get("totalItems"))
            if data.get("totalItems", 0) > 0:
                vi = data["items"][0].get("volumeInfo", {})
                links = vi.get("imageLinks") or {}
                print("imageLinks:", links)
                u = links.get("thumbnail") or links.get("smallThumbnail")
                if u:
                    print("thumbnail URL:", u)
                    ok_img, code, ctype, size = image_ok(u.replace("http://", "https://").replace("&edge=curl",""))
                    print("thumbnail image OK:", ok_img, code, ctype, size)
            else:
                print("No items in Google Books by ISBN")
        except Exception as e:
            print("Failed to parse Google Books JSON:", e)
    else:
        print("Google Books request failed or returned non-200")

    # Open Library by ISBN
    ol_url = f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false"
    ok, code, ctype, size = image_ok(ol_url)
    print("Open Library cover URL:", ol_url)
    print("OpenLibrary image OK:", ok, code, ctype, size)

    # Google Books by title+author not replicated because we don't have title here; skip

print('\nDone')
