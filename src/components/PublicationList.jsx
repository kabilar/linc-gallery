import React, { useMemo, useState } from 'react';
import Link from '@docusaurus/Link';
import { publications } from '../data/publications';

const TYPE_LABELS = {
  article: 'Journal article',
  preprint: 'Preprint',
  conference: 'Conference paper',
};

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'article', label: 'Journal articles' },
  { value: 'preprint', label: 'Preprints' },
  { value: 'conference', label: 'Conference papers' },
];

function publicationUrl(pub) {
  if (pub.url) return pub.url;
  if (pub.doi) return `https://doi.org/${pub.doi}`;
  return null;
}

function matchesQuery(pub, query) {
  if (!query) return true;
  const haystack = [pub.title, pub.authors, pub.venue, pub.year, pub.doi]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function PublicationItem({ pub }) {
  const href = publicationUrl(pub);
  return (
    <li className="publication-item">
      <div className="publication-title">
        {href ? <a href={href} target="_blank" rel="noopener noreferrer">{pub.title}</a> : pub.title}
      </div>
      <div className="publication-meta">
        {pub.authors && <span>{pub.authors}</span>}
        {pub.venue && <span className="publication-venue">{pub.venue}</span>}
        {pub.year && <span>{pub.year}</span>}
      </div>
      <div className="publication-badges">
        <span className={`publication-badge publication-badge--${pub.type}`}>
          {TYPE_LABELS[pub.type] ?? pub.type}
        </span>
        {pub.galleryPage && (
          <Link className="publication-gallery-link" to={pub.galleryPage}>
            Explore {pub.galleryLabel} in the gallery →
          </Link>
        )}
        {pub.doi && <span className="publication-doi">doi:{pub.doi}</span>}
      </div>
    </li>
  );
}

export function PublicationList() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');

  const counts = useMemo(() => {
    const result = { all: publications.length };
    for (const pub of publications) result[pub.type] = (result[pub.type] ?? 0) + 1;
    return result;
  }, []);

  const byYear = useMemo(() => {
    const filtered = publications
      .filter((pub) => type === 'all' || pub.type === type)
      .filter((pub) => matchesQuery(pub, query));
    const groups = new Map();
    for (const pub of filtered) {
      const year = pub.year || 'Undated';
      if (!groups.has(year)) groups.set(year, []);
      groups.get(year).push(pub);
    }
    for (const list of groups.values()) list.sort((a, b) => a.title.localeCompare(b.title));
    return [...groups.entries()].sort(([a], [b]) => String(b).localeCompare(String(a)));
  }, [query, type]);

  const shown = byYear.reduce((n, [, list]) => n + list.length, 0);

  return (
    <div className="publication-list">
      <div className="publication-controls">
        <input
          type="search"
          className="publication-search"
          placeholder="Search by title, author, journal, or year"
          aria-label="Search publications"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="publication-filters" role="group" aria-label="Filter by publication type">
          {FILTERS.filter((f) => f.value === 'all' || counts[f.value]).map((f) => (
            <button
              key={f.value}
              type="button"
              className={`button button--sm ${type === f.value ? 'button--primary' : 'button--outline button--secondary'}`}
              aria-pressed={type === f.value}
              onClick={() => setType(f.value)}>
              {f.label} ({counts[f.value] ?? 0})
            </button>
          ))}
        </div>
      </div>
      <p className="publication-count">
        Showing {shown} of {publications.length} publications
      </p>
      {byYear.length === 0 && <p>No publications match your search.</p>}
      {byYear.map(([year, list]) => (
        <section key={year} className="publication-year">
          <h3>{year}</h3>
          <ul>
            {list.map((pub) => <PublicationItem key={pub.title} pub={pub} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}
