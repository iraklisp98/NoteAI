import React from 'react';
import {
  Activity,
  Bot,
  Building2,
  CheckCircle2,
  HeartPulse,
  MonitorSmartphone,
  ShieldAlert,
  Stethoscope
} from 'lucide-react';
import { demoSteps, pitchSlides } from './content/pitchCopy.js';

const icons = [ShieldAlert, Bot, Stethoscope, Activity, CheckCircle2, Building2, HeartPulse, MonitorSmartphone];

export default function PitchApp() {
  return (
    <main className="pitch-shell">
      <section className="hero" aria-labelledby="pitch-title">
        <div className="hero-copy">
          <p className="kicker">CAREFLOW pitch deck</p>
          <h1 id="pitch-title">From pneumonia discharge PDF to recovery workflow</h1>
          <p>
            A hackathon MVP for safer post-discharge coordination, built around a real patient demo
            and an insurance buyer story.
          </p>
        </div>
        <ol className="demo-rail" aria-label="Demo flow">
          {demoSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="slide-strip" aria-label="Pitch slides">
        {pitchSlides.map((slide, index) => {
          const Icon = icons[index];
          return (
            <article className="slide" key={slide.title}>
              <div className="slide-marker" aria-hidden="true">
                <Icon size={24} strokeWidth={2} />
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="slide-body">
                <p className="eyebrow">{slide.eyebrow}</p>
                <h2>{slide.title}</h2>
                <p className="summary">{slide.summary}</p>
                <ul>
                  {slide.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
