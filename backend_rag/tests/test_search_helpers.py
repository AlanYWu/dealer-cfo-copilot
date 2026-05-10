from app.search import _build_refine_hint, _rrf_fuse, _sigmoid
from app.store import ChunkRecord


def _rec(doc_id: str, doc_name: str, folder: str, _id: str = "x") -> ChunkRecord:
    return ChunkRecord(
        id=_id,
        doc_id=doc_id,
        doc_name=doc_name,
        folder=folder,
        page=1,
        text="t",
        context_before="",
        context_after="",
    )


def test_refine_hint_groups_by_folder_and_doc():
    records = [
        _rec("d1", "Doc One", "manuals"),
        _rec("d1", "Doc One", "manuals"),
        _rec("d2", "Doc Two", "manuals"),
        _rec("d3", "Doc Three", "specs"),
    ]
    hint = _build_refine_hint(total=4, records=records)
    assert hint.totalMatches == 4
    folders = [s for s in hint.suggestions if s.kind == "folder"]
    docs = [s for s in hint.suggestions if s.kind == "doc"]
    folder_names = {s.folder for s in folders}
    assert folder_names == {"manuals", "specs"}
    assert folders[0].folder == "manuals"
    doc_ids = {s.docId for s in docs}
    assert doc_ids == {"d1", "d2", "d3"}
    assert docs[0].docId == "d1"


def test_rrf_fuse_combines_lists_and_orders_by_combined_rank():
    a = _rec("d1", "A", "f", _id="a")
    b = _rec("d2", "B", "f", _id="b")
    c = _rec("d3", "C", "f", _id="c")

    keyword_hits = [(a, 10.0), (b, 5.0)]
    vector_hits = [(b, 0.9), (c, 0.8)]

    fused = _rrf_fuse(keyword_hits, vector_hits, k=60)
    ids = [rec.id for rec, _ in fused]

    # b appears in both lists -> highest combined score, comes first.
    assert ids[0] == "b"
    # all three records present, no dupes
    assert set(ids) == {"a", "b", "c"}
    # scores monotonically descending
    scores = [s for _, s in fused]
    assert scores == sorted(scores, reverse=True)


def test_rrf_fuse_handles_empty_inputs():
    assert _rrf_fuse([], []) == []
    a = _rec("d1", "A", "f", _id="a")
    assert [r.id for r, _ in _rrf_fuse([(a, 1.0)], [])] == ["a"]
    assert [r.id for r, _ in _rrf_fuse([], [(a, 1.0)])] == ["a"]


def test_sigmoid_monotonic_and_bounded():
    assert _sigmoid(0.0) == 0.5
    # Float64 saturates around |x|≈37; use a magnitude that stays in-range.
    assert 0.0 < _sigmoid(-5.0) < _sigmoid(0.0) < _sigmoid(5.0) < 1.0
