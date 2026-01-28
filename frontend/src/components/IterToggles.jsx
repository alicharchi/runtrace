import { Button, ButtonGroup, Form } from "react-bootstrap";

export default function IterToggles({ series, visibleIters, setVisibleIters }) {
  const showAll = () => {
    const next = {};
    series.forEach((s) => (next[s.iter] = true));
    setVisibleIters(next);
  };

  const hideAll = () => {
    const next = {};
    series.forEach((s) => (next[s.iter] = false));
    setVisibleIters(next);
  };

  return (
    <div className="w-100 mb-3">
      <ButtonGroup className="mb-2">
        <Button size="sm" onClick={showAll}>
          Show all
        </Button>
        <Button size="sm" variant="outline-secondary" onClick={hideAll}>
          Hide all
        </Button>
      </ButtonGroup>

      <Form className="d-flex flex-wrap gap-2">
        {series.map((s) => (
          <Form.Check
            inline
            key={s.iter}
            type="checkbox"
            id={`iter-${s.iter}`}
            label={`iter ${s.iter}`}
            checked={visibleIters[s.iter] ?? true}
            onChange={() =>
              setVisibleIters((v) => ({ ...v, [s.iter]: !v[s.iter] }))
            }
          />
        ))}
      </Form>
    </div>
  );
}
