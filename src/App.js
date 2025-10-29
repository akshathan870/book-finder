import React, { useEffect, useState, useRef } from 'react';
import clsx from 'clsx';

function useDebounced(value, delay = 450) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default function App() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounced(query);
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [numFound, setNumFound] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const perPage = 20;
  const inputRef = useRef();

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setNumFound(0);
      setError(null);
      return;
    }

    const controller = new AbortController();
    async function fetchBooks() {
      setLoading(true);
      setError(null);
      try {
        const start = (page - 1) * perPage;
        const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(
          debouncedQuery
        )}&limit=${perPage}&offset=${start}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        setResults(data.docs || []);
        setNumFound(data.numFound || 0);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();

    return () => controller.abort();
  }, [debouncedQuery, page]);

  function coverUrl(doc) {
    if (doc.cover_i) return `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`;
    if (doc.isbn && doc.isbn.length) return `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-M.jpg`;
    return null;
  }

  const totalPages = Math.ceil(numFound / perPage);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent">
            Book Finder
          </h1>
          <p className="mt-3 text-gray-600 text-sm sm:text-base">
            Discover books instantly • Powered by Open Library API
          </p>
        </header>

        {/* Main Card */}
        <main className="bg-white p-8 rounded-3xl shadow-2xl backdrop-blur-sm">
          {/* Search Box */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search by book title</label>
            <div className="flex gap-2 bg-white p-3 rounded-xl shadow-md">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="🔍  e.g. The Alchemist"
                className="flex-1 rounded-md border-none focus:outline-none text-gray-800 placeholder-gray-400"
              />
              <button
                onClick={() => {
                  setQuery('');
                  inputRef.current.focus();
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-medium hover:opacity-90 transition"
              >
                Clear
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Tip: try partial titles or author names. Results update after you stop typing.
            </p>
          </div>

          {/* Results Info */}
          <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
            <span>{loading ? 'Searching...' : `${numFound.toLocaleString()} results`}</span>
            <span>Page {page} of {Math.max(1, totalPages)}</span>
          </div>

          {/* Error or No Results */}
          {error && <div className="p-4 bg-red-50 text-red-700 rounded mb-4">Error: {error}</div>}
          {!loading && results.length === 0 && debouncedQuery && !error && (
            <div className="p-6 text-center text-gray-600">No results found.</div>
          )}

          {/* Book Cards */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((doc) => (
              <li
                key={doc.key}
                className="flex flex-col p-4 rounded-xl bg-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-gray-100"
              >
                <div className="relative rounded-xl overflow-hidden mb-4">
                  {coverUrl(doc) ? (
                    <img
                      src={coverUrl(doc)}
                      alt={`${doc.title} cover`}
                      className="w-full h-56 object-cover transform hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-56 flex items-center justify-center text-sm text-gray-400 bg-gray-100">
                      No cover available
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-lg text-gray-800 mb-1">{doc.title}</h3>
                <p className="text-sm text-gray-600 mb-1">
                  {(doc.author_name || []).slice(0, 3).join(', ')}
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  First published: {doc.first_publish_year || '—'}
                </p>
                <a
                  href={`https://openlibrary.org${doc.key}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-center mt-auto px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition"
                >
                  View on OpenLibrary
                </a>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-between">
            <div className="space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-semibold transition',
                  page === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-500 text-white hover:bg-indigo-600'
                )}
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages || 1, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-semibold transition',
                  (page === totalPages || totalPages === 0)
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-500 text-white hover:bg-indigo-600'
                )}
              >
                Next
              </button>
            </div>
            <div className="text-sm text-gray-500">Showing {results.length} items</div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-gray-500">
          Built with ❤️ using React, Tailwind, and the Open Library API.
        </footer>
      </div>
    </div>
  );
}
