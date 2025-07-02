import { Link } from "react-router-dom";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

export default function ModelPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans relative overflow-hidden px-4 sm:px-6 py-16">
      {/* Background glow accents */}
      <div className="absolute -top-20 -left-32 w-[500px] h-[500px] bg-red-700 opacity-20 rounded-full blur-[160px] z-0" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[300px] h-[300px] bg-red-500 opacity-10 rounded-full blur-[100px] z-0" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold text-center mb-10 tracking-tight">
          How the Simulation Works
        </h1>

        <section className="bg-white/5 border border-white/10 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow space-y-6 leading-relaxed text-gray-100 text-base">
          <p>
            The <strong className="text-white">MMA Math simulator</strong> uses a <span className="text-red-400 font-medium">biased random walk</span> model to simulate rounds and determine fight outcomes.
            Each round consists of 10 exchanges, influenced by real-world stats scraped from UFCStats.com.
          </p>

          <h2 className="text-2xl font-bold mt-8 text-red-400">1. Exchange Probabilities</h2>
          <p>Each exchange can result in:</p>
          <ul className="list-disc ml-6">
            <li>Fighter A wins</li>
            <li>Fighter B wins</li>
            <li>Neutral exchange</li>
          </ul>

          <p className="mt-2">These must add to 1:</p>
          <BlockMath math="P_A + P_B + P_{\text{neutral}} = 1" />

          <p>
            We assume a fixed <InlineMath math="P_{\text{neutral}} = 0.4" /> to account for randomness.
            The remaining 60% is split based on fighter effectiveness:
          </p>
          <BlockMath math="P_A = 0.6 \cdot \frac{E_A}{E_A + E_B}, \quad P_B = 0.6 \cdot \frac{E_B}{E_A + E_B}" />

          <h2 className="text-2xl font-bold mt-8 text-red-400">2. Striking Effectiveness</h2>
          <p>Based on significant strikes, accuracy, and opponent defense:</p>
          <BlockMath math="S = \text{SLpM} \cdot \text{Str Acc} \cdot (1 + \text{Opp SD})" />

          <h2 className="text-2xl font-bold mt-8 text-red-400">3. Grappling Effectiveness</h2>
          <p>Grappling considers takedowns and submissions:</p>
          <BlockMath math="T = \text{TD Avg} \cdot \text{TD Acc} \cdot (1 + \text{Opp TDD})" />
          <BlockMath math="G = 0.3 \cdot T + 0.2 \cdot \text{Sub Avg}" />

          <h2 className="text-2xl font-bold mt-8 text-red-400">4. Total Effectiveness</h2>
          <BlockMath math="E = S + G" />

          <h2 className="text-2xl font-bold mt-8 text-red-400">5. Round and Fight Scoring</h2>
          <p>Each round consists of 10 exchanges. Scoring logic:</p>
          <ul className="list-disc ml-6">
            <li>Round winner: 10 points</li>
            <li>Round loser: 9 points</li>
            <li>Draw: 10–10</li>
          </ul>
          <p className="mt-2">
            The fighter with the most points after 5 rounds wins. Tied score means a draw.
          </p>

          <h2 className="text-2xl font-bold mt-8 text-red-400">6. Limitations</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>No early stoppages (KOs/submissions not modeled)</li>
            <li>No momentum or fatigue between rounds</li>
            <li>Neutral exchange rate is always 40%</li>
            <li>Judging criteria like damage or aggression not considered</li>
          </ul>
          <br />
          <div className="text-center mt-10">
            <Link
              to="/simulate"
              className="text-red-400 hover:underline font-medium text-base"
            >
              Try it yourself →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
