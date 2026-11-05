import { useState, useEffect, useRef } from "react";
import { cars, MAX_SPEED } from "./cars.js";
import useEngine from "./useEngine.js";

const Icon = {
  play: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>,
  stop: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>,
  close: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" /></svg>,
};

export default function App() {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const { playing, play, stop } = useEngine();
  const car = cars[active];
  const closeRef = useRef(null);

  const select = (i) => { if (i !== active) { stop(); setActive(i); } };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (open) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { stop(); setActive((a) => Math.min(a + 1, cars.length - 1)); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { stop(); setActive((a) => Math.max(a - 1, 0)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, stop]);

  useEffect(() => { if (open && closeRef.current) closeRef.current.focus(); }, [open]);

  const tilt = (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
    el.style.setProperty("--rx", `${((e.clientY - r.top) / r.height - 0.5) * -6}deg`);
  };
  const untilt = (e) => { e.currentTarget.style.setProperty("--rx", "0deg"); e.currentTarget.style.setProperty("--ry", "0deg"); };

  return (
    <div className="stage" style={{ "--bg": car.dark, "--accent": car.accent }}>
      <div className="ghost" aria-hidden="true">{car.brand}</div>

      <header className="top">
        <h1>Supercar Garage</h1>
        <p>{active + 1} of {cars.length}. Pick a car, or use the arrow keys.</p>
      </header>

      <main className="garage" role="tablist" aria-label="Cars">
        {cars.map((c, i) => {
          const on = i === active;
          return (
            <section
              key={c.id}
              className={`card${on ? " active" : ""}`}
              style={{ "--c": c.color, "--ca": c.accent }}
              role="tab"
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              aria-label={`${c.brand} ${c.name}`}
              onClick={() => select(i)}
              onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !on) { e.preventDefault(); select(i); } }}
            >
              {/* collapsed strip */}
              <div className="strip" aria-hidden={on}>
                <span className="badge">{c.num}</span>
                <span className="vname">{c.brand} {c.name}</span>
                <img className="mini" src={c.img} alt="" draggable="false" />
              </div>

              {/* expanded content */}
              <div className="detail" aria-hidden={!on}>
                <div className="info">
                  <span className="badge big">{c.num}</span>
                  <p className="brand">{c.brand}</p>
                  <h2>{c.name}</h2>
                  <p className="tagline">{c.tagline}</p>
                </div>

                <div className="carwrap" onMouseMove={tilt} onMouseLeave={untilt}>
                  <img className="car" src={c.img} alt={`${c.brand} ${c.name}, side view`} draggable="false" />
                </div>

                <div className="bottom">
                  <p className="desc">{c.desc}</p>

                  <div className="stats">
                    <div><b>{c.hp.toLocaleString()}</b><span>hp</span></div>
                    <div><b>{c.zero}</b><span>0–100 km/h in s</span></div>
                    <div><b>{c.speed}</b><span>km/h top speed</span></div>
                  </div>
                  <div className="bar" aria-hidden="true">
                    <i style={{ "--w": `${(c.speed / MAX_SPEED) * 100}%` }} />
                  </div>

                  <div className="actions">
                    <button className="btn solid" tabIndex={on ? 0 : -1} onClick={(e) => { e.stopPropagation(); setOpen(true); }}>Learn more</button>
                    <button
                      className={`btn round${playing ? " live" : ""}`}
                      tabIndex={on ? 0 : -1}
                      aria-label={playing ? "Stop engine sound" : "Play engine sound"}
                      onClick={(e) => { e.stopPropagation(); playing ? stop() : play(c.sound); }}
                    >
                      {playing ? Icon.stop : Icon.play}
                    </button>
                    <span className="sndlabel">{playing ? "Revving…" : "Hear the engine"}</span>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </main>

      {open && (
        <div className="modal" onClick={() => setOpen(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={`${car.brand} ${car.name} specifications`} onClick={(e) => e.stopPropagation()} style={{ "--c": car.color, "--ca": car.accent }}>
            <button ref={closeRef} className="x" onClick={() => setOpen(false)} aria-label="Close specifications">{Icon.close}</button>
            <p className="brand">{car.brand}</p>
            <h3>{car.name}</h3>
            <div className="specgrid">
              {car.specs.map(([k, v]) => (
                <div key={k} className="spec"><span>{k}</span><b>{v}</b></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
