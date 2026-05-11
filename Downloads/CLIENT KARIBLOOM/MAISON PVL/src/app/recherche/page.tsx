'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');

  return (
    <div className="container-pvl py-16 md:py-20">
      <div className="max-w-xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl mb-8">
          Rechercher
        </h1>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-pvl-stone"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit, une collection..."
            className="w-full border border-pvl-black/12 pl-11 pr-10 py-4 text-sm focus:outline-none focus:border-pvl-black transition-colors"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-pvl-stone hover:text-pvl-black transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {!query && (
          <div className="mt-12 text-center">
            <p className="text-sm text-pvl-slate">
              Saisissez votre recherche pour découvrir nos produits.
            </p>
          </div>
        )}

        {query && (
          <div className="mt-12 text-center">
            <p className="text-sm text-pvl-slate">
              Aucun résultat pour &ldquo;{query}&rdquo;.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
