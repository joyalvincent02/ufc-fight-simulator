import { Link } from "react-router-dom";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

export default function ModelPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans px-6 py-12 mx-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">How the Simulation Works</h1>

        <section className="space-y-6">
          <p>
            The MMA Math simulator uses a <strong>biased random walk</strong> model
            to simulate rounds and determine fight outcomes. Each round consists of 10 exchanges,
            with outcomes influenced by real-world stats scraped from UFCStats.com.
          </p>

          <h2 className="text-2xl font-semibold mt-8">1. Exchange Probabilities</h2>
          <p>
            Each exchange can result in:
          </p>
          <ul className="list-disc ml-6">
            <li>Fighter A wins</li>
            <li>Fighter B wins</li>
            <li>Neutral exchange</li>
          </ul>

          <p>This ensures the probabilities sum to 1:</p>
          <BlockMath math="P_A + P_B + P_{\text{neutral}} = 1" />

          <p>
            A fixed <InlineMath math="P_{\text{neutral}} = 0.4" /> is assumed to reflect fight randomness. 
            The remaining 60% is distributed between the fighters based on their effectiveness:
          </p>

          <BlockMath math="P_A = 0.6 \cdot \frac{E_A}{E_A + E_B}, \quad P_B = 0.6 \cdot \frac{E_B}{E_A + E_B}" />

          <h2 className="text-2xl font-semibold mt-8">2. Striking Effectiveness</h2>
          <p>
            Calculated using significant strikes landed per minute, accuracy, and opponent's defense:
          </p>
          <BlockMath math="S = \text{SLpM} \cdot \text{Str Acc} \cdot (1 + \text{Opp SD})" />

          <h2 className="text-2xl font-semibold mt-8">3. Grappling Effectiveness</h2>
          <p>
            Takedown and submission metrics are combined:
          </p>
          <BlockMath math="T = \text{TD Avg} \cdot \text{TD Acc} \cdot (1 + \text{Opp TDD})" />
          <BlockMath math="G = 0.3 \cdot T + 0.2 \cdot \text{Sub Avg}" />

          <h2 className="text-2xl font-semibold mt-8">4. Total Effectiveness</h2>
          <BlockMath math="E = S + G" />

          <h2 className="text-2xl font-semibold mt-8">5. Round and Fight Scoring</h2>
          <p>
            Each round has 10 exchanges. At the end of a round:
          </p>
          <ul className="list-disc ml-6">
            <li>Round winner: 10 points</li>
            <li>Round loser: 9 points</li>
            <li>Draw: 10–10</li>
          </ul>

          <p>
            After all rounds, the fighter with the higher total score wins.
            If scores are tied, the fight is a draw.
          </p>

          <h2 className="text-2xl font-semibold mt-8">6. Limitations</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>No early stoppages (KOs/submissions are not modeled)</li>
            <li>Each round is independent (no momentum/fatigue considered)</li>
            <li>Neutral exchange rate is fixed at 40%</li>
            <li>Judging criteria like damage or aggression are not modeled</li>
          </ul>
          <br></br>  
          <p className="text-center mt-10">
            <Link
              to="/simulate"
              className="text-red-400 font-medium hover:underline"
            >
              Try it yourself →
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
