export default function IterToggles({ series, visibleIters, setVisibleIters }) {
  const showAll = () => {
    const next = {};
    series.forEach(s => (next[s.iter] = true));
    setVisibleIters(next);
  };

  const hideAll = () => {
    const next = {};
    series.forEach(s => (next[s.iter] = false));
    setVisibleIters(next);
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ marginBottom: 5 }}>
        <button onClick={showAll}>Show all</button>
        <button onClick={hideAll} style={{ marginLeft: 10 }}>
          Hide all
        </button>
      </div>

      {series.map(s => (
        <label key={s.iter} style={{ marginRight: 10 }}>
          <input
            type="checkbox"
            checked={visibleIters[s.iter] ?? true}
            onChange={() =>
              setVisibleIters(v => ({
                ...v,
                [s.iter]: !v[s.iter],
              }))
            }
          />
          iter {s.iter}
        </label>
      ))}
    </div>
  );
}
