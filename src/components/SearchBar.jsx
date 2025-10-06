import React, { useState } from "react";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) onSearch(q);
  };

  return (
    <form className="search-bar" onSubmit={submit}>
      <input
        type="text"
        placeholder="Rechercher un anime… (ex: One Piece, Jujutsu Kaisen)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">Rechercher</button>
    </form>
  );
}
