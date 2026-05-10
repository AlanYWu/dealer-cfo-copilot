from app.chunk import chunk_page


def test_chunk_empty_text_returns_no_chunks():
    assert chunk_page("", page=1) == []
    assert chunk_page("   ", page=1) == []


def test_chunk_short_text_single_chunk():
    chunks = chunk_page("Hello world. This is a test.", page=2)
    assert len(chunks) == 1
    assert chunks[0].page == 2
    assert "Hello world." in chunks[0].text


def test_chunk_window_and_overlap():
    text = "S1 ends. S2 ends. S3 ends. S4 ends. S5 ends."
    chunks = chunk_page(text, page=1, window=3, overlap=1)
    assert [c.text for c in chunks] == [
        "S1 ends. S2 ends. S3 ends.",
        "S3 ends. S4 ends. S5 ends.",
    ]


def test_chunk_context_before_after():
    text = (
        "This is some filler text before the target. "
        "Target sentence sits in the middle of the page. "
        "Trailing context follows after the target sentence."
    )
    chunks = chunk_page(text, page=1, window=1, overlap=0)
    target = next(c for c in chunks if "Target sentence" in c.text)
    assert "filler" in target.context_before()
    assert "Trailing" in target.context_after()


def test_chunk_drops_short_chunks():
    # Page numbers, lone tokens, and tiny fragments must not survive — they
    # embed near generic queries and pollute vector search.
    text = "1. Page 7. Section 2.1. Real sentence with several words follows here."
    chunks = chunk_page(text, page=1, window=1, overlap=0)
    texts = [c.text for c in chunks]
    assert all(len(t.split()) >= 4 for t in texts)
    assert any("Real sentence with several words" in t for t in texts)
